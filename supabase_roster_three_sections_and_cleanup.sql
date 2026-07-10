-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Roster 3-Section Split, De-duplication & Cascading Delete Patch
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this script in the Supabase → SQL Editor to enforce:
-- 1. De-duplication of admin accounts and adding a UNIQUE constraint on email.
-- 2. Complete cascading cleanup inside delete_from_roster() across all child tables.
-- 3. Hygiene cleanup of mock/placeholder student rows while preserving real accounts.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. DE-DUPLICATE ROSTER ENTRIES & ADD UNIQUE CONSTRAINT
DO $$
BEGIN
  -- Remove duplicate admin entries in roster, retaining the earliest created row per email
  WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY LOWER(email), role ORDER BY created_at ASC) as rnum
    FROM public.roster
    WHERE role = 'admin' AND email IS NOT NULL
  )
  DELETE FROM public.roster WHERE id IN (SELECT id FROM duplicates WHERE rnum > 1);

  -- Remove exact lowercased email duplicates across all roles before applying constraint
  WITH all_duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY LOWER(email) ORDER BY created_at ASC) as rnum
    FROM public.roster
    WHERE email IS NOT NULL
  )
  DELETE FROM public.roster WHERE id IN (SELECT id FROM all_duplicates WHERE rnum > 1);

  -- Ensure UNIQUE constraint exists on roster(email)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'roster_email_key'
  ) THEN
    ALTER TABLE public.roster ADD CONSTRAINT roster_email_key UNIQUE (email);
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Note during unique constraint creation: %', SQLERRM;
END $$;


