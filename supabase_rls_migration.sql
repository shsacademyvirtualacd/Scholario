-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — RLS Policies + Performance Indexes
-- Run this in Supabase → SQL Editor (once, as a migration)
--
-- Assumptions:
--   • Admin users are identified by profile.role = 'admin'
--   • We use a helper function `get_my_role()` to avoid N+1 policy checks
--   • Teacher rows link to auth.uid() via teachers.id after first login
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Helper: get the current user's role from profiles ─────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ─── Helper: check if current user is admin ────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ─── Helper: get offering IDs a student is enrolled in ────────────────────
CREATE OR REPLACE FUNCTION public.my_enrolled_offering_ids()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT ARRAY(
    SELECT offering_id FROM public.enrollments WHERE student_id = auth.uid()
  );
$$;

-- ─── Helper: get offering IDs assigned to a teacher ───────────────────────
CREATE OR REPLACE FUNCTION public.my_teacher_offering_ids()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT ARRAY(
    SELECT id FROM public.class_offerings WHERE teacher_id = auth.uid()
  );
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- PERFORMANCE INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

-- enrollments: student lookups + offering lookups are the two primary patterns
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id  ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_offering_id ON public.enrollments(offering_id);

-- attendance: student history (most common query), session lookup
CREATE INDEX IF NOT EXISTS idx_attendance_student_id         ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_slot_date          ON public.attendance(slot_id, session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date       ON public.attendance(student_id, session_date DESC);

-- notes: offering-scoped reads, sorted by newest first
CREATE INDEX IF NOT EXISTS idx_notes_offering_created        ON public.notes(offering_id, created_at DESC);

-- class_slots: offering-scoped + day ordering
CREATE INDEX IF NOT EXISTS idx_class_slots_offering_day      ON public.class_slots(offering_id, day_of_week);

-- class_offerings: teacher-scoped reads
CREATE INDEX IF NOT EXISTS idx_class_offerings_teacher_id    ON public.class_offerings(teacher_id);

-- profiles: role-based admin counts
CREATE INDEX IF NOT EXISTS idx_profiles_role                 ON public.profiles(role);


-- ═══════════════════════════════════════════════════════════════════════════
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_slots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions  ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════════
-- profiles
-- ─── Students: own row only
-- ─── Teachers: own row only
-- ─── Admins: all rows, read + write
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "profiles: own read"    ON public.profiles;
DROP POLICY IF EXISTS "profiles: own update"  ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin all"   ON public.profiles;

-- Any authenticated user can read their own profile
CREATE POLICY "profiles: own read"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR is_admin());

-- Any user can update their own profile
CREATE POLICY "profiles: own update"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR is_admin());

-- Admin can insert/delete profiles
CREATE POLICY "profiles: admin insert"
  ON public.profiles FOR INSERT
  WITH CHECK (is_admin());

