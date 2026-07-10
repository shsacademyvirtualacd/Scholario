import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../env';

export interface AuthHelperResult {
  supabase: SupabaseClient;
  token: string;
}

const DEFAULT_URL = 'https://rxgrxjlyrfzojvirkhdc.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Z3J4amx5cmZ6b2p2aXJraGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTc3OTksImV4cCI6MjA5ODkzMzc5OX0.ggAT2JiBTg6VG5tbZNnjkig7F73JE0ZzPl_145yuow4';

/**
 * Extracts Bearer token from Authorization header (or ?token= query parameter fallback for <a> and <img> tags)
 * and returns an authenticated Supabase client. This ensures exact RLS policy enforcement.
 */
export function getAuthenticatedSupabaseClient(request: any, env: Env): AuthHelperResult | null {
  let token = '';
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }
  if (!token) {
    try {
      const url = new URL(request.url);
      token = url.searchParams.get('token') || '';
    } catch {}
  }
  if (!token) {
    return null;
  }

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || DEFAULT_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return { supabase, token };
}
