/**
 * Sage AI Speech & Text-to-Speech (TTS) Engine
 *
 * - Deterministic, permanent per-avatar voice assignment (Task 2):
 *   Each of the 9 Sage characters has a deterministic voice profile (preferredLangs,
 *   genderHint, nameKeywords, defaultRate, defaultPitch) matched from speechSynthesis.getVoices().
 *   Never uses Math.random() to pick a voice.
 * - Handles asynchronous voice loading via `voiceschanged` + multi-step retry for browsers & Android WebView.
 * - Persists user-customized voice URI, speed (rate), and pitch per avatar in localStorage & Supabase user_metadata.
 * - Detects Urdu text and selects an Urdu-capable voice if installed, or gently informs the student if none is installed.
 * - Emits real-time audio volume levels (0..1) to drive the 3D Sage Avatar's speaking lip-sync animation.
 */

import {
  SageCharacterId,
  getSageCharacterById,
  SAGE_CHARACTERS,
} from '../components/sage/useSageAvatarState';
import { supabase } from './supabase';

export type SpeechPlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export type SpeechSpeed = 0.75 | 1 | 1.25 | 1.5;

export interface AvatarVoiceSettings {
  voiceUri: string; // '' means automatic deterministic default for this avatar
  voiceURI?: string;
  rate: number;     // 0.5 .. 1.75
  pitch: number;    // 0.5 .. 1.5
}

export type AvatarVoicePreference = AvatarVoiceSettings;

const VOICE_PREFS_STORAGE_KEY = 'scholario_sage_voice_prefs_v1';

const URDU_SCRIPT_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function containsUrduScript(text: string): boolean {
  return URDU_SCRIPT_REGEX.test(text || '');
}

/**
 * Converts a LaTeX math expression into natural spoken English words
 */
