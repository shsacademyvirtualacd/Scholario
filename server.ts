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
1. Provide accurate, clear, and structured explanations suitable for high school & college level (FBISE / Federal Board standard).
2. Format responses with clean Markdown: use bolding, bullet points, and code blocks or LaTeX-like equations where appropriate.
3. Be encouraging, patient, and concise. Break complex formulas or multi-step derivations into digestible steps.
4. When asked for study tips or note summaries, structure them with key concepts, definitions, formulas, and common exam pitfalls.
5. If the user asks who you are, introduce yourself as Sage, the AI academic study companion for Scholario & SHS Virtual Academy.`;

      if (!client) {
        // Fallback intelligent simulation if GEMINI_API_KEY is not set in the environment
        const lastUserMsg = messages[messages.length - 1]?.content || 'Hello';
        return res.json({
          reply: `**Sage (Study Companion)**: I received your question about *"_**${lastUserMsg}**_*. Please ensure the \`GEMINI_API_KEY\` is configured in your project settings for live AI responses. Here is a helpful tip: In FBISE curricula, always structure your answers with definitions, core formulas, and labeled diagrams for full marks!`,
        });
      }

      // Convert conversation history into @google/genai Content format
      const contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const response = await client.models.generateContent({
        model: 'gemini-3.7-flash',
        contents,
        config: {
          systemInstruction,
        },
      });

      const replyText = response.text || 'I could not generate a response at this moment. Please try again.';
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
