import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../../env';
import { getAuthenticatedSupabaseClient } from '../../../_lib/supabaseAuth';

export async function onRequestGet(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env, params } = context;
  const noteId = Array.isArray(params.noteId) ? params.noteId[0] : params.noteId;
  if (!noteId) {
    return new Response('Note ID missing', { status: 400 });
  }

  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    return new Response('Note not found', { status: 404 });
  }
  const { supabase } = auth;

  // Query notes WHERE id = noteId with caller's Supabase token so RLS is enforced exactly as today
  const { data: note, error } = await supabase
    .from('notes')
    .select('id, file_path, file_type, title')
    .eq('id', noteId)
    .single();

  if (error || !note || !note.file_path) {
    return new Response('Note not found', { status: 404 });
  }

  // Parse Range header if present
  let r2Range: any = undefined;
  const rangeHeader = request.headers.get('Range');
  if (rangeHeader && rangeHeader.startsWith('bytes=')) {
    const rangePart = rangeHeader.replace('bytes=', '').trim();
    if (rangePart.startsWith('-')) {
      const suffix = parseInt(rangePart.slice(1), 10);
      if (!isNaN(suffix) && suffix > 0) {
        r2Range = { suffix };
      }
    } else {
      const parts = rangePart.split('-');
      const start = parseInt(parts[0], 10);
      if (!isNaN(start)) {
        if (parts[1] && parts[1].trim() !== '') {
          const end = parseInt(parts[1], 10);
          if (!isNaN(end) && end >= start) {
            r2Range = { offset: start, length: end - start + 1 };
          }
        } else {
          r2Range = { offset: start };
        }
      }
    }
  }

  const object = await env.NOTES_BUCKET.get(note.file_path, r2Range ? { range: r2Range } : undefined);
  if (!object) {
    return new Response('Note file not found in storage', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers as any);
  headers.set('Accept-Ranges', 'bytes');
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', note.file_type === 'pdf' ? 'application/pdf' : 'image/jpeg');
  }

  // Handle partial range response vs full response
  if (r2Range || object.range) {
    const r: any = object.range || r2Range;
    const start = typeof r.offset === 'number' ? r.offset : (typeof r.suffix === 'number' ? Math.max(0, object.size - r.suffix) : 0);
    const length = typeof r.length === 'number' ? r.length : (typeof r.suffix === 'number' ? Math.min(object.size, r.suffix) : object.size - start);
    const end = start + length - 1;
    headers.set('Content-Range', `bytes ${start}-${end}/${object.size}`);
    headers.set('Content-Length', `${length}`);
    return new Response(object.body as any, {
      status: 206,
      headers: headers as any,
    });
  } else {
    headers.set('Content-Length', `${object.size}`);
    return new Response(object.body as any, {
      status: 200,
      headers: headers as any,
    });
  }
}
