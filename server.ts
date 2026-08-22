import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
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

      const targetModel = 'gemini-3.6-flash';
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
