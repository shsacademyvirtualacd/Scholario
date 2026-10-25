import React from 'react';
import { SageEmotion, SAGE_EMOTIONS } from './sageEmotion';
import {
  SAGE_AVATAR_THEME,
  SageCharacterId,
  Sage3DAvatarState,
  getSageCharacterById,
} from './useSageAvatarState';

export interface SageAvatarProps {
  emotion?: SageEmotion;
  avatarState?: Sage3DAvatarState;
  characterId?: SageCharacterId;
  headerCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
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
    svgSize: 34,
  },
  md: {
    container: 'w-11 h-11 rounded-2xl',
    svgSize: 40,
  },
  lg: {
    container: 'w-14 h-14 rounded-2xl',
    svgSize: 52,
  },
  xl: {
    container: 'w-20 h-20 rounded-3xl',
    svgSize: 74,
  },
};

/**
 * Character-aware 2D SVG portrait for each of the 6 Sage characters.
 * Used in the "Choose your Sage" picker cards, message bubbles, and as the base layer
 * underneath the live WebGL header canvas.
 */
export const SageCharacterSvg: React.FC<{
  characterId: SageCharacterId;
  emotion?: SageEmotion;
  avatarState?: Sage3DAvatarState;
  svgSize?: number;
  uid?: string;
}> = ({
  characterId = 'sage-classic',
  emotion = 'idle',
  avatarState,
  svgSize = 36,
  uid = 'char',
}) => {
  const { colors } = SAGE_AVATAR_THEME;
  const charDef = getSageCharacterById(characterId);

  const isThinking = avatarState === 'thinking' || avatarState === 'nod' || emotion === 'thinking';
  const isHappy =
    avatarState === 'success' ||
    avatarState === 'poke' ||
    emotion === 'positive';
  const isSpeaking = avatarState === 'speaking';
  const isSleepy = avatarState === 'sleepy';
  const isConcerned = avatarState === 'error' || emotion === 'concerned';

  const gradBodyId = `sageBody-${characterId}-${uid}`;
  const gradGoldId = `sageGold-${characterId}-${uid}`;

  return (
    <svg
      width={svgSize}
      height={svgSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none pointer-events-none"
    >
      <defs>
        <radialGradient id={gradBodyId} cx="50%" cy="38%" r="58%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="68%" stopColor={charDef.bodyColor} />
          <stop offset="100%" stopColor={charDef.shadowColor} />
        </radialGradient>
        <linearGradient id={gradGoldId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="55%" stopColor={colors.goldPrimary} />
          <stop offset="100%" stopColor={colors.goldDeep} />
        </linearGradient>
      </defs>

      {/* ── Ears / Side Accessories by Character ── */}
      {characterId === 'nova-bot' ? (
        <g>
          {/* Robot Golden Antenna + Side Headphones */}
          <line x1="32" y1="6" x2="32" y2="13" stroke={colors.goldPrimary} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="32" cy="5.5" r="3" fill="#FFE066" stroke={colors.goldDeep} strokeWidth="1" />
          <rect x="7.5" y="26" width="5.5" height="13" rx="2.7" fill={`url(#${gradGoldId})`} stroke="#18181B" strokeWidth="1" />
          <rect x="51" y="26" width="5.5" height="13" rx="2.7" fill={`url(#${gradGoldId})`} stroke="#18181B" strokeWidth="1" />
        </g>
      ) : characterId === 'milo-owl' ? (
        <g>
          {/* Fluffy Owl Ear Tufts */}
          <path d="M13 22L9 11L21 15Z" fill={charDef.shadowColor} stroke="#C7A987" strokeWidth="1" strokeLinejoin="round" />
          <path d="M51 22L55 11L43 15Z" fill={charDef.shadowColor} stroke="#C7A987" strokeWidth="1" strokeLinejoin="round" />
        </g>
      ) : (
        <g>
          {/* Soft Plush Ears */}
          <ellipse cx="15.5" cy="22" rx="6.8" ry="8" transform="rotate(-16 15.5 22)" fill={`url(#${gradBodyId})`} stroke="#E2D3B9" strokeWidth="1.1" />
          <ellipse cx="16" cy="22.5" rx="3.6" ry="4.4" transform="rotate(-16 16 22.5)" fill={charDef.earInnerColor} opacity="0.8" />
          <ellipse cx="48.5" cy="22" rx="6.8" ry="8" transform="rotate(16 48.5 22)" fill={`url(#${gradBodyId})`} stroke="#E2D3B9" strokeWidth="1.1" />
          <ellipse cx="48" cy="22.5" rx="3.6" ry="4.4" transform="rotate(16 48 22.5)" fill={charDef.earInnerColor} opacity="0.8" />
        </g>
      )}

      {/* ── Chubby Plush Head / Body ── */}
      <path
        d="M32 13C19.5 13 11.5 22.2 11.5 34.2C11.5 45.4 19.6 52.5 32 52.5C44.4 52.5 52.5 45.4 52.5 34.2C52.5 22.2 44.5 13 32 13Z"
        fill={`url(#${gradBodyId})`}
        stroke={characterId === 'nova-bot' ? '#D4D4D8' : '#E5D9C0'}
        strokeWidth="1.2"
      />

      {/* ── Character-Specific Hair / Headwear ── */}
      {characterId === 'ayan-scholar' && (
        <g>
          {/* Short swept dark boy hair + tuft */}
          <path
            d="M13 27C14 16.5 22 11.5 32 11.5C42 11.5 50 16.5 51 27C46.5 21.5 39 19.5 32 20C24 20.5 17.5 22.5 13 27Z"
            fill="#1E1B18"
          />
          <path d="M29 12C31 8 36 8.5 37 12.5" stroke="#1E1B18" strokeWidth="3.2" strokeLinecap="round" />
        </g>
      )}

      {characterId === 'zain-explorer' && (
        <g>
          {/* Dark hair fringe peeking under cozy gold-and-charcoal knit beanie */}
          <path d="M16 24C21 20.5 27 19.5 32 19.5C37 19.5 43 20.5 48 24" stroke="#221E1B" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M14 22C15.5 13 22.5 9.5 32 9.5C41.5 9.5 48.5 13 50 22Z" fill="#27272A" />
          <rect x="13" y="19" width="38" height="5.2" rx="2.6" fill={`url(#${gradGoldId})`} stroke="#18181B" strokeWidth="0.9" />
          <circle cx="32" cy="8" r="3.6" fill={`url(#${gradGoldId})`} />
        </g>
      )}

      {characterId === 'hamza-kurta' && (
        <g>
          {/* Neat parted Pakistani boy hairstyle */}
          <path
            d="M13.5 26.5C14.5 16 22 11.5 32 11.5C42 11.5 49.5 16 50.5 26.5C46 21.5 40 19 34 19.5C27 20 19 22 13.5 26.5Z"
            fill="#181512"
          />
          <path d="M23 14.5C27 12.5 34 12.5 39 14" stroke="#2E2924" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}

      {characterId === 'nova-bot' && (
        <g>
          {/* Sleek rounded dark visor screen & gold forehead crest */}
          <rect x="16.5" y="24" width="31" height="17" rx="8.5" fill="#18181B" stroke={colors.goldPrimary} strokeWidth="1.3" />
          <path d="M26 16.5H38" stroke={colors.goldPrimary} strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {characterId === 'milo-owl' && (
        <g>
          {/* Soft cream facial discs & belly feather patch */}
          <circle cx="23.5" cy="31.5" r="7.5" fill="#FFFDF9" opacity="0.88" />
          <circle cx="40.5" cy="31.5" r="7.5" fill="#FFFDF9" opacity="0.88" />
          <ellipse cx="32" cy="46.5" rx="11" ry="6" fill="#FFFDF9" opacity="0.75" />
        </g>
      )}

      {/* ── Character-Specific Outfit / Neckwear ── */}
      {characterId === 'sage-classic' && (
        <g>
          <path
            d="M17 47.5C21.2 50.8 26.4 52.2 32 52.2C37.6 52.2 42.8 50.8 47 47.5C48.2 50.2 46.8 53.5 43.2 54.6C36 56.8 28 56.8 20.8 54.6C17.2 53.5 15.8 50.2 17 47.5Z"
            fill={`url(#sageGold-${characterId}-${uid})`}
          />
          <path
            d="M19.5 50.6C27.5 53.3 36.5 53.3 44.5 50.6"
            stroke={colors.obsidianAccent}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="40.5" cy="51.5" r="2.3" fill="#FFFDF7" stroke={colors.obsidianAccent} strokeWidth="0.8" />
        </g>
      )}

      {characterId === 'ayan-scholar' && (
        <g>
          {/* Navy/Obsidian School Sweater with V-Neck Gold Trim */}
          <path d="M16 46.5C21 50 26.5 51.5 32 51.5C37.5 51.5 43 50 48 46.5L50 55C38 58 26 58 14 55L16 46.5Z" fill="#1E293B" />
          <path d="M24 47.5L32 54.5L40 47.5" stroke={colors.goldPrimary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}

      {characterId === 'zain-explorer' && (
        <g>
          {/* Twin Backpack Straps & Gold Buckles */}
          <path d="M19 44.5L17 55.5" stroke="#27272A" strokeWidth="4.2" strokeLinecap="round" />
          <path d="M45 44.5L47 55.5" stroke="#27272A" strokeWidth="4.2" strokeLinecap="round" />
          <rect x="15.8" y="48" width="4.8" height="3.2" rx="0.8" fill={colors.goldPrimary} />
          <rect x="43.4" y="48" width="4.8" height="3.2" rx="0.8" fill={colors.goldPrimary} />
        </g>
      )}

      {characterId === 'hamza-kurta' && (
        <g>
          {/* Pakistani Kurta Mandarin Collar + Placket + Gold Buttons */}
          <path d="M16 46C21 49.5 26.5 51 32 51C37.5 51 43 49.5 48 46L50 55.5C38 58.2 26 58.2 14 55.5L16 46Z" fill="#0F172A" />
          <rect x="29.6" y="46.5" width="4.8" height="10.5" rx="1.5" fill="#FFFDF9" stroke={colors.goldPrimary} strokeWidth="0.9" />
          <circle cx="32" cy="49.2" r="1.2" fill={colors.goldPrimary} />
          <circle cx="32" cy="52.4" r="1.2" fill={colors.goldPrimary} />
          <circle cx="32" cy="55.4" r="1.2" fill={colors.goldPrimary} />
        </g>
      )}

      {characterId === 'nova-bot' && (
        <g>
          {/* Brushed Gold Collar Ring & Glowing Core Badge */}
          <path d="M18 47.5C23 50.5 41 50.5 46 47.5" stroke={`url(#${gradGoldId})`} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="32" cy="51.5" r="2.8" fill="#FFE066" stroke="#18181B" strokeWidth="1" />
        </g>
      )}

      {characterId === 'milo-owl' && (
        <g>
          {/* Open Black & Gold Study Book at Bottom */}
          <path d="M19 49L32 51.5L45 49L44 56L32 58L20 56Z" fill="#18181B" stroke={colors.goldPrimary} strokeWidth="1.3" strokeLinejoin="round" />
          <line x1="32" y1="51.2" x2="32" y2="57.8" stroke={colors.goldPrimary} strokeWidth="1.2" />
        </g>
      )}

      {/* ── Soft Rosy Blush Cheeks ── */}
      <ellipse cx="19.5" cy="36.8" rx="4.2" ry="2.5" fill={colors.blush} opacity={isHappy ? 0.78 : 0.52} />
      <ellipse cx="44.5" cy="36.8" rx="4.2" ry="2.5" fill={colors.blush} opacity={isHappy ? 0.78 : 0.52} />

      {/* ── Big Expressive Eyes ── */}
      {isHappy ? (
        <>
          <path
            d="M20.5 31.5C21.8 28.8 25.2 28.8 26.5 31.5"
            stroke={characterId === 'nova-bot' ? '#FFE066' : colors.eyes}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M37.5 31.5C38.8 28.8 42.2 28.8 43.5 31.5"
            stroke={characterId === 'nova-bot' ? '#FFE066' : colors.eyes}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      ) : isSleepy ? (
        <>
          <path
            d="M20.5 32C21.8 34.2 25.2 34.2 26.5 32"
            stroke={characterId === 'nova-bot' ? '#FFE066' : colors.eyes}
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <path
            d="M37.5 32C38.8 34.2 42.2 34.2 43.5 32"
            stroke={characterId === 'nova-bot' ? '#FFE066' : colors.eyes}
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <ellipse
            cx="23.5"
            cy={isThinking ? 30.2 : 31.2}
            rx="3.4"
            ry="3.9"
            fill={characterId === 'nova-bot' ? '#FFE066' : colors.eyes}
          />
          <circle cx="22.3" cy={isThinking ? 28.8 : 29.8} r="1.25" fill={colors.eyeCatchlight} />
          <circle cx="24.7" cy={isThinking ? 31.3 : 32.3} r="0.65" fill={colors.eyeCatchlight} opacity="0.85" />

          <ellipse
            cx="40.5"
            cy={isThinking ? 30.2 : 31.2}
            rx="3.4"
            ry="3.9"
            fill={characterId === 'nova-bot' ? '#FFE066' : colors.eyes}
          />
          <circle cx="39.3" cy={isThinking ? 28.8 : 29.8} r="1.25" fill={colors.eyeCatchlight} />
          <circle cx="41.7" cy={isThinking ? 31.3 : 32.3} r="0.65" fill={colors.eyeCatchlight} opacity="0.85" />
        </>
      )}

      {/* ── Ayan's Round Gold-Rimmed Glasses ── */}
      {characterId === 'ayan-scholar' && (
        <g>
          <circle cx="23.5" cy="31.2" r="5.6" stroke={colors.goldPrimary} strokeWidth="1.5" fill="none" />
          <circle cx="40.5" cy="31.2" r="5.6" stroke={colors.goldPrimary} strokeWidth="1.5" fill="none" />
          <line x1="29.1" y1="31.2" x2="34.9" y2="31.2" stroke={colors.goldPrimary} strokeWidth="1.4" />
        </g>
      )}

      {/* ── Milo Owl's Golden Beak ── */}
      {characterId === 'milo-owl' && (
        <polygon points="32,35.8 29.6,32.6 34.4,32.6" fill={colors.goldPrimary} stroke={colors.goldDeep} strokeWidth="0.6" />
      )}

      {/* ── Tiny Mouth ── */}
      {isSpeaking ? (
        <ellipse
          cx="32"
          cy="36.8"
          rx="2.6"
          ry="3.1"
          fill={characterId === 'nova-bot' ? '#FFE066' : colors.mouth}
        />
      ) : isThinking ? (
        <circle cx="32" cy="36.8" r="1.7" fill={characterId === 'nova-bot' ? '#FFE066' : colors.mouth} />
      ) : isConcerned ? (
        <path
          d="M29.5 37.6C30.7 36.4 33.3 36.4 34.5 37.6"
          stroke={characterId === 'nova-bot' ? '#FFE066' : colors.mouth}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M29.2 35.8C30.5 37.8 33.5 37.8 34.8 35.8"
          stroke={characterId === 'nova-bot' ? '#FFE066' : colors.mouth}
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      )}

      {/* ── Classic Sage Graduation Cap (#1 Default) ── */}
      {characterId === 'sage-classic' && (
        <g transform="translate(32, 12.5) rotate(8)">
          <path d="M-8 0.5L0 3.2L8 0.5L6.5 4.8C3 6.2 -3 6.2 -6.5 4.8L-8 0.5Z" fill={colors.obsidianAccent} />
          <polygon points="0,-4.5 13,0 0,4.2 -13,0" fill="#232329" stroke={colors.goldPrimary} strokeWidth="0.9" />
          <circle cx="0" cy="-0.2" r="1.3" fill={colors.goldPrimary} />
          <path d="M0 -0.2Q7 1.2 9.5 6.2" stroke={colors.goldPrimary} strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="9.5" cy="6.5" r="1.4" fill={colors.goldPrimary} />
        </g>
      )}
    </svg>
  );
};

/**
 * Clean, live-animated Sage character thumbnail used in the Sage window header
 * and message stream bubbles.
 *
 * When `headerCanvasRef` is passed (in the top-left header), it renders the live
 * WebGL mirror canvas driven by the single Three.js renderer so the header profile
 * picture blinks, breathes, tracks the pointer, and lip-syncs in real time!
 */
export const SageAvatar: React.FC<SageAvatarProps> = ({
  emotion = 'idle',
  avatarState,
  characterId = 'sage-classic',
  headerCanvasRef,
  size = 'sm',
  showStatusText = false,
  pulseOnThinking = true,
  interactive = false,
  className = '',
  onClick,
}) => {
  const meta = SAGE_EMOTIONS[emotion] || SAGE_EMOTIONS.idle;
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.sm;
  const charDef = getSageCharacterById(characterId);

  const isThinking = avatarState === 'thinking' || emotion === 'thinking';
  const isSpeaking = avatarState === 'speaking';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`relative shrink-0 flex items-center justify-center bg-gradient-to-b from-[#FFFDF8] to-[#F5ECDA] dark:from-[#262420] dark:to-[#1B1A17] border border-[#E8DEC8] dark:border-[#3A352A] shadow-2xs overflow-hidden transition-transform duration-200 ${
          sizeConfig.container
        } ${
          pulseOnThinking && (isThinking || isSpeaking)
            ? 'ring-2 ring-[#F4C430]/70'
            : ''
        } ${interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}
        onClick={onClick}
        title={interactive ? `Tap ${charDef.name} to say hello!` : `${charDef.name} — Sage AI`}
        id={`sage-avatar-${size}-${characterId}`}
      >
        {/* Base animated 2D SVG character (always visible if WebGL is warming up or unsupported) */}
        <div
          className={`flex items-center justify-center w-full h-full ${
            avatarState === 'poke' || avatarState === 'success'
              ? 'animate-bounce'
              : 'animate-[pulse_3.4s_ease-in-out_infinite]'
          }`}
        >
          <SageCharacterSvg
            characterId={characterId}
            emotion={emotion}
            avatarState={avatarState}
            svgSize={sizeConfig.svgSize}
            uid={`${size}-${emotion}`}
          />
        </div>

        {/* Live WebGL mirror canvas for the top-left header profile picture */}
        {headerCanvasRef && (
          <canvas
            ref={headerCanvasRef}
            width={96}
            height={96}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        )}
      </div>

      {showStatusText && (
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-white tracking-tight">{charDef.name}</span>
          <span className="text-[11px] text-[#A3A3A3] truncate max-w-[200px]">{meta.statusText}</span>
        </div>
      )}
    </div>
  );
};

export default SageAvatar;
