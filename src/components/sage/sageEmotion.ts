import React from 'react';
import { Brain, AlertCircle, Info, Bot, Smile } from 'lucide-react';

export type SageEmotion = 'idle' | 'thinking' | 'positive' | 'neutral' | 'concerned';

export interface EmotionMeta {
  key: SageEmotion;
  label: string;
  badgeLabel: string;
  statusText: string;
  accentColor: string; // Tailwind border / ring / text color
  glowClass: string;
  badgeBg: string;
  badgeTextColor: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  videoUrl: string;
  webmUrl?: string;
  posterUrl: string;
  description: string;
}

export const SAGE_EMOTIONS: Record<SageEmotion, EmotionMeta> = {
  idle: {
    key: 'idle',
    label: 'Ready & Attentive',
    badgeLabel: 'Online',
    statusText: 'Ready to assist',
    accentColor: '#F4C430',
    glowClass: 'ring-2 ring-[#F4C430]/60 shadow-[0_0_15px_rgba(244,196,48,0.35)]',
    badgeBg: 'bg-[#F4C430]',
    badgeTextColor: 'text-[#111111]',
    icon: Bot,
    videoUrl: '/animations/sage-avatar-optimized.mp4',
    webmUrl: '/animations/sage-avatar-optimized.webm',
    posterUrl: '/animations/sage-avatar-poster.jpg',
    description: 'Idle and awaiting your academic questions or commands.',
  },
  thinking: {
    key: 'thinking',
    label: 'Processing & Reasoning',
    badgeLabel: 'Thinking',
    statusText: 'Analyzing curriculum & data...',
    accentColor: '#8B5CF6',
    glowClass: 'ring-2 ring-[#8B5CF6] shadow-[0_0_18px_rgba(139,92,246,0.45)] animate-pulse',
    badgeBg: 'bg-[#8B5CF6]',
    badgeTextColor: 'text-white',
    icon: Brain,
    videoUrl: '/animations/sage-avatar-optimized.mp4',
    webmUrl: '/animations/sage-avatar-optimized.webm',
    posterUrl: '/animations/sage-avatar-poster.jpg',
    description: 'Synthesizing explanations, calculations, or platform data.',
  },
  positive: {
    key: 'positive',
    label: 'Encouraging & Enthusiastic',
    badgeLabel: 'Happy',
    statusText: 'Great progress & congratulations!',
    accentColor: '#10B981',
    glowClass: 'ring-2 ring-[#10B981] shadow-[0_0_16px_rgba(16,185,129,0.4)]',
    badgeBg: 'bg-[#10B981]',
    badgeTextColor: 'text-white',
    icon: Smile,
    videoUrl: '/animations/sage-avatar-optimized.mp4',
    webmUrl: '/animations/sage-avatar-optimized.webm',
    posterUrl: '/animations/sage-avatar-poster.jpg',
    description: 'Celebrating high attendance, good scores, solved questions, and warm greetings.',
  },
  neutral: {
    key: 'neutral',
    label: 'Informative & Structured',
    badgeLabel: 'Insight',
    statusText: 'Providing factual syllabus information',
    accentColor: '#3B82F6',
    glowClass: 'ring-2 ring-[#3B82F6]/70 shadow-[0_0_14px_rgba(59,130,246,0.35)]',
    badgeBg: 'bg-[#3B82F6]',
    badgeTextColor: 'text-white',
    icon: Info,
    videoUrl: '/animations/sage-avatar-optimized.mp4',
    webmUrl: '/animations/sage-avatar-optimized.webm',
    posterUrl: '/animations/sage-avatar-poster.jpg',
    description: 'Delivering clear academic formulas, lesson outlines, or standard summaries.',
  },
  concerned: {
    key: 'concerned',
    label: 'Alert & Supportive',
    badgeLabel: 'Urgent',
    statusText: 'Reviewing serious academic/attendance alert',
    accentColor: '#EF4444',
    glowClass: 'ring-2 ring-[#EF4444] shadow-[0_0_18px_rgba(239,68,68,0.45)] animate-pulse',
    badgeBg: 'bg-[#EF4444]',
    badgeTextColor: 'text-white',
    icon: AlertCircle,
    videoUrl: '/animations/sage-avatar-optimized.mp4',
    webmUrl: '/animations/sage-avatar-optimized.webm',
    posterUrl: '/animations/sage-avatar-poster.jpg',
    description: 'Addressing low attendance, consecutive absences, failing scores, or fee suspensions.',
  },
};

/**
 * Detects the emotional tone of a message or current system state.
 * @param content The text content of the message or prompt
 * @param isThinking Boolean indicating if response is currently generating
 * @param role Optional role context (student | teacher | admin)
 */
export function detectSageEmotion(
  content: string | undefined,
  isThinking?: boolean,
  _role?: 'student' | 'teacher' | 'admin'
): SageEmotion {
  if (isThinking) {
    return 'thinking';
  }

  if (!content || !content.trim()) {
    return 'idle';
  }

  const lower = content.toLowerCase();

  // 1. Concerned / Alert keywords (Absences, failing, low attendance, suspension, critical issues)
  const concernedKeywords = [
    'absent',
    'absence',
    'unexcused',
    'low attendance',
    'attendance is below',
    'failing',
    'failed',
    'low grade',
    'poor performance',
    'suspension',
    'suspended',
    'unpaid',
    'fee overdue',
    'arrears',
    'warning',
    'critical',
    'urgent notice',
    'disciplinary',
    'struggling',
    'missed class',
    'not submitted',
    'overdue',
    'penalty',
    'probation',
  ];

  if (concernedKeywords.some((kw) => lower.includes(kw))) {
    return 'concerned';
  }

  // 2. Positive / Encouraging keywords (High attendance, high scores, greetings, compliments, thanks)
  const positiveKeywords = [
    'thank',
    'thanks',
    'congrat',
    'excellent',
    'awesome',
    'great job',
    'well done',
    'welldone',
    'passed',
    'high attendance',
    '100%',
    '95%',
    '90%',
    'assalam',
    'salaam',
    'hello',
    'hi sage',
    'greetings',
    'welcome',
    'happy to',
    'glad to',
    'perfect',
    'good score',
    'solved',
    'success',
    'bravo',
    'fantastic',
    'superb',
    'star student',
    'proud',
    'appreciated',
  ];

  if (positiveKeywords.some((kw) => lower.includes(kw))) {
    return 'positive';
  }

  // 3. Informational queries (Math, Physics, formulas, syllabus, summaries, tests, pricing)
  const informativeKeywords = [
    'formula',
    'derive',
    'calculate',
    'equation',
    'explain',
    'summary',
    'chapter',
    'syllabus',
    'fbise',
    'board',
    'physics',
    'chemistry',
    'biology',
    'mathematics',
    'lesson plan',
    'quiz',
    'mcq',
    'definition',
    'concept',
    'distribution',
    'fee rates',
    'roster',
    'schedule',
  ];

  if (informativeKeywords.some((kw) => lower.includes(kw))) {
    return 'neutral';
  }

  return 'neutral';
}
