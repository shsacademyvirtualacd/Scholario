-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Fix Composite Key UUID Error & Add Clean Deduplication
-- ═══════════════════════════════════════════════════════════════════════════
-- Problem: Strings like `${classId}_${date}` were passed to UUID columns (code 22P02).
-- Solution: Keep id as uuid (gen_random_uuid()), separate deduplication into
-- dedicated columns (class_id, notify_date, type, user_id, dedupe_key),
-- add UNIQUE constraint for clean upserts, and safely handle existing rows.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Ensure Extensions ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 2. Upgrade public.notifications Table ────────────────────────────────
-- Ensure all target columns exist without modifying existing uuid id column
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS class_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS notify_date date;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS dedupe_key text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS body text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS url text;

-- ─── 3. Safe Cleanup of Existing Duplicate Rows Before Adding Constraints ──
-- Retain the latest notification record for any duplicate (user_id, class_id, notify_date, type)
WITH ranked_dups AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, class_id, notify_date, type
           ORDER BY created_at DESC, id DESC
         ) AS rn
  FROM public.notifications
  WHERE user_id IS NOT NULL
    AND class_id IS NOT NULL
    AND notify_date IS NOT NULL
)
DELETE FROM public.notifications
WHERE id IN (
  SELECT id FROM ranked_dups WHERE rn > 1
);

-- Retain the latest notification record for any duplicate non-empty dedupe_key
WITH ranked_keys AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY dedupe_key
           ORDER BY created_at DESC, id DESC
         ) AS rn
  FROM public.notifications
  WHERE dedupe_key IS NOT NULL AND dedupe_key <> ''
)
DELETE FROM public.notifications
WHERE id IN (
  SELECT id FROM ranked_keys WHERE rn > 1
);

-- ─── 4. Add Unique Constraints & Indexes ──────────────────────────────────
-- Drop old constraints if they exist
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS uq_notifications_user_class_date_type;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_dedupe_unique;

-- Unique composite constraint: allows clean upsert with onConflict: 'user_id,class_id,notify_date,type'
-- Note: When class_id or notify_date is NULL (such as for test_notification), standard SQL
-- treats NULL != NULL, allowing infinite independent test notifications without collisions.
ALTER TABLE public.notifications
  ADD CONSTRAINT uq_notifications_user_class_date_type
  UNIQUE (user_id, class_id, notify_date, type);

-- Unique index for single string dedupe_key when provided
DROP INDEX IF EXISTS idx_notifications_dedupe_key_unique;
CREATE UNIQUE INDEX idx_notifications_dedupe_key_unique
  ON public.notifications(dedupe_key)
  WHERE dedupe_key IS NOT NULL AND dedupe_key <> '';

-- Performance indexes for notifications queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_lookup
  ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_class_date
  ON public.notifications(class_id, notify_date);
CREATE INDEX IF NOT EXISTS idx_notifications_dedupe_key
  ON public.notifications(dedupe_key);

-- ─── 5. Update/Create live_sessions Table for Composite Safe Lookups ──────
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid,
  session_date date,
  session_key text,
  subject_id text,
  grade_id text,
  class_link text,
  status text NOT NULL DEFAULT 'live',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  teacher_id uuid,
  teacher_name text,
  subject_name text,
  offering_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS slot_id uuid;
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS session_date date;
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS session_key text;

-- Cleanup any duplicate session_key before unique index
WITH ranked_live AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY session_key
           ORDER BY updated_at DESC, id DESC
         ) AS rn
  FROM public.live_sessions
  WHERE session_key IS NOT NULL AND session_key <> ''
)
DELETE FROM public.live_sessions
WHERE id IN (
  SELECT id FROM ranked_live WHERE rn > 1
);

DROP INDEX IF EXISTS uq_live_sessions_session_key;
CREATE UNIQUE INDEX uq_live_sessions_session_key
  ON public.live_sessions(session_key)
  WHERE session_key IS NOT NULL AND session_key <> '';

