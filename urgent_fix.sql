BEGIN;

DO $$
DECLARE
  v_rows int;
  
  -- Teacher 1
  t1_old uuid := '2df8dce0-fb88-4343-9be1-669f55789a32';
  t1_new uuid := 'fab93f7f-8499-4f97-921b-b7a8b21a644d';
  t1_roster uuid := '2ff8c077-8694-4219-bd29-d78ea6091eab';

  -- Teacher 2
  t2_old uuid := '50df639d-4c5f-4639-b9f6-74152dcf7b68';
  t2_new uuid := '9df8c0c8-8b3a-4c24-8816-6827a1ea404b';
  t2_roster uuid := 'a9a212f8-f513-437f-8481-cc5dc290b62c';
BEGIN
  RAISE NOTICE '--- REPAIRING TEACHER 1 ---';
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = t1_new) THEN
    INSERT INTO public.profiles (id, role, full_name, phone, stream, avatar_url, created_at, onboarding_complete)
    SELECT t1_new, role, full_name, phone, stream, avatar_url, created_at, onboarding_complete
    FROM public.profiles WHERE id = t1_old;
  END IF;

  UPDATE public.enrollments SET student_id = t1_new WHERE student_id = t1_old;
  UPDATE public.attendance SET student_id = t1_new WHERE student_id = t1_old;
  UPDATE public.study_sessions SET student_id = t1_new WHERE student_id = t1_old;
  UPDATE public.notes SET uploaded_by = t1_new WHERE uploaded_by = t1_old;
  IF EXISTS (SELECT 1 FROM public.fee_statuses WHERE student_id = t1_old) THEN
    DELETE FROM public.fee_statuses WHERE student_id = t1_new;
    UPDATE public.fee_statuses SET student_id = t1_new WHERE student_id = t1_old;
  END IF;
  UPDATE public.fee_audit_trail SET student_id = t1_new WHERE student_id = t1_old;
  UPDATE public.fee_audit_trail SET changed_by = t1_new WHERE changed_by = t1_old;
  UPDATE public.announcements SET created_by = t1_new WHERE created_by = t1_old;
  UPDATE public.notifications SET recipient_id = t1_new WHERE recipient_id = t1_old;

  IF EXISTS (SELECT 1 FROM public.teachers WHERE id = t1_old) THEN
    INSERT INTO public.teachers (id, full_name, email, is_active, joining_date, avatar_url, phone, created_at)
    SELECT t1_new, full_name, email, is_active, joining_date, avatar_url, phone, created_at
    FROM public.teachers WHERE id = t1_old
    ON CONFLICT (id) DO NOTHING;
  END IF;

  UPDATE public.class_offerings SET teacher_id = t1_new WHERE teacher_id = t1_old;
  
  IF EXISTS (SELECT 1 FROM public.teachers WHERE id = t1_old) THEN
    DELETE FROM public.teachers WHERE id = t1_old;
  END IF;

  UPDATE public.roster SET profile_id = t1_new WHERE id = t1_roster;
  DELETE FROM public.profiles WHERE id = t1_old;
  RAISE NOTICE 'TEACHER 1 REPAIRED';

  RAISE NOTICE '--- REPAIRING TEACHER 2 ---';
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = t2_new) THEN
    INSERT INTO public.profiles (id, role, full_name, phone, stream, avatar_url, created_at, onboarding_complete)
    SELECT t2_new, role, full_name, phone, stream, avatar_url, created_at, onboarding_complete
    FROM public.profiles WHERE id = t2_old;
  END IF;

  UPDATE public.enrollments SET student_id = t2_new WHERE student_id = t2_old;
  UPDATE public.attendance SET student_id = t2_new WHERE student_id = t2_old;
  UPDATE public.study_sessions SET student_id = t2_new WHERE student_id = t2_old;
  UPDATE public.notes SET uploaded_by = t2_new WHERE uploaded_by = t2_old;
  IF EXISTS (SELECT 1 FROM public.fee_statuses WHERE student_id = t2_old) THEN
    DELETE FROM public.fee_statuses WHERE student_id = t2_new;
    UPDATE public.fee_statuses SET student_id = t2_new WHERE student_id = t2_old;
  END IF;
  UPDATE public.fee_audit_trail SET student_id = t2_new WHERE student_id = t2_old;
  UPDATE public.fee_audit_trail SET changed_by = t2_new WHERE changed_by = t2_old;
  UPDATE public.announcements SET created_by = t2_new WHERE created_by = t2_old;
  UPDATE public.notifications SET recipient_id = t2_new WHERE recipient_id = t2_old;

  IF EXISTS (SELECT 1 FROM public.teachers WHERE id = t2_old) THEN
    INSERT INTO public.teachers (id, full_name, email, is_active, joining_date, avatar_url, phone, created_at)
    SELECT t2_new, full_name, email, is_active, joining_date, avatar_url, phone, created_at
    FROM public.teachers WHERE id = t2_old
    ON CONFLICT (id) DO NOTHING;
  END IF;

  UPDATE public.class_offerings SET teacher_id = t2_new WHERE teacher_id = t2_old;
  
  IF EXISTS (SELECT 1 FROM public.teachers WHERE id = t2_old) THEN
    DELETE FROM public.teachers WHERE id = t2_old;
  END IF;

  UPDATE public.roster SET profile_id = t2_new WHERE id = t2_roster;
  DELETE FROM public.profiles WHERE id = t2_old;
  RAISE NOTICE 'TEACHER 2 REPAIRED';
END $$;


CREATE OR REPLACE FUNCTION public.handle_roster_profile_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_id uuid;
  v_new_id uuid;
  v_rows   int;
  v_total  int := 0;
BEGIN
  -- Only act when profile_id actually changes from one non-null value to another
  v_old_id := OLD.profile_id;
  v_new_id := NEW.profile_id;

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
  -- 🔥 FIX: Move before class_offerings UPDATE to prevent FK violation 🔥
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

  -- 🔥 FIX: Now safe to delete old teacher row since class_offerings no longer references it 🔥
  IF EXISTS (SELECT 1 FROM public.teachers WHERE id = v_old_id) THEN
    DELETE FROM public.teachers WHERE id = v_old_id;
  END IF;

  -- ── Delete the orphaned old placeholder profile ──
  DELETE FROM public.profiles WHERE id = v_old_id;

  RAISE NOTICE '[handle_roster_profile_link] ✅ Migrated % FK rows, deleted orphan %', v_total, v_old_id;

  RETURN NEW;
END;
$$;

COMMIT;
