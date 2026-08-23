/**
 * Question Bank Sanitization and Safe Serialization Pipeline
 * 
 * Guarantees RFC 8259 JSON compliance, fixes LaTeX escape accidents (e.g., \bullet, \text),
 * and safely preserves Urdu / Arabic Unicode characters (e.g. ؐ, ؓ, ؒ, ؔ, « », ،, ؟).
 */

import type { StoredMCQ } from '../types/questionBank';

/**
 * Sanitizes any raw string field to ensure safe character formatting:
 * - Fixes ASCII control characters introduced by unintended single-backslash LaTeX
 *   (e.g., \b -> \bullet, \f -> \frac, \v -> vertical tab, \t -> \text)
 * - Retains full Unicode fidelity for Urdu, Arabic, math symbols, and standard quotes
 */
export function sanitizeMCQString(input: unknown): string {
  if (typeof input !== 'string') {
    return input === null || input === undefined ? '' : String(input);
  }

  let s = input;

  // 1. Repair backspace (\x08) from single-backslash \bullet or \beta
  if (s.includes('\x08')) {
    s = s.replace(/\x08bullet/g, '\\bullet')
         .replace(/\x08eta/g, '\\beta')
         .replace(/\x08/g, '');
  }

  // 2. Repair form-feed (\x0C) from single-backslash \frac or \phi
  if (s.includes('\x0C')) {
    s = s.replace(/\x0Crac/g, '\\frac')
         .replace(/\x0Chi/g, '\\phi')
         .replace(/\x0C/g, '');
  }

  // 3. Repair vertical tab (\x0B) from single-backslash \vec or \var
  if (s.includes('\x0B')) {
    s = s.replace(/\x0Bec/g, '\\vec')
         .replace(/\x0Bar/g, '\\var')
         .replace(/\x0B/g, '');
  }

  // 4. Repair unintended literal tab (\t / \x09) before common LaTeX keywords
  s = s.replace(/\t(ext|heta|au|imes|o|riangle|au)/g, '\\$1');

  // 5. Repair unintended literal CR/LF (\r, \n) before common LaTeX keywords
  s = s.replace(/[\r\n](ight|ho|ightarrow|u\{)/g, '\\$1');

  // 6. Clean any remaining non-printable control characters (< 0x20) except standard whitespace (\n, \r, \t)
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return s;
}

/**
 * Sanitizes a complete StoredMCQ object
 */
export function sanitizeStoredMCQ(q: StoredMCQ): StoredMCQ {
  return {
    ...q,
    id: sanitizeMCQString(q.id).trim(),
    board: sanitizeMCQString(q.board || 'fbise').trim(),
    grade: sanitizeMCQString(q.grade || '9').trim(),
    subject: sanitizeMCQString(q.subject).trim(),
    chapter: sanitizeMCQString(q.chapter).trim(),
    chapterNumber: typeof q.chapterNumber === 'number' ? q.chapterNumber : Number(q.chapterNumber) || 1,
    topic: sanitizeMCQString(q.topic || q.chapter).trim(),
    question: sanitizeMCQString(q.question).trim(),
    options: {
      A: sanitizeMCQString(q.options?.A ?? '').trim(),
      B: sanitizeMCQString(q.options?.B ?? '').trim(),
      C: sanitizeMCQString(q.options?.C ?? '').trim(),
      D: sanitizeMCQString(q.options?.D ?? '').trim(),
    },
    correctAnswer: (['A', 'B', 'C', 'D'].includes(q.correctAnswer) ? q.correctAnswer : 'A') as 'A' | 'B' | 'C' | 'D',
    explanation: sanitizeMCQString(q.explanation ?? '').trim(),
    difficulty: (['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium') as 'easy' | 'medium' | 'hard',
    verified: Boolean(q.verified ?? true),
    source: (['ai-pregenerated', 'curriculum-bank', 'expert-verified'].includes(q.source)
      ? q.source
      : 'curriculum-bank') as 'ai-pregenerated' | 'curriculum-bank' | 'expert-verified',
    createdAt: q.createdAt || new Date().toISOString(),
  };
}

/**
 * Sanitizes an entire question bank structure: Subject -> Chapter -> MCQ[]
 */
export function sanitizeQuestionBank(
  bank: Record<string, Record<string, StoredMCQ[]>>
): Record<string, Record<string, StoredMCQ[]>> {
  const sanitized: Record<string, Record<string, StoredMCQ[]>> = {};

  for (const [subjectKey, chapters] of Object.entries(bank)) {
    const cleanSubjKey = sanitizeMCQString(subjectKey).trim();
    sanitized[cleanSubjKey] = {};

    for (const [chapKey, questions] of Object.entries(chapters)) {
      const cleanChapKey = sanitizeMCQString(chapKey).trim();
      if (!Array.isArray(questions)) continue;

      sanitized[cleanSubjKey][cleanChapKey] = questions.map((q) => sanitizeStoredMCQ(q));
    }
  }

  return sanitized;
}

/**
 * Safely serializes question bank to JSON string using RFC 8259 compliant standard serialization
 */
export function serializeQuestionBankToJson(
  bank: Record<string, Record<string, StoredMCQ[]>>,
  indent = 2
): string {
  const cleanBank = sanitizeQuestionBank(bank);
  return JSON.stringify(cleanBank, null, indent);
}
