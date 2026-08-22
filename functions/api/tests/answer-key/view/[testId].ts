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

  // Strictly Teacher, Admin, or Service role
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single();

  const userRole = profile?.role;
  if (userRole !== 'teacher' && userRole !== 'admin') {
    return new Response('Forbidden: Answer keys are strictly confidential and restricted from student roles', { status: 403 });
  }

  const { data: test } = await (supabase as any)
    .from('tests')
    .select('id, answer_key_path')
    .eq('id', testId)
    .single();

  const storageKey = test?.answer_key_path || `tests/${testId}/answer-key.pdf`;

  if (!env.NOTES_BUCKET) {
    return new Response('Storage bucket unavailable', { status: 503 });
  }

  const object = await env.NOTES_BUCKET.get(storageKey);
  if (!object) {
    return new Response('Answer key file not found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers as any);
  headers.set('Content-Type', 'application/pdf');
  headers.set('Content-Disposition', 'inline');
  headers.set('Content-Length', `${object.size}`);
  headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');

  return new Response(object.body as any, {
    status: 200,
    headers: headers as any,
  });
}
