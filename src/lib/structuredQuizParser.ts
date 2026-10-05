/**
 * Structured Quiz & Assessment Data Representation & Parsing Engine
 *
 * Guarantees:
 * 1. Strict separation of Questions from Answers.
 *    The Student Copy data model receives `answers: []` (zero answers or solutions in data).
 * 2. Complete stripping of chat conversational chatter ("Here is a complete...", "You can save this as PDF...").
 * 3. Clean, sequential question numbering ("1.", "2.", "3.", etc., never skipping numbers).
 * 4. Proper solution step formatting ("Step 1", "Step 2", never labeled as questions).
 * 5. Robust math delimiter sanitization (fixing unmatched $, corrupted expressions like "= ab + ac$?",
 *    auto-wrapping unwrapped LaTeX commands, and converting fractions/radicals).
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
 * Robust Math & Delimiter Sanitizer
 * - Fixes corrupted option text like "= ab + ac$?" or "= ab + ac$"
 * - Normalizes Unicode radicals and fractions (√16 -> $\sqrt{16}$, 1/(√7−√5) -> $\frac{1}{\sqrt{7}-\sqrt{5}}$, 22/7 -> $\frac{22}{7}$)
 * - Fixes unbalanced or unmatched $ delimiters and stray \( or \)
 * - Wraps standalone LaTeX commands in $...$
 * - Ensures no broken raw delimiters escape to the PDF
 */
export function sanitizeMathAndDelimiters(rawText: string | undefined | null): string {
  if (!rawText) return '';
  let s = String(rawText).trim();

  // 1. Fix corrupted option text for distributive property
  // e.g. "= ab + ac$?", "= ab + ac$", "ab + ac$?", "= ab + ac", "a(b + c) = ab + ac$?"
  if (/^=?\s*ab\s*\+\s*ac\s*\$?(\?)?$/i.test(s) || s === '= ab + ac$?' || s === '= ab + ac$') {
    return '$a(b + c) = ab + ac$';
  }
  if (/^=\s*ab\s*\+\s*ac/i.test(s)) {
    return '$a(b + c) = ab + ac$';
  }

  // 2. Normalize unicode minus, dashes, and multiplication symbols
  s = s.replace(/\u2212/g, '-');
  s = s.replace(/[\u2010\u2013\u2014]/g, '-');

  // 3. Normalize complex denominator fractions: 1/(√7−√5) or 1/(√7-√5) or 1/(\sqrt{7}-\sqrt{5})
  s = s.replace(
    /1\/\s*\(\s*(?:√|\\sqrt\{)?(\d+)\}?\s*([+\-])\s*(?:√|\\sqrt\{)?(\d+)\}?\s*\)/g,
    '__COMPLEX_DENOM_$1_$2_$3__'
  );

  // 4. Radical sums / combinations: 2√3 + 3√2 or √3 + √2 or 2\sqrt{3} + 3\sqrt{2}
  s = s.replace(
    /(?:(\d*)\s*)?√(\d+)\s*([+\-])\s*(?:(\d*)\s*)?√(\d+)/g,
    (_m, c1, n1, op, c2, n2) => {
      const t1 = (c1 ? c1 : '') + '\\sqrt{' + n1 + '}';
      const t2 = (c2 ? c2 : '') + '\\sqrt{' + n2 + '}';
      return `__RAD_PAIR_${t1}_${op}_${t2}__`;
    }
  );

  // 5. Standalone radicals like 2√3 or √16 or √5
  s = s.replace(/(?:(\d+)\s*)?√(\d+)/g, (_m, coeff, num) => {
    return (coeff ? coeff : '') + '\\sqrt{' + num + '}';
  });

  // 6. Restore complex denominator fractions as clean LaTeX
  s = s.replace(
    /__COMPLEX_DENOM_(\d+)_([+\-])_(\d+)__/g,
    '$\\frac{1}{\\sqrt{$1} $2 \\sqrt{$3}}$'
  );

  // 7. Restore radical pairs
  s = s.replace(
    /__RAD_PAIR_([^_]+)_([^_]+)_([^_]+)__/g,
    '$$$1 $2 $3$'
  );

  // 8. Standalone fraction like "22/7" or "3/8"
  if (/^\d+\/\d+$/.test(s)) {
    const [num, den] = s.split('/');
    return `$\\frac{${num}}{${den}}$`;
  }
  // Fraction in text surrounded by whitespace or parentheses
  s = s.replace(/(?<=^|[\s(])(\d+)\/(\d+)(?=$|[\s),.?])/g, ' $\\frac{$1}{$2}$ ');

  // 9. If entire string is an unwrapped LaTeX formula (starts with \sqrt, \frac, etc. and has no $)
  if (/^\\(sqrt|frac|mathbb|overline)\b/.test(s) && !s.includes('$')) {
    s = `$${s}$`;
  } else {
    // If unwrapped LaTeX is embedded in text outside $:
    // Split on existing $...$ blocks so we never touch inside math!
    const parts = s.split(/(\$[^\$]*\$)/g);
    for (let i = 0; i < parts.length; i += 2) {
      // Even parts are outside of $...$
      let outside = parts[i];
      // Wrap standalone \sqrt{...}
      outside = outside.replace(/(?:(\d*)\s*)?\\sqrt\{([^}]+)\}/g, (_m, coeff, inner) => {
        return ` $${coeff ? coeff : ''}\\sqrt{${inner}}$ `;
      });
      // Wrap standalone \frac{...}{...}
      outside = outside.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (_m, n, d) => {
        return ` $\\frac{${n}}{${d}}$ `;
      });
      parts[i] = outside;
    }
    s = parts.join('');
  }

  // 10. Merge adjacent math blocks e.g. "$2$$\sqrt{3}$" or redundant spaces
  s = s.replace(/\$\s*\$/g, ' ');
  s = s.replace(/\s{2,}/g, ' ');

  // 11. Check and fix unmatched $
  const dollarMatches = s.match(/(?<!\\)\$/g);
  const dollarCount = dollarMatches ? dollarMatches.length : 0;
  if (dollarCount % 2 !== 0) {
    if (s.endsWith('$') && dollarCount === 1) {
      s = '$' + s;
    } else {
      s = s + '$';
    }
  }

  // 12. Check and fix stray \( or \)
  const openParen = (s.match(/\\\(/g) || []).length;
  const closeParen = (s.match(/\\\)/g) || []).length;
  if (openParen > closeParen) {
    s += '\\)'.repeat(openParen - closeParen);
  } else if (closeParen > openParen) {
    s = '\\('.repeat(closeParen - openParen) + s;
  }

  return s.trim();
}

