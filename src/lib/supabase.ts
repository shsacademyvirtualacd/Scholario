import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { trackedFetch } from '../utils/requestTracker';

const fallbackUrl = 'https://rxgrxjlyrfzojvirkhdc.supabase.co';
const fallbackKey = 'placeholder-anon-key';

const supabaseUrl = ((import.meta as any).env?.VITE_DATABASE_URL as string) || ((import.meta as any).env?.VITE_SUPABASE_URL as string) || fallbackUrl;
const supabaseAnonKey = ((import.meta as any).env?.VITE_DATABASE_ANON_KEY as string) || ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || fallbackKey;

if (!(((import.meta as any).env?.VITE_DATABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL) && ((import.meta as any).env?.VITE_DATABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY))) {
  console.warn(
    '[Scholario] Using default/fallback backend configuration. Set environment variables for custom environments.'
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

