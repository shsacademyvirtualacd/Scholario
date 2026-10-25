import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../env';
import { GoogleGenAI, Modality } from '@google/genai';
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

function createWavHeader(dataLength: number, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format = 1
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataLength, true);
  return new Uint8Array(header);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/\s+/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function onRequestPost(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env } = context;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      text?: string;
      voiceName?: string;
    };

    const rawText = (body.text || '').trim();
    if (!rawText) {
      return new Response(
        JSON.stringify({ error: 'text string is required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey =
      env?.GEMINI_API_KEY ||
      (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key is not configured for server TTS' }),
        { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-cf',
        },
      },
    });

    const clippedText = rawText.slice(0, 3500);
    const voiceName = body.voiceName || 'Kore';

    const response = await ai.models.generateContent({
      model: SAGE_AI_MODELS.TTS,
      contents: [{ parts: [{ text: clippedText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Pcm = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Pcm) {
      return new Response(
        JSON.stringify({ error: 'No audio data returned from TTS model' }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const audioBytes = base64ToUint8Array(base64Pcm);
    const hasRiffHeader =
      audioBytes.byteLength > 44 &&
      audioBytes[0] === 0x52 && // 'R'
      audioBytes[1] === 0x49 && // 'I'
      audioBytes[2] === 0x46 && // 'F'
      audioBytes[3] === 0x46;   // 'F'

    let wavBytes: Uint8Array;
    if (hasRiffHeader) {
      wavBytes = audioBytes;
    } else {
      const wavHeader = createWavHeader(audioBytes.byteLength, 24000, 1, 16);
      wavBytes = new Uint8Array(wavHeader.byteLength + audioBytes.byteLength);
      wavBytes.set(wavHeader, 0);
      wavBytes.set(audioBytes, wavHeader.byteLength);
    }

    return new Response(wavBytes, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('[Cloudflare Pages Sage TTS Error]:', err?.message || err);
    return new Response(
      JSON.stringify({ error: err?.message || 'TTS generation failed' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
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
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
