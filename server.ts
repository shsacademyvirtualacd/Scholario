import express from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

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
  app.post('/api/tests/upload', upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const { title, instructions, subject, grade, stream = 'all', total_marks = '100', due_date, teacher_name } = req.body;

      if (!file || !title || !subject || !grade || !due_date) {
        return res.status(400).json({ error: 'Missing required parameters (file, title, subject, grade, due_date)' });
      }

      const testId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const mimeType = file.mimetype || (file.originalname.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

      fileStorage.set(testId, {
        buffer: file.buffer,
        mimeType,
        filename: file.originalname || 'test_paper.pdf',
      });

      const testRecord = {
        id: testId,
        title,
        instructions: instructions || null,
        subject,
        grade,
        stream,
        teacher_id: null,
        teacher_name: teacher_name || 'Faculty',
        file_url: `/api/tests/view/${testId}`,
        file_path: `tests/${grade}/${stream}/${subject}/${testId}_${file.originalname}`,
        file_type: mimeType.includes('image') ? 'image' : 'pdf',
        file_size_bytes: file.size,
        total_marks: parseInt(total_marks, 10) || 100,
        due_date,
        created_at: new Date().toISOString(),
      };

      return res.json({ success: true, test: testRecord });
    } catch (err: any) {
      console.error('[Dev Server Test Upload Error]', err);
      return res.status(500).json({ error: err.message || 'Test upload failed' });
    }
  });

  // ── Tests View ──────────────────────────────────────
  app.get('/api/tests/view/:testId', (req, res) => {
    const { testId } = req.params;
    const stored = fileStorage.get(testId);
    if (!stored) {
      // Return a basic sample response or 404
      return res.status(404).send('Test file not found');
    }
    res.setHeader('Content-Type', stored.mimeType);
    res.setHeader('Content-Length', stored.buffer.length);
    res.setHeader('Accept-Ranges', 'bytes');
    return res.send(stored.buffer);
  });

  // ── Tests Download ──────────────────────────────────
  app.get('/api/tests/dl/:testId', (req, res) => {
    const { testId } = req.params;
    const stored = fileStorage.get(testId);
    if (!stored) {
      return res.status(404).send('Test file not found');
    }
    res.setHeader('Content-Type', stored.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${stored.filename}"`);
    return res.send(stored.buffer);
  });

  // ── Tests Delete ────────────────────────────────────
  app.delete('/api/tests/del/:testId', (req, res) => {
    const { testId } = req.params;
    fileStorage.delete(testId);
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
        student_id: 'current_student',
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

      return res.json({ success: true, submission: subRecord });
    } catch (err: any) {
      console.error('[Dev Server Submission Upload Error]', err);
      return res.status(500).json({ error: err.message || 'Submission upload failed' });
    }
  });

  // ── Submissions View ────────────────────────────────
  app.get('/api/submissions/view/:submissionId', (req, res) => {
    const { submissionId } = req.params;
    const stored = fileStorage.get(submissionId);
    if (!stored) {
      return res.status(404).send('Submission file not found');
    }
    res.setHeader('Content-Type', stored.mimeType);
    res.setHeader('Content-Length', stored.buffer.length);
    res.setHeader('Accept-Ranges', 'bytes');
    return res.send(stored.buffer);
  });

  // ── Submissions Download ────────────────────────────
  app.get('/api/submissions/dl/:submissionId', (req, res) => {
    const { submissionId } = req.params;
    const stored = fileStorage.get(submissionId);
    if (!stored) {
      return res.status(404).send('Submission file not found');
    }
    res.setHeader('Content-Type', stored.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${stored.filename}"`);
    return res.send(stored.buffer);
  });

  // ── Submissions Grade ───────────────────────────────
  app.post('/api/submissions/grade', express.json(), (req, res) => {
    const { submission_id, marks_obtained, max_marks, teacher_feedback } = req.body;
    if (!submission_id) {
      return res.status(400).json({ error: 'Missing submission_id' });
    }
    return res.json({
      success: true,
      submission: {
        id: submission_id,
        status: 'graded',
        marks_obtained: marks_obtained !== undefined ? Number(marks_obtained) : null,
        max_marks: max_marks !== undefined ? Number(max_marks) : null,
        teacher_feedback: teacher_feedback || null,
        graded_at: new Date().toISOString(),
      },
    });
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
