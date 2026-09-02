// ─────────────────────────────────────────────────────────────────────────────
// Central Data Service
// All Supabase reads/writes go through functions in this file.
// Pages import from here — they never call supabase.from() directly.
// Real mode only — mock mode has been removed.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase';
import { pageCache } from './pageCache';
import { getPKTNow } from './scheduleUtils';
import { BOARDS, getGradesForBoard } from './taxonomy';
// getSubjectsForStream is defined below, reading from cachedTaxonomy — no longer imported from taxonomy.ts.
import type {
  Profile, Teacher, ClassOffering, ClassSlot, ClassSessionLink,
  Enrollment, Attendance, AttendanceStatus, Note, RosterEntry,
  BoardEntry, ClassEntry, StreamEntry, SubjectEntry, Announcement,
  TeacherAttendanceRating, TeacherAttendanceRatingVote,
  TestPaper, TestSubmission, StudentMCQAttempt, NoteFileType,
} from '../types';
import { triggerLiveSession, endLiveSession } from './liveSessionService';
export * from './liveSessionService';
export * from './avatarService';
export * from './chatService';

// ── tiny helper ───────────────────────────────────────────────────────────────
function throwOnError<T>(data: T | null, error: unknown, ctx: string): T {
  if (error) throw new Error(`[db:${ctx}] ${(error as any).message}`);
  if (data === null) throw new Error(`[db:${ctx}] No data returned`);
  return data;
}

function mapOffering(off: any): any {
  if (!off) return off;
  const subjName = off.subject?.name || (typeof off.subject === 'string' ? off.subject : null) || off.subject_name || 'Subject';
  const rawBoard = off.class?.board_id || off.class?.board?.id || off.board_id || off.board || 'fbise';
  const boardId = String(rawBoard).toLowerCase();
  const boardName = off.class?.board?.name || (boardId === 'sindh' ? 'Sindh Board' : boardId === 'ielts' ? 'IELTS' : 'Federal Board (FBISE)');
  return {
    ...off,
    board: boardId,
    board_id: boardId,
    board_name: boardName,
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
  const isUUID = (str?: string | null) => !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  
  if (isUUID(classId) && (isUUID(boardId) || boardId === 'fbise' || boardId === 'sindh' || boardId === 'ielts')) {
    const { error } = await (supabase as any).rpc('complete_student_onboarding', {
      p_student_id: studentId,
      p_board_id: boardId,
      p_class_id: classId,
      p_stream_id: isUUID(streamId) ? streamId : null,
      p_full_name: fullName || 'Student',
    });

    if (!error) return;
    console.warn('[db:completeStudentOnboarding] RPC returned error, attempting direct profile update:', error.message);
  }

  // Fallback direct profile & fee_status upsert to ensure onboarding succeeds even if board/class ID is synthetic or RPC fails
  const updatePayload: any = {
    full_name: fullName || 'Student',
    board_id: boardId,
    role: 'student',
  };
  if (isUUID(classId)) updatePayload.class_id = classId;
  if (isUUID(streamId)) updatePayload.stream_id = streamId;

  const { error: profErr } = await (supabase as any)
    .from('profiles')
    .update(updatePayload)
    .eq('id', studentId);
  
  if (profErr) {
    console.warn('[db:completeStudentOnboarding] direct profile update warning:', profErr);
  }

  // Also ensure fee status row exists
  try {
    await (supabase as any).from('fee_statuses').upsert({
      student_id: studentId,
      status: 'unpaid',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'student_id' });
  } catch (fe) {
    console.warn('[db:completeStudentOnboarding] fee_status upsert warning:', fe);
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
// CLASS SESSION LINKS (instance-specific Zoom/Meet links)
// =============================================================================

/** Get all session links for a specific calendar date (YYYY-MM-DD) */
export async function getSessionLinksForDate(sessionDate: string): Promise<ClassSessionLink[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('class_session_links')
      .select('*, slot:class_slots(*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*)))')
      .eq('session_date', sessionDate);
    if (error) {
      console.warn('[db:getSessionLinksForDate] warning:', error.message);
      return [];
    }
    return (data || []) as ClassSessionLink[];
  } catch (err) {
    console.warn('[db:getSessionLinksForDate] catch error:', err);
    return [];
  }
}

/** Get session links for multiple dates (e.g. today + upcoming days) */
export async function getSessionLinksForDates(sessionDates: string[]): Promise<ClassSessionLink[]> {
  if (!sessionDates || sessionDates.length === 0) return [];
  try {
    const { data, error } = await (supabase as any)
      .from('class_session_links')
      .select('*, slot:class_slots(*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*)))')
      .in('session_date', sessionDates);
    if (error) {
      console.warn('[db:getSessionLinksForDates] warning:', error.message);
      return [];
    }
    return (data || []) as ClassSessionLink[];
  } catch (err) {
    console.warn('[db:getSessionLinksForDates] catch error:', err);
    return [];
  }
}

/** Get a specific session link for a given slot and date */
export async function getSessionLink(slotId: string, sessionDate: string): Promise<ClassSessionLink | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('class_session_links')
      .select('*')
      .eq('slot_id', slotId)
      .eq('session_date', sessionDate)
      .maybeSingle();
    if (error) {
      console.warn('[db:getSessionLink] warning:', error.message);
      return null;
    }
    return data as ClassSessionLink | null;
  } catch (err) {
    console.warn('[db:getSessionLink] catch error:', err);
    return null;
  }
}

/** Upsert a live class link for a specific class slot and session date */
export async function upsertSessionLink(
  slotId: string,
  sessionDate: string,
  linkUrl: string,
  offeringId?: string | null,
  createdBy?: string | null
): Promise<ClassSessionLink> {
  const trimmed = linkUrl.trim();
  const payload: any = {
    slot_id: slotId,
    session_date: sessionDate,
    link_url: trimmed,
    updated_at: new Date().toISOString(),
  };
  if (offeringId) payload.offering_id = offeringId;
  if (createdBy) payload.created_by = createdBy;

  const { data, error } = await (supabase as any)
    .from('class_session_links')
    .upsert(payload, { onConflict: 'slot_id,session_date' })
    .select()
    .single();

  const savedLink = throwOnError(data, error, 'upsertSessionLink') as ClassSessionLink;

  // Trigger live session status update in background/async
  triggerLiveSession({
    slotId,
    sessionDate,
    linkUrl: trimmed,
    offeringId,
    teacherId: createdBy,
  }).catch((err) => {
    console.warn('[db:upsertSessionLink] live session trigger warning:', err);
  });

  return savedLink;
}

/** Delete / clear a session link for a specific slot and session date */
export async function deleteSessionLink(slotId: string, sessionDate: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('class_session_links')
    .delete()
    .eq('slot_id', slotId)
    .eq('session_date', sessionDate);

  endLiveSession(slotId, sessionDate).catch((err) => {
    console.warn('[db:deleteSessionLink] end live session warning:', err);
  });

  if (error) throw error;
}

// =============================================================================
// ENROLLMENTS
// =============================================================================

/** Admin: get all enrollments in the system */
export async function getAllEnrollments(): Promise<Enrollment[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, student:profiles(*, class:classes(*, board:boards(*)), stream_obj:streams(*)), offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*))');
  if (error) {
    const simple = await supabase.from('enrollments').select('*');
    return (simple.data || []) as Enrollment[];
  }
  return (data || []).map((r: any) => ({
    ...r,
    offering: r.offering ? mapOffering(r.offering) : undefined,
  })) as Enrollment[];
}

