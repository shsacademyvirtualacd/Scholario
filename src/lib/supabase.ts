import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { trackedFetch } from '../utils/requestTracker';

const supabaseUrl =
  ((import.meta as any).env?.VITE_DATABASE_URL as string) ||
  ((import.meta as any).env?.VITE_SUPABASE_URL as string) ||
  '';
const supabaseAnonKey =
  ((import.meta as any).env?.VITE_DATABASE_ANON_KEY as string) ||
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Scholario] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.'
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

