import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../env';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { generateCurriculumFallbackMCQs } from '../../../src/lib/curriculumMCQs';

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

export async function onRequestPost(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env } = context;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON payload in request body' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const {
    subject = 'Physics',
    topic = 'General Science',
    questionCount = 10,
    difficulty = 'medium',
    board = 'fbise',
    grade = '10',
  } = body || {};

  const count = Math.min(Math.max(Number(questionCount) || 10, 1), 30);
  const apiKey =
    env?.GEMINI_API_KEY ||
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);

  if (!apiKey) {
    const fallbackQuestions = generateCurriculumFallbackMCQs(subject, topic, count, difficulty, grade, board);
    return new Response(
      JSON.stringify({
        success: true,
        source: 'curriculum-bank',
        questions: fallbackQuestions,
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const isFbise9 =
      (String(board).toLowerCase() === 'fbise' || String(board).toLowerCase() === 'federal' || String(board).toLowerCase().includes('fbise')) &&
      (String(grade) === '9' || String(grade) === '9th');

    let customSyllabusGuidance = '';
    if (isFbise9) {
      customSyllabusGuidance = `
AUTHORITATIVE GRADE 9 FBISE SYLLABUS ENFORCEMENT:
Every generated question MUST strictly belong to the selected subject (${subject}) and chapter (${topic}) of the official Grade 9 FBISE Curriculum.
Never mix chapters unless topic is explicitly Full Syllabus or Mixed Chapters.
Never invent generic or made-up topics.
- Physics: Questions from 9 FBISE chapters (Physical Quantities, Kinematics, Dynamics I/II, Pressure, Work & Energy, Density & Temp, Magnetism, Nature of Science).
- Chemistry: Questions from 19 FBISE chapters (Nature of Science, Matter, Atomic Structure, Periodic Table, Bonding, Stoichiometry, Electrochemistry, Energetics, Equilibrium, Acids & Bases, Env Chem Air/Water, Organic Chem, Hydrocarbons, Biochemistry, Empirical Data, Separation Techniques, Qualitative Analysis, Chromatography).
- Biology: Questions from 10 FBISE chapters (Science of Biology, Molecular Biology, The Cell, Tissues/Organs, Cell Cycle, Biodiversity, Metabolism, Plant Physiology, Plant Reproduction, Evolution).
- Mathematics: 11 FBISE chapters (Real Numbers, Logarithms, Sets & Relations, Factorization, Linear Equations, Trigonometry & Bearing, Coordinate Geometry, Straight Lines, Polygons, Practical Geometry, Statistics).
- Urdu: Specific lessons (اخلاقِ حسنہ, کتبہ, بھیڑیا, آرام و سکون, نام دیوہالی, اپنی مدد آپ, حمد, نعت, جاوید کے نام, فقیرانہ آئے صدا کر چلے, etc.).
- Islamiyat: Official 7 chapters (تدوینِ قرآن و حدیث, ایمانیات و عبادات, سیرتِ نبویؐ مدنی دور, اخلاق و آداب, حسنِ معاملات, مشاہیرِ اسلام, عصری تقاضے).
Ensure questions test actual curriculum formulas, definitions, calculations, Quranic/Hadith facts, or literary comprehension.`;
    }

    const prompt = `You are a Senior Academic Examiner and Curriculum Assessment Director specializing in Pakistan Secondary and Higher Secondary Education (FBISE and Sindh Board 9th-12th Grade syllabus).

Generate exactly ${count} rigorous, flawless Multiple Choice Questions (MCQs) for self-testing and exam practice.

Subject: ${subject}
Topic / Chapter: ${topic}
Target Grade: Grade ${grade} (${board.toUpperCase()} Board)
Difficulty Level: ${difficulty.replace('_', ' ').toUpperCase()}

${customSyllabusGuidance}

STRICT CRITERIA:
1. Every question must have EXACTLY ONE unambiguously correct answer ('A', 'B', 'C', or 'D').
2. The other 3 options ('distractors') must be realistic, plausible, and academically meaningful based on common student errors.
3. No duplicate questions, no factual errors, and no ambiguous questions.
4. For all math, chemical, or physics equations, use clean standard notation or inline LaTeX ($...$).
5. Each question must include a clear, educational explanation detailing why the correct option is right.

Return ONLY a valid JSON object matching this structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text...",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "correctAnswer": "A",
      "explanation": "Step-by-step reasoning explaining why option A is correct..."
    }
  ]
}`;

    const targetModel = 'gemini-2.5-flash';
    const aiResponse = await ai.models.generateContent({
      model: targetModel,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const responseText = aiResponse.text?.trim() || '';
    let parsedData: any = null;

    try {
      parsedData = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    if (parsedData && Array.isArray(parsedData.questions) && parsedData.questions.length > 0) {
      const normalized = parsedData.questions.slice(0, count).map((q: any, idx: number) => ({
        id: q.id || `q_${Date.now()}_${idx + 1}`,
        question: q.question || `Question ${idx + 1}`,
        options: {
          A: q.options?.A || 'Option A',
          B: q.options?.B || 'Option B',
          C: q.options?.C || 'Option C',
          D: q.options?.D || 'Option D',
        },
        correctAnswer: (['A', 'B', 'C', 'D'].includes(q.correctAnswer) ? q.correctAnswer : 'A') as 'A' | 'B' | 'C' | 'D',
        explanation: q.explanation || 'Refer to the textbook syllabus chapter for comprehensive details.',
        topic,
      }));

      return new Response(
        JSON.stringify({
          success: true,
          source: 'gemini-ai',
          questions: normalized,
        }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    const fallback = generateCurriculumFallbackMCQs(subject, topic, count, difficulty, grade, board);
    return new Response(
      JSON.stringify({
        success: true,
        source: 'curriculum-bank',
        questions: fallback,
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('[Cloudflare Pages Generate MCQ Error]:', err);
    const fallback = generateCurriculumFallbackMCQs(subject, topic, count, difficulty, grade, board);
    return new Response(
      JSON.stringify({
        success: true,
        source: 'curriculum-bank-error-fallback',
        questions: fallback,
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
}
