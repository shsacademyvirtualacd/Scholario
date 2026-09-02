import { supabase } from './supabase';
import type { Role, Profile, ChatThread, ChatMessage, ChatThreadWithDetails } from '../types';

/**
 * Helper to fetch all teacher IDs assigned to teach a specific student
 * via enrollments, class offerings, subject streams, and class associations.
 */
export async function getAssignedTeacherIdsForStudent(studentId: string): Promise<Set<string>> {
  const assignedIds = new Set<string>();
  if (!studentId) return assignedIds;

  try {
    const [studentProfRes, enrollmentsRes] = await Promise.all([
      (supabase as any)
        .from('profiles')
        .select('id, class_id, stream_id, stream, board_id, role, class:classes(*, board:boards(*)), stream_obj:streams(*)')
        .eq('id', studentId)
        .maybeSingle(),
      (supabase as any)
        .from('enrollments')
        .select('offering_id, class_offering_id, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*))')
        .eq('student_id', studentId),
    ]);

    const studentProf = studentProfRes?.data;
    const enrollments = enrollmentsRes?.data || [];

    // 1. Collect teacher IDs directly from enrollments -> class_offerings
    if (enrollments.length > 0) {
      const directOfferingIds: string[] = [];
      enrollments.forEach((e: any) => {
        const offId = e.offering_id || e.class_offering_id || e.offering?.id;
        if (offId) directOfferingIds.push(offId);
        if (e.offering?.teacher_id) assignedIds.add(e.offering.teacher_id);
        if (e.offering?.teacher?.id) assignedIds.add(e.offering.teacher.id);
      });

      if (directOfferingIds.length > 0) {
        const { data: offs } = await (supabase as any)
          .from('class_offerings')
          .select('id, teacher_id')
          .in('id', directOfferingIds);
        if (offs) {
          offs.forEach((o: any) => {
            if (o.teacher_id) assignedIds.add(o.teacher_id);
          });
        }
      }
    }

    // 2. Collect teacher IDs from student's enrolled class / stream offerings
    const classId = studentProf?.class_id || studentProf?.class?.id;
    if (classId) {
      const { data: classOfferings } = await (supabase as any)
        .from('class_offerings')
        .select('id, class_id, subject_id, teacher_id, stream_id, subject:subjects(name), stream:streams(name)')
        .eq('class_id', classId);

      if (classOfferings && classOfferings.length > 0) {
        const studentBoardId = studentProf?.board_id || studentProf?.class?.board_id || studentProf?.class?.board?.id;
        const isIelts =
          (studentBoardId && String(studentBoardId).toLowerCase() === 'ielts') ||
          (studentProf?.class?.grade && String(studentProf.class.grade).toLowerCase() === 'ielts') ||
          (studentProf?.stream && String(studentProf.stream).toLowerCase().includes('ielts'));

        const studentStreamName = studentProf?.stream_obj?.name || studentProf?.stream || '';
        const studentStreamId = studentProf?.stream_id || studentProf?.stream_obj?.id;

        classOfferings.forEach((off: any) => {
          if (!off.teacher_id) return;

          if (isIelts) {
            // For IELTS, any teacher assigned to an IELTS class offering is an assigned IELTS teacher
            assignedIds.add(off.teacher_id);
          } else {
            const offStreamName = off.stream?.name || '';
            const offStreamId = off.stream_id;

            if (offStreamId && studentStreamId && offStreamId === studentStreamId) {
              assignedIds.add(off.teacher_id);
            } else if (
              studentStreamName &&
              offStreamName &&
              offStreamName.toLowerCase() === studentStreamName.toLowerCase()
            ) {
              assignedIds.add(off.teacher_id);
            } else if (!offStreamId && !offStreamName) {
              // Common/compulsory subject offering for the whole class
              assignedIds.add(off.teacher_id);
            }
          }
        });
      }
    }
  } catch (err) {
    console.warn('[chatService] Error calculating assigned teacher IDs:', err);
  }

  return assignedIds;
}

