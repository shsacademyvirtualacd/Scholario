import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  Send,
  Trash2,
  Copy,
  Check,
  User,
  RotateCcw,
  BookOpen,
  Lightbulb,
  FileQuestion,
  Square,
  AlertTriangle,
  Smile,
  Brain,
  ArrowLeft,
  Paperclip,
  X,
  FileText,
  Compass,
  Sparkles,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth/AuthContext';
import { SageAvatar } from './SageAvatar';
import { SageEmotion, SAGE_EMOTIONS, detectSageEmotion } from './sageEmotion';
import { getLastPageContext, PageContextInfo } from '../../lib/pageContext';

export interface ChatAttachment {
  key?: string;
  filename: string;
  size: number;
  mime_type: string;
  url?: string;
  base64?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  emotion?: SageEmotion;
  attachment?: ChatAttachment;
}

interface SageChatViewProps {
  role: 'student' | 'teacher' | 'admin';
  embedded?: boolean;
  onBack?: () => void;
}

const SageMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="sage-markdown-body text-[14px] leading-relaxed text-[#262626] break-words">
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg font-extrabold text-[#111111] mt-3 mb-1.5 pb-1 border-b border-[#E5E5E5]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-[#111111] mt-2.5 mb-1 pb-0.5 border-b border-[#F0F0F0]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[15px] font-bold text-[#111111] mt-2 mb-1">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-[14px] font-bold text-[#111111] mt-1.5 mb-0.5">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-[13px] font-bold text-[#111111] mt-1 mb-0.5">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-[12px] font-bold text-[#111111] mt-1 mb-0.5">{children}</h6>
          ),
          p: ({ children }) => <p className="text-[14px] leading-relaxed my-1.5">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-1.5 space-y-1 text-[14px] marker:text-[#F4C430]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-1.5 space-y-1 text-[14px] marker:font-bold marker:text-[#111111]">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-[#111111]">{children}</strong>,
          em: ({ children }) => <em className="italic text-[#333333]">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-[#F4C430] bg-[#FAFAFA] pl-3.5 py-1.5 my-2 italic text-[#525252] rounded-r-lg">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-2.5 overflow-x-auto rounded-lg border border-[#E5E5E5]">
              <table className="w-full text-xs text-left border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#F5F5F5] text-[#111111] font-semibold border-b border-[#E5E5E5]">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 border-r border-[#E5E5E5] last:border-r-0 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-t border-[#E5E5E5] border-r border-[#E5E5E5] last:border-r-0">
              {children}
            </td>
          ),
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            if (!inline && (match || String(children).includes('\n'))) {
              return (
                <div className="my-2 rounded-xl bg-[#1C1C1E] text-[#F3F4F6] p-3 text-xs font-mono border border-[#333333] overflow-x-auto shadow-inner">
                  {match && (
                    <div className="text-[10px] uppercase font-bold text-[#F4C430] mb-1.5 tracking-wider select-none">
                      {match[1]}
                    </div>
                  )}
                  <pre className="overflow-x-auto font-mono">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              );
            }
            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-[#F5F5F5] font-mono text-xs text-[#C2410C] border border-[#E5E5E5]"
                {...props}
              >
                {children}
              </code>
            );
          },
          hr: () => <hr className="my-3 border-[#E5E5E5]" />,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};

