import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../env';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { adminToolDeclarations, executeAdminDataQuery } from '../../../src/lib/adminDataTools';

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
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const DEFAULT_SUPABASE_URL = 'https://rxgrxjlyrfzojvirkhdc.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Z3J4amx5cmZ6b2p2aXJraGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTc3OTksImV4cCI6MjA5ODkzMzc5OX0.ggAT2JiBTg6VG5tbZNnjkig7F73JE0ZzPl_145yuow4';

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

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON payload in request body' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const { messages, userRole = 'student', userName, grade, stream } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: 'A non-empty messages array is required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const apiKey =
    env?.GEMINI_API_KEY ||
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);

  const supabaseUrl = env?.SUPABASE_URL || env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseKey = env?.SUPABASE_ANON_KEY || env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

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

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Handle streaming generation asynchronously
  (async () => {
    try {
      if (!apiKey) {
        // Fallback simulation when GEMINI_API_KEY is not yet set
        const lastUserMsg = messages[messages.length - 1]?.content || 'Hello';
        let fallbackText = '';

        if (isAdmin) {
          try {
            const overview = await executeAdminDataQuery('queryPlatformOverview', {}, supabase);
            fallbackText = `**Sage (Live Platform Overview — Admin Mode)**:\n\n` +
              `Here is the live snapshot from Scholario's database:\n` +
              `- **Registered Students**: ${overview?.kpis?.total_registered_students ?? 0} (Onboarded: ${overview?.kpis?.onboarded_students ?? 0})\n` +
              `- **Faculty Teachers**: ${overview?.kpis?.total_faculty_teachers ?? 0} (Active: ${overview?.kpis?.active_teachers ?? 0})\n` +
              `- **Active Class Offerings**: ${overview?.kpis?.active_class_offerings ?? 0}\n` +
              `- **Published Assessments**: ${overview?.kpis?.published_assessments_count ?? 0} (Submissions: ${overview?.kpis?.total_student_submissions ?? 0})\n` +
              `- **Tuition Fee Configurations**: ${overview?.kpis?.total_fee_configurations ?? 0} active tiers\n\n` +
              `*Note: Configure \`GEMINI_API_KEY\` in your Cloudflare Pages environment variables for custom interactive AI responses.*`;
          } catch {
            fallbackText = `**Sage (Admin Mode)**: I received your query about *"_**${lastUserMsg}**_*. Please ensure \`GEMINI_API_KEY\` is configured in Cloudflare Pages project settings.`;
          }
        } else {
          fallbackText = `**Sage (Study Companion)**: I received your question about *"_**${lastUserMsg}**_*. Note: \`GEMINI_API_KEY\` is not yet configured in your Cloudflare Pages environment variables/secrets. Please add \`GEMINI_API_KEY\` in your Cloudflare Pages project settings to activate live Gemini AI responses!`;
        }

        const words = fallbackText.split(' ');
        for (let i = 0; i < words.length; i += 3) {
          const chunk = words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
          await writer.write(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          await new Promise((r) => setTimeout(r, 40));
        }
        await writer.write(encoder.encode('data: [DONE]\n\n'));
        await writer.close();
        return;
      }

      // Format conversation history for @google/genai
      const contents = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      const targetModel = 'gemini-3.7-flash';

      if (isAdmin) {
        let currentContents: any[] = [...contents];
        const maxTurns = 3;
        let turn = 0;
        let finalResponseSent = false;

        while (turn < maxTurns) {
          turn++;
          const genRes = await ai.models.generateContent({
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
              const data = await executeAdminDataQuery(toolName, call.args || {}, supabase);
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
            if (genRes.text) {
              const words = genRes.text.split(' ');
              for (let i = 0; i < words.length; i += 3) {
                const chunk = words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
                await writer.write(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
                await new Promise((r) => setTimeout(r, 15));
              }
              finalResponseSent = true;
            }
            break;
          }
        }

        if (!finalResponseSent) {
          const streamResponse = await ai.models.generateContentStream({
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
              await writer.write(encoder.encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`));
            }
          }
        }
      } else {
        // Teacher/Student flow (no tools)
        const streamResponse = await ai.models.generateContentStream({
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
            await writer.write(encoder.encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`));
          }
        }
      }

      await writer.write(encoder.encode('data: [DONE]\n\n'));
    } catch (err: any) {
      console.error('[Cloudflare Pages Sage Chat Streaming Error]:', err);
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ error: err.message || 'Error processing streaming response' })}\n\n`)
      );
      await writer.write(encoder.encode('data: [DONE]\n\n'));
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
