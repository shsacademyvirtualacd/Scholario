// ─────────────────────────────────────────────
// Centralized Data Structures
// All sample data removed. Ready for database populate.
// ─────────────────────────────────────────────

import type { Profile, Teacher, ClassOffering, ClassSlot, Enrollment, Attendance, Note } from '../types';

export const MOCK_USER_ID = '';

// ─── Student Profile ──────────────────────────
export const MOCK_PROFILE: Profile = {
  id: '',
  role: 'student',
  full_name: '',
  avatar_url: null,
  phone: null,
  created_at: '',
};

export const MOCK_ENROLLMENT = {
  board: 'fbise' as const,
  grade: '10',
  subject: '',
  total_classes: 0,
  classes_attended: 0,
  classes_remaining: 0,
  streak: 0,
  personal_best_streak: 0,
};

// ─── Teachers ────────────────────────────────
export const MOCK_TEACHERS: Teacher[] = [];

// ─── Class Offerings ─────────────────────────
export const MOCK_OFFERINGS: ClassOffering[] = [];

// ─── Timetable Slots (0=Mon ... 5=Sat) ───────
export const MOCK_SCHEDULE_SLOTS: ClassSlot[] = [];

// Helper to resolve offering details for schedule slots
export const getEnrichedScheduleSlots = () => {
  return [];
};

// ─── Recent Notes ─────────────────────────────
export const MOCK_NOTES: Note[] = [];

export const getEnrichedNotes = () => {
  return [];
};

// ─── Attendance Records ────────────────────────
export const MOCK_ATTENDANCE: Attendance[] = [];

export const getEnrichedAttendance = () => {
  return [];
};

// ─── Students List ────────────────────────────────
export const MOCK_STUDENTS: Profile[] = [];

// ─── Enrollments ──────────────────────────────────
export const MOCK_ENROLLMENTS: Enrollment[] = [];

// ─── Helpers ──────────────────────────────────────
export const getStudentsByOffering = (_offeringId: string): Profile[] => {
  return [];
};

export const getSessionAttendance = (_slotId: string, _date: string): Attendance[] => {
  return [];
};

export const getTeacherOfferings = (_teacherId: string): ClassOffering[] => {
  return [];
};

export const getStudentsByTeacher = (_teacherId: string): Profile[] => {
  return [];
};

// (Announcements now backed by real Supabase table and types)


export interface RosterEntry {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  class_ids: string[];
  profile_id: string | null;
  created_at: string;
}

const DEFAULT_ROSTER: RosterEntry[] = [];

const loadRosterFromStorage = (): RosterEntry[] => {
  if (typeof window === 'undefined') return DEFAULT_ROSTER;
  try {
    const raw = localStorage.getItem('scholario_roster');
    if (!raw) return DEFAULT_ROSTER;
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_ROSTER;
  }
};

const saveRosterToStorage = (arr: RosterEntry[]) => {
  try {
    localStorage.setItem('scholario_roster', JSON.stringify(arr));
  } catch (e) {
    console.error(e);
  }
};

if (typeof window !== 'undefined' && !localStorage.getItem('scholario_roster')) {
  localStorage.setItem('scholario_roster', JSON.stringify(DEFAULT_ROSTER));
}

const rosterArray = loadRosterFromStorage();

export const MOCK_ROSTER = new Proxy(rosterArray, {
  set(target, prop, value, receiver) {
    const res = Reflect.set(target, prop, value, receiver);
    saveRosterToStorage(target);
    return res;
  },
  deleteProperty(target, prop) {
    const res = Reflect.deleteProperty(target, prop);
    saveRosterToStorage(target);
    return res;
  }
});

// ─── Fee System Types & Mock Data ─────────────────
export interface MockFeeConfig {
  id: string;
  class_id: string;
  amount: number;
  payment_instructions: string;
  whatsapp_number: string;
}

export interface MockFeeStatus {
  id: string;
  student_id: string;
  status: 'unpaid' | 'pending' | 'paid';
  updated_at: string;
}

export interface MockFeeAuditLog {
  id: string;
  student_id: string;
  status_from: string;
  status_to: string;
  changed_by: string;
  changed_at: string;
  notes: string;
}

const DEFAULT_FEE_CONFIGS: MockFeeConfig[] = [];
const DEFAULT_FEE_STATUSES: MockFeeStatus[] = [];
const DEFAULT_FEE_AUDIT_LOGS: MockFeeAuditLog[] = [];

const loadFromStorage = <T>(key: string, def: T[]): T[] => {
  if (typeof window === 'undefined') return def;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : def;
  } catch (e) {
    return def;
  }
};

const saveToStorage = <T>(key: string, arr: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (e) {
    console.error(e);
  }
};

if (typeof window !== 'undefined') {
  if (!localStorage.getItem('scholario_fee_configs')) saveToStorage('scholario_fee_configs', DEFAULT_FEE_CONFIGS);
  if (!localStorage.getItem('scholario_fee_statuses')) saveToStorage('scholario_fee_statuses', DEFAULT_FEE_STATUSES);
  if (!localStorage.getItem('scholario_fee_audit_logs')) saveToStorage('scholario_fee_audit_logs', DEFAULT_FEE_AUDIT_LOGS);
}

export const MOCK_FEE_CONFIGS = new Proxy(loadFromStorage('scholario_fee_configs', DEFAULT_FEE_CONFIGS), {
  set(target, prop, value, receiver) {
    const res = Reflect.set(target, prop, value, receiver);
    saveToStorage('scholario_fee_configs', target);
    return res;
  }
});

export const MOCK_FEE_STATUSES = new Proxy(loadFromStorage('scholario_fee_statuses', DEFAULT_FEE_STATUSES), {
  set(target, prop, value, receiver) {
    const res = Reflect.set(target, prop, value, receiver);
    saveToStorage('scholario_fee_statuses', target);
    return res;
  }
});

export const MOCK_FEE_AUDIT_LOGS = new Proxy(loadFromStorage('scholario_fee_audit_logs', DEFAULT_FEE_AUDIT_LOGS), {
  set(target, prop, value, receiver) {
    const res = Reflect.set(target, prop, value, receiver);
    saveToStorage('scholario_fee_audit_logs', target);
    return res;
  }
});
