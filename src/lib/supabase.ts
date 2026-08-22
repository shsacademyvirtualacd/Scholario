import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { trackedFetch } from '../utils/requestTracker';

const fallbackUrl = 'https://rxgrxjlyrfzojvirkhdc.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Z3J4amx5cmZ6b2p2aXJraGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTc3OTksImV4cCI6MjA5ODkzMzc5OX0.ggAT2JiBTg6VG5tbZNnjkig7F73JE0ZzPl_145yuow4';

const supabaseUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || fallbackUrl;
const supabaseAnonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || fallbackKey;

if (!((import.meta as any).env?.VITE_SUPABASE_URL && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY)) {
  console.warn(
    '[Scholario] Using default/fallback Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for custom environments.'
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

