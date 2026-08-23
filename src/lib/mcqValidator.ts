import type { MCQQuestion } from '../types/selfTest';
import { getChapterSyllabusScope } from './curriculumFBISE9';

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
 * Global out-of-scope topics for Grade 9 & 10 (e.g., Higher Secondary / FSc topics)
 */
const GRADE_9_10_FORBIDDEN_PATTERNS = [
  { pattern: /\b(calculus|dy\/dx|f'\(x\)|\b\\int\b|antiderivative|\blim_{|limit as x approaches|derivative of (a |the )?(function|curve|equation|polynomial|expression|variable)|(definite|indefinite) integral|integration by parts|differentiate (the|with respect to))\b/i, reason: 'Calculus/Derivatives is out of scope for Grade 9/10 (taught in FSc Part 1/Grade 11)' },
  { pattern: /\b(eigenvalues?|eigenvectors?|cayley-hamilton|rank of matrix)\b/i, reason: 'Advanced linear algebra is out of scope for Grade 9/10' },
  { pattern: /\b(de moivre's theorem|cube roots of unity (\omega|\w)|euler's formula e\^\{i)\b/i, reason: 'Higher complex analysis is out of scope for Grade 9' },
];

export interface ValidationContext {
  subject?: string;
  topic?: string;
  grade?: string;
  board?: string;
}

/**
 * Normalizes question text to a generic template skeleton by replacing numbers,
 * formulas, and variable placeholders. Used to catch near-duplicate parameterized templates.
 */
export function normalizeQuestionTemplate(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    // Replace LaTeX math delimiters
    .replace(/\$[^$]+\$/g, '<MATH>')
    // Replace scientific numbers, exponents, fractions, decimals
    .replace(/\b\d+(\.\d+)?(e[+-]?\d+)?\b/gi, '<NUM>')
    // Remove punctuation
    .replace(/[^\w\s<>]/g, ' ')
    // Collapse consecutive whitespaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts normalized word tokens for semantic similarity calculation
 */
function extractTokens(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['the', 'and', 'for', 'with', 'that', 'this', 'what', 'which', 'from'].includes(w));
  return new Set(words);
}

/**
 * Calculates Jaccard similarity and template equivalence between two questions
 */
export function calculateQuestionSimilarity(q1: string, q2: string): { similarity: number; isTemplateDuplicate: boolean } {
  const norm1 = q1.trim().toLowerCase();
  const norm2 = q2.trim().toLowerCase();
  if (norm1 === norm2) {
    return { similarity: 1.0, isTemplateDuplicate: true };
  }

  const skel1 = normalizeQuestionTemplate(q1);
  const skel2 = normalizeQuestionTemplate(q2);
  if (skel1.length > 20 && skel1 === skel2) {
    return { similarity: 0.95, isTemplateDuplicate: true };
  }

  const tokens1 = extractTokens(q1);
  const tokens2 = extractTokens(q2);

  if (tokens1.size === 0 || tokens2.size === 0) {
    return { similarity: 0, isTemplateDuplicate: false };
  }

  let intersectionCount = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) {
      intersectionCount++;
    }
  }

  const unionCount = new Set([...tokens1, ...tokens2]).size;
  const jaccard = unionCount > 0 ? intersectionCount / unionCount : 0;

  return {
    similarity: jaccard,
    isTemplateDuplicate: jaccard >= 0.75,
  };
}

/**
 * Compares a candidate question against a pool of accepted questions and existing bank questions.
 * Rejects questions that exceed the similarity threshold or share identical template skeletons.
 */
export function checkQuestionDuplicate(
  candidate: MCQQuestion,
  existingList: MCQQuestion[],
  similarityThreshold: number = 0.65
): { isDuplicate: boolean; similarity: number; duplicateWith?: string; reason?: string } {
  const candText = candidate.question || '';
  const candOpts = Object.values(candidate.options || {}).map((v) => String(v).trim().toLowerCase()).sort().join('|');

  for (const existing of existingList) {
    const exText = existing.question || '';
    const { similarity, isTemplateDuplicate } = calculateQuestionSimilarity(candText, exText);

    if (isTemplateDuplicate) {
      return {
        isDuplicate: true,
        similarity,
        duplicateWith: exText,
        reason: `Template skeleton matches existing question: "${exText.substring(0, 60)}..."`,
      };
    }

    if (similarity >= similarityThreshold) {
      return {
        isDuplicate: true,
        similarity,
        duplicateWith: exText,
        reason: `Question has ${(similarity * 100).toFixed(0)}% semantic overlap with: "${exText.substring(0, 60)}..."`,
      };
    }

    // Option set duplicate check
    const exOpts = Object.values(existing.options || {}).map((v) => String(v).trim().toLowerCase()).sort().join('|');
    if (candOpts && candOpts === exOpts && similarity > 0.4) {
      return {
        isDuplicate: true,
        similarity: 0.9,
        duplicateWith: exText,
        reason: 'Options are identical to an existing question.',
      };
    }
  }

  return { isDuplicate: false, similarity: 0 };
}

/**
 * Validates whether a single question's content actually matches the selected topic/chapter
 * and does not bleed into unrelated chapters or out-of-syllabus concepts.
 */
export function validateQuestionTopicRelevance(q: any, context?: ValidationContext): { valid: boolean; reason?: string } {
  if (!context || !context.topic) {
    return { valid: true };
  }

  const topic = context.topic.trim().toLowerCase();
  const subject = (context.subject || '').trim().toLowerCase();
  const grade = String(context.grade || '9').trim();

  // If topic is Full Syllabus or multi-chapter mixed, skip strict single-chapter exclusion
  if (topic === 'full syllabus' || topic === 'mixed chapters' || topic === 'all') {
    // Still check grade-level out of syllabus (e.g. calculus in grade 9)
    if (grade === '9' || grade === '9th' || grade === '10' || grade === '10th') {
      const fullText = `${q.question || ''} ${q.explanation || ''} ${JSON.stringify(q.options || {})}`;
      for (const rule of GRADE_9_10_FORBIDDEN_PATTERNS) {
        if (rule.pattern.test(fullText)) {
          return { valid: false, reason: rule.reason };
        }
      }
    }
    return { valid: true };
  }

  const fullText = `${q.question || ''} ${q.explanation || ''} ${JSON.stringify(q.options || {})}`;

  // 1. Grade 9 / 10 Strict Out-of-Syllabus check
  if (grade === '9' || grade === '9th' || grade === '10' || grade === '10th') {
    for (const rule of GRADE_9_10_FORBIDDEN_PATTERNS) {
      if (rule.pattern.test(fullText)) {
        return { valid: false, reason: rule.reason };
      }
    }
  }

  // 2. Syllabus scope retrieval
  const scope = getChapterSyllabusScope(subject, context.topic);

  // Check forbidden cross-chapter patterns defined in scope
  for (const rule of scope.forbiddenCrossChapterPatterns) {
    if (rule.pattern.test(fullText)) {
      return { valid: false, reason: rule.reason };
    }
  }

  // Positive grounding check for specific single chapters
  if (scope.requiredKeywords.length > 0) {
    const fullTextNorm = fullText.toLowerCase();
    const topicWords = (scope.chapter || context.topic || '')
      .toLowerCase()
      .split(/[\s,–—\-:/()]+/)
      .filter((w) => w.length > 3);

    const hasMatch =
      scope.requiredKeywords.some((kw) => fullTextNorm.includes(kw.toLowerCase())) ||
      topicWords.some((w) => fullTextNorm.includes(w));

    if (!hasMatch) {
      return {
        valid: false,
        reason: `Question content does not match the defined syllabus concepts for chapter "${scope.chapter}".`,
      };
    }
  }

  // 3. MATHEMATICS Topic Scoping
  if (subject.includes('math')) {
    if (topic.includes('factoriz') || topic.includes('algebraic manipulation') || topic.includes('algebraic expressions')) {
      if (/\b(matrix|matrices|determinant|adjoint|singular matrix)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question mentions matrices/determinants, which belongs to another chapter' };
      }
      if (/\b(trigonometr|sin\^?2|cos\^?2|tan\^?2|\bsin\s*\(|\bcos\s*\(|\btan\s*\(|\bsec\s*\(|\bcsc\s*\(|\bcot\s*\(|\bbearing\b)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question contains trigonometric identities/bearing, which belongs to Trigonometry chapter' };
      }
      if (/\b(distance between (the )?two points|coordinate plane|cartesian coordinates|mid-?point formula)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question contains coordinate geometry formulas, which belongs to Coordinate Geometry chapter' };
      }
      if (/\b(logarithm|\blog_{?\d+}?|\bmantissa\b|\bcharacteristic of log)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question contains logarithms, which belongs to Logarithms chapter' };
      }
      if (/\b(arithmetic mean of|median of the data|mode of the dataset|frequency distribution|histogram)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question contains statistics/mean/median, which belongs to Basic Statistics chapter' };
      }
    }
  }

  // 4. PHYSICS Topic Scoping
  if (subject.includes('phys')) {
    if (topic.includes('kinematic')) {
      if (/\b(pascal's law|archimedes|upthrust|magnetic pole|magnetic domain|specific heat capacity|thermal expansion|half-life|coulomb's law|young's modulus)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated physics chapter outside Kinematics' };
      }
    }
    if (topic.includes('measurement') || topic.includes('physical quantit')) {
      if (/\b(centripetal force|potential energy formula ep|magnetic field lines|pascal's principle|hydraulic lift|latent heat)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated physics chapter outside Measurements' };
      }
    }
  }

  // 5. BIOLOGY Topic Scoping
  if (subject.includes('bio')) {
    if (topic.includes('the cell') || topic.includes('cell organelle')) {
      if (/\b(flower double fertilization|endosperm 3n|mendel's ratio|darwin natural selection|fossil paleontology|transpiration pull)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated biology chapter outside The Cell' };
      }
    }
  }

  return { valid: true };
}

/**
 * Validates whether a single MCQQuestion contains authentic, concrete subject matter
 * and is free from generic meta-language or placeholder text.
 */
export function validateMCQQuestion(q: any, context?: ValidationContext): { valid: boolean; reason?: string } {
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

  // Check topic relevance and syllabus boundaries if context is provided
  if (context) {
    const topicCheck = validateQuestionTopicRelevance(q, context);
    if (!topicCheck.valid) {
      return topicCheck;
    }
  }

  return { valid: true };
}

/**
 * Validates a list of questions, filters out invalid/generic/off-topic/duplicate ones,
 * and backfills from a fallback pool if needed to guarantee the required count of valid questions.
 */
export function filterAndValidateMCQs(
  questions: MCQQuestion[],
  requiredCount: number,
  fallbackPool: MCQQuestion[] = [],
  context?: ValidationContext,
  excludeTexts: string[] = []
): MCQQuestion[] {
  const validQuestions: MCQQuestion[] = [];

  // Exclude initial passed strings from previous tests/history
  const initialExcludeQuestions: MCQQuestion[] = excludeTexts.map((text, idx) => ({
    id: `ex_${idx}`,
    question: text,
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: 'A',
    explanation: '',
  }));

  for (const q of questions) {
    const check = validateMCQQuestion(q, context);
    if (!check.valid) {
      console.warn(`[MCQ Validator] Rejected invalid/off-topic question: "${q.question}" -> Reason: ${check.reason}`);
      continue;
    }

    // Check duplicate against initial excludes and already accepted questions
    const dupCheck = checkQuestionDuplicate(q, [...initialExcludeQuestions, ...validQuestions], 0.65);
    if (dupCheck.isDuplicate) {
      console.warn(`[MCQ Validator] Rejected duplicate question: "${q.question}" -> Reason: ${dupCheck.reason}`);
      continue;
    }

    validQuestions.push(q);
    if (validQuestions.length >= requiredCount) {
      break;
    }
  }

  // If we still need more questions to reach requiredCount, backfill from fallbackPool
  if (validQuestions.length < requiredCount && fallbackPool.length > 0) {
    for (const fb of fallbackPool) {
      const check = validateMCQQuestion(fb, context);
      if (!check.valid) continue;

      const dupCheck = checkQuestionDuplicate(fb, [...initialExcludeQuestions, ...validQuestions], 0.65);
      if (dupCheck.isDuplicate) continue;

      validQuestions.push(fb);
      if (validQuestions.length >= requiredCount) {
        break;
      }
    }
  }

  return validQuestions;
}


