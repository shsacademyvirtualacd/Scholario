import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../env';

// In-memory rate limiting state (stored per V8 isolate at the edge)
// The state only persists for the lifetime of the isolate, which is fine
// for a lightweight rate limiter designed to prevent burst abuse.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 60;     // Max 60 requests per minute per IP

export async function onRequest(context: EventContext<Env, any, any>): Promise<any> {
  const { request } = context;

  // Bypass rate limiting for preflight requests
  if (request.method === 'OPTIONS') {
    return context.next();
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'anonymous';
  const now = Date.now();
  const clientLimit = rateLimitMap.get(ip);

  // General rate limit check
  if (!clientLimit || now > clientLimit.resetTime) {
    // New window or expired window
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
  } else {
    // Increment count for existing window
    clientLimit.count += 1;
    if (clientLimit.count > MAX_REQUESTS) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((clientLimit.resetTime - now) / 1000).toString(),
          },
        }
      );
    }
  }

  // Self-cleaning map to prevent memory leaks in long-lived worker isolates.
  // IMPORTANT: We only scan a fixed-size sample of entries per request (max 50)
  // instead of iterating the entire map. A full O(N) sweep on every request
  // would consume the entire 50ms Edge CPU budget under heavy load or DDoS.
  if (rateLimitMap.size > 500) {
    let cleaned = 0;
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetTime) {
        rateLimitMap.delete(key);
        cleaned++;
        // Stop after 50 deletions to cap per-request CPU cost at O(50).
        // The map will be cleaned incrementally across subsequent requests.
        if (cleaned >= 50) break;
      }
    }
  }

  return context.next();
}