const STARTER_PROMPTS: Record<'student' | 'teacher' | 'admin', Array<{ label: string; text: string; icon: any; tone?: string }>> = {
  student: [
    {
      label: 'Celebrate High Attendance',
      text: 'Assalam-o-Alaikum Sage! I just maintained 100% attendance this month in Physics and Math, thank you!',
      icon: Smile,
      tone: 'positive',
    },
    {
      label: 'Attendance & Absence Alert',
      text: 'I missed 3 consecutive classes this week due to fever. Is my attendance in danger of FBISE exam suspension?',
      icon: AlertTriangle,
      tone: 'concerned',
    },
    {
      label: 'Derive Physics Formula',
      text: 'Explain Newton’s Laws of Motion with real-life FBISE physics examples and step-by-step formula derivations.',
      icon: Lightbulb,
      tone: 'neutral',
    },
    {
      label: '7-Day Study Schedule',
      text: 'Create a 7-day revision schedule for upcoming FBISE board exams balancing Science and English.',
      icon: BookOpen,
      tone: 'neutral',
    },
  ],
  teacher: [
    {
      label: 'Praise Top Performers',
      text: 'Draft a warm congratulatory note for Class 10 students who scored above 90% in the recent Biology assessment!',
      icon: Smile,
      tone: 'positive',
    },
    {
      label: 'Low Attendance Notice',
      text: 'Draft an urgent reminder notice for students with unexcused absences and attendance below 75% before board exam cutoff.',
      icon: AlertTriangle,
      tone: 'concerned',
    },
    {
      label: 'Generate Quiz Questions',
      text: 'Create 5 conceptual Multiple Choice Questions (MCQs) with answer keys for Class 10 Biology Genetics.',
      icon: FileQuestion,
      tone: 'neutral',
    },
    {
      label: 'Lesson Plan Outline',
      text: 'Draft a 45-minute lesson plan outline for teaching Calculus Differentiation basics to 12th graders.',
      icon: Lightbulb,
      tone: 'neutral',
    },
  ],
  admin: [
    {
      label: 'Academy Performance',
      text: 'Greetings Sage! Share our weekly enrollment milestones and celebrate faculty attendance achievements across boards.',
      icon: Smile,
      tone: 'positive',
    },
    {
      label: 'Fee & Absence Alerts',
      text: 'What are our current critical alerts regarding student fee payment arrears, unpaid invoices, and chronic absences?',
      icon: AlertTriangle,
      tone: 'concerned',
    },
    {
      label: 'Live Platform Overview',
      text: 'Provide a real-time summary of total enrolled students, faculty members, class offerings, and test submissions across the academy.',
      icon: Lightbulb,
      tone: 'neutral',
    },
    {
      label: 'Board & Grade Breakdown',
      text: 'How many students are currently registered in Federal Board vs Sindh Board, broken down by class grade and stream?',
      icon: BookOpen,
      tone: 'neutral',
    },
  ],
};

