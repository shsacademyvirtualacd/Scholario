import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  PutBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import pg from 'pg';
const { Pool } = pg;

const DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
let realPool: pg.Pool | null = null;
if (DB_URL) {
  try {
    realPool = new Pool({
      connectionString: DB_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000,
    });
    realPool.on('error', (err) => {
      console.warn('[Postgres Pool Error]:', err.message);
    });
  } catch (poolInitErr) {
    console.warn('[Postgres Pool Init Error - mock active]:', poolInitErr);
  }
}

// Safe pgPool: queries realPool if available with graceful fallback if offline
const pgPool = {
  query: async (queryTextOrConfig: any, values?: any[]): Promise<any> => {
    if (realPool) {
      try {
        return await realPool.query(queryTextOrConfig, values);
      } catch (err: any) {
        console.warn('[Postgres Query Warning - fallback active]:', err?.message || err);
      }
    }
    return { rows: [], rowCount: 0 };
  },
  connect: async (): Promise<any> => {
    if (realPool) {
      try {
        return await realPool.connect();
      } catch (err: any) {
        console.warn('[Postgres Connect Warning - fallback active]:', err?.message || err);
      }
    }
    return { query: async () => ({ rows: [], rowCount: 0 }), release: () => {} };
  },
  on: (event: string, handler: (...args: any[]) => void) => {
    if (realPool) realPool.on(event, handler);
  },
};

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rxgrxjlyrfzojvirkhdc.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Z3J4amx5cmZ6b2p2aXJraGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTc3OTksImV4cCI6MjA5ODkzMzc5OX0.ggAT2JiBTg6VG5tbZNnjkig7F73JE0ZzPl_145yuow4';

const supabaseServer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
});

// In-memory buffer store for dev server local previewing
const fileStorage = new Map<string, { buffer: Buffer; mimeType: string; filename: string }>();
const proctoredMcqTests = new Map<string, any>();
const proctoredMcqSubmissions = new Map<string, any>();

// Short & Long Question Written Tests stores
const writtenTests = new Map<string, any>();
const writtenSubmissions = new Map<string, any>();

// Photos for exam submissions: key => { buffer: Buffer; mimeType: string; uploadedAt: number; testId: string; studentId: string; questionId: string; r2Key: string }
const examSubmissionPhotos = new Map<string, { buffer: Buffer; mimeType: string; uploadedAt: number; testId: string; studentId: string; questionId: string; r2Key: string }>();

// 24 Hours in Milliseconds for auto-expiry
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Cloudflare R2 Bucket for exam submissions (separate from chat attachments)
const R2_EXAM_BUCKET = process.env.R2_EXAM_SUBMISSIONS_BUCKET || 'scholario-exam-submissions';

function getR2Client(): S3Client | null {
  const r2AccountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  const r2AccessKey = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  if (!r2AccountId || !r2AccessKey || !r2SecretKey) return null;
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKey,
      secretAccessKey: r2SecretKey,
    },
  });
}

// Ensure R2 lifecycle rule (24-hour auto-deletion)
async function ensureR2ExamBucketLifecycle() {
  const s3 = getR2Client();
  if (!s3) return;
  try {
    await s3.send(
      new PutBucketLifecycleConfigurationCommand({
        Bucket: R2_EXAM_BUCKET,
        LifecycleConfiguration: {
          Rules: [
            {
              ID: 'AutoDeleteSubmissionsAfter24Hours',
              Status: 'Enabled',
              Filter: { Prefix: 'submissions/' },
              Expiration: { Days: 1 },
            },
          ],
        },
      })
    );
    console.log(`[R2] Auto-delete lifecycle rule configured for bucket "${R2_EXAM_BUCKET}" (24-hour expiry)`);
  } catch (err: any) {
    // Non-fatal if bucket doesn't exist yet or permissions are limited
    console.warn(`[R2] Bucket lifecycle configuration note for ${R2_EXAM_BUCKET}:`, err?.message || err);
  }
}

