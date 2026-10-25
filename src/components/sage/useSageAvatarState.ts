import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

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

export type TransientAvatarState = 'nod' | 'success' | 'error' | 'poke';

export type SageCharacterId =
  | 'sage-classic'
  | 'ayan-scholar'
  | 'zain-explorer'
  | 'hamza-kurta'
  | 'nova-bot'
  | 'milo-owl';

export interface SageCharacterDefinition {
  id: SageCharacterId;
  name: string;
  title: string;
  role: string;
  personality: string;
  tagline: string;
  badge: string;
  accentColor: string;
  bodyColor: string;
  shadowColor: string;
  rimColor: string;
  earInnerColor: string;
  accentGold: string;
  outfitPrimary: string;
}

export const SAGE_CHARACTERS: SageCharacterDefinition[] = [
  {
    id: 'sage-classic',
    name: 'Sage',
    title: 'Classic Scholar',
    role: 'Classic Scholar',
    personality: 'Erudite, encouraging, and classic academy wisdom',
    tagline: 'Cream plush companion with graduation cap & gold scarf',
    badge: 'Classic',
    accentColor: '#F4C430',
    bodyColor: '#FFFBF2',
    shadowColor: '#EFE4CE',
    rimColor: '#FFF2C2',
    earInnerColor: '#F9D5C4',
    accentGold: '#F4C430',
    outfitPrimary: '#18181B',
  },
  {
    id: 'ayan-scholar',
    name: 'Ayan',
    title: 'Head Boy Scholar',
    role: 'Head Boy Scholar',
    personality: 'Calm, disciplined, methodical, and high-achieving',
    tagline: 'Taller oval silhouette, deep brown skin, round gold glasses & navy school blazer with tie',
    badge: 'Scholar',
    accentColor: '#2563EB',
    bodyColor: '#8D5524',
    shadowColor: '#6E3D19',
    rimColor: '#D4A373',
    earInnerColor: '#703E1C',
    accentGold: '#F4C430',
    outfitPrimary: '#1E3A8A',
  },
  {
    id: 'zain-explorer',
    name: 'Zain',
    title: 'Campus Explorer',
    role: 'Campus Explorer',
    personality: 'Hyper, bouncy, curious, and full of energy',
    tagline: 'Wide round head, warm tan skin, curly hair under bright orange beanie & backpack',
    badge: 'Explorer',
    accentColor: '#F97316',
    bodyColor: '#C68642',
    shadowColor: '#9C5B23',
    rimColor: '#E6A868',
    earInnerColor: '#A8652D',
    accentGold: '#F4C430',
    outfitPrimary: '#EA580C',
  },
  {
    id: 'hamza-kurta',
    name: 'Hamza',
    title: 'Traditional Scholar',
    role: 'Traditional Scholar',
    personality: 'Gentle, respectful, humble, and serene',
    tagline: 'Square-ish head, light-brown complexion, neat beard shadow, white prayer topi & gold-buttoned kurta',
    badge: 'Traditional',
    accentColor: '#10B981',
    bodyColor: '#D89B62',
    shadowColor: '#B0753E',
    rimColor: '#ECC495',
    earInnerColor: '#BE834E',
    accentGold: '#F4C430',
    outfitPrimary: '#F8FAFC',
  },
  {
    id: 'nova-bot',
    name: 'Nova',
    title: 'Cyber Companion',
    role: 'Cyber Companion',
    personality: 'Futuristic, visor-displaying, witty, and ultra-fast',
    tagline: 'Rounded-rectangle mechanical head, expressive visor screen, floating hover thruster & antenna',
    badge: 'Cyber Bot',
    accentColor: '#06B6D4',
    bodyColor: '#F8FAFC',
    shadowColor: '#CBD5E1',
    rimColor: '#38BDF8',
    earInnerColor: '#06B6D4',
    accentGold: '#F4C430',
    outfitPrimary: '#0F172A',
  },
  {
    id: 'milo-owl',
    name: 'Milo',
    title: 'Library Owl',
    role: 'Library Owl',
    personality: 'Wise, cozy, book-loving, and gently hooting',
    tagline: 'Fluffy feathered body, large ear-tufts, reading glasses, flapping wings & open study book',
    badge: 'Library Owl',
    accentColor: '#D97706',
    bodyColor: '#E6D2B5',
    shadowColor: '#B8976C',
    rimColor: '#FDE68A',
    earInnerColor: '#C49F74',
    accentGold: '#F4C430',
    outfitPrimary: '#78350F',
  },
];

