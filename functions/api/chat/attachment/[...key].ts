import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../../env';
import { getAuthenticatedSupabaseClient } from '../../../_lib/supabaseAuth';

export async function onRequestGet(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env, params } = context;

  // 1. Authenticate request using Supabase JWT / Session (via Authorization: Bearer or ?token=)
  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { supabase, token } = auth;
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

  // 2. Extract R2 object key from params or URL pathname
  let objectKey = '';
  if (params && params.key) {
    if (Array.isArray(params.key)) {
      objectKey = params.key.join('/');
    } else {
      objectKey = String(params.key);
    }
  }

  if (!objectKey || objectKey.includes('%')) {
    const url = new URL(request.url);
    const prefix = '/api/chat/attachment/';
    if (url.pathname.startsWith(prefix)) {
      const rawPath = url.pathname.slice(prefix.length);
      objectKey = decodeURIComponent(rawPath);
    }
  } else {
    objectKey = decodeURIComponent(objectKey);
  }

  if (!objectKey) {
    return new Response(JSON.stringify({ error: 'Missing attachment key' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Authorization check: Requester must be either the sender or recipient
  // of the message referencing that R2 key (querying messages / chat_messages in Supabase)
  let isAuthorized = false;

  // Key format is {conversation_id}/{sender_id}/{timestamp}_{filename}
  const keyParts = objectKey.split('/');
  const conversationIdFromKey = keyParts[0] || '';
  const senderIdFromKey = keyParts[1] || '';

  // Direct check: If requester is the uploader encoded in key
  if (senderIdFromKey && senderIdFromKey === userId) {
    isAuthorized = true;
  }

  // Query database to verify message and thread membership
  if (!isAuthorized) {
    try {
      // Query chat_messages by attachment_key
      const { data: msg } = await (supabase as any)
        .from('chat_messages')
        .select('id, sender_id, thread_id, attachment_key')
        .eq('attachment_key', objectKey)
        .maybeSingle();

      if (msg) {
        if (msg.sender_id === userId) {
          isAuthorized = true;
        } else if (msg.thread_id) {
          // Check thread participants
          const { data: thread } = await (supabase as any)
            .from('chat_threads')
            .select('id, participant_one_id, participant_two_id')
            .eq('id', msg.thread_id)
            .maybeSingle();

          if (thread && (thread.participant_one_id === userId || thread.participant_two_id === userId)) {
            isAuthorized = true;
          }
        }
      } else if (conversationIdFromKey) {
        // If message row was just being created or queried by conversation
        const { data: thread } = await (supabase as any)
          .from('chat_threads')
          .select('id, participant_one_id, participant_two_id')
          .eq('id', conversationIdFromKey)
          .maybeSingle();

        if (thread && (thread.participant_one_id === userId || thread.participant_two_id === userId)) {
          isAuthorized = true;
        }
      }

      // If still not authorized, check if user is an admin / super_admin
      if (!isAuthorized) {
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();

        if (profile && (profile.role === 'admin' || profile.role === 'super_admin')) {
          isAuthorized = true;
        }
      }
    } catch (dbErr) {
      console.warn('[ChatAttachment] Authorization DB check warning:', dbErr);
    }
  }

  // If still not authorized, return 403 Forbidden
  if (!isAuthorized) {
    return new Response(
      JSON.stringify({ error: 'Forbidden: You do not have permission to access this attachment.' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 4. Retrieve object from R2 (CHAT_ATTACHMENTS or NOTES_BUCKET fallback)
  const bucket = env.CHAT_ATTACHMENTS || env.NOTES_BUCKET;
  if (!bucket) {
    return new Response(JSON.stringify({ error: 'R2 storage is unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const object = await bucket.get(objectKey);
  if (!object) {
    return new Response(JSON.stringify({ error: 'Attachment not found in storage' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 5. Determine Content-Type and Content-Disposition headers
  const headers = new Headers();
  object.writeHttpMetadata(headers as any);

  let filename = 'attachment';
  const customMeta = (object as any).customMetadata;
  if (customMeta && customMeta.originalFilename) {
    filename = customMeta.originalFilename;
  } else {
    // Extract filename from key: {conversation_id}/{sender_id}/{timestamp}_{filename}
    const lastPart = keyParts[keyParts.length - 1] || 'attachment';
    const underscoreIdx = lastPart.indexOf('_');
    filename = underscoreIdx !== -1 ? lastPart.substring(underscoreIdx + 1) : lastPart;
  }

  const url = new URL(request.url);
  const forceDownload = url.searchParams.get('download') === '1';

  // Determine mime type if missing
  if (!headers.has('Content-Type') || headers.get('Content-Type') === 'application/octet-stream') {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') headers.set('Content-Type', 'application/pdf');
    else if (ext === 'docx') headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    else if (ext === 'doc') headers.set('Content-Type', 'application/msword');
    else if (ext === 'png') headers.set('Content-Type', 'image/png');
    else if (ext === 'jpg' || ext === 'jpeg') headers.set('Content-Type', 'image/jpeg');
    else if (ext === 'webp') headers.set('Content-Type', 'image/webp');
    else if (ext === 'gif') headers.set('Content-Type', 'image/gif');
    else headers.set('Content-Type', 'application/octet-stream');
  }

  const isImage = (headers.get('Content-Type') || '').startsWith('image/');
  const dispositionType = forceDownload || !isImage ? 'attachment' : 'inline';
  headers.set('Content-Disposition', `${dispositionType}; filename="${encodeURIComponent(filename)}"`);
  headers.set('Cache-Control', 'private, max-age=3600');
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Length', `${object.size}`);

  return new Response(object.body as any, {
    status: 200,
    headers: headers as any,
  });
}