// Background cleanup interval for in-memory exam photos older than 24 hours
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of examSubmissionPhotos.entries()) {
    if (now - item.uploadedAt > TWENTY_FOUR_HOURS_MS) {
      examSubmissionPhotos.delete(key);
    }
  }
}, 10 * 60 * 1000);

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
  sendClassLinkPostedPush,
  sendPushToUsers,
  handleNewChatMessage,
  testTeacherPushReminder,
  type PushPayload,
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

  // ── Active Chat Thread In-Memory Tracking ───────────
  const activeChatThreads = new Map<string, { threadId: string; updatedAt: number }>();

  function isRecipientActiveInThread(userId: string, threadId: string): boolean {
    const record = activeChatThreads.get(userId);
    if (!record) return false;
    const isRecent = Date.now() - record.updatedAt < 25_000;
    return isRecent && record.threadId === threadId;
  }

  // ── Chat Active Thread Presence Heartbeat ────────────
  app.post('/api/chat/presence/active-thread', (req, res) => {
    const { userId, threadId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    if (threadId) {
      activeChatThreads.set(userId, { threadId, updatedAt: Date.now() });
    } else {
      activeChatThreads.delete(userId);
    }
    return res.json({ success: true });
  });

  // ── General Push Notification Dispatcher Route ──────
  // Accepts: { user_id | userId | user_ids | userIds | role, title, body, data, tag, icon, badge }
  app.post('/api/notifications/send', async (req, res) => {
    try {
      const { user_id, userId, user_ids, userIds, role, title, body, data, tag, icon, badge } = req.body;

      if (!title || !body) {
        return res.status(400).json({ error: 'title and body are required' });
      }

      let targetUserIds: string[] = [];

      if (Array.isArray(userIds)) {
        targetUserIds.push(...userIds);
      } else if (Array.isArray(user_ids)) {
        targetUserIds.push(...user_ids);
      } else if (user_id || userId) {
        targetUserIds.push(String(user_id || userId));
      }

      if (targetUserIds.length === 0 && role) {
        // 1. Query all users with this role from database
        const { data: profiles } = await (supabaseServer as any)
          .from('profiles')
          .select('id')
          .eq('role', role);
        if (profiles && profiles.length > 0) {
          targetUserIds = profiles.map((p: any) => p.id);
        }

        // 2. Also include any registered push subscriptions for this role
        const roleSubs = getAllPushSubscriptions().filter((s) => s.role === role);
        roleSubs.forEach((s) => {
          if (!targetUserIds.includes(s.user_id)) {
            targetUserIds.push(s.user_id);
          }
        });

        if (targetUserIds.length === 0) {
          return res.json({
            success: true,
            deliveredCount: 0,
            failedCount: 0,
            targetUserCount: 0,
            message: `No active registered devices or profiles found for role: ${role}`,
          });
        }
      }

      if (targetUserIds.length === 0) {
        return res.status(400).json({ error: 'At least one user_id, userIds array, or role must be specified' });
      }

      const payload: PushPayload = {
        title,
        body,
        icon: icon || '/logo.png',
        badge: badge || '/logo.png',
        tag: tag || `scholario-notify-${Date.now()}`,
        data: data || {},
      };

      const result = await sendPushToUsers(targetUserIds, payload, supabaseServer);

      return res.json({
        success: true,
        deliveredCount: result.deliveredCount,
        failedCount: result.failedCount,
        targetUserCount: targetUserIds.length,
        subscriptionsAttempted: result.attemptedCount,
      });
    } catch (err: any) {
      console.error('[server /api/notifications/send error]:', err);
      return res.status(500).json({ error: err.message || 'Failed to send notification' });
    }
  });

  // ── Cloudflare Worker / External Cron Trigger Endpoint ─
  app.all('/api/cron/teacher-reminders', async (_req, res) => {
    try {
      const remindersSent = await checkAndSendTeacherPushReminders(supabaseServer);
      return res.json({
        success: true,
        remindersSent,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[server /api/cron/teacher-reminders error]:', err);
      return res.status(500).json({ error: err.message || 'Failed to check teacher reminders' });
    }
  });

  // ── Explicit Test Endpoints for Push Notifications ──────
  // 1. Test Teacher Reminder (Simulate class starting in 3 minutes)
  app.post('/api/test/push/teacher-reminder', async (req, res) => {
    try {
      const { teacher_id, teacherId, subject, minsUntilStart } = req.body;
      const result = await testTeacherPushReminder(
        {
          teacherId: teacher_id || teacherId,
          subject: subject || 'Mathematics',
          minsUntilStart: minsUntilStart || 3,
        },
        supabaseServer
      );
      return res.json(result);
    } catch (err: any) {
      console.error('[server /api/test/push/teacher-reminder error]:', err);
      return res.status(500).json({ error: err.message || 'Failed to test teacher reminder push' });
    }
  });

  // 2. Test Class Link Push (Sends "New class link posted" to Admins and "{Subject} class link posted" to Students)
  app.post('/api/test/push/class-link', async (req, res) => {
    try {
      const { teacher_name, teacherName, subject_name, subjectName, class_name, className, link_url, linkUrl, slot_id, slotId } = req.body;
      const result = await sendClassLinkPostedPush(
        {
          teacherName: teacher_name || teacherName || 'Demo Teacher',
          subjectName: subject_name || subjectName || 'Physics',
          className: class_name || className || 'Grade 9',
          linkUrl: link_url || linkUrl || 'https://meet.google.com/test-live-session',
          slotId: slot_id || slotId || 'test_slot_demo',
        },
        supabaseServer
      );
      return res.json({
        success: true,
        adminsNotified: result.adminsSent,
        studentsNotified: result.studentsSent,
      });
    } catch (err: any) {
      console.error('[server /api/test/push/class-link error]:', err);
      return res.status(500).json({ error: err.message || 'Failed to test class link push' });
    }
  });

  // 3. Test Chat Message Push (Immediate lockscreen push preview to recipient)
  app.post('/api/test/push/chat-message', async (req, res) => {
    try {
      const { recipient_id, recipientId, sender_name, senderName, content, message_type } = req.body;
      const targetUser = recipient_id || recipientId;
      if (!targetUser) {
        return res.status(400).json({ error: 'recipient_id is required' });
      }

      let bodyText = content || 'Sent a test message';
      if (message_type === 'image') bodyText = '📷 Sent an image';
      else if (message_type === 'voice') bodyText = '🎤 Voice message';

      const payload: PushPayload = {
        title: sender_name || senderName || 'Ahmad Khan',
        body: bodyText,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: `test-chat-${Date.now()}`,
        data: {
          url: '/chat',
          type: 'chat_message',
        },
      };

      const result = await sendPushToUsers([targetUser], payload, supabaseServer);
      return res.json({
        success: true,
        deliveredCount: result.deliveredCount,
        failedCount: result.failedCount,
        recipient: targetUser,
      });
    } catch (err: any) {
      console.error('[server /api/test/push/chat-message error]:', err);
      return res.status(500).json({ error: err.message || 'Failed to test chat push' });
    }
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

  // ── Proctored MCQ Tests APIs ────────────────────────
  app.get('/api/mcq-tests', (req, res) => {
    const list = Array.from(proctoredMcqTests.values());
    return res.json({ tests: list });
  });

  app.post('/api/mcq-tests', express.json(), (req, res) => {
    const test = req.body;
    if (!test || !test.id) return res.status(400).json({ error: 'Invalid test payload' });
    proctoredMcqTests.set(test.id, test);
    return res.json({ success: true, test });
  });

  app.post('/api/mcq-tests/publish/:id', (req, res) => {
    const { id } = req.params;
    const test = proctoredMcqTests.get(id);
    if (!test) return res.status(404).json({ error: 'Test not found' });
    test.status = 'published';
    test.published_at = new Date().toISOString();
    proctoredMcqTests.set(id, test);
    return res.json({ success: true, test });
  });

  app.delete('/api/mcq-tests/:id', (req, res) => {
    const { id } = req.params;
    proctoredMcqTests.delete(id);
    return res.json({ success: true });
  });

  app.post('/api/mcq-tests/submit', express.json(), (req, res) => {
    const sub = req.body;
    if (!sub || !sub.id) return res.status(400).json({ error: 'Invalid submission payload' });
    proctoredMcqSubmissions.set(sub.id, sub);
    return res.json({ success: true, submission: sub });
  });

  app.get('/api/mcq-tests/submissions', (req, res) => {
    const list = Array.from(proctoredMcqSubmissions.values());
    return res.json({ submissions: list });
  });

  app.post('/api/mcq-tests/grade', express.json(), (req, res) => {
    const { submission_id, final_score, teacher_feedback, graded_by, graded_by_name } = req.body;
    const sub = proctoredMcqSubmissions.get(submission_id);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });
    sub.status = 'graded';
    sub.final_score = final_score;
    sub.teacher_feedback = teacher_feedback;
    sub.graded_at = new Date().toISOString();
    sub.graded_by = graded_by;
    sub.graded_by_name = graded_by_name;
    proctoredMcqSubmissions.set(submission_id, sub);
    return res.json({ success: true, submission: sub });
  });

  // ── Short & Long Question Written Tests APIs ─────────
  app.get('/api/written-tests', (req, res) => {
    const list = Array.from(writtenTests.values());
    return res.json({ tests: list });
  });

  app.post('/api/written-tests', express.json(), (req, res) => {
    const test = req.body;
    if (!test || !test.id) return res.status(400).json({ error: 'Invalid test payload' });
    writtenTests.set(test.id, test);
    return res.json({ success: true, test });
  });

  app.post('/api/written-tests/publish/:id', (req, res) => {
    const { id } = req.params;
    const test = writtenTests.get(id);
    if (!test) return res.status(404).json({ error: 'Test not found' });
    test.status = 'published';
    test.published_at = new Date().toISOString();
    writtenTests.set(id, test);
    return res.json({ success: true, test });
  });

  app.delete('/api/written-tests/:id', (req, res) => {
    const { id } = req.params;
    writtenTests.delete(id);
    return res.json({ success: true });
  });

  // ── Exam Submissions Camera Photo Upload (Cloudflare R2) ─
  app.post('/api/exam-submissions/upload-photo', upload.single('photo'), async (req, res) => {
    try {
      const file = req.file;
      const {
        test_id,
        student_id,
        question_id,
        submitted_at,
        photo_base64,
      } = req.body;

      if (!test_id || !student_id || !question_id) {
        return res.status(400).json({ error: 'test_id, student_id, and question_id are required' });
      }

      let buffer: Buffer | null = null;
      let mimeType = 'image/jpeg';

      if (file && file.buffer) {
        buffer = file.buffer;
        mimeType = file.mimetype || 'image/jpeg';
      } else if (photo_base64) {
        const matches = photo_base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          buffer = Buffer.from(photo_base64, 'base64');
        }
      }

      if (!buffer) {
        return res.status(400).json({ error: 'No photo data provided' });
      }

      const cleanTestId = String(test_id).replace(/[^a-zA-Z0-9_\-]/g, '_');
      const cleanStudentId = String(student_id).replace(/[^a-zA-Z0-9_\-]/g, '_');
      const cleanQuestionId = String(question_id).replace(/[^a-zA-Z0-9_\-]/g, '_');
      const r2Key = `submissions/${cleanTestId}/${cleanStudentId}/${cleanQuestionId}.jpg`;
      const uploadedAt = Date.now();

      // Store in memory cache for fast serving and dev server preview
      examSubmissionPhotos.set(r2Key, {
        buffer,
        mimeType,
        uploadedAt,
        testId: cleanTestId,
        studentId: cleanStudentId,
        questionId: cleanQuestionId,
        r2Key,
      });

      // Upload to Cloudflare R2 bucket if credentials configured
      const s3Client = getR2Client();
      if (s3Client) {
        try {
          await s3Client.send(
            new PutObjectCommand({
              Bucket: R2_EXAM_BUCKET,
              Key: r2Key,
              Body: buffer,
              ContentType: mimeType,
              Metadata: {
                student_id: cleanStudentId,
                test_id: cleanTestId,
                question_id: cleanQuestionId,
                submitted_at: submitted_at || new Date().toISOString(),
                uploaded_at: String(uploadedAt),
              },
            })
          );
          console.log(`[R2] Uploaded photo answer "${r2Key}" to bucket "${R2_EXAM_BUCKET}"`);
        } catch (r2Err: any) {
          console.warn(`[R2] Upload object note for "${r2Key}":`, r2Err?.message || r2Err);
        }
      }

      const photoUrl = `/api/exam-submissions/photo/${cleanTestId}/${cleanStudentId}/${cleanQuestionId}`;

      return res.json({
        success: true,
        key: r2Key,
        photo_url: photoUrl,
        uploaded_at: uploadedAt,
        expires_at: uploadedAt + TWENTY_FOUR_HOURS_MS,
      });
    } catch (err: any) {
      console.error('[Upload Photo Error]:', err);
      return res.status(500).json({ error: 'Failed to upload photo answer', details: err?.message });
    }
  });

  // ── Exam Submissions Photo Retrieval (Strict 24-Hour Expiry) ─
  app.get('/api/exam-submissions/photo/:testId/:studentId/:questionId', async (req, res) => {
    try {
      const { testId, studentId, questionId } = req.params;
      const r2Key = `submissions/${testId}/${studentId}/${questionId}.jpg`;

      // 1. Check in-memory item
      const item = examSubmissionPhotos.get(r2Key);
      const now = Date.now();

      if (item) {
        const elapsed = now - item.uploadedAt;
        if (elapsed > TWENTY_FOUR_HOURS_MS) {
          examSubmissionPhotos.delete(r2Key);
          return res.status(410).json({
            expired: true,
            error: 'SUBMISSION_EXPIRED',
            message: 'This submission has exceeded the 24-hour grading window and has expired.',
          });
        }
        res.setHeader('Content-Type', item.mimeType || 'image/jpeg');
        res.setHeader('Cache-Control', 'private, max-age=60');
        res.setHeader(
          'X-Submission-Expires-In',
          String(Math.max(0, Math.floor((item.uploadedAt + TWENTY_FOUR_HOURS_MS - now) / 1000)))
        );
        return res.send(item.buffer);
      }

      // 2. Fallback to Cloudflare R2 bucket
      const s3Client = getR2Client();
      if (s3Client) {
        try {
          const getRes = await s3Client.send(
            new GetObjectCommand({
              Bucket: R2_EXAM_BUCKET,
              Key: r2Key,
            })
          );

          const uploadedAtMeta = Number(getRes.Metadata?.uploaded_at) || (getRes.LastModified ? getRes.LastModified.getTime() : 0);
          if (uploadedAtMeta > 0 && now - uploadedAtMeta > TWENTY_FOUR_HOURS_MS) {
            return res.status(410).json({
              expired: true,
              error: 'SUBMISSION_EXPIRED',
              message: 'This submission has exceeded the 24-hour grading window and has expired.',
            });
          }

          if (getRes.Body) {
            const streamToBuffer = async (stream: any): Promise<Buffer> => {
              return new Promise((resolve, reject) => {
                const chunks: any[] = [];
                stream.on('data', (chunk: any) => chunks.push(chunk));
                stream.on('error', reject);
                stream.on('end', () => resolve(Buffer.concat(chunks)));
              });
            };

            const buf = await streamToBuffer(getRes.Body);
            // Cache back into memory
            examSubmissionPhotos.set(r2Key, {
              buffer: buf,
              mimeType: getRes.ContentType || 'image/jpeg',
              uploadedAt: uploadedAtMeta || now,
              testId,
              studentId,
              questionId,
              r2Key,
            });

            res.setHeader('Content-Type', getRes.ContentType || 'image/jpeg');
            return res.send(buf);
          }
        } catch (r2Err: any) {
          if (r2Err?.name === 'NoSuchKey' || r2Err?.$metadata?.httpStatusCode === 404) {
            return res.status(404).json({ error: 'Photo not found' });
          }
          console.warn(`[R2] Get object warning for "${r2Key}":`, r2Err?.message || r2Err);
        }
      }

      return res.status(404).json({ error: 'Photo not found or expired' });
    } catch (err: any) {
      console.error('[Get Photo Error]:', err);
      return res.status(500).json({ error: 'Failed to retrieve photo' });
    }
  });

  // ── Written Submissions APIs with 24-Hour Expiry Enrichment ─
  app.post('/api/written-submissions', express.json({ limit: '15mb' }), (req, res) => {
    const sub = req.body;
    if (!sub || !sub.id) return res.status(400).json({ error: 'Invalid submission payload' });
    if (!sub.submitted_at) sub.submitted_at = new Date().toISOString();
    writtenSubmissions.set(sub.id, sub);
    return res.json({ success: true, submission: sub });
  });

  app.get('/api/written-submissions', (req, res) => {
    const now = Date.now();
    const list = Array.from(writtenSubmissions.values()).map((sub) => {
      const submittedAtMs = new Date(sub.submitted_at || sub.created_at || now).getTime();
      const elapsedMs = now - submittedAtMs;
      const isExpired = elapsedMs > TWENTY_FOUR_HOURS_MS;
      const remainingMs = Math.max(0, TWENTY_FOUR_HOURS_MS - elapsedMs);
      const hours = Math.floor(remainingMs / (60 * 60 * 1000));
      const mins = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
      const remainingFormatted = isExpired ? 'Expired' : `${hours}h ${mins}m`;

      return {
        ...sub,
        is_expired: isExpired,
        remaining_ms: remainingMs,
        remaining_formatted: remainingFormatted,
        expires_at: new Date(submittedAtMs + TWENTY_FOUR_HOURS_MS).toISOString(),
      };
    });
    return res.json({ submissions: list });
  });

  app.post('/api/written-submissions/grade', express.json(), (req, res) => {
    const {
      submission_id,
      per_question_grades,
      teacher_feedback,
      graded_by,
      graded_by_name,
    } = req.body;

    const sub = writtenSubmissions.get(submission_id);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });

    // Check 24-hour validity
    const submittedAtMs = new Date(sub.submitted_at || sub.created_at || Date.now()).getTime();
    const isExpired = Date.now() - submittedAtMs > TWENTY_FOUR_HOURS_MS;

    if (isExpired && sub.status !== 'graded') {
      return res.status(410).json({
        expired: true,
        error: 'SUBMISSION_EXPIRED',
        message: 'This submission has exceeded the 24-hour grading window and can no longer be graded.',
      });
    }

    if (Array.isArray(per_question_grades) && Array.isArray(sub.answers)) {
      sub.answers = sub.answers.map((ans: any) => {
        const gradeInfo = per_question_grades.find((g: any) => g.question_id === ans.question_id);
        if (gradeInfo) {
          return {
            ...ans,
            marks_awarded: Number(gradeInfo.marks_awarded) || 0,
            remarks: gradeInfo.remarks || '',
          };
        }
        return ans;
      });
    }

    // Auto-calculate total score from per-question marks
    const calculatedTotal = Array.isArray(sub.answers)
      ? sub.answers.reduce((acc: number, ans: any) => acc + (Number(ans.marks_awarded) || 0), 0)
      : (req.body.final_score || 0);

    sub.status = 'graded';
    sub.final_score = calculatedTotal;
    sub.teacher_feedback = teacher_feedback || '';
    sub.graded_at = new Date().toISOString();
    sub.graded_by = graded_by;
    sub.graded_by_name = graded_by_name;

    writtenSubmissions.set(submission_id, sub);
    return res.json({ success: true, submission: sub });
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

  app.post('/api/chat/presence/heartbeat', express.json(), async (req, res) => {
    try {
      const { userId, isOnline } = req.body || {};
      if (userId && typeof userId === 'string') {
        await pgPool.query(
          'UPDATE public.profiles SET is_online = $1, last_seen = NOW() WHERE id = $2',
          [isOnline !== false, userId]
        );
      }
      return res.json({ success: true });
    } catch (err) {
      console.warn('[server /api/chat/presence/heartbeat] error:', err);
      return res.status(200).json({ success: false });
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

  // ─── Visibility Requests Endpoints ──────────────────────────────
  // Submit request to hide status (requires admin approval for students/teachers)
  app.post('/api/visibility-requests/submit', express.json(), async (req, res) => {
    try {
      const { userId, notes } = req.body || {};
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'userId is required' });
      }

      // Check user role
      const userRes = await pgPool.query('SELECT id, role, show_online_status FROM public.profiles WHERE id = $1', [userId]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'User profile not found' });
      }
      const user = userRes.rows[0];

      // If user is already an admin, they can toggle directly
      if (user.role === 'admin') {
        await pgPool.query('UPDATE public.profiles SET show_online_status = false WHERE id = $1', [userId]);
        return res.json({ success: true, autoApproved: true });
      }

      // Check for existing pending request
      const existing = await pgPool.query(
        "SELECT * FROM public.visibility_requests WHERE user_id = $1 AND status = 'pending' ORDER BY requested_at DESC LIMIT 1",
        [userId]
      );

      if (existing.rows.length > 0) {
        return res.json({
          success: true,
          message: 'Request sent — pending admin approval',
          request: existing.rows[0],
          alreadyPending: true,
        });
      }

      // Insert new pending request
      const insertRes = await pgPool.query(
        `INSERT INTO public.visibility_requests (user_id, requested_status, status, requested_at, notes)
         VALUES ($1, 'hidden', 'pending', NOW(), $2)
         RETURNING *`,
        [userId, notes || null]
      );

      return res.json({
        success: true,
        message: 'Request sent — pending admin approval',
        request: insertRes.rows[0],
      });
    } catch (err: any) {
      console.error('[server /api/visibility-requests/submit] error:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // Turn visibility back ON (instant, self-serve, no admin approval needed)
  app.post('/api/visibility-requests/turn-on', express.json(), async (req, res) => {
    try {
      const { userId } = req.body || {};
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'userId is required' });
      }

      // Immediately set show_online_status = true
      await pgPool.query('UPDATE public.profiles SET show_online_status = true WHERE id = $1', [userId]);

      // Cancel any pending 'hidden' requests
      await pgPool.query(
        "UPDATE public.visibility_requests SET status = 'cancelled' WHERE user_id = $1 AND status = 'pending'",
        [userId]
      );

      return res.json({ success: true, message: 'Online status is now visible' });
    } catch (err: any) {
      console.error('[server /api/visibility-requests/turn-on] error:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // Cancel a pending visibility request
  app.post('/api/visibility-requests/cancel', express.json(), async (req, res) => {
    try {
      const { userId } = req.body || {};
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'userId is required' });
      }

      await pgPool.query(
        "UPDATE public.visibility_requests SET status = 'cancelled' WHERE user_id = $1 AND status = 'pending'",
        [userId]
      );

      return res.json({ success: true, message: 'Request cancelled' });
    } catch (err: any) {
      console.error('[server /api/visibility-requests/cancel] error:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // Get current user's visibility request status
  app.get('/api/visibility-requests/status/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const pendingRes = await pgPool.query(
        "SELECT * FROM public.visibility_requests WHERE user_id = $1 AND status = 'pending' ORDER BY requested_at DESC LIMIT 1",
        [userId]
      );
      const latestRes = await pgPool.query(
        "SELECT * FROM public.visibility_requests WHERE user_id = $1 ORDER BY requested_at DESC LIMIT 5",
        [userId]
      );

      return res.json({
        pendingRequest: pendingRes.rows[0] || null,
        history: latestRes.rows || [],
      });
    } catch (err: any) {
      console.error('[server /api/visibility-requests/status/:userId] error:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // Admin: List all visibility requests
  app.get('/api/admin/visibility-requests', async (req, res) => {
    try {
      const result = await pgPool.query(`
        SELECT 
          vr.*,
          u.full_name as user_name,
          u.role as user_role,
          u.phone as user_phone,
          u.avatar_url as user_avatar,
          u.show_online_status as user_current_show_online,
          rev.full_name as reviewer_name
        FROM public.visibility_requests vr
        LEFT JOIN public.profiles u ON vr.user_id = u.id
        LEFT JOIN public.profiles rev ON vr.reviewed_by = rev.id
        ORDER BY 
          CASE WHEN vr.status = 'pending' THEN 0 ELSE 1 END,
          vr.requested_at DESC
      `);

      const pendingCountRes = await pgPool.query(
        "SELECT COUNT(*)::int as count FROM public.visibility_requests WHERE status = 'pending'"
      );

      return res.json({
        requests: result.rows,
        pendingCount: pendingCountRes.rows[0]?.count || 0,
      });
    } catch (err: any) {
      console.error('[server /api/admin/visibility-requests] error:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // Admin: Review a visibility request (Approve or Reject)
  app.post('/api/admin/visibility-requests/review', express.json(), async (req, res) => {
    try {
      const { requestId, action, adminId, reason } = req.body || {};
      console.log(`[server /api/admin/visibility-requests/review] Processing review: requestId=${requestId}, action=${action}, adminId=${adminId}`);

      if (!requestId || !action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'requestId and valid action (approve/reject) are required' });
      }

      // Fetch the request
      const reqRes = await pgPool.query('SELECT * FROM public.visibility_requests WHERE id = $1', [requestId]);
      if (reqRes.rows.length === 0) {
        return res.status(404).json({ error: 'Visibility request not found' });
      }
      const request = reqRes.rows[0];
      const targetUserId = request.user_id;

      // Validate reviewer profile ID to prevent foreign key violation on reviewed_by -> profiles(id)
      let validReviewerId: string | null = null;
      if (adminId && typeof adminId === 'string') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(adminId)) {
          const profileCheck = await pgPool.query('SELECT id FROM public.profiles WHERE id = $1', [adminId]);
          if (profileCheck.rows.length > 0) {
            validReviewerId = adminId;
          }
        }
      }
      if (!validReviewerId) {
        // Fallback to any existing admin profile if caller provided non-existent or placeholder adminId
        const fallbackAdmin = await pgPool.query("SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1");
        if (fallbackAdmin.rows.length > 0) {
          validReviewerId = fallbackAdmin.rows[0].id;
        }
      }

      if (action === 'approve') {
        // 1. Update visibility request status
        await pgPool.query(
          `UPDATE public.visibility_requests 
           SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), notes = $2
           WHERE id = $3`,
          [validReviewerId, reason || null, requestId]
        );

        // 2. Update user profile to hide online status
        await pgPool.query('UPDATE public.profiles SET show_online_status = false WHERE id = $1', [targetUserId]);

        // 3. Notify the user in-app
        await pgPool.query(
          `INSERT INTO public.notifications (recipient_id, title, message, type, severity, is_read, created_at)
           VALUES ($1, 'Visibility Request Approved', 'Your request to hide your online status and last seen has been approved by administration. Your status is now private.', 'privacy', 'normal', false, NOW())`,
          [targetUserId]
        );

        console.log(`[server /api/admin/visibility-requests/review] Successfully approved request ${requestId} for user ${targetUserId}`);
        return res.json({ success: true, message: 'Request approved and user status updated to hidden' });
      } else {
        // action === 'reject'
        // 1. Update visibility request status
        await pgPool.query(
          `UPDATE public.visibility_requests 
           SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), notes = $2
           WHERE id = $3`,
          [validReviewerId, reason || null, requestId]
        );

        // 2. Notify the user in-app (status stays visible)
        const rejectMsg = reason
          ? `Your request to hide your online status was declined by administration: ${reason}. Your status remains visible.`
          : 'Your request to hide your online status and last seen was declined by administration. Your status remains visible.';

        await pgPool.query(
          `INSERT INTO public.notifications (recipient_id, title, message, type, severity, is_read, created_at)
           VALUES ($1, 'Visibility Request Declined', $2, 'privacy', 'normal', false, NOW())`,
          [targetUserId, rejectMsg]
        );

        console.log(`[server /api/admin/visibility-requests/review] Successfully rejected request ${requestId} for user ${targetUserId}`);
        return res.json({ success: true, message: 'Request rejected' });
      }
    } catch (err: any) {
      console.error('[server /api/admin/visibility-requests/review] Database error during review:', {
        message: err.message,
        code: err.code,
        detail: err.detail,
        table: err.table,
        constraint: err.constraint,
        stack: err.stack,
      });
      return res.status(500).json({ 
        error: err.message || 'Internal server error',
        code: err.code,
        detail: err.detail || err.constraint
      });
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

  // ── Helper: Delete Chat Attachment from Cloudflare R2 / Storage ─────────
  async function deleteR2Attachment(attachmentKey: string): Promise<boolean> {
    if (!attachmentKey || typeof attachmentKey !== 'string') return false;

    // 1. Delete from local in-memory storage
    fileStorage.delete(attachmentKey);
    const keyParts = attachmentKey.split('/');
    const cleanFilename = keyParts[keyParts.length - 1];
    if (cleanFilename) {
      fileStorage.delete(cleanFilename);
    }

    // 2. Cloudflare R2 Bucket deletion (scholario-chat-attachments)
    const r2AccountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
    const r2AccessKey = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    const r2Bucket = process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET || 'scholario-chat-attachments';

    if (r2AccountId && r2AccessKey && r2SecretKey) {
      try {
        const s3Client = new S3Client({
          region: 'auto',
          endpoint: process.env.R2_ENDPOINT || `https://${r2AccountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: r2AccessKey,
            secretAccessKey: r2SecretKey,
          },
        });

        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: r2Bucket,
            Key: attachmentKey,
          })
        );
        console.log(`[R2] Deleted attachment "${attachmentKey}" from bucket "${r2Bucket}"`);
      } catch (r2Err: any) {
        console.warn(`[R2] Delete object warning for "${attachmentKey}":`, r2Err?.message || r2Err);
      }
    }

    // 3. Also remove from Supabase Storage buckets if stored there
    try {
      await supabaseServer.storage.from('scholario-chat-attachments').remove([attachmentKey]);
      await supabaseServer.storage.from('chat-attachments').remove([attachmentKey]);
      await supabaseServer.storage.from('voice-messages').remove([attachmentKey]);
    } catch {
      // Non-fatal
    }

    return true;
  }

  // ── Hard Delete Chat Message (Zero Trace) ──────────────────────────
  app.delete('/api/chat/messages/:messageId', async (req, res) => {
    try {
      const { messageId } = req.params;
      if (!messageId) {
        return res.status(400).json({ error: 'messageId is required' });
      }

      // 1. Authenticate user from Bearer token or x-user-id header
      let userId = '';
      let userRole = '';
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const payload = JSON.parse(Buffer.from(authHeader.slice(7).split('.')[1], 'base64').toString());
          userId = payload?.sub || '';
          userRole = payload?.user_metadata?.role || payload?.role || '';
        } catch {}
      }

      if (!userId && req.headers['x-user-id']) {
        userId = String(req.headers['x-user-id']).trim();
      }

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Valid authentication token required' });
      }

      // 2. Fetch existing message record from database to verify ownership & attachment details
      let messageData: any = null;
      try {
        const { rows } = await pgPool.query(
          `SELECT id, sender_id, thread_id, attachment_key, audio_url, message_type
           FROM public.chat_messages WHERE id = $1
           UNION
           SELECT id, sender_id, thread_id, attachment_key, audio_url, message_type
           FROM public.messages WHERE id = $1
           LIMIT 1`,
          [messageId]
        );
        if (rows.length > 0) {
          messageData = rows[0];
        }
      } catch (dbErr: any) {
        console.warn('[server message delete query warning]:', dbErr.message);
      }

      if (!messageData) {
        const { data: supaMsg } = await (supabaseServer as any)
          .from('chat_messages')
          .select('id, sender_id, thread_id, attachment_key, audio_url, message_type')
          .eq('id', messageId)
          .maybeSingle();
        messageData = supaMsg;
      }

      if (messageData) {
        // Ownership check: only sender or admin can delete
        const isSender = messageData.sender_id === userId;
        let isAdmin = userRole === 'admin' || userRole === 'super_admin';
        if (!isSender && !isAdmin) {
          try {
            const { rows: profileRows } = await pgPool.query(
              'SELECT role FROM public.profiles WHERE id = $1',
              [userId]
            );
            if (profileRows.length > 0 && (profileRows[0].role === 'admin' || profileRows[0].role === 'super_admin')) {
              isAdmin = true;
            }
          } catch {}
        }

        if (!isSender && !isAdmin) {
          return res.status(403).json({ error: 'Forbidden: You can only delete your own sent messages' });
        }

        // If message had an attachment, delete object from scholario-chat-attachments R2 bucket
        if (messageData.attachment_key) {
          await deleteR2Attachment(messageData.attachment_key);
        }

        // If message had a voice recording
        if (messageData.audio_url) {
          const match = messageData.audio_url.match(/voice_[^/.]+/);
          if (match) {
            await deleteR2Attachment(match[0]);
          }
        }
      }

      // 3. Permanently hard delete row from both messages and chat_messages tables in Supabase
      await pgPool.query('DELETE FROM public.messages WHERE id = $1', [messageId]);
      await pgPool.query('DELETE FROM public.chat_messages WHERE id = $1', [messageId]);

      await (supabaseServer as any).from('messages').delete().eq('id', messageId);
      await (supabaseServer as any).from('chat_messages').delete().eq('id', messageId);

      const threadId = messageData?.thread_id;

      // 4. Real-time removal: broadcast the deletion via Supabase Realtime so it instantly disappears from recipient's view
      if (threadId) {
        try {
          const threadChannel = supabaseServer.channel(`chat-thread-${threadId}`);
          await threadChannel.send({
            type: 'broadcast',
            event: 'message_deleted',
            payload: { messageId, threadId },
          });
          supabaseServer.removeChannel(threadChannel);
        } catch (bcErr) {
          console.warn('[server message delete broadcast warning]:', bcErr);
        }
      }

      return res.json({
        success: true,
        messageId,
        threadId,
      });
    } catch (err: any) {
      console.error('[server /api/chat/messages/:messageId DELETE error]:', err);
      return res.status(500).json({ error: err.message || 'Failed to hard delete message' });
    }
  });

  // POST fallback for clients
  app.post('/api/chat/messages/delete', express.json(), async (req, res) => {
    const messageId = req.body?.message_id || req.body?.messageId;
    if (!messageId) {
      return res.status(400).json({ error: 'messageId is required' });
    }
    req.params.messageId = messageId;
    // Pass to DELETE route
    (app as any)._router.handle(
      { ...req, method: 'DELETE', url: `/api/chat/messages/${messageId}` },
      res
    );
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

  // ── Background Realtime Listeners for Push Notifications ──
  try {
    // 1. Live Sessions
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

    // 2. Class Session Links (when teacher shares Zoom/Meet/Teams link)
    supabaseServer
      .channel('server-class-links-push-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_session_links' },
        (payload: any) => {
          const row = payload.new;
          if (row && row.link_url && row.link_url.trim().length > 0) {
            sendClassLinkPostedPush(
              {
                slotId: row.slot_id,
                sessionDate: row.session_date,
                linkUrl: row.link_url,
                offeringId: row.offering_id,
                teacherId: row.created_by,
              },
              supabaseServer
            ).catch((err) => {
              console.warn('[ServerPush] Class session link push error:', err);
            });
          }
        }
      )
      .subscribe((status: string) => {
        console.log(`[ServerPush] Realtime class_session_links channel status: ${status}`);
      });

    // 3. Chat Messages (Immediate push to recipient if not actively looking at thread)
    supabaseServer
      .channel('server-chat-messages-push-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload: any) => {
          if (payload.new) {
            handleNewChatMessage(payload.new, supabaseServer, isRecipientActiveInThread).catch((err) => {
              console.warn('[ServerPush] Chat message push error:', err);
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: any) => {
          if (payload.new) {
            handleNewChatMessage(payload.new, supabaseServer, isRecipientActiveInThread).catch((err) => {
              console.warn('[ServerPush] Messages push error:', err);
            });
          }
        }
      )
      .subscribe((status: string) => {
        console.log(`[ServerPush] Realtime chat_messages channel status: ${status}`);
      });
  } catch (chanErr) {
    console.warn('[ServerPush] Warning creating realtime channels:', chanErr);
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
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
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
    ensureR2ExamBucketLifecycle().catch((err) => {
      console.warn('[R2 Lifecycle Init Note]:', err?.message || err);
    });
  });
}

startServer();
