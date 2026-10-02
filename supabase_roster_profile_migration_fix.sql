-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Roster Profile Migration Fix
-- ═══════════════════════════════════════════════════════════════════════════
-- Fixes the profile-linking bug where pre-provisioned placeholder profiles
-- aren't properly migrated when a real Google sign-in replaces them.
--
-- Run in: Supabase → SQL Editor (safe to re-run)
-- ═══════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 0: ENUMERATE EVERY FOREIGN KEY REFERENCING profiles(id)
-- ─────────────────────────────────────────────────────────────────────────
-- This diagnostic block queries pg_constraint to find ALL tables/columns
-- with a FK pointing to profiles(id). Run this FIRST and inspect the output
-- in the "Messages" tab of the SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  r RECORD;
  fk_count int := 0;
BEGIN
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 0: ALL FOREIGN KEYS REFERENCING profiles(id)';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';

  FOR r IN
    SELECT
      tc.table_schema,
      tc.table_name,
      kcu.column_name,
      tc.constraint_name
    FROM
      information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'profiles'
      AND ccu.column_name = 'id'
    ORDER BY tc.table_schema, tc.table_name, kcu.column_name
  LOOP
    fk_count := fk_count + 1;
    RAISE NOTICE '  [%] %.%.% (constraint: %)',
      fk_count, r.table_schema, r.table_name, r.column_name, r.constraint_name;
  END LOOP;

  RAISE NOTICE '──────────────────────────────────────────────────────────────';
  RAISE NOTICE 'Total FK columns found: %', fk_count;
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
END $$;


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 1: MANUAL REPAIR FOR MUHAMMAD HASHIR (or any pre-provisioned orphan)
-- ─────────────────────────────────────────────────────────────────────────
-- His orphaned placeholder profile_id is:
--   1a886d0b-0570-4f6c-b5ec-595d59456149
-- His real profile was created by Google OAuth sign-in. We look it up
-- by matching the roster email → auth.users.email → profiles.id.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_old_id uuid := '1a886d0b-0570-4f6c-b5ec-595d59456149';
  v_new_id uuid;
  v_email  text;
  v_rows   int;
  v_total  int := 0;