/** Admin/Teacher: get all students enrolled in a specific offering */
export async function getStudentsInOffering(offeringId: string): Promise<Profile[]> {
  const students: Profile[] = [];
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('student:profiles(*, class:classes(*, board:boards(*)), stream_obj:streams(*))')
      .eq('offering_id', offeringId);
    if (!error && data) {
      data.forEach((r: any) => {
        if (r.student) students.push(r.student);
      });
    }
  } catch (err) {
    console.warn('[db:getStudentsInOffering] enrollments join error:', err);
  }

  // Also resolve from roster table if any students have this offering assigned
  try {
    const { data: rosterData } = await (supabase as any)
      .from('roster')
      .select('*')
      .eq('role', 'student');
    if (rosterData && Array.isArray(rosterData)) {
      rosterData.forEach((r: any) => {
        if (Array.isArray(r.class_ids) && r.class_ids.includes(offeringId)) {
          students.push({
            id: r.profile_id || r.id,
            full_name: r.full_name || 'Student',
            role: 'student',
            avatar_url: null,
            phone: r.phone || null,
            created_at: r.created_at || new Date().toISOString(),
            stream: null,
            email: r.email,
          } as any);
        }
      });
    }
  } catch (err) {
    console.warn('[db:getStudentsInOffering] roster query error:', err);
  }

  const seen = new Set<string>();
  return students.filter((s: Profile) => {
    if (!s?.id || seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

/** Teacher: get all unique students across this teacher's offerings */
export async function getStudentsForTeacher(teacherId: string): Promise<Profile[]> {
  const offerings = await getOfferingsForTeacher(teacherId);
  const ids = offerings.map(o => o.id);
  const classIds = offerings.map(o => o.class_id).filter(Boolean);
  if (ids.length === 0) return [];

  const students: Profile[] = [];
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('student:profiles(*, class:classes(*, board:boards(*)), stream_obj:streams(*))')
      .in('offering_id', ids);
    if (!error && data) {
      data.forEach((r: any) => {
        if (r.student) students.push(r.student);
      });
    }
  } catch (err) {
    console.warn('[db:getStudentsForTeacher] enrollments join error:', err);
  }

  // Also query roster to pick up students linked to these class offerings
  try {
    const { data: rosterData } = await (supabase as any)
      .from('roster')
      .select('*')
      .eq('role', 'student');
    if (rosterData && Array.isArray(rosterData)) {
      rosterData.forEach((r: any) => {
        const hasMatch = Array.isArray(r.class_ids) && r.class_ids.some((cid: string) => ids.includes(cid) || classIds.includes(cid));
        if (hasMatch) {
          students.push({
            id: r.profile_id || r.id,
            full_name: r.full_name || 'Student',
            role: 'student',
            avatar_url: null,
            phone: r.phone || null,
            created_at: r.created_at || new Date().toISOString(),
            stream: null,
            email: r.email,
          } as any);
        }
      });
    }
  } catch (err) {
    console.warn('[db:getStudentsForTeacher] roster query error:', err);
  }

  // De-duplicate by profile id
  const seen = new Set<string>();
  return students.filter((s: Profile) => {
    if (!s?.id || seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
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

/** Get all attendance records in the database with rich joins */
export async function getAllAttendance(): Promise<Attendance[]> {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*, slot:class_slots(*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*)))')
      .limit(1000);
    const rows = throwOnError(data, error, 'getAllAttendance') || [];
    return rows.map((r: any) => {
      if (r.slot) {
        r.slot.offering = mapOffering(r.slot.offering);
      }
      return r;
    });
  } catch (err) {
    console.warn('[getAllAttendance] error fetching attendance:', err);
    return [];
  }
}

/** Admin/Teacher: get attendance for a specific slot + date */
export async function getAttendanceForSession(slotId: string, date: string): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, slot:class_slots(*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*)))')
    .eq('slot_id', slotId)
    .eq('session_date', date);
  const rows = throwOnError(data, error, 'getAttendanceForSession') || [];
  return rows.map((r: any) => {
    if (r.slot) {
      r.slot.offering = mapOffering(r.slot.offering);
    }
    return r;
  });
}

/** Teacher: get all attendance records for classes taught by a teacher */
export async function getAttendanceForTeacher(teacherId: string, sessionDate?: string): Promise<Attendance[]> {
  try {
    let query = supabase
      .from('attendance')
      .select('*, slot:class_slots(*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*)))');

    if (sessionDate) {
      query = query.eq('session_date', sessionDate);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[getAttendanceForTeacher] direct query failed, falling back:', error);
      const all = await getAllAttendance();
      return all.filter((r) => {
        const tId = r.slot?.offering?.teacher_id || r.slot?.offering?.teacher?.id;
        if (tId !== teacherId) return false;
        if (sessionDate && r.session_date !== sessionDate) return false;
        return true;
      });
    }
    const rows = (data || []).map((r: any) => {
      if (r.slot) {
        r.slot.offering = mapOffering(r.slot.offering);
      }
      return r;
    });
    return rows.filter((r: any) => {
      const tId = r.slot?.offering?.teacher_id || r.slot?.offering?.teacher?.id;
      return tId === teacherId;
    });
  } catch (err) {
    console.warn('[getAttendanceForTeacher] error:', err);
    return [];
  }
}

/** Student: get all attendance records for a student */
export async function getAttendanceForStudent(studentId: string): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, slot:class_slots(*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*)))')
    .eq('student_id', studentId)
    .order('session_date', { ascending: false })
    .limit(300);
  const rows = throwOnError(data, error, 'getAttendanceForStudent') || [];
  return rows.map((r: any) => {
    if (r.slot) {
      r.slot.offering = mapOffering(r.slot.offering);
    }
    return r;
  });
}

/** Validate that a slot exists, has a valid class offering, and matches the session date */
export async function validateSlotForAttendance(slotId: string, sessionDate: string): Promise<{ valid: boolean; error?: string }> {
  if (!slotId || slotId === 'slot-1') {
    return { valid: false, error: 'A valid scheduled class slot is required to record attendance.' };
  }
  if (!sessionDate) {
    return { valid: false, error: 'A valid session date is required.' };
  }

  const { data: slot, error } = await supabase
    .from('class_slots')
    .select('id, day_of_week, offering_id, is_cancelled')
    .eq('id', slotId)
    .maybeSingle();

  const slotData = slot as { id: string; day_of_week: number | null; offering_id: string | null; is_cancelled?: boolean } | null;

  if (error || !slotData || !slotData.offering_id) {
    return { valid: false, error: 'The class slot is not linked to an active scheduled class offering.' };
  }

  // Calculate day of week for sessionDate (0 = Monday, ..., 6 = Sunday)
  const [year, month, day] = sessionDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const sessionDow = (d.getDay() + 6) % 7;

  if (slotData.day_of_week != null && slotData.day_of_week !== sessionDow) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return {
      valid: false,
      error: `Class slot is scheduled on ${days[slotData.day_of_week] || 'another day'}, but ${sessionDate} is a ${days[sessionDow] || 'different day'}. Attendance can only be recorded on scheduled timetable days.`
    };
  }

  return { valid: true };
}

