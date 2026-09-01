import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../../env';
import { getAuthenticatedSupabaseClient } from '../../../_lib/supabaseAuth';

export async function onRequestDelete(context: EventContext<Env, any, any>): Promise<Response> {
  return handleAvatarDelete(context);
}

export async function onRequestPost(context: EventContext<Env, any, any>): Promise<Response> {
  return handleAvatarDelete(context);
}

async function handleAvatarDelete(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env } = context;
  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid authentication token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const { supabase, token } = auth;

  let userId: string;
  try {
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64));
    userId = payload.sub;
    if (!userId) throw new Error('No sub claim');
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token payload' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch current avatar_url
  let previousAvatarUrl: string | null = null;
  try {
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .maybeSingle();
    previousAvatarUrl = currentProfile?.avatar_url || null;
  } catch (fetchErr) {
    console.warn('[AvatarDelete] Could not fetch previous avatar_url:', fetchErr);
  }

  // Update profile in database
  const { error: updateError } = await (supabase as any)
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', userId);

  if (updateError) {
    return new Response(JSON.stringify({ error: `Database update failed: ${updateError.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Also sync teachers table
  try {
    await (supabase as any)
      .from('teachers')
      .update({ avatar_url: null })
      .eq('id', userId);
  } catch {}

  // Delete from R2
  const bucket = (env as any).AVATARS_BUCKET || env.NOTES_BUCKET;
  if (bucket && previousAvatarUrl && previousAvatarUrl.includes('profile-pictures/')) {
    try {
      const decodedPrev = decodeURIComponent(previousAvatarUrl);
      const match = decodedPrev.match(/profile-pictures\/[^?#]+/);
      if (match && match[0]) {
        await bucket.delete(match[0]);
      }
    } catch (cleanupErr) {
      console.warn('[AvatarDelete] Error cleaning up avatar from R2:', cleanupErr);
    }
  }

  return new Response(JSON.stringify({ success: true, avatar_url: null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
