DO $$
DECLARE
  v_old_profile_id uuid := gen_random_uuid();
  v_new_profile_id uuid := gen_random_uuid();
  v_roster_id uuid;
  v_test_email text := '__test_teacher_verification__@test.internal';
  v_class_id uuid := gen_random_uuid();
  v_subject_id uuid := gen_random_uuid();
BEGIN
  -- Grab an existing class_id to use
  SELECT id INTO v_class_id FROM public.classes LIMIT 1;
  IF v_class_id IS NULL THEN
    RAISE EXCEPTION 'No classes found to use for test!';
  END IF;

  -- Create dummy subject
  INSERT INTO public.subjects (id, name) VALUES (v_subject_id, 'Test Subject XYZ');

  -- 1. Create old placeholder profile
  INSERT INTO public.profiles (id, role, full_name) VALUES (v_old_profile_id, 'teacher', 'Test Trigger Teacher');

  -- 2. Create new real profile
  INSERT INTO public.profiles (id, role, full_name) VALUES (v_new_profile_id, 'teacher', 'Test Trigger Teacher');

  -- 3. Create teacher row for OLD ID
  INSERT INTO public.teachers (id, full_name, email) VALUES (v_old_profile_id, 'Test Trigger Teacher', v_test_email);

  -- 4. Create class offering assigned to OLD ID
  INSERT INTO public.class_offerings (id, teacher_id, class_id, subject_id) 
  VALUES (gen_random_uuid(), v_old_profile_id, v_class_id, v_subject_id);

  -- 5. Create roster entry pointing to OLD ID
  INSERT INTO public.roster (email, full_name, role, profile_id)
  VALUES (v_test_email, 'Test Trigger Teacher', 'teacher', v_old_profile_id)
  RETURNING id INTO v_roster_id;

  -- 6. Fire the trigger by updating roster.profile_id to NEW ID
  UPDATE public.roster SET profile_id = v_new_profile_id WHERE id = v_roster_id;

  -- 7. Verification checks
  IF NOT EXISTS (SELECT 1 FROM public.teachers WHERE id = v_new_profile_id) THEN
    RAISE EXCEPTION '❌ FAIL: New teacher row not found!';
  END IF;

  IF EXISTS (SELECT 1 FROM public.teachers WHERE id = v_old_profile_id) THEN
    RAISE EXCEPTION '❌ FAIL: Old teacher row still exists!';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.class_offerings WHERE teacher_id = v_new_profile_id) THEN
    RAISE EXCEPTION '❌ FAIL: class_offerings not pointing to new teacher_id!';
  END IF;

  -- 8. Cleanup test data
  DELETE FROM public.class_offerings WHERE teacher_id = v_new_profile_id;
  DELETE FROM public.teachers WHERE id = v_new_profile_id;
  DELETE FROM public.roster WHERE id = v_roster_id;
  DELETE FROM public.profiles WHERE id = v_new_profile_id;
  DELETE FROM public.subjects WHERE id = v_subject_id;

  RAISE NOTICE '✅ Trigger simulation for teacher succeeded with no FK violation!';
END $$;
