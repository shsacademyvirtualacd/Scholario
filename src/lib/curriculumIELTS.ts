/**
 * Authoritative IELTS Academic Curriculum Specification & Chapter Definitions
 * Single source of truth for IELTS Reading (Academic) chapters, topics, and question bank metadata.
 */

import type { ChapterDef, FBISEGrade9SubjectCurriculum } from './curriculumFBISE9';
import { IELTS_READING_CHAPTERS } from '../data/banks/ielts/index';

export const IELTS_READING_ACADEMIC_CHAPTERS: ChapterDef[] = IELTS_READING_CHAPTERS.map((ch) => ({
  id: ch.id,
  number: ch.number,
  chapterNumber: ch.number,
  name: ch.name,
  subtopics: [
    'Matching headings to paragraphs',
    'Identifying True / False / Not Given & Yes / No / Not Given statements',
    'Information matching across paragraphs',
    'Sentence completion & detail retention',
    'Multiple choice factual comprehension',
    'Summary, note & table completion',
    'Identifying writer views, purpose & claims',
    'Academic vocabulary in contextual passage excerpts',
  ],
  description: `Authentic academic reading comprehension passage and analysis for ${ch.name}.`,
}));

export const IELTS_CURRICULUM: Record<string, FBISEGrade9SubjectCurriculum> = {
  'IELTS Reading (Academic)': {
    subject: 'IELTS Reading (Academic)',
    aliases: ['ielts reading (academic)', 'ielts reading', 'reading (academic)', 'academic reading', 'ielts reading academic'],
    guidelines: 'Passage-based academic reading comprehension assessing matching headings, T/F/NG, sentence completion, information matching, and writer views.',
    chapters: IELTS_READING_ACADEMIC_CHAPTERS,
  },
  'IELTS Reading (GT)': {
    subject: 'IELTS Reading (GT)',
    aliases: ['ielts reading (gt)', 'general training reading', 'ielts reading gt'],
    guidelines: 'Passage-based reading comprehension assessing informational texts, instructions, articles, and workplace passages.',
    chapters: IELTS_READING_ACADEMIC_CHAPTERS,
  },
  'IELTS Preparation': {
    subject: 'IELTS Preparation',
    aliases: ['ielts preparation', 'ielts'],
    guidelines: 'Comprehensive 4-skill preparation covering academic reading, listening, writing, and speaking.',
    chapters: IELTS_READING_ACADEMIC_CHAPTERS,
  },
};