/** Mark student attendance when they tap "Join Class" or "Mark Attendance" */
export async function markStudentSelfAttendance(
  studentId: string,
  slotId: string,
  sessionDate?: string
): Promise<Attendance> {
  const today = sessionDate || new Date().toISOString().slice(0, 10);
  const nowTimestamp = new Date().toISOString();

  // Validate that slot is real and scheduled for today
  const validation = await validateSlotForAttendance(slotId, today);
  if (!validation.valid) {
    throw new Error(validation.error || 'Cannot mark attendance for an unscheduled slot.');
  }

  // 1. Check if record already exists
  const { data: existing } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId)
    .eq('slot_id', slotId)
    .eq('session_date', today)
    .maybeSingle();

  let record: any;

  if (existing) {
    const existingRec = existing as any;
    const { data, error } = await (supabase as any)
      .from('attendance')
      .update({
        status: 'pending',
        marked_at: nowTimestamp,
        marked_by: 'student',
      })
      .eq('id', existingRec.id)
      .select()
      .single();

    if (error) {
      console.warn('[markStudentSelfAttendance] update failed, returning fallback:', error);
      record = { ...existingRec, status: 'pending', marked_at: nowTimestamp, marked_by: 'student' };
    } else {
      record = data;
    }
  } else {
    const { data, error } = await (supabase as any)
      .from('attendance')
      .insert({
        student_id: studentId,
        slot_id: slotId,
        session_date: today,
        status: 'pending',
        marked_at: nowTimestamp,
        marked_by: 'student',
      })
      .select()
      .single();

    if (error) {
      console.warn('[markStudentSelfAttendance] insert failed, trying upsert:', error);
      const { data: upsertData } = await (supabase as any)
        .from('attendance')
        .upsert({
          student_id: studentId,
          slot_id: slotId,
          session_date: today,
          status: 'pending',
          marked_at: nowTimestamp,
          marked_by: 'student',
        }, { onConflict: 'student_id,slot_id,session_date' })
        .select()
        .maybeSingle();

      record = upsertData || {
        id: `att-${Date.now()}`,
        student_id: studentId,
        slot_id: slotId,
        session_date: today,
        status: 'pending',
        marked_at: nowTimestamp,
        marked_by: 'student',
      };
    } else {
      record = data;
    }
  }

  // Update pageCache for instant synchronization
  try {
    const currentStudentAtt = pageCache.get<Attendance[]>('student_attendance', studentId) || [];
    const updated = [record, ...currentStudentAtt.filter((a: any) => !(a.slot_id === slotId && a.session_date === today))];
    pageCache.set('student_attendance', updated, studentId);
  } catch (e) {
    // Ignore cache error
  }

  return record;
}

/** Record or toggle attendance for any single student (Teacher / Admin) */
export async function recordAttendance(params: {
  student_id: string;
  slot_id: string;
  session_date: string;
  status: AttendanceStatus;
  marked_by?: 'student' | 'teacher' | 'admin' | 'self';
}): Promise<void> {
  const { student_id, slot_id, session_date, status, marked_by = 'teacher' } = params;
  const nowTimestamp = new Date().toISOString();

  // Validate that slot is real and scheduled for session_date
  const validation = await validateSlotForAttendance(slot_id, session_date);
  if (!validation.valid) {
    throw new Error(validation.error || 'Cannot record attendance for an unscheduled slot.');
  }

  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('student_id', student_id)
    .eq('slot_id', slot_id)
    .eq('session_date', session_date)
    .maybeSingle();

  if (existing) {
    const { error } = await (supabase as any)
      .from('attendance')
      .update({
        status,
        marked_at: nowTimestamp,
        marked_by,
      })
      .eq('id', (existing as any).id);
    if (error) throw error;
  } else {
    const { error } = await (supabase as any)
      .from('attendance')
      .insert({
        student_id,
        slot_id,
        session_date,
        status,
        marked_at: nowTimestamp,
        marked_by,
      });
    if (error) {
      // Fallback to upsert
      const { error: upsertErr } = await (supabase as any)
        .from('attendance')
        .upsert({
          student_id,
          slot_id,
          session_date,
          status,
          marked_at: nowTimestamp,
          marked_by,
        }, { onConflict: 'student_id,slot_id,session_date' });
      if (upsertErr) throw upsertErr;
    }
  }
}

/** Helper to calculate difference in calendar days between two YYYY-MM-DD strings */
function diffCalendarDays(dateA: string, dateB: string): number {
  const [yA, mA, dA] = dateA.split('-').map(Number);
  const [yB, mB, dB] = dateB.split('-').map(Number);
  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);
  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
}

/** Compute live attendance streak metrics for a student based strictly on verified attendance */
export function computeAttendanceStreak(records: Attendance[]): {
  currentStreak: number;
  personalBest: number;
  last7Days: boolean[];
} {
  const emptyResult = {
    currentStreak: 0,
    personalBest: 0,
    last7Days: [false, false, false, false, false, false, false],
  };

  if (!records || records.length === 0) {
    return emptyResult;
  }

  // 1. Gather all unique calendar dates with confirmed 'present' or 'late' status
  const attendedDatesSet = new Set<string>();
  records.forEach((r) => {
    if (!r.session_date) return;
    const dateStr = r.session_date.slice(0, 10);
    if (r.status === 'present' || r.status === 'late') {
      attendedDatesSet.add(dateStr);
    }
  });

  const sortedAttendedDates = Array.from(attendedDatesSet).sort();
  if (sortedAttendedDates.length === 0) {
    return emptyResult;
  }

  // 2. Compute Personal Best: max consecutive calendar day streak across all history
  let personalBest = 1;
  let runningPBStreak = 1;
  for (let i = 1; i < sortedAttendedDates.length; i++) {
    const diff = diffCalendarDays(sortedAttendedDates[i - 1], sortedAttendedDates[i]);
    if (diff === 1) {
      runningPBStreak += 1;
    } else {
      runningPBStreak = 1;
    }
    if (runningPBStreak > personalBest) {
      personalBest = runningPBStreak;
    }
  }

  // 3. Compute Current Streak: consecutive calendar days active ending TODAY or YESTERDAY
  const pkt = getPKTNow();
  const todayStr = pkt.dateString || new Date().toISOString().slice(0, 10);
  const lastAttendedDate = sortedAttendedDates[sortedAttendedDates.length - 1];
  const daysSinceLastAttended = diffCalendarDays(lastAttendedDate, todayStr);

  let currentStreak = 0;
  // If the last attended session was today (0) or yesterday (1), the streak is alive!
  if (daysSinceLastAttended >= 0 && daysSinceLastAttended <= 1) {
    let streakCount = 1;
    for (let i = sortedAttendedDates.length - 1; i > 0; i--) {
      const diff = diffCalendarDays(sortedAttendedDates[i - 1], sortedAttendedDates[i]);
      if (diff === 1) {
        streakCount += 1;
      } else {
        break;
      }
    }
    currentStreak = streakCount;
  } else {
    currentStreak = 0; // Streak lapsed (no attendance today or yesterday)
  }

  // 4. Compute last7Days for the current week (Monday=0 ... Sunday=6) in PKT timezone
  const [tYear, tMonth, tDay] = todayStr.split('-').map(Number);
  const currentDayIndex = pkt.dayIndex; // 0=Mon ... 6=Sun
  const last7Days: boolean[] = [];

  for (let i = 0; i < 7; i++) {
    const offset = i - currentDayIndex;
    const targetDate = new Date(Date.UTC(tYear, tMonth - 1, tDay + offset));
    const targetDateStr = targetDate.toISOString().slice(0, 10);
    last7Days.push(attendedDatesSet.has(targetDateStr));
  }

  return { currentStreak, personalBest, last7Days };
}

