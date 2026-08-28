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

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase configuration in environment variables');
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
