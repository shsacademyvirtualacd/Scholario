/**
 * Structured Quiz & Assessment Data Representation & Parsing Engine
 *
 * Guarantees:
 * 1. Strict separation of Questions from Answers.
 *    The Student Copy data model receives `answers: []` (zero answers or solutions in data).
 * 2. Complete stripping of chat conversational chatter ("Here is a complete...", "You can save this as PDF...").
 * 3. Clean question numbering ("1.", "2.", no doubled "Question Q1:" or "QQ6.").
 * 4. Proper solution step formatting ("Step 1", "Step 2", never labeled as questions).
 * 5. Preservation and normalization of LaTeX formulas for KaTeX rendering.
 */

export interface QuizOptionSet {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface QuizQuestion {
  number: string;
  text: string;
  marks?: number;
  type: 'mcq' | 'short' | 'long' | 'descriptive';
  options?: QuizOptionSet;
}

export interface QuizSection {
  name: string;
  instructions?: string;
  marks?: number;
  questions: QuizQuestion[];
}

export interface QuizAnswerItem {
  questionNumber: string;
  answer: string;
  explanation?: string;
  steps?: string[];
}

export interface StructuredQuiz {
  title: string;
  subject: string;
  grade: string;
  totalMarks?: number;
  timeAllowed?: string;
  instructor?: string;
  date?: string;
  instructions?: string[];
  sections: QuizSection[];
  answers: QuizAnswerItem[];
}

/**
 * Filter out AI conversational intro/outro lines and markdown divider artifacts
 */
export function stripConversationalChatter(rawText: string): string {
  if (!rawText) return '';
  const lines = rawText.split('\n');
  const cleaned: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Strip markdown dividers (---, ***, ___)
    if (/^(\-{3,}|\_{3,}|\*{3,})$/.test(trimmed)) {
      continue;
    }

    // Strip chat chatter intro/outro
    if (
      /^(here\s+(is|are)\s+(a\s+)?(complete|printable|formatted|sample|standard|practice|prepared)|you\s+can\s+(easily\s+)?(save|print|download)|press\s+ctrl\s*\+\s*p|best\s+of\s+luck|good\s+luck|feel\s+free\s+to|let\s+me\s+know\s+if|hope\s+this\s+helps|i\s+have\s+prepared|designed\s+for\s+(fbise|sindh)|created\s+by\s+sage|note\s*:|instructions\s*for\s*student|ready\s+to\s+download)/i.test(
        trimmed
      )
    ) {
      continue;
    }

    cleaned.push(line);
  }

  return cleaned.join('\n');
}

/**
 * Clean question numbering string to a simple integer or identifier:
 * "Question Q1:" -> "1"
 * "QQ6." -> "6"
 * "Q3." -> "3"
 * "4." -> "4"
 */
export function sanitizeQuestionNumber(rawNum: string, fallbackIdx: number): string {
  if (!rawNum) return String(fallbackIdx);
  // Match first consecutive digits
  const match = rawNum.match(/([0-9]+)/);
  if (match) return match[1];
  return rawNum.replace(/[^0-9a-zA-Z]/g, '').trim() || String(fallbackIdx);
}

/**
 * Attempts to parse raw input if it contains a JSON structured quiz
 */
