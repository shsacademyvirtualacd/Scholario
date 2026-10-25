import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../env';

function getCorsHeaders(request: Request): Headers {
  const origin = request.headers.get('Origin') || '*';
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  headers.set('Access-Control-Allow-Headers', '*');
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

export async function onRequestGet(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env, params } = context;
  const filename = params.filename as string;
  const bucket = env.APK_BUCKET || env.R2_APK_BUCKET || env.BUCKET || (env as any).scholario_apk;
  const corsHeaders = getCorsHeaders(request);

  if (!filename) {
    return context.next();
  }

  // 1. Serving apk/latest.json
  if (filename === 'latest.json') {
    if (bucket) {
      try {
        const obj = await bucket.get('apk/latest.json');
        if (obj) {
          corsHeaders.set('Content-Type', 'application/json');
          corsHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          if (obj.httpEtag) {
            corsHeaders.set('ETag', obj.httpEtag);
          }
          return new Response(obj.body, {
            status: 200,
            headers: corsHeaders,
          });
        }
      } catch (err) {
        console.warn('[APK Serve Function] R2 latest.json error:', err);
      }
    }
    // Fall back to static asset in dist/public if not found in R2
    return context.next();
  }

  // 2. Serving apk/*.apk files
  if (filename.toLowerCase().endsWith('.apk')) {
    if (bucket) {
      try {
        const obj = await bucket.get(`apk/${filename}`);
        if (obj) {
          corsHeaders.set('Content-Type', 'application/vnd.android.package-archive');
          corsHeaders.set('Content-Disposition', `attachment; filename="${filename}"`);
          corsHeaders.set('Content-Length', obj.size.toString());
          corsHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
          if (obj.httpEtag) {
            corsHeaders.set('ETag', obj.httpEtag);
          }
          return new Response(obj.body, {
            status: 200,
            headers: corsHeaders,
          });
        }
      } catch (err) {
        console.warn('[APK Serve Function] R2 binary get error:', err);
      }
    }
    // Fall back to static asset in dist/public if not found in R2
    return context.next();
  }

  return context.next();
}
