import React, { useState, useRef, useEffect } from 'react';
import { SageEmotion, SAGE_EMOTIONS } from './sageEmotion';

export interface SageAvatarProps {
  emotion?: SageEmotion;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  showStatusText?: boolean;
  pulseOnThinking?: boolean;
  interactive?: boolean;
  className?: string;
  videoClassName?: string;
  onClick?: () => void;
}

const SIZE_MAP = {
  xs: {
    container: 'w-7 h-7 rounded-lg',
    badge: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5 text-[8px]',
    iconSize: 12,
    badgeIconSize: 8,
  },
  sm: {
    container: 'w-9 h-9 rounded-xl',
    badge: 'w-4 h-4 -bottom-1 -right-1 text-[9px]',
    iconSize: 16,
    badgeIconSize: 9,
  },
  md: {
    container: 'w-12 h-12 rounded-2xl',
    badge: 'w-5 h-5 -bottom-1 -right-1 text-[10px]',
    iconSize: 20,
    badgeIconSize: 11,
  },
  lg: {
    container: 'w-16 h-16 rounded-2xl',
    badge: 'w-6 h-6 -bottom-1.5 -right-1.5 text-xs',
    iconSize: 28,
    badgeIconSize: 13,
  },
  xl: {
    container: 'w-24 h-24 rounded-3xl',
    badge: 'w-8 h-8 -bottom-2 -right-2 text-sm',
    iconSize: 40,
    badgeIconSize: 16,
  },
};

export const SageAvatar: React.FC<SageAvatarProps> = ({
  emotion = 'idle',
  size = 'md',
  showBadge = true,
  showStatusText = false,
  pulseOnThinking = true,
  interactive = false,
  className = '',
  videoClassName = '',
  onClick,
}) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const meta = SAGE_EMOTIONS[emotion] || SAGE_EMOTIONS.idle;
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const EmotionIcon = meta.icon;

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Ensure video is playing smoothly
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Auto-play was prevented; video is muted so usually allowed
        });
      }
    }
  }, [emotion, meta.videoUrl]);

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* ── Avatar Frame with Halo & Video ── */}
      <div
        className={`relative shrink-0 flex items-center justify-center bg-[#111111] overflow-hidden transition-all duration-300 ${
          sizeConfig.container
        } ${meta.glowClass} ${
          pulseOnThinking && emotion === 'thinking' ? 'animate-pulse' : ''
        } ${interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}
        onClick={onClick}
        title={`Sage AI (${meta.label})`}
        id={`sage-avatar-${size}-${emotion}`}
      >
        {/* Animated Video Stream */}
        {!videoError ? (
          <video
            ref={videoRef}
            key={meta.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={meta.posterUrl}
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
            className={`w-full h-full object-cover select-none pointer-events-none transition-opacity duration-300 ${
              videoLoaded ? 'opacity-100' : 'opacity-80'
            } ${videoClassName}`}
          >
            {meta.webmUrl && <source src={meta.webmUrl} type="video/webm" />}
            <source src={meta.videoUrl} type="video/mp4" />
            {/* Fallback to original uncompressed MP4 if needed */}
            <source src="/animations/sage-avatar.mp4" type="video/mp4" />
          </video>
        ) : (
          /* Fallback static poster/icon if video decoding is unsupported in environment */
          <div className="w-full h-full flex items-center justify-center bg-[#1C1C1E] text-[#F4C430]">
            <EmotionIcon size={sizeConfig.iconSize} className="animate-pulse" />
          </div>
        )}

        {/* Dynamic Emotional Mood Tint / Overlay */}
        {emotion === 'thinking' && (
          <div className="absolute inset-0 bg-purple-900/20 mix-blend-overlay pointer-events-none" />
        )}
        {emotion === 'concerned' && (
          <div className="absolute inset-0 bg-red-900/25 mix-blend-overlay pointer-events-none" />
        )}
        {emotion === 'positive' && (
          <div className="absolute inset-0 bg-emerald-900/15 mix-blend-overlay pointer-events-none" />
        )}

        {/* Emotion Badge Indicator */}
        {showBadge && (
          <div
            className={`absolute ${sizeConfig.badge} ${meta.badgeBg} ${meta.badgeTextColor} rounded-full flex items-center justify-center font-bold shadow-md ring-2 ring-[#111111] transition-transform duration-200`}
            title={`Mood: ${meta.label}`}
          >
            <EmotionIcon size={sizeConfig.badgeIconSize} />
          </div>
        )}
      </div>

      {/* Optional Status Text Layout */}
      {showStatusText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white tracking-tight">Sage AI</span>
            <span
              className={`px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded-md tracking-wider ${meta.badgeBg} ${meta.badgeTextColor}`}
            >
              {meta.badgeLabel}
            </span>
          </div>
          <span className="text-[11px] text-[#A3A3A3] truncate max-w-[200px]">
            {meta.statusText}
          </span>
        </div>
      )}
    </div>
  );
};

export default SageAvatar;