export function latexFormulaToSpokenText(formula: string): string {
  if (!formula) return '';
  let s = formula.trim();

  s = s.replace(/^\$\$|\$\$$/g, '').replace(/^\$|\$$/g, '');

  s = s.replace(/\\text\{([^{}]*)\}/g, ' $1 ');
  s = s.replace(/\\mathrm\{([^{}]*)\}/g, ' $1 ');
  s = s.replace(/\\mathbf\{([^{}]*)\}/g, ' $1 ');
  s = s.replace(/\\mathbb\{R\}/g, ' real numbers ');
  s = s.replace(/\\mathbb\{Z\}/g, ' integers ');
  s = s.replace(/\\mathbb\{N\}/g, ' natural numbers ');
  s = s.replace(/\\mathbb\{Q\}/g, ' rational numbers ');
  s = s.replace(/\\overline\{([^{}]*)\}/g, ' repeating $1 ');
  s = s.replace(/\\bar\{([^{}]*)\}/g, ' $1 bar ');
  s = s.replace(/\\vec\{([^{}]*)\}/g, ' vector $1 ');
  s = s.replace(/\\hat\{([^{}]*)\}/g, ' $1 hat ');

  for (let i = 0; i < 4; i++) {
    s = s.replace(/\\(?:d|t)?frac\{([^{}]*)\}\{([^{}]*)\}/g, ' ($1) over ($2) ');
  }

  s = s.replace(/\\sqrt\[3\]\{([^{}]*)\}/g, ' cube root of $1 ');
  s = s.replace(/\\sqrt\[([^{}\]]*)\]\{([^{}]*)\}/g, ' $1th root of $2 ');
  for (let i = 0; i < 3; i++) {
    s = s.replace(/\\sqrt\{([^{}]*)\}/g, ' square root of $1 ');
  }

  s = s.replace(/\^\{2\}|\^2(?![0-9])/g, ' squared ');
  s = s.replace(/\^\{3\}|\^3(?![0-9])/g, ' cubed ');
  s = s.replace(/\^\{-1\}/g, ' inverse ');
  s = s.replace(/\^\{([^{}]+)\}/g, ' to the power of $1 ');
  s = s.replace(/\^([a-zA-Z0-9]+)/g, ' to the power of $1 ');

  s = s.replace(/_\{([^{}]+)\}/g, ' sub $1 ');
  s = s.replace(/_([a-zA-Z0-9]+)/g, ' sub $1 ');

  const symbolMap: Array<[RegExp, string]> = [
    [/\\pi\b/g, ' pi '],
    [/\\theta\b/g, ' theta '],
    [/\\alpha\b/g, ' alpha '],
    [/\\beta\b/g, ' beta '],
    [/\\gamma\b/g, ' gamma '],
    [/\\delta\b/g, ' delta '],
    [/\\Delta\b/g, ' change in '],
    [/\\lambda\b/g, ' lambda '],
    [/\\mu\b/g, ' mu '],
    [/\\sigma\b/g, ' sigma '],
    [/\\omega\b/g, ' omega '],
    [/\\Omega\b/g, ' ohms '],
    [/\\infty\b/g, ' infinity '],
    [/\\pm\b/g, ' plus or minus '],
    [/\\mp\b/g, ' minus or plus '],
    [/\\times\b/g, ' times '],
    [/\\cdot\b/g, ' times '],
    [/\\div\b/g, ' divided by '],
    [/\\neq\b|\\ne\b/g, ' is not equal to '],
    [/\\leq\b|\\le\b/g, ' is less than or equal to '],
    [/\\geq\b|\\ge\b/g, ' is greater than or equal to '],
    [/\\approx\b/g, ' is approximately equal to '],
    [/\\propto\b/g, ' is proportional to '],
    [/\\equiv\b/g, ' is equivalent to '],
    [/\\rightarrow\b|\\to\b|\\longrightarrow\b/g, ' yields '],
    [/\\Rightarrow\b/g, ' implies '],
    [/\\leftrightarrow\b|\\rightleftharpoons\b/g, ' is in equilibrium with '],
    [/\\sum\b/g, ' the sum of '],
    [/\\prod\b/g, ' the product of '],
    [/\\int\b/g, ' the integral of '],
    [/\\partial\b/g, ' partial '],
    [/\\therefore\b/g, ' therefore '],
    [/\\because\b/g, ' because '],
    [/\\in\b/g, ' in '],
    [/\\notin\b/g, ' not in '],
    [/\\subset\b/g, ' is a subset of '],
    [/\\cup\b/g, ' union '],
    [/\\cap\b/g, ' intersection '],
    [/\\emptyset\b/g, ' the empty set '],
    [/\\sin\b/g, ' sine '],
    [/\\cos\b/g, ' cosine '],
    [/\\tan\b/g, ' tangent '],
    [/\\log\b/g, ' log '],
    [/\\ln\b/g, ' natural log '],
    [/\\lim\b/g, ' limit '],
    [/\\left\b|\\right\b/g, ' '],
    [/\\,/g, ' '],
    [/\\;/g, ' '],
    [/\\!/g, ' '],
    [/\\quad\b|\\qquad\b/g, ' '],
  ];

  for (const [pattern, replacement] of symbolMap) {
    s = s.replace(pattern, replacement);
  }

  s = s.replace(/\s*=\s*/g, ' equals ');
  s = s.replace(/\s*\+\s*/g, ' plus ');
  s = s.replace(/([0-9a-zA-Z)\]}])\s*-\s*([0-9a-zA-Z(\[{])/g, '$1 minus $2');
  s = s.replace(/°/g, ' degrees ');

  s = s.replace(/\\[a-zA-Z]+/g, ' ');
  s = s.replace(/[{}]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

/**
 * Converts Markdown + LaTeX into clean, natural text suitable for TTS playback.
 */
export function markdownAndMathToSpeechText(rawContent: string): {
  text: string;
  isUrdu: boolean;
} {
  if (!rawContent) return { text: '', isUrdu: false };

  let text = rawContent;

  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner) => ` ${latexFormulaToSpokenText(inner)}. `);
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => ` ${latexFormulaToSpokenText(inner)}. `);

  text = text.replace(/\$([^\n$]+?)\$/g, (_m, inner) => ` ${latexFormulaToSpokenText(inner)} `);
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => ` ${latexFormulaToSpokenText(inner)} `);

  text = text.replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, (_m, code) => {
    const cleanCode = String(code || '').replace(/[{}();<>]/g, ' ').replace(/\s+/g, ' ').trim();
    return cleanCode ? ` Code snippet: ${cleanCode.slice(0, 240)}. ` : '';
  });
  text = text.replace(/`([^`]+)`/g, '$1');

  text = text
    .split('\n')
    .filter((line) => !/^\s*\|?[\s:-]+\|[\s|:-]*$/.test(line))
    .map((line) => {
      if (line.includes('|')) {
        return line
          .split('|')
          .map((cell) => cell.trim())
          .filter(Boolean)
          .join(', ');
      }
      return line;
    })
    .join('\n');

  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/^>\s+/gm, '');
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  text = text.replace(/^\s*[-*•]\s+/gm, '');

  text = text
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, '. ')
    .replace(/\.\s*\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();

  const isUrdu = containsUrduScript(text);
  return { text, isUrdu };
}

interface SpeechCallbacks {
  onStatusChange?: (status: SpeechPlaybackStatus, messageId: string | null, errorMsg?: string) => void;
  onVolumeChange?: (volume: number) => void;
  onNotice?: (noticeMsg: string) => void;
}

class SageSpeechManager {
  private currentMessageId: string | null = null;
  private status: SpeechPlaybackStatus = 'idle';
  private speed: SpeechSpeed = 1;
  private activeCharacterId: SageCharacterId = 'sage-classic';
  private callbacks: SpeechCallbacks = {};
  private voiceChangeListeners = new Set<() => void>();

  // Per-avatar persisted settings
  private voicePrefs: Record<string, AvatarVoiceSettings> = {};

  // Web Speech API state
  private utterance: SpeechSynthesisUtterance | null = null;
  private synthCadenceTimer: number | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private urduNoticeShownInSession = false;

  // HTML5 Audio + Web Audio API state (for /api/sage/tts fallback)
  private audioEl: HTMLAudioElement | null = null;
  private audioUrl: string | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserRaf: number | null = null;
  private abortController: AbortController | null = null;

  constructor() {
    this.loadSavedVoicePrefs();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.refreshVoices();
      try {
        window.speechSynthesis.addEventListener?.('voiceschanged', () => {
          this.refreshVoices();
        });
      } catch {
        window.speechSynthesis.onvoiceschanged = () => {
          this.refreshVoices();
        };
      }
      // Retry loop for Android WebView & mobile browsers where voices populate slightly after load
      [150, 500, 1200, 2500].forEach((delay) => {
        window.setTimeout(() => {
          if (this.cachedVoices.length === 0) {
            this.refreshVoices();
          }
        }, delay);
      });
    }
  }

  private loadSavedVoicePrefs() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(VOICE_PREFS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.voicePrefs = parsed;
        }
      }
    } catch {}
  }

  private saveVoicePrefsToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(VOICE_PREFS_STORAGE_KEY, JSON.stringify(this.voicePrefs));
    } catch {}
    // Non-blocking sync to Supabase user_metadata if user is signed in
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data?.session?.user) {
          supabase.auth
            .updateUser({ data: { sage_voice_prefs: this.voicePrefs } })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }

  public syncVoicePrefsFromUserMetadata(remotePrefs?: Record<string, AvatarVoiceSettings> | null) {
    if (!remotePrefs || typeof remotePrefs !== 'object') return;
    this.voicePrefs = { ...this.voicePrefs, ...remotePrefs };
    try {
      localStorage.setItem(VOICE_PREFS_STORAGE_KEY, JSON.stringify(this.voicePrefs));
    } catch {}
    this.notifyVoiceListeners();
  }

  private refreshVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const list = window.speechSynthesis.getVoices() || [];
      if (list.length > 0) {
        // Sort deterministically by lang then name so order is 100% stable across calls
        this.cachedVoices = [...list].sort((a, b) => {
          const langCmp = (a.lang || '').localeCompare(b.lang || '');
          if (langCmp !== 0) return langCmp;
          return (a.name || '').localeCompare(b.name || '');
        });
        this.notifyVoiceListeners();
      }
    } catch {}
  }

  public async ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    this.refreshVoices();
    if (this.cachedVoices.length > 0) return this.cachedVoices;

    // Wait up to 900ms with retries for async voiceschanged (especially on Android WebView)
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise<void>((resolve) => {
        const timer = window.setTimeout(resolve, 280);
        const onChanged = () => {
          window.clearTimeout(timer);
          resolve();
        };
        try {
          window.speechSynthesis.addEventListener?.('voiceschanged', onChanged, { once: true });
        } catch {
          window.speechSynthesis.onvoiceschanged = onChanged;
        }
      });
      this.refreshVoices();
      if (this.cachedVoices.length > 0) break;
    }

    return this.cachedVoices;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.cachedVoices.length === 0) {
      this.refreshVoices();
    }
    return this.cachedVoices;
  }

  public subscribeVoicesChanged(listener: () => void): () => void {
    this.voiceChangeListeners.add(listener);
    return () => {
      this.voiceChangeListeners.delete(listener);
    };
  }

  public onVoicesReady(listener: (voices: SpeechSynthesisVoice[]) => void): () => void {
    const wrapped = () => {
      listener(this.getAvailableVoices());
    };
    this.voiceChangeListeners.add(wrapped);
    if (this.cachedVoices.length > 0) {
      try {
        listener(this.cachedVoices);
      } catch {}
    }
    return () => {
      this.voiceChangeListeners.delete(wrapped);
    };
  }

  private notifyVoiceListeners() {
    this.voiceChangeListeners.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
  }

  public setActiveCharacter(characterId: SageCharacterId) {
    this.activeCharacterId = characterId;
  }

  public getActiveCharacter(): SageCharacterId {
    return this.activeCharacterId;
  }

  public getAvatarVoiceSettings(characterId: SageCharacterId = this.activeCharacterId): AvatarVoiceSettings {
    const charDef = getSageCharacterById(characterId);
    const saved = this.voicePrefs[characterId];
    const resolvedUri = saved?.voiceUri ?? saved?.voiceURI ?? '';
    return {
      voiceUri: resolvedUri,
      voiceURI: resolvedUri,
      rate:
        typeof saved?.rate === 'number' && !Number.isNaN(saved.rate)
          ? Math.max(0.5, Math.min(1.75, saved.rate))
          : charDef.voiceProfile.defaultRate,
      pitch:
        typeof saved?.pitch === 'number' && !Number.isNaN(saved.pitch)
          ? Math.max(0.5, Math.min(1.5, saved.pitch))
          : charDef.voiceProfile.defaultPitch,
    };
  }

  public getAvatarVoicePref(characterId: SageCharacterId = this.activeCharacterId): AvatarVoicePreference {
    return this.getAvatarVoiceSettings(characterId);
  }

  public setAvatarVoiceSettings(
    characterId: SageCharacterId,
    patch: Partial<AvatarVoiceSettings>
  ): AvatarVoiceSettings {
    const current = this.getAvatarVoiceSettings(characterId);
    const nextUri =
      patch.voiceUri !== undefined
        ? patch.voiceUri
        : 'voiceURI' in patch
        ? patch.voiceURI ?? ''
        : current.voiceUri;
    const updated: AvatarVoiceSettings = {
      voiceUri: nextUri,
      voiceURI: nextUri,
      rate:
        patch.rate !== undefined
          ? Math.max(0.5, Math.min(1.75, Number(patch.rate) || 1.0))
          : current.rate,
      pitch:
        patch.pitch !== undefined
          ? Math.max(0.5, Math.min(1.5, Number(patch.pitch) || 1.0))
          : current.pitch,
    };
    this.voicePrefs[characterId] = updated;
    this.saveVoicePrefsToStorage();
    this.notifyVoiceListeners();
    return updated;
  }

  public setAvatarVoicePref(
    characterId: SageCharacterId,
    patch: Partial<AvatarVoicePreference>
  ): AvatarVoicePreference {
    return this.setAvatarVoiceSettings(characterId, patch);
  }

  public resetAvatarVoiceSettings(characterId: SageCharacterId): AvatarVoiceSettings {
    delete this.voicePrefs[characterId];
    this.saveVoicePrefsToStorage();
    this.notifyVoiceListeners();
    return this.getAvatarVoiceSettings(characterId);
  }

  /**
   * Deterministic voice selection for a specific avatar character (never Math.random).
   * If a user-saved voiceURI exists and is still available on the device, returns it.
   * Otherwise deterministically scores and selects the best permanent default voice for that avatar.
   */
  public resolveVoiceForAvatar(
    characterId: SageCharacterId = this.activeCharacterId,
    isUrdu = false
  ): { voice: SpeechSynthesisVoice | null; missingUrduVoice: boolean } {
    const voices = this.getAvailableVoices();
    if (voices.length === 0) {
      return { voice: null, missingUrduVoice: isUrdu };
    }

    if (isUrdu) {
      const urduVoice =
        voices.find((v) => v.lang.toLowerCase().startsWith('ur-pk')) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('ur-in')) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('ur')) ||
        voices.find((v) => v.name.toLowerCase().includes('urdu'));
      if (urduVoice) {
        return { voice: urduVoice, missingUrduVoice: false };
      }
      // Check Hindi/Arabic voice only if no Urdu voice exists, and flag missingUrduVoice = true
      const fallbackVoice =
        voices.find((v) => v.lang.toLowerCase().startsWith('hi-in')) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('en-pk')) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('en-in')) ||
        null;
      return { voice: fallbackVoice, missingUrduVoice: true };
    }

    const settings = this.getAvatarVoiceSettings(characterId);
    if (settings.voiceUri) {
      const savedMatch = voices.find(
        (v) => v.voiceURI === settings.voiceUri || v.name === settings.voiceUri
      );
      if (savedMatch) {
        return { voice: savedMatch, missingUrduVoice: false };
      }
      // Saved voice disappeared on this device — silently fall through to deterministic default
    }

    const charDef = getSageCharacterById(characterId);
    const { preferredLangs, genderHint, nameKeywords } = charDef.voiceProfile;

    const englishVoices = voices.filter((v) =>
      v.lang.toLowerCase().startsWith('en')
    );
    const pool = englishVoices.length > 0 ? englishVoices : voices;

    const femaleHints = ['female', 'woman', 'girl', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'zira', 'hazel', 'susan', 'linda', 'aria', 'jenny', 'sonia', 'libby', 'neerja', 'catherine'];
    const maleHints = ['male', 'man', 'boy', 'daniel', 'alex', 'fred', 'tom', 'oliver', 'david', 'mark', 'george', 'ryan', 'guy', 'christopher', 'rishi', 'prabhat', 'asad', 'thomas', 'james'];

    let bestVoice: SpeechSynthesisVoice = pool[0];
    let bestScore = -9999;

    for (const v of pool) {
      let score = 0;
      const lowerName = (v.name || '').toLowerCase();
      const lowerLang = (v.lang || '').toLowerCase().replace('_', '-');

      // 1. Keyword match (highest priority, weighted by keyword order)
      for (let i = 0; i < nameKeywords.length; i++) {
        if (lowerName.includes(nameKeywords[i].toLowerCase())) {
          score += 60 - i * 5;
          break;
        }
      }

      // 2. Language preference match
      for (let i = 0; i < preferredLangs.length; i++) {
        const pref = preferredLangs[i].toLowerCase();
        if (lowerLang === pref || lowerLang.startsWith(pref)) {
          score += 30 - i * 4;
          break;
        }
      }

      // 3. Gender hint match
      if (genderHint === 'female') {
        if (femaleHints.some((h) => lowerName.includes(h))) score += 22;
        if (maleHints.some((h) => lowerName.includes(h))) score -= 15;
      } else if (genderHint === 'male') {
        if (maleHints.some((h) => lowerName.includes(h))) score += 22;
        if (femaleHints.some((h) => lowerName.includes(h))) score -= 15;
      }

      // 4. Natural / Neural quality bonus
      if (/natural|neural|online|premium|enhanced|google/i.test(lowerName)) {
        score += 8;
      }
      if (v.default) {
        score += 2;
      }

      // Deterministic tie-breaker using character index offset so different characters pick distinct voices when scores tie
      const charIdx = Math.max(0, SAGE_CHARACTERS.findIndex((c) => c.id === characterId));
      const voiceIdx = pool.indexOf(v);
      if (voiceIdx % SAGE_CHARACTERS.length === charIdx % pool.length) {
        score += 3;
      }

      if (score > bestScore) {
        bestScore = score;
        bestVoice = v;
      }
    }

    return { voice: bestVoice || voices[0] || null, missingUrduVoice: false };
  }

  public setCallbacks(cb: SpeechCallbacks) {
    this.callbacks = cb;
  }

  public getStatus(): SpeechPlaybackStatus {
    return this.status;
  }

  public getCurrentMessageId(): string | null {
    return this.currentMessageId;
  }

  public getSpeed(): SpeechSpeed {
    return this.speed;
  }

  public setSpeed(newSpeed: SpeechSpeed) {
    this.speed = newSpeed;
    if (this.audioEl) {
      this.audioEl.playbackRate = newSpeed;
    }
  }

  private updateStatus(status: SpeechPlaybackStatus, errorMsg?: string) {
    this.status = status;
    if (status !== 'playing') {
      this.callbacks.onVolumeChange?.(0);
    }
    this.callbacks.onStatusChange?.(status, this.currentMessageId, errorMsg);
  }

  private visualCadenceEndTimer: number | null = null;

  private clearCadenceTimer() {
    if (this.synthCadenceTimer !== null) {
      window.clearInterval(this.synthCadenceTimer);
      this.synthCadenceTimer = null;
    }
    if (this.visualCadenceEndTimer !== null) {
      window.clearTimeout(this.visualCadenceEndTimer);
      this.visualCadenceEndTimer = null;
    }
  }

  private runVisualSpeechCadence(cleanText: string, rate = 1.0) {
    this.clearCadenceTimer();
    this.updateStatus('playing');
    this.startSyntheticCadence();
    const durationMs = Math.min(
      12000,
      Math.max(1800, Math.round((cleanText.length * 52) / Math.max(0.5, rate)))
    );
    this.visualCadenceEndTimer = window.setTimeout(() => {
      this.clearCadenceTimer();
      this.currentMessageId = null;
      this.updateStatus('idle');
    }, durationMs);
  }

  private clearAudioElement() {
    if (this.analyserRaf !== null) {
      cancelAnimationFrame(this.analyserRaf);
      this.analyserRaf = null;
    }
    if (this.audioEl) {
      try {
        this.audioEl.pause();
        this.audioEl.src = '';
      } catch {}
      this.audioEl = null;
    }
    if (this.audioUrl) {
      try {
        URL.revokeObjectURL(this.audioUrl);
      } catch {}
      this.audioUrl = null;
    }
  }

  public stop() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.clearCadenceTimer();
    this.clearAudioElement();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.utterance = null;
    const prevId = this.currentMessageId;
    this.currentMessageId = null;
    this.status = 'idle';
    this.callbacks.onVolumeChange?.(0);
    this.callbacks.onStatusChange?.('idle', prevId);
  }

  public pause() {
    if (this.status !== 'playing') return;
    if (this.audioEl) {
      this.audioEl.pause();
      this.updateStatus('paused');
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      try {
        window.speechSynthesis.pause();
        this.clearCadenceTimer();
        this.updateStatus('paused');
        return;
      } catch {}
    }
    this.clearCadenceTimer();
    this.updateStatus('paused');
  }

  public resume() {
    if (this.status !== 'paused') return;
    if (this.audioEl) {
      this.audioEl
        .play()
        .then(() => {
          this.updateStatus('playing');
          this.startAnalyserLoop();
        })
        .catch(() => {
          this.runVisualSpeechCadence('Resuming response', this.speed || 1);
        });
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
      try {
        window.speechSynthesis.resume();
        this.startSyntheticCadence();
        this.updateStatus('playing');
        return;
      } catch {}
    }
    this.runVisualSpeechCadence('Resuming response', this.speed || 1);
  }

  private startSyntheticCadence() {
    if (this.synthCadenceTimer !== null) {
      window.clearInterval(this.synthCadenceTimer);
      this.synthCadenceTimer = null;
    }
    let tick = 0;
    this.synthCadenceTimer = window.setInterval(() => {
      if (this.status !== 'playing') {
        this.callbacks.onVolumeChange?.(0);
        return;
      }
      tick += 0.35;
      // Deterministic multi-frequency syllabic modulation wave (no Math.random needed)
      const wave =
        0.52 +
        0.25 * Math.sin(tick * 3.1) +
        0.18 * Math.cos(tick * 5.7) +
        0.08 * Math.sin(tick * 11.3);
      this.callbacks.onVolumeChange?.(Math.max(0.12, Math.min(1, wave)));
    }, 60);
  }

  private startAnalyserLoop() {
    if (!this.analyser || !this.audioEl) {
      this.startSyntheticCadence();
      return;
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    const loop = () => {
      if (this.status !== 'playing' || !this.analyser) {
        this.callbacks.onVolumeChange?.(0);
        return;
      }
      this.analyser.getByteFrequencyData(data);
      let sum = 0;
      const count = Math.min(data.length, 48);
      for (let i = 2; i < count; i++) {
        sum += data[i];
      }
      const avg = sum / Math.max(1, count - 2);
      const normalized = Math.min(1, Math.max(0, (avg - 8) / 115));
      this.callbacks.onVolumeChange?.(normalized);
      this.analyserRaf = requestAnimationFrame(loop);
    };
    this.analyserRaf = requestAnimationFrame(loop);
  }

  /**
   * Speaks a quick preview sample for the specified avatar using its configured voice, rate, and pitch.
   */
  public async previewVoice(
    characterId: SageCharacterId = this.activeCharacterId,
    customDisplayName?: string,
    options?: {
      onBoundaryLevel?: (level: number) => void;
      onEnd?: () => void;
    }
  ): Promise<void> {
    const charDef = getSageCharacterById(characterId);
    const spokenName = customDisplayName || charDef.name;
    const sampleText = `Hello! I am ${spokenName}, your ${charDef.role} at SHS Virtual Academy. Ready to study together!`;
    if (options?.onBoundaryLevel) {
      options.onBoundaryLevel(0.65);
    }
    try {
      await this.speak(`preview-${characterId}`, sampleText, characterId);
    } finally {
      if (options?.onEnd) {
        window.setTimeout(() => {
          options.onEnd?.();
        }, 1200);
      }
    }
  }

  public async speak(
    messageId: string,
    rawMarkdown: string,
    characterId: SageCharacterId = this.activeCharacterId
  ): Promise<void> {
    this.stop();
    this.currentMessageId = messageId;
    this.activeCharacterId = characterId;

    const { text, isUrdu } = markdownAndMathToSpeechText(rawMarkdown);
    if (!text) {
      this.updateStatus('idle');
      return;
    }

    this.updateStatus('loading');

    const canUseWebSpeech =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof SpeechSynthesisUtterance !== 'undefined';

    const avatarSettings = this.getAvatarVoiceSettings(characterId);
    const effectiveRate = Math.max(
      0.5,
      Math.min(2.0, avatarSettings.rate * (this.speed || 1))
    );
    const effectivePitch = avatarSettings.pitch;

    if (canUseWebSpeech) {
      await this.ensureVoicesLoaded();
      const { voice: matchedVoice, missingUrduVoice } = this.resolveVoiceForAvatar(
        characterId,
        isUrdu
      );

      if (isUrdu && missingUrduVoice && !this.urduNoticeShownInSession) {
        this.urduNoticeShownInSession = true;
        this.callbacks.onNotice?.(
          'No Urdu voice is installed on this device — using fallback voice so you can still listen.'
        );
      }

      if (!isUrdu || (matchedVoice && !missingUrduVoice)) {
        const started = await this.tryWebSpeech(
          text,
          isUrdu,
          matchedVoice,
          effectiveRate,
          effectivePitch
        );
        if (started) return;
      }
    }

    // Fallback to server-side Gemini TTS (/api/sage/tts) — never throws if a local or cloud voice is missing
    await this.playServerTts(text, effectiveRate, effectivePitch);
  }

  private tryWebSpeech(
    cleanText: string,
    isUrdu: boolean,
    voice: SpeechSynthesisVoice | null,
    rate: number,
    pitch: number
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(cleanText.slice(0, 3800));
        if (voice) {
          utter.voice = voice;
          utter.lang = voice.lang;
        } else {
          utter.lang = isUrdu ? 'ur-PK' : 'en-US';
        }
        utter.rate = rate;
        utter.pitch = pitch;

        let settled = false;
        const startTimeout = window.setTimeout(() => {
          if (!settled) {
            settled = true;
            try {
              window.speechSynthesis.cancel();
            } catch {}
            resolve(false);
          }
        }, 2000);

        utter.onstart = () => {
          if (!settled) {
            settled = true;
            window.clearTimeout(startTimeout);
            resolve(true);
          }
          this.updateStatus('playing');
          this.startSyntheticCadence();
        };

        let boundaryTick = 0;
        utter.onboundary = () => {
          if (this.status === 'playing') {
            boundaryTick += 1;
            const pulse = 0.78 + 0.18 * Math.abs(Math.sin(boundaryTick * 1.7));
            this.callbacks.onVolumeChange?.(pulse);
          }
        };

        utter.onend = () => {
          this.clearCadenceTimer();
          this.currentMessageId = null;
          this.updateStatus('idle');
        };

        utter.onerror = (ev) => {
          this.clearCadenceTimer();
          if (!settled) {
            settled = true;
            window.clearTimeout(startTimeout);
            resolve(false);
            return;
          }
          if (ev.error === 'canceled' || ev.error === 'interrupted') {
            this.updateStatus('idle');
          } else {
            this.playServerTts(cleanText, rate, pitch).catch(() => {
              this.runVisualSpeechCadence(cleanText, rate);
            });
          }
        };

        this.utterance = utter;
        window.speechSynthesis.speak(utter);
      } catch {
        resolve(false);
      }
    });
  }

  private async playServerTts(cleanText: string, rate = 1.0, pitch = 1.0): Promise<void> {
    try {
      this.abortController = new AbortController();
      const response = await fetch('/api/sage/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText.slice(0, 3200),
          voiceName: 'Kore',
        }),
        signal: this.abortController.signal,
      });

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (!response.ok || contentType.includes('application/json')) {
        // Cloud TTS returned a browser fallback directive or unavailable status
        const canUseWebSpeech =
          typeof window !== 'undefined' &&
          'speechSynthesis' in window &&
          typeof SpeechSynthesisUtterance !== 'undefined';
        if (canUseWebSpeech) {
          const started = await this.tryWebSpeech(cleanText, false, null, rate, pitch);
          if (started) return;
        }
        this.runVisualSpeechCadence(cleanText, rate);
        return;
      }

      const wavBlob = await response.blob();
      if (!wavBlob || wavBlob.size < 48) {
        this.runVisualSpeechCadence(cleanText, rate);
        return;
      }

      const url = URL.createObjectURL(wavBlob);
      this.audioUrl = url;

      const audio = new Audio(url);
      audio.playbackRate = Math.max(0.5, Math.min(2.0, rate));
      this.audioEl = audio;

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          if (!this.audioCtx) {
            this.audioCtx = new AudioCtx();
          }
          if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
          }
          const source = this.audioCtx.createMediaElementSource(audio);
          const analyser = this.audioCtx.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.75;
          source.connect(analyser);
          analyser.connect(this.audioCtx.destination);
          this.analyser = analyser;
        }
      } catch {
        this.analyser = null;
      }

      audio.onplay = () => {
        this.updateStatus('playing');
        this.startAnalyserLoop();
      };

      audio.onended = () => {
        this.clearAudioElement();
        this.currentMessageId = null;
        this.updateStatus('idle');
      };

      audio.onerror = () => {
        this.clearAudioElement();
        this.runVisualSpeechCadence(cleanText, rate);
      };

      await audio.play();
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      this.runVisualSpeechCadence(cleanText, rate);
    }
  }
}

export const sageSpeech = new SageSpeechManager();
