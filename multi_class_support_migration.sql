-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario Migration: Multi-Class Support for Students & Teachers
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- SUMMARY OF CAPABILITIES:
-- 1. Student Dashboard:
--    - Displays all classes scheduled for the student today (sorted by start time)
--    - Fully handles simultaneous/concurrent class slots (each gets an independent card,
--      independent live countdown, independent "Join Now" button, and independent attendance marking)
--    - Independent per-class states: Upcoming (live countdown), Time Reached + Link (Green Join button),
--      Time Reached + No Link (Disabled "Waiting for teacher to add link"), Finished (Visually muted)
-- 
-- 2. Teacher Dashboard:
--    - Detects concurrent class slots running at the same time (e.g. English Grade 9 & Grade 10)
--    - Displays how many classes run in the slot and lists their details
--    - One-time meeting link input that saves across all concurrent classes via upsertSessionLinkBatch
--    - Optional per-class overrides for custom links per section
--    - Preserves per-class per-student attendance recording and admin reporting
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Ensure class_session_links table exists with primary key (slot_id, session_date)
CREATE TABLE IF NOT EXISTS public.class_session_links (
  id UUID DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES public.class_slots(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  link_url TEXT NOT NULL,
  offering_id UUID REFERENCES public.class_offerings(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  link_updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  link_updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  link_updated_by_role TEXT DEFAULT 'teacher',
  substitute_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  substitute_teacher_name TEXT,
  batch_group_id TEXT, -- Optional identifier grouping concurrent slots updated in a single action
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (slot_id, session_date)
);

-- 2. Add batch_group_id column if table already exists without it
ALTER TABLE public.class_session_links 
  ADD COLUMN IF NOT EXISTS batch_group_id TEXT;

-- 3. High-performance indexes for concurrent slot queries and realtime subscriptions
CREATE INDEX IF NOT EXISTS idx_class_session_links_slot_date 
  ON public.class_session_links (slot_id, session_date);

CREATE INDEX IF NOT EXISTS idx_class_session_links_session_date 
  ON public.class_session_links (session_date);

CREATE INDEX IF NOT EXISTS idx_class_session_links_batch_group 
  ON public.class_session_links (batch_group_id) 
  WHERE batch_group_id IS NOT NULL;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.class_session_links ENABLE ROW LEVEL SECURITY;

-- 5. Helper function: Get teacher offering IDs for authenticated user (if not exists)
CREATE OR REPLACE FUNCTION public.my_teacher_offering_ids()
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT ARRAY(
    SELECT o.id 
    FROM public.class_offerings o
    JOIN public.teachers t ON t.id = o.teacher_id
    WHERE t.profile_id = auth.uid()
  );
$$;

-- Helper function: Check if current user is admin (if not exists)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

-- 6. RLS Policies for class_session_links
-- Anyone authenticated or student can read class session links for today's classes
DROP POLICY IF EXISTS "Allow authenticated read on class_session_links" ON public.class_session_links;
CREATE POLICY "Allow authenticated read on class_session_links"
  ON public.class_session_links FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on class_session_links" ON public.class_session_links;
CREATE POLICY "Allow anon read on class_session_links"
  ON public.class_session_links FOR SELECT
  TO anon
  USING (true);

-- Admins and teachers can insert session links
DROP POLICY IF EXISTS "session_links: admin or teacher insert" ON public.class_session_links;
CREATE POLICY "session_links: admin or teacher insert"
  ON public.class_session_links FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin() OR
    offering_id = ANY(my_teacher_offering_ids()) OR
    slot_id IN (SELECT id FROM public.class_slots WHERE offering_id = ANY(my_teacher_offering_ids())) OR
    created_by = auth.uid()
  );

-- Admins and teachers can update session links
DROP POLICY IF EXISTS "session_links: admin or teacher update" ON public.class_session_links;
CREATE POLICY "session_links: admin or teacher update"
  ON public.class_session_links FOR UPDATE
  TO authenticated
  USING (
    is_admin() OR
    offering_id = ANY(my_teacher_offering_ids()) OR
    slot_id IN (SELECT id FROM public.class_slots WHERE offering_id = ANY(my_teacher_offering_ids())) OR
    created_by = auth.uid()
  )
  WITH CHECK (
    is_admin() OR
    offering_id = ANY(my_teacher_offering_ids()) OR
    slot_id IN (SELECT id FROM public.class_slots WHERE offering_id = ANY(my_teacher_offering_ids())) OR
    created_by = auth.uid()
  );

-- Admins and teachers can delete session links
DROP POLICY IF EXISTS "session_links: admin or teacher delete" ON public.class_session_links;
CREATE POLICY "session_links: admin or teacher delete"
  ON public.class_session_links FOR DELETE
  TO authenticated
  USING (
    is_admin() OR
    offering_id = ANY(my_teacher_offering_ids()) OR
    slot_id IN (SELECT id FROM public.class_slots WHERE offering_id = ANY(my_teacher_offering_ids())) OR
    created_by = auth.uid()
  );

-- 7. Ensure attendance table has unique constraint on (student_id, slot_id, session_date)
-- to keep attendance strictly independent per-class per-student
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_slot_session 
  ON public.attendance (student_id, slot_id, session_date);

-- Enable Supabase Realtime publication on class_session_links so students immediately 
-- receive link updates when teachers post or edit links
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.class_session_links;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- table already in publication
END $$;
