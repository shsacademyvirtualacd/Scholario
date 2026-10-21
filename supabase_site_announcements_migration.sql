-- =============================================================================
-- Migration: Site-wide Announcement Banner System
-- Table: public.site_announcements
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.site_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  message TEXT NOT NULL CHECK (char_length(message) <= 300),
  type TEXT NOT NULL DEFAULT 'success' CHECK (type IN ('info', 'success', 'warning', 'urgent')),
  audience TEXT[] NOT NULL DEFAULT ARRAY['student', 'teacher', 'admin']::TEXT[],
  start_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_dismissible BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast retrieval of live announcements
CREATE INDEX IF NOT EXISTS idx_site_announcements_active_dates 
  ON public.site_announcements (is_active, start_at, end_at);

CREATE INDEX IF NOT EXISTS idx_site_announcements_audience 
  ON public.site_announcements USING GIN (audience);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_site_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_site_announcements_updated_at ON public.site_announcements;
CREATE TRIGGER trigger_site_announcements_updated_at
  BEFORE UPDATE ON public.site_announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_site_announcements_updated_at();

-- Enable RLS
ALTER TABLE public.site_announcements ENABLE ROW LEVEL SECURITY;

-- Drop previous policies if re-running
DROP POLICY IF EXISTS "site_announcements: authenticated select active" ON public.site_announcements;
DROP POLICY IF EXISTS "site_announcements: admin select all" ON public.site_announcements;
DROP POLICY IF EXISTS "site_announcements: admin insert" ON public.site_announcements;
DROP POLICY IF EXISTS "site_announcements: admin update" ON public.site_announcements;
DROP POLICY IF EXISTS "site_announcements: admin delete" ON public.site_announcements;

-- 1. All authenticated users can SELECT active rows
CREATE POLICY "site_announcements: authenticated select active"
  ON public.site_announcements FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (start_at IS NULL OR start_at <= now())
    AND (end_at IS NULL OR end_at >= now())
  );

-- 2. Admins can view ALL rows (active, inactive, future scheduled, expired)
CREATE POLICY "site_announcements: admin select all"
  ON public.site_announcements FOR SELECT
  TO authenticated
  USING (
    (public.is_admin())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.roster WHERE profile_id = auth.uid() AND role = 'admin')
  );

-- 3. Only admins can INSERT
CREATE POLICY "site_announcements: admin insert"
  ON public.site_announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    (public.is_admin())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.roster WHERE profile_id = auth.uid() AND role = 'admin')
  );

-- 4. Only admins can UPDATE
CREATE POLICY "site_announcements: admin update"
  ON public.site_announcements FOR UPDATE
  TO authenticated
  USING (
    (public.is_admin())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.roster WHERE profile_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    (public.is_admin())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.roster WHERE profile_id = auth.uid() AND role = 'admin')
  );

-- 5. Only admins can DELETE
CREATE POLICY "site_announcements: admin delete"
  ON public.site_announcements FOR DELETE
  TO authenticated
  USING (
    (public.is_admin())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.roster WHERE profile_id = auth.uid() AND role = 'admin')
  );

-- Realtime publication registration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'site_announcements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_announcements;
  END IF;
END $$;

-- Default announcement to seed
INSERT INTO public.site_announcements (
  id,
  title,
  message,
  type,
  audience,
  start_at,
  end_at,
  is_active,
  is_dismissible
) VALUES (
  '00000000-0000-4000-a000-000000000099',
  'Issues resolved!',
  'Please check every part of your dashboard. If you find any issue, contact +923222314436.',
  'success',
  ARRAY['student', 'teacher', 'admin'],
  now(),
  NULL,
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  message = EXCLUDED.message,
  type = EXCLUDED.type,
  audience = EXCLUDED.audience,
  is_active = EXCLUDED.is_active,
  is_dismissible = EXCLUDED.is_dismissible;