export const SageChatView: React.FC<SageChatViewProps> = ({ role, embedded = false, onBack }) => {
  const { profile, session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = sessionStorage.getItem(`sage_chat_${role}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        content:
          role === 'teacher'
            ? `Hello **${profile?.full_name || 'Professor'}**! I am **Sage**, your AI academic assistant. How can I assist you with lesson planning, quiz questions, syllabus breakdowns, or announcements today?`
            : role === 'admin'
            ? `Greetings **${profile?.full_name || 'Administrator'}**! I am **Sage**, your administrative AI assistant with real-time live database access. Ask me about live student counts, board/grade distributions, faculty rosters, active offerings, test submissions, fee configurations, or drafting academic notices!`
            : `Assalam-o-Alaikum **${profile?.full_name || 'Student'}**! 🌟 I'm **Sage**, your AI study companion for SHS Virtual Academy. Ask me anything about your FBISE subjects (Math, Physics, Chemistry, Biology, CS, English, Urdu, etc.), formula derivations, or note summaries!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [manualEmotion, setManualEmotion] = useState<SageEmotion | null>(null);
  const [activePageContext, setActivePageContext] = useState<PageContextInfo | null>(() => getLastPageContext());
  const [pendingAttachment, setPendingAttachment] = useState<{
    file: File;
    filename: string;
    size: number;
    mime_type: string;
    previewUrl?: string;
    base64?: string;
    key?: string;
    isUploading?: boolean;
  } | null>(null);
  const [isSyncingNotes, setIsSyncingNotes] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync to session storage
  useEffect(() => {
    sessionStorage.setItem(`sage_chat_${role}`, JSON.stringify(messages));
  }, [messages, role]);

  // Keep active page context refreshed from session / navigation
  useEffect(() => {
    const ctx = getLastPageContext();
    if (ctx && (!activePageContext || activePageContext.path !== ctx.path)) {
      setActivePageContext(ctx);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File exceeds 20MB limit');
      return;
    }

    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : undefined;

    const attachmentObj = {
      file,
      filename: file.name,
      size: file.size,
      mime_type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
      previewUrl,
      base64: undefined as string | undefined,
      key: undefined as string | undefined,
      isUploading: true,
    };

    setPendingAttachment(attachmentObj);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Str = reader.result as string;
      attachmentObj.base64 = base64Str;

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('channel_id', `sage-${profile?.id || 'session'}`);
        formData.append('client_generated_id', `sage-att-${Date.now()}`);

        const uploadRes = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = (await uploadRes.json()) as { key?: string };
          attachmentObj.key = uploadData.key;
        }
      } catch {
        // base64 is still available for multimodal model
      } finally {
        attachmentObj.isUploading = false;
        setPendingAttachment({ ...attachmentObj });
        toast.success(`Attached ${file.name}`);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSyncNotes = async () => {
    setIsSyncingNotes(true);
    try {
      const res = await fetch('/api/knowledge-base/sync-notes', {
        method: 'POST',
      });
      const data = (await res.json()) as { synced?: number; error?: string };
      if (res.ok) {
        toast.success(`Knowledge Base synced! Indexed ${data.synced ?? 0} notes into vector knowledge base.`);
      } else {
        toast.error(data.error || 'Failed to sync notes');
      }
    } catch {
      toast.info('Knowledge base sync requested.');
    } finally {
      setIsSyncingNotes(false);
    }
  };

  // Derive current overall Sage emotional state
  const latestAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
  const activeEmotion: SageEmotion = manualEmotion
    ? manualEmotion
    : isLoading
    ? 'thinking'
    : latestAssistantMsg
    ? detectSageEmotion(latestAssistantMsg.content, false, role)
    : 'idle';
  const activeEmotionMeta = SAGE_EMOTIONS[activeEmotion] || SAGE_EMOTIONS.idle;

  // Scroll to bottom smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setStreamingId(null);
    const welcomeMsg: ChatMessage = {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content:
        role === 'teacher'
          ? `Hello **${profile?.full_name || 'Professor'}**! Conversation cleared. What would you like to prepare next?`
          : role === 'admin'
          ? `Hello **${profile?.full_name || 'Administrator'}**! Conversation cleared. How can I assist your operations?`
          : `Hello **${profile?.full_name || 'Student'}**! Conversation cleared. What subject or chapter should we study now?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([welcomeMsg]);
    sessionStorage.removeItem(`sage_chat_${role}`);
    toast.success('Chat history cleared');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setStreamingId(null);
    toast.info('Generation stopped');
  };

  const handleSend = async (userText?: string) => {
    const textToSend = (userText || input).trim();
    if ((!textToSend && !pendingAttachment) || isLoading) return;

    setErrorMsg(null);
    const currentAtt = pendingAttachment
      ? {
          key: pendingAttachment.key,
          filename: pendingAttachment.filename,
          size: pendingAttachment.size,
          mime_type: pendingAttachment.mime_type,
          url: pendingAttachment.previewUrl,
          base64: pendingAttachment.base64,
        }
      : undefined;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend || (currentAtt ? `Please analyze this attached file: ${currentAtt.filename}` : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: currentAtt,
    };

    const assistantMsgId = `sage-${Date.now() + 1}`;
    const placeholderAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages([...newHistory, placeholderAssistantMsg]);
    setInput('');
    setPendingAttachment(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);
    setStreamingId(assistantMsgId);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Build API payload for streaming Gemini route
      const payloadMessages = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
        attachment: m.attachment,
      }));

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/sage/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: payloadMessages,
          userRole: role,
          userName: profile?.full_name || '',
          grade: (profile as any)?.grade || '',
          stream: (profile as any)?.stream || '',
          page_context: activePageContext || undefined,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      if (!res.body) {
        throw new Error('Streaming not supported by browser environment.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              accumulatedText += parsed.text;
              const currentAccumulated = accumulatedText;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId ? { ...msg, content: currentAccumulated } : msg
                )
              );
            }
          } catch (parseErr: any) {
            if (parseErr.message && !dataStr.includes('{')) {
              // Non-JSON or incomplete line ignored
            } else if (parseErr.message) {
              throw parseErr;
            }
          }
        }
      }

      // If finished and no text received, provide a fallback message
      if (!accumulatedText.trim()) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content:
                    'I am ready to assist with your FBISE curriculum questions. Please try sending your prompt again.',
                }
              : msg
          )
        );
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[Sage Chat] Stream cancelled by user');
        return;
      }
      console.error('[Sage Chat Frontend Error]:', err);
      setErrorMsg(err.message || 'Unable to connect to Sage. Please try again.');
      toast.error('Failed to get response from Sage');
      // Clean up empty placeholder if failed at beginning
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== assistantMsgId || msg.content.trim().length > 0)
      );
    } finally {
      setIsLoading(false);
      setStreamingId(null);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const starters = STARTER_PROMPTS[role];

  return (
    <div
      className={
        embedded
          ? 'flex flex-col h-full w-full bg-white overflow-hidden'
          : 'flex flex-col h-[calc(100vh-140px)] min-h-[580px] max-w-5xl mx-auto bg-white rounded-3xl border border-[#E5E5E5] shadow-xs overflow-hidden'
      }
    >
      {/* ── Top Header ── */}
      <div className="bg-gradient-to-r from-[#111111] via-[#1A1A1A] to-[#111111] px-4 sm:px-6 py-3 sm:py-3.5 text-white flex items-center justify-between border-b border-[#262626] shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 -ml-1 rounded-lg hover:bg-white/10 text-white shrink-0 transition-colors"
              title="Back to conversations"
              aria-label="Back to conversations"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <SageAvatar
            emotion={activeEmotion}
            size="md"
            showBadge={true}
            interactive={true}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Sage AI
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#2B2B2B] text-[#F4C430] border border-[#3D3D3D]">
                {role === 'student' ? 'Study Companion' : role === 'teacher' ? 'Faculty Assistant' : 'Admin Copilot'}
              </span>
              <span
                className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${activeEmotionMeta.badgeBg} ${activeEmotionMeta.badgeTextColor}`}
                title={activeEmotionMeta.description}
              >
                {activeEmotionMeta.badgeLabel}
              </span>
            </div>
            <p className="text-[11px] text-[#A3A3A3] flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full inline-block ${
                  activeEmotion === 'thinking'
                    ? 'bg-purple-400 animate-ping'
                    : activeEmotion === 'concerned'
                    ? 'bg-red-500 animate-pulse'
                    : activeEmotion === 'positive'
                    ? 'bg-emerald-400'
                    : 'bg-[#22C55E]'
                }`}
              />
              <span>{activeEmotionMeta.statusText}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Interactive Mood Mode Selector */}
          <div className="hidden md:flex items-center gap-1 bg-[#1C1C1E] p-1 rounded-xl border border-[#2B2B2B]">
            {(['idle', 'thinking', 'positive', 'neutral', 'concerned'] as SageEmotion[]).map((emo) => {
              const eMeta = SAGE_EMOTIONS[emo];
              const Icon = eMeta.icon;
              const isSelected = activeEmotion === emo;
              return (
                <button
                  key={emo}
                  onClick={() => setManualEmotion(emo === manualEmotion ? null : emo)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    isSelected
                      ? `${eMeta.badgeBg} ${eMeta.badgeTextColor} shadow-xs scale-102`
                      : 'text-[#A3A3A3] hover:text-white hover:bg-[#2A2A2A]'
                  }`}
                  title={`${eMeta.label}: ${eMeta.description} (Click to toggle)`}
                >
                  <Icon size={11} />
                  <span className="hidden xl:inline">{eMeta.badgeLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Knowledge Base & Note Vault RAG Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#1C1C1E] border border-[#2B2B2B] text-[11px] text-[#A3A3A3]">
            <Database size={12} className="text-[#38BDF8]" />
            <span className="font-semibold text-white">RAG Note Vault</span>
          </div>

          {(role === 'admin' || role === 'teacher') && (
            <button
              type="button"
              id="sync-note-vault-btn"
              onClick={handleSyncNotes}
              disabled={isSyncingNotes}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors border border-[#3D3D3D] disabled:opacity-50 interactive"
              title="Index Subject Note Vault documents into vector knowledge base"
            >
              <Sparkles size={13} className={isSyncingNotes ? 'animate-spin text-amber-400' : 'text-amber-400'} />
              <span>{isSyncingNotes ? 'Syncing...' : 'Sync Notes'}</span>
            </button>
          )}

          <button
            id="clear-chat-btn"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-xs font-semibold text-[#D4D4D4] hover:text-white transition-colors border border-[#333333] interactive"
            title="Clear Chat History"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>
      </div>

      {/* ── Page-Aware Context Bar ── */}
      {activePageContext && (
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-amber-900 transition-all shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Compass size={14} className="text-amber-700 shrink-0" />
            <span className="font-bold text-amber-950 truncate">Page Context: {activePageContext.title}</span>
            <span className="hidden md:inline text-amber-800/80 truncate text-[11px]">— {activePageContext.summary}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => handleSend(`Can you guide me on what I'm looking at on the ${activePageContext.title} page?`)}
              className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-950 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Ask about this screen
            </button>
            <button
              type="button"
              onClick={() => setActivePageContext(null)}
              className="p-1 hover:bg-amber-200/70 rounded-lg text-amber-700 hover:text-amber-950 transition-colors"
              title="Dismiss page context"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── Chat Messages Stream ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#FAFAFA]/70">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isCurrentStreaming = msg.id === streamingId;
          const isPendingFirstToken = isCurrentStreaming && !msg.content;
          const msgEmotion: SageEmotion = isCurrentStreaming
            ? 'thinking'
            : msg.emotion || detectSageEmotion(msg.content, false, role);

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar: Animated Sage Avatar or User Icon */}
              {isUser ? (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold bg-[#111111] text-white shadow-xs">
                  <User size={16} />
                </div>
              ) : (
                <SageAvatar
                  emotion={msgEmotion}
                  size="sm"
                  showBadge={true}
                  pulseOnThinking={isCurrentStreaming}
                />
              )}

              {/* Message Bubble */}
              <div className="space-y-1 min-w-0 max-w-[85%] sm:max-w-[78%]">
                <div
                  className={`p-4 rounded-2xl shadow-xs transition-all ${
                    isUser
                      ? 'bg-[#111111] text-white rounded-tr-xs'
                      : 'bg-white text-[#262626] border border-[#E5E5E5] rounded-tl-xs'
                  }`}
                >
                  {/* Attachment preview in message bubble */}
                  {msg.attachment && (
                    <div
                      className={`mb-2.5 p-2 rounded-xl border flex items-center gap-2.5 text-left ${
                        isUser
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-[#F4F4F5] border-[#E4E4E7] text-[#18181B]'
                      }`}
                    >
                      {msg.attachment.mime_type.startsWith('image/') &&
                      (msg.attachment.url || msg.attachment.base64) ? (
                        <img
                          src={msg.attachment.url || msg.attachment.base64}
                          alt={msg.attachment.filename}
                          className="w-12 h-12 object-cover rounded-lg border border-black/10 shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            isUser ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          <FileText size={18} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate max-w-[210px] sm:max-w-[320px]">
                          {msg.attachment.filename}
                        </p>
                        <p className={`text-[10px] ${isUser ? 'text-gray-300' : 'text-gray-500'}`}>
                          {(msg.attachment.size / 1024).toFixed(1)} KB •{' '}
                          {msg.attachment.mime_type.split('/')[1]?.toUpperCase() || 'DOCUMENT'}
                        </p>
                      </div>
                    </div>
                  )}

                  {isUser ? (
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : isPendingFirstToken ? (
                    <div className="flex items-center gap-2 py-0.5 text-xs text-[#737373] font-medium">
                      <span>Sage is thinking</span>
                      <div className="flex items-center gap-1">
                        <div
                          className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <div
                          className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <div
                          className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <SageMarkdownRenderer content={msg.content} />
                      {isCurrentStreaming && (
                        <span
                          className="inline-block w-1.5 h-4 bg-[#8B5CF6] animate-pulse ml-0.5 align-middle rounded-xs"
                          title="Streaming..."
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Footer info: time, tone indicator & copy */}
                <div
                  className={`flex items-center gap-2 px-1 text-[11px] text-[#A3A3A3] ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {!isUser && !isPendingFirstToken && msg.content && (
                    <>
                      <span className="text-[10px] font-semibold text-[#888888] flex items-center gap-1">
                        • {SAGE_EMOTIONS[msgEmotion]?.badgeLabel}
                      </span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="flex items-center gap-1 hover:text-[#111111] transition-colors interactive ml-1"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? (
                          <Check size={12} className="text-green-600" />
                        ) : (
                          <Copy size={12} />
                        )}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </>
                  )}
                  {isCurrentStreaming && (
                    <span className="text-[10px] text-[#8B5CF6] font-bold tracking-wider uppercase ml-1 animate-pulse flex items-center gap-1">
                      <Brain size={11} className="animate-spin" /> Thinking...
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              onClick={() => handleSend()}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
              <RotateCcw size={12} /> Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Starter Prompts (if chat is fresh) ── */}
      {messages.length <= 2 && !isLoading && (
        <div className="px-4 sm:px-6 py-3 bg-white border-t border-[#F0F0F0] overflow-x-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-bold text-[#737373] uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb size={12} className="text-[#F4C430]" /> Suggested Questions & Interactions
            </div>
            <span className="text-[10px] text-[#A3A3A3] hidden sm:inline">
              Try different prompts to see Sage react with dynamic expressions
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {starters.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  id={`starter-chip-${idx}`}
                  onClick={() => handleSend(item.text)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs text-[#525252] hover:text-[#111111] transition-all text-left group interactive shadow-2xs ${
                    item.tone === 'positive'
                      ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-400'
                      : item.tone === 'concerned'
                      ? 'border-red-200 bg-red-50/40 hover:bg-red-50 hover:border-red-400'
                      : 'border-[#E5E5E5] bg-[#FAFAFA] hover:bg-[#FFFBF0] hover:border-[#F4C430]'
                  }`}
                >
                  <Icon
                    size={13}
                    className={`shrink-0 group-hover:scale-110 transition-transform ${
                      item.tone === 'positive'
                        ? 'text-emerald-600'
                        : item.tone === 'concerned'
                        ? 'text-red-500'
                        : 'text-[#F4C430]'
                    }`}
                  />
                  <span className="font-semibold truncate max-w-[240px]">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Input Box & Controls ── */}
      <div className="p-4 sm:p-5 bg-white border-t border-[#E5E5E5] shrink-0">
        {/* Pending Attachment Preview */}
        {pendingAttachment && (
          <div className="mb-2.5 p-2.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {pendingAttachment.previewUrl ? (
                <img
                  src={pendingAttachment.previewUrl}
                  alt={pendingAttachment.filename}
                  className="w-10 h-10 object-cover rounded-lg border border-[#D4D4D8] shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[#E4E4E7] flex items-center justify-center text-[#52525B] shrink-0">
                  <FileText size={18} />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-[#18181B] truncate max-w-[200px] sm:max-w-[340px]">
                  {pendingAttachment.filename}
                </p>
                <p className="text-[10px] text-[#71717A]">
                  {(pendingAttachment.size / 1024).toFixed(1)} KB •{' '}
                  {pendingAttachment.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                  {pendingAttachment.isUploading && (
                    <span className="ml-1 text-purple-600 font-medium animate-pulse">(Uploading...)</span>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPendingAttachment(null)}
              className="p-1 rounded-lg hover:bg-[#E4E4E7] text-[#71717A] hover:text-[#18181B] transition-colors"
              title="Remove attachment"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-end gap-2 bg-[#F9F9F9] border border-[#E5E5E5] focus-within:border-[#111111] focus-within:bg-white rounded-2xl p-2 transition-all shadow-inner"
        >
          {/* File input and attach button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,application/pdf,.txt,.doc,.docx"
            className="hidden"
            id="sage-file-upload-input"
          />
          <button
            type="button"
            id="sage-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl text-[#737373] hover:text-[#111111] hover:bg-[#EAEAEA] transition-colors shrink-0 interactive"
            title="Attach image or document (diagrams, exam papers, textbook problems)"
          >
            <Paperclip size={18} />
          </button>

          <textarea
            ref={textareaRef}
            id="sage-chat-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              role === 'student'
                ? 'Ask Sage any subject question, formula derivation, or study tip... (Press Enter to send)'
                : role === 'teacher'
                ? 'Ask Sage for lesson preparation, quiz questions, or explanations... (Press Enter to send)'
                : 'Ask Sage for announcement drafts, policy summaries, or schedules... (Press Enter to send)'
            }
            rows={1}
            disabled={isLoading}
            className="w-full resize-none bg-transparent px-1.5 py-2 text-sm text-[#111111] placeholder:text-[#A3A3A3] focus:outline-none max-h-36 font-normal leading-relaxed"
          />

          {isLoading ? (
            <button
              type="button"
              id="sage-chat-stop-btn"
              onClick={handleStop}
              className="p-3 rounded-xl flex items-center justify-center shrink-0 bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-md hover:scale-105 interactive transition-all"
              title="Stop Generating"
            >
              <Square size={16} className="fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              id="sage-chat-send-btn"
              disabled={!input.trim() && !pendingAttachment}
              className={`p-3 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                input.trim() || pendingAttachment
                  ? 'bg-[#111111] hover:bg-black text-[#F4C430] shadow-md hover:scale-105 interactive'
                  : 'bg-[#E5E5E5] text-[#A3A3A3] cursor-not-allowed'
              }`}
              title="Send Message"
            >
              <Send size={16} />
            </button>
          )}
        </form>

        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-[#A3A3A3]">
          <span>Shift + Enter for new line • Enter to send</span>
          <span className="text-[#737373] font-medium">Scholario Sage v2.0 (Gemini 2.5 Flash + RAG)</span>
        </div>
      </div>
    </div>
  );
};

export default SageChatView;
