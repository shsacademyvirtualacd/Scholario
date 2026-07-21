// ─────────────────────────────────────────────────────────────────────────────
// Central Data Service
// All Supabase reads/writes go through functions in this file.
// Pages import from here — they never call supabase.from() directly.
// Real mode only — mock mode has been removed.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase';
// getSubjectsForStream is defined below, reading from cachedTaxonomy — no longer imported from taxonomy.ts.
import type {
  Profile, Teacher, ClassOffering, ClassSlot,
  Enrollment, Attendance, Note, RosterEntry,
  BoardEntry, ClassEntry, StreamEntry, SubjectEntry, Announcement,
} from '../types';

// ── tiny helper ───────────────────────────────────────────────────────────────
function throwOnError<T>(data: T | null, error: unknown, ctx: string): T {
  if (error) throw new Error(`[db:${ctx}] ${(error as any).message}`);
  if (data === null) throw new Error(`[db:${ctx}] No data returned`);
  return data;
}

function mapOffering(off: any): any {
  if (!off) return off;
  const subjName = off.subject?.name || (typeof off.subject === 'string' ? off.subject : null) || off.subject_name || 'Subject';
  return {
    ...off,
    board: off.class?.board_id || off.class?.board?.id || off.board,
    grade: off.class?.grade || off.grade || '10',
    stream_id: off.stream_id || off.stream?.id || null,
    stream: typeof off.stream === 'string' ? off.stream : (off.stream?.name || off.stream_name || null),
    subject_name: subjName,
    subject: subjName,
    subject_obj: typeof off.subject === 'object' && off.subject !== null ? off.subject : null,
    teacher: off.teacher
  };
}

// =============================================================================
// PROFILES
// =============================================================================

/** Fetch a single profile by its Supabase auth UID */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, class:classes(*, board:boards(*)), stream_obj:streams(*)')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Admin: get all student profiles */
export async function getAllStudents(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, class:classes(*, board:boards(*)), stream_obj:streams(*)')
    .eq('role', 'student')
    .order('full_name');
  return throwOnError(data, error, 'getAllStudents');
}

/** Admin: insert a new student profile */
export async function insertStudent(payload: {
  full_name: string;
  phone: string | null;
  stream: string | null;
  board_id?: string | null;
  class_id?: string | null;
  stream_id?: string | null;
}): Promise<Profile> {
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
  payload: Partial<Pick<Profile, 'full_name' | 'phone' | 'stream' | 'board_id' | 'class_id' | 'stream_id'>>
): Promise<Profile> {
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
  const { error } = await (supabase as any).from('profiles').delete().eq('id', id);
  if (error) throw error;
}

/** Update any profile details */
export async function updateProfile(
  id: string,
  payload: Partial<Pick<Profile, 'full_name' | 'phone' | 'stream' | 'board_id' | 'class_id' | 'stream_id' | 'onboarding_complete'>>
): Promise<Profile> {
  const { data, error } = await (supabase as any)
    .from('profiles')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  return throwOnError(data, error, 'updateProfile') as Profile;
}

/**
 * Student onboarding: save grade + board + stream, then create enrollments
 * for all class_offerings that match that grade+board combo.
 * Also initialises the student's fee_status row if it doesn't exist.
 *
 * This calls a SECURITY DEFINER RPC on the database to bypass RLS.
 * Without the RPC, RLS blocks new students from reading class_offerings
 * (since they have no enrollments yet) and from writing to enrollments
 * (admin-only write policy), creating a deadlock.
 */
export async function completeStudentOnboarding(
  studentId: string,
  boardId: string,
  classId: string,
  streamId: string | null,
  _selectedSubjectIds: string[],
  fullName?: string
): Promise<void> {
  const { error } = await (supabase as any).rpc('complete_student_onboarding', {
    p_student_id: studentId,
    p_board_id: boardId,
    p_class_id: classId,
    p_stream_id: streamId || null,
    p_full_name: fullName || 'Student',
  });

  if (error) {
    throw new Error(`[db:completeStudentOnboarding] Onboarding RPC failed: ${error.message}`);
  }
}

// =============================================================================
// TEACHERS
// =============================================================================

/** Admin + Teacher: get all teachers */
export async function getAllTeachers(): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .order('full_name');
  return throwOnError(data, error, 'getAllTeachers');
}

/** Admin: insert a new teacher record */
export async function insertTeacher(payload: Omit<Teacher, 'id' | 'created_at' | 'avatar_url'>): Promise<Teacher> {
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
  const { data, error } = await supabase
    .from('class_offerings')
    .select('*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*)');
  const rows = throwOnError(data, error, 'getAllOfferings');
  return rows.map(mapOffering).sort((a: any, b: any) => (a.subject_name || a.subject?.name || '').localeCompare(b.subject_name || b.subject?.name || ''));
}

/** Teacher: get only offerings assigned to this teacher */
export async function getOfferingsForTeacher(teacherId?: string): Promise<ClassOffering[]> {
  let query = supabase
    .from('class_offerings')
    .select('*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*)');
  if (teacherId) {
    query = query.eq('teacher_id', teacherId);
  }
  const { data, error } = await query;
  const rows = throwOnError(data, error, 'getOfferingsForTeacher');
  return rows.map(mapOffering).sort((a: any, b: any) => (a.subject_name || a.subject?.name || '').localeCompare(b.subject_name || b.subject?.name || ''));
}

/** Student: get offerings the student is enrolled in */
export async function getOfferingsForStudent(studentId: string): Promise<ClassOffering[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*))')
    .eq('student_id', studentId);
  const rows = throwOnError(data, error, 'getOfferingsForStudent');
  return rows.map((r: any) => mapOffering(r.offering)).filter(Boolean);
}

/** Admin: assign/update teacher on a class offering */
export async function updateOfferingTeacher(offeringId: string, teacherId: string | null): Promise<void> {
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
  const { data, error } = await supabase
    .from('class_slots')
    .select('*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*))')
    .order('day_of_week')
    .order('start_time');
  const rows = throwOnError(data, error, 'getAllSlots');
  return rows.map((r: any) => ({
    ...r,
    start_time: r.start_time || '16:00:00',
    end_time: r.end_time || '17:00:00',
    day_of_week: r.day_of_week ?? 0,
    offering: mapOffering(r.offering),
  }));
}

