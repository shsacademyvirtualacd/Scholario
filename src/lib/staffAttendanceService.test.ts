import { describe, it, expect } from 'vitest';
import { formatDurationHuman } from './staffAttendanceService';

describe('formatDurationHuman', () => {
  describe('non-positive and edge values', () => {
    it('returns "0m" for 0 seconds', () => {
      expect(formatDurationHuman(0)).toBe('0m');
    });

    it('returns "0m" for negative numbers', () => {
      expect(formatDurationHuman(-1)).toBe('0m');
      expect(formatDurationHuman(-60)).toBe('0m');
      expect(formatDurationHuman(-3600)).toBe('0m');
    });

    it('returns "0m" for NaN', () => {
      expect(formatDurationHuman(NaN)).toBe('0m');
    });
  });

  describe('durations under 1 minute (< 60 seconds)', () => {
    it('returns "0m" for durations less than 60 seconds', () => {
      expect(formatDurationHuman(1)).toBe('0m');
      expect(formatDurationHuman(30)).toBe('0m');
      expect(formatDurationHuman(59)).toBe('0m');
    });
  });

  describe('durations in minutes (< 1 hour)', () => {
    it('returns "1m" for exactly 60 seconds', () => {
      expect(formatDurationHuman(60)).toBe('1m');
    });

    it('floors seconds to minutes correctly', () => {
      expect(formatDurationHuman(90)).toBe('1m');
      expect(formatDurationHuman(119)).toBe('1m');
      expect(formatDurationHuman(120)).toBe('2m');
    });

    it('returns "59m" for 3599 seconds', () => {
      expect(formatDurationHuman(3599)).toBe('59m');
    });
  });

  describe('durations of 1 hour or more', () => {
    it('returns "1h 0m" for exactly 3600 seconds', () => {
      expect(formatDurationHuman(3600)).toBe('1h 0m');
    });

    it('formats hours and minutes correctly', () => {
      expect(formatDurationHuman(3660)).toBe('1h 1m');
      expect(formatDurationHuman(3695)).toBe('1h 1m');
      expect(formatDurationHuman(5400)).toBe('1h 30m');
      expect(formatDurationHuman(7199)).toBe('1h 59m');
      expect(formatDurationHuman(7200)).toBe('2h 0m');
    });

    it('handles large durations (e.g. 24 hours / multiple days)', () => {
      expect(formatDurationHuman(86400)).toBe('24h 0m');
      expect(formatDurationHuman(90000)).toBe('25h 0m');
    });
  });

  describe('fractional seconds', () => {
    it('handles floating point inputs gracefully', () => {
      expect(formatDurationHuman(0.5)).toBe('0m');
      expect(formatDurationHuman(60.9)).toBe('1m');
      expect(formatDurationHuman(3600.5)).toBe('1h 0m');
      expect(formatDurationHuman(3660.8)).toBe('1h 1m');
    });
  });
});
