/**
 * Audio Recording & Speech-to-Text Utility for Sage AI
 *
 * Implements WhatsApp-style recording:
 * - MediaRecorder with best browser codec detection (audio/webm;codecs=opus vs audio/mp4)
 * - Volume metering / waveform level extraction via Web Audio API AnalyserNode
 * - Automatic 2-minute safety cap
 * - Conversion to Base64 for Gemini multimodal transcription
 * - Speech-to-text supporting English, Urdu, and mixed Urdu/English
 */

export interface AudioRecordingResult {
  blob: Blob;
  base64: string;
  mimeType: string;
  durationSeconds: number;
}

export class SageVoiceRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private startTime = 0;
  private timerInterval: any = null;
  private onTimeUpdate?: (elapsedMs: number) => void;
  private onLevelUpdate?: (level: number) => void;
  private onMaxDurationReached?: () => void;

  public static getBestMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return 'audio/webm';
  }

  async startRecording(callbacks: {
    onTimeUpdate: (elapsedMs: number) => void;
    onLevelUpdate: (level: number) => void;
    onMaxDurationReached: () => void;
  }): Promise<void> {
    this.onTimeUpdate = callbacks.onTimeUpdate;
    this.onLevelUpdate = callbacks.onLevelUpdate;
    this.onMaxDurationReached = callbacks.onMaxDurationReached;
    this.audioChunks = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Microphone audio recording is not supported in this browser.');
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Microphone access was denied. Please allow microphone permission in your browser address bar.');
      }
      throw new Error('Unable to access microphone: ' + (err.message || 'Unknown error'));
    }

    // Initialize Web Audio API for live level metering
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkLevel = () => {
          if (!this.analyser) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const avg = sum / bufferLength;
          const normalized = Math.min(1, Math.max(0, avg / 128));
          this.onLevelUpdate?.(normalized);
          this.animFrameId = requestAnimationFrame(checkLevel);
        };
        this.animFrameId = requestAnimationFrame(checkLevel);
      }
    } catch (audioErr) {
      console.warn('[SageVoiceRecorder] Level analyser init error:', audioErr);
    }

    const mimeType = SageVoiceRecorder.getBestMimeType();
    this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.startTime = Date.now();
    this.mediaRecorder.start(200); // 200ms slice chunks

    // Live timer + 2-minute (120s) hard limit
    this.timerInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      this.onTimeUpdate?.(elapsed);
      if (elapsed >= 120000) {
        // 2 minutes max length reached
        this.onMaxDurationReached?.();
      }
    }, 200);
  }

  async stopRecording(): Promise<AudioRecordingResult> {
    this.cleanupTracking();

    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      throw new Error('No active recording found');
    }

    const durationSeconds = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) return reject(new Error('MediaRecorder unavailable'));

      this.mediaRecorder.onstop = async () => {
        try {
          const mimeType = this.mediaRecorder?.mimeType || SageVoiceRecorder.getBestMimeType();
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });

          // Release mic stream tracks
          if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((track) => track.stop());
            this.mediaStream = null;
          }

          if (audioBlob.size < 500) {
            return reject(new Error("I couldn't hear anything, please try again."));
          }

          const base64 = await new Promise<string>((res, rej) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const fullDataUrl = reader.result as string;
              // Extract clean base64 string
              const clean = fullDataUrl.includes('base64,')
                ? fullDataUrl.split('base64,')[1]
                : fullDataUrl;
              res(clean);
            };
            reader.onerror = rej;
            reader.readAsDataURL(audioBlob);
          });

          resolve({
            blob: audioBlob,
            base64,
            mimeType,
            durationSeconds,
          });
        } catch (e) {
          reject(e);
        }
      };

      try {
        this.mediaRecorder.stop();
      } catch (err) {
        reject(err);
      }
    });
  }

  cancelRecording(): void {
    this.cleanupTracking();
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.audioChunks = [];
  }

  private cleanupTracking(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    this.analyser = null;
  }
}

/**
 * Transcribes audio base64 by invoking Gemini speech-to-text API via server proxy
 * Supports English, Urdu, and mixed Urdu/English queries.
 */
export async function transcribeAudioWithGemini(
  base64Audio: string,
  mimeType: string,
  userToken?: string
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (userToken) {
    headers['Authorization'] = `Bearer ${userToken}`;
  }

  const res = await fetch('/api/sage/transcribe', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      audio_base64: base64Audio,
      mime_type: mimeType,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    transcript?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error || `Transcription failed with HTTP ${res.status}`);
  }

  const transcript = (data.transcript || '').trim();
  if (!transcript) {
    throw new Error("I couldn't hear anything, please try again.");
  }

  return transcript;
}
