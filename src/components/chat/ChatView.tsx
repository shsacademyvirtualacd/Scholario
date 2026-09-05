import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Send,
  MessageSquare,
  Check,
  CheckCheck,
  ArrowLeft,
  UserPlus,
  Sparkles,
  Shield,
  GraduationCap,
  Users,
  Loader2,
  AlertCircle,
  Volume2,
  Mic,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Trash2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import ProfileAvatar from '../common/ProfileAvatar';
import { VoiceMessageBubble } from './VoiceMessageBubble';
import { VoiceRecorderBar } from './VoiceRecorderBar';
import { ChatImageBubble } from './ChatImageBubble';
import { ChatFileBubble } from './ChatFileBubble';
import { ChatBubbleTail } from './ChatBubbleTail';
import { formatAudioDuration } from '../../lib/voiceRecordingService';
import { useChatPresence } from '../../hooks/useChatPresence';
import type { Role, Profile, ChatMessage, ChatThreadWithDetails } from '../../types';
import {
  getChatThreadsForUser,
  getChatMessages,
  sendChatMessage,
  sendVoiceChatMessage,
  uploadChatAttachment,
  sendAttachmentChatMessage,
  markChatThreadMessagesAsRead,
  getOrCreateChatThread,
  getStudentChatContacts,
  deleteChatMessage
} from '../../lib/chatService';

interface ChatViewProps {
  role: Role;
  availableContacts?: Profile[];
  onStartNewChatTitle?: string;
  allowNewChatWithAllStudents?: boolean;
}

// Pure helper to compare message lists and prevent unnecessary state updates during background polling
function areMessagesEqual(prev: ChatMessage[], next: ChatMessage[]): boolean {
  if (prev === next) return true;
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    const a = prev[i];
    const b = next[i];
    if (
      a.id !== b.id ||
      a.read_at !== b.read_at ||
      a.content !== b.content ||
      a.created_at !== b.created_at ||
      a.audio_url !== b.audio_url ||
      a.attachment_key !== b.attachment_key
    ) {
      return false;
    }
  }
  return true;
}