/** Teacher: get slots for this teacher's assigned offerings */
export async function getSlotsForTeacher(teacherId?: string): Promise<ClassSlot[]> {
  let query = supabase
    .from('class_slots')
    .select('*, offering:class_offerings!inner(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*))')
    .order('day_of_week')
    .order('start_time');
  if (teacherId) {
    query = query.eq('offering.teacher_id', teacherId);
  }
  const { data, error } = await query;
  const rows = throwOnError(data, error, 'getSlotsForTeacher');
  return rows.map((r: any) => ({
    ...r,
    start_time: r.start_time || '16:00:00',
    end_time: r.end_time || '17:00:00',
    day_of_week: r.day_of_week ?? 0,
    offering: mapOffering(r.offering),
  }));
}

/** Student: get slots for this student's enrolled offerings */
export async function getSlotsForStudent(studentId: string): Promise<ClassSlot[]> {
  const enrolledOfferings = await getOfferingsForStudent(studentId);
  const ids = enrolledOfferings.map(o => o.id);

  const [profRes, classRes, streamRes] = await Promise.all([
    (supabase as any).from('profiles').select('class_id, stream, stream_id, class:classes(*, board:boards(*)), stream_obj:streams(*)').eq('id', studentId).maybeSingle(),
    (supabase as any).from('classes').select('*'),
    (supabase as any).from('streams').select('*'),
  ]);
  const profData = profRes.data;
  const allClasses = classRes.data || [];
  const allStreams = streamRes.data || [];

  const classId: string | null = profData?.class_id || enrolledOfferings[0]?.class?.id || null;
  const studentGrade = String(profData?.class?.grade || allClasses.find((c: any) => c.id === classId)?.grade || enrolledOfferings[0]?.class?.grade || (enrolledOfferings[0] as any)?.grade || '10');
  const studentStreamId = profData?.stream_id || profData?.stream_obj?.id || null;
  const studentStreamName = typeof profData?.stream === 'string' && profData.stream ? profData.stream : (profData?.stream_obj?.name || allStreams.find((s: any) => s.id === studentStreamId)?.name || (enrolledOfferings[0] as any)?.stream || '');

  // OPTIMIZATION: Push filters down to the database level
  let query = supabase
    .from('class_slots')
    .select('*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*))');

  let orFilters = [];
  if (ids.length > 0) {
    orFilters.push(`offering_id.in.(${ids.join(',')})`);
  }
  if (classId) {
    orFilters.push(`class_id.eq.${classId}`);
  }
  
  if (orFilters.length > 0) {
    query = query.or(orFilters.join(','));
  } else {
    // If no enrollments and no class, they have no slots.
    return [];
  }

  const { data, error } = await query
    .order('day_of_week')
    .order('start_time');

  const rawRows = throwOnError(data, error, 'getSlotsForStudent');
  const allRows = rawRows.map((r: any) => ({
    ...r,
    start_time: r.start_time || '16:00:00',
    end_time: r.end_time || '17:00:00',
    day_of_week: r.day_of_week ?? 0,
    offering: r.offering ? mapOffering(r.offering) : undefined,
  }));

  const streamSubjects = getSubjectsForStream(studentGrade, studentStreamName) || [];

  const filtered = allRows.filter((r: any) => {
    // 1. If exact offering ID is enrolled, include slot
    if (r.offering_id && ids.includes(r.offering_id)) return true;

    // Determine target class and grade for this slot
    const slotClassId = r.class_id || r.offering?.class_id || r.offering?.class?.id || null;
    const slotGrade = String(r.offering?.grade || allClasses.find((c: any) => c.id === slotClassId)?.grade || '');

    // 2. Grade & Class check
    const gradeMatches = studentGrade && slotGrade && String(studentGrade) === String(slotGrade);
    const classMatches = classId && slotClassId && classId === slotClassId;
    if (!gradeMatches && !classMatches) return false;

    // 3. Determine stream alignment exactly like ScheduleManagerPage does
    const slotStreamId = r.stream_id || r.offering?.stream_id || null;

    if (slotStreamId && slotStreamId !== 'all') {
      if (studentStreamId && slotStreamId === studentStreamId) return true;
      const slotStreamObj = allStreams.find((s: any) => s.id === slotStreamId);
      if (slotStreamObj && slotStreamObj.name && studentStreamName) {
        if (slotStreamObj.name.toLowerCase() === studentStreamName.toLowerCase()) return true;
      }
      return false;
    }

    if (r.offering_id && r.offering) {
      const offeringSubject = r.offering.subject_name || r.offering.subject?.name || '';
      if (studentStreamName && studentStreamName !== 'General Stream' && streamSubjects.length > 0) {
        return streamSubjects.includes(offeringSubject);
      }
      return true;
    }

    return !slotStreamId || slotStreamId === studentStreamId;
  });

  return filtered;
}

/** Admin: upsert a class slot */
export async function upsertSlot(slot: Partial<ClassSlot> & { offering_id?: string | null; custom_title?: string | null; class_id?: string | null; stream_id?: string | null }): Promise<ClassSlot> {
  const { data, error } = await (supabase as any)
    .from('class_slots')
    .upsert(slot as any)
    .select()
    .single();
  return throwOnError(data, error, 'upsertSlot') as ClassSlot;
}

/** Admin: delete a slot */
export async function deleteSlot(slotId: string): Promise<void> {
  const { error } = await (supabase as any).from('class_slots').delete().eq('id', slotId);
  if (error) throw error;
}

/** Admin: delete multiple class slots in bulk */
export async function deleteSlots(slotIds: string[]): Promise<void> {
  if (slotIds.length === 0) return;
  const { error } = await (supabase as any).from('class_slots').delete().in('id', slotIds);
  if (error) throw error;
}

// =============================================================================
// ENROLLMENTS
// =============================================================================

/** Admin: get all enrollments in the system */
export async function getAllEnrollments(): Promise<Enrollment[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*');
  return throwOnError(data, error, 'getAllEnrollments');
}

