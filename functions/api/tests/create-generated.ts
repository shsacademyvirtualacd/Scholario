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

  // Check if the user is an admin
  const { data: userProfile, error: profileErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profileErr || !userProfile || userProfile.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden: Admin access required to create generated tests' }), {
      status: 403,
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
  const answerKeyFile = (formData.get('answer_key_file') || formData.get('answerKeyFile')) as File | null;
  const title = formData.get('title') as string | null;
  const instructions = formData.get('instructions') as string | null;
  const board = (formData.get('board') as string | null) || 'fbise';
  const subject = formData.get('subject') as string | null;
  const grade = formData.get('grade') as string | null;
  const stream = (formData.get('stream') as string | null) || 'all';
  const total_marks = parseInt(formData.get('total_marks') as string || '100', 10);
  const due_date = formData.get('due_date') as string | null;
  const teacher_id = formData.get('teacher_id') as string | null;
  const teacher_name = formData.get('teacher_name') as string | null;
  const uploaded_by = (formData.get('uploaded_by') as string | null) || userId;
  const uploaded_by_name = formData.get('uploaded_by_name') as string | null;
  const file_type = (formData.get('file_type') as 'pdf' | 'image' | 'doc' | null) || 'pdf';

  if (!file || !title || !subject || !grade || !due_date || !teacher_name || !teacher_name.trim()) {
    return new Response(JSON.stringify({ error: 'Missing required test upload parameters (file, title, subject, grade, due_date, teacher_name)' }), {
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

  // Put question paper in NOTES_BUCKET
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
      return new Response(
        JSON.stringify({ error: `Storage upload failed: ${err.message || 'R2 storage unavailable'}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  let answerKeyPath: string | null = null;
  let answerKeyUrl: string | null = null;
  let answerKeyName: string | null = null;

  // If answer key file provided at initial creation
  if (answerKeyFile && env.NOTES_BUCKET) {
    try {
      const akBuffer = await answerKeyFile.arrayBuffer();
      const akSafeName = answerKeyFile.name ? answerKeyFile.name.replace(/[^a-zA-Z0-9_\-\.]/g, '_') : 'answer-key.pdf';
      answerKeyPath = `tests/${testId}/answer-key.pdf`;
      answerKeyUrl = `/api/tests/answer-key/view/${testId}`;
      answerKeyName = akSafeName;

      await env.NOTES_BUCKET.put(answerKeyPath, akBuffer, {
        httpMetadata: {
          contentType: 'application/pdf',
          contentDisposition: `inline; filename="${akSafeName}"`,
        },
        customMetadata: {
          uploadedBy: userId,
          testId,
          type: 'answer_key',
        },
      });
    } catch (akErr) {
      console.error('[AnswerKey R2 Upload Error during test creation]', akErr);
    }
  }

  const nowIso = new Date().toISOString();

  // Insert into tests database table

const testRecord = {
    id: testId,
    title,
    instructions: instructions || null,
    board,
    board_id: board,
    subject,
    grade,
    stream,
    teacher_id: teacher_id || null,
    teacher_name: teacher_name.trim(),
    uploaded_by: uploaded_by || userId,
    uploaded_by_name: uploaded_by_name || null,
    file_url: viewUrl,
    file_path: storageKey,
    file_type,
    file_size_bytes: file.size,
    total_marks,
    due_date,
    published_at: nowIso,
    created_at: nowIso,
    answer_key_url: answerKeyUrl,
    answer_key_path: answerKeyPath,
    answer_key_name: answerKeyName,
    has_answer_key: Boolean(answerKeyFile),
  };

  try {
    const { data, error } = await (supabase as any)
      .from('tests')
      .insert(testRecord)
      .select()
      .single();

    if (error) {
      console.error('[tests:upload] Supabase insert failed:', error);
      // Roll back storage write if DB insert fails
      if (env.NOTES_BUCKET) {
        try {
          await env.NOTES_BUCKET.delete(storageKey);
        } catch (delErr) {
          console.error('[tests:upload] Failed to rollback R2 file:', delErr);
        }
      }
      return new Response(
        JSON.stringify({ error: `Database insert failed: ${error.message || 'Could not save test record'}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true, test: data || testRecord }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (dbErr: any) {
    console.error('[tests:upload] Unexpected DB error:', dbErr);
    if (env.NOTES_BUCKET) {
      try {
        await env.NOTES_BUCKET.delete(storageKey);
      } catch (delErr) {
        console.error('[tests:upload] Failed to rollback R2 file:', delErr);
      }
    }
    return new Response(
      JSON.stringify({ error: `Failed to commit test to database: ${dbErr?.message || 'Unknown error'}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
