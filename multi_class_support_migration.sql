-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario Migration: Multi-Class Support (Corrected & Hardened)
-- ═══════════════════════════════════════════════════════════════════════════
-- Summary of Fixes:
-- 1. Schema compatibility: Does not assume 't.profile_id'. Uses existing, verified
--    public.my_teacher_offering_ids() and public.is_admin() helper functions.
-- 2. Security hardening: Removed 'anon' SELECT policy on class_session_links.
--    Only 'authenticated' users can view meeting links.
-- 3. Idempotent & Safe: Uses IF NOT EXISTS, DROP POLICY IF EXISTS, and handles
--    pre-index deduplication on attendance before creating the unique index.
-- 4. Preserves per-class independent attendance tracking and Supabase Realtime sync.
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

-- 5. Security Fix: REMOVE anon access; only authenticated users can read meeting links
DROP POLICY IF EXISTS "Allow anon read on class_session_links" ON public.class_session_links;

DROP POLICY IF EXISTS "Allow authenticated read on class_session_links" ON public.class_session_links;
CREATE POLICY "Allow authenticated read on class_session_links"
  ON public.class_session_links FOR SELECT
  TO authenticated
  USING (true);

-- 6. Write policies for class_session_links
-- Uses existing public.is_admin() and public.my_teacher_offering_ids()
DROP POLICY IF EXISTS "Allow authenticated insert on class_session_links" ON public.class_session_links;
DROP POLICY IF EXISTS "session_links: admin or teacher insert" ON public.class_session_links;
CREATE POLICY "session_links: admin or teacher insert"
  ON public.class_session_links FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() OR
    offering_id = ANY(public.my_teacher_offering_ids()) OR
    slot_id IN (SELECT id FROM public.class_slots WHERE offering_id = ANY(public.my_teacher_offering_ids())) OR
    created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Allow authenticated update on class_session_links" ON public.class_session_links;
DROP POLICY IF EXISTS "session_links: admin or teacher update" ON public.class_session_links;
CREATE POLICY "session_links: admin or teacher update"
  ON public.class_session_links FOR UPDATE
  TO authenticated
  USING (
    public.is_admin() OR
    offering_id = ANY(public.my_teacher_offering_ids()) OR
    slot_id IN (SELECT id FROM public.class_slots WHERE offering_id = ANY(public.my_teacher_offering_ids())) OR
    created_by = auth.uid()
  )
  WITH CHECK (
    public.is_admin() OR
    offering_id = ANY(public.my_teacher_offering_ids()) OR
    slot_id IN (SELECT id FROM public.class_slots WHERE offering_id = ANY(public.my_teacher_offering_ids())) OR
    created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Allow authenticated delete on class_session_links" ON public.class_session_links;
DROP POLICY IF EXISTS "session_links: admin or teacher delete" ON public.class_session_links;
CREATE POLICY "session_links: admin or teacher delete"
  ON public.class_session_links FOR DELETE
  TO authenticated
  USING (
    public.is_admin() OR
    offering_id = ANY(public.my_teacher_offering_ids()) OR
    slot_id IN (SELECT id FROM public.class_slots WHERE offering_id = ANY(public.my_teacher_offering_ids())) OR
    created_by = auth.uid()
  );

-- 7. Deduplicate any existing duplicate attendance rows before creating unique index
WITH ranked_attendance AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY student_id, slot_id, session_date
           ORDER BY 
             CASE 
               WHEN status = 'present' THEN 1
               WHEN status = 'late' THEN 2
               WHEN status = 'pending' THEN 3
               ELSE 4 
             END,
             marked_at DESC NULLS LAST,
             id DESC
         ) AS rank_num
  FROM public.attendance
  WHERE slot_id IS NOT NULL 
    AND student_id IS NOT NULL 
    AND session_date IS NOT NULL
)
DELETE FROM public.attendance
WHERE id IN (
  SELECT id FROM ranked_attendance WHERE rank_num > 1
);

-- 8. Ensure unique index on attendance (student_id, slot_id, session_date)
-- to keep attendance strictly independent per-class per-student
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_slot_session 
  ON public.attendance (student_id, slot_id, session_date);

-- 9. Enable Supabase Realtime publication on class_session_links
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'class_session_links'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.class_session_links;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
