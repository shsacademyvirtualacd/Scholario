DO $$
DECLARE
  v_roster_id uuid;
  v_teacher_profile_id uuid;
  v_test_email text := '__phone_test_teacher__@test.internal';
  v_test_phone text := '03001234567';
  v_test_name text := 'Test Phone Teacher';
  v_new_auth_id uuid := gen_random_uuid();
BEGIN
  -- 1. Call add_to_roster to provision the teacher with phone
  v_roster_id := public.add_to_roster(
    v_test_email, 
    v_test_name, 
    'teacher', 
    '[]'::jsonb, 
    v_test_phone
  );

  -- Retrieve generated profile ID
  SELECT profile_id INTO v_teacher_profile_id FROM public.roster WHERE id = v_roster_id;

  -- Verify it went into profiles
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_teacher_profile_id AND phone = v_test_phone) THEN
    RAISE EXCEPTION '❌ FAIL: Phone not found in profiles for %', v_teacher_profile_id;
  END IF;

  -- Verify it went into teachers
  IF NOT EXISTS (SELECT 1 FROM public.teachers WHERE id = v_teacher_profile_id AND phone = v_test_phone) THEN
    RAISE EXCEPTION '❌ FAIL: Phone not found in teachers for %', v_teacher_profile_id;
  END IF;

  -- 2. Test handle_roster_profile_link migration 
  -- Insert real profile
  INSERT INTO public.profiles (id, role, full_name) VALUES (v_new_auth_id, 'teacher', v_test_name);
  
  -- Update roster to trigger migration
  UPDATE public.roster SET profile_id = v_new_auth_id WHERE id = v_roster_id;

  -- Verify migrated phone in teachers
  IF NOT EXISTS (SELECT 1 FROM public.teachers WHERE id = v_new_auth_id AND phone = v_test_phone) THEN
    RAISE EXCEPTION '❌ FAIL: Migrated teacher missing phone for %', v_new_auth_id;
  END IF;

  -- 3. Test trigger update on profiles -> teachers
  UPDATE public.profiles SET phone = '03119876543', full_name = 'Test Phone Updated' WHERE id = v_new_auth_id;

  -- Verify synced teachers row
  IF NOT EXISTS (SELECT 1 FROM public.teachers WHERE id = v_new_auth_id AND phone = '03119876543' AND full_name = 'Test Phone Updated') THEN
    RAISE EXCEPTION '❌ FAIL: Sync trigger failed to update teachers phone/name';
  END IF;

  -- Cleanup
  DELETE FROM public.teachers WHERE id = v_new_auth_id;
  DELETE FROM public.roster WHERE id = v_roster_id;
  DELETE FROM public.profiles WHERE id = v_new_auth_id;

  RAISE NOTICE '✅ ALL PHONE VERIFICATIONS PASSED!';
END $$;
