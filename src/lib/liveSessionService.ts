import { supabase } from './supabase';
import type { LiveSession, Profile, Enrollment, ClassSlot } from '../types';

const NOTIFIED_SESSIONS_STORAGE_KEY = 'scholario_notified_live_sessions';

/**
 * Returns the set of session IDs that have already triggered a notification in this browser session.
 */
export function getNotifiedSessionIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem(NOTIFIED_SESSIONS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Marks a session ID as notified in both memory and sessionStorage so reconnects or re-renders don't refire.
 */
export function markSessionIdAsNotified(sessionId: string): void {
  if (typeof window === 'undefined' || !sessionId) return;
  try {
    const set = getNotifiedSessionIds();
    set.add(sessionId);
    sessionStorage.setItem(NOTIFIED_SESSIONS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn('[LiveSessionService] Failed to persist notified session ID:', err);
  }
}

/**
 * Checks if a session has already triggered a notification in this session.
 */
export function isSessionAlreadyNotified(sessionId: string): boolean {
  if (!sessionId) return false;
  return getNotifiedSessionIds().has(sessionId);
}

/**
 * Scoping filter: Matches a live session's subject_id and grade_id against a student's enrollment data.
 * Only returns true if the student is enrolled in the matching subject and grade.
 */
export function isStudentEnrolledInLiveSession(
  studentProfile: Profile | null,
  studentEnrollments: Enrollment[],
  liveSession: Partial<LiveSession>
): boolean {
  if (!studentProfile || !liveSession) return false;

  // 1. Direct offering_id match
  if (liveSession.offering_id) {
    const directMatch = studentEnrollments.some(
      (e) => e.offering_id === liveSession.offering_id || e.offering?.id === liveSession.offering_id
    );
    if (directMatch) return true;
  }

  // Extract student grade identifiers
  const studentGrade = String(
    studentProfile.class?.grade ||
    (studentProfile as any).grade ||
    studentProfile.class_id ||
    ''
  ).trim().toLowerCase();

  const sessionGrade = String(liveSession.grade_id || '').trim().toLowerCase();

  // If both grade identifiers exist, ensure they match (e.g. '9' === '9' or 'grade 9' matching)
  if (sessionGrade && studentGrade) {
    const normalizeGrade = (g: string) => g.replace(/^grade\s*/i, '').replace(/^class\s*/i, '').trim();
    const normStudent = normalizeGrade(studentGrade);
    const normSession = normalizeGrade(sessionGrade);

    // If grade does not match and neither is an exact substring of the other, skip
    if (normStudent !== normSession && !normStudent.includes(normSession) && !normSession.includes(normStudent)) {
      return false;
    }
  }

  // 2. Check subject_id or subject_name against student enrollments
  const sessionSubjId = (liveSession.subject_id || '').trim().toLowerCase();
  const sessionSubjName = (liveSession.subject_name || '').trim().toLowerCase();

  if (studentEnrollments && studentEnrollments.length > 0) {
    const enrolledInSubject = studentEnrollments.some((e) => {
      const offering = e.offering;
      if (!offering) return false;

      const enrolledSubjId = String(offering.subject_id || (offering.subject as any)?.id || '').trim().toLowerCase();
      const enrolledSubjName = String(offering.subject_name || (offering.subject as any)?.name || offering.subject || '').trim().toLowerCase();

      if (sessionSubjId && enrolledSubjId && sessionSubjId === enrolledSubjId) {
        return true;
      }
      if (sessionSubjName && enrolledSubjName && (
        sessionSubjName === enrolledSubjName ||
        sessionSubjName.includes(enrolledSubjName) ||
        enrolledSubjName.includes(sessionSubjName)
      )) {
        return true;
      }
      return false;
    });

    if (enrolledInSubject) return true;
  }

  // 3. Fallback: If enrollment records are still loading, check if student grade and profile class match
  if (studentProfile.class_id && liveSession.grade_id && studentProfile.class_id === liveSession.grade_id) {
    return true;
  }

  return false;
}

/**
 * Fires a desktop browser Notification for a live session.
 */
export function fireLiveClassNotification(session: LiveSession): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  if (Notification.permission !== 'granted') {
    return null;
  }

  // Format notification content strictly according to specification:
  // Title: {Subject} class is live
  // Body: {Teacher name} started the class — tap to join
  const rawSubject = (session.subject_name || 'Class').trim();
  const subjectName = rawSubject.charAt(0).toUpperCase() + rawSubject.slice(1);
  const teacherName = (session.teacher_name || 'Your teacher').trim();

  const title = `${subjectName} class is live`;
  const body = `${teacherName} started the class — tap to join`;
  const tag = `live-session-${session.id}`;

  try {
    const notification = new Notification(title, {
      body,
      icon: '/logo.png',
      tag,
    });

    notification.onclick = (event) => {
      event.preventDefault();
      try {
        window.focus();
      } catch (err) {
        console.warn('[Notification] window.focus error:', err);
      }

      if (session.class_link) {
        const link = session.class_link.trim();
        window.open(link, '_blank');
      }

      notification.close();
    };

    // Mark as notified in memory and sessionStorage
    markSessionIdAsNotified(session.id);
    return notification;
  } catch (err) {
    console.error('[LiveSessionService] Error creating Notification:', err);
    return null;
  }
}

/**
 * Starts or updates a live session in `live_sessions` table when a teacher posts/starts a class link.
 */
export async function triggerLiveSession(params: {
  slot?: ClassSlot | null;
  slotId?: string;
  offeringId?: string | null;
  sessionDate: string;
  linkUrl: string;
  teacherId?: string | null;
  teacherName?: string | null;
  subjectName?: string | null;
  gradeId?: string | null;
  subjectId?: string | null;
}): Promise<LiveSession | null> {
  const { slot, sessionDate, linkUrl, teacherId } = params;
  const trimmedLink = linkUrl.trim();
  if (!trimmedLink) return null;

  const slotId = params.slotId || slot?.id || 'slot_default';
  const offering = slot?.offering;

  const offeringId = params.offeringId || slot?.offering_id || offering?.id || null;
  const subjectId = params.subjectId || offering?.subject_id || (offering?.subject as any)?.id || 'general';
  const gradeId = params.gradeId || offering?.class_id || offering?.grade || slot?.class_id || '9';
  const teacherIdFinal = teacherId || offering?.teacher_id || offering?.teacher?.id || null;
  const teacherName = params.teacherName || offering?.teacher?.full_name || 'Teacher';

  const rawSubj = params.subjectName || slot?.custom_title || offering?.subject_name || (offering?.subject as any)?.name || offering?.subject || 'Class';
  const subjectName = typeof rawSubj === 'string' ? rawSubj : 'Class';

  const sessionId = `${slotId}_${sessionDate}`;

  const rowPayload = {
    id: sessionId,
    subject_id: String(subjectId),
    grade_id: String(gradeId),
    class_link: trimmedLink,
    status: 'live',
    started_at: new Date().toISOString(),
    ended_at: null,
    teacher_id: teacherIdFinal,
    teacher_name: teacherName,
    subject_name: subjectName,
    slot_id: slotId,
    offering_id: offeringId,
    updated_at: new Date().toISOString(),
  };

  try {
    // 1. Direct Supabase Upsert
    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .upsert(rowPayload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (!error && data) {
      return data as LiveSession;
    }
  } catch (dbErr) {
    console.warn('[LiveSessionService] direct supabase upsert warning:', dbErr);
  }

  // 2. Server API fallback bridge
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch('/api/live-sessions/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(rowPayload),
    });
    if (response.ok) {
      const resData = (await response.json()) as { session?: LiveSession };
      return (resData.session || rowPayload) as LiveSession;
    }
  } catch (apiErr) {
    console.warn('[LiveSessionService] API bridge error:', apiErr);
  }

  return rowPayload as LiveSession;
}

/**
 * Ends an active live session by setting status to 'ended'.
 */
export async function endLiveSession(slotId: string, sessionDate: string): Promise<void> {
  const sessionId = `${slotId}_${sessionDate}`;
  const endPayload = {
    status: 'ended',
    ended_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await (supabase as any)
      .from('live_sessions')
      .update(endPayload)
      .eq('id', sessionId);
  } catch (err) {
    console.warn('[LiveSessionService] Error ending session directly:', err);
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    await fetch('/api/live-sessions/end', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ id: sessionId }),
    });
  } catch (err) {
    console.warn('[LiveSessionService] API end session bridge warning:', err);
  }
}
