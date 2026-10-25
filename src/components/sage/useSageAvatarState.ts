import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { supabase } from '../../lib/supabase';

/**
 * Unified 3D Sage Avatar State Machine
 */
export type Sage3DAvatarState =
  | 'idle'
  | 'typing'
  | 'listening'
  | 'nod'
  | 'thinking'
  | 'speaking'
  | 'success'
  | 'error'
  | 'sleepy'
  | 'poke';

/**
 * 9 Selectable Sage Character Personas (#1 Classic Default + 8 Distinct Characters)
 */
export type SageCharacterId =
  | 'sage-classic'
  | 'ayan-scholar'
  | 'zain-explorer'
  | 'hamza-kurta'
  | 'nova-bot'
  | 'milo-owl'
  | 'tango-cat'
  | 'gigi-giraffe'
  | 'lumi-lamp';

export interface SageVoiceHeuristic {
  preferredLangs: string[];
  genderHint: 'female' | 'male' | 'neutral';
  nameKeywords: string[];
  defaultRate: number;
  defaultPitch: number;
}

export interface SageCharacterDefinition {
  id: SageCharacterId;
  name: string;
  title: string;
  role: string;
  subtitle: string;
  personality: string;
  description: string;
  badge: string;
  bodyColor: string;
  earInnerColor: string;
  accentColor: string;
  secondaryColor: string;
  shadowColor: string;
  voiceProfile: SageVoiceHeuristic;
}

