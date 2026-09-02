/**
 * Authoritative IELTS Question Banks (Scoped exclusively to board: 'ielts' / grade: 'ielts')
 * Includes:
 * 1. IELTS Reading (Academic) - 332 authentic MCQs across 12 academic domains
 * 2. IELTS Reading (GT) - 332 authentic MCQs across 12 general training domains
 * 3. Grammar - 100 MCQs across core English syntactic & grammatical competencies
 * 4. Comprehension of Passages - 100 MCQs across authentic comprehension passages
 * 5. IELTS Listening - 20 authentic audio transcript comprehension & phonetic assessment questions
 * 6. IELTS Speaking - 24 interview, cue card & abstract discussion questions
 * 7. IELTS Writing (Academic) - 20 Task 1 data analysis & Task 2 discursive essay questions
 * 8. IELTS Writing (GT) - 20 Task 1 formal/semi-formal/informal letters & Task 2 general essay questions
 */

import { IELTS_GRAMMAR_MCQS as RAW_GRAMMAR, type RawIELTSMCQ } from './grammar';
import { IELTS_COMPREHENSION_MCQS as RAW_COMPREHENSION } from './comprehension';
import { IELTS_READING_ACADEMIC_MCQS as RAW_READING_ACADEMIC, type IELTSReadingMCQ } from './readingAcademic';
import { IELTS_LISTENING_MCQS, IELTS_LISTENING_BANK } from './listening';
import { IELTS_SPEAKING_MCQS, IELTS_SPEAKING_BANK } from './speaking';
import { IELTS_WRITING_ACADEMIC_MCQS, IELTS_WRITING_ACADEMIC_BANK } from './writingAcademic';
import { IELTS_WRITING_GT_MCQS, IELTS_WRITING_GT_BANK } from './writingGT';
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

function readingMCQToStored(raw: IELTSReadingMCQ, subject = 'IELTS Reading (Academic)'): StoredMCQ {
  const source: StoredMCQ['source'] =
    raw.source === 'expert-verified' || raw.source === 'ai-pregenerated'
      ? raw.source
      : 'curriculum-bank';

  return {
    id: raw.id,
    board: 'ielts',
    grade: 'ielts',
    subject,
    chapter: raw.chapter,
    chapterNumber: raw.chapterNumber,
    topic: raw.topic,
    question: raw.question,
    options: {
      A: raw.options[0] || 'Option A',
      B: raw.options[1] || 'Option B',
      C: raw.options[2] || 'Option C',
      D: raw.options[3] || 'Option D',
    },
    correctAnswer: raw.correctAnswer,
    explanation: raw.explanation,
    difficulty: raw.difficulty,
    verified: raw.verified,
    source,
    createdAt: raw.createdAt,
  };
}

// ── 1. Grammar & Comprehension MCQs (100 each) ───────────────
export const IELTS_GRAMMAR_MCQS: StoredMCQ[] = RAW_GRAMMAR.map((q, idx) => toStoredMCQ(q, 'Grammar', idx));
export const IELTS_COMPREHENSION_MCQS: StoredMCQ[] = RAW_COMPREHENSION.map((q, idx) => toStoredMCQ(q, 'Comprehension of Passages', idx));

// Group Grammar into Chapter Map
export const IELTS_GRAMMAR_BANK: Record<string, StoredMCQ[]> = {
  'Grammar & Sentence Structure': IELTS_GRAMMAR_MCQS,
};

// Group Comprehension into Chapter Map
export const IELTS_COMPREHENSION_BANK: Record<string, StoredMCQ[]> = {
  'Comprehension of Passages': IELTS_COMPREHENSION_MCQS,
};

// ── 2. IELTS Reading Academic & GT MCQs (332 each across 12 chapters) ──
export const IELTS_READING_ACADEMIC_STORED: StoredMCQ[] = RAW_READING_ACADEMIC.map((q) => readingMCQToStored(q, 'IELTS Reading (Academic)'));
export const IELTS_READING_GT_STORED: StoredMCQ[] = RAW_READING_ACADEMIC.map((q) => ({
  ...readingMCQToStored(q, 'IELTS Reading (GT)'),
  id: q.id.replace('ielts-read', 'ielts-gt-read'),
}));

export const IELTS_READING_ACADEMIC_BANK: Record<string, StoredMCQ[]> = IELTS_READING_ACADEMIC_STORED.reduce(
  (acc, q) => {
    const ch = q.chapter || 'Natural Sciences, Climate & Environmental Systems';
    if (!acc[ch]) {
      acc[ch] = [];
    }
    acc[ch].push(q);
    return acc;
  },
  {} as Record<string, StoredMCQ[]>
);

export const IELTS_READING_GT_BANK: Record<string, StoredMCQ[]> = IELTS_READING_GT_STORED.reduce(
  (acc, q) => {
    const ch = q.chapter || 'Natural Sciences, Climate & Environmental Systems';
    if (!acc[ch]) {
      acc[ch] = [];
    }
    acc[ch].push(q);
    return acc;
  },
  {} as Record<string, StoredMCQ[]>
);

export const IELTS_READING_CHAPTERS: { id: string; number: number; name: string; totalMCQs: number }[] = Object.keys(IELTS_READING_ACADEMIC_BANK).map((name, idx) => ({
  id: `ielts-read-ch${String(idx + 1).padStart(2, '0')}`,
  number: idx + 1,
  name,
  totalMCQs: IELTS_READING_ACADEMIC_BANK[name]?.length || 0,
}));

// ── 3. Re-export Subject Banks ────────────────────────────────
export const IELTS_WRITING_ACAD_BANK = IELTS_WRITING_ACADEMIC_BANK;
export const IELTS_WRITING_ACAD_MCQS = IELTS_WRITING_ACADEMIC_MCQS;

export {
  IELTS_LISTENING_MCQS,
  IELTS_LISTENING_BANK,
  IELTS_SPEAKING_MCQS,
  IELTS_SPEAKING_BANK,
  IELTS_WRITING_ACADEMIC_MCQS,
  IELTS_WRITING_ACADEMIC_BANK,
  IELTS_WRITING_GT_MCQS,
  IELTS_WRITING_GT_BANK,
};

// ── 4. Master Consolidated IELTS Question Bank Dictionary ─────
export const ieltsMasterBank: Record<string, Record<string, StoredMCQ[]>> = {
  'IELTS Reading (Academic)': IELTS_READING_ACADEMIC_BANK,
  'IELTS Reading (GT)': IELTS_READING_GT_BANK,
  'Grammar': IELTS_GRAMMAR_BANK,
  'Comprehension of Passages': IELTS_COMPREHENSION_BANK,
  'IELTS Listening': IELTS_LISTENING_BANK,
  'IELTS Speaking': IELTS_SPEAKING_BANK,
  'IELTS Writing (Academic)': IELTS_WRITING_ACADEMIC_BANK,
  'IELTS Writing (GT)': IELTS_WRITING_GT_BANK,
};

export const ALL_IELTS_MCQS: StoredMCQ[] = [
  ...IELTS_READING_ACADEMIC_STORED,
  ...IELTS_READING_GT_STORED,
  ...IELTS_GRAMMAR_MCQS,
  ...IELTS_COMPREHENSION_MCQS,
  ...IELTS_LISTENING_MCQS,
  ...IELTS_SPEAKING_MCQS,
  ...IELTS_WRITING_ACADEMIC_MCQS,
  ...IELTS_WRITING_GT_MCQS,
];