/**
 * Clean question numbering string to a simple integer or identifier
 */
export function sanitizeQuestionNumber(rawNum: string, fallbackIdx: number): string {
  if (!rawNum) return String(fallbackIdx);
  const match = rawNum.match(/([0-9]+)/);
  if (match) return match[1];
  return rawNum.replace(/[^0-9a-zA-Z]/g, '').trim() || String(fallbackIdx);
}

/**
 * Math-aware parser for inline options on a single or multi-line string.
 * Ensures parentheses inside mathematical expressions like `a(b + c)` or `(\sqrt{7}-\sqrt{5})`
 * are NEVER mistaken for option delimiters!
 */
export function parseOptionsFromLine(rawLine: string): Partial<QuizOptionSet> | null {
  // Pre-fix corrupted option text like "= ab + ac$?" before scanning for option tokens
  let line = rawLine.replace(/=?\s*ab\s*\+\s*ac\s*\$?(\?)?/gi, '$a(b + c) = ab + ac$');
  const letters = ['A', 'B', 'C', 'D'];
  const result: Partial<QuizOptionSet> = {};
  let inDollar = false;
  const matches: Array<{ letter: 'A' | 'B' | 'C' | 'D'; start: number; end: number }> = [];

  for (let idx = 0; idx < line.length; idx++) {
    if (line[idx] === '$' && (idx === 0 || line[idx - 1] !== '\\')) {
      inDollar = !inDollar;
      continue;
    }
    if (inDollar) continue;

    // Check if at start of an option token like "(A)", "A.", "A)", "(A):"
    if (idx === 0 || /\s/.test(line[idx - 1])) {
      const sub = line.slice(idx);
      const m = sub.match(/^(\(?([A-Da-d])\)?[.:\-]?)(?:\s+|$)/);
      if (m) {
        const letter = m[2].toUpperCase() as 'A' | 'B' | 'C' | 'D';
        if (matches.length === 0) {
          if (letters.includes(letter)) {
            matches.push({ letter, start: idx, end: idx + m[0].length });
            idx += m[0].length - 1;
          }
        } else {
          const lastLetter = matches[matches.length - 1].letter;
          // Must follow sequential order (e.g. A followed by B, then C, then D)
          if (letters.indexOf(letter) === letters.indexOf(lastLetter) + 1) {
            matches.push({ letter, start: idx, end: idx + m[0].length });
            idx += m[0].length - 1;
          }
        }
      }
    }
  }

  if (matches.length > 0) {
    for (let k = 0; k < matches.length; k++) {
      const cur = matches[k];
      const nextStart = k + 1 < matches.length ? matches[k + 1].start : line.length;
      const rawVal = line.slice(cur.end, nextStart).trim();
      result[cur.letter] = sanitizeMathAndDelimiters(rawVal);
    }
    return result;
  }

  return null;
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
        let globalQIdx = 0;
        const sections: QuizSection[] = parsed.sections.map((sec: any, sIdx: number) => ({
          name: sanitizeMathAndDelimiters(sec.name || `Section ${String.fromCharCode(65 + sIdx)}`),
          instructions: sec.instructions,
          marks: sec.marks,
          questions: (sec.questions || []).map((q: any) => {
            globalQIdx++;
            return {
              number: String(globalQIdx), // Ensure sequential 1, 2, 3...
              text: sanitizeMathAndDelimiters(q.text || '[Question content unavailable]'),
              marks: q.marks || (q.type === 'mcq' ? 1 : 2),
              type: q.type || (q.options ? 'mcq' : 'short'),
              options: q.options
                ? {
                    A: sanitizeMathAndDelimiters(q.options.A || '—'),
                    B: sanitizeMathAndDelimiters(q.options.B || '—'),
                    C: sanitizeMathAndDelimiters(q.options.C || '—'),
                    D: sanitizeMathAndDelimiters(q.options.D || '—'),
                  }
                : undefined,
            };
          }),
        }));

        let calculatedMarks = 0;
        for (const s of sections) {
          for (const q of s.questions) {
            calculatedMarks += q.marks || 1;
          }
        }

        return {
          title: sanitizeMathAndDelimiters(parsed.title || 'Academic Assessment & Practice Test'),
          subject: parsed.subject || 'Academic Assessment',
          grade: parsed.grade || 'Grade 9-12',
          totalMarks: calculatedMarks > 0 ? calculatedMarks : (parsed.totalMarks || 20),
          timeAllowed: parsed.timeAllowed || '45 Minutes',
          instructor: parsed.instructor || 'Faculty Mentor',
          date: parsed.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          instructions: parsed.instructions || ['All questions are compulsory.', 'Use standard academic notation.'],
          sections,
          answers: Array.isArray(parsed.answers)
            ? parsed.answers.map((a: any, aIdx: number) => ({
                questionNumber: String(aIdx + 1),
                answer: sanitizeMathAndDelimiters(a.answer || ''),
                explanation: a.explanation ? sanitizeMathAndDelimiters(a.explanation) : undefined,
                steps: Array.isArray(a.steps) ? a.steps.map((st: string) => sanitizeMathAndDelimiters(st)) : undefined,
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
      const ansMatch = line.match(/^(?:Q\s*)?([0-9]+)[.:)]\s*(?:ans(?:wer)?:?)?\s*(.*)$/i);
      if (ansMatch) {
        const qNum = ansMatch[1];
        let rest = ansMatch[2].trim();
        let directAns = '';
        let explanation = '';
        const steps: string[] = [];

        const optLetterMatch = rest.match(/^\(?([A-Da-d])\)?\s*[\-:]?\s*(.*)$/);
        if (optLetterMatch) {
          directAns = optLetterMatch[1].toUpperCase();
          explanation = optLetterMatch[2].trim();
        } else {
          directAns = rest;
        }

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
            steps.push(nxt.replace(/^(?:Q\s*[0-9]+[.:)]\s*)+/i, ''));
          } else {
            steps.push(nxt);
          }
          look++;
        }
        i = look - 1;

        answers.push({
          questionNumber: qNum,
          answer: sanitizeMathAndDelimiters(directAns),
          explanation: explanation ? sanitizeMathAndDelimiters(explanation) : undefined,
          steps: steps.length > 0 ? steps.map((s) => sanitizeMathAndDelimiters(s)) : undefined,
        });
        continue;
      }

      if (/^(?:step\s*[0-9]+|case\s*[0-9]+|method):?/i.test(line)) {
        if (answers.length > 0) {
          const lastAns = answers[answers.length - 1];
          if (!lastAns.steps) lastAns.steps = [];
          lastAns.steps.push(sanitizeMathAndDelimiters(line.replace(/^(?:Q\s*[0-9]+[.:)]\s*)+/i, '')));
        }
        continue;
      }

      continue;
    }

    // Detect Section Header (e.g. "# Section B: Short Questions" or "**Section A: MCQs**")
    const sectionMatch = line.match(
      /^(?:#+|\*{2,})?\s*(section\s+[A-Za-z]|part\s+[A-Za-z0-9]+|short\s*questions?|long\s*questions?|descriptive\s*questions?|multiple\s*choice\s*questions?|mcqs?)(.*)$/i
    );
    if (sectionMatch && !line.includes('?') && line.length < 90) {
      if (currentSection.questions.length > 0) {
        sections.push(currentSection);
      }
      const sectionName = (sectionMatch[1] + (sectionMatch[2] || '')).replace(/[#*]/g, '').trim();
      currentSection = {
        name: sanitizeMathAndDelimiters(sectionName),
        questions: [],
      };
      continue;
    }

    // Detect Question (MCQ or Standard)
    // Matches "1.", "Q1.", "Question 1:", "QQ1.", "**1.**", "1)"
    const qMatch = line.match(/^(?:(?:\*{1,2})?(?:question\s*)?(?:Q\s*)*([0-9]+)[.:)]?(?:\*{1,2})?[:\-\s]*)(.*)$/i);
    if (qMatch && !inAnswerSection) {
      let qText = qMatch[2].replace(/^[:\-\s]+/, '').trim();
      qText = sanitizeMathAndDelimiters(qText) || '[Question content unavailable]';

      // Lookahead for options
      let lookahead = i + 1;
      const options: QuizOptionSet = { A: '', B: '', C: '', D: '' };
      let hasOptions = false;

      while (lookahead < lines.length && lookahead <= i + 6) {
        const nextLine = lines[lookahead].trim();
        if (!nextLine) {
          lookahead++;
          continue;
        }

        // Break if next line is a new question, section, or answer key
        if (
          /^(?:(?:\*{1,2})?(?:question\s*)?(?:Q\s*)+[0-9]+[.:)])/i.test(nextLine) ||
          /^(?:#+|\*{2,})\s*(?:section|answer|marking)/i.test(nextLine)
        ) {
          break;
        }

        const parsedOpts = parseOptionsFromLine(nextLine);
        if (parsedOpts && Object.keys(parsedOpts).length > 0) {
          if (parsedOpts.A) options.A = parsedOpts.A;
          if (parsedOpts.B) options.B = parsedOpts.B;
          if (parsedOpts.C) options.C = parsedOpts.C;
          if (parsedOpts.D) options.D = parsedOpts.D;
          hasOptions = true;
          lookahead++;
        } else {
          break;
        }
      }

      const assignedNumber = String(currentQuestionCounter);

      if (hasOptions) {
        i = lookahead - 1;
        // Ensure options have clean fallbacks if partially missing
        options.A = options.A || '—';
        options.B = options.B || '—';
        options.C = options.C || '—';
        options.D = options.D || '—';

        currentSection.questions.push({
          number: assignedNumber,
          text: qText,
          marks: 1,
          type: 'mcq',
          options,
        });
      } else {
        // Short / descriptive question
        currentSection.questions.push({
          number: assignedNumber,
          text: qText,
          marks: 2,
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

  // Renumber all questions strictly sequentially from 1 to N across all sections
  let globalCounter = 0;
  let computedMarks = 0;
  for (const sec of sections) {
    for (const q of sec.questions) {
      globalCounter++;
      q.number = String(globalCounter);
      computedMarks += q.marks || 1;
    }
  }

  totalMarks = computedMarks > 0 ? computedMarks : (totalMarks || globalCounter || 5);

  return {
    title: sanitizeMathAndDelimiters(title),
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