export const SAGE_CHARACTERS: SageCharacterDefinition[] = [
  {
    id: 'sage-classic',
    name: 'Sage',
    title: 'Classic Scholar',
    role: 'Classic Scholar',
    subtitle: 'Classic Scholar',
    personality: 'Warm, wise scholar for clear step-by-step guidance.',
    description: 'Warm, wise scholar for clear step-by-step guidance.',
    badge: 'Default',
    bodyColor: '#FFF8EC',
    earInnerColor: '#FADADD',
    accentColor: '#F4C430',
    secondaryColor: '#18181B',
    shadowColor: '#EEDCBE',
    voiceProfile: {
      preferredLangs: ['en-GB', 'en-US', 'en-IN', 'en'],
      genderHint: 'female',
      nameKeywords: ['samantha', 'libby', 'sonia', 'victoria', 'aria', 'google uk english female', 'natural'],
      defaultRate: 1.0,
      defaultPitch: 1.04,
    },
  },
  {
    id: 'ayan-scholar',
    name: 'Ayan',
    title: 'Head Boy Scholar',
    role: 'Head Boy Scholar',
    subtitle: 'Head Boy Scholar',
    personality: 'Focused topper for structured notes and exam prep.',
    description: 'Focused topper for structured notes and exam prep.',
    badge: 'Topper',
    bodyColor: '#8D5524',
    earInnerColor: '#704218',
    accentColor: '#2563EB',
    secondaryColor: '#1E3A8A',
    shadowColor: '#693D16',
    voiceProfile: {
      preferredLangs: ['en-GB', 'en-IN', 'en-US', 'en'],
      genderHint: 'male',
      nameKeywords: ['daniel', 'ryan', 'george', 'prabhat', 'arthur', 'google uk english male'],
      defaultRate: 1.02,
      defaultPitch: 0.96,
    },
  },
  {
    id: 'zain-explorer',
    name: 'Zain',
    title: 'Campus Explorer',
    role: 'Campus Explorer',
    subtitle: 'Campus Explorer',
    personality: 'Curious explorer who turns tough topics into fun.',
    description: 'Curious explorer who turns tough topics into fun.',
    badge: 'Energetic',
    bodyColor: '#C68642',
    earInnerColor: '#A66A2C',
    accentColor: '#F97316',
    secondaryColor: '#EA580C',
    shadowColor: '#9E652B',
    voiceProfile: {
      preferredLangs: ['en-US', 'en-GB', 'en-AU', 'en'],
      genderHint: 'male',
      nameKeywords: ['guy', 'christopher', 'alex', 'fred', 'reed', 'google us english'],
      defaultRate: 1.08,
      defaultPitch: 1.08,
    },
  },
  {
    id: 'hamza-kurta',
    name: 'Hamza',
    title: 'Traditional Scholar',
    role: 'Traditional Scholar',
    subtitle: 'Traditional Scholar',
    personality: 'Gentle, courteous mentor with clear explanations.',
    description: 'Gentle, courteous mentor with clear explanations.',
    badge: 'Cultural',
    bodyColor: '#D89B62',
    earInnerColor: '#B87B44',
    accentColor: '#10B981',
    secondaryColor: '#F8FAFC',
    shadowColor: '#B57B45',
    voiceProfile: {
      preferredLangs: ['en-PK', 'en-IN', 'en-GB', 'en'],
      genderHint: 'male',
      nameKeywords: ['asad', 'rishi', 'prabhat', 'oliver', 'daniel', 'male'],
      defaultRate: 0.95,
      defaultPitch: 0.92,
    },
  },
  {
    id: 'nova-bot',
    name: 'Nova',
    title: 'Cyber Companion',
    role: 'Cyber Companion',
    subtitle: 'Cyber Companion',
    personality: 'Fast cyber companion for crisp logic and coding.',
    description: 'Fast cyber companion for crisp logic and coding.',
    badge: 'Sci-Fi',
    bodyColor: '#F8FAFC',
    earInnerColor: '#38BDF8',
    accentColor: '#06B6D4',
    secondaryColor: '#0F172A',
    shadowColor: '#CBD5E1',
    voiceProfile: {
      preferredLangs: ['en-US', 'en-GB', 'en'],
      genderHint: 'female',
      nameKeywords: ['zira', 'jenny', 'ava', 'siri', 'google us english', 'karen', 'tessa'],
      defaultRate: 1.06,
      defaultPitch: 1.12,
    },
  },
  {
    id: 'milo-owl',
    name: 'Milo',
    title: 'Library Owl',
    role: 'Library Owl',
    subtitle: 'Library Owl',
    personality: 'Cozy library owl for calm reading and revision.',
    description: 'Cozy library owl for calm reading and revision.',
    badge: 'Mascot',
    bodyColor: '#E6D2B5',
    earInnerColor: '#D4A373',
    accentColor: '#D97706',
    secondaryColor: '#78350F',
    shadowColor: '#C5AC89',
    voiceProfile: {
      preferredLangs: ['en-GB', 'en-AU', 'en-US', 'en'],
      genderHint: 'male',
      nameKeywords: ['thomas', 'malcolm', 'gordon', 'daniel', 'james', 'uk'],
      defaultRate: 0.94,
      defaultPitch: 0.9,
    },
  },
  {
    id: 'tango-cat',
    name: 'Tango',
    title: 'Campus Cat Guide',
    role: 'Campus Cat Guide',
    subtitle: 'Campus Cat Guide',
    personality: 'Playful campus cat for quick tips and study boosts.',
    description: 'Playful campus cat for quick tips and study boosts.',
    badge: 'Feline',
    bodyColor: '#FB923C',
    earInnerColor: '#FDE047',
    accentColor: '#F59E0B',
    secondaryColor: '#C2410C',
    shadowColor: '#EA580C',
    voiceProfile: {
      preferredLangs: ['en-US', 'en-GB', 'en-IN', 'en'],
      genderHint: 'female',
      nameKeywords: ['neerja', 'moira', 'fiona', 'samantha', 'tessa', 'female'],
      defaultRate: 1.04,
      defaultPitch: 1.1,
    },
  },
  {
    id: 'gigi-giraffe',
    name: 'Gigi',
    title: 'Gentle Giraffe',
    role: 'Gentle Giraffe',
    subtitle: 'Gentle Giraffe',
    personality: 'Graceful study buddy for patient walkthroughs.',
    description: 'Graceful study buddy for patient walkthroughs.',
    badge: 'Graceful',
    bodyColor: '#FDE047',
    earInnerColor: '#FEF08A',
    accentColor: '#EAB308',
    secondaryColor: '#92400E',
    shadowColor: '#CA8A04',
    voiceProfile: {
      preferredLangs: ['en-GB', 'en-AU', 'en-ZA', 'en-US', 'en'],
      genderHint: 'female',
      nameKeywords: ['catherine', 'hazel', 'serena', 'martha', 'stephanie', 'female'],
      defaultRate: 0.96,
      defaultPitch: 1.05,
    },
  },
  {
    id: 'lumi-lamp',
    name: 'Lumi',
    title: 'Idea Desk Lamp',
    role: 'Idea Desk Lamp',
    subtitle: 'Idea Desk Lamp',
    personality: 'Bright desk lamp that sparks fresh study ideas.',
    description: 'Bright desk lamp that sparks fresh study ideas.',
    badge: 'Bright',
    bodyColor: '#10B981',
    earInnerColor: '#FEF08A',
    accentColor: '#34D399',
    secondaryColor: '#065F46',
    shadowColor: '#059669',
    voiceProfile: {
      preferredLangs: ['en-US', 'en-CA', 'en-GB', 'en'],
      genderHint: 'neutral',
      nameKeywords: ['allison', 'nicky', 'monica', 'paulina', 'samantha', 'natural'],
      defaultRate: 1.05,
      defaultPitch: 1.14,
    },
  },
];