/**
 * Check if a teacher is actually assigned to teach a student.
 */
export async function isTeacherAssignedToStudent(teacherId: string, studentId: string): Promise<boolean> {
  if (!teacherId || !studentId) return false;

  try {
    const assignedIds = await getAssignedTeacherIdsForStudent(studentId);
    if (assignedIds.has(teacherId)) return true;

    // Check cross-reference between teachers table and profiles table
    const [profRes, teacherRes] = await Promise.all([
      (supabase as any).from('profiles').select('id, phone, email').eq('id', teacherId).maybeSingle(),
      (supabase as any).from('teachers').select('id, phone, email').eq('id', teacherId).maybeSingle(),
    ]);

    const prof = profRes?.data;
    const tRec = teacherRes?.data;
    const possibleIds = new Set<string>([teacherId]);

    if (prof) {
      const { data: matchedTeachers } = await (supabase as any)
        .from('teachers')
        .select('id')
        .or(`id.eq.${prof.id}${prof.email ? `,email.ilike.${prof.email}` : ''}${prof.phone ? `,phone.eq.${prof.phone}` : ''}`);
      if (matchedTeachers) {
        matchedTeachers.forEach((t: any) => possibleIds.add(t.id));
      }
    }

    if (tRec) {
      const { data: matchedProfiles } = await (supabase as any)
        .from('profiles')
        .select('id')
        .or(`id.eq.${tRec.id}${tRec.email ? `,email.ilike.${tRec.email}` : ''}${tRec.phone ? `,phone.eq.${tRec.phone}` : ''}`);
      if (matchedProfiles) {
        matchedProfiles.forEach((p: any) => possibleIds.add(p.id));
      }
    }

    for (const id of possibleIds) {
      if (assignedIds.has(id)) return true;
    }

    return false;
  } catch (err) {
    console.error('[chatService] Error verifying teacher assignment:', err);
    return false;
  }
}

/**
 * Get or create a 1-on-1 thread between two participants.
 * Reuses existing thread regardless of who was participant_one or participant_two.
 */
