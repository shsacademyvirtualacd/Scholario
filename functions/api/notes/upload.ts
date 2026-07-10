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

  // Verify caller's identity via auth token
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const userId = userData.user.id;

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
  const file_type = (formData.get('file_type') as 'pdf' | 'image' | null) || 'pdf';

  if (!file || !offering_id || !chapter_name || !title) {
    return new Response(JSON.stringify({ error: 'Missing required upload parameters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ext = file.name ? file.name.split('.').pop() || 'pdf' : 'pdf';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const storageKey = `teacher_notes/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();

  // 1. Upload bytes to R2
  try {
    await env.NOTES_BUCKET.put(storageKey, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || (file_type === 'pdf' ? 'application/pdf' : 'image/jpeg'),
      },
    });
  } catch (err: any) {
    console.error('Failed to put object in NOTES_BUCKET:', err);
    return new Response(JSON.stringify({ error: `R2 upload failed: ${err.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Insert notes row via authenticated Supabase client so RLS is enforced
  const payload = {
    offering_id,
    chapter_name,
    title,
    file_path: storageKey,
    file_url: `/api/notes/view/placeholder`,
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

  // Update file_url with the actual ID
  const viewUrl = `/api/notes/view/${noteRow.id}`;
  await supabase.from('notes').update({ file_url: viewUrl }).eq('id', noteRow.id);
  noteRow.file_url = viewUrl;

  return new Response(JSON.stringify(noteRow), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