export const DEFAULT_SAGE_CHARACTER_ID: SageCharacterId = 'sage-classic';

export function getSageCharacterById(id?: string | null): SageCharacterDefinition {
  const found = SAGE_CHARACTERS.find((c) => c.id === id);
  return found || SAGE_CHARACTERS[0];
}

const PROFANITY_BLOCKLIST = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'dick',
  'pussy',
  'cunt',
  'slut',
  'whore',
  'nigger',
  'faggot',
  'chutiya',
  'harami',
  'bhenchod',
  'madarchod',
  'gandu',
  'kanjar',
];

export function escapeSafeDisplayName(raw: string): string {
  return raw
    .replace(/[<>&"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateSageCustomName(rawInput: string): {
  valid: boolean;
  sanitized: string;
  error?: string;
} {
  const cleaned = escapeSafeDisplayName(rawInput || '');
  if (!cleaned || cleaned.length < 1) {
    return { valid: false, sanitized: '', error: 'Name cannot be blank (1 to 20 characters).' };
  }
  if (cleaned.length > 20) {
    return { valid: false, sanitized: cleaned.slice(0, 20), error: 'Name must be 20 characters or fewer.' };
  }
  const lower = cleaned.toLowerCase();
  for (const bad of PROFANITY_BLOCKLIST) {
    if (lower.includes(bad)) {
      return { valid: false, sanitized: '', error: 'Please choose a polite, academy-friendly name.' };
    }
  }
  return { valid: true, sanitized: cleaned };
}

/**
 * Central Theme & Tuning Constants for the 3D Sage Avatar
 */
export const SAGE_AVATAR_THEME = {
  colors: {
    plushBody: '#FFF8EC',
    plushShadow: '#EEDCBE',
    earInner: '#FADADD',
    goldPrimary: '#F4C430',
    goldLight: '#FFE066',
    goldDeep: '#C69214',
    obsidianAccent: '#18181B',
    eyes: '#1E1B18',
    eyeCatchlight: '#FFFFFF',
    blush: '#FF9EAA',
    mouth: '#29221E',
    mouthInner: '#E56B6F',
    glowRing: 'rgba(244, 196, 48, 0.35)',
  },
  sizes: {
    expandedDesktop: 224,
    expandedMobile: 196,
    compactDocked: 106,
    headerThumb: 36,
    bodyScale: 1.0,
    headRatio: 1.08,
  },
  timings: {
    sleepyTimeoutMs: 45_000,
    nodDurationMs: 900,
    successDurationMs: 2_200,
    errorDurationMs: 2_200,
    pokeDurationMs: 1_100,
    blinkMinIntervalSec: 2.4,
    blinkMaxIntervalSec: 5.8,
    blinkDurationSec: 0.16,
  },
} as const;

export const STATE_STATUS_LABELS: Record<Sage3DAvatarState, string> = {
  idle: 'Online',
  typing: 'Watching you type...',
  listening: 'Listening carefully...',
  nod: 'Got it! Thinking...',
  thinking: 'Thinking...',
  speaking: 'Speaking...',
  success: 'Here is what I found!',
  error: 'Hmm, let us try that again',
  sleepy: 'Resting quietly — type or tap to wake',
  poke: 'Hehe! Ready to help!',
};

export interface UseSageAvatarInputs {
  isTyping: boolean;
  isRecording: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  userId?: string | null;
}

export interface SageAvatarController {
  state: Sage3DAvatarState;
  characterId: SageCharacterId;
  character: SageCharacterDefinition;
  customName: string;
  displayName: string;
  setCharacterId: (id: SageCharacterId) => void;
  setCustomName: (rawName: string) => { valid: boolean; sanitized: string; error?: string };
  resetCustomName: () => void;
  audioLevel: number;
  headerStatusText: string;
  stageCaption: string;
  pokeCount: number;
  headerCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  triggerNod: () => void;
  triggerSuccess: () => void;
  triggerError: () => void;
  triggerPoke: () => void;
  wakeUp: () => void;
}

const STORAGE_KEY_AVATAR = 'scholario_sage_avatar_id';
const STORAGE_KEY_CUSTOM_NAME = 'scholario_sage_custom_name';

export function useSageAvatarController(inputs: UseSageAvatarInputs): SageAvatarController {
  const { isTyping, isRecording, isThinking, isSpeaking, audioLevel, userId } = inputs;

  const [characterId, setCharacterIdState] = useState<SageCharacterId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_AVATAR) as SageCharacterId | null;
      if (saved && SAGE_CHARACTERS.some((c) => c.id === saved)) {
        return saved;
      }
    }
    return DEFAULT_SAGE_CHARACTER_ID;
  });

  const [customName, setCustomNameState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_NAME) || '';
      const check = validateSageCustomName(raw);
      return check.valid ? check.sanitized : '';
    }
    return '';
  });

  const [transientState, setTransientState] = useState<
    'nod' | 'success' | 'error' | 'poke' | null
  >(null);
  const [isSleepy, setIsSleepy] = useState(false);
  const [pokeCount, setPokeCount] = useState(0);

  const transientTimerRef = useRef<number | null>(null);
  const sleepyTimerRef = useRef<number | null>(null);
  const headerCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync character choice & custom name from Supabase Auth user_metadata / profiles when logged in
  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!isMounted || !data?.user) return;
        const meta = data.user.user_metadata || {};
        const remoteId = meta.sage_avatar_id as SageCharacterId | undefined;
        if (remoteId && SAGE_CHARACTERS.some((c) => c.id === remoteId)) {
          setCharacterIdState(remoteId);
          try {
            localStorage.setItem(STORAGE_KEY_AVATAR, remoteId);
          } catch {}
        }
        if (typeof meta.sage_custom_name === 'string') {
          const check = validateSageCustomName(meta.sage_custom_name);
          const resolvedName = check.valid ? check.sanitized : '';
          setCustomNameState(resolvedName);
          try {
            if (resolvedName) {
              localStorage.setItem(STORAGE_KEY_CUSTOM_NAME, resolvedName);
            } else {
              localStorage.removeItem(STORAGE_KEY_CUSTOM_NAME);
            }
          } catch {}
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const persistProfilePrefs = useCallback(
    (nextAvatarId?: SageCharacterId, nextCustomName?: string) => {
      if (!userId) return;
      const updateMeta: Record<string, any> = {};
      if (nextAvatarId !== undefined) updateMeta.sage_avatar_id = nextAvatarId;
      if (nextCustomName !== undefined) updateMeta.sage_custom_name = nextCustomName;

      supabase.auth.updateUser({ data: updateMeta }).catch(() => {});

      // Also attempt to persist to profiles table if the optional columns exist
      const profilePatch: Record<string, any> = {};
      if (nextAvatarId !== undefined) profilePatch.sage_avatar_id = nextAvatarId;
      if (nextCustomName !== undefined) profilePatch.sage_custom_name = nextCustomName || null;
      if (Object.keys(profilePatch).length > 0) {
        try {
          (supabase.from('profiles') as any)
            .update(profilePatch)
            .eq('id', userId)
            .then(() => {}, () => {});
        } catch {}
      }
    },
    [userId]
  );

  const setCharacterId = useCallback(
    (newId: SageCharacterId) => {
      if (!SAGE_CHARACTERS.some((c) => c.id === newId)) return;
      setCharacterIdState(newId);
      try {
        localStorage.setItem(STORAGE_KEY_AVATAR, newId);
      } catch {}
      persistProfilePrefs(newId, undefined);
    },
    [persistProfilePrefs]
  );

  const setCustomName = useCallback(
    (rawName: string): { valid: boolean; sanitized: string; error?: string } => {
      const check = validateSageCustomName(rawName);
      if (!check.valid) {
        return { valid: false, sanitized: '', error: check.error };
      }
      setCustomNameState(check.sanitized);
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM_NAME, check.sanitized);
      } catch {}
      persistProfilePrefs(undefined, check.sanitized);
      return { valid: true, sanitized: check.sanitized };
    },
    [persistProfilePrefs]
  );

  const resetCustomName = useCallback(() => {
    setCustomNameState('');
    try {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_NAME);
    } catch {}
    persistProfilePrefs(undefined, '');
  }, [persistProfilePrefs]);

  const clearTransientTimer = useCallback(() => {
    if (transientTimerRef.current !== null) {
      window.clearTimeout(transientTimerRef.current);
      transientTimerRef.current = null;
    }
  }, []);

  const resetSleepyTimer = useCallback(() => {
    setIsSleepy(false);
    if (sleepyTimerRef.current !== null) {
      window.clearTimeout(sleepyTimerRef.current);
    }
    sleepyTimerRef.current = window.setTimeout(() => {
      setIsSleepy(true);
    }, SAGE_AVATAR_THEME.timings.sleepyTimeoutMs);
  }, []);

  useEffect(() => {
    if (isTyping || isRecording || isThinking || isSpeaking || transientState) {
      resetSleepyTimer();
    }
  }, [isTyping, isRecording, isThinking, isSpeaking, transientState, resetSleepyTimer]);

  useEffect(() => {
    resetSleepyTimer();
    return () => {
      clearTransientTimer();
      if (sleepyTimerRef.current !== null) {
        window.clearTimeout(sleepyTimerRef.current);
      }
    };
  }, [resetSleepyTimer, clearTransientTimer]);

  const triggerNod = useCallback(() => {
    clearTransientTimer();
    setIsSleepy(false);
    setTransientState('nod');
    transientTimerRef.current = window.setTimeout(() => {
      setTransientState((prev) => (prev === 'nod' ? null : prev));
    }, SAGE_AVATAR_THEME.timings.nodDurationMs);
  }, [clearTransientTimer]);

  const triggerSuccess = useCallback(() => {
    clearTransientTimer();
    setIsSleepy(false);
    setTransientState('success');
    transientTimerRef.current = window.setTimeout(() => {
      setTransientState((prev) => (prev === 'success' ? null : prev));
    }, SAGE_AVATAR_THEME.timings.successDurationMs);
  }, [clearTransientTimer]);

  const triggerError = useCallback(() => {
    clearTransientTimer();
    setIsSleepy(false);
    setTransientState('error');
    transientTimerRef.current = window.setTimeout(() => {
      setTransientState((prev) => (prev === 'error' ? null : prev));
    }, SAGE_AVATAR_THEME.timings.errorDurationMs);
  }, [clearTransientTimer]);

  const triggerPoke = useCallback(() => {
    clearTransientTimer();
    setIsSleepy(false);
    setPokeCount((c) => c + 1);
    setTransientState('poke');
    transientTimerRef.current = window.setTimeout(() => {
      setTransientState((prev) => (prev === 'poke' ? null : prev));
    }, SAGE_AVATAR_THEME.timings.pokeDurationMs);
  }, [clearTransientTimer]);

  const wakeUp = useCallback(() => {
    resetSleepyTimer();
  }, [resetSleepyTimer]);

  // Priority resolution of the active state
  const state: Sage3DAvatarState = useMemo(() => {
    if (transientState === 'poke') return 'poke';
    if (isSpeaking) return 'speaking';
    if (isRecording) return 'listening';
    if (transientState === 'nod') return 'nod';
    if (isThinking) return 'thinking';
    if (transientState === 'error') return 'error';
    if (transientState === 'success') return 'success';
    if (isTyping) return 'typing';
    if (isSleepy) return 'sleepy';
    return 'idle';
  }, [transientState, isSpeaking, isRecording, isThinking, isTyping, isSleepy]);

  const character = useMemo(() => getSageCharacterById(characterId), [characterId]);
  const displayName = useMemo(
    () => (customName && customName.trim().length > 0 ? customName.trim() : character.name),
    [customName, character.name]
  );
  const headerStatusText = STATE_STATUS_LABELS[state];
  const stageCaption = STATE_STATUS_LABELS[state];

  return {
    state,
    characterId,
    character,
    customName,
    displayName,
    setCharacterId,
    setCustomName,
    resetCustomName,
    audioLevel,
    headerStatusText,
    stageCaption,
    pokeCount,
    headerCanvasRef,
    triggerNod,
    triggerSuccess,
    triggerError,
    triggerPoke,
    wakeUp,
  };
}

const SageAvatarStateContext = createContext<SageAvatarController | null>(null);

export const SageAvatarStateProvider = SageAvatarStateContext.Provider;

export function useSageAvatarState(): SageAvatarController {
  const ctx = useContext(SageAvatarStateContext);
  if (!ctx) {
    throw new Error('useSageAvatarState must be used within a SageAvatarStateProvider');
  }
  return ctx;
}
