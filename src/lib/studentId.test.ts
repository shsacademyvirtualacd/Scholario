import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatStudentId } from './studentId.js';

describe('formatStudentId', () => {
  it('returns default fallback "—" when input is null, undefined, or empty/whitespace string', () => {
    assert.strictEqual(formatStudentId(null), '—');
    assert.strictEqual(formatStudentId(undefined), '—');
    assert.strictEqual(formatStudentId(''), '—');
    assert.strictEqual(formatStudentId('   '), '—');
  });

  it('returns plain numeric student IDs as-is (with trimmed whitespace)', () => {
    assert.strictEqual(formatStudentId('48213'), '48213');
    assert.strictEqual(formatStudentId('9042'), '9042');
    assert.strictEqual(formatStudentId('  12345  '), '12345');
  });

  it('truncates hyphenated legacy UUIDs to the first 8 characters', () => {
    assert.strictEqual(
      formatStudentId('d5079d9d-1234-5678-90ab-cdef12345678'),
      'd5079d9d'
    );
    assert.strictEqual(
      formatStudentId('  abc-12345-67890  '),
      'abc-1234'
    );
  });

  it('handles edge case hyphenated strings shorter than 8 characters', () => {
    assert.strictEqual(formatStudentId('a-b'), 'a-b');
    assert.strictEqual(formatStudentId('12-34'), '12-34');
  });
});
