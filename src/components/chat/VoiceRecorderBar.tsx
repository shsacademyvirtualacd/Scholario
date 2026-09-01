import React, { useState, useRef, useEffect } from 'react';
import { Mic, Trash2, Send, Loader2, AlertCircle } from 'lucide-react';
import {
  isVoiceRecordingSupported,
  getSupportedAudioMimeType,
  formatAudioDuration,
  uploadVoiceMessageAudio,
} from '../../lib/voiceRecordingService';

interface VoiceRecorderBarProps {
  threadId: string;
  onSendVoice: (audioUrl: string, durationSeconds: number) => Promise<void>;
  disabled?: boolean;
}

export const VoiceRecorderBar: React.FC<VoiceRecorderBarProps> = ({
  threadId,
  onSendVoice,
  disabled,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const isSupported = isVoiceRecordingSupported();

  // Cleanup audio tracks and streams
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

  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, []);

  const startRecording = async () => {
    if (!isSupported) {
      setErrorMessage('Audio recording is not supported in this browser environment.');
      return;
    }

    setErrorMessage(null);
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
      setIsRecording(true);

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
      setIsRecording(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No microphone device was detected on your system.');
      } else {
        setErrorMessage(`Microphone error: ${err.message || 'Could not access audio device.'}`);
      }
    }
  };

  const cancelRecording = () => {
    cleanupStream();
    setIsRecording(false);
    setRecordingSeconds(0);
    setVolumeLevel(0);
    setErrorMessage(null);
  };

  const stopAndSend = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      cancelRecording();
      return;
    }

    const duration = recordingSeconds;
    if (duration < 1 && audioChunksRef.current.length === 0) {
      // Too short recording (less than 1s)
      setErrorMessage('Recording was too short. Hold and speak for at least 1 second.');
      cancelRecording();
      return;
    }

    setIsUploading(true);

    const { mimeType, extension } = getSupportedAudioMimeType();

    // Finalize recording data
    mediaRecorderRef.current.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm',
        });

        cleanupStream();
        setIsRecording(false);

        const { audioUrl } = await uploadVoiceMessageAudio(
          audioBlob,
          threadId,
          mimeType,
          extension
        );

        await onSendVoice(audioUrl, Math.max(1, duration));
        setErrorMessage(null);
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
      setIsRecording(false);
      setIsUploading(false);
    }
  };

  if (!isRecording) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled || !isSupported}
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
            isSupported && !disabled
              ? 'bg-[#111111] hover:bg-[#262626] text-[#F4C430] hover:text-white shadow-2xs interactive'
              : 'bg-[#E5E5E5] text-[#A3A3A3] cursor-not-allowed'
          }`}
          title={
            !isSupported
              ? 'Microphone recording is not supported in this browser'
              : 'Record a voice message'
          }
        >
          <Mic size={17} />
        </button>

        {errorMessage && (
          <div className="absolute bottom-12 right-0 w-72 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 shadow-md z-30 flex items-start gap-2">
            <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-rose-900">Microphone Issue: </span>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  // Active Recording Bar Interface
  return (
    <div className="flex-1 flex items-center justify-between gap-3 bg-[#111111] text-white px-3.5 py-1.5 rounded-2xl animate-in fade-in zoom-in-95 duration-150 shadow-inner min-h-[44px]">
      {/* Recording indicator & timer */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="relative flex items-center justify-center">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping absolute opacity-75" />
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
        </div>
        <span className="font-mono text-xs font-bold text-white tracking-wider">
          {formatAudioDuration(recordingSeconds)}
        </span>
      </div>

      {/* Live Animated Audio Wave Bars */}
      <div className="flex-1 flex items-center justify-center gap-1 px-2 h-6 overflow-hidden max-w-[200px] sm:max-w-xs">
        {Array.from({ length: 16 }).map((_, i) => {
          const height = Math.max(
            4,
            Math.min(
              22,
              Math.round(((Math.sin(i + recordingSeconds * 2) + 1) * 6) + (volumeLevel * 0.16))
            )
          );
          return (
            <div
              key={i}
              style={{ height: `${height}px` }}
              className="w-1 rounded-full bg-[#F4C430] transition-all duration-75"
            />
          );
        })}
      </div>

      {/* Action Buttons: Cancel (Trash) & Send */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Cancel Recording */}
        <button
          type="button"
          onClick={cancelRecording}
          disabled={isUploading}
          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-rose-500/20 text-[#D4D4D4] hover:text-rose-300 flex items-center justify-center transition-colors"
          title="Cancel and discard voice note"
        >
          <Trash2 size={15} />
        </button>

        {/* Stop & Send Recording */}
        <button
          type="button"
          onClick={stopAndSend}
          disabled={isUploading}
          className="w-8 h-8 rounded-xl bg-[#F4C430] hover:bg-[#e6b82a] text-[#111111] font-bold flex items-center justify-center transition-transform active:scale-95 shadow-2xs"
          title="Send voice message"
        >
          {isUploading ? (
            <Loader2 size={15} className="animate-spin text-[#111111]" />
          ) : (
            <Send size={15} />
          )}
        </button>
      </div>
    </div>
  );
};
