import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../env';

export interface AuthHelperResult {
  supabase: SupabaseClient;
  token: string;
}

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

  const supabaseUrl =
    env?.SUPABASE_URL ||
    env?.VITE_SUPABASE_URL ||
    (typeof process !== 'undefined' ? process.env?.SUPABASE_URL || process.env?.VITE_SUPABASE_URL : undefined);
  const supabaseAnonKey =
    env?.SUPABASE_ANON_KEY ||
    env?.VITE_SUPABASE_ANON_KEY ||
    (typeof process !== 'undefined' ? process.env?.SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_ANON_KEY : undefined);

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

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