BEGIN
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 1: MANUAL REPAIR FOR HASHIR';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';

  -- 1a. Find Hashir's email from the roster entry that references the old placeholder
  SELECT r.email INTO v_email
  FROM public.roster r
  WHERE r.profile_id = v_old_id
  LIMIT 1;

  IF v_email IS NULL THEN
    RAISE NOTICE '⚠️  No roster entry found pointing to old placeholder %. Trying profiles...', v_old_id;
    -- Fallback: look for his name in profiles
    SELECT u.email INTO v_email
    FROM auth.users u
    JOIN public.profiles p ON p.id = u.id
    WHERE p.full_name ILIKE '%hashir%'
    LIMIT 1;
  END IF;

  IF v_email IS NULL THEN
    RAISE NOTICE '⚠️  Could not find Hashir''s email. Skipping manual repair.';
    RAISE NOTICE '    Run this query to find him: SELECT * FROM public.roster WHERE profile_id = ''%''', v_old_id;
    RETURN;
  END IF;

  RAISE NOTICE '  Found email: %', v_email;

  -- 1b. Find his real profile ID (created by actual Google sign-in = matches auth.users)
  SELECT u.id INTO v_new_id
  FROM auth.users u
  WHERE LOWER(u.email) = LOWER(v_email)
  LIMIT 1;

  IF v_new_id IS NULL THEN
    RAISE NOTICE '⚠️  No auth.users entry found for %. Has he signed in yet?', v_email;
    RETURN;
  END IF;

  IF v_new_id = v_old_id THEN
    RAISE NOTICE '✅ Old and new IDs are the same (%). No migration needed.', v_old_id;
    RETURN;
  END IF;

  RAISE NOTICE '  Old placeholder ID: %', v_old_id;
  RAISE NOTICE '  New real ID:        %', v_new_id;
  RAISE NOTICE '──────────────────────────────────────────────────────────────';

  -- Ensure the new profile row exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_new_id) THEN
    RAISE NOTICE '⚠️  No profiles row for new ID %. Creating one from old profile...', v_new_id;
    INSERT INTO public.profiles (id, role, full_name, phone, stream, avatar_url, created_at, onboarding_complete)
    SELECT v_new_id, role, full_name, phone, stream, avatar_url, created_at, onboarding_complete
    FROM public.profiles WHERE id = v_old_id;
  END IF;

  -- 1c. Migrate every FK table: old → new

  -- enrollments.student_id
  UPDATE public.enrollments SET student_id = v_new_id WHERE student_id = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_total := v_total + v_rows;
  RAISE NOTICE '  enrollments.student_id:       % rows migrated', v_rows;

  -- attendance.student_id
  UPDATE public.attendance SET student_id = v_new_id WHERE student_id = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_total := v_total + v_rows;
  RAISE NOTICE '  attendance.student_id:         % rows migrated', v_rows;

  -- study_sessions.student_id
  UPDATE public.study_sessions SET student_id = v_new_id WHERE student_id = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_total := v_total + v_rows;
  RAISE NOTICE '  study_sessions.student_id:     % rows migrated', v_rows;

  -- notes.uploaded_by
  UPDATE public.notes SET uploaded_by = v_new_id WHERE uploaded_by = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_total := v_total + v_rows;
  RAISE NOTICE '  notes.uploaded_by:             % rows migrated', v_rows;

  -- fee_statuses.student_id (has UNIQUE constraint — handle conflict)
  IF EXISTS (SELECT 1 FROM public.fee_statuses WHERE student_id = v_old_id) THEN
    DELETE FROM public.fee_statuses WHERE student_id = v_new_id;
    UPDATE public.fee_statuses SET student_id = v_new_id WHERE student_id = v_old_id;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    v_total := v_total + v_rows;
    RAISE NOTICE '  fee_statuses.student_id:       % rows migrated', v_rows;
  ELSE
    RAISE NOTICE '  fee_statuses.student_id:       0 rows (none found)';
  END IF;

  -- fee_audit_trail.student_id
  UPDATE public.fee_audit_trail SET student_id = v_new_id WHERE student_id = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_total := v_total + v_rows;
  RAISE NOTICE '  fee_audit_trail.student_id:    % rows migrated', v_rows;

  -- fee_audit_trail.changed_by
  UPDATE public.fee_audit_trail SET changed_by = v_new_id WHERE changed_by = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_total := v_total + v_rows;
  RAISE NOTICE '  fee_audit_trail.changed_by:    % rows migrated', v_rows;

  -- announcements.created_by
  UPDATE public.announcements SET created_by = v_new_id WHERE created_by = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_total := v_total + v_rows;
  RAISE NOTICE '  announcements.created_by:      % rows migrated', v_rows;

  -- notifications.recipient_id
  UPDATE public.notifications SET recipient_id = v_new_id WHERE recipient_id = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_total := v_total + v_rows;
  RAISE NOTICE '  notifications.recipient_id:    % rows migrated', v_rows;

  -- teachers.id and class_offerings.teacher_id
  -- MUST insert into teachers FIRST before updating class_offerings to prevent FK violation
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
    RAISE NOTICE '  teachers.id (re-keyed):        % rows migrated', v_rows;
  END IF;

  -- class_offerings.teacher_id
  UPDATE public.class_offerings SET teacher_id = v_new_id WHERE teacher_id = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_total := v_total + v_rows;
  RAISE NOTICE '  class_offerings.teacher_id:    % rows migrated', v_rows;

  -- Delete old teacher row after class_offerings has been updated
  IF EXISTS (SELECT 1 FROM public.teachers WHERE id = v_old_id) THEN
    DELETE FROM public.teachers WHERE id = v_old_id;
  END IF;

  -- Additional optional tables (safe check)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'announcement_dismissals') THEN
    EXECUTE 'UPDATE public.announcement_dismissals SET user_id = $1 WHERE user_id = $2' USING v_new_id, v_old_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'push_subscriptions') THEN
    EXECUTE 'UPDATE public.push_subscriptions SET user_id = $1 WHERE user_id = $2' USING v_new_id, v_old_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teacher_attendance_ratings') THEN
    EXECUTE 'UPDATE public.teacher_attendance_ratings SET student_id = $1 WHERE student_id = $2' USING v_new_id, v_old_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_mcq_attempts') THEN
    EXECUTE 'UPDATE public.student_mcq_attempts SET student_id = $1 WHERE student_id = $2' USING v_new_id, v_old_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scholarship_applications') THEN
    EXECUTE 'UPDATE public.scholarship_applications SET student_id = $1 WHERE student_id = $2' USING v_new_id, v_old_id;
    EXECUTE 'UPDATE public.scholarship_applications SET reviewed_by = $1 WHERE reviewed_by = $2' USING v_new_id, v_old_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_shifts') THEN
    EXECUTE 'UPDATE public.staff_shifts SET staff_id = $1 WHERE staff_id = $2' USING v_new_id, v_old_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_attendance_logs') THEN
    EXECUTE 'UPDATE public.staff_attendance_logs SET staff_id = $1 WHERE staff_id = $2' USING v_new_id, v_old_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_threads') THEN
    EXECUTE 'UPDATE public.chat_threads SET student_id = $1 WHERE student_id = $2' USING v_new_id, v_old_id;
    EXECUTE 'UPDATE public.chat_threads SET staff_id = $1 WHERE staff_id = $2' USING v_new_id, v_old_id;
    EXECUTE 'UPDATE public.chat_threads SET participant_one_id = $1 WHERE participant_one_id = $2' USING v_new_id, v_old_id;
    EXECUTE 'UPDATE public.chat_threads SET participant_two_id = $1 WHERE participant_two_id = $2' USING v_new_id, v_old_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    EXECUTE 'UPDATE public.chat_messages SET sender_id = $1 WHERE sender_id = $2' USING v_new_id, v_old_id;
  END IF;

  -- roster.profile_id (update to new)
  UPDATE public.roster SET profile_id = v_new_id WHERE profile_id = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RAISE NOTICE '  roster.profile_id:             % rows updated', v_rows;

  -- 1d. Delete the orphaned old placeholder profile
  DELETE FROM public.profiles WHERE id = v_old_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RAISE NOTICE '  profiles (orphan deleted):     % rows', v_rows;

  RAISE NOTICE '──────────────────────────────────────────────────────────────';
  RAISE NOTICE '✅ HASHIR REPAIR COMPLETE — % total FK rows migrated', v_total;
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
END $$;


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 2: GENERALIZED handle_roster_profile_link() TRIGGER
-- ─────────────────────────────────────────────────────────────────────────
-- Fires BEFORE UPDATE on roster. When profile_id changes (old → new),
-- migrates ALL FK references across every table, then deletes the
-- orphaned old placeholder profile. Role-agnostic — works for student,
-- teacher, admin, or any future role.
-- ─────────────────────────────────────────────────────────────────────────

