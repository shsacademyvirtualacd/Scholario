-- 1. Drop blanket policies
DROP POLICY IF EXISTS "Allow public read/write access" ON public.attendance;
DROP POLICY IF EXISTS "Allow public read/write access" ON public.class_offerings;
DROP POLICY IF EXISTS "Allow public read/write access" ON public.class_slots;
DROP POLICY IF EXISTS "Allow public read/write access" ON public.enrollments;
DROP POLICY IF EXISTS "Allow public read/write access" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read/write access" ON public.study_sessions;
DROP POLICY IF EXISTS "Allow public read/write access" ON public.teachers;

-- 2. Enable RLS
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_reminder_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Policies for boards
DROP POLICY IF EXISTS "boards: read" ON public.boards;
DROP POLICY IF EXISTS "boards: admin all" ON public.boards;
CREATE POLICY "boards: read" ON public.boards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "boards: insert" ON public.boards FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "boards: update" ON public.boards FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "boards: delete" ON public.boards FOR DELETE USING (public.is_admin());

-- Policies for classes
DROP POLICY IF EXISTS "classes: read" ON public.classes;
DROP POLICY IF EXISTS "classes: admin all" ON public.classes;
CREATE POLICY "classes: read" ON public.classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "classes: insert" ON public.classes FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "classes: update" ON public.classes FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "classes: delete" ON public.classes FOR DELETE USING (public.is_admin());

-- Policies for subjects
DROP POLICY IF EXISTS "subjects: read" ON public.subjects;
DROP POLICY IF EXISTS "subjects: admin all" ON public.subjects;
CREATE POLICY "subjects: read" ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "subjects: insert" ON public.subjects FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "subjects: update" ON public.subjects FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "subjects: delete" ON public.subjects FOR DELETE USING (public.is_admin());

-- Policies for streams
DROP POLICY IF EXISTS "streams: read" ON public.streams;
DROP POLICY IF EXISTS "streams: admin all" ON public.streams;
CREATE POLICY "streams: read" ON public.streams FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "streams: insert" ON public.streams FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "streams: update" ON public.streams FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "streams: delete" ON public.streams FOR DELETE USING (public.is_admin());

-- Policies for class_subjects
DROP POLICY IF EXISTS "class_subjects: read" ON public.class_subjects;
DROP POLICY IF EXISTS "class_subjects: admin all" ON public.class_subjects;
CREATE POLICY "class_subjects: read" ON public.class_subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "class_subjects: insert" ON public.class_subjects FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "class_subjects: update" ON public.class_subjects FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "class_subjects: delete" ON public.class_subjects FOR DELETE USING (public.is_admin());

-- Policies for stream_subjects
DROP POLICY IF EXISTS "stream_subjects: read" ON public.stream_subjects;
DROP POLICY IF EXISTS "stream_subjects: admin all" ON public.stream_subjects;
CREATE POLICY "stream_subjects: read" ON public.stream_subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "stream_subjects: insert" ON public.stream_subjects FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "stream_subjects: update" ON public.stream_subjects FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "stream_subjects: delete" ON public.stream_subjects FOR DELETE USING (public.is_admin());

-- 2.2 For class_reminder_log
DROP POLICY IF EXISTS "class_reminder_log: admin all" ON public.class_reminder_log;
CREATE POLICY "class_reminder_log: admin all" ON public.class_reminder_log FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. Fix notes insert/update policy
DROP POLICY IF EXISTS "notes: insert" ON public.notes;
DROP POLICY IF EXISTS "notes: update" ON public.notes;

CREATE POLICY "notes: insert"
  ON public.notes FOR INSERT
  WITH CHECK (
    (offering_id = ANY(public.my_teacher_offering_ids()))
    OR public.is_admin()
  );

CREATE POLICY "notes: update"
  ON public.notes FOR UPDATE
  USING (
    (offering_id = ANY(public.my_teacher_offering_ids()))
    OR public.is_admin()
  )
  WITH CHECK (
    (offering_id = ANY(public.my_teacher_offering_ids()))
    OR public.is_admin()
  );

NOTIFY pgrst, 'reload schema';
