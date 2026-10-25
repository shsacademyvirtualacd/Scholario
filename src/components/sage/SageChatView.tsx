import React, { useState, useRef, useEffect, Suspense } from 'react';
import 'katex/dist/katex.min.css';
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
  RefreshCw,
  Database,
  Mic,
  Play,
  Pause,
  Download,
  FileDown,
  Eye,
  Loader2,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Volume2,
  Share2,
  MoreHorizontal,
  Menu,
  Pencil,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '../admin/ConfirmModal';
import { useAuth } from '../../features/auth/AuthContext';
import { SageAvatar, SageCharacterSvg } from './SageAvatar';
import { SageEmotion, SAGE_EMOTIONS, detectSageEmotion } from './sageEmotion';
import { getLastPageContext, PageContextInfo } from '../../lib/pageContext';
import {
  SageVoiceRecorder,
  AudioRecordingResult,
  transcribeAudioWithGemini,
} from '../../lib/sageVoiceRecorder';
import {
  generateSageContentPdf,
  generateSageConversationPdf,
  downloadSagePdf,
  triggerPdfBlobDownload,
  shareSagePdfBlob,
  revokeSagePdfUrl,
  hasAcademicContent,
  hasAnswerKeyOrSolutions,
  detectPdfRequest,
  extractAcademicMetadata,
} from '../../lib/sagePdfGenerator';
import {
  sageSpeech,
  SpeechPlaybackStatus,
  SpeechSpeed,
  AvatarVoicePreference,
} from '../../lib/sageSpeech';
import { SAGE_AI_MODELS, SAGE_MODEL_DISPLAY_NAME } from '../../lib/knowledgeBaseService';
import {
  useSageAvatarController,
  SageAvatarStateProvider,
  SAGE_CHARACTERS,
} from './useSageAvatarState';

import { Sage3DAvatar } from './Sage3DAvatar';
import { SageProfilePanel } from './SageProfilePanel';
import {
  detectThoughtCategory,
  getThoughtReactionLine,
  getThinkingThoughtLine,
  getCompletionThoughtLine,
  getIdleThoughtLine,
} from './sageThoughtLines';

function formatSageModelLabel(modelId: string): string {
  const id = (modelId || '').toLowerCase();
  if (id.includes('gemini-3-flash')) return 'Gemini 3 Flash';
  if (id.includes('gemini-3.5-flash-lite')) return 'Gemini 3.5 Flash-Lite';
  if (id.includes('gemini-3.1-flash-lite')) return 'Gemini 3.1 Flash-Lite';
  if (id.includes('gemini-2.5-flash')) return 'Gemini 2.5 Flash';
  return SAGE_MODEL_DISPLAY_NAME;
}

export interface ChatAttachment {
  key?: string;
  filename: string;
  size: number;
  mime_type: string;
  url?: string;
  base64?: string;
}

export interface ChatAudioData {
  blobUrl?: string;
  durationSeconds: number;
  transcript?: string;
  mimeType?: string;
}

export interface ChatPdfCardData {
  title: string;
  subject: string;
  className: string;
  docType: string;
  hasAnswers: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  emotion?: SageEmotion;
  attachment?: ChatAttachment;
  audio?: ChatAudioData;
  pdfCard?: ChatPdfCardData;
}

interface SageChatViewProps {
  role: 'student' | 'teacher' | 'admin';
  embedded?: boolean;
  onBack?: () => void;
}

const SageMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="sage-markdown-body text-[14px] leading-relaxed text-[#262626] dark:text-[#E4E4E7] break-words">
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg font-extrabold text-[#111111] dark:text-white mt-3 mb-1.5 pb-1 border-b border-[#E5E5E5] dark:border-[#2E2E36]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-[#111111] dark:text-white mt-2.5 mb-1 pb-0.5 border-b border-[#F0F0F0] dark:border-[#2E2E36]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[15px] font-bold text-[#111111] dark:text-white mt-2 mb-1">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-[14px] font-bold text-[#111111] dark:text-white mt-1.5 mb-0.5">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-[13px] font-bold text-[#111111] dark:text-white mt-1 mb-0.5">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-[12px] font-bold text-[#111111] dark:text-white mt-1 mb-0.5">{children}</h6>
          ),
          p: ({ children }) => <p className="text-[14px] leading-relaxed my-1.5">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-1.5 space-y-1 text-[14px] marker:text-[#F4C430]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-1.5 space-y-1 text-[14px] marker:font-bold marker:text-[#111111] dark:marker:text-white">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-[#111111] dark:text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-[#333333] dark:text-[#D4D4D8]">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-[#F4C430] bg-[#FAFAFA] dark:bg-[#1A1A1E] pl-3.5 py-1.5 my-2 italic text-[#525252] dark:text-[#A1A1AA] rounded-r-lg">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-2.5 overflow-x-auto rounded-lg border border-[#E5E5E5] dark:border-[#2E2E36] shadow-xs">
              <table className="w-full text-xs text-left border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#F5F5F5] dark:bg-[#1E1E24] text-[#111111] dark:text-white font-semibold border-b border-[#E5E5E5] dark:border-[#2E2E36]">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 border-r border-[#E5E5E5] dark:border-[#2E2E36] last:border-r-0 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-t border-[#E5E5E5] dark:border-[#2E2E36] border-r border-[#E5E5E5] dark:border-[#2E2E36] last:border-r-0">
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

// ── WhatsApp-Style Audio Message Player ──
const VoiceMessageBubble: React.FC<{
  audio: ChatAudioData;
  isUser: boolean;
}> = ({ audio, isUser }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audio.blobUrl) return;
    const el = new Audio(audio.blobUrl);
    audioRef.current = el;

    el.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    el.ontimeupdate = () => {
      setCurrentTime(el.currentTime);
    };

    return () => {
      el.pause();
      el.src = '';
    };
  }, [audio.blobUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => {
        console.warn('Audio play error:', e);
      });
    }
  };

  const handleSeek = (percentage: number) => {
    if (!audioRef.current) return;
    const target = percentage * (audio.durationSeconds || 1);
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const durationSecs = audio.durationSeconds || 1;
  const progressRatio = Math.min(1, Math.max(0, currentTime / durationSecs));

  // 18 equalizer bars for the WhatsApp waveform look
  const barHeights = [45, 75, 30, 90, 60, 100, 40, 85, 55, 95, 35, 70, 50, 80, 40, 65, 35, 50];

  return (
    <div className="w-full max-w-[320px] sm:max-w-[360px]">
      <div className="flex items-center gap-3 py-1">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95 ${
            isUser
              ? 'bg-[#F4C430] hover:bg-amber-400 text-[#111111]'
              : 'bg-[#111111] hover:bg-black text-[#F4C430]'
          }`}
          title={isPlaying ? 'Pause' : 'Play voice message'}
        >
          {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-0.5" />}
        </button>

        {/* Waveform Equalizer Visualizer */}
        <div className="flex-1 min-w-0">
          <div
            className="flex items-center gap-[3px] h-8 cursor-pointer select-none py-1"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              handleSeek(ratio);
            }}
          >
            {barHeights.map((h, i) => {
              const barRatio = i / (barHeights.length - 1);
              const isPlayed = barRatio <= progressRatio;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors ${
                    isPlayed
                      ? isUser
                        ? 'bg-[#F4C430]'
                        : 'bg-[#111111]'
                      : isUser
                      ? 'bg-white/30'
                      : 'bg-zinc-300'
                  }`}
                  style={{ height: `${Math.max(15, h)}%` }}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] tracking-tight mt-0.5">
            <span className={isUser ? 'text-zinc-300' : 'text-zinc-500'}>
              {isPlaying ? formatTime(currentTime) : formatTime(durationSecs)}
            </span>
            <span className={`flex items-center gap-1 font-medium ${isUser ? 'text-zinc-300' : 'text-zinc-500'}`}>
              <Mic size={10} /> Voice Note
            </span>
          </div>
        </div>
      </div>

      {/* Transcript Collapsible Toggle */}
      {audio.transcript && (
        <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10">
          <button
            type="button"
            onClick={() => setShowTranscript((prev) => !prev)}
            className={`flex items-center justify-between w-full text-[11px] font-semibold transition-colors ${
              isUser ? 'text-zinc-200 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>{showTranscript ? 'Hide transcript' : 'View transcript'}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20 text-current uppercase tracking-wider font-bold">
                Urdu / Eng
              </span>
            </span>
            {showTranscript ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showTranscript && (
            <div
              className={`mt-1.5 p-2.5 rounded-xl text-xs leading-relaxed ${
                isUser
                  ? 'bg-white/10 text-zinc-100 border border-white/15'
                  : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
              }`}
            >
              <p className="whitespace-pre-wrap">{audio.transcript}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Interactive PDF Card (When user asks directly or generated) ──
const SagePdfCard: React.FC<{
  title: string;
  subject: string;
  className: string;
  hasAnswers: boolean;
  role: 'student' | 'teacher' | 'admin';
  onDownload: (mode: 'student' | 'teacher') => void;
  onShare: (mode: 'student' | 'teacher') => void;
  onPreview: (mode: 'student' | 'teacher') => void;
  isGenerating?: boolean;
}> = ({ title, subject, className, hasAnswers, role, onDownload, onShare, onPreview, isGenerating }) => {
  const isStudent = role === 'student';

  return (
    <div className="my-3 p-4 bg-gradient-to-br from-amber-50/90 via-white to-zinc-50 border border-amber-200/90 rounded-2xl shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-300/50 flex items-center justify-center shrink-0">
            <FileText size={22} className="text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                PDF Document Ready
              </span>
              <span className="text-[11px] text-zinc-500 font-medium">A4 Printable</span>
            </div>
            <h4 className="text-sm font-bold text-zinc-900 mt-1 leading-snug">{title}</h4>
            <p className="text-xs text-zinc-600 mt-0.5">
              {subject} • {className} • Scholario Verified
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-amber-200/60 flex flex-wrap items-center gap-2">
        {isStudent ? (
          <button
            type="button"
            onClick={() => onDownload('student')}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111111] hover:bg-black text-xs font-semibold text-[#F4C430] shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            title="Download clean student copy (questions/notes)"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>
        ) : hasAnswers ? (
          <>
            <button
              type="button"
              onClick={() => onDownload('student')}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-50 text-xs font-semibold text-emerald-800 border border-emerald-300 shadow-2xs hover:border-emerald-400 transition-all disabled:opacity-50 cursor-pointer"
              title="Download clean student test (solutions omitted)"
            >
              <GraduationCap size={14} className="text-emerald-600" />
              <span>Student Copy (No Answers)</span>
            </button>
            <button
              type="button"
              onClick={() => onDownload('teacher')}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111111] hover:bg-black text-xs font-semibold text-[#F4C430] shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
              title="Download teacher copy with solutions & answer key"
            >
              <Download size={14} />
              <span>Teacher Copy (With Answers)</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onDownload('teacher')}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111111] hover:bg-black text-xs font-semibold text-[#F4C430] shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onShare(isStudent ? 'student' : 'teacher')}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-xs font-semibold text-amber-950 border border-amber-300 transition-all disabled:opacity-50 cursor-pointer"
          title="Share or send PDF via WhatsApp / Email / System Share"
        >
          <Share2 size={13} />
          <span>Share / Send</span>
        </button>

        <button
          type="button"
          onClick={() => onPreview(isStudent ? 'student' : hasAnswers ? 'student' : 'teacher')}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-700 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Eye size={14} />
          <span>Preview</span>
        </button>

        {isGenerating && (
          <span className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold animate-pulse ml-auto">
            <Loader2 size={13} className="animate-spin" /> Generating PDF...
          </span>
        )}
      </div>
    </div>
  );
};

// ── Lightweight, Memoized PDF Preview Modal with Scroll Lock ──
const PdfPreviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  dataUrl?: string;
  filename: string;
  totalPages?: number;
  loading?: boolean;
  mode: 'student' | 'teacher';
  hasAnswers: boolean;
  role: 'student' | 'teacher' | 'admin';
  onToggleMode: (newMode: 'student' | 'teacher') => void;
  onDownload: () => void;
  onShare: () => void;
}> = React.memo(({
  isOpen,
  onClose,
  dataUrl,
  filename,
  totalPages = 1,
  loading = false,
  mode,
  hasAnswers,
  role,
  onToggleMode,
  onDownload,
  onShare,
}) => {
  const isStudent = role === 'student';

  // Lock background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl flex flex-col w-full max-w-4xl h-[92vh] max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-black flex items-center justify-center font-black text-xs shrink-0">
              PDF
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold truncate max-w-[200px] sm:max-w-md">{filename}</h3>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">
                Scholario Sage v2.0 • A4 Document ({totalPages} {totalPages === 1 ? 'page' : 'pages'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Edition Switcher (Visible ONLY to Teachers and Admins) */}
            {!isStudent && hasAnswers && (
              <div className="hidden sm:flex items-center bg-zinc-800 p-0.5 rounded-xl border border-zinc-700 text-xs">
                <button
                  type="button"
                  onClick={() => onToggleMode('student')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    mode === 'student' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Student Copy
                </button>
                <button
                  type="button"
                  onClick={() => onToggleMode('teacher')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    mode === 'teacher' ? 'bg-amber-500 text-black shadow-xs' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Teacher Copy
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold transition-colors cursor-pointer"
              title="Share or send PDF"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              type="button"
              onClick={onDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4C430] hover:bg-amber-400 text-black text-xs font-bold transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Download</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Mode Selector for Mobile (Visible ONLY to Teachers and Admins) */}
        {!isStudent && hasAnswers && (
          <div className="sm:hidden px-4 py-2 bg-zinc-100 border-b border-zinc-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-600">Edition:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onToggleMode('student')}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                  mode === 'student' ? 'bg-emerald-600 text-white' : 'bg-white text-zinc-700'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => onToggleMode('teacher')}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                  mode === 'teacher' ? 'bg-amber-500 text-black' : 'bg-white text-zinc-700'
                }`}
              >
                Teacher
              </button>
            </div>
          </div>
        )}

        {/* Document Viewer Frame - Smooth native scrolling on Android/iOS */}
        <div
          className="flex-1 bg-zinc-200 overflow-y-auto overflow-x-hidden flex items-center justify-center p-2 sm:p-6 relative"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-zinc-600">
              <Loader2 size={32} className="animate-spin text-amber-500" />
              <span className="text-xs font-semibold">Generating publication-quality A4 PDF...</span>
            </div>
          ) : dataUrl ? (
            <iframe
              src={dataUrl}
              title="PDF Preview"
              className="w-full h-full bg-white rounded-xl shadow-lg border border-zinc-300"
              style={{ minHeight: '380px' }}
            />
          ) : (
            <div className="text-xs text-zinc-500">Preview not available</div>
          )}
        </div>
      </div>
    </div>
  );
});

