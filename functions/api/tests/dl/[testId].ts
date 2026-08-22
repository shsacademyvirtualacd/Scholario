import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../../env';
import { getAuthenticatedSupabaseClient } from '../../../_lib/supabaseAuth';

export async function onRequestGet(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env, params } = context;
  const testId = Array.isArray(params.testId) ? params.testId[0] : params.testId;
  if (!testId) {
    return new Response('Test ID missing', { status: 400 });
  }

  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { supabase } = auth;

  const { data: test, error } = await (supabase as any)
    .from('tests')
    .select('id, file_path, file_type, title')
    .eq('id', testId)
    .single();

  if (error || !test || !test.file_path) {
    return new Response('Test not found', { status: 404 });
  }

  if (!env.NOTES_BUCKET) {
    return new Response('Storage bucket unavailable', { status: 503 });
  }

  const object = await env.NOTES_BUCKET.get(test.file_path);
  if (!object) {
    return new Response('Test file not found in storage', { status: 404 });
  }

  const cleanTitle = (test.title || 'test_paper').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  const ext = test.file_type === 'pdf' ? 'pdf' : 'jpg';

  const headers = new Headers();
  object.writeHttpMetadata(headers as any);
  headers.set('Content-Disposition', `attachment; filename="${cleanTitle}.${ext}"`);
  headers.set('Content-Type', test.file_type === 'pdf' ? 'application/pdf' : 'image/jpeg');
  headers.set('Content-Length', `${object.size}`);

  return new Response(object.body as any, {
    status: 200,
    headers: headers as any,
  });
}