CREATE INDEX IF NOT EXISTS idx_live_sessions_slot_id
  ON public.live_sessions(slot_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status
  ON public.live_sessions(status);

-- ─── 6. Re-check & Apply Complete RLS Policies on notifications ───────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications: own select" ON public.notifications;
DROP POLICY IF EXISTS "notifications: own update" ON public.notifications;
DROP POLICY IF EXISTS "notifications: own delete" ON public.notifications;
DROP POLICY IF EXISTS "notifications: authenticated insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications: service_role full" ON public.notifications;

-- 1) SELECT: Users can view their own notifications
CREATE POLICY "notifications: own select"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = recipient_id);

-- 2) UPDATE: Users can mark their own notifications as read
CREATE POLICY "notifications: own update"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = recipient_id);

-- 3) DELETE: Users can delete/dismiss their own notifications
CREATE POLICY "notifications: own delete"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = recipient_id);

-- 4) INSERT: Authenticated users can insert their own notifications or admins/teachers can send
CREATE POLICY "notifications: authenticated insert"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR auth.uid() = recipient_id 
    OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')))
  );

-- 5) ALL: Service role full access for Edge Functions, Triggers, and Backend workers
CREATE POLICY "notifications: service_role full"
  ON public.notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── 7. Live Sessions RLS ─────────────────────────────────────────────────
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "live_sessions: authenticated read" ON public.live_sessions;
DROP POLICY IF EXISTS "live_sessions: teacher/admin manage" ON public.live_sessions;
DROP POLICY IF EXISTS "live_sessions: service_role full" ON public.live_sessions;

CREATE POLICY "live_sessions: authenticated read"
  ON public.live_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "live_sessions: teacher/admin manage"
  ON public.live_sessions FOR ALL
  TO authenticated
  USING (
    auth.uid() = teacher_id
    OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')))
  )
  WITH CHECK (
    auth.uid() = teacher_id
    OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')))
  );

CREATE POLICY "live_sessions: service_role full"
  ON public.live_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── 8. Update pg_cron Teacher 10-Minute Reminder Job to Use Dedupe Schema ─
CREATE OR REPLACE FUNCTION public.send_upcoming_teacher_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class RECORD;
  v_today_date date;
BEGIN
  v_today_date := (now() AT TIME ZONE 'Asia/Karachi')::date;

  FOR v_class IN
    SELECT
      c.id,
      c.teacher_id,
      c.subject,
      c.batch,
      c.scheduled_start
    FROM public.classes c
    WHERE c.status = 'scheduled'
      AND c.reminder_sent = false
      AND c.teacher_id IS NOT NULL
      AND c.scheduled_start > now()
      AND c.scheduled_start <= (now() + interval '10 minutes')
  LOOP
    -- Insert teacher notification using clean separate dedupe columns:
    -- class_id (uuid), notify_date (date), type (text), user_id (uuid)
    -- id remains uuid (gen_random_uuid())
    INSERT INTO public.notifications (
      id,
      user_id,
      recipient_id,
      class_id,
      notify_date,
      type,
      dedupe_key,
      title,
      body,
      message,
      url,
      is_read
    ) VALUES (
      gen_random_uuid(),
      v_class.teacher_id,
      v_class.teacher_id,
      v_class.id,
      v_today_date,
      'teacher_reminder',
      'teacher_reminder_' || v_class.id::text || '_' || v_today_date::text,
      v_class.subject || ' Class Starting Soon',
      'Your ' || v_class.subject || ' class starts in 10 minutes. Add the class link.',
      'Your ' || v_class.subject || ' class starts in 10 minutes. Add the class link.',
      '/teacher/schedule',
      false
    )
    ON CONFLICT (user_id, class_id, notify_date, type) DO NOTHING;

    -- Mark reminder as sent on the class
    UPDATE public.classes
    SET reminder_sent = true,
        updated_at = now()
    WHERE id = v_class.id;

  END LOOP;
END;
$$;
