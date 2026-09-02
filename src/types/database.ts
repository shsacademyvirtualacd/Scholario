// ─────────────────────────────────────────────
// Scholario — Database Types
// Mirrors the Supabase schema exactly
// ─────────────────────────────────────────────

export type Role = 'student' | 'admin' | 'teacher';
export type Board = 'fbise' | 'sindh' | 'ielts';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'pending';
export type NoteFileType = 'pdf' | 'image' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | 'txt';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Mon … 6=Sun

// ─── taxonomy reference tables ───────────────
export interface BoardEntry {
  id: string;
  name: string;
}

export interface ClassEntry {
  id: string;
  board_id: string;
  grade: string;
  display_name: string;
  board?: BoardEntry;
}

export interface StreamEntry {
  id: string;
  class_id: string;
  name: string;
  class?: ClassEntry;
}

export interface SubjectEntry {
  id: string;
  name: string;
}

// ─── profiles ───────────────────────────────
export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  stream?: string | null;
  board_id?: string | null;
  class_id?: string | null;
  stream_id?: string | null;
  /** False until a student completes the onboarding grade/board/stream flow */
  onboarding_complete?: boolean;
  // joined
  board?: BoardEntry;
  class?: ClassEntry;
  stream_obj?: StreamEntry;
}

// ─── teachers ───────────────────────────────
export interface Teacher {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string | null;
  phone?: string | null;
  joining_date: string | null;
  is_active: boolean;
  created_at: string;
}

// ─── class_offerings ────────────────────────
export interface ClassOffering {
  id: string;
  class_id: string;
  subject_id: string;
  stream_id?: string | null;
  teacher_id: string | null;
  created_at: string;
  // joined
  class?: any;
  subject?: any;
  teacher?: Teacher;
  
  // Flattened for backward compatibility in the frontend
  board?: any;
  board_id?: string;
  board_name?: string;
  grade?: string;
  stream?: any;
  subject_name?: string;
}

// ─── class_slots ────────────────────────────
export interface ClassSlot {
  id: string;
  offering_id: string | null;
  custom_title?: string | null;
  class_id?: string | null;
  stream_id?: string | null;
  day_of_week: DayOfWeek;
  start_time: string; // HH:MM:SS
  end_time: string;   // HH:MM:SS
  room_or_link: string | null;
  is_cancelled: boolean;
  created_at: string;
  // joined
  offering?: ClassOffering;
}

// ─── class_session_links ────────────────────
export interface ClassSessionLink {
  id: string;
  slot_id: string;
  offering_id?: string | null;
  session_date: string; // YYYY-MM-DD
  link_url: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // joined
  slot?: ClassSlot;
  offering?: ClassOffering;
}

