-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Reset onboarding_complete on Role Switch to Student
-- Run in: Supabase → SQL Editor or database migration script
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Redefine prevent_role_escalation to also reset onboarding_complete when role changes to student
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Privilege escalation guard
  IF NOT public.is_admin() AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Privilege escalation blocked: only admins can change roles.';
  END IF;

  -- Reset onboarding_complete when the user's role transitions TO student FROM any other role
  IF NEW.role = 'student' AND OLD.role IS DISTINCT FROM NEW.role THEN
    NEW.onboarding_complete := false;
  END IF;

  RETURN NEW;
END;
$$;
