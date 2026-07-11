import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../../env';
import { getAuthenticatedSupabaseClient } from '../../../_lib/supabaseAuth';

export async function onRequestDelete(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env, params } = context;
  const noteId = Array.isArray(params.noteId) ? params.noteId[0] : params.noteId;
  if (!noteId) {
    return new Response(JSON.stringify({ error: 'Note ID missing' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const { supabase } = auth;

  // Get file_path from database
  const { data: note, error: fetchError } = await supabase
    .from('notes')
    .select('file_path')
    .eq('id', noteId)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Fetch error during delete:', fetchError);
  }

  // Delete from R2 storage if file_path exists
  if (note?.file_path && env.NOTES_BUCKET) {
    try {
      await env.NOTES_BUCKET.delete(note.file_path);
    } catch (r2Err) {
      console.error('R2 delete error:', r2Err);
      return new Response(JSON.stringify({ error: 'Failed to delete file from storage' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Delete from Supabase database using authenticated client
  const { error: deleteError } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId);

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message || 'Database delete failed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, id: noteId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
