-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Production RLS Hotfix
-- Run this in Supabase → SQL Editor BEFORE going live.
--
-- Fixes two security/functionality gaps found in pre-deployment review:
--
-- Fix 1 (FUNCTIONALITY): Allow authenticated students to read teacher names.
--   The original "teachers: own read" policy only allows a teacher to read
--   their own row (id = auth.uid()). This means all joined teacher:teachers(*)
--   relations in student schedule / attendance queries return null, causing
--   the UI to display "Staff" everywhere instead of the actual teacher's name.
--
-- Fix 2 (SECURITY): Tighten fee_configs read access to authenticated users only.
--   The "fee_configs: public read" policy uses USING (true), which allows
--   unauthenticated (anon/public) access to read fee configs containing
--   payment account holder names, WhatsApp numbers, and bank details.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 1: teachers — let authenticated students read teacher profiles
-- ─────────────────────────────────────────────────────────────────────────────
-- Drop the existing policy that only allows a teacher to read their own row.
DROP POLICY IF EXISTS "teachers: own read" ON public.teachers;

-- New policy: any authenticated user can read teacher rows (read-only).
-- Teachers still own their own row (for teacher-specific SELECT).
-- Admins have full access via their separate admin policy.
-- Students need teacher names to display on schedule cards and attendance logs.
CREATE POLICY "teachers: own read"
  ON public.teachers FOR SELECT
  USING (auth.role() = 'authenticated');


-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 2: fee_configs — restrict read to authenticated users only
-- ─────────────────────────────────────────────────────────────────────────────
-- Remove the public read policy (USING (true) allows unauthenticated access).
DROP POLICY IF EXISTS "fee_configs: public read" ON public.fee_configs;

-- New policy: only signed-in users may read fee configuration rows.
-- This still allows:
--   • Students on checkout/fee pages to see pricing details
--   • Admins to view and manage all configs
-- But blocks:
--   • Unauthenticated scraper bots from reading account holder names,
--     phone numbers, and payment instructions.
CREATE POLICY "fee_configs: authenticated read"
  ON public.fee_configs FOR SELECT
  USING (auth.role() = 'authenticated');


-- ─────────────────────────────────────────────────────────────────────────────
-- Reload schema cache so PostgREST picks up the policy changes immediately.
-- ─────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';


-- ─────────────────────────────────────────────────────────────────────────────
-- Verification queries
-- ─────────────────────────────────────────────────────────────────────────────
-- Should return 2 rows for teachers (own read + admin write):
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'teachers'
ORDER BY policyname;

-- Should show "fee_configs: authenticated read" (not "public read"):
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'fee_configs'
ORDER BY policyname;
