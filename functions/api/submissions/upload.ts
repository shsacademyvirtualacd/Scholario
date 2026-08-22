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
  const test_id = formData.get('test_id') as string | null;
  const student_name = formData.get('student_name') as string | null;
  const student_email = formData.get('student_email') as string | null;
  const grade = (formData.get('grade') as string | null) || '10';
  const stream = (formData.get('stream') as string | null) || 'all';
  const subject = (formData.get('subject') as string | null) || 'General';
  const file_type = (formData.get('file_type') as 'pdf' | 'image' | 'doc' | null) || 'pdf';

  if (!file || !test_id) {
    return new Response(JSON.stringify({ error: 'Missing required submission parameters (file, test_id)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return new Response(
      JSON.stringify({ error: `File too large. Maximum allowed size is 25 MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.` }),
      { status: 413, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const ext = file.name ? file.name.split('.').pop() || 'pdf' : 'pdf';
  const submissionId = crypto.randomUUID();
  const safeFilename = file.name ? file.name.replace(/[^a-zA-Z0-9_\-\.]/g, '_') : `submission.${ext}`;
  const safeStream = stream.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const safeSubject = subject.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const storageKey = `submissions/${grade}/${safeStream}/${safeSubject}/${test_id}/${userId}_${safeFilename}`;
  const viewUrl = `/api/submissions/view/${submissionId}`;

  const arrayBuffer = await file.arrayBuffer();

  if (env.NOTES_BUCKET) {
    try {
      await env.NOTES_BUCKET.put(storageKey, arrayBuffer, {
        httpMetadata: {
          contentType: file_type === 'pdf' ? 'application/pdf' : file_type === 'image' ? 'image/jpeg' : 'application/octet-stream',
          contentDisposition: `inline; filename="${safeFilename}"`,
        },
        customMetadata: {
          studentId: userId,
          testId: test_id,
        }
      });
    } catch (err: any) {
      console.error('[Submissions R2 Upload Error]', err);
      return new Response(
        JSON.stringify({ error: `Storage upload failed: ${err.message || 'R2 storage unavailable'}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  const submissionRecord = {
    id: submissionId,
    test_id,
    student_id: userId,
    student_name: student_name || 'Student',
    student_email: student_email || null,
    file_url: viewUrl,
    file_path: storageKey,
    file_type,
    file_size_bytes: file.size,
    submitted_at: new Date().toISOString(),
    status: 'submitted' as const,
    marks_obtained: null,
    max_marks: null,
    teacher_feedback: null,
  };

  try {
    // Delete existing submission for this student + test_id if replacing
    await (supabase as any)
      .from('test_submissions')
      .delete()
      .eq('test_id', test_id)
      .eq('student_id', userId);

    const { data, error } = await (supabase as any)
      .from('test_submissions')
      .insert(submissionRecord)
      .select()
      .single();

    if (error) {
      console.error('[submissions:upload] Supabase insert failed:', error);
      if (env.NOTES_BUCKET) {
        try {
          await env.NOTES_BUCKET.delete(storageKey);
        } catch (delErr) {
          console.error('[submissions:upload] Rollback R2 file failed:', delErr);
        }
      }
      return new Response(
        JSON.stringify({ error: `Database insert failed: ${error.message || 'Could not save submission record'}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true, submission: data || submissionRecord }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (dbErr: any) {
    console.error('[submissions:upload] Unexpected DB error:', dbErr);
    if (env.NOTES_BUCKET) {
      try {
        await env.NOTES_BUCKET.delete(storageKey);
      } catch (delErr) {
        console.error('[submissions:upload] Rollback R2 file failed:', delErr);
      }
    }
    return new Response(
      JSON.stringify({ error: `Failed to commit submission to database: ${dbErr?.message || 'Unknown error'}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