/** Admin / Teacher: bulk upsert attendance records for a session */
export async function upsertAttendanceBatch(records: Array<{
  student_id: string;
  slot_id: string;
  session_date: string;
  status: AttendanceStatus;
  marked_at?: string;
  marked_by?: 'student' | 'teacher' | 'admin' | 'self';
}>): Promise<void> {
  if (!records || records.length === 0) return;

  // Validate the slot and session_date of the batch
  const firstRecord = records[0];
  const validation = await validateSlotForAttendance(firstRecord.slot_id, firstRecord.session_date);
  if (!validation.valid) {
    throw new Error(validation.error || 'Cannot record batch attendance for an unscheduled slot.');
  }

  const nowTimestamp = new Date().toISOString();
  const recordsWithTimestamp = records.map(r => ({
    ...r,
    marked_at: r.marked_at || nowTimestamp,
    marked_by: r.marked_by || 'admin',
  }));
  
  // Try batch upsert first
  const { error } = await (supabase as any)
    .from('attendance')
    .upsert(recordsWithTimestamp, { onConflict: 'student_id,slot_id,session_date' });
    
  if (error) {
    console.warn('[upsertAttendanceBatch] batch upsert failed, executing sequential updates:', error);
    for (const rec of recordsWithTimestamp) {
      await recordAttendance(rec).catch(console.error);
    }
  }
}

/** Compute overall institution attendance metrics & low attendance student list */
export async function getOverallAttendanceStats(): Promise<{
  attendanceRate: number;
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  lowAttendanceStudents: Array<{
    student: Profile;
    rate: number;
    attended: number;
    total: number;
    subject: string;
  }>;
}> {
  try {
    const [allAtt, allProfiles] = await Promise.all([
      getAllAttendance(),
      getAllStudents().catch(() => [] as Profile[]),
    ]);

    if (allAtt.length === 0) {
      // If no records yet recorded, return baseline 100% or 0%
      return {
        attendanceRate: 100,
        totalRecords: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        lowAttendanceStudents: [],
      };
    }

    let present = 0;
    let absent = 0;
    let late = 0;

    const studentMap = new Map<string, { present: number; total: number; subject: string }>();

    for (const r of allAtt) {
      if (r.status === 'present') present += 1;
      else if (r.status === 'late') late += 1;
      else if (r.status === 'absent') absent += 1;

      const rawSubj = r.slot?.custom_title || r.slot?.offering?.subject_name || r.slot?.offering?.subject || 'Class';
      const subj = typeof rawSubj === 'string' ? rawSubj : (rawSubj as any)?.name || 'Class';

      const curr = studentMap.get(r.student_id) || { present: 0, total: 0, subject: subj };
      curr.total += 1;
      if (r.status === 'present' || r.status === 'late') {
        curr.present += 1;
      }
      studentMap.set(r.student_id, curr);
    }

    const total = allAtt.length;
    const attended = present + late;
    const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 100;

    const profilesById = new Map(allProfiles.map(p => [p.id, p]));
    const lowAttendanceList: Array<{
      student: Profile;
      rate: number;
      attended: number;
      total: number;
      subject: string;
    }> = [];

    studentMap.forEach((val, studId) => {
      const studRate = val.total > 0 ? Math.round((val.present / val.total) * 100) : 100;
      // Eligibility rule: A student is only eligible to appear on the Low Attendance Watchlist
      // after at least 10 recorded class sessions exist for them.
      if (val.total >= 10 && studRate < 75) {
        const studentProfile = profilesById.get(studId) || {
          id: studId,
          full_name: 'Student',
          role: 'student' as const,
          avatar_url: null,
          phone: null,
          created_at: new Date().toISOString(),
        };
        lowAttendanceList.push({
          student: studentProfile,
          rate: studRate,
          attended: val.present,
          total: val.total,
          subject: val.subject,
        });
      }
    });

    return {
      attendanceRate,
      totalRecords: total,
      presentCount: present,
      absentCount: absent,
      lateCount: late,
      lowAttendanceStudents: lowAttendanceList,
    };
  } catch (err) {
    console.error('[getOverallAttendanceStats] error:', err);
    return {
      attendanceRate: 100,
      totalRecords: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      lowAttendanceStudents: [],
    };
  }
}

// =============================================================================
// TEACHER ATTENDANCE RATINGS (Student-side Vote & Admin Aggregation)
// =============================================================================

/** Student: Fetch all teacher attendance rating votes cast by this student */
export async function getTeacherAttendanceRatingsForStudent(studentId: string): Promise<TeacherAttendanceRating[]> {
  try {
    const { data, error } = await supabase
      .from('teacher_attendance_ratings')
      .select('*')
      .eq('student_id', studentId);
    if (error) {
      console.warn('[getTeacherAttendanceRatingsForStudent] error:', error);
      return [];
    }
    return (data as TeacherAttendanceRating[]) || [];
  } catch (err) {
    console.warn('[getTeacherAttendanceRatingsForStudent] catch:', err);
    return [];
  }
}

/** Student: Submit a locked vote on teacher attendance for a specific session */
export async function submitTeacherAttendanceRating(
  studentId: string,
  slotId: string,
  sessionDate: string,
  teacherId: string | null,
  rating: TeacherAttendanceRatingVote
): Promise<TeacherAttendanceRating> {
  const { data, error } = await (supabase as any)
    .from('teacher_attendance_ratings')
    .insert({
      student_id: studentId,
      slot_id: slotId,
      session_date: sessionDate,
      teacher_id: teacherId,
      rating,
    })
    .select()
    .single();

  return throwOnError(data, error, 'submitTeacherAttendanceRating');
}

