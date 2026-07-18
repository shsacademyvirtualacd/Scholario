-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Fix Roster Profile Link Mismatch (Missing teachers.phone Column)
-- Run in: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Step 1: Redefine handle_roster_profile_link trigger function ───────────
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
  -- Crucially, we OMIT the phone column since public.teachers has no phone column
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


-- ─── Step 2: Redefine sync_teacher_profile trigger function ───────────────
CREATE OR REPLACE FUNCTION public.sync_teacher_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role = 'teacher' THEN
    UPDATE public.teachers
    SET full_name = NEW.full_name
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
