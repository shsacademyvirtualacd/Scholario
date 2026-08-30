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
  board?: string;
  grade?: string;
  totalQuestions: number;
  targetQuestions: number;
  coveragePercentage: number;
  totalSubjects?: number;
  completedSubjects?: number;
  subjects: Record<string, SubjectBankStat>;
}

export interface StoredShortQuestion {
  id: string;
  board: string;           // e.g. 'fbise', 'sindh'
  grade: string;           // e.g. '9', '10', '11', '12'
  subject: string;         // e.g. 'Physics', 'Chemistry', 'Biology'
  chapter: string;         // e.g. 'Physical Quantities and Measurement'
  chapterNumber?: number;
  topic?: string;
  question: string;
  modelAnswer?: string;
  keyPoints?: string[];
  marks?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'board_exam' | string;
  verified: boolean;
  source: 'curriculum-bank' | 'expert-verified' | 'ai-pregenerated';
  createdAt?: string;
}

export interface StoredLongQuestion {
  id: string;
  board: string;           // e.g. 'fbise', 'sindh'
  grade: string;           // e.g. '9', '10', '11', '12'
  subject: string;         // e.g. 'Physics', 'Chemistry', 'Biology'
  chapter: string;         // e.g. 'Physical Quantities and Measurement'
  chapterNumber?: number;
  topic?: string;
  question: string;
  parts?: { label: string; text: string; marks: number }[];
  modelAnswer?: string;
  markingScheme?: string[];
  marks?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'board_exam' | string;
  verified: boolean;
  source: 'curriculum-bank' | 'expert-verified' | 'ai-pregenerated';
  createdAt?: string;
}

export type TestQuestionTypeCombination =
  | 'mcqs_only'
  | 'short_only'
  | 'long_only'
  | 'mcqs_and_short'
  | 'mcqs_and_long'
  | 'all_types'; // MCQs + Short Questions + Long Questions

export interface GeneratedTestSpecification {
  title: string;
  institutionName: string;
  board: string;
  grade: string;
  stream: string;
  subject: string;
  chapter?: string;
  chapters?: string[];
  teacherId?: string;
  teacherName: string;
  dueDate: string;
  timeAllowedMinutes: number;
  totalMarks: number;
  instructions?: string;
  combination: TestQuestionTypeCombination;
  mcqs: StoredMCQ[];
  shortQuestions: StoredShortQuestion[];
  longQuestions: StoredLongQuestion[];
  mcqMarksEach?: number;
  shortMarksEach?: number;
  shortAttemptCount?: number;
  longMarksEach?: number;
  longAttemptCount?: number;
}
