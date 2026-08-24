/**
 * FBISE Grade 9 Static Question Bank
 * Provides offline/instant retrieval for verified curriculum MCQs.
 */

import type { StoredMCQ } from '../types/questionBank';
import type { MCQQuestion, MCQDifficulty } from '../types/selfTest';
import { normalizeFBISEGrade9Subject } from './curriculumFBISE9';
import { grade9FbiseBank } from '../data/banks';

export const FBISE_9_QUESTION_BANK: Record<string, Record<string, StoredMCQ[]>> = grade9FbiseBank as any;

/**
 * Retrieves questions from the static Grade 9 FBISE Question Bank
 */
export function getGrade9FBISEQuestions(
  subject: string,
  chapters: string[] = [],
  count: number = 10,
  difficulty: MCQDifficulty = 'medium',
  excludeTexts: string[] = []
): MCQQuestion[] {
  const normSub = normalizeFBISEGrade9Subject(subject) || subject;
  const subjectBank = FBISE_9_QUESTION_BANK[normSub] || {};

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