export const DEFAULT_SAGE_CHARACTER_ID: SageCharacterId = 'sage-classic';

export function isValidSageCharacterId(val: unknown): val is SageCharacterId {
  return (
    typeof val === 'string' &&
    SAGE_CHARACTERS.some((c) => c.id === val)
  );
}

export function getSageCharacterById(id?: SageCharacterId | string | null): SageCharacterDefinition {
  return SAGE_CHARACTERS.find((c) => c.id === id) || SAGE_CHARACTERS[0];
}

/**
 * Central configuration for Sage's appearance, colors, dimensions, and accessories.
 * Edit these values in one place to customize Sage's look across 3D and 2D views.
 */
export const SAGE_AVATAR_THEME = {
  colors: {
    plushBody: '#FFFBF2',         // Soft warm cream / ivory plush fur
    plushShadow: '#EFE4CE',       // Subtle warm shading tone
    plushRimGlow: '#FFF2C2',      // Soft Fresnel rim highlight
    earInner: '#F9D5C4',          // Warm peach inner ear tint
    eyes: '#191716',              // Deep expressive charcoal eyes
    eyeCatchlight: '#FFFFFF',     // Glossy white eye highlights
    blush: '#F59B95',             // Soft coral-rose cheek blush
    mouth: '#2B221E',             // Cute tiny mouth line
    mouthInner: '#E07A74',        // Open speaking mouth inner tint
    goldPrimary: '#F4C430',       // Scholario signature gold
    goldDeep: '#D4A017',          // Brushed gold accent
    obsidianAccent: '#18181B',    // Scholario obsidian cap & scarf stripe
  },
  sizes: {
    heroHeightPx: 200,            // Height (px) when centered in fresh chat
    compactHeightPx: 72,          // Height (px) when docked at top of active chat
    bodyScale: 1.0,               // Overall character scale multiplier
  },
  accessories: {
    showGraduationCap: true,      // Tilted Scholario black & gold mortarboard cap
    showGoldScarf: true,          // Cozy gold & obsidian academic neck scarf
    showStarPin: true,            // Gleaming gold star pin on the scarf
    showFloatingBook: false,      // Optional mini floating book prop
  },
  inactivitySleepMs: 45000,       // Enter sleepy state after 45 seconds of inactivity
} as const;

export interface SageAvatarControllerInput {
  isTyping?: boolean;
  isRecording?: boolean;
  isThinking?: boolean;
  isSpeaking?: boolean;
  audioLevel?: number;
  userId?: string;
}

export interface SageAvatarStateValue {
  /** Final resolved animation state for the avatar */
  state: Sage3DAvatarState;
  /** Currently selected character ID (persisted per user + localStorage) */
  characterId: SageCharacterId;
  /** Full metadata for the active character */
  character: SageCharacterDefinition;
  /** Select and persist a new character */
  setCharacterId: (id: SageCharacterId) => void;
  /** Shared canvas ref for live-mirroring the 3D WebGL avatar into the header thumbnail */
  headerCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Real-time audio volume 0..1 for lip-sync or listening pulse */
  audioLevel: number;
  /** Short, clean status text for the header subtitle ("Online", "Thinking...", "Speaking...") */
  headerStatusText: string;
  /** Friendly caption for the stage or compact bar */
  stageCaption: string;
  /** Counter incremented each time the user taps the avatar */
  pokeCount: number;
  /** Imperative triggers for chat, TTS, and PDF events */
  triggerNod: () => void;
  triggerSuccess: () => void;
  triggerError: () => void;
  triggerPoke: () => void;
  wakeUp: () => void;
}

const TRANSIENT_DURATIONS: Record<TransientAvatarState, number> = {
  nod: 700,
  success: 2200,
  error: 2600,
  poke: 1600,
};

const STORAGE_KEY_GLOBAL = 'scholario_sage_avatar_id';

