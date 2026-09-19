import { supabase } from './supabase';
import type {
  StaffShift,
  StaffAttendanceLog,
  StaffPresenceSummary,
  ClockInPayload,
  ClockOutPayload,
  HeartbeatPayload,
  StaffShiftSegment,
  StaffAttendanceStatus,
} from '../types/staffAttendance';
import type { Profile } from '../types/database';

const LOCAL_SHIFTS_KEY = 'scholario_staff_shifts_fallback_v1';
const LOCAL_LOGS_KEY = 'scholario_staff_attendance_logs_fallback_v1';

// In-memory / localStorage fallback cache to ensure zero UI crashes
function getLocalFallbackShifts(): StaffShift[] {
  try {
    const raw = localStorage.getItem(LOCAL_SHIFTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveLocalFallbackShifts(shifts: StaffShift[]): void {
  try {
    localStorage.setItem(LOCAL_SHIFTS_KEY, JSON.stringify(shifts));
  } catch {}
}

function getLocalFallbackLogs(): StaffAttendanceLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveLocalFallbackLogs(logs: StaffAttendanceLog[]): void {
  try {
    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs));
  } catch {}
}

/**
 * Parses "HH:MM" into minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Returns current day of week: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
 */
export function getCurrentDayOfWeek(date = new Date()): number {
  const day = date.getDay(); // 0=Sun, 1=Mon...
  return day === 0 ? 7 : day;
}

/**
 * Formats seconds into human-readable HH:MM:SS or "Xh Ym"
 */
export function formatDurationHuman(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

export function formatDurationTimer(seconds: number): string {
  if (!seconds || seconds < 0) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

/**
 * Finds the currently active or upcoming segment for a shift given a specific time
 */
export function getActiveOrUpcomingSegment(
  shift: StaffShift,
  targetDate = new Date()
): { segment: StaffShiftSegment; isCurrentlyActive: boolean; minutesUntilStart: number } | null {
  if (!shift || !shift.segments || shift.segments.length === 0) return null;

  const currentMins = targetDate.getHours() * 60 + targetDate.getMinutes();

  // 1. Check if currently inside any segment
  for (const seg of shift.segments) {
    const startMins = timeToMinutes(seg.start_time);
    const endMins = timeToMinutes(seg.end_time);

    // If within segment (or within 30 min before start)
    if (currentMins >= startMins - 30 && currentMins <= endMins + shift.grace_period_minutes) {
      return {
        segment: seg,
        isCurrentlyActive: currentMins >= startMins && currentMins <= endMins,
        minutesUntilStart: Math.max(0, startMins - currentMins),
      };
    }
  }

  // 2. Find next upcoming segment today
  const upcoming = shift.segments
    .filter((s) => timeToMinutes(s.start_time) > currentMins)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))[0];

  if (upcoming) {
    const startMins = timeToMinutes(upcoming.start_time);
    return {
      segment: upcoming,
      isCurrentlyActive: false,
      minutesUntilStart: startMins - currentMins,
    };
  }

  // Fallback to first segment
  return {
    segment: shift.segments[0],
    isCurrentlyActive: false,
    minutesUntilStart: 0,
  };
}

/**
 * Evaluates lateness for clock-in against scheduled segment start time
 */
export function evaluateLateness(
  clockInTime: Date,
  segmentStartTimeStr: string,
  gracePeriodMinutes = 15
): { isLate: boolean; minutesLate: number } {
  if (!segmentStartTimeStr) return { isLate: false, minutesLate: 0 };

  const clockInMins = clockInTime.getHours() * 60 + clockInTime.getMinutes();
  const scheduledStartMins = timeToMinutes(segmentStartTimeStr);

  const diff = clockInMins - scheduledStartMins;
  if (diff > gracePeriodMinutes) {
    return { isLate: true, minutesLate: diff };
  }
  return { isLate: false, minutesLate: 0 };
}

// ─── API & Database Calls ───────────────────────────────────────────────────

/**
 * Fetch all staff shifts, optionally filtered by staff_id
 */
export async function getStaffShifts(staffId?: string): Promise<StaffShift[]> {
  try {
    let query = supabase.from('staff_shifts').select('*').order('created_at', { ascending: false });
    if (staffId) {
      query = query.eq('staff_id', staffId);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as StaffShift[];
    }
    if (error && error.code !== 'PGRST116') {
      console.info('[StaffAttendanceService] Supabase shifts note:', error.message);
    }
  } catch (err) {
    console.info('[StaffAttendanceService] Fetch shifts fallback note:', err);
  }

  // Fallback
  const fallback = getLocalFallbackShifts();
  return staffId ? fallback.filter((s) => s.staff_id === staffId) : fallback;
}

/**
 * Upsert staff shift
 */
export async function upsertStaffShift(shift: Partial<StaffShift>): Promise<StaffShift> {
  const payload = {
    ...shift,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await (supabase as any)
      .from('staff_shifts')
      .upsert(payload)
      .select()
      .single();

    if (!error && data) {
      return data as StaffShift;
    }
    if (error) {
      console.warn('[StaffAttendanceService] Supabase shift upsert warning:', error.message);
    }
  } catch (err) {
    console.warn('[StaffAttendanceService] Shift upsert fallback:', err);
  }

  // Fallback in local storage
  const current = getLocalFallbackShifts();
  const id = shift.id || `shift-${Date.now()}`;
  const completeShift: StaffShift = {
    id,
    staff_id: shift.staff_id || '',
    shift_name: shift.shift_name || 'Regular Shift',
    shift_type: shift.shift_type || 'regular',
    segments: shift.segments || [
      { segment_index: 0, name: 'Shift Block', start_time: '09:00', end_time: '17:00' },
    ],
    days_of_week: shift.days_of_week || [1, 2, 3, 4, 5],
    grace_period_minutes: shift.grace_period_minutes ?? 15,
    is_active: shift.is_active ?? true,
    notes: shift.notes || null,
    created_at: shift.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const existingIdx = current.findIndex((s) => s.id === id);
  if (existingIdx >= 0) {
    current[existingIdx] = completeShift;
  } else {
    current.unshift(completeShift);
  }
  saveLocalFallbackShifts(current);
  return completeShift;
}

/**
 * Delete a staff shift
 */
export async function deleteStaffShift(shiftId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('staff_shifts').delete().eq('id', shiftId);
    if (!error) return true;
  } catch (err) {
    console.warn('[StaffAttendanceService] Delete shift error:', err);
  }

  const current = getLocalFallbackShifts().filter((s) => s.id !== shiftId);
  saveLocalFallbackShifts(current);
  return true;
}

/**
 * Fetch staff attendance logs
 */
export async function getStaffAttendanceLogs(options?: {
  staffId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<StaffAttendanceLog[]> {
  try {
    let query = supabase
      .from('staff_attendance_logs')
      .select('*')
      .order('clock_in_at', { ascending: false });

    if (options?.staffId) {
      query = query.eq('staff_id', options.staffId);
    }
    if (options?.startDate) {
      query = query.gte('clock_in_at', `${options.startDate}T00:00:00`);
    }
    if (options?.endDate) {
      query = query.lte('clock_in_at', `${options.endDate}T23:59:59`);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (!error && data) {
      return data as StaffAttendanceLog[];
    }
    if (error && error.code !== 'PGRST116') {
      console.info('[StaffAttendanceService] Supabase logs note:', error.message);
    }
  } catch (err) {
    console.info('[StaffAttendanceService] Fetch logs fallback note:', err);
  }

  // Fallback
  let list = getLocalFallbackLogs();
  if (options?.staffId) {
    list = list.filter((l) => l.staff_id === options.staffId);
  }
  if (options?.startDate) {
    list = list.filter((l) => l.clock_in_at >= `${options.startDate}T00:00:00`);
  }
  if (options?.endDate) {
    list = list.filter((l) => l.clock_in_at <= `${options.endDate}T23:59:59`);
  }
  return list;
}

/**
 * Get active (currently clocked-in) attendance log for a staff member
 */
export async function getActiveStaffAttendanceLog(staffId: string): Promise<StaffAttendanceLog | null> {
  try {
    const { data, error } = await supabase
      .from('staff_attendance_logs')
      .select('*')
      .eq('staff_id', staffId)
      .is('clock_out_at', null)
      .order('clock_in_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as StaffAttendanceLog;
    }
  } catch {}

  const list = getLocalFallbackLogs();
  const active = list.find((l) => l.staff_id === staffId && !l.clock_out_at);
  return active || null;
}

/**
 * Clock in staff member
 */
export async function clockInStaff(payload: ClockInPayload): Promise<StaffAttendanceLog> {
  const clientTime = payload.client_time || new Date().toISOString();

  // Try API route first (which captures real client IP and User-Agent headers)
  try {
    const res = await fetch('/api/staff-attendance/clock-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data && data.log) {
        return data.log as StaffAttendanceLog;
      }
    }
  } catch (apiErr) {
    console.warn('[StaffAttendanceService] API clock-in route error, using direct flow:', apiErr);
  }

  // Direct Supabase insert
  let status: StaffAttendanceStatus = 'present';
  let notes = payload.notes || '';

  // Calculate lateness if shift provided
  if (payload.shift_id) {
    const shifts = await getStaffShifts(payload.staff_id);
    const matchedShift = shifts.find((s) => s.id === payload.shift_id);
    if (matchedShift && matchedShift.segments) {
      const segment = matchedShift.segments.find(
        (s) => s.segment_index === (payload.segment_index ?? 0)
      ) || matchedShift.segments[0];

      if (segment) {
        const { isLate, minutesLate } = evaluateLateness(
          new Date(clientTime),
          segment.start_time,
          matchedShift.grace_period_minutes
        );
        if (isLate) {
          status = 'late';
          notes = notes
            ? `${notes} (Late by ${minutesLate} mins)`
            : `Late by ${minutesLate} mins (Grace: ${matchedShift.grace_period_minutes}m)`;
        }
      }
    }
  }

  const logRecord: Partial<StaffAttendanceLog> = {
    staff_id: payload.staff_id,
    shift_id: payload.shift_id || null,
    segment_index: payload.segment_index ?? 0,
    clock_in_at: clientTime,
    clock_out_at: null,
    status,
    notes: notes || null,
    idle_flagged: false,
    idle_minutes: 0,
    device_info: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Browser',
    last_heartbeat_at: clientTime,
  };

  try {
    const { data, error } = await (supabase as any)
      .from('staff_attendance_logs')
      .insert(logRecord)
      .select()
      .single();

    if (!error && data) {
      return data as StaffAttendanceLog;
    }
  } catch (insertErr) {
    console.warn('[StaffAttendanceService] Supabase insert warning:', insertErr);
  }

  // Fallback
  const fallbackLogs = getLocalFallbackLogs();
  const createdLog: StaffAttendanceLog = {
    id: `log-${Date.now()}`,
    staff_id: payload.staff_id,
    shift_id: payload.shift_id || null,
    segment_index: payload.segment_index ?? 0,
    clock_in_at: clientTime,
    clock_out_at: null,
    status,
    ip_address: '127.0.0.1 (Local Session)',
    device_info: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Browser',
    notes: notes || null,
    idle_flagged: false,
    idle_minutes: 0,
    last_heartbeat_at: clientTime,
    total_active_seconds: 0,
    created_at: clientTime,
    updated_at: clientTime,
  };
  fallbackLogs.unshift(createdLog);
  saveLocalFallbackLogs(fallbackLogs);
  return createdLog;
}

/**
 * Clock out staff member
 */
export async function clockOutStaff(payload: ClockOutPayload): Promise<StaffAttendanceLog> {
  const clientTime = payload.client_time || new Date().toISOString();

  // Try API route
  try {
    const res = await fetch('/api/staff-attendance/clock-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data && data.log) {
        return data.log as StaffAttendanceLog;
      }
    }
  } catch (apiErr) {
    console.warn('[StaffAttendanceService] API clock-out route error, using direct flow:', apiErr);
  }

  // Direct Supabase update
  try {
    // Read current to calculate duration
    const { data: existing } = await (supabase as any)
      .from('staff_attendance_logs')
      .select('clock_in_at, notes')
      .eq('id', payload.log_id)
      .single();

    let durationSeconds = 0;
    if (existing?.clock_in_at) {
      durationSeconds = Math.max(
        0,
        Math.floor((new Date(clientTime).getTime() - new Date(existing.clock_in_at).getTime()) / 1000)
      );
    }

    const { data, error } = await (supabase as any)
      .from('staff_attendance_logs')
      .update({
        clock_out_at: clientTime,
        total_active_seconds: durationSeconds,
        notes: payload.notes
          ? `${existing?.notes || ''} | ${payload.notes}`.trim()
          : existing?.notes,
        updated_at: clientTime,
      })
      .eq('id', payload.log_id)
      .select()
      .single();

    if (!error && data) {
      return data as StaffAttendanceLog;
    }
  } catch (dbErr) {
    console.warn('[StaffAttendanceService] Direct clock-out error:', dbErr);
  }

  // Fallback
  const logs = getLocalFallbackLogs();
  const idx = logs.findIndex((l) => l.id === payload.log_id);
  if (idx >= 0) {
    const log = logs[idx];
    const duration = Math.max(
      0,
      Math.floor((new Date(clientTime).getTime() - new Date(log.clock_in_at).getTime()) / 1000)
    );
    log.clock_out_at = clientTime;
    log.total_active_seconds = duration;
    if (payload.notes) {
      log.notes = log.notes ? `${log.notes} | ${payload.notes}` : payload.notes;
    }
    log.updated_at = clientTime;
    logs[idx] = log;
    saveLocalFallbackLogs(logs);
    return log;
  }

  throw new Error('Attendance log not found');
}

/**
 * Send activity heartbeat to keep session verified and update idle status
 */
export async function sendStaffHeartbeat(payload: HeartbeatPayload): Promise<boolean> {
  const clientTime = payload.client_time || new Date().toISOString();
  const idleMins = payload.idle_minutes ?? 0;
  const isIdleFlagged = idleMins >= 30;

  // Try API route
  try {
    const res = await fetch('/api/staff-attendance/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        idle_flagged: isIdleFlagged,
      }),
    });
    if (res.ok) return true;
  } catch {}

  // Direct Supabase update
  try {
    await (supabase as any)
      .from('staff_attendance_logs')
      .update({
        last_heartbeat_at: clientTime,
        idle_minutes: idleMins,
        idle_flagged: isIdleFlagged,
        updated_at: clientTime,
      })
      .eq('id', payload.log_id);
    return true;
  } catch {}

  // Fallback
  const logs = getLocalFallbackLogs();
  const idx = logs.findIndex((l) => l.id === payload.log_id);
  if (idx >= 0) {
    logs[idx].last_heartbeat_at = clientTime;
    logs[idx].idle_minutes = idleMins;
    if (isIdleFlagged) logs[idx].idle_flagged = true;
    saveLocalFallbackLogs(logs);
  }
  return true;
}

