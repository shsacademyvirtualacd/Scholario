import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../env';
import {
  ACADEMY_KNOWLEDGE_SYSTEM_PROMPT,
  getPublicGuideLocalAnswer,
} from '../../src/data/academyKnowledge';

/**
 * Cloudflare Pages Function for Tango — the Public Home Page Guide (/api/public-guide)
 * Introduces itself strictly as Tango (never Sage) and never outputs star/sparkle symbols.
 */
const TANGO_PUBLIC_GUIDE_MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
] as const;

const RATE_LIMIT_MAX_REQUESTS = 15;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_INPUT_CHARS = 500;
const MAX_HISTORY_TURNS = 6;

// In-memory rate limit fallback when KV is not bound
const memoryRateMap = new Map<string, { count: number; resetAt: number }>();

function sanitizePlainText(text: string): string {
  return (text || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/[✦★✨⭐🌟💫]/g, '')
    .trim();
}

async function checkIpRateLimit(
  ip: string,
  env: Env
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const key = `tango_pub_guide_rl:${ip}`;

  if (env.PUBLIC_GUIDE_KV) {
    try {
      const raw = await env.PUBLIC_GUIDE_KV.get(key);
      if (raw) {
        const parsed = JSON.parse(raw) as { count: number; resetAt: number };
        if (now < parsed.resetAt) {
          if (parsed.count >= RATE_LIMIT_MAX_REQUESTS) {
            return { allowed: false, remaining: 0 };
          }
          const updated = { count: parsed.count + 1, resetAt: parsed.resetAt };
          const ttlSeconds = Math.max(60, Math.ceil((parsed.resetAt - now) / 1000));
          await env.PUBLIC_GUIDE_KV.put(key, JSON.stringify(updated), {
            expirationTtl: ttlSeconds,
          });
          return {
            allowed: true,
            remaining: RATE_LIMIT_MAX_REQUESTS - updated.count,
          };
        }
      }
      const fresh = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
      await env.PUBLIC_GUIDE_KV.put(key, JSON.stringify(fresh), {
        expirationTtl: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
      });
      return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
    } catch {
      // Fall through to in-memory map if KV errors
    }
  }

  // Cleanup expired entries occasionally
  if (memoryRateMap.size > 500) {
    for (const [k, v] of memoryRateMap.entries()) {
      if (now >= v.resetAt) memoryRateMap.delete(k);
    }
  }

  const existing = memoryRateMap.get(key);
  if (existing && now < existing.resetAt) {
    if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
      return { allowed: false, remaining: 0 };
    }
    existing.count += 1;
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - existing.count,
    };
  }

  memoryRateMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const clientIp =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'anon';

  const rateCheck = await checkIpRateLimit(clientIp, env);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        reply:
          "Meow! Tango here 🐾 You've sent quite a few messages in a short time. Please wait a few minutes, or tap **Get Started** above to explore the portal directly!",
        rateLimited: true,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  let body: {
    message?: string;
    history?: Array<{ role?: string; content?: string }>;
  } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON request body for Tango guide.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const rawMessage = sanitizePlainText(String(body.message || '')).slice(0, MAX_INPUT_CHARS);
  if (!rawMessage) {
    return new Response(
      JSON.stringify({ error: 'Message to Tango cannot be empty.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const safeHistory = Array.isArray(body.history)
    ? body.history
        .slice(-MAX_HISTORY_TURNS)
        .map((h) => ({
          role: h?.role === 'assistant' || h?.role === 'model' ? 'model' : 'user',
          parts: [{ text: sanitizePlainText(String(h?.content || '')).slice(0, MAX_INPUT_CHARS) }],
        }))
        .filter((h) => h.parts[0].text.length > 0)
    : [];

  const apiKey = (
    env.GEMINI_API_KEY ||
    env.GOOGLE_API_KEY ||
    env.VITE_GEMINI_API_KEY ||
    ''
  ).trim();

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        reply: sanitizePlainText(getPublicGuideLocalAnswer(rawMessage)),
        model: 'tango-local-knowledge-fallback',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  const contents = [
    ...safeHistory,
    {
      role: 'user',
      parts: [{ text: rawMessage }],
    },
  ];

  for (const modelName of TANGO_PUBLIC_GUIDE_MODEL_CHAIN) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`;

      const geminiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: ACADEMY_KNOWLEDGE_SYSTEM_PROMPT }],
          },
          contents,
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 320,
          },
        }),
      });

      if (!geminiRes.ok) {
        continue;
      }

      const data = (await geminiRes.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };

      const candidateText = data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || '')
        .join('')
        .trim();

      if (candidateText) {
        return new Response(
          JSON.stringify({
            reply: sanitizePlainText(candidateText),
            model: modelName,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    } catch (err) {
      console.warn(`[Tango Public Guide] Model ${modelName} fallback:`, err);
    }
  }

  // Canned local fallback if all Gemini models fail
  return new Response(
    JSON.stringify({
      reply: sanitizePlainText(getPublicGuideLocalAnswer(rawMessage)),
      model: 'tango-local-knowledge-fallback',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
};
