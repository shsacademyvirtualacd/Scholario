-- ─────────────────────────────────────────────────────────────
-- Scholario — Numeric Student ID Migration & Support
-- Ensures newly created student IDs are 4-5 digit numeric only
-- Existing student IDs remain completely untouched.
-- ─────────────────────────────────────────────────────────────

-- 1. Change roster.id to text (safe, preserves all existing UUIDs as strings)
ALTER TABLE public.roster ALTER COLUMN id TYPE text;

-- 2. Create function to generate unique 4-5 digit numeric student ID
CREATE OR REPLACE FUNCTION public.generate_unique_student_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_id text;
  v_exists boolean;
BEGIN
  LOOP
    -- Generate 4 to 5 digit number: uniformly from 1000 to 99999
    v_new_id := (floor(random() * (99999 - 1000 + 1)) + 1000)::text;
    
    -- Check uniqueness against roster id
    SELECT EXISTS (
      SELECT 1 FROM public.roster WHERE id = v_new_id
    ) INTO v_exists;
    
    IF NOT v_exists THEN
      RETURN v_new_id;
    END IF;
  END LOOP;
END;
$$;

-- 3. Update delete_from_roster to accept text p_roster_id
DROP FUNCTION IF EXISTS public.delete_from_roster(uuid);
DROP FUNCTION IF EXISTS public.delete_from_roster(text);

CREATE OR REPLACE FUNCTION public.delete_from_roster(p_roster_id text)
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
    WHERE id::text = p_roster_id;
    
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
      DELETE FROM public.fee_audit_trail WHERE student_id = v_profile_id OR changed_by = v_profile_id;
      DELETE FROM public.fee_statuses WHERE student_id = v_profile_id;
      DELETE FROM public.enrollments WHERE student_id = v_profile_id;
      DELETE FROM public.attendance WHERE student_id = v_profile_id;
      DELETE FROM public.study_sessions WHERE student_id = v_profile_id;
      DELETE FROM public.notes WHERE uploaded_by = v_profile_id;
      DELETE FROM public.profiles WHERE id = v_profile_id;
      DELETE FROM auth.users WHERE id = v_profile_id;
    END IF;
    IF v_email IS NOT NULL THEN
      DELETE FROM auth.users WHERE LOWER(email) = LOWER(v_email);
    END IF;

  -- ── TEACHER CASCADING CLEANUP ──
  ELSIF v_role = 'teacher' THEN
    SELECT id INTO v_teacher_id FROM public.teachers WHERE LOWER(email) = LOWER(v_email) OR id::text = p_roster_id OR id = v_profile_id LIMIT 1;
    IF v_teacher_id IS NOT NULL THEN
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
  DELETE FROM public.roster WHERE id = p_roster_id OR profile_id::text = p_roster_id OR (v_email IS NOT NULL AND LOWER(email) = LOWER(v_email));
END;
$$;

-- 4. Update update_roster_entry to accept text p_roster_id
DROP FUNCTION IF EXISTS public.update_roster_entry(uuid, jsonb);
DROP FUNCTION IF EXISTS public.update_roster_entry(text, jsonb);

