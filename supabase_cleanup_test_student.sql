-- ═══════════════════════════════════════════════════════════════════════════
-- COMPLETE USER PURGE SCRIPT — Run this in Supabase SQL Editor
-- Completely purges all traces of 'emberraynf2@gmail.com' across all tables:
-- auth.users, profiles, roster, enrollments, fee_statuses, fee_audit_trail,
-- attendance, study_sessions, and notes.
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

  -- 2. Look up profile ID from profiles if not found in auth.users
  IF v_profile_id IS NULL THEN
    SELECT id INTO v_profile_id
    FROM public.profiles
    WHERE id IN (SELECT profile_id FROM public.roster WHERE email = v_target_email)
    LIMIT 1;
  END IF;

  IF v_profile_id IS NOT NULL THEN
    RAISE NOTICE 'Purging records for Profile ID: % (%)', v_profile_id, v_target_email;

    -- Delete from child transaction and log tables first
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
    
    -- Delete from auth.users (Requires superuser / SQL Editor execution in Supabase)
    DELETE FROM auth.users WHERE id = v_profile_id OR email = v_target_email;
  ELSE
    -- If user only existed in roster but not in profiles/auth.users yet
    DELETE FROM public.roster WHERE email = v_target_email;
  END IF;
END $$;

-- Fallback safety purge by email directly
DELETE FROM public.roster WHERE email = 'emberraynf2@gmail.com';

-- Verification (All queries below should return 0)
SELECT 'roster count remaining' as check, COUNT(*) FROM public.roster WHERE email = 'emberraynf2@gmail.com'
UNION ALL
SELECT 'profiles count remaining', COUNT(*) FROM public.profiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'emberraynf2@gmail.com')
UNION ALL
SELECT 'auth users count remaining', COUNT(*) FROM auth.users WHERE email = 'emberraynf2@gmail.com';
