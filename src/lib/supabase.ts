import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Scholario] Missing Supabase environment variables.\n' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
