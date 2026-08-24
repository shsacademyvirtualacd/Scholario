-- =============================================================================
-- FIX TESTING CENTER ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- This migration script enforces database-level Row Level Security on:
-- 1. `student_mcq_attempts` (MCQ practice and exam results)
-- 2. `tests` (Class test papers)
-- 3. `test_submissions` (Student uploaded test answer sheets and grading)
--
-- Security Rules Enforced:
-- - Students: Can only view & create their own test attempts and submissions.
-- - Teachers: STRICTLY restricted to view & evaluate tests, submissions, and MCQ
--   results for classes and subjects where they are assigned in `class_offerings`.
--   A Grade 9 Biology teacher CANNOT query Grade 10 or Physics/Math data.
-- - Admins: Full unrestricted SELECT, INSERT, UPDATE, DELETE access.
-- =============================================================================

-- 1. Create `student_mcq_attempts` table if not exists
CREATE TABLE IF NOT EXISTS public.student_mcq_attempts (
  id TEXT PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_email TEXT,
  board TEXT NOT NULL DEFAULT 'fbise',
  grade TEXT NOT NULL,
  stream TEXT,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  chapters TEXT[] DEFAULT '{}',
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  percentage INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  exam_mode TEXT DEFAULT 'chapter',
  difficulty TEXT DEFAULT 'medium',
  user_answers JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_student_mcq_attempts_student_id ON public.student_mcq_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_mcq_attempts_grade_subject ON public.student_mcq_attempts(grade, subject);
CREATE INDEX IF NOT EXISTS idx_student_mcq_attempts_created_at ON public.student_mcq_attempts(created_at DESC);

-- Enable RLS on all test tables
ALTER TABLE public.student_mcq_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_submissions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Helper function: Check if current auth user is an Admin
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.roster
    WHERE email = auth.jwt() ->> 'email' AND role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- Helper function: Check if current teacher is assigned to a specific grade and subject
-- -----------------------------------------------------------------------------
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
      co.teacher_id = auth.uid() 
      OR co.teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
    )
    AND c.grade = target_grade
    AND (
      LOWER(COALESCE(s.name, co.subject_name, '')) = LOWER(target_subject)
      OR LOWER(COALESCE(s.name, co.subject_name, '')) LIKE '%' || LOWER(target_subject) || '%'
      OR LOWER(target_subject) LIKE '%' || LOWER(COALESCE(s.name, co.subject_name, '')) || '%'
    )
  );
$$;

-- =============================================================================
-- POLICIES: student_mcq_attempts
-- =============================================================================

DROP POLICY IF EXISTS "student_mcq_attempts_select_admin" ON public.student_mcq_attempts;
CREATE POLICY "student_mcq_attempts_select_admin"
  ON public.student_mcq_attempts
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "student_mcq_attempts_select_student" ON public.student_mcq_attempts;
CREATE POLICY "student_mcq_attempts_select_student"
  ON public.student_mcq_attempts
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "student_mcq_attempts_select_teacher" ON public.student_mcq_attempts;
CREATE POLICY "student_mcq_attempts_select_teacher"
  ON public.student_mcq_attempts
  FOR SELECT
  TO authenticated
  USING (public.is_teacher_assigned_to(grade, subject));

DROP POLICY IF EXISTS "student_mcq_attempts_insert_student" ON public.student_mcq_attempts;
CREATE POLICY "student_mcq_attempts_insert_student"
  ON public.student_mcq_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "student_mcq_attempts_all_admin" ON public.student_mcq_attempts;
CREATE POLICY "student_mcq_attempts_all_admin"
  ON public.student_mcq_attempts
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- POLICIES: tests
-- =============================================================================

DROP POLICY IF EXISTS "tests_select_all" ON public.tests;
DROP POLICY IF EXISTS "tests_select_policy" ON public.tests;
CREATE POLICY "tests_select_policy"
  ON public.tests
  FOR SELECT
  TO authenticated
  USING (
    -- Admin sees all
    public.is_admin()
    -- Teacher sees tests for assigned grade & subject or created by themselves
    OR teacher_id = auth.uid()
    OR public.is_teacher_assigned_to(grade, subject)
    -- Student sees tests for their enrolled grade
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.classes c ON c.id = p.class_id
      WHERE p.id = auth.uid() AND c.grade = public.tests.grade
    )
  );

DROP POLICY IF EXISTS "tests_manage_admin_teacher" ON public.tests;
CREATE POLICY "tests_manage_admin_teacher"
  ON public.tests
  FOR ALL
  TO authenticated
  USING (
    public.is_admin() 
    OR teacher_id = auth.uid()
    OR public.is_teacher_assigned_to(grade, subject)
  )
  WITH CHECK (
    public.is_admin() 
    OR teacher_id = auth.uid()
    OR public.is_teacher_assigned_to(grade, subject)
  );

-- =============================================================================
-- POLICIES: test_submissions
-- =============================================================================

DROP POLICY IF EXISTS "test_submissions_select_policy" ON public.test_submissions;
CREATE POLICY "test_submissions_select_policy"
  ON public.test_submissions
  FOR SELECT
  TO authenticated
  USING (
    -- Admin has full visibility
    public.is_admin()
    -- Student sees own submissions
    OR student_id = auth.uid()
    -- Teacher only sees submissions for tests matching their assigned offerings
    OR EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = public.test_submissions.test_id
      AND (
        t.teacher_id = auth.uid()
        OR public.is_teacher_assigned_to(t.grade, t.subject)
      )
    )
  );

DROP POLICY IF EXISTS "test_submissions_insert_student" ON public.test_submissions;
CREATE POLICY "test_submissions_insert_student"
  ON public.test_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid() OR public.is_admin());

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
        t.teacher_id = auth.uid()
        OR public.is_teacher_assigned_to(t.grade, t.subject)
      )
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = public.test_submissions.test_id
      AND (
        t.teacher_id = auth.uid()
        OR public.is_teacher_assigned_to(t.grade, t.subject)
      )
    )
  );
