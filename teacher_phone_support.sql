-- Drop the old add_to_roster function to allow signature change
DROP FUNCTION IF EXISTS public.add_to_roster(text, text, text, jsonb);

-- Create updated add_to_roster with p_phone parameter
CREATE OR REPLACE FUNCTION public.add_to_roster(p_email text, p_full_name text, p_role text, p_class_ids jsonb, p_phone text DEFAULT NULL)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_roster_id uuid;
  v_profile_id uuid;
  v_class_id uuid;
  v_class_ids uuid[];
BEGIN
  -- Server-side Admin security check
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required.';
  END IF;

  -- Validate role
  IF p_role NOT IN ('student', 'teacher') THEN
    RAISE EXCEPTION 'Invalid role. Must be student or teacher.';
  END IF;

  -- Validate email uniqueness in roster
  IF EXISTS (SELECT 1 FROM public.roster WHERE email = LOWER(p_email)) THEN
    RAISE EXCEPTION 'Email is already registered in the roster.';
  END IF;

  -- Validate email uniqueness in profiles
  IF EXISTS (SELECT 1 FROM public.profiles p JOIN auth.users u ON p.id = u.id WHERE u.email = LOWER(p_email)) THEN
    RAISE EXCEPTION 'A user profile with this email already exists.';
  END IF;

  -- Convert jsonb array to uuid[]
  v_class_ids := ARRAY(SELECT jsonb_array_elements_text(p_class_ids)::uuid);

  -- Generate profile ID upfront
  v_profile_id := gen_random_uuid();

  -- Insert profile
  INSERT INTO public.profiles (id, role, full_name, phone)
  VALUES (v_profile_id, p_role, p_full_name, p_phone);

  -- Insert into roster linking the profile
  INSERT INTO public.roster (email, full_name, role, class_ids, profile_id)
  VALUES (LOWER(p_email), p_full_name, p_role, v_class_ids, v_profile_id)
  RETURNING id INTO v_roster_id;

  -- If it's a student, enroll them in classes
  IF p_role = 'student' THEN
    FOREACH v_class_id IN ARRAY v_class_ids
    LOOP
      INSERT INTO public.enrollments (student_id, offering_id, total_classes)
      VALUES (v_profile_id, v_class_id, 48);
    END LOOP;
  -- If it's a teacher, pre-provision them in the teachers table and assign class offerings
  ELSIF p_role = 'teacher' THEN
    INSERT INTO public.teachers (id, full_name, email, is_active, joining_date)
    VALUES (v_profile_id, p_full_name, LOWER(p_email), TRUE, CURRENT_DATE);

    FOREACH v_class_id IN ARRAY v_class_ids
    LOOP
      UPDATE public.class_offerings
      SET teacher_id = v_profile_id
      WHERE id = v_class_id;
    END LOOP;
  END IF;

  RETURN v_roster_id;
END;
$function$;

-- Create Trigger function to sync teacher profile
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

-- Create Trigger on profiles table
DROP TRIGGER IF EXISTS trg_sync_teacher_profile ON public.profiles;

CREATE TRIGGER trg_sync_teacher_profile
AFTER UPDATE OF full_name ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_teacher_profile();
