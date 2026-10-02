import { describe, it, expect } from 'vitest';
import {
  timeToMinutes,
  getCurrentDayOfWeek,
  formatDurationHuman,
  formatDurationTimer,
  evaluateLateness,
} from './staffAttendanceService';

describe('staffAttendanceService - timeToMinutes', () => {
  it('should parse standard 24-hour time strings correctly', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('00:01')).toBe(1);
    expect(timeToMinutes('00:30')).toBe(30);
    expect(timeToMinutes('01:00')).toBe(60);
    expect(timeToMinutes('09:15')).toBe(555);
    expect(timeToMinutes('12:00')).toBe(720);
    expect(timeToMinutes('14:30')).toBe(870);
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  it('should parse single-digit hours and minutes correctly', () => {
    expect(timeToMinutes('9:5')).toBe(545);
    expect(timeToMinutes('0:0')).toBe(0);
    expect(timeToMinutes('1:2')).toBe(62);
  });

  it('should handle empty or null/undefined inputs gracefully', () => {
    expect(timeToMinutes('')).toBe(0);
    expect(timeToMinutes(null as unknown as string)).toBe(0);
    expect(timeToMinutes(undefined as unknown as string)).toBe(0);
  });

  it('should handle malformed or non-numeric time strings safely', () => {
    expect(timeToMinutes('invalid')).toBe(0);
    expect(timeToMinutes('abc:def')).toBe(0);
    expect(timeToMinutes(':30')).toBe(30);
    expect(timeToMinutes('14:')).toBe(840);
    expect(timeToMinutes('14')).toBe(840);
  });

  it('should handle time strings with seconds (HH:MM:SS)', () => {
    expect(timeToMinutes('14:30:45')).toBe(870);
    expect(timeToMinutes('09:15:00')).toBe(555);
  });

  it('should handle whitespace padded time strings', () => {
    expect(timeToMinutes(' 14:30 ')).toBe(870);
  });
});

describe('staffAttendanceService - getCurrentDayOfWeek', () => {
  it('should return 1 for Monday through 6 for Saturday', () => {
    // 2026-10-05 is a Monday
    const monday = new Date('2026-10-05T10:00:00Z');
    expect(getCurrentDayOfWeek(monday)).toBe(1);

    // 2026-10-10 is a Saturday
    const saturday = new Date('2026-10-10T10:00:00Z');
    expect(getCurrentDayOfWeek(saturday)).toBe(6);
  });

  it('should return 7 for Sunday instead of 0', () => {
    // 2026-10-04 is a Sunday
    const sunday = new Date('2026-10-04T10:00:00Z');
    expect(getCurrentDayOfWeek(sunday)).toBe(7);
  });
});

describe('staffAttendanceService - formatDurationHuman', () => {
  it('should format 0 or negative seconds as 0m', () => {
    expect(formatDurationHuman(0)).toBe('0m');
    expect(formatDurationHuman(-50)).toBe('0m');
  });

  it('should format minutes only when less than 1 hour', () => {
    expect(formatDurationHuman(45)).toBe('0m');
    expect(formatDurationHuman(120)).toBe('2m');
    expect(formatDurationHuman(3599)).toBe('59m');
  });

  it('should format hours and minutes when 1 hour or greater', () => {
    expect(formatDurationHuman(3600)).toBe('1h 0m');
    expect(formatDurationHuman(3660)).toBe('1h 1m');
    expect(formatDurationHuman(7380)).toBe('2h 3m');
  });
});

describe('staffAttendanceService - formatDurationTimer', () => {
  it('should return 00:00:00 for 0 or negative seconds', () => {
    expect(formatDurationTimer(0)).toBe('00:00:00');
    expect(formatDurationTimer(-10)).toBe('00:00:00');
  });

  it('should format seconds into HH:MM:SS with leading zeroes', () => {
    expect(formatDurationTimer(5)).toBe('00:00:05');
    expect(formatDurationTimer(65)).toBe('00:01:05');
    expect(formatDurationTimer(3665)).toBe('01:01:05');
  });
});

describe('staffAttendanceService - evaluateLateness', () => {
  it('should return non-late when clock-in is on or before scheduled start', () => {
    const clockIn = new Date('2026-10-02T09:00:00');
    const result = evaluateLateness(clockIn, '09:00', 15);
    expect(result).toEqual({ isLate: false, minutesLate: 0 });
  });

  it('should return non-late when clock-in is within grace period', () => {
    const clockIn = new Date('2026-10-02T09:10:00'); // 10 mins late
    const result = evaluateLateness(clockIn, '09:00', 15); // grace is 15 mins
    expect(result).toEqual({ isLate: false, minutesLate: 0 });
  });

  it('should return late when clock-in exceeds grace period', () => {
    const clockIn = new Date('2026-10-02T09:20:00'); // 20 mins late
    const result = evaluateLateness(clockIn, '09:00', 15); // grace is 15 mins
    expect(result).toEqual({ isLate: true, minutesLate: 20 });
  });

  it('should handle empty schedule time string', () => {
    const clockIn = new Date('2026-10-02T09:00:00');
    const result = evaluateLateness(clockIn, '', 15);
    expect(result).toEqual({ isLate: false, minutesLate: 0 });
  });
});
