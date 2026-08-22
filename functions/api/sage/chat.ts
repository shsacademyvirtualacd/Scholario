import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../env';
import { GoogleGenAI } from '@google/genai';

interface ChatMessagePayload {
  role: 'user' | 'assistant' | 'model';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessagePayload[];
  userRole?: 'student' | 'teacher' | 'admin' | 'parent';
  userName?: string;
  grade?: string;
  stream?: string;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function onRequest(context: EventContext<Env, any, any>): Promise<Response> {
  if (context.request.method === 'OPTIONS') {
    return onRequestOptions();
  }
  if (context.request.method === 'POST') {
    return onRequestPost(context);
  }
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: CORS_HEADERS,
  });
}

export async function onRequestPost(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env } = context;

  try {
    let body: ChatRequestBody;
    try {
      body = (await request.json()) as ChatRequestBody;
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload in request body' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { messages, userRole = 'student', userName, grade, stream } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'A non-empty messages array is required' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Collect all candidate Gemini API keys in priority order
    const candidateKeys: string[] = [
      env?.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined),
      env?.GEMINI_API_KEY_2 || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY_2 : undefined),
      env?.GEMINI_API_KEY_3 || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY_3 : undefined),
      env?.GEMINI_API_KEY_4 || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY_4 : undefined),
      (env as any)?.GOOGLE_GENAI_API_KEY,
    ].filter((k): k is string => typeof k === 'string' && k.trim().length > 0);

    // Build context-aware system instruction
    const roleDescription =
      userRole === 'teacher'
        ? 'You are speaking with a teacher/faculty member. Assist with lesson preparation, topic explanations, quiz question generation, assignment outlines, and pedagogical advice.'
        : userRole === 'admin'
        ? 'You are speaking with an institution administrator. Assist with academic administration, announcement drafting, timetable organization, and educational operations.'
        : `You are speaking with an SHS Virtual Academy student${userName ? ` named ${userName}` : ''}${
            grade ? ` in ${grade}` : ''
          }${stream ? ` (${stream} stream)` : ''}. Assist with academic questions, step-by-step problem solving, revision notes, conceptual explanations, and exam preparation.`;

    const systemInstruction = `You are Sage, the intelligent, friendly, and expert AI study companion built exclusively for Scholario & SHS Virtual Academy (FBISE 9th-12th grade curricula: Mathematics, Physics, Chemistry, Biology, Computer Science, English, Urdu, Islamiat, and Pakistan Studies).

${roleDescription}

Key Guidelines:
1. Provide accurate, clear, and structured explanations suitable for high school & college level (FBISE / Federal Board standard).
2. Format responses with clean Markdown: use bolding, bullet points, and code blocks or LaTeX-like equations where appropriate.
3. Be encouraging, patient, and concise. Break complex formulas or multi-step derivations into digestible steps.
4. When asked for study tips or note summaries, structure them with key concepts, definitions, formulas, and common exam pitfalls.
5. If the user asks who you are, introduce yourself as Sage, the AI academic study companion for Scholario & SHS Virtual Academy.`;

    if (candidateKeys.length === 0) {
      // Graceful fallback when no GEMINI_API_KEY secrets are set in Cloudflare dashboard
      const lastUserMsg = messages[messages.length - 1]?.content || 'Hello';
      return new Response(
        JSON.stringify({
          reply: `**Sage (Study Companion)**: I received your question about *"_**${lastUserMsg}**_*. Note: \`GEMINI_API_KEY\` is not yet configured in your Cloudflare Pages environment variables/secrets. Please add \`GEMINI_API_KEY\` in your Cloudflare Pages project settings to activate live Gemini AI responses!`,
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // Format conversation history for @google/genai
    const contents = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    // Sequential fallback strategy: try each key in order until one succeeds
    let lastError: any = null;

    for (let i = 0; i < candidateKeys.length; i++) {
      const currentKey = candidateKeys[i];
      const keyLabel = `Key #${i + 1}`;

      try {
        const ai = new GoogleGenAI({ apiKey: currentKey });

        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents,
          config: {
            systemInstruction,
          },
        });

        const replyText =
          response.text || 'I could not generate a response at this moment. Please try again.';

        return new Response(JSON.stringify({ reply: replyText }), {
          status: 200,
          headers: CORS_HEADERS,
        });
      } catch (keyErr: any) {
        lastError = keyErr;
        console.warn(
          `[Sage Chat Fallback] ${keyLabel} failed with error: ${keyErr?.message || keyErr}. ` +
          (i < candidateKeys.length - 1
            ? `Attempting fallback with Key #${i + 2}...`
            : 'All configured Gemini API keys have been exhausted.')
        );
      }
    }

    // If all candidate keys failed (quota/rate-limits/network)
    console.error('[Cloudflare Pages Sage Chat] All API keys failed. Last error:', lastError);
    return new Response(
      JSON.stringify({
        error:
          lastError?.message ||
          'All configured Gemini API keys exceeded quota or encountered errors. Please try again in a few moments.',
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error('[Cloudflare Pages Sage Chat Function Error]:', err);
    return new Response(
      JSON.stringify({
        error: err.message || 'Failed to process AI chat request through Sage',
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
