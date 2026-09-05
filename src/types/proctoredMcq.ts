export interface ProctoredMCQItem {
  id: string;
  question: string;
  question_text?: string;
  options: [string, string, string, string] | string[]; // A, B, C, D
  correctAnswer: number; // 0 for A, 1 for B, 2 for C, 3 for D
  correct_option_index?: number;
  explanation?: string;
  marks: number;
}

export interface ProctoredMCQTest {
  id: string;
  title: string;
  instructions?: string;
  subject: string;
  grade: string;
  stream: string;
  board: string;
  board_id?: string;
  due_date: string;
  duration_minutes: number;
  total_marks: number;
  pass_marks?: number;
  questions: ProctoredMCQItem[];
  status: 'draft' | 'published';
  created_at: string;
  published_at?: string | null;
  created_by: string;
  created_by_name: string;
  is_proctored: boolean;
}

export interface ProctoredMCQSubmission {
  id: string;
  test_id: string;
  test_title?: string;
  student_id: string;
  student_name: string;
  student_email?: string | null;
  student_roll_no?: string | null;
  grade: string;
  stream?: string;
  subject: string;
  submitted_at: string;
  time_spent_seconds: number;
  answers: Record<string, number>; // questionId -> selectedOptionIndex (0-3)
  auto_score: number;
  final_score?: number | null;
  score?: number;
  total_marks: number;
  percentage: number;
  status: 'submitted' | 'graded';
  teacher_feedback?: string | null;
  graded_at?: string | null;
  graded_by?: string | null;
  graded_by_name?: string | null;
  violation_reason?: string | null; // Anti-cheating auto-submit trigger reason
  questions?: ProctoredMCQItem[];
}

export interface ProctoredMCQGradePayload {
  final_score: number;
  teacher_feedback?: string;
  graded_by?: string;
  graded_by_name?: string;
}
