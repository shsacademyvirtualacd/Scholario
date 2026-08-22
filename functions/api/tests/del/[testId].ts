import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../../env';
import { getAuthenticatedSupabaseClient } from '../../../_lib/supabaseAuth';

export async function onRequestDelete(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env, params } = context;
  const testId = Array.isArray(params.testId) ? params.testId[0] : params.testId;
  if (!testId) {
    return new Response(JSON.stringify({ error: 'Test ID missing' }), { status: 400 });
  }

  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const { supabase } = auth;

  const { data: test, error: fetchErr } = await (supabase as any)
    .from('tests')
    .select('id, file_path')
    .eq('id', testId)
    .single();

  if (fetchErr || !test) {
    return new Response(JSON.stringify({ error: 'Test not found' }), { status: 404 });
  }

  if (test.file_path && env.NOTES_BUCKET) {
    try {
      await env.NOTES_BUCKET.delete(test.file_path);
    } catch (e) {
      console.warn('R2 file deletion warning:', e);
    }
  }

  await (supabase as any).from('test_submissions').delete().eq('test_id', testId);
  const { error: delErr } = await (supabase as any).from('tests').delete().eq('id', testId);

  if (delErr) {
    return new Response(JSON.stringify({ error: delErr.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
