import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeAttendanceStreak } from '../db';
import * as scheduleUtils from '../scheduleUtils';

// Mock scheduleUtils so we can control getPKTNow()
vi.mock('../scheduleUtils', () => ({
  getPKTNow: vi.fn(),
}));

describe('computeAttendanceStreak', () => {
  beforeEach(() => {
    // Set default mock to a fixed date: 2023-10-15 (Sunday)
    // Sunday index is 6 in the implementation based on: 0=Mon, ..., 6=Sun
    vi.spyOn(scheduleUtils, 'getPKTNow').mockReturnValue({
      dateString: '2023-10-15',
      dayIndex: 6, // Sunday
      totalMins: 720,
      hour: 12,
      minute: 0
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return empty result for no records', () => {
    const result = computeAttendanceStreak([]);
    // Even though the task description said longestStreak, the actual codebase has personalBest and last7Days
    // Testing based on what the actual code does to ensure true coverage.
    expect(result).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      last7Days: [false, false, false, false, false, false, false]
    });
  });

  it('should ignore absent or excused records', () => {
    const records = [
      { session_date: '2023-10-15T10:00:00Z', status: 'absent' },
      { session_date: '2023-10-14T10:00:00Z', status: 'excused' },
    ] as any;

    const result = computeAttendanceStreak(records);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.last7Days).toEqual([false, false, false, false, false, false, false]);
  });

  it('should calculate streak for single present record today', () => {
    const records = [
      { session_date: '2023-10-15T10:00:00Z', status: 'present' },
    ] as any;

    const result = computeAttendanceStreak(records);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.last7Days).toEqual([false, false, false, false, false, false, true]);
  });

  it('should calculate streak for single present record yesterday', () => {
    const records = [
      { session_date: '2023-10-14T10:00:00Z', status: 'present' }, // Saturday
    ] as any;

    const result = computeAttendanceStreak(records);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.last7Days).toEqual([false, false, false, false, false, true, false]);
  });

  it('should break current streak if no attendance today or yesterday', () => {
    const records = [
      { session_date: '2023-10-13T10:00:00Z', status: 'present' }, // Friday
      { session_date: '2023-10-12T10:00:00Z', status: 'present' }, // Thursday
    ] as any;

    const result = computeAttendanceStreak(records);
    expect(result.currentStreak).toBe(0); // Lapsed!
    expect(result.longestStreak).toBe(2);
    expect(result.last7Days).toEqual([false, false, false, true, true, false, false]);
  });

  it('should calculate personal best across multiple broken streaks', () => {
    const records = [
      // Streak 1 (length 3)
      { session_date: '2023-10-01T10:00:00Z', status: 'present' },
      { session_date: '2023-10-02T10:00:00Z', status: 'present' },
      { session_date: '2023-10-03T10:00:00Z', status: 'late' }, // late counts as attendance
      // Gap
      // Streak 2 (length 4)
      { session_date: '2023-10-10T10:00:00Z', status: 'present' },
      { session_date: '2023-10-11T10:00:00Z', status: 'present' },
      { session_date: '2023-10-12T10:00:00Z', status: 'present' },
      { session_date: '2023-10-13T10:00:00Z', status: 'present' }, // Friday
    ] as any;

    const result = computeAttendanceStreak(records);
    expect(result.currentStreak).toBe(0); // Lapsed, no attendance on 14th or 15th
    expect(result.longestStreak).toBe(4);
    expect(result.last7Days).toEqual([false, true, true, true, true, false, false]);
  });

  it('should keep current streak if active today', () => {
    const records = [
      { session_date: '2023-10-12T10:00:00Z', status: 'present' }, // Thursday
      { session_date: '2023-10-13T10:00:00Z', status: 'present' }, // Friday
      { session_date: '2023-10-14T10:00:00Z', status: 'present' }, // Saturday
      { session_date: '2023-10-15T10:00:00Z', status: 'present' }, // Sunday (today)
    ] as any;

    const result = computeAttendanceStreak(records);
    expect(result.currentStreak).toBe(4);
    expect(result.longestStreak).toBe(4);
    expect(result.last7Days).toEqual([false, false, false, true, true, true, true]);
  });

  it('should only count one attendance per calendar day', () => {
    const records = [
      { session_date: '2023-10-14T10:00:00Z', status: 'present' },
      { session_date: '2023-10-14T14:00:00Z', status: 'late' },
      { session_date: '2023-10-15T09:00:00Z', status: 'present' },
      { session_date: '2023-10-15T11:00:00Z', status: 'present' },
    ] as any;

    const result = computeAttendanceStreak(records);
    // Should be a 2-day streak, not 4
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
    expect(result.last7Days).toEqual([false, false, false, false, false, true, true]);
  });
});
