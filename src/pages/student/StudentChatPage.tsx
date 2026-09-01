import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Shield,
  Loader2,
  Check,
  CheckCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  getOrCreateStudentThread,
  getChatMessages,
  sendChatMessage,
  markChatThreadMessagesAsRead
} from '../../lib/chatService';
import type { ChatThread, ChatMessage } from '../../types';
import ProfileAvatar from '../../components/common/ProfileAvatar';

export const StudentChatPage: React.FC = () => {
  const { profile } = useAuth();
  const currentUserId = profile?.id;

  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [loadingThread, setLoadingThread] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // 1. Load or create student's single thread with Admin
  useEffect(() => {
    if (!currentUserId) return;

    let isMounted = true;
    const initThread = async () => {
      setLoadingThread(true);
      try {
        const studentThread = await getOrCreateStudentThread(currentUserId);
        if (isMounted) {
          setThread(studentThread);
        }
      } catch (err) {
        console.error('[StudentChatPage] Error initializing thread:', err);
      } finally {
        if (isMounted) setLoadingThread(false);
      }
    };

    initThread();

    return () => {
      isMounted = false;
    };
  }, [currentUserId]);

  // 2. Load messages for thread
  useEffect(() => {
    if (!thread?.id || !currentUserId) return;

    let isMounted = true;
    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const msgs = await getChatMessages(thread.id);
        if (isMounted) {
          setMessages(msgs);
          // Mark admin unread messages as read
          await markChatThreadMessagesAsRead(thread.id, 'student');
          window.dispatchEvent(new CustomEvent('scholario-chat-read'));
        }
      } catch (err) {
        console.error('[StudentChatPage] Error fetching messages:', err);
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    };

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [thread?.id, currentUserId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom(messages.length <= 1 ? 'auto' : 'smooth');
  }, [messages]);

  // 3. Realtime subscription for incoming messages
  useEffect(() => {
    if (!thread?.id || !currentUserId) return;

    const channelName = `student-chat-${thread.id}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${thread.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // If message is from admin, mark as read
          if (newMsg.sender_role === 'admin') {
            await markChatThreadMessagesAsRead(thread.id, 'student');
            window.dispatchEvent(new CustomEvent('scholario-chat-read'));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${thread.id}`,
        },
        (payload) => {
          const updatedMsg = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [thread?.id, currentUserId]);

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim() || !thread?.id || !currentUserId || sending) return;

    const contentToSend = inputContent.trim();
    setInputContent('');
    setSending(true);

    try {
      const createdMsg = await sendChatMessage(
        thread.id,
        currentUserId,
        'student',
        contentToSend
      );

      setMessages((prev) => {
        if (prev.some((m) => m.id === createdMsg.id)) return prev;
        return [...prev, createdMsg];
      });

      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (err) {
      console.error('[StudentChatPage] Failed to send message:', err);
      setInputContent(contentToSend); // restore on error
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <StudentShell>
      <div className="space-y-4 max-w-5xl mx-auto flex flex-col h-[calc(100vh-8.5rem)] max-h-[850px] min-h-[550px]">
        {/* Chat System Container */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-[#E5E5E5] shadow-xs overflow-hidden">
          
          {/* Header Bar */}
          <div className="px-5 py-4 border-b border-[#E5E5E5] flex items-center justify-between bg-white z-10 shrink-0">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#111111] text-[#F4C430] flex items-center justify-center font-bold shadow-2xs shrink-0">
                <Shield size={20} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm md:text-base font-bold text-[#111111] truncate">
                    Scholario Administration Support
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#111111] text-[#F4C430] border border-[#F4C430]/30 shadow-2xs shrink-0">
                    <Shield size={10} /> Official Support
                  </span>
                </div>
                <p className="text-[11px] text-[#737373] truncate font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Direct 1-on-1 Helpdesk • Inquiries, Fee Support & Academic Assistance
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F5F5] border border-[#E5E5E5] text-[11px] font-semibold text-[#525252]">
              <Clock size={12} className="text-[#F4C430]" />
              <span>Replies usually within standard school hours</span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-[#FBFBFB]">
            {/* Permanent Audit Notice */}
            <div className="flex justify-center my-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E5E5] text-[11px] text-[#737373] shadow-2xs">
                <Shield size={12} className="text-[#F4C430]" />
                <span>Official student-to-admin direct thread. Permanent record.</span>
              </div>
            </div>

            {loadingThread || loadingMessages ? (
              <div className="flex flex-col items-center justify-center h-52 gap-2 text-center">
                <Loader2 size={24} className="animate-spin text-[#F4C430]" />
                <span className="text-xs text-[#737373] font-medium">Connecting to administration support...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-[#737373] space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-[#F4C430]/20 flex items-center justify-center text-[#111111]">
                  <Sparkles size={24} />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-base font-bold text-[#111111]">Welcome to Scholario Direct Support</h3>
                  <p className="text-xs text-[#737373] leading-relaxed">
                    Have questions about your enrollment, fees, schedule, or need academic guidance? Send a message below to connect directly with the administration team.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setInputContent('Hello, I have a question regarding my class schedule and upcoming tests.')}
                    className="text-[11px] font-semibold text-[#111111] bg-white hover:bg-[#F5F5F5] px-3 py-1.5 rounded-xl border border-[#E5E5E5] transition-colors shadow-2xs"
                  >
                    📅 Schedule question
                  </button>
                  <button
                    onClick={() => setInputContent('Hello, I need assistance with my fee payment verification.')}
                    className="text-[11px] font-semibold text-[#111111] bg-white hover:bg-[#F5F5F5] px-3 py-1.5 rounded-xl border border-[#E5E5E5] transition-colors shadow-2xs"
                  >
                    💳 Fee verification help
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isStudent = msg.sender_role === 'student';
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
                      className={`flex items-end gap-2.5 ${
                        isStudent ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {!isStudent && (
                        <div className="w-8 h-8 rounded-xl bg-[#111111] text-[#F4C430] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs mb-1">
                          <Shield size={14} />
                        </div>
                      )}

                      <div
                        className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-2xs ${
                          isStudent
                            ? 'bg-[#111111] text-white rounded-br-xs'
                            : 'bg-white text-[#111111] border border-[#E5E5E5] rounded-bl-xs'
                        }`}
                      >
                        {!isStudent && (
                          <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-[#111111]">
                            <span>Scholario Support</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#FDF3C8] text-[#92700A] font-extrabold">
                              ADMIN
                            </span>
                          </div>
                        )}

                        <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed break-words select-text">
                          {msg.content}
                        </p>

                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                            isStudent ? 'text-white/60' : 'text-[#A3A3A3]'
                          }`}
                        >
                          <span>{formatMessageTime(msg.created_at)}</span>
                          {isStudent && (
                            <span title={isRead ? 'Seen by administration' : 'Delivered'}>
                              {isRead ? (
                                <CheckCheck size={12} className="text-[#F4C430]" />
                              ) : (
                                <Check size={12} />
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {isStudent && (
                        <ProfileAvatar
                          avatarUrl={profile?.avatar_url}
                          name={profile?.full_name || 'Student'}
                          role="student"
                          size="sm"
                          className="shrink-0 mb-1"
                        />
                      )}
                    </div>
                  </React.Fragment>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Form */}
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
                placeholder="Type your message to administration support..."
                className="flex-1 max-h-32 min-h-[38px] p-2 bg-transparent text-xs md:text-sm text-[#111111] placeholder:text-[#A3A3A3] resize-none outline-hidden"
              />

              <button
                type="submit"
                disabled={!inputContent.trim() || sending}
                className="w-10 h-10 rounded-xl bg-[#F4C430] hover:bg-[#e6b82a] text-[#111111] font-bold flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs interactive"
                title="Send message"
              >
                {sending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </StudentShell>
  );
};

export default StudentChatPage;
