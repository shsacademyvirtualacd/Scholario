import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../env';

export interface AuthHelperResult {
  supabase: SupabaseClient;
  token: string;
}

export interface SafeSupabaseClientOptions {
  /**
   * Set to true ONLY in server-side functions that genuinely need to bypass RLS
   * (e.g. read-only admin aggregations or system cron sweeps). Never expose the
   * service role key to the client.
   */
  useServiceRole?: boolean;
  /**
   * Whether to forward the caller's Authorization Bearer token to Supabase.
   * Defaults to true when useServiceRole is false.
   */
  forwardAuthHeader?: boolean;
}

export interface SafeSupabaseClientResult {
  supabase: SupabaseClient | null;
  missingVars: string[];
  errorMessage: string | null;
  usingServiceRole: boolean;
}

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

function sanitizeHttpUrl(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (
    !trimmed ||
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
  } catch {
    // invalid URL
  }
  return '';
}

function sanitizeKey(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (
    !trimmed ||
    trimmed === 'placeholder-anon-key' ||
    trimmed.includes('your_') ||
    trimmed.includes('your-') ||
    trimmed.includes('placeholder') ||
    trimmed.includes('[')
  ) {
    return '';
  }
  return trimmed;
}

export function extractBearerToken(request?: Request | any): string {
  if (!request?.headers) return '';
  const authHeader =
    request.headers.get?.('Authorization') ||
    request.headers.get?.('authorization') ||
    request.headers['authorization'] ||
    request.headers['Authorization'] ||
    '';
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  if (request?.url) {
    try {
      const url = new URL(request.url);
      return (url.searchParams.get('token') || '').trim();
    } catch {
      // ignore
    }
  }
  return '';
}

/**
 * Shared runtime configuration resolver for Supabase in Cloudflare Pages Functions.
 * Reads from runtime `context.env` (with fallbacks to process.env for local dev),
 * and never crashes with "supabaseUrl is required."
 */
export function resolveSupabaseRuntimeConfig(
  env: Env | Record<string, any> | undefined,
  request?: Request | any,
  options: SafeSupabaseClientOptions = {}
): {
  supabaseUrl: string;
  supabaseKey: string;
  usingServiceRole: boolean;
  missingVars: string[];
} {
  const runtimeEnv: Record<string, any> = (env as any) || {};
  const procEnv: Record<string, any> =
    typeof process !== 'undefined' && process.env ? process.env : {};

  const token = extractBearerToken(request);
  const payload = token ? decodeJwtPayload(token) : null;
  const issUrl =
    typeof payload?.iss === 'string' && payload.iss.startsWith('http')
      ? payload.iss.replace(/\/auth\/v1\/?$/, '')
      : '';

  const headerUrl =
    request?.headers?.get?.('X-Supabase-Url') ||
    request?.headers?.get?.('x-supabase-url') ||
    '';
  const headerAnonKey =
    request?.headers?.get?.('X-Supabase-Anon-Key') ||
    request?.headers?.get?.('x-supabase-anon-key') ||
    '';

  const supabaseUrl =
    sanitizeHttpUrl(runtimeEnv.SUPABASE_URL) ||
    sanitizeHttpUrl(runtimeEnv.VITE_SUPABASE_URL) ||
    sanitizeHttpUrl(runtimeEnv.VITE_DATABASE_URL) ||
    sanitizeHttpUrl(procEnv.SUPABASE_URL) ||
    sanitizeHttpUrl(procEnv.VITE_SUPABASE_URL) ||
    sanitizeHttpUrl(procEnv.VITE_DATABASE_URL) ||
    sanitizeHttpUrl(headerUrl) ||
    sanitizeHttpUrl(issUrl);

  const serviceRoleKey =
    sanitizeKey(runtimeEnv.SUPABASE_SERVICE_ROLE_KEY) ||
    sanitizeKey(procEnv.SUPABASE_SERVICE_ROLE_KEY);

  const anonKey =
    sanitizeKey(runtimeEnv.SUPABASE_ANON_KEY) ||
    sanitizeKey(runtimeEnv.VITE_SUPABASE_ANON_KEY) ||
    sanitizeKey(runtimeEnv.VITE_DATABASE_ANON_KEY) ||
    sanitizeKey(procEnv.SUPABASE_ANON_KEY) ||
    sanitizeKey(procEnv.VITE_SUPABASE_ANON_KEY) ||
    sanitizeKey(procEnv.VITE_DATABASE_ANON_KEY) ||
    sanitizeKey(headerAnonKey);

  let supabaseKey = '';
  let usingServiceRole = false;

  if (options.useServiceRole && serviceRoleKey) {
    supabaseKey = serviceRoleKey;
    usingServiceRole = true;
  } else if (anonKey) {
    supabaseKey = anonKey;
    usingServiceRole = false;
  } else if (serviceRoleKey) {
    supabaseKey = serviceRoleKey;
    usingServiceRole = true;
  }

  const missingVars: string[] = [];
  if (!supabaseUrl) {
    missingVars.push('SUPABASE_URL');
  }
  if (!supabaseKey) {
    missingVars.push(
      options.useServiceRole
        ? 'SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)'
        : 'SUPABASE_ANON_KEY'
    );
  }

  return {
    supabaseUrl,
    supabaseKey,
    usingServiceRole,
    missingVars,
  };
}

/**
 * Safely creates a Supabase client from Cloudflare Pages runtime `context.env`.
 * Never throws "supabaseUrl is required." — if variables are missing, logs the
 * missing variable names (names only, never values) and returns `supabase: null`.
 */
export function createSafeSupabaseClient(
  env: Env | Record<string, any> | undefined,
  request?: Request | any,
  options: SafeSupabaseClientOptions = {}
): SafeSupabaseClientResult {
  const { supabaseUrl, supabaseKey, usingServiceRole, missingVars } =
    resolveSupabaseRuntimeConfig(env, request, options);

  if (missingVars.length > 0 || !supabaseUrl || !supabaseKey) {
    console.warn(
      `[Cloudflare Pages Supabase Config] Missing runtime environment variable(s): ${missingVars.join(', ')}`
    );
    return {
      supabase: null,
      missingVars,
      errorMessage: `Server database configuration is incomplete. Missing runtime environment variable(s): ${missingVars.join(', ')}.`,
      usingServiceRole: false,
    };
  }

  const forwardAuth = options.forwardAuthHeader ?? !usingServiceRole;
  const token = forwardAuth ? extractBearerToken(request) : '';

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return {
      supabase,
      missingVars: [],
      errorMessage: null,
      usingServiceRole,
    };
  } catch (err: any) {
    console.error(
      '[Cloudflare Pages Supabase Config] Failed to initialize Supabase client:',
      err?.message || String(err)
    );
    return {
      supabase: null,
      missingVars,
      errorMessage: 'Failed to initialize database client.',
      usingServiceRole: false,
    };
  }
}

/**
 * Extracts Bearer token from Authorization header (or ?token= query parameter fallback for <a> and <img> tags)
 * and returns an authenticated Supabase client. This ensures exact RLS policy enforcement.
 */
export function getAuthenticatedSupabaseClient(request: any, env: Env): AuthHelperResult | null {
  const token = extractBearerToken(request);
  if (!token) {
    return null;
  }

  const { supabaseUrl, supabaseKey, missingVars } = resolveSupabaseRuntimeConfig(env, request, {
    useServiceRole: false,
  });

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      `[Supabase Auth] Cannot create authenticated client — missing runtime variable(s): ${missingVars.join(', ')}`
    );
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
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
