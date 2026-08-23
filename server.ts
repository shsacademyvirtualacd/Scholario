import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

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
import { validateMCQQuestion, filterAndValidateMCQs } from './src/lib/mcqValidator';

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

  app.use(express.json());

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

      const targetModel = 'gemini-3.6-flash';

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

      // Build tailored, strictly chapter-scoped pedagogical instructions
      const normSub = (subject || '').toLowerCase();
      const normTop = (topic || '').toLowerCase();

      let subjectGuidance = '';

      // Build strict chapter scoping directive
      const isFullSyllabus = normTop === 'full syllabus' || normTop === 'mixed chapters' || normTop === 'all';
      
      if (!isFullSyllabus && topic) {
        subjectGuidance = `
======================================================================
MANDATORY SINGLE-CHAPTER SCOPING CONSTRAINT (HARD REQUIREMENT)
======================================================================
TARGET SUBJECT: ${subject}
EXACT SELECTED CHAPTER: "${topic}"
TARGET GRADE: Grade ${effectiveGrade} (${String(effectiveBoard).toUpperCase()} Board)
DIFFICULTY LEVEL: ${difficulty.replace('_', ' ').toUpperCase()}

STRICT SCOPE DIRECTIVES:
1. EVERY SINGLE ONE of the ${count} questions MUST strictly, exclusively test concepts, formulas, rules, and problem types from "${topic}".
2. ZERO TOLERANCE FOR CROSS-CHAPTER BLEED: You are strictly forbidden from including questions from any other chapter or topic of ${subject}.
3. STRICT GRADE-LEVEL SYLLABUS BOUNDARY:
   - Calculus, derivatives (dy/dx, differentiation of polynomials), integrals (antiderivatives, integration), and limits are strictly Grade 11/12 (FSc Part 1/2). They DO NOT exist in Grade 9 or Grade 10 and MUST NEVER appear in any question or option!
`;

        if (normSub.includes('math')) {
          if (normTop.includes('factoriz') || normTop.includes('algebraic manipulation') || normTop.includes('algebraic expression')) {
            subjectGuidance += `
EXACT CONTENT BLUEPRINT FOR "Factorization and Algebraic Manipulation":
- MUST TEST ONLY:
  * Algebraic formulas & identities: $(a\\pm b)^2, a^2-b^2, a^3\\pm b^3, (a+b+c)^2, (a\\pm b)^3$.
  * Evaluating expressions: e.g. finding $x^2 + \\frac{1}{x^2}$ given $x + \\frac{1}{x} = k$, finding $a^2+b^2$ given $a+b$ and $ab$.
  * Factoring quadratic trinomials by middle-term breaking: $ax^2 + bx + c = (px+q)(rx+s)$.
  * Factoring by grouping terms: $ax + ay + bx + by = (a+b)(x+y)$.
  * Sum and difference of cubes factoring: $a^3 \\pm b^3 = (a\\pm b)(a^2 \\mp ab + b^2)$.
  * Remainder Theorem: finding remainder $R = P(a)$ when polynomial $P(x)$ is divided by $(x - a)$.
  * Factor Theorem: determining unknown coefficients (e.g., find $k$ if $(x-a)$ is a factor of $P(x)$).
  * HCF and LCM of algebraic expressions: finding common factors, relationship $\\text{HCF} \\times \\text{LCM} = P(x) \\times Q(x)$.
  * Simplifying rational algebraic fractions: $\\frac{x^2-16}{x^2+4x} = \\frac{x-4}{x}$, $\\frac{1}{x-2} - \\frac{1}{x+2} = \\frac{4}{x^2-4}$.
- ABSOLUTELY FORBIDDEN FOR THIS TEST:
  * NO Matrix operations or determinants (matrices are in another chapter).
  * NO Trigonometric functions ($\\sin, \\cos, \\tan$) or identities (trigonometry is in another chapter).
  * NO Coordinate geometry (distance formula, midpoint formula are in Coordinate Geometry).
  * NO Logarithms (log laws, characteristic, mantissa are in Logarithms).
  * NO Set theory or Venn diagrams (in Sets chapter).
  * NO Geometry of lines, transversal angles, or polygon angle sums.
  * NO Statistics (mean, median, mode).
  * NO Calculus, derivatives of polynomials, or integrals.
`;
          } else if (normTop.includes('logarithm')) {
            subjectGuidance += `
EXACT CONTENT BLUEPRINT FOR "Logarithms":
- MUST TEST: Laws of logarithms ($\\log(ab) = \\log a + \\log b$, $\\log(a/b) = \\log a - \\log b$, $\\log(a^n) = n\\log a$, change of base), scientific notation, characteristic and mantissa, common log vs natural log.
- STRICTLY FORBIDDEN: Matrices, trigonometry, coordinate geometry, remainder theorem, factoring, calculus.
`;
          } else if (normTop.includes('real number') || normTop.includes('radical')) {
            subjectGuidance += `
EXACT CONTENT BLUEPRINT FOR "Real Numbers":
- MUST TEST: Rational and irrational numbers, radical operations ($\\sqrt{a}$), laws of exponents/indices, properties of real numbers (closure, associative, commutative, distributive).
- STRICTLY FORBIDDEN: Matrices, trigonometry, coordinates, remainder theorem, calculus.
`;
          } else if (normTop.includes('set') || normTop.includes('relation')) {
            subjectGuidance += `
EXACT CONTENT BLUEPRINT FOR "Sets and Relations":
- MUST TEST: Set operations (union $A \\cup B$, intersection $A \\cap B$, complement $A'$, difference $A \\setminus B$), Venn diagrams, De Morgan's laws, Cartesian product $A \\times B$, binary relations, functions.
- STRICTLY FORBIDDEN: Matrices, trigonometry, coordinate distance, logarithms, calculus.
`;
          } else if (normTop.includes('linear equation') || normTop.includes('inequalit')) {
            subjectGuidance += `
EXACT CONTENT BLUEPRINT FOR "Linear Equations and Inequalities":
- MUST TEST: Linear equations in one variable ($ax+b=c$), equations involving absolute value ($|x-a|=b$), linear inequalities ($ax+b < c$), number line representations.
- STRICTLY FORBIDDEN: Matrices, trigonometry, logarithms, remainder theorem, calculus.
`;
          } else if (normTop.includes('trigonometr') || normTop.includes('bearing')) {
            subjectGuidance += `
EXACT CONTENT BLUEPRINT FOR "Trigonometry and Bearing":
- MUST TEST: Right-triangle trigonometric ratios ($\\sin, \\cos, \\tan, \\csc, \\sec, \\cot$), standard angles ($30^\\circ, 45^\\circ, 60^\\circ$), fundamental identity $\\sin^2\\theta + \\cos^2\\theta = 1$, angles of elevation and depression, bearings.
- STRICTLY FORBIDDEN: Matrices, logarithms, remainder theorem, statistics, calculus.
`;
          } else if (normTop.includes('coordinate geometry')) {
            subjectGuidance += `
EXACT CONTENT BLUEPRINT FOR "Coordinate Geometry":
- MUST TEST: Cartesian plane coordinates, Distance Formula $d = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}$, Midpoint Formula $(\\frac{x_1+x_2}{2}, \\frac{y_1+y_2}{2})$, collinear points.
- STRICTLY FORBIDDEN: Matrices, logarithms, remainder theorem, trigonometry, calculus.
`;
          } else if (normTop.includes('statistic') || normTop.includes('mean') || normTop.includes('median')) {
            subjectGuidance += `
EXACT CONTENT BLUEPRINT FOR "Basic Statistics":
- MUST TEST: Frequency distribution, histograms, arithmetic mean ($\\bar{x} = \\frac{\\sum x}{n}$), median, mode, range.
- STRICTLY FORBIDDEN: Matrices, trigonometry, logarithms, remainder theorem, calculus.
`;
          } else if (normTop.includes('matri') || normTop.includes('determinant')) {
            subjectGuidance += `
EXACT CONTENT BLUEPRINT FOR "Matrices and Determinants":
- MUST TEST: Order of matrices, types (row, column, square, rectangular, diagonal, scalar, identity, null), transpose, matrix addition/multiplication, determinant of 2x2 matrix ($ad-bc$), singular/non-singular, adjoint, inverse $A^{-1}$, Cramer's rule.
- STRICTLY FORBIDDEN: Trigonometry, coordinates, logarithms, statistics, calculus.
`;
          }
        } else if (normSub.includes('phys')) {
          if (normTop.includes('kinematic')) {
            subjectGuidance += `
EXACT CONTENT BLUEPRINT FOR "Kinematics":
- MUST TEST: Rest and motion, types of motion, scalars vs vectors, distance vs displacement, speed vs velocity, acceleration, distance-time and speed-time graphs, equations of motion ($v=u+at, s=ut+\\frac{1}{2}at^2, 2as=v^2-u^2$), gravity ($g=9.8\\text{ or }10\\text{ m/s}^2$).
- STRICTLY FORBIDDEN: Pascal's law, Archimedes upthrust, magnetic poles, specific heat, nuclear physics.
`;
          } else if (normTop.includes('measurement') || normTop.includes('physical quantit')) {
            subjectGuidance += `
EXACT CONTENT BLUEPRINT FOR "Physical Quantities and Measurement":
- MUST TEST: Base vs derived SI units, standard prefixes, scientific notation, Vernier Calipers (least count, zero error), Screw Gauge, significant figures.
- STRICTLY FORBIDDEN: Kinematics equations, magnetic poles, nuclear decay.
`;
          } else if (normTop.includes('pressure') || normTop.includes('deformation')) {
            subjectGuidance += `
EXACT CONTENT BLUEPRINT FOR "Pressure and Deformation in Solids":
- MUST TEST: Pressure $P=F/A$, liquid pressure $P=\\rho gh$, Pascal's law & hydraulic lifts, Archimedes principle & upthrust, Hooke's law ($F=kx$), Young's modulus.
- STRICTLY FORBIDDEN: Equations of motion, magnetic poles, heat capacity.
`;
          } else if (normTop.includes('work') || normTop.includes('energy')) {
            subjectGuidance += `
EXACT CONTENT BLUEPRINT FOR "Work and Energy":
- MUST TEST: Work $W=Fs\\cos\\theta$, kinetic energy $E_k=\\frac{1}{2}mv^2$, potential energy $E_p=mgh$, law of conservation of energy, power $P=W/t$, efficiency.
- STRICTLY FORBIDDEN: Vernier caliper least count, Pascal's law, magnetic poles.
`;
          } else if (normTop.includes('magnet')) {
            subjectGuidance += `
EXACT CONTENT BLUEPRINT FOR "Magnetism":
- MUST TEST: Magnetic poles, field lines, magnetic domain theory, induced magnetism, electromagnets, magnetic shielding.
- STRICTLY FORBIDDEN: Equations of motion, Archimedes upthrust, specific heat capacity.
`;
          }
        } else if (normSub.includes('chem')) {
          if (normTop.includes('atomic structure') || normTop.includes('atom')) {
            subjectGuidance += `
EXACT CONTENT BLUEPRINT FOR "Atomic Structure":
- MUST TEST: Protons, neutrons, electrons, atomic number $Z$, mass number $A$, Rutherford model & defects, Bohr model & postulates, electronic configuration ($1s^2 2s^2...$), isotopes ($^{12}\\text{C}, ^{14}\\text{C}, ^{235}\\text{U}$).
- STRICTLY FORBIDDEN: Organic functional groups, alkanes/alkenes, fractional distillation, acid rain, titrations.
`;
          } else if (normTop.includes('acid') || normTop.includes('base') || normTop.includes('salt')) {
            subjectGuidance += `
EXACT CONTENT BLUEPRINT FOR "Acids, Bases, and Salts":
- MUST TEST: Arrhenius acid/base theory, pH and pOH scale ($pH = -\\log[H^+]$), indicators, neutralization, normal/acidic/basic salts.
- STRICTLY FORBIDDEN: Rutherford atomic model, Bohr postulates, catenation/alkanes.
`;
          }
        } else if (normSub.includes('bio')) {
          if (normTop.includes('the cell') || normTop.includes('cell organelle')) {
            subjectGuidance += `
EXACT CONTENT BLUEPRINT FOR "The Cell":
- MUST TEST: Cell theory, light vs electron microscope, prokaryotic vs eukaryotic cells, organelles (Nucleus, Mitochondria, Ribosomes, ER, Golgi, Chloroplasts), membrane transport (diffusion, osmosis, active transport).
- STRICTLY FORBIDDEN: Flower double fertilization, Mendel genetics ratios, Darwin natural selection.
`;
          }
        }
        subjectGuidance += `======================================================================\n`;
      } else if (isFbise9) {
        subjectGuidance = `
================================
AUTHORITATIVE GRADE 9 FBISE CURRICULUM ENFORCEMENT
================================
You MUST strictly follow the official Grade 9 FBISE (Federal Board) Curriculum.
Selected Subject: ${subject}
Selected Topic: ${topic}

CRITICAL RULES FOR GRADE 9 FBISE:
1. Every generated question MUST belong strictly to "${subject}" for Grade 9.
2. Difficulty Level: ${difficulty.toUpperCase()}. Must stay strictly within Grade 9 FBISE syllabus.
3. NEVER include Calculus, derivatives (dy/dx), integrals, or advanced college-level math.
`;
      } else if (normSub.includes('eng')) {
        subjectGuidance = `
CRITICAL SUBJECT RULES FOR ENGLISH (${topic}):
- Write REAL, concrete English sentences and authentic linguistic tasks standard in FBISE / Sindh Board Grade ${effectiveGrade} English examinations.
- Formats: Verb tenses, active/passive voice, direct/indirect narration, conditionals, prepositions, figures of speech, vocabulary.
- ABSOLUTELY PROHIBITED: Do NOT generate abstract, vague pseudo-questions like "Which statement is academically accurate".`;
      } else if (normSub.includes('math')) {
        subjectGuidance = `
CRITICAL SUBJECT RULES FOR MATHEMATICS (${topic}):
- Write concrete numerical and algebraic problems with real numbers, equations, and expressions for Grade ${effectiveGrade} (${topic}).
- STRICT RULE: Stay strictly within "${topic}". Do NOT generate calculus/derivatives for Grade 9 or 10.
- Use standard LaTeX notation ($...$) for mathematical formulas and expressions.`;
      } else if (normSub.includes('phys')) {
        subjectGuidance = `
CRITICAL SUBJECT RULES FOR PHYSICS (${topic}):
- Write concrete numerical word problems with realistic values and SI units, or clear conceptual application questions for Grade ${effectiveGrade} strictly for "${topic}".`;
      } else if (normSub.includes('chem')) {
        subjectGuidance = `
CRITICAL SUBJECT RULES FOR CHEMISTRY (${topic}):
- Write questions using real chemical formulas, balanced chemical equations, and principles strictly for Grade ${effectiveGrade} "${topic}".`;
      } else if (normSub.includes('bio')) {
        subjectGuidance = `
CRITICAL SUBJECT RULES FOR BIOLOGY (${topic}):
- Write questions on specific anatomical structures, biological terms, and mechanisms strictly for Grade ${effectiveGrade} "${topic}".`;
      } else if (normSub.includes('comp') || normSub.includes('cs') || normSub.includes('it')) {
        subjectGuidance = `
CRITICAL SUBJECT RULES FOR COMPUTER SCIENCE (${topic}):
- Provide concrete code snippets, number system conversions, and networking concepts for Grade ${effectiveGrade} "${topic}".`;
      } else {
        subjectGuidance = `
CRITICAL SUBJECT RULES FOR ${subject.toUpperCase()} (${topic}):
- Write concrete, high-precision questions specifically testing the actual concepts, formulas, terminology, or rules of "${topic}".`;
      }

      const excludePromptPart = normExcludes.length > 0
        ? `\nCRITICAL ANTI-DUPLICATION RULE:\nDO NOT repeat or test the same concept/scenario as these already generated questions:\n${normExcludes.slice(-15).map((t) => `- "${t.slice(0, 100)}..."`).join('\n')}\nGenerate fresh, distinct questions.\n`
        : '';

      const prompt = `You are a Senior Academic Examiner and Curriculum Assessment Director specializing in Pakistan Secondary and Higher Secondary Education (FBISE and Sindh Board 9th-12th Grade syllabus).

Generate exactly ${count} rigorous, high-quality Multiple Choice Questions (MCQs) for self-testing and exam practice.

Subject: ${subject}
Topic / Chapter: ${topic || 'Core Syllabus'}
Target Grade: Grade ${effectiveGrade} (${effectiveBoard.toUpperCase()} Board)
Difficulty Level: ${difficulty.replace('_', ' ').toUpperCase()}

${subjectGuidance}
${excludePromptPart}
STRICT ANTI-META DIRECTIVES:
1. STRICTLY FORBIDDEN: NEVER write meta-questions about the curriculum, textbook accuracy, syllabus validity, or generic claims (e.g., 'Which statement is factually accurate according to the textbook', 'verified textbook principle', 'invalid assumption violating syllabus definitions').
2. MANDATORY: Every single question MUST directly ask a real problem or question testing specific concepts: concrete quantities, numerical values, SI units, formulas, chemical equations, physical laws, measuring instruments, biological processes, or Urdu/Islamiat textual analysis.
3. Every question must have EXACTLY ONE unambiguously correct answer ('A', 'B', 'C', or 'D').
4. The other 3 options ('distractors') must be realistic, plausible, and academically meaningful based on common student errors or misconceptions.
5. No duplicate questions, no factual errors, and no ambiguous questions.
6. For all math, chemical, or physics equations, use clean standard notation or inline LaTeX ($...$).
7. Each question must include a clear, educational explanation detailing the exact reasoning why the correct option is right.

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
}`;

      const candidateModels = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.7-flash'];
      let parsedData: any = null;

      for (const targetModel of candidateModels) {
        try {
          const aiResponse = await client.models.generateContent({
            model: targetModel,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              responseMimeType: 'application/json',
              temperature: 0.4,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });

          const responseText = aiResponse.text?.trim() || '';
          if (!responseText) continue;

          try {
            parsedData = JSON.parse(responseText);
          } catch {
            const cleaned = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            parsedData = JSON.parse(cleaned);
          }

          if (parsedData && Array.isArray(parsedData.questions) && parsedData.questions.length > 0) {
            break;
          }
        } catch (modelErr: any) {
          console.warn(`[Generate MCQ] Model ${targetModel} attempt failed:`, modelErr?.message || modelErr);
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
            questions: validatedQuestions.slice(0, count),
          });
        }
      }

      // Fallback if AI response was empty, malformed, or failed validation
      return res.json({
        success: true,
        source: 'curriculum-bank',
        questions: fallbackPool.slice(0, count),
      });
    } catch (err: any) {
      console.error('[Generate MCQ Error]:', err);
      // Return safe fallback so user's experience is not broken
      const {
        subject = 'Physics',
        topic = 'General Science',
        questionCount = 10,
        difficulty = 'medium',
        board = 'fbise',
        grade = '10',
      } = req.body || {};
      const fallback = generateCurriculumFallbackMCQs(subject, topic, Number(questionCount) || 10, difficulty, grade, board);
      return res.json({
        success: true,
        source: 'curriculum-bank-error-fallback',
        questions: fallback,
      });
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
      const mimeType = file.mimetype || (file_type === 'image' ? 'image/jpeg' : 'application/pdf');

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

  // ── Test Answer Key Upload ──────────────────────────
  app.post('/api/tests/answer-key/upload/:testId', upload.single('file'), async (req, res) => {
    try {
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
  app.get('/api/tests/answer-key/view/:testId', (req, res) => {
    const { testId } = req.params;
    const stored = fileStorage.get(`ak_${testId}`);
    if (stored) {
      res.setHeader('Content-Type', 'application/pdf');
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

    return res.status(404).send('Answer key not found');
  });

  // ── Test Answer Key Download ────────────────────────
  app.get('/api/tests/answer-key/dl/:testId', (req, res) => {
    const { testId } = req.params;
    const stored = fileStorage.get(`ak_${testId}`);
    if (stored) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${stored.filename}"`);
      return res.send(stored.buffer);
    }

    const samplePdfPath = path.join(process.cwd(), 'real.pdf');
    if (fs.existsSync(samplePdfPath)) {
      const buf = fs.readFileSync(samplePdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="answer_key.pdf"');
      return res.send(buf);
    }

    return res.status(404).send('Answer key not found');
  });

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
