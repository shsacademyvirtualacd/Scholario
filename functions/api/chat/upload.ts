import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../env';
import { getAuthenticatedSupabaseClient } from '../../_lib/supabaseAuth';

// Allowlist definition: image/*, application/pdf, .doc, .docx
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'svg',
  'bmp',
  'heic',
  'heif',
]);

function isAllowedFile(file: File): boolean {
  const mime = (file.type || '').toLowerCase();
  if (mime.startsWith('image/')) return true;
  if (ALLOWED_MIME_TYPES.has(mime)) return true;

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext)) return true;

  return false;
}

export async function onRequestPost(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env } = context;

  // 1. Authenticate request using Supabase JWT / Session
  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { token } = auth;
  let userId = '';
  try {
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64));
    userId = payload.sub || '';
    if (!userId) throw new Error('No user sub claim');
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token payload' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Parse multipart/form-data
  let formData: any;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid form-data payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const file = formData.get('file') as File | null;
  const conversationId = (formData.get('conversation_id') as string | null) ||
    (formData.get('thread_id') as string | null);

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!conversationId) {
    return new Response(JSON.stringify({ error: 'Missing conversation_id parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Validate file size (<= 15MB)
  const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
  if (file.size > MAX_SIZE_BYTES) {
    return new Response(
      JSON.stringify({
        error: `File size exceeds 15 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
      }),
      { status: 413, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. Validate MIME type
  if (!isAllowedFile(file)) {
    return new Response(
      JSON.stringify({
        error: 'File type not supported. Allowed types: images (JPEG, PNG, WebP, etc.), PDF, and Word documents (.doc, .docx).',
      }),
      { status: 415, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Determine mime type and clean filename
  let mimeType = file.type;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!mimeType || mimeType === 'application/octet-stream') {
    if (ext === 'pdf') mimeType = 'application/pdf';
    else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === 'doc') mimeType = 'application/msword';
    else if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'webp') mimeType = 'image/webp';
    else mimeType = 'application/octet-stream';
  }

  const cleanFilename = (file.name || `file_${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  // Key path: {conversation_id}/{sender_id}/{timestamp}_{filename}
  const objectKey = `${conversationId}/${userId}/${timestamp}_${cleanFilename}`;

  // 5. Store object in R2 (binding: CHAT_ATTACHMENTS with fallback to NOTES_BUCKET)
  const bucket = env.CHAT_ATTACHMENTS || env.NOTES_BUCKET;
  if (!bucket) {
    return new Response(JSON.stringify({ error: 'R2 storage bucket is not configured on this Worker' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(objectKey, arrayBuffer, {
      httpMetadata: {
        contentType: mimeType,
        cacheControl: 'private, max-age=31536000, immutable',
      },
      customMetadata: {
        originalFilename: file.name,
        conversationId,
        senderId: userId,
        uploadedAt: String(timestamp),
      },
    });

    // 6. Return R2 object key (private bucket, no public URL)
    return new Response(
      JSON.stringify({
        success: true,
        key: objectKey,
        filename: file.name,
        size: file.size,
        mime_type: mimeType,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('[ChatUpload] R2 put error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to upload attachment to R2' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
