import { ChatTheme } from '../types/chatTheme';

export type { ChatTheme };

export const CHAT_THEMES: ChatTheme[] = [
  {
    id: 'classic-academic',
    name: 'Classic Academic',
    description: 'WhatsApp iconic academic doodle over warm parchment canvas.',
    type: 'doodle',
    category: 'light',
    background: '#EFEAE2',
    textColor: '#111B21',
    hasDoodlePattern: true,
    doodleColor: '#111111',
    doodleOpacity: 0.065,
    sentBubbleBg: '#D9FDD3',
    sentBubbleText: '#111B21',
    sentMetaText: '#667781',
    receivedBubbleBg: '#FFFFFF',
    receivedBubbleText: '#111B21',
    receivedMetaText: '#667781',
    accentColor: '#25D366',
    isDarkTheme: false,
  },
  {
    id: 'midnight-academic',
    name: 'Midnight Academic',
    description: 'Deep WhatsApp dark theme with low-opacity academic sketches.',
    type: 'doodle',
    category: 'dark',
    background: '#0B141A',
    textColor: '#E9EDEF',
    hasDoodlePattern: true,
    doodleColor: '#FFFFFF',
    doodleOpacity: 0.05,
    sentBubbleBg: '#005C4B',
    sentBubbleText: '#E9EDEF',
    sentMetaText: '#A7F3D0',
    receivedBubbleBg: '#202C33',
    receivedBubbleText: '#E9EDEF',
    receivedMetaText: '#CBD5E1',
    accentColor: '#00A884',
    isDarkTheme: true,
  },
  {
    id: 'graphite-studio',
    name: 'Graphite Studio',
    description: 'Modern zinc-carbon workspace with subtle geometric outlines.',
    type: 'doodle',
    category: 'dark',
    background: '#18181B',
    textColor: '#FAFAFA',
    hasDoodlePattern: true,
    doodleColor: '#FFFFFF',
    doodleOpacity: 0.04,
    sentBubbleBg: '#27272A',
    sentBubbleText: '#FAFAFA',
    sentMetaText: '#CBD5E1',
    receivedBubbleBg: '#202024',
    receivedBubbleText: '#F4F4F5',
    receivedMetaText: '#CBD5E1',
    accentColor: '#F4C430',
    isDarkTheme: true,
  },
  {
    id: 'soft-slate',
    name: 'Soft Slate',
    description: 'Crisp, distraction-free neutral off-white without pattern.',
    type: 'solid',
    category: 'light',
    background: '#F0F2F5',
    textColor: '#111B21',
    sentBubbleBg: '#D9FDD3',
    sentBubbleText: '#111B21',
    sentMetaText: '#667781',
    receivedBubbleBg: '#FFFFFF',
    receivedBubbleText: '#111B21',
    receivedMetaText: '#667781',
    accentColor: '#54656F',
    isDarkTheme: false,
  },
  {
    id: 'warm-sand',
    name: 'Warm Sand',
    description: 'Cozy terracotta-tinted backdrop with soft sage bubbles.',
    type: 'solid',
    category: 'light',
    background: '#EBE5DE',
    textColor: '#111B21',
    sentBubbleBg: '#DCF8C6',
    sentBubbleText: '#111B21',
    sentMetaText: '#667781',
    receivedBubbleBg: '#FFFFFF',
    receivedBubbleText: '#111B21',
    receivedMetaText: '#667781',
    accentColor: '#C8B9A6',
    isDarkTheme: false,
  },
  {
    id: 'botanical-sage',
    name: 'Botanical Sage',
    description: 'Earthy mint tone with fresh forest contrast bubbles.',
    type: 'solid',
    category: 'light',
    background: '#E4EBE4',
    textColor: '#0F2412',
    sentBubbleBg: '#CDEFD0',
    sentBubbleText: '#0F2412',
    sentMetaText: '#3A5C3F',
    receivedBubbleBg: '#FFFFFF',
    receivedBubbleText: '#111B21',
    receivedMetaText: '#667781',
    accentColor: '#34D399',
    isDarkTheme: false,
  },
  {
    id: 'deep-obsidian',
    name: 'Deep Obsidian',
    description: 'Solid charcoal night canvas with deep emerald highlights.',
    type: 'solid',
    category: 'dark',
    background: '#111827',
    textColor: '#F9FAFB',
    sentBubbleBg: '#065F46',
    sentBubbleText: '#ECFDF5',
    sentMetaText: '#6EE7B7',
    receivedBubbleBg: '#1F2937',
    receivedBubbleText: '#F9FAFB',
    receivedMetaText: '#CBD5E1',
    accentColor: '#10B981',
    isDarkTheme: true,
  },
  {
    id: 'pitch-oled',
    name: 'Pitch OLED',
    description: 'Zero-emission true black with high-contrast night bubbles.',
    type: 'solid',
    category: 'dark',
    background: '#050505',
    textColor: '#FAFAF9',
    sentBubbleBg: '#14532D',
    sentBubbleText: '#F0FDF4',
    sentMetaText: '#86EFAC',
    receivedBubbleBg: '#1C1917',
    receivedBubbleText: '#FAFAF9',
    receivedMetaText: '#D6D3D1',
    accentColor: '#22C55E',
    isDarkTheme: true,
  },
  {
    id: 'scholario-gold',
    name: 'Scholario Gold',
    description: 'Warm champagne gradient with radiant golden accents.',
    type: 'gradient',
    category: 'light',
    background: 'linear-gradient(145deg, #FFFDF0 0%, #FDF3C8 100%)',
    textColor: '#2A2000',
    sentBubbleBg: '#FDF0A6',
    sentBubbleText: '#2A2000',
    sentMetaText: '#715505',
    receivedBubbleBg: '#FFFFFF',
    receivedBubbleText: '#18181B',
    receivedMetaText: '#71717A',
    accentColor: '#F4C430',
    isDarkTheme: false,
  },
  {
    id: 'nordic-dawn',
    name: 'Nordic Dawn',
    description: 'Cool glacial daylight gradient with crystal blue bubbles.',
    type: 'gradient',
    category: 'light',
    background: 'linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 100%)',
    textColor: '#082F49',
    sentBubbleBg: '#E0F2FE',
    sentBubbleText: '#082F49',
    sentMetaText: '#0369A1',
    receivedBubbleBg: '#FFFFFF',
    receivedBubbleText: '#0F172A',
    receivedMetaText: '#64748B',
    accentColor: '#38BDF8',
    isDarkTheme: false,
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    description: 'Soft peach sunrise with gentle amber glow.',
    type: 'gradient',
    category: 'light',
    background: 'linear-gradient(135deg, #FFECD2 0%, #FCB69F 100%)',
    textColor: '#431407',
    sentBubbleBg: '#FFF1EC',
    sentBubbleText: '#431407',
    sentMetaText: '#9A3412',
    receivedBubbleBg: '#FFFFFF',
    receivedBubbleText: '#27272A',
    receivedMetaText: '#71717A',
    accentColor: '#FB923C',
    isDarkTheme: false,
  },
  {
    id: 'emerald-night',
    name: 'Emerald Night',
    description: 'Dark aurora borealis gradient with vibrant teal tones.',
    type: 'gradient',
    category: 'dark',
    background: 'linear-gradient(135deg, #0A1F1C 0%, #0F3830 50%, #134E4A 100%)',
    textColor: '#ECFDF5',
    sentBubbleBg: '#047857',
    sentBubbleText: '#ECFDF5',
    sentMetaText: '#A7F3D0',
    receivedBubbleBg: '#132B26',
    receivedBubbleText: '#F0FDF4',
    receivedMetaText: '#99F6E4',
    accentColor: '#34D399',
    isDarkTheme: true,
  },
  {
    id: 'royal-indigo',
    name: 'Royal Indigo',
    description: 'Deep cosmic twilight with lavender and violet accents.',
    type: 'gradient',
    category: 'dark',
    background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #311042 100%)',
    textColor: '#EEF2FF',
    sentBubbleBg: '#4338CA',
    sentBubbleText: '#EEF2FF',
    sentMetaText: '#C7D2FE',
    receivedBubbleBg: '#1E293B',
    receivedBubbleText: '#F8FAFC',
    receivedMetaText: '#CBD5E1',
    accentColor: '#818CF8',
    isDarkTheme: true,
  },
  {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    description: 'Subtle pastel blush with delicate magenta highlights.',
    type: 'solid',
    category: 'light',
    background: '#FCE7F3',
    textColor: '#701A75',
    sentBubbleBg: '#FBCFE8',
    sentBubbleText: '#701A75',
    sentMetaText: '#A21CAF',
    receivedBubbleBg: '#FFFFFF',
    receivedBubbleText: '#27272A',
    receivedMetaText: '#71717A',
    accentColor: '#F472B6',
    isDarkTheme: false,
  },
];

export const DEFAULT_CHAT_THEME_ID = 'classic-academic';

export function getChatTheme(themeId?: string): ChatTheme {
  const found = CHAT_THEMES.find((t) => t.id === themeId);
  return found || CHAT_THEMES[0];
}

export function getSavedChatTheme(threadId?: string): string {
  try {
    if (threadId) {
      const perThread = localStorage.getItem(`scholario_chat_theme_${threadId}`);
      if (perThread && CHAT_THEMES.some((t) => t.id === perThread)) {
        return perThread;
      }
    }
    const globalDefault = localStorage.getItem('scholario_chat_theme_default');
    if (globalDefault && CHAT_THEMES.some((t) => t.id === globalDefault)) {
      return globalDefault;
    }
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
      return 'midnight-academic';
    }
  } catch {
    // ignore localStorage exceptions
  }
  return DEFAULT_CHAT_THEME_ID;
}

export function saveChatTheme(themeId: string, threadId?: string): void {
  try {
    if (threadId) {
      localStorage.setItem(`scholario_chat_theme_${threadId}`, themeId);
    }
    localStorage.setItem('scholario_chat_theme_default', themeId);
  } catch {
    // ignore
  }
}
