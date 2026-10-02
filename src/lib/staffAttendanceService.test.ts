import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock supabase before importing service
vi.mock('./supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  };
});

import { supabase } from './supabase';
import {
  timeToMinutes,
  getCurrentDayOfWeek,
  formatDurationHuman,
  formatDurationTimer,
  getActiveOrUpcomingSegment,
  evaluateLateness,
  getStaffShifts,
  upsertStaffShift,
  deleteStaffShift,
  getStaffAttendanceLogs,
  getActiveStaffAttendanceLog,
  clockInStaff,
  clockOutStaff,
  sendStaffHeartbeat,
  triggerAutoClockOutSweep,
  buildStaffPresenceSummaries,
} from './staffAttendanceService';
import type { StaffShift, StaffAttendanceLog } from '../types/staffAttendance';
import type { Profile } from '../types/database';

const LOCAL_SHIFTS_KEY = 'scholario_staff_shifts_fallback_v1';
const LOCAL_LOGS_KEY = 'scholario_staff_attendance_logs_fallback_v1';

describe('staffAttendanceService', () => {
  let localStorageStore: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageStore = {};

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageStore[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageStore[key];
      }),
      clear: vi.fn(() => {
        localStorageStore = {};
      }),
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('localStorage Fallback Error Handling (Catch Blocks)', () => {
    it('getLocalFallbackShifts: returns [] when localStorage contains invalid JSON', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      });

      localStorageStore[LOCAL_SHIFTS_KEY] = '{{invalid json';

      const shifts = await getStaffShifts();
      expect(shifts).toEqual([]);
      expect(localStorage.getItem).toHaveBeenCalledWith(LOCAL_SHIFTS_KEY);
    });

    it('getLocalFallbackLogs: returns [] when localStorage contains invalid JSON', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      });

      localStorageStore[LOCAL_LOGS_KEY] = 'invalid-json}';

      const logs = await getStaffAttendanceLogs();
      expect(logs).toEqual([]);
      expect(localStorage.getItem).toHaveBeenCalledWith(LOCAL_LOGS_KEY);
    });

    it('saveLocalFallbackShifts: catches exceptions thrown by localStorage.setItem', async () => {
      (supabase.from as any).mockReturnValue({
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Upsert Error') }),
      });

      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const shiftPayload: Partial<StaffShift> = {
        staff_id: 'staff-1',
        shift_name: 'Test Shift',
      };

      const result = await upsertStaffShift(shiftPayload);
      expect(result.staff_id).toBe('staff-1');
      expect(result.shift_name).toBe('Test Shift');
    });

    it('saveLocalFallbackLogs: catches exceptions thrown by localStorage.setItem', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Insert Error') }),
      });

      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const clockInPayload = {
        staff_id: 'staff-1',
        client_time: '2026-10-02T09:00:00.000Z',
      };

      const result = await clockInStaff(clockInPayload);
      expect(result.staff_id).toBe('staff-1');
      expect(result.status).toBe('present');
    });
  });

  describe('Utility Functions', () => {
    describe('timeToMinutes', () => {
      it('converts HH:MM string to total minutes from midnight', () => {
        expect(timeToMinutes('09:30')).toBe(570);
        expect(timeToMinutes('00:00')).toBe(0);
        expect(timeToMinutes('23:59')).toBe(1439);
        expect(timeToMinutes('')).toBe(0);
      });
    });

    describe('getCurrentDayOfWeek', () => {
      it('returns 1 for Monday through 7 for Sunday', () => {
        // Oct 2, 2026 is a Friday (getDay() = 5)
        const friday = new Date(2026, 9, 2);
        expect(getCurrentDayOfWeek(friday)).toBe(5);

        // Sunday (getDay() = 0)
        const sunday = new Date(2026, 9, 4);
        expect(getCurrentDayOfWeek(sunday)).toBe(7);
      });
    });

    describe('formatDurationHuman', () => {
      it('formats duration in seconds to human readable string', () => {
        expect(formatDurationHuman(0)).toBe('0m');
        expect(formatDurationHuman(-10)).toBe('0m');
        expect(formatDurationHuman(300)).toBe('5m');
        expect(formatDurationHuman(3660)).toBe('1h 1m');
        expect(formatDurationHuman(7200)).toBe('2h 0m');
      });
    });

    describe('formatDurationTimer', () => {
      it('formats duration in seconds to HH:MM:SS timer format', () => {
        expect(formatDurationTimer(0)).toBe('00:00:00');
        expect(formatDurationTimer(-1)).toBe('00:00:00');
        expect(formatDurationTimer(3661)).toBe('01:01:01');
      });
    });

    describe('getActiveOrUpcomingSegment', () => {
      const sampleShift: StaffShift = {
        id: 'shift-1',
        staff_id: 'staff-1',
        shift_name: 'Morning Shift',
        shift_type: 'regular',
        segments: [
          { segment_index: 0, name: 'Morning', start_time: '09:00', end_time: '12:00' },
          { segment_index: 1, name: 'Afternoon', start_time: '13:00', end_time: '17:00' },
        ],
        days_of_week: [1, 2, 3, 4, 5],
        grace_period_minutes: 15,
        is_active: true,
        notes: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      it('returns null if shift has no segments', () => {
        expect(getActiveOrUpcomingSegment({ ...sampleShift, segments: [] })).toBeNull();
      });

      it('identifies active segment when current time falls within segment window', () => {
        const testDate = new Date();
        testDate.setHours(10, 0, 0, 0); // 10:00

        const result = getActiveOrUpcomingSegment(sampleShift, testDate);
        expect(result).not.toBeNull();
        expect(result?.segment.name).toBe('Morning');
        expect(result?.isCurrentlyActive).toBe(true);
        expect(result?.minutesUntilStart).toBe(0);
      });

      it('identifies upcoming segment when target time is after grace period and before next segment', () => {
        const testDate = new Date();
        testDate.setHours(12, 20, 0, 0); // 12:20 (after morning + 15 min grace, before afternoon)

        const result = getActiveOrUpcomingSegment(sampleShift, testDate);
        expect(result).not.toBeNull();
        expect(result?.segment.name).toBe('Afternoon');
        expect(result?.isCurrentlyActive).toBe(false);
        expect(result?.minutesUntilStart).toBe(40); // 13:00 - 12:20 = 40 min
      });
    });

    describe('evaluateLateness', () => {
      it('calculates whether clock in is late based on grace period', () => {
        const clockInTime = new Date();
        clockInTime.setHours(9, 10, 0, 0); // 09:10

        // Grace period 15 mins (09:00 + 15m = 09:15) -> Not late
        expect(evaluateLateness(clockInTime, '09:00', 15)).toEqual({
          isLate: false,
          minutesLate: 0,
        });

        // Clock in at 09:20 -> Late by 20 mins
        clockInTime.setHours(9, 20, 0, 0);
        expect(evaluateLateness(clockInTime, '09:00', 15)).toEqual({
          isLate: true,
          minutesLate: 20,
        });
      });
    });
  });

  describe('API & Database Workflows', () => {
    describe('getStaffShifts', () => {
      it('returns shifts from Supabase when query succeeds', async () => {
        const shiftsData = [{ id: 'shift-1', staff_id: 's1' }];
        (supabase.from as any).mockReturnValue({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: shiftsData, error: null }),
        });

        const res = await getStaffShifts();
        expect(res).toEqual(shiftsData);
      });

      it('falls back to localStorage when Supabase errors out', async () => {
        (supabase.from as any).mockReturnValue({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: null, error: new Error('Network err') }),
        });

        localStorageStore[LOCAL_SHIFTS_KEY] = JSON.stringify([
          { id: 'shift-local', staff_id: 's1' },
        ]);

        const res = await getStaffShifts('s1');
        expect(res).toEqual([{ id: 'shift-local', staff_id: 's1' }]);
      });
    });

    describe('deleteStaffShift', () => {
      it('deletes shift from Supabase when DB succeeds', async () => {
        (supabase.from as any).mockReturnValue({
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        });

        const success = await deleteStaffShift('shift-1');
        expect(success).toBe(true);
      });

      it('removes shift from local storage on fallback', async () => {
        (supabase.from as any).mockReturnValue({
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') }),
        });

        localStorageStore[LOCAL_SHIFTS_KEY] = JSON.stringify([
          { id: 'shift-1', staff_id: 's1' },
          { id: 'shift-2', staff_id: 's1' },
        ]);

        const success = await deleteStaffShift('shift-1');
        expect(success).toBe(true);
        const stored = JSON.parse(localStorageStore[LOCAL_SHIFTS_KEY]);
        expect(stored.length).toBe(1);
        expect(stored[0].id).toBe('shift-2');
      });
    });

    describe('getActiveStaffAttendanceLog', () => {
      it('fetches active log from Supabase when present', async () => {
        const activeLog = { id: 'log-1', staff_id: 's1', clock_out_at: null };
        (supabase.from as any).mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: activeLog, error: null }),
        });

        const res = await getActiveStaffAttendanceLog('s1');
        expect(res).toEqual(activeLog);
      });

      it('falls back to local logs if Supabase errors', async () => {
        (supabase.from as any).mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockRejectedValue(new Error('Supabase error')),
        });

        localStorageStore[LOCAL_LOGS_KEY] = JSON.stringify([
          { id: 'log-local-active', staff_id: 's1', clock_out_at: null },
          { id: 'log-local-closed', staff_id: 's1', clock_out_at: '2026-10-02T10:00:00Z' },
        ]);

        const res = await getActiveStaffAttendanceLog('s1');
        expect(res?.id).toBe('log-local-active');
      });
    });

    describe('clockOutStaff', () => {
      it('clocks out via API route when fetch succeeds', async () => {
        const mockLog = { id: 'log-1', clock_out_at: '2026-10-02T17:00:00Z' };
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({ log: mockLog }),
        } as any);

        const res = await clockOutStaff({ log_id: 'log-1' });
        expect(res).toEqual(mockLog);
      });

      it('falls back to local storage update when DB and API fail', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('API failed'));

        (supabase.from as any).mockReturnValue({
          select: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
        });

        localStorageStore[LOCAL_LOGS_KEY] = JSON.stringify([
          {
            id: 'log-1',
            staff_id: 's1',
            clock_in_at: '2026-10-02T09:00:00.000Z',
            clock_out_at: null,
          },
        ]);

        const res = await clockOutStaff({
          log_id: 'log-1',
          client_time: '2026-10-02T10:00:00.000Z',
          notes: 'Clocking out',
        });

        expect(res.clock_out_at).toBe('2026-10-02T10:00:00.000Z');
        expect(res.total_active_seconds).toBe(3600); // 1 hour difference
      });
    });

    describe('sendStaffHeartbeat', () => {
      it('sends heartbeat via API route when fetch succeeds', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as any);

        const ok = await sendStaffHeartbeat({ log_id: 'log-1', idle_minutes: 5 });
        expect(ok).toBe(true);
      });

      it('updates local storage log on fallback', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
        (supabase.from as any).mockReturnValue({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockRejectedValue(new Error('DB Error')),
        });

        localStorageStore[LOCAL_LOGS_KEY] = JSON.stringify([
          { id: 'log-1', staff_id: 's1', idle_minutes: 0, idle_flagged: false },
        ]);

        const ok = await sendStaffHeartbeat({
          log_id: 'log-1',
          idle_minutes: 35,
          client_time: '2026-10-02T11:00:00Z',
        });

        expect(ok).toBe(true);
        const stored = JSON.parse(localStorageStore[LOCAL_LOGS_KEY]);
        expect(stored[0].idle_minutes).toBe(35);
        expect(stored[0].idle_flagged).toBe(true);
      });
    });

    describe('triggerAutoClockOutSweep', () => {
      it('triggers sweep via API route when successful', async () => {
        const sweepResult = { affectedCount: 2, records: [{ log_id: 'l1' }, { log_id: 'l2' }] };
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue(sweepResult),
        } as any);

        const res = await triggerAutoClockOutSweep();
        expect(res).toEqual(sweepResult);
      });
    });

    describe('buildStaffPresenceSummaries', () => {
      it('consolidates profiles, shifts, and logs into presence summaries', () => {
        const profiles: Profile[] = [
          { id: 'p1', full_name: 'Alice Admin', role: 'admin', avatar_url: 'http://avatar.url/1' } as any,
        ];

        const shifts: StaffShift[] = [
          {
            id: 'sh-1',
            staff_id: 'p1',
            shift_name: 'Day Shift',
            shift_type: 'regular',
            segments: [{ segment_index: 0, name: 'Main', start_time: '09:00', end_time: '17:00' }],
            days_of_week: [1, 2, 3, 4, 5, 6, 7],
            grace_period_minutes: 15,
            is_active: true,
            notes: null,
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
          },
        ];

        const logs: StaffAttendanceLog[] = [
          {
            id: 'l1',
            staff_id: 'p1',
            shift_id: 'sh-1',
            segment_index: 0,
            clock_in_at: '2026-10-02T09:00:00.000Z',
            clock_out_at: '2026-10-02T13:00:00.000Z',
            status: 'present',
            ip_address: '127.0.0.1',
            device_info: 'Browser',
            notes: null,
            idle_flagged: false,
            idle_minutes: 0,
            last_heartbeat_at: '2026-10-02T13:00:00.000Z',
            total_active_seconds: 14400,
            created_at: '2026-10-02T09:00:00.000Z',
            updated_at: '2026-10-02T13:00:00.000Z',
          },
        ];

        const summaries = buildStaffPresenceSummaries(profiles, shifts, logs, '2026-10-02');
        expect(summaries.length).toBe(1);
        expect(summaries[0].staff_id).toBe('p1');
        expect(summaries[0].staff_name).toBe('Alice Admin');
        expect(summaries[0].is_clocked_in).toBe(false);
        expect(summaries[0].total_today_hours).toBe(4); // 14400 seconds = 4 hours
      });
    });
  });
});
