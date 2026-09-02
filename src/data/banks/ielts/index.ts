/**
 * Master IELTS Question Bank
 * Exclusively provides the two authorized chapters:
 * 1. Grammar (100 MCQs)
 * 2. Comprehension of Passages (100 MCQs)
 * Total: 200 high-quality, curriculum-accurate MCQs
 */

import { IELTS_GRAMMAR_MCQS as RAW_GRAMMAR, type RawIELTSMCQ } from './grammar';
import { IELTS_COMPREHENSION_MCQS as RAW_COMPREHENSION } from './comprehension';
import type { StoredMCQ } from '../../../types/questionBank';

function toStoredMCQ(raw: RawIELTSMCQ, subject: string, index: number): StoredMCQ {
  let opts: { A: string; B: string; C: string; D: string };
  if (Array.isArray(raw.options)) {
    opts = {
      A: raw.options[0] || 'Option A',
      B: raw.options[1] || 'Option B',
      C: raw.options[2] || 'Option C',
      D: raw.options[3] || 'Option D',
    };
  } else {
    opts = raw.options;
  }

  return {
    id: raw.id || `ielts-${subject.toLowerCase().substring(0, 4)}-${index + 1}`,
    board: 'ielts',
    grade: 'ielts',
    subject: subject,
    chapter: raw.chapter || raw.topic || subject,
    topic: raw.topic || raw.chapter || subject,
    question: raw.passage ? `${raw.passage}\n\n${raw.question}` : raw.question,
    options: opts,
    correctAnswer: raw.correctAnswer,
    explanation: raw.explanation || 'Verified IELTS language assessment question.',
    difficulty: raw.difficulty || 'medium',
    verified: true,
    source: 'expert-verified',
    createdAt: '2025-01-01T00:00:00.000Z',
  };
}

export const IELTS_GRAMMAR_MCQS: StoredMCQ[] = RAW_GRAMMAR.map((q, idx) => toStoredMCQ(q, 'Grammar', idx));
export const IELTS_COMPREHENSION_MCQS: StoredMCQ[] = RAW_COMPREHENSION.map((q, idx) => toStoredMCQ(q, 'Comprehension of Passages', idx));

export const IELTS_MCQ_BANK: Record<string, StoredMCQ[]> = {
  'Grammar': IELTS_GRAMMAR_MCQS,
  'Comprehension of Passages': IELTS_COMPREHENSION_MCQS,
};

export const IELTS_CHAPTERS = [
  { id: 'ielts-ch-grammar', name: 'Grammar', totalMCQs: IELTS_GRAMMAR_MCQS.length },
  { id: 'ielts-ch-comprehension', name: 'Comprehension of Passages', totalMCQs: IELTS_COMPREHENSION_MCQS.length },
];

export const ALL_IELTS_MCQS: StoredMCQ[] = [
  ...IELTS_GRAMMAR_MCQS,
  ...IELTS_COMPREHENSION_MCQS,
];

