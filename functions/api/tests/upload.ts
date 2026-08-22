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

  let userId: string;
  try {
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64));
    userId = payload.sub;
    if (!userId) throw new Error('No sub claim');
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token payload' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let formData: any;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid form data payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const file = formData.get('file') as File | null;
  const title = formData.get('title') as string | null;
  const instructions = formData.get('instructions') as string | null;
  const subject = formData.get('subject') as string | null;
  const grade = formData.get('grade') as string | null;
  const stream = (formData.get('stream') as string | null) || 'all';
  const total_marks = parseInt(formData.get('total_marks') as string || '100', 10);
  const due_date = formData.get('due_date') as string | null;
  const teacher_name = formData.get('teacher_name') as string | null;
  const file_type = (formData.get('file_type') as 'pdf' | 'image' | 'doc' | null) || 'pdf';

  if (!file || !title || !subject || !grade || !due_date) {
    return new Response(JSON.stringify({ error: 'Missing required test upload parameters (file, title, subject, grade, due_date)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB max
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return new Response(
      JSON.stringify({ error: `File too large. Maximum allowed size is 25 MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.` }),
      { status: 413, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const ext = file.name ? file.name.split('.').pop() || 'pdf' : 'pdf';
  const testId = crypto.randomUUID();
  const safeFilename = file.name ? file.name.replace(/[^a-zA-Z0-9_\-\.]/g, '_') : `test.${ext}`;
  const safeStream = stream.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const safeSubject = subject.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const storageKey = `tests/${grade}/${safeStream}/${safeSubject}/${testId}_${safeFilename}`;
  const viewUrl = `/api/tests/view/${testId}`;

  const arrayBuffer = await file.arrayBuffer();

  // Put object in NOTES_BUCKET
  if (env.NOTES_BUCKET) {
    try {
      await env.NOTES_BUCKET.put(storageKey, arrayBuffer, {
        httpMetadata: {
          contentType: file_type === 'pdf' ? 'application/pdf' : file_type === 'image' ? 'image/jpeg' : 'application/octet-stream',
          contentDisposition: `inline; filename="${safeFilename}"`,
        },
        customMetadata: {
          uploadedBy: userId,
          testId,
          grade,
          stream,
          subject,
        }
      });
    } catch (err: any) {
      console.error('[Tests R2 Upload Error]', err);
    }
  }

  // Insert into tests database table
  const testRecord = {
    id: testId,
    title,
    instructions: instructions || null,
    subject,
    grade,
    stream,
    teacher_id: userId,
    teacher_name: teacher_name || 'Faculty',
    file_url: viewUrl,
    file_path: storageKey,
    file_type,
    file_size_bytes: file.size,
    total_marks,
    due_date,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await (supabase as any)
      .from('tests')
      .insert(testRecord)
      .select()
      .single();

    if (error) {
      console.warn('[tests:upload] Supabase insert warning:', error);
      return new Response(JSON.stringify({ success: true, test: testRecord }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, test: data || testRecord }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ success: true, test: testRecord }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