export const ChatView: React.FC<ChatViewProps> = ({
  role,
  availableContacts: initialAvailableContacts = [],
  onStartNewChatTitle = 'Start Direct Conversation',
}) => {
  const { profile } = useAuth();
  const currentUserId = profile?.id;

  const [threads, setThreads] = useState<ChatThreadWithDetails[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFilename, setUploadingFilename] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [contactRoleFilter, setContactRoleFilter] = useState<'all' | 'teacher' | 'student' | 'admin'>('all');
  const [startingChatWithId, setStartingChatWithId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [mobileViewActiveThread, setMobileViewActiveThread] = useState(false);
  const [fetchedContacts, setFetchedContacts] = useState<Profile[]>([]);
  const [loadingModalContacts, setLoadingModalContacts] = useState(false);

  // Message Deletion & Long-Press State (Zero Trace)
  const [actionMenuMessage, setActionMenuMessage] = useState<ChatMessage | null>(null);
  const [actionMenuCoords, setActionMenuCoords] = useState<{ x: number; y: number } | null>(null);
  const [deleteConfirmMessage, setDeleteConfirmMessage] = useState<ChatMessage | null>(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartCoordRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressActiveRef = useRef(false);
  const longPressOpenedAtRef = useRef<number>(0);

  // Reactive state removal for message deletions (Zero Trace - no placeholder)
  const handleMessageDeletedRealtime = (deletedId: string) => {
    if (!deletedId) return;
    setMessages(prev => prev.filter(m => m.id !== deletedId));
    setThreads(prev => {
      return prev.map(t => {
        if (t.latest_message?.id === deletedId) {
          return { ...t, latest_message: undefined };
        }
        return t;
      });
    });
    // Silently re-sync thread preview
    if (currentUserId) {
      getChatThreadsForUser(currentUserId).then(setThreads).catch(() => {});
    }
  };

  const triggerLongPressAction = (msg: ChatMessage, x: number, y: number) => {
    if (msg.sender_id !== currentUserId) return;
    isLongPressActiveRef.current = true;
    longPressOpenedAtRef.current = Date.now();
    if (window.navigator?.vibrate) {
      try {
        window.navigator.vibrate(40);
      } catch {}
    }
    setActionMenuMessage(msg);
    setActionMenuCoords({ x, y });
  };

  const handleTouchStart = (e: React.TouchEvent, msg: ChatMessage) => {
    if (msg.sender_id !== currentUserId) return;
    const touch = e.touches[0];
    touchStartCoordRef.current = { x: touch.clientX, y: touch.clientY };
    isLongPressActiveRef.current = false;

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      triggerLongPressAction(msg, touch.clientX, touch.clientY);
    }, 450);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartCoordRef.current || !longPressTimerRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartCoordRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartCoordRef.current.y);
    if (dx > 12 || dy > 12) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartCoordRef.current = null;

    if (isLongPressActiveRef.current) {
      // The gesture was a long-press that opened the action menu!
      // CRITICAL: Stop propagation and prevent default so browser does NOT emit
      // synthetic pointerup/mouseup/click events that hit the newly mounted backdrop and dismiss it.
      if (e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();

      // Keep isLongPressActiveRef true for a short cooldown window to absorb any delayed synthetic clicks
      setTimeout(() => {
        isLongPressActiveRef.current = false;
      }, 400);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, msg: ChatMessage) => {
    if (msg.sender_id !== currentUserId || e.button !== 0) return;
    const { clientX, clientY } = e;
    isLongPressActiveRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      triggerLongPressAction(msg, clientX, clientY);
    }, 450);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isLongPressActiveRef.current) {
      e.preventDefault();
      e.stopPropagation();
      setTimeout(() => {
        isLongPressActiveRef.current = false;
      }, 400);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, msg: ChatMessage) => {
    if (msg.sender_id !== currentUserId) return;
    e.preventDefault();
    e.stopPropagation();
    triggerLongPressAction(msg, e.clientX, e.clientY);
  };

  const handleDeleteMenuClick = (msg: ChatMessage) => {
    setActionMenuMessage(null);
    setActionMenuCoords(null);
    setDeleteConfirmMessage(msg);
  };

  // Action Menu outside tap / click dismiss listener (attached AFTER current tick to prevent instant dismiss)
  useEffect(() => {
    if (!actionMenuMessage) return;

    const openedAt = longPressOpenedAtRef.current || Date.now();

    const handlePointerDownOutside = (e: PointerEvent | MouseEvent | TouchEvent) => {
      // Must be at least 350ms after the menu was opened so the release of the long press never dismisses it
      if (Date.now() - openedAt < 350) return;

      const target = e.target as HTMLElement | null;
      // If clicking inside the menu popup, don't dismiss
      if (target && target.closest('[data-action-menu-popup]')) {
        return;
      }

      setActionMenuMessage(null);
      setActionMenuCoords(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActionMenuMessage(null);
        setActionMenuCoords(null);
      }
    };

    // Attach listeners on the NEXT event loop tick so the current gesture's release cannot trigger it
    const attachTimer = setTimeout(() => {
      window.addEventListener('pointerdown', handlePointerDownOutside, true);
      window.addEventListener('keydown', handleKeyDown);
    }, 100);

    return () => {
      clearTimeout(attachTimer);
      window.removeEventListener('pointerdown', handlePointerDownOutside, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [actionMenuMessage]);

  const handleConfirmDelete = async () => {
    if (!deleteConfirmMessage || isDeletingMessage) return;
    const targetMsg = deleteConfirmMessage;
    setIsDeletingMessage(true);

    // Optimistically remove from state instantly with zero placeholder
    handleMessageDeletedRealtime(targetMsg.id);

    try {
      await deleteChatMessage(targetMsg.id, activeThreadId || undefined);
      setDeleteConfirmMessage(null);
    } catch (err: any) {
      console.error('Delete chat message failed:', err);
      toast.error('Failed to delete message. Please try again.');
    } finally {
      setIsDeletingMessage(false);
    }
  };

  // Realtime Presence Tracking & Status synchronization
  const handleProfileUpdated = (updatedProfile: Partial<Profile> & { id: string }) => {
    setThreads(prev =>
      prev.map(t => {
        if (t.other_participant?.id === updatedProfile.id) {
          return {
            ...t,
            other_participant: {
              ...t.other_participant,
              ...updatedProfile,
            },
          };
        }
        return t;
      })
    );
    setFetchedContacts(prev =>
      prev.map(c => (c.id === updatedProfile.id ? { ...c, ...updatedProfile } : c))
    );
  };

  const activeContactId = useMemo(() => {
    return threads.find(t => t.id === activeThreadId)?.other_participant?.id;
  }, [threads, activeThreadId]);

  const { isContactOnline, getContactStatus } = useChatPresence({
    currentUserId,
    currentUserProfile: profile,
    activeContactId,
    onProfileUpdated: handleProfileUpdated,
  });

  // Report active chat thread presence to server to avoid double-notifying
  // someone who is already actively viewing this chat thread in foreground
  useEffect(() => {
    if (!currentUserId) return;

    const reportActive = (threadId: string | null) => {
      fetch('/api/chat/presence/active-thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, threadId }),
      }).catch(() => {});
    };

    if (activeThreadId && typeof document !== 'undefined' && document.visibilityState === 'visible') {
      reportActive(activeThreadId);
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          reportActive(activeThreadId);
        }
      }, 10_000);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          reportActive(null);
        } else if (document.visibilityState === 'visible' && activeThreadId) {
          reportActive(activeThreadId);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        reportActive(null);
      };
    } else {
      reportActive(null);
    }
  }, [activeThreadId, currentUserId]);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Scroll state & message tracking refs
  const prevMessagesLengthRef = useRef<number>(0);
  const prevLastMessageIdRef = useRef<string | null>(null);
  const isInitialThreadLoadRef = useRef<boolean>(true);
  const isNearBottomRef = useRef<boolean>(true);

  // Check if messages container is scrolled within ~100px of bottom
  const checkIfNearBottom = (threshold = 100): boolean => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom <= threshold;
  };

  // Keep track of scroll position so we know if user scrolled up to read older messages
  const handleMessagesScroll = () => {
    isNearBottomRef.current = checkIfNearBottom(100);
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const container = messagesContainerRef.current;
    if (container) {
      if (behavior === 'auto') {
        container.scrollTop = container.scrollHeight;
      } else {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
    isNearBottomRef.current = true;
  };

  // Autonomous loading of contacts if not provided by parent
  useEffect(() => {
    if (initialAvailableContacts && initialAvailableContacts.length > 0) {
      setFetchedContacts(initialAvailableContacts);
      return;
    }

    if (!currentUserId) return;
    setLoadingModalContacts(true);

    if (role === 'admin') {
      import('../../lib/chatService').then(({ getAdminChatContacts }) => {
        getAdminChatContacts().then(({ students, teachers }) => {
          setFetchedContacts([...teachers, ...students]);
        }).catch(err => console.warn('[ChatView] Failed to fetch admin contacts:', err))
          .finally(() => setLoadingModalContacts(false));
      });
    } else if (role === 'teacher') {
      import('../../lib/chatService').then(({ getTeacherChatContacts }) => {
        getTeacherChatContacts(currentUserId).then(({ students, admins }) => {
          setFetchedContacts([...admins, ...students]);
        }).catch(err => console.warn('[ChatView] Failed to fetch teacher contacts:', err))
          .finally(() => setLoadingModalContacts(false));
      });
    } else if (role === 'student') {
      getStudentChatContacts(currentUserId).then(({ teachers, admins, admin }) => {
        const adminList = admins && admins.length > 0 ? admins : (admin ? [admin] : []);
        setFetchedContacts([...adminList, ...teachers]);
      }).catch(err => console.warn('[ChatView] Failed to fetch student contacts:', err))
        .finally(() => setLoadingModalContacts(false));
    }
  }, [currentUserId, role, initialAvailableContacts]);

  // Combined contacts list
  const activeContactsList = useMemo(() => {
    if (initialAvailableContacts && initialAvailableContacts.length > 0) {
      return initialAvailableContacts;
    }
    return fetchedContacts;
  }, [initialAvailableContacts, fetchedContacts]);

  // 1. Initial Load of Threads & Pre-seeding for Students
  const loadThreads = async (preserveActiveId?: string) => {
    if (!currentUserId) return;
    try {
      // First, load all threads the user is already part of
      let userThreads = await getChatThreadsForUser(currentUserId);

      if (role === 'student') {
        // For students, ensure starter threads with admins and assigned teachers are initialized cleanly
        try {
          const { teachers, admins, admin } = await getStudentChatContacts(currentUserId);
          const studentRole: Role = 'student';
          let seededAny = false;

          // Check if admin threads exist in userThreads
          const adminList = admins && admins.length > 0 ? admins : (admin ? [admin] : []);
          for (const adm of adminList) {
            if (adm?.id) {
              const hasAdminThread = userThreads.some(
                t => t.participant_one_id === adm.id || t.participant_two_id === adm.id
              );
              if (!hasAdminThread) {
                await getOrCreateChatThread(
                  { id: currentUserId, role: studentRole },
                  { id: adm.id, role: 'admin' }
                ).catch(err => console.warn('[Chat] Ensure admin thread warning:', err));
                seededAny = true;
              }
            }
          }

          // Ensure teacher threads exist ONLY for actually assigned teachers
          for (const teacher of teachers) {
            if (teacher.id) {
              const hasTeacherThread = userThreads.some(
                t => t.participant_one_id === teacher.id || t.participant_two_id === teacher.id
              );
              if (!hasTeacherThread) {
                await getOrCreateChatThread(
                  { id: currentUserId, role: studentRole },
                  { id: teacher.id, role: 'teacher' }
                ).catch(err => console.warn('[Chat] Ensure teacher thread warning:', err));
                seededAny = true;
              }
            }
          }

          if (seededAny) {
            userThreads = await getChatThreadsForUser(currentUserId);
          }

          // Filter out any stale empty threads with unassigned teachers that may have been created prior to assignment enforcement
          const assignedTeacherIdSet = new Set(teachers.map(t => t.id));
          const adminIdSet = new Set(adminList.map(a => a.id));

          userThreads = userThreads.filter(t => {
            const otherRole = t.other_participant?.role || (t.participant_one_role === 'student' ? t.participant_two_role : t.participant_one_role);
            const otherId = t.other_participant?.id || (t.participant_one_id === currentUserId ? t.participant_two_id : t.participant_one_id);

            // Admins are always allowed
            if (otherRole === 'admin' || (otherId && adminIdSet.has(otherId))) return true;
            // Assigned teachers are always allowed
            if (otherId && assignedTeacherIdSet.has(otherId)) return true;
            // If it's a thread with an unassigned teacher, only show if messages have already been exchanged
            if (t.latest_message) return true;
            return false;
          });
        } catch (seedErr) {
          console.warn('[Chat] Auto-seed contacts warning:', seedErr);
        }
      }

      setThreads(userThreads);

      if (preserveActiveId) {
        setActiveThreadId(preserveActiveId);
      } else if (userThreads.length > 0 && !activeThreadId) {
        setActiveThreadId(userThreads[0].id);
      }
    } catch (err) {
      console.error('[Chat] Failed to load threads:', err);
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [currentUserId, role]);

  // 2. Load Messages when Active Thread changes
  const fetchActiveMessages = async (silent = false) => {
    if (!activeThreadId || !currentUserId) {
      setMessages([]);
      return;
    }

    if (!silent) setLoadingMessages(true);
    try {
      const msgs = await getChatMessages(activeThreadId);
      if (silent) {
        setMessages(prev => (areMessagesEqual(prev, msgs) ? prev : msgs));
      } else {
        setMessages(msgs);
      }
      
      // If there are unread messages from other user, mark as read
      const hasUnread = msgs.some(m => m.sender_id !== currentUserId && !m.read_at);
      if (hasUnread) {
        await markChatThreadMessagesAsRead(activeThreadId, currentUserId);
        window.dispatchEvent(new CustomEvent('scholario-chat-read'));
        setThreads(prev =>
          prev.map(t => (t.id === activeThreadId ? { ...t, unread_count: 0 } : t))
        );
      }
    } catch (err) {
      console.error('[Chat] Failed to load messages:', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    setIsVoiceRecording(false);
    // Mark as a new conversation view: scroll to bottom on initial load
    isInitialThreadLoadRef.current = true;
    isNearBottomRef.current = true;
    prevMessagesLengthRef.current = 0;
    prevLastMessageIdRef.current = null;
    fetchActiveMessages(false);
  }, [activeThreadId, currentUserId]);

  // Background polling & Window focus sync (resilient fallback for Realtime)
  useEffect(() => {
    if (!currentUserId) return;

    const interval = setInterval(() => {
      if (activeThreadId) {
        fetchActiveMessages(true);
      }
    }, 5000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadThreads(activeThreadId || undefined);
        if (activeThreadId) {
          fetchActiveMessages(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUserId, activeThreadId]);

  // Scoped scroll-to-bottom: ONLY fires on initial thread load or when a genuinely new message is appended
  // AND the user was already near the bottom (or sent the message themselves)
  useEffect(() => {
    if (messages.length === 0) {
      prevMessagesLengthRef.current = 0;
      prevLastMessageIdRef.current = null;
      return;
    }

    const lastMsg = messages[messages.length - 1];
    const prevCount = prevMessagesLengthRef.current;
    const prevLastId = prevLastMessageIdRef.current;

    // 1. Initial thread load — always start at the newest messages
    if (isInitialThreadLoadRef.current) {
      isInitialThreadLoadRef.current = false;
      prevMessagesLengthRef.current = messages.length;
      prevLastMessageIdRef.current = lastMsg?.id || null;
      isNearBottomRef.current = true;
      scrollToBottom('auto');
      requestAnimationFrame(() => {
        scrollToBottom('auto');
      });
      return;
    }

    // 2. Detect if a genuinely new message was appended at the end of the array
    const isMessageAppended = messages.length > prevCount && Boolean(lastMsg && lastMsg.id !== prevLastId);
    const isSentByMe = Boolean(lastMsg && lastMsg.sender_id === currentUserId);

    if (isMessageAppended) {
      // Check if user is already scrolled near the bottom (within ~100px)
      const nearBottom = isNearBottomRef.current || checkIfNearBottom(100);

      // Auto-scroll ONLY if sent by current user, or if already near bottom
      if (isSentByMe || nearBottom) {
        scrollToBottom(messages.length <= 1 ? 'auto' : 'smooth');
      }
      // If user scrolled up to read older messages and received a new message from someone else,
      // preserve their scroll position and do NOT yank them down
    }

    // Update tracking refs (for deletions, re-renders, updates, scroll position is naturally preserved)
    prevMessagesLengthRef.current = messages.length;
    prevLastMessageIdRef.current = lastMsg?.id || null;
  }, [messages, currentUserId]);

  // 3. Realtime Subscription on chat_messages & chat_threads
  useEffect(() => {
    if (!currentUserId) return;

    const channelName = `chat-room-${currentUserId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;

          // If the message belongs to active thread
          if (newMsg.thread_id === activeThreadId) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            // If sent by other user and currently active, mark as read
            if (newMsg.sender_id !== currentUserId) {
              await markChatThreadMessagesAsRead(activeThreadId, currentUserId);
              window.dispatchEvent(new CustomEvent('scholario-chat-read'));
            }
          }

          // Update thread list preview and unread counts
          setThreads(prev => {
            const threadIndex = prev.findIndex(t => t.id === newMsg.thread_id);
            if (threadIndex !== -1) {
              const updated = [...prev];
              const thread = { ...updated[threadIndex] };
              thread.latest_message = newMsg;
              if (newMsg.thread_id !== activeThreadId && newMsg.sender_id !== currentUserId) {
                thread.unread_count = (thread.unread_count || 0) + 1;
              }
              updated.splice(threadIndex, 1);
              return [thread, ...updated];
            } else {
              // New thread received, reload list
              loadThreads(activeThreadId || undefined);
              return prev;
            }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const updatedMsg = payload.new as ChatMessage;
          if (updatedMsg.thread_id === activeThreadId) {
            setMessages(prev =>
              prev.map(m => (m.id === updatedMsg.id ? updatedMsg : m))
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const deletedId = (payload.old as any)?.id;
          if (deletedId) {
            handleMessageDeletedRealtime(deletedId);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const deletedId = (payload.old as any)?.id;
          if (deletedId) {
            handleMessageDeletedRealtime(deletedId);
          }
        }
      )
      .on(
        'broadcast',
        { event: 'message_deleted' },
        ({ payload }) => {
          if (payload?.messageId) {
            handleMessageDeletedRealtime(payload.messageId);
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.warn('[Chat Realtime] Subscription status:', status, 'error:', err);
        }
      });

    // Also subscribe to the active thread's direct broadcast channel for instant recipient removal
    let threadChannel: any = null;
    if (activeThreadId) {
      threadChannel = supabase
        .channel(`chat-thread-${activeThreadId}`)
        .on('broadcast', { event: 'message_deleted' }, ({ payload }) => {
          if (payload?.messageId) {
            handleMessageDeletedRealtime(payload.messageId);
          }
        })
        .subscribe();
    }

    // Local in-window event listener for immediate reactive zero-trace removal
    const onWindowMessageDeleted = (e: Event) => {
      const customEvent = e as CustomEvent<{ messageId: string }>;
      if (customEvent.detail?.messageId) {
        handleMessageDeletedRealtime(customEvent.detail.messageId);
      }
    };
    window.addEventListener('scholario-message-deleted', onWindowMessageDeleted);

    return () => {
      supabase.removeChannel(channel);
      if (threadChannel) supabase.removeChannel(threadChannel);
      window.removeEventListener('scholario-message-deleted', onWindowMessageDeleted);
    };
  }, [currentUserId, activeThreadId]);

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim() || !activeThreadId || !currentUserId || sending) return;

    const contentToSend = inputContent.trim();
    setSendError(null);
    setInputContent('');
    setSending(true);

    try {
      const createdMsg = await sendChatMessage(
        activeThreadId,
        currentUserId,
        role,
        contentToSend
      );

      // Optimistically append message if not already added by realtime
      setMessages(prev => {
        if (prev.some(m => m.id === createdMsg.id)) return prev;
        return [...prev, createdMsg];
      });

      // Update thread in list
      setThreads(prev => {
        const threadIndex = prev.findIndex(t => t.id === activeThreadId);
        if (threadIndex !== -1) {
          const updated = [...prev];
          const thread = { ...updated[threadIndex], latest_message: createdMsg };
          updated.splice(threadIndex, 1);
          return [thread, ...updated];
        }
        return prev;
      });

      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (err: any) {
      console.error('[Chat] Failed to send message:', err);
      setInputContent(contentToSend); // restore on error
      const msg = err?.message || 'Database permission error. Please run the chat migration script.';
      setSendError(msg);
    } finally {
      setSending(false);
    }
  };

  // Handle Send Voice Message
  const handleSendVoice = async (audioUrl: string, durationSeconds: number) => {
    if (!activeThreadId || !currentUserId || !audioUrl) return;

    setSendError(null);
    try {
      const createdMsg = await sendVoiceChatMessage(
        activeThreadId,
        currentUserId,
        role,
        audioUrl,
        durationSeconds
      );

      // Optimistically append message if not already added by realtime
      setMessages(prev => {
        if (prev.some(m => m.id === createdMsg.id)) return prev;
        return [...prev, createdMsg];
      });

      // Update thread in list
      setThreads(prev => {
        const threadIndex = prev.findIndex(t => t.id === activeThreadId);
        if (threadIndex !== -1) {
          const updated = [...prev];
          const thread = { ...updated[threadIndex], latest_message: createdMsg };
          updated.splice(threadIndex, 1);
          return [thread, ...updated];
        }
        return prev;
      });
    } catch (err: any) {
      console.error('[Chat] Failed to send voice message:', err);
      setSendError(err?.message || 'Failed to send voice message.');
    }
  };

  // Handle file or image attachment upload
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be selected again if needed
    e.target.value = '';

    if (!activeThreadId || !currentUserId) {
      toast.error('Please select a conversation first.');
      return;
    }

    // Validate size client-side: <= 15MB
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 15 MB.`);
      return;
    }

    // Validate mime type in allowlist (image/*, application/pdf, .doc, .docx)
    const mime = (file.type || '').toLowerCase();
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const isImage = mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'heic'].includes(ext);
    const isPdf = mime === 'application/pdf' || ext === 'pdf';
    const isWord =
      mime === 'application/msword' ||
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ['doc', 'docx'].includes(ext);

    if (!isImage && !isPdf && !isWord) {
      toast.error('Unsupported file type. Please choose an image, PDF, or Word document (.doc, .docx).');
      return;
    }

    setIsUploadingAttachment(true);
    setUploadProgress(0);
    setUploadingFilename(file.name);
    setSendError(null);

    try {
      const uploadRes = await uploadChatAttachment(file, activeThreadId, (progress) => {
        setUploadProgress(progress);
      });

      const caption = inputContent.trim() ? inputContent.trim() : undefined;
      const createdMsg = await sendAttachmentChatMessage(
        activeThreadId,
        currentUserId,
        role,
        uploadRes,
        caption
      );

      // Optimistically update message list
      setMessages((prev) => {
        if (prev.some((m) => m.id === createdMsg.id)) return prev;
        return [...prev, createdMsg];
      });

      // Clear input content if it was used as caption
      if (caption) {
        setInputContent('');
      }

      // Scroll to bottom
      setTimeout(() => {
        scrollToBottom('smooth');
      }, 50);

      // Update thread list with latest message
      setThreads((prev) => {
        const threadIndex = prev.findIndex((t) => t.id === activeThreadId);
        if (threadIndex !== -1) {
          const updated = [...prev];
          const thread = { ...updated[threadIndex], latest_message: createdMsg };
          updated.splice(threadIndex, 1);
          return [thread, ...updated];
        }
        return prev;
      });

      toast.success(`${isImage ? 'Image' : 'File'} sent successfully`);
    } catch (err: any) {
      console.error('[Chat] Failed to upload and send attachment:', err);
      const msg = err?.message || 'Failed to upload attachment.';
      setSendError(msg);
      toast.error(msg);
    } finally {
      setIsUploadingAttachment(false);
      setUploadProgress(0);
      setUploadingFilename('');
    }
  };

  // Start new chat with a contact from modal
  const handleSelectContactToChat = async (contact: Profile) => {
    if (!currentUserId) {
      setModalError('Your user session is not ready. Please refresh or sign in again.');
      return;
    }

    setModalError(null);
    setStartingChatWithId(contact.id);

    try {
      const contactRole: Role = (contact.role === 'admin' || contact.role === 'teacher' || contact.role === 'student')
        ? contact.role
        : 'student';

      const thread = await getOrCreateChatThread(
        { id: currentUserId, role },
        { id: contact.id, role: contactRole }
      );

      // Optimistically add to thread list if not present
      setThreads(prev => {
        if (prev.some(t => t.id === thread.id)) return prev;
        const optimisticThread: ChatThreadWithDetails = {
          ...thread,
          other_participant: contact,
          latest_message: null,
          unread_count: 0,
        };
        return [optimisticThread, ...prev];
      });

      // Synchronize full list and set active
      await loadThreads(thread.id);
      setActiveThreadId(thread.id);
      setMobileViewActiveThread(true);
      setShowNewChatModal(false);
    } catch (err: any) {
      console.error('[Chat] Error starting chat with student:', err);
      const message = err?.message || 'Database error occurred while starting conversation.';
      setModalError(message);
    } finally {
      setStartingChatWithId(null);
      setLoadingMessages(false);
    }
  };

  // Filter threads by search query
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const q = searchQuery.toLowerCase();
    return threads.filter(t => {
      const name = t.other_participant?.full_name?.toLowerCase() || '';
      const lastMsg = t.latest_message?.content?.toLowerCase() || '';
      const otherRole = t.other_participant?.role?.toLowerCase() || '';
      return name.includes(q) || lastMsg.includes(q) || otherRole.includes(q);
    });
  }, [threads, searchQuery]);

  // Filter new chat contacts modal
  const filteredModalContacts = useMemo(() => {
    let list = activeContactsList.filter(c => c.id !== currentUserId);

    if (contactRoleFilter !== 'all') {
      if (contactRoleFilter === 'admin') {
        list = list.filter(c => c.role === 'admin');
      } else if (contactRoleFilter === 'teacher') {
        list = list.filter(c => c.role === 'teacher');
      } else if (contactRoleFilter === 'student') {
        list = list.filter(c => c.role === 'student');
      }
    }

    if (!newChatSearch.trim()) return list;
    const q = newChatSearch.toLowerCase();
    return list.filter(c => {
      const name = c.full_name?.toLowerCase() || '';
      const stream = (c.stream || c.stream_obj?.name || '')?.toLowerCase();
      const grade = (c.class?.display_name || c.class?.grade || '')?.toLowerCase();
      const roleStr = c.role?.toLowerCase() || '';
      return name.includes(q) || stream.includes(q) || grade.includes(q) || roleStr.includes(q);
    });
  }, [activeContactsList, currentUserId, contactRoleFilter, newChatSearch]);

  const contactCounts = useMemo(() => {
    const list = activeContactsList.filter(c => c.id !== currentUserId);
    return {
      all: list.length,
      teacher: list.filter(c => c.role === 'teacher').length,
      student: list.filter(c => c.role === 'student').length,
      admin: list.filter(c => c.role === 'admin').length,
    };
  }, [activeContactsList, currentUserId]);

  const activeThread = useMemo(() => {
    return threads.find(t => t.id === activeThreadId);
  }, [threads, activeThreadId]);

  const formatMessageTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatThreadDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getRoleBadge = (
    otherRole: Role | string,
    isSupportAdmin?: boolean,
    extraInfo?: { subjects?: string[]; tag?: string; stream?: string },
    subtle?: boolean
  ) => {
    if (isSupportAdmin || otherRole === 'admin') {
      const tagText = extraInfo?.tag || 'Support';
      // Format cleanly for badge
      const shortTag = tagText.replace('Scholario ', '').replace('Institutional ', '');
      if (subtle) {
        return (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-[#111111] text-[#F4C430] shrink-0 leading-none">
            <Shield size={9} /> {shortTag.includes('Admin') ? shortTag : `Admin • ${shortTag}`}
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#111111] text-[#F4C430] border border-[#F4C430]/30 shadow-2xs">
          <Shield size={10} /> {shortTag.includes('Admin') ? shortTag : `Admin • ${shortTag}`}
        </span>
      );
    }
    if (otherRole === 'teacher') {
      const subjectText = (extraInfo?.subjects && extraInfo.subjects.length > 0)
        ? extraInfo.subjects[0]
        : (extraInfo?.stream || 'Faculty');
      if (subtle) {
        return (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-[#FDF3C8] text-[#854D0E] shrink-0 leading-none">
            <GraduationCap size={9} /> {subjectText}
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDF3C8] text-[#92700A] border border-[#F4C430]/30">
          <GraduationCap size={10} /> Teacher • {subjectText}
        </span>
      );
    }
    if (subtle) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-[#F5F5F5] text-[#525252] shrink-0 leading-none">
          Student
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5]">
        <Users size={10} /> Student
      </span>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-h-[850px] min-h-[550px] bg-white rounded-3xl border border-[#E5E5E5] shadow-xs overflow-hidden">
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        
        {/* ── Left Column: Threads / Conversation List ── */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-[#E5E5E5] bg-[#FCFCFC] shrink-0 transition-all duration-200 ${
            mobileViewActiveThread ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header & Search */}
          <div className="p-4 border-b border-[#E5E5E5] space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F4C430]/20 text-[#111111] flex items-center justify-center font-bold">
                  <MessageSquare size={17} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#111111] tracking-tight leading-tight">
                    Scholario Chat
                  </h2>
                  <p className="text-[11px] text-[#737373] font-medium">
                    Private academic conversations
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setShowNewChatModal(true);
                    setNewChatSearch('');
                    setContactRoleFilter('all');
                    setModalError(null);
                  }}
                  className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#111111] text-white hover:bg-[#262626] transition-colors shadow-2xs interactive flex items-center gap-1.5"
                  title={onStartNewChatTitle}
                >
                  <UserPlus size={16} />
                  <span className="hidden sm:inline text-xs font-bold">New Chat</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F5F5F5] border border-transparent focus:border-[#111111] focus:bg-white transition-all outline-hidden text-[#111111] placeholder:text-[#A3A3A3]"
              />
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F0F0F0]">
            {loadingThreads ? (
              <div className="p-8 flex flex-col items-center justify-center gap-3 text-center">
                <Loader2 size={24} className="animate-spin text-[#F4C430]" />
                <span className="text-xs text-[#737373] font-medium">Loading conversations...</span>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center gap-2 text-center text-[#737373]">
                <MessageSquare size={32} className="text-[#D4D4D4] stroke-[1.5]" />
                <p className="text-xs font-semibold text-[#111111]">No conversations yet</p>
                <p className="text-[11px] text-[#A3A3A3] max-w-[200px]">
                  {role === 'student'
                    ? 'Start a direct chat with your teachers or administration.'
                    : role === 'teacher'
                    ? 'Start a direct chat with students or administration.'
                    : 'Start a direct chat with any student or teacher.'}
                </p>
                <button
                  onClick={() => {
                    setShowNewChatModal(true);
                    setNewChatSearch('');
                    setContactRoleFilter('all');
                    setModalError(null);
                  }}
                  className="mt-2 text-xs font-bold text-[#111111] bg-[#F4C430] hover:bg-[#e6b82a] px-3.5 py-1.5 rounded-xl transition-all shadow-2xs"
                >
                  Start a conversation
                </button>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = thread.id === activeThreadId;
                const other = thread.other_participant;
                const isAdmin = other?.role === 'admin';
                const hasUnread = (thread.unread_count || 0) > 0;

                return (
                  <button
                    key={thread.id}
                    onClick={() => {
                      setActiveThreadId(thread.id);
                      setMobileViewActiveThread(true);
                    }}
                    className={`w-full text-left px-3.5 py-3 flex items-center gap-3 transition-colors border-b border-[#F0F2F5] ${
                      isSelected
                        ? 'bg-[#F0F2F5] border-l-4 border-l-[#111111]'
                        : 'hover:bg-[#F5F6F6] bg-transparent'
                    }`}
                  >
                    {/* WhatsApp Avatar with online dot */}
                    <div className="relative shrink-0">
                      <ProfileAvatar
                        avatarUrl={other?.avatar_url}
                        name={other?.full_name || 'User'}
                        role={other?.role || 'student'}
                        size="md"
                        showOnlineBadge={isContactOnline(other?.id, other)}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Row 1: Name + subtle role tag on left, timestamp on right */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`text-[13.5px] sm:text-sm truncate ${
                              isSelected || hasUnread
                                ? 'font-bold text-[#111111]'
                                : 'font-medium text-[#111111]'
                            }`}
                          >
                            {other?.full_name || (isAdmin ? 'Scholario Support' : 'User')}
                          </span>
                          {getRoleBadge(
                            other?.role || 'student',
                            isAdmin,
                            {
                              subjects: (other as any)?.teacher_subjects,
                              tag: (other as any)?.admin_tag,
                              stream: other?.stream_obj?.name || other?.stream || undefined,
                            },
                            true
                          )}
                        </div>
                        <span
                          className={`text-[11px] shrink-0 font-normal ${
                            hasUnread ? 'text-[#25D366] font-semibold' : 'text-[#8696A0]'
                          }`}
                        >
                          {formatThreadDate(thread.latest_message?.created_at || thread.created_at)}
                        </span>
                      </div>

                      {/* Row 2: Message preview with checkmark on left, WhatsApp green unread badge on right */}
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className={`text-[12px] truncate leading-tight flex items-center ${
                            hasUnread ? 'font-medium text-[#111111]' : 'text-[#667781]'
                          }`}
                        >
                          {thread.latest_message ? (
                            <>
                              {thread.latest_message.sender_id === currentUserId && (
                                <span className="inline-flex items-center mr-1 shrink-0">
                                  {thread.latest_message.read_at ? (
                                    <CheckCheck size={14} className="text-[#53BDEB] stroke-[2.2]" />
                                  ) : (
                                    <Check size={14} className="text-[#8696A0] stroke-[2]" />
                                  )}
                                </span>
                              )}
                              {thread.latest_message.message_type === 'voice' || thread.latest_message.audio_url ? (
                                <span className="inline-flex items-center gap-1 text-[#D97706] font-medium truncate">
                                  <Volume2 size={12} className="shrink-0" />
                                  <span>Voice message ({formatAudioDuration(thread.latest_message.audio_duration_seconds || 0)})</span>
                                </span>
                              ) : thread.latest_message.message_type === 'image' ? (
                                <span className="inline-flex items-center gap-1 text-[#2563EB] font-medium truncate">
                                  <ImageIcon size={12} className="shrink-0" />
                                  <span>Photo {thread.latest_message.content && thread.latest_message.content !== 'Photo' ? `• ${thread.latest_message.content}` : ''}</span>
                                </span>
                              ) : thread.latest_message.message_type === 'file' ? (
                                <span className="inline-flex items-center gap-1 text-[#7C3AED] font-medium truncate">
                                  <FileText size={12} className="shrink-0" />
                                  <span>Document • {thread.latest_message.attachment_name || thread.latest_message.content || 'Attachment'}</span>
                                </span>
                              ) : (
                                <span className="truncate">{thread.latest_message.content}</span>
                              )}
                            </>
                          ) : (
                            <span className="italic text-[#8696A0]">No messages yet — send a greeting</span>
                          )}
                        </div>
                        {hasUnread && (
                          <span className="min-w-[19px] h-[19px] px-1.5 flex items-center justify-center rounded-full bg-[#25D366] text-white text-[10px] font-bold shrink-0 shadow-2xs leading-none">
                            {thread.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right Column: Active Conversation Messages & Composer ── */}
        <div
          className={`flex-1 flex flex-col bg-white overflow-hidden ${
            !mobileViewActiveThread ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeThread ? (
            <>
              {/* Active Conversation Top Bar */}
              <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b border-[#E5E5E5] flex items-center justify-between bg-white z-10 shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileViewActiveThread(false)}
                    className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-[#F5F5F5] text-[#111111] shrink-0 transition-colors"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <ProfileAvatar
                    avatarUrl={activeThread.other_participant?.avatar_url}
                    name={activeThread.other_participant?.full_name || 'User'}
                    role={activeThread.other_participant?.role || 'student'}
                    size="md"
                    showOnlineBadge={isContactOnline(activeThread.other_participant?.id, activeThread.other_participant)}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-semibold text-[#111111] truncate leading-tight">
                        {activeThread.other_participant?.full_name || 'Direct Conversation'}
                      </h3>
                      {getRoleBadge(
                        activeThread.other_participant?.role || 'student',
                        activeThread.other_participant?.role === 'admin',
                        {
                          subjects: (activeThread.other_participant as any)?.teacher_subjects,
                          tag: (activeThread.other_participant as any)?.admin_tag,
                          stream: activeThread.other_participant?.stream_obj?.name || activeThread.other_participant?.stream || undefined,
                        },
                        true
                      )}
                    </div>
                    {(() => {
                      const status = getContactStatus(activeThread.other_participant);
                      if (status.isVisible) {
                        if (status.isOnline) {
                          return (
                            <p className="text-xs text-emerald-600 font-medium leading-tight mt-0.5 animate-in fade-in duration-200">
                              online
                            </p>
                          );
                        } else if (status.statusText) {
                          return (
                            <p className="text-xs text-[#667781] leading-tight mt-0.5 truncate">
                              {status.statusText}
                            </p>
                          );
                        }
                      }

                      return (
                        <p className="text-xs text-[#667781] truncate leading-tight mt-0.5">
                          {activeThread.other_participant?.role === 'teacher'
                            ? ((activeThread.other_participant as any)?.teacher_display_title || 'Faculty Teacher • Academic Channel')
                            : activeThread.other_participant?.role === 'admin'
                            ? ((activeThread.other_participant as any)?.admin_tag || 'Institutional Support')
                            : (activeThread.other_participant?.class?.display_name || 'Student')}
                        </p>
                      );
                    })()}
                  </div>
                </div>

                {/* Security encryption indicator */}
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5F5F5] border border-[#E5E5E5] text-[11px] text-[#525252] shrink-0 select-none">
                  <Shield size={12} className="text-[#F4C430]" />
                  <span className="font-medium">Encrypted</span>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto bg-[#F0F2F5]"
              >
                {/* Security & Permanent Notice */}
                <div className="flex justify-center my-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFEECD] border border-[#F4C430]/30 text-[11px] text-[#54656F] shadow-2xs max-w-md text-center">
                    <Shield size={12} className="text-[#92700A] shrink-0" />
                    <span>Messages are end-to-end encrypted. No one outside of this chat can read them.</span>
                  </div>
                </div>

                {loadingMessages ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 size={24} className="animate-spin text-[#F4C430]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-[#737373] space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#F4C430]/20 flex items-center justify-center text-[#111111]">
                      <Sparkles size={20} />
                    </div>
                    <p className="text-sm font-bold text-[#111111]">Start of conversation</p>
                    <p className="text-xs text-[#A3A3A3] max-w-sm">
                      Send a message to {activeThread.other_participant?.full_name || 'start chatting'}. Messages are delivered in real time.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.sender_id === currentUserId;
                    const isRead = !!msg.read_at;

                    const prevMsg = messages[index - 1];
                    const nextMsg = messages[index + 1];

                    // Show date divider if day changed
                    const showDateDivider =
                      !prevMsg ||
                      new Date(msg.created_at).toDateString() !==
                        new Date(prevMsg.created_at).toDateString();

                    // WhatsApp consecutive message grouping logic (within 5 minutes, same sender, same day)
                    const isPrevConsecutive =
                      !showDateDivider &&
                      !!prevMsg &&
                      prevMsg.sender_id === msg.sender_id &&
                      Math.abs(new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) < 5 * 60 * 1000;

                    const isNextSameDay =
                      !!nextMsg &&
                      new Date(nextMsg.created_at).toDateString() === new Date(msg.created_at).toDateString();

                    const isNextConsecutive =
                      isNextSameDay &&
                      !!nextMsg &&
                      nextMsg.sender_id === msg.sender_id &&
                      Math.abs(new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime()) < 5 * 60 * 1000;

                    // Last in group gets the bubble tail pointing to sender!
                    const isLastInGroup = !isNextConsecutive;
                    const isFirstInGroup = !isPrevConsecutive;
                    const hasTail = isLastInGroup;

                    // Dynamic spacing: reduced spacing for consecutive messages
                    const topMarginClass = showDateDivider ? 'mt-3' : isFirstInGroup ? 'mt-2.5' : 'mt-0.5';

                    return (
                      <React.Fragment key={msg.id}>
                        {showDateDivider && (
                          <div className="flex items-center justify-center my-3">
                            <span className="text-[11px] font-medium text-[#54656F] bg-white/95 px-3 py-1 rounded-lg shadow-2xs border border-[#E5E5E5]/70">
                              {new Date(msg.created_at).toLocaleDateString([], {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        )}

                        <div
                          className={`group relative flex items-end gap-1.5 sm:gap-2 ${topMarginClass} ${
                            isMe ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {/* Received sender avatar: only shown on the last bubble of a consecutive group */}
                          {!isMe && (
                            <div className="w-7 sm:w-8 shrink-0 flex justify-center mb-0.5">
                              {isLastInGroup ? (
                                <ProfileAvatar
                                  avatarUrl={activeThread.other_participant?.avatar_url}
                                  name={activeThread.other_participant?.full_name || 'User'}
                                  role={activeThread.other_participant?.role || 'student'}
                                  size="sm"
                                  className="shrink-0"
                                />
                              ) : (
                                <div className="w-7 sm:w-8" aria-hidden="true" />
                              )}
                            </div>
                          )}

                          {/* Desktop quick-delete hover trigger for sender's messages */}
                          {isMe && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center self-center shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMenuClick(msg);
                                }}
                                className="p-1.5 text-[#A3A3A3] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete message"
                                aria-label="Delete message"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}

                          <div
                            className={`relative max-w-[85%] sm:max-w-[75%] md:max-w-[70%] min-w-0 flex flex-col ${
                              isMe
                                ? 'items-end cursor-pointer select-none active:scale-[0.99] transition-transform'
                                : 'items-start'
                            }`}
                            style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
                            onTouchStart={(e) => handleTouchStart(e, msg)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onTouchCancel={handleTouchEnd}
                            onMouseDown={(e) => handleMouseDown(e, msg)}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onContextMenu={(e) => handleContextMenu(e, msg)}
                            onClickCapture={(e) => {
                              if (
                                isLongPressActiveRef.current ||
                                (longPressOpenedAtRef.current > 0 && Date.now() - longPressOpenedAtRef.current < 450)
                              ) {
                                e.preventDefault();
                                e.stopPropagation();
                              }
                            }}
                          >
                            {msg.message_type === 'voice' || msg.audio_url ? (
                              <VoiceMessageBubble
                                messageId={msg.id}
                                audioUrl={msg.audio_url || ''}
                                durationSeconds={msg.audio_duration_seconds}
                                createdAt={msg.created_at}
                                readAt={msg.read_at}
                                isMe={isMe}
                                hasTail={hasTail}
                              />
                            ) : msg.message_type === 'image' && msg.attachment_key ? (
                              <ChatImageBubble
                                messageId={msg.id}
                                attachmentKey={msg.attachment_key}
                                attachmentName={msg.attachment_name}
                                attachmentSize={msg.attachment_size}
                                content={msg.content}
                                createdAt={msg.created_at}
                                readAt={msg.read_at}
                                isMe={isMe}
                                hasTail={hasTail}
                              />
                            ) : msg.message_type === 'file' && msg.attachment_key ? (
                              <ChatFileBubble
                                messageId={msg.id}
                                attachmentKey={msg.attachment_key}
                                attachmentName={msg.attachment_name}
                                attachmentSize={msg.attachment_size}
                                mimeType={msg.mime_type}
                                content={msg.content}
                                createdAt={msg.created_at}
                                readAt={msg.read_at}
                                isMe={isMe}
                                hasTail={hasTail}
                              />
                            ) : (
                              /* WhatsApp Text Bubble */
                              <div
                                className={`relative w-fit max-w-full rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-2xs overflow-visible transition-all ${
                                  isMe
                                    ? `bg-[#111111] text-white ${hasTail ? 'rounded-br-[2px]' : ''}`
                                    : `bg-white text-[#111111] border border-[#E5E5E5] ${hasTail ? 'rounded-bl-[2px]' : ''}`
                                }`}
                              >
                                <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
                                  <p
                                    className={`text-xs md:text-sm whitespace-pre-wrap leading-relaxed break-words [word-break:normal] ${
                                      isMe ? 'select-none md:select-text' : 'select-text'
                                    }`}
                                  >
                                    {msg.content}
                                  </p>

                                  <div
                                    className={`ml-auto shrink-0 flex items-center gap-1 text-[10px] leading-none mb-0.5 select-none ${
                                      isMe ? 'text-white/70' : 'text-[#8E8E93]'
                                    }`}
                                  >
                                    <span className="whitespace-nowrap">{formatMessageTime(msg.created_at)}</span>
                                    {isMe && (
                                      <span title={isRead ? 'Read' : 'Delivered'}>
                                        {isRead ? (
                                          <CheckCheck size={14} className="text-[#53BDEB] stroke-[2.2]" />
                                        ) : (
                                          <Check size={14} className="text-white/70 stroke-[2]" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Tail */}
                                {hasTail && <ChatBubbleTail isMe={isMe} />}
                              </div>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar */}
              <div className="p-3 md:p-4 bg-white border-t border-[#E5E5E5] space-y-2">
                {sendError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in duration-200">
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-rose-900">Failed to send: </span>
                      <span className="text-rose-700">{sendError}</span>
                    </div>
                    <button
                      onClick={() => setSendError(null)}
                      className="text-rose-500 hover:text-rose-800 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 w-full">
                  {isVoiceRecording ? (
                    <VoiceRecorderBar
                      threadId={activeThread.id}
                      onSendVoice={handleSendVoice}
                      onCancelRecording={() => setIsVoiceRecording(false)}
                      onFinishRecording={() => setIsVoiceRecording(false)}
                      disabled={sending || isUploadingAttachment}
                    />
                  ) : (
                    <form
                      onSubmit={handleSendMessage}
                      className="flex-1 flex items-end gap-2 bg-[#F7F7F7] p-2 rounded-2xl border border-[#E5E5E5] focus-within:border-[#111111] focus-within:bg-white transition-all shadow-2xs w-full"
                    >
                      {/* Hidden Native File Picker Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="chat-attachment-input"
                        accept="image/*,application/pdf,.doc,.docx"
                        onChange={handleFileSelected}
                        className="hidden"
                        disabled={sending || isUploadingAttachment}
                      />

                      {/* If uploading attachment: show progress bar inside input */}
                      {isUploadingAttachment ? (
                        <div className="flex-1 flex items-center gap-2 px-2 py-1.5 min-h-[38px]">
                          <div className="w-7 h-7 rounded-xl bg-[#F4C430]/20 flex items-center justify-center text-[#B8860B] shrink-0">
                            <Loader2 size={15} className="animate-spin" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between text-[11px] font-medium mb-1">
                              <span className="truncate text-[#111111] font-semibold">{uploadingFilename}</span>
                              <span className="text-[#737373] font-mono text-[10px] ml-2 shrink-0">{uploadProgress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#E5E5E5] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#F4C430] transition-all duration-150 rounded-full"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <textarea
                          ref={textareaRef}
                          rows={1}
                          value={inputContent}
                          onChange={(e) => setInputContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder={`Message ${activeThread.other_participant?.full_name || ''}...`}
                          className="flex-1 max-h-32 min-h-[38px] p-2 bg-transparent text-xs md:text-sm text-[#111111] placeholder:text-[#A3A3A3] resize-none outline-hidden"
                        />
                      )}

                      {/* Attachment Button (to the left of the mic / send button) */}
                      <button
                        type="button"
                        id="btn-chat-attach"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending || isUploadingAttachment}
                        className="w-9 h-9 rounded-xl text-[#737373] hover:text-[#111111] hover:bg-[#EAEAEA] flex items-center justify-center shrink-0 transition-all interactive touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Attach image or document (≤ 15MB)"
                      >
                        <Paperclip size={18} />
                      </button>

                      {inputContent.trim() ? (
                        <button
                          type="submit"
                          disabled={sending || isUploadingAttachment}
                          className="w-9 h-9 rounded-xl bg-[#F4C430] hover:bg-[#e6b82a] text-[#111111] font-bold flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs interactive touch-manipulation"
                          title="Send message"
                        >
                          {sending ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Send size={16} />
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsVoiceRecording(true)}
                          disabled={sending || isUploadingAttachment}
                          className="w-9 h-9 rounded-xl bg-[#111111] hover:bg-[#262626] text-[#F4C430] hover:text-white font-bold flex items-center justify-center shrink-0 transition-all shadow-2xs interactive touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Record a voice message"
                        >
                          <Mic size={17} />
                        </button>
                      )}
                    </form>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#737373]">
              <div className="w-14 h-14 rounded-3xl bg-[#F5F5F5] flex items-center justify-center text-[#A3A3A3] mb-3">
                <MessageSquare size={28} />
              </div>
              <h3 className="text-base font-bold text-[#111111]">Select a conversation</h3>
              <p className="text-xs text-[#A3A3A3] max-w-sm mt-1">
                Choose a thread from the list on the left to view messages and reply in real time.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── New Chat Modal (Multi-role contact picker) ── */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[#E5E5E5] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F4C430]/20 text-[#111111] flex items-center justify-center font-bold">
                  <UserPlus size={17} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111111]">{onStartNewChatTitle}</h3>
                  <p className="text-xs text-[#737373]">
                    {role === 'student'
                      ? 'Choose a teacher or admin to open a 1-on-1 direct thread'
                      : role === 'teacher'
                      ? 'Choose a student or administrator to start a 1-on-1 thread'
                      : 'Choose a teacher or student to open a 1-on-1 thread'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setModalError(null);
                }}
                className="text-[#737373] hover:text-[#111111] text-sm font-bold p-1.5 rounded-lg hover:bg-[#F5F5F5] transition-colors"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-rose-900">Unable to start conversation</p>
                  <p className="text-[11px] text-rose-700 mt-0.5 break-words">{modalError}</p>
                </div>
              </div>
            )}

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#F5F5F5] rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setContactRoleFilter('all')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                  contactRoleFilter === 'all'
                    ? 'bg-white text-[#111111] shadow-2xs'
                    : 'text-[#737373] hover:text-[#111111]'
                }`}
              >
                All ({contactCounts.all})
              </button>

              {role === 'admin' && (
                <>
                  <button
                    type="button"
                    onClick={() => setContactRoleFilter('teacher')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                      contactRoleFilter === 'teacher'
                        ? 'bg-white text-[#111111] shadow-2xs'
                        : 'text-[#737373] hover:text-[#111111]'
                    }`}
                  >
                    Teachers ({contactCounts.teacher})
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactRoleFilter('student')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                      contactRoleFilter === 'student'
                        ? 'bg-white text-[#111111] shadow-2xs'
                        : 'text-[#737373] hover:text-[#111111]'
                    }`}
                  >
                    Students ({contactCounts.student})
                  </button>
                </>
              )}

              {role === 'teacher' && (
                <>
                  <button
                    type="button"
                    onClick={() => setContactRoleFilter('student')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                      contactRoleFilter === 'student'
                        ? 'bg-white text-[#111111] shadow-2xs'
                        : 'text-[#737373] hover:text-[#111111]'
                    }`}
                  >
                    Students ({contactCounts.student})
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactRoleFilter('admin')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                      contactRoleFilter === 'admin'
                        ? 'bg-white text-[#111111] shadow-2xs'
                        : 'text-[#737373] hover:text-[#111111]'
                    }`}
                  >
                    Admin ({contactCounts.admin})
                  </button>
                </>
              )}

              {role === 'student' && (
                <>
                  <button
                    type="button"
                    onClick={() => setContactRoleFilter('teacher')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                      contactRoleFilter === 'teacher'
                        ? 'bg-white text-[#111111] shadow-2xs'
                        : 'text-[#737373] hover:text-[#111111]'
                    }`}
                  >
                    Teachers ({contactCounts.teacher})
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactRoleFilter('admin')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                      contactRoleFilter === 'admin'
                        ? 'bg-white text-[#111111] shadow-2xs'
                        : 'text-[#737373] hover:text-[#111111]'
                    }`}
                  >
                    Admin ({contactCounts.admin})
                  </button>
                </>
              )}
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
              <input
                type="text"
                value={newChatSearch}
                onChange={(e) => setNewChatSearch(e.target.value)}
                placeholder="Search by name, subject, or grade..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F5F5F5] border border-transparent focus:border-[#111111] focus:bg-white transition-all outline-hidden text-[#111111]"
              />
            </div>

            {/* Contacts List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-[#F0F0F0] -mx-2 px-2">
              {loadingModalContacts ? (
                <div className="p-6 flex flex-col items-center justify-center gap-2 text-center text-xs text-[#737373]">
                  <Loader2 size={20} className="animate-spin text-[#F4C430]" />
                  <span>Loading contacts...</span>
                </div>
              ) : filteredModalContacts.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#737373]">
                  {role === 'student' && contactRoleFilter === 'teacher' ? (
                    <div className="space-y-1.5 max-w-xs mx-auto">
                      <p className="font-semibold text-[#111111]">No teacher assigned yet</p>
                      <p className="text-[11px] leading-relaxed">
                        An instructor has not yet been assigned to your enrolled courses. You can reach out to Administration Support anytime for assistance.
                      </p>
                    </div>
                  ) : (
                    'No matching contacts found.'
                  )}
                </div>
              ) : (
                filteredModalContacts.map((contact) => {
                  const isStarting = startingChatWithId === contact.id;
                  const isAnyStarting = Boolean(startingChatWithId);

                  const contactSubtitle =
                    contact.role === 'admin'
                      ? ((contact as any).admin_tag || 'Administration Support')
                      : contact.role === 'teacher'
                      ? ((contact as any).teacher_display_title || ((contact as any).teacher_subjects?.length ? `${(contact as any).teacher_subjects.join(', ')} Instructor` : 'Course Instructor'))
                      : (contact.class?.display_name || contact.stream || 'Student');

                  return (
                    <button
                      key={contact.id}
                      disabled={isAnyStarting}
                      onClick={() => handleSelectContactToChat(contact)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-[#F5F5F5] flex items-center justify-between gap-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ProfileAvatar
                          avatarUrl={contact.avatar_url}
                          name={contact.full_name}
                          role={contact.role}
                          size="sm"
                          showOnlineBadge={isContactOnline(contact.id, contact)}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold text-[#111111] truncate">{contact.full_name}</p>
                            {getRoleBadge(contact.role, contact.role === 'admin', {
                              subjects: (contact as any).teacher_subjects,
                              tag: (contact as any).admin_tag,
                              stream: contact.stream_obj?.name || contact.stream || undefined,
                            })}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isContactOnline(contact.id, contact) && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Online
                              </span>
                            )}
                            <p className="text-[10px] text-[#737373] truncate font-medium">
                              {contactSubtitle}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#111111] bg-[#F4C430] hover:bg-[#e6b82a] px-3 py-1 rounded-lg shrink-0 flex items-center gap-1.5 shadow-2xs">
                        {isStarting ? (
                          <>
                            <Loader2 size={12} className="animate-spin text-[#111111]" />
                            <span>Opening...</span>
                          </>
                        ) : (
                          'Chat'
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-[#E5E5E5] flex justify-end">
              <button
                disabled={Boolean(startingChatWithId)}
                onClick={() => {
                  setShowNewChatModal(false);
                  setModalError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contextual Long-Press / Right-Click Action Menu */}
      {actionMenuMessage && (
        <div
          className="fixed inset-0 z-50 select-none bg-black/15 backdrop-blur-2xs transition-opacity animate-in fade-in duration-150"
          onClick={(e) => {
            // Guard: Ignore if clicked within 350ms of opening (gesture release)
            if (Date.now() - (longPressOpenedAtRef.current || 0) < 350) {
              e.stopPropagation();
              return;
            }
            if (e.target === e.currentTarget) {
              setActionMenuMessage(null);
              setActionMenuCoords(null);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div
            data-action-menu-popup="true"
            className="fixed bg-white rounded-2xl shadow-xl border border-[#E5E5E5] p-1.5 z-50 min-w-[170px] animate-in fade-in zoom-in-95 duration-150 space-y-1"
            style={{
              top: Math.min(
                Math.max(16, (actionMenuCoords?.y || 200) - 60),
                typeof window !== 'undefined' ? window.innerHeight - 130 : 300
              ),
              left: Math.min(
                Math.max(16, (actionMenuCoords?.x || 200) - 85),
                typeof window !== 'undefined' ? window.innerWidth - 190 : 200
              ),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteMenuClick(actionMenuMessage);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left cursor-pointer"
            >
              <Trash2 size={15} className="shrink-0 text-red-600" />
              <span>Delete message</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActionMenuMessage(null);
                setActionMenuCoords(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] rounded-xl transition-colors text-left cursor-pointer border-t border-[#F5F5F5] pt-1.5"
            >
              <X size={15} className="shrink-0 text-[#737373]" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Message Confirmation Dialog (Zero Trace) */}
      {deleteConfirmMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => {
            if (!isDeletingMessage) setDeleteConfirmMessage(null);
          }}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-[#E5E5E5] space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111111]">Delete message?</h3>
                <p className="text-xs text-[#737373]">
                  Permanently remove for everyone
                </p>
              </div>
            </div>

            <p className="text-xs text-[#525252] leading-relaxed">
              This message will be completely removed for both you and the recipient. There will be zero trace or placeholder left behind.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0F0F0]">
              <button
                type="button"
                disabled={isDeletingMessage}
                onClick={() => setDeleteConfirmMessage(null)}
                className="px-4 py-2 text-xs font-semibold text-[#525252] hover:text-[#111111] hover:bg-[#F5F5F5] rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingMessage}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isDeletingMessage ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
