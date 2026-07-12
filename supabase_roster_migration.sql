-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Roster Provisioning Migration
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create the unified roster table
CREATE TABLE IF NOT EXISTS public.roster (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  class_ids uuid[] NOT NULL DEFAULT '{}',
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on roster
ALTER TABLE public.roster ENABLE ROW LEVEL SECURITY;

-- Allow admins full access to roster
DROP POLICY IF EXISTS "roster: admin all" ON public.roster;
CREATE POLICY "roster: admin all"
  ON public.roster FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow authenticated users to read their own roster entry by email
DROP POLICY IF EXISTS "roster: select own" ON public.roster;
CREATE POLICY "roster: select own"
  ON public.roster FOR SELECT
  USING (email = LOWER(auth.jwt()->>'email') OR public.is_admin());

-- Allow users to link their auth uid to their own roster entry on first login
-- (provisionProfile() does: .update({ profile_id: userId }).eq('email', email))
DROP POLICY IF EXISTS "roster: self link" ON public.roster;
CREATE POLICY "roster: self link"
  ON public.roster FOR UPDATE
  USING (email = LOWER(auth.jwt()->>'email'))
  WITH CHECK (email = LOWER(auth.jwt()->>'email'));


-- Ensure we drop all old signatures first to avoid overloaded duplicates
DROP FUNCTION IF EXISTS public.add_to_roster(text, text, text, uuid[]);
DROP FUNCTION IF EXISTS public.add_to_roster(text, text, text, text[]);
DROP FUNCTION IF EXISTS public.add_to_roster(text, text, text, jsonb);

-- Add a new entry to the roster
CREATE OR REPLACE FUNCTION public.add_to_roster(
  p_email text,
  p_full_name text,
  p_role text,
  p_class_ids jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with creator privileges (bypass RLS)
AS $$
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
  VALUES (v_profile_id, p_role, p_full_name, NULL);

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
$$;


-- Ensure we drop all old signatures first to avoid overloaded duplicates
DROP FUNCTION IF EXISTS public.update_roster_entry(uuid, uuid[]);
DROP FUNCTION IF EXISTS public.update_roster_entry(uuid, text[]);
DROP FUNCTION IF EXISTS public.update_roster_entry(uuid, jsonb);

-- Update an existing roster entry's class assignment
CREATE OR REPLACE FUNCTION public.update_roster_entry(
  p_roster_id uuid,
  p_class_ids jsonb
)
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
    -- If already logged in (has profile), update/recreate their enrollments
    IF v_profile_id IS NOT NULL THEN
      -- Delete old enrollments
      DELETE FROM public.enrollments
      WHERE student_id = v_profile_id;

      -- Create new enrollments
      FOREACH v_class_id IN ARRAY v_class_ids
      LOOP
        INSERT INTO public.enrollments (student_id, offering_id, total_classes)
        VALUES (v_profile_id, v_class_id, 48);
      END LOOP;
    END IF;
  ELSIF v_role = 'teacher' THEN
    -- Find teacher ID (could be auth ID if logged in, or generated ID if pending)
    SELECT id INTO v_teacher_id
    FROM public.teachers
    WHERE email = v_email
    LIMIT 1;

    IF v_teacher_id IS NOT NULL THEN
      -- Clear teacher assignment from offerings previously owned by this teacher
      UPDATE public.class_offerings
      SET teacher_id = NULL
      WHERE teacher_id = v_teacher_id;

      -- Assign new offerings
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


-- Delete a person from the roster
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

  -- Enforce admin delete prevention
  IF v_role = 'admin' THEN
    RAISE EXCEPTION 'Access denied: Administrators cannot be removed from the roster.';
  END IF;

  -- 1. Clean up linked operational tables
  IF v_role = 'student' AND v_profile_id IS NOT NULL THEN
    DELETE FROM public.enrollments WHERE student_id = v_profile_id;
    DELETE FROM public.attendance WHERE student_id = v_profile_id;
    DELETE FROM public.study_sessions WHERE student_id = v_profile_id;
    DELETE FROM public.profiles WHERE id = v_profile_id;
  ELSIF v_role = 'teacher' THEN
    SELECT id INTO v_teacher_id FROM public.teachers WHERE email = v_email LIMIT 1;
    IF v_teacher_id IS NOT NULL THEN
      UPDATE public.class_offerings SET teacher_id = NULL WHERE teacher_id = v_teacher_id;
      DELETE FROM public.teachers WHERE id = v_teacher_id;
    END IF;
    IF v_profile_id IS NOT NULL THEN
      DELETE FROM public.profiles WHERE id = v_profile_id;
    END IF;
  END IF;

  -- 2. Delete roster record itself
  DELETE FROM public.roster WHERE id = p_roster_id;
END;
$$;
