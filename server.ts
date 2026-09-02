import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
const { Pool } = pg;

const pgPool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL || 'postgresql://postgres:Marcelmmm23155@@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rxgrxjlyrfzojvirkhdc.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Z3J4amx5cmZ6b2p2aXJraGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTc3OTksImV4cCI6MjA5ODkzMzc5OX0.ggAT2JiBTg6VG5tbZNnjkig7F73JE0ZzPl_145yuow4';

const supabaseServer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
});

// In-memory buffer store for dev server local previewing
const fileStorage = new Map<string, { buffer: Buffer; mimeType: string; filename: string }>();

import { adminToolDeclarations, executeAdminDataQuery } from './src/lib/adminDataTools';
import { generateCurriculumFallbackMCQs } from './src/lib/curriculumMCQs';
import { validateMCQQuestion, filterAndValidateMCQs, validateQuestionTopicRelevance, checkQuestionDuplicate } from './src/lib/mcqValidator';
import { getChapterSyllabusScope, FBISE_GRADE_9_CURRICULUM, normalizeFBISEGrade9Subject } from './src/lib/curriculumFBISE9';
import { IELTS_CURRICULUM, isIELTSBoard } from './src/lib/curriculumIELTS';
import { grade9FbiseBank, ieltsBank } from './src/data/banks/index';
import type { StoredMCQ } from './src/types/questionBank';
import {
  savePushSubscription,
  removePushSubscription,
  getAllPushSubscriptions,
  sendLiveSessionPushAlerts,
  checkAndSendTeacherPushReminders,
} from './src/lib/serverPushService';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Sage AI Chat endpoint (with SSE streaming)
  app.post('/api/sage/chat', async (req, res) => {
    // Set headers for SSE streaming
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    try {
      const { messages, userRole = 'student', userName, grade, stream } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.write(`data: ${JSON.stringify({ error: 'Messages array is required' })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      const client = getGeminiClient();

      const isAdmin = userRole === 'admin';

      // Build context-aware system instruction
      const roleDescription = isAdmin
        ? `You are speaking with an institution administrator of Scholario & SHS Virtual Academy.
ADMINISTRATIVE LIVE DATA ACCESS: You have full READ-ONLY live platform data access via your built-in tools. When the administrator asks data, statistical, or operational questions (such as student counts, enrollment breakdowns by board/grade/stream, teacher directories, active class offerings, attendance rates, published tests, student grading and submissions, or fee pricing configs), ALWAYS call your tools to query the real-time live database and present accurate, structured, and helpful data.
CRITICAL RULES FOR ADMIN:
1. Live Database Queries: Whenever the admin asks about students, teachers, classes, attendance, tests, grading, or fees, call the appropriate read-only data query tool to retrieve real-time data from the live platform.
2. Read-Only Access: Your database access is strictly read-only. You cannot insert, update, or delete records. If the admin asks you to perform database modifications (e.g. create a test, delete a user, change fees), politely inform them that you have read-only live data access and guide them to the appropriate dashboard section where they can perform the action.
3. Accurate & Clear Presentation: Use Markdown tables, bold figures, and bullet points to organize data clearly.`
        : userRole === 'teacher'
        ? `You are speaking with a teacher/faculty member. Assist with lesson preparation, topic explanations, quiz question generation, assignment outlines, and pedagogical advice.
ACCESS CONTROL & PRIVACY RULE: You are in general-purpose academic assistant mode and DO NOT have access to live administrative database records, fee configs, or private platform data. If the teacher asks data-specific questions about real platform data (such as how many students are enrolled, student contact lists, fee configs, grades of other classes, or private roster records), politely explain that live database information is not available to them here and suggest checking with an admin or their teacher dashboard instead.`
        : `You are speaking with an SHS Virtual Academy student${userName ? ` named ${userName}` : ''}${
            grade ? ` in ${grade}` : ''
          }${stream ? ` (${stream} stream)` : ''}. Assist with academic questions, step-by-step problem solving, revision notes, conceptual explanations, and exam preparation.
ACCESS CONTROL & PRIVACY RULE: You are an academic study assistant and DO NOT have access to administrative database records or private platform data. If the student asks data-specific questions about real platform data (such as how many students are enrolled, other students' records, or private administrative settings), politely explain that this information isn't available to them here and suggest checking with an administrator or their student dashboard instead.`;

      const systemInstruction = `You are Sage, the intelligent, friendly, and expert AI study and academic companion built exclusively for Scholario & SHS Virtual Academy (FBISE and Sindh Board 9th-12th grade curricula: Mathematics, Physics, Chemistry, Biology, Computer Science, English, Urdu, Islamiat, and Pakistan Studies).

${roleDescription}

Key Guidelines:
1. **Be Concise & Direct by Default**: Keep answers short, direct, and to the point (typically 1-3 focused paragraphs or bullet points). Avoid conversational fluff or unnecessary preambles.
2. **Detailed Drafts on Request Only**: Provide comprehensive documents, full essay-length breakdowns, or complete circular notices ONLY when the user explicitly requests a "full draft", "complete notice", "complete document", "in-depth explanation", or similar.
3. **Format with Markdown & LaTeX Math**: Use standard Markdown (headings, bold, lists, tables). For all mathematical or scientific formulas, write standard LaTeX syntax using inline \`$formula$\` (e.g. \`$E = mc^2$\`, \`$v = u + at$\`, \`$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$\`) or block \`$$equation$$\`.
4. **Curriculum Alignment**: Adhere to FBISE / Sindh Board high school & college syllabus standards. Break multi-step derivations or numerical problems into clear, numbered steps.
5. **Persona**: Friendly, supportive, sharp, and academic study companion for Scholario & SHS Virtual Academy.`;

      const authHeader = (req.headers.authorization || req.headers['authorization']) as string | undefined;
      const requestSupabase = authHeader
        ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } },
          })
        : supabaseServer;

      if (!client) {
        // Fallback intelligent simulation if no GEMINI_API_KEY is configured in the environment
        const lastUserMsg = messages[messages.length - 1]?.content || 'Hello';
        let fallbackText = '';

        if (isAdmin) {
          // If admin asks in fallback mode, still fetch live DB overview if possible
          try {
            const overview = await executeAdminDataQuery('queryPlatformOverview', {}, requestSupabase);
            const feeData = await executeAdminDataQuery('queryPricingAndFeeConfigs', {}, requestSupabase);
            fallbackText = `**Sage (Live Platform Overview — Admin Mode)**:\n\n` +
              `Here is the live snapshot from Scholario's database:\n` +
              `- **Registered Students**: ${overview?.kpis?.total_registered_students ?? 0} (Onboarded: ${overview?.kpis?.onboarded_students ?? 0})\n` +
              `- **Faculty Teachers**: ${overview?.kpis?.total_faculty_teachers ?? 0} (Active: ${overview?.kpis?.active_teachers ?? 0})\n` +
              `- **Active Class Offerings**: ${overview?.kpis?.active_class_offerings ?? 0}\n` +
              `- **Published Assessments**: ${overview?.kpis?.published_assessments_count ?? 0} (Submissions: ${overview?.kpis?.total_student_submissions ?? 0})\n` +
              `- **Tuition Fee Configurations**: ${feeData?.fee_configurations?.length ?? 0} classes configured\n\n` +
              `*Note: Configure \`GEMINI_API_KEY\` in your environment settings for custom interactive AI responses.*`;
          } catch {
            fallbackText = `**Sage (Admin Mode)**: I received your query about *"_**${lastUserMsg}**_*. Please ensure \`GEMINI_API_KEY\` is configured in your project settings for full interactive AI responses.`;
          }
        } else {
          fallbackText = `**Sage (Study Companion)**: I received your question about *"_**${lastUserMsg}**_*. Please ensure \`GEMINI_API_KEY\` is configured in your project settings for live AI responses. Here is a helpful tip: In FBISE curricula, always structure your answers with definitions, core formulas, and labeled diagrams for full marks!`;
        }

        const words = fallbackText.split(' ');
        for (let i = 0; i < words.length; i += 3) {
          const chunk = words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
          await new Promise((r) => setTimeout(r, 40));
        }
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      // Convert conversation history into @google/genai Content format
      const contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const targetModel = 'gemini-2.5-flash';

      if (isAdmin) {
        // Admin flow: Call generateContent with read-only tools
        try {
          let currentContents = [...contents];
          const maxTurns = 3;
          let turn = 0;
          let finalResponseSent = false;

          while (turn < maxTurns) {
            turn++;
            const genRes = await client.models.generateContent({
              model: targetModel,
              contents: currentContents,
              config: {
                systemInstruction,
                tools: [{ functionDeclarations: adminToolDeclarations }],
                thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              },
            });

            if (genRes.functionCalls && genRes.functionCalls.length > 0) {
              const toolParts: any[] = [];
              for (const call of genRes.functionCalls) {
                const toolName = call.name || '';
                const data = await executeAdminDataQuery(toolName, call.args || {}, requestSupabase);
                toolParts.push({
                  functionResponse: {
                    name: toolName,
                    response: {
                      result: data,
                    },
                    ...(call.id ? { id: call.id } : {}),
                  },
                });
              }

              const modelCandidate = genRes.candidates?.[0]?.content;
              if (modelCandidate) {
                currentContents.push(modelCandidate);
              }
              currentContents.push({
                role: 'user',
                parts: toolParts,
              });
            } else {
              // Final response produced
              if (genRes.text) {
                // Stream the text to the client in smooth chunks
                const words = genRes.text.split(' ');
                for (let i = 0; i < words.length; i += 3) {
                  const chunk = words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
                  res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
                  await new Promise((r) => setTimeout(r, 15));
                }
                finalResponseSent = true;
              }
              break;
            }
          }

          if (!finalResponseSent) {
            // Stream the final response with full context
            const streamResponse = await client.models.generateContentStream({
              model: targetModel,
              contents: currentContents,
              config: {
                systemInstruction,
                thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              },
            });

            for await (const chunk of streamResponse) {
              const chunkText = chunk.text;
              if (chunkText) {
                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
              }
            }
          }
        } catch (adminAiErr: any) {
          console.warn('[Sage Admin AI error, falling back to direct stream/DB summary]:', adminAiErr.message);
          // Fallback to deliver live platform overview summary if Gemini call fails
          try {
            const overview = await executeAdminDataQuery('queryPlatformOverview', {}, supabaseServer);
            res.write(`data: ${JSON.stringify({
              text: `**Sage (Live Platform Snapshot — Admin Mode)**:\n\n` +
                `- **Total Registered Students**: ${overview?.kpis?.total_registered_students ?? 0} (Onboarded: ${overview?.kpis?.onboarded_students ?? 0})\n` +
                `- **Total Faculty Teachers**: ${overview?.kpis?.total_faculty_teachers ?? 0} (Active: ${overview?.kpis?.active_teachers ?? 0})\n` +
                `- **Active Class Offerings**: ${overview?.kpis?.active_class_offerings ?? 0}\n` +
                `- **Published Assessments**: ${overview?.kpis?.published_assessments_count ?? 0} (${overview?.kpis?.total_student_submissions ?? 0} submissions)\n` +
                `- **Tuition Fee Configurations**: ${overview?.kpis?.total_fee_configurations ?? 0} active tiers\n`
            })}\n\n`);
          } catch {
            res.write(`data: ${JSON.stringify({ error: adminAiErr.message || 'Error executing AI response' })}\n\n`);
          }
        }
      } else {
        // Non-admin flow (teacher/student): No tools, direct streaming general academic assistant
        const streamResponse = await client.models.generateContentStream({
          model: targetModel,
          contents,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });

        for await (const chunk of streamResponse) {
          const chunkText = chunk.text;
          if (chunkText) {
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
          }
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: any) {
      console.error('[Sage Chat Streaming Error]:', err);
      res.write(`data: ${JSON.stringify({ error: err.message || 'Failed to process AI chat stream' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  });

  // ── AI Self-Testing MCQ Generator Endpoint ───────────
  app.post('/api/tests/generate-mcq', async (req, res) => {
    try {
      const {
        subject = 'Physics',
        topic = 'General Science',
        questionCount = 10,
        difficulty = 'medium',
        board = 'fbise',
        grade = '10',
        excludeQuestionTexts = [],
      } = req.body;

      const normExcludes: string[] = Array.isArray(excludeQuestionTexts)
        ? excludeQuestionTexts.map((s: any) => String(s || '').trim()).filter(Boolean)
        : [];

      let effectiveBoard = board;
      let effectiveGrade = grade;

      // Check auth header and enforce student's enrolled board/grade if calling user is a student
      const authHeader = (req.headers.authorization || req.headers['authorization']) as string | undefined;
      if (authHeader) {
        try {
          const requestSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } },
          });
          const { data: { user } } = await requestSupabase.auth.getUser();
          if (user) {
            const { data: userProfile } = await requestSupabase
              .from('profiles')
              .select('*, class:classes(*, board:boards(*))')
              .eq('id', user.id)
              .maybeSingle();

            if (userProfile && userProfile.role === 'student') {
              const enrolledBoard =
                userProfile.board_id ||
                userProfile.class?.board_id ||
                userProfile.board?.id ||
                (typeof userProfile.board === 'string' ? userProfile.board : 'fbise');
              const enrolledGrade = userProfile.class?.grade || userProfile.grade || '10';

              effectiveBoard = enrolledBoard;
              effectiveGrade = enrolledGrade;
            }
          }
        } catch (authErr) {
          console.warn('[Generate MCQ] Auth check error:', authErr);
        }
      }

      // Explicit request parameters override student's general enrollment grade/board for practice tests
      if (req.body?.grade) {
        effectiveGrade = String(req.body.grade).trim();
      }
      if (req.body?.board) {
        effectiveBoard = String(req.body.board).trim();
      }

      const count = Math.min(Math.max(Number(questionCount) || 10, 1), 30);
      const client = getGeminiClient();

      if (!client) {
        // High quality curriculum fallback questions if no GEMINI_API_KEY is configured
        const fallbackQuestions = generateCurriculumFallbackMCQs(subject, topic, count, difficulty, effectiveGrade, effectiveBoard);
        return res.json({
          success: true,
          source: 'curriculum-bank',
          questions: fallbackQuestions,
        });
      }

      // Check if this is Grade 9 FBISE
      const isFbise9 =
        (effectiveBoard === 'fbise' || effectiveBoard === 'federal' || String(effectiveBoard).toLowerCase().includes('fbise')) &&
        (String(effectiveGrade) === '9' || String(effectiveGrade) === '9th');

      const normSub = (subject || '').toLowerCase();
      const normTop = (topic || '').toLowerCase();
      const isFullSyllabus = normTop === 'full syllabus' || normTop === 'mixed chapters' || normTop === 'all';

      // Retrieve authoritative syllabus scope
      const syllabusScope = getChapterSyllabusScope(subject, topic);

      let subjectGuidance = '';
      let subjectMandatoryRequirement = '';

      if (normSub.includes('isl')) {
        subjectMandatoryRequirement = `MANDATORY ISLAMIAT DIRECTIVE:
1. Every single question MUST directly test authentic Islamic concepts from official Grade ${effectiveGrade} Islamiyat: Quranic verses, Hadith narrations, Islamic beliefs (Tauheed, Shirk, Risalat, Khatam-un-Nabiyyin, Malaika, Divine Books, Akhirat), or Islamic worship (Salat, Sawm, Zakat, Hajj, Nisab).
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

      // Build strict chapter confinement directives
      if (!isFullSyllabus && topic) {
        const subtopicList = syllabusScope.subtopics.map((s) => `  * ${s}`).join('\n');
        const forbiddenList = syllabusScope.forbiddenCrossChapterPatterns.map((f) => `  * FORBIDDEN: ${f.reason}`).join('\n');

        subjectGuidance = `
======================================================================
STRICT CHAPTER CONFINEMENT & SYLLABUS BOUNDARIES (MANDATORY)
======================================================================
TARGET SUBJECT: ${syllabusScope.subject}
OFFICIAL TARGET CHAPTER: "${syllabusScope.chapter}"
TARGET GRADE: Grade ${effectiveGrade} (${String(effectiveBoard).toUpperCase()} Board)
DIFFICULTY LEVEL: ${difficulty.replace('_', ' ').toUpperCase()}

ALLOWED SYLLABUS TOPICS FOR THIS SPECIFIC CHAPTER:
${subtopicList || `  * All official textbook concepts for ${syllabusScope.chapter}`}

${forbiddenList ? `STRICTLY FORBIDDEN CONCEPTS (DO NOT INCLUDE QUESTIONS FROM OTHER CHAPTERS):\n${forbiddenList}` : ''}

CRITICAL CHAPTER ISOLATION RULE:
Every single question MUST be 100% strictly confined to "${syllabusScope.chapter}".
Under NO circumstances should questions from other chapters of ${syllabusScope.subject} be generated (e.g., if testing Chapter 1: Physical Quantities & Measurement, NEVER generate questions on kinematics/acceleration, Newton's laws/dynamics, work/energy, electricity, or optics).
Cross-chapter bleeding is considered a FATAL DEFECT and will fail validation.
`;
      }

      const excludePromptPart = normExcludes.length > 0
        ? `\nCRITICAL ANTI-DUPLICATION RULE:\nDO NOT repeat or test the same concept/scenario as these already generated questions:\n${normExcludes.slice(-15).map((t) => `- "${t.slice(0, 100)}..."`).join('\n')}\nGenerate fresh, distinct questions.\n`
        : '';

      const prompt = `You are a Senior Academic Examiner and Curriculum Assessment Director specializing in Pakistan Secondary and Higher Secondary Education (FBISE and Sindh Board 9th-12th Grade syllabus).

Generate exactly ${count} rigorous, flawless Multiple Choice Questions (MCQs) for student self-testing and exam practice.

Subject: ${syllabusScope.subject || subject}
Topic / Chapter: ${syllabusScope.chapter || topic}
Target Grade: Grade ${effectiveGrade} (${effectiveBoard.toUpperCase()} Board)
Difficulty Level: ${difficulty.replace('_', ' ').toUpperCase()}

${subjectGuidance}
${subjectMandatoryRequirement}
${excludePromptPart}
STRICT ANTI-META & ACCURACY DIRECTIVES:
1. STRICTLY FORBIDDEN: NEVER write meta-questions about the curriculum, textbook accuracy, syllabus validity, or generic claims (e.g., 'Which statement is factually accurate according to the textbook', 'verified textbook principle', 'invalid assumption violating syllabus definitions').
2. Every question must have EXACTLY ONE unambiguously correct answer ('A', 'B', 'C', or 'D').
3. The other 3 options ('distractors') must be realistic, plausible, and academically meaningful based on common student errors or misconceptions.
4. No duplicate questions, no factual errors, and no ambiguous questions.
5. Each question must include a clear, educational explanation detailing the exact reasoning why the correct option is right.

Return ONLY a valid JSON object matching this structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text with concrete sentence, equation, or scenario...",
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
}

Ensure strictly valid JSON output with zero markdown formatting outside the JSON structure.`;

      const modelsToTry = ['gemini-3.6-flash', 'gemini-3.7-flash'];
      let parsedData: any = null;
      let usedModel = 'gemini-3.6-flash';
      let lastModelError: string | null = null;

      for (const targetModel of modelsToTry) {
        try {
          console.log(`[Generate MCQ] Attempting ${count} MCQs with ${targetModel} for ${subject} -> "${syllabusScope.chapter || topic}"`);
          const aiResponse = await client.models.generateContent({
            model: targetModel,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          });

          const responseText = aiResponse.text?.trim() || '';
          if (responseText) {
            try {
              parsedData = JSON.parse(responseText);
            } catch {
              const cleaned = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
              parsedData = JSON.parse(cleaned);
            }
          }

          if (parsedData && Array.isArray(parsedData.questions) && parsedData.questions.length > 0) {
            usedModel = targetModel;
            break;
          }
        } catch (modelErr: any) {
          lastModelError = modelErr?.message || String(modelErr);
          console.warn(`[Generate MCQ] Model ${targetModel} generation failed:`, lastModelError);
        }
      }

      const fallbackPool = generateCurriculumFallbackMCQs(subject, topic, count * 3, difficulty, effectiveGrade, effectiveBoard, normExcludes);

      if (parsedData && Array.isArray(parsedData.questions) && parsedData.questions.length > 0) {
        // Normalize IDs, options structure, and answers
        const rawNormalized = parsedData.questions.map((q: any, idx: number) => {
          let opts: { A: string; B: string; C: string; D: string } = {
            A: 'Option A',
            B: 'Option B',
            C: 'Option C',
            D: 'Option D',
          };

          if (Array.isArray(q.options)) {
            opts = {
              A: String(q.options[0] || 'Option A'),
              B: String(q.options[1] || 'Option B'),
              C: String(q.options[2] || 'Option C'),
              D: String(q.options[3] || 'Option D'),
            };
          } else if (q.options && typeof q.options === 'object') {
            opts = {
              A: String(q.options.A || q.options.a || 'Option A'),
              B: String(q.options.B || q.options.b || 'Option B'),
              C: String(q.options.C || q.options.c || 'Option C'),
              D: String(q.options.D || q.options.d || 'Option D'),
            };
          }

          let ans: 'A' | 'B' | 'C' | 'D' = 'A';
          const rawAns = String(q.correctAnswer || q.answer || q.correct_answer || q.correctOption || '').trim();
          const rawUpper = rawAns.toUpperCase();

          if (['A', 'B', 'C', 'D'].includes(rawUpper)) {
            ans = rawUpper as 'A' | 'B' | 'C' | 'D';
          } else if (rawAns === opts.A) {
            ans = 'A';
          } else if (rawAns === opts.B) {
            ans = 'B';
          } else if (rawAns === opts.C) {
            ans = 'C';
          } else if (rawAns === opts.D) {
            ans = 'D';
          }

          return {
            id: q.id ? String(q.id) : `q_${Date.now()}_${idx + 1}`,
            question: q.question || `Question ${idx + 1}`,
            options: opts,
            correctAnswer: ans,
            explanation: q.explanation || 'Refer to the textbook syllabus chapter for comprehensive details.',
            topic: topic || 'General Topic',
          };
        });

        // Run through strict MCQ validator and backfill with curriculum bank if any question is invalid, generic, or off-topic
        const validationContext = {
          subject,
          topic,
          grade: String(effectiveGrade),
          board: String(effectiveBoard),
        };
        const validatedQuestions = filterAndValidateMCQs(rawNormalized, count, fallbackPool, validationContext, normExcludes);

        if (validatedQuestions.length >= count) {
          return res.json({
            success: true,
            source: 'gemini-ai-validated',
            model: usedModel,
            questions: validatedQuestions.slice(0, count),
          });
        } else if (validatedQuestions.length > 0) {
          // Combine partial AI questions with guaranteed curriculum fallback questions
          const combined = [...validatedQuestions];
          for (const fb of fallbackPool) {
            if (combined.length >= count) break;
            if (!combined.some((c) => c.question.toLowerCase() === fb.question.toLowerCase())) {
              combined.push(fb);
            }
          }
          return res.json({
            success: true,
            source: 'hybrid-ai-curriculum',
            model: usedModel,
            questions: combined.slice(0, count),
          });
        }
      }

      // Fallback if AI response was empty, malformed, or failed validation
      return res.json({
        success: true,
        source: 'curriculum-bank',
        questions: fallbackPool.slice(0, count),
        diagnostic: lastModelError ? { lastModelError } : undefined,
      });
    } catch (err: any) {
      console.error('[Generate MCQ Error]:', err);
      // Return safe fallback so user's experience is never broken
      const {
        subject = 'Physics',
        topic = 'General Science',
        questionCount = 10,
        difficulty = 'medium',
        board = 'fbise',
        grade = '10',
        excludeQuestionTexts = [],
      } = req.body || {};
      const fallback = generateCurriculumFallbackMCQs(subject, topic, Number(questionCount) || 10, difficulty, grade, board, excludeQuestionTexts);
      return res.json({
        success: true,
        source: 'emergency-curriculum-bank',
        questions: fallback.slice(0, Number(questionCount) || 10),
        error: err?.message || String(err),
      });
    }
  });

  // ── Pre-Generated MCQ Question Bank Endpoints ────────
  let serverCachedBank: Record<string, Record<string, StoredMCQ[]>> | null = null;
  const BANK_FILE_PATH = path.resolve('src/data/grade9FbiseBank.json');

  function normalizeChapterString(str: string): string {
    if (!str) return '';
    return str
      .replace(/^(ch\w*|chapter|unit)\s*\d+\s*[:\.\-]\s*/i, '') // strip "Ch 1: ", "Chapter 1 - "
      .replace(/^(\d+)\s*[:\.\-]\s*/i, '')                      // strip "1. ", "1 - "
      .replace(/[–—]/g, '-')                                    // normalize dashes
      .replace(/\s+/g, ' ')                                     // normalize spaces
      .trim()
      .toLowerCase();
  }

  function matchChapterInBank(availableKeys: string[], target: string): string | undefined {
    if (!target || !availableKeys || availableKeys.length === 0) return undefined;
    const clean = target.trim();
    if (!clean || clean === 'All' || clean.toLowerCase() === 'full syllabus' || clean.toLowerCase() === 'mixed chapters') {
      return undefined;
    }

    const exact = availableKeys.find((k) => k.toLowerCase() === clean.toLowerCase());
    if (exact) return exact;

    const normTarget = normalizeChapterString(clean);
    if (!normTarget) return undefined;

    const normMatch = availableKeys.find((k) => normalizeChapterString(k) === normTarget);
    if (normMatch) return normMatch;

    if (normTarget.length >= 4) {
      const subMatch = availableKeys.find((k) => {
        const normK = normalizeChapterString(k);
        return normK.includes(normTarget) || normTarget.includes(normK);
      });
      if (subMatch) return subMatch;
    }

    return undefined;
  }

  function getServerBankData(boardParam?: string, gradeParam?: string): Record<string, Record<string, StoredMCQ[]>> {
    const isIelts = isIELTSBoard(boardParam, gradeParam);
    if (isIelts) {
      return (ieltsBank as unknown as Record<string, Record<string, StoredMCQ[]>>) || {};
    }

    if (serverCachedBank && Object.keys(serverCachedBank).length > 0) {
      return serverCachedBank;
    }
    try {
      if (fs.existsSync(BANK_FILE_PATH)) {
        const raw = fs.readFileSync(BANK_FILE_PATH, 'utf-8');
        serverCachedBank = JSON.parse(raw);
        if (serverCachedBank && Object.keys(serverCachedBank).length > 0) {
          return serverCachedBank;
        }
      }
    } catch (err) {
      console.warn('[Server MCQ Bank] Error loading bank file from disk, using fallback modular bank:', err);
    }
    serverCachedBank = (grade9FbiseBank as unknown as Record<string, Record<string, StoredMCQ[]>>) || {};
    return serverCachedBank;
  }

  // 1. Instant Retrieval from Stored MCQ Bank (0ms live API delay)
  app.post('/api/mcq-bank/fetch', async (req, res) => {
    try {
      const {
        subject = 'Physics',
        topic,
        chapter,
        grade = '9',
        board = 'fbise',
        count = 10,
        difficulty = 'medium',
        excludeIds = [],
        excludeTexts = [],
        selectedChapters = [],
        examMode = 'single_chapter',
      } = req.body || {};

      const isIelts = isIELTSBoard(board, grade) || String(board || '').toLowerCase().includes('ielts') || Object.keys(ieltsBank).includes(subject);
      const targetCount = Math.max(1, Number(count) || 10);
      const normSubject = isIelts ? subject : (normalizeFBISEGrade9Subject(subject) || subject);
      const bank = getServerBankData(isIelts ? 'ielts' : board, isIelts ? 'ielts' : grade);
      const subjectBank = bank[normSubject] || bank[subject] || {};
      const availableChapters = Object.keys(subjectBank);

      const targetChapName = (chapter || topic || '').trim();
      const hasSpecificChapter = Boolean(
        targetChapName &&
        targetChapName !== 'All' &&
        targetChapName.toLowerCase() !== 'full syllabus' &&
        targetChapName.toLowerCase() !== 'mixed chapters'
      );

      const excludeSet = new Set<string>(
        (excludeTexts as string[]).map((t) => t.trim().toLowerCase()).concat(
          (excludeIds as string[]).map((id) => id.toLowerCase())
        )
      );

      let pool: StoredMCQ[] = [];
      const isFullSyllabus =
        examMode === 'full_syllabus' ||
        targetChapName.toLowerCase() === 'full syllabus' ||
        targetChapName.toLowerCase() === 'mixed chapters' ||
        targetChapName.toLowerCase() === 'all' ||
        (!hasSpecificChapter && (!Array.isArray(selectedChapters) || selectedChapters.length === 0));

      if (isFullSyllabus) {
        if (availableChapters.length > 0) {
          const perChap = Math.max(1, Math.ceil(targetCount / availableChapters.length));
          for (const chName of availableChapters) {
            const chQuestions = (subjectBank[chName] || []).filter(
              (q) => !excludeSet.has(q.question.trim().toLowerCase()) && !excludeSet.has(q.id.toLowerCase())
            );
            pool.push(...[...chQuestions].sort(() => 0.5 - Math.random()).slice(0, perChap));
          }
        }
      } else if (examMode === 'multi_chapter' && Array.isArray(selectedChapters) && selectedChapters.length > 0) {
        const perChap = Math.max(1, Math.ceil(targetCount / selectedChapters.length));
        for (const chName of selectedChapters) {
          const matchedKey = matchChapterInBank(availableChapters, chName) || chName;
          const chQuestions = (subjectBank[matchedKey] || []).filter(
            (q) => !excludeSet.has(q.question.trim().toLowerCase()) && !excludeSet.has(q.id.toLowerCase())
          );
          pool.push(...[...chQuestions].sort(() => 0.5 - Math.random()).slice(0, perChap));
        }
      } else {
        // Single chapter matching strictly
        const matchedKey = matchChapterInBank(availableChapters, targetChapName);
        if (matchedKey && subjectBank[matchedKey]) {
          pool = subjectBank[matchedKey].filter(
            (q) => !excludeSet.has(q.question.trim().toLowerCase()) && !excludeSet.has(q.id.toLowerCase())
          );
        } else if (availableChapters.length === 1 && subjectBank[availableChapters[0]]) {
          // If subject has single master chapter key (e.g. Grammar or Comprehension)
          pool = subjectBank[availableChapters[0]].filter(
            (q) => !excludeSet.has(q.question.trim().toLowerCase()) && !excludeSet.has(q.id.toLowerCase())
          );
        }
      }

      // Shuffle pool
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, targetCount);

      // If bank has fewer than requested, top up safely with verified curriculum questions
      if (selected.length < targetCount) {
        const needed = targetCount - selected.length;
        const currentExcludes = selected.map((q) => q.question);
        const fallbackQuestions = generateCurriculumFallbackMCQs(
          normSubject,
          chapter || topic || 'Core Curriculum',
          needed * 2,
          difficulty,
          isIelts ? 'IELTS' : grade,
          isIelts ? 'ielts' : board,
          currentExcludes
        );

        for (const fq of fallbackQuestions) {
          if (selected.length >= targetCount) break;
          selected.push({
            id: fq.id || `bank_${Date.now()}_${selected.length + 1}`,
            board: isIelts ? 'ielts' : board,
            grade: isIelts ? 'ielts' : grade,
            subject: normSubject,
            chapter: chapter || topic || 'Core Curriculum',
            chapterNumber: 1,
            topic: chapter || topic || 'Core Curriculum',
            question: fq.question,
            options: fq.options,
            correctAnswer: fq.correctAnswer,
            explanation: fq.explanation,
            difficulty: fq.difficulty || 'medium',
            verified: true,
            source: 'curriculum-bank',
            createdAt: new Date().toISOString(),
          });
        }
      }

      return res.json({
        success: true,
        source: 'stored-bank',
        questions: selected,
        totalAvailableInBank: pool.length,
        isPartial: selected.length < targetCount,
      });
    } catch (err: any) {
      console.error('[MCQ Bank Fetch Error]:', err);
      const fallback = generateCurriculumFallbackMCQs(
        req.body?.subject || 'Physics',
        req.body?.topic || 'Core Curriculum',
        Number(req.body?.count) || 10,
        req.body?.difficulty || 'medium',
        req.body?.grade || '9',
        req.body?.board || 'fbise'
      );
      return res.json({
        success: true,
        source: 'curriculum-bank-error-fallback',
        questions: fallback,
        totalAvailableInBank: fallback.length,
        isPartial: false,
      });
    }
  });

  // 2. Question Bank Stats and Coverage Breakdown
  app.get('/api/mcq-bank/stats', (req, res) => {
    try {
      const requestedBoard = String(req.query.board || 'fbise').toLowerCase();
      const isIelts = requestedBoard === 'ielts' || requestedBoard.includes('ielts');
      const bank = getServerBankData(isIelts ? 'ielts' : 'fbise');
      const stats: Record<string, { totalQuestions: number; chapters: Record<string, number> }> = {};
      let grandTotal = 0;

      const targetCurriculum = isIelts ? IELTS_CURRICULUM : FBISE_GRADE_9_CURRICULUM;

      for (const [subjName, subCurriculum] of Object.entries(targetCurriculum)) {
        const subjBank = bank[subjName] || {};
        let subjTotal = 0;
        const chapStats: Record<string, number> = {};

        for (const chap of subCurriculum.chapters) {
          const count = (subjBank[chap.name] || []).length;
          chapStats[chap.name] = count;
          subjTotal += count;
        }

        // If no chapter breakdown matched standard chapters, count any other chapters in subjBank
        if (subjTotal === 0 && Object.keys(subjBank).length > 0) {
          for (const [chKey, qList] of Object.entries(subjBank)) {
            chapStats[chKey] = qList.length;
            subjTotal += qList.length;
          }
        }

        stats[subjName] = {
          totalQuestions: subjTotal,
          chapters: chapStats,
        };
        grandTotal += subjTotal;
      }

      return res.json({
        success: true,
        board: isIelts ? 'ielts' : 'fbise',
        grade: isIelts ? 'IELTS' : '9',
        grandTotal,
        subjects: stats,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to compute bank stats' });
    }
  });

  // 3. Live Question Bank Full Retrieval (Admin & Direct Storage Access)
  app.get('/api/mcq-bank/all', (req, res) => {
    try {
      const requestedBoard = String(req.query.board || '').toLowerCase();
      const isIelts = requestedBoard === 'ielts' || requestedBoard.includes('ielts');

      if (isIelts) {
        return res.json({
          success: true,
          board: 'ielts',
          grade: 'IELTS',
          data: ieltsBank,
        });
      }

      // Force fresh read from disk file for FBISE Grade 9
      const BANK_FILE_PATH = path.resolve('src/data/grade9FbiseBank.json');
      if (fs.existsSync(BANK_FILE_PATH)) {
        const raw = fs.readFileSync(BANK_FILE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        serverCachedBank = data;
        return res.json({
          success: true,
          board: 'fbise',
          grade: '9',
          data,
        });
      }
      return res.json({ success: true, board: 'fbise', grade: '9', data: grade9FbiseBank });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to load question bank data from storage' });
    }
  });

  // ── Live Sessions Management (Teacher & System Live Notifications) ──
  app.post('/api/live-sessions/start', async (req, res) => {
    try {
      const {
        id,
        slot_id,
        offering_id,
        subject_id,
        grade_id,
        class_link,
        teacher_id,
        teacher_name,
        subject_name,
      } = req.body;

      if (!class_link || !class_link.trim()) {
        return res.status(400).json({ error: 'class_link is required' });
      }

      const sessionId = id || (slot_id ? `${slot_id}_${new Date().toISOString().slice(0, 10)}` : `live_${Date.now()}`);
      const row = {
        id: sessionId,
        subject_id: String(subject_id || 'general'),
        grade_id: String(grade_id || '9'),
        class_link: class_link.trim(),
        status: 'live',
        started_at: new Date().toISOString(),
        ended_at: null,
        teacher_id: teacher_id || null,
        teacher_name: teacher_name || 'Teacher',
        subject_name: subject_name || 'Class',
        slot_id: slot_id || null,
        offering_id: offering_id || null,
        updated_at: new Date().toISOString(),
      };

      const userToken = req.headers.authorization?.replace('Bearer ', '');
      const requestSupabase = userToken ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${userToken}` } }
      }) : supabaseServer;

      const { data, error } = await requestSupabase
        .from('live_sessions')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.warn('[server /api/live-sessions/start warning]:', error.message);
        // Still trigger push alerts in background for subscribers
        sendLiveSessionPushAlerts(row, supabaseServer).catch((pErr) => {
          console.warn('[server push alerts warning]:', pErr);
        });
        return res.status(200).json({ success: true, session: row, warning: error.message });
      }

      // Trigger Web Push alerts for students & admins asynchronously in background
      sendLiveSessionPushAlerts(data || row, supabaseServer).catch((pErr) => {
        console.warn('[server push alerts warning]:', pErr);
      });

      return res.json({ success: true, session: data });
    } catch (err: any) {
      console.error('[server /api/live-sessions/start error]:', err);
      return res.status(500).json({ error: err?.message || 'Failed to start live session' });
    }
  });

  // ── Web Push Subscriptions & Alerts Endpoints ────────
  app.get('/api/push/vapid-public-key', (_req, res) => {
    const publicKey =
      process.env.VAPID_PUBLIC_KEY ||
      process.env.VITE_VAPID_PUBLIC_KEY ||
      'BAt10hJjc1FsLa_xXoJNWEYKvR1LALcHu2JLJWPbrOksAQ4rw0M-78JS5xNvr6wkDajphLwdbs-yMBvyrHCE484';
    return res.json({ publicKey });
  });

  app.post('/api/push/subscribe', async (req, res) => {
    try {
      const { user_id, role, endpoint, p256dh, auth, subscription_json, grade, board } = req.body;
      if (!endpoint || !user_id) {
        return res.status(400).json({ error: 'user_id and endpoint are required' });
      }

      await savePushSubscription(
        {
          user_id,
          role: role || 'student',
          endpoint,
          p256dh: p256dh || subscription_json?.keys?.p256dh || '',
          auth: auth || subscription_json?.keys?.auth || '',
          subscription_json: subscription_json || { endpoint, keys: { p256dh, auth } },
          grade,
          board,
        },
        supabaseServer
      );

      return res.json({ success: true, message: 'Push subscription registered successfully' });
    } catch (err: any) {
      console.error('[server /api/push/subscribe error]:', err);
      return res.status(500).json({ error: err.message || 'Failed to save push subscription' });
    }
  });

  app.post('/api/push/unsubscribe', async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ error: 'endpoint is required' });
      }
      await removePushSubscription(endpoint, supabaseServer);
      return res.json({ success: true, message: 'Push subscription removed successfully' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to remove push subscription' });
    }
  });

  app.get('/api/push/status', (_req, res) => {
    const subs = getAllPushSubscriptions();
    return res.json({
      success: true,
      totalSubscriptions: subs.length,
      byRole: {
        student: subs.filter((s) => s.role === 'student').length,
        teacher: subs.filter((s) => s.role === 'teacher').length,
        admin: subs.filter((s) => s.role === 'admin').length,
      },
    });
  });

  app.post('/api/live-sessions/end', async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Session id is required' });
      }

      const userToken = req.headers.authorization?.replace('Bearer ', '');
      const requestSupabase = userToken ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${userToken}` } }
      }) : supabaseServer;

      const { error } = await requestSupabase
        .from('live_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.warn('[server /api/live-sessions/end warning]:', error.message);
      }

      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to end live session' });
    }
  });

  app.get('/api/live-sessions/active', async (_req, res) => {
    try {
      const { data, error } = await supabaseServer
        .from('live_sessions')
        .select('*')
        .eq('status', 'live');

      if (error) {
        return res.status(500).json({ error: error.message });
      }
      return res.json({ success: true, sessions: data || [] });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to fetch active live sessions' });
    }
  });

  // ── Tests Upload (Express Dev Handler) ──────────────
  app.post('/api/tests/upload', upload.single('file'), async (req, res) => {
    try {
      const file = req.file;

      const {
        title,
        instructions,
        board = 'fbise',
        subject,
        grade,
        stream = 'all',
        total_marks = '100',
        due_date,
        teacher_id,
        teacher_name,
        uploaded_by,
        uploaded_by_name,
      } = req.body;

      if (!file || !title || !subject || !grade || !due_date || !teacher_name || !teacher_name.trim()) {
        return res.status(400).json({ error: 'Missing required parameters (file, title, subject, grade, due_date, teacher_name)' });
      }

      const testId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const mimeType = file.mimetype || (file.originalname.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

      fileStorage.set(testId, {
        buffer: file.buffer,
        mimeType,
        filename: file.originalname || 'test_paper.pdf',
      });

      const nowIso = new Date().toISOString();

      const testRecord = {
        id: testId,
        title: title.trim(),
        instructions: instructions ? instructions.trim() : null,
        board: board || 'fbise',
        board_id: board || 'fbise',
        subject,
        grade,
        stream,
        teacher_id: teacher_id || null,
        teacher_name: teacher_name.trim(),
        uploaded_by: uploaded_by || null,
        uploaded_by_name: uploaded_by_name || null,
        file_url: `/api/tests/view/${testId}`,
        file_path: `tests/${grade}/${stream}/${subject}/${testId}_${file.originalname}`,
        file_type: mimeType.includes('image') ? 'image' : 'pdf',
        file_size_bytes: file.size,
        total_marks: parseInt(total_marks, 10) || 100,
        due_date,
        published_at: nowIso,
        created_at: nowIso,
      };

      try {
        const { data: dbData, error: dbErr } = await (supabaseServer as any)
          .from('tests')
          .insert(testRecord)
          .select()
          .single();

        if (dbErr) {
          console.warn('[server.ts] Supabase test insert note (falling back to memory):', dbErr.message);
        }

        return res.json({ success: true, test: dbData || testRecord });
      } catch (insertErr: any) {
        console.warn('[server.ts] Test insert memory fallback:', insertErr?.message);
        return res.json({ success: true, test: testRecord });
      }
    } catch (err: any) {
      console.error('[Dev Server Test Upload Error]', err);
      return res.status(500).json({ error: err.message || 'Test upload failed' });
    }
  });

  // ── Admin-Only Create Test From Question Bank Endpoint ──
  app.post(['/api/admin/tests/create-test', '/api/tests/create-test'], async (req, res) => {
    const startTime = Date.now();
    console.log(`[CreateTest API] 📥 Received create-test request at ${new Date().toISOString()} (Content-Length: ${req.headers['content-length'] || 'unknown'} bytes)`);

    try {
      // 1. Backend Security Check: Verify caller is Admin
      const authHeader = (req.headers.authorization || req.headers['authorization']) as string | undefined;
      if (!authHeader) {
        console.warn('[CreateTest API] ❌ Missing Authorization header');
        return res.status(401).json({ error: 'Unauthorized: Authentication token is missing.' });
      }

      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      let user: any = null;

      // Authenticate via Supabase server client
      const { data: authData, error: authErr } = await supabaseServer.auth.getUser(token);
      if (!authErr && authData?.user) {
        user = authData.user;
      } else {
        // Fallback: Authenticate via request-scoped client
        const requestSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: fallbackAuth, error: fallbackErr } = await requestSupabase.auth.getUser();
        if (fallbackErr || !fallbackAuth?.user) {
          console.warn('[CreateTest API] ❌ Invalid auth token:', authErr?.message || fallbackErr?.message);
          return res.status(401).json({ error: 'Unauthorized: Invalid or expired authentication session.' });
        }
        user = fallbackAuth.user;
      }

      console.log(`[CreateTest API] 👤 Authenticated user: ${user.email} (ID: ${user.id})`);

      // Query database to confirm the user's role is 'admin' (with metadata/email fallbacks)
      const { data: profile, error: profErr } = await (supabaseServer as any)
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const userRole = (profile?.role || user.user_metadata?.role || user.app_metadata?.role || '').toLowerCase();
      const isAdminUser =
        userRole === 'admin' ||
        (user.email && (user.email.toLowerCase().includes('admin') || user.email === 'shsvirtualadmin@gmail.com'));

      if (profErr) {
        console.warn('[CreateTest API] ⚠️ Note on profiles query:', profErr.message);
      }

      if (!isAdminUser) {
        console.warn(`[CreateTest API] ⛔ Access denied. User role: "${userRole}", email: "${user.email}"`);
        return res.status(403).json({
          error: 'Forbidden: You do not have permission to create tests. Admin role required.',
        });
      }

      console.log(`[CreateTest API] ✅ Admin authorization confirmed for ${user.email}`);

      // 2. Extract Test Creation Payload
      const {
        title,
        instructions,
        board = 'fbise',
        subject,
        grade,
        stream = 'Science',
        total_marks = 50,
        due_date,
        teacher_id,
        teacher_name = 'Admin / Department Head',
        uploaded_by,
        uploaded_by_name,
        combination,
        pdfBase64,
        filename,
      } = req.body;

      if (!title || !subject || !grade || !due_date) {
        console.warn('[CreateTest API] ❌ Missing required fields:', { title: !!title, subject: !!subject, grade: !!grade, due_date: !!due_date });
        return res.status(400).json({
          error: 'Missing required parameters: title, subject, grade, and due_date are required.',
        });
      }

      const testId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const safeFilename = filename || `SHS_Test_${subject}_Grade${grade}.pdf`;

      // 3. Store PDF Buffer in memory / storage
      let pdfBuffer: Buffer;
      if (pdfBase64 && typeof pdfBase64 === 'string') {
        const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
        pdfBuffer = Buffer.from(cleanBase64, 'base64');
        console.log(`[CreateTest API] 📄 Processed PDF Base64 string (${pdfBuffer.length} bytes / ${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
      } else {
        pdfBuffer = Buffer.from('%PDF-1.4 Mock Test Paper generated by Admin');
        console.log('[CreateTest API] 📄 Using placeholder PDF buffer');
      }

      fileStorage.set(testId, {
        buffer: pdfBuffer,
        mimeType: 'application/pdf',
        filename: safeFilename,
      });

      const nowIso = new Date().toISOString();

      const testRecord = {
        id: testId,
        title: title.trim(),
        instructions: instructions ? instructions.trim() : null,
        board: board || 'fbise',
        board_id: board || 'fbise',
        subject: subject.trim(),
        grade: String(grade),
        stream: stream || 'Science',
        teacher_id: teacher_id && String(teacher_id).trim() ? String(teacher_id).trim() : null,
        teacher_name: (teacher_name || 'Admin / Department Head').trim(),
        uploaded_by: uploaded_by || user.id,
        uploaded_by_name: uploaded_by_name || profile?.full_name || user.user_metadata?.full_name || 'Admin',
        file_url: `/api/tests/view/${testId}`,
        file_path: `tests/${grade}/${stream}/${subject}/${testId}_${safeFilename}`,
        file_type: 'pdf',
        file_size_bytes: pdfBuffer.length,
        total_marks: parseInt(String(total_marks), 10) || 50,
        due_date,
        published_at: nowIso,
        created_at: nowIso,
      };

      console.log(`[CreateTest API] 💾 Persisting test record: "${testRecord.title}" for Grade ${testRecord.grade} ${testRecord.subject}`);

      try {
        const { data: dbData, error: dbErr } = await (supabaseServer as any)
          .from('tests')
          .insert(testRecord)
          .select()
          .single();

        if (dbErr) {
          console.warn('[CreateTest API] ⚠️ Supabase test insert warning (using local fallback record):', dbErr.message);
        } else {
          console.log(`[CreateTest API] ✅ Database record inserted successfully in Supabase (id: ${testId})`);
        }

        const elapsed = Date.now() - startTime;
        console.log(`[CreateTest API] 🎉 Test Paper published successfully in ${elapsed}ms! Test ID: ${testId}`);

        return res.json({
          success: true,
          test: dbData || testRecord,
          viewUrl: `/api/tests/view/${testId}`,
          dlUrl: `/api/tests/dl/${testId}`,
        });
      } catch (insertErr: any) {
        console.warn('[CreateTest API] ⚠️ Test insert memory fallback:', insertErr?.message);
        return res.json({
          success: true,
          test: testRecord,
          viewUrl: `/api/tests/view/${testId}`,
          dlUrl: `/api/tests/dl/${testId}`,
        });
      }
    } catch (err: any) {
      console.error('[CreateTest API] 💥 Unhandled error in /api/admin/tests/create-test:', err);
      return res.status(500).json({ error: err.message || 'Internal server error while publishing test' });
    }
  });

  // ── Tests View ──────────────────────────────────────
  app.get('/api/tests/view/:testId', async (req, res) => {
    const { testId } = req.params;
    const stored = fileStorage.get(testId);
    if (stored) {
      res.setHeader('Content-Type', stored.mimeType);
      res.setHeader('Content-Length', stored.buffer.length);
      res.setHeader('Accept-Ranges', 'bytes');
      return res.send(stored.buffer);
    }

    // Check if test exists in DB and sample file exists
    const samplePdfPath = path.join(process.cwd(), 'real.pdf');
    if (fs.existsSync(samplePdfPath)) {
      const buf = fs.readFileSync(samplePdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', buf.length);
      res.setHeader('Accept-Ranges', 'bytes');
      return res.send(buf);
    }

    return res.status(404).send('Test file not found');
  });

  // ── Tests Download ──────────────────────────────────
  app.get('/api/tests/dl/:testId', (req, res) => {
    const { testId } = req.params;
    const stored = fileStorage.get(testId);
    if (stored) {
      res.setHeader('Content-Type', stored.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${stored.filename}"`);
      return res.send(stored.buffer);
    }

    const samplePdfPath = path.join(process.cwd(), 'real.pdf');
    if (fs.existsSync(samplePdfPath)) {
      const buf = fs.readFileSync(samplePdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="test_paper.pdf"');
      return res.send(buf);
    }

    return res.status(404).send('Test file not found');
  });

  // ── Tests Delete ────────────────────────────────────
  app.delete('/api/tests/del/:testId', async (req, res) => {
    const { testId } = req.params;
    fileStorage.delete(testId);
    try {
      await (supabaseServer as any).from('tests').delete().eq('id', testId);
    } catch (delErr) {
      console.warn('[server.ts] Supabase test delete warning:', delErr);
    }
    return res.json({ success: true });
  });

  // ── Submissions Upload ──────────────────────────────
  app.post('/api/submissions/upload', upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const { test_id, student_name, student_email, grade = '10', stream = 'all', subject = 'General' } = req.body;

      if (!file || !test_id) {
        return res.status(400).json({ error: 'Missing required parameters (file, test_id)' });
      }

      const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const mimeType = file.mimetype || (file.originalname.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

      fileStorage.set(submissionId, {
        buffer: file.buffer,
        mimeType,
        filename: file.originalname || 'submission.pdf',
      });

      const subRecord = {
        id: submissionId,
        test_id,
        student_id: '00000000-0000-0000-0000-000000000000',
        student_name: student_name || 'Student',
        student_email: student_email || null,
        file_url: `/api/submissions/view/${submissionId}`,
        file_path: `submissions/${grade}/${stream}/${subject}/${test_id}/${submissionId}_${file.originalname}`,
        file_type: mimeType.includes('image') ? 'image' : 'pdf',
        file_size_bytes: file.size,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
        marks_obtained: null,
        max_marks: null,
        teacher_feedback: null,
      };

      try {
        const { data: dbData, error: dbErr } = await (supabaseServer as any)
          .from('test_submissions')
          .insert(subRecord)
          .select()
          .single();

        if (dbErr) {
          console.warn('[server.ts] Supabase submission insert warning:', dbErr.message);
        }

        return res.json({ success: true, submission: dbData || subRecord });
      } catch (insertErr: any) {
        console.warn('[server.ts] Submission insert memory fallback:', insertErr?.message);
        return res.json({ success: true, submission: subRecord });
      }
    } catch (err: any) {
      console.error('[Dev Server Submission Upload Error]', err);
      return res.status(500).json({ error: err.message || 'Submission upload failed' });
    }
  });

  // ── Submissions View ────────────────────────────────
  app.get('/api/submissions/view/:submissionId', (req, res) => {
    const { submissionId } = req.params;
    const stored = fileStorage.get(submissionId);
    if (stored) {
      res.setHeader('Content-Type', stored.mimeType);
      res.setHeader('Content-Length', stored.buffer.length);
      res.setHeader('Accept-Ranges', 'bytes');
      return res.send(stored.buffer);
    }

    const samplePdfPath = path.join(process.cwd(), 'real.pdf');
    if (fs.existsSync(samplePdfPath)) {
      const buf = fs.readFileSync(samplePdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', buf.length);
      res.setHeader('Accept-Ranges', 'bytes');
      return res.send(buf);
    }

    return res.status(404).send('Submission file not found');
  });

  // ── Submissions Download ────────────────────────────
  app.get('/api/submissions/dl/:submissionId', (req, res) => {
    const { submissionId } = req.params;
    const stored = fileStorage.get(submissionId);
    if (stored) {
      res.setHeader('Content-Type', stored.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${stored.filename}"`);
      return res.send(stored.buffer);
    }

    const samplePdfPath = path.join(process.cwd(), 'real.pdf');
    if (fs.existsSync(samplePdfPath)) {
      const buf = fs.readFileSync(samplePdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="submission.pdf"');
      return res.send(buf);
    }

    return res.status(404).send('Submission file not found');
  });

  // ── Submissions Grade ───────────────────────────────
  app.post('/api/submissions/grade', express.json(), async (req, res) => {
    const { submission_id, marks_obtained, max_marks, teacher_feedback } = req.body;
    if (!submission_id) {
      return res.status(400).json({ error: 'Missing submission_id' });
    }
    try {
      const { data, error } = await (supabaseServer as any)
        .from('test_submissions')
        .update({
          marks_obtained: marks_obtained !== undefined ? Number(marks_obtained) : null,
          max_marks: max_marks !== undefined ? Number(max_marks) : null,
          teacher_feedback: teacher_feedback || null,
          status: 'graded',
          graded_at: new Date().toISOString(),
        })
        .eq('id', submission_id)
        .select()
        .single();

      if (error) {
        console.warn('[server.ts] Grade update warning:', error);
      }

      return res.json({
        success: true,
        submission: data || {
          id: submission_id,
          status: 'graded',
          marks_obtained: marks_obtained !== undefined ? Number(marks_obtained) : null,
          max_marks: max_marks !== undefined ? Number(max_marks) : null,
          teacher_feedback: teacher_feedback || null,
          graded_at: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to grade submission' });
    }
  });

  // ── Notes Upload ────────────────────────────────────
  app.post('/api/notes/upload', upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const { offering_id, chapter_name, title, file_type = 'pdf' } = req.body;

      if (!file || !offering_id || !chapter_name || !title) {
        return res.status(400).json({ error: 'Missing required upload parameters' });
      }

      const noteId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      let mimeType = file.mimetype;
      if (!mimeType) {
        if (file_type === 'pdf') mimeType = 'application/pdf';
        else if (file_type === 'image') mimeType = 'image/jpeg';
        else if (file_type === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (file_type === 'doc') mimeType = 'application/msword';
        else if (file_type === 'pptx') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        else if (file_type === 'ppt') mimeType = 'application/vnd.ms-powerpoint';
        else if (file_type === 'xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        else if (file_type === 'xls') mimeType = 'application/vnd.ms-excel';
        else if (file_type === 'txt') mimeType = 'text/plain';
        else mimeType = 'application/octet-stream';
      }

      fileStorage.set(noteId, {
        buffer: file.buffer,
        mimeType,
        filename: file.originalname || 'notes.pdf',
      });

      const nowIso = new Date().toISOString();
      const noteRecord = {
        id: noteId,
        offering_id,
        chapter_name,
        title,
        file_path: `teacher_notes/${noteId}_${file.originalname}`,
        file_url: `/api/notes/view/${noteId}`,
        file_type: file_type || 'pdf',
        file_size_bytes: file.size,
        created_at: nowIso,
      };

      try {
        const { data: dbData, error: dbErr } = await (supabaseServer as any)
          .from('notes')
          .insert(noteRecord)
          .select('*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*))')
          .single();

        if (dbErr) {
          console.warn('[server.ts] Note insert warning (fallback to memory):', dbErr.message);
        }

        return res.json(dbData || noteRecord);
      } catch (dbErr: any) {
        console.warn('[server.ts] Note DB insert fallback:', dbErr?.message);
        return res.json(noteRecord);
      }
    } catch (err: any) {
      console.error('[server.ts Note Upload Error]:', err);
      return res.status(500).json({ error: err.message || 'Note upload failed' });
    }
  });

  // ── Notes View ──────────────────────────────────────
  app.get('/api/notes/view/:noteId', (req, res) => {
    const { noteId } = req.params;
    const stored = fileStorage.get(noteId);
    if (stored) {
      res.setHeader('Content-Type', stored.mimeType);
      res.setHeader('Content-Length', stored.buffer.length);
      res.setHeader('Accept-Ranges', 'bytes');
      return res.send(stored.buffer);
    }

    const samplePdfPath = path.join(process.cwd(), 'real.pdf');
    if (fs.existsSync(samplePdfPath)) {
      const buf = fs.readFileSync(samplePdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', buf.length);
      res.setHeader('Accept-Ranges', 'bytes');
      return res.send(buf);
    }

    return res.status(404).send('Note file not found');
  });

  // ── Notes Download ──────────────────────────────────
  app.get('/api/notes/dl/:noteId', (req, res) => {
    const { noteId } = req.params;
    const stored = fileStorage.get(noteId);
    if (stored) {
      res.setHeader('Content-Type', stored.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${stored.filename}"`);
      return res.send(stored.buffer);
    }

    const samplePdfPath = path.join(process.cwd(), 'real.pdf');
    if (fs.existsSync(samplePdfPath)) {
      const buf = fs.readFileSync(samplePdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="notes.pdf"');
      return res.send(buf);
    }

    return res.status(404).send('Note file not found');
  });

  // ── Notes Delete ────────────────────────────────────
  app.delete('/api/notes/del/:noteId', async (req, res) => {
    const { noteId } = req.params;
    fileStorage.delete(noteId);
    try {
      await (supabaseServer as any).from('notes').delete().eq('id', noteId);
    } catch (delErr) {
      console.warn('[server.ts] Note delete warning:', delErr);
    }
    return res.json({ success: true });
  });

  // ── Helper to verify Teacher or Admin Role ─────────
  const verifyTeacherOrAdminRole = async (req: express.Request): Promise<{ authorized: boolean; error?: string; status?: number; user?: any }> => {
    try {
      const authHeader = (req.headers.authorization || req.headers['authorization']) as string | undefined;
      if (!authHeader) {
        return { authorized: false, status: 401, error: 'Unauthorized: Authentication token is missing.' };
      }

      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      let user: any = null;

      const { data: authData, error: authErr } = await supabaseServer.auth.getUser(token);
      if (!authErr && authData?.user) {
        user = authData.user;
      } else {
        const requestSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: fallbackAuth, error: fallbackErr } = await requestSupabase.auth.getUser();
        if (fallbackErr || !fallbackAuth?.user) {
          return { authorized: false, status: 401, error: 'Unauthorized: Invalid or expired session.' };
        }
        user = fallbackAuth.user;
      }

      const { data: profile } = await (supabaseServer as any)
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const userRole = (profile?.role || user.user_metadata?.role || user.app_metadata?.role || '').toLowerCase();
      const isStaff =
        userRole === 'admin' ||
        userRole === 'teacher' ||
        userRole === 'faculty' ||
        (user.email && (user.email.toLowerCase().includes('admin') || user.email.toLowerCase().includes('teacher') || user.email === 'shsvirtualadmin@gmail.com'));

      if (!isStaff) {
        return { authorized: false, status: 403, error: 'Forbidden: Official Answer Key is restricted to Teachers and Administrators only.' };
      }

      return { authorized: true, user };
    } catch (err: any) {
      return { authorized: false, status: 500, error: err.message || 'Authentication error' };
    }
  };

  // ── Test Answer Key Upload ──────────────────────────
  app.post('/api/tests/answer-key/upload/:testId', upload.single('file'), async (req, res) => {
    try {
      const authCheck = await verifyTeacherOrAdminRole(req);
      if (!authCheck.authorized) {
        return res.status(authCheck.status || 403).json({ error: authCheck.error });
      }

      const { testId } = req.params;
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'Missing file payload' });
      }

      const akKey = `ak_${testId}`;
      fileStorage.set(akKey, {
        buffer: file.buffer,
        mimeType: 'application/pdf',
        filename: file.originalname || 'answer_key.pdf',
      });

      return res.json({ success: true, message: 'Answer key uploaded successfully' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Answer key upload failed' });
    }
  });

  // ── Test Answer Key View ────────────────────────────
  app.get('/api/tests/answer-key/view/:testId', async (req, res) => {
    const authCheck = await verifyTeacherOrAdminRole(req);
    if (!authCheck.authorized) {
      return res.status(authCheck.status || 403).json({ error: authCheck.error });
    }

    const { testId } = req.params;
    const stored = fileStorage.get(`ak_${testId}`);
    if (stored) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', stored.buffer.length);
      res.setHeader('Accept-Ranges', 'bytes');
      return res.send(stored.buffer);
    }

    return res.status(404).send('Answer key not found');
  });

  // ── Test Answer Key Download ────────────────────────
  app.get('/api/tests/answer-key/dl/:testId', async (req, res) => {
    const authCheck = await verifyTeacherOrAdminRole(req);
    if (!authCheck.authorized) {
      return res.status(authCheck.status || 403).json({ error: authCheck.error });
    }

    const { testId } = req.params;
    const stored = fileStorage.get(`ak_${testId}`);
    if (stored) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${stored.filename}"`);
      return res.send(stored.buffer);
    }

    return res.status(404).send('Answer key not found');
  });

  // ── Chat Voice Messages Upload ────────────────────
  app.post('/api/chat/voice/upload', upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const threadId = req.body.thread_id || 'general';

      if (!file) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      const audioId = `voice_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const mimeType = file.mimetype || 'audio/webm';
      const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      const filePath = `${threadId}/${audioId}.${extension}`;

      // Save to in-memory store for fallback previewing
      fileStorage.set(audioId, {
        buffer: file.buffer,
        mimeType,
        filename: file.originalname || `${audioId}.${extension}`,
      });

      // Try uploading to Supabase Storage 'voice-messages' bucket
      try {
        const { data: uploadData, error: uploadErr } = await supabaseServer.storage
          .from('voice-messages')
          .upload(filePath, file.buffer, {
            contentType: mimeType,
            cacheControl: '31536000',
            upsert: false,
          });

        if (!uploadErr && uploadData) {
          const { data: pubData } = supabaseServer.storage
            .from('voice-messages')
            .getPublicUrl(filePath);

          if (pubData?.publicUrl) {
            return res.json({
              success: true,
              audio_url: pubData.publicUrl,
              audio_id: audioId,
            });
          }
        }
      } catch (storageErr) {
        console.warn('[server /api/chat/voice/upload] Supabase storage upload warning:', storageErr);
      }

      // Fallback local view URL
      return res.json({
        success: true,
        audio_url: `/api/chat/voice/view/${audioId}`,
        audio_id: audioId,
      });
    } catch (err: any) {
      console.error('[server /api/chat/voice/upload] Error:', err);
      return res.status(500).json({ error: err.message || 'Internal server error uploading audio' });
    }
  });

  app.get('/api/chat/voice/view/:audioId', (req, res) => {
    const { audioId } = req.params;
    const stored = fileStorage.get(audioId);
    if (!stored) {
      return res.status(404).send('Voice message audio not found');
    }

    res.setHeader('Content-Type', stored.mimeType || 'audio/webm');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(stored.buffer);
  });

  // ── Chat Attachments Upload & Download ────────────────────
  app.post('/api/chat/upload', upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const conversationId = req.body.conversation_id || req.body.thread_id;
      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }
      if (!conversationId) {
        return res.status(400).json({ error: 'Missing conversation_id parameter' });
      }

      // 15 MB limit
      const MAX_SIZE = 15 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        return res.status(413).json({ error: `File size exceeds 15 MB limit.` });
      }

      // Authentication (from header or token)
      let userId = 'anonymous';
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const payload = JSON.parse(Buffer.from(authHeader.slice(7).split('.')[1], 'base64').toString());
          if (payload?.sub) userId = payload.sub;
        } catch {}
      }

      const cleanFilename = (file.originalname || `attachment_${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '_');
      const timestamp = Date.now();
      const objectKey = `${conversationId}/${userId}/${timestamp}_${cleanFilename}`;

      fileStorage.set(objectKey, {
        buffer: file.buffer,
        mimeType: file.mimetype,
        filename: file.originalname || cleanFilename,
        size: file.size,
      });

      return res.json({
        success: true,
        key: objectKey,
        filename: file.originalname || cleanFilename,
        size: file.size,
        mime_type: file.mimetype,
      });
    } catch (err: any) {
      console.error('[server /api/chat/upload] Error:', err);
      return res.status(500).json({ error: err.message || 'Internal error uploading attachment' });
    }
  });

  app.post('/api/chat/presence/offline', express.json(), express.text({ type: '*/*' }), async (req, res) => {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {}
      }
      const userId = body?.userId;
      if (userId && typeof userId === 'string') {
        await pgPool.query('UPDATE public.profiles SET is_online = false, last_seen = NOW() WHERE id = $1', [userId]);
      }
      return res.json({ success: true });
    } catch (err) {
      console.warn('[server /api/chat/presence/offline] error:', err);
      return res.status(200).json({ success: false });
    }
  });

  app.get('/api/chat/attachment/{*key}', async (req, res) => {
    try {
      let key = (req.params as any)?.key || (req.params as any)[0] || '';
      if (!key) {
        const prefix = '/api/chat/attachment/';
        if (req.url.startsWith(prefix)) {
          key = req.url.slice(prefix.length).split('?')[0];
        }
      }
      key = decodeURIComponent(key);

      // Authenticate
      let token = '';
      if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.slice(7);
      } else if (req.query.token) {
        token = String(req.query.token);
      }

      let userId = '';
      if (token) {
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          userId = payload?.sub || '';
        } catch {}
      }

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
      }

      // Check authorization (sender or recipient)
      const keyParts = key.split('/');
      const senderIdFromKey = keyParts[1];
      let authorized = Boolean(senderIdFromKey && senderIdFromKey === userId);

      if (!authorized) {
        const { data: msg } = await supabaseServer
          .from('chat_messages')
          .select('id, sender_id, thread_id, attachment_key')
          .eq('attachment_key', key)
          .maybeSingle();

        if (msg) {
          if (msg.sender_id === userId) {
            authorized = true;
          } else if (msg.thread_id) {
            const { data: thread } = await supabaseServer
              .from('chat_threads')
              .select('id, participant_one_id, participant_two_id')
              .eq('id', msg.thread_id)
              .maybeSingle();
            if (thread && (thread.participant_one_id === userId || thread.participant_two_id === userId)) {
              authorized = true;
            }
          }
        }
      }

      if (!authorized) {
        // Check admin
        const { data: profile } = await supabaseServer
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();
        if (profile && (profile.role === 'admin' || profile.role === 'super_admin')) {
          authorized = true;
        }
      }

      if (!authorized) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to access this attachment' });
      }

      const stored = fileStorage.get(key);
      if (!stored) {
        return res.status(404).send('Attachment not found');
      }

      const forceDownload = req.query.download === '1';
      const isImage = (stored.mimeType || '').startsWith('image/');
      const disposition = forceDownload || !isImage ? 'attachment' : 'inline';

      res.setHeader('Content-Type', stored.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(stored.filename || 'attachment')}"`);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      return res.send(stored.buffer);
    } catch (err: any) {
      console.error('[server /api/chat/attachment] Error:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // ── Explicit Service Worker Handler ─────────────────
  app.get('/sw.js', (_req, res) => {
    const swPath = path.resolve('public/sw.js');
    if (fs.existsSync(swPath)) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Service-Worker-Allowed', '/');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.sendFile(swPath);
    }
    return res.status(404).send('Service worker not found');
  });

  // ── Background Realtime Listener for Live Sessions Push ──
  try {
    supabaseServer
      .channel('server-global-live-push-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_sessions' },
        (payload: any) => {
          const newRow = payload.new;
          if (newRow && newRow.status === 'live' && newRow.class_link) {
            sendLiveSessionPushAlerts(newRow, supabaseServer).catch((err) => {
              console.warn('[ServerPush] Live realtime channel push error:', err);
            });
          }
        }
      )
      .subscribe((status: string) => {
        console.log(`[ServerPush] Realtime live_sessions channel status: ${status}`);
      });
  } catch (chanErr) {
    console.warn('[ServerPush] Warning creating realtime channel:', chanErr);
  }

  // ── Background Server-Side Cron: Teacher Reminders (Every 60s) ──
  setInterval(() => {
    checkAndSendTeacherPushReminders(supabaseServer).catch((cronErr) => {
      console.warn('[ServerPush] Background teacher reminder check error:', cronErr);
    });
  }, 60 * 1000);

  // Vite middleware for dev or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Scholario Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
