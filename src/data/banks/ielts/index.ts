/**
 * Authoritative IELTS Question Bank (Scoped exclusively to board: 'ielts' / grade: 'ielts')
 * Cleaned to contain the 1,000 authoritative IELTS Grammar MCQs.
 * All non-Grammar MCQ banks (Reading Academic, Reading GT, Comprehension, Listening, Speaking, Writing) are set to 0.
 */

import { IELTS_GRAMMAR_MCQS as RAW_GRAMMAR, type RawIELTSMCQ } from './grammar';
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
    id: raw.id || `ielts-${subject.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 6)}-${index + 1}`,
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

// ── 1. 1,000 Authoritative Grammar MCQs ──────────────────────────────
export const IELTS_GRAMMAR_MCQS: StoredMCQ[] = RAW_GRAMMAR.map((q, idx) => toStoredMCQ(q, 'Grammar', idx));

// Group Grammar into Chapter Map
export const IELTS_GRAMMAR_BANK: Record<string, StoredMCQ[]> = {
  'Grammar & Sentence Structure': IELTS_GRAMMAR_MCQS,
};

// ── 2. Cleared Non-Grammar Subject MCQ Banks (0 Questions) ──────────
export const IELTS_COMPREHENSION_MCQS: StoredMCQ[] = [];
export const IELTS_COMPREHENSION_BANK: Record<string, StoredMCQ[]> = {
  'Comprehension of Passages': [],
};

export const IELTS_READING_ACADEMIC_STORED: StoredMCQ[] = [];
export const IELTS_READING_GT_STORED: StoredMCQ[] = [];
export const IELTS_READING_ACADEMIC_BANK: Record<string, StoredMCQ[]> = {};
export const IELTS_READING_GT_BANK: Record<string, StoredMCQ[]> = {};
export const IELTS_READING_CHAPTERS: { id: string; number: number; name: string; totalMCQs: number }[] = [];

export const IELTS_LISTENING_MCQS: StoredMCQ[] = [];
export const IELTS_LISTENING_BANK: Record<string, StoredMCQ[]> = {
  'Section 1 (Social Conversation)': [],
  'Section 2 (Social Monologue)': [],
  'Section 3 (Academic Discussion)': [],
  'Section 4 (Academic Lecture)': [],
};

export const IELTS_SPEAKING_MCQS: StoredMCQ[] = [];
export const IELTS_SPEAKING_BANK: Record<string, StoredMCQ[]> = {
  'Part 1 (Introduction & Familiar Topics)': [],
  'Part 2 (Individual Long Turn Cue Card)': [],
  'Part 3 (Two-Way Abstract Discussion)': [],
};

export const IELTS_WRITING_ACADEMIC_MCQS: StoredMCQ[] = [];
export const IELTS_WRITING_ACADEMIC_BANK: Record<string, StoredMCQ[]> = {
  'Academic Task 1 (Data Synthesis)': [],
  'Academic Task 2 (Discursive Essay)': [],
};
export const IELTS_WRITING_ACAD_BANK = IELTS_WRITING_ACADEMIC_BANK;
export const IELTS_WRITING_ACAD_MCQS = IELTS_WRITING_ACADEMIC_MCQS;

export const IELTS_WRITING_GT_MCQS: StoredMCQ[] = [];
export const IELTS_WRITING_GT_BANK: Record<string, StoredMCQ[]> = {
  'GT Task 1 (Letters & Correspondence)': [],
  'GT Task 2 (General Essay)': [],
};

export {
  IELTS_LISTENING_SHORT_QUESTIONS,
  IELTS_SPEAKING_SHORT_QUESTIONS,
  IELTS_WRITING_ACADEMIC_SHORT_QUESTIONS,
  IELTS_WRITING_GT_SHORT_QUESTIONS,
  ALL_IELTS_SHORT_QUESTIONS,
} from './shortQuestions';

export {
  IELTS_LISTENING_LONG_QUESTIONS,
  IELTS_SPEAKING_LONG_QUESTIONS,
  IELTS_WRITING_ACADEMIC_LONG_QUESTIONS,
  IELTS_WRITING_GT_LONG_QUESTIONS,
  ALL_IELTS_LONG_QUESTIONS,
} from './longQuestions';

// ── 3. Master Consolidated IELTS Question Bank Dictionary ─────
// Contains ONLY Grammar (1,000 questions) and empty arrays for other subjects
export const ieltsMasterBank: Record<string, Record<string, StoredMCQ[]>> = {
  'Grammar': IELTS_GRAMMAR_BANK,
  'IELTS Reading (Academic)': IELTS_READING_ACADEMIC_BANK,
  'IELTS Reading (GT)': IELTS_READING_GT_BANK,
  'Comprehension of Passages': IELTS_COMPREHENSION_BANK,
  'IELTS Listening': IELTS_LISTENING_BANK,
  'IELTS Speaking': IELTS_SPEAKING_BANK,
  'IELTS Writing (Academic)': IELTS_WRITING_ACADEMIC_BANK,
  'IELTS Writing (GT)': IELTS_WRITING_GT_BANK,
};

// Exclusively 1,000 Grammar MCQs
export const ALL_IELTS_MCQS: StoredMCQ[] = [
  ...IELTS_GRAMMAR_MCQS,
];