/** Admin: Fetch all teacher attendance ratings with joined student, teacher, slot, offering data */
export async function getAllTeacherAttendanceRatings(): Promise<TeacherAttendanceRating[]> {
  try {
    const { data, error } = await supabase
      .from('teacher_attendance_ratings')
      .select('*, student:profiles(id, full_name, phone), teacher:teachers(id, full_name), slot:class_slots(*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*)))')
      .order('session_date', { ascending: false });

    const rows = throwOnError(data, error, 'getAllTeacherAttendanceRatings') || [];
    return rows.map((r: any) => {
      if (r.slot) {
        r.slot.offering = mapOffering(r.slot.offering);
      }
      return r;
    });
  } catch (err) {
    console.warn('[getAllTeacherAttendanceRatings] error:', err);
    return [];
  }
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
    file_type: NoteFileType;
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
// TESTS & TEST SUBMISSIONS
// =============================================================================

async function enrichTestsUrls(tests: any[]): Promise<TestPaper[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';
  return tests.map((r: any) => {
    let url = r.file_url || '';
    if (r.id) {
      url = `/api/tests/view/${r.id}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    }
    return {
      ...r,
      file_url: url,
      published_at: r.published_at || r.created_at,
      offering: mapOffering(r.offering),
      submissions_count: r.submissions_count || (r.submissions ? r.submissions.length : 0),
      graded_count: r.graded_count || (r.submissions ? r.submissions.filter((s: any) => s.status === 'graded').length : 0),
    };
  });
}

async function enrichSubmissionsUrls(subs: any[]): Promise<TestSubmission[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';
  return subs.map((r: any) => {
    let url = r.file_url || '';
    if (r.id) {
      url = `/api/submissions/view/${r.id}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    }
    return {
      ...r,
      file_url: url,
    };
  });
}

/** Student: fetch tests scoped to student's exact grade and stream */
export async function getTestsForStudent(grade: string, stream?: string, boardId?: string): Promise<TestPaper[]> {
  if (!grade) return [];
  try {
    const { data, error } = await (supabase as any)
      .from('tests')
      .select('*')
      .eq('grade', String(grade))
      .order('due_date', { ascending: true });

    if (error) {
      console.warn('[getTestsForStudent] error:', error);
      return [];
    }

    const rows = (data as TestPaper[]) || [];
    
    // Strict scoping: visibility is intersection of board, grade AND stream
    const filtered = rows.filter((t) => {
      if (boardId) {
        const testBoard = t.board || t.board_id || 'fbise';
        if (testBoard !== boardId) return false;
      }
      if (t.grade !== String(grade)) return false;
      if (!t.stream || t.stream === 'all' || t.stream === 'All Streams') return true;
      if (!stream) return true;
      
      const normStream = stream.trim().toLowerCase();
      const testStream = t.stream.trim().toLowerCase();
      return testStream === normStream || testStream.includes(normStream) || normStream.includes(testStream);
    });

    return enrichTestsUrls(filtered);
  } catch (err) {
    console.warn('[getTestsForStudent] catch:', err);
    return [];
  }
}

/** Admin / Teacher: get all test papers with optional teacher/grade/subject filters */
export async function getAllTests(): Promise<TestPaper[]> {
  try {
    const { data: testsData, error: testsErr } = await (supabase as any)
      .from('tests')
      .select('*')
      .order('created_at', { ascending: false });

    if (testsErr) {
      console.warn('[getAllTests] error:', testsErr);
      return [];
    }

    // Fetch submissions to calculate counts
    const { data: subsData } = await (supabase as any)
      .from('test_submissions')
      .select('id, test_id, status');

    const subsByTest = new Map<string, { total: number; graded: number }>();
    if (subsData) {
      subsData.forEach((s: any) => {
        const curr = subsByTest.get(s.test_id) || { total: 0, graded: 0 };
        curr.total += 1;
        if (s.status === 'graded') curr.graded += 1;
        subsByTest.set(s.test_id, curr);
      });
    }

    const tests = (testsData || []).map((t: any) => {
      const counts = subsByTest.get(t.id) || { total: 0, graded: 0 };
      return {
        ...t,
        submissions_count: counts.total,
        graded_count: counts.graded,
      };
    });

    return enrichTestsUrls(tests);
  } catch (err) {
    console.warn('[getAllTests] catch:', err);
    return [];
  }
}

/** Teacher: get tests assigned to teacher strictly matching their id and assigned subject/class combinations */
export async function getTestsForTeacher(
  teacherId?: string,
  teacherEmail?: string,
  teacherName?: string
): Promise<TestPaper[]> {
  if (!teacherId && !teacherEmail && !teacherName) return [];
  try {
    const allTests = await getAllTests();
    if (allTests.length === 0) return [];

    // Look up teachers table to resolve teacher record IDs and names
    const { data: teachersData } = await supabase.from('teachers').select('*');
    const teacherList = teachersData || [];

    const matchingTeacherIds = new Set<string>();
    const matchingTeacherNames = new Set<string>();

    if (teacherId) matchingTeacherIds.add(teacherId);
    if (teacherName && teacherName.trim()) matchingTeacherNames.add(teacherName.trim().toLowerCase());

    // Find matching records in teachers table
    teacherList.forEach((t: any) => {
      const idMatches = teacherId && (t.id === teacherId || t.user_id === teacherId);
      const emailMatches = teacherEmail && t.email && t.email.toLowerCase() === teacherEmail.toLowerCase();
      const nameMatches = teacherName && t.full_name && t.full_name.toLowerCase() === teacherName.toLowerCase();

      if (idMatches || emailMatches || nameMatches) {
        matchingTeacherIds.add(t.id);
        if (t.user_id) matchingTeacherIds.add(t.user_id);
        if (t.full_name) matchingTeacherNames.add(t.full_name.trim().toLowerCase());
      }
    });

    // Get offerings assigned to this teacher to get their active subject + class (grade) combinations
    let assignedOfferings: any[] = [];
    try {
      assignedOfferings = await getOfferingsForTeacher(teacherId);
    } catch {
      assignedOfferings = [];
    }

    const validPairs = assignedOfferings
      .map((o) => ({
        grade: String(o.class?.grade || o.grade || '').trim(),
        subject: (o.subject?.name || o.subject_name || '').trim().toLowerCase(),
      }))
      .filter((p) => p.grade && p.subject);

    // Strict filter:
    // 1) Test MUST be assigned to this teacher (by matching teacher_id or teacher_name)
    // 2) If teacher has offerings registered, test MUST match one of the teacher's subject + class combinations
    const filtered = allTests.filter((t) => {
      const isTeacherAssigned =
        (t.teacher_id && matchingTeacherIds.has(t.teacher_id)) ||
        (t.teacher_name && matchingTeacherNames.has(t.teacher_name.trim().toLowerCase()));

      if (!isTeacherAssigned) return false;

      if (validPairs.length > 0) {
        const tGrade = String(t.grade || '').trim();
        const tSub = (t.subject || '').trim().toLowerCase();
        const matchesOffering = validPairs.some(
          (p) =>
            p.grade === tGrade &&
            (p.subject === tSub || p.subject.includes(tSub) || tSub.includes(p.subject))
        );
        if (!matchesOffering) return false;
      }

      return true;
    });

    return filtered;
  } catch (err) {
    console.warn('[getTestsForTeacher] error:', err);
    return [];
  }
}

/** Upload test paper file to Cloudflare R2 /api/tests/upload */
export async function uploadTestPaperToR2(
  file: File,
  payload: {
    title: string;
    instructions?: string;
    board?: string;
    subject: string;
    grade: string;
    stream: string;
    total_marks: number;
    due_date: string;
    teacher_id?: string | null;
    teacher_name: string;
    uploaded_by?: string | null;
    uploaded_by_name?: string | null;
    file_type?: 'pdf' | 'image' | 'doc';
  },
  onProgress?: (pct: number) => void
): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', payload.title);
    if (payload.instructions) formData.append('instructions', payload.instructions);
    if (payload.board) formData.append('board', payload.board);
    formData.append('subject', payload.subject);
    formData.append('grade', payload.grade);
    formData.append('stream', payload.stream || 'all');
    formData.append('total_marks', String(payload.total_marks || 100));
    formData.append('due_date', payload.due_date);
    if (payload.teacher_id) formData.append('teacher_id', payload.teacher_id);
    formData.append('teacher_name', payload.teacher_name);
    if (payload.uploaded_by) formData.append('uploaded_by', payload.uploaded_by);
    if (payload.uploaded_by_name) formData.append('uploaded_by_name', payload.uploaded_by_name);
    formData.append('file_type', payload.file_type || 'pdf');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/tests/upload');
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
          reject(new Error('Invalid JSON response from test upload server.'));
        }
      } else {
        let errMsg = xhr.responseText;
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (parsed.error) errMsg = parsed.error;
        } catch {}
        reject(new Error(`Test upload failed (${xhr.status}): ${errMsg}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during test upload.'));
    xhr.send(formData);
  });
}

/** Teacher/Admin: delete a test paper */
export async function deleteTestPaper(testId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';

  const response = await fetch(`/api/tests/del/${testId}`, {
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
    throw new Error(`Test delete failed: ${errMsg}`);
  }
}

/** Student: upload answer sheet file to Cloudflare R2 /api/submissions/upload */
export async function uploadTestSubmissionToR2(
  file: File,
  payload: {
    test_id: string;
    student_name?: string;
    student_email?: string;
    grade?: string;
    stream?: string;
    subject?: string;
    file_type?: 'pdf' | 'image' | 'doc';
  },
  onProgress?: (pct: number) => void
): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('test_id', payload.test_id);
    if (payload.student_name) formData.append('student_name', payload.student_name);
    if (payload.student_email) formData.append('student_email', payload.student_email);
    if (payload.grade) formData.append('grade', payload.grade);
    if (payload.stream) formData.append('stream', payload.stream);
    if (payload.subject) formData.append('subject', payload.subject);
    formData.append('file_type', payload.file_type || 'pdf');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/submissions/upload');
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
          reject(new Error('Invalid JSON response from submission server.'));
        }
      } else {
        let errMsg = xhr.responseText;
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (parsed.error) errMsg = parsed.error;
        } catch {}
        reject(new Error(`Submission upload failed (${xhr.status}): ${errMsg}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during submission upload.'));
    xhr.send(formData);
  });
}

