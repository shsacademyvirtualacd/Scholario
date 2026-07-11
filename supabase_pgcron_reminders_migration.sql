-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — pg_cron + Class Reminder Infrastructure
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Step 1: Enable pg_cron extension ─────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ─── Step 2: Dedup log table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.class_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES public.class_slots(id) ON DELETE CASCADE,
  reminder_date date NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slot_id, reminder_date)
);

-- ─── Step 3: plpgsql reminder function ────────────────────────────────────
--
-- TIMEZONE LOGIC:
-- The Supabase database session runs in UTC by default.
-- We explicitly convert now() to 'Asia/Karachi' (UTC+5) for all
-- date/time comparisons using:  now() AT TIME ZONE 'Asia/Karachi'
--
-- DAY-OF-WEEK MAPPING:
-- Postgres EXTRACT(DOW ...) returns 0=Sunday, 1=Monday ... 6=Saturday.
-- class_slots.day_of_week uses 0=Monday, 1=Tuesday ... 5=Saturday.
-- Conversion: app_dow = (pg_dow + 6) % 7
--   pg_dow=0(Sun) → app_dow=6 (not used, no Sunday slots)
--   pg_dow=1(Mon) → app_dow=0 ✓
--   pg_dow=2(Tue) → app_dow=1 ✓
--   pg_dow=3(Wed) → app_dow=2 ✓
--   pg_dow=4(Thu) → app_dow=3 ✓
--   pg_dow=5(Fri) → app_dow=4 ✓
--   pg_dow=6(Sat) → app_dow=5 ✓

CREATE OR REPLACE FUNCTION public.send_class_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER          -- runs as owner (postgres), bypasses RLS
SET search_path = public  -- security best practice for SECURITY DEFINER
AS $$
DECLARE
  karachi_now    timestamp;
  karachi_date   date;
  karachi_time   time;
  app_dow        integer;
  slot_row       RECORD;
  subject_label  text;
  time_label     text;
  day_label      text;
  day_names      text[] := ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
BEGIN
  -- All comparisons in Asia/Karachi
  karachi_now  := now() AT TIME ZONE 'Asia/Karachi';
  karachi_date := karachi_now::date;
  karachi_time := karachi_now::time;

  -- Convert Postgres DOW (0=Sun) to app convention (0=Mon)
  app_dow := (EXTRACT(DOW FROM karachi_now)::integer + 6) % 7;

  -- Find class_slots where:
  --   1. day_of_week matches today (app convention)
  --   2. start_time is between 9 and 10 minutes from now (Karachi time)
  --   3. slot is not cancelled
  --   4. slot has an offering (needed to find students/teacher)
  --   5. No existing dedup log row for this (slot_id, today)
  FOR slot_row IN
    SELECT
      cs.id         AS slot_id,
      cs.offering_id,
      cs.start_time,
      cs.custom_title,
      co.teacher_id,
      s.name        AS subject_name,
      cs.room_or_link
    FROM class_slots cs
    JOIN class_offerings co ON cs.offering_id = co.id
    LEFT JOIN subjects s ON co.subject_id = s.id
    WHERE cs.day_of_week = app_dow
      AND cs.is_cancelled = false
      AND cs.offering_id IS NOT NULL
      AND cs.start_time - karachi_time BETWEEN interval '14 minutes' AND interval '15 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM class_reminder_log crl
        WHERE crl.slot_id = cs.id AND crl.reminder_date = karachi_date
      )
  LOOP
    subject_label := COALESCE(slot_row.custom_title, slot_row.subject_name, 'Class');
    time_label    := to_char(slot_row.start_time, 'HH12:MI AM');
    day_label     := day_names[app_dow + 1]; -- arrays are 1-indexed

    -- Insert notification for every enrolled student for this offering
    INSERT INTO notifications (recipient_id, type, title, message, severity, is_read)
    SELECT
      e.student_id,
      'class_reminder',
      'Class Starting Soon',
      subject_label || ' is starting in 15 minutes.',
      'normal',
      false
    FROM enrollments e
    WHERE e.offering_id = slot_row.offering_id;

    -- Insert notification for the assigned teacher (if exists)
    IF slot_row.teacher_id IS NOT NULL THEN
      INSERT INTO notifications (recipient_id, type, title, message, severity, is_read)
      VALUES (
        slot_row.teacher_id,
        'class_reminder',
        'Class Starting Soon',
        subject_label || ' is starting in 15 minutes.',
        'normal',
        false
      );
    END IF;

    -- Log to dedup table so this slot is never re-processed today
    INSERT INTO class_reminder_log (slot_id, reminder_date)
    VALUES (slot_row.slot_id, karachi_date);
  END LOOP;
END;
$$;

-- ─── Step 4: Schedule the cron job (every 1 minute) ──────────────────────
SELECT cron.schedule(
  'class-reminder-every-minute',  -- job name
  '* * * * *',                     -- every minute
  'SELECT public.send_class_reminders()'
);