-- Drop old triggers + function if they exist
DROP TRIGGER IF EXISTS trg_roster_profile_link ON public.roster;
DROP TRIGGER IF EXISTS on_roster_profile_linked ON public.roster;
DROP FUNCTION IF EXISTS public.handle_roster_profile_link() CASCADE;

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

  -- ── Step 2a: Ensure the new profile row exists in public.profiles ──
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
    UPDATE public.profiles
    SET onboarding_complete = (role != 'student')
    WHERE id = v_new_id;
  END IF;

  -- ── Step 2b: Migrate every known FK column referencing profiles(id) ──

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

  -- teachers.id and class_offerings.teacher_id
  -- MUST insert into teachers BEFORE updating class_offerings to satisfy class_offerings_teacher_id_fkey
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

  -- Safe to delete old teacher row now
  IF EXISTS (SELECT 1 FROM public.teachers WHERE id = v_old_id) THEN
    DELETE FROM public.teachers WHERE id = v_old_id;
  END IF;

  -- Additional optional tables (dynamic checks)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'announcement_dismissals') THEN
    EXECUTE 'UPDATE public.announcement_dismissals SET user_id = $1 WHERE user_id = $2' USING v_new_id, v_old_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'push_subscriptions') THEN
    EXECUTE 'UPDATE public.push_subscriptions SET user_id = $1 WHERE user_id = $2' USING v_new_id, v_old_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teacher_attendance_ratings') THEN
    EXECUTE 'UPDATE public.teacher_attendance_ratings SET student_id = $1 WHERE student_id = $2' USING v_new_id, v_old_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_mcq_attempts') THEN
    EXECUTE 'UPDATE public.student_mcq_attempts SET student_id = $1 WHERE student_id = $2' USING v_new_id, v_old_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scholarship_applications') THEN
    EXECUTE 'UPDATE public.scholarship_applications SET student_id = $1 WHERE student_id = $2' USING v_new_id, v_old_id;
    EXECUTE 'UPDATE public.scholarship_applications SET reviewed_by = $1 WHERE reviewed_by = $2' USING v_new_id, v_old_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_shifts') THEN
    EXECUTE 'UPDATE public.staff_shifts SET staff_id = $1 WHERE staff_id = $2' USING v_new_id, v_old_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_attendance_logs') THEN
    EXECUTE 'UPDATE public.staff_attendance_logs SET staff_id = $1 WHERE staff_id = $2' USING v_new_id, v_old_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_threads') THEN
    EXECUTE 'UPDATE public.chat_threads SET student_id = $1 WHERE student_id = $2' USING v_new_id, v_old_id;
    EXECUTE 'UPDATE public.chat_threads SET staff_id = $1 WHERE staff_id = $2' USING v_new_id, v_old_id;
    EXECUTE 'UPDATE public.chat_threads SET participant_one_id = $1 WHERE participant_one_id = $2' USING v_new_id, v_old_id;
    EXECUTE 'UPDATE public.chat_threads SET participant_two_id = $1 WHERE participant_two_id = $2' USING v_new_id, v_old_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    EXECUTE 'UPDATE public.chat_messages SET sender_id = $1 WHERE sender_id = $2' USING v_new_id, v_old_id;
  END IF;

  -- ── Delete the orphaned old placeholder profile ──
  DELETE FROM public.profiles WHERE id = v_old_id;

  RAISE NOTICE '[handle_roster_profile_link] ✅ Migrated % FK rows, deleted orphan %', v_total, v_old_id;

  RETURN NEW;
