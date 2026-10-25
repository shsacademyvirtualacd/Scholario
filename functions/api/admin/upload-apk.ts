import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../env';
import { getAuthenticatedSupabaseClient, decodeJwtPayload } from '../../_lib/supabaseAuth';

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB limit
const SEMVER_REGEX = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

function getCorsHeaders(request: Request): Headers {
  const origin = request.headers.get('Origin') || '*';
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, X-Version, X-Release-Notes, X-Supabase-Url, X-Supabase-Anon-Key'
  );
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
  corsHeaders.set('Content-Type', 'application/json');

  // 1. Authenticate caller using Supabase Bearer token
  const auth = getAuthenticatedSupabaseClient(request, env);
  if (!auth) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized: Missing or invalid authentication token. Please sign in as an administrator.',
        code: 'UNAUTHORIZED',
      }),
      { status: 401, headers: corsHeaders }
    );
  }

  const { supabase, token } = auth;

  // Decode JWT payload safely using Base64URL decoding
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.sub) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized: Invalid or malformed authentication token.',
        code: 'INVALID_TOKEN',
      }),
      { status: 401, headers: corsHeaders }
    );
  }

  if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized: Your session has expired. Please sign in again.',
        code: 'TOKEN_EXPIRED',
      }),
      { status: 401, headers: corsHeaders }
    );
  }

  const userId = String(payload.sub);
  let isAdmin = false;

  const claimRole =
    payload.user_metadata?.role ||
    payload.app_metadata?.role ||
    payload.role;

  if (claimRole === 'admin' || claimRole === 'super_admin') {
    isAdmin = true;
  }

  // Verify against profiles table in Supabase if role was not directly in JWT metadata
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
    return new Response(
      JSON.stringify({
        error: 'Forbidden: Administrator role is required to upload and publish APK releases.',
        code: 'FORBIDDEN',
      }),
      { status: 403, headers: corsHeaders }
    );
  }

  // 2. Resolve R2 Bucket binding
  const bucket = env.APK_BUCKET || env.R2_APK_BUCKET || env.BUCKET || (env as any).scholario_apk;
  if (!bucket) {
    return new Response(
      JSON.stringify({
        error:
          'R2 bucket binding (APK_BUCKET) is not configured. Please bind APK_BUCKET to bucket "scholario-apk" in Cloudflare Settings → Functions / Worker Bindings.',
        code: 'MISSING_R2_BINDING',
      }),
      { status: 500, headers: corsHeaders }
    );
  }

  // 3. Parse multipart/form-data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Failed to parse multipart/form-data payload. Please select a valid .apk file.',
        code: 'INVALID_MULTIPART',
      }),
      { status: 400, headers: corsHeaders }
    );
  }

  const file = formData.get('file') as File | null;
  const version = ((formData.get('version') as string) || '').trim();
  const notes = (
    (formData.get('notes') as string) ||
    (formData.get('releaseNotes') as string) ||
    ''
  ).trim();

  if (!file || typeof file.name !== 'string') {
    return new Response(
      JSON.stringify({
        error: 'Missing APK file in form data (field "file").',
        code: 'MISSING_FILE',
      }),
      { status: 400, headers: corsHeaders }
    );
  }

  if (!file.name.toLowerCase().endsWith('.apk')) {
    return new Response(
      JSON.stringify({
        error: `Invalid file extension for "${file.name}". Only .apk files are allowed.`,
        code: 'INVALID_FILE_TYPE',
      }),
      { status: 400, headers: corsHeaders }
    );
  }

  if (file.size <= 0) {
    return new Response(
      JSON.stringify({
        error: 'The uploaded .apk file is empty (0 bytes).',
        code: 'EMPTY_FILE',
      }),
      { status: 400, headers: corsHeaders }
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return new Response(
      JSON.stringify({
        error: `APK file size (${sizeMb} MB) exceeds the 100 MB limit.`,
        code: 'FILE_TOO_LARGE',
      }),
      { status: 413, headers: corsHeaders }
    );
  }

  if (!version) {
    return new Response(
      JSON.stringify({
        error: 'Version is required (e.g. 1.0.4).',
        code: 'MISSING_VERSION',
      }),
      { status: 400, headers: corsHeaders }
    );
  }

  const cleanVersion = version.replace(/^v/i, '').trim();
  if (!SEMVER_REGEX.test(cleanVersion)) {
    return new Response(
      JSON.stringify({
        error: `Invalid version "${version}". Please use semantic versioning (e.g. 1.0.4).`,
        code: 'INVALID_SEMVER',
      }),
      { status: 400, headers: corsHeaders }
    );
  }

  const apkFileName = `scholario-${cleanVersion}.apk`;
  const r2Key = `apk/${apkFileName}`;
  const sizeBytes = file.size;
  const formattedSize =
    sizeBytes < 1024 * 1024
      ? `${(sizeBytes / 1024).toFixed(1)} KB`
      : `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
  const publishedAt = new Date().toISOString();
  const todayDate = publishedAt.split('T')[0];

  const publicDomain = (
    env.PUBLIC_DOMAIN ||
    env.APK_PUBLIC_DOMAIN ||
    env.VITE_APK_PUBLIC_DOMAIN ||
    ''
  ).replace(/\/+$/, '');
  const downloadUrl = publicDomain ? `${publicDomain}/apk/${apkFileName}` : `/apk/${apkFileName}`;
  const releaseNotesText = notes || 'Performance improvements and bug fixes.';

  const manifest = {
    version: cleanVersion,
    fileName: apkFileName,
    url: downloadUrl,
    downloadUrl: downloadUrl,
    size: formattedSize,
    sizeBytes: sizeBytes,
    date: todayDate,
    publishedDate: todayDate,
    publishedAt: publishedAt,
    notes: releaseNotesText,
    releaseNotes: releaseNotesText,
  };

  try {
    // 4. Write binary APK to R2 as apk/scholario-<version>.apk
    const fileBuffer = await file.arrayBuffer();
    await bucket.put(r2Key, fileBuffer, {
      httpMetadata: {
        contentType: 'application/vnd.android.package-archive',
        contentDisposition: `attachment; filename="${apkFileName}"`,
      },
      customMetadata: {
        version: cleanVersion,
        uploadedAt: publishedAt,
        uploadedBy: userId,
      },
    });

    // 5. Rewrite apk/latest.json in R2
    await bucket.put('apk/latest.json', JSON.stringify(manifest, null, 2), {
      httpMetadata: {
        contentType: 'application/json',
        cacheControl: 'no-cache, no-store, must-revalidate',
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scholario v${cleanVersion} uploaded to R2 as ${r2Key} and published successfully.`,
        version: cleanVersion,
        fileName: apkFileName,
        url: downloadUrl,
        downloadUrl: downloadUrl,
        size: formattedSize,
        sizeBytes: sizeBytes,
        date: todayDate,
        publishedDate: todayDate,
        publishedAt: publishedAt,
        notes: releaseNotesText,
        releaseNotes: releaseNotesText,
        manifest,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[APK Upload R2 Error]:', err);
    return new Response(
      JSON.stringify({
        error: `R2 storage error: ${err?.message || 'Failed to write APK or latest.json to R2 bucket'}`,
        code: 'R2_STORAGE_ERROR',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequest(context: EventContext<Env, any, any>): Promise<Response> {
  const { request } = context;
  if (request.method === 'OPTIONS') {
    return onRequestOptions(context);
  }
  if (request.method === 'POST') {
    return onRequestPost(context);
  }
  const headers = getCorsHeaders(request);
  headers.set('Content-Type', 'application/json');
  headers.set('Allow', 'POST, OPTIONS');
  return new Response(
    JSON.stringify({
      error: `Method ${request.method} not allowed, expected POST`,
      code: 'METHOD_NOT_ALLOWED',
    }),
    { status: 405, headers }
  );
}
