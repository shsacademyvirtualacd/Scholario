import { describe, it, expect } from 'vitest';
import { getDefaultPrice } from '../taxonomy';

describe('getDefaultPrice', () => {
  it('returns 4000 for grade 11', () => {
    expect(getDefaultPrice('11')).toBe(4000);
  });

  it('returns 4000 for grade 12', () => {
    expect(getDefaultPrice('12')).toBe(4000);
  });

  it('returns 3000 for grade 9', () => {
    expect(getDefaultPrice('9')).toBe(3000);
  });

  it('returns 3000 for grade 10', () => {
    expect(getDefaultPrice('10')).toBe(3000);
  });

  it('returns 3000 for empty string', () => {
    expect(getDefaultPrice('')).toBe(3000);
  });

  it('returns 3000 for unknown grades', () => {
    expect(getDefaultPrice('8')).toBe(3000);
    expect(getDefaultPrice('Kindergarten')).toBe(3000);
  });
});
