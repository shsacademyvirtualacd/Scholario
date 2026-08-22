import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../../../env';
import { getAuthenticatedSupabaseClient } from '../../../../_lib/supabaseAuth';

export async function onRequestPost(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env, params } = context;
  const testId = Array.isArray(params.testId) ? params.testId[0] : params.testId;
  if (!testId) {
    return new Response(JSON.stringify({ error: 'Test ID missing' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing auth session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const { supabase, token } = auth;

  let userId: string;
  try {
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64));
    userId = payload.sub;
    if (!userId) throw new Error('No sub claim');
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Teacher or Admin check
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single();

  const userRole = profile?.role;
  if (userRole !== 'teacher' && userRole !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden: Only teachers/admins can upload answer keys' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch test details to verify 5-minute upload window
  const { data: test, error: testErr } = await (supabase as any)
    .from('tests')
    .select('id, created_at, published_at, has_answer_key')
    .eq('id', testId)
    .single();

  if (testErr || !test) {
    return new Response(JSON.stringify({ error: 'Test paper not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const publishTime = new Date(test.published_at || test.created_at).getTime();
  const now = Date.now();
  const fiveMinutesMs = 5 * 60 * 1000;

  if (now - publishTime > fiveMinutesMs) {
    return new Response(
      JSON.stringify({
        error: 'Answer key upload window (5 minutes post-publication) has expired for this test.',
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let formData: any;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'Malformed form data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const answerKeyFile = formData.get('answer_key') as File | null;
  if (!answerKeyFile) {
    return new Response(JSON.stringify({ error: 'No answer key file provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const storageKey = `tests/${testId}/answer-key.pdf`;

  if (!env.NOTES_BUCKET) {
    return new Response(JSON.stringify({ error: 'Cloud storage unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const fileBytes = await answerKeyFile.arrayBuffer();
  await env.NOTES_BUCKET.put(storageKey, fileBytes, {
    httpMetadata: {
      contentType: answerKeyFile.type || 'application/pdf',
    },
  });

  // Update tests record
  const { data: updatedTest, error: updateErr } = await (supabase as any)
    .from('tests')
    .update({
      has_answer_key: true,
      answer_key_path: storageKey,
      answer_key_name: answerKeyFile.name,
      answer_key_url: `/api/tests/answer-key/view/${testId}`,
    })
    .eq('id', testId)
    .select()
    .single();

  if (updateErr) {
    return new Response(JSON.stringify({ error: updateErr.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, test: updatedTest }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
