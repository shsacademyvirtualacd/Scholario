import { describe, it, expect } from 'vitest';
import { timeStrToMins } from '../scheduleUtils';

describe('timeStrToMins', () => {
  describe('Standard 24-hour format (HH:MM and HH:MM:SS)', () => {
    it('should convert midnight (00:00) to 0 minutes', () => {
      expect(timeStrToMins('00:00')).toBe(0);
      expect(timeStrToMins('00:00:00')).toBe(0);
    });

    it('should convert morning times correctly', () => {
      expect(timeStrToMins('09:30')).toBe(570);
      expect(timeStrToMins('08:15:45')).toBe(495);
    });

    it('should convert afternoon and evening times correctly', () => {
      expect(timeStrToMins('14:45')).toBe(885);
      expect(timeStrToMins('20:05')).toBe(1205);
      expect(timeStrToMins('23:59')).toBe(1439);
    });
  });

  describe('12-hour format with AM/PM indicators', () => {
    it('should handle AM times correctly', () => {
      expect(timeStrToMins('9:30 AM')).toBe(570);
      expect(timeStrToMins('9:30am')).toBe(570);
      expect(timeStrToMins('12:00 AM')).toBe(0); // Midnight
      expect(timeStrToMins('12:30 AM')).toBe(30);
    });

    it('should handle PM times correctly', () => {
      expect(timeStrToMins('12:00 PM')).toBe(720); // Noon
      expect(timeStrToMins('12:45 PM')).toBe(765);
      expect(timeStrToMins('2:15 PM')).toBe(855);
      expect(timeStrToMins('11:59 PM')).toBe(1439);
    });
  });

  describe('Whitespace and flexible formatting', () => {
    it('should trim leading and trailing whitespace', () => {
      expect(timeStrToMins('  09:30  ')).toBe(570);
      expect(timeStrToMins(' 2:15 PM ')).toBe(855);
    });

    it('should handle single-digit hour or minute parts', () => {
      expect(timeStrToMins('2:5')).toBe(125);
      expect(timeStrToMins('0:0')).toBe(0);
    });
  });

  describe('Invalid and edge-case inputs', () => {
    it('should return 0 for empty string', () => {
      expect(timeStrToMins('')).toBe(0);
    });

    it('should return 0 for non-string or falsy inputs', () => {
      expect(timeStrToMins(null as unknown as string)).toBe(0);
      expect(timeStrToMins(undefined as unknown as string)).toBe(0);
    });

    it('should return 0 for strings without a colon separator', () => {
      expect(timeStrToMins('1200')).toBe(0);
      expect(timeStrToMins('invalid')).toBe(0);
    });
  });
});
