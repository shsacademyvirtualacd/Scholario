import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Trash2,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw,
  Lock,
  ChevronUp,
  ChevronLeft
} from 'lucide-react';
import {
  isVoiceRecordingSupported,
  getSupportedAudioMimeType,
  formatAudioDuration,
  uploadVoiceMessageAudio,
} from '../../lib/voiceRecordingService';

interface VoiceRecorderBarProps {
  threadId: string;
  onSendVoice: (audioUrl: string, durationSeconds: number) => Promise<void>;
  onCancelRecording: () => void;
  onFinishRecording?: () => void;
  disabled?: boolean;
  initialPointer?: { x: number; y: number } | null;
  onLockedChange?: (isLocked: boolean) => void;
}

export const VoiceRecorderBar: React.FC<VoiceRecorderBarProps> = ({
  threadId,
  onSendVoice,
  onCancelRecording,
  onFinishRecording,
  disabled,
  initialPointer = null,
  onLockedChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // WhatsApp Gesture States
  const [isLocked, setIsLocked] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isCancelZone, setIsCancelZone] = useState(false);
  const [isLockZone, setIsLockZone] = useState(false);
  const isLockedRef = useRef(false);
  const startPointerRef = useRef<{ x: number; y: number } | null>(initialPointer);
  const hasMovedRef = useRef(false);
  const cancelTriggeredRef = useRef(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const durationRef = useRef(0);

  const isSupported = isVoiceRecordingSupported();

  // Cleanup audio tracks, context, and timer intervals
  const cleanupStream = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  }, []);

  const handleCancel = useCallback(() => {
    cancelTriggeredRef.current = true;
    cleanupStream();
    setRecordingSeconds(0);
    setVolumeLevel(0);
    setErrorMessage(null);
    onCancelRecording();
  }, [cleanupStream, onCancelRecording]);

  const stopAndSend = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      handleCancel();
      return;
    }

    const duration = durationRef.current;
    if (duration < 1 && audioChunksRef.current.length === 0) {
      handleCancel();
      return;
    }

    setIsUploading(true);
    const { mimeType, extension } = getSupportedAudioMimeType();

    mediaRecorderRef.current.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm',
        });

        cleanupStream();

        const { audioUrl } = await uploadVoiceMessageAudio(
          audioBlob,
          threadId,
          mimeType,
          extension
        );

        await onSendVoice(audioUrl, Math.max(1, duration));
        setErrorMessage(null);
        if (onFinishRecording) {
          onFinishRecording();
        } else {
          onCancelRecording();
        }
      } catch (uploadErr: any) {
        console.error('[VoiceRecorder] Upload error:', uploadErr);
        setErrorMessage(uploadErr.message || 'Failed to upload voice message.');
      } finally {
        setIsUploading(false);
        setRecordingSeconds(0);
        setVolumeLevel(0);
      }
    };

    try {
      mediaRecorderRef.current.stop();
    } catch (stopErr) {
      console.warn('[VoiceRecorder] Error stopping MediaRecorder:', stopErr);
      cleanupStream();
      setIsUploading(false);
      handleCancel();
    }
  }, [handleCancel, onCancelRecording, onFinishRecording, onSendVoice, threadId, cleanupStream]);

  const lockRecording = useCallback(() => {
    setIsLocked(true);
    isLockedRef.current = true;
    setDragOffset({ x: 0, y: 0 });
    setIsCancelZone(false);
    setIsLockZone(false);
    onLockedChange?.(true);
  }, [onLockedChange]);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setErrorMessage('Audio recording is not supported in this browser environment.');
      setIsInitializing(false);
      return;
    }

    setErrorMessage(null);
    setIsInitializing(true);
    audioChunksRef.current = [];
    setRecordingSeconds(0);
    durationRef.current = 0;
    setVolumeLevel(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Audio analyzer for live waveform
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
              animFrameRef.current = requestAnimationFrame(updateVolume);
            }
          };
          updateVolume();
        }
      } catch (audioCtxErr) {
        console.warn('[VoiceRecorder] AudioContext analyzer initialization warning:', audioCtxErr);
      }

      const { mimeType } = getSupportedAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(250);
      setIsInitializing(false);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1;
          durationRef.current = next;
          if (next >= 300) {
            stopAndSend();
            return next;
          }
          return next;
        });
      }, 1000);
    } catch (err: any) {
      console.error('[VoiceRecorder] getUserMedia permission error:', err);
      cleanupStream();
      setIsInitializing(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No microphone device was detected.');
      } else {
        setErrorMessage(`Microphone error: ${err.message || 'Could not access audio device.'}`);
      }
    }
  }, [cleanupStream, isSupported, stopAndSend]);

  useEffect(() => {
    startRecording();
    return () => {
      cleanupStream();
    };
  }, [startRecording, cleanupStream]);

  // Global Pointer Event Listeners for slide-to-lock and slide-to-cancel gestures
  useEffect(() => {
    if (isLockedRef.current) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (isLockedRef.current || cancelTriggeredRef.current) return;

      if (!startPointerRef.current) {
        startPointerRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      const dx = e.clientX - startPointerRef.current.x;
      const dy = e.clientY - startPointerRef.current.y;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMovedRef.current = true;
      }

      // Bound drag values
      const boundedX = Math.min(0, Math.max(-140, dx));
      const boundedY = Math.min(0, Math.max(-80, dy));
      setDragOffset({ x: boundedX, y: boundedY });

      // Slide up to lock (threshold: 45px upward)
      if (dy <= -45) {
        setIsLockZone(true);
        lockRecording();
        return;
      } else {
        setIsLockZone(false);
      }

      // Slide left to cancel (threshold: 70px leftward)
      if (dx <= -70) {
        setIsCancelZone(true);
      } else {
        setIsCancelZone(false);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isLockedRef.current || cancelTriggeredRef.current) return;

      if (!startPointerRef.current) {
        // If started without initial pointer (e.g. click), lock into hands-free
        lockRecording();
        return;
      }

      const dx = e.clientX - startPointerRef.current.x;
      const dy = e.clientY - startPointerRef.current.y;

      // If user swiped left to cancel and released in cancel zone: cancel!
      if (dx <= -65 || isCancelZone) {
        handleCancel();
        return;
      }

      // If user swiped up to lock: lock!
      if (dy <= -45 || isLockZone) {
        lockRecording();
        return;
      }

      // If user just held and released:
      if (durationRef.current >= 1) {
        // WhatsApp behavior: Release to send!
        stopAndSend();
      } else if (!hasMovedRef.current) {
        // Quick tap: transition to hands-free locked mode so they can speak comfortably
        lockRecording();
      } else {
        handleCancel();
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handleCancel);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handleCancel);
    };
  }, [handleCancel, isCancelZone, isLockZone, lockRecording, stopAndSend]);

  // If there's an initialization error or permission denial
  if (errorMessage && !isUploading) {
    return (
      <div className="w-full max-w-full bg-rose-50 border border-rose-200 p-3 rounded-2xl flex items-center justify-between gap-2.5 text-xs text-rose-800 shadow-2xs animate-in fade-in duration-200">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <AlertCircle size={17} className="text-rose-600 shrink-0" />
          <span className="truncate">{errorMessage}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={startRecording}
            className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-semibold rounded-xl flex items-center gap-1 text-[11px] transition-colors"
          >
            <RefreshCw size={12} />
            <span>Retry</span>
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-2.5 py-1.5 bg-white hover:bg-rose-100 text-rose-700 font-medium rounded-xl border border-rose-200 text-[11px] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full flex items-center gap-2">
      {/* ── Slide-up Lock Pill (WhatsApp Floating Lock) ── */}
      {!isLocked && (
        <div
          onClick={lockRecording}
          style={{
            transform: `translateY(${dragOffset.y * 0.4}px)`,
            WebkitBackdropFilter: 'blur(20px)',
            backdropFilter: 'blur(20px)',
          }}
          className={`absolute right-1 bottom-13 z-30 px-3 py-2.5 rounded-full bg-white/80 backdrop-blur-[20px] border border-black/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.12)] flex flex-col items-center gap-1.5 cursor-pointer select-none transition-all duration-75 ${
            isLockZone
              ? 'bg-emerald-50/90 text-emerald-600 scale-110 border-emerald-300'
              : 'text-[#54656F] hover:text-[#111111] hover:bg-black/5'
          }`}
          title="Slide up or tap to lock hands-free recording"
        >
          <ChevronUp
            size={16}
            className={`animate-bounce ${isLockZone ? 'text-emerald-600' : 'text-[#8696A0]'}`}
          />
          <Lock size={15} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Lock</span>
        </div>
      )}

      {/* ── Main Voice Recording Bar ── */}
      <div
        className="flex-1 min-w-0 bg-black/75 backdrop-blur-[20px] text-white px-3 sm:px-4 py-2 rounded-[24px] flex items-center justify-between gap-2 sm:gap-3 border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.18)] min-h-[46px] animate-in fade-in duration-150 overflow-hidden box-border"
        style={{
          WebkitBackdropFilter: 'blur(20px)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Left: Red Blinking Recording Indicator & Timer */}
        <div className="flex items-center gap-2 shrink-0 select-none">
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping absolute opacity-75" />
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <span className="font-mono text-xs font-bold text-white tracking-wider tabular-nums">
            {isInitializing ? '0:00' : formatAudioDuration(recordingSeconds)}
          </span>
        </div>

        {/* Center: When holding/gesturing: Slide to Cancel Hint with Waveform */}
        {!isLocked ? (
          <div
            style={{
              transform: `translateX(${dragOffset.x}px)`,
            }}
            className="flex-1 min-w-0 flex items-center justify-center gap-2 text-xs text-[#A3A3A3] select-none transition-transform duration-75 overflow-hidden"
          >
            {/* Slide to Cancel Text & Pulsing Arrow */}
            <div
              className={`flex items-center gap-1.5 transition-opacity ${
                isCancelZone ? 'text-rose-400 font-bold scale-105' : 'text-[#D4D4D4]'
              }`}
            >
              <ChevronLeft size={16} className="animate-pulse shrink-0" />
              <span className="text-xs font-medium whitespace-nowrap">
                {isCancelZone ? 'Release to cancel' : 'Slide to cancel'}
              </span>
            </div>

            {/* Subtle live wave bars */}
            <div className="hidden sm:flex items-center gap-[2.5px] px-2 opacity-60">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: `${Math.max(
                      3,
                      Math.min(16, ((Math.sin(i * 0.8 + recordingSeconds * 3) + 1) * 4) + (volumeLevel * 0.1))
                    )}px`,
                  }}
                  className="w-[2.5px] rounded-full bg-[#F4C430] shrink-0"
                />
              ))}
            </div>
          </div>
        ) : (
          /* Locked Hands-Free Waveform Display */
          <div className="flex-1 min-w-0 flex items-center justify-center gap-[3px] sm:gap-1 px-1 sm:px-2 overflow-hidden">
            {Array.from({ length: 18 }).map((_, i) => {
              const height = Math.max(
                4,
                Math.min(
                  22,
                  Math.round(((Math.sin(i * 0.8 + recordingSeconds * 2.5) + 1) * 6) + (volumeLevel * 0.16))
                )
              );
              const isOuterBar = i < 3 || i > 14;

              return (
                <div
                  key={i}
                  style={{ height: `${height}px` }}
                  className={`w-1 min-w-[2px] max-w-[3.5px] rounded-full bg-[#25D366] transition-all duration-75 shrink-0 ${
                    isOuterBar ? 'hidden sm:block' : 'block'
                  }`}
                />
              );
            })}
          </div>
        )}

        {/* Right Fallback Cancel Action (Always accessible even if gesture is not used) */}
        <button
          type="button"
          onClick={handleCancel}
          disabled={isUploading || disabled}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500/20 text-[#D4D4D4] hover:text-rose-300 flex items-center justify-center transition-colors shrink-0 touch-manipulation disabled:opacity-40"
          title="Cancel and discard voice note"
          aria-label="Cancel recording"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* ── Locked Mode Floating Send Button / Gesture Mic Feedback ── */}
      {isLocked ? (
        <button
          type="button"
          onClick={stopAndSend}
          disabled={isUploading || disabled || isInitializing}
          className="w-11 h-11 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md touch-manipulation disabled:opacity-40"
          title="Send voice note"
          aria-label="Send voice note"
        >
          {isUploading ? (
            <Loader2 size={18} className="animate-spin text-white" />
          ) : (
            <Send size={18} className="text-white ml-0.5" />
          )}
        </button>
      ) : (
        /* While holding: Active Green Circle with Lock Indicator */
        <div
          className={`w-11 h-11 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-lg transition-transform ${
            isLockZone ? 'scale-110 ring-4 ring-emerald-400/40' : 'scale-105'
          }`}
        >
          {isUploading ? (
            <Loader2 size={18} className="animate-spin text-white" />
          ) : (
            <Send size={18} className="text-white ml-0.5" />
          )}
        </div>
      )}
    </div>
  );
};