/** Admin/Teacher: get all students enrolled in a specific offering */
export async function getStudentsInOffering(offeringId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('student:profiles(*)')
    .eq('offering_id', offeringId);
  const rows = throwOnError(data, error, 'getStudentsInOffering');
  return rows.map((r: any) => r.student).filter(Boolean);
}

/** Teacher: get all unique students across this teacher's offerings */
export async function getStudentsForTeacher(teacherId: string): Promise<Profile[]> {
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
  const { data, error } = await (supabase as any)
    .from('enrollments')
    .insert({ student_id: studentId, offering_id: offeringId, total_classes: totalClasses })
    .select()
    .single();
  return throwOnError(data, error, 'enrollStudent') as Enrollment;
}

/** Student: get enrollments for a student */
export async function getEnrollmentsForStudent(studentId: string): Promise<Enrollment[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*))')
    .eq('student_id', studentId);
  const rows = throwOnError(data, error, 'getEnrollmentsForStudent');
  return rows.map((r: any) => ({ ...r, offering: mapOffering(r.offering) }));
}

// =============================================================================
// ATTENDANCE
// =============================================================================

/** Get all attendance records in the database */
export async function getAllAttendance(): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, slot:class_slots(*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*)))')
    // Safety limit — use paginated admin queries for full exports.
    // Fetching the entire attendance table without bounds is an OOM risk.
    .limit(500);
  const rows = throwOnError(data, error, 'getAllAttendance');
  return rows.map((r: any) => {
    if (r.slot) {
      r.slot.offering = mapOffering(r.slot.offering);
    }
    return r;
  });
}

/** Admin/Teacher: get attendance for a specific slot + date */
export async function getAttendanceForSession(slotId: string, date: string): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('slot_id', slotId)
    .eq('session_date', date);
  return throwOnError(data, error, 'getAttendanceForSession');
}

/** Student: get all attendance records for a student */
export async function getAttendanceForStudent(studentId: string): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, slot:class_slots(*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*)))')
    .eq('student_id', studentId)
    .order('session_date', { ascending: false })
    // 300 records ≈ 5 subjects × ~60 sessions per year, well above a full academic year.
    // Prevents unbounded growth from silently degrading dashboard load times.
    .limit(300);
  const rows = throwOnError(data, error, 'getAttendanceForStudent');
  return rows.map((r: any) => {
    if (r.slot) {
      r.slot.offering = mapOffering(r.slot.offering);
    }
    return r;
  });
}

/** Compute live attendance streak metrics for a student */
export function computeAttendanceStreak(records: Attendance[]): {
  currentStreak: number;
  personalBest: number;
  last7Days: boolean[];
} {
  if (!records || records.length === 0) {
    return { currentStreak: 0, personalBest: 0, last7Days: [false, false, false, false, false, false, false] };
  }

  // Group attendance by date and see if they attended ('present' or 'late') on that date
  const attendedDates = new Set<string>();
  const allDatesSet = new Set<string>();

  records.forEach((r) => {
    if (!r.session_date) return;
    const dateStr = r.session_date.slice(0, 10);
    allDatesSet.add(dateStr);
    if (r.status === 'present' || r.status === 'late') {
      attendedDates.add(dateStr);
    }
  });

  const sortedDates = Array.from(allDatesSet).sort();
  let currentStreak = 0;
  let personalBest = 0;
  let tempStreak = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    const d = sortedDates[i];
    if (attendedDates.has(d)) {
      tempStreak += 1;
      if (tempStreak > personalBest) personalBest = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // Calculate current active streak leading up to today or recent active date
  let streakCount = 0;
  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const d = sortedDates[i];
    if (attendedDates.has(d)) {
      streakCount += 1;
    } else {
      break;
    }
  }
  currentStreak = streakCount;

  // Last 7 days boolean presence array (Mon to Sun)
  const now = new Date();
  const currentDayIndex = (now.getDay() + 6) % 7; // 0 = Mon ... 6 = Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - currentDayIndex);

  const last7Days: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    const dtStr = dt.toISOString().slice(0, 10);
    last7Days.push(attendedDates.has(dtStr));
  }

  return { currentStreak, personalBest, last7Days };
}

/** Admin: bulk upsert attendance records for a session */
export async function upsertAttendanceBatch(records: Array<{
  student_id: string;
  slot_id: string;
  session_date: string;
  status: 'present' | 'absent' | 'late';
}>): Promise<void> {
  const { error } = await (supabase as any)
    .from('attendance')
    .upsert(records, { onConflict: 'student_id,slot_id,session_date' });
  if (error) throw error;
}

// =============================================================================
// NOTES
// =============================================================================

