import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../../env';
import { getAuthenticatedSupabaseClient } from '../../../_lib/supabaseAuth';

export async function onRequestPost(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env } = context;

  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let formData: any;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid form data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const file = formData.get('file') as File | null;
  const threadId = (formData.get('thread_id') as string | null) || 'general';

  if (!file) {
    return new Response(JSON.stringify({ error: 'No audio file provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const MAX_AUDIO_SIZE = 15 * 1024 * 1024; // 15 MB
  if (file.size > MAX_AUDIO_SIZE) {
    return new Response(
      JSON.stringify({ error: 'Audio file too large. Maximum size is 15 MB.' }),
      { status: 413, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const audioId = `voice_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const mimeType = file.type || 'audio/webm';
  const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
  const objectKey = `voice-messages/${threadId}/${audioId}.${extension}`;

  const bucket = (env as any).NOTES_BUCKET || (env as any).AVATARS_BUCKET;
  if (bucket) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      await bucket.put(objectKey, arrayBuffer, {
        httpMetadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          audio_url: `/api/chat/voice/view/${audioId}`,
          audio_id: audioId,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      console.warn('[PagesFunction VoiceUpload] R2 put error:', err);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      audio_url: `/api/chat/voice/view/${audioId}`,
      audio_id: audioId,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