export async function getOrCreateChatThread(
  participantA: { id: string; role?: Role | string },
  participantB: { id: string; role?: Role | string }
): Promise<ChatThread> {
  if (!participantA?.id || !participantB?.id) {
    throw new Error('Invalid participant IDs provided to getOrCreateChatThread');
  }

  if (participantA.id === participantB.id) {
    throw new Error('Cannot create chat thread with oneself');
  }

  const roleA: Role = (participantA.role === 'admin' || participantA.role === 'teacher' || participantA.role === 'student')
    ? participantA.role
    : 'student';
  const roleB: Role = (participantB.role === 'admin' || participantB.role === 'teacher' || participantB.role === 'student')
    ? participantB.role
    : 'student';

  // Helper to find existing thread across both ordering combinations
  const findExisting = async (): Promise<ChatThread | null> => {
    try {
      const { data: matched, error: matchErr } = await (supabase as any)
        .from('chat_threads')
        .select('*')
        .or(
          `and(participant_one_id.eq.${participantA.id},participant_two_id.eq.${participantB.id}),` +
          `and(participant_one_id.eq.${participantB.id},participant_two_id.eq.${participantA.id})`
        )
        .limit(1);

      if (!matchErr && matched && matched.length > 0) {
        return matched[0] as ChatThread;
      }
    } catch (e) {
      console.warn('[chatService] .or query warning:', e);
    }

    // Direct fallback queries in case .or filter is unsupported in particular proxy
    try {
      const { data: d1 } = await (supabase as any)
        .from('chat_threads')
        .select('*')
        .eq('participant_one_id', participantA.id)
        .eq('participant_two_id', participantB.id)
        .limit(1);
      if (d1 && d1.length > 0) return d1[0] as ChatThread;

      const { data: d2 } = await (supabase as any)
        .from('chat_threads')
        .select('*')
        .eq('participant_one_id', participantB.id)
        .eq('participant_two_id', participantA.id)
        .limit(1);
      if (d2 && d2.length > 0) return d2[0] as ChatThread;
    } catch (e) {
      console.warn('[chatService] Direct fallback query warning:', e);
    }

    return null;
  };

  // 1. Check if thread already exists
  const existing = await findExisting();
  if (existing) {
    return existing;
  }

  // Access control check: If a student is initiating a thread with a teacher, verify assignment
  if (roleA === 'student' && roleB === 'teacher') {
    const isAssigned = await isTeacherAssignedToStudent(participantB.id, participantA.id);
    if (!isAssigned) {
      throw new Error('Access restricted: You can only message teachers assigned to your enrolled courses.');
    }
  }

  // Determine thread_type, student_id, and staff_id
  let threadType: 'admin' | 'teacher' | 'staff' = 'admin';
  let studentId: string | null = null;
  let staffId: string | null = null;

  if (roleA === 'student' && roleB === 'admin') {
    threadType = 'admin';
    studentId = participantA.id;
    staffId = participantB.id;
  } else if (roleB === 'student' && roleA === 'admin') {
    threadType = 'admin';
    studentId = participantB.id;
    staffId = participantA.id;
  } else if (roleA === 'student' && roleB === 'teacher') {
    threadType = 'teacher';
    studentId = participantA.id;
    staffId = participantB.id;
  } else if (roleB === 'student' && roleA === 'teacher') {
    threadType = 'teacher';
    studentId = participantB.id;
    staffId = participantA.id;
  } else if (roleA === 'teacher' || roleB === 'teacher') {
    threadType = 'staff';
    studentId = null;
    staffId = roleA === 'teacher' ? participantA.id : participantB.id;
  }

  // 2. Insert new thread
  const insertPayload = {
    student_id: studentId,
    staff_id: staffId,
    thread_type: threadType,
    participant_one_id: participantA.id,
    participant_one_role: roleA,
    participant_two_id: participantB.id,
    participant_two_role: roleB,
  };

  console.log('[chatService] Inserting new chat_thread:', insertPayload);

  const { data: created, error: insertError } = await (supabase as any)
    .from('chat_threads')
    .insert(insertPayload)
    .select()
    .single();

  if (insertError) {
    console.warn('[chatService] Insert chat_thread error:', insertError);

    // If duplicate or conflict occurs, check if the thread now exists
    const retry = await findExisting();
    if (retry) return retry;

    const errMsg = insertError.message || insertError.details || insertError.hint || 'Database RLS or constraint error';
    throw new Error(`Failed to create conversation: ${errMsg}`);
  }

  return created as ChatThread;
}

/**
 * Helper to fetch teacher subject specializations from class offerings
 */
export async function getTeacherSubjectsMap(): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  try {
    const { data: offerings } = await (supabase as any)
      .from('class_offerings')
      .select('teacher_id, subject:subjects(name), class:classes(display_name)');
    if (offerings) {
      offerings.forEach((off: any) => {
        if (off.teacher_id && off.subject?.name) {
          const list = map.get(off.teacher_id) || [];
          if (!list.includes(off.subject.name)) list.push(off.subject.name);
          map.set(off.teacher_id, list);
        }
      });
    }
  } catch (err) {
    console.warn('[chatService] Failed to load teacher subjects map:', err);
  }
  return map;
}

/**
 * Enriches a list of profiles with distinct teacher subjects and differentiated admin titles
 */