async function enrichNotesUrls(notes: any[]): Promise<Note[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';
  return Promise.all(
    notes.map(async (r: any) => {
      let url = r.file_url || '';
      if (r.id) {
        url = `/api/notes/view/${r.id}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      }
      return { ...r, file_url: url, offering: mapOffering(r.offering) };
    })
  );
}

/** Get view URL for a note via Cloudflare R2 /api/notes/view endpoint */
export async function getNoteSignedUrl(_filePath: string, noteId?: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';
  if (noteId) {
    return `/api/notes/view/${noteId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  }
  return '';
}

/** Upload note file and insert row via Cloudflare R2 /api/notes/upload endpoint */
export async function uploadNoteFileToR2(
  file: File,
  payload: {
    offering_id: string;
    chapter_name: string;
    title: string;
    file_type: 'pdf' | 'image';
  },
  onProgress?: (pct: number) => void
): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('offering_id', payload.offering_id);
    formData.append('chapter_name', payload.chapter_name);
    formData.append('title', payload.title);
    formData.append('file_type', payload.file_type);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/notes/upload');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) {
        onProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Invalid JSON response from server.'));
        }
      } else {
        let errMsg = xhr.responseText;
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (parsed.error) errMsg = parsed.error;
        } catch {}
        reject(new Error(`Upload failed (${xhr.status}): ${errMsg}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.send(formData);
  });
}

/** Legacy signature stub kept to prevent breaking unknown imports — points to Cloudflare R2 API */
export async function uploadNoteFile(_file: File, _folderPath: string = 'uploads'): Promise<{ path: string; url: string }> {
  throw new Error('uploadNoteFile direct Supabase Storage call removed. Use uploadNoteFileToR2.');
}

/** Securely download a note via fetch-then-blob calling Cloudflare R2 /api/notes/dl endpoint */
export async function downloadNoteBlob(note: any, onProgress?: (progress: number) => void): Promise<void> {
  if (!note.id) {
    throw new Error('Note ID is required for download.');
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';

  const dlUrl = `/api/notes/dl/${note.id}`;
  const response = await fetch(dlUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) throw new Error(`Download fetch failed with status ${response.status}`);
  
  const contentLength = response.headers.get('Content-Length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  
  if (!response.body) {
    // Fallback if ReadableStream is not supported
    const blob = await response.blob();
    if (onProgress) onProgress(100);
    triggerDownload(blob, note);
    return;
  }
  
  const reader = response.body.getReader();
  const chunks: any[] = [];
  let receivedLength = 0;
  
  while(true) {
    const {done, value} = await reader.read();
    
    if (done) {
      break;
    }
    
    if (value) {
      chunks.push(value);
      receivedLength += value.length;
      if (total && onProgress) {
         onProgress(Math.round((receivedLength / total) * 100));
      }
    }
  }
  
  const blob = new Blob(chunks, { type: response.headers.get('Content-Type') || 'application/pdf' });
  triggerDownload(blob, note);
}

function triggerDownload(blob: Blob, note: any) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = note.title ? `${note.title.replace(/[^a-zA-Z0-9_\-\.]/g, '_')}.pdf` : 'download.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

/** All roles: get all notes for a set of offering IDs */
export async function getNotesForOfferings(offeringIds: string[]): Promise<Note[]> {
  if (offeringIds.length === 0) return [];
  const { data, error } = await supabase
    .from('notes')
    .select('*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*))')
    .in('offering_id', offeringIds)
    .order('created_at', { ascending: false });
  const rows = throwOnError(data, error, 'getNotesForOfferings');
  return enrichNotesUrls(rows);
}

/** Admin: get all notes */
export async function getAllNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*))')
    .order('created_at', { ascending: false });
  const rows = throwOnError(data, error, 'getAllNotes');
  return enrichNotesUrls(rows);
}

/** Teacher/Admin: insert a new note */
export async function insertNote(payload: Omit<Note, 'id' | 'created_at'>): Promise<Note> {
  const { data, error } = await (supabase as any)
    .from('notes')
    .insert(payload)
    .select('*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*))')
    .single();
  const row = throwOnError(data, error, 'insertNote');
  const enriched = await enrichNotesUrls([row]);
  return enriched[0];
}

/** Teacher/Admin: delete a note */
export async function deleteNote(noteId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';

  const response = await fetch(`/api/notes/del/${noteId}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = errText;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error) errMsg = parsed.error;
    } catch {}
    throw new Error(`Delete failed: ${errMsg}`);
  }
}

// =============================================================================
// ADMIN: dashboard counts (fast COUNT queries)
// =============================================================================

export async function getDashboardCounts(): Promise<{
  students: number; teachers: number; offerings: number; admins: number; announcements: number;
}> {
  const [studentsRes, teachersRes, offeringsRes, adminProfilesRes, adminRosterRes, announcementsRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('teachers').select('id', { count: 'exact', head: true }),
    supabase.from('class_offerings').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('roster').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('announcements').select('id', { count: 'exact', head: true })
  ]);
  return {
    students: studentsRes.count ?? 0,
    teachers: teachersRes.count ?? 0,
    offerings: offeringsRes.count ?? 0,
    admins: Math.max(adminProfilesRes.count ?? 0, adminRosterRes.count ?? 0),
    announcements: announcementsRes.count ?? 0,
  };
}

// =============================================================================
// ROSTER PROVISIONING
// =============================================================================

function normalizeCanonicalEmail(email?: string): string {
  if (!email) return '';
  const cleaned = email.trim().toLowerCase();
  if (cleaned.replace(/[^a-z0-9]/g, '').includes('shsacademyvirtual')) {
    return 'shs.academy.virtual@gmail.com';
  }
  return cleaned;
}

export async function getAllRoster(): Promise<RosterEntry[]> {
  const [rosterRes, profilesRes, teachersRes] = await Promise.all([
    (supabase as any).from('roster').select('*'),
    supabase.from('profiles').select('*'),
    supabase.from('teachers').select('*')
  ]);

  if (rosterRes.error) console.warn('roster select error:', rosterRes.error);
  if (profilesRes.error) console.warn('profiles select error:', profilesRes.error);

  const rosterEntries: RosterEntry[] = rosterRes.data || [];
  const profiles: any[] = profilesRes.data || [];
  const teachers: any[] = teachersRes.data || [];

  const entryByEmail = new Map<string, RosterEntry>();
  const entryByProfileId = new Map<string, RosterEntry>();
  const mergedList: RosterEntry[] = [];

  // 1. Put all roster entries in map
  for (const entry of rosterEntries) {
    const emailKey = normalizeCanonicalEmail(entry.email);
    if (emailKey && entryByEmail.has(emailKey)) {
      const existing = entryByEmail.get(emailKey)!;
      if (entry.profile_id && !existing.profile_id) {
        existing.profile_id = entry.profile_id;
        entryByProfileId.set(entry.profile_id, existing);
      }
      continue;
    }

    const normalizedEntry = { ...entry, email: emailKey || entry.email };
    if (emailKey) entryByEmail.set(emailKey, normalizedEntry);
    mergedList.push(normalizedEntry);
    if (entry.profile_id) {
      entryByProfileId.set(entry.profile_id, normalizedEntry);
    }
  }

  // 2. Merge all profiles (students, admins, teachers)
  for (const p of profiles) {
    const emailKey = normalizeCanonicalEmail(p.email);
    const existing = (emailKey ? entryByEmail.get(emailKey) : null) || entryByProfileId.get(p.id);

    if (existing) {
      existing.profile_id = p.id;
      existing.full_name = p.full_name || existing.full_name;
      existing.role = p.role || existing.role;
      existing.email = emailKey || existing.email;
      if (p.class_id && !existing.class_ids?.includes(p.class_id)) {
        existing.class_ids = [...(existing.class_ids || []), p.class_id];
      }
      entryByProfileId.set(p.id, existing);
    } else {
      const newEntry: RosterEntry = {
        id: p.id,
        email: emailKey || 'Not yet signed in',
        full_name: p.full_name || 'Unnamed Account',
        role: p.role || 'student',
        class_ids: p.class_id ? [p.class_id] : [],
        profile_id: p.id,
        suspended: false,
        created_at: p.created_at || new Date().toISOString()
      };
      mergedList.push(newEntry);
      if (emailKey) entryByEmail.set(emailKey, newEntry);
      entryByProfileId.set(p.id, newEntry);
    }
  }

  // 3. Merge all teachers from teachers table
  for (const t of teachers) {
    const emailKey = normalizeCanonicalEmail(t.email);
    const existing = (emailKey ? entryByEmail.get(emailKey) : null) || entryByProfileId.get(t.id);

    if (existing) {
      existing.profile_id = existing.profile_id || t.id;
      existing.full_name = t.full_name || existing.full_name;
      existing.role = 'teacher';
    } else {
      const newEntry: RosterEntry = {
        id: t.id,
        email: emailKey || 'Not yet signed in',
        full_name: t.full_name || 'Teacher',
        role: 'teacher',
        class_ids: [],
        profile_id: t.id,
        suspended: !t.is_active,
        created_at: t.created_at || new Date().toISOString()
      };
      mergedList.push(newEntry);
      if (emailKey) entryByEmail.set(emailKey, newEntry);
      entryByProfileId.set(t.id, newEntry);
    }
  }

  return mergedList;
}

