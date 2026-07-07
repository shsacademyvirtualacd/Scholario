// ─────────────────────────────────────────────────────────────────────────────
// Scholario — Central Data Service
//
// All Supabase reads/writes go through functions in this file.
// Pages import from here — they never call supabase.from() directly.
//
// MOCK MODE: when VITE_USE_MOCK_AUTH=true, functions return mock data
//            and skip real network calls entirely.
//
// REAL MODE: when VITE_USE_MOCK_AUTH=false (or unset), every function
//            executes a scoped Supabase query with RLS enforced by the
//            authenticated user's JWT.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase';
import {
  MOCK_STUDENTS,
  MOCK_TEACHERS,
  MOCK_OFFERINGS,
  MOCK_SCHEDULE_SLOTS,
  MOCK_ENROLLMENTS,
  MOCK_ATTENDANCE,
  MOCK_NOTES,
  MOCK_ROSTER,
  getTeacherOfferings as mockGetTeacherOfferings,
  getStudentsByOffering as mockGetStudentsByOffering,
  getStudentsByTeacher as mockGetStudentsByTeacher,
} from './mockData';
import type {
  Profile, Teacher, ClassOffering, ClassSlot,
  Enrollment, Attendance, Note, RosterEntry,
} from '../types';

// ── flag (mirrors AuthContext) ────────────────────────────────────────────────
const useMock = (import.meta as any).env?.VITE_USE_MOCK_AUTH !== 'false';

// ── tiny helper ───────────────────────────────────────────────────────────────
function throwOnError<T>(data: T | null, error: unknown, ctx: string): T {
  if (error) throw new Error(`[db:${ctx}] ${(error as any).message}`);
  if (data === null) throw new Error(`[db:${ctx}] No data returned`);
  return data;
}

// =============================================================================
// PROFILES
// =============================================================================

