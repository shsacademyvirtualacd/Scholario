/**
 * Sage AI Speech & Text-to-Speech (TTS) Engine
 *
 * - Converts Markdown and LaTeX/KaTeX formulas into natural spoken language (English & Urdu)
 * - Provides Play, Pause/Resume, Stop, and playback rate (0.75x, 1x, 1.25x, 1.5x)
 * - Uses browser Web Speech API with automatic fallback to server-side Gemini TTS (/api/sage/tts)
 *   for Android WebViews or devices missing Urdu/English voices
 * - Emits real-time audio volume levels (0..1) to drive the 3D Sage Avatar's speaking animation
 */

export type SpeechPlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export type SpeechSpeed = 0.75 | 1 | 1.25 | 1.5;

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

  // Remove outer math delimiters if present
  s = s.replace(/^\$\$|\$\$$/g, '').replace(/^\$|\$$/g, '');

  // Common LaTeX environments & formatting wrappers
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

  // Fractions: handle nested or repeated \frac{a}{b}
  for (let i = 0; i < 4; i++) {
    s = s.replace(/\\(?:d|t)?frac\{([^{}]*)\}\{([^{}]*)\}/g, ' ($1) over ($2) ');
  }

  // Roots
  s = s.replace(/\\sqrt\[3\]\{([^{}]*)\}/g, ' cube root of $1 ');
  s = s.replace(/\\sqrt\[([^{}\]]*)\]\{([^{}]*)\}/g, ' $1th root of $2 ');
  for (let i = 0; i < 3; i++) {
    s = s.replace(/\\sqrt\{([^{}]*)\}/g, ' square root of $1 ');
  }

  // Superscripts / powers
  s = s.replace(/\^\{2\}|\^2(?![0-9])/g, ' squared ');
  s = s.replace(/\^\{3\}|\^3(?![0-9])/g, ' cubed ');
  s = s.replace(/\^\{-1\}/g, ' inverse ');
  s = s.replace(/\^\{([^{}]+)\}/g, ' to the power of $1 ');
  s = s.replace(/\^([a-zA-Z0-9]+)/g, ' to the power of $1 ');

  // Subscripts
  s = s.replace(/_\{([^{}]+)\}/g, ' sub $1 ');
  s = s.replace(/_([a-zA-Z0-9]+)/g, ' sub $1 ');

  // Greek letters & symbols
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

  // Operators
  s = s.replace(/\s*=\s*/g, ' equals ');
  s = s.replace(/\s*\+\s*/g, ' plus ');
  s = s.replace(/([0-9a-zA-Z)\]}])\s*-\s*([0-9a-zA-Z(\[{])/g, '$1 minus $2');
  s = s.replace(/°/g, ' degrees ');

  // Strip remaining backslashes and braces
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

  // 1. Convert display math $$...$$ and \[...\]
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner) => ` ${latexFormulaToSpokenText(inner)}. `);
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => ` ${latexFormulaToSpokenText(inner)}. `);

  // 2. Convert inline math $...$ and \(...\)
  text = text.replace(/\$([^\n$]+?)\$/g, (_m, inner) => ` ${latexFormulaToSpokenText(inner)} `);
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => ` ${latexFormulaToSpokenText(inner)} `);

  // 3. Handle code blocks (keep brief spoken description or clean code lines)
  text = text.replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, (_m, code) => {
    const cleanCode = String(code || '').replace(/[{}();<>]/g, ' ').replace(/\s+/g, ' ').trim();
    return cleanCode ? ` Code snippet: ${cleanCode.slice(0, 240)}. ` : '';
  });
  text = text.replace(/`([^`]+)`/g, '$1');

  // 4. Clean Markdown tables: remove separator lines |---|---| and replace | with pauses
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

  // 5. Markdown links & images
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // 6. Headings, blockquotes, horizontal rules, bold/italic markers, bullets
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/^>\s+/gm, '');
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  text = text.replace(/^\s*[-*•]\s+/gm, '');

  // 7. Normalize whitespace and line breaks into natural sentence pauses
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
}

class SageSpeechManager {
  private currentMessageId: string | null = null;
  private status: SpeechPlaybackStatus = 'idle';
  private speed: SpeechSpeed = 1;
  private callbacks: SpeechCallbacks = {};

  // Web Speech API state
  private utterance: SpeechSynthesisUtterance | null = null;
  private synthCadenceTimer: number | null = null;

  // HTML5 Audio + Web Audio API state (for /api/sage/tts fallback)
  private audioEl: HTMLAudioElement | null = null;
  private audioUrl: string | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserRaf: number | null = null;
  private abortController: AbortController | null = null;

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

  private clearCadenceTimer() {
    if (this.synthCadenceTimer !== null) {
      window.clearInterval(this.synthCadenceTimer);
      this.synthCadenceTimer = null;
    }
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
      } catch {}
    }
  }

  public resume() {
    if (this.status !== 'paused') return;
    if (this.audioEl) {
      this.audioEl.play().then(() => {
        this.updateStatus('playing');
        this.startAnalyserLoop();
      }).catch(() => {
        this.updateStatus('error', 'Unable to resume audio playback.');
      });
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
      try {
        window.speechSynthesis.resume();
        this.startSyntheticCadence();
        this.updateStatus('playing');
      } catch {}
    }
  }

  private startSyntheticCadence() {
    this.clearCadenceTimer();
    let tick = 0;
    this.synthCadenceTimer = window.setInterval(() => {
      if (this.status !== 'playing') {
        this.callbacks.onVolumeChange?.(0);
        return;
      }
      tick += 0.35;
      // Natural syllabic modulation wave between 0.25 and 0.92
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

  private pickBestBrowserVoice(isUrdu: boolean): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (voices.length === 0) return null;

    if (isUrdu) {
      const urduVoice =
        voices.find((v) => v.lang.toLowerCase().startsWith('ur-pk')) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('ur')) ||
        voices.find((v) => v.name.toLowerCase().includes('urdu'));
      return urduVoice || null;
    }

    return (
      voices.find((v) => /en-(us|gb|pk|in)/i.test(v.lang) && /natural|google|online|neural|samantha|daniel/i.test(v.name)) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
      voices[0] ||
      null
    );
  }

  public async speak(messageId: string, rawMarkdown: string): Promise<void> {
    this.stop();
    this.currentMessageId = messageId;

    const { text, isUrdu } = markdownAndMathToSpeechText(rawMarkdown);
    if (!text) {
      this.updateStatus('error', 'Nothing readable in this message.');
      return;
    }

    this.updateStatus('loading');

    // Check if Web Speech API has an appropriate voice (for Urdu, many Android WebViews lack a local Urdu voice)
    const canUseWebSpeech =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof SpeechSynthesisUtterance !== 'undefined';

    if (canUseWebSpeech) {
      // Wait briefly if getVoices() hasn't populated yet
      let voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, 250);
          window.speechSynthesis.onvoiceschanged = () => {
            clearTimeout(timeout);
            resolve();
          };
        });
        voices = window.speechSynthesis.getVoices();
      }

      const matchedVoice = this.pickBestBrowserVoice(isUrdu);
      // If it's English (and voices exist) OR we found an authentic Urdu voice, try Web Speech API first
      if ((!isUrdu && voices.length > 0) || (isUrdu && matchedVoice)) {
        const started = await this.tryWebSpeech(text, isUrdu, matchedVoice);
        if (started) return;
      }
    }

    // Fallback to server-side Gemini TTS (/api/sage/tts) — works in all Android WebViews and supports Urdu & English!
    await this.playServerTts(text);
  }

  private tryWebSpeech(
    cleanText: string,
    isUrdu: boolean,
    voice: SpeechSynthesisVoice | null
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
        utter.rate = this.speed;
        utter.pitch = 1.0;

        let settled = false;
        const startTimeout = window.setTimeout(() => {
          if (!settled) {
            settled = true;
            try {
              window.speechSynthesis.cancel();
            } catch {}
            resolve(false);
          }
        }, 1800);

        utter.onstart = () => {
          if (!settled) {
            settled = true;
            window.clearTimeout(startTimeout);
            resolve(true);
          }
          this.updateStatus('playing');
          this.startSyntheticCadence();
        };

        utter.onboundary = () => {
          if (this.status === 'playing') {
            this.callbacks.onVolumeChange?.(0.75 + Math.random() * 0.25);
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
            // Try server TTS if browser speech synthesis fails mid-flight
            this.playServerTts(cleanText).catch(() => {
              this.updateStatus('error', 'Voice playback failed on this device.');
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

  private async playServerTts(cleanText: string): Promise<void> {
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

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error || `Audio service returned HTTP ${response.status}`);
      }

      const wavBlob = await response.blob();
      const url = URL.createObjectURL(wavBlob);
      this.audioUrl = url;

      const audio = new Audio(url);
      audio.playbackRate = this.speed;
      this.audioEl = audio;

      // Connect Web Audio AnalyserNode for real-time 3D avatar lip-sync
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
        // Fallback to synthetic cadence if Web Audio graph is restricted
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
        this.updateStatus('error', 'Could not play spoken audio on this device.');
      };

      await audio.play();
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.warn('[SageSpeech] Server TTS fallback error:', err?.message || err);
      this.updateStatus(
        'error',
        'Voice playback is unavailable on this browser. Please check your device audio settings.'
      );
    }
  }
}

export const sageSpeech = new SageSpeechManager();
