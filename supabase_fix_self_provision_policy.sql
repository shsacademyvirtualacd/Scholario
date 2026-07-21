-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Fix Privilege Escalation on Profile Self-Provision
-- Run in: Supabase → SQL Editor
--
-- Root Cause: The "profiles: self provision" INSERT policy only checked
-- id = auth.uid(), allowing a registering user to set role = 'admin'
-- and gain full administrative access.
--
-- Fix: Add role = 'student' to the WITH CHECK clause so self-provisioned
-- profiles can only ever be students. Admin-created profiles (teachers,
-- admins) continue to go through the separate "profiles: admin insert"
-- policy which gates on is_admin().
--
-- Scope: Only the "profiles: self provision" INSERT policy is modified.
-- The UPDATE policy, tr_prevent_role_escalation trigger, and all other
-- table policies are NOT touched.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Drop the vulnerable policy
DROP POLICY IF EXISTS "profiles: self provision" ON public.profiles;

-- 2. Recreate with hardened WITH CHECK clause
CREATE POLICY "profiles: self provision"
  ON public.profiles FOR INSERT
  WITH CHECK (
    id = auth.uid()
    AND role = 'student'
  );

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- ─── Verification ────────────────────────────────────────────────────────
-- After running, verify the policy exists and has the correct check:
SELECT policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname = 'profiles: self provision';
-- Expected: with_check should contain both (id = auth.uid()) AND (role = 'student')
