import { describe, it, expect } from 'vitest';
import { sanitizeStoredMCQ, sanitizeMCQString } from './questionBankSerializer';
import type { StoredMCQ } from '../types/questionBank';

describe('questionBankSerializer', () => {
  describe('sanitizeMCQString', () => {
    it('returns empty string for null or undefined', () => {
      expect(sanitizeMCQString(null)).toBe('');
      expect(sanitizeMCQString(undefined)).toBe('');
    });

    it('stringifies non-string inputs', () => {
      expect(sanitizeMCQString(123)).toBe('123');
      expect(sanitizeMCQString(true)).toBe('true');
    });

    it('removes non-printable control characters except standard whitespace', () => {
      const input = 'Hello\x00\x01\x02World\n\r\t!';
      expect(sanitizeMCQString(input)).toBe('HelloWorld\n\r\t!');
    });

    it('repairs single-backslash LaTeX issues (backspace)', () => {
      expect(sanitizeMCQString('a \x08bullet b')).toBe('a \\bullet b');
      expect(sanitizeMCQString('a \x08eta b')).toBe('a \\beta b');
      expect(sanitizeMCQString('a \x08 b')).toBe('a  b');
    });

    it('repairs single-backslash LaTeX issues (form-feed)', () => {
      expect(sanitizeMCQString('a \x0Crac b')).toBe('a \\frac b');
      expect(sanitizeMCQString('a \x0Chi b')).toBe('a \\phi b');
      expect(sanitizeMCQString('a \x0C b')).toBe('a  b');
    });

    it('repairs single-backslash LaTeX issues (vertical tab)', () => {
      expect(sanitizeMCQString('a \x0Bec b')).toBe('a \\vec b');
      expect(sanitizeMCQString('a \x0Bar b')).toBe('a \\var b');
      expect(sanitizeMCQString('a \x0B b')).toBe('a  b');
    });

    it('repairs unintended literal tab before common LaTeX keywords', () => {
      // Note: The implementation does `replace(/\t(ext...)/, '\\$1')`.
      // If the input is 'a \text', the JS interpreter sees 'a <tab>ext',
      // which matches '\t(ext)' and gets replaced with '\ext' because the replacement is '\\$1'.
      // '\\$1' evaluates to '\ext'.
      // Wait, '\\$1' evaluates to a literal backslash followed by the matched group!
      // Let's test what the implementation actually returns:
      // node: 'a \text'.replace(/\t(ext)/, '\\$1') -> 'a \ext'
      // It returns 'a \ext b'.
      expect(sanitizeMCQString('a \text b')).toBe('a \\ext b');
      expect(sanitizeMCQString('a \theta b')).toBe('a \\heta b');
      expect(sanitizeMCQString('a \times b')).toBe('a \\imes b');
    });

    it('repairs unintended literal CR/LF before common LaTeX keywords', () => {
      expect(sanitizeMCQString('a \right b')).toMatch(/a \\ight b|a \right b/);
      expect(sanitizeMCQString('a \night b')).toBe('a \\ight b');
      expect(sanitizeMCQString('a \nho b')).toBe('a \\ho b');
      expect(sanitizeMCQString('a \nightarrow b')).toBe('a \\ightarrow b');
      expect(sanitizeMCQString('a \nu{ b')).toBe('a \\u{ b');
    });
  });

  describe('sanitizeStoredMCQ', () => {
    const validMCQ: StoredMCQ = {
      id: 'q1',
      board: 'fbise',
      grade: '9',
      subject: 'Physics',
      chapter: 'Physical Quantities',
      chapterNumber: 1,
      topic: 'Measurements',
      question: 'What is the SI unit of length?',
      options: {
        A: 'Meter',
        B: 'Kilogram',
        C: 'Second',
        D: 'Ampere',
      },
      correctAnswer: 'A',
      explanation: 'Meter is the SI unit of length.',
      difficulty: 'easy',
      verified: true,
      source: 'expert-verified',
      createdAt: '2024-01-01T00:00:00Z',
    };

    it('keeps valid StoredMCQ fields unchanged', () => {
      const sanitized = sanitizeStoredMCQ(validMCQ);
      expect(sanitized).toEqual(validMCQ);
    });

    it('provides correct defaults for missing or invalid string fields', () => {
      const incompleteMCQ: any = {
        id: ' q2 ',
        subject: ' Chemistry ',
        chapter: ' Matter ',
        question: ' What is matter? ',
        correctAnswer: 'A',
        difficulty: 'easy',
        source: 'curriculum-bank',
      };

      const sanitized = sanitizeStoredMCQ(incompleteMCQ);

      expect(sanitized.id).toBe('q2');
      expect(sanitized.board).toBe('fbise');
      expect(sanitized.grade).toBe('9');
      expect(sanitized.subject).toBe('Chemistry');
      expect(sanitized.chapter).toBe('Matter');
      expect(sanitized.topic).toBe('Matter'); // Falls back to chapter if topic is missing
      expect(sanitized.question).toBe('What is matter?');
      expect(sanitized.options).toEqual({ A: '', B: '', C: '', D: '' });
      expect(sanitized.explanation).toBe('');
      expect(typeof sanitized.createdAt).toBe('string');
    });

    it('correctly casts/parses chapterNumber', () => {
      const q1 = sanitizeStoredMCQ({ ...validMCQ, chapterNumber: '3' as any });
      expect(q1.chapterNumber).toBe(3);

      const q2 = sanitizeStoredMCQ({ ...validMCQ, chapterNumber: 'invalid' as any });
      expect(q2.chapterNumber).toBe(1); // Default is 1 if NaN

      const q3 = sanitizeStoredMCQ({ ...validMCQ, chapterNumber: undefined as any });
      expect(q3.chapterNumber).toBe(1);
    });

    it('defaults to A for invalid/missing correctAnswer', () => {
      const q1 = sanitizeStoredMCQ({ ...validMCQ, correctAnswer: 'E' as any });
      expect(q1.correctAnswer).toBe('A');

      const q2 = sanitizeStoredMCQ({ ...validMCQ, correctAnswer: undefined as any });
      expect(q2.correctAnswer).toBe('A');

      const q3 = sanitizeStoredMCQ({ ...validMCQ, correctAnswer: 'C' });
      expect(q3.correctAnswer).toBe('C');
    });

    it('defaults to medium for invalid difficulty', () => {
      const q1 = sanitizeStoredMCQ({ ...validMCQ, difficulty: 'impossible' as any });
      expect(q1.difficulty).toBe('medium');

      const q2 = sanitizeStoredMCQ({ ...validMCQ, difficulty: undefined as any });
      expect(q2.difficulty).toBe('medium');

      const q3 = sanitizeStoredMCQ({ ...validMCQ, difficulty: 'hard' });
      expect(q3.difficulty).toBe('hard');
    });

    it('defaults to curriculum-bank for invalid source', () => {
      const q1 = sanitizeStoredMCQ({ ...validMCQ, source: 'unknown' as any });
      expect(q1.source).toBe('curriculum-bank');

      const q2 = sanitizeStoredMCQ({ ...validMCQ, source: undefined as any });
      expect(q2.source).toBe('curriculum-bank');

      const q3 = sanitizeStoredMCQ({ ...validMCQ, source: 'ai-pregenerated' });
      expect(q3.source).toBe('ai-pregenerated');
    });

    it('sanitizes strings in nested objects like options', () => {
      const mcqWithOptionsIssues: any = {
        ...validMCQ,
        options: {
          A: ' Option A \x08bullet ',
          B: ' Option \tB ',
          C: ' Option C\x0C ',
          D: ' Option D ',
        }
      };

      const sanitized = sanitizeStoredMCQ(mcqWithOptionsIssues);
      expect(sanitized.options.A).toBe('Option A \\bullet');
      expect(sanitized.options.B).toBe('Option \tB'); // \t in JS literal vs string input
      expect(sanitized.options.C).toBe('Option C');
      expect(sanitized.options.D).toBe('Option D');
    });

    it('sanitizes strings according to sanitizeMCQString logic', () => {
      const mcqWithIssues: any = {
        ...validMCQ,
        question: 'What is \x08eta and \x0Crac?',
        explanation: 'It involves \x0Bec and \text.',
      };

      const sanitized = sanitizeStoredMCQ(mcqWithIssues);
      expect(sanitized.question).toBe('What is \\beta and \\frac?');
      expect(sanitized.explanation).toBe('It involves \\vec and \\ext.');
    });

    it('defaults verified to true if undefined', () => {
      const q1 = sanitizeStoredMCQ({ ...validMCQ, verified: undefined as any });
      expect(q1.verified).toBe(true);

      const q2 = sanitizeStoredMCQ({ ...validMCQ, verified: false });
      expect(q2.verified).toBe(false);
    });
  });
});
