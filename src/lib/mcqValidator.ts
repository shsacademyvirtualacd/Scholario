import type { MCQQuestion } from '../types/selfTest';

/**
 * Forbidden phrases that indicate generic AI filler or meta-language
 * rather than authentic subject matter questions.
 */
const FORBIDDEN_META_PHRASES: (string | RegExp)[] = [
  /factually\s+and\s+conceptually\s+accurate/i,
  /according\s+to\s+the\s+standard\s+textbook/i,
  /according\s+to\s+the\s+textbook/i,
  /verified\s+textbook\s+principle/i,
  /invalid\s+assumption\s+violating\s+syllabus/i,
  /violating\s+syllabus\s+definitions/i,
  /non-syllabus\s+formula/i,
  /unsupported\s+by\s+(fbise|standard|the)?\s*textbook/i,
  /out-of-scope\s+conceptual\s+claim/i,
  /conceptual\s+claim/i,
  /core\s+governing\s+principle/i,
  /academically\s+accurate/i,
  /which\s+statement\s+is\s+(factually|academically|conceptually)?\s*accurate\s+according\s+to/i,
  /standard\s+curriculum\s+guidelines/i,
  /an\s+invalid\s+assumption/i,
  /a\s+verified\s+principle/i,
  /a\s+valid\s+textbook\s+principle/i,
  /violates\s+syllabus/i,
  /^option\s+[a-d]\s+text/i,
  /^question\s+text/i,
  /placeholder\s+question/i,
  /tested\s+in\s+fbise\s+grade\s+9\s+.*curriculum/i,
];

/**
 * Validates whether a single MCQQuestion contains authentic, concrete subject matter
 * and is free from generic meta-language or placeholder text.
 */
export function validateMCQQuestion(q: any): { valid: boolean; reason?: string } {
  if (!q || typeof q !== 'object') {
    return { valid: false, reason: 'Question object is invalid or null' };
  }

  const questionText = String(q.question || '').trim();
  if (questionText.length < 15) {
    return { valid: false, reason: 'Question text is too short (< 15 characters)' };
  }

  // Check question text for forbidden phrases
  for (const pattern of FORBIDDEN_META_PHRASES) {
    if (typeof pattern === 'string') {
      if (questionText.toLowerCase().includes(pattern.toLowerCase())) {
        return { valid: false, reason: `Question contains forbidden meta phrase: "${pattern}"` };
      }
    } else if (pattern.test(questionText)) {
      return { valid: false, reason: `Question matches forbidden meta pattern: ${pattern}` };
    }
  }

  // Check options
  const opts = q.options;
  if (!opts || typeof opts !== 'object') {
    return { valid: false, reason: 'Options object is missing or invalid' };
  }

  const optValues = [opts.A, opts.B, opts.C, opts.D].map((v) => String(v || '').trim());
  if (optValues.some((v) => v.length === 0)) {
    return { valid: false, reason: 'One or more options are empty' };
  }

  // Check for duplicate options
  const uniqueOpts = new Set(optValues.map((v) => v.toLowerCase()));
  if (uniqueOpts.size < 4) {
    return { valid: false, reason: 'Options must be 4 distinct choices' };
  }

  // Check options for forbidden filler phrases
  for (const opt of optValues) {
    for (const pattern of FORBIDDEN_META_PHRASES) {
      if (typeof pattern === 'string') {
        if (opt.toLowerCase().includes(pattern.toLowerCase())) {
          return { valid: false, reason: `Option "${opt}" contains forbidden meta phrase: "${pattern}"` };
        }
      } else if (pattern.test(opt)) {
        return { valid: false, reason: `Option "${opt}" matches forbidden meta pattern: ${pattern}` };
      }
    }
  }

  // Check correctAnswer
  const correctAns = String(q.correctAnswer || '').trim().toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(correctAns)) {
    return { valid: false, reason: `Invalid correctAnswer: ${correctAns}` };
  }

  return { valid: true };
}

/**
 * Validates a list of questions, filters out invalid/generic ones,
 * and backfills from a fallback pool if needed to guarantee the required count of valid questions.
 */
export function filterAndValidateMCQs(
  questions: MCQQuestion[],
  requiredCount: number,
  fallbackPool: MCQQuestion[] = []
): MCQQuestion[] {
  const validQuestions: MCQQuestion[] = [];
  const seenQuestionTexts = new Set<string>();

  for (const q of questions) {
    const check = validateMCQQuestion(q);
    const qKey = q.question.trim().toLowerCase();
    if (check.valid && !seenQuestionTexts.has(qKey)) {
      validQuestions.push(q);
      seenQuestionTexts.add(qKey);
      if (validQuestions.length >= requiredCount) {
        break;
      }
    } else if (!check.valid) {
      console.warn(`[MCQ Validator] Rejected invalid question: "${q.question}" -> Reason: ${check.reason}`);
    }
  }

  // If we still need more questions to reach requiredCount, backfill from fallbackPool
  if (validQuestions.length < requiredCount && fallbackPool.length > 0) {
    for (const fb of fallbackPool) {
      const check = validateMCQQuestion(fb);
      const qKey = fb.question.trim().toLowerCase();
      if (check.valid && !seenQuestionTexts.has(qKey)) {
        validQuestions.push(fb);
        seenQuestionTexts.add(qKey);
        if (validQuestions.length >= requiredCount) {
          break;
        }
      }
    }
  }

  return validQuestions;
}