export function useSageAvatarController(input: SageAvatarControllerInput = {}): SageAvatarStateValue {
  const {
    isTyping = false,
    isRecording = false,
    isThinking = false,
    isSpeaking = false,
    audioLevel = 0,
    userId,
  } = input;

  const [characterId, setCharacterIdState] = useState<SageCharacterId>(() => {
    if (typeof window === 'undefined') return DEFAULT_SAGE_CHARACTER_ID;
    try {
      if (userId) {
        const userSaved = window.localStorage.getItem(`${STORAGE_KEY_GLOBAL}_${userId}`);
        if (isValidSageCharacterId(userSaved)) return userSaved;
      }
      const globalSaved = window.localStorage.getItem(STORAGE_KEY_GLOBAL);
      if (isValidSageCharacterId(globalSaved)) return globalSaved;
    } catch {
      // ignore storage errors
    }
    return DEFAULT_SAGE_CHARACTER_ID;
  });

  const [transientState, setTransientState] = useState<TransientAvatarState | null>(null);
  const [isSleepy, setIsSleepy] = useState(false);
  const [pokeCount, setPokeCount] = useState(0);

  const headerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const transientTimerRef = useRef<number | null>(null);
  const sleepTimerRef = useRef<number | null>(null);

  // Restore user preference from user_metadata or per-user localStorage when userId resolves
  useEffect(() => {
    let mounted = true;
    try {
      if (userId) {
        const userSaved = window.localStorage.getItem(`${STORAGE_KEY_GLOBAL}_${userId}`);
        if (isValidSageCharacterId(userSaved)) {
          setCharacterIdState(userSaved);
        }
      }
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      supabase.auth
        .getUser()
        .then(({ data }) => {
          if (!mounted) return;
          const metaAvatar = data?.user?.user_metadata?.sage_avatar_id;
          if (isValidSageCharacterId(metaAvatar)) {
            setCharacterIdState(metaAvatar);
            try {
              window.localStorage.setItem(STORAGE_KEY_GLOBAL, metaAvatar);
              if (data?.user?.id) {
                window.localStorage.setItem(`${STORAGE_KEY_GLOBAL}_${data.user.id}`, metaAvatar);
              }
            } catch {
              // ignore
            }
          }
        })
        .catch(() => {
          // ignore offline/guest
        });
    }

    return () => {
      mounted = false;
    };
  }, [userId]);

  const setCharacterId = useCallback(
    (nextId: SageCharacterId) => {
      if (!isValidSageCharacterId(nextId)) return;
      setCharacterIdState(nextId);
      try {
        window.localStorage.setItem(STORAGE_KEY_GLOBAL, nextId);
        if (userId) {
          window.localStorage.setItem(`${STORAGE_KEY_GLOBAL}_${userId}`, nextId);
        }
      } catch {
        // ignore storage errors
      }
      // Persist to Supabase user metadata asynchronously in background
      if (isSupabaseConfigured) {
        supabase.auth
          .updateUser({ data: { sage_avatar_id: nextId } })
          .catch(() => {
            // ignore if not signed into Supabase
          });
      }
    },
    [userId]
  );

  const clearTransientTimer = useCallback(() => {
    if (transientTimerRef.current !== null) {
      window.clearTimeout(transientTimerRef.current);
      transientTimerRef.current = null;
    }
  }, []);

  const resetSleepTimer = useCallback(() => {
    setIsSleepy((prev) => (prev ? false : prev));
    if (sleepTimerRef.current !== null) {
      window.clearTimeout(sleepTimerRef.current);
    }
    sleepTimerRef.current = window.setTimeout(() => {
      setIsSleepy(true);
    }, SAGE_AVATAR_THEME.inactivitySleepMs);
  }, []);

  const fireTransient = useCallback(
    (next: TransientAvatarState) => {
      resetSleepTimer();
      clearTransientTimer();
      setTransientState(next);
      transientTimerRef.current = window.setTimeout(() => {
        setTransientState(null);
        transientTimerRef.current = null;
      }, TRANSIENT_DURATIONS[next]);
    },
    [clearTransientTimer, resetSleepTimer]
  );

  const triggerNod = useCallback(() => fireTransient('nod'), [fireTransient]);
  const triggerSuccess = useCallback(() => fireTransient('success'), [fireTransient]);
  const triggerError = useCallback(() => fireTransient('error'), [fireTransient]);
  const triggerPoke = useCallback(() => {
    setPokeCount((c) => c + 1);
    fireTransient('poke');
  }, [fireTransient]);

  const wakeUp = useCallback(() => {
    resetSleepTimer();
  }, [resetSleepTimer]);

  // Reset inactivity timer whenever active states change
  useEffect(() => {
    if (isTyping || isRecording || isThinking || isSpeaking) {
      resetSleepTimer();
    }
  }, [isTyping, isRecording, isThinking, isSpeaking, resetSleepTimer]);

  // Listen for user interaction in the window to wake up Sage
  useEffect(() => {
    resetSleepTimer();
    const handleActivity = () => {
      resetSleepTimer();
    };
    window.addEventListener('pointerdown', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearTransientTimer();
      if (sleepTimerRef.current !== null) {
        window.clearTimeout(sleepTimerRef.current);
      }
    };
  }, [resetSleepTimer, clearTransientTimer]);

  // Priority resolution for avatar state
  let resolvedState: Sage3DAvatarState = 'idle';
  if (transientState === 'poke') {
    resolvedState = 'poke';
  } else if (transientState === 'error') {
    resolvedState = 'error';
  } else if (isRecording) {
    resolvedState = 'listening';
  } else if (isSpeaking) {
    resolvedState = 'speaking';
  } else if (transientState === 'nod') {
    resolvedState = 'nod';
  } else if (isThinking) {
    resolvedState = 'thinking';
  } else if (transientState === 'success') {
    resolvedState = 'success';
  } else if (isTyping) {
    resolvedState = 'typing';
  } else if (isSleepy) {
    resolvedState = 'sleepy';
  } else {
    resolvedState = 'idle';
  }

  let headerStatusText = 'Online';
  let stageCaption = 'Ready to help with your studies';

  switch (resolvedState) {
    case 'speaking':
      headerStatusText = 'Speaking...';
      stageCaption = 'Explaining step by step...';
      break;
    case 'thinking':
      headerStatusText = 'Thinking...';
      stageCaption = 'Thinking through your question...';
      break;
    case 'listening':
      headerStatusText = 'Listening...';
      stageCaption = 'Listening to your voice note...';
      break;
    case 'typing':
      headerStatusText = 'Online';
      stageCaption = 'Reading what you are typing...';
      break;
    case 'nod':
      headerStatusText = 'Thinking...';
      stageCaption = 'Got it! Working on that...';
      break;
    case 'success':
      headerStatusText = 'Online';
      stageCaption = 'All done! Hope that helps!';
      break;
    case 'error':
      headerStatusText = 'Online';
      stageCaption = 'Oops, something went wrong — let’s try again';
      break;
    case 'poke':
      headerStatusText = 'Online';
      stageCaption = 'Hehe! Ready whenever you are!';
      break;
    case 'sleepy':
      headerStatusText = 'Online';
      stageCaption = 'Resting quietly... tap or type to wake me';
      break;
    default:
      headerStatusText = 'Online';
      stageCaption = 'Ask me anything or tap me to say hello';
      break;
  }

  const character = getSageCharacterById(characterId);

  return {
    state: resolvedState,
    characterId,
    character,
    setCharacterId,
    headerCanvasRef,
    audioLevel,
    headerStatusText,
    stageCaption,
    pokeCount,
    triggerNod,
    triggerSuccess,
    triggerError,
    triggerPoke,
    wakeUp,
  };
}

const SageAvatarStateContext = createContext<SageAvatarStateValue | null>(null);

export const SageAvatarStateProvider: React.FC<{
  value: SageAvatarStateValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return React.createElement(SageAvatarStateContext.Provider, { value }, children);
};

export function useSageAvatarState(): SageAvatarStateValue {
  const ctx = useContext(SageAvatarStateContext);
  if (!ctx) {
    throw new Error('useSageAvatarState must be used within a SageAvatarStateProvider');
  }
  return ctx;
}