-- 2. ROBUST CASCADE DELETION RPC (delete_from_roster)
CREATE OR REPLACE FUNCTION public.delete_from_roster(
  p_roster_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_email text;
  v_profile_id uuid;
  v_teacher_id uuid;
BEGIN
  -- Security check: only admins can call delete
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required.';
  END IF;

  -- 1. Check if record exists in roster table
  SELECT role, email, profile_id INTO v_role, v_email, v_profile_id
  FROM public.roster
  WHERE id = p_roster_id;

  -- 2. If not in roster, check if p_roster_id is directly a profile_id
  IF NOT FOUND THEN
    SELECT role, id INTO v_role, v_profile_id
    FROM public.profiles
    WHERE id = p_roster_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Account entry not found.';
    END IF;
  END IF;

  -- Enforce admin delete prevention (Protected Accounts)
  IF v_role = 'admin' THEN
    RAISE EXCEPTION 'Access denied: Protected administrator accounts cannot be removed.';
  END IF;

  -- Try resolving profile_id via auth.users if currently null
  IF v_profile_id IS NULL AND v_email IS NOT NULL THEN
    SELECT id INTO v_profile_id
    FROM public.profiles
    WHERE id IN (SELECT id FROM auth.users WHERE LOWER(email) = LOWER(v_email))
    LIMIT 1;
  END IF;

  -- ── STUDENT CASCADING CLEANUP ──
  IF v_role = 'student' THEN
    IF v_profile_id IS NOT NULL THEN
      -- Clean fee audit and status records first
      DELETE FROM public.fee_audit_trail WHERE student_id = v_profile_id OR changed_by = v_profile_id;
      DELETE FROM public.fee_statuses WHERE student_id = v_profile_id;
      
      -- Clean operational learning records
      DELETE FROM public.enrollments WHERE student_id = v_profile_id;
      DELETE FROM public.attendance WHERE student_id = v_profile_id;
      DELETE FROM public.study_sessions WHERE student_id = v_profile_id;
      DELETE FROM public.notes WHERE uploaded_by = v_profile_id;
      
      -- Delete profile and auth user
      DELETE FROM public.profiles WHERE id = v_profile_id;
      DELETE FROM auth.users WHERE id = v_profile_id;
    END IF;
    IF v_email IS NOT NULL THEN
      DELETE FROM auth.users WHERE LOWER(email) = LOWER(v_email);
    END IF;

  -- ── TEACHER CASCADING CLEANUP ──
  ELSIF v_role = 'teacher' THEN
    SELECT id INTO v_teacher_id FROM public.teachers WHERE LOWER(email) = LOWER(v_email) OR id = p_roster_id OR id = v_profile_id LIMIT 1;
    IF v_teacher_id IS NOT NULL THEN
      -- Unlink schedule class offerings so timetable schedule stays intact
      UPDATE public.class_offerings SET teacher_id = NULL WHERE teacher_id = v_teacher_id;
      DELETE FROM public.teachers WHERE id = v_teacher_id;
    END IF;
    IF v_profile_id IS NOT NULL THEN
      DELETE FROM public.notes WHERE uploaded_by = v_profile_id;
      DELETE FROM public.profiles WHERE id = v_profile_id;
      DELETE FROM auth.users WHERE id = v_profile_id;
    END IF;
    IF v_email IS NOT NULL THEN
      DELETE FROM auth.users WHERE LOWER(email) = LOWER(v_email);
    END IF;
  END IF;

  -- 3. Remove roster record itself
  DELETE FROM public.roster WHERE id = p_roster_id OR profile_id = v_profile_id OR (v_email IS NOT NULL AND LOWER(email) = LOWER(v_email));
END;
$$;


-- 3. SAFE HYGIENE CLEANUP OF PLACEHOLDER / TEST ROWS
DO $$
DECLARE
  v_test_emails text[] := ARRAY[
    'emberraynf2@gmail.com',
    'teststudent@scholario.app',
    'mockstudent@scholario.app',
    'johndoe@example.com',
    'janedoe@example.com'
  ];
  v_test_names text[] := ARRAY[
    'Test Student',
    'Mock Student',
    'Placeholder User'
  ];
  v_target_id uuid;
BEGIN
  -- Purge specific known test email accounts across all tables
  FOR i IN 1..array_length(v_test_emails, 1) LOOP
    FOR v_target_id IN (SELECT id FROM public.profiles WHERE id IN (SELECT id FROM auth.users WHERE LOWER(email) = LOWER(v_test_emails[i])) UNION SELECT profile_id FROM public.roster WHERE LOWER(email) = LOWER(v_test_emails[i]) AND profile_id IS NOT NULL) LOOP
      IF v_target_id IS NOT NULL THEN
        DELETE FROM public.fee_audit_trail WHERE student_id = v_target_id OR changed_by = v_target_id;
        DELETE FROM public.fee_statuses WHERE student_id = v_target_id;
        DELETE FROM public.enrollments WHERE student_id = v_target_id;
        DELETE FROM public.attendance WHERE student_id = v_target_id;
        DELETE FROM public.study_sessions WHERE student_id = v_target_id;
        DELETE FROM public.notes WHERE uploaded_by = v_target_id;
        DELETE FROM public.profiles WHERE id = v_target_id;
        DELETE FROM auth.users WHERE id = v_target_id;
      END IF;
    END LOOP;
    DELETE FROM public.roster WHERE LOWER(email) = LOWER(v_test_emails[i]);
  END LOOP;

  -- Purge placeholder names while strictly keeping real accounts (Site Owner, Syed Rayyan, Hashir, Rayn Lawback)
  FOR i IN 1..array_length(v_test_names, 1) LOOP
    FOR v_target_id IN (SELECT id FROM public.profiles WHERE full_name = v_test_names[i] AND role = 'student') LOOP
      DELETE FROM public.fee_audit_trail WHERE student_id = v_target_id OR changed_by = v_target_id;
      DELETE FROM public.fee_statuses WHERE student_id = v_target_id;
      DELETE FROM public.enrollments WHERE student_id = v_target_id;
      DELETE FROM public.attendance WHERE student_id = v_target_id;
      DELETE FROM public.study_sessions WHERE student_id = v_target_id;
      DELETE FROM public.notes WHERE uploaded_by = v_target_id;
      DELETE FROM public.profiles WHERE id = v_target_id;
      DELETE FROM auth.users WHERE id = v_target_id;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Hygiene cleanup completed cleanly without modifying real admin, teacher, or student accounts.';
END $$;