export function tryParseQuizJson(content: string): StructuredQuiz | null {
  if (!content) return null;
  let jsonString = '';

  const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch && jsonBlockMatch[1].includes('{') && jsonBlockMatch[1].includes('sections')) {
    jsonString = jsonBlockMatch[1].trim();
  } else if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
    jsonString = content.trim();
  }

  if (jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
        return {
          title: parsed.title || 'Academic Assessment & Practice Test',
          subject: parsed.subject || 'Academic Assessment',
          grade: parsed.grade || 'Grade 9-12',
          totalMarks: parsed.totalMarks || 20,
          timeAllowed: parsed.timeAllowed || '45 Minutes',
          instructor: parsed.instructor || 'Faculty Mentor',
          date: parsed.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          instructions: parsed.instructions || ['All questions are compulsory.', 'Use standard academic notation.'],
          sections: parsed.sections.map((sec: any, sIdx: number) => ({
            name: sec.name || `Section ${String.fromCharCode(65 + sIdx)}`,
            instructions: sec.instructions,
            marks: sec.marks,
            questions: (sec.questions || []).map((q: any, qIdx: number) => ({
              number: sanitizeQuestionNumber(String(q.number || qIdx + 1), qIdx + 1),
              text: q.text || '',
              marks: q.marks || (q.type === 'mcq' ? 1 : 2),
              type: q.type || (q.options ? 'mcq' : 'short'),
              options: q.options ? {
                A: q.options.A || '',
                B: q.options.B || '',
                C: q.options.C || '',
                D: q.options.D || '',
              } : undefined,
            })),
          })),
          answers: Array.isArray(parsed.answers)
            ? parsed.answers.map((a: any, aIdx: number) => ({
                questionNumber: sanitizeQuestionNumber(String(a.questionNumber || aIdx + 1), aIdx + 1),
                answer: a.answer || '',
                explanation: a.explanation,
                steps: Array.isArray(a.steps) ? a.steps : undefined,
              }))
            : [],
        };
      }
    } catch {
      // Graceful fallback to markdown parser
    }
  }

  return null;
}

/**
 * Universal quiz parser: Checks for JSON first, then parses markdown.
 */
export function parseQuizJsonOrMarkdown(
  rawContent: string,
  meta?: {
    subject?: string;
    className?: string;
    topic?: string;
    teacherName?: string;
    date?: string;
  }
): StructuredQuiz {
  const jsonResult = tryParseQuizJson(rawContent);
  if (jsonResult) {
    if (meta?.subject && jsonResult.subject === 'Academic Assessment') jsonResult.subject = meta.subject;
    if (meta?.className && jsonResult.grade === 'Grade 9-12') jsonResult.grade = meta.className;
    if (meta?.topic && jsonResult.title.includes('Academic Assessment')) jsonResult.title = meta.topic;
    if (meta?.teacherName) jsonResult.instructor = meta.teacherName;
    return jsonResult;
  }

  return parseMarkdownToStructuredQuiz(rawContent, meta);
}

/**
 * Parse markdown quiz text into a pristine StructuredQuiz object
 */