/**
 * Trigger auto clock-out check across all staff
 */
export async function triggerAutoClockOutSweep(): Promise<{ affectedCount: number; records: any[] }> {
  try {
    const res = await fetch('/api/staff-attendance/auto-clock-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[StaffAttendanceService] Auto clock-out trigger note:', err);
  }

  // Fallback sweep on local logs
  const now = new Date();
  const logs = getLocalFallbackLogs();
  const shifts = getLocalFallbackShifts();
  let affected = 0;
  const records: any[] = [];

  logs.forEach((log) => {
    if (!log.clock_out_at) {
      const shift = shifts.find((s) => s.id === log.shift_id);
      if (shift && shift.segments) {
        const seg = shift.segments.find((s) => s.segment_index === log.segment_index);
        if (seg) {
          const [endH, endM] = seg.end_time.split(':').map(Number);
          const segEnd = new Date(log.clock_in_at);
          segEnd.setHours(endH, endM, 0, 0);

          const graceEnd = new Date(segEnd.getTime() + (shift.grace_period_minutes || 15) * 60000);
          if (now > graceEnd) {
            log.clock_out_at = segEnd.toISOString();
            log.status = 'auto_clocked_out';
            log.notes = (log.notes ? `${log.notes} | ` : '') + '[System: Auto clocked-out at scheduled segment end + grace period]';
            log.updated_at = now.toISOString();
            affected++;
            records.push({ log_id: log.id, staff_id: log.staff_id });
          }
        }
      }
    }
  });

  if (affected > 0) {
    saveLocalFallbackLogs(logs);
  }

  return { affectedCount: affected, records };
}

