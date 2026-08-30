import { onRequestPost as uploadHandler } from '../functions/api/notes/upload';
import { onRequestGet as viewHandler } from '../functions/api/notes/view/[noteId]';
import { onRequestGet as dlHandler } from '../functions/api/notes/dl/[noteId]';
import { onRequestDelete as delHandler } from '../functions/api/notes/del/[noteId]';
import { onRequestGet as auditR2Handler } from '../functions/api/admin/audit-r2';
import { onRequestPost as sageChatPostHandler, onRequestOptions as sageChatOptionsHandler } from '../functions/api/sage/chat';
import { onRequestPost as testUploadHandler } from '../functions/api/tests/upload';
import { onRequestPost as createTestHandler } from '../functions/api/admin/tests/create-test';
import { onRequestGet as testViewHandler } from '../functions/api/tests/view/[testId]';
import { onRequestGet as testDlHandler } from '../functions/api/tests/dl/[testId]';
import { onRequestDelete as testDelHandler } from '../functions/api/tests/del/[testId]';
import { onRequestPost as submissionUploadHandler } from '../functions/api/submissions/upload';
import { onRequestGet as submissionViewHandler } from '../functions/api/submissions/view/[submissionId]';
import { onRequestGet as submissionDlHandler } from '../functions/api/submissions/dl/[submissionId]';
import { onRequestPost as submissionGradeHandler } from '../functions/api/submissions/grade';

export interface Env {
  NOTES_BUCKET: any;
  ASSETS: any;
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  GEMINI_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Normalize path by stripping trailing slashes for routing checks
    const normalizedPath = url.pathname.replace(/\/+$/, '') || '/';

    // Handle Sage AI Chat Route
    if (normalizedPath === '/api/sage/chat') {
      if (request.method === 'OPTIONS') {
        return await sageChatOptionsHandler();
      }
      if (request.method === 'POST') {
        try {
          return await sageChatPostHandler({
            request,
            env,
            params: {},
            waitUntil: ctx.waitUntil ? ctx.waitUntil.bind(ctx) : () => {},
            next: () => Promise.resolve(new Response('')),
            data: {}
          } as any);
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message || 'Internal Sage AI error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle Audit R2 Route
    if (url.pathname === '/api/admin/audit-r2' && request.method === 'GET') {
      try {
        return await auditR2Handler({
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

    // ── Test Endpoints ────────────────────────────────
    if ((url.pathname === '/api/admin/tests/create-test' || url.pathname === '/api/tests/create-test') && request.method === 'POST') {
      try {
        return await createTestHandler({
          request,
          env,
          params: {},
          waitUntil: ctx.waitUntil ? ctx.waitUntil.bind(ctx) : () => {},
          next: () => Promise.resolve(new Response('')),
          data: {}
        } as any);
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    if (url.pathname === '/api/tests/upload' && request.method === 'POST') {
      try {
        return await testUploadHandler({
          request,
          env,
          params: {},
          waitUntil: ctx.waitUntil ? ctx.waitUntil.bind(ctx) : () => {},
          next: () => Promise.resolve(new Response('')),
          data: {}
        } as any);
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    if (url.pathname.startsWith('/api/tests/view/')) {
      const cleanPath = url.pathname.replace(/\/+$/, '');
      const parts = cleanPath.split('/');
      const testId = parts[parts.length - 1];
      try {
        return await testViewHandler({
          request,
          env,
          params: { testId },
          waitUntil: ctx.waitUntil ? ctx.waitUntil.bind(ctx) : () => {},
          next: () => Promise.resolve(new Response('')),
          data: {}
        } as any);
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    if (url.pathname.startsWith('/api/tests/dl/')) {
      const cleanPath = url.pathname.replace(/\/+$/, '');
      const parts = cleanPath.split('/');
      const testId = parts[parts.length - 1];
      try {
        return await testDlHandler({
          request,
          env,
          params: { testId },
          waitUntil: ctx.waitUntil ? ctx.waitUntil.bind(ctx) : () => {},
          next: () => Promise.resolve(new Response('')),
          data: {}
        } as any);
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    if (url.pathname.startsWith('/api/tests/del/') && request.method === 'DELETE') {
      const cleanPath = url.pathname.replace(/\/+$/, '');
      const parts = cleanPath.split('/');
      const testId = parts[parts.length - 1];
      try {
        return await testDelHandler({
          request,
          env,
          params: { testId },
          waitUntil: ctx.waitUntil ? ctx.waitUntil.bind(ctx) : () => {},
          next: () => Promise.resolve(new Response('')),
          data: {}
        } as any);
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    // ── Submission Endpoints ──────────────────────────
    if (url.pathname === '/api/submissions/upload' && request.method === 'POST') {
      try {
        return await submissionUploadHandler({
          request,
          env,
          params: {},
          waitUntil: ctx.waitUntil ? ctx.waitUntil.bind(ctx) : () => {},
          next: () => Promise.resolve(new Response('')),
          data: {}
        } as any);
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    if (url.pathname.startsWith('/api/submissions/view/')) {
      const cleanPath = url.pathname.replace(/\/+$/, '');
      const parts = cleanPath.split('/');
      const submissionId = parts[parts.length - 1];
      try {
        return await submissionViewHandler({
          request,
          env,
          params: { submissionId },
          waitUntil: ctx.waitUntil ? ctx.waitUntil.bind(ctx) : () => {},
          next: () => Promise.resolve(new Response('')),
          data: {}
        } as any);
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    if (url.pathname.startsWith('/api/submissions/dl/')) {
      const cleanPath = url.pathname.replace(/\/+$/, '');
      const parts = cleanPath.split('/');
      const submissionId = parts[parts.length - 1];
      try {
        return await submissionDlHandler({
          request,
          env,
          params: { submissionId },
          waitUntil: ctx.waitUntil ? ctx.waitUntil.bind(ctx) : () => {},
          next: () => Promise.resolve(new Response('')),
          data: {}
        } as any);
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    if (url.pathname === '/api/submissions/grade' && request.method === 'POST') {
      try {
        return await submissionGradeHandler({
          request,
          env,
          params: {},
          waitUntil: ctx.waitUntil ? ctx.waitUntil.bind(ctx) : () => {},
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
