// ─────────────────────────────────────────────
// Scholario — Database Types
// Mirrors the Supabase schema exactly
// ─────────────────────────────────────────────

export type Role = 'student' | 'admin' | 'teacher';
export type Board = 'local' | 'fbise' | 'o_level' | 'a_level';
export type AttendanceStatus = 'present' | 'absent' | 'late';
export type NoteFileType = 'pdf' | 'image';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5; // 0=Mon … 5=Sat

// ─── profiles ───────────────────────────────
export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  stream?: 'pre-medical' | 'pre-engineering' | 'ics';
}

// ─── teachers ───────────────────────────────
export interface Teacher {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
  joining_date: string | null;
  is_active: boolean;
  created_at: string;
}

// ─── class_offerings ────────────────────────
export interface ClassOffering {
  id: string;
  board: Board;
  grade: string; // '9' | '10' | '11' | '12' | 'as' | 'a2' | 'o1' | 'o2'
  subject: string;
  teacher_id: string | null;
  created_at: string;
  // joined
  teacher?: Teacher;
}

// ─── class_slots ────────────────────────────
export interface ClassSlot {
  id: string;
  offering_id: string;
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

// ─── roster ──────────────────────────────────
export interface RosterEntry {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  class_ids: string[];
  profile_id: string | null;
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
    };
  };
}
