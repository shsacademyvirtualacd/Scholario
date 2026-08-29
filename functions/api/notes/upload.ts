import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../env';
import { getAuthenticatedSupabaseClient } from '../../_lib/supabaseAuth';

export async function onRequestPost(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env } = context;
  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const { supabase, token } = auth;

  // Decode userId from JWT locally — avoids a network round-trip to Supabase auth API.
  // RLS on the INSERT will reject the request if the token is invalid anyway.
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
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid form data payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const file = formData.get('file') as File | null;
  const offering_id = formData.get('offering_id') as string | null;
  const chapter_name = formData.get('chapter_name') as string | null;
  const title = formData.get('title') as string | null;
  const file_type = (formData.get('file_type') as 'pdf' | 'image' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | 'txt' | null) || 'pdf';

  if (!file || !offering_id || !chapter_name || !title) {
    return new Response(JSON.stringify({ error: 'Missing required upload parameters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB hard ceiling per upload
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return new Response(
      JSON.stringify({ error: `File too large. Maximum allowed size is 20 MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.` }),
      { status: 413, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const ext = file.name ? file.name.split('.').pop() || 'pdf' : 'pdf';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const storageKey = `teacher_notes/${fileName}`;

  // Pre-generate a UUID so we can set the correct file_url in a single atomic insert
  const noteId = crypto.randomUUID();
  const viewUrl = `/api/notes/view/${noteId}`;

  const arrayBuffer = await file.arrayBuffer();

  // Validate magic bytes
  const bytes = new Uint8Array(arrayBuffer.slice(0, 16));
  let isValid = false;

  if (file_type === 'pdf') {
    // PDF magic bytes: %PDF- (25 50 44 46 2D)
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2D) {
      isValid = true;
    }
  } else if (file_type === 'image') {
    // JPEG: FF D8 FF
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 && 
                  bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A;
    // WEBP: RIFF....WEBP
    const isWebp = bytes.length >= 12 && 
                   bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
                   bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
                   
    if (isJpeg || isPng || isWebp) {
      isValid = true;
    }
  } else if (['docx', 'pptx', 'xlsx'].includes(file_type)) {
    // ZIP magic bytes for OpenXML: PK\x03\x04
    if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
      isValid = true;
    }
  } else if (['doc', 'ppt', 'xls'].includes(file_type)) {
    // OLE magic bytes: \xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1
    if (bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0 &&
        bytes[4] === 0xA1 && bytes[5] === 0xB1 && bytes[6] === 0x1A && bytes[7] === 0xE1) {
      isValid = true;
    }
  } else if (file_type === 'txt') {
    // For txt we just assume it's valid
    isValid = true;
  }

  if (!isValid) {
    return new Response(JSON.stringify({ error: `Invalid file content. The file does not match the claimed type: ${file_type}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1. Upload bytes to R2
  let contentType = file.type;
  if (!contentType) {
    if (file_type === 'pdf') contentType = 'application/pdf';
    else if (file_type === 'image') contentType = 'image/jpeg';
    else if (file_type === 'docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (file_type === 'doc') contentType = 'application/msword';
    else if (file_type === 'pptx') contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    else if (file_type === 'ppt') contentType = 'application/vnd.ms-powerpoint';
    else if (file_type === 'xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (file_type === 'xls') contentType = 'application/vnd.ms-excel';
    else if (file_type === 'txt') contentType = 'text/plain';
    else contentType = 'application/octet-stream';
  }

  try {
    await env.NOTES_BUCKET.put(storageKey, arrayBuffer, {
      httpMetadata: {
        contentType,
      },
    });
  } catch (err: any) {
    console.error('Failed to put object in NOTES_BUCKET:', err);
    return new Response(JSON.stringify({ error: `R2 upload failed: ${err.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Single atomic insert — correct file_url from the start, no UPDATE needed
  const payload = {
    id: noteId,
    offering_id,
    chapter_name,
    title,
    file_path: storageKey,
    file_url: viewUrl,
    file_type,
    uploaded_by: userId,
  };

  const { data: noteRow, error: insertError } = await supabase
    .from('notes')
    .insert(payload)
    .select('*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*))')
    .single();

  if (insertError || !noteRow) {
    console.error('Supabase RLS/insert error:', insertError);
    // Delete just-uploaded R2 object to prevent orphan files
    try {
      await env.NOTES_BUCKET.delete(storageKey);
    } catch (cleanupErr) {
      console.error('Failed to delete orphaned R2 object:', cleanupErr);
    }
    return new Response(JSON.stringify({ error: `Permission denied or database error: ${insertError?.message || 'Insert failed'}` }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(noteRow), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
