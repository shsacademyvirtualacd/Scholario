import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../env';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { generateCurriculumFallbackMCQs } from '../../../src/lib/curriculumMCQs';
import { filterAndValidateMCQs } from '../../../src/lib/mcqValidator';
import { getChapterSyllabusScope } from '../../../src/lib/curriculumFBISE9';

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
    excludeQuestionTexts = [],
  } = body || {};

  const normExcludes: string[] = Array.isArray(excludeQuestionTexts)
    ? excludeQuestionTexts.map((s: any) => String(s || '').trim()).filter(Boolean)
    : [];

  const count = Math.min(Math.max(Number(questionCount) || 10, 1), 30);
  const apiKey =
    env?.GEMINI_API_KEY ||
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);

  if (!apiKey) {
    const fallbackQuestions = generateCurriculumFallbackMCQs(subject, topic, count, difficulty, grade, board, normExcludes);
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

    const normSub = String(subject || '').toLowerCase();
    const normTop = String(topic || '').toLowerCase();
    const isFullSyllabus = normTop === 'full syllabus' || normTop === 'mixed chapters' || normTop === 'all';

    // Retrieve authoritative syllabus scope
    const syllabusScope = getChapterSyllabusScope(subject, topic);

    let subjectGuidance = '';
    let subjectMandatoryRequirement = '';

    if (normSub.includes('isl')) {
      subjectMandatoryRequirement = `MANDATORY ISLAMIAT DIRECTIVE:
1. Every single question MUST directly test authentic Islamic concepts from official Grade ${grade} Islamiyat: Quranic verses, Hadith narrations, Islamic beliefs (Tauheed, Shirk, Risalat, Khatam-un-Nabiyyin, Malaika, Divine Books, Akhirat), or Islamic worship (Salat, Sawm, Zakat, Hajj, Nisab).
2. STRICTLY FORBIDDEN: NEVER mention science, physics, SI units, chemistry, chemical formulas, mathematics, biology, or English grammar. Science concepts in Islamiyat are considered FATAL HALLUCINATIONS.`;
    } else if (normSub.includes('math')) {
      subjectMandatoryRequirement = `MANDATORY MATHEMATICS DIRECTIVE:
1. Every single question MUST directly be a concrete mathematical, algebraic, geometric, or statistical problem testing specific equations, properties, or calculations from "${syllabusScope.chapter}".
2. Use clean LaTeX notation ($...$) for formulas and expressions.
3. STRICTLY FORBIDDEN: Calculus, derivatives (dy/dx), integrals, matrices in non-matrix chapters, or science/humanities content.`;
    } else if (normSub.includes('chem')) {
      subjectMandatoryRequirement = `MANDATORY CHEMISTRY DIRECTIVE:
1. Every single question MUST directly test authentic chemical principles, atomic models, electronic configurations, balanced chemical equations, or substance properties from "${syllabusScope.chapter}".
2. STRICTLY FORBIDDEN: Stoichiometry/moles in Atomic Structure; Organic functional groups in inorganic chapters; cross-chapter bleed.`;
    } else if (normSub.includes('phys')) {
      subjectMandatoryRequirement = `MANDATORY PHYSICS DIRECTIVE:
1. Every single question MUST directly test physical quantities, equations of motion, laws of physics, or measurement principles from "${syllabusScope.chapter}".
2. Include appropriate SI units and numerical values where applicable.`;
    } else if (normSub.includes('bio')) {
      subjectMandatoryRequirement = `MANDATORY BIOLOGY DIRECTIVE:
1. Every single question MUST test specific biological mechanisms, anatomical structures, or cell organelles from "${syllabusScope.chapter}".`;
    } else if (normSub.includes('urd')) {
      subjectMandatoryRequirement = `MANDATORY URDU DIRECTIVE:
1. Every single question MUST test Urdu textual comprehension, grammar (قواعد), vocabulary (الفاظ معنی), or poetic analysis strictly from "${syllabusScope.chapter}".`;
    } else {
      subjectMandatoryRequirement = `MANDATORY DIRECTIVE:
1. Every single question MUST directly test concrete concepts and principles from "${syllabusScope.chapter}".`;
    }

    if (!isFullSyllabus && topic) {
      const subtopicList = syllabusScope.subtopics.map((s) => `  * ${s}`).join('\n');
      const forbiddenList = syllabusScope.forbiddenCrossChapterPatterns.map((f) => `  * DO NOT INCLUDE: ${f.reason}`).join('\n');

      subjectGuidance = `
======================================================================
AUTHORITATIVE SYLLABUS CHAPTER SCOPING (STRICT REQUIREMENT)
======================================================================
TARGET SUBJECT: ${syllabusScope.subject}
OFFICIAL CHAPTER: "${syllabusScope.chapter}"
TARGET GRADE: Grade ${grade} (${String(board).toUpperCase()} Board)
DIFFICULTY LEVEL: ${difficulty.replace('_', ' ').toUpperCase()}

ALLOWED / MANDATORY SYLLABUS TOPICS FOR THIS CHAPTER:
${subtopicList || `  * All official textbook concepts for ${syllabusScope.chapter}`}

${forbiddenList ? `STRICTLY FORBIDDEN CONCEPTS FOR THIS TEST:\n${forbiddenList}` : ''}
`;
    }

    const excludePromptPart = normExcludes.length > 0
      ? `\nCRITICAL ANTI-DUPLICATION RULE:\nDO NOT repeat or test the same concept/scenario as these already generated questions:\n${normExcludes.slice(-15).map((t) => `- "${t.slice(0, 100)}..."`).join('\n')}\nGenerate fresh, distinct questions.\n`
      : '';

    const prompt = `You are a Senior Academic Examiner and Curriculum Assessment Director specializing in Pakistan Secondary and Higher Secondary Education (FBISE and Sindh Board 9th-12th Grade syllabus).

Generate exactly ${count} rigorous, flawless Multiple Choice Questions (MCQs) for self-testing and exam practice.

Subject: ${syllabusScope.subject || subject}
Topic / Chapter: ${syllabusScope.chapter || topic}
Target Grade: Grade ${grade} (${board.toUpperCase()} Board)
Difficulty Level: ${difficulty.replace('_', ' ').toUpperCase()}

${subjectGuidance}
${subjectMandatoryRequirement}
${excludePromptPart}
STRICT ANTI-META DIRECTIVES:
1. STRICTLY FORBIDDEN: NEVER write meta-questions about the curriculum, textbook accuracy, syllabus validity, or generic claims (e.g., 'Which statement is factually accurate according to the textbook', 'verified textbook principle', 'invalid assumption violating syllabus definitions').
2. Every question must have EXACTLY ONE unambiguously correct answer ('A', 'B', 'C', or 'D').
3. The other 3 options ('distractors') must be realistic, plausible, and academically meaningful based on common student errors.
4. No duplicate questions, no factual errors, and no ambiguous questions.
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

    const fallbackPool = generateCurriculumFallbackMCQs(subject, topic, count * 3, difficulty, grade, board, normExcludes);

    if (parsedData && Array.isArray(parsedData.questions) && parsedData.questions.length > 0) {
      const rawNormalized = parsedData.questions.map((q: any, idx: number) => ({
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

      const validationContext = {
        subject,
        topic,
        grade: String(grade),
        board: String(board),
      };
      const validatedQuestions = filterAndValidateMCQs(rawNormalized, count, fallbackPool, validationContext, normExcludes);

      if (validatedQuestions.length >= count) {
        return new Response(
          JSON.stringify({
            success: true,
            source: 'gemini-ai-validated',
            questions: validatedQuestions.slice(0, count),
          }),
          {
            status: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        source: 'curriculum-bank',
        questions: fallbackPool.slice(0, count),
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
