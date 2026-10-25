import type { R2Bucket } from '@cloudflare/workers-types';

export interface Env {
  NOTES_BUCKET: R2Bucket;
  AVATARS_BUCKET?: R2Bucket;
  CHAT_ATTACHMENTS?: R2Bucket;
  APK_BUCKET?: R2Bucket;
  R2_APK_BUCKET?: R2Bucket;
  BUCKET?: R2Bucket;
  PUBLIC_DOMAIN?: string;
  APK_PUBLIC_DOMAIN?: string;
  VITE_APK_PUBLIC_DOMAIN?: string;
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}