PdfPreviewModal.displayName = 'PdfPreviewModal';

const STARTER_PROMPTS: Record<'student' | 'teacher' | 'admin', Array<{ label: string; text: string; icon: any; tone?: string }>> = {
  student: [
    {
      label: "Explain Newton's Third Law",
      text: "Explain Newton's third law of motion with everyday Pakistani examples and simple formula derivations.",
      icon: Lightbulb,
      tone: 'neutral',
    },
    {
      label: 'Balance Chemical Equations',
      text: 'Help me understand step-by-step how to balance chemical equations with examples from our syllabus.',
      icon: BookOpen,
      tone: 'neutral',
    },
    {
      label: 'Mitosis vs Meiosis Summary',
      text: 'Explain the key differences between mitosis and meiosis in clear bullet points for exam revision.',
      icon: BookOpen,
      tone: 'neutral',
    },
    {
      label: '5-Day Board Exam Schedule',
      text: 'Create a 5-day study revision plan for upcoming Matric board exams balancing science and languages.',
      icon: GraduationCap,
      tone: 'neutral',
    },
  ],
  teacher: [
    {
      label: 'Biology Chapter 3 Quiz (PDF)',
      text: 'Create a 5-question MCQ quiz on Biology Chapter 3 for Grade 9 with answer key and make this a PDF.',
      icon: FileQuestion,
      tone: 'neutral',
    },
    {
      label: 'Genetics Worksheet (Tt × Tt)',
      text: 'Generate a Grade 10 Genetics worksheet on Mendel monohybrid cross (Tt × Tt) with Punnett square table and export as PDF.',
      icon: Lightbulb,
      tone: 'neutral',
    },
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
            ? `Hello **${profile?.full_name || 'Professor'}**! I am **Sage**, your faculty assistant. Ask me for lesson preparation, quiz questions, syllabus breakdowns, voice notes, or export quizzes and notes directly into formatted printable PDFs!`
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
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [voiceMenuOpen, setVoiceMenuOpen] = useState(false);
  const [headerVoices, setHeaderVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ suggestionsCollapsed, setSuggestionsCollapsed] = useState(false);
  const [activeModelId, setActiveModelId] = useState<string>(SAGE_AI_MODELS.PRIMARY);
  const overflowMenuRef = useRef<HTMLDivElement>(null);
  const voiceMenuRef = useRef<HTMLDivElement>(null);

  // ── Voice Recording State ──
  const [isRecording, setIsRecording] = useState(false);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
  const [recordingLevel, setRecordingLevel] = useState(0);
  const [audioPreviewResult, setAudioPreviewResult] = useState<AudioRecordingResult | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastSentPrompt, setLastSentPrompt] = useState<string>('');

  // ── PDF Generation & Preview State ──
  const [generatingPdfMsgId, setGeneratingPdfMsgId] = useState<string | null>(null);
  const [sharingPdfMsgId, setSharingPdfMsgId] = useState<string | null>(null);
  const [isExportingConversationPdf, setIsExportingConversationPdf] = useState(false);
  const [isSharingConversationPdf, setIsSharingConversationPdf] = useState(false);
  const [pdfMenuMsgId, setPdfMenuMsgId] = useState<string | null>(null);
  const [pdfPreviewModal, setPdfPreviewModal] = useState<{
    isOpen: boolean;
    rawContent: string;
    filename: string;
    totalPages: number;
    dataUrl?: string;
    loading?: boolean;
    mode: 'student' | 'teacher';
    hasAnswers: boolean;
  }>({
    isOpen: false,
    rawContent: '',
    filename: '',
    totalPages: 1,
    mode: 'teacher',
    hasAnswers: false,
  });

  // ── Text-to-Speech (TTS) & Shared Avatar State Controller ──
  const [speechStatus, setSpeechStatus] = useState<SpeechPlaybackStatus>('idle');
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [speechSpeed, setSpeechSpeed] = useState<SpeechSpeed>(1);
  const [speechVolume, setSpeechVolume] = useState<number>(0);

  // ── Live Thought Bubble State ──
  const [currentThoughtText, setCurrentThoughtText] = useState<string | null>(null);
  const [currentThoughtMode, setCurrentThoughtMode] = useState<
    'typing' | 'thinking' | 'streaming' | 'done' | 'idle' | null
  >(null);
  const [isThoughtTyping, setIsThoughtTyping] = useState(false);
  const [streamingSnippet, setStreamingSnippet] = useState<string>('');
  const typingDebounceTimerRef = useRef<number | null>(null);
  const thoughtHideTimerRef = useRef<number | null>(null);
  const prevStreamingTokensRef = useRef<boolean>(false);

  const isStreamingTokens = Boolean(
    streamingId && messages.find((m) => m.id === streamingId)?.content
  );
  const isWaitingForFirstToken =
    (isLoading && !isStreamingTokens) || isTranscribing;

  // While user types OR while answer is streaming in, avatar is typing on its pad
  const isWritingOrTyping =
    (input.trim().length > 0 && !isLoading && !isRecording) || isStreamingTokens;

  const avatarController = useSageAvatarController({
    isTyping: isWritingOrTyping,
    isRecording,
    isThinking: isWaitingForFirstToken,
    isSpeaking: speechStatus === 'playing',
    audioLevel:
      speechStatus === 'playing'
        ? speechVolume
        : isRecording
        ? recordingLevel
        : isStreamingTokens
        ? 0.45
        : 0,
    userId: profile?.id,
  });

  const activeModelDisplayName = formatSageModelLabel(activeModelId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const voiceRecorderRef = useRef<SageVoiceRecorder | null>(null);
  const previewAudioElRef = useRef<HTMLAudioElement | null>(null);

  const [headerVoicePref, setHeaderVoicePref] = useState<AvatarVoicePreference>(() =>
    sageSpeech.getAvatarVoicePref(avatarController.characterId)
  );

  useEffect(() => {
    sageSpeech.setActiveCharacter(avatarController.characterId);
    setHeaderVoicePref(sageSpeech.getAvatarVoicePref(avatarController.characterId));
  }, [avatarController.characterId]);

  useEffect(() => {
    let mounted = true;
    sageSpeech.ensureVoicesLoaded().then((loaded) => {
      if (mounted) setHeaderVoices(loaded);
    });
    const unsub = sageSpeech.onVoicesReady((loaded) => {
      if (mounted) setHeaderVoices([...loaded]);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  // Keep welcome message synchronized with custom Sage display name
  useEffect(() => {
    const nameLabel = avatarController.displayName || 'Sage';
    setMessages((prev) =>
      prev.map((m) => {
        if (!m.id.startsWith('welcome-')) return m;
        return {
          ...m,
          content:
            role === 'teacher'
              ? `Hello **${profile?.full_name || 'Professor'}**! I am **${nameLabel}**, your faculty assistant. Ask me for lesson preparation, quiz questions, syllabus breakdowns, voice notes, or export quizzes and notes directly into formatted printable PDFs!`
              : role === 'admin'
              ? `Greetings **${profile?.full_name || 'Administrator'}**! I am **${nameLabel}**, your administrative AI assistant with real-time live database access. Ask me about live student counts, board/grade distributions, faculty rosters, active offerings, test submissions, fee configurations, or drafting academic notices!`
              : `Assalam-o-Alaikum **${profile?.full_name || 'Student'}**! 🌟 I'm **${nameLabel}**, your AI study companion for SHS Virtual Academy. Ask me anything about your FBISE subjects (Math, Physics, Chemistry, Biology, CS, English, Urdu, etc.), formula derivations, or note summaries!`,
        };
      })
    );
  }, [avatarController.displayName, role, profile?.full_name]);

  // Close header overflow menu & voice menu on outside click
  useEffect(() => {
    if (!overflowMenuOpen && !voiceMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(e.target as Node)) {
        setOverflowMenuOpen(false);
      }
      if (voiceMenuRef.current && !voiceMenuRef.current.contains(e.target as Node)) {
        setVoiceMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [overflowMenuOpen, voiceMenuOpen]);

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

  // Cleanup voice preview URL and TTS on unmount
  useEffect(() => {
    sageSpeech.setCallbacks({
      onStatusChange: (status, msgId, errText) => {
        setSpeechStatus(status);
        setSpeakingMsgId(status === 'idle' ? null : msgId);
        if (status === 'error' && errText) {
          toast.error(errText);
        }
      },
      onVolumeChange: (vol) => {
        setSpeechVolume(vol);
      },
      onNotice: (noticeText) => {
        toast.info(noticeText);
      },
    });
    return () => {
      sageSpeech.stop();
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  // Handle preview audio element events
  useEffect(() => {
    if (!audioPreviewUrl) {
      if (previewAudioElRef.current) {
        previewAudioElRef.current.pause();
        previewAudioElRef.current = null;
      }
      setPreviewPlaying(false);
      setPreviewTime(0);
      return;
    }

    const audio = new Audio(audioPreviewUrl);
    previewAudioElRef.current = audio;

    audio.onended = () => {
      setPreviewPlaying(false);
      setPreviewTime(0);
    };

    audio.ontimeupdate = () => {
      setPreviewTime(audio.currentTime);
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioPreviewUrl]);

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
        avatarController.triggerSuccess();
      } else {
        toast.error(data.error || 'Failed to sync notes');
        avatarController.triggerError();
      }
    } catch {
      toast.info('Knowledge base sync requested.');
    } finally {
      setIsSyncingNotes(false);
    }
  };

  // Derive current overall Sage emotional state for thumbnail
  const latestAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
  const activeEmotion: SageEmotion = isLoading
    ? 'thinking'
    : latestAssistantMsg
    ? detectSageEmotion(latestAssistantMsg.content, false, role)
    : 'idle';

  // Scroll to bottom smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isTranscribing]);

  // Auto-resize textarea & debounced live thought reactions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }

    if (val.trim().length > 0) {
      avatarController.wakeUp();
      setIsThoughtTyping(true);
      if (typingDebounceTimerRef.current !== null) {
        window.clearTimeout(typingDebounceTimerRef.current);
      }
      if (thoughtHideTimerRef.current !== null) {
        window.clearTimeout(thoughtHideTimerRef.current);
      }

      typingDebounceTimerRef.current = window.setTimeout(() => {
        const cat = detectThoughtCategory(val);
        const line = getThoughtReactionLine(avatarController.characterId, cat);
        setCurrentThoughtText(line);
        setCurrentThoughtMode('typing');
        setIsThoughtTyping(false);

        // Hide bubble after 4.5 seconds if user stops typing
        thoughtHideTimerRef.current = window.setTimeout(() => {
          setCurrentThoughtText(null);
          setCurrentThoughtMode(null);
        }, 4500);
      }, 260);
    } else {
      setIsThoughtTyping(false);
      setCurrentThoughtText(null);
      setCurrentThoughtMode(null);
    }
  };

  // Rotate thinking thought lines while waiting for first token
  useEffect(() => {
    if (!isWaitingForFirstToken) return;
    const interval = window.setInterval(() => {
      setCurrentThoughtText(getThinkingThoughtLine(avatarController.characterId));
    }, 2800);
    return () => window.clearInterval(interval);
  }, [isWaitingForFirstToken, avatarController.characterId]);

  // Update streaming snippet while answer is streaming in
  useEffect(() => {
    if (isStreamingTokens && streamingId) {
      const streamingMsg = messages.find((m) => m.id === streamingId);
      if (streamingMsg?.content) {
        setCurrentThoughtMode('streaming');
        const words = streamingMsg.content.trim().split(/\s+/);
        const lastWords = words.slice(-7).join(' ');
        setStreamingSnippet(lastWords);
        setCurrentThoughtText('Penning the solution...');
      }
    }
  }, [isStreamingTokens, streamingId, messages]);

  // Completion happy nod and line when answer finishes streaming
  useEffect(() => {
    if (prevStreamingTokensRef.current && !isStreamingTokens && !isLoading) {
      avatarController.triggerNod();
      setCurrentThoughtMode('done');
      setCurrentThoughtText(getCompletionThoughtLine(avatarController.characterId));
      setStreamingSnippet('');
      if (thoughtHideTimerRef.current !== null) {
        window.clearTimeout(thoughtHideTimerRef.current);
      }
      thoughtHideTimerRef.current = window.setTimeout(() => {
        setCurrentThoughtText(null);
        setCurrentThoughtMode(null);
      }, 4200);
    }
    prevStreamingTokensRef.current = isStreamingTokens;
  }, [isStreamingTokens, isLoading, avatarController]);

  // Rare calm study tip thought bubble during idle (every ~45s)
  useEffect(() => {
    if (isLoading || isRecording || input.trim().length > 0) return;
    const idleInterval = window.setInterval(() => {
      if (!isLoading && !isRecording && input.trim().length === 0) {
        setCurrentThoughtMode('idle');
        setCurrentThoughtText(getIdleThoughtLine(avatarController.characterId));
        if (thoughtHideTimerRef.current !== null) {
          window.clearTimeout(thoughtHideTimerRef.current);
        }
        thoughtHideTimerRef.current = window.setTimeout(() => {
          setCurrentThoughtText(null);
          setCurrentThoughtMode(null);
        }, 5000);
      }
    }, 45000);
    return () => window.clearInterval(idleInterval);
  }, [isLoading, isRecording, input, avatarController.characterId]);

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

  // ── Voice Message Handling ──
  const startVoiceRecording = async () => {
    try {
      const recorder = new SageVoiceRecorder();
      voiceRecorderRef.current = recorder;

      setRecordingElapsedMs(0);
      setRecordingLevel(0);
      setIsRecording(true);

      await recorder.startRecording({
        onTimeUpdate: (elapsed) => {
          setRecordingElapsedMs(elapsed);
        },
        onLevelUpdate: (level) => {
          setRecordingLevel(level);
        },
        onMaxDurationReached: () => {
          toast.info('2-minute maximum recording limit reached.');
          stopVoiceRecordingToPreview();
        },
      });
    } catch (err: any) {
      console.error('Microphone recording error:', err);
      setIsRecording(false);
      voiceRecorderRef.current = null;
      toast.error(err.message || 'Microphone access was denied. Please allow microphone permission in your browser address bar.');
    }
  };

  const cancelVoiceRecording = () => {
    if (voiceRecorderRef.current) {
      voiceRecorderRef.current.cancelRecording();
      voiceRecorderRef.current = null;
    }
    setIsRecording(false);
    setRecordingElapsedMs(0);
    setRecordingLevel(0);
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
    setAudioPreviewResult(null);
  };

  const stopVoiceRecordingToPreview = async () => {
    if (!voiceRecorderRef.current) return;
    try {
      const result = await voiceRecorderRef.current.stopRecording();
      voiceRecorderRef.current = null;
      setIsRecording(false);

      const url = URL.createObjectURL(result.blob);
      setAudioPreviewResult(result);
      setAudioPreviewUrl(url);
    } catch (err: any) {
      console.error('Stop recording error:', err);
      setIsRecording(false);
      voiceRecorderRef.current = null;
      toast.error(err.message || "I couldn't hear anything, please try again.");
    }
  };

  const sendVoiceRecording = async () => {
    let result = audioPreviewResult;

    if (!result && voiceRecorderRef.current) {
      try {
        result = await voiceRecorderRef.current.stopRecording();
        voiceRecorderRef.current = null;
        setIsRecording(false);
      } catch (err: any) {
        setIsRecording(false);
        voiceRecorderRef.current = null;
        toast.error(err.message || "I couldn't hear anything, please try again.");
        return;
      }
    }

    if (!result) return;

    // Discard preview state
    const url = audioPreviewUrl || URL.createObjectURL(result.blob);
    setAudioPreviewResult(null);
    setAudioPreviewUrl(null);

    setIsTranscribing(true);

    try {
      const transcript = await transcribeAudioWithGemini(
        result.base64,
        result.mimeType,
        session?.access_token
      );

      const cleanTranscript = (transcript || '').trim();
      if (!cleanTranscript) {
        toast.error("I couldn't hear anything, please try again.");
        return;
      }

      // Execute chat send with audio metadata attached to the user message
      await handleSend(cleanTranscript, {
        blobUrl: url,
        durationSeconds: result.durationSeconds,
        transcript: cleanTranscript,
        mimeType: result.mimeType,
      });
    } catch (transcribeErr: any) {
      console.error('[Sage Voice Transcription Error]:', transcribeErr);
      const raw = transcribeErr?.message || '';
      const isUnavailable =
        raw.includes('temporarily unavailable') ||
        raw.includes('404') ||
        raw.includes('NOT_FOUND') ||
        raw.includes('no longer available') ||
        raw.includes('"error"') ||
        raw.includes('models/') ||
        raw.startsWith('{');
      if (isUnavailable) {
        toast.error('Sage is temporarily unavailable. Please try again in a moment.');
      } else {
        toast.error(raw || "I couldn't hear anything, please try again.");
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  // ── TTS Controls ──
  const handleToggleSpeak = async (msgId: string, content: string) => {
    if (speakingMsgId === msgId) {
      if (speechStatus === 'playing') {
        sageSpeech.pause();
        return;
      }
      if (speechStatus === 'paused') {
        sageSpeech.resume();
        return;
      }
    }
    await sageSpeech.speak(msgId, content, avatarController.characterId);
  };

  const handleStopSpeak = () => {
    sageSpeech.stop();
  };

  const handleCycleSpeechSpeed = () => {
    const speeds: SpeechSpeed[] = [0.75, 1, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(speechSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setSpeechSpeed(nextSpeed);
    sageSpeech.setSpeed(nextSpeed);
    setHeaderVoicePref(sageSpeech.getAvatarVoicePref(avatarController.characterId));
    toast.info(`Playback speed: ${nextSpeed}x`);
  };

  // ── PDF Generation & Sharing Helpers ──
  const handleDownloadPdf = async (rawContent: string, mode: 'student' | 'teacher' = 'teacher', msgId?: string) => {
    const effectiveMode = role === 'student' ? 'student' : mode;

    if (msgId) setGeneratingPdfMsgId(msgId);
    try {
      const filename = await downloadSagePdf(rawContent, {
        teacherName: profile?.full_name || `${avatarController.displayName} Tutor`,
        sageName: avatarController.displayName,
        mode: effectiveMode,
      });
      toast.success(`Downloaded: ${filename}`);
      setPdfMenuMsgId(null);
      avatarController.triggerSuccess();
    } catch (err: any) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF. Please try again.');
      avatarController.triggerError();
    } finally {
      if (msgId) setGeneratingPdfMsgId(null);
    }
  };

  const handleSharePdf = async (rawContent: string, mode: 'student' | 'teacher' = 'teacher', msgId?: string) => {
    const effectiveMode = role === 'student' ? 'student' : mode;
    if (msgId) setSharingPdfMsgId(msgId);
    try {
      const result = await generateSageContentPdf(rawContent, {
        teacherName: profile?.full_name || `${avatarController.displayName} Tutor`,
        sageName: avatarController.displayName,
        mode: effectiveMode,
      });
      const shareOutcome = await shareSagePdfBlob(result.blob, result.filename, result.filename);
      revokeSagePdfUrl(result.dataUrl);
      if (shareOutcome.shared) {
        toast.success('Shared PDF document!');
      } else {
        toast.success(`Saved ${result.filename} — ready to attach on WhatsApp or Email!`);
      }
      setPdfMenuMsgId(null);
      avatarController.triggerSuccess();
    } catch (err: any) {
      console.error('PDF share error:', err);
      toast.error('Could not share PDF. Please try downloading instead.');
      avatarController.triggerError();
    } finally {
      if (msgId) setSharingPdfMsgId(null);
    }
  };

  const handleDownloadConversationPdf = async () => {
    if (messages.length === 0 || isExportingConversationPdf) return;
    setIsExportingConversationPdf(true);
    try {
      const effectiveMode = role === 'student' ? 'student' : 'teacher';
      const result = await generateSageConversationPdf(messages, {
        teacherName: profile?.full_name || `${avatarController.displayName} Tutor`,
        sageName: avatarController.displayName,
        mode: effectiveMode,
        topic: `${avatarController.displayName} Study Session Transcript`,
      });
      await triggerPdfBlobDownload(result.blob, result.filename);
      revokeSagePdfUrl(result.dataUrl);
      toast.success(`Downloaded Conversation PDF: ${result.filename}`);
      avatarController.triggerSuccess();
    } catch (err: any) {
      console.error('Conversation PDF error:', err);
      toast.error('Failed to export conversation PDF.');
      avatarController.triggerError();
    } finally {
      setIsExportingConversationPdf(false);
    }
  };

  const handleShareConversationPdf = async () => {
    if (messages.length === 0 || isSharingConversationPdf) return;
    setIsSharingConversationPdf(true);
    try {
      const effectiveMode = role === 'student' ? 'student' : 'teacher';
      const result = await generateSageConversationPdf(messages, {
        teacherName: profile?.full_name || `${avatarController.displayName} Tutor`,
        sageName: avatarController.displayName,
        mode: effectiveMode,
        topic: `${avatarController.displayName} Study Session Transcript`,
      });
      const outcome = await shareSagePdfBlob(
        result.blob,
        result.filename,
        `${avatarController.displayName} Study Session Transcript`
      );
      revokeSagePdfUrl(result.dataUrl);
      if (outcome.shared) {
        toast.success('Shared conversation PDF!');
      } else {
        toast.success(`Saved ${result.filename} — ready to send via WhatsApp or Email!`);
      }
      avatarController.triggerSuccess();
    } catch (err: any) {
      console.error('Conversation PDF share error:', err);
      toast.error('Failed to share conversation PDF.');
      avatarController.triggerError();
    } finally {
      setIsSharingConversationPdf(false);
    }
  };

  const handleOpenPdfPreview = async (rawContent: string, initialMode: 'student' | 'teacher' = 'teacher') => {
    // Strict role enforcement in code: students can NEVER preview teacher copy with solutions
    const effectiveMode = role === 'student' ? 'student' : initialMode;
    const hasAnswers = role === 'student' ? false : hasAnswerKeyOrSolutions(rawContent);
    const meta = extractAcademicMetadata(rawContent, profile?.full_name);
    const filename = `${meta.subject || 'Scholario'}_${meta.className || 'Academic'}_${effectiveMode === 'student' ? 'Student' : 'Teacher'}.pdf`;

    // Revoke any previous preview Object URL to prevent memory leaks
    if (pdfPreviewModal.dataUrl) {
      revokeSagePdfUrl(pdfPreviewModal.dataUrl);
    }

    setPdfPreviewModal({
      isOpen: true,
      rawContent,
      filename,
      totalPages: 1,
      mode: effectiveMode,
      hasAnswers,
      loading: true,
    });

    try {
      const result = await generateSageContentPdf(rawContent, {
        teacherName: profile?.full_name || 'Faculty Mentor',
        sageName: avatarController.displayName,
        mode: effectiveMode,
      });
      setPdfPreviewModal((prev) => ({
        ...prev,
        filename: result.filename,
        dataUrl: result.dataUrl,
        totalPages: result.totalPages,
        loading: false,
      }));
    } catch (err) {
      console.error('PDF preview error:', err);
      toast.error('Could not generate PDF preview.');
      setPdfPreviewModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleTogglePreviewMode = async (newMode: 'student' | 'teacher') => {
    // Students can NEVER toggle to teacher mode
    if (role === 'student') return;

    if (pdfPreviewModal.dataUrl) {
      revokeSagePdfUrl(pdfPreviewModal.dataUrl);
    }

    setPdfPreviewModal((prev) => ({ ...prev, mode: newMode, loading: true }));
    try {
      const result = await generateSageContentPdf(pdfPreviewModal.rawContent, {
        teacherName: profile?.full_name || 'Faculty Mentor',
        mode: newMode,
      });
      setPdfPreviewModal((prev) => ({
        ...prev,
        filename: result.filename,
        dataUrl: result.dataUrl,
        totalPages: result.totalPages,
        loading: false,
      }));
    } catch {
      setPdfPreviewModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // ── Main Chat Send Handler ──
  const handleSend = async (userText?: string, voiceAudio?: ChatAudioData) => {
    const textToSend = (userText !== undefined ? userText : input).trim();
    if ((!textToSend && !pendingAttachment && !voiceAudio) || isLoading) return;

    if (textToSend) {
      setLastSentPrompt(textToSend);
      const detectedCat = detectThoughtCategory(textToSend);
      setCurrentThoughtMode('thinking');
      setCurrentThoughtText(getThinkingThoughtLine(avatarController.characterId, detectedCat));
      setIsThoughtTyping(false);
    }
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
      audio: voiceAudio,
    };

    const isPdfQuery = detectPdfRequest(textToSend);

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
    avatarController.triggerNod();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
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
        throw new Error(errorData.error || `Server responded with HTTP ${res.status}`);
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
            if (parsed.model && typeof parsed.model === 'string') {
              setActiveModelId(parsed.model);
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
              // Ignore incomplete lines
            } else if (parseErr.message) {
              throw parseErr;
            }
          }
        }
      }

      // Check if finished response should attach PDF card
      const finalContent = accumulatedText.trim();
      const hasAcademic = hasAcademicContent(finalContent);
      const shouldCard = isPdfQuery || hasAcademic;

      if (shouldCard) {
        const meta = extractAcademicMetadata(finalContent, profile?.full_name);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  pdfCard: {
                    title: meta.topic || 'Academic Resource',
                    subject: meta.subject || 'Scholario',
                    className: meta.className || 'Grade 9-12',
                    docType: meta.docType || 'general',
                    hasAnswers: hasAnswerKeyOrSolutions(finalContent),
                  },
                }
              : msg
          )
        );
      }
      avatarController.triggerSuccess();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[Sage Chat] Stream cancelled by user');
        return;
      }
      console.error('[Sage Chat Frontend Error]:', err);
      const rawMsg = typeof err?.message === 'string' ? err.message.trim() : '';
      let specificMsg = 'Could not reach Sage. Check your connection and try again.';
      if (rawMsg && !rawMsg.startsWith('{') && rawMsg.length < 220) {
        specificMsg = rawMsg;
      } else if (/429|quota|rate/i.test(rawMsg)) {
        specificMsg = 'Sage is busy right now (rate limit reached). Please wait a few seconds and tap Retry.';
      }
      setErrorMsg(specificMsg);
      toast.error(specificMsg);
      avatarController.triggerError();
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

  // Helper formatting for live timer
  const formatTimer = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isConversationStarted = messages.length > 1;
  const greetingName =
    profile?.full_name?.split(' ')[0] ||
    (role === 'teacher' ? 'Professor' : role === 'admin' ? 'Admin' : 'there');

  return (
    <SageAvatarStateProvider value={avatarController}>
      <div
        className={
          embedded
            ? 'flex flex-col h-full w-full bg-[#FAFAFA] dark:bg-[#0E0E11] overflow-hidden'
            : 'flex flex-col h-[calc(100vh-140px)] min-h-[580px] max-w-5xl mx-auto bg-[#FAFAFA] dark:bg-[#0E0E11] rounded-3xl border border-[#E5E5E5] dark:border-[#27272A] shadow-xs overflow-hidden'
        }
      >
        {/* ── Clean Single-Row Top Header ── */}
        <div className="bg-[#111111] px-3.5 sm:px-5 py-2.5 text-white flex items-center justify-between gap-2 border-b border-[#242428] shrink-0">
          {/* Left: Back Button, Hamburger Avatar Picker Button, Frameless Live-Animated Avatar Thumbnail, Custom/Default Name + Profile Drawer Trigger */}
          <div className="flex items-center gap-2.5 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-9 h-9 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white shrink-0 transition-colors flex items-center justify-center cursor-pointer"
                title="Back"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            {/* Three-line Hamburger Menu Button to Open "Choose your Sage" Character Picker */}
            <button
              type="button"
              id="choose-sage-avatar-btn"
              onClick={() => setAvatarPickerOpen(true)}
              className="w-9 h-9 rounded-xl bg-[#1E1E22] hover:bg-[#2A2A30] text-zinc-200 hover:text-[#F4C430] border border-[#2E2E34] shrink-0 transition-colors flex items-center justify-center cursor-pointer"
              title="Choose your Sage character (9 companions)"
              aria-label="Choose your Sage character"
            >
              <Menu size={17} />
            </button>

            <SageAvatar
              emotion={activeEmotion}
              avatarState={avatarController.state}
              characterId={avatarController.characterId}
              customName={avatarController.displayName}
              headerCanvasRef={avatarController.headerCanvasRef}
              size="sm"
              interactive={true}
              onClick={() => setProfilePanelOpen(true)}
            />

            <button
              type="button"
              data-testid="sage-header-profile-trigger"
              onClick={() => setProfilePanelOpen(true)}
              className="min-w-0 text-left group cursor-pointer focus:outline-none"
              title="Click to open Sage Profile, Rename & Voice settings"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <h1 className="text-[15px] sm:text-base font-extrabold tracking-tight text-white group-hover:text-[#F4C430] transition-colors truncate">
                  {avatarController.displayName}
                </h1>
                <Pencil
                  size={12}
                  className="text-zinc-400 group-hover:text-[#F4C430] shrink-0 transition-colors"
                />
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide bg-white/8 text-zinc-300 border border-white/10 shrink-0"
                  title={`${role === 'admin' ? 'Admin' : role === 'teacher' ? 'Teacher' : 'Student'} mode • ${activeModelDisplayName}`}
                >
                  {role === 'admin' ? 'Admin' : role === 'teacher' ? 'Teacher' : 'Student'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight truncate mt-0.5">
                {avatarController.headerStatusText}
              </p>
            </button>
          </div>

          {/* Right: Top Voice Selector Dropdown, Profile Button, PDF Actions + "⋯" Overflow Menu */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Top-of-Window Voice Selector Popover (Task 2) */}
            <div className="relative" ref={voiceMenuRef}>
              <button
                type="button"
                data-testid="sage-header-voice-btn"
                onClick={() => {
                  setHeaderVoicePref(sageSpeech.getAvatarVoicePref(avatarController.characterId));
                  setVoiceMenuOpen((v) => !v);
                }}
                className="h-9 px-2.5 rounded-xl bg-[#1E1E22] hover:bg-[#2A2A30] text-zinc-200 hover:text-[#F4C430] flex items-center gap-1.5 transition-colors border border-[#2E2E34] text-xs font-bold cursor-pointer"
                title={`Voice settings for ${avatarController.displayName}`}
              >
                <Volume2 size={14} className="text-[#F4C430]" />
                <span className="hidden md:inline">Voice</span>
              </button>

              {voiceMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 rounded-2xl bg-[#18181C] text-zinc-100 border border-[#2E2E36] shadow-2xl p-3.5 z-40 space-y-3 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <Volume2 size={13} className="text-[#F4C430]" />
                      {avatarController.displayName} Voice
                    </span>
                    <button
                      type="button"
                      data-testid="sage-header-voice-preview-btn"
                      onClick={() =>
                        sageSpeech.previewVoice(
                          avatarController.characterId,
                          avatarController.displayName
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#F4C430] hover:bg-[#e5b625] text-black text-[11px] font-extrabold cursor-pointer"
                    >
                      Preview
                    </button>
                  </div>

                  <div>
                    <select
                      data-testid="sage-header-voice-select"
                      value={headerVoicePref.voiceURI || ''}
                      onChange={(e) => {
                        const updated = sageSpeech.setAvatarVoicePref(
                          avatarController.characterId,
                          { voiceURI: e.target.value || undefined }
                        );
                        setHeaderVoicePref({ ...updated });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-[#F4C430]"
                    >
                      <option value="">
                        Auto ({sageSpeech.resolveVoiceForAvatar(avatarController.characterId, false).voice?.name || 'Default'})
                      </option>
                      {headerVoices.map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                        <span className="flex items-center gap-1">
                          <Sliders size={10} /> Speed
                        </span>
                        <span className="font-mono font-bold text-[#F4C430]">
                          {headerVoicePref.rate.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.6}
                        max={1.5}
                        step={0.05}
                        value={headerVoicePref.rate}
                        onChange={(e) => {
                          const updated = sageSpeech.setAvatarVoicePref(
                            avatarController.characterId,
                            { rate: parseFloat(e.target.value) }
                          );
                          setHeaderVoicePref({ ...updated });
                        }}
                        className="w-full accent-[#F4C430] cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                        <span className="flex items-center gap-1">
                          <Sliders size={10} /> Pitch
                        </span>
                        <span className="font-mono font-bold text-[#F4C430]">
                          {headerVoicePref.pitch.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.7}
                        max={1.35}
                        step={0.03}
                        value={headerVoicePref.pitch}
                        onChange={(e) => {
                          const updated = sageSpeech.setAvatarVoicePref(
                            avatarController.characterId,
                            { pitch: parseFloat(e.target.value) }
                          );
                          setHeaderVoicePref({ ...updated });
                        }}
                        className="w-full accent-[#F4C430] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile & Rename Drawer Trigger Button */}
            <button
              type="button"
              data-testid="sage-header-profile-btn"
              onClick={() => setProfilePanelOpen(true)}
              className="h-9 px-2.5 rounded-xl bg-[#1E1E22] hover:bg-[#2A2A30] text-zinc-200 hover:text-[#F4C430] flex items-center gap-1.5 transition-colors border border-[#2E2E34] text-xs font-bold cursor-pointer"
              title="Open Companion Profile & Rename"
            >
              <User size={14} className="text-[#F4C430]" />
              <span className="hidden sm:inline">Profile</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadConversationPdf}
              disabled={isExportingConversationPdf || isLoading || messages.length === 0}
              className="w-9 h-9 rounded-xl bg-[#1E1E22] hover:bg-[#2A2A30] text-[#F4C430] flex items-center justify-center transition-colors border border-[#2E2E34] disabled:opacity-40 cursor-pointer"
              title="Chat PDF — Download full conversation as A4 PDF"
              aria-label="Download Chat PDF"
            >
              {isExportingConversationPdf ? (
                <Loader2 size={15} className="animate-spin text-[#F4C430]" />
              ) : (
                <FileDown size={15} />
              )}
            </button>

            <button
              type="button"
              onClick={handleShareConversationPdf}
              disabled={isSharingConversationPdf || isLoading || messages.length === 0}
              className="w-9 h-9 rounded-xl bg-[#1E1E22] hover:bg-[#2A2A30] text-zinc-300 hover:text-white flex items-center justify-center transition-colors border border-[#2E2E34] disabled:opacity-40 cursor-pointer"
              title="Share PDF — Share or send conversation PDF"
              aria-label="Share Chat PDF"
            >
              {isSharingConversationPdf ? (
                <Loader2 size={15} className="animate-spin text-[#F4C430]" />
              ) : (
                <Share2 size={15} />
              )}
            </button>

            {/* "⋯" Overflow Menu */}
            <div className="relative" ref={overflowMenuRef}>
              <button
                type="button"
                onClick={() => setOverflowMenuOpen((prev) => !prev)}
                className="w-9 h-9 rounded-xl bg-[#1E1E22] hover:bg-[#2A2A30] text-zinc-300 hover:text-white flex items-center justify-center transition-colors border border-[#2E2E34] cursor-pointer"
                title="More options"
                aria-label="More options"
                aria-expanded={overflowMenuOpen}
              >
                <MoreHorizontal size={16} />
              </button>

              {overflowMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 rounded-2xl bg-[#18181C] text-zinc-200 border border-[#2E2E36] shadow-2xl p-1.5 z-40 animate-in fade-in slide-in-from-top-1">
                  {/* Quiet Model & RAG Info Section */}
                  <div className="px-3 py-2 border-b border-[#27272F] mb-1">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>AI Engine</span>
                      <span className="font-semibold text-zinc-200">{activeModelDisplayName}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Database size={11} className="text-[#F4C430]" />
                        <span>Knowledge Base</span>
                      </span>
                      <span className="font-semibold text-zinc-200">RAG Note Vault</span>
                    </div>
                  </div>

                  {/* Open Companion Profile & Rename */}
                  <button
                    type="button"
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      setProfilePanelOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-white/8 transition-colors cursor-pointer text-left"
                  >
                    <Pencil size={14} className="text-[#F4C430] shrink-0" />
                    <span>Profile, Rename & Voice ({avatarController.displayName})</span>
                  </button>

                  {/* Choose Your Sage Character */}
                  <button
                    type="button"
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      setAvatarPickerOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-white/8 transition-colors cursor-pointer text-left"
                  >
                    <Smile size={14} className="text-[#F4C430] shrink-0" />
                    <span>Choose your Sage (9 Avatars)</span>
                  </button>

                  {/* Sync Note Vault (Teachers & Admins) */}
                  {(role === 'admin' || role === 'teacher') && (
                    <button
                      type="button"
                      id="sync-note-vault-btn"
                      onClick={() => {
                        setOverflowMenuOpen(false);
                        handleSyncNotes();
                      }}
                      disabled={isSyncingNotes}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-white/8 transition-colors disabled:opacity-50 cursor-pointer text-left"
                    >
                      <RefreshCw
                        size={14}
                        className={isSyncingNotes ? 'animate-spin text-[#F4C430] shrink-0' : 'text-[#F4C430] shrink-0'}
                      />
                      <span>{isSyncingNotes ? 'Syncing Note Vault...' : 'Sync RAG Note Vault'}</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-[#27272F]" />

                  {/* Reset Session */}
                  <button
                    type="button"
                    id="clear-chat-btn"
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      setConfirmClearOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                  >
                    <RotateCcw size={14} className="shrink-0" />
                    <span>Reset Chat Session</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Slim Dismissible Page Context Strip ── */}
        {activePageContext && (
          <div className="bg-amber-50/80 dark:bg-amber-950/25 border-b border-amber-200/70 dark:border-amber-800/40 px-3.5 sm:px-5 py-1.5 flex items-center justify-between gap-2 text-[11px] text-amber-900 dark:text-amber-200 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <Compass size={12} className="text-amber-700 dark:text-amber-400 shrink-0" />
              <span className="font-semibold truncate">{activePageContext.title}</span>
              {activePageContext.summary && (
                <span className="hidden md:inline text-amber-700/80 dark:text-amber-300/70 truncate">
                  · {activePageContext.summary}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  handleSend(`Can you guide me on what I'm looking at on the ${activePageContext.title} page?`)
                }
                className="px-2 py-0.5 rounded-md bg-amber-200/75 dark:bg-amber-900/50 hover:bg-amber-300/80 text-amber-950 dark:text-amber-100 font-semibold transition-colors cursor-pointer"
              >
                Ask about screen
              </button>
              <button
                type="button"
                onClick={() => setActivePageContext(null)}
                className="p-0.5 hover:bg-amber-200/70 dark:hover:bg-amber-900/50 rounded text-amber-700 dark:text-amber-300 transition-colors cursor-pointer"
                title="Dismiss page context"
                aria-label="Dismiss page context"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* ── Main Chat Body (Floating Centered Avatar + Masked Scrollable Message List) ── */}
        <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden bg-[#FAFAFA] dark:bg-[#0E0E11]">
          {/* ── Pinned Avatar Layer (Exact Horizontal Center of Sage Panel, ~30% Bigger, Frameless & Transparent) ── */}
          <div className="absolute top-0 inset-x-0 z-20 flex flex-col items-center justify-center pt-1.5 pointer-events-none bg-transparent border-0 shadow-none">
            <Sage3DAvatar
              state={avatarController.state}
              characterId={avatarController.characterId}
              customName={avatarController.displayName}
              headerCanvasRef={avatarController.headerCanvasRef}
              audioLevel={avatarController.audioLevel}
              compact={isConversationStarted}
              greetingTitle={`Hi ${greetingName}, I'm ${avatarController.displayName}!`}
              statusLabel={avatarController.stageCaption}
              onPoke={() => avatarController.triggerPoke()}
              pokeCount={avatarController.pokeCount}
              thoughtText={currentThoughtText}
              thoughtMode={currentThoughtMode}
              isTypingTransition={isThoughtTyping}
              streamingSnippet={streamingSnippet}
            />
          </div>

          {/* ── Chat Messages Stream (Starts below ~30% bigger avatar, fades out softly at top edge when scrolling) ── */}
          <div
            style={{
              WebkitMaskImage: isConversationStarted
                ? 'linear-gradient(to bottom, transparent 0px, rgba(0,0,0,0.16) 58px, black 122px)'
                : 'linear-gradient(to bottom, transparent 0px, rgba(0,0,0,0.12) 216px, black 284px)',
              maskImage: isConversationStarted
                ? 'linear-gradient(to bottom, transparent 0px, rgba(0,0,0,0.16) 58px, black 122px)'
                : 'linear-gradient(to bottom, transparent 0px, rgba(0,0,0,0.12) 216px, black 284px)',
            }}
            className={`flex-1 overflow-y-auto px-4 sm:px-6 pb-5 space-y-5 bg-transparent ${
              isConversationStarted
                ? 'pt-[124px] sm:pt-[136px]'
                : 'pt-[282px] sm:pt-[310px]'
            }`}
          >

          {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isCurrentStreaming = msg.id === streamingId;
          const isPendingFirstToken = isCurrentStreaming && !msg.content;
          const msgEmotion: SageEmotion = isCurrentStreaming
            ? 'thinking'
            : msg.emotion || detectSageEmotion(msg.content, false, role);

          const isAcademic = !isUser && hasAcademicContent(msg.content);
          const hasAnswers = !isUser && hasAnswerKeyOrSolutions(msg.content);

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              {isUser ? (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold bg-[#111111] dark:bg-[#27272A] text-white shadow-xs">
                  <User size={16} />
                </div>
              ) : (
                <SageAvatar
                  emotion={msgEmotion}
                  characterId={avatarController.characterId}
                  customName={avatarController.displayName}
                  size="sm"
                  showBadge={true}
                  pulseOnThinking={isCurrentStreaming}
                />
              )}

              {/* Message Bubble Container */}
              <div className="space-y-1.5 min-w-0 max-w-[88%] sm:max-w-[80%]">
                {!isUser && (
                  <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                    <span>{avatarController.displayName}</span>
                    <span className="text-[10px] font-normal text-zinc-400">
                      • {avatarController.character.subtitle}
                    </span>
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl shadow-xs transition-all ${
                    isUser
                      ? 'bg-[#111111] dark:bg-[#202026] text-white rounded-tr-xs'
                      : 'bg-white dark:bg-[#18181D] text-[#262626] dark:text-[#E4E4E7] border border-[#E5E5E5] dark:border-[#2A2A32] rounded-tl-xs'
                  }`}
                >
                  {/* File Attachment preview */}
                  {msg.attachment && (
                    <div
                      className={`mb-2.5 p-2 rounded-xl border flex items-center gap-2.5 text-left ${
                        isUser
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-[#F4F4F5] dark:bg-[#222228] border-[#E4E4E7] dark:border-[#2F2F38] text-[#18181B] dark:text-[#E4E4E7]'
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

                  {/* Audio Message Voice Bubble */}
                  {msg.audio ? (
                    <VoiceMessageBubble audio={msg.audio} isUser={isUser} />
                  ) : isUser ? (
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

                {/* Inline PDF Card if attached or requested */}
                {msg.pdfCard && !isCurrentStreaming && (
                  <SagePdfCard
                    title={msg.pdfCard.title}
                    subject={msg.pdfCard.subject}
                    className={msg.pdfCard.className}
                    hasAnswers={role === 'student' ? false : msg.pdfCard.hasAnswers}
                    role={role}
                    isGenerating={generatingPdfMsgId === msg.id || sharingPdfMsgId === msg.id}
                    onDownload={(m) => handleDownloadPdf(msg.content, m, msg.id)}
                    onShare={(m) => handleSharePdf(msg.content, m, msg.id)}
                    onPreview={(m) => handleOpenPdfPreview(msg.content, m)}
                  />
                )}

                {/* Footer info: time, tone indicator, Listen (TTS), Copy, Download PDF, & Share PDF */}
                <div
                  className={`flex flex-wrap items-center gap-2 px-1 text-[11px] text-[#A3A3A3] ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {!isUser && !isPendingFirstToken && msg.content && (
                    <>
                      <span className="text-[10px] font-semibold text-[#888888] flex items-center gap-1">
                        • {SAGE_EMOTIONS[msgEmotion]?.badgeLabel}
                      </span>

                      {/* Listen / Text-to-Speech (TTS) Controls */}
                      {speakingMsgId === msg.id && speechStatus !== 'idle' ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#111111] text-[#F4C430] border border-[#F4C430]/40 text-[11px] font-semibold">
                          {speechStatus === 'loading' ? (
                            <span className="inline-flex items-center gap-1">
                              <Loader2 size={11} className="animate-spin" />
                              <span>Loading voice...</span>
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleSpeak(msg.id, msg.content)}
                                className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                                title={speechStatus === 'playing' ? 'Pause reading' : 'Resume reading'}
                              >
                                {speechStatus === 'playing' ? <Pause size={11} /> : <Play size={11} />}
                                <span>{speechStatus === 'playing' ? 'Pause' : 'Resume'}</span>
                              </button>
                              <span className="text-white/25">|</span>
                              <button
                                type="button"
                                onClick={handleStopSpeak}
                                className="inline-flex items-center gap-0.5 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                title="Stop reading"
                              >
                                <Square size={10} className="fill-current" />
                                <span>Stop</span>
                              </button>
                              <span className="text-white/25">|</span>
                              <button
                                type="button"
                                onClick={handleCycleSpeechSpeed}
                                className="px-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white cursor-pointer"
                                title="Change reading speed (0.75x, 1x, 1.25x, 1.5x)"
                              >
                                {speechSpeed}x
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleSpeak(msg.id, msg.content)}
                          disabled={isCurrentStreaming}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-[11px] transition-colors disabled:opacity-50 cursor-pointer"
                          title="Listen to this answer read aloud (English / Urdu)"
                        >
                          <Volume2 size={12} className="text-[#D4A017]" />
                          <span>Listen</span>
                        </button>
                      )}

                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="flex items-center gap-1 hover:text-[#111111] transition-colors interactive ml-0.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? (
                          <Check size={12} className="text-green-600" />
                        ) : (
                          <Copy size={12} />
                        )}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      {/* Download PDF & Share PDF Buttons on every Sage answer */}
                      {!msg.pdfCard && !msg.id.startsWith('welcome-') && (
                        <div className="relative inline-flex items-center gap-1.5 ml-0.5">
                          {role === 'student' || !hasAnswers ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadPdf(msg.content, role === 'student' ? 'student' : 'teacher', msg.id)
                              }
                              disabled={generatingPdfMsgId === msg.id}
                              className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-100/70 hover:bg-amber-200/90 text-amber-950 font-semibold text-[11px] border border-amber-300/80 transition-colors disabled:opacity-50 cursor-pointer"
                              title="Download answer as formatted A4 PDF"
                            >
                              {generatingPdfMsgId === msg.id ? (
                                <Loader2 size={11} className="animate-spin text-amber-700" />
                              ) : (
                                <FileDown size={11} className="text-amber-800" />
                              )}
                              <span>Download PDF</span>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setPdfMenuMsgId(pdfMenuMsgId === msg.id ? null : msg.id)}
                                disabled={generatingPdfMsgId === msg.id}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100/70 hover:bg-amber-200/90 text-amber-950 font-semibold text-[11px] border border-amber-300/80 transition-colors disabled:opacity-50 cursor-pointer"
                                title="Export this content to a formatted PDF document"
                              >
                                {generatingPdfMsgId === msg.id ? (
                                  <Loader2 size={11} className="animate-spin text-amber-700" />
                                ) : (
                                  <FileDown size={11} className="text-amber-800" />
                                )}
                                <span>Download PDF</span>
                                <ChevronDown size={10} />
                              </button>

                              {pdfMenuMsgId === msg.id && (
                                <div className="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-zinc-200 p-1.5 z-30 text-left animate-in fade-in slide-in-from-top-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadPdf(msg.content, 'student', msg.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                                  >
                                    <GraduationCap size={14} className="text-emerald-600" />
                                    <div className="text-left">
                                      <div>Student Copy</div>
                                      <div className="text-[10px] text-zinc-500 font-normal">Questions only, zero answers</div>
                                    </div>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadPdf(msg.content, 'teacher', msg.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                                  >
                                    <Download size={14} className="text-amber-600" />
                                    <div className="text-left">
                                      <div>Teacher Copy</div>
                                      <div className="text-[10px] text-zinc-500 font-normal">Full with solutions & marking key</div>
                                    </div>
                                  </button>
                                  <div className="my-1 border-t border-zinc-100" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPdfMenuMsgId(null);
                                      handleOpenPdfPreview(msg.content, 'teacher');
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                                  >
                                    <Eye size={13} />
                                    <span>Preview Document</span>
                                  </button>
                                </div>
                              )}
                            </>
                          )}

                          {/* Share / Send PDF Button */}
                          <button
                            type="button"
                            onClick={() =>
                              handleSharePdf(msg.content, role === 'student' ? 'student' : 'teacher', msg.id)
                            }
                            disabled={sharingPdfMsgId === msg.id}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-[11px] transition-colors disabled:opacity-50 cursor-pointer"
                            title="Share or send this answer as a PDF"
                          >
                            {sharingPdfMsgId === msg.id ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Share2 size={11} />
                            )}
                            <span>Share PDF</span>
                          </button>
                        </div>
                      )}
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

        {/* Transcribing Audio Indicator */}
        {isTranscribing && (
          <div className="p-3.5 bg-gradient-to-r from-purple-50 to-amber-50 border border-purple-200 rounded-2xl text-xs text-purple-900 flex items-center gap-3 animate-pulse">
            <Loader2 size={16} className="animate-spin text-purple-600" />
            <div>
              <p className="font-bold">Transcribing voice message with Gemini AI...</p>
              <p className="text-[11px] text-purple-700">Converting English / Urdu speech to text</p>
            </div>
          </div>
        )}

        {/* Error message with Retry button */}
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/35 border border-red-200 dark:border-red-800/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle size={14} className="text-red-600 dark:text-red-400 shrink-0" />
              <span className="break-words">{errorMsg}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {lastSentPrompt && !isLoading && (
                <button
                  type="button"
                  onClick={() => handleSend(lastSentPrompt)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>Retry</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-300 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
          </div>
        </div>

      {/* ── Suggested Questions (Neat Collapsible Horizontal Row) ── */}
      {messages.length <= 2 && !isLoading && (
        <div className="px-4 sm:px-5 py-2 bg-white dark:bg-[#141418] border-t border-[#F0F0F0] dark:border-[#27272A] shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <button
              type="button"
              onClick={() => setSuggestionsCollapsed((prev) => !prev)}
              className="text-[11px] font-bold text-[#737373] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lightbulb size={12} className="text-[#F4C430] shrink-0" />
              <span>Suggested questions</span>
              {suggestionsCollapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {!suggestionsCollapsed && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {starters.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    id={`starter-chip-${idx}`}
                    onClick={() => handleSend(item.text)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs text-[#525252] dark:text-[#D4D4D8] hover:text-[#111111] dark:hover:text-white transition-all text-left group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F4C430] ${
                      item.tone === 'positive'
                        ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/30 hover:bg-emerald-50'
                        : item.tone === 'concerned'
                        ? 'border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/30 hover:bg-red-50'
                        : 'border-[#E5E5E5] dark:border-[#2E2E36] bg-[#FAFAFA] dark:bg-[#1A1A1F] hover:bg-[#FFFBF0] dark:hover:bg-[#24242C] hover:border-[#F4C430]'
                    }`}
                  >
                    <Icon
                      size={13}
                      className={`shrink-0 ${
                        item.tone === 'positive'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : item.tone === 'concerned'
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-[#F4C430]'
                      }`}
                    />
                    <span className="font-medium whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Input Box & Controls ── */}
      <div className="p-4 sm:p-5 bg-white dark:bg-[#141418] border-t border-[#E5E5E5] dark:border-[#27272A] shrink-0">
        {/* Pending Attachment Preview */}
        {pendingAttachment && !isRecording && (
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

        {/* ── Active Voice Recording Bar (When Recording) ── */}
        {isRecording ? (
          <div className="flex items-center justify-between gap-3 bg-red-50/90 border-2 border-red-500/80 rounded-2xl p-2.5 sm:px-4 shadow-sm animate-in fade-in duration-200">
            {/* Left: Red Pulsing Dot & Live Timer */}
            <div className="flex items-center gap-2.5 min-w-[90px]">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
              </span>
              <span className="font-mono text-sm font-black text-red-700">
                {formatTimer(recordingElapsedMs)}
              </span>
            </div>

            {/* Center: Soundwave Level Bars */}
            <div className="flex-1 flex items-center justify-center gap-[3px] h-7 px-2 overflow-hidden max-w-[280px]">
              {[35, 65, 90, 45, 100, 80, 50, 75, 40, 95, 60, 85, 50, 70].map((baseH, idx) => {
                const dynamicH = Math.max(18, Math.min(100, baseH * (0.4 + recordingLevel * 0.9)));
                return (
                  <div
                    key={idx}
                    className="w-1 rounded-full bg-red-500 transition-all duration-75"
                    style={{ height: `${dynamicH}%` }}
                  />
                );
              })}
            </div>

            {/* Right: Cancel, Stop to Preview, and Send Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={cancelVoiceRecording}
                className="p-2.5 rounded-xl text-zinc-500 hover:text-red-700 hover:bg-red-100 transition-colors"
                title="Cancel voice recording"
              >
                <Trash2 size={18} />
              </button>

              <button
                type="button"
                onClick={stopVoiceRecordingToPreview}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold transition-colors"
                title="Stop and preview voice message before sending"
              >
                <Square size={13} className="fill-current text-zinc-700" />
                <span className="hidden sm:inline">Preview</span>
              </button>

              <button
                type="button"
                onClick={sendVoiceRecording}
                className="p-2.5 rounded-xl bg-[#111111] hover:bg-black text-[#F4C430] shadow-md hover:scale-105 transition-all"
                title="Send voice note"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : audioPreviewResult && audioPreviewUrl ? (
          /* ── Voice Note Preview Bar (After Recording, Before Sending) ── */
          <div className="flex items-center justify-between gap-3 bg-zinc-50 border border-zinc-300 rounded-2xl p-2.5 sm:px-4 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => {
                  if (!previewAudioElRef.current) return;
                  if (previewPlaying) {
                    previewAudioElRef.current.pause();
                    setPreviewPlaying(false);
                  } else {
                    previewAudioElRef.current.play().then(() => setPreviewPlaying(true));
                  }
                }}
                className="w-9 h-9 rounded-full bg-[#111111] text-[#F4C430] flex items-center justify-center shrink-0 shadow-xs hover:scale-105 transition-all"
                title={previewPlaying ? 'Pause' : 'Play recording preview'}
              >
                {previewPlaying ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current ml-0.5" />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 mb-1">
                  <span>Voice Note Preview</span>
                  <span className="font-mono text-[11px] text-zinc-500">
                    {formatTimer(previewPlaying ? previewTime * 1000 : audioPreviewResult.durationSeconds * 1000)}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#F4C430] h-full transition-all"
                    style={{
                      width: `${Math.min(100, (previewTime / (audioPreviewResult.durationSeconds || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                type="button"
                onClick={cancelVoiceRecording}
                className="p-2 rounded-xl text-zinc-500 hover:text-red-700 hover:bg-zinc-200 transition-colors"
                title="Discard recording"
              >
                <Trash2 size={17} />
              </button>

              <button
                type="button"
                onClick={startVoiceRecording}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-xs font-semibold text-zinc-700 transition-colors"
                title="Re-record voice note"
              >
                <RotateCcw size={12} />
                <span>Re-record</span>
              </button>

              <button
                type="button"
                onClick={sendVoiceRecording}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111111] hover:bg-black text-[#F4C430] text-xs font-bold shadow-md hover:scale-105 transition-all"
                title="Transcribe & Send"
              >
                <span>Send</span>
                <Send size={13} />
              </button>
            </div>
          </div>
        ) : (
          /* ── Standard Text Form with Mic Button ── */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-end gap-2 bg-[#F9F9F9] dark:bg-[#1A1A1E] border border-[#E5E5E5] dark:border-[#2E2E36] focus-within:border-[#111111] dark:focus-within:border-[#F4C430] focus-within:bg-white dark:focus-within:bg-[#202026] rounded-2xl p-2 transition-all shadow-inner"
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
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-[#737373] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-white hover:bg-[#EAEAEA] dark:hover:bg-[#2E2E36] transition-colors shrink-0 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F4C430]"
              title="Attach image or document (diagrams, exam papers, textbook problems)"
              aria-label="Attach file"
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
              className="w-full resize-none bg-transparent px-1.5 py-2.5 text-sm text-[#111111] dark:text-white placeholder:text-[#A3A3A3] dark:placeholder:text-[#71717A] focus:outline-none max-h-36 font-normal leading-relaxed"
            />

            {isLoading ? (
              <button
                type="button"
                id="sage-chat-stop-btn"
                onClick={handleStop}
                className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl flex items-center justify-center shrink-0 bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-md hover:scale-105 interactive transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
                title="Stop Generating"
                aria-label="Stop Generating"
              >
                <Square size={16} className="fill-current" />
              </button>
            ) : !input.trim() && !pendingAttachment ? (
              /* When input is empty, show the WhatsApp-style Mic button */
              <button
                type="button"
                id="sage-chat-mic-btn"
                onClick={startVoiceRecording}
                className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl flex items-center justify-center shrink-0 bg-[#111111] hover:bg-black text-[#F4C430] shadow-md hover:scale-105 interactive transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F4C430]"
                title="Record voice message (WhatsApp style - tap to record)"
                aria-label="Record voice message"
              >
                <Mic size={18} />
              </button>
            ) : (
              /* When typing or attached, show Send button */
              <button
                type="submit"
                id="sage-chat-send-btn"
                className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl flex items-center justify-center shrink-0 bg-[#111111] hover:bg-black text-[#F4C430] shadow-md hover:scale-105 interactive transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F4C430]"
                title="Send Message"
                aria-label="Send Message"
              >
                <Send size={18} />
              </button>
            )}
          </form>
        )}

        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-[#A3A3A3] dark:text-[#71717A]">
          <span>Shift + Enter for new line • Enter to send • Mic for voice note</span>
          <span className="text-[#737373] dark:text-[#A1A1AA] font-medium">
            Scholario Sage v2.0 • {activeModelDisplayName} (AI Assistant + RAG)
          </span>
        </div>
      </div>

      {/* ── "Choose your Sage" Avatar Picker Modal / Bottom Sheet (All 9 Companions, Transparent Previews) ── */}
      {avatarPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setAvatarPickerOpen(false)}
        >
          <div
            className="w-full sm:max-w-2xl bg-[#121216] text-zinc-100 rounded-t-3xl sm:rounded-3xl border border-[#2A2A34] shadow-2xl overflow-hidden max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-[#111111] text-white flex items-center justify-between border-b border-[#26262E]">
              <div>
                <h3 className="text-base font-extrabold tracking-tight text-white">
                  Choose your Sage ({avatarController.displayName})
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pick from 9 study companions — each with its own 3D rig, personality, and fixed voice
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPickerOpen(false);
                    setProfilePanelOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#F4C430] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Pencil size={12} />
                  <span>Rename / Voice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarPickerOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close character picker"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* 9 Character Preview Cards Grid */}
            <div className="p-4 sm:p-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SAGE_CHARACTERS.map((charItem) => {
                const isSelected = avatarController.characterId === charItem.id;
                const displayCardName =
                  isSelected && avatarController.customName
                    ? `${avatarController.customName} (${charItem.name})`
                    : charItem.name;
                return (
                  <button
                    key={charItem.id}
                    type="button"
                    id={`sage-picker-card-${charItem.id}`}
                    onClick={() => {
                      avatarController.setCharacterId(charItem.id);
                      avatarController.triggerPoke();
                      toast.success(`${charItem.name} (${charItem.title}) selected!`);
                      setAvatarPickerOpen(false);
                    }}
                    style={
                      isSelected
                        ? {
                            borderColor: charItem.accentColor,
                            boxShadow: `0 0 0 2px ${charItem.accentColor}55`,
                            backgroundColor: `${charItem.accentColor}14`,
                          }
                        : {}
                    }
                    className={`group relative flex flex-col items-center text-center p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? ''
                        : 'border-[#2A2A34] bg-[#1A1A22] hover:border-zinc-500 hover:bg-[#22222C]'
                    }`}
                  >
                    {/* Badge */}
                    <span
                      style={
                        isSelected
                          ? { backgroundColor: charItem.accentColor, color: '#111111' }
                          : {}
                      }
                      className={`absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                        isSelected
                          ? ''
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {isSelected ? 'Active' : charItem.badge}
                    </span>

                    {/* Character Animated Preview (Frameless & Transparent — NO WHITE SHEET) */}
                    <div className="w-16 h-16 flex items-center justify-center mb-2 bg-transparent border-0 shadow-none group-hover:scale-110 transition-transform">
                      <SageCharacterSvg
                        characterId={charItem.id}
                        avatarState={isSelected ? 'poke' : 'idle'}
                        svgSize={58}
                        uid={`picker-${charItem.id}`}
                      />
                    </div>

                    <div className="font-extrabold text-xs sm:text-sm text-white">
                      {displayCardName}
                    </div>
                    <div
                      style={{ color: charItem.accentColor }}
                      className="text-[11px] font-bold mt-0.5"
                    >
                      {charItem.role}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-snug">
                      {charItem.personality}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Sage Profile & Rename Drawer / Bottom Sheet (Task 3) ── */}
      <SageProfilePanel
        isOpen={profilePanelOpen}
        onClose={() => setProfilePanelOpen(false)}
        characterId={avatarController.characterId}
        customName={avatarController.customName}
        displayName={avatarController.displayName}
        avatarState={avatarController.state}
        audioLevel={avatarController.audioLevel}
        onRename={avatarController.setCustomName}
        onResetName={avatarController.resetCustomName}
        onOpenCharacterPicker={() => setAvatarPickerOpen(true)}
        onVoicePrefChanged={() =>
          setHeaderVoicePref(sageSpeech.getAvatarVoicePref(avatarController.characterId))
        }
      />

      {/* ── PDF Preview Modal ── */}
      <PdfPreviewModal
        isOpen={pdfPreviewModal.isOpen}
        onClose={() => {
          if (pdfPreviewModal.dataUrl) {
            revokeSagePdfUrl(pdfPreviewModal.dataUrl);
          }
          setPdfPreviewModal((prev) => ({ ...prev, isOpen: false, dataUrl: undefined }));
        }}
        dataUrl={pdfPreviewModal.dataUrl}
        filename={pdfPreviewModal.filename}
        totalPages={pdfPreviewModal.totalPages}
        loading={pdfPreviewModal.loading}
        mode={pdfPreviewModal.mode}
        hasAnswers={pdfPreviewModal.hasAnswers}
        role={role}
        onToggleMode={handleTogglePreviewMode}
        onDownload={() => handleDownloadPdf(pdfPreviewModal.rawContent, pdfPreviewModal.mode)}
        onShare={() => handleSharePdf(pdfPreviewModal.rawContent, pdfPreviewModal.mode)}
      />

      {/* ── Reset / Clear Chat Confirmation Modal ── */}
      <ConfirmModal
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          handleClear();
          setConfirmClearOpen(false);
        }}
        title="Reset Chat Session?"
        description="This will clear your active conversation history with Sage and start a clean session with welcoming prompts. This action cannot be undone."
        confirmLabel="Reset Session"
        cancelLabel="Keep Conversation"
        danger
      />
      </div>
    </SageAvatarStateProvider>
  );
};

export default SageChatView;
