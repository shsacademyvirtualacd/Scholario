import { Profile } from './database';

export type ShiftType = 'regular' | 'split' | 'broken';

export interface StaffShiftSegment {
  segment_index: number;
  name?: string;
  start_time: string; // HH:MM format (24-hour, e.g. "09:00")
  end_time: string;   // HH:MM format (24-hour, e.g. "13:00")
}

export interface StaffShift {
  id: string;
  staff_id: string;
  shift_name: string;
  shift_type: ShiftType;
  segments: StaffShiftSegment[];
  days_of_week: number[]; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
  effective_date?: string;
  grace_period_minutes: number;
  is_active: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined or resolved
  staff?: Profile;
}

export type StaffAttendanceStatus = 'present' | 'late' | 'auto_clocked_out' | 'absent';

export interface StaffAttendanceLog {
  id: string;
  staff_id: string;
  shift_id?: string | null;
  segment_index: number;
  clock_in_at: string;
  clock_out_at?: string | null;
  status: StaffAttendanceStatus;
  ip_address?: string | null;
  device_info?: string | null;
  notes?: string | null;
  idle_flagged: boolean;
  idle_minutes: number;
  last_heartbeat_at?: string | null;
  total_active_seconds?: number;
  created_at?: string;
  updated_at?: string;
  // Joined or resolved
  staff?: Profile;
  shift?: StaffShift;
}

export interface StaffPresenceSummary {
  staff_id: string;
  staff_name: string;
  email?: string;
  role: string;
  avatar_url?: string | null;
  current_shift?: StaffShift | null;
  active_log?: StaffAttendanceLog | null;
  is_clocked_in: boolean;
  today_logs: StaffAttendanceLog[];
  total_today_hours: number;
  has_idle_warning: boolean;
  is_auto_clocked_out_today: boolean;
  active_segment?: StaffShiftSegment | null;
}

export interface ClockInPayload {
  staff_id: string;
  shift_id?: string;
  segment_index?: number;
  notes?: string;
  client_time?: string;
}

export interface ClockOutPayload {
  log_id: string;
  notes?: string;
  client_time?: string;
}

export interface HeartbeatPayload {
  log_id: string;
  idle_minutes?: number;
  is_tab_visible?: boolean;
  is_window_focused?: boolean;
  client_time?: string;
}