END;
$$;

-- Create the trigger (BEFORE UPDATE so it runs within the same transaction)
CREATE TRIGGER trg_roster_profile_link
  BEFORE UPDATE ON public.roster
  FOR EACH ROW
  WHEN (OLD.profile_id IS DISTINCT FROM NEW.profile_id)
  EXECUTE FUNCTION public.handle_roster_profile_link();


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 2b: SELF-TEST — Verify the trigger works end-to-end for student and teacher
-- ─────────────────────────────────────────────────────────────────────────
-- Creates temporary test scenarios, fires the trigger, checks results,
-- and cleans up. Reports pass/fail via RAISE NOTICE.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_old_profile_id uuid := gen_random_uuid();
  v_new_profile_id uuid := gen_random_uuid();
  v_teacher_old_id uuid := gen_random_uuid();
  v_teacher_new_id uuid := gen_random_uuid();
  v_roster_id uuid;
  v_teacher_roster_id uuid;
  v_test_email text := '__test_trigger_verification__@test.internal';
  v_test_teacher_email text := '__test_teacher_verification__@test.internal';
  v_test_offering_id uuid;
  v_enrollment_count int;
  v_orphan_count int;
  v_notification_count int;
  v_offering_count int;
  v_teacher_count int;
BEGIN
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'SELF-TEST: Verifying handle_roster_profile_link() trigger';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';

  -- Clean up any previous failed test run
  DELETE FROM public.notifications WHERE recipient_id IN (v_old_profile_id, v_new_profile_id);
  DELETE FROM public.enrollments WHERE student_id IN (v_old_profile_id, v_new_profile_id);
  DELETE FROM public.roster WHERE email IN (v_test_email, v_test_teacher_email);
  DELETE FROM public.teachers WHERE id IN (v_teacher_old_id, v_teacher_new_id);
  DELETE FROM public.profiles WHERE id IN (v_old_profile_id, v_new_profile_id, v_teacher_old_id, v_teacher_new_id);

  -- Pick a real offering_id for the test enrollment / teacher assignment
  SELECT id INTO v_test_offering_id FROM public.class_offerings LIMIT 1;

  -- ── Test 1: Student Roster Link Migration ──
  -- 1. Create old placeholder profile
  INSERT INTO public.profiles (id, role, full_name) VALUES (v_old_profile_id, 'student', 'Test Trigger Student');

  -- 2. Create roster entry pointing to old placeholder
  INSERT INTO public.roster (email, full_name, role, class_ids, profile_id)
  VALUES (v_test_email, 'Test Trigger Student', 'student', '{}'::uuid[], v_old_profile_id)
  RETURNING id INTO v_roster_id;

  -- 3. Create test enrollment under old ID
  IF v_test_offering_id IS NOT NULL THEN
    INSERT INTO public.enrollments (student_id, offering_id, total_classes)
    VALUES (v_old_profile_id, v_test_offering_id, 48);
  END IF;

  -- 4. Create test notification under old ID
  INSERT INTO public.notifications (recipient_id, type, title, message, severity)
  VALUES (v_old_profile_id, 'announcement', 'Test', 'Test notification', 'normal');

  -- 5. Fire the trigger by updating roster.profile_id → new ID (trigger auto-creates profile for v_new_profile_id)
  UPDATE public.roster SET profile_id = v_new_profile_id WHERE id = v_roster_id;

  -- 6. Verify student migration
  SELECT COUNT(*) INTO v_enrollment_count FROM public.enrollments WHERE student_id = v_new_profile_id;
  IF v_test_offering_id IS NOT NULL AND v_enrollment_count > 0 THEN
    RAISE NOTICE '  ✅ Student enrollment migrated to new profile ID (% rows)', v_enrollment_count;
  ELSIF v_test_offering_id IS NOT NULL THEN
    RAISE NOTICE '  ❌ FAIL: Enrollment NOT migrated! Found % rows for new ID', v_enrollment_count;
  END IF;

  SELECT COUNT(*) INTO v_notification_count FROM public.notifications WHERE recipient_id = v_new_profile_id;
  IF v_notification_count > 0 THEN
    RAISE NOTICE '  ✅ Notification migrated to new profile ID (% rows)', v_notification_count;
  ELSE
    RAISE NOTICE '  ❌ FAIL: Notification NOT migrated!';
  END IF;

  SELECT COUNT(*) INTO v_orphan_count FROM public.profiles WHERE id = v_old_profile_id;
  IF v_orphan_count = 0 THEN
    RAISE NOTICE '  ✅ Old placeholder student profile deleted — zero orphans';
  ELSE
    RAISE NOTICE '  ❌ FAIL: Old placeholder student profile still exists! (% rows)', v_orphan_count;
  END IF;

  -- ── Test 2: Teacher Roster Link Migration (verifies teachers FK ordering) ──
  -- 1. Create old placeholder teacher profile & teachers entry
  INSERT INTO public.profiles (id, role, full_name) VALUES (v_teacher_old_id, 'teacher', 'Test Trigger Teacher');
  INSERT INTO public.teachers (id, full_name, email, is_active, joining_date)
  VALUES (v_teacher_old_id, 'Test Trigger Teacher', v_test_teacher_email, TRUE, CURRENT_DATE);

  -- 2. Create roster entry
  INSERT INTO public.roster (email, full_name, role, class_ids, profile_id)
  VALUES (v_test_teacher_email, 'Test Trigger Teacher', 'teacher', '{}'::uuid[], v_teacher_old_id)
  RETURNING id INTO v_teacher_roster_id;

  -- 3. Assign teacher to offering if present
  IF v_test_offering_id IS NOT NULL THEN
    UPDATE public.class_offerings SET teacher_id = v_teacher_old_id WHERE id = v_test_offering_id;
  END IF;

  -- 4. Fire trigger by updating roster.profile_id → v_teacher_new_id
  UPDATE public.roster SET profile_id = v_teacher_new_id WHERE id = v_teacher_roster_id;

  -- 5. Verify teacher migration
  SELECT COUNT(*) INTO v_teacher_count FROM public.teachers WHERE id = v_teacher_new_id;
  IF v_teacher_count > 0 THEN
    RAISE NOTICE '  ✅ Teacher record created for new profile ID';
  ELSE
    RAISE NOTICE '  ❌ FAIL: Teacher record NOT created for new ID';
  END IF;

  IF v_test_offering_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_offering_count FROM public.class_offerings WHERE id = v_test_offering_id AND teacher_id = v_teacher_new_id;
    IF v_offering_count > 0 THEN
      RAISE NOTICE '  ✅ class_offerings.teacher_id updated to new ID without FK error';
    ELSE
      RAISE NOTICE '  ❌ FAIL: class_offerings NOT updated to new teacher ID!';
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_orphan_count FROM public.teachers WHERE id = v_teacher_old_id;
  IF v_orphan_count = 0 THEN
    RAISE NOTICE '  ✅ Old placeholder teacher record deleted';
  ELSE
    RAISE NOTICE '  ❌ FAIL: Old placeholder teacher record still exists!';
  END IF;

  -- Cleanup test data
  IF v_test_offering_id IS NOT NULL THEN
    UPDATE public.class_offerings SET teacher_id = NULL WHERE id = v_test_offering_id;
  END IF;
  DELETE FROM public.notifications WHERE recipient_id = v_new_profile_id;
  DELETE FROM public.enrollments WHERE student_id = v_new_profile_id;
  DELETE FROM public.roster WHERE id IN (v_roster_id, v_teacher_roster_id);
  DELETE FROM public.teachers WHERE id IN (v_teacher_old_id, v_teacher_new_id);
  DELETE FROM public.profiles WHERE id IN (v_new_profile_id, v_teacher_new_id);

  RAISE NOTICE '  🧹 Test data cleaned up';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ SELF-TEST COMPLETE';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
END $$;


-- ─── Reload PostgREST schema cache ──────────────────────────────────────
NOTIFY pgrst, 'reload schema';
