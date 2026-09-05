export type WrittenTestType = 'short_question' | 'long_question' | 'unified' | 'mcq';

export type UnifiedQuestionType = 'mcq' | 'short_question' | 'long_question';

export interface WrittenQuestionItem {
  id: string;
  type?: UnifiedQuestionType;
  question: string;
  question_text?: string;
  marks: number;
  guidelines?: string;
  // Multiple Choice specific fields
  options?: [string, string, string, string] | string[];
  correctAnswer?: number;
  correct_option_index?: number;
  explanation?: string;
}

export interface WrittenTest {
  id: string;
  title: string;
  type: WrittenTestType;
  test_type?: WrittenTestType;
  question_types?: UnifiedQuestionType[];
  mcq_count?: number;
  short_count?: number;
  long_count?: number;
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
  questions: WrittenQuestionItem[];
  status: 'draft' | 'published';
  created_at: string;
  published_at?: string | null;
  created_by: string;
  created_by_name: string;
  is_proctored: boolean;
  file_type?: string;
}

export interface WrittenQuestionAnswer {
  question_id: string;
  question_type?: UnifiedQuestionType;
  question_text: string;
  question_order?: number;
  max_marks: number;
  // MCQ specific
  selected_option?: number | null;
  correct_option?: number;
  is_correct?: boolean;
  // Written specific (Short & Long questions)
  photo_url?: string;
  photo_data_url?: string;
  r2_key?: string;
  captured_at?: string;
  marks_awarded?: number | null;
  awarded_marks?: number | null;
  remarks?: string | null;
  teacher_remarks?: string | null;
}

export interface WrittenSubmission {
  id: string;
  test_id: string;
  test_title?: string;
  test_type: WrittenTestType;
  student_id: string;
  student_name: string;
  student_email?: string | null;
  grade: string;
  stream?: string;
  subject: string;
  submitted_at: string;
  time_spent_seconds: number;
  answers: WrittenQuestionAnswer[];
  mcq_score?: number;
  mcq_total?: number;
  written_score?: number;
  written_total?: number;
  final_score?: number | null;
  total_marks: number;
  percentage?: number;
  status: 'submitted' | 'graded';
  teacher_feedback?: string | null;
  general_feedback?: string | null;
  graded_at?: string | null;
  graded_by?: string | null;
  graded_by_name?: string | null;
  violation_reason?: string | null;
  is_expired?: boolean;
  remaining_ms?: number;
  remaining_formatted?: string;
  expires_at?: string;
}
