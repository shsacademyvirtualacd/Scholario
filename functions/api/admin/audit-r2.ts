import type { EventContext, R2Bucket } from '@cloudflare/workers-types';

export interface Env {
  NOTES_BUCKET: R2Bucket;
  [key: string]: any;
}
import { getAuthenticatedSupabaseClient } from '../../_lib/supabaseAuth';

export async function onRequestGet(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env } = context;

  // 1. Authenticate user to ensure they are admin (or at least valid user)
  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  if (!env.NOTES_BUCKET) {
    return new Response(JSON.stringify({ error: 'NOTES_BUCKET not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    // 2. Get all keys from R2 bucket
    const r2Objects = await env.NOTES_BUCKET.list();
    const r2Keys = r2Objects.objects.map((obj: any) => obj.key);

    // 3. Get all file_paths from the database
    // This will run under RLS of the authenticated user.
    // If the user is admin, they will see all notes.
    const { data: notes, error } = await auth.supabase
      .from('notes')
      .select('file_path')
      .not('file_path', 'is', null);

    if (error) {
      return new Response(JSON.stringify({ error: `Database error: ${error.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const dbPaths = new Set(notes?.map(n => n.file_path) || []);

    // 4. Compare
    const healthy: string[] = [];
    const orphaned: string[] = [];

    for (const key of r2Keys) {
      if (dbPaths.has(key)) {
        healthy.push(key);
      } else {
        orphaned.push(key);
      }
    }

    return new Response(JSON.stringify({
      summary: {
        total_r2_files: r2Keys.length,
        total_db_paths: dbPaths.size,
        healthy_count: healthy.length,
        orphaned_count: orphaned.length
      },
      orphaned,
      healthy
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
