import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../../env';
import { getAuthenticatedSupabaseClient } from '../../../_lib/supabaseAuth';

export async function onRequestGet(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env, params } = context;
  const noteId = Array.isArray(params.noteId) ? params.noteId[0] : params.noteId;
  if (!noteId) {
    return new Response('Note ID missing', { status: 400 });
  }

  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    return new Response('Note not found', { status: 404 });
  }
  const { supabase } = auth;

  // Query notes WHERE id = noteId enforcing exact RLS policies
  const { data: note, error } = await supabase
    .from('notes')
    .select('id, file_path, file_type, title')
    .eq('id', noteId)
    .single();

  if (error || !note || !note.file_path) {
    return new Response('Note not found', { status: 404 });
  }

  // Always fetch full object ignoring Range header for downloads
  const object = await env.NOTES_BUCKET.get(note.file_path);
  if (!object) {
    return new Response('Note file not found in storage', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers as any);
  const ext = note.file_type === 'image' ? 'jpg' : 'pdf';
  const cleanTitle = note.title ? note.title.replace(/[^a-zA-Z0-9_\-\.]/g, '_') : 'note';
  const filename = `${cleanTitle}.${ext}`;

  headers.set('Content-Type', note.file_type === 'image' ? 'image/jpeg' : 'application/pdf');
  headers.set('Content-Length', `${object.size}`);
  headers.set('Content-Disposition', `attachment; filename="${filename}"`);

  return new Response(object.body as any, {
    status: 200,
    headers: headers as any,
  });
}
