import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../env';

export interface AuthHelperResult {
  supabase: SupabaseClient;
  token: string;
}

const DEFAULT_URL = 'https://placeholder-domain.supabase.co';
const DEFAULT_ANON_KEY = 'placeholder-anon-key';

export function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const jsonStr = atob(padded);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
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

  const payload = decodeJwtPayload(token);
  const issUrl =
    typeof payload?.iss === 'string' && payload.iss.startsWith('http')
      ? payload.iss.replace(/\/auth\/v1\/?$/, '')
      : '';

  const headerUrl =
    request.headers.get('X-Supabase-Url') || request.headers.get('x-supabase-url') || '';
  const headerAnonKey =
    request.headers.get('X-Supabase-Anon-Key') || request.headers.get('x-supabase-anon-key') || '';

  const supabaseUrl =
    (env.SUPABASE_URL && env.SUPABASE_URL.trim()) ||
    (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_URL.trim()) ||
    headerUrl.trim() ||
    issUrl ||
    DEFAULT_URL;

  const supabaseAnonKey =
    (env.SUPABASE_ANON_KEY && env.SUPABASE_ANON_KEY.trim()) ||
    (env.VITE_SUPABASE_ANON_KEY && env.VITE_SUPABASE_ANON_KEY.trim()) ||
    headerAnonKey.trim() ||
    DEFAULT_ANON_KEY;

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
