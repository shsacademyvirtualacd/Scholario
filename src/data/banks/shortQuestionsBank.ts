import type { StoredShortQuestion } from '../../types/questionBank';
import { grade9ShortQuestionsBank } from './index';

/**
 * Authoritative Curated Short Question Bank
 * Covers Grade 9 (all subjects and all chapters) and Grade 10 curriculum.
 */
export const shortQuestionsBank: Record<string, Record<string, StoredShortQuestion[]>> = {
  ...grade9ShortQuestionsBank,
  // Grade 10 additions
  MathematicsGrade10: {
    'Quadratic Equations': [
      {
        id: 'sq_math10_ch1_01',
        board: 'fbise',
        grade: '10',
        subject: 'Mathematics',
        chapter: 'Quadratic Equations',
        chapterNumber: 1,
        question: 'Solve the quadratic equation 2x² - 5x + 3 = 0 by factorization.',
        modelAnswer: '2x² - 5x + 3 = 0. Splitting the middle term: 2x² - 2x - 3x + 3 = 0 => 2x(x - 1) - 3(x - 1) = 0 => (2x - 3)(x - 1) = 0. Hence x = 3/2 or x = 1. Solution set: {1, 3/2}.',
        keyPoints: ['Factoring into (2x - 3)(x - 1)', 'Roots x = 1, x = 3/2', 'Solution set notation'],
        marks: 3,
        difficulty: 'easy',
        verified: true,
        source: 'curriculum-bank'
      },
      {
        id: 'sq_math10_ch1_02',
        board: 'fbise',
        grade: '10',
        subject: 'Mathematics',
        chapter: 'Quadratic Equations',
        chapterNumber: 1,
        question: 'State the Quadratic Formula. Use it to solve x² - 3x - 10 = 0.',
        modelAnswer: 'Quadratic Formula: x = (-b ± √(b² - 4ac)) / (2a). Here a = 1, b = -3, c = -10. Discriminant = (-3)² - 4(1)(-10) = 9 + 40 = 49. x = (3 ± √49) / 2 = (3 ± 7) / 2 => x = 10/2 = 5 or x = -4/2 = -2. Solution set: {-2, 5}.',
        keyPoints: ['Correct quadratic formula formula', 'Discriminant calculation = 49', 'Roots {-2, 5}'],
        marks: 3,
        difficulty: 'easy',
        verified: true,
        source: 'curriculum-bank'
      }
    ]
  }
};

export default shortQuestionsBank;
