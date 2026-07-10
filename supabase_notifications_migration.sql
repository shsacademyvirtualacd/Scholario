-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Notifications Table & RLS Policies
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('announcement', 'class_reminder')) DEFAULT 'announcement',
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('normal', 'crucial')) DEFAULT 'normal',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications(recipient_id) WHERE is_read = false;

-- 4. Drop existing policies if any
DROP POLICY IF EXISTS "notifications: own select" ON public.notifications;
DROP POLICY IF EXISTS "notifications: own update" ON public.notifications;
DROP POLICY IF EXISTS "notifications: admin insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications: own delete" ON public.notifications;

-- 5. Recipient Policies: SELECT and UPDATE (mark read) own rows only. No cross-user access.
CREATE POLICY "notifications: own select"
  ON public.notifications FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "notifications: own update"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- 6. Admin Policies: INSERT (during announcement fan-out) and DELETE
CREATE POLICY "notifications: admin insert"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "notifications: own delete"
  ON public.notifications FOR DELETE
  USING (auth.uid() = recipient_id OR public.is_admin());
