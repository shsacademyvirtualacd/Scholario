import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../../env';
import { getAuthenticatedSupabaseClient } from '../../../_lib/supabaseAuth';

export async function onRequestPost(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env } = context;
  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid authentication session.' }), {
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

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request payload' }), {
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
    uploaded_by = userId,
    uploaded_by_name = 'Admin',
    pdfBase64,
    filename,
  } = body;

  if (!title || !subject || !grade || !due_date) {
    return new Response(JSON.stringify({ error: 'Missing required parameters: title, subject, grade, and due_date are required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const testId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const safeFilename = filename || `SHS_Test_${subject}_Grade${grade}.pdf`;
  const safeStream = (stream || 'Science').replace(/[^a-zA-Z0-9_\-]/g, '_');
  const safeSubject = subject.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const storageKey = `tests/${grade}/${safeStream}/${safeSubject}/${testId}_${safeFilename}`;
  const nowIso = new Date().toISOString();

  let pdfBuffer: ArrayBuffer | null = null;
  if (pdfBase64 && typeof pdfBase64 === 'string') {
    try {
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      pdfBuffer = bytes.buffer;
    } catch (e) {
      console.warn('[CreateTest R2] Base64 decode warning:', e);
    }
  }

  // Upload to R2 if bucket exists
  if (env.NOTES_BUCKET && pdfBuffer) {
    try {
      await env.NOTES_BUCKET.put(storageKey, pdfBuffer, {
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
      console.error('[CreateTest R2 Upload Error]', err);
    }
  }

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
    file_size_bytes: pdfBuffer ? pdfBuffer.byteLength : 0,
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
      console.warn('[CreateTest] Supabase insert warning:', dbErr.message);
    }

    return new Response(JSON.stringify({
      success: true,
      test: dbData || testRecord,
      viewUrl: `/api/tests/view/${testId}`,
      dlUrl: `/api/tests/dl/${testId}`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({
      success: true,
      test: testRecord,
      viewUrl: `/api/tests/view/${testId}`,
      dlUrl: `/api/tests/dl/${testId}`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
