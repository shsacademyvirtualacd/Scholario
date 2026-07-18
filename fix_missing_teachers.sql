-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Fix Missing Teacher Records
-- Run in: Supabase → SQL Editor
--
-- Root Cause: Teachers provisioned before the triggers/sync functions
-- were fully set up exist in the profiles and roster tables, but are
-- missing from the teachers table. This causes stats counts and workload
-- tables on the dashboard to report incorrect totals (e.g. 5 instead of 6).
--
-- Fix: Query the roster table for any entries with role = 'teacher'
-- that do not have a matching entry in the teachers table, and insert them.
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.teachers (id, full_name, email, is_active, joining_date)
SELECT r.profile_id, r.full_name, r.email, TRUE, COALESCE(r.created_at::date, CURRENT_DATE)
FROM public.roster r
WHERE r.role = 'teacher' 
  AND r.profile_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.teachers t 
    WHERE t.id = r.profile_id OR LOWER(t.email) = LOWER(r.email)
  )
ON CONFLICT (id) DO NOTHING;
