import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateMCQQuestion,
  normalizeQuestionTemplate,
  calculateQuestionSimilarity,
  checkQuestionDuplicate,
  validateQuestionTopicRelevance,
  filterAndValidateMCQs,
  ValidationContext,
} from './mcqValidator';
import type { MCQQuestion } from '../types/selfTest';

describe('mcqValidator', () => {
  describe('normalizeQuestionTemplate', () => {
    it('returns empty string for empty or null inputs', () => {
      assert.equal(normalizeQuestionTemplate(''), '');
      assert.equal(normalizeQuestionTemplate(null as any), '');
      assert.equal(normalizeQuestionTemplate(undefined as any), '');
    });

    it('replaces LaTeX math formulas with <MATH>', () => {
      const text = 'Solve for x: $x^2 + 2x + 1 = 0$ in the equation.';
      const result = normalizeQuestionTemplate(text);
      assert.ok(result.includes('<MATH>'));
      assert.ok(!result.includes('x^2'));
    });

    it('replaces numbers, decimals, and scientific notation with <NUM>', () => {
      const text = 'Speed is 3.0e8 m/s and mass is 12.5 kg at 0 degrees.';
      const result = normalizeQuestionTemplate(text);
      assert.ok(result.includes('<NUM>'));
      assert.ok(!result.includes('3.0e8'));
      assert.ok(!result.includes('12.5'));
    });

    it('strips punctuation and normalizes spaces', () => {
      const text = 'What, is...   the   SI unit?!';
      const result = normalizeQuestionTemplate(text);
      assert.equal(result, 'what is the si unit');
    });
  });

  describe('calculateQuestionSimilarity', () => {
    it('returns 1.0 similarity for identical strings', () => {
      const q = 'What is the speed of light in vacuum?';
      const result = calculateQuestionSimilarity(q, q);
      assert.equal(result.similarity, 1.0);
      assert.equal(result.isTemplateDuplicate, true);
    });

    it('detects template duplicates when parameterized questions match skeleton (> 20 chars)', () => {
      const q1 = 'Calculate the kinetic energy when mass is 10 kg and velocity is 5 m/s.';
      const q2 = 'Calculate the kinetic energy when mass is 20 kg and velocity is 8 m/s.';
      const result = calculateQuestionSimilarity(q1, q2);
      assert.equal(result.similarity, 0.95);
      assert.equal(result.isTemplateDuplicate, true);
    });

    it('calculates Jaccard similarity based on word tokens', () => {
      const q1 = 'Which cell organelle is known as the powerhouse of cell?';
      const q2 = 'Which cell organelle is recognized as the powerhouse of cell?';
      const result = calculateQuestionSimilarity(q1, q2);
      assert.ok(result.similarity > 0.5);
    });

    it('returns 0 similarity when token sets are empty or disjoint', () => {
      const q1 = 'The and for with';
      const q2 = 'That this what which';
      const result = calculateQuestionSimilarity(q1, q2);
      assert.equal(result.similarity, 0);
      assert.equal(result.isTemplateDuplicate, false);
    });
  });

  describe('checkQuestionDuplicate', () => {
    const existingList: MCQQuestion[] = [
      {
        id: 'q1',
        question: 'What is the capital of France and its largest city?',
        options: { A: 'Paris', B: 'London', C: 'Berlin', D: 'Madrid' },
        correctAnswer: 'A',
        explanation: 'Paris is the capital of France.',
      },
      {
        id: 'q2',
        question: 'Calculate force when mass is 5 kg and acceleration is 2 m/s^2.',
        options: { A: '10 N', B: '5 N', C: '2.5 N', D: '20 N' },
        correctAnswer: 'A',
        explanation: 'F = ma = 5 * 2 = 10 N',
      },
    ];

    it('detects duplicate template skeleton', () => {
      const candidate: MCQQuestion = {
        id: 'c1',
        question: 'Calculate force when mass is 12 kg and acceleration is 4 m/s^2.',
        options: { A: '48 N', B: '12 N', C: '3 N', D: '16 N' },
        correctAnswer: 'A',
        explanation: 'F = ma',
      };
      const result = checkQuestionDuplicate(candidate, existingList);
      assert.equal(result.isDuplicate, true);
      assert.ok(result.reason?.includes('Template skeleton matches'));
    });

    it('detects duplicate via high semantic overlap', () => {
      const candidate: MCQQuestion = {
        id: 'c2',
        question: 'What is the capital city of France and its largest urban center?',
        options: { A: 'Paris', B: 'Lyon', C: 'Nice', D: 'Marseille' },
        correctAnswer: 'A',
        explanation: 'Paris',
      };
      const result = checkQuestionDuplicate(candidate, existingList, 0.6);
      assert.equal(result.isDuplicate, true);
      assert.ok(result.reason?.includes('semantic overlap'));
    });

    it('detects duplicate when options are identical and similarity > 0.4', () => {
      const candidate: MCQQuestion = {
        id: 'c3',
        question: 'What is the capital of France and major city?',
        options: { A: 'Paris', B: 'London', C: 'Berlin', D: 'Madrid' },
        correctAnswer: 'A',
        explanation: 'Paris',
      };
      const result = checkQuestionDuplicate(candidate, existingList);
      assert.equal(result.isDuplicate, true);
      assert.ok(result.reason?.includes('Options are identical'));
    });

    it('returns false for distinct questions', () => {
      const candidate: MCQQuestion = {
        id: 'c4',
        question: 'What is the chemical symbol for Gold in the periodic table?',
        options: { A: 'Au', B: 'Ag', C: 'Fe', D: 'Cu' },
        correctAnswer: 'A',
        explanation: 'Au comes from Aurum.',
      };
      const result = checkQuestionDuplicate(candidate, existingList);
      assert.equal(result.isDuplicate, false);
      assert.equal(result.similarity, 0);
    });
  });

  describe('validateQuestionTopicRelevance', () => {
    it('returns valid true when context or context.topic is not provided', () => {
      const q = { question: 'What is Newton second law of motion?' };
      assert.deepEqual(validateQuestionTopicRelevance(q), { valid: true });
      assert.deepEqual(validateQuestionTopicRelevance(q, {}), { valid: true });
    });

    it('validates full syllabus topic and rejects Grade 9/10 forbidden calculus patterns', () => {
      const context: ValidationContext = { subject: 'Math', topic: 'Full Syllabus', grade: '9' };
      const validQ = {
        question: 'Solve $x^2 - 5x + 6 = 0$ for $x$.',
        options: { A: '2, 3', B: '1, 6', C: '-2, -3', D: '0, 5' },
        correctAnswer: 'A',
      };
      const invalidQ = {
        question: 'Find the derivative dy/dx of $f(x) = x^3 + 2x$.',
        options: { A: '$3x^2 + 2$', B: '$x^2$', C: '$3x$', D: '$6x$' },
        correctAnswer: 'A',
      };

      assert.equal(validateQuestionTopicRelevance(validQ, context).valid, true);
      const invalidResult = validateQuestionTopicRelevance(invalidQ, context);
      assert.equal(invalidResult.valid, false);
      assert.ok(invalidResult.reason?.includes('Calculus/Derivatives is out of scope'));
    });

    it('rejects cross-chapter violations in Physics (e.g., Vernier Calipers in Nuclear Physics)', () => {
      const context: ValidationContext = { subject: 'Physics', topic: 'Atomic & Nuclear Physics', grade: '9' };
      const q = {
        question: 'What is the least count of a Vernier Caliper when radioactive alpha particles are measured?',
        options: { A: '0.01 cm', B: '0.1 mm', C: '0.001 cm', D: '1 mm' },
        correctAnswer: 'A',
      };
      const result = validateQuestionTopicRelevance(q, context);
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('Measuring instruments belong to Chapter 1'));
    });

    it('rejects questions missing required keywords for specific single chapters', () => {
      const context: ValidationContext = { subject: 'Physics', topic: 'Atomic & Nuclear Physics', grade: '9' };
      const q = {
        question: 'What is the velocity of an object falling under gravity from a height of ten meters?',
        options: { A: '14 m/s', B: '9.8 m/s', C: '20 m/s', D: '5 m/s' },
        correctAnswer: 'A',
      };
      const result = validateQuestionTopicRelevance(q, context);
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('does not match the defined syllabus concepts'));
    });

    it('enforces subject-specific topic scoping for Math (Factorization vs Trigonometry)', () => {
      const context: ValidationContext = { subject: 'Math', topic: 'Factorization and Algebraic Manipulation', grade: '9' };
      const q = {
        question: 'Factorize the expression using $\\sin^2(x) + \\cos^2(x) = 1$ identity.',
        options: { A: '1', B: '0', C: '2', D: '-1' },
        correctAnswer: 'A',
      };
      const result = validateQuestionTopicRelevance(q, context);
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('trigonometric identities'));
    });

    it('enforces subject-specific topic scoping for Physics (Kinematics vs Pascal Law / Heat Capacity)', () => {
      const context: ValidationContext = { subject: 'Physics', topic: 'Kinematics', grade: '9' };
      const q1 = {
        question: 'Calculate speed using Pascal\'s law and hydraulic pressure.',
        options: { A: '5 m/s', B: '10 m/s', C: '2 m/s', D: '0 m/s' },
        correctAnswer: 'A',
      };
      const result1 = validateQuestionTopicRelevance(q1, context);
      assert.equal(result1.valid, false);
      assert.ok(result1.reason);

      const q2 = {
        question: 'Calculate uniform velocity using specific heat capacity of water.',
        options: { A: '5 m/s', B: '10 m/s', C: '2 m/s', D: '0 m/s' },
        correctAnswer: 'A',
      };
      const result2 = validateQuestionTopicRelevance(q2, context);
      assert.equal(result2.valid, false);
      assert.ok(result2.reason?.includes('unrelated physics chapter outside Kinematics'));
    });

    it('enforces subject-specific topic scoping for Biology (The Cell vs Mendel ratio)', () => {
      const context: ValidationContext = { subject: 'Biology', topic: 'The Cell', grade: '9' };
      const q = {
        question: 'What organelle inside the eukaryotic cell demonstrates Mendel\'s ratio 3:1 in genetics?',
        options: { A: 'Mitochondria', B: 'Nucleus', C: 'Ribosome', D: 'Chloroplast' },
        correctAnswer: 'B',
      };
      const result = validateQuestionTopicRelevance(q, context);
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('unrelated biology chapter outside The Cell'));
    });
  });

  describe('validateMCQQuestion', () => {
    const validMCQ: MCQQuestion = {
      id: 'mcq1',
      question: 'Which organelle is responsible for cellular respiration and ATP production?',
      options: {
        A: 'Mitochondria',
        B: 'Ribosome',
        C: 'Golgi apparatus',
        D: 'Endoplasmic reticulum',
      },
      correctAnswer: 'A',
      explanation: 'Mitochondria produce ATP through aerobic respiration.',
    };

    it('returns invalid if question object is null or not an object', () => {
      assert.deepEqual(validateMCQQuestion(null), { valid: false, reason: 'Question object is invalid or null' });
      assert.deepEqual(validateMCQQuestion('not an object'), { valid: false, reason: 'Question object is invalid or null' });
      assert.deepEqual(validateMCQQuestion(123), { valid: false, reason: 'Question object is invalid or null' });
    });

    it('returns invalid if question text is too short (< 15 characters)', () => {
      const q = { ...validMCQ, question: 'What is x?' };
      const result = validateMCQQuestion(q);
      assert.equal(result.valid, false);
      assert.equal(result.reason, 'Question text is too short (< 15 characters)');
    });

    it('returns invalid if question text contains forbidden meta phrases', () => {
      const q1 = { ...validMCQ, question: 'Which statement is factually and conceptually accurate according to the textbook?' };
      const r1 = validateMCQQuestion(q1);
      assert.equal(r1.valid, false);
      assert.ok(r1.reason?.includes('forbidden meta'));

      const q2 = { ...validMCQ, question: 'This is a placeholder question for testing purposes.' };
      const r2 = validateMCQQuestion(q2);
      assert.equal(r2.valid, false);
      assert.ok(r2.reason?.includes('forbidden meta'));
    });

    it('returns invalid if options object is missing or invalid', () => {
      const q1 = { ...validMCQ, options: null };
      const r1 = validateMCQQuestion(q1);
      assert.equal(r1.valid, false);
      assert.equal(r1.reason, 'Options object is missing or invalid');

      const q2 = { ...validMCQ, options: 'invalid' };
      const r2 = validateMCQQuestion(q2);
      assert.equal(r2.valid, false);
      assert.equal(r2.reason, 'Options object is missing or invalid');
    });

    it('returns invalid if any option value is empty or missing', () => {
      const q = {
        ...validMCQ,
        options: { A: 'Mitochondria', B: '', C: 'Golgi', D: 'ER' },
      };
      const result = validateMCQQuestion(q);
      assert.equal(result.valid, false);
      assert.equal(result.reason, 'One or more options are empty');
    });

    it('returns invalid if option choices are not 4 distinct values', () => {
      const q = {
        ...validMCQ,
        options: { A: 'Mitochondria', B: 'mitochondria', C: 'Golgi', D: 'ER' },
      };
      const result = validateMCQQuestion(q);
      assert.equal(result.valid, false);
      assert.equal(result.reason, 'Options must be 4 distinct choices');
    });

    it('returns invalid if any option contains forbidden meta phrases', () => {
      const q = {
        ...validMCQ,
        options: { A: 'Mitochondria', B: 'Option B text', C: 'Golgi', D: 'ER' },
      };
      const result = validateMCQQuestion(q);
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('forbidden meta'));
    });

    it('returns invalid if correctAnswer is not A, B, C, or D', () => {
      const q1 = { ...validMCQ, correctAnswer: 'E' };
      const r1 = validateMCQQuestion(q1);
      assert.equal(r1.valid, false);
      assert.equal(r1.reason, 'Invalid correctAnswer: E');

      const q2 = { ...validMCQ, correctAnswer: '' };
      const r2 = validateMCQQuestion(q2);
      assert.equal(r2.valid, false);
      assert.equal(r2.reason, 'Invalid correctAnswer: ');
    });

    it('accepts valid question with correct options and correctAnswer', () => {
      const result = validateMCQQuestion(validMCQ);
      assert.equal(result.valid, true);
      assert.equal(result.reason, undefined);
    });

    it('validates question against ValidationContext if context is provided', () => {
      const context: ValidationContext = { subject: 'Physics', topic: 'Kinematics', grade: '9' };
      const validPhysicsQ: MCQQuestion = {
        id: 'p1',
        question: 'What is the acceleration of a body moving with uniform velocity in straight line?',
        options: { A: 'Zero', B: '9.8 m/s^2', C: 'Constant', D: 'Infinite' },
        correctAnswer: 'A',
        explanation: 'Acceleration is zero when velocity is uniform.',
      };
      const result = validateMCQQuestion(validPhysicsQ, context);
      assert.equal(result.valid, true);

      const offTopicQ: MCQQuestion = {
        ...validPhysicsQ,
        question: 'What is uniform velocity calculated using specific heat capacity of water?',
      };
      const offTopicResult = validateMCQQuestion(offTopicQ, context);
      assert.equal(offTopicResult.valid, false);
      assert.ok(offTopicResult.reason?.includes('unrelated physics chapter'));
    });
  });

  describe('filterAndValidateMCQs', () => {
    const validQ1: MCQQuestion = {
      id: 'q1',
      question: 'Which blood vessel carries oxygenated blood from lungs to the heart?',
      options: { A: 'Pulmonary vein', B: 'Pulmonary artery', C: 'Vena cava', D: 'Aorta' },
      correctAnswer: 'A',
      explanation: 'Pulmonary vein carries oxygenated blood.',
    };

    const validQ2: MCQQuestion = {
      id: 'q2',
      question: 'What is the main function of red blood cells in the human body?',
      options: { A: 'Transport oxygen', B: 'Fight infection', C: 'Blood clotting', D: 'Produce antibodies' },
      correctAnswer: 'A',
      explanation: 'RBCs contain hemoglobin to carry oxygen.',
    };

    const invalidQ: MCQQuestion = {
      id: 'q3',
      question: 'Short question',
      options: { A: 'A', B: 'B', C: 'C', D: 'D' },
      correctAnswer: 'A',
      explanation: 'Invalid short question.',
    };

    const fallbackQ: MCQQuestion = {
      id: 'fb1',
      question: 'Which component of blood is responsible for clotting at wound sites?',
      options: { A: 'Platelets', B: 'Plasma', C: 'Hemoglobin', D: 'White blood cells' },
      correctAnswer: 'A',
      explanation: 'Platelets aid blood clotting.',
    };

    it('filters out invalid and duplicate questions and returns up to requiredCount', () => {
      const questions = [validQ1, invalidQ, validQ2];
      const result = filterAndValidateMCQs(questions, 2);
      assert.equal(result.length, 2);
      assert.equal(result[0].id, 'q1');
      assert.equal(result[1].id, 'q2');
    });

    it('excludes questions matching excludeTexts', () => {
      const excludeText = 'Which blood vessel carries oxygenated blood from lungs to the heart?';
      const result = filterAndValidateMCQs([validQ1, validQ2], 2, [], undefined, [excludeText]);
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'q2');
    });

    it('backfills from fallbackPool if candidate questions are insufficient', () => {
      const questions = [validQ1];
      const fallbackPool = [fallbackQ];
      const result = filterAndValidateMCQs(questions, 2, fallbackPool);
      assert.equal(result.length, 2);
      assert.equal(result[0].id, 'q1');
      assert.equal(result[1].id, 'fb1');
    });
  });
});
