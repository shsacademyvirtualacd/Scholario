import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { getTotalUnreadChatCount } from '../lib/chatService';
import { supabase } from '../lib/supabase';

/**
 * Hook to retrieve and subscribe to the user's unread chat messages count.
 * Works for both Student (messages from Admin) and Admin (messages from Students).
 */
export function useUnreadChatCount() {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!profile?.id || (profile.role !== 'student' && profile.role !== 'admin')) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await getTotalUnreadChatCount(profile.id, profile.role as 'student' | 'admin');
      setUnreadCount(count);
    } catch (err) {
      console.error('[useUnreadChatCount] Failed to get unread count:', err);
    }
  }, [profile?.id, profile?.role]);

  useEffect(() => {
    refreshUnreadCount();

    if (!profile?.id || (profile.role !== 'student' && profile.role !== 'admin')) return;

    // Listen for new messages or read_at updates in chat_messages table
    const channelName = `chat-unread-count-${profile.id}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          refreshUnreadCount();
        }
      )
      .subscribe();

    // Also listen for custom event when messages are read locally
    const handleChatRead = () => {
      refreshUnreadCount();
    };
    window.addEventListener('scholario-chat-read', handleChatRead);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('scholario-chat-read', handleChatRead);
    };
  }, [profile?.id, profile?.role, refreshUnreadCount]);

  return { unreadCount, refreshUnreadCount };
}