CREATE OR REPLACE FUNCTION public.update_roster_entry(p_roster_id text, p_class_ids jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_email text;
  v_teacher_id uuid;
  v_class_id uuid;
  v_profile_id uuid;
  v_class_ids uuid[];
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required.';
  END IF;

  -- Get roster details
  SELECT role, email, profile_id INTO v_role, v_email, v_profile_id
  FROM public.roster
  WHERE id = p_roster_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Roster entry not found.';
  END IF;

  -- Convert jsonb array to uuid[]
  v_class_ids := ARRAY(SELECT jsonb_array_elements_text(p_class_ids)::uuid);

  -- Update class_ids in roster
  UPDATE public.roster
  SET class_ids = v_class_ids
  WHERE id = p_roster_id;

  -- Apply live updates to current mappings
  IF v_role = 'student' THEN
    IF v_profile_id IS NOT NULL THEN
      DELETE FROM public.enrollments
      WHERE student_id = v_profile_id;

      FOREACH v_class_id IN ARRAY v_class_ids
      LOOP
        INSERT INTO public.enrollments (student_id, offering_id, total_classes)
        VALUES (v_profile_id, v_class_id, 48);
      END LOOP;
    END IF;
  ELSIF v_role = 'teacher' THEN
    SELECT id INTO v_teacher_id
    FROM public.teachers
    WHERE email = v_email
    LIMIT 1;

    IF v_teacher_id IS NOT NULL THEN
      UPDATE public.class_offerings
      SET teacher_id = NULL
      WHERE teacher_id = v_teacher_id;

      FOREACH v_class_id IN ARRAY v_class_ids
      LOOP
        UPDATE public.class_offerings
        SET teacher_id = v_teacher_id
        WHERE id = v_class_id;
      END LOOP;
    END IF;
  END IF;
END;
$$;

-- 5. Update add_to_roster to generate numeric ID for students and return text
DROP FUNCTION IF EXISTS public.add_to_roster(text, text, text, jsonb, text);
DROP FUNCTION IF EXISTS public.add_to_roster(text, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.add_to_roster(
  p_email text, 
  p_full_name text, 
  p_role text, 
  p_class_ids jsonb, 
  p_phone text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_roster_id text;
  v_profile_id uuid;
  v_class_id uuid;
  v_class_ids uuid[];
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required.';
  END IF;

  IF p_role NOT IN ('student', 'teacher') THEN
    RAISE EXCEPTION 'Invalid role. Must be student or teacher.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.roster WHERE email = LOWER(p_email)) THEN
    RAISE EXCEPTION 'Email is already registered in the roster.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles p JOIN auth.users u ON p.id = u.id WHERE u.email = LOWER(p_email)) THEN
    RAISE EXCEPTION 'A user profile with this email already exists.';
  END IF;

  v_class_ids := ARRAY(SELECT jsonb_array_elements_text(p_class_ids)::uuid);
  v_profile_id := gen_random_uuid();

  -- Insert profile
  INSERT INTO public.profiles (id, role, full_name, phone)
  VALUES (v_profile_id, p_role, p_full_name, p_phone);

  -- Determine ID: 4-5 digit numeric for students, gen_random_uuid() for teachers
  IF p_role = 'student' THEN
    v_roster_id := public.generate_unique_student_id();
  ELSE
    v_roster_id := gen_random_uuid()::text;
  END IF;

  -- Insert into roster linking the profile
  INSERT INTO public.roster (id, email, full_name, role, class_ids, profile_id)
  VALUES (v_roster_id, LOWER(p_email), p_full_name, p_role, v_class_ids, v_profile_id);

  IF p_role = 'student' THEN
    FOREACH v_class_id IN ARRAY v_class_ids
    LOOP
      INSERT INTO public.enrollments (student_id, offering_id, total_classes)
      VALUES (v_profile_id, v_class_id, 48);
    END LOOP;
  ELSIF p_role = 'teacher' THEN
    INSERT INTO public.teachers (id, full_name, email, is_active, joining_date)
    VALUES (v_profile_id, p_full_name, LOWER(p_email), true, CURRENT_DATE);

    FOREACH v_class_id IN ARRAY v_class_ids
    LOOP
      UPDATE public.class_offerings
      SET teacher_id = v_profile_id
      WHERE id = v_class_id;
    END LOOP;
  END IF;

  RETURN v_roster_id;
END;
$$;

-- 6. Update RLS policies on roster
DROP POLICY IF EXISTS "roster: select own" ON public.roster;
CREATE POLICY "roster: select own" ON public.roster FOR SELECT
  USING (
    (email = lower(auth.jwt() ->> 'email')) OR 
    (profile_id = auth.uid()) OR 
    (EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin'))
  );

DROP POLICY IF EXISTS "roster: self link" ON public.roster;
CREATE POLICY "roster: self link" ON public.roster FOR UPDATE
  USING ((email = lower(auth.jwt() ->> 'email')) OR (profile_id = auth.uid()))
  WITH CHECK ((email = lower(auth.jwt() ->> 'email')) OR (profile_id = auth.uid()));
