// ─────────────────────────────────────────────
// Scholario — Database Types
// Mirrors the Supabase schema exactly
// ─────────────────────────────────────────────

export type Role = 'student' | 'admin' | 'teacher';
export type Board = 'fbise';
export type AttendanceStatus = 'present' | 'absent' | 'late';
export type NoteFileType = 'pdf' | 'image';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5; // 0=Mon … 5=Sat

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

// ─── enrollments ────────────────────────────
export interface Enrollment {
  id: string;
  student_id: string;
  offering_id: string;
  total_classes: number;
  enrolled_at: string;
  // joined
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
  // joined
  slot?: ClassSlot;
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

// ─── roster ──────────────────────────────────
export interface RosterEntry {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  class_ids: string[];
  profile_id: string | null;
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
    };
  };
}

