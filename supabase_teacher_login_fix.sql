-- ─── 1. Redefine handle_roster_profile_link trigger function ───────────
-- Redefine to copy the profiles row from old to new BEFORE deleting it.
CREATE OR REPLACE FUNCTION public.handle_roster_profile_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_id uuid;
  v_new_id uuid;
  v_total integer := 0;
  v_rows integer;
BEGIN
  v_old_id := OLD.profile_id;
  v_new_id := NEW.profile_id;

  -- Guard: Only proceed if profile_id has transitioned from a placeholder/different ID
  IF v_old_id IS NULL OR v_new_id IS NULL OR v_old_id = v_new_id THEN
    RETURN NEW;
  END IF;

  RAISE NOTICE '[handle_roster_profile_link] Migrating % → % for %', v_old_id, v_new_id, NEW.email;

  -- ── Ensure the new profile row exists (creating it from the old profile if it doesn't exist) ──
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_new_id) THEN
    INSERT INTO public.profiles (
      id, role, full_name, avatar_url, phone, stream, 
      onboarding_complete, board_id, class_id, stream_id, created_at
    )
    SELECT 
      v_new_id, role, full_name, avatar_url, phone, stream, 
      (role != 'student'), board_id, class_id, stream_id, created_at
    FROM public.profiles WHERE id = v_old_id;
  ELSE
    -- If it already exists, ensure onboarding_complete is true for non-student roles
    UPDATE public.profiles
    SET onboarding_complete = (role != 'student')
    WHERE id = v_new_id;
  END IF;

  -- ── Migrate every known FK column referencing profiles(id) ──

  -- enrollments.student_id
  UPDATE public.enrollments SET student_id = v_new_id WHERE student_id = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_total := v_total + v_rows;

  -- attendance.student_id
  UPDATE public.attendance SET student_id = v_new_id WHERE student_id = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_total := v_total + v_rows;

  -- study_sessions.student_id
  UPDATE public.study_sessions SET student_id = v_new_id WHERE student_id = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_total := v_total + v_rows;

  -- notes.uploaded_by
  UPDATE public.notes SET uploaded_by = v_new_id WHERE uploaded_by = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_total := v_total + v_rows;

  -- fee_statuses.student_id (UNIQUE constraint — remove conflict first)
  IF EXISTS (SELECT 1 FROM public.fee_statuses WHERE student_id = v_old_id) THEN
    DELETE FROM public.fee_statuses WHERE student_id = v_new_id;
    UPDATE public.fee_statuses SET student_id = v_new_id WHERE student_id = v_old_id;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    v_total := v_total + v_rows;
  END IF;

  -- fee_audit_trail.student_id
  UPDATE public.fee_audit_trail SET student_id = v_new_id WHERE student_id = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_total := v_total + v_rows;

  -- fee_audit_trail.changed_by
  UPDATE public.fee_audit_trail SET changed_by = v_new_id WHERE changed_by = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_total := v_total + v_rows;

  -- announcements.created_by
  UPDATE public.announcements SET created_by = v_new_id WHERE created_by = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_total := v_total + v_rows;

  -- notifications.recipient_id
  UPDATE public.notifications SET recipient_id = v_new_id WHERE recipient_id = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_total := v_total + v_rows;

  -- teachers.id (PK — re-key by INSERT new + DELETE old)
  IF EXISTS (SELECT 1 FROM public.teachers WHERE id = v_old_id) THEN
    INSERT INTO public.teachers (id, full_name, email, is_active, joining_date, avatar_url, created_at)
    SELECT v_new_id, full_name, email, is_active, joining_date, avatar_url, created_at
    FROM public.teachers WHERE id = v_old_id
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      is_active = EXCLUDED.is_active;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    v_total := v_total + v_rows;
  END IF;

  -- class_offerings.teacher_id
  UPDATE public.class_offerings SET teacher_id = v_new_id WHERE teacher_id = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_total := v_total + v_rows;

  -- Now safe to delete old teacher row since class_offerings no longer references it
  IF EXISTS (SELECT 1 FROM public.teachers WHERE id = v_old_id) THEN
    DELETE FROM public.teachers WHERE id = v_old_id;
  END IF;

  -- Delete the orphaned old placeholder profile
  DELETE FROM public.profiles WHERE id = v_old_id;

  RAISE NOTICE '[handle_roster_profile_link] ✅ Migrated % FK rows, deleted orphan %', v_total, v_old_id;

  RETURN NEW;
END;
$$;


-- ─── 2. Create the claim_my_roster_profile SECURITY DEFINER function ───────────
CREATE OR REPLACE FUNCTION public.claim_my_roster_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid uuid;
  v_email text;
  v_roster_row public.roster%ROWTYPE;
  v_profile_row public.profiles%ROWTYPE;
BEGIN
  -- 1. Verify caller is authenticated
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Look up roster row where email matches auth.jwt() ->> 'email'
  v_email := LOWER(auth.jwt()->>'email');
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'No email found in JWT claims';
  END IF;

  SELECT * INTO v_roster_row
  FROM public.roster
  WHERE email = v_email
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Email % is not listed on the institutional roster', v_email;
  END IF;

  -- 3. Confirm profile_id is not already equal to auth.uid()
  IF v_roster_row.profile_id = v_uid THEN
    SELECT * INTO v_profile_row FROM public.profiles WHERE id = v_uid;
    RETURN v_profile_row;
  END IF;

  -- 4. Update roster.profile_id to auth.uid().
  -- This fires BEFORE UPDATE trigger, which:
  --   a) creates/inserts the new profile for v_uid (auth.uid()) copying the old profile
  --   b) updates all FK references from v_old_id to v_uid
  --   c) deletes the old placeholder profile
  UPDATE public.roster
  SET profile_id = v_uid
  WHERE id = v_roster_row.id;

  -- 5. Retrieve and return the resulting profile row
  SELECT * INTO v_profile_row FROM public.profiles WHERE id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to retrieve promoted profile for UID %', v_uid;
  END IF;

  RETURN v_profile_row;
END;
$$;

-- ─── 3. Restrict EXECUTE to authenticated users only ───────────
REVOKE EXECUTE ON FUNCTION public.claim_my_roster_profile() FROM public;
GRANT EXECUTE ON FUNCTION public.claim_my_roster_profile() TO authenticated;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
