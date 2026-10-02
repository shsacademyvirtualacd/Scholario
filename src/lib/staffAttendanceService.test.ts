import { describe, it, expect } from 'vitest';
import { formatDurationHuman } from './staffAttendanceService';

describe('formatDurationHuman', () => {
  it('returns "0m" for zero, negative numbers, or invalid inputs', () => {
    expect(formatDurationHuman(0)).toBe('0m');
    expect(formatDurationHuman(-1)).toBe('0m');
    expect(formatDurationHuman(-3600)).toBe('0m');
  });

  it('returns "0m" for sub-minute durations (< 60 seconds)', () => {
    expect(formatDurationHuman(1)).toBe('0m');
    expect(formatDurationHuman(30)).toBe('0m');
    expect(formatDurationHuman(59)).toBe('0m');
  });

  it('formats durations in minutes when under 1 hour', () => {
    expect(formatDurationHuman(60)).toBe('1m');
    expect(formatDurationHuman(150)).toBe('2m');
    expect(formatDurationHuman(1800)).toBe('30m');
    expect(formatDurationHuman(3599)).toBe('59m');
  });

  it('formats exact hour durations correctly', () => {
    expect(formatDurationHuman(3600)).toBe('1h 0m');
    expect(formatDurationHuman(7200)).toBe('2h 0m');
  });

  it('formats combined hour and minute durations correctly', () => {
    expect(formatDurationHuman(3660)).toBe('1h 1m');
    expect(formatDurationHuman(5400)).toBe('1h 30m');
    expect(formatDurationHuman(9000)).toBe('2h 30m');
  });

  it('formats large duration values correctly', () => {
    expect(formatDurationHuman(360000)).toBe('100h 0m');
    expect(formatDurationHuman(366000)).toBe('101h 40m');
  });
});
