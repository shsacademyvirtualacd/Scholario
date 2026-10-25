import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../../../env';
import { getAuthenticatedSupabaseClient } from '../../../../_lib/supabaseAuth';

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB limit
const SEMVER_REGEX = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

function getCorsHeaders(request: Request): Headers {
  const origin = request.headers.get('Origin') || '*';
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Version, X-Release-Notes');
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Vary', 'Origin');
  return headers;
}

export async function onRequestOptions(context: EventContext<Env, any, any>): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(context.request),
  });
}

export async function onRequestPost(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(request);

  // 1. Authenticate caller using Supabase Bearer token
  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    corsHeaders.set('Content-Type', 'application/json');
    return new Response(
      JSON.stringify({
        error: 'Unauthorized: Missing or invalid authentication token. Please sign in as an administrator.',
        code: 'UNAUTHORIZED',
      }),
      { status: 401, headers: corsHeaders }
    );
  }

  const { supabase, token } = auth;

  // Extract userId and check role
  let userId = '';
  let isAdmin = false;
  try {
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64));
    userId = payload.sub || '';
    const userRole = payload.role || payload.user_metadata?.role || payload.app_metadata?.role;
    if (userRole === 'admin' || userRole === 'super_admin') {
      isAdmin = true;
    }
  } catch {
    corsHeaders.set('Content-Type', 'application/json');
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Invalid token payload format.', code: 'INVALID_TOKEN' }),
      { status: 401, headers: corsHeaders }
    );
  }

  // Double check profiles table in Supabase if role was not directly in metadata
  if (!isAdmin && userId) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.role === 'admin' || profile?.role === 'super_admin') {
        isAdmin = true;
      }
    } catch (e: any) {
      console.warn('[APK Upload Function] Profile role check error:', e);
    }
  }

  if (!isAdmin) {
    corsHeaders.set('Content-Type', 'application/json');
    return new Response(
      JSON.stringify({
        error: 'Access denied: Administrator role required to publish APK releases.',
        code: 'FORBIDDEN',
      }),
      { status: 403, headers: corsHeaders }
    );
  }

  // 2. Resolve R2 Bucket binding
  const bucket = env.APK_BUCKET || env.R2_APK_BUCKET || env.BUCKET || (env as any).scholario_apk;
  if (!bucket) {
    corsHeaders.set('Content-Type', 'application/json');
    return new Response(
      JSON.stringify({
        error: 'R2 bucket binding is not configured. Please add the APK_BUCKET binding under Cloudflare Pages Settings → Functions → R2 bucket bindings.',
        code: 'MISSING_R2_BINDING',
      }),
      { status: 500, headers: corsHeaders }
    );
  }

  // 3. Parse multipart/form-data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err: any) {
    corsHeaders.set('Content-Type', 'application/json');
    return new Response(
      JSON.stringify({ error: 'Failed to parse form data. Please ensure the request is multipart/form-data.', code: 'INVALID_MULTIPART' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const file = formData.get('file') as File | null;
  const version = ((formData.get('version') as string) || '').trim();
  const notes = ((formData.get('notes') as string) || (formData.get('releaseNotes') as string) || '').trim();

  if (!file) {
    corsHeaders.set('Content-Type', 'application/json');
    return new Response(
      JSON.stringify({ error: 'Please select a valid .apk file to upload.', code: 'MISSING_FILE' }),
      { status: 400, headers: corsHeaders }
    );
  }

  if (!file.name.toLowerCase().endsWith('.apk')) {
    corsHeaders.set('Content-Type', 'application/json');
    return new Response(
      JSON.stringify({ error: 'Invalid file format. Only .apk files are accepted.', code: 'INVALID_FILE_TYPE' }),
      { status: 400, headers: corsHeaders }
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    corsHeaders.set('Content-Type', 'application/json');
    return new Response(
      JSON.stringify({
        error: `The selected APK file is too large (${sizeMb} MB). Maximum allowed size is 100 MB.`,
        code: 'FILE_TOO_LARGE',
      }),
      { status: 413, headers: corsHeaders }
    );
  }

  if (!version) {
    corsHeaders.set('Content-Type', 'application/json');
    return new Response(
      JSON.stringify({ error: 'Version name is required (e.g. 1.0.4).', code: 'MISSING_VERSION' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const cleanVersion = version.replace(/^v/i, '').trim();
  if (!SEMVER_REGEX.test(cleanVersion)) {
    corsHeaders.set('Content-Type', 'application/json');
    return new Response(
      JSON.stringify({ error: `Invalid version "${version}". Please use semantic versioning (e.g. 1.0.4).`, code: 'INVALID_SEMVER' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const apkFileName = `scholario-${cleanVersion}.apk`;
  const sizeBytes = file.size;
  const formattedSize = sizeBytes < 1024 * 1024
    ? `${(sizeBytes / 1024).toFixed(1)} KB`
    : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  const todayDate = new Date().toISOString().split('T')[0];

  const publicDomain = (env.PUBLIC_DOMAIN || env.APK_PUBLIC_DOMAIN || env.VITE_APK_PUBLIC_DOMAIN || '').replace(/\/+$/, '');
  const downloadUrl = publicDomain ? `${publicDomain}/apk/${apkFileName}` : `/apk/${apkFileName}`;

  const manifest = {
    version: cleanVersion,
    fileName: apkFileName,
    url: downloadUrl,
    size: formattedSize,
    sizeBytes: sizeBytes,
    date: todayDate,
    notes: notes || 'Performance improvements and bug fixes.',
  };

  try {
    // 4. Upload binary APK to R2
    const fileBuffer = await file.arrayBuffer();
    await bucket.put(`apk/${apkFileName}`, fileBuffer, {
      httpMetadata: {
        contentType: 'application/vnd.android.package-archive',
        contentDisposition: `attachment; filename="${apkFileName}"`,
      },
      customMetadata: {
        version: cleanVersion,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userId,
      },
    });

    // 5. Rewrite apk/latest.json in R2
    await bucket.put('apk/latest.json', JSON.stringify(manifest, null, 2), {
      httpMetadata: {
        contentType: 'application/json',
        cacheControl: 'public, max-age=60',
      },
    });

    corsHeaders.set('Content-Type', 'application/json');
    return new Response(
      JSON.stringify({
        success: true,
        message: `Scholario v${cleanVersion} has been uploaded to Cloudflare R2 and published successfully!`,
        manifest,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[APK Upload R2 Error]:', err);
    corsHeaders.set('Content-Type', 'application/json');
    return new Response(
      JSON.stringify({
        error: `R2 storage error: ${err.message || 'Failed to upload APK to Cloudflare R2'}`,
        code: 'R2_STORAGE_ERROR',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
