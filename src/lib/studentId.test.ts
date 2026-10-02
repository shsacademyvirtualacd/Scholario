import { describe, it, expect } from 'vitest';
import { formatStudentId } from './studentId';

describe('formatStudentId', () => {
  it('returns default fallback "—" when input is missing or empty', () => {
    expect(formatStudentId()).toBe('—');
    expect(formatStudentId(undefined)).toBe('—');
    expect(formatStudentId(null)).toBe('—');
    expect(formatStudentId('')).toBe('—');
  });

  it('formats legacy UUIDs by extracting the first 8 characters', () => {
    expect(formatStudentId('d5079d9d-1234-5678-90ab-cdef12345678')).toBe('d5079d9d');
    expect(formatStudentId('12345678-abcd-ef00-1122-334455667788')).toBe('12345678');
  });

  it('handles hyphenated strings shorter than 8 characters', () => {
    expect(formatStudentId('a-b')).toBe('a-b');
    expect(formatStudentId('123-45')).toBe('123-45');
  });

  it('returns numeric student IDs unchanged', () => {
    expect(formatStudentId('48213')).toBe('48213');
    expect(formatStudentId('9042')).toBe('9042');
    expect(formatStudentId('1000')).toBe('1000');
  });

  it('trims leading and trailing whitespace', () => {
    expect(formatStudentId('  48213  ')).toBe('48213');
    expect(formatStudentId('  d5079d9d-1234-5678-90ab-cdef12345678  ')).toBe('d5079d9d');
  });

  it('returns non-hyphenated alphanumeric strings as-is', () => {
    expect(formatStudentId('ABC12345')).toBe('ABC12345');
    expect(formatStudentId('STUDENT01')).toBe('STUDENT01');
  });
});
