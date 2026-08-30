import type { StoredLongQuestion } from '../../types/questionBank';
import { grade9LongQuestionsBank } from './index';

/**
 * Authoritative Curated Long Question Bank
 * Comprehensive multi-part long questions, theoretical derivations,
 * and numerical problems for Grade 9 (all subjects and all chapters) and Grade 10 curriculum.
 */
export const longQuestionsBank: Record<string, Record<string, StoredLongQuestion[]>> = {
  ...grade9LongQuestionsBank,
  // Grade 10 additions
  MathematicsGrade10: {
    'Quadratic Equations': [
      {
        id: 'lq_math10_ch1_01',
        board: 'fbise',
        grade: '10',
        subject: 'Mathematics',
        chapter: 'Quadratic Equations',
        chapterNumber: 1,
        question: 'Solve the system of quadratic equations and derive the nature of roots using the discriminant.',
        parts: [
          {
            label: '(a)',
            text: 'Derive the quadratic formula $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ from the standard quadratic equation $ax^2 + bx + c = 0$ by completing the square.',
            marks: 5
          },
          {
            label: '(b)',
            text: 'Discuss the nature of roots of $2x^2 - 7x + 3 = 0$ without solving the equation.',
            marks: 3
          }
        ],
        modelAnswer: '(a) Starting from $ax^2 + bx + c = 0$, divide by $a$: $x^2 + (b/a)x = -c/a$. Add $(b/2a)^2$ to both sides: $(x + b/2a)^2 = (b^2 - 4ac)/(4a^2)$. Taking square root: $x + b/2a = \\pm \\sqrt{b^2-4ac}/(2a)$. Thus $x = (-b \\pm \\sqrt{b^2-4ac})/(2a).\n\n(b) Discriminant $\\Delta = b^2 - 4ac = (-7)^2 - 4(2)(3) = 49 - 24 = 25 > 0$. Since $\\Delta = 25 = 5^2$ is a positive perfect square, the roots are real, rational, and unequal.',
        markingScheme: [
          '2 marks for completing the square step',
          '3 marks for algebraic simplification to final formula',
          '2 marks for discriminant calculation $\\Delta = 25$',
          '1 mark for concluding roots are real, rational, and unequal'
        ],
        marks: 8,
        difficulty: 'hard',
        verified: true,
        source: 'curriculum-bank'
      }
    ]
  }
};

export default longQuestionsBank;
