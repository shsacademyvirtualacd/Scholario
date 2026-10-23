/**
 * Cloudflare Worker for Scholario Android APK Storage & Distribution
 *
 * Requirements:
 * - Method: PUT for APK binary uploads
 * - Headers: X-Version (or ?version= query), X-Release-Notes, Authorization: Bearer <token>
 * - Answers OPTIONS preflight with 204 and CORS headers
 * - Strict HTTP error responses:
 *   - 401: Not logged in / invalid token
 *   - 403: Not admin
 *   - 400: Bad file, missing/invalid semver, or version not higher than latest.json
 *   - 405: Wrong method with 'Allow: PUT, OPTIONS' header
 * - R2 storage binding: APK_BUCKET
 */

export interface Env {
  APK_BUCKET: R2Bucket;
  PUBLIC_DOMAIN?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  ADMIN_SECRET_KEY?: string;
}

const MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024; // 150 MB
const SEMVER_REGEX = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

function getCorsHeaders(request: Request): Headers {
  const origin = request.headers.get('Origin') || '*';
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'PUT, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Version, X-Release-Notes');
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Vary', 'Origin');
  return headers;
}

function jsonResponse(data: any, status: number, request: Request, additionalHeaders?: Record<string, string>): Response {
  const headers = getCorsHeaders(request);
  headers.set('Content-Type', 'application/json');
  if (additionalHeaders) {
    Object.entries(additionalHeaders).forEach(([k, v]) => headers.set(k, v));
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function parseSemver(v: string): { major: number; minor: number; patch: number; prerelease?: string; raw: string } | null {
  if (!v || typeof v !== 'string') return null;
  const match = v.trim().match(SEMVER_REGEX);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
    raw: v.trim().replace(/^v/i, ''),
  };
}

function compareSemver(a: string, b: string): number {
  const pA = parseSemver(a);
  const pB = parseSemver(b);
  if (!pA || !pB) return 0;

  if (pA.major !== pB.major) return pA.major > pB.major ? 1 : -1;
  if (pA.minor !== pB.minor) return pA.minor > pB.minor ? 1 : -1;
  if (pA.patch !== pB.patch) return pA.patch > pB.patch ? 1 : -1;
  if (!pA.prerelease && pB.prerelease) return 1;
  if (pA.prerelease && !pB.prerelease) return -1;
  if (pA.prerelease && pB.prerelease) return pA.prerelease.localeCompare(pB.prerelease);
  return 0;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function verifyAdminAuth(request: Request, env: Env): Promise<{ valid: boolean; status?: number; error?: string }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, status: 401, error: 'Authentication required. Please sign in as an administrator.' };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { valid: false, status: 401, error: 'Authentication token is empty.' };
  }

  // Pre-shared worker admin key override (optional)
  if (env.ADMIN_SECRET_KEY && token === env.ADMIN_SECRET_KEY) {
    return { valid: true };
  }

  // Verify against Supabase Auth
  try {
    const supabaseUrl = env.SUPABASE_URL || 'https://your-project.supabase.co';
    const anonKey = env.SUPABASE_ANON_KEY || '';

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
    });

    if (!userRes.ok) {
      return { valid: false, status: 401, error: 'Invalid or expired session. Please sign in again.' };
    }

    const userData: any = await userRes.json();
    const userId = userData?.id;
    if (!userId) {
      return { valid: false, status: 401, error: 'User account not found.' };
    }

    // Role check from user_metadata
    const userRole = userData?.user_metadata?.role || userData?.app_metadata?.role;
    if (userRole === 'admin' || userRole === 'super_admin') {
      return { valid: true };
    }

    // Query profiles table for role confirmation
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

    return {
      valid: false,
      status: 403,
      error: 'Access denied: Administrator privileges required to publish APK releases.',
    };
  } catch (err: any) {
    return {
      valid: false,
      status: 401,
      error: `Authentication verification error: ${err.message}`,
    };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. Handle OPTIONS preflight requests
    if (request.method === 'OPTIONS') {
      const headers = getCorsHeaders(request);
      return new Response(null, { status: 204, headers });
    }

    // 2. GET /apk/latest.json or /latest.json
    if (request.method === 'GET' && (url.pathname === '/apk/latest.json' || url.pathname === '/latest.json')) {
      const latestObj = await env.APK_BUCKET.get('apk/latest.json');
      if (!latestObj) {
        return jsonResponse({ error: 'No APK release published yet' }, 404, request);
      }

      const headers = getCorsHeaders(request);
      headers.set('Content-Type', 'application/json');
      headers.set('Cache-Control', 'public, max-age=60');
      return new Response(latestObj.body, { headers });
    }

    // 3. GET /apk/:filename - Serve direct binary download
    if (request.method === 'GET' && url.pathname.startsWith('/apk/')) {
      const key = url.pathname.replace(/^\//, ''); // e.g. apk/scholario-1.0.4.apk
      const object = await env.APK_BUCKET.get(key);

      if (!object) {
        return new Response('File not found', { status: 404, headers: getCorsHeaders(request) });
      }

      const filename = key.split('/').pop() || 'scholario.apk';
      const headers = getCorsHeaders(request);
      headers.set('Content-Type', 'application/vnd.android.package-archive');
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);
      headers.set('Content-Length', object.size.toString());
      headers.set('ETag', object.httpEtag);
      headers.set('Cache-Control', 'public, max-age=86400');

      return new Response(object.body, { headers });
    }

    // 4. Handle APK Upload endpoint: /upload, /api/apk/upload, or /
    const isUploadPath =
      url.pathname === '/upload' ||
      url.pathname === '/api/apk/upload' ||
      url.pathname === '/api/admin/apk/upload' ||
      url.pathname === '/';

    if (isUploadPath) {
      // 4a. Method check: Only PUT is allowed for file binary upload
      if (request.method !== 'PUT') {
        return jsonResponse(
          {
            error: `Method ${request.method} not allowed. APK uploads require HTTP PUT with binary body.`,
          },
          405,
          request,
          { Allow: 'PUT, OPTIONS' }
        );
      }

      // 4b. Authenticate admin caller (401 / 403)
      const auth = await verifyAdminAuth(request, env);
      if (!auth.valid) {
        return jsonResponse({ error: auth.error || 'Unauthorized' }, auth.status || 401, request);
      }

      // 4c. Version extraction & SemVer validation (400)
      const rawVersion =
        request.headers.get('X-Version') ||
        url.searchParams.get('version') ||
        '';

      if (!rawVersion.trim()) {
        return jsonResponse(
          { error: 'Version name is required in X-Version header or ?version= parameter (e.g. 1.0.4).' },
          400,
          request
        );
      }

      const cleanVersion = rawVersion.trim().replace(/^v/i, '');
      const parsedNew = parseSemver(cleanVersion);
      if (!parsedNew) {
        return jsonResponse(
          { error: `Invalid version "${cleanVersion}". Version must follow SemVer format (e.g. 1.0.4).` },
          400,
          request
        );
      }

      // 4d. Check current latest.json in R2 and enforce newVersion > currentVersion (400)
      let currentVersion: string | null = null;
      try {
        const currentLatestObj = await env.APK_BUCKET.get('apk/latest.json');
        if (currentLatestObj) {
          const currentData: any = await currentLatestObj.json();
          if (currentData && currentData.version) {
            currentVersion = currentData.version;
          }
        }
      } catch (e) {
        console.warn('[Worker] Could not read existing latest.json:', e);
      }

      if (currentVersion && parseSemver(currentVersion)) {
        const comp = compareSemver(cleanVersion, currentVersion);
        if (comp <= 0) {
          const curParsed = parseSemver(currentVersion)!;
          const suggested = `${curParsed.major}.${curParsed.minor}.${curParsed.patch + 1}`;
          return jsonResponse(
            {
              error: `Version ${cleanVersion} must be higher than current published version ${currentVersion}. Suggested next version: ${suggested}.`,
            },
            400,
            request
          );
        }
      }

      // 4e. Content-Length & Body validation (400)
      const contentLengthHeader = request.headers.get('Content-Length');
      const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

      if (contentLength > MAX_FILE_SIZE_BYTES) {
        return jsonResponse(
          {
            error: `File size exceeds maximum allowed limit of 150 MB (${formatFileSize(contentLength)}).`,
          },
          400,
          request
        );
      }

      if (!request.body) {
        return jsonResponse(
          { error: 'Empty upload body. Send the .apk binary file directly in the PUT request body.' },
          400,
          request
        );
      }

      // Release notes extraction
      let releaseNotes = '';
      const rawNotesHeader = request.headers.get('X-Release-Notes');
      if (rawNotesHeader) {
        try {
          releaseNotes = decodeURIComponent(rawNotesHeader);
        } catch {
          releaseNotes = rawNotesHeader;
        }
      } else if (url.searchParams.get('notes')) {
        releaseNotes = url.searchParams.get('notes') || '';
      }

      // 4f. Stream body directly to R2
      const apkFileName = `scholario-${cleanVersion}.apk`;
      const apkStorageKey = `apk/${apkFileName}`;

      const publicBaseDomain = (env.PUBLIC_DOMAIN || 'https://files.scholario.app').replace(/\/+$/, '');
      const downloadUrl = `${publicBaseDomain}/${apkStorageKey}`;

      // Put APK binary to R2
      const putResult = await env.APK_BUCKET.put(apkStorageKey, request.body, {
        httpMetadata: {
          contentType: 'application/vnd.android.package-archive',
          contentDisposition: `attachment; filename="${apkFileName}"`,
        },
        customMetadata: {
          version: cleanVersion,
          uploadedAt: new Date().toISOString(),
        },
      });

      const actualSize = putResult?.size || contentLength || 0;
      const formattedSize = formatFileSize(actualSize);
      const todayDate = new Date().toISOString().split('T')[0];

      // 4g. Update apk/latest.json manifest in R2
      const latestManifest = {
        version: cleanVersion,
        fileName: apkFileName,
        url: downloadUrl,
        size: formattedSize,
        sizeBytes: actualSize,
        date: todayDate,
        notes: releaseNotes || 'Performance improvements and bug fixes.',
      };

      await env.APK_BUCKET.put('apk/latest.json', JSON.stringify(latestManifest, null, 2), {
        httpMetadata: {
          contentType: 'application/json',
          cacheControl: 'public, max-age=60',
        },
      });

      return jsonResponse(
        {
          success: true,
          message: `Scholario v${cleanVersion} uploaded and published successfully to Cloudflare R2!`,
          manifest: latestManifest,
        },
        200,
        request
      );
    }

    return jsonResponse({ error: 'Endpoint not found' }, 404, request);
  },
};