/**
 * Consolidates presence summaries for all staff members today
 */
export function buildStaffPresenceSummaries(
  staffProfiles: Profile[],
  allShifts: StaffShift[],
  allLogs: StaffAttendanceLog[],
  targetDateStr = new Date().toISOString().slice(0, 10)
): StaffPresenceSummary[] {
  const currentDayOfWeek = getCurrentDayOfWeek();

  return staffProfiles.map((staff) => {
    // Find active shift assigned to this staff member for today's day of week
    const staffShifts = allShifts.filter((s) => s.staff_id === staff.id && s.is_active);
    const todayShift = staffShifts.find((s) => s.days_of_week.includes(currentDayOfWeek)) || staffShifts[0] || null;

    // Filter today's logs for this staff member
    const todayLogs = allLogs.filter(
      (l) => l.staff_id === staff.id && l.clock_in_at.startsWith(targetDateStr)
    );

    // Active log (no clock_out_at)
    const activeLog = todayLogs.find((l) => !l.clock_out_at) || null;

    // Calculate total hours worked today across all segments (summing broken/split shifts)
    let totalSeconds = 0;
    todayLogs.forEach((log) => {
      if (log.clock_out_at) {
        const inTime = new Date(log.clock_in_at).getTime();
        const outTime = new Date(log.clock_out_at).getTime();
        totalSeconds += Math.max(0, Math.floor((outTime - inTime) / 1000));
      } else {
        // Active: sum elapsed so far
        const inTime = new Date(log.clock_in_at).getTime();
        const now = Date.now();
        totalSeconds += Math.max(0, Math.floor((now - inTime) / 1000));
      }
    });

    const activeSegInfo = todayShift ? getActiveOrUpcomingSegment(todayShift) : null;
    const hasIdleWarning = activeLog ? activeLog.idle_flagged : false;
    const isAutoClockedOutToday = todayLogs.some((l) => l.status === 'auto_clocked_out');

    return {
      staff_id: staff.id,
      staff_name: staff.full_name || 'Staff Member',
      email: (staff as any).email || (staff.phone ? `Phone: ${staff.phone}` : 'Remote Staff'),
      role: staff.role || 'teacher',
      avatar_url: staff.avatar_url,
      current_shift: todayShift,
      active_log: activeLog,
      is_clocked_in: !!activeLog,
      today_logs: todayLogs,
      total_today_hours: Number((totalSeconds / 3600).toFixed(2)),
      has_idle_warning: hasIdleWarning,
      is_auto_clocked_out_today: isAutoClockedOutToday,
      active_segment: activeSegInfo?.segment || null,
    };
  });
}
