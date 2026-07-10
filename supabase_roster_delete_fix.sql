-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Roster Deletion Guard Patch
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Run this script in Supabase → SQL Editor to enforce that Admin roles
-- cannot be deleted from the roster.
-- ═══════════════════════════════════════════════════════════════════════════

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
