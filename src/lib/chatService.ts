import { supabase } from './supabase';
import type { ChatThread, ChatMessage, ChatThreadWithDetails } from '../types';

/**
 * Get or create the unique 1-on-1 direct thread for a student with administration.
 * Each student has exactly one thread (student <-> admin).
 */
export async function getOrCreateStudentThread(studentId: string): Promise<ChatThread> {
  if (!studentId) {
    throw new Error('Student ID is required');
  }

  // 1. Try to fetch existing thread
  const { data: existing, error: findError } = await (supabase as any)
    .from('chat_threads')
    .select('*, student:profiles!student_id(*, class:classes(*, board:boards(*)), stream_obj:streams(*))')
    .eq('student_id', studentId)
    .maybeSingle();

  if (findError) {
    console.error('[chatService] Error finding student thread:', findError);
  }

  if (existing) {
    return existing as ChatThread;
  }

  // 2. Insert new thread if not found
  const { data: created, error: insertError } = await (supabase as any)
    .from('chat_threads')
    .insert({
      student_id: studentId,
    })
    .select('*, student:profiles!student_id(*, class:classes(*, board:boards(*)), stream_obj:streams(*))')
    .single();

  if (insertError) {
    // If concurrent insert occurred, retry fetch
    const { data: retry } = await (supabase as any)
      .from('chat_threads')
      .select('*, student:profiles!student_id(*, class:classes(*, board:boards(*)), stream_obj:streams(*))')
      .eq('student_id', studentId)
      .maybeSingle();

    if (retry) return retry as ChatThread;
    throw new Error(`[chatService] Failed to create student thread: ${insertError.message}`);
  }

  return created as ChatThread;
}

/**
 * For Admin: Get all student chat threads with student profile details, latest message, and unread count.
 */
export async function getAdminChatThreads(): Promise<ChatThreadWithDetails[]> {
  const { data: threads, error: threadErr } = await (supabase as any)
    .from('chat_threads')
    .select('*, student:profiles!student_id(*, class:classes(*, board:boards(*)), stream_obj:streams(*))')
    .order('created_at', { ascending: false });

  if (threadErr) {
    console.error('[chatService] Error fetching admin threads:', threadErr);
    return [];
  }

  if (!threads || threads.length === 0) return [];

  // Fetch all messages for these threads to get latest message & unread count
  const threadIds = threads.map((t: ChatThread) => t.id);
  const { data: messagesData, error: msgErr } = await (supabase as any)
    .from('chat_messages')
    .select('*')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: true });

  if (msgErr) {
    console.error('[chatService] Error fetching messages for threads:', msgErr);
  }

  const messagesByThread = new Map<string, ChatMessage[]>();
  if (messagesData) {
    messagesData.forEach((m: ChatMessage) => {
      const list = messagesByThread.get(m.thread_id) || [];
      list.push(m);
      messagesByThread.set(m.thread_id, list);
    });
  }

  const enrichedThreads: ChatThreadWithDetails[] = threads.map((t: any) => {
    const tMessages = messagesByThread.get(t.id) || [];
    const latestMessage = tMessages.length > 0 ? tMessages[tMessages.length - 1] : null;
    // Unread count for admin = student sent messages where read_at is null
    const unreadCount = tMessages.filter(m => m.sender_role === 'student' && !m.read_at).length;

    return {
      id: t.id,
      student_id: t.student_id,
      created_at: t.created_at,
      student: t.student || null,
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
 * Get all messages for a specific thread ordered chronologically.
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
 * Send a message within a thread. Permanent by design (no delete capability).
 */
export async function sendChatMessage(
  threadId: string,
  senderId: string,
  senderRole: 'student' | 'admin',
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
 * Mark messages as read in a thread when opened by a user.
 */
export async function markChatThreadMessagesAsRead(
  threadId: string,
  currentUserRole: 'student' | 'admin'
): Promise<void> {
  const oppositeRole = currentUserRole === 'student' ? 'admin' : 'student';

  const { error } = await (supabase as any)
    .from('chat_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('thread_id', threadId)
    .eq('sender_role', oppositeRole)
    .is('read_at', null);

  if (error) {
    console.error('[chatService] Error marking messages as read:', error);
  }
}

/**
 * Get the total number of unread messages for a given user and role.
 * - If student: counts unread messages sent by admin in their thread.
 * - If admin: counts unread messages sent by students across all threads.
 */
export async function getTotalUnreadChatCount(userId: string, role: 'student' | 'admin'): Promise<number> {
  try {
    if (role === 'student') {
      // Find the student's thread
      const { data: thread } = await (supabase as any)
        .from('chat_threads')
        .select('id')
        .eq('student_id', userId)
        .maybeSingle();

      if (!thread) return 0;

      const { count, error } = await (supabase as any)
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', thread.id)
        .eq('sender_role', 'admin')
        .is('read_at', null);

      if (error) {
        console.error('[chatService] Error counting student unread messages:', error);
        return 0;
      }
      return count || 0;
    } else if (role === 'admin') {
      // Admin: all unread messages sent by any student
      const { count, error } = await (supabase as any)
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_role', 'student')
        .is('read_at', null);

      if (error) {
        console.error('[chatService] Error counting admin unread messages:', error);
        return 0;
      }
      return count || 0;
    }
    return 0;
  } catch (err) {
    console.error('[chatService] Exception in getTotalUnreadChatCount:', err);
    return 0;
  }
}
