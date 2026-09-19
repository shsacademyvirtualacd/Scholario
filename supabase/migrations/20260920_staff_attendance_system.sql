-- ==============================================================================
-- SCHOLARIO: REMOTE STAFF ATTENDANCE, SHIFTS & ACTIVITY VERIFICATION SYSTEM
-- Migration: 20260920_staff_attendance_system.sql
-- Description:
--   1. staff_shifts table (supports regular, split, and broken shifts with non-contiguous segments)
--   2. staff_attendance_logs table (login-based clock in/out, IP, device, idle verification, auto-clockout)
--   3. Automated auto_clock_out_expired_shifts() stored function
--   4. RLS security policies for staff self-management and administrator oversight
-- ==============================================================================

-- 1. Create staff_shifts table
CREATE TABLE IF NOT EXISTS public.staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shift_name TEXT NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('regular', 'split', 'broken')) DEFAULT 'regular',
  -- segments jsonb array: [{ "segment_index": 0, "name": "Morning Block", "start_time": "09:00", "end_time": "13:00" }, ...]
  segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- days of week: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun (or 0=Sun)
  days_of_week INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}'::INTEGER[],
  effective_date DATE DEFAULT CURRENT_DATE,
  grace_period_minutes INTEGER NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create staff_attendance_logs table
CREATE TABLE IF NOT EXISTS public.staff_attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES public.staff_shifts(id) ON DELETE SET NULL,
  segment_index INTEGER NOT NULL DEFAULT 0,
  clock_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('present', 'late', 'auto_clocked_out', 'absent')) DEFAULT 'present',
  ip_address TEXT,
  device_info TEXT,
  notes TEXT,
  idle_flagged BOOLEAN NOT NULL DEFAULT false,
  idle_minutes INTEGER NOT NULL DEFAULT 0,
  last_heartbeat_at TIMESTAMPTZ DEFAULT NOW(),
  total_active_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for fast real-time queries and daily aggregations
CREATE INDEX IF NOT EXISTS idx_staff_shifts_staff_id ON public.staff_shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_is_active ON public.staff_shifts(is_active);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_logs_staff_id ON public.staff_attendance_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_logs_shift_id ON public.staff_attendance_logs(shift_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_logs_clock_in ON public.staff_attendance_logs(clock_in_at);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_logs_status ON public.staff_attendance_logs(status);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_logs_idle_flagged ON public.staff_attendance_logs(idle_flagged);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_logs_active_session ON public.staff_attendance_logs(staff_id) WHERE clock_out_at IS NULL;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendance_logs ENABLE ROW LEVEL SECURITY;

-- Staff shifts policies
CREATE POLICY "Staff can view their own shifts"
ON public.staff_shifts FOR SELECT
USING (
  auth.uid() = staff_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage all staff shifts"
ON public.staff_shifts FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Staff attendance logs policies
CREATE POLICY "Staff can view their own attendance logs"
ON public.staff_attendance_logs FOR SELECT
USING (
  auth.uid() = staff_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Staff can insert their own attendance logs"
ON public.staff_attendance_logs FOR INSERT
WITH CHECK (
  auth.uid() = staff_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Staff can update their own active attendance logs"
ON public.staff_attendance_logs FOR UPDATE
USING (
  auth.uid() = staff_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage all staff attendance logs"
ON public.staff_attendance_logs FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Stored function: auto_clock_out_expired_shifts
-- Sweeps all open attendance logs where current time > scheduled segment end + grace period
CREATE OR REPLACE FUNCTION public.auto_clock_out_expired_shifts()
RETURNS TABLE (
  affected_log_id UUID,
  staff_id UUID,
  clocked_out_at TIMESTAMPTZ,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  now_pkt TIMESTAMPTZ := NOW() AT TIME ZONE 'Asia/Karachi';
  today_date DATE := (NOW() AT TIME ZONE 'Asia/Karachi')::DATE;
  seg RECORD;
  seg_end_time TIME;
  seg_end_timestamp TIMESTAMPTZ;
  grace_mins INT;
BEGIN
  FOR rec IN
    SELECT
      l.id AS log_id,
      l.staff_id,
      l.shift_id,
      l.segment_index,
      l.clock_in_at,
      l.notes,
      s.shift_name,
      s.shift_type,
      s.segments,
      s.grace_period_minutes
    FROM public.staff_attendance_logs l
    LEFT JOIN public.staff_shifts s ON l.shift_id = s.id
    WHERE l.clock_out_at IS NULL
  LOOP
    grace_mins := COALESCE(rec.grace_period_minutes, 15);
    
    -- Extract segment matching segment_index
    IF rec.segments IS NOT NULL AND jsonb_array_length(rec.segments) > 0 THEN
      -- Find segment by index or fallback to first
      FOR seg IN SELECT * FROM jsonb_to_recordset(rec.segments) AS x(segment_index INT, start_time TEXT, end_time TEXT, name TEXT)
      LOOP
        IF seg.segment_index = rec.segment_index OR seg.segment_index IS NULL THEN
          IF seg.end_time IS NOT NULL THEN
            seg_end_time := seg.end_time::TIME;
            -- Scheduled end time on the day of clock_in
            seg_end_timestamp := (rec.clock_in_at AT TIME ZONE 'Asia/Karachi')::DATE + seg_end_time;
            seg_end_timestamp := seg_end_timestamp AT TIME ZONE 'Asia/Karachi';
            
            -- Check if current time exceeds scheduled end + grace period
            IF now_pkt > (seg_end_timestamp + (grace_mins || ' minutes')::INTERVAL) THEN
              UPDATE public.staff_attendance_logs
              SET
                clock_out_at = seg_end_timestamp,
                status = 'auto_clocked_out',
                notes = COALESCE(notes, '') || ' [System: Auto clocked-out at scheduled segment end + grace period]',
                updated_at = NOW()
              WHERE id = rec.log_id;
              
              affected_log_id := rec.log_id;
              staff_id := rec.staff_id;
              clocked_out_at := seg_end_timestamp;
              reason := 'Exceeded shift segment end time (' || seg.end_time || ') + ' || grace_mins || 'm grace';
              RETURN NEXT;
            END IF;
          END IF;
        END IF;
      END LOOP;
    ELSE
      -- Fallback if no segments defined: auto clock-out after 12 hours of continuous session
      IF (NOW() - rec.clock_in_at) > INTERVAL '12 hours' THEN
        seg_end_timestamp := rec.clock_in_at + INTERVAL '8 hours';
        UPDATE public.staff_attendance_logs
        SET
          clock_out_at = seg_end_timestamp,
          status = 'auto_clocked_out',
          notes = COALESCE(notes, '') || ' [System: Auto clocked-out after exceeding 12 hours active session]',
          updated_at = NOW()
        WHERE id = rec.log_id;
        
        affected_log_id := rec.log_id;
        staff_id := rec.staff_id;
        clocked_out_at := seg_end_timestamp;
        reason := 'Exceeded maximum safe 12h session threshold without clocking out';
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;
END;
$$;
