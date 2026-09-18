import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateUniqueNumericStudentId, formatStudentId } from '../studentId';
import { supabase } from '../supabase';

vi.mock('../supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

describe('studentId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateUniqueNumericStudentId', () => {
    it('returns ID from RPC if server-side RPC succeeds with a valid 4-5 digit string', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: '48213',
        error: null,
      } as any);

      const id = await generateUniqueNumericStudentId();
      expect(id).toBe('48213');
      expect(supabase.rpc).toHaveBeenCalledWith('generate_unique_student_id');
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('falls back to client generation if RPC returns error', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC function not found' },
      } as any);

      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null });
      const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

      const id = await generateUniqueNumericStudentId();
      expect(id).toMatch(/^\d{4,5}$/);
      expect(supabase.rpc).toHaveBeenCalledWith('generate_unique_student_id');
      expect(supabase.from).toHaveBeenCalledWith('roster');
    });

    it('falls back to client generation if RPC returns invalid non-numeric or wrong length data', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: '12', // Too short (less than 4 digits)
        error: null,
      } as any);

      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null });
      const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

      const id = await generateUniqueNumericStudentId();
      expect(id).toMatch(/^\d{4,5}$/);
      expect(supabase.from).toHaveBeenCalledWith('roster');
    });

    it('falls back to client generation if RPC throws an exception', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(supabase.rpc).mockRejectedValueOnce(new Error('Network error'));

      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null });
      const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

      const id = await generateUniqueNumericStudentId();
      expect(id).toMatch(/^\d{4,5}$/);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[studentId] RPC generate_unique_student_id fallback:',
        expect.any(Error)
      );
    });

    it('retries client generation if candidate ID already exists in roster until unique candidate is found', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC error' },
      } as any);

      let attempts = 0;
      const maybeSingleMock = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts === 1) {
          return Promise.resolve({ data: { id: '9999' } }); // candidate exists
        }
        return Promise.resolve({ data: null }); // candidate unique
      });

      const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

      const id = await generateUniqueNumericStudentId();
      expect(id).toMatch(/^\d{4,5}$/);
      expect(maybeSingleMock).toHaveBeenCalledTimes(2);
    });

    it('throws error if unique ID cannot be generated after 50 attempts', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC error' },
      } as any);

      const maybeSingleMock = vi.fn().mockResolvedValue({ data: { id: 'exists' } });
      const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

      await expect(generateUniqueNumericStudentId()).rejects.toThrow(
        'Unable to generate unique numeric student ID.'
      );
      expect(maybeSingleMock).toHaveBeenCalledTimes(50);
    });
  });

  describe('formatStudentId', () => {
    it('returns "—" for undefined, null, or empty string', () => {
      expect(formatStudentId(undefined)).toBe('—');
      expect(formatStudentId(null)).toBe('—');
      expect(formatStudentId('')).toBe('—');
      expect(formatStudentId('   ')).toBe('');
    });

    it('returns 8-character prefix for legacy UUIDs containing hyphens', () => {
      expect(formatStudentId('d5079d9d-1234-5678-90ab-cdef12345678')).toBe('d5079d9d');
      expect(formatStudentId('  12345678-abcd  ')).toBe('12345678');
    });

    it('returns ID as-is for numeric or hyphenless IDs', () => {
      expect(formatStudentId('48213')).toBe('48213');
      expect(formatStudentId('9042')).toBe('9042');
      expect(formatStudentId('  12345  ')).toBe('12345');
    });
  });
});
