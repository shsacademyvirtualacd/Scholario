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
  Users,
  Loader2,
  Phone
} from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import type { Profile, ChatMessage, ChatThreadWithDetails } from '../../types';
import {
  getAdminChatThreads,
  getOrCreateStudentThread,
  getChatMessages,
  sendChatMessage,
  markChatThreadMessagesAsRead
} from '../../lib/chatService';
import { getAllStudents } from '../../lib/db';

export const AdminChatPage: React.FC = () => {
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
  
  // New chat modal
  const [allStudents, setAllStudents] = useState<Profile[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [mobileViewActiveThread, setMobileViewActiveThread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // 1. Fetch all existing threads
  const loadThreads = async (preserveActiveId?: string) => {
    try {
      const adminThreads = await getAdminChatThreads();
      setThreads(adminThreads);

      if (adminThreads.length > 0) {
        if (preserveActiveId && adminThreads.some(t => t.id === preserveActiveId)) {
          setActiveThreadId(preserveActiveId);
        } else if (!activeThreadId) {
          setActiveThreadId(adminThreads[0].id);
        }
      }
    } catch (err) {
      console.error('[AdminChatPage] Failed to load threads:', err);
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    loadThreads();
    // Pre-fetch all students for new conversation modal
    getAllStudents()
      .then((students) => setAllStudents(students))
      .catch((err) => console.error('[AdminChatPage] Error fetching students:', err));
  }, []);

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
          // Mark student unread messages as read
          await markChatThreadMessagesAsRead(activeThreadId, 'admin');
          window.dispatchEvent(new CustomEvent('scholario-chat-read'));
          // Optimistically clear unread count for this thread in state
          setThreads((prev) =>
            prev.map((t) => (t.id === activeThreadId ? { ...t, unread_count: 0 } : t))
          );
        }
      } catch (err) {
        console.error('[AdminChatPage] Failed to load messages:', err);
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    };

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [activeThreadId, currentUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom(messages.length <= 1 ? 'auto' : 'smooth');
  }, [messages]);

  // 3. Realtime Subscription on chat_messages & chat_threads
  useEffect(() => {
    const channelName = `admin-chat-hub-${Math.random().toString(36).substring(7)}`;
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

          // If the message belongs to currently active thread
          if (newMsg.thread_id === activeThreadId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            // If sent by student, mark as read
            if (newMsg.sender_role === 'student') {
              await markChatThreadMessagesAsRead(activeThreadId, 'admin');
              window.dispatchEvent(new CustomEvent('scholario-chat-read'));
            }
          }

          // Update threads list preview & unread counts
          setThreads((prev) => {
            const threadIndex = prev.findIndex((t) => t.id === newMsg.thread_id);
            if (threadIndex !== -1) {
              const updated = [...prev];
              const thread = { ...updated[threadIndex] };
              thread.latest_message = newMsg;
              if (newMsg.thread_id !== activeThreadId && newMsg.sender_role === 'student') {
                thread.unread_count = (thread.unread_count || 0) + 1;
              }
              updated.splice(threadIndex, 1);
              return [thread, ...updated];
            } else {
              // New thread arrived
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
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeThreadId]);

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
        'admin',
        contentToSend
      );

      // Optimistically append message
      setMessages((prev) => {
        if (prev.some((m) => m.id === createdMsg.id)) return prev;
        return [...prev, createdMsg];
      });

      // Update thread latest message in list
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

      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (err) {
      console.error('[AdminChatPage] Failed to send message:', err);
      setInputContent(contentToSend);
    } finally {
      setSending(false);
    }
  };

  // Start direct conversation with student from modal
  const handleSelectStudentToChat = async (student: Profile) => {
    try {
      setShowNewChatModal(false);
      setLoadingMessages(true);
      const thread = await getOrCreateStudentThread(student.id);

      await loadThreads(thread.id);
      setActiveThreadId(thread.id);
      setMobileViewActiveThread(true);
    } catch (err) {
      console.error('[AdminChatPage] Error creating chat with student:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Filter threads by search query
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const q = searchQuery.toLowerCase();
    return threads.filter((t) => {
      const name = t.student?.full_name?.toLowerCase() || '';
      const roll = t.student?.phone?.toLowerCase() || '';
      const lastMsg = t.latest_message?.content?.toLowerCase() || '';
      const grade = (t.student?.class?.display_name || t.student?.class?.grade || '')?.toLowerCase();
      const stream = (t.student?.stream || t.student?.stream_obj?.name || '')?.toLowerCase();
      return name.includes(q) || roll.includes(q) || lastMsg.includes(q) || grade.includes(q) || stream.includes(q);
    });
  }, [threads, searchQuery]);

  // Filter modal students
  const filteredModalStudents = useMemo(() => {
    if (!newChatSearch.trim()) return allStudents;
    const q = newChatSearch.toLowerCase();
    return allStudents.filter((s) => {
      const name = s.full_name?.toLowerCase() || '';
      const phone = s.phone?.toLowerCase() || '';
      const grade = (s.class?.display_name || s.class?.grade || '')?.toLowerCase();
      const stream = (s.stream || s.stream_obj?.name || '')?.toLowerCase();
      return name.includes(q) || phone.includes(q) || grade.includes(q) || stream.includes(q);
    });
  }, [allStudents, newChatSearch]);

  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === activeThreadId);
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

  return (
    <AdminShell>
      <div className="space-y-4 max-w-7xl mx-auto flex flex-col h-[calc(100vh-8.5rem)] max-h-[850px] min-h-[550px]">
        {/* Chat System Container */}
        <div className="flex-1 flex bg-white rounded-3xl border border-[#E5E5E5] shadow-xs overflow-hidden">
          
          {/* ── Left Column: Student Threads List ── */}
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
                      Student Inquiries
                    </h2>
                    <p className="text-[11px] text-[#737373] font-medium">
                      Direct Student Support Threads
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111111] hover:bg-[#262626] text-white text-xs font-bold transition-all shadow-2xs interactive"
                  title="Message a student directly"
                >
                  <UserPlus size={14} />
                  <span>New Chat</span>
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students, class, messages..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F5F5F5] border border-transparent focus:border-[#111111] focus:bg-white transition-all outline-hidden text-[#111111] placeholder:text-[#A3A3A3]"
                />
              </div>
            </div>

            {/* Threads List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#F0F0F0]">
              {loadingThreads ? (
                <div className="p-8 flex flex-col items-center justify-center gap-3 text-center">
                  <Loader2 size={24} className="animate-spin text-[#F4C430]" />
                  <span className="text-xs text-[#737373] font-medium">Loading student threads...</span>
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center gap-2 text-center text-[#737373]">
                  <MessageSquare size={32} className="text-[#D4D4D4] stroke-[1.5]" />
                  <p className="text-xs font-semibold text-[#111111]">No active threads found</p>
                  <p className="text-[11px] text-[#A3A3A3] max-w-[220px]">
                    Student inquiries will appear here, or you can initiate a message directly to any enrolled student.
                  </p>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="mt-2 text-xs font-bold text-[#111111] bg-[#F4C430] hover:bg-[#e6b82a] px-3.5 py-1.5 rounded-xl transition-all shadow-2xs"
                  >
                    Start new conversation
                  </button>
                </div>
              ) : (
                filteredThreads.map((t) => {
                  const isSelected = t.id === activeThreadId;
                  const student = t.student;
                  const hasUnread = (t.unread_count || 0) > 0;

                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveThreadId(t.id);
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
                          avatarUrl={student?.avatar_url}
                          name={student?.full_name || 'Student'}
                          role="student"
                          size="md"
                        />
                        {hasUnread && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#F4C430] ring-2 ring-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`text-xs truncate ${
                              isSelected
                                ? 'font-bold text-[#111111]'
                                : hasUnread
                                ? 'font-bold text-[#111111]'
                                : 'font-medium text-[#262626]'
                            }`}
                          >
                            {student?.full_name || 'Student'}
                          </span>
                          <span className="text-[10px] text-[#A3A3A3] shrink-0 font-medium">
                            {formatThreadDate(t.latest_message?.created_at || t.created_at)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5]">
                            <Users size={10} /> {student?.class?.display_name || student?.stream || 'Student'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-[11px] truncate ${
                              hasUnread ? 'font-semibold text-[#111111]' : 'text-[#737373]'
                            }`}
                          >
                            {t.latest_message ? (
                              <>
                                {t.latest_message.sender_role === 'admin' && (
                                  <span className="text-[#A3A3A3] mr-1">You:</span>
                                )}
                                {t.latest_message.content}
                              </>
                            ) : (
                              <span className="italic text-[#A3A3A3]">No messages yet</span>
                            )}
                          </p>
                          {hasUnread && (
                            <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#F4C430] text-[#111111] leading-none shadow-2xs">
                              {t.unread_count} new
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

          {/* ── Right Column: Active Thread Messages & Composer ── */}
          <div
            className={`flex-1 flex flex-col bg-white overflow-hidden ${
              !mobileViewActiveThread ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activeThread ? (
              <>
                {/* Active Thread Top Bar */}
                <div className="px-5 py-3.5 border-b border-[#E5E5E5] flex items-center justify-between bg-white z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setMobileViewActiveThread(false)}
                      className="md:hidden p-1.5 rounded-lg hover:bg-[#F5F5F5] text-[#111111] shrink-0"
                    >
                      <ArrowLeft size={18} />
                    </button>

                    <ProfileAvatar
                      avatarUrl={activeThread.student?.avatar_url}
                      name={activeThread.student?.full_name || 'Student'}
                      role="student"
                      size="md"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#111111] truncate">
                          {activeThread.student?.full_name || 'Student'}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5]">
                          {activeThread.student?.class?.display_name || activeThread.student?.stream || 'Student'}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#737373] truncate font-medium flex items-center gap-2">
                        {activeThread.student?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={10} /> {activeThread.student.phone}
                          </span>
                        )}
                        <span>• Official 1-on-1 Student Thread</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Scroll Area */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-[#FBFBFB]">
                  {/* Security Notice */}
                  <div className="flex justify-center my-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E5E5E5] text-[11px] text-[#737373] shadow-2xs">
                      <Shield size={12} className="text-[#F4C430]" />
                      <span>Permanent Student Direct Thread • Messages cannot be deleted</span>
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
                      <p className="text-sm font-bold text-[#111111]">Direct Thread Initiated</p>
                      <p className="text-xs text-[#A3A3A3] max-w-sm">
                        Send a message to {activeThread.student?.full_name || 'the student'} below. Messages are delivered instantly.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isAdmin = msg.sender_role === 'admin';
                      const isRead = !!msg.read_at;

                      // Show date divider
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
                            className={`flex items-end gap-2.5 ${
                              isAdmin ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {!isAdmin && (
                              <ProfileAvatar
                                avatarUrl={activeThread.student?.avatar_url}
                                name={activeThread.student?.full_name || 'Student'}
                                role="student"
                                size="sm"
                                className="shrink-0 mb-1"
                              />
                            )}

                            <div
                              className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-2xs ${
                                isAdmin
                                  ? 'bg-[#111111] text-white rounded-br-xs'
                                  : 'bg-white text-[#111111] border border-[#E5E5E5] rounded-bl-xs'
                              }`}
                            >
                              {!isAdmin && (
                                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-[#111111]">
                                  <span>{activeThread.student?.full_name || 'Student'}</span>
                                </div>
                              )}

                              <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed break-words select-text">
                                {msg.content}
                              </p>

                              <div
                                className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                                  isAdmin ? 'text-white/60' : 'text-[#A3A3A3]'
                                }`}
                              >
                                <span>{formatMessageTime(msg.created_at)}</span>
                                {isAdmin && (
                                  <span title={isRead ? 'Seen by student' : 'Delivered'}>
                                    {isRead ? (
                                      <CheckCheck size={12} className="text-[#F4C430]" />
                                    ) : (
                                      <Check size={12} />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isAdmin && (
                              <div className="w-8 h-8 rounded-xl bg-[#111111] text-[#F4C430] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs mb-1">
                                <Shield size={14} />
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input Bar */}
                <div className="p-3 md:p-4 bg-white border-t border-[#E5E5E5] shrink-0">
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
                      placeholder={`Reply to ${activeThread.student?.full_name || 'student'}...`}
                      className="flex-1 max-h-32 min-h-[38px] p-2 bg-transparent text-xs md:text-sm text-[#111111] placeholder:text-[#A3A3A3] resize-none outline-hidden"
                    />

                    <button
                      type="submit"
                      disabled={!inputContent.trim() || sending}
                      className="w-10 h-10 rounded-xl bg-[#F4C430] hover:bg-[#e6b82a] text-[#111111] font-bold flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs interactive"
                      title="Send reply"
                    >
                      {sending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
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
                <h3 className="text-base font-bold text-[#111111]">Select a student thread</h3>
                <p className="text-xs text-[#A3A3A3] max-w-sm mt-1">
                  Choose a student inquiry on the left to view messages and reply in real time, or click "New Chat" to message any student.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── New Chat Modal (Admin initiates chat with any student) ── */}
        {showNewChatModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[#E5E5E5] space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#F4C430]/20 text-[#111111] flex items-center justify-center font-bold">
                    <UserPlus size={17} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#111111]">Message a Student</h3>
                    <p className="text-xs text-[#737373]">Select any enrolled student to open their direct thread</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="text-[#737373] hover:text-[#111111] text-sm font-bold p-1 rounded-lg hover:bg-[#F5F5F5]"
                >
                  ✕
                </button>
              </div>

              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                <input
                  type="text"
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  placeholder="Search student by name, grade, or phone..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F5F5F5] border border-transparent focus:border-[#111111] focus:bg-white transition-all outline-hidden text-[#111111]"
                />
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-[#F0F0F0] -mx-2 px-2">
                {filteredModalStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#737373]">
                    No matching students found.
                  </div>
                ) : (
                  filteredModalStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleSelectStudentToChat(student)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-[#F5F5F5] flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ProfileAvatar
                          avatarUrl={student.avatar_url}
                          name={student.full_name}
                          role="student"
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#111111] truncate">{student.full_name}</p>
                          <p className="text-[10px] text-[#737373] truncate">
                            {student.class?.display_name || student.stream || 'Student'} • {student.phone || 'No phone'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#111111] bg-[#F4C430] hover:bg-[#e6b82a] px-3 py-1 rounded-lg shrink-0 shadow-2xs">
                        Open Thread
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-[#E5E5E5] flex justify-end">
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
};

export default AdminChatPage;