export function enrichProfilesList(
  profiles: Profile[],
  teacherSubjectsMap?: Map<string, string[]>,
  teachersTableData?: any[]
): Profile[] {
  // Count how many admins exist to differentiate them if needed
  const adminProfiles = profiles.filter(p => p.role === 'admin');
  const multipleAdmins = adminProfiles.length > 1;

  let adminIndex = 0;

  return profiles.map((p) => {
    const enriched = { ...p } as any;

    if (p.role === 'teacher') {
      // Look up subjects
      const rawSubjects = [...(teacherSubjectsMap?.get(p.id) || [])];
      
      // Also look up in teachers table if name or email matches
      if (teachersTableData && teachersTableData.length > 0) {
        const teacherRec = teachersTableData.find(
          t => t.id === p.id || (p.phone && t.phone === p.phone) || (t.email && (p as any).email && t.email === (p as any).email)
        );
        if (teacherRec) {
          if ((!enriched.full_name || enriched.full_name.toLowerCase() === 'teacher') && teacherRec.full_name) {
            enriched.full_name = teacherRec.full_name;
          }
          if (teacherRec.subject && !rawSubjects.includes(teacherRec.subject)) {
            rawSubjects.push(teacherRec.subject);
          }
        }
      }

      // Unify IELTS sub-skills to single "IELTS Preparation" subject
      const hasIelts = rawSubjects.some(s => s.toLowerCase().includes('ielts'));
      const nonIelts = rawSubjects.filter(s => !s.toLowerCase().includes('ielts') && s.trim() !== '');
      const subjects = Array.from(new Set(nonIelts));
      if (hasIelts) {
        subjects.unshift('IELTS Preparation');
      }

      enriched.teacher_subjects = subjects;
      
      // If full_name is just "Teacher" or generic, give it a distinct subject descriptor
      if (!enriched.full_name || enriched.full_name.trim().toLowerCase() === 'teacher') {
        enriched.full_name = subjects.length > 0
          ? `${subjects[0]} Teacher`
          : (p.stream_obj?.name ? `${p.stream_obj.name} Teacher` : 'Faculty Instructor');
      }

      enriched.teacher_display_title = subjects.length > 0 
        ? `${subjects.join(', ')} Instructor` 
        : (p.stream_obj?.name ? `${p.stream_obj.name} Faculty` : 'Course Instructor');
    } else if (p.role === 'admin') {
      adminIndex++;
      
      const rawName = (enriched.full_name || '').trim();
      const isGenericName = !rawName || 
        rawName.toLowerCase() === 'admin' || 
        rawName.toLowerCase() === 'administrator' || 
        rawName.toLowerCase() === 'scholario administration';

      if (rawName.toLowerCase().includes('developer')) {
        enriched.admin_tag = 'System & Technical Administration';
      } else if (rawName.toLowerCase().includes('virtual')) {
        enriched.admin_tag = 'Admissions & Academic Office';
      } else if (multipleAdmins) {
        const adminTags = [
          'Admissions & Academic Office',
          'Accounts & Student Support',
          'Administrative Helpdesk',
          'Principal & Management Office',
        ];
        enriched.admin_tag = adminTags[(adminIndex - 1) % adminTags.length];
      } else {
        enriched.admin_tag = 'Institutional Administration';
      }

      if (isGenericName) {
        enriched.full_name = multipleAdmins
          ? `Admin Support (${adminIndex === 1 ? 'Primary / Academics' : 'Helpdesk / Support'})`
          : 'Scholario Administration';
      }
    }

    return enriched as Profile;
  });
}

/**
 * Get all threads for the current user with details (other participant profile, latest message, unread count)
 */
