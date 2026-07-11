import { onRequestPost as uploadHandler } from '../functions/api/notes/upload';
import { onRequestGet as viewHandler } from '../functions/api/notes/view/[noteId]';
import { onRequestGet as dlHandler } from '../functions/api/notes/dl/[noteId]';
import { onRequestDelete as delHandler } from '../functions/api/notes/del/[noteId]';

export interface Env {
  NOTES_BUCKET: any;
  ASSETS: any;
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Handle Upload Route
    if (url.pathname === '/api/notes/upload' && request.method === 'POST') {
      try {
        return await uploadHandler({
          request,
          env,
          params: {},
          waitUntil: ctx.waitUntil.bind(ctx),
          next: () => Promise.resolve(new Response('')),
          data: {}
        } as any);
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    // Handle View Route
    if (url.pathname.startsWith('/api/notes/view/')) {
      const cleanPath = url.pathname.replace(/\/+$/, '');
      const parts = cleanPath.split('/');
      const noteId = parts[parts.length - 1];
      try {
        return await viewHandler({
          request,
          env,
          params: { noteId },
          waitUntil: ctx.waitUntil.bind(ctx),
          next: () => Promise.resolve(new Response('')),
          data: {}
        } as any);
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    // Handle Download Route
    if (url.pathname.startsWith('/api/notes/dl/')) {
      const cleanPath = url.pathname.replace(/\/+$/, '');
      const parts = cleanPath.split('/');
      const noteId = parts[parts.length - 1];
      try {
        return await dlHandler({
          request,
          env,
          params: { noteId },
          waitUntil: ctx.waitUntil.bind(ctx),
          next: () => Promise.resolve(new Response('')),
          data: {}
        } as any);
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    // Handle Delete Route
    if (url.pathname.startsWith('/api/notes/del/') && request.method === 'DELETE') {
      const cleanPath = url.pathname.replace(/\/+$/, '');
      const parts = cleanPath.split('/');
      const noteId = parts[parts.length - 1];
      try {
        return await delHandler({
          request,
          env,
          params: { noteId },
          waitUntil: ctx.waitUntil.bind(ctx),
          next: () => Promise.resolve(new Response('')),
          data: {}
        } as any);
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    // Serve Static Assets for all other routes
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      
      // If 404 and the request is for a web page (not an API or static file with extension)
      if (
        assetResponse.status === 404 && 
        !url.pathname.startsWith('/api/') && 
        !url.pathname.match(/\.[a-zA-Z0-9]+$/)
      ) {
        // SPA Fallback: serve /index.html for React client-side routing
        const indexUrl = new URL('/index.html', request.url);
        const indexRequest = new Request(indexUrl, request);
        return env.ASSETS.fetch(indexRequest);
      }
      
      return assetResponse;
    }

    return new Response('Not Found', { status: 404 });
  }
};