export function parseMarkdownToStructuredQuiz(
  rawContent: string,
  meta?: {
    subject?: string;
    className?: string;
    topic?: string;
    teacherName?: string;
    date?: string;
  }
): StructuredQuiz {
  const content = stripConversationalChatter(rawContent);
  const lines = content.split('\n');

  // Extract metadata
  let title = meta?.topic || '';
  let subject = meta?.subject || '';
  let grade = meta?.className || 'Grade 9-12';
  let totalMarks = 0;
  let timeAllowed = '45 Minutes';
  const instructions: string[] = [
    'All questions are compulsory.',
    'Use standard academic notation and show step-by-step working for mathematical derivations.',
  ];

  // Detect subject and title from first headings if not provided
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const l = lines[i].trim();
    if (!title && /^#+\s*(.+)$/.test(l)) {
      title = l.replace(/^#+\s*/, '').replace(/\*+/g, '').trim();
    }
    const marksMatch = l.match(/total\s*marks?[:\-\s]*([0-9]+)/i);
    if (marksMatch) {
      totalMarks = parseInt(marksMatch[1], 10);
    }
    const timeMatch = l.match(/time\s*(?:allowed)?[:\-\s]*([0-9]+\s*(?:mins?|minutes?|hours?|hrs?))/i);
    if (timeMatch) {
      timeAllowed = timeMatch[1];
    }
  }

  if (!title) {
    title = 'Academic Assessment & Practice Test';
  }
  if (!subject) {
    if (/math/i.test(title) || /real\s*numbers|algebra|geometry|calculus/i.test(content)) subject = 'Mathematics';
    else if (/physics/i.test(title) || /motion|velocity|force|newton/i.test(content)) subject = 'Physics';
    else if (/chemistry/i.test(title) || /acid|base|reaction|mole/i.test(content)) subject = 'Chemistry';
    else if (/biology/i.test(title) || /cell|genetics|dna|plant/i.test(content)) subject = 'Biology';
    else subject = 'Academic Assessment';
  }

  const sections: QuizSection[] = [];
  const answers: QuizAnswerItem[] = [];

  let currentSection: QuizSection = {
    name: 'Section A: Multiple Choice Questions',
    questions: [],
  };

  let inAnswerSection = false;
  let currentQuestionCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) continue;

    // Detect Answer Key / Solutions header
    if (
      /^(?:#+|\*{2,}|_)?\s*(?:answer\s*key|marking\s*scheme|solutions?|step-by-step\s*solutions?|answers?\s*(?:and|&)\s*solutions?|official\s*solutions?)/i.test(
        line
      )
    ) {
      inAnswerSection = true;
      continue;
    }

    if (inAnswerSection) {
      // Parsing Answer / Solution line
      // e.g. "1. (B) Explanation..." or "Q1. Ans: B" or "Step 1: ..."
      const ansMatch = line.match(/^(?:Q\s*)?([0-9]+)[.:)]\s*(?:ans(?:wer)?:?)?\s*(.*)$/i);
      if (ansMatch) {
        const qNum = ansMatch[1];
        let rest = ansMatch[2].trim();
        let directAns = '';
        let explanation = '';
        const steps: string[] = [];

        // Check if starts with option letter like "(B)" or "B" or formula
        const optLetterMatch = rest.match(/^\(?([A-Da-d])\)?\s*[\-:]?\s*(.*)$/);
        if (optLetterMatch) {
          directAns = optLetterMatch[1].toUpperCase();
          explanation = optLetterMatch[2].trim();
        } else {
          directAns = rest;
        }

        // Lookahead for step-by-step lines
        let look = i + 1;
        while (look < lines.length) {
          const nxt = lines[look].trim();
          if (!nxt) {
            look++;
            continue;
          }
          if (
            /^(?:Q\s*)?[0-9]+[.:)]/i.test(nxt) ||
            /^(?:#+|\*{2,})\s*(?:section|part)/i.test(nxt)
          ) {
            break;
          }
          if (/^(?:step\s*[0-9]+|solution|explanation|reason|method):?/i.test(nxt)) {
            // Clean Step label (never label step as Q1)
            steps.push(nxt.replace(/^(?:Q\s*[0-9]+[.:)]\s*)+/i, ''));
          } else {
            steps.push(nxt);
          }
          look++;
        }
        i = look - 1;

        answers.push({
          questionNumber: qNum,
          answer: directAns,
          explanation: explanation || undefined,
          steps: steps.length > 0 ? steps : undefined,
        });
        continue;
      }

      // Check for standalone step line
      if (/^(?:step\s*[0-9]+|case\s*[0-9]+|method):?/i.test(line)) {
        if (answers.length > 0) {
          const lastAns = answers[answers.length - 1];
          if (!lastAns.steps) lastAns.steps = [];
          lastAns.steps.push(line.replace(/^(?:Q\s*[0-9]+[.:)]\s*)+/i, ''));
        }
        continue;
      }

      continue;
    }

    // Detect Section Header (e.g. "# Section B: Short Questions" or "**Section A: MCQs**")
    const sectionMatch = line.match(/^(?:#+|\*{2,})?\s*(section\s+[A-Za-z]|part\s+[A-Za-z0-9]+|short\s*questions?|long\s*questions?|descriptive\s*questions?|multiple\s*choice\s*questions?|mcqs?)(.*)$/i);
    if (sectionMatch && !line.includes('?') && line.length < 90) {
      if (currentSection.questions.length > 0) {
        sections.push(currentSection);
      }
      const sectionName = (sectionMatch[1] + (sectionMatch[2] || '')).replace(/[#*]/g, '').trim();
      currentSection = {
        name: sectionName,
        questions: [],
      };
      continue;
    }

    // Detect Question (MCQ or Standard)
    // Matches "1.", "Q1.", "Question 1:", "QQ1.", "**1.**", "1)"
    const qMatch = line.match(/^(?:(?:\*{1,2})?(?:question\s*)?(?:Q\s*)*([0-9]+)[.:)]?(?:\*{1,2})?[:\-\s]*)(.*)$/i);
    if (qMatch && !inAnswerSection) {
      const qNum = sanitizeQuestionNumber(qMatch[1], currentQuestionCounter);
      let qText = qMatch[2].replace(/^[:\-\s]+/, '').trim();

      // Check if question text has options embedded or on subsequent lines
      let lookahead = i + 1;
      const options: QuizOptionSet = { A: '', B: '', C: '', D: '' };
      let hasOptions = false;

      while (lookahead < lines.length && lookahead <= i + 6) {
        const nextLine = lines[lookahead].trim();
        if (!nextLine) {
          lookahead++;
          continue;
        }

        // Break if next line is a new question or section or answers
        if (
          /^(?:(?:\*{1,2})?(?:question\s*)?(?:Q\s*)+[0-9]+[.:)])/i.test(nextLine) ||
          /^(?:#+|\*{2,})\s*(?:section|answer|marking)/i.test(nextLine)
        ) {
          break;
        }

        // Match option line: e.g. "(A) 5" or "A. \sqrt{7}" or "(A) 1/2 (B) 3/4"
        const inlineOpts = nextLine.match(/\(?([A-Da-d])[\).:\-]\s*([^\(]+)(?=\([A-Da-d]\)|$)/g);
        if (inlineOpts && inlineOpts.length >= 1) {
          for (const optStr of inlineOpts) {
            const m = optStr.trim().match(/^\(?([A-Da-d])[\).:\-]\s*(.*)$/);
            if (m) {
              const letter = m[1].toUpperCase() as keyof QuizOptionSet;
              options[letter] = m[2].trim();
              hasOptions = true;
            }
          }
          lookahead++;
        } else {
          const singleOpt = nextLine.match(/^\(?([A-Da-d])[\).:\-]\s*(.*)$/);
          if (singleOpt) {
            const letter = singleOpt[1].toUpperCase() as keyof QuizOptionSet;
            options[letter] = singleOpt[2].trim();
            hasOptions = true;
            lookahead++;
          } else {
            break;
          }
        }
      }

      if (hasOptions) {
        i = lookahead - 1;
        currentSection.questions.push({
          number: qNum,
          text: qText,
          marks: 1,
          type: 'mcq',
          options,
        });
      } else {
        // Short / descriptive question
        currentSection.questions.push({
          number: qNum,
          text: qText,
          type: /long|detailed|essay|derive/i.test(currentSection.name) ? 'long' : 'short',
        });
      }

      currentQuestionCounter++;
      continue;
    }
  }

  if (currentSection.questions.length > 0) {
    sections.push(currentSection);
  }

  // Calculate default total marks if 0
  if (totalMarks === 0) {
    let computed = 0;
    for (const sec of sections) {
      for (const q of sec.questions) {
        computed += q.type === 'mcq' ? 1 : q.type === 'long' ? 5 : 2;
      }
    }
    totalMarks = computed || 20;
  }

  return {
    title,
    subject,
    grade,
    totalMarks,
    timeAllowed,
    instructor: meta?.teacherName || 'Faculty Mentor',
    date: meta?.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    instructions,
    sections,
    answers,
  };
}

/**
 * Returns strict Student Copy of quiz data (answers is completely empty).
 */
export function sanitizeQuizForStudent(quiz: StructuredQuiz): StructuredQuiz {
  return {
    ...quiz,
    answers: [], // Zero answers in student data structure!
  };
}
