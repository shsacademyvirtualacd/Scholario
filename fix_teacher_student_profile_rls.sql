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
-- Replace strict/legacy profiles SELECT policies with a comprehensive
-- SELECT policy "profiles: select" on `public.profiles`.
-- Allows:
-- 1. Reading own profile (id = auth.uid())
-- 2. Reading teacher and admin profiles (role IN ('teacher', 'admin'))
-- 3. Reading all profiles if user is admin (is_admin())
-- 4. Teachers reading profiles of students enrolled in their offerings
-- 5. Teachers reading profiles of students who created attendance claims for their offerings
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "profiles: own read" ON public.profiles;
DROP POLICY IF EXISTS "profiles: select policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles: select" ON public.profiles;

CREATE POLICY "profiles: select" ON public.profiles
  FOR SELECT
  TO public
  USING (
    (auth.role() = 'authenticated') AND (
      (id = auth.uid())
      OR (role = ANY (ARRAY['teacher'::text, 'admin'::text]))
      OR public.is_admin()
      OR (EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE (e.student_id = public.profiles.id)
          AND (e.offering_id = ANY (public.my_teacher_offering_ids()))
      ))
      OR (EXISTS (
        SELECT 1 FROM public.attendance_claims ac
        WHERE (ac.student_id = public.profiles.id) AND (
          ac.offering_id = ANY (public.my_teacher_offering_ids())
          OR ac.offering_id IN (
            SELECT o.id FROM public.class_offerings o
            WHERE o.teacher_id = auth.uid()
               OR o.teacher_id = ANY(public.my_teacher_ids())
          )
        )
      ))
    )
  );

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