// ─── live_sessions ──────────────────────────
export interface LiveSession {
  id: string;
  subject_id: string;
  grade_id: string;
  class_link: string;
  status: 'live' | 'ended' | 'scheduled' | string;
  started_at: string;
  ended_at?: string | null;
  teacher_id?: string | null;
  teacher_name?: string | null;
  subject_name?: string | null;
  slot_id?: string | null;
  offering_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ─── enrollments ────────────────────────────
export interface Enrollment {
  id: string;
  student_id: string;
  offering_id: string;
  total_classes: number;
  enrolled_at: string;
  // joined
  student?: Profile;
  offering?: ClassOffering;
  classes_attended?: number; // computed
}

// ─── attendance ─────────────────────────────
export interface Attendance {
  id: string;
  student_id: string;
  slot_id: string;
  session_date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  marked_at: string;
  marked_by?: 'student' | 'teacher' | 'admin' | 'self';
  created_at?: string;
  // joined
  slot?: ClassSlot;
  student?: Profile;
  teacher?: Teacher;
  subject?: string;
  class_id?: string;
}

// ─── notes ──────────────────────────────────
export interface Note {
  id: string;
  offering_id: string;
  chapter_name: string;
  title: string;
  file_url: string;
  file_path?: string;
  file_type: NoteFileType;
  uploaded_by: string;
  created_at: string;
  // joined
  offering?: ClassOffering;
}

// ─── tests & submissions ────────────────────
export type TestFileType = 'pdf' | 'image' | 'doc';
export type TestSubmissionStatus = 'submitted' | 'graded' | 'pending';

export interface TestPaper {
  id: string;
  title: string;
  instructions?: string | null;
  subject: string;
  grade: string; // '9' | '10' | '11' | '12'
  stream: string; // 'Biology' | 'Computer Science' | 'Pre-Medical' | 'Pre-Engineering' | 'ICS' | 'all'
  offering_id?: string | null;
  teacher_id?: string | null;
  teacher_name?: string | null;
  uploaded_by?: string | null;
  uploaded_by_name?: string | null;
  file_url: string;
  file_path?: string;
  file_type: TestFileType;
  file_size_bytes?: number;
  total_marks: number;
  due_date: string;
  board?: string | null;
  board_id?: string | null;
  published_at?: string;
  created_at: string;
  // joined
  offering?: ClassOffering;
  teacher?: Teacher;
  submissions_count?: number;
  graded_count?: number;
}

export interface TestSubmission {
  id: string;
  test_id: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  file_url: string;
  file_path?: string;
  file_type: TestFileType;
  file_size_bytes?: number;
  submitted_at: string;
  status: TestSubmissionStatus;
  marks_obtained?: number | null;
  max_marks?: number | null;
  teacher_feedback?: string | null;
  graded_at?: string | null;
  graded_by?: string | null;
  // joined
  test?: TestPaper;
  student?: Profile;
}

export interface StudentMCQAttempt {
  id: string;
  student_id: string;
  student_name: string;
  student_email?: string | null;
  board: string;
  grade: string;
  stream?: string | null;
  subject: string;
  topic: string;
  chapters?: string[];
  score: number;
  total_questions: number;
  percentage: number;
  time_spent_seconds: number;
  exam_mode?: string;
  difficulty?: string;
  created_at: string;
  user_answers?: Record<string, string>;
  // joined
  student?: Profile;
}

// ─── study_sessions ─────────────────────────
export interface StudySession {
  id: string;
  student_id: string;
  session_date: string; // YYYY-MM-DD
  pomodoro_count: number;
  duration_mins: number;
  created_at: string;
}

// ─── announcements ──────────────────────────
export interface Announcement {
  id: string;
  title: string;
  body: string;
  severity: 'normal' | 'crucial';
  scope: 'system' | 'class';
  class_id?: string | null;
  stream_id?: string | null;
  created_by?: string | null;
  created_at: string;
  // joined
  class?: ClassEntry;
  stream?: StreamEntry;
  creator?: Profile;
}

// ─── chat_threads & chat_messages ───────────
export type ChatThreadType = 'admin' | 'teacher' | 'staff';
export type ChatMessageType = 'text' | 'voice' | 'image' | 'file';

export interface ChatThread {
  id: string;
  student_id?: string | null;
  staff_id?: string | null;
  thread_type?: ChatThreadType;
  participant_one_id: string;
  participant_one_role: Role;
  participant_two_id: string;
  participant_two_role: Role;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: Role;
  content: string;
  message_type?: ChatMessageType;
  audio_url?: string | null;
  audio_duration_seconds?: number | null;
  attachment_key?: string | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
  mime_type?: string | null;
  created_at: string;
  read_at: string | null;
}

export interface ChatThreadWithDetails extends ChatThread {
  other_participant: Profile;
  latest_message?: ChatMessage | null;
  unread_count: number;
}

// ─── teacher_attendance_ratings ──────────────
export type TeacherAttendanceRatingVote = 'present' | 'absent';

export interface TeacherAttendanceRating {
  id: string;
  student_id: string;
  slot_id: string;
  teacher_id: string | null;
  session_date: string; // YYYY-MM-DD
  rating: TeacherAttendanceRatingVote;
  created_at: string;
  // joined
  student?: Profile;
  teacher?: Teacher;
  slot?: ClassSlot;
}

// ─── roster ──────────────────────────────────
export interface RosterEntry {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  class_ids: string[];
  profile_id: string | null;
  phone?: string | null;
  suspended?: boolean;
  fee_suspended?: boolean;
  awaiting_termination?: boolean;
  created_at: string;
}

// ─── Supabase Database shape ─────────────────
export interface Database {
  public: {
    Tables: {
      roster: {
        Row: RosterEntry;
        Insert: Omit<RosterEntry, 'id' | 'created_at'>;
        Update: Partial<Omit<RosterEntry, 'id' | 'created_at'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      teachers: {
        Row: Teacher;
        Insert: Omit<Teacher, 'id' | 'created_at'>;
        Update: Partial<Omit<Teacher, 'id' | 'created_at'>>;
      };
      class_offerings: {
        Row: ClassOffering;
        Insert: Omit<ClassOffering, 'id' | 'created_at'>;
        Update: Partial<Omit<ClassOffering, 'id' | 'created_at'>>;
      };
      class_slots: {
        Row: ClassSlot;
        Insert: Omit<ClassSlot, 'id' | 'created_at'>;
        Update: Partial<Omit<ClassSlot, 'id' | 'created_at'>>;
      };
      enrollments: {
        Row: Enrollment;
        Insert: Omit<Enrollment, 'id' | 'enrolled_at'>;
        Update: Partial<Omit<Enrollment, 'id' | 'enrolled_at'>>;
      };
      attendance: {
        Row: Attendance;
        Insert: Omit<Attendance, 'id' | 'marked_at'>;
        Update: Partial<Omit<Attendance, 'id'>>;
      };
      notes: {
        Row: Note;
        Insert: Omit<Note, 'id' | 'created_at'>;
        Update: Partial<Omit<Note, 'id' | 'created_at'>>;
      };
      study_sessions: {
        Row: StudySession;
        Insert: Omit<StudySession, 'id' | 'created_at'>;
        Update: Partial<Omit<StudySession, 'id' | 'created_at'>>;
      };
      fee_configs: {
        Row: {
          id: string;
          class_id: string;
          amount: number;
          payment_instructions: string;
          whatsapp_number: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['fee_configs']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['fee_configs']['Row']>;
      };
      fee_statuses: {
        Row: {
          id: string;
          student_id: string;
          status: 'unpaid' | 'pending' | 'paid';
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['fee_statuses']['Row'], 'id' | 'updated_at'> & { id?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['fee_statuses']['Row']>;
      };
      fee_audit_trail: {
        Row: {
          id: string;
          student_id: string;
          status_from: string;
          status_to: string;
          changed_by: string | null;
          changed_at: string;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['fee_audit_trail']['Row'], 'id' | 'changed_at'> & { id?: string; changed_at?: string };
        Update: Partial<Database['public']['Tables']['fee_audit_trail']['Row']>;
      };
      announcements: {
        Row: Announcement;
        Insert: Omit<Announcement, 'id' | 'created_at' | 'class' | 'stream' | 'creator'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Announcement, 'id' | 'created_at' | 'class' | 'stream' | 'creator'>>;
      };
      teacher_attendance_ratings: {
        Row: TeacherAttendanceRating;
        Insert: Omit<TeacherAttendanceRating, 'id' | 'created_at' | 'student' | 'teacher' | 'slot'> & { id?: string; created_at?: string };
        Update: Partial<Omit<TeacherAttendanceRating, 'id' | 'created_at' | 'student' | 'teacher' | 'slot'>>;
      };
      tests: {
        Row: TestPaper;
        Insert: Omit<TestPaper, 'id' | 'created_at' | 'offering' | 'teacher' | 'submissions_count' | 'graded_count'> & { id?: string; created_at?: string };
        Update: Partial<Omit<TestPaper, 'id' | 'created_at' | 'offering' | 'teacher' | 'submissions_count' | 'graded_count'>>;
      };
      test_submissions: {
        Row: TestSubmission;
        Insert: Omit<TestSubmission, 'id' | 'submitted_at' | 'test' | 'student'> & { id?: string; submitted_at?: string };
        Update: Partial<Omit<TestSubmission, 'id' | 'submitted_at' | 'test' | 'student'>>;
      };
      chat_threads: {
        Row: ChatThread;
        Insert: Omit<ChatThread, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<ChatThread, 'id' | 'created_at'>>;
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Omit<ChatMessage, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<ChatMessage, 'id' | 'created_at'>>;
      };
    };
  };
}

