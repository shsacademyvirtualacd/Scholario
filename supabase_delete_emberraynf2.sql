-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Completely Remove Student "emberraynf2@gmail.com"
-- Run this script in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_target_email text := 'emberraynf2@gmail.com';
  v_profile_id uuid;
BEGIN
  -- 1. Look up user ID from auth.users
  SELECT id INTO v_profile_id 
  FROM auth.users 
  WHERE email = v_target_email;

  -- 2. Look up profile ID from profiles or roster if not found in auth.users
  IF v_profile_id IS NULL THEN
    SELECT profile_id INTO v_profile_id
    FROM public.roster
    WHERE email = v_target_email
    LIMIT 1;
  END IF;

  IF v_profile_id IS NULL THEN
    SELECT id INTO v_profile_id
    FROM public.profiles
    WHERE id IN (SELECT student_id FROM public.enrollments) -- fallback lookup if needed
       OR full_name ILIKE '%emberraynf2%'
    LIMIT 1;
  END IF;

  IF v_profile_id IS NOT NULL THEN
    RAISE NOTICE 'Purging all records for Profile/User ID: % (%)', v_profile_id, v_target_email;

    -- Delete from child transaction/log tables first
    DELETE FROM public.fee_audit_trail WHERE student_id = v_profile_id OR changed_by = v_profile_id;
    DELETE FROM public.fee_statuses WHERE student_id = v_profile_id;
    DELETE FROM public.enrollments WHERE student_id = v_profile_id;
    DELETE FROM public.attendance WHERE student_id = v_profile_id;
    DELETE FROM public.study_sessions WHERE student_id = v_profile_id;
    DELETE FROM public.notes WHERE uploaded_by = v_profile_id;
    
    -- Unlink or delete from roster
    DELETE FROM public.roster WHERE profile_id = v_profile_id OR email = v_target_email;
    
    -- Delete from profiles
    DELETE FROM public.profiles WHERE id = v_profile_id;
    
    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = v_profile_id OR email = v_target_email;
  ELSE
    RAISE NOTICE 'User % not found in auth.users. Cleaning up any stray rows by email...', v_target_email;
    DELETE FROM public.roster WHERE email = v_target_email;
    DELETE FROM auth.users WHERE email = v_target_email;
  END IF;
END $$;
