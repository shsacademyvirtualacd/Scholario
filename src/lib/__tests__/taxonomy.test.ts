import { describe, it, expect } from 'vitest';
import { formatGradeDisplay } from '../taxonomy';

describe('formatGradeDisplay', () => {
  it('returns "General" when grade is null, undefined, or empty string', () => {
    expect(formatGradeDisplay(null)).toBe('General');
    expect(formatGradeDisplay(undefined)).toBe('General');
    expect(formatGradeDisplay('')).toBe('General');
  });

  it('formats standard numeric grades cleanly', () => {
    expect(formatGradeDisplay('9')).toBe('Grade 9');
    expect(formatGradeDisplay('10', 'fbise')).toBe('Grade 10');
    expect(formatGradeDisplay('11')).toBe('Grade 11');
  });

  it('preserves existing "Grade" or "Class" prefix if already present', () => {
    expect(formatGradeDisplay('Grade 9')).toBe('Grade 9');
    expect(formatGradeDisplay('Class 10')).toBe('Class 10');
    expect(formatGradeDisplay('grade 9')).toBe('grade 9');
  });

  it('formats O-Level and A-Level grades with "Class" prefix', () => {
    expect(formatGradeDisplay('O1', 'olevel')).toBe('Class O1');
    expect(formatGradeDisplay('A2', 'alevel')).toBe('Class A2');
    expect(formatGradeDisplay('9', 'olevel')).toBe('Class 9');
    expect(formatGradeDisplay('Class O1', 'olevel')).toBe('Class O1');
  });

  it('formats IELTS inputs as "IELTS Preparation"', () => {
    expect(formatGradeDisplay('IELTS')).toBe('IELTS Preparation');
    expect(formatGradeDisplay('9', 'ielts')).toBe('IELTS Preparation');
    expect(formatGradeDisplay('IELTS Academic')).toBe('IELTS Preparation');
  });
});
