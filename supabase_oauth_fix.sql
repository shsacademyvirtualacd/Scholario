-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — OAuth Self-Provisioning Fix
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- ROOT CAUSE: The profiles table only has an INSERT policy for admins.
-- First-time Google OAuth users have no profile row yet, so is_admin()
-- returns false, and the INSERT from provisionProfile() is silently
-- denied by RLS. The user ends up with a valid session but null profile,
-- causing a misleading "Access Restricted" redirect.
--
-- FIX: Allow authenticated users to insert their OWN profile row
--      (id = auth.uid()) and update their OWN roster entry.
--
-- Run in: Supabase → SQL Editor
-- Safe to re-run: uses DROP POLICY IF EXISTS before CREATE
-- ═══════════════════════════════════════════════════════════════════════════

-- 0. Ensure the optional profile columns exist
--    (safe to re-run — ADD COLUMN IF NOT EXISTS is idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stream text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Also reload Supabase schema cache (run this after the ALTER TABLEs)
NOTIFY pgrst, 'reload schema';

-- 1. Allow a user to create their own profile row on first login
--    The WITH CHECK ensures they can ONLY insert a row where id = their auth uid.
DROP POLICY IF EXISTS "profiles: self provision" ON public.profiles;

CREATE POLICY "profiles: self provision"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());


-- 2. Allow a user to link their auth uid to their own roster entry
--    This is needed by provisionProfile() after creating the profile:
--      .update({ profile_id: userId }).eq('email', email)
DROP POLICY IF EXISTS "roster: self link" ON public.roster;

CREATE POLICY "roster: self link"
  ON public.roster FOR UPDATE
  USING (email = LOWER(auth.jwt()->>'email'))
  WITH CHECK (email = LOWER(auth.jwt()->>'email'));


-- 3. Add admins
INSERT INTO public.profiles (id, role, full_name, avatar_url, phone, stream, created_at)
VALUES 
  ('a0000000-0000-0000-0000-000000000011', 'admin', 'Syed Rayyan', NULL, '123-456-7890', NULL, '2026-07-07T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000012', 'admin', 'Site Owner', NULL, '123-456-7890', NULL, '2026-07-07T12:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.roster (email, full_name, role, class_ids, profile_id, created_at)
VALUES 
  ('syedrayyanf1@gmail.com', 'Syed Rayyan', 'admin', '{}'::uuid[], 'a0000000-0000-0000-0000-000000000011'::uuid, '2026-07-07T12:00:00Z'),
  ('shs.academy.virtual@gmail.com', 'Site Owner', 'admin', '{}'::uuid[], 'a0000000-0000-0000-0000-000000000012'::uuid, '2026-07-07T12:00:00Z')
ON CONFLICT (email) DO NOTHING;

-- 4. Clean up any other admins or students from database
DELETE FROM public.roster WHERE email NOT IN ('syedrayyanf1@gmail.com', 'shs.academy.virtual@gmail.com');

-- Clean up referencing tables first to prevent foreign key violations
DELETE FROM public.notes WHERE uploaded_by IN (
  SELECT id FROM public.profiles WHERE role = 'student' OR (role = 'admin' AND id NOT IN (
    SELECT profile_id FROM public.roster WHERE email IN ('syedrayyanf1@gmail.com', 'shs.academy.virtual@gmail.com') AND profile_id IS NOT NULL
  ))
);
DELETE FROM public.enrollments WHERE student_id IN (
  SELECT id FROM public.profiles WHERE role = 'student' OR (role = 'admin' AND id NOT IN (
    SELECT profile_id FROM public.roster WHERE email IN ('syedrayyanf1@gmail.com', 'shs.academy.virtual@gmail.com') AND profile_id IS NOT NULL
  ))
);
DELETE FROM public.attendance WHERE student_id IN (
  SELECT id FROM public.profiles WHERE role = 'student' OR (role = 'admin' AND id NOT IN (
    SELECT profile_id FROM public.roster WHERE email IN ('syedrayyanf1@gmail.com', 'shs.academy.virtual@gmail.com') AND profile_id IS NOT NULL
  ))
);
DELETE FROM public.study_sessions WHERE student_id IN (
  SELECT id FROM public.profiles WHERE role = 'student' OR (role = 'admin' AND id NOT IN (
    SELECT profile_id FROM public.roster WHERE email IN ('syedrayyanf1@gmail.com', 'shs.academy.virtual@gmail.com') AND profile_id IS NOT NULL
  ))
);

DELETE FROM public.profiles WHERE role = 'student' OR (role = 'admin' AND id NOT IN (SELECT profile_id FROM public.roster WHERE email IN ('syedrayyanf1@gmail.com', 'shs.academy.virtual@gmail.com') AND profile_id IS NOT NULL));