/** Fetch a single profile by its Supabase auth UID */
export async function getProfile(userId: string): Promise<Profile | null> {
  if (useMock) {
    return MOCK_STUDENTS.find(s => s.id === userId)
      || MOCK_TEACHERS.find(t => t.id === userId) as any
      || null;
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Admin: get all student profiles */
export async function getAllStudents(): Promise<Profile[]> {
  if (useMock) return [...MOCK_STUDENTS];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('full_name');
  return throwOnError(data, error, 'getAllStudents');
}

/** Admin: insert a new student profile */
export async function insertStudent(payload: {
  full_name: string;
  phone: string | null;
  stream: 'pre-medical' | 'pre-engineering' | 'ics';
}): Promise<Profile> {
  if (useMock) {
    const mock: Profile = {
      id: `s_mock_${Date.now()}`,
      role: 'student',
      full_name: payload.full_name,
      avatar_url: null,
      phone: payload.phone,
      created_at: new Date().toISOString(),
      stream: payload.stream,
    };
    MOCK_STUDENTS.push(mock);
    return mock;
  }
  const { data, error } = await (supabase as any)
    .from('profiles')
    .insert({ role: 'student', ...payload })
    .select()
    .single();
  return throwOnError(data, error, 'insertStudent') as Profile;
}

/** Admin: update an existing student profile */
export async function updateStudent(
  id: string,
  payload: Partial<Pick<Profile, 'full_name' | 'phone' | 'stream'>>
): Promise<Profile> {
  if (useMock) {
    const idx = MOCK_STUDENTS.findIndex(s => s.id === id);
    if (idx !== -1) Object.assign(MOCK_STUDENTS[idx], payload);
    return MOCK_STUDENTS[idx];
  }
  const { data, error } = await (supabase as any)
    .from('profiles')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  return throwOnError(data, error, 'updateStudent') as Profile;
}

/** Admin: delete a student profile (also cascades via DB FK) */
export async function deleteStudent(id: string): Promise<void> {
  if (useMock) {
    const idx = MOCK_STUDENTS.findIndex(s => s.id === id);
    if (idx !== -1) MOCK_STUDENTS.splice(idx, 1);
    return;
  }
  const { error } = await (supabase as any).from('profiles').delete().eq('id', id);
  if (error) throw error;
}

// =============================================================================
// TEACHERS
// =============================================================================

/** Admin + Teacher: get all teachers */
export async function getAllTeachers(): Promise<Teacher[]> {
  if (useMock) return [...MOCK_TEACHERS];
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .order('full_name');
  return throwOnError(data, error, 'getAllTeachers');
}

/** Admin: insert a new teacher record */
export async function insertTeacher(payload: Omit<Teacher, 'id' | 'created_at' | 'avatar_url'>): Promise<Teacher> {
  if (useMock) {
    const mock: Teacher = {
      id: `t_mock_${Date.now()}`,
      avatar_url: null,
      created_at: new Date().toISOString(),
      ...payload,
    };
    MOCK_TEACHERS.push(mock);
    return mock;
  }
  const { data, error } = await (supabase as any)
    .from('teachers')
    .insert({ avatar_url: null, ...payload })
    .select()
    .single();
  return throwOnError(data, error, 'insertTeacher') as Teacher;
}

/** Admin: update an existing teacher record */
export async function updateTeacher(
  id: string,
  payload: Partial<Omit<Teacher, 'id' | 'created_at' | 'avatar_url'>>
): Promise<Teacher> {
  if (useMock) {
    const idx = MOCK_TEACHERS.findIndex(t => t.id === id);
    if (idx !== -1) Object.assign(MOCK_TEACHERS[idx], payload);
    return MOCK_TEACHERS[idx];
  }
  const { data, error } = await (supabase as any)
    .from('teachers')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  return throwOnError(data, error, 'updateTeacher') as Teacher;
}

// =============================================================================
// CLASS OFFERINGS
// =============================================================================

/** All roles: get all class offerings (joined with teacher) */
export async function getAllOfferings(): Promise<ClassOffering[]> {
  if (useMock) return [...MOCK_OFFERINGS];
  const { data, error } = await supabase
    .from('class_offerings')
    .select('*, teacher:teachers(*)')
    .order('subject');
  return throwOnError(data, error, 'getAllOfferings');
}

/** Teacher: get only offerings assigned to this teacher */
export async function getOfferingsForTeacher(teacherId: string): Promise<ClassOffering[]> {
  if (useMock) return mockGetTeacherOfferings(teacherId);
  const { data, error } = await supabase
    .from('class_offerings')
    .select('*, teacher:teachers(*)')
    .eq('teacher_id', teacherId)
    .order('subject');
  return throwOnError(data, error, 'getOfferingsForTeacher');
}

/** Student: get offerings the student is enrolled in */
export async function getOfferingsForStudent(studentId: string): Promise<ClassOffering[]> {
  if (useMock) {
    const enrolled = MOCK_ENROLLMENTS.filter(e => e.student_id === studentId).map(e => e.offering_id);
    return MOCK_OFFERINGS.filter(o => enrolled.includes(o.id));
  }
  const { data, error } = await supabase
    .from('enrollments')
    .select('offering:class_offerings(*, teacher:teachers(*))')
    .eq('student_id', studentId);
  const rows = throwOnError(data, error, 'getOfferingsForStudent');
  return rows.map((r: any) => r.offering).filter(Boolean);
}

/** Admin: assign/update teacher on a class offering */
export async function updateOfferingTeacher(offeringId: string, teacherId: string | null): Promise<void> {
  if (useMock) {
    const idx = MOCK_OFFERINGS.findIndex(o => o.id === offeringId);
    if (idx !== -1) MOCK_OFFERINGS[idx].teacher_id = teacherId;
    return;
  }
  const { error } = await (supabase as any)
    .from('class_offerings')
    .update({ teacher_id: teacherId })
    .eq('id', offeringId);
  if (error) throw error;
}

// =============================================================================
// CLASS SLOTS (schedule)
// =============================================================================

/** All roles: get all class slots, with offering + teacher joined */
export async function getAllSlots(): Promise<ClassSlot[]> {
  if (useMock) return [...MOCK_SCHEDULE_SLOTS];
  const { data, error } = await supabase
    .from('class_slots')
    .select('*, offering:class_offerings(*, teacher:teachers(*))')
    .order('day_of_week')
    .order('start_time');
  return throwOnError(data, error, 'getAllSlots');
}

/** Teacher: get slots for this teacher's offerings only */
export async function getSlotsForTeacher(teacherId: string): Promise<ClassSlot[]> {
  if (useMock) {
    const ids = mockGetTeacherOfferings(teacherId).map(o => o.id);
    return MOCK_SCHEDULE_SLOTS.filter(s => ids.includes(s.offering_id));
  }
  const { data, error } = await supabase
    .from('class_slots')
    .select('*, offering:class_offerings!inner(*, teacher:teachers(*))')
    .eq('offering.teacher_id', teacherId)
    .order('day_of_week')
    .order('start_time');
  return throwOnError(data, error, 'getSlotsForTeacher');
}

/** Student: get slots for this student's enrolled offerings */
export async function getSlotsForStudent(studentId: string): Promise<ClassSlot[]> {
  if (useMock) {
    const enrolled = MOCK_ENROLLMENTS.filter(e => e.student_id === studentId).map(e => e.offering_id);
    return MOCK_SCHEDULE_SLOTS
      .filter(s => enrolled.includes(s.offering_id))
      .map(slot => {
        const offering = MOCK_OFFERINGS.find(o => o.id === slot.offering_id);
        const teacher = offering ? MOCK_TEACHERS.find(t => t.id === offering.teacher_id) : undefined;
        return { ...slot, offering: offering ? { ...offering, teacher } : undefined };
      });
  }
  const enrolledOfferings = await getOfferingsForStudent(studentId);
  const ids = enrolledOfferings.map(o => o.id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('class_slots')
    .select('*, offering:class_offerings(*, teacher:teachers(*))')
    .in('offering_id', ids)
    .order('day_of_week')
    .order('start_time');
  return throwOnError(data, error, 'getSlotsForStudent');
}

/** Admin: upsert a class slot */
export async function upsertSlot(slot: Partial<ClassSlot> & { offering_id: string }): Promise<ClassSlot> {
  if (useMock) {
    if (slot.id) {
      const idx = MOCK_SCHEDULE_SLOTS.findIndex(s => s.id === slot.id);
      if (idx !== -1) Object.assign(MOCK_SCHEDULE_SLOTS[idx], slot);
      return MOCK_SCHEDULE_SLOTS[idx];
    }
    const newSlot = { ...slot, id: `slot_${Date.now()}`, is_cancelled: false, created_at: new Date().toISOString() } as ClassSlot;
    MOCK_SCHEDULE_SLOTS.push(newSlot);
    return newSlot;
  }
  const { data, error } = await (supabase as any)
    .from('class_slots')
    .upsert(slot as any)
    .select()
    .single();
  return throwOnError(data, error, 'upsertSlot') as ClassSlot;
}

/** Admin: delete a slot */
export async function deleteSlot(slotId: string): Promise<void> {
  if (useMock) {
    const idx = MOCK_SCHEDULE_SLOTS.findIndex(s => s.id === slotId);
    if (idx !== -1) MOCK_SCHEDULE_SLOTS.splice(idx, 1);
    return;
  }
  const { error } = await (supabase as any).from('class_slots').delete().eq('id', slotId);
  if (error) throw error;
}

// =============================================================================
// ENROLLMENTS
// =============================================================================

/** Admin/Teacher: get all students enrolled in a specific offering */
export async function getStudentsInOffering(offeringId: string): Promise<Profile[]> {
  if (useMock) return mockGetStudentsByOffering(offeringId);
  const { data, error } = await supabase
    .from('enrollments')
    .select('student:profiles(*)')
    .eq('offering_id', offeringId);
  const rows = throwOnError(data, error, 'getStudentsInOffering');
  return rows.map((r: any) => r.student).filter(Boolean);
}

/** Teacher: get all unique students across this teacher's offerings */
export async function getStudentsForTeacher(teacherId: string): Promise<Profile[]> {
  if (useMock) return mockGetStudentsByTeacher(teacherId);
  const offerings = await getOfferingsForTeacher(teacherId);
  const ids = offerings.map(o => o.id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('enrollments')
    .select('student:profiles(*)')
    .in('offering_id', ids);
  const rows = throwOnError(data, error, 'getStudentsForTeacher');
  // De-duplicate by profile id
  const seen = new Set<string>();
  return rows
    .map((r: any) => r.student)
    .filter(Boolean)
    .filter((s: Profile) => { if (seen.has(s.id)) return false; seen.add(s.id); return true; });
}

/** Admin: enrol a student in an offering */
export async function enrollStudent(studentId: string, offeringId: string, totalClasses = 48): Promise<Enrollment> {
  if (useMock) {
    const mock: Enrollment = { id: `e_${Date.now()}`, student_id: studentId, offering_id: offeringId, total_classes: totalClasses, enrolled_at: new Date().toISOString() };
    MOCK_ENROLLMENTS.push(mock);
    return mock;
  }
  const { data, error } = await (supabase as any)
    .from('enrollments')
    .insert({ student_id: studentId, offering_id: offeringId, total_classes: totalClasses })
    .select()
    .single();
  return throwOnError(data, error, 'enrollStudent') as Enrollment;
}

/** Student: get enrollments for a student */
export async function getEnrollmentsForStudent(studentId: string): Promise<Enrollment[]> {
  if (useMock) return MOCK_ENROLLMENTS.filter(e => e.student_id === studentId);
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', studentId);
  return throwOnError(data, error, 'getEnrollmentsForStudent');
}

// =============================================================================
// ATTENDANCE
// =============================================================================

/** Admin/Teacher: get attendance for a specific slot + date */
export async function getAttendanceForSession(slotId: string, date: string): Promise<Attendance[]> {
  if (useMock) return MOCK_ATTENDANCE.filter(a => a.slot_id === slotId && a.session_date === date);
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('slot_id', slotId)
    .eq('session_date', date);
  return throwOnError(data, error, 'getAttendanceForSession');
}

/** Student: get all attendance records for a student */
export async function getAttendanceForStudent(studentId: string): Promise<Attendance[]> {
  if (useMock) return MOCK_ATTENDANCE.filter(a => a.student_id === studentId);
  const { data, error } = await supabase
    .from('attendance')
    .select('*, slot:class_slots(*, offering:class_offerings(*, teacher:teachers(*)))')
    .eq('student_id', studentId)
    .order('session_date', { ascending: false });
  return throwOnError(data, error, 'getAttendanceForStudent');
}

/** Admin: bulk upsert attendance records for a session */
export async function upsertAttendanceBatch(records: Array<{
  student_id: string;
  slot_id: string;
  session_date: string;
  status: 'present' | 'absent' | 'late';
}>): Promise<void> {
  if (useMock) {
    records.forEach(rec => {
      const idx = MOCK_ATTENDANCE.findIndex(a => a.student_id === rec.student_id && a.slot_id === rec.slot_id && a.session_date === rec.session_date);
      if (idx !== -1) {
        MOCK_ATTENDANCE[idx] = { ...MOCK_ATTENDANCE[idx], ...rec };
      } else {
        MOCK_ATTENDANCE.push({ id: `att_${Date.now()}_${Math.random().toString(36).slice(2)}`, marked_at: new Date().toISOString(), ...rec });
      }
    });
    return;
  }
  const { error } = await (supabase as any)
    .from('attendance')
    .upsert(records, { onConflict: 'student_id,slot_id,session_date' });
  if (error) throw error;
}

// =============================================================================
// NOTES
// =============================================================================

/** All roles: get all notes for a set of offering IDs */
export async function getNotesForOfferings(offeringIds: string[]): Promise<Note[]> {
  if (useMock) {
    const filtered = MOCK_NOTES.filter(n => offeringIds.includes(n.offering_id));
    return filtered.map(note => {
      const offering = MOCK_OFFERINGS.find(o => o.id === note.offering_id);
      const teacher = offering ? MOCK_TEACHERS.find(t => t.id === offering.teacher_id) : undefined;
      return {
        ...note,
        offering: offering ? { ...offering, teacher } : undefined
      };
    });
  }
  if (offeringIds.length === 0) return [];
  const { data, error } = await supabase
    .from('notes')
    .select('*, offering:class_offerings(*, teacher:teachers(*))')
    .in('offering_id', offeringIds)
    .order('created_at', { ascending: false });
  return throwOnError(data, error, 'getNotesForOfferings');
}

/** Admin: get all notes */
export async function getAllNotes(): Promise<Note[]> {
  if (useMock) {
    return MOCK_NOTES.map(note => {
      const offering = MOCK_OFFERINGS.find(o => o.id === note.offering_id);
      const teacher = offering ? MOCK_TEACHERS.find(t => t.id === offering.teacher_id) : undefined;
      return {
        ...note,
        offering: offering ? { ...offering, teacher } : undefined
      };
    });
  }
  const { data, error } = await supabase
    .from('notes')
    .select('*, offering:class_offerings(*, teacher:teachers(*))')
    .order('created_at', { ascending: false });
  return throwOnError(data, error, 'getAllNotes');
}

/** Teacher/Admin: insert a new note */
export async function insertNote(payload: Omit<Note, 'id' | 'created_at'>): Promise<Note> {
  if (useMock) {
    const offering = MOCK_OFFERINGS.find(o => o.id === payload.offering_id);
    const teacher = offering ? MOCK_TEACHERS.find(t => t.id === offering.teacher_id) : undefined;
    const mock: Note = {
      id: `n_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...payload,
      offering: offering ? { ...offering, teacher } : undefined
    };
    MOCK_NOTES.unshift(mock);
    return mock;
  }
  const { data, error } = await (supabase as any)
    .from('notes')
    .insert(payload)
    .select()
    .single();
  return throwOnError(data, error, 'insertNote') as Note;
}

/** Teacher/Admin: delete a note */
export async function deleteNote(noteId: string): Promise<void> {
  if (useMock) {
    const idx = MOCK_NOTES.findIndex(n => n.id === noteId);
    if (idx !== -1) MOCK_NOTES.splice(idx, 1);
    return;
  }
  const { error } = await (supabase as any).from('notes').delete().eq('id', noteId);
  if (error) throw error;
}

// =============================================================================
// ADMIN: dashboard counts (fast COUNT queries)
// =============================================================================

export async function getDashboardCounts(): Promise<{
  students: number; teachers: number; offerings: number;
}> {
  if (useMock) {
    return {
      students: MOCK_STUDENTS.length,
      teachers: MOCK_TEACHERS.length,
      offerings: MOCK_OFFERINGS.length,
    };
  }
  const [studentsRes, teachersRes, offeringsRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('teachers').select('id', { count: 'exact', head: true }),
    supabase.from('class_offerings').select('id', { count: 'exact', head: true }),
  ]);
  return {
    students: studentsRes.count ?? 0,
    teachers: teachersRes.count ?? 0,
    offerings: offeringsRes.count ?? 0,
  };
}

// =============================================================================
// ROSTER PROVISIONING
// =============================================================================

export async function getAllRoster(): Promise<RosterEntry[]> {
  if (useMock) return [...MOCK_ROSTER];
  const { data, error } = await (supabase as any)
    .from('roster')
    .select('*')
    .order('created_at', { ascending: false });
  return throwOnError(data, error, 'getAllRoster');
}

export async function addRosterEntry(
  email: string,
  fullName: string,
  role: 'student' | 'teacher',
  classIds: string[]
): Promise<RosterEntry> {
  if (useMock) {
    const emailLower = email.toLowerCase().trim();
    if (MOCK_ROSTER.some(r => r.email.toLowerCase() === emailLower)) {
      throw new Error('Email is already registered in the roster.');
    }
    
    const rosterId = `r_mock_${Date.now()}`;
    const generatedProfileId = role === 'student' ? `s_mock_${Date.now()}` : `t_mock_${Date.now()}`;

    const newEntry: RosterEntry = {
      id: rosterId,
      email: emailLower,
      full_name: fullName,
      role,
      class_ids: classIds,
      profile_id: generatedProfileId,
      created_at: new Date().toISOString()
    };
    
    MOCK_ROSTER.push(newEntry);

    if (role === 'student') {
      MOCK_STUDENTS.push({
        id: generatedProfileId,
        role: 'student',
        full_name: fullName,
        avatar_url: null,
        phone: null,
        created_at: new Date().toISOString()
      });

      for (const cid of classIds) {
        MOCK_ENROLLMENTS.push({
          id: `e_mock_${Date.now()}_${cid}`,
          student_id: generatedProfileId,
          offering_id: cid,
          total_classes: 48,
          enrolled_at: new Date().toISOString()
        });
      }
    } else if (role === 'teacher') {
      MOCK_TEACHERS.push({
        id: generatedProfileId,
        full_name: fullName,
        avatar_url: null,
        phone: null,
        email: emailLower,
        joining_date: new Date().toISOString().split('T')[0],
        is_active: true,
        created_at: new Date().toISOString()
      });

      // Update class offerings
      for (const cid of classIds) {
        const off = MOCK_OFFERINGS.find(o => o.id === cid);
        if (off) off.teacher_id = generatedProfileId;
      }
    }
    
    return newEntry;
  }

  const { data, error } = await (supabase as any).rpc('add_to_roster', {
    p_email: email,
    p_full_name: fullName,
    p_role: role,
    p_class_ids: classIds
  });

  if (error) throw error;
  
  // Return the created entry by fetching it
  const { data: entry, error: fetchErr } = await (supabase as any)
    .from('roster')
    .select('*')
    .eq('id', data)
    .single();
    
  if (fetchErr) throw fetchErr;
  return entry as RosterEntry;
}

export async function updateRosterEntry(
  rosterId: string,
  classIds: string[]
): Promise<void> {
  if (useMock) {
    const entry = MOCK_ROSTER.find(r => r.id === rosterId);
    if (!entry) throw new Error('Roster entry not found.');

    entry.class_ids = classIds;

    if (entry.role === 'student' && entry.profile_id) {
      // Remove mock enrollments
      for (let i = MOCK_ENROLLMENTS.length - 1; i >= 0; i--) {
        if (MOCK_ENROLLMENTS[i].student_id === entry.profile_id) {
          MOCK_ENROLLMENTS.splice(i, 1);
        }
      }
      // Re-create enrollments
      for (const cid of classIds) {
        MOCK_ENROLLMENTS.push({
          id: `e_mock_${Date.now()}_${cid}`,
          student_id: entry.profile_id,
          offering_id: cid,
          total_classes: 48,
          enrolled_at: new Date().toISOString()
        });
      }
    } else if (entry.role === 'teacher') {
      const teacher = MOCK_TEACHERS.find(t => t.email === entry.email);
      if (teacher) {
        // Clear old classes
        for (const off of MOCK_OFFERINGS) {
          if (off.teacher_id === teacher.id) {
            off.teacher_id = null;
          }
        }
        // Assign new classes
        for (const cid of classIds) {
          const off = MOCK_OFFERINGS.find(o => o.id === cid);
          if (off) off.teacher_id = teacher.id;
        }
      }
    }
    return;
  }

  const { error } = await (supabase as any).rpc('update_roster_entry', {
    p_roster_id: rosterId,
    p_class_ids: classIds
  });

  if (error) throw error;
}

export async function deleteRosterEntry(rosterId: string): Promise<void> {
  if (useMock) {
    const idx = MOCK_ROSTER.findIndex(r => r.id === rosterId);
    if (idx === -1) throw new Error('Roster entry not found.');
    
    const entry = MOCK_ROSTER[idx];
    
    if (entry.role === 'student') {
      if (entry.profile_id) {
        // Delete student profile and enrollments
        const pIdx = MOCK_STUDENTS.findIndex(s => s.id === entry.profile_id);
        if (pIdx !== -1) MOCK_STUDENTS.splice(pIdx, 1);
        
        for (let i = MOCK_ENROLLMENTS.length - 1; i >= 0; i--) {
          if (MOCK_ENROLLMENTS[i].student_id === entry.profile_id) {
            MOCK_ENROLLMENTS.splice(i, 1);
          }
        }
      }
    } else if (entry.role === 'teacher') {
      const teacher = MOCK_TEACHERS.find(t => t.email === entry.email);
      if (teacher) {
        // Clear classes and delete teacher
        for (const off of MOCK_OFFERINGS) {
          if (off.teacher_id === teacher.id) {
            off.teacher_id = null;
          }
        }
        const tIdx = MOCK_TEACHERS.findIndex(t => t.id === teacher.id);
        if (tIdx !== -1) MOCK_TEACHERS.splice(tIdx, 1);
      }
    }
    
    MOCK_ROSTER.splice(idx, 1);
    return;
  }

  const { error } = await (supabase as any).rpc('delete_from_roster', {
    p_roster_id: rosterId
  });

  if (error) throw error;
}

// =============================================================================
// FEE SYSTEM FUNCTIONS
// =============================================================================

export async function getFeeConfig(classId: string): Promise<any | null> {
  if (useMock) {
    const { MOCK_FEE_CONFIGS } = await import('./mockData') as any;
    return MOCK_FEE_CONFIGS.find((fc: any) => fc.class_id === classId) || null;
  }
  const { data, error } = await (supabase as any)
    .from('fee_configs')
    .select('*')
    .eq('class_id', classId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveFeeConfig(
  classId: string,
  amount: number,
  paymentInstructions: string,
  whatsappNumber: string
): Promise<void> {
  if (useMock) {
    const { MOCK_FEE_CONFIGS } = await import('./mockData') as any;
    const existing = MOCK_FEE_CONFIGS.find((fc: any) => fc.class_id === classId);
    if (existing) {
      existing.amount = amount;
      existing.payment_instructions = paymentInstructions;
      existing.whatsapp_number = whatsappNumber;
    } else {
      MOCK_FEE_CONFIGS.push({
        id: `fc_${Date.now()}`,
        class_id: classId,
        amount,
        payment_instructions: paymentInstructions,
        whatsapp_number: whatsappNumber,
      });
    }
    return;
  }

  const { error } = await (supabase as any)
    .from('fee_configs')
    .upsert({
      class_id: classId,
      amount,
      payment_instructions: paymentInstructions,
      whatsapp_number: whatsappNumber,
      updated_at: new Date().toISOString()
    }, { onConflict: 'class_id' });
  if (error) throw error;
}

export async function getFeeStatus(studentId: string): Promise<any | null> {
  if (useMock) {
    const { MOCK_FEE_STATUSES } = await import('./mockData') as any;
    return MOCK_FEE_STATUSES.find((fs: any) => fs.student_id === studentId) || null;
  }
  const { data, error } = await (supabase as any)
    .from('fee_statuses')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateFeeStatus(
  studentId: string,
  status: 'unpaid' | 'pending' | 'paid',
  notes?: string
): Promise<void> {
  if (useMock) {
    const { MOCK_FEE_STATUSES, MOCK_FEE_AUDIT_LOGS } = await import('./mockData') as any;
    const existing = MOCK_FEE_STATUSES.find((fs: any) => fs.student_id === studentId);
    const oldStatus = existing ? existing.status : 'unpaid';
    
    if (existing) {
      existing.status = status;
      existing.updated_at = new Date().toISOString();
    } else {
      MOCK_FEE_STATUSES.push({
        id: `fs_${Date.now()}`,
        student_id: studentId,
        status,
        updated_at: new Date().toISOString()
      });
    }

    if (oldStatus !== status) {
      MOCK_FEE_AUDIT_LOGS.push({
        id: `al_${Date.now()}`,
        student_id: studentId,
        status_from: oldStatus,
        status_to: status,
        changed_by: 'mock-admin-id',
        changed_at: new Date().toISOString(),
        notes: notes || `Status updated from ${oldStatus} to ${status}`
      });
    }
    return;
  }

  // Real Supabase flow: updates fee_statuses. The trigger automatically creates the audit entry.
  // First, verify status exists. If not, insert first.
  const { data: existing } = await (supabase as any)
    .from('fee_statuses')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  if (!existing) {
    const { error: insErr } = await (supabase as any)
      .from('fee_statuses')
      .insert({ student_id: studentId, status });
    if (insErr) throw insErr;
  } else {
    const { error: updErr } = await (supabase as any)
      .from('fee_statuses')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('student_id', studentId);
    if (updErr) throw updErr;
  }
}

export async function getPendingFeeStatuses(): Promise<any[]> {
  if (useMock) {
    const { MOCK_FEE_STATUSES, MOCK_STUDENTS, MOCK_ROSTER, MOCK_OFFERINGS } = await import('./mockData') as any;
    const pendingList = MOCK_FEE_STATUSES.filter((fs: any) => fs.status === 'pending');
    
    return pendingList.map((fs: any) => {
      const student = MOCK_STUDENTS.find((s: any) => s.id === fs.student_id);
      const rosterEntry = MOCK_ROSTER.find((r: any) => r.profile_id === fs.student_id);
      let className = 'No Class';
      if (rosterEntry && rosterEntry.class_ids.length > 0) {
        const off = MOCK_OFFERINGS.find((o: any) => o.id === rosterEntry.class_ids[0]);
        if (off) {
          className = `${off.subject} (${off.grade})`;
        }
      }
      return {
        student_id: fs.student_id,
        full_name: student?.full_name || 'Unknown Student',
        email: rosterEntry?.email || 'N/A',
        status: fs.status,
        updated_at: fs.updated_at,
        class_name: className
      };
    });
  }

  // Real Supabase flow: Join profiles and roster/enrollments to show pending
  const { data, error } = await (supabase as any)
    .from('fee_statuses')
    .select(`
      student_id,
      status,
      updated_at,
      profiles!inner (
        full_name,
        enrollments (
          class_offerings (
            subject,
            grade
          )
        )
      )
    `)
    .eq('status', 'pending');

  if (error) throw error;

  // Roster email lookup is optional/secondary. Let's map it nicely.
  return (data || []).map((row: any) => {
    const classOfferings = row.profiles?.enrollments?.map((e: any) => e.class_offerings).filter(Boolean) || [];
    const className = classOfferings.length > 0 
      ? `${classOfferings[0].subject} (${classOfferings[0].grade})`
      : 'No Class';

    return {
      student_id: row.student_id,
      full_name: row.profiles?.full_name || 'Unknown Student',
      email: '', // will be queried or fallback
      status: row.status,
      updated_at: row.updated_at,
      class_name: className
    };
  });
}

export async function getFeeAuditLogs(studentId: string): Promise<any[]> {
  if (useMock) {
    const { MOCK_FEE_AUDIT_LOGS } = await import('./mockData') as any;
    return MOCK_FEE_AUDIT_LOGS.filter((log: any) => log.student_id === studentId)
      .sort((a: any, b: any) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
  }
  const { data, error } = await (supabase as any)
    .from('fee_audit_trail')
    .select('*')
    .eq('student_id', studentId)
    .order('changed_at', { ascending: false });
  if (error) throw error;
  return data;
}


