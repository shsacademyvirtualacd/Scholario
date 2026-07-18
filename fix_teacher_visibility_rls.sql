-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Fix Teacher Class Visibility Bug
-- Run in: Supabase → SQL Editor
--
-- Root Cause: A legacy SELECT policy "offerings: read" on class_offerings
-- uses USING (auth.role() = 'authenticated'), allowing ANY signed-in user
-- (including teachers) to read ALL class offerings. PostgreSQL RLS policies
-- are additive (OR-ed), so this broad policy overrides the stricter
-- "offerings: student read" policy.
--
-- This migration:
--   1. Drops all legacy broad SELECT policies on class_offerings
--   2. Recreates a single strict SELECT policy using my_teacher_offering_ids()
--      for robust teacher matching (handles placeholder→real UUID transition)
--   3. Preserves the admin write policy unchanged
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Step 1: Drop ALL legacy/broad SELECT policies ───────────────────────────
DROP POLICY IF EXISTS "offerings: read" ON public.class_offerings;
DROP POLICY IF EXISTS "Allow public read access" ON public.class_offerings;
DROP POLICY IF EXISTS "Allow public read/write access" ON public.class_offerings;

-- ─── Step 2: Drop the current strict policy (we'll recreate it improved) ─────
DROP POLICY IF EXISTS "offerings: student read" ON public.class_offerings;

-- ─── Step 3: Recreate strict SELECT policy ───────────────────────────────────
-- Uses my_teacher_offering_ids() instead of raw teacher_id = auth.uid()
-- This helper function (SECURITY DEFINER) checks:
--   • teacher_id = auth.uid()  (direct match after roster profile link)
--   • teacher_id matches via teachers.email → roster.email → profile_id
--   • teacher_id matches via teachers.email → auth.users.email
-- This provides resilience during the placeholder→real UUID transition window.
CREATE POLICY "offerings: student read" ON public.class_offerings FOR SELECT
  USING (
    id = ANY(my_enrolled_offering_ids())
    OR id = ANY(my_teacher_offering_ids())
    OR is_admin()
  );

-- ─── Step 4: Ensure RLS is enabled (idempotent) ─────────────────────────────
ALTER TABLE public.class_offerings ENABLE ROW LEVEL SECURITY;

-- ─── Step 5: Reload PostgREST schema cache ───────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ─── Verification ────────────────────────────────────────────────────────────
-- Run this to confirm only the correct policies remain:
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'class_offerings'
ORDER BY policyname;
-- Expected output:
--   "offerings: admin write"  | ALL    | is_admin()
--   "offerings: student read" | SELECT | (id = ANY(my_enrolled_offering_ids()) OR id = ANY(my_teacher_offering_ids()) OR is_admin())
