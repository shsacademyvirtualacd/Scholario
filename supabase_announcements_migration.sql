-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Announcements Table & RLS Policies
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Helper: get class IDs assigned to a teacher (via offerings and roster)
CREATE OR REPLACE FUNCTION public.my_teacher_class_ids()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT ARRAY(
    SELECT class_id FROM public.class_offerings WHERE teacher_id = auth.uid()
    UNION
    SELECT (unnest(class_ids))::uuid FROM public.roster WHERE profile_id = auth.uid()
  );
$$;

-- 2. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('normal', 'crucial')) DEFAULT 'normal',
  scope text NOT NULL CHECK (scope IN ('system', 'class')) DEFAULT 'system',
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  stream_id uuid REFERENCES public.streams(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_class_required_when_scope_class CHECK (
    scope = 'system' OR (scope = 'class' AND class_id IS NOT NULL)
  )
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 3. Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_announcements_scope_created ON public.announcements(scope, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_class_stream ON public.announcements(class_id, stream_id);

-- 4. Drop existing policies if any
DROP POLICY IF EXISTS "announcements: admin insert" ON public.announcements;
DROP POLICY IF EXISTS "announcements: admin select" ON public.announcements;
DROP POLICY IF EXISTS "announcements: admin delete" ON public.announcements;
DROP POLICY IF EXISTS "announcements: admin update" ON public.announcements;
DROP POLICY IF EXISTS "announcements: teacher select" ON public.announcements;
DROP POLICY IF EXISTS "announcements: student select" ON public.announcements;

-- 5. Admin Policies: full INSERT, SELECT (all), DELETE, UPDATE
CREATE POLICY "announcements: admin insert"
  ON public.announcements FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "announcements: admin select"
  ON public.announcements FOR SELECT
  USING (public.is_admin());

CREATE POLICY "announcements: admin delete"
  ON public.announcements FOR DELETE
  USING (public.is_admin());

CREATE POLICY "announcements: admin update"
  ON public.announcements FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. Teacher Policies: SELECT only — scope='system' OR (scope='class' AND class_id matches assigned class). No stream filtering. NO INSERT, NO DELETE.
CREATE POLICY "announcements: teacher select"
  ON public.announcements FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
    AND (
      scope = 'system'
      OR (scope = 'class' AND class_id = ANY(public.my_teacher_class_ids()))
    )
  );

-- 7. Student Policies: SELECT only — scope='system' OR (scope='class' AND class_id matches their class AND (stream_id IS NULL OR matches their stream)). NO INSERT, NO DELETE.
CREATE POLICY "announcements: student select"
  ON public.announcements FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
    AND (
      scope = 'system'
      OR (
        scope = 'class'
        AND class_id = (SELECT class_id FROM public.profiles WHERE id = auth.uid())
        AND (
          stream_id IS NULL
          OR stream_id = (SELECT stream_id FROM public.profiles WHERE id = auth.uid())
        )
      )
    )
  );
