import { describe, it, expect } from 'vitest';
import { timeToMinutes } from './staffAttendanceService';

describe('timeToMinutes', () => {
  describe('standard valid time strings', () => {
    it('returns 0 for midnight "00:00"', () => {
      expect(timeToMinutes('00:00')).toBe(0);
    });

    it('converts morning time "09:30" to 570 minutes', () => {
      expect(timeToMinutes('09:30')).toBe(570);
    });

    it('converts afternoon time "14:15" to 855 minutes', () => {
      expect(timeToMinutes('14:15')).toBe(855);
    });

    it('converts end-of-day time "23:59" to 1439 minutes', () => {
      expect(timeToMinutes('23:59')).toBe(1439);
    });

    it('handles single-digit hours and minutes "8:5"', () => {
      expect(timeToMinutes('8:5')).toBe(485);
    });
  });

  describe('empty and falsy inputs', () => {
    it('returns 0 for empty string ""', () => {
      expect(timeToMinutes('')).toBe(0);
    });

    it('returns 0 for null input', () => {
      expect(timeToMinutes(null as unknown as string)).toBe(0);
    });

    it('returns 0 for undefined input', () => {
      expect(timeToMinutes(undefined as unknown as string)).toBe(0);
    });
  });

  describe('malformed and non-numeric inputs', () => {
    it('returns 0 for non-time string without colons "invalid"', () => {
      expect(timeToMinutes('invalid')).toBe(0);
    });

    it('returns 0 when both components are non-numeric "abc:xyz"', () => {
      expect(timeToMinutes('abc:xyz')).toBe(0);
    });

    it('defaults invalid minutes to 0 for "12:abc"', () => {
      expect(timeToMinutes('12:abc')).toBe(720);
    });

    it('defaults invalid hours to 0 for "abc:30"', () => {
      expect(timeToMinutes('abc:30')).toBe(30);
    });
  });

  describe('format variations and edge cases', () => {
    it('handles missing minutes part "12" by treating minutes as 0', () => {
      expect(timeToMinutes('12')).toBe(720);
    });

    it('ignores additional seconds component in "14:30:45"', () => {
      expect(timeToMinutes('14:30:45')).toBe(870);
    });

    it('handles leading and trailing whitespace " 09:15 "', () => {
      expect(timeToMinutes(' 09:15 ')).toBe(555);
    });
  });
});
