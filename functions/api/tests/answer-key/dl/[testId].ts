import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../../../env';
import { getAuthenticatedSupabaseClient } from '../../../../_lib/supabaseAuth';

export async function onRequestGet(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env, params } = context;
  const testId = Array.isArray(params.testId) ? params.testId[0] : params.testId;
  if (!testId) {
    return new Response('Test ID missing', { status: 400 });
  }

  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    return new Response('Unauthorized: Missing or invalid token', { status: 401 });
  }
  const { supabase, token } = auth;

  let userId: string;
  try {
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64));
    userId = payload.sub;
    if (!userId) throw new Error('No sub claim');
  } catch {
    return new Response('Unauthorized: Invalid token payload', { status: 401 });
  }

  // Check user role - strictly Teacher, Admin, or Service
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single();

  const userRole = profile?.role;
  if (userRole !== 'teacher' && userRole !== 'admin') {
    return new Response('Forbidden: Answer keys are only accessible to teachers and administrators', { status: 403 });
  }

  const { data: test } = await (supabase as any)
    .from('tests')
    .select('id, answer_key_path, answer_key_name, title')
    .eq('id', testId)
    .single();

  const storageKey = test?.answer_key_path || `tests/${testId}/answer-key.pdf`;
  const filename = test?.answer_key_name || `${(test?.title || 'test').replace(/[^a-zA-Z0-9_\-\.]/g, '_')}_Answer_Key.pdf`;

  if (!env.NOTES_BUCKET) {
    return new Response('Storage bucket unavailable', { status: 503 });
  }

  const object = await env.NOTES_BUCKET.get(storageKey);
  if (!object) {
    return new Response('Answer key not found in storage', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers as any);
  headers.set('Content-Type', 'application/pdf');
  headers.set('Content-Disposition', `attachment; filename="${filename}"`);
  headers.set('Content-Length', `${object.size}`);

  return new Response(object.body as any, {
    status: 200,
    headers: headers as any,
  });
}
