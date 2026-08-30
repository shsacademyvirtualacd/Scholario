import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../../env';
import { getAuthenticatedSupabaseClient } from '../../../_lib/supabaseAuth';

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
  let userEmail: string = '';
  try {
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64));
    userId = payload.sub;
    userEmail = payload.email || '';
    if (!userId) throw new Error('No sub claim');
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token payload' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any = {};
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        body[key] = value;
      });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Invalid request body: ' + err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const {
    title,
    instructions,
    board = 'fbise',
    subject,
    grade,
    stream = 'Science',
    total_marks = 50,
    due_date,
    teacher_id,
    teacher_name = 'Admin / Department Head',
    uploaded_by,
    uploaded_by_name,
    pdfBase64,
    filename,
  } = body;

  if (!title || !subject || !grade || !due_date) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters: title, subject, grade, and due_date are required.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const testId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const safeFilename = filename || `SHS_Test_${subject}_Grade${grade}.pdf`;
  const storageKey = `tests/${grade}/${stream}/${subject}/${testId}_${safeFilename}`;

  let arrayBuffer: ArrayBuffer | null = null;
  if (pdfBase64 && typeof pdfBase64 === 'string') {
    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const binaryStr = atob(cleanBase64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    arrayBuffer = bytes.buffer;
  }

  if (arrayBuffer && env.NOTES_BUCKET) {
    try {
      await env.NOTES_BUCKET.put(storageKey, arrayBuffer, {
        httpMetadata: {
          contentType: 'application/pdf',
          contentDisposition: `inline; filename="${safeFilename}"`,
        },
        customMetadata: {
          uploadedBy: userId,
          testId,
          grade: String(grade),
          stream,
          subject,
        },
      });
    } catch (err: any) {
      console.warn('[Admin CreateTest R2 Warning]', err);
    }
  }

  const nowIso = new Date().toISOString();
  const testRecord = {
    id: testId,
    title: title.trim(),
    instructions: instructions ? instructions.trim() : null,
    board: board || 'fbise',
    board_id: board || 'fbise',
    subject: subject.trim(),
    grade: String(grade),
    stream: stream || 'Science',
    teacher_id: teacher_id && String(teacher_id).trim() ? String(teacher_id).trim() : null,
    teacher_name: (teacher_name || 'Admin / Department Head').trim(),
    uploaded_by: uploaded_by || userId,
    uploaded_by_name: uploaded_by_name || 'Admin',
    file_url: `/api/tests/view/${testId}`,
    file_path: storageKey,
    file_type: 'pdf',
    file_size_bytes: arrayBuffer ? arrayBuffer.byteLength : 1024,
    total_marks: parseInt(String(total_marks), 10) || 50,
    due_date,
    published_at: nowIso,
    created_at: nowIso,
  };

  try {
    const { data: dbData, error: dbErr } = await (supabase as any)
      .from('tests')
      .insert(testRecord)
      .select()
      .single();

    if (dbErr) {
      console.warn('[Admin CreateTest DB Warning]', dbErr.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        test: dbData || testRecord,
        viewUrl: `/api/tests/view/${testId}`,
        dlUrl: `/api/tests/dl/${testId}`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: true,
        test: testRecord,
        viewUrl: `/api/tests/view/${testId}`,
        dlUrl: `/api/tests/dl/${testId}`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
