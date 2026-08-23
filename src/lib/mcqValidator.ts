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
 * Global out-of-scope topics for Grade 9 & 10 (e.g., Higher Secondary / FSc topics)
 */
const GRADE_9_10_FORBIDDEN_PATTERNS = [
  { pattern: /\b(derivative|derivatives|differentiation|differentiate|dy\/dx|f'\(x\)|calculus|integrals?|integration|antiderivative|\blim_{|limit as x approaches)\b/i, reason: 'Calculus/Derivatives is out of scope for Grade 9/10 (taught in FSc Part 1/Grade 11)' },
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

  // 2. MATHEMATICS Topic Scoping
  if (subject.includes('math')) {
    // Topic: Factorization and Algebraic Manipulation
    if (topic.includes('factoriz') || topic.includes('algebraic manipulation') || topic.includes('algebraic expressions')) {
      // Must NOT contain Matrix/Determinants
      if (/\b(matrix|matrices|determinant|adjoint|singular matrix|non-singular matrix)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question mentions matrices/determinants, which belongs to another chapter' };
      }
      // Must NOT contain Trigonometry
      if (/\b(trigonometr|sin\^?2|cos\^?2|tan\^?2|\bsin\s*\(|\bcos\s*\(|\btan\s*\(|\bsec\s*\(|\bcsc\s*\(|\bcot\s*\(|\bbearing\b|elevation and depression)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question contains trigonometric identities/bearing, which belongs to Trigonometry chapter' };
      }
      // Must NOT contain Coordinate Geometry distance/midpoint
      if (/\b(distance between (the )?two points|coordinate plane|cartesian coordinates|mid-?point formula|collinear points)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question contains coordinate geometry formulas, which belongs to Coordinate Geometry chapter' };
      }
      // Must NOT contain Logarithms
      if (/\b(logarithm|\blog_{?\d+}?|\bmantissa\b|\bcharacteristic of log)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question contains logarithms, which belongs to Logarithms chapter' };
      }
      // Must NOT contain Statistics
      if (/\b(arithmetic mean of|median of the data|mode of the dataset|frequency distribution|histogram)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question contains statistics/mean/median, which belongs to Basic Statistics chapter' };
      }
      // Must NOT contain Geometry of Straight Lines / Polygons
      if (/\b(alternate interior angles|transversal line|sum of interior angles of a (pentagon|hexagon|polygon)|congruence of triangles)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question contains geometry proofs/polygons, which belongs to Geometry chapters' };
      }
    }

    // Topic: Real Numbers
    if (topic.includes('real number') || topic.includes('radicals')) {
      if (/\b(matrix|matrices|determinant|trigonometr|\bsin\s*\(|\bcos\s*\(|\btan\s*\(|mid-?point|remainder theorem|factor theorem|frequency distribution)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated mathematics chapter outside Real Numbers' };
      }
    }

    // Topic: Logarithms
    if (topic.includes('logarithm')) {
      if (/\b(matrix|matrices|determinant|trigonometr|\bsin\s*\(|\bcos\s*\(|\btan\s*\(|distance formula|mid-?point|remainder theorem|factor theorem)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated mathematics chapter outside Logarithms' };
      }
    }

    // Topic: Sets and Relations
    if (topic.includes('set') || topic.includes('relation')) {
      if (/\b(matrix|matrices|determinant|trigonometr|\bsin\s*\(|\bcos\s*\(|\btan\s*\(|distance formula|logarithm|remainder theorem)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated mathematics chapter outside Sets and Relations' };
      }
    }

    // Topic: Trigonometry and Bearing
    if (topic.includes('trigonometr') || topic.includes('bearing')) {
      if (/\b(matrix|matrices|determinant|logarithm|remainder theorem|factor theorem|frequency distribution|venn diagram)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated mathematics chapter outside Trigonometry' };
      }
    }

    // Topic: Coordinate Geometry
    if (topic.includes('coordinate geometry')) {
      if (/\b(matrix|matrices|determinant|logarithm|remainder theorem|factor theorem|frequency distribution|venn diagram|log_{)/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated mathematics chapter outside Coordinate Geometry' };
      }
    }

    // Topic: Basic Statistics
    if (topic.includes('statistic') || topic.includes('mean') || topic.includes('median')) {
      if (/\b(matrix|matrices|determinant|trigonometr|\bsin\s*\(|\bcos\s*\(|\btan\s*\(|distance formula|remainder theorem|factor theorem)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated mathematics chapter outside Basic Statistics' };
      }
    }
  }

  // 3. PHYSICS Topic Scoping
  if (subject.includes('phys')) {
    // Topic: Kinematics
    if (topic.includes('kinematic')) {
      if (/\b(pascal's law|archimedes|upthrust|magnetic pole|magnetic domain|specific heat capacity|thermal expansion|half-life|coulomb's law|young's modulus|hooke's law)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated physics chapter outside Kinematics' };
      }
    }
    // Topic: Physical Quantities and Measurement
    if (topic.includes('measurement') || topic.includes('physical quantit')) {
      if (/\b(centripetal force|potential energy formula ep|magnetic field lines|pascal's principle|hydraulic lift|latent heat)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated physics chapter outside Measurements' };
      }
    }
    // Topic: Pressure and Deformation
    if (topic.includes('pressure') || topic.includes('deformation')) {
      if (/\b(equations of motion|speed-time graph|magnetic poles|thermal expansion|kinematics)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated physics chapter outside Pressure and Deformation' };
      }
    }
    // Topic: Work and Energy
    if (topic.includes('work') || topic.includes('energy')) {
      if (/\b(vernier calipers|screw gauge least count|pascal's principle|magnetic pole|magnetic field)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated physics chapter outside Work and Energy' };
      }
    }
    // Topic: Magnetism
    if (topic.includes('magnet')) {
      if (/\b(equations of motion|speed-time graph|pascal's law|archimedes upthrust|specific heat capacity)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated physics chapter outside Magnetism' };
      }
    }
  }

  // 4. CHEMISTRY Topic Scoping
  if (subject.includes('chem')) {
    // Topic: Atomic Structure
    if (topic.includes('atomic structure') || topic.includes('atom')) {
      if (/\b(catenation|alkane|alkene|alkyne|fractional distillation|acid rain|titration|le chatelier|ph of solution)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated chemistry chapter outside Atomic Structure' };
      }
    }
    // Topic: Acids, Bases, and Salts
    if (topic.includes('acid') || topic.includes('base') || topic.includes('salt')) {
      if (/\b(rutherford atomic model|bohr's postulates|catenation|hydrocarbon|alkane|fractional distillation)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated chemistry chapter outside Acids, Bases, and Salts' };
      }
    }
    // Topic: Organic Chemistry / Hydrocarbons
    if (topic.includes('organic') || topic.includes('hydrocarbon')) {
      if (/\b(rutherford alpha scattering|bohr radius|flame test lilac|titration indicator|paper chromatography rf)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated chemistry chapter outside Organic Chemistry' };
      }
    }
  }

  // 5. BIOLOGY Topic Scoping
  if (subject.includes('bio')) {
    // Topic: The Cell
    if (topic.includes('the cell') || topic.includes('cell organelle')) {
      if (/\b(flower double fertilization|endosperm 3n|mendel's ratio|darwin natural selection|fossil paleontology|transpiration pull)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated biology chapter outside The Cell' };
      }
    }
    // Topic: Biodiversity
    if (topic.includes('biodiversity') || topic.includes('classification')) {
      if (/\b(mitosis anaphase|calvin cycle|glycolysis|lock and key model|double fertilization)\b/i.test(fullText)) {
        return { valid: false, reason: 'Question belongs to an unrelated biology chapter outside Biodiversity' };
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
 * Validates a list of questions, filters out invalid/generic/off-topic ones,
 * and backfills from a fallback pool if needed to guarantee the required count of valid questions.
 */
export function filterAndValidateMCQs(
  questions: MCQQuestion[],
  requiredCount: number,
  fallbackPool: MCQQuestion[] = [],
  context?: ValidationContext
): MCQQuestion[] {
  const validQuestions: MCQQuestion[] = [];
  const seenQuestionTexts = new Set<string>();

  for (const q of questions) {
    const check = validateMCQQuestion(q, context);
    const qKey = q.question.trim().toLowerCase();
    if (check.valid && !seenQuestionTexts.has(qKey)) {
      validQuestions.push(q);
      seenQuestionTexts.add(qKey);
      if (validQuestions.length >= requiredCount) {
        break;
      }
    } else if (!check.valid) {
      console.warn(`[MCQ Validator] Rejected invalid/off-topic question: "${q.question}" -> Reason: ${check.reason}`);
    }
  }

  // If we still need more questions to reach requiredCount, backfill from fallbackPool
  if (validQuestions.length < requiredCount && fallbackPool.length > 0) {
    for (const fb of fallbackPool) {
      const check = validateMCQQuestion(fb, context);
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

