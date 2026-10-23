/**
 * Cloudflare Worker for Scholario Android APK Storage & Distribution
 *
 * Capabilities:
 * - R2 storage integration (uploads and distribution)
 * - Verifies caller is an Admin using Supabase auth token
 * - Stores APK at apk/scholario-<version>.apk
 * - Writes and serves apk/latest.json
 * - Serves APK downloads with Content-Type: application/vnd.android.package-archive
 *   and Content-Disposition: attachment
 */

export interface Env {
  APK_BUCKET: R2Bucket;
  PUBLIC_DOMAIN: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY?: string;
  ADMIN_SECRET_KEY?: string;
}

const MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024; // 150 MB

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function verifyAdminAuth(request: Request, env: Env): Promise<{ valid: boolean; error?: string }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or malformed Authorization header' };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // If a shared worker secret is configured, allow direct server-to-server auth
  if (env.ADMIN_SECRET_KEY && token === env.ADMIN_SECRET_KEY) {
    return { valid: true };
  }

  // Verify token with Supabase Auth
  try {
    const supabaseUrl = env.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
    const anonKey = env.SUPABASE_ANON_KEY || '';

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
    });

    if (!userRes.ok) {
      return { valid: false, error: 'Invalid or expired auth session' };
    }

    const userData: any = await userRes.json();
    const userId = userData?.id;
    if (!userId) {
      return { valid: false, error: 'User not found' };
    }

    // Check user role from profiles table or user metadata
    const userRole = userData?.user_metadata?.role || userData?.app_metadata?.role;
    if (userRole === 'admin') {
      return { valid: true };
    }

    // Query profiles table to verify role
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
    });

    if (profileRes.ok) {
      const profiles: any = await profileRes.json();
      if (profiles && profiles[0]?.role === 'admin') {
        return { valid: true };
      }
    }

    return { valid: false, error: 'Access denied: caller does not have administrator privileges' };
  } catch (err: any) {
    return { valid: false, error: `Authentication check failed: ${err.message}` };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // 1. GET /apk/latest.json - Return latest APK release metadata
    if (request.method === 'GET' && (url.pathname === '/apk/latest.json' || url.pathname === '/latest.json')) {
      const latestObj = await env.APK_BUCKET.get('apk/latest.json');
      if (!latestObj) {
        return new Response(JSON.stringify({ error: 'No APK release published yet' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        });
      }

      return new Response(latestObj.body, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
          ...CORS_HEADERS,
        },
      });
    }

    // 2. GET /apk/:filename - Serve APK downloads directly with proper binary MIME & attachment headers
    if (request.method === 'GET' && url.pathname.startsWith('/apk/')) {
      const key = url.pathname.replace(/^\//, ''); // e.g. apk/scholario-1.0.3.apk
      const object = await env.APK_BUCKET.get(key);

      if (!object) {
        return new Response('File not found', { status: 404, headers: CORS_HEADERS });
      }

      const filename = key.split('/').pop() || 'scholario.apk';
      const headers = new Headers();
      headers.set('Content-Type', 'application/vnd.android.package-archive');
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);
      headers.set('Content-Length', object.size.toString());
      headers.set('ETag', object.httpEtag);
      headers.set('Cache-Control', 'public, max-age=86400');
      Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));

      return new Response(object.body, { headers });
    }

    // 3. POST /upload or /api/apk/upload - Handle admin APK upload
    if (request.method === 'POST' && (url.pathname === '/upload' || url.pathname === '/api/apk/upload')) {
      // Authenticate admin caller
      const auth = await verifyAdminAuth(request, env);
      if (!auth.valid) {
        return new Response(JSON.stringify({ error: auth.error || 'Unauthorized' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
      }

      // Parse multipart form
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch (err: any) {
        return new Response(JSON.stringify({ error: 'Invalid form data: ' + err.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
      }

      const file = formData.get('file');
      const version = ((formData.get('version') as string) || '').trim();
      const notes = ((formData.get('notes') as string) || '').trim();

      if (!file || !(file instanceof File)) {
        return new Response(JSON.stringify({ error: 'Please choose an APK file to upload' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
      }

      if (!file.name.toLowerCase().endsWith('.apk')) {
        return new Response(JSON.stringify({ error: 'Invalid file format. Only .apk files are accepted' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return new Response(
          JSON.stringify({ error: `File too large (${formatFileSize(file.size)}). Maximum allowed size is 150 MB` }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
          }
        );
      }

      if (!version) {
        return new Response(JSON.stringify({ error: 'Version name is required (e.g. 1.0.3)' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
      }

      // Clean version string (remove 'v' prefix if typed, e.g. v1.0.3 -> 1.0.3)
      const cleanVersion = version.replace(/^v/i, '');
      const apkFileName = `scholario-${cleanVersion}.apk`;
      const apkStorageKey = `apk/${apkFileName}`;

      const publicBaseDomain = (env.PUBLIC_DOMAIN || 'https://files.scholario.app').replace(/\/+$/, '');
      const downloadUrl = `${publicBaseDomain}/${apkStorageKey}`;

      // Upload APK binary to R2
      await env.APK_BUCKET.put(apkStorageKey, await file.arrayBuffer(), {
        httpMetadata: {
          contentType: 'application/vnd.android.package-archive',
          contentDisposition: `attachment; filename="${apkFileName}"`,
        },
        customMetadata: {
          version: cleanVersion,
          uploadedAt: new Date().toISOString(),
          originalFileName: file.name,
        },
      });

      // Prepare latest.json manifest
      const formattedSize = formatFileSize(file.size);
      const todayDate = new Date().toISOString().split('T')[0];

      const latestManifest = {
        version: cleanVersion,
        fileName: apkFileName,
        url: downloadUrl,
        size: formattedSize,
        sizeBytes: file.size,
        date: todayDate,
        notes: notes || 'Performance improvements and fixes.',
      };

      // Save latest.json to R2
      await env.APK_BUCKET.put('apk/latest.json', JSON.stringify(latestManifest, null, 2), {
        httpMetadata: {
          contentType: 'application/json',
          cacheControl: 'public, max-age=60',
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Scholario v${cleanVersion} published successfully to R2!`,
          manifest: latestManifest,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        }
      );
    }

    return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
  },
};
