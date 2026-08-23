export type MCQDifficulty = 'easy' | 'medium' | 'hard' | 'board_exam';

export interface MCQQuestion {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  topic?: string;
}

export interface SelfTestConfig {
  board?: string;
  grade?: string;
  stream?: string;
  subject: string;
  topic: string;
  questionCount: number;
  difficulty: MCQDifficulty;
}

export interface SelfTestResult {
  id: string;
  timestamp: string;
  config: SelfTestConfig;
  questions: MCQQuestion[];
  userAnswers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentSeconds: number;
}