export async function getChatThreadsForUser(userId: string): Promise<ChatThreadWithDetails[]> {
  let threads: ChatThread[] = [];

  try {
    const { data, error } = await (supabase as any)
      .from('chat_threads')
      .select('*')
      .or(`participant_one_id.eq.${userId},participant_two_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      threads = data;
    } else if (error) {
      console.warn('[chatService] .or query warning on chat_threads:', error);
      // Direct query fallbacks
      const [res1, res2] = await Promise.all([
        (supabase as any).from('chat_threads').select('*').eq('participant_one_id', userId),
        (supabase as any).from('chat_threads').select('*').eq('participant_two_id', userId),
      ]);
      const combined = [...(res1.data || []), ...(res2.data || [])];
      const seen = new Set<string>();
      threads = combined.filter(t => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
    }
  } catch (err) {
    console.error('[chatService] Exception fetching threads:', err);
    return [];
  }

  if (!threads || threads.length === 0) return [];

  // Collect other participant IDs
  const otherIds = new Set<string>();
  threads.forEach((t: ChatThread) => {
    const otherId = t.participant_one_id === userId ? t.participant_two_id : t.participant_one_id;
    if (otherId) otherIds.add(otherId);
  });

  // Fetch profiles of all other participants
  const profileMap = new Map<string, Profile>();
  if (otherIds.size > 0) {
    try {
      const [profilesRes, offeringsRes, teachersRes] = await Promise.all([
        (supabase as any)
          .from('profiles')
          .select('*, class:classes(*, board:boards(*)), stream_obj:streams(*)')
          .in('id', Array.from(otherIds)),
        (supabase as any)
          .from('class_offerings')
          .select('teacher_id, subject:subjects(name), class:classes(display_name)'),
        (supabase as any)
          .from('teachers')
          .select('*'),
      ]);

      const teacherSubjectsMap = new Map<string, string[]>();
      if (offeringsRes.data) {
        offeringsRes.data.forEach((off: any) => {
          if (off.teacher_id && off.subject?.name) {
            const list = teacherSubjectsMap.get(off.teacher_id) || [];
            if (!list.includes(off.subject.name)) list.push(off.subject.name);
            teacherSubjectsMap.set(off.teacher_id, list);
          }
        });
      }

      if (profilesRes.data) {
        const rawProfiles: Profile[] = profilesRes.data;
        const enriched = enrichProfilesList(rawProfiles, teacherSubjectsMap, teachersRes.data || []);
        enriched.forEach((p: Profile) => {
          profileMap.set(p.id, p);
        });
      }
    } catch (e) {
      console.warn('[chatService] Profile lookup warning:', e);
    }
  }

  // Fetch latest messages & unread counts for all threads
  const threadIds = threads.map((t: ChatThread) => t.id);
  const messagesByThread = new Map<string, ChatMessage[]>();

  if (threadIds.length > 0) {
    try {
      const { data: messagesData, error: msgErr } = await (supabase as any)
        .from('chat_messages')
        .select('*')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: true });

      if (msgErr) {
        console.warn('[chatService] Batch messages fetch warning:', msgErr);
      }

      if (messagesData) {
        messagesData.forEach((m: ChatMessage) => {
          const list = messagesByThread.get(m.thread_id) || [];
          list.push(m);
          messagesByThread.set(m.thread_id, list);
        });
      }
    } catch (e) {
      console.warn('[chatService] Messages lookup warning:', e);
    }
  }

  const enrichedThreads: ChatThreadWithDetails[] = threads.map((t: ChatThread) => {
    const otherId = t.participant_one_id === userId ? t.participant_two_id : t.participant_one_id;
    const otherRole = t.participant_one_id === userId ? t.participant_two_role : t.participant_one_role;
    
    let otherProfile = profileMap.get(otherId);
    if (!otherProfile) {
      // Fallback profile if not found
      otherProfile = {
        id: otherId,
        full_name: otherRole === 'admin' ? 'Scholario Administration' : (otherRole === 'teacher' ? 'Faculty Teacher' : 'Student'),
        role: otherRole,
        avatar_url: null,
        phone: null,
        created_at: t.created_at,
      };
    }

    const tMessages = messagesByThread.get(t.id) || [];
    const latestMessage = tMessages.length > 0 ? tMessages[tMessages.length - 1] : null;
    const unreadCount = tMessages.filter(m => m.sender_id !== userId && !m.read_at).length;

    return {
      ...t,
      other_participant: otherProfile,
      latest_message: latestMessage,
      unread_count: unreadCount,
    };
  });

  // Sort by latest message date descending (or thread creation date)
  enrichedThreads.sort((a, b) => {
    const timeA = a.latest_message ? new Date(a.latest_message.created_at).getTime() : new Date(a.created_at).getTime();
    const timeB = b.latest_message ? new Date(b.latest_message.created_at).getTime() : new Date(b.created_at).getTime();
    return timeB - timeA;
  });

  return enrichedThreads;
}

/**
 * Get all messages for a specific thread
 */
export async function getChatMessages(threadId: string): Promise<ChatMessage[]> {
  const { data, error } = await (supabase as any)
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[chatService] Error fetching messages:', error);
    return [];
  }

  return (data || []) as ChatMessage[];
}

/**
 * Send a message in a thread. No delete capability.
 */
export async function sendChatMessage(
  threadId: string,
  senderId: string,
  senderRole: Role | string,
  content: string,
  extraOptions?: {
    messageType?: 'text' | 'voice';
    audioUrl?: string | null;
    audioDurationSeconds?: number | null;
  }
): Promise<ChatMessage> {
  const trimmed = content.trim();
  if (!trimmed && !extraOptions?.audioUrl) {
    throw new Error('Message content cannot be empty');
  }

  const normalizedRole = String(senderRole || 'student').toLowerCase();
  const messageType = extraOptions?.messageType || (extraOptions?.audioUrl ? 'voice' : 'text');

  const { data, error } = await (supabase as any)
    .from('chat_messages')
    .insert({
      thread_id: threadId,
      sender_id: senderId,
      sender_role: normalizedRole,
      content: trimmed || (messageType === 'voice' ? '🎤 Voice message' : ''),
      message_type: messageType,
      audio_url: extraOptions?.audioUrl || null,
      audio_duration_seconds: extraOptions?.audioDurationSeconds ?? null,
      read_at: null,
    })
    .select()
    .single();

  if (error) {
    console.error('[chatService] Error sending message:', error);
    throw new Error(`Failed to send message: ${error.message}`);
  }

  return data as ChatMessage;
}

/**
 * Send a voice message in a thread.
 */
export async function sendVoiceChatMessage(
  threadId: string,
  senderId: string,
  senderRole: Role | string,
  audioUrl: string,
  durationSeconds: number,
  fallbackText?: string
): Promise<ChatMessage> {
  if (!audioUrl) {
    throw new Error('Audio URL is required for a voice message.');
  }

  const durationFormatted = `${Math.floor(durationSeconds / 60)}:${durationSeconds % 60 < 10 ? '0' : ''}${durationSeconds % 60}`;
  const defaultText = fallbackText || `🎤 Voice message (${durationFormatted})`;

  return sendChatMessage(threadId, senderId, senderRole, defaultText, {
    messageType: 'voice',
    audioUrl,
    audioDurationSeconds: Math.round(durationSeconds),
  });
}

/**
 * Mark all unread messages in a thread sent by the other party as read
 */
export async function markChatThreadMessagesAsRead(threadId: string, currentUserId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('chat_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('thread_id', threadId)
    .neq('sender_id', currentUserId)
    .is('read_at', null);

  if (error) {
    console.error('[chatService] Error marking messages as read:', error);
  }
}

/**
 * Get the total number of unread messages across all threads for a user
 */
export async function getTotalUnreadChatCount(userId: string): Promise<number> {
  try {
    // 1. Get user's thread IDs
    const { data: threads, error: threadErr } = await (supabase as any)
      .from('chat_threads')
      .select('id')
      .or(`participant_one_id.eq.${userId},participant_two_id.eq.${userId}`);

    if (threadErr || !threads || threads.length === 0) return 0;

    const threadIds = threads.map((t: { id: string }) => t.id);

    // 2. Count unread messages
    const { count, error: msgErr } = await (supabase as any)
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .in('thread_id', threadIds)
      .neq('sender_id', userId)
      .is('read_at', null);

    if (msgErr) {
      console.error('[chatService] Error counting unread messages:', msgErr);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('[chatService] Exception in getTotalUnreadChatCount:', err);
    return 0;
  }
}

/**
 * For Student: Get ONLY assigned teachers (teachers teaching the student's enrolled courses/class) + All Admin profiles.
 * If no teacher is assigned yet, teachers will be an empty array and never fall back to the unfiltered teacher roster.
 * Admin profiles are always included and reachable by all students.
 */
export async function getStudentChatContacts(studentId: string): Promise<{
  teachers: Profile[];
  admins: Profile[];
  admin: Profile;
}> {
  // 1. Fetch assigned teacher IDs for this specific student
  const assignedTeacherIds = await getAssignedTeacherIdsForStudent(studentId);

  // 2. Fetch admin profiles, teacher subject mapping, and teacher metadata
  const [
    teacherSubjectsMap,
    teachersTableRes,
    allTeacherProfilesRes,
    allAdminProfilesRes
  ] = await Promise.all([
    getTeacherSubjectsMap(),
    (supabase as any).from('teachers').select('*').order('full_name'),
    (supabase as any)
      .from('profiles')
      .select('*, class:classes(*, board:boards(*)), stream_obj:streams(*)')
      .eq('role', 'teacher')
      .order('full_name'),
    (supabase as any)
      .from('profiles')
      .select('*')
      .eq('role', 'admin')
      .order('created_at', { ascending: true }),
  ]);

  let teachers: Profile[] = [];

  // ONLY populate teachers if there are actually assigned teacher IDs
  if (assignedTeacherIds.size > 0) {
    const allTeachersData: any[] = teachersTableRes?.data || [];
    const allTeacherProfiles: Profile[] = allTeacherProfilesRes?.data || [];

    // Map assigned teacher IDs (which might be in teachers table or profiles table)
    const matchedProfileIds = new Set<string>();

    assignedTeacherIds.forEach((tId) => {
      matchedProfileIds.add(tId);
      // If tId is in teachers table, find profile with matching email or phone
      const tRec = allTeachersData.find((t) => t.id === tId);
      if (tRec) {
        const matchingProf = allTeacherProfiles.find(
          (p) =>
            p.id === tRec.id ||
            (tRec.email && (p as any).email && (p as any).email.toLowerCase() === tRec.email.toLowerCase()) ||
            (tRec.phone && p.phone === tRec.phone)
        );
        if (matchingProf) {
          matchedProfileIds.add(matchingProf.id);
        }
      }
    });

    const teachersMap = new Map<string, Profile>();

    // Add matched profiles with role = 'teacher'
    allTeacherProfiles.forEach((p) => {
      if (matchedProfileIds.has(p.id)) {
        teachersMap.set(p.id, p);
      }
    });

    // Also include from teachers table if not already represented in profiles
    allTeachersData.forEach((t) => {
      if (assignedTeacherIds.has(t.id) && !teachersMap.has(t.id)) {
        const isRepresented = Array.from(teachersMap.values()).some(
          (p) => t.email && (p as any).email && (p as any).email.toLowerCase() === t.email.toLowerCase()
        );
        if (!isRepresented) {
          teachersMap.set(t.id, {
            id: t.id,
            full_name: t.full_name || 'Assigned Instructor',
            role: 'teacher',
            avatar_url: t.avatar_url || null,
            phone: t.phone || null,
            created_at: t.created_at || new Date().toISOString(),
          } as Profile);
        }
      }
    });

    teachers = Array.from(teachersMap.values());
    teachers = enrichProfilesList(teachers, teacherSubjectsMap, allTeachersData);
    teachers.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
  }

  // 3. Process ALL admin profiles (Admins are ALWAYS visible and reachable)
  let admins: Profile[] = allAdminProfilesRes?.data || [];

  if (admins.length === 0) {
    admins = [{
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Scholario Administration',
      role: 'admin',
      avatar_url: null,
      phone: null,
      created_at: new Date().toISOString(),
    }];
  } else {
    admins = enrichProfilesList(admins);
  }

  const primaryAdmin = admins[0];

  return { teachers, admins, admin: primaryAdmin };
}

/**
 * For Teacher: Get all students (enrolled + all students) and Admins so teacher can text both
 */
export async function getTeacherChatContacts(teacherId: string): Promise<{
  students: Profile[];
  admins: Profile[];
}> {
  let students = await getStudentsForTeacherClasses(teacherId);

  // Fallback to all students if teacher has no enrolled students listed yet
  if (students.length === 0) {
    try {
      const { data: allStudents } = await (supabase as any)
        .from('profiles')
        .select('*, class:classes(*, board:boards(*)), stream_obj:streams(*)')
        .eq('role', 'student')
        .order('full_name');
      students = allStudents || [];
    } catch (err) {
      console.warn('[chatService] Error fetching all students fallback:', err);
    }
  }

  let admins: Profile[] = [];
  try {
    const { data: adminProfiles } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('role', 'admin')
      .order('created_at', { ascending: true });
    admins = adminProfiles || [];
  } catch (err) {
    console.warn('[chatService] Error loading admins for teacher:', err);
  }

  if (admins.length === 0) {
    admins = [{
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Scholario Administration',
      role: 'admin',
      avatar_url: null,
      phone: null,
      created_at: new Date().toISOString(),
    }];
  } else {
    admins = enrichProfilesList(admins);
  }

  return { students, admins };
}

/**
 * For Admin: Get all Students and all Teachers
 */
export async function getAdminChatContacts(): Promise<{
  students: Profile[];
  teachers: Profile[];
}> {
  try {
    const [studentsRes, teachersRes, teacherSubjectsMap, teachersTableRes] = await Promise.all([
      (supabase as any)
        .from('profiles')
        .select('*, class:classes(*, board:boards(*)), stream_obj:streams(*)')
        .eq('role', 'student')
        .order('full_name'),
      (supabase as any)
        .from('profiles')
        .select('*, class:classes(*, board:boards(*)), stream_obj:streams(*)')
        .eq('role', 'teacher')
        .order('full_name'),
      getTeacherSubjectsMap(),
      (supabase as any).from('teachers').select('*'),
    ]);

    const enrichedTeachers = enrichProfilesList(teachersRes.data || [], teacherSubjectsMap, teachersTableRes.data || []);

    return {
      students: studentsRes.data || [],
      teachers: enrichedTeachers,
    };
  } catch (err) {
    console.error('[chatService] Error in getAdminChatContacts:', err);
    return { students: [], teachers: [] };
  }
}

/**
 * For Teacher: Get all students enrolled in any class taught by this teacher
 */
export async function getStudentsForTeacherClasses(teacherId: string): Promise<Profile[]> {
  try {
    const { data: offerings } = await (supabase as any)
      .from('class_offerings')
      .select('id')
      .eq('teacher_id', teacherId);

    if (!offerings || offerings.length === 0) return [];
    const offeringIds = offerings.map((o: any) => o.id);

    const { data: enrollments } = await (supabase as any)
      .from('enrollments')
      .select('student_id')
      .in('class_offering_id', offeringIds);

    if (!enrollments || enrollments.length === 0) return [];
    const studentIds = Array.from(new Set(enrollments.map((e: any) => e.student_id)));

    const { data: studentProfiles } = await (supabase as any)
      .from('profiles')
      .select('*, class:classes(*, board:boards(*)), stream_obj:streams(*)')
      .in('id', studentIds)
      .order('full_name');

    return studentProfiles || [];
  } catch (err) {
    console.error('[chatService] Error fetching teacher students:', err);
    return [];
  }
}

/**
 * For Admin: Get primary admin user profile or return fallback
 */
export async function getPrimaryAdminProfile(): Promise<Profile | null> {
  const { data } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();

  return data || null;
}

