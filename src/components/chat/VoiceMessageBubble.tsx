import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, Loader2, Volume2, Check, CheckCheck, AlertCircle } from 'lucide-react';
import { formatAudioDuration } from '../../lib/voiceRecordingService';

interface VoiceMessageBubbleProps {
  messageId: string;
  audioUrl: string;
  durationSeconds?: number | null;
  createdAt: string;
  readAt?: string | null;
  isMe: boolean;
}

// Generate pseudo-random, deterministic waveform bar heights based on messageId string
function generateWaveformBars(seedString: string, count = 28): number[] {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const pseudoRandom = Math.abs(Math.sin(hash + i * 1.7) * 0.75) + 0.25; // 0.25 to 1.0
    bars.push(Math.max(0.2, Math.min(1.0, pseudoRandom)));
  }
  return bars;
}

export const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({
  messageId,
  audioUrl,
  durationSeconds,
  createdAt,
  readAt,
  isMe,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState<number>(durationSeconds || 0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [hasError, setHasError] = useState(false);

  const waveformBars = useMemo(() => generateWaveformBars(messageId || audioUrl, 26), [messageId, audioUrl]);

  // Global listener so only one audio message plays at a time
  useEffect(() => {
    const handleGlobalPlay = (e: CustomEvent<{ activeMessageId: string }>) => {
      if (e.detail.activeMessageId !== messageId && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener('scholario-voice-play' as any, handleGlobalPlay);
    return () => {
      window.removeEventListener('scholario-voice-play' as any, handleGlobalPlay);
    };
  }, [messageId]);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = audioUrl;
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      if (!durationSeconds && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
      }
      setIsLoading(false);
      setHasError(false);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onWaiting = () => {
      setIsLoading(true);
    };

    const onCanPlay = () => {
      setIsLoading(false);
    };

    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setHasError(true);
      console.warn('[VoiceBubble] Audio playback error for message:', messageId);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl, durationSeconds, messageId]);

  const togglePlayPause = () => {
    if (!audioRef.current || hasError) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Notify other voice bubbles to stop
      window.dispatchEvent(
        new CustomEvent('scholario-voice-play', {
          detail: { activeMessageId: messageId },
        })
      );

      audioRef.current.playbackRate = playbackRate;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('[VoiceBubble] Play error:', err);
          setIsPlaying(false);
        });
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current || totalDuration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * totalDuration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const speeds = [1, 1.5, 2];
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackRate(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
  const isRead = !!readAt;

  return (
    <div
      className={`min-w-[200px] sm:min-w-[260px] max-w-[88%] sm:max-w-[80%] md:max-w-[70%] rounded-2xl p-2.5 sm:p-3 shadow-2xs select-none transition-all ${
        isMe
          ? 'bg-[#111111] text-white rounded-br-xs'
          : 'bg-white text-[#111111] border border-[#E5E5E5] rounded-bl-xs'
      }`}
    >
      {/* Voice Player Controls Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlayPause}
          disabled={hasError}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-xs touch-manipulation ${
            isMe
              ? 'bg-[#F4C430] hover:bg-[#e6b82a] text-[#111111]'
              : 'bg-[#111111] hover:bg-[#262626] text-white'
          }`}
          title={isPlaying ? 'Pause voice message' : 'Play voice message'}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={16} className="fill-current" />
          ) : hasError ? (
            <AlertCircle size={16} className="text-rose-500" />
          ) : (
            <Play size={16} className="fill-current ml-0.5" />
          )}
        </button>

        {/* Waveform & Scrubber Track */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 sm:gap-1.5 overflow-hidden">
          {/* Interactive Waveform Bar Visualizer */}
          <div
            ref={progressBarRef}
            onClick={handleSeek}
            className="h-7 flex items-center gap-[2px] sm:gap-[3px] cursor-pointer group py-1 overflow-hidden"
            title="Click to seek"
          >
            {waveformBars.map((heightFactor, idx) => {
              const barPercent = (idx / waveformBars.length) * 100;
              const isFilled = progressPercent >= barPercent;
              const barHeightPx = Math.max(5, Math.round(heightFactor * 20));

              return (
                <div
                  key={idx}
                  style={{ height: `${barHeightPx}px` }}
                  className={`flex-1 min-w-[2px] max-w-[4px] rounded-full transition-all duration-100 shrink-0 ${
                    isFilled
                      ? isMe
                        ? 'bg-[#F4C430]'
                        : 'bg-[#111111]'
                      : isMe
                      ? 'bg-white/25 group-hover:bg-white/40'
                      : 'bg-[#E5E5E5] group-hover:bg-[#D4D4D4]'
                  }`}
                />
              );
            })}
          </div>

          {/* Time and Speed Info */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono leading-none">
            <span className={isMe ? 'text-white/80' : 'text-[#737373]'}>
              {isPlaying || currentTime > 0
                ? `${formatAudioDuration(currentTime)} / ${formatAudioDuration(totalDuration)}`
                : formatAudioDuration(totalDuration)}
            </span>

            {/* Speed Multiplier Badge */}
            <button
              type="button"
              onClick={cycleSpeed}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                isMe
                  ? 'bg-white/15 hover:bg-white/25 text-white/90'
                  : 'bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#525252]'
              }`}
              title="Change playback speed"
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      </div>

      {hasError && (
        <div className="mt-2 text-[10px] text-rose-400 flex items-center gap-1">
          <AlertCircle size={12} />
          <span>Audio file could not be played.</span>
        </div>
      )}

      {/* Message Metadata & Delivery Status */}
      <div
        className={`flex items-center justify-end gap-1.5 mt-2 pt-1 border-t text-[9px] ${
          isMe ? 'border-white/10 text-white/60' : 'border-[#F0F0F0] text-[#A3A3A3]'
        }`}
      >
        <span className="flex items-center gap-1 font-sans">
          <Volume2 size={10} className={isMe ? 'text-[#F4C430]' : 'text-[#737373]'} />
          Voice Message
        </span>
        <span>•</span>
        <span>{formatMessageTime(createdAt)}</span>
        {isMe && (
          <span title={isRead ? 'Read' : 'Delivered'}>
            {isRead ? (
              <CheckCheck size={12} className="text-[#F4C430]" />
            ) : (
              <Check size={12} />
            )}
          </span>
        )}
      </div>
    </div>
  );
};
