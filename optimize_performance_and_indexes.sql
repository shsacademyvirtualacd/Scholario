-- =============================================================================
-- PERFORMANCE & RLS OPTIMIZATION MIGRATION FOR SCHOLARIO
-- =============================================================================
-- 1. Wraps auth.uid() and auth.jwt() calls inside subqueries: (SELECT auth.uid())
--    This allows PostgreSQL's query optimizer to evaluate authentication context
--    ONCE per query instead of executing it on every single scanned row.
-- 2. Adds composite indexes on high-traffic tables (class_slots, class_session_links,
--    attendance, tests, test_submissions, student_mcq_attempts).
-- 3. Optimizes helper functions with STABLE / PARALLEL SAFE annotations.
-- =============================================================================

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_class_slots_offering_id ON public.class_slots(offering_id);
CREATE INDEX IF NOT EXISTS idx_class_slots_class_id ON public.class_slots(class_id);
CREATE INDEX IF NOT EXISTS idx_class_slots_day_time ON public.class_slots(day_of_week, start_time);

CREATE INDEX IF NOT EXISTS idx_class_session_links_slot_date ON public.class_session_links(slot_id, session_date);

CREATE INDEX IF NOT EXISTS idx_attendance_student_session ON public.attendance(student_id, session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_slot_date ON public.attendance(slot_id, session_date);

CREATE INDEX IF NOT EXISTS idx_tests_grade_subject ON public.tests(grade, subject);
CREATE INDEX IF NOT EXISTS idx_tests_teacher_id ON public.tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tests_created_at_desc ON public.tests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_test_submissions_test_id ON public.test_submissions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_student_id ON public.test_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_status ON public.test_submissions(status);

-- -----------------------------------------------------------------------------
-- Optimized helper functions: (SELECT auth.uid()) query plan caching
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.roster
    WHERE email = (SELECT auth.jwt() ->> 'email') AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_assigned_to(target_grade TEXT, target_subject TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.class_offerings co
    JOIN public.classes c ON c.id = co.class_id
    LEFT JOIN public.subjects s ON s.id = co.subject_id
    WHERE (
      co.teacher_id = (SELECT auth.uid()) 
      OR co.teacher_id IN (SELECT id FROM public.teachers WHERE user_id = (SELECT auth.uid()))
    )
    AND c.grade = target_grade
    AND (
      LOWER(COALESCE(s.name, co.subject_name, '')) = LOWER(target_subject)
      OR LOWER(COALESCE(s.name, co.subject_name, '')) LIKE '%' || LOWER(target_subject) || '%'
      OR LOWER(target_subject) LIKE '%' || LOWER(COALESCE(s.name, co.subject_name, '')) || '%'
    )
  );
$$;

-- -----------------------------------------------------------------------------
-- Re-apply optimized RLS policies for `tests` and `test_submissions`
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "tests_select_policy" ON public.tests;
CREATE POLICY "tests_select_policy"
  ON public.tests
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR teacher_id = (SELECT auth.uid())
    OR public.is_teacher_assigned_to(grade, subject)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.classes c ON c.id = p.class_id
      WHERE p.id = (SELECT auth.uid()) AND c.grade = public.tests.grade
    )
  );

DROP POLICY IF EXISTS "tests_manage_admin_teacher" ON public.tests;
CREATE POLICY "tests_manage_admin_teacher"
  ON public.tests
  FOR ALL
  TO authenticated
  USING (
    public.is_admin() 
    OR teacher_id = (SELECT auth.uid())
    OR public.is_teacher_assigned_to(grade, subject)
  )
  WITH CHECK (
    public.is_admin() 
    OR teacher_id = (SELECT auth.uid())
    OR public.is_teacher_assigned_to(grade, subject)
  );

DROP POLICY IF EXISTS "test_submissions_select_policy" ON public.test_submissions;
CREATE POLICY "test_submissions_select_policy"
  ON public.test_submissions
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR student_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = public.test_submissions.test_id
      AND (
        t.teacher_id = (SELECT auth.uid())
        OR public.is_teacher_assigned_to(t.grade, t.subject)
      )
    )
  );

DROP POLICY IF EXISTS "test_submissions_insert_student" ON public.test_submissions;
CREATE POLICY "test_submissions_insert_student"
  ON public.test_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = (SELECT auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "test_submissions_update_grading" ON public.test_submissions;
CREATE POLICY "test_submissions_update_grading"
  ON public.test_submissions
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = public.test_submissions.test_id
      AND (
        t.teacher_id = (SELECT auth.uid())
        OR public.is_teacher_assigned_to(t.grade, t.subject)
      )
    )
  );
