import { describe, it, expect } from 'vitest';
import { formatGradeDisplay } from './taxonomy';

describe('formatGradeDisplay', () => {
  describe('Falsy and Missing Grade Inputs', () => {
    it('returns "General" when grade is undefined, null, or empty string', () => {
      expect(formatGradeDisplay(undefined)).toBe('General');
      expect(formatGradeDisplay(null)).toBe('General');
      expect(formatGradeDisplay('')).toBe('General');
    });
  });

  describe('IELTS Inputs', () => {
    it('returns "IELTS Preparation" when grade is "ielts" (case-insensitive)', () => {
      expect(formatGradeDisplay('ielts')).toBe('IELTS Preparation');
      expect(formatGradeDisplay('IELTS')).toBe('IELTS Preparation');
    });

    it('returns "IELTS Preparation" when grade contains "ielts"', () => {
      expect(formatGradeDisplay('IELTS Preparation')).toBe('IELTS Preparation');
      expect(formatGradeDisplay('Course IELTS')).toBe('IELTS Preparation');
    });

    it('returns "IELTS Preparation" when board is "ielts" regardless of grade string', () => {
      expect(formatGradeDisplay('9', 'ielts')).toBe('IELTS Preparation');
      expect(formatGradeDisplay('10', 'IELTS')).toBe('IELTS Preparation');
    });
  });

  describe('Cambridge (O Level / A Level) Inputs', () => {
    it('prefixes with "Class " when board is olevel or alevel', () => {
      expect(formatGradeDisplay('O1', 'olevel')).toBe('Class O1');
      expect(formatGradeDisplay('A1', 'alevel')).toBe('Class A1');
    });

    it('prefixes with "Class " when grade starts with "o" or "a"', () => {
      expect(formatGradeDisplay('O1')).toBe('Class O1');
      expect(formatGradeDisplay('a2')).toBe('Class a2');
    });

    it('does not double prefix if grade already starts with "Class " or "Grade "', () => {
      expect(formatGradeDisplay('Class O1', 'olevel')).toBe('Class O1');
      expect(formatGradeDisplay('Grade A1', 'alevel')).toBe('Grade A1');
      expect(formatGradeDisplay('class O2')).toBe('class O2');
      expect(formatGradeDisplay('grade A2')).toBe('grade A2');
    });
  });

  describe('Standard Board and Grade Inputs', () => {
    it('prefixes standard numeric grades with "Grade "', () => {
      expect(formatGradeDisplay('9', 'fbise')).toBe('Grade 9');
      expect(formatGradeDisplay('10', 'sindh')).toBe('Grade 10');
      expect(formatGradeDisplay('11', 'punjab')).toBe('Grade 11');
      expect(formatGradeDisplay('12', 'kpk')).toBe('Grade 12');
      expect(formatGradeDisplay('9')).toBe('Grade 9');
    });

    it('preserves grade if it already starts with "Grade" or "Class"', () => {
      expect(formatGradeDisplay('Grade 9', 'fbise')).toBe('Grade 9');
      expect(formatGradeDisplay('Class 10', 'sindh')).toBe('Class 10');
      expect(formatGradeDisplay('grade 11')).toBe('grade 11');
      expect(formatGradeDisplay('class 12')).toBe('class 12');
    });
  });
});
