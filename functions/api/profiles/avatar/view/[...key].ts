import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../../../env';

export async function onRequestGet(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env, params } = context;

  let objectKey = '';
  if (params && params.key) {
    if (Array.isArray(params.key)) {
      objectKey = params.key.join('/');
    } else {
      objectKey = String(params.key);
    }
  }

  // If objectKey is empty or encoded, extract from URL pathname
  if (!objectKey || objectKey.includes('%')) {
    const url = new URL(request.url);
    const prefix = '/api/profiles/avatar/view/';
    if (url.pathname.startsWith(prefix)) {
      const rawPath = url.pathname.slice(prefix.length);
      objectKey = decodeURIComponent(rawPath);
    } else if (url.pathname.startsWith('/api/profiles/avatar/')) {
      const rawPath = url.pathname.slice('/api/profiles/avatar/'.length);
      objectKey = decodeURIComponent(rawPath);
    }
  } else {
    objectKey = decodeURIComponent(objectKey);
  }

  // Ensure key begins with profile-pictures/
  if (!objectKey.startsWith('profile-pictures/')) {
    const idx = objectKey.indexOf('profile-pictures/');
    if (idx !== -1) {
      objectKey = objectKey.substring(idx);
    }
  }

  if (!objectKey) {
    return new Response('Avatar key missing', { status: 400 });
  }

  const bucket = env.AVATARS_BUCKET || env.NOTES_BUCKET;
  if (!bucket) {
    return new Response('Storage unavailable', { status: 503 });
  }

  const object = await bucket.get(objectKey);
  if (!object) {
    return new Response('Profile picture not found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers as any);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  if (!headers.has('Content-Type')) {
    if (objectKey.endsWith('.png')) {
      headers.set('Content-Type', 'image/png');
    } else if (objectKey.endsWith('.webp')) {
      headers.set('Content-Type', 'image/webp');
    } else {
      headers.set('Content-Type', 'image/jpeg');
    }
  }
  headers.set('Content-Length', `${object.size}`);

  return new Response(object.body as any, {
    status: 200,
    headers: headers as any,
  });
}
