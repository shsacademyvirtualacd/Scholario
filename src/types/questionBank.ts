/**
 * Authoritative Schema for Stored MCQ Question Bank
 * Designed to be modular and scalable to any grade, board, subject, and chapter.
 */

export type MCQOptionKey = 'A' | 'B' | 'C' | 'D';
export type MCQDifficultyLevel = 'easy' | 'medium' | 'hard' | 'board_exam' | 'all';

export interface StoredMCQ {
  id: string;
  board: string;           // e.g. 'fbise', 'sindh'
  grade: string;           // e.g. '9', '10', '11', '12'
  subject: string;         // e.g. 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Urdu', 'Islamiat'
  chapter: string;         // e.g. 'Physical Quantities and Measurement'
  chapterNumber?: number;
  topic?: string;          // Optional subtopic tag
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: MCQOptionKey;
  explanation: string;
  difficulty: MCQDifficultyLevel | string;
  verified: boolean;
  source: 'ai-pregenerated' | 'curriculum-bank' | 'expert-verified';
  createdAt: string;
  updatedAt?: string;
}



export interface StoredShortQuestion {
  id: string;
  board: string;
  grade: string;
  subject: string;
  chapter: string;
  chapterNumber?: number;
  topic?: string;
  question: string;
  marks: number;
  expectedAnswer?: string;
  difficulty: MCQDifficultyLevel | string;
  verified: boolean;
  source: 'ai-pregenerated' | 'curriculum-bank' | 'expert-verified';
  createdAt: string;
  updatedAt?: string;
}

export interface StoredLongQuestion {
  id: string;
  board: string;
  grade: string;
  subject: string;
  chapter: string;
  chapterNumber?: number;
  topic?: string;
  question: string;
  marks: number;
  expectedAnswer?: string;
  difficulty: MCQDifficultyLevel | string;
  verified: boolean;
  source: 'ai-pregenerated' | 'curriculum-bank' | 'expert-verified';
  createdAt: string;
  updatedAt?: string;
}

export interface BankFetchParams {
  subject: string;
  topic?: string;
  chapter?: string;
  grade?: string;
  board?: string;
  count?: number;
  difficulty?: MCQDifficultyLevel | string;
  excludeIds?: string[];
  excludeTexts?: string[];
  selectedChapters?: string[];
  examMode?: 'single_chapter' | 'chapter' | 'multi_chapter' | 'full_syllabus' | 'weak_topics' | string;
}

export interface ChapterBankStat {
  chapterNumber: number;
  chapterName: string;
  count: number;
  targetCount: number;
  isComplete: boolean;
}

export interface SubjectBankStat {
  subject: string;
  totalQuestions: number;
  targetQuestions: number;
  totalChapters: number;
  completedChapters: number;
  chapters: ChapterBankStat[];
}

export interface QuestionBankSummary {
  board: string;
  grade: string;
  totalQuestions: number;
  targetQuestions: number;
  coveragePercentage: number;
  subjects: Record<string, SubjectBankStat>;
}
