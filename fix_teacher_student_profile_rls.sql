-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Fix Teacher Student Profile RLS Policy Bug
--
-- Root Cause:
-- On the Teacher Dashboard, fetching enrolled students queries:
--   supabase.from('enrollments').select('student:profiles(*)')
-- While RLS on `enrollments` allows teachers to read enrollment rows,
-- RLS on `profiles` ("profiles: own read") strictly restricted SELECT to:
--   USING ((id = auth.uid()) OR is_admin())
-- Teachers were thus blocked from reading profiles of students enrolled in
-- their classes, returning `student: null` for all enrollment joins.
--
-- Fix:
-- Update "profiles: own read" SELECT policy to also allow teachers to read
-- student profiles for students enrolled in any of the teacher's offerings.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "profiles: own read" ON public.profiles;

CREATE POLICY "profiles: own read" ON public.profiles FOR SELECT
  USING (
    id = auth.uid() 
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.enrollments e 
      WHERE e.student_id = public.profiles.id 
        AND e.offering_id = ANY(public.my_teacher_offering_ids())
    )
  );

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
