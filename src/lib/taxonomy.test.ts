import { describe, it, expect } from 'vitest';
import { getBoardDef, BOARDS } from './taxonomy';

describe('getBoardDef', () => {
  it('returns the correct BoardDef for every valid board ID in BOARDS', () => {
    for (const board of BOARDS) {
      const result = getBoardDef(board.id);
      expect(result).toBe(board);
      expect(result.id).toBe(board.id);
      expect(result.name).toBe(board.name);
      expect(result.shortName).toBe(board.shortName);
      expect(result.description).toBe(board.description);
    }
  });

  it('returns Federal Board (FBISE) as default when boardId is undefined', () => {
    const result = getBoardDef();
    expect(result).toBe(BOARDS[0]);
    expect(result.id).toBe('fbise');
  });

  it('returns Federal Board (FBISE) as default when boardId is null', () => {
    const result = getBoardDef(null);
    expect(result).toBe(BOARDS[0]);
    expect(result.id).toBe('fbise');
  });

  it('returns Federal Board (FBISE) as default when boardId is an empty string', () => {
    const result = getBoardDef('');
    expect(result).toBe(BOARDS[0]);
    expect(result.id).toBe('fbise');
  });

  it('returns Federal Board (FBISE) as default when boardId is invalid or non-existent', () => {
    const invalidIds = ['invalid-board', 'unknown', '12345', '  '];
    for (const invalidId of invalidIds) {
      const result = getBoardDef(invalidId);
      expect(result).toBe(BOARDS[0]);
      expect(result.id).toBe('fbise');
    }
  });

  it('handles case-sensitive board ID lookups strictly', () => {
    // Upper case IDs do not match exact lower case IDs in BOARDS array and fallback to BOARDS[0]
    expect(getBoardDef('FBISE')).toBe(BOARDS[0]);
    expect(getBoardDef('PUNJAB')).toBe(BOARDS[0]);
  });

  it('returns an object with all required BoardDef properties', () => {
    const result = getBoardDef('sindh');
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('shortName');
    expect(result).toHaveProperty('description');
    expect(typeof result.id).toBe('string');
    expect(typeof result.name).toBe('string');
    expect(typeof result.shortName).toBe('string');
    expect(typeof result.description).toBe('string');
  });
});
