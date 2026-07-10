-- ═══════════════════════════════════════════════════════════════════════════
-- SIGNUP RLS POLICY HOTFIX — Run this in Supabase SQL Editor
-- Allows newly signed-in student users to insert their own roster entry
-- during the registration/sign-up flow.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Allow authenticated users to INSERT a roster entry for their own verified Google email
DROP POLICY IF EXISTS "roster: self insert" ON public.roster;
CREATE POLICY "roster: self insert"
  ON public.roster FOR INSERT
  WITH CHECK (
    email = LOWER(auth.jwt()->>'email') 
    AND role = 'student'
  );

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

-- Verification (should succeed and return 1 row representing this policy status)
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'roster' AND policyname = 'roster: self insert';
