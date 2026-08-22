-- =============================================================================
-- Migration: Teacher Attendance Ratings
-- Description: Allows students to independently rate teacher attendance (Present/Absent)
--              for in-session or recently completed class sessions.
--              One-time, locked vote per student per (slot_id, session_date).
--              Visible only to the student who cast it and admins (invisible to teachers).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.teacher_attendance_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slot_id uuid NOT NULL REFERENCES public.class_slots(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  session_date date NOT NULL,
  rating text NOT NULL CHECK (rating IN ('present', 'absent')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_student_slot_session UNIQUE (student_id, slot_id, session_date)
);

-- Enable Row Level Security
ALTER TABLE public.teacher_attendance_ratings ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_slot_date ON public.teacher_attendance_ratings(slot_id, session_date);
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_teacher ON public.teacher_attendance_ratings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_student ON public.teacher_attendance_ratings(student_id);

-- RLS Policies
-- 1. Admins have full access to view, insert, update, or delete all ratings
DROP POLICY IF EXISTS "admin_all_teacher_ratings" ON public.teacher_attendance_ratings;
CREATE POLICY "admin_all_teacher_ratings"
  ON public.teacher_attendance_ratings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Students can view ONLY their own ratings
DROP POLICY IF EXISTS "student_select_own_teacher_ratings" ON public.teacher_attendance_ratings;
CREATE POLICY "student_select_own_teacher_ratings"
  ON public.teacher_attendance_ratings
  FOR SELECT
  USING (student_id = auth.uid());

-- 3. Students can INSERT their own ratings (once per session due to UNIQUE constraint)
DROP POLICY IF EXISTS "student_insert_own_teacher_ratings" ON public.teacher_attendance_ratings;
CREATE POLICY "student_insert_own_teacher_ratings"
  ON public.teacher_attendance_ratings
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- NOTE: No UPDATE or DELETE policies are granted to students, ensuring votes are locked once cast.
-- Teachers have NO select or write policies on this table, completely shielding ratings from teachers.
