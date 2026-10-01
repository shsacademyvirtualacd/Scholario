-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Role-Based Web Push Notifications & Scheduled Classes Migration
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this in the Supabase Dashboard -> SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Extensions ────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ─── 2. Push Subscriptions Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text CHECK (role IN ('student', 'teacher', 'admin', 'staff')),
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  device_info text,
  subscription_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON public.push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subs_role ON public.push_subscriptions(role);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions: own select" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions: own insert" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions: own update" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions: own delete" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions: service_role full" ON public.push_subscriptions;

CREATE POLICY "push_subscriptions: own select"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions: own insert"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions: own update"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions: own delete"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions: service_role full"
  ON public.push_subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── 3. Notifications Table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  message text,
  type text NOT NULL DEFAULT 'general',
  url text,
  severity text DEFAULT 'normal',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure user_id column exists if table was created in prior schema
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'user_id') THEN
    ALTER TABLE public.notifications ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'body') THEN
    ALTER TABLE public.notifications ADD COLUMN body text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'url') THEN
    ALTER TABLE public.notifications ADD COLUMN url text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications(recipient_id) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications: own select" ON public.notifications;
DROP POLICY IF EXISTS "notifications: own update" ON public.notifications;
DROP POLICY IF EXISTS "notifications: own delete" ON public.notifications;
DROP POLICY IF EXISTS "notifications: service_role full" ON public.notifications;

CREATE POLICY "notifications: own select"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = recipient_id);

CREATE POLICY "notifications: own update"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = recipient_id);

CREATE POLICY "notifications: own delete"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = recipient_id);

CREATE POLICY "notifications: service_role full"
  ON public.notifications FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable Realtime replication for instant in-app updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ─── 4. Classes Table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject text NOT NULL,
  batch text,
  scheduled_start timestamptz NOT NULL,
  class_link text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  reminder_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON public.classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_schedule ON public.classes(scheduled_start, reminder_sent);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "classes: authenticated read" ON public.classes;
DROP POLICY IF EXISTS "classes: teacher update link or status" ON public.classes;
DROP POLICY IF EXISTS "classes: service_role full" ON public.classes;

CREATE POLICY "classes: authenticated read"
  ON public.classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "classes: teacher update link or status"
  ON public.classes FOR UPDATE
  TO authenticated
  USING (auth.uid() = teacher_id OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')))
  WITH CHECK (auth.uid() = teacher_id OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')));

CREATE POLICY "classes: service_role full"
  ON public.classes FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── 5. Trigger Functions: Class Started / Link Added ─────────────────────
CREATE OR REPLACE FUNCTION public.handle_class_link_or_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_name text := 'Teacher';
  v_batch_name   text := COALESCE(NEW.batch, 'All Students');
  v_class_url    text := COALESCE(NEW.class_link, '/student/schedule');
  v_student_rec  RECORD;
  v_admin_rec    RECORD;
BEGIN
  IF (
    (COALESCE(OLD.class_link, '') = '' AND COALESCE(NEW.class_link, '') <> '')
    OR
    (COALESCE(OLD.status, '') <> 'live' AND NEW.status = 'live')
  ) THEN

    IF NEW.teacher_id IS NOT NULL THEN
      SELECT full_name INTO v_teacher_name
      FROM public.profiles
      WHERE id = NEW.teacher_id;
      IF v_teacher_name IS NULL OR v_teacher_name = '' THEN
        v_teacher_name := 'Your Instructor';
      END IF;
    END IF;

    -- a) Notify Enrolled Students
    FOR v_student_rec IN
      SELECT p.id AS student_id
      FROM public.profiles p
      WHERE p.role = 'student'
        AND (
          v_batch_name = 'All Students'
          OR p.grade = v_batch_name
          OR p.class_id = v_batch_name
          OR (p.stream IS NOT NULL AND p.stream = v_batch_name)
          OR EXISTS (
            SELECT 1 FROM public.enrollments e
            JOIN public.class_offerings co ON e.offering_id = co.id
            JOIN public.subjects s ON co.subject_id = s.id
            WHERE e.student_id = p.id AND s.name ILIKE ('%' || NEW.subject || '%')
          )
        )
    LOOP
      INSERT INTO public.notifications (
        user_id,
        recipient_id,
        title,
        body,
        message,
        type,
        url,
        is_read
      ) VALUES (
        v_student_rec.student_id,
        v_student_rec.student_id,
        NEW.subject || ' Class Started',
        'Your ' || NEW.subject || ' class with ' || v_teacher_name || ' has started. Tap to join.',
        'Your ' || NEW.subject || ' class with ' || v_teacher_name || ' has started. Tap to join.',
        'class_started',
        v_class_url,
        false
      );
    END LOOP;

    -- b) Notify All Admins
    FOR v_admin_rec IN
      SELECT id AS admin_id FROM public.profiles WHERE role = 'admin'
    LOOP
      INSERT INTO public.notifications (
        user_id,
        recipient_id,
        title,
        body,
        message,
        type,
        url,
        is_read
      ) VALUES (
        v_admin_rec.admin_id,
        v_admin_rec.admin_id,
        'Live Class: ' || NEW.subject,
        v_teacher_name || ' has started ' || NEW.subject || ' class for ' || v_batch_name || '.',
        v_teacher_name || ' has started ' || NEW.subject || ' class for ' || v_batch_name || '.',
        'admin_live_alert',
        '/admin/schedule',
        false
      );
    END LOOP;

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_class_link_or_status ON public.classes;
CREATE TRIGGER trg_class_link_or_status
  AFTER UPDATE OR INSERT ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_class_link_or_status_change();

-- ─── 6. pg_cron Teacher 10-Minute Reminder Job ───────────────────────────
CREATE OR REPLACE FUNCTION public.send_upcoming_teacher_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class RECORD;
BEGIN
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
    INSERT INTO public.notifications (
      user_id,
      recipient_id,
      title,
      body,
      message,
      type,
      url,
      is_read
    ) VALUES (
      v_class.teacher_id,
      v_class.teacher_id,
      v_class.subject || ' Class Starting Soon',
      'Your ' || v_class.subject || ' class starts in 10 minutes. Add the class link.',
      'Your ' || v_class.subject || ' class starts in 10 minutes. Add the class link.',
      'teacher_reminder',
      '/teacher/schedule',
      false
    );

    UPDATE public.classes
    SET reminder_sent = true,
        updated_at = now()
    WHERE id = v_class.id;

  END LOOP;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('teacher-10min-class-reminders') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'teacher-10min-class-reminders');
    PERFORM cron.schedule(
      'teacher-10min-class-reminders',
      '* * * * *',
      'SELECT public.send_upcoming_teacher_reminders()'
    );
  END IF;
END $$;
