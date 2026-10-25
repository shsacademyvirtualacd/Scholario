import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../env';
import { GoogleGenAI } from '@google/genai';
import { createSafeSupabaseClient } from '../../_lib/supabaseAuth';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function onRequestPost(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env } = context;

  const { supabase, missingVars } = createSafeSupabaseClient(env, request, {
    useServiceRole: true,
    forwardAuthHeader: true,
  });

  if (!supabase) {
    return new Response(
      JSON.stringify({
        error: `Cannot sync Note Vault because runtime database configuration is missing: ${missingVars.join(', ')}.`,
      }),
      {
        status: 503,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const apiKey =
      env?.GEMINI_API_KEY ||
      env?.GOOGLE_API_KEY ||
      env?.VITE_GEMINI_API_KEY ||
      (typeof process !== 'undefined'
        ? process.env?.GEMINI_API_KEY || process.env?.GOOGLE_API_KEY
        : undefined);

    const ai = apiKey
      ? new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        })
      : null;

    const { data: notes, error } = await supabase
      .from('notes')
      .select('*, offering:class_offerings(*, class:classes(*), subject:subjects(*), teacher:teachers(*))')
      .order('created_at', { ascending: false })
      .limit(60);

    if (error) {
      console.warn('[KB Sync Notes Warning]:', error.message);
      return new Response(
        JSON.stringify({ success: true, message: 'No notes found to sync', synced: 0 }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    if (!notes || notes.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No notes found to sync', synced: 0 }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    let synced = 0;
    for (const note of notes as any[]) {
      const subjectName = note.offering?.subject?.name || 'Academic Subject';
      const className = note.offering?.class?.name || 'Senior High School';
      const teacherName = note.offering?.teacher?.full_name || 'Faculty Instructor';
      const chapter = note.chapter_name || 'General';
      const summaryText = `Subject Note Vault: ${subjectName} (${className}) - Chapter: "${chapter}". Document Title: "${note.title}". Uploaded by faculty member ${teacherName}. Available for student study in Note Vault under ${note.file_type ? String(note.file_type).toUpperCase() : 'PDF'} format. This verified material covers core syllabus requirements, formulas, and exercise solutions.`;

      let embedding: number[] | null = null;
      if (ai) {
        try {
          const embedRes = await ai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: summaryText,
            config: { outputDimensionality: 768 },
          });
          embedding =
            embedRes.embeddings?.[0]?.values ||
            (embedRes as any).embedding?.values ||
            null;
        } catch {
          // Embedding optional
        }
      }

      const row: Record<string, any> = {
        title: `${subjectName}: ${note.title}`,
        category: 'notes',
        source_type: 'note_vault',
        source_id: note.id,
        metadata: { subject: subjectName, class: className, chapter, note_id: note.id },
        content_chunk: summaryText,
        chunk_index: 0,
      };
      if (embedding) {
        row.embedding = embedding;
      }

      try {
        const { error: insertErr } = await supabase.from('knowledge_base').insert(row);
        if (!insertErr) synced++;
      } catch {
        // continue
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced, totalNotes: notes.length }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[Cloudflare Pages KB Sync Notes Error]:', err?.message || String(err));
    return new Response(
      JSON.stringify({ error: err?.message || 'Failed to sync note vault' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequest(context: EventContext<Env, any, any>): Promise<Response> {
  if (context.request.method === 'OPTIONS') {
    return onRequestOptions();
  }
  if (context.request.method === 'POST') {
    return onRequestPost(context);
  }
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
