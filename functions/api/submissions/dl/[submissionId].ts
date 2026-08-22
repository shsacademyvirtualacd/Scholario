import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../../env';
import { getAuthenticatedSupabaseClient } from '../../../_lib/supabaseAuth';

export async function onRequestGet(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env, params } = context;
  const submissionId = Array.isArray(params.submissionId) ? params.submissionId[0] : params.submissionId;
  if (!submissionId) {
    return new Response('Submission ID missing', { status: 400 });
  }

  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { supabase } = auth;

  const { data: submission, error } = await (supabase as any)
    .from('test_submissions')
    .select('id, file_path, file_type, student_name')
    .eq('id', submissionId)
    .single();

  if (error || !submission || !submission.file_path) {
    return new Response('Submission not found', { status: 404 });
  }

  if (!env.NOTES_BUCKET) {
    return new Response('Storage bucket unavailable', { status: 503 });
  }

  const object = await env.NOTES_BUCKET.get(submission.file_path);
  if (!object) {
    return new Response('Submission file not found in storage', { status: 404 });
  }

  const cleanName = (submission.student_name || 'student_submission').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  const ext = submission.file_type === 'pdf' ? 'pdf' : 'jpg';

  const headers = new Headers();
  object.writeHttpMetadata(headers as any);
  headers.set('Content-Disposition', `attachment; filename="${cleanName}_answer_sheet.${ext}"`);
  headers.set('Content-Type', submission.file_type === 'pdf' ? 'application/pdf' : 'image/jpeg');
  headers.set('Content-Length', `${object.size}`);

  return new Response(object.body as any, {
    status: 200,
    headers: headers as any,
  });
}
