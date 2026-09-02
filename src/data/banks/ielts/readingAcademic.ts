export interface IELTSReadingMCQ {
  id: string;
  chapter: string;
  chapterNumber: number;
  topic: string;
  skill: string;
  passage: string;
  question: string;
  options: string[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  verified: boolean;
  source: string;
  createdAt: string;
}

export const IELTS_READING_ACADEMIC_MCQS: IELTSReadingMCQ[] = [];
