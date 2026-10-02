import { describe, it, expect } from 'vitest';
import { formatStudentId } from './studentId';

describe('formatStudentId', () => {
  it('returns "—" fallback when input is null, undefined, or empty string', () => {
    expect(formatStudentId(null)).toBe('—');
    expect(formatStudentId(undefined)).toBe('—');
    expect(formatStudentId('')).toBe('—');
  });

  it('trims leading and trailing whitespace from student ID', () => {
    expect(formatStudentId('  48213  ')).toBe('48213');
    expect(formatStudentId('\t9042\n')).toBe('9042');
  });

  it('displays new numeric IDs as-is without modification', () => {
    expect(formatStudentId('48213')).toBe('48213');
    expect(formatStudentId('9042')).toBe('9042');
    expect(formatStudentId('10001')).toBe('10001');
  });

  it('displays non-hyphenated string IDs as-is', () => {
    expect(formatStudentId('STUDENT123')).toBe('STUDENT123');
  });

  it('displays 8-character prefix for legacy UUIDs containing hyphens', () => {
    expect(formatStudentId('d5079d9d-3a12-4c28-bf01-123456789abc')).toBe('d5079d9d');
    expect(formatStudentId('12345678-abcd-ef01-2345-6789abcdef01')).toBe('12345678');
  });

  it('handles short hyphenated strings up to 8 characters', () => {
    expect(formatStudentId('abc-def')).toBe('abc-def');
    expect(formatStudentId('a-b')).toBe('a-b');
  });
});