/** Get all submissions for a specific test paper */
export async function getSubmissionsForTest(testId: string): Promise<TestSubmission[]> {
  try {
    const [subsRes, profilesRes] = await Promise.all([
      (supabase as any).from('test_submissions').select('*').eq('test_id', testId).order('submitted_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, email:phone, phone, avatar_url')
    ]);

    const subs = subsRes.data || [];
    const profiles = profilesRes.data || [];
    const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

    const merged = subs.map((s: any) => {
      const prof = profileMap.get(s.student_id);
      return {
        ...s,
        student_name: s.student_name || prof?.full_name || 'Student',
        student_email: s.student_email || prof?.phone || null,
        student: prof,
      };
    });

    return enrichSubmissionsUrls(merged);
  } catch (err) {
    console.warn('[getSubmissionsForTest] error:', err);
    return [];
  }
}

/** Student: get all submissions submitted by a specific student */
export async function getSubmissionsForStudent(studentId: string): Promise<TestSubmission[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('test_submissions')
      .select('*, test:tests(*)')
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.warn('[getSubmissionsForStudent] error:', error);
      return [];
    }

    return enrichSubmissionsUrls(data || []);
  } catch (err) {
    console.warn('[getSubmissionsForStudent] catch:', err);
    return [];
  }
}

/** Teacher/Admin: grade a student test submission */
export async function gradeTestSubmission(
  submissionId: string,
  payload: {
    marks_obtained: number;
    max_marks?: number;
    teacher_feedback?: string;
  }
): Promise<TestSubmission> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';

  const response = await fetch('/api/submissions/grade', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      submission_id: submissionId,
      marks_obtained: payload.marks_obtained,
      max_marks: payload.max_marks,
      teacher_feedback: payload.teacher_feedback,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = errText;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error) errMsg = parsed.error;
    } catch {}
    throw new Error(`Grading failed: ${errMsg}`);
  }

  const result = (await response.json()) as any;
  return result.submission;
}

