-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Automatic Scheduled Class Reminders (pg_cron + pg_net + Triggers)
-- Timezone: Asia/Karachi (PKT)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Enable Required Extensions ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─── 2. Create notification_log Table with Exact Schema & Types ─────────────
-- Columns:
--   id: uuid default gen_random_uuid()
--   user_id: uuid (foreign key to profiles/auth.users)
--   class_id: uuid (clean foreign key to classes / class_slots)
--   notify_date: date (clean date, e.g. 2026-10-01 in PKT)
--   type: text ('student_class_reminder', 'student_wait_link', 'student_exam_reminder', 'teacher_missing_link', 'admin_missing_link')
--   count: int (tracks number of 5-minute interval reminders sent)
--   last_sent_at: timestamptz (timestamp of the last reminder sent)
--   UNIQUE(user_id, class_id, notify_date, type)
CREATE TABLE IF NOT EXISTS public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id uuid NOT NULL,
  notify_date date NOT NULL,
  type text NOT NULL,
  count int NOT NULL DEFAULT 1,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_notification_log_user_class_date_type UNIQUE (user_id, class_id, notify_date, type)
);

CREATE INDEX IF NOT EXISTS idx_notification_log_lookup 
  ON public.notification_log(user_id, class_id, notify_date, type);
CREATE INDEX IF NOT EXISTS idx_notification_log_last_sent 
  ON public.notification_log(last_sent_at);

-- RLS on notification_log
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_log: user read own" ON public.notification_log;
DROP POLICY IF EXISTS "notification_log: service role full" ON public.notification_log;

CREATE POLICY "notification_log: user read own"
  ON public.notification_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "notification_log: service role full"
  ON public.notification_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── 3. Function to Invoke class-reminders Edge Function via pg_net ────────
-- Replaces placeholder URL and anon/service key from Supabase vault or config
CREATE OR REPLACE FUNCTION public.trigger_class_reminders_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_url text;
  v_cron_secret text;
  v_request_id bigint;
BEGIN
  -- We read project URL and cron secret from public config or vault
  -- By default uses current project Supabase endpoint
  SELECT coalesce(current_setting('app.settings.supabase_url', true), 'https://YOUR_PROJECT_REF.supabase.co') INTO v_project_url;
  SELECT coalesce(current_setting('app.settings.cron_secret', true), '') INTO v_cron_secret;

  -- Fire HTTP POST via pg_net (asynchronous, non-blocking)
  SELECT net.http_post(
    url := v_project_url || '/functions/v1/class-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_cron_secret
    ),
    body := jsonb_build_object(
      'triggered_at', now() AT TIME ZONE 'Asia/Karachi',
      'source', 'pg_cron'
    ),
    timeout_milliseconds := 15000
  ) INTO v_request_id;
END;
$$;

-- ─── 4. Schedule pg_cron to Run Every Minute ───────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedule older versions if present to avoid multiple concurrent executions
    PERFORM cron.unschedule('scholario-class-reminders-every-minute') 
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scholario-class-reminders-every-minute');

    PERFORM cron.schedule(
      'scholario-class-reminders-every-minute',
      '* * * * *',
      'SELECT public.trigger_class_reminders_cron()'
    );
  END IF;
END $$;

-- ─── 5. Database Trigger: Instant Notification When Teacher Adds Link ───────
-- When a teacher updates or adds class_link on public.classes or public.class_session_links,
-- immediately notify admins AND students.
CREATE OR REPLACE FUNCTION public.handle_teacher_link_added_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_name text := 'Instructor';
  v_subject_name text := 'Class';
  v_batch_name   text := 'All Students';
  v_class_id     uuid;
  v_class_link   text;
  v_student_rec  RECORD;
  v_admin_rec    RECORD;
  v_en_msg       text;
  v_ur_msg       text;
  v_combined_msg text;
  v_today_date   date;
BEGIN
  -- Check if class_link was added / changed from empty to non-empty
  IF (COALESCE(OLD.class_link, '') = '' AND COALESCE(NEW.class_link, '') <> '') THEN
    v_class_id   := NEW.id;
    v_class_link := NEW.class_link;
    v_today_date := (now() AT TIME ZONE 'Asia/Karachi')::date;
    v_subject_name := COALESCE(NEW.subject, 'Class');
    v_batch_name   := COALESCE(NEW.batch, 'All Students');

    -- Resolve teacher name
    IF NEW.teacher_id IS NOT NULL THEN
      SELECT COALESCE(full_name, 'Teacher') INTO v_teacher_name
      FROM public.profiles
      WHERE id = NEW.teacher_id;
    END IF;

    -- Formulate exact required message templates
    v_en_msg := v_teacher_name || ' added the link for ' || v_subject_name || ' class, join now';
    v_ur_msg := 'سر ' || v_teacher_name || ' نے ' || v_subject_name || ' کلاس کا لنک شامل کر دیا ہے، ابھی جوائن کریں';
    v_combined_msg := v_en_msg || chr(10) || v_ur_msg;

    -- 1) Instantly notify Admins
    FOR v_admin_rec IN
      SELECT id FROM public.profiles WHERE role = 'admin'
    LOOP
      INSERT INTO public.notifications (
        id,
        user_id,
        recipient_id,
        class_id,
        notify_date,
        type,
        title,
        body,
        message,
        url,
        is_read
      ) VALUES (
        gen_random_uuid(),
        v_admin_rec.id,
        v_admin_rec.id,
        v_class_id,
        v_today_date,
        'link_added',
        v_subject_name || ' Link Added',
        v_teacher_name || ' added the link for ' || v_subject_name || ' (' || v_batch_name || ').',
        v_teacher_name || ' added the link for ' || v_subject_name || ' (' || v_batch_name || ').',
        '/admin/schedule',
        false
      );
    END LOOP;

    -- 2) Instantly notify Enrolled Students of that class
    FOR v_student_rec IN
      SELECT id FROM public.profiles
      WHERE role = 'student'
        AND (
          v_batch_name = 'All Students'
          OR grade = v_batch_name
          OR class_id = v_batch_name
          OR EXISTS (
            SELECT 1 FROM public.enrollments e
            JOIN public.class_offerings co ON e.offering_id = co.id
            JOIN public.subjects s ON co.subject_id = s.id
            WHERE e.student_id = profiles.id AND s.name ILIKE ('%' || v_subject_name || '%')
          )
        )
    LOOP
      INSERT INTO public.notifications (
        id,
        user_id,
        recipient_id,
        class_id,
        notify_date,
        type,
        title,
        body,
        message,
        url,
        is_read
      ) VALUES (
        gen_random_uuid(),
        v_student_rec.id,
        v_student_rec.id,
        v_class_id,
        v_today_date,
        'link_added',
        v_subject_name || ' Link Added | کلاس لنک',
        v_combined_msg,
        v_combined_msg,
        v_class_link,
        false
      );
    END LOOP;

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_teacher_added_link ON public.classes;
CREATE TRIGGER trg_teacher_added_link
  AFTER UPDATE OR INSERT ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_teacher_link_added_trigger();
