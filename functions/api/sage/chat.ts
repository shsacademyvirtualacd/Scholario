import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../../env';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { adminToolDeclarations, executeAdminDataQuery } from '../../../src/lib/adminDataTools';
import {
  SAGE_MODEL_FALLBACK_CHAIN,
  searchFallbackKnowledgeBase,
} from '../../../src/lib/knowledgeBaseService';
import { createSafeSupabaseClient } from '../../_lib/supabaseAuth';

function withModelTimeout<T>(promise: Promise<T>, ms: number, modelId: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`TIMEOUT: Model ${modelId} did not respond within ${ms}ms`));
    }, ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function classifyGeminiError(err: any): string {
  const status = Number(err?.status || err?.code || 0);
  const msg = String(err?.message || err || '');
  if (status === 429 || /429|quota|rate.?limit|resource_exhausted/i.test(msg)) {
    return 'Sage is busy right now (rate limit reached). Please wait a few seconds and tap Retry.';
  }
  if (
    status === 401 ||
    status === 403 ||
    /api_key_invalid|invalid api key|permission_denied|unauthenticated/i.test(msg)
  ) {
    return 'Sage API key is invalid or restricted. Please verify GEMINI_API_KEY in Cloudflare Pages runtime settings.';
  }
  if (status === 503 || /503|unavailable|high demand|overloaded|timeout/i.test(msg)) {
    return 'Sage AI servers are experiencing high traffic right now. Please tap Retry.';
  }
  return 'Sage could not complete that request right now. Please tap Retry.';
}

interface ChatMessagePayload {
  role: 'user' | 'assistant' | 'model';
  content: string;
  attachment?: {
    key?: string;
    filename?: string;
    size?: number;
    mime_type?: string;
    base64?: string;
  };
}

interface ChatRequestBody {
  messages: ChatMessagePayload[];
  userRole?: 'student' | 'teacher' | 'admin' | 'parent';
  userName?: string;
  grade?: string;
  stream?: string;
  page_context?: {
    path?: string;
    title?: string;
    summary?: string;
  };
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Supabase-Url, X-Supabase-Anon-Key',
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

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON payload in request body' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const { messages, userRole = 'student', userName, grade, stream, page_context } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: 'A non-empty messages array is required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const apiKey = (
    env?.GEMINI_API_KEY ||
    env?.GOOGLE_API_KEY ||
    env?.VITE_GEMINI_API_KEY ||
    (typeof process !== 'undefined'
      ? process.env?.GEMINI_API_KEY || process.env?.GOOGLE_API_KEY || process.env?.VITE_GEMINI_API_KEY
      : undefined) ||
    ''
  ).trim();

  if (!apiKey) {
    console.error('[Sage Chat] Missing required runtime environment variable: GEMINI_API_KEY');
  }

  const isAdmin = userRole === 'admin';

  // Resolve Supabase client safely from runtime `context.env` without ever throwing "supabaseUrl is required."
  // Service role key is used ONLY for read-only admin tool queries on the server; student/teacher requests use anon key + RLS.
  const {
    supabase,
    missingVars: missingSupabaseVars,
  } = createSafeSupabaseClient(env, request, {
    useServiceRole: isAdmin,
    forwardAuthHeader: !isAdmin,
  });

  if (missingSupabaseVars.length > 0) {
    console.warn(
      `[Sage Chat] Optional Supabase client unavailable — missing runtime variable(s): ${missingSupabaseVars.join(', ')}. Proceeding with in-memory institutional RAG fallback.`
    );
  }

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