export async function addRosterEntry(
  email: string,
  fullName: string,
  role: 'student' | 'teacher',
  classIds: string[],
  phone?: string
): Promise<RosterEntry> {
  if (role === 'student') {
    throw new Error('Pre-provisioning of students is not allowed.');
  }
  const { data, error } = await (supabase as any).rpc('add_to_roster', {
    p_email: email,
    p_full_name: fullName,
    p_role: role,
    p_class_ids: classIds,
    p_phone: phone || null
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
  const { error } = await (supabase as any).rpc('update_roster_entry', {
    p_roster_id: rosterId,
    p_class_ids: classIds
  });

  if (error) throw error;
}

export async function toggleRosterAccess(
  rosterId: string,
  suspended: boolean
): Promise<void> {
  // Try updating by id or profile_id on roster table
  const { data, error } = await (supabase as any)
    .from('roster')
    .update({ suspended })
    .or(`id.eq.${rosterId},profile_id.eq.${rosterId}`)
    .select();

  if (error && error.code !== 'PGRST116') throw error;

  // If entry didn't exist in roster table (direct profile), insert/upsert a roster record for them
  if (!data || data.length === 0) {
    const { data: profile } = (await supabase.from('profiles').select('*').eq('id', rosterId).single()) as any;
    if (profile) {
      await (supabase as any).from('roster').upsert({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name || 'Unnamed Account',
        role: profile.role || 'student',
        class_ids: profile.class_id ? [profile.class_id] : [],
        profile_id: profile.id,
        suspended
      });
    }
  }
}

export async function toggleFeeSuspension(
  rosterId: string,
  feeSuspended: boolean
): Promise<void> {
  const updateData: any = { fee_suspended: feeSuspended };
  if (!feeSuspended) {
    updateData.awaiting_termination = false;
  }
  const { error } = await (supabase as any)
    .from('roster')
    .update(updateData)
    .or(`id.eq.${rosterId},profile_id.eq.${rosterId}`)
    .select();

  if (error && error.code !== 'PGRST116') throw error;
}

export async function requestAccountTermination(rosterId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('roster')
    .update({ awaiting_termination: true })
    .or(`id.eq.${rosterId},profile_id.eq.${rosterId}`)
    .select();

  if (error && error.code !== 'PGRST116') throw error;
}


export async function deleteRosterEntry(rosterId: string): Promise<void> {
  // Check if target is protected admin before anything else
  const { data: checkRole } = (await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', rosterId)
    .single()) as any;
  
  if (checkRole?.role === 'admin') {
    throw new Error('Access denied: Administrators cannot be removed.');
  }

  const { data: rosterCheck } = await (supabase as any)
    .from('roster')
    .select('role, full_name, email, profile_id')
    .eq('id', rosterId)
    .single();
    
  if (rosterCheck?.role === 'admin') {
    throw new Error('Access denied: Administrators cannot be removed.');
  }

  // First try the server-side RPC if available and up to date
  const { error } = await (supabase as any).rpc('delete_from_roster', {
    p_roster_id: rosterId
  });

  // Client-side comprehensive cleanup fallback to guarantee no orphaned records or broken schedules
  const profileId = rosterCheck?.profile_id || (checkRole ? rosterId : null);
  const email = rosterCheck?.email;

  if (profileId) {
    // 1. Clean fee audit and fee statuses
    await (supabase as any).from('fee_audit_trail').delete().or(`student_id.eq.${profileId},changed_by.eq.${profileId}`);
    await (supabase as any).from('fee_statuses').delete().eq('student_id', profileId);
    
    // 2. Clean enrollments, attendance, study sessions, notes
    await (supabase as any).from('enrollments').delete().eq('student_id', profileId);
    await (supabase as any).from('attendance').delete().eq('student_id', profileId);
    await (supabase as any).from('study_sessions').delete().eq('student_id', profileId);
    await (supabase as any).from('notes').delete().eq('uploaded_by', profileId);

    // 3. If teacher, unassign class offerings safely without breaking schedule slots
    if (rosterCheck?.role === 'teacher' || checkRole?.role === 'teacher') {
      const { data: tRow } = await (supabase as any).from('teachers').select('id').or(`id.eq.${profileId}${email ? `,email.ilike.${email}` : ''}`).maybeSingle();
      const teacherIdToUnlink = tRow?.id || profileId;
      await (supabase as any).from('class_offerings').update({ teacher_id: null }).eq('teacher_id', teacherIdToUnlink);
      await (supabase as any).from('teachers').delete().eq('id', teacherIdToUnlink);
    }

    // 4. Delete profile itself
    await supabase.from('profiles').delete().eq('id', profileId);
  } else if (rosterCheck?.role === 'teacher' && email) {
    const { data: tRow } = await (supabase as any).from('teachers').select('id').ilike('email', email).maybeSingle();
    if (tRow?.id) {
      await (supabase as any).from('class_offerings').update({ teacher_id: null }).eq('teacher_id', tRow.id);
      await (supabase as any).from('teachers').delete().eq('id', tRow.id);
    }
  }

  // Delete from roster table
  if (rosterId) {
    await (supabase as any).from('roster').delete().eq('id', rosterId);
  }
  if (profileId) {
    await (supabase as any).from('roster').delete().eq('profile_id', profileId);
  }
  if (error && error.message && !error.message.includes('not found')) {
    // If RPC threw a non-404 error but client fallback cleaned it up, we continue without throwing
    console.warn('RPC delete_from_roster returned info/error (handled by client fallback):', error.message);
  }
}

// =============================================================================
// FEE SYSTEM FUNCTIONS
// =============================================================================

let cachedUniversalFeeConfig: any = null;
const cachedFeeConfigs = new Map<string, any>();

export async function getFeeConfig(classId: string): Promise<any | null> {
  if (!classId) return null;
  if (cachedFeeConfigs.has(classId)) return cachedFeeConfigs.get(classId);

  const { data, error } = await (supabase as any)
    .from('fee_configs')
    .select('*')
    .eq('class_id', classId)
    .limit(1);
  if (error && error.code !== 'PGRST116') {
    console.warn('[db:getFeeConfig] error:', error);
    return null;
  }
  const row = data?.[0] || (Array.isArray(data) ? data[0] : data) || null;
  if (row && typeof row.payment_instructions === 'string' && row.payment_instructions.includes('033353292094')) {
    row.payment_instructions = row.payment_instructions.replace(/033353292094/g, '03335292094');
  }
  
  cachedFeeConfigs.set(classId, row);
  return row;
}

export async function getUniversalFeeConfig(): Promise<any | null> {
  if (cachedUniversalFeeConfig) return cachedUniversalFeeConfig;

  const { data, error } = await (supabase as any)
    .from('fee_configs')
    .select('*')
    .is('class_id', null)
    .limit(1);
  if (error && error.code !== 'PGRST116') {
    console.warn('[db:getUniversalFeeConfig] error:', error);
    return null;
  }
  const row = data?.[0] || (Array.isArray(data) ? data[0] : data) || null;
  if (row && typeof row.payment_instructions === 'string' && row.payment_instructions.includes('033353292094')) {
    row.payment_instructions = row.payment_instructions.replace(/033353292094/g, '03335292094');
  }
  
  cachedUniversalFeeConfig = row;
  return row;
}

/** Resolve live fee configuration for a given grade / class with single source of truth resolution */
export async function resolveGradeFeeConfig(grade: string, classId?: string | null): Promise<{
  amount: number;
  payment_instructions: string;
  whatsapp_number: string;
}> {
  let targetClassId = classId;
  if (!targetClassId) {
    const { data: clsData } = await (supabase as any)
      .from('classes')
      .select('id')
      .eq('board_id', 'fbise')
      .eq('grade', grade)
      .limit(1);
    if (clsData?.[0]?.id) targetClassId = clsData[0].id;
  }

  let amount: number | null = null;
  let classConfig: any = null;
  if (targetClassId) {
    classConfig = await getFeeConfig(targetClassId);
    if (classConfig && typeof classConfig.amount === 'number' && classConfig.amount > 0) {
      amount = classConfig.amount;
    }
  }

  const config = await getUniversalFeeConfig();
  if ((amount === null || amount <= 0) && config && typeof config.amount === 'number' && config.amount > 0) {
    amount = config.amount;
  }
  if (amount === null || amount <= 0) {
    const fallbackPrice = ['11', '12'].includes(grade) ? 3499 : 2499;
    amount = fallbackPrice;
  }

  let rawInstructions = classConfig?.payment_instructions || config?.payment_instructions || 'Easypaisa:\nNumber: 03335292094\nName: Sadia Fatima\n\nJazzCash:\nNumber: 03058969050\nName: Haseena Bibi';
  if (rawInstructions.includes('033353292094')) {
    rawInstructions = rawInstructions.replace(/033353292094/g, '03335292094');
  }

  return {
    amount,
    payment_instructions: rawInstructions,
    whatsapp_number: classConfig?.whatsapp_number || config?.whatsapp_number || '03222314436'
  };
}

export async function saveFeeConfig(
  classId: string,
  amount: number,
  paymentInstructions: string,
  whatsappNumber: string
): Promise<void> {
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
  
  cachedFeeConfigs.delete(classId);
  cachedUniversalFeeConfig = null;
}

export async function saveUniversalFeeConfig(
  paymentInstructions: string,
  whatsappNumber: string
): Promise<void> {
  // First look up if there is an existing row where class_id IS NULL
  const { data: existing, error: findError } = await (supabase as any)
    .from('fee_configs')
    .select('id')
    .is('class_id', null)
    .maybeSingle();

  if (findError) throw findError;

  if (existing) {
    const { error } = await (supabase as any)
      .from('fee_configs')
      .update({
        payment_instructions: paymentInstructions,
        whatsapp_number: whatsappNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await (supabase as any)
      .from('fee_configs')
      .insert({
        class_id: null,
        amount: 0,
        payment_instructions: paymentInstructions,
        whatsapp_number: whatsappNumber
      });
    if (error) throw error;
  }
  
  cachedUniversalFeeConfig = null;
  cachedFeeConfigs.clear();
}

export async function getFeeStatus(studentId: string): Promise<any | null> {
  if (!studentId) return null;
  const { data, error } = await (supabase as any)
    .from('fee_statuses')
    .select('*')
    .eq('student_id', studentId)
    .limit(1);
  if (error && error.code !== 'PGRST116') {
    console.warn('[db:getFeeStatus] error:', error);
    return null;
  }
  return data?.[0] || (Array.isArray(data) ? data[0] : data) || null;
}

export async function updateFeeStatus(
  studentId: string,
  status: 'unpaid' | 'pending' | 'paid',
  _notes?: string
): Promise<void> {
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
  const { data, error } = await (supabase as any)
    .from('fee_statuses')
    .select(`
      student_id,
      status,
      updated_at,
      profiles!inner (
        full_name,
        class_id,
        enrollments (
          class_offerings (
            class:classes (
              grade,
              board:boards (
                id,
                name
              )
            ),
            subject:subjects (
              name
            )
          )
        )
      )
    `)
    .eq('status', 'pending');

  if (error) throw error;

  // Also fetch all fee configs so we can attach the exact live amount per student's class
  const { data: allFeeConfigs } = await (supabase as any)
    .from('fee_configs')
    .select('class_id, amount');

  const feeMap = new Map<string, number>();
  (allFeeConfigs || []).forEach((fc: any) => {
    if (fc.class_id && typeof fc.amount === 'number') {
      feeMap.set(fc.class_id, fc.amount);
    }
  });

  return (data || []).map((row: any) => {
    const classOfferings = row.profiles?.enrollments?.map((e: any) => e.class_offerings).filter(Boolean) || [];
    const className = classOfferings.length > 0 
      ? `${classOfferings[0].subject?.name || ''} (${classOfferings[0].class?.grade || ''})`
      : 'No Class';

    const classId = row.profiles?.class_id;
    const amount = classId && feeMap.has(classId) ? feeMap.get(classId) : null;

    return {
      student_id: row.student_id,
      full_name: row.profiles?.full_name || 'Unknown Student',
      email: '',
      status: row.status,
      updated_at: row.updated_at,
      class_name: className,
      amount
    };
  });
}

export async function getFeeAuditLogs(studentId: string): Promise<any[]> {
  if (!studentId) return [];
  const { data, error } = await (supabase as any)
    .from('fee_audit_trail')
    .select('*')
    .eq('student_id', studentId)
    .order('changed_at', { ascending: false });
  if (error) {
    console.warn('[db:getFeeAuditLogs] error:', error);
    return [];
  }
  return data || [];
}

export async function syncPricingToFeeConfigs(
  classIdOrBoard: string,
  amountOrGrade: number | string,
  maybeAmount?: number
): Promise<void> {
  let classId: string;
  let amount: number;

  if (typeof amountOrGrade === 'string' && typeof maybeAmount === 'number') {
    // Legacy fallback: called as syncPricingToFeeConfigs(board, grade, amount)
    const { data: clsRow, error: clsErr } = await (supabase as any)
      .from('classes')
      .select('id')
      .eq('board_id', classIdOrBoard)
      .eq('grade', amountOrGrade)
      .maybeSingle();
    if (clsErr) throw clsErr;
    if (!clsRow) return;
    classId = clsRow.id;
    amount = maybeAmount;
  } else if (typeof amountOrGrade === 'number') {
    // Direct robust call: called as syncPricingToFeeConfigs(classId, amount)
    classId = classIdOrBoard;
    amount = amountOrGrade;
  } else {
    throw new Error('[syncPricingToFeeConfigs] Invalid arguments');
  }

  const { data: existing, error: configsError } = await (supabase as any)
    .from('fee_configs')
    .select('*')
    .eq('class_id', classId)
    .maybeSingle();

  if (configsError) throw configsError;

  const defaultInstructions = 'Easypaisa:\nNumber: 03335292094\nName: Sadia Fatima\n\nJazzCash:\nNumber: 03058969050\nName: Haseena Bibi';
  const defaultWhatsapp = '03222314436';

  const payload = {
    class_id: classId,
    amount,
    payment_instructions: existing?.payment_instructions || defaultInstructions,
    whatsapp_number: existing?.whatsapp_number || defaultWhatsapp,
    updated_at: new Date().toISOString()
  };

  const { error: upsertError } = await (supabase as any)
    .from('fee_configs')
    .upsert(payload, { onConflict: 'class_id' });

  if (upsertError) throw upsertError;
  
  cachedFeeConfigs.delete(classId);
  cachedUniversalFeeConfig = null;
}

let cachedTaxonomy: any = null;

export async function getTaxonomy(): Promise<{
  boards: BoardEntry[];
  classes: ClassEntry[];
  streams: StreamEntry[];
  subjects: SubjectEntry[];
  streamSubjects: { stream_id: string; subject_id: string }[];
}> {
  if (cachedTaxonomy) return cachedTaxonomy;

  const [b, c, s, sub, ss] = await Promise.all([
    supabase.from('boards').select('*').order('name'),
    supabase.from('classes').select('*, board:boards(*)'),
    supabase.from('streams').select('*, class:classes(*)').order('name'),
    supabase.from('subjects').select('*').order('name'),
    supabase.from('stream_subjects').select('*'),
  ]);

  const classesData = c.data || [];
  classesData.sort((a: any, b: any) => parseInt(a.grade || '0', 10) - parseInt(b.grade || '0', 10));

  cachedTaxonomy = {
    boards: b.data || [],
    classes: classesData,
    streams: s.data || [],
    subjects: sub.data || [],
    streamSubjects: ss.data || [],
  };
  return cachedTaxonomy;
}

/**
 * DB-backed replacement for the old taxonomy.ts getSubjectsForStream.
 *
 * Reads synchronously from cachedTaxonomy, which is populated by getTaxonomy()
 * on page load. All pages that use stream filtering already call getTaxonomy()
 * on mount, so the cache is always warm by the time this runs.
 *
 * Returns string[] of subject names that exactly match the DB subjects.name
 * column — no more static string drift.
 *
 * If cache is not yet warm (page called this before awaiting getTaxonomy()),
 * returns [] and logs a warning.
 */
export function getSubjectsForStream(grade: string, streamName: string): string[] {
  if (!cachedTaxonomy) {
    console.error('[db:getSubjectsForStream] Called before getTaxonomy() resolved. Return [].');
    return [];
  }

  const gradeClass = cachedTaxonomy.classes.find((c: any) => String(c.grade) === String(grade));
  if (!gradeClass) return [];

  if (!streamName) {
    // "All Streams" — return every subject across all streams for this grade, deduplicated
    const gradeStreamIds = new Set(
      cachedTaxonomy.streams
        .filter((s: any) => s.class_id === gradeClass.id)
        .map((s: any) => s.id)
    );
    const subjects = cachedTaxonomy.streamSubjects
      .filter((ss: any) => gradeStreamIds.has(ss.stream_id))
      .map((ss: any) => cachedTaxonomy.subjects.find((sub: any) => sub.id === ss.subject_id)?.name)
      .filter(Boolean) as string[];
    return Array.from(new Set(subjects)).sort();
  }

  const norm = streamName.trim().toLowerCase();
  const stream = cachedTaxonomy.streams.find(
    (s: any) =>
      s.class_id === gradeClass.id &&
      (
        s.name.toLowerCase() === norm ||
        norm.includes(s.name.toLowerCase()) ||
        s.name.toLowerCase().includes(norm)
      )
  );
  if (!stream) return [];

  return cachedTaxonomy.streamSubjects
    .filter((ss: any) => ss.stream_id === stream.id)
    .map((ss: any) => cachedTaxonomy.subjects.find((sub: any) => sub.id === ss.subject_id)?.name)
    .filter(Boolean) as string[];
}

// =============================================================================
// ANNOUNCEMENTS
// =============================================================================

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*, class:classes(*, board:boards(*)), stream:streams(*), creator:profiles(*)')
    .order('created_at', { ascending: false });
  const rows = throwOnError(data, error, 'getAnnouncements');
  return rows as unknown as Announcement[];
}

export async function createAnnouncement(payload: {
  title: string;
  body: string;
  severity?: 'normal' | 'crucial';
  scope?: 'system' | 'class';
  class_id?: string | null;
  stream_id?: string | null;
  created_by?: string | null;
}): Promise<Announcement> {
  const { data, error } = await (supabase as any)
    .from('announcements')
    .insert([{
      title: payload.title,
      body: payload.body,
      severity: payload.severity || 'normal',
      scope: payload.scope || 'system',
      class_id: payload.class_id || null,
      stream_id: payload.stream_id || null,
      created_by: payload.created_by || null,
    }])
    .select('*, class:classes(*, board:boards(*)), stream:streams(*), creator:profiles(*)')
    .single();
  const newAnn = throwOnError(data, error, 'createAnnouncement') as unknown as Announcement;

  // Fan-out notifications to actual recipients
  try {
    const recipientIds = new Set<string>();

    if (payload.scope === 'system' || !payload.scope) {
      // scope='system': one row per profile of role Student and Teacher
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['student', 'teacher']);
      
      if (profiles) {
        profiles.forEach((p: any) => recipientIds.add(p.id));
      }
    } else if (payload.scope === 'class' && payload.class_id) {
      // scope='class' (with or without stream):
      // 1. Enrolled students via enrollments + class_offerings
      const { data: enrolledData } = await supabase
        .from('enrollments')
        .select('student_id, offering:class_offerings!inner(class_id, stream_id)')
        .eq('offering.class_id', payload.class_id);
      
      if (enrolledData) {
        enrolledData.forEach((e: any) => {
          if (!payload.stream_id || !e.offering?.stream_id || e.offering.stream_id === payload.stream_id) {
            recipientIds.add(e.student_id);
          }
        });
      }

      // Also include student profiles directly assigned to class_id (+ stream_id if set)
      const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('id, stream_id')
        .eq('role', 'student')
        .eq('class_id', payload.class_id);
      
      if (studentProfiles) {
        studentProfiles.forEach((p: any) => {
          if (!payload.stream_id || !p.stream_id || p.stream_id === payload.stream_id) {
            recipientIds.add(p.id);
          }
        });
      }

      // 2. Teachers assigned to that class via class_offerings.teacher_id
      const { data: teacherOfferings } = await supabase
        .from('class_offerings')
        .select('teacher_id')
        .eq('class_id', payload.class_id);
      
      if (teacherOfferings) {
        teacherOfferings.forEach((o: any) => {
          if (o.teacher_id) recipientIds.add(o.teacher_id);
        });
      }

      // Plus existing teacher-class relationship via roster
      const { data: rosterRows } = await supabase
        .from('roster')
        .select('profile_id, class_ids');
      
      if (rosterRows) {
        rosterRows.forEach((r: any) => {
          if (Array.isArray(r.class_ids) && r.class_ids.includes(payload.class_id!)) {
            if (r.profile_id) recipientIds.add(r.profile_id);
          }
        });
      }
      // Note: Do not add extra Admin rows for scope='class' beyond creator having full visibility via announcements table
    }

    if (recipientIds.size > 0) {
      const notifRows = Array.from(recipientIds).map((uid) => ({
        recipient_id: uid,
        announcement_id: newAnn.id,
        type: 'announcement',
        title: newAnn.title,
        message: newAnn.body,
        severity: newAnn.severity || 'normal',
        is_read: false,
      }));

      await (supabase as any).from('notifications').insert(notifRows);
    }
  } catch (fanoutErr) {
    console.error('[createAnnouncement] Fan-out notification error:', fanoutErr);
  }

  return newAnn;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export interface NotificationRow {
  id: string;
  recipient_id: string;
  announcement_id: string | null;
  type: 'announcement' | 'class_reminder';
  title: string;
  message: string;
  severity: 'normal' | 'crucial';
  is_read: boolean;
  created_at: string;
}

export async function getNotificationsForUser(userId: string): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    // Cap at 50 — a reasonable inbox size. Notification tables grow quickly;
    // fetching all historical records would slow down every page load.
    .limit(50);
  const rows = throwOnError(data, error, 'getNotificationsForUser');
  return rows as unknown as NotificationRow[];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { data, error } = await (supabase as any)
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(`mark-read affected 0 rows for notification ${id}`);
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { data, error } = await (supabase as any)
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', userId)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(`mark-all-read affected 0 rows for user ${userId} — possible RLS/session mismatch`);
  }
}
