import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../env';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { SAGE_AI_MODELS } from '../../../src/lib/knowledgeBaseService';

const CORS_HEADERS = {
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

export async function onRequestPost(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env } = context;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      audio_base64?: string;
      mime_type?: string;
    };

    const { audio_base64, mime_type = 'audio/webm' } = body;

    if (!audio_base64 || typeof audio_base64 !== 'string') {
      return new Response(
        JSON.stringify({ error: 'audio_base64 string is required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey =
      env?.GEMINI_API_KEY ||
      (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key is not configured' }),
        { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const cleanBase64 = audio_base64.includes('base64,')
      ? audio_base64.split('base64,')[1]
      : audio_base64;

    const cleanMime = mime_type.split(';')[0].trim() || 'audio/webm';

    const rawModel =
      env?.GEMINI_MODEL ||
      (typeof process !== 'undefined' ? process.env?.GEMINI_MODEL : undefined) ||
      SAGE_AI_MODELS.TRANSCRIBE;
    const primaryModel = rawModel.trim().replace(/^models\//i, '') || SAGE_AI_MODELS.TRANSCRIBE;
    const candidateModels = Array.from(
      new Set([primaryModel, SAGE_AI_MODELS.PRIMARY, SAGE_AI_MODELS.FALLBACK])
    );

    const prompt = `Listen to this voice message from a teacher or student carefully.
Transcribe what the person said verbatim.
- The speaker may be speaking in English, Urdu, or mixed Urdu and English (Urdish / Roman Urdu / Urdu script).
- Output ONLY the transcribed text. Do NOT add any preamble, explanation, notes, or punctuation commentary.
- If the audio is empty, silent, or only background static noise, respond with strictly: [EMPTY]`;

    let rawTranscript = '';
    let lastErr: any = null;
    for (const modelId of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelId,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType: cleanMime,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          config: {
            temperature: 0.1,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });
        rawTranscript = (response.text || '').trim();
        lastErr = null;
        break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`[Sage Transcribe] Model ${modelId} failed, trying fallback:`, err?.message || err);
      }
    }

    if (lastErr && !rawTranscript) {
      console.error('[Cloudflare Pages Sage Transcribe Model Error]:', lastErr);
      return new Response(
        JSON.stringify({ error: 'Sage is temporarily unavailable. Please try again in a moment.' }),
        { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    if (!rawTranscript || rawTranscript === '[EMPTY]' || /^(empty|silence|no audio|cannot hear)/i.test(rawTranscript)) {
      return new Response(
        JSON.stringify({
          transcript: '',
          error: "I couldn't hear anything, please try again.",
        }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ transcript: rawTranscript }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[Cloudflare Pages Sage Transcribe Outer Error]:', err);
    return new Response(
      JSON.stringify({ error: 'Sage is temporarily unavailable. Please try again in a moment.' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}
