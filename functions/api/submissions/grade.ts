import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../env';
import { getAuthenticatedSupabaseClient } from '../../_lib/supabaseAuth';

export async function onRequestPost(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env } = context;
  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
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
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { submission_id, marks_obtained, max_marks, teacher_feedback } = body;
  if (!submission_id) {
    return new Response(JSON.stringify({ error: 'Missing submission_id' }), { status: 400 });
  }

  const updateData = {
    marks_obtained: marks_obtained !== undefined ? Number(marks_obtained) : null,
    max_marks: max_marks !== undefined ? Number(max_marks) : null,
    teacher_feedback: teacher_feedback || null,
    status: 'graded' as const,
    graded_at: new Date().toISOString(),
    graded_by: userId,
  };

  const { data, error } = await (supabase as any)
    .from('test_submissions')
    .update(updateData)
    .eq('id', submission_id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, submission: data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