/** Download test paper blob */
export async function downloadTestBlob(test: TestPaper, onProgress?: (progress: number) => void): Promise<void> {
  if (!test.id) throw new Error('Test ID is required.');
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';

  const dlUrl = `/api/tests/dl/${test.id}`;
  const response = await fetch(dlUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) throw new Error(`Download fetch failed with status ${response.status}`);

  const blob = await response.blob();
  if (onProgress) onProgress(100);

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  const cleanTitle = (test.title || 'test_paper').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  link.download = `${cleanTitle}.${test.file_type === 'pdf' ? 'pdf' : 'jpg'}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

/** Download student submission answer sheet blob */
export async function downloadSubmissionBlob(sub: TestSubmission, onProgress?: (progress: number) => void): Promise<void> {
  if (!sub.id) throw new Error('Submission ID is required.');
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';

  const dlUrl = `/api/submissions/dl/${sub.id}`;
  const response = await fetch(dlUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) throw new Error(`Download fetch failed with status ${response.status}`);

  const blob = await response.blob();
  if (onProgress) onProgress(100);

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  const cleanName = (sub.student_name || 'student').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  link.download = `${cleanName}_answer_sheet.${sub.file_type === 'pdf' ? 'pdf' : 'jpg'}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

// =============================================================================
// STUDENT MCQ ATTEMPTS & TEST RESULTS
// =============================================================================

const MCQ_ATTEMPTS_LOCAL_KEY = 'scholario_student_mcq_attempts_v1';

function getStoredLocalMCQAttempts(): StudentMCQAttempt[] {
  try {
    const raw = localStorage.getItem(MCQ_ATTEMPTS_LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Purge any legacy mock/seed items
    const clean = parsed.filter(
      (item: any) =>
        !item?.id?.startsWith('mcq_seed_') &&
        !item?.student_id?.startsWith('std_seed_') &&
        !item?.student_email?.includes('@scholario.app')
    );
    if (clean.length !== parsed.length) {
      localStorage.setItem(MCQ_ATTEMPTS_LOCAL_KEY, JSON.stringify(clean));
    }
    return clean;
  } catch {
    return [];
  }
}

function saveStoredLocalMCQAttempt(attempt: StudentMCQAttempt): void {
  // Discard any mock records
  if (
    attempt.id?.startsWith('mcq_seed_') ||
    attempt.student_id?.startsWith('std_seed_') ||
    attempt.student_email?.includes('@scholario.app')
  ) {
    return;
  }
  try {
    const existing = getStoredLocalMCQAttempts();
    const updated = [attempt, ...existing.filter((a) => a.id !== attempt.id)].slice(0, 500);
    localStorage.setItem(MCQ_ATTEMPTS_LOCAL_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[db:saveStoredLocalMCQAttempt] error:', err);
  }
}

/** Save real student MCQ test attempt to Supabase student_mcq_attempts table */
export async function saveStudentMCQAttempt(attempt: StudentMCQAttempt): Promise<void> {
  // Reject mock records
  if (
    attempt.id?.startsWith('mcq_seed_') ||
    attempt.student_id?.startsWith('std_seed_') ||
    attempt.student_email?.includes('@scholario.app')
  ) {
    return;
  }

  saveStoredLocalMCQAttempt(attempt);

  try {
    const { error } = await (supabase as any)
      .from('student_mcq_attempts')
      .upsert({
        id: attempt.id,
        student_id: attempt.student_id,
        student_name: attempt.student_name,
        student_email: attempt.student_email || null,
        board: attempt.board || 'fbise',
        grade: String(attempt.grade || '9'),
        stream: attempt.stream || null,
        subject: attempt.subject,
        topic: attempt.topic,
        chapters: attempt.chapters || (attempt.topic ? [attempt.topic] : []),
        score: attempt.score,
        total_questions: attempt.total_questions,
        percentage: attempt.percentage,
        time_spent_seconds: attempt.time_spent_seconds,
        exam_mode: attempt.exam_mode || 'chapter',
        difficulty: attempt.difficulty || 'medium',
        created_at: attempt.created_at || new Date().toISOString(),
        user_answers: attempt.user_answers || null,
      }, { onConflict: 'id' });

    if (error) {
      console.warn('[db:saveStudentMCQAttempt] Supabase table error:', error.message || error);
    }
  } catch (err) {
    console.warn('[db:saveStudentMCQAttempt] catch error:', err);
  }
}

/** Admin: Fetch all real student MCQ attempts from Supabase student_mcq_attempts cross-referenced with profiles */
export async function getAllStudentMCQAttempts(): Promise<StudentMCQAttempt[]> {
  try {
    // 1. Fetch real student profiles from Supabase to enrich student metadata
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, email:phone, phone, board_id, class_id, stream, role, class:classes(grade, board:boards(name, code))')
      .eq('role', 'student');

    const profileMap = new Map<string, any>();
    if (Array.isArray(profilesData)) {
      profilesData.forEach((p: any) => {
        profileMap.set(p.id, p);
      });
    }

    // 2. Fetch real test attempts from Supabase student_mcq_attempts table
    const { data: attemptsData, error } = await (supabase as any)
      .from('student_mcq_attempts')
      .select('*')
      .order('created_at', { ascending: false });

    let supabaseAttempts: StudentMCQAttempt[] = [];
    if (!error && Array.isArray(attemptsData)) {
      // Filter out any mock/seed entries
      supabaseAttempts = attemptsData
        .filter(
          (d: any) =>
            !d.id?.startsWith('mcq_seed_') &&
            !d.student_id?.startsWith('std_seed_') &&
            !d.student_email?.includes('@scholario.app')
        )
        .map((d: any) => {
          const prof = profileMap.get(d.student_id);
          return {
            ...d,
            student_name: prof?.full_name || d.student_name || 'Enrolled Student',
            student_email: prof?.email || d.student_email || null,
            grade: String(d.grade || prof?.class?.grade || '9'),
            board: d.board || prof?.class?.board?.code || prof?.board_id || 'fbise',
            stream: d.stream || prof?.stream || null,
          };
        });
    }

    // 3. Merge with clean local attempts saved during the active real session (zero mock items)
    const local = getStoredLocalMCQAttempts();
    const existingIds = new Set(supabaseAttempts.map((a) => a.id));
    const combined = [...supabaseAttempts, ...local.filter((l) => !existingIds.has(l.id))];

    return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.warn('[db:getAllStudentMCQAttempts] query error:', err);
    return getStoredLocalMCQAttempts();
  }
}

/** Teacher: Fetch student MCQ attempts STRICTLY scoped to the teacher's assigned subjects and classes */
export async function getStudentMCQAttemptsForTeacher(
  teacherId?: string,
  teacherEmail?: string,
  teacherName?: string
): Promise<StudentMCQAttempt[]> {
  if (!teacherId && !teacherEmail && !teacherName) return [];
  try {
    // 1. Fetch teacher's assigned offerings to get exact grade & subject pairs
    let assignedOfferings: ClassOffering[] = [];
    try {
      assignedOfferings = await getOfferingsForTeacher(teacherId);
    } catch {
      assignedOfferings = [];
    }

    if (assignedOfferings.length === 0) {
      try {
        const { data: teachersData } = await supabase.from('teachers').select('*');
        const list: any[] = Array.isArray(teachersData) ? teachersData : [];
        const matchingRecord = list.find((t: any) =>
          (teacherId && (t.id === teacherId || t.user_id === teacherId)) ||
          (teacherEmail && t.email?.toLowerCase() === teacherEmail.toLowerCase()) ||
          (teacherName && t.full_name?.toLowerCase() === teacherName.toLowerCase())
        );
        if (matchingRecord && matchingRecord.id) {
          assignedOfferings = await getOfferingsForTeacher(matchingRecord.id);
        }
      } catch {}
    }

    const validPairs = assignedOfferings
      .map((o) => ({
        grade: String(o.class?.grade || o.grade || '').trim(),
        subject: (o.subject?.name || o.subject_name || o.subject || '').trim().toLowerCase(),
      }))
      .filter((p) => p.grade && p.subject);

    // If teacher has NO assigned offerings, they must see NO results (strict zero-trust scoping)
    if (validPairs.length === 0) {
      return [];
    }

    // 2. Fetch all attempts
    const allAttempts = await getAllStudentMCQAttempts();

    // 3. Strict filtering: attempt MUST match one of the teacher's assigned (grade, subject) pairs
    const filtered = allAttempts.filter((att) => {
      const attGrade = String(att.grade || '').trim();
      const attSub = (att.subject || '').trim().toLowerCase();

      return validPairs.some((p) => {
        const gradeMatches = p.grade === attGrade;
        const subjectMatches =
          p.subject === attSub ||
          p.subject.includes(attSub) ||
          attSub.includes(p.subject);
        return gradeMatches && subjectMatches;
      });
    });

    return filtered;
  } catch (err) {
    console.warn('[db:getStudentMCQAttemptsForTeacher] error:', err);
    return [];
  }
}

/** Student: Fetch MCQ attempts for a specific student */
export async function getStudentMCQAttemptsForStudent(studentId: string): Promise<StudentMCQAttempt[]> {
  if (!studentId) return [];
  const all = await getAllStudentMCQAttempts();
  return all.filter((a) => a.student_id === studentId);
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

export interface LiveGradeFee {
  class_id: string;
  board_id: string;
  grade: string;
  amount: number;
  payment_instructions: string;
  whatsapp_number: string;
}

/**
 * Fetches all live fee configurations in a single query across all classes and boards.
 * Bypasses all client-side caches to provide immediate fresh pricing data.
 */
export async function getAllLiveFeeConfigs(): Promise<{
  byKey: Record<string, number>;
  byClassId: Record<string, LiveGradeFee>;
  list: LiveGradeFee[];
}> {
  const { data, error } = await (supabase as any)
    .from('fee_configs')
    .select('amount, payment_instructions, whatsapp_number, class_id, classes:classes(id, grade, board_id)');

  const byKey: Record<string, number> = {};
  const byClassId: Record<string, LiveGradeFee> = {};
  const list: LiveGradeFee[] = [];

  if (!error && Array.isArray(data)) {
    data.forEach((row: any) => {
      const cls = row.classes;
      const amt = typeof row.amount === 'number' ? row.amount : parseInt(row.amount, 10) || 0;
      if (cls && amt > 0) {
        const item: LiveGradeFee = {
          class_id: cls.id,
          board_id: cls.board_id,
          grade: String(cls.grade),
          amount: amt,
          payment_instructions: row.payment_instructions,
          whatsapp_number: row.whatsapp_number,
        };
        byKey[`${cls.board_id}-${cls.grade}`] = amt;
        if (cls.board_id === 'fbise') {
          byKey[String(cls.grade)] = amt;
        }
        byClassId[cls.id] = item;
        list.push(item);
      }
    });
  }

  return { byKey, byClassId, list };
}

export async function getFeeConfig(classId: string): Promise<any | null> {
  if (!classId) return null;

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
  
  return row;
}

export async function getUniversalFeeConfig(): Promise<any | null> {
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
  
  return row;
}

/** Resolve live fee configuration for a given grade / class with single source of truth resolution */
export async function resolveGradeFeeConfig(grade: string, classId?: string | null, boardId?: string): Promise<{
  amount: number;
  payment_instructions: string;
  whatsapp_number: string;
}> {
  let targetClassId = classId;
  const targetBoard = boardId || 'fbise';
  if (!targetClassId) {
    const { data: clsData } = await (supabase as any)
      .from('classes')
      .select('id')
      .eq('board_id', targetBoard)
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
    if (targetBoard === 'ielts' || grade === 'IELTS' || grade === 'ielts') {
      amount = 5000;
    } else {
      const fallbackPrice = ['11', '12'].includes(grade) ? 4000 : 3000;
      amount = fallbackPrice;
    }
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
}

export interface ClassWithFeeConfig {
  id: string; // class_id
  board_id: string;
  grade: string;
  display_name: string;
  board_name: string;
  fee_config_id: string | null;
  amount: number;
  is_set: boolean;
  payment_instructions?: string;
  whatsapp_number?: string;
  updated_at?: string | null;
}

/**
 * Lists all classes across all boards joined with their respective fee_configs.
 * If a class does not yet have a fee_configs row, it returns is_set: false and amount: 0.
 */
export async function getClassesWithFeeConfigs(): Promise<ClassWithFeeConfig[]> {
  const [{ data: classesData, error: clsError }, { data: feeConfigsData, error: fcError }] = await Promise.all([
    (supabase as any).from('classes').select('*, board:boards(*)'),
    (supabase as any).from('fee_configs').select('*')
  ]);

  if (clsError) throw clsError;
  if (fcError) throw fcError;

  const feeMap = new Map<string, any>();
  (feeConfigsData || []).forEach((fc: any) => {
    if (fc.class_id) {
      feeMap.set(fc.class_id, fc);
    }
  });

  const universalConfig = (feeConfigsData || []).find((fc: any) => !fc.class_id) || null;

  const result: ClassWithFeeConfig[] = (classesData || []).map((cls: any) => {
    const fc = feeMap.get(cls.id);
    const hasConfig = !!fc;
    const amount = fc && typeof fc.amount === 'number' ? fc.amount : (fc?.amount ? Number(fc.amount) : 0);
    const boardName = cls.board?.name || (cls.board_id === 'sindh' ? 'Sindh Board' : cls.board_id === 'ielts' ? 'IELTS' : 'Federal Board (FBISE)');

    return {
      id: cls.id,
      board_id: cls.board_id,
      grade: cls.grade,
      display_name: cls.display_name,
      board_name: boardName,
      fee_config_id: fc?.id || null,
      amount: amount || 0,
      is_set: hasConfig && fc.amount !== null,
      payment_instructions: fc?.payment_instructions || universalConfig?.payment_instructions,
      whatsapp_number: fc?.whatsapp_number || universalConfig?.whatsapp_number,
      updated_at: fc?.updated_at || null,
    };
  });

  result.sort((a, b) => {
    if (a.board_id !== b.board_id) {
      return a.board_id === 'fbise' ? -1 : a.board_id === 'sindh' ? 0 : 1;
    }
    return parseInt(a.grade, 10) - parseInt(b.grade, 10);
  });

  return result;
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

  const boardsList: BoardEntry[] = [...(b.data || [])];
  // Ensure all boards are represented
  for (const boardDef of BOARDS) {
    if (!boardsList.some((bItem) => bItem.id === boardDef.id)) {
      boardsList.push({
        id: boardDef.id,
        name: boardDef.name,
      } as any);
    }
  }

  const classesData: ClassEntry[] = [...(c.data || [])];
  // Ensure classes exist for all boards (FBISE, Sindh, IELTS)
  for (const boardDef of BOARDS) {
    const grades = getGradesForBoard(boardDef.id);
    for (const g of grades) {
      if (!classesData.some((cls) => cls.board_id === boardDef.id && String(cls.grade) === String(g.grade))) {
        classesData.push({
          id: `${boardDef.id}-${g.grade}`,
          board_id: boardDef.id,
          grade: g.grade,
          display_name: g.displayName,
          board: { id: boardDef.id, name: boardDef.name },
        } as any);
      }
    }
  }
  classesData.sort((a: any, b: any) => parseInt(a.grade || '0', 10) - parseInt(b.grade || '0', 10));

  const streamsData: StreamEntry[] = [...(s.data || [])];
  // Ensure streams exist for all classes
  for (const cls of classesData) {
    const grades = getGradesForBoard(cls.board_id);
    const gradeDef = grades.find((g) => String(g.grade) === String(cls.grade));
    if (gradeDef) {
      for (const st of gradeDef.streams) {
        if (!streamsData.some((sItem) => sItem.class_id === cls.id && sItem.name.toLowerCase() === st.name.toLowerCase())) {
          streamsData.push({
            id: st.name,
            class_id: cls.id,
            name: st.name,
          } as any);
        }
      }
    }
  }

  const subjectsData: SubjectEntry[] = [...(sub.data || [])];
  const streamSubjectsData = [...(ss.data || [])];

  cachedTaxonomy = {
    boards: boardsList,
    classes: classesData,
    streams: streamsData,
    subjects: subjectsData,
    streamSubjects: streamSubjectsData,
  };
  return cachedTaxonomy;
}

/**
 * DB-backed replacement for the old taxonomy.ts getSubjectsForStream.
 * Supports board-aware lookup with fallback to taxonomy definition.
 */
export function getSubjectsForStream(grade: string, streamName: string, boardId?: string): string[] {
  const targetBoard = boardId || 'fbise';
  if (!cachedTaxonomy) {
    const grades = getGradesForBoard(targetBoard);
    const g = grades.find((gr) => gr.grade === grade);
    if (!g) return [];
    if (!streamName) return g.commonSubjects || [];
    const norm = streamName.trim().toLowerCase();
    const st = g.streams.find((s) => s.name.toLowerCase() === norm || norm.includes(s.name.toLowerCase()));
    return st?.subjects || g.streams[0]?.subjects || g.commonSubjects || [];
  }

  const gradeClass = cachedTaxonomy.classes.find(
    (c: any) => String(c.grade) === String(grade) && (!boardId || c.board_id === boardId)
  ) || cachedTaxonomy.classes.find((c: any) => String(c.grade) === String(grade));

  if (!gradeClass) {
    const grades = getGradesForBoard(targetBoard);
    const g = grades.find((gr) => gr.grade === grade);
    return g ? (g.streams[0]?.subjects || g.commonSubjects || []) : [];
  }

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

    if (subjects.length > 0) return Array.from(new Set(subjects)).sort();
    const grades = getGradesForBoard(gradeClass.board_id || targetBoard);
    const g = grades.find((gr) => gr.grade === grade);
    return g ? Array.from(new Set(g.streams.flatMap(s => s.subjects))).sort() : [];
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

  if (stream) {
    const subjects = cachedTaxonomy.streamSubjects
      .filter((ss: any) => ss.stream_id === stream.id)
      .map((ss: any) => cachedTaxonomy.subjects.find((sub: any) => sub.id === ss.subject_id)?.name)
      .filter(Boolean) as string[];
    if (subjects.length > 0) return Array.from(new Set(subjects)).sort();
  }

  const grades = getGradesForBoard(gradeClass.board_id || targetBoard);
  const g = grades.find((gr) => gr.grade === grade);
  if (!g) return [];
  const st = g.streams.find((s) => s.name.toLowerCase() === norm || norm.includes(s.name.toLowerCase()));
  return st?.subjects || g.streams[0]?.subjects || g.commonSubjects || [];
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
