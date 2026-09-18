import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { trackedFetch } from '../utils/requestTracker';

const supabaseUrl =
  ((import.meta as any).env?.VITE_SUPABASE_URL as string) ||
  (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : undefined);
const supabaseAnonKey =
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) ||
  (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required Supabase configuration: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables must be defined.'
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

