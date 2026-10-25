import React from 'react';
import { SageEmotion, SAGE_EMOTIONS } from './sageEmotion';
import { SAGE_AVATAR_THEME } from './useSageAvatarState';

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
    container: 'w-7 h-7 rounded-xl',
    svgSize: 24,
  },
  sm: {
    container: 'w-9 h-9 rounded-xl',
    svgSize: 32,
  },
  md: {
    container: 'w-10 h-10 rounded-2xl',
    svgSize: 36,
  },
  lg: {
    container: 'w-14 h-14 rounded-2xl',
    svgSize: 50,
  },
  xl: {
    container: 'w-20 h-20 rounded-3xl',
    svgSize: 72,
  },
};

/**
 * Clean, lightweight plush cream-and-gold Sage character thumbnail
 * used in the Sage window header and message stream bubbles.
 */
export const SageAvatar: React.FC<SageAvatarProps> = ({
  emotion = 'idle',
  size = 'sm',
  showStatusText = false,
  pulseOnThinking = true,
  interactive = false,
  className = '',
  onClick,
}) => {
  const meta = SAGE_EMOTIONS[emotion] || SAGE_EMOTIONS.idle;
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.sm;
  const { colors, accessories } = SAGE_AVATAR_THEME;

  const isThinking = emotion === 'thinking';
  const isHappy = emotion === 'positive';
  const isConcerned = emotion === 'concerned';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`relative shrink-0 flex items-center justify-center bg-gradient-to-b from-[#FFFDF8] to-[#F5ECDA] dark:from-[#262420] dark:to-[#1B1A17] border border-[#E8DEC8] dark:border-[#3A352A] shadow-2xs overflow-hidden transition-transform duration-200 ${
          sizeConfig.container
        } ${pulseOnThinking && isThinking ? 'ring-2 ring-[#F4C430]/60' : ''} ${
          interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
        }`}
        onClick={onClick}
        title={interactive ? 'Tap Sage to say hello!' : 'Sage AI'}
        id={`sage-avatar-${size}-${emotion}`}
      >
        <svg
          width={sizeConfig.svgSize}
          height={sizeConfig.svgSize}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="select-none pointer-events-none"
        >
          <defs>
            <radialGradient id={`sagePlushGrad-${size}`} cx="50%" cy="38%" r="58%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="68%" stopColor={colors.plushBody} />
              <stop offset="100%" stopColor={colors.plushShadow} />
            </radialGradient>
            <linearGradient id={`sageGoldGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFE066" />
              <stop offset="55%" stopColor={colors.goldPrimary} />
              <stop offset="100%" stopColor={colors.goldDeep} />
            </linearGradient>
          </defs>

          {/* Left & Right Plush Ears */}
          <ellipse cx="16" cy="21" rx="7.5" ry="8.5" transform="rotate(-18 16 21)" fill={`url(#sagePlushGrad-${size})`} stroke="#E6DAC3" strokeWidth="1.2" />
          <ellipse cx="16.5" cy="21.5" rx="4" ry="4.8" transform="rotate(-18 16.5 21.5)" fill={colors.earInner} opacity="0.75" />

          <ellipse cx="48" cy="21" rx="7.5" ry="8.5" transform="rotate(18 48 21)" fill={`url(#sagePlushGrad-${size})`} stroke="#E6DAC3" strokeWidth="1.2" />
          <ellipse cx="47.5" cy="21.5" rx="4" ry="4.8" transform="rotate(18 47.5 21.5)" fill={colors.earInner} opacity="0.75" />

          {/* Chubby Plush Head / Body */}
          <path
            d="M32 13C19.5 13 11.5 22.2 11.5 34.2C11.5 45.4 19.6 52.5 32 52.5C44.4 52.5 52.5 45.4 52.5 34.2C52.5 22.2 44.5 13 32 13Z"
            fill={`url(#sagePlushGrad-${size})`}
            stroke="#E5D9C0"
            strokeWidth="1.2"
          />

          {/* Cozy Gold & Obsidian Scarf */}
          {accessories.showGoldScarf && (
            <g>
              <path
                d="M17 47.5C21.2 50.8 26.4 52.2 32 52.2C37.6 52.2 42.8 50.8 47 47.5C48.2 50.2 46.8 53.5 43.2 54.6C36 56.8 28 56.8 20.8 54.6C17.2 53.5 15.8 50.2 17 47.5Z"
                fill={`url(#sageGoldGrad-${size})`}
              />
              <path
                d="M19.5 50.6C27.5 53.3 36.5 53.3 44.5 50.6"
                stroke={colors.obsidianAccent}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              {/* Little Gold Star Pin */}
              <circle cx="40.5" cy="51.5" r="2.3" fill="#FFFDF7" stroke={colors.obsidianAccent} strokeWidth="0.8" />
            </g>
          )}

          {/* Soft Rosy Blush Cheeks */}
          <ellipse cx="19.5" cy="36.8" rx="4.2" ry="2.5" fill={colors.blush} opacity={isHappy ? 0.75 : 0.52} />
          <ellipse cx="44.5" cy="36.8" rx="4.2" ry="2.5" fill={colors.blush} opacity={isHappy ? 0.75 : 0.52} />

          {/* Big Expressive Eyes */}
          {isHappy ? (
            <>
              <path d="M20.5 31.5C21.8 28.8 25.2 28.8 26.5 31.5" stroke={colors.eyes} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M37.5 31.5C38.8 28.8 42.2 28.8 43.5 31.5" stroke={colors.eyes} strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="23.5" cy={isThinking ? 30.2 : 31.2} rx="3.4" ry="3.9" fill={colors.eyes} />
              <circle cx="22.3" cy={isThinking ? 28.8 : 29.8} r="1.25" fill={colors.eyeCatchlight} />
              <circle cx="24.7" cy={isThinking ? 31.3 : 32.3} r="0.65" fill={colors.eyeCatchlight} opacity="0.85" />

              <ellipse cx="40.5" cy={isThinking ? 30.2 : 31.2} rx="3.4" ry="3.9" fill={colors.eyes} />
              <circle cx="39.3" cy={isThinking ? 28.8 : 29.8} r="1.25" fill={colors.eyeCatchlight} />
              <circle cx="41.7" cy={isThinking ? 31.3 : 32.3} r="0.65" fill={colors.eyeCatchlight} opacity="0.85" />
            </>
          )}

          {/* Tiny Mouth */}
          {isThinking ? (
            <circle cx="32" cy="36.8" r="1.7" fill={colors.mouth} />
          ) : isConcerned ? (
            <path d="M29.5 37.6C30.7 36.4 33.3 36.4 34.5 37.6" stroke={colors.mouth} strokeWidth="1.8" strokeLinecap="round" />
          ) : (
            <path d="M29.2 35.8C30.5 37.8 33.5 37.8 34.8 35.8" stroke={colors.mouth} strokeWidth="1.9" strokeLinecap="round" />
          )}

          {/* Miniature Tilted Scholario Graduation Cap */}
          {accessories.showGraduationCap && (
            <g transform="translate(32, 12.5) rotate(8)">
              {/* Cap Crown */}
              <path d="M-8 0.5L0 3.2L8 0.5L6.5 4.8C3 6.2 -3 6.2 -6.5 4.8L-8 0.5Z" fill={colors.obsidianAccent} />
              {/* Cap Mortarboard Top */}
              <polygon points="0,-4.5 13,0 0,4.2 -13,0" fill="#232329" stroke={colors.goldPrimary} strokeWidth="0.9" />
              {/* Gold Button & Tassel */}
              <circle cx="0" cy="-0.2" r="1.3" fill={colors.goldPrimary} />
              <path d="M0 -0.2Q7 1.2 9.5 6.2" stroke={colors.goldPrimary} strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="9.5" cy="6.5" r="1.4" fill={colors.goldPrimary} />
            </g>
          )}
        </svg>
      </div>

      {showStatusText && (
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-white tracking-tight">Sage</span>
          <span className="text-[11px] text-[#A3A3A3] truncate max-w-[200px]">{meta.statusText}</span>
        </div>
      )}
    </div>
  );
};

export default SageAvatar;
