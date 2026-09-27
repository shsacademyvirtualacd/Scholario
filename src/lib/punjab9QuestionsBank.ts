/**
 * Punjab Board Grade 9 Static Question Bank
 * Provides offline/instant retrieval for verified Punjab Board curriculum MCQs.
 * Fully independent copy separate from FBISE Grade 9 bank.
 */

import type { StoredMCQ } from '../types/questionBank';
import type { MCQQuestion, MCQDifficulty } from '../types/selfTest';
import { normalizeFBISEGrade9Subject } from './curriculumFBISE9';
import { grade9PunjabBank } from '../data/banks';

export const PUNJAB_9_QUESTION_BANK: Record<string, Record<string, StoredMCQ[]>> = grade9PunjabBank as any;

/**
 * Retrieves questions from the static Grade 9 Punjab Board Question Bank
 */
export function getGrade9PunjabQuestions(
  subject: string,
  chapters: string[] = [],
  count: number = 10,
  difficulty: MCQDifficulty = 'medium',
  excludeTexts: string[] = []
): MCQQuestion[] {
  const normSub = normalizeFBISEGrade9Subject(subject) || subject;
  const subjectBank = PUNJAB_9_QUESTION_BANK[normSub] || {};

  const excludeSet = new Set(excludeTexts.map((t) => t.trim().toLowerCase()));
  const pool: StoredMCQ[] = [];

  const targetChapters =
    chapters && chapters.length > 0 && chapters[0] !== 'Full Syllabus' && chapters[0] !== 'Mixed Chapters' && chapters[0] !== 'All'
      ? chapters
      : Object.keys(subjectBank);

  for (const chName of targetChapters) {
    let matchedKey = Object.keys(subjectBank).find(
      (k) => k.toLowerCase() === chName.toLowerCase()
    );
    if (!matchedKey) {
      matchedKey = Object.keys(subjectBank).find(
        (k) => k.toLowerCase().includes(chName.toLowerCase()) || chName.toLowerCase().includes(k.toLowerCase())
      );
    }

    const chQuestions = matchedKey ? subjectBank[matchedKey] || [] : [];
    for (const q of chQuestions) {
      if (!excludeSet.has(q.question.trim().toLowerCase())) {
        pool.push(q);
      }
    }
  }

  // Shuffle and pick
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    difficulty: (q.difficulty as MCQDifficulty) || difficulty,
    topic: q.topic || q.chapter,
  }));
}
