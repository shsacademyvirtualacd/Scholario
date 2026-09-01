import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Send, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
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
}

export const VoiceRecorderBar: React.FC<VoiceRecorderBarProps> = ({
  threadId,
  onSendVoice,
  onCancelRecording,
  onFinishRecording,
  disabled,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const isSupported = isVoiceRecordingSupported();

  // Cleanup audio tracks, context, and timer intervals
  const cleanupStream = () => {
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
  };

  const startRecording = async () => {
    if (!isSupported) {
      setErrorMessage('Audio recording is not supported in this browser environment.');
      setIsInitializing(false);
      return;
    }

    setErrorMessage(null);
    setIsInitializing(true);
    audioChunksRef.current = [];
    setRecordingSeconds(0);
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

      // Setup audio analyzer for live waveform animation
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

      recorder.start(250); // Slice chunks every 250ms
      setIsInitializing(false);

      // Start recording duration timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          // Auto cap at 5 minutes (300 seconds)
          if (prev >= 300) {
            stopAndSend();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('[VoiceRecorder] getUserMedia permission error:', err);
      cleanupStream();
      setIsInitializing(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No microphone device was detected on your device.');
      } else {
        setErrorMessage(`Microphone error: ${err.message || 'Could not access audio device.'}`);
      }
    }
  };

  // Automatically start recording when mounted (full replacement mode)
  useEffect(() => {
    startRecording();
    return () => {
      cleanupStream();
    };
  }, []);

  const handleCancel = () => {
    cleanupStream();
    setRecordingSeconds(0);
    setVolumeLevel(0);
    setErrorMessage(null);
    onCancelRecording();
  };

  const stopAndSend = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      handleCancel();
      return;
    }

    const duration = recordingSeconds;
    if (duration < 1 && audioChunksRef.current.length === 0) {
      setErrorMessage('Recording too short. Speak for at least 1 second.');
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
  };

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

  // Active Voice Recording Bar (Full Replacement Mode)
  return (
    <div className="w-full max-w-full bg-[#111111] text-white px-3 sm:px-4 py-2 rounded-2xl flex items-center justify-between gap-2 sm:gap-3 shadow-inner min-h-[46px] animate-in fade-in duration-150 overflow-hidden box-border">
      {/* Recording Indicator & Timer */}
      <div className="flex items-center gap-2 shrink-0 select-none">
        <div className="relative flex items-center justify-center w-3 h-3">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping absolute opacity-75" />
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
        </div>
        <span className="font-mono text-xs font-bold text-white tracking-wider tabular-nums">
          {isInitializing ? '0:00' : formatAudioDuration(recordingSeconds)}
        </span>
      </div>

      {/* Live Animated Audio Waveform Bars (Fully responsive, flexes and shrinks without overflow) */}
      <div className="flex-1 min-w-0 flex items-center justify-center gap-[3px] sm:gap-1 px-1 sm:px-2 overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => {
          // Dynamic height based on sine frequency + live microphone volume level
          const height = Math.max(
            4,
            Math.min(
              22,
              Math.round(((Math.sin(i * 0.8 + recordingSeconds * 2.5) + 1) * 6) + (volumeLevel * 0.16))
            )
          );

          // Hide outer bars on very small screens to ensure compact fit
          const isOuterBar = i < 3 || i > 14;

          return (
            <div
              key={i}
              style={{ height: `${height}px` }}
              className={`w-1 min-w-[2px] max-w-[3.5px] rounded-full bg-[#F4C430] transition-all duration-75 shrink-0 ${
                isOuterBar ? 'hidden sm:block' : 'block'
              }`}
            />
          );
        })}
      </div>

      {/* Action Controls: Cancel (Trash) & Send (Yellow button) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Cancel Recording */}
        <button
          type="button"
          onClick={handleCancel}
          disabled={isUploading || disabled}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-rose-500/20 text-[#D4D4D4] hover:text-rose-300 flex items-center justify-center transition-colors touch-manipulation disabled:opacity-40"
          title="Cancel and discard voice note"
        >
          <Trash2 size={15} />
        </button>

        {/* Stop & Send Recording */}
        <button
          type="button"
          onClick={stopAndSend}
          disabled={isUploading || disabled || isInitializing}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#F4C430] hover:bg-[#e6b82a] text-[#111111] font-bold flex items-center justify-center transition-transform active:scale-95 shadow-2xs touch-manipulation disabled:opacity-40"
          title="Send voice message"
        >
          {isUploading ? (
            <Loader2 size={16} className="animate-spin text-[#111111]" />
          ) : (
            <Send size={15} />
          )}
        </button>
      </div>
    </div>
  );
};
