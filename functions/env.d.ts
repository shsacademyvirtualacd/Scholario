import type { R2Bucket } from '@cloudflare/workers-types';

export interface Env {
  NOTES_BUCKET: R2Bucket;
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}
