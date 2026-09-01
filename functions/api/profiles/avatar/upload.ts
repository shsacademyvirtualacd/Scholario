import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../../env';
import { getAuthenticatedSupabaseClient } from '../../../_lib/supabaseAuth';

export async function onRequestPost(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env } = context;
  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid authentication token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const { supabase, token } = auth;

  // Extract userId from JWT payload
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

  let formData: any;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid form data payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return new Response(JSON.stringify({ error: 'No image file provided for profile picture' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Max file size: 2 MB
  const MAX_SIZE_BYTES = 2 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    return new Response(
      JSON.stringify({
        error: `Image file too large. Maximum allowed size is 2 MB. Selected file is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`,
      }),
      { status: 413, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer.slice(0, 16));

  // Magic bytes validation
  let mimeType = 'image/jpeg';
  let ext = 'jpg';

  const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 && 
                bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A;
  const isWebp = bytes.length >= 12 && 
                 bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
                 bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

  if (isJpeg) {
    mimeType = 'image/jpeg';
    ext = 'jpg';
  } else if (isPng) {
    mimeType = 'image/png';
    ext = 'png';
  } else if (isWebp) {
    mimeType = 'image/webp';
    ext = 'webp';
  } else {
    return new Response(
      JSON.stringify({ error: 'Unsupported file format. Please upload a valid JPG, PNG, or WebP image.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Format object key: profile-pictures/{user_id}/{timestamp}-{filename}
  const timestamp = Date.now();
  const rawFileName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'avatar';
  const cleanFileName = rawFileName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  const objectKey = `profile-pictures/${userId}/${timestamp}-${cleanFileName}.${ext}`;

  // Target bucket (dedicated AVATARS_BUCKET with fallback to NOTES_BUCKET)
  const bucket = (env as any).AVATARS_BUCKET || env.NOTES_BUCKET;
  if (!bucket) {
    return new Response(JSON.stringify({ error: 'Storage bucket configuration not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Upload to R2
  try {
    await bucket.put(objectKey, arrayBuffer, {
      httpMetadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    console.error('[AvatarUpload] R2 put error:', err);
    return new Response(JSON.stringify({ error: `Storage upload failed: ${err.message || 'Unknown error'}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Retrieve current profile to locate previous avatar for deletion
  let previousAvatarUrl: string | null = null;
  try {
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .maybeSingle();
    previousAvatarUrl = currentProfile?.avatar_url || null;
  } catch (fetchErr) {
    console.warn('[AvatarUpload] Could not fetch previous avatar_url:', fetchErr);
  }

  // Update Supabase profile with new avatar URL
  const viewUrl = `/api/profiles/avatar/view/${encodeURIComponent(objectKey)}`;
  const { error: updateError } = await (supabase as any)
    .from('profiles')
    .update({ avatar_url: viewUrl })
    .eq('id', userId);

  if (updateError) {
    console.error('[AvatarUpload] DB update error:', updateError);
    // Cleanup newly uploaded R2 object to avoid orphan files on DB failure
    try {
      await bucket.delete(objectKey);
    } catch {}
    return new Response(JSON.stringify({ error: `Database update failed: ${updateError.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Also sync teacher record if present
  try {
    await (supabase as any)
      .from('teachers')
      .update({ avatar_url: viewUrl })
      .eq('id', userId);
  } catch {}

  // Delete previous R2 avatar object if it existed
  if (previousAvatarUrl && previousAvatarUrl.includes('profile-pictures/')) {
    try {
      const decodedPrev = decodeURIComponent(previousAvatarUrl);
      const match = decodedPrev.match(/profile-pictures\/[^?#]+/);
      if (match && match[0] && match[0] !== objectKey) {
        await bucket.delete(match[0]);
      }
    } catch (cleanupErr) {
      console.warn('[AvatarUpload] Error cleaning up old avatar:', cleanupErr);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      avatar_url: viewUrl,
      object_key: objectKey,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
