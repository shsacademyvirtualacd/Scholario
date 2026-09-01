import { supabase } from './supabase';
import type { Role, Profile, ChatThread, ChatMessage, ChatThreadWithDetails } from '../types';
import { getOfferingsForStudent } from './db';

/**
 * Get or create a 1-on-1 thread between two participants.
 * Reuses existing thread regardless of who was participant_one or participant_two.
 */
export async function getOrCreateChatThread(
  participantA: { id: string; role: Role },
  participantB: { id: string; role: Role }
): Promise<ChatThread> {
  if (participantA.id === participantB.id) {
    throw new Error('Cannot create chat thread with oneself');
  }

  // 1. Check if thread already exists
  const { data: existing, error: findError } = await (supabase as any)
    .from('chat_threads')
    .select('*')
    .or(
      `and(participant_one_id.eq.${participantA.id},participant_two_id.eq.${participantB.id}),` +
      `and(participant_one_id.eq.${participantB.id},participant_two_id.eq.${participantA.id})`
    )
    .maybeSingle();

  if (findError) {
    console.error('[chatService] Error finding thread:', findError);
  }

  if (existing) {
    return existing as ChatThread;
  }

  // 2. Insert new thread if not found
  const { data: created, error: insertError } = await (supabase as any)
    .from('chat_threads')
    .insert({
      participant_one_id: participantA.id,
      participant_one_role: participantA.role,
      participant_two_id: participantB.id,
      participant_two_role: participantB.role,
    })
    .select()
    .single();

  if (insertError) {
    // If unique constraint collided due to race condition, re-fetch
    const { data: retry } = await (supabase as any)
      .from('chat_threads')
      .select('*')
      .or(
        `and(participant_one_id.eq.${participantA.id},participant_two_id.eq.${participantB.id}),` +
        `and(participant_one_id.eq.${participantB.id},participant_two_id.eq.${participantA.id})`
      )
      .maybeSingle();

    if (retry) return retry as ChatThread;
    throw new Error(`[chatService] Failed to create thread: ${insertError.message}`);
  }

  return created as ChatThread;
}

/**
 * Get all threads for the current user with details (other participant profile, latest message, unread count)
 */
export async function getChatThreadsForUser(userId: string): Promise<ChatThreadWithDetails[]> {
  const { data: threads, error } = await (supabase as any)
    .from('chat_threads')
    .select('*')
    .or(`participant_one_id.eq.${userId},participant_two_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[chatService] Error fetching threads:', error);
    return [];
  }

  if (!threads || threads.length === 0) return [];

  // Collect other participant IDs
  const otherIds = new Set<string>();
  threads.forEach((t: ChatThread) => {
    const otherId = t.participant_one_id === userId ? t.participant_two_id : t.participant_one_id;
    otherIds.add(otherId);
  });

  // Fetch profiles of all other participants
  const { data: profilesData } = await (supabase as any)
    .from('profiles')
    .select('*, class:classes(*, board:boards(*)), stream_obj:streams(*)')
    .in('id', Array.from(otherIds));

  const profileMap = new Map<string, Profile>();
  if (profilesData) {
    profilesData.forEach((p: Profile) => {
      profileMap.set(p.id, p);
    });
  }

  // Fetch latest messages & unread counts for all threads
  const threadIds = threads.map((t: ChatThread) => t.id);
  const { data: messagesData } = await (supabase as any)
    .from('chat_messages')
    .select('*')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: true });

  const messagesByThread = new Map<string, ChatMessage[]>();
  if (messagesData) {
    messagesData.forEach((m: ChatMessage) => {
      const list = messagesByThread.get(m.thread_id) || [];
      list.push(m);
      messagesByThread.set(m.thread_id, list);
    });
  }

  const enrichedThreads: ChatThreadWithDetails[] = threads.map((t: ChatThread) => {
    const otherId = t.participant_one_id === userId ? t.participant_two_id : t.participant_one_id;
    const otherRole = t.participant_one_id === userId ? t.participant_two_role : t.participant_one_role;
    
    let otherProfile = profileMap.get(otherId);
    if (!otherProfile) {
      // Fallback profile if not found
      otherProfile = {
        id: otherId,
        full_name: otherRole === 'admin' ? 'Scholario Support (Admin)' : (otherRole === 'teacher' ? 'Teacher' : 'Student'),
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
  senderRole: Role,
  content: string
): Promise<ChatMessage> {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Message content cannot be empty');
  }

  const { data, error } = await (supabase as any)
    .from('chat_messages')
    .insert({
      thread_id: threadId,
      sender_id: senderId,
      sender_role: senderRole,
      content: trimmed,
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
 * For Student: Get all teachers the student has classes with + Admin profile.
 * Prepares / ensures thread objects for each so student sees distinct teacher threads + 1 admin thread.
 */
export async function getStudentChatContacts(studentId: string): Promise<{
  teachers: Profile[];
  admin: Profile;
}> {
  // 1. Fetch student's offerings
  const offerings = await getOfferingsForStudent(studentId);
  const teacherIds = new Set<string>();

  offerings.forEach(off => {
    if (off.teacher_id) {
      teacherIds.add(off.teacher_id);
    }
  });

  // Fetch teacher profiles
  let teachers: Profile[] = [];
  if (teacherIds.size > 0) {
    const { data: teacherProfiles } = await (supabase as any)
      .from('profiles')
      .select('*, class:classes(*, board:boards(*)), stream_obj:streams(*)')
      .in('id', Array.from(teacherIds));
    teachers = teacherProfiles || [];
  }

  // 2. Fetch admin profile (primary admin)
  const { data: adminProfiles } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('role', 'admin')
    .limit(1);

  let admin: Profile = adminProfiles?.[0];
  if (!admin) {
    admin = {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Scholario Administration',
      role: 'admin',
      avatar_url: null,
      phone: null,
      created_at: new Date().toISOString(),
    };
  }

  return { teachers, admin };
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