  let pageContextPrompt = '';
  if (page_context && (page_context.path || page_context.title)) {
    pageContextPrompt = `\nCURRENT APPLICATION PAGE CONTEXT:
The user is currently viewing (or just navigated from) the following screen:
- Route: ${page_context.path || 'Unknown'}
- Page Title: ${page_context.title || 'Scholario Portal'}
- Visible State/Activity: ${page_context.summary || 'Active view'}
If the user asks questions such as "what am I looking at?", "how do I use this page?", or refers to "this test" / "this schedule", directly incorporate this screen context without asking them to re-explain.`;
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    try {
      if (!apiKey) {
        const missingMsg =
          'Sage AI is not configured yet: missing runtime variable GEMINI_API_KEY in Cloudflare Pages → Settings → Variables and secrets.';
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: missingMsg })}\n\n`));
        await writer.write(encoder.encode('data: [DONE]\n\n'));
        await writer.close();
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // ── Optional Non-Blocking RAG / Note Vault Lookup ───────────────────
      let ragContextPrompt = '';
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      const userQueryText = String(lastUserMsg?.content || '').trim();

      if (userQueryText) {
        try {
          let matchedChunks: any[] = [];

          if (supabase) {
            // 1. Try vector similarity search via match_knowledge_base RPC (non-blocking 3s cap)
            try {
              const embedRes = await withModelTimeout(
                ai.models.embedContent({
                  model: 'gemini-embedding-001',
                  contents: userQueryText,
                  config: { outputDimensionality: 768 },
                }),
                3000,
                'gemini-embedding-001'
              );
              const queryEmbedding =
                embedRes.embeddings?.[0]?.values || (embedRes as any).embedding?.values;

              if (queryEmbedding && Array.isArray(queryEmbedding)) {
                const { data: rpcData, error: rpcErr } = await supabase.rpc(
                  'match_knowledge_base',
                  {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.28,
                    match_count: 4,
                  }
                );
                if (rpcErr) {
                  console.warn('[Sage RAG] match_knowledge_base RPC warning:', rpcErr.message);
                } else if (Array.isArray(rpcData) && rpcData.length > 0) {
                  matchedChunks = rpcData;
                }
              }
            } catch (embedOrRpcErr: any) {
              console.warn(
                '[Sage RAG] Vector lookup skipped, falling back to Note Vault / local knowledge:',
                embedOrRpcErr?.message || String(embedOrRpcErr)
              );
            }

            // 2. Also check Note Vault (`notes` table) for matching chapter/title if vector search returned no chunks
            if (matchedChunks.length === 0) {
              try {
                const { data: noteRows, error: notesErr } = await supabase
                  .from('notes')
                  .select('title, chapter_name, file_type, offering:class_offerings(class:classes(name), subject:subjects(name))')
                  .order('created_at', { ascending: false })
                  .limit(15);

                if (notesErr) {
                  console.warn('[Sage RAG] Note Vault query warning:', notesErr.message);
                } else if (Array.isArray(noteRows) && noteRows.length > 0) {
                  const qLower = userQueryText.toLowerCase();
                  const terms = qLower
                    .replace(/[^a-z0-9\s]/g, ' ')
                    .split(/\s+/)
                    .filter((w) => w.length > 2);

                  const relevantNotes = (noteRows as any[])
                    .filter((n) => {
                      const hay = `${n.title || ''} ${n.chapter_name || ''} ${n.offering?.subject?.name || ''} ${n.offering?.class?.name || ''}`.toLowerCase();
                      return terms.length === 0 || terms.some((t) => hay.includes(t));
                    })
                    .slice(0, 3);

                  if (relevantNotes.length > 0) {
                    matchedChunks = relevantNotes.map((n) => ({
                      title: `${n.offering?.subject?.name || 'Subject'}: ${n.title}`,
                      category: 'notes',
                      content_chunk: `Note Vault Material — Subject: ${n.offering?.subject?.name || 'General'} (${n.offering?.class?.name || 'Grade 9-12'}), Chapter: "${n.chapter_name || 'General'}", Title: "${n.title}" (${String(n.file_type || 'pdf').toUpperCase()}).`,
                    }));
                  }
                }
              } catch (noteLookupErr: any) {
                console.warn('[Sage RAG] Note Vault fallback lookup warning:', noteLookupErr?.message);
              }
            }
          }

          // 3. Always fall back to verified institutional knowledge base if DB returned nothing
          if (matchedChunks.length === 0) {
            matchedChunks = searchFallbackKnowledgeBase(userQueryText, 3);
          }

          if (matchedChunks.length > 0) {
            ragContextPrompt = `\nRELEVANT INSTITUTIONAL KNOWLEDGE BASE & NOTE VAULT CONTEXT (RAG):
Authoritative reference materials retrieved for this inquiry:
${matchedChunks
  .map(
    (c, i) =>
      `--- [Document ${i + 1}: ${c.title} (${c.category || 'General'})] ---\n${c.content_chunk}`
  )
  .join('\n\n')}
Use this authoritative context when answering questions regarding academy policies, grading transmutation, note vault structure, and subject curricula.`;
          }
        } catch (ragErr: any) {
          console.warn(
            '[Sage RAG] Non-fatal RAG lookup error, continuing without notes:',
            ragErr?.message || String(ragErr)
          );
        }
      }

      const systemInstruction = `You are Sage, the intelligent, friendly, and expert AI study and academic companion built exclusively for Scholario & SHS Virtual Academy (FBISE and Sindh Board 9th-12th grade curricula: Mathematics, Physics, Chemistry, Biology, Computer Science, English, Urdu, Islamiat, and Pakistan Studies).

${roleDescription}
${pageContextPrompt}
${ragContextPrompt}

Key Guidelines:
1. **Be Concise & Direct by Default**: Keep answers short, direct, and to the point (typically 1-3 focused paragraphs or bullet points). Avoid conversational fluff or unnecessary preambles.
2. **Detailed Drafts on Request Only**: Provide comprehensive documents, full essay-length breakdowns, or complete circular notices ONLY when the user explicitly requests a "full draft", "complete notice", "complete document", "in-depth explanation", or similar.
3. **Format with Clean Markdown & Math-First KaTeX**:
   - Use standard Markdown with proper spacing (e.g. "**Q1.** What is..." with a space after bolding, NEVER unescaped or malformed raw tags).
   - For mathematics and numerical physics/chemistry derivations, prioritize clean KaTeX step-by-step equations ("$...$" inline and "$$...$$" display blocks) with minimal conversational wording and more maths.
   - ONLY wrap genuine mathematical or scientific formulas with "$formula$" or "$$equation$$" (e.g. "$E = mc^2$", "$v = u + at$").
   - NEVER wrap plain alphanumeric genetics notation (e.g. Tt, TT, tt, F1, F2), percentages (e.g. 0%, 25%, 50%, 75%, 100%), ratios (3:1, 9:3:3:1), or option letters (A, B, C, D) inside math delimiters. Keep them as normal text so they render in standard readable font.
4. **Complete Output for Quizzes & Tests**:
   - Number questions simply and cleanly as "1.", "2.", "3." (NEVER double-prefix like "Question Q1:" or "QQ1.").
   - For MCQs, provide options clearly labeled as:
     (A) Option text
     (B) Option text
     (C) Option text
     (D) Option text
   - Render all mathematical formulas (fractions, square roots, overlines for recurring decimals like $0.\overline{6}$, and sets like $\mathbb{R}$, $\mathbb{Z}$) in standard LaTeX math delimiters ($...$ or $$...$$).
   - Place all answers and detailed step-by-step solutions under a dedicated "## Answer Key and Step-by-Step Solutions" section at the end. In solutions, label each working step cleanly as "Step 1:", "Step 2:" (never labeling steps as Q1, Q2).
   - Do NOT include conversational filler, meta chatter, or print instructions (e.g. "Here is a complete quiz...", "Press Ctrl+P to save...") in the output.
5. **Multimodal Analysis**: When the user provides an image or PDF attachment, thoroughly inspect formulas, diagrams, handwritten workings, or document text, and ground your response directly in the attachment content.
6. **Curriculum Alignment**: Adhere to FBISE / Sindh Board high school & college syllabus standards. Break multi-step derivations or numerical problems into clear, numbered steps.
7. **Persona**: Friendly, supportive, sharp, and academic study companion for Scholario & SHS Virtual Academy.`;

      // Format conversation history for @google/genai with multimodal inlineData
      const contents = messages.map((m) => {
        const parts: any[] = [];
        if (m.content) {
          parts.push({ text: m.content });
        }
        if (m.attachment?.base64) {
          const cleanBase64 = m.attachment.base64.includes('base64,')
            ? m.attachment.base64.split('base64,')[1]
            : m.attachment.base64;
          const mimeType =
            m.attachment.mime_type ||
            (m.attachment.filename?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
          parts.push({
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          });
        }
        if (parts.length === 0) {
          parts.push({ text: ' ' });
        }
        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts,
        };
      });

      const rawEnvModel = (
        env?.GEMINI_MODEL ||
        (typeof process !== 'undefined' ? process.env?.GEMINI_MODEL : undefined) ||
        ''
      )
        .trim()
        .replace(/^models\//i, '');

      const candidateModels = Array.from(
        new Set([
          ...(rawEnvModel && rawEnvModel !== 'gemini-3.8-flash' ? [rawEnvModel] : []),
          ...SAGE_MODEL_FALLBACK_CHAIN,
        ])
      );

      const getThinkingConfig = (modelId: string) =>
        modelId.startsWith('gemini-3')
          ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
          : {};

      const runWithModel = async (modelId: string) => {
        let modelAnnounced = false;
        const announceModel = async () => {
          if (!modelAnnounced) {
            modelAnnounced = true;
            await writer.write(encoder.encode(`data: ${JSON.stringify({ model: modelId })}\n\n`));
          }
        };

        if (isAdmin && supabase) {
          let currentContents: any[] = [...contents];
          const maxTurns = 3;
          let turn = 0;
          let finalResponseSent = false;

          while (turn < maxTurns) {
            turn++;
            const genRes = await withModelTimeout(
              ai.models.generateContent({
                model: modelId,
                contents: currentContents,
                config: {
                  systemInstruction,
                  tools: [{ functionDeclarations: adminToolDeclarations }],
                  ...getThinkingConfig(modelId),
                },
              }),
              10000,
              modelId
            );

            if (genRes.functionCalls && genRes.functionCalls.length > 0) {
              const toolParts: any[] = [];
              for (const call of genRes.functionCalls) {
                const toolName = call.name || '';
                let data: any;
                try {
                  data = await executeAdminDataQuery(toolName, call.args || {}, supabase);
                } catch (toolErr: any) {
                  console.warn(`[Sage Admin Tool Warning] ${toolName}:`, toolErr?.message);
                  data = { error: 'Live database query unavailable for this tool right now.' };
                }
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
                await announceModel();
                const words = genRes.text.split(' ');
                for (let i = 0; i < words.length; i += 3) {
                  const chunk =
                    words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
                  await writer.write(
                    encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
                  );
                  await new Promise((r) => setTimeout(r, 15));
                }
                finalResponseSent = true;
              }
              break;
            }
          }

          if (!finalResponseSent) {
            const streamResponse = await withModelTimeout(
              ai.models.generateContentStream({
                model: modelId,
                contents: currentContents,
                config: {
                  systemInstruction,
                  ...getThinkingConfig(modelId),
                },
              }),
              10000,
              modelId
            );

            for await (const chunk of streamResponse) {
              const chunkText = chunk.text;
              if (chunkText) {
                await announceModel();
                await writer.write(
                  encoder.encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`)
                );
              }
            }
          }
        } else {
          // Standard streaming flow (Student, Teacher, or Admin when live DB variables aren't set)
          const streamResponse = await withModelTimeout(
            ai.models.generateContentStream({
              model: modelId,
              contents,
              config: {
                systemInstruction,
                ...getThinkingConfig(modelId),
              },
            }),
            10000,
            modelId
          );

          for await (const chunk of streamResponse) {
            const chunkText = chunk.text;
            if (chunkText) {
              await announceModel();
              await writer.write(
                encoder.encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`)
              );
            }
          }
        }
      };

      let lastErr: any = null;
      let succeeded = false;
      for (const modelId of candidateModels) {
        try {
          await runWithModel(modelId);
          succeeded = true;
          break;
        } catch (err: any) {
          lastErr = err;
          console.error('[Sage Chat] Model attempt failed:', {
            model: modelId,
            httpStatus: err?.status || err?.code || 'unknown',
            errorBody: err?.message || String(err),
          });
        }
      }

      if (!succeeded && lastErr) {
        throw lastErr;
      }

      await writer.write(encoder.encode('data: [DONE]\n\n'));
    } catch (err: any) {
      console.error('[Cloudflare Pages Sage Chat All Models Failed]:', {
        httpStatus: err?.status || err?.code || 'unknown',
        errorBody: err?.message || String(err),
      });
      const friendlyError = classifyGeminiError(err);
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ error: friendlyError })}\n\n`)
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
      Connection: 'keep-alive',
    },
  });
}