-- Allow first-time OAuth users to create their own profile row
-- (provisionProfile() inserts with id = auth.uid() after roster check)
CREATE POLICY "profiles: self provision"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles: admin delete"
  ON public.profiles FOR DELETE
  USING (is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- teachers
-- ─── Teachers: read their own row (matched by auth.uid() = teachers.id)
-- ─── Admins: full access
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "teachers: own read"   ON public.teachers;
DROP POLICY IF EXISTS "teachers: admin all"  ON public.teachers;

CREATE POLICY "teachers: own read"
  ON public.teachers FOR SELECT
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "teachers: admin write"
  ON public.teachers FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- class_offerings
-- ─── Students: read offerings they are enrolled in
-- ─── Teachers: read their own assigned offerings
-- ─── Admins: full access
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "offerings: student read"  ON public.class_offerings;
DROP POLICY IF EXISTS "offerings: teacher read"  ON public.class_offerings;
DROP POLICY IF EXISTS "offerings: admin all"     ON public.class_offerings;

CREATE POLICY "offerings: student read"
  ON public.class_offerings FOR SELECT
  USING (
    id = ANY(my_enrolled_offering_ids())
    OR teacher_id = auth.uid()
    OR is_admin()
  );

CREATE POLICY "offerings: admin write"
  ON public.class_offerings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- class_slots
-- ─── Students: read slots for their enrolled offerings
-- ─── Teachers: read slots for their assigned offerings
-- ─── Admins: full access
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "slots: read"       ON public.class_slots;
DROP POLICY IF EXISTS "slots: admin all"  ON public.class_slots;

CREATE POLICY "slots: read"
  ON public.class_slots FOR SELECT
  USING (
    offering_id = ANY(my_enrolled_offering_ids())
    OR offering_id = ANY(my_teacher_offering_ids())
    OR is_admin()
  );

CREATE POLICY "slots: admin write"
  ON public.class_slots FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- enrollments
-- ─── Students: own rows
-- ─── Teachers: rows where the offering belongs to them
-- ─── Admins: all rows
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "enrollments: read"      ON public.enrollments;
DROP POLICY IF EXISTS "enrollments: admin all" ON public.enrollments;

CREATE POLICY "enrollments: read"
  ON public.enrollments FOR SELECT
  USING (
    student_id = auth.uid()
    OR offering_id = ANY(my_teacher_offering_ids())
    OR is_admin()
  );

CREATE POLICY "enrollments: admin write"
  ON public.enrollments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- attendance
-- ─── Students: own rows only
-- ─── Teachers: rows for students in their offerings (via slot → offering → teacher_id)
-- ─── Admins: full access
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "attendance: read"      ON public.attendance;
DROP POLICY IF EXISTS "attendance: admin all" ON public.attendance;

CREATE POLICY "attendance: student read"
  ON public.attendance FOR SELECT
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.class_slots cs
      JOIN public.class_offerings co ON co.id = cs.offering_id
      WHERE cs.id = attendance.slot_id AND co.teacher_id = auth.uid()
    )
    OR is_admin()
  );

-- Admin can write; teachers can write for their slots (attendance marking)
CREATE POLICY "attendance: admin+teacher write"
  ON public.attendance FOR INSERT
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.class_slots cs
      JOIN public.class_offerings co ON co.id = cs.offering_id
      WHERE cs.id = slot_id AND co.teacher_id = auth.uid()
    )
  );

CREATE POLICY "attendance: admin+teacher update"
  ON public.attendance FOR UPDATE
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.class_slots cs
      JOIN public.class_offerings co ON co.id = cs.offering_id
      WHERE cs.id = attendance.slot_id AND co.teacher_id = auth.uid()
    )
  );

CREATE POLICY "attendance: admin delete"
  ON public.attendance FOR DELETE
  USING (is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- notes
-- ─── Students: notes for their enrolled offerings only
-- ─── Teachers: read all notes for their offerings; write their own notes
-- ─── Admins: full access
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "notes: read"      ON public.notes;
DROP POLICY IF EXISTS "notes: admin all" ON public.notes;

CREATE POLICY "notes: read"
  ON public.notes FOR SELECT
  USING (
    offering_id = ANY(my_enrolled_offering_ids())
    OR offering_id = ANY(my_teacher_offering_ids())
    OR is_admin()
  );

-- Teachers can upload notes for their own offerings
CREATE POLICY "notes: teacher insert"
  ON public.notes FOR INSERT
  WITH CHECK (
    offering_id = ANY(my_teacher_offering_ids())
    OR is_admin()
  );

-- Teachers can delete their own notes; admin can delete any
CREATE POLICY "notes: teacher+admin delete"
  ON public.notes FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR is_admin()
  );


-- ═══════════════════════════════════════════════════════════════════════════
-- study_sessions
-- ─── Students: own rows only (no teacher/admin access needed)
-- ─── Admins: read all (for analytics)
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "study_sessions: own"       ON public.study_sessions;
DROP POLICY IF EXISTS "study_sessions: admin read" ON public.study_sessions;

CREATE POLICY "study_sessions: own"
  ON public.study_sessions FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "study_sessions: admin read"
  ON public.study_sessions FOR SELECT
  USING (is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- UNIQUE CONSTRAINT: prevent duplicate attendance records
-- (upsert in db.ts relies on this conflict target)
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS attendance_student_slot_date_unique;

ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_student_slot_date_unique
  UNIQUE (student_id, slot_id, session_date);
