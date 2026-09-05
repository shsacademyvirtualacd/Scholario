import { supabase } from './supabase';

/**
 * Generates a unique 4-5 digit numeric student ID (e.g. "48213", "9042").
 * Strictly numeric only, no letters, no special characters.
 * Ensures uniqueness against public.roster table.
 */
export async function generateUniqueNumericStudentId(): Promise<string> {
  // 1. Try server-side RPC first
  try {
    const { data, error } = await (supabase as any).rpc('generate_unique_student_id');
    if (!error && data && /^\d{4,5}$/.test(String(data))) {
      return String(data);
    }
  } catch (err) {
    console.warn('[studentId] RPC generate_unique_student_id fallback:', err);
  }

  // 2. Client-side generator with direct uniqueness verification
  for (let attempt = 0; attempt < 50; attempt++) {
    // Generate between 1000 and 99999 (4-5 digits, e.g. "48213", "9042")
    const candidate = Math.floor(1000 + Math.random() * (99999 - 1000 + 1)).toString();
    const { data: existing } = await (supabase as any)
      .from('roster')
      .select('id')
      .eq('id', candidate)
      .maybeSingle();

    if (!existing) {
      return candidate;
    }
  }

  throw new Error('Unable to generate unique numeric student ID.');
}

/**
 * Normalizes and formats student ID for display:
 * - If it is a legacy UUID (contains hyphens), displays the 8-character prefix (e.g. "d5079d9d")
 * - If it is a new numeric ID (e.g. "48213", "9042"), displays as-is
 */
export function formatStudentId(id?: string | null): string {
  if (!id) return '—';
  const clean = id.trim();
  if (clean.includes('-')) {
    return clean.slice(0, 8);
  }
  return clean;
}
