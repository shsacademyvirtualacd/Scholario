import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { trackedFetch } from '../utils/requestTracker';

function sanitizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (
    trimmed.includes('[') ||
    trimmed.includes(']') ||
    trimmed.includes('YOUR_PROJECT_REF') ||
    trimmed.includes('your-project') ||
    trimmed.includes('placeholder') ||
    trimmed.includes('example.com') ||
    trimmed.includes('<')
  ) {
    return '';
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
  } catch {}
  return '';
}

const rawUrl =
  ((import.meta as any).env?.VITE_DATABASE_URL as string) ||
  ((import.meta as any).env?.VITE_SUPABASE_URL as string) ||
  '';
const rawKey =
  ((import.meta as any).env?.VITE_DATABASE_ANON_KEY as string) ||
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) ||
  '';

const isPlaceholderKey =
  !rawKey ||
  rawKey.includes('your_') ||
  rawKey.includes('your-') ||
  rawKey.includes('placeholder') ||
  rawKey.includes('[');
const validUrl = sanitizeSupabaseUrl(rawUrl);

export const isSupabaseConfigured = Boolean(validUrl && !isPlaceholderKey);

const supabaseUrl = validUrl || 'https://placeholder-domain.supabase.co';
const supabaseAnonKey = isPlaceholderKey ? 'placeholder-anon-key' : rawKey;

if (!isSupabaseConfigured) {
  console.log(
    '[Scholario] Notice: Supabase credentials not configured. Running in offline/mock-safe mode.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: trackedFetch,
  },
});

export default supabase;

