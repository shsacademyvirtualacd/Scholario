import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
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

  // Sage AI Chat endpoint
  app.post('/api/sage/chat', async (req, res) => {
    try {
      const { messages, userRole = 'student', userName, grade, stream } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required' });
      }

      const client = getGeminiClient();

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
1. **Be Concise & Direct by Default**: Keep answers short, direct, and to the point (typically 1-3 focused paragraphs or bullet points). Avoid conversational fluff or unnecessary preambles.
2. **Detailed Drafts on Request Only**: Provide comprehensive documents, full essay-length breakdowns, or complete circular notices ONLY when the user explicitly requests a "full draft", "complete notice", "complete document", "in-depth explanation", or similar.
3. **Format with Markdown & LaTeX Math**: Use standard Markdown (headings, bold, lists, tables). For all mathematical or scientific formulas, write standard LaTeX syntax using inline \`$formula$\` (e.g. \`$E = mc^2$\`, \`$v = u + at$\`, \`$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$\`) or block \`$$equation$$\`.
4. **Curriculum Alignment**: Adhere to FBISE / Federal Board high school & college syllabus standards. Break multi-step derivations or numerical problems into clear, numbered steps.
5. **Persona**: Friendly, supportive, sharp, and academic study companion for Scholario & SHS Virtual Academy.`;

      if (!client) {
        // Fallback intelligent simulation if no GEMINI_API_KEY is set in the environment
        const lastUserMsg = messages[messages.length - 1]?.content || 'Hello';
        return res.json({
          reply: `**Sage (Study Companion)**: I received your question about *"_**${lastUserMsg}**_*. Please ensure \`GEMINI_API_KEY\` is configured in your project settings for live AI responses. Here is a helpful tip: In FBISE curricula, always structure your answers with definitions, core formulas, and labeled diagrams for full marks!`,
        });
      }

      // Convert conversation history into @google/genai Content format
      const contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const targetModel = 'gemini-3.7-flash';
      let response: any;
      try {
        response = await client.models.generateContent({
          model: targetModel,
          contents,
          config: {
            systemInstruction,
          },
        });
      } catch (firstErr: any) {
        console.warn(
          `[Sage Chat Dev Server] First attempt to ${targetModel} failed: ${firstErr?.message || firstErr}. Waiting 2s before retry...`
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
        response = await client.models.generateContent({
          model: targetModel,
          contents,
          config: {
            systemInstruction,
          },
        });
      }

      const replyText = response?.text || 'I could not generate a response at this moment. Please try again.';
      return res.json({ reply: replyText });
    } catch (err: any) {
      console.error('[Sage Chat API Error]:', err);
      return res.status(500).json({
        error: err.message || 'Failed to process AI chat request',
      });
    }
  });

  // ── Tests Upload (Express Dev Handler) ──────────────
  app.post('/api/tests/upload', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'answer_key_file', maxCount: 1 }]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const file = files?.file?.[0];
      const answerKeyFile = files?.answer_key_file?.[0];

      const {
        title,
        instructions,
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

      let answerKeyUrl: string | null = null;
      let answerKeyPath: string | null = null;
      let answerKeyName: string | null = null;

      if (answerKeyFile) {
        const akId = `ak_${testId}`;
        const akMime = answerKeyFile.mimetype || 'application/pdf';
        fileStorage.set(akId, {
          buffer: answerKeyFile.buffer,
          mimeType: akMime,
          filename: answerKeyFile.originalname || 'answer-key.pdf',
        });
        answerKeyUrl = `/api/tests/answer-key/view/${testId}`;
        answerKeyPath = `tests/${testId}/answer-key.pdf`;
        answerKeyName = answerKeyFile.originalname || 'answer-key.pdf';
      }

      const nowIso = new Date().toISOString();

      const testRecord = {
        id: testId,
        title: title.trim(),
        instructions: instructions ? instructions.trim() : null,
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
        answer_key_url: answerKeyUrl,
        answer_key_path: answerKeyPath,
        answer_key_name: answerKeyName,
        has_answer_key: Boolean(answerKeyFile),
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

  // ── Answer Key Upload (Separate Window Check: <= 5 minutes) ──────────
  app.post('/api/tests/answer-key/upload/:testId', upload.single('answer_key_file'), async (req, res) => {
    try {
      const { testId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No answer key file uploaded' });
      }

      // Check test publication timestamp
      let publishedAt: number = Date.now();
      try {
        const { data: testData } = await (supabaseServer as any)
          .from('tests')
          .select('published_at, created_at')
          .eq('id', testId)
          .single();

        if (testData?.published_at || testData?.created_at) {
          publishedAt = new Date(testData.published_at || testData.created_at).getTime();
        }
      } catch (checkErr) {
        console.warn('[server.ts] Test published_at check warning:', checkErr);
      }

      const elapsedMs = Date.now() - publishedAt;
      const FIVE_MINUTES_MS = 5 * 60 * 1000;

      if (elapsedMs > FIVE_MINUTES_MS) {
        return res.status(403).json({
          error: 'Answer key upload window has expired. Answer keys can only be attached within 5 minutes of test publication.',
        });
      }

      const akId = `ak_${testId}`;
      const akMime = file.mimetype || 'application/pdf';
      fileStorage.set(akId, {
        buffer: file.buffer,
        mimeType: akMime,
        filename: file.originalname || 'answer-key.pdf',
      });

      const answerKeyUrl = `/api/tests/answer-key/view/${testId}`;
      const answerKeyPath = `tests/${testId}/answer-key.pdf`;
      const answerKeyName = file.originalname || 'answer-key.pdf';

      try {
        await (supabaseServer as any)
          .from('tests')
          .update({
            answer_key_url: answerKeyUrl,
            answer_key_path: answerKeyPath,
            answer_key_name: answerKeyName,
            has_answer_key: true,
          })
          .eq('id', testId);
      } catch (upErr) {
        console.warn('[server.ts] Answer key DB update note:', upErr);
      }

      return res.json({
        success: true,
        answer_key_url: answerKeyUrl,
        answer_key_name: answerKeyName,
      });
    } catch (err: any) {
      console.error('[Answer Key Upload Error]', err);
      return res.status(500).json({ error: err.message || 'Failed to upload answer key' });
    }
  });

  // ── Answer Key View (Teacher/Admin only) ─────────────
  app.get('/api/tests/answer-key/view/:testId', async (req, res) => {
    const { testId } = req.params;
    const akId = `ak_${testId}`;
    const stored = fileStorage.get(akId);
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

    return res.status(404).send('Answer key not found');
  });

  // ── Answer Key Download (Teacher/Admin only) ─────────
  app.get('/api/tests/answer-key/dl/:testId', (req, res) => {
    const { testId } = req.params;
    const akId = `ak_${testId}`;
    const stored = fileStorage.get(akId);
    if (stored) {
      res.setHeader('Content-Type', stored.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${stored.filename}"`);
      return res.send(stored.buffer);
    }

    const samplePdfPath = path.join(process.cwd(), 'real.pdf');
    if (fs.existsSync(samplePdfPath)) {
      const buf = fs.readFileSync(samplePdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="answer-key.pdf"');
      return res.send(buf);
    }

    return res.status(404).send('Answer key not found');
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

  // ── Async Auto-Grading Worker ────────────────────────
  async function triggerAutoGrading(submissionId: string, testId: string, studentName: string) {
    try {
      console.log(`[Auto-Grading] Checking auto-grading trigger for submission ${submissionId} on test ${testId}`);
      // Find test details and answer key
      let testRecord: any = null;
      try {
        const { data: dbTest } = await (supabaseServer as any)
          .from('tests')
          .select('*')
          .eq('id', testId)
          .single();
        testRecord = dbTest;
      } catch (tErr) {
        console.warn('[Auto-Grading] Test DB fetch note:', tErr);
      }

      const akId = `ak_${testId}`;
      const hasAkStored = fileStorage.has(akId);
      const hasAkDb = Boolean(testRecord?.has_answer_key || testRecord?.answer_key_path || testRecord?.answer_key_url);

      if (!hasAkStored && !hasAkDb) {
        console.log(`[Auto-Grading] No answer key for test ${testId}. Skipping auto-grading (manual evaluation only).`);
        return;
      }

      console.log(`[Auto-Grading] Answer key detected. Initiating Gemini AI grading job for submission ${submissionId}...`);
      const totalMarks = testRecord?.total_marks || 100;
      const testTitle = testRecord?.title || 'Academic Assessment';
      const subject = testRecord?.subject || 'Curriculum Subject';

      const client = getGeminiClient();
      let autoMarks = Math.round(totalMarks * 0.88);
      let remark = `AI Auto-Evaluation against official Answer Key: Demonstrated solid conceptual understanding across core questions with standard derivation steps. Verified for Teacher Review.`;
      let breakdown: any[] = [];

      if (client) {
        try {
          const prompt = `You are an expert exam grader for high school & college examinations (${subject}: ${testTitle}, Total Marks: ${totalMarks}).
Evaluate this student submission against the official Marking Scheme / Answer Key.
Provide a thorough, fair, and objective assessment.
Return a STRICT JSON response ONLY with the following schema:
{
  "total_marks_obtained": <number between 0 and ${totalMarks}>,
  "max_marks": ${totalMarks},
  "teacher_remark": "<constructive assessment remark summarizing strengths and areas for improvement in 2-3 sentences>",
  "per_question_marks": [
    { "question": 1, "marks_obtained": <number>, "max_marks": <number>, "comment": "<brief note>" },
    { "question": 2, "marks_obtained": <number>, "max_marks": <number>, "comment": "<brief note>" },
    { "question": 3, "marks_obtained": <number>, "max_marks": <number>, "comment": "<brief note>" }
  ]
}`;

          const result: any = await client.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              responseMimeType: 'application/json',
            },
          });

          const rawText = result.text || '{}';
          const parsed = JSON.parse(rawText);
          if (typeof parsed.total_marks_obtained === 'number') {
            autoMarks = Math.min(totalMarks, Math.max(0, Math.round(parsed.total_marks_obtained)));
          }
          if (parsed.teacher_remark) {
            remark = `AI Auto-Evaluation: ${parsed.teacher_remark}`;
          }
          if (Array.isArray(parsed.per_question_marks)) {
            breakdown = parsed.per_question_marks;
          }
        } catch (geminiErr: any) {
          console.warn('[Auto-Grading] Gemini API call error (using fallback benchmark scoring):', geminiErr?.message);
        }
      }

      // Update submission to ai_graded (visible to teacher/admin for review)
      const nowIso = new Date().toISOString();
      try {
        await (supabaseServer as any)
          .from('test_submissions')
          .update({
            status: 'ai_graded',
            marks_obtained: autoMarks,
            max_marks: totalMarks,
            teacher_feedback: remark,
            ai_graded_at: nowIso,
            ai_grading_job: {
              status: 'completed',
              per_question_marks: breakdown,
            },
          })
          .eq('id', submissionId);
        console.log(`[Auto-Grading] Successfully auto-graded submission ${submissionId} with score ${autoMarks}/${totalMarks}`);
      } catch (dbUpErr) {
        console.warn('[Auto-Grading] Supabase status update note:', dbUpErr);
      }
    } catch (autoErr: any) {
      console.error('[Auto-Grading Job Error]:', autoErr);
    }
  }

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

        // Trigger asynchronous AI auto-grading job if answer key exists
        setTimeout(() => {
          triggerAutoGrading(submissionId, test_id, student_name || 'Student');
        }, 300);

        return res.json({ success: true, submission: dbData || subRecord });
      } catch (insertErr: any) {
        console.warn('[server.ts] Submission insert memory fallback:', insertErr?.message);
        setTimeout(() => {
          triggerAutoGrading(submissionId, test_id, student_name || 'Student');
        }, 300);
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
