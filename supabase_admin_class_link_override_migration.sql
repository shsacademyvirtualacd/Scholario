-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario Migration: Admin Class Link Add & Override on Behalf of Teachers
-- 
-- 1. Adds audit trail columns to class_slots and class_session_links:
--    - link_updated_by (UUID references profiles(id))
--    - link_updated_at (TIMESTAMPTZ)
--    - link_updated_by_role ('admin' | 'teacher')
--    - substitute_teacher_id (UUID references teachers(id))
--    - substitute_teacher_name (TEXT)
-- 
-- 2. Configures Supabase Row Level Security (RLS) policies:
--    - Admins have full INSERT/UPDATE/DELETE access on ALL class_slots and class_session_links
--    - Teachers maintain UPDATE access scoped only to their assigned classes/offerings
--    - Authenticated and anon users can SELECT session links for live class participation
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Enhance class_slots with audit trail and substitution fields
ALTER TABLE public.class_slots 
  ADD COLUMN IF NOT EXISTS link_updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS link_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS link_updated_by_role TEXT,
  ADD COLUMN IF NOT EXISTS substitute_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS substitute_teacher_name TEXT;

-- 2. Enhance class_session_links with audit trail and substitution fields
ALTER TABLE public.class_session_links 
  ADD COLUMN IF NOT EXISTS link_updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS link_updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS link_updated_by_role TEXT,
  ADD COLUMN IF NOT EXISTS substitute_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS substitute_teacher_name TEXT;

-- 3. Row Level Security for class_slots
ALTER TABLE public.class_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "slots: admin write" ON public.class_slots;
CREATE POLICY "slots: admin write"
  ON public.class_slots FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "slots: teacher update own" ON public.class_slots;
CREATE POLICY "slots: teacher update own"
  ON public.class_slots FOR UPDATE
  TO authenticated
  USING (offering_id = ANY(my_teacher_offering_ids()))
  WITH CHECK (offering_id = ANY(my_teacher_offering_ids()));

-- 4. Row Level Security for class_session_links
ALTER TABLE public.class_session_links ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Allow authenticated insert on class_session_links" ON public.class_session_links;
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

DROP POLICY IF EXISTS "Allow authenticated update on class_session_links" ON public.class_session_links;
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

DROP POLICY IF EXISTS "Allow authenticated delete on class_session_links" ON public.class_session_links;
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

-- 5. Ensure realtime publication tracks both tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'class_session_links'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE class_session_links;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'class_slots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE class_slots;
  END IF;
END $$;
