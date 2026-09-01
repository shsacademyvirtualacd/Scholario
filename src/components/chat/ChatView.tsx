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
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import ProfileAvatar from '../common/ProfileAvatar';
import type { Role, Profile, ChatMessage, ChatThreadWithDetails } from '../../types';
import {
  getChatThreadsForUser,
  getChatMessages,
  sendChatMessage,
  markChatThreadMessagesAsRead,
  getOrCreateChatThread,
  getStudentChatContacts
} from '../../lib/chatService';

interface ChatViewProps {
  role: Role;
  availableContacts?: Profile[];
  onStartNewChatTitle?: string;
  allowNewChatWithAllStudents?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  role,
  availableContacts = [],
  onStartNewChatTitle = 'Start Conversation',
  allowNewChatWithAllStudents = false,
}) => {
  const { profile } = useAuth();
  const currentUserId = profile?.id;

  const [threads, setThreads] = useState<ChatThreadWithDetails[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [startingChatWithId, setStartingChatWithId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [mobileViewActiveThread, setMobileViewActiveThread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // 1. Initial Load of Threads & Pre-seeding for Students
  const loadThreads = async (preserveActiveId?: string) => {
    if (!currentUserId) return;
    try {
      if (role === 'student') {
        // For students, ensure threads exist for their teachers & admin
        try {
          const { teachers, admin } = await getStudentChatContacts(currentUserId);
          const studentRole: Role = 'student';
          
          // Ensure admin thread exists
          if (admin?.id) {
            await getOrCreateChatThread(
              { id: currentUserId, role: studentRole },
              { id: admin.id, role: 'admin' }
            ).catch(err => console.warn('[Chat] Ensure admin thread warning:', err));
          }

          // Ensure teacher threads exist
          for (const teacher of teachers) {
            if (teacher.id) {
              await getOrCreateChatThread(
                { id: currentUserId, role: studentRole },
                { id: teacher.id, role: 'teacher' }
              ).catch(err => console.warn('[Chat] Ensure teacher thread warning:', err));
            }
          }
        } catch (seedErr) {
          console.warn('[Chat] Auto-seed contacts warning:', seedErr);
        }
      }

      const userThreads = await getChatThreadsForUser(currentUserId);
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
  useEffect(() => {
    if (!activeThreadId || !currentUserId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const msgs = await getChatMessages(activeThreadId);
        if (isMounted) {
          setMessages(msgs);
          // Mark unread messages in this thread as read
          await markChatThreadMessagesAsRead(activeThreadId, currentUserId);
          window.dispatchEvent(new CustomEvent('scholario-chat-read'));
          // Optimistically clear unread count for this thread in state
          setThreads(prev =>
            prev.map(t => (t.id === activeThreadId ? { ...t, unread_count: 0 } : t))
          );
        }
      } catch (err) {
        console.error('[Chat] Failed to load messages:', err);
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    };

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [activeThreadId, currentUserId]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom(messages.length <= 1 ? 'auto' : 'smooth');
  }, [messages]);

  // 3. Realtime Subscription on chat_messages & chat_threads
  useEffect(() => {
    if (!currentUserId) return;

    const channelName = `chat-room-${currentUserId}-${Math.random().toString(36).substring(7)}`;
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
              // Avoid duplicate if already in state
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, activeThreadId]);

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim() || !activeThreadId || !currentUserId || sending) return;

    const contentToSend = inputContent.trim();
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
    } finally {
      setSending(false);
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
    if (!newChatSearch.trim()) return availableContacts;
    const q = newChatSearch.toLowerCase();
    return availableContacts.filter(c => {
      const name = c.full_name?.toLowerCase() || '';
      const stream = (c.stream || c.stream_obj?.name || '')?.toLowerCase();
      const grade = (c.class?.display_name || c.class?.grade || '')?.toLowerCase();
      return name.includes(q) || stream.includes(q) || grade.includes(q);
    });
  }, [availableContacts, newChatSearch]);

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

  const getRoleBadge = (otherRole: Role | string, isSupportAdmin?: boolean) => {
    if (isSupportAdmin || otherRole === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#111111] text-[#F4C430] border border-[#F4C430]/30 shadow-2xs">
          <Shield size={10} /> Admin Support
        </span>
      );
    }
    if (otherRole === 'teacher') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDF3C8] text-[#92700A] border border-[#F4C430]/30">
          <GraduationCap size={10} /> Teacher
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
                    Direct Messages
                  </h2>
                  <p className="text-[11px] text-[#737373] font-medium">
                    Permanent 1-on-1 Academic Threads
                  </p>
                </div>
              </div>

              {(allowNewChatWithAllStudents || (availableContacts && availableContacts.length > 0)) && (
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="p-2 rounded-xl bg-[#111111] text-white hover:bg-[#262626] transition-colors shadow-2xs interactive"
                  title={onStartNewChatTitle}
                >
                  <UserPlus size={16} />
                </button>
              )}
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
                    ? 'Your assigned teachers and admin support will appear here.'
                    : 'Messages from students will appear here.'}
                </p>
                {allowNewChatWithAllStudents && (
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="mt-2 text-xs font-bold text-[#111111] bg-[#F4C430] hover:bg-[#e6b82a] px-3.5 py-1.5 rounded-xl transition-all shadow-2xs"
                  >
                    Start a conversation
                  </button>
                )}
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
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                      isSelected
                        ? 'bg-white border-l-4 border-l-[#111111] shadow-2xs'
                        : 'hover:bg-[#F5F5F5] bg-transparent'
                    }`}
                  >
                    <div className="relative shrink-0 mt-0.5">
                      <ProfileAvatar
                        avatarUrl={other?.avatar_url}
                        name={other?.full_name || 'User'}
                        role={other?.role || 'student'}
                        size="md"
                      />
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#F4C430] ring-2 ring-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-xs truncate ${isSelected ? 'font-bold text-[#111111]' : hasUnread ? 'font-bold text-[#111111]' : 'font-medium text-[#262626]'}`}>
                          {other?.full_name || (isAdmin ? 'Scholario Support' : 'User')}
                        </span>
                        <span className="text-[10px] text-[#A3A3A3] shrink-0 font-medium">
                          {formatThreadDate(thread.latest_message?.created_at || thread.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1.5">
                        {getRoleBadge(other?.role || 'student', isAdmin)}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[11px] truncate ${hasUnread ? 'font-semibold text-[#111111]' : 'text-[#737373]'}`}>
                          {thread.latest_message ? (
                            <>
                              {thread.latest_message.sender_id === currentUserId && (
                                <span className="text-[#A3A3A3] mr-1">You:</span>
                              )}
                              {thread.latest_message.content}
                            </>
                          ) : (
                            <span className="italic text-[#A3A3A3]">No messages yet — send a greeting</span>
                          )}
                        </p>
                        {hasUnread && (
                          <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#F4C430] text-[#111111] leading-none">
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
              <div className="px-5 py-3.5 border-b border-[#E5E5E5] flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileViewActiveThread(false)}
                    className="md:hidden p-1.5 rounded-lg hover:bg-[#F5F5F5] text-[#111111] shrink-0"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <ProfileAvatar
                    avatarUrl={activeThread.other_participant?.avatar_url}
                    name={activeThread.other_participant?.full_name || 'User'}
                    role={activeThread.other_participant?.role || 'student'}
                    size="md"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#111111] truncate">
                        {activeThread.other_participant?.full_name || 'Direct Conversation'}
                      </h3>
                      {getRoleBadge(activeThread.other_participant?.role || 'student', activeThread.other_participant?.role === 'admin')}
                    </div>
                    <p className="text-[10px] text-[#737373] truncate font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Direct 1-on-1 • Permanent academic history
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-[#FBFBFB]">
                {/* Security & Permanent Notice */}
                <div className="flex justify-center my-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E5E5E5] text-[11px] text-[#737373] shadow-2xs">
                    <Shield size={12} className="text-[#F4C430]" />
                    <span>Official Scholario 1-on-1 thread. Messages cannot be deleted.</span>
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

                    // Show date divider if day changed
                    const prevMsg = messages[index - 1];
                    const showDateDivider =
                      !prevMsg ||
                      new Date(msg.created_at).toDateString() !==
                        new Date(prevMsg.created_at).toDateString();

                    return (
                      <React.Fragment key={msg.id}>
                        {showDateDivider && (
                          <div className="flex items-center justify-center my-4">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A3A3A3] bg-[#EFEFEF] px-3 py-1 rounded-full">
                              {new Date(msg.created_at).toLocaleDateString([], {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        )}

                        <div
                          className={`flex items-end gap-2 ${
                            isMe ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {!isMe && (
                            <ProfileAvatar
                              avatarUrl={activeThread.other_participant?.avatar_url}
                              name={activeThread.other_participant?.full_name || 'User'}
                              role={activeThread.other_participant?.role || 'student'}
                              size="sm"
                              className="shrink-0 mb-1"
                            />
                          )}

                          <div
                            className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-2xs ${
                              isMe
                                ? 'bg-[#111111] text-white rounded-br-xs'
                                : 'bg-white text-[#111111] border border-[#E5E5E5] rounded-bl-xs'
                            }`}
                          >
                            <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed break-words select-text">
                              {msg.content}
                            </p>

                            <div
                              className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                                isMe ? 'text-white/60' : 'text-[#A3A3A3]'
                              }`}
                            >
                              <span>{formatMessageTime(msg.created_at)}</span>
                              {isMe && (
                                <span title={isRead ? 'Read' : 'Delivered'}>
                                  {isRead ? (
                                    <CheckCheck size={12} className="text-[#F4C430]" />
                                  ) : (
                                    <Check size={12} />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar */}
              <div className="p-3 md:p-4 bg-white border-t border-[#E5E5E5]">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-end gap-2 bg-[#F7F7F7] p-2 rounded-2xl border border-[#E5E5E5] focus-within:border-[#111111] focus-within:bg-white transition-all shadow-2xs"
                >
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

                  <button
                    type="submit"
                    disabled={!inputContent.trim() || sending}
                    className="w-9 h-9 rounded-xl bg-[#F4C430] hover:bg-[#e6b82a] text-[#111111] font-bold flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs interactive"
                    title="Send message"
                  >
                    {sending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </form>
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

      {/* ── New Chat Modal (for Teacher or Admin to start conversation with student) ── */}
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
                  <p className="text-xs text-[#737373]">Select a student to open a 1-on-1 direct thread</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setModalError(null);
                }}
                className="text-[#737373] hover:text-[#111111] text-sm font-bold p-1 rounded-lg hover:bg-[#F5F5F5]"
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

            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
              <input
                type="text"
                value={newChatSearch}
                onChange={(e) => setNewChatSearch(e.target.value)}
                placeholder="Search by student name or grade..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F5F5F5] border border-transparent focus:border-[#111111] focus:bg-white transition-all outline-hidden text-[#111111]"
              />
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-[#F0F0F0] -mx-2 px-2">
              {filteredModalContacts.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#737373]">
                  No matching students found.
                </div>
              ) : (
                filteredModalContacts.map((contact) => {
                  const isStarting = startingChatWithId === contact.id;
                  const isAnyStarting = Boolean(startingChatWithId);

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
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#111111] truncate">{contact.full_name}</p>
                          <p className="text-[10px] text-[#737373] truncate">
                            {contact.class?.display_name || contact.stream || 'Student'}
                          </p>
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
    </div>
  );
};
