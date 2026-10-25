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

      {/* ── Outer / Back Silhouette & Ears / Tufts / Antenna ── */}
      {characterId === 'nova-bot' ? (
        <g>
          {/* Robot Golden Antenna with Glowing Tip */}
          <line x1="32" y1="4" x2="32" y2="12" stroke={colors.goldPrimary} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="32" cy="3.5" r="3.2" fill="#FFE066" stroke={colors.goldDeep} strokeWidth="1" />
          {/* Side Gold Ear-Pads */}
          <rect x="6.5" y="24" width="6" height="15" rx="3" fill={`url(#${gradGoldId})`} stroke="#0F172A" strokeWidth="1" />
          <rect x="51.5" y="24" width="6" height="15" rx="3" fill={`url(#${gradGoldId})`} stroke="#0F172A" strokeWidth="1" />
        </g>
      ) : characterId === 'milo-owl' ? (
        <g>
          {/* Fluffy Owl Feather Ear Tufts */}
          <path d="M12 24L7 10L22 15Z" fill="#B8976C" stroke="#78350F" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M52 24L57 10L42 15Z" fill="#B8976C" stroke="#78350F" strokeWidth="1.2" strokeLinejoin="round" />
          {/* Wing Feathers on Sides */}
          <path d="M11 32C7 38 8 48 15 54C12 47 11 40 13 34Z" fill="#78350F" opacity="0.9" />
          <path d="M53 32C57 38 56 48 49 54C52 47 53 40 51 34Z" fill="#78350F" opacity="0.9" />
        </g>
      ) : characterId === 'zain-explorer' ? (
        <g>
          {/* Zain Round Ears + Backpack Top peeking from behind */}
          <rect x="14" y="38" width="8" height="16" rx="3" fill="#EA580C" opacity="0.9" />
          <rect x="42" y="38" width="8" height="16" rx="3" fill="#EA580C" opacity="0.9" />
          <ellipse cx="12" cy="34" rx="5.5" ry="6.5" fill={`url(#${gradBodyId})`} stroke="#9C5B23" strokeWidth="1" />
          <ellipse cx="52" cy="34" rx="5.5" ry="6.5" fill={`url(#${gradBodyId})`} stroke="#9C5B23" strokeWidth="1" />
        </g>
      ) : characterId === 'ayan-scholar' ? (
        <g>
          {/* Ayan Tidy Boy Ears */}
          <ellipse cx="14" cy="33" rx="5" ry="6.8" fill={`url(#${gradBodyId})`} stroke="#6E3D19" strokeWidth="1" />
          <ellipse cx="50" cy="33" rx="5" ry="6.8" fill={`url(#${gradBodyId})`} stroke="#6E3D19" strokeWidth="1" />
        </g>
      ) : characterId === 'hamza-kurta' ? (
        <g>
          {/* Hamza Gentle Ears */}
          <ellipse cx="13" cy="34" rx="5.2" ry="6.5" fill={`url(#${gradBodyId})`} stroke="#B0753E" strokeWidth="1" />
          <ellipse cx="51" cy="34" rx="5.2" ry="6.5" fill={`url(#${gradBodyId})`} stroke="#B0753E" strokeWidth="1" />
        </g>
      ) : (
        <g>
          {/* Classic Sage Soft Cream Plush Ears */}
          <ellipse cx="15.5" cy="22" rx="6.8" ry="8" transform="rotate(-16 15.5 22)" fill={`url(#${gradBodyId})`} stroke="#E2D3B9" strokeWidth="1.1" />
          <ellipse cx="16" cy="22.5" rx="3.6" ry="4.4" transform="rotate(-16 16 22.5)" fill={charDef.earInnerColor} opacity="0.8" />
          <ellipse cx="48.5" cy="22" rx="6.8" ry="8" transform="rotate(16 48.5 22)" fill={`url(#${gradBodyId})`} stroke="#E2D3B9" strokeWidth="1.1" />
          <ellipse cx="48" cy="22.5" rx="3.6" ry="4.4" transform="rotate(16 48 22.5)" fill={charDef.earInnerColor} opacity="0.8" />
        </g>
      )}

      {/* ── Distinct Head & Body Silhouettes ── */}
      {characterId === 'nova-bot' ? (
        /* Robot: Rounded-rectangle mechanical head casing */
        <g>
          {/* Hover thruster ring glow base (no legs) */}
          <ellipse cx="32" cy="54" rx="14" ry="4" fill={`url(#${gradGoldId})`} opacity="0.85" />
          <ellipse cx="32" cy="55.5" rx="8" ry="2.2" fill="#38BDF8" opacity="0.9" />
          {/* Rounded-rectangle head casing */}
          <rect
            x="11"
            y="13"
            width="42"
            height="37"
            rx="12"
            fill={`url(#${gradBodyId})`}
            stroke="#94A3B8"
            strokeWidth="1.4"
          />
        </g>
      ) : characterId === 'ayan-scholar' ? (
        /* Ayan: Taller slightly oval head + slim tidy body */
        <g>
          <ellipse
            cx="32"
            cy="33"
            rx="18.5"
            ry="21.5"
            fill={`url(#${gradBodyId})`}
            stroke="#5C3415"
            strokeWidth="1.2"
          />
        </g>
      ) : characterId === 'zain-explorer' ? (
        /* Zain: Wide rounder head + short stocky body */
        <g>
          <ellipse
            cx="32"
            cy="34"
            rx="22.5"
            ry="18.5"
            fill={`url(#${gradBodyId})`}
            stroke="#8F511E"
            strokeWidth="1.2"
          />
        </g>
      ) : characterId === 'hamza-kurta' ? (
        /* Hamza: Square-ish soft head */
        <g>
          <rect
            x="12.5"
            y="16"
            width="39"
            height="36"
            rx="14"
            fill={`url(#${gradBodyId})`}
            stroke="#9E6835"
            strokeWidth="1.2"
          />
          {/* Neat beard shadow / jawline mustache */}
          <path
            d="M19 37C21 46 27 50 32 50C37 50 43 46 45 37C42 41 37 43 32 43C27 43 22 41 19 37Z"
            fill="#452912"
            opacity="0.35"
          />
          <path d="M28 36.5C30 35.5 34 35.5 36 36.5" stroke="#3D2410" strokeWidth="1.3" strokeLinecap="round" opacity="0.45" />
        </g>
      ) : characterId === 'milo-owl' ? (
        /* Milo: Round fluffy owl body shape with feather contour */
        <g>
          <circle
            cx="32"
            cy="34"
            r="20.5"
            fill={`url(#${gradBodyId})`}
            stroke="#9E7D52"
            strokeWidth="1.2"
          />
          {/* Owl Facial Discs */}
          <circle cx="23.5" cy="30.5" r="8" fill="#FFFDF9" opacity="0.9" />
          <circle cx="40.5" cy="30.5" r="8" fill="#FFFDF9" opacity="0.9" />
          <ellipse cx="32" cy="46" rx="10" ry="5.5" fill="#FFFDF9" opacity="0.8" />
        </g>
      ) : (
        /* Sage: Classic Chubby Cream Marshmallow */
        <path
          d="M32 13C19.5 13 11.5 22.2 11.5 34.2C11.5 45.4 19.6 52.5 32 52.5C44.4 52.5 52.5 45.4 52.5 34.2C52.5 22.2 44.5 13 32 13Z"
          fill={`url(#${gradBodyId})`}
          stroke="#E5D9C0"
          strokeWidth="1.2"
        />
      )}

      {/* ── Character-Specific Hair / Headwear ── */}
      {characterId === 'ayan-scholar' && (
        <g>
          {/* Ayan: Short neat dark boy hair with side part and stylish front fringe */}
          <path
            d="M14 26C15 15 22 11 32 11C42 11 49 15 50 26C45 20.5 38 18.5 32 19C24.5 19.5 18 21.5 14 26Z"
            fill="#111827"
          />
          <path d="M28 12C30 8.5 35 9 36 12" stroke="#111827" strokeWidth="3.2" strokeLinecap="round" />
        </g>
      )}

      {characterId === 'zain-explorer' && (
        <g>
          {/* Zain: Bright Orange Beanie + curly messy dark hair peeking out */}
          <path d="M15 24C19 21 24 20 32 20C40 20 45 21 49 24" stroke="#1C1917" strokeWidth="4" strokeLinecap="round" />
          <path d="M13 22C15 12 22 8 32 8C42 8 49 12 51 22Z" fill="#EA580C" />
          {/* Ribbed Beanie Folded Brim */}
          <rect x="12" y="19" width="40" height="5.5" rx="2.7" fill="#F97316" stroke="#C2410C" strokeWidth="1" />
          {/* Bright Pom-Pom on Top */}
          <circle cx="32" cy="7" r="4.2" fill="#FDBA74" stroke="#EA580C" strokeWidth="1" />
        </g>
      )}

      {characterId === 'hamza-kurta' && (
        <g>
          {/* Hamza: White Prayer-Cap Style Topi with subtle gold geometric band */}
          <path d="M18 19C20 12 25 10 32 10C39 10 44 12 46 19Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
          <rect x="17" y="17" width="30" height="3" rx="1.5" fill="#FEF08A" stroke={colors.goldPrimary} strokeWidth="0.8" />
          {/* Side hair */}
          <path d="M13 24C14 20 16 17 18 16" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M51 24C50 20 48 17 46 16" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}

      {characterId === 'nova-bot' && (
        <g>
          {/* Nova: Dark High-Tech Visor Screen */}
          <rect x="15" y="21" width="34" height="19" rx="8" fill="#0F172A" stroke="#06B6D4" strokeWidth="1.5" />
          {/* Visor Eyebrow / Sensor Bar */}
          <line x1="24" y1="16" x2="40" y2="16" stroke={`url(#${gradGoldId})`} strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* ── Character-Specific Outfits ── */}
      {characterId === 'sage-classic' && (
        <g>
          {/* Classic Gold Scarf & Obsidian Stripe & Star Pin */}
          <path
            d="M17 47.5C21.2 50.8 26.4 52.2 32 52.2C37.6 52.2 42.8 50.8 47 47.5C48.2 50.2 46.8 53.5 43.2 54.6C36 56.8 28 56.8 20.8 54.6C17.2 53.5 15.8 50.2 17 47.5Z"
            fill={`url(#${gradGoldId})`}
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
          {/* Ayan: Navy-and-Gold School Blazer with Structured Lapels and Tiny Tie */}
          <path d="M14 47C20 50.5 25.5 52 32 52C38.5 52 44 50.5 50 47L51 56C39 59 25 59 13 56L14 47Z" fill="#1E3A8A" />
          {/* Gold Blazer Trim Lapel */}
          <path d="M21 47L32 55L43 47" stroke={colors.goldPrimary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Tiny Red/Gold School Tie */}
          <polygon points="32,49 33.5,55 32,56.5 30.5,55" fill="#DC2626" stroke="#991B1B" strokeWidth="0.7" />
        </g>
      )}

      {characterId === 'zain-explorer' && (
        <g>
          {/* Zain: Twin Backpack Straps & Gleaming Gold Buckles */}
          <path d="M18 45L16 56" stroke="#C2410C" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M46 45L48 56" stroke="#C2410C" strokeWidth="4.5" strokeLinecap="round" />
          <rect x="14.8" y="48.5" width="5.2" height="3.5" rx="1" fill={colors.goldPrimary} stroke="#B45309" strokeWidth="0.8" />
          <rect x="44" y="48.5" width="5.2" height="3.5" rx="1" fill={colors.goldPrimary} stroke="#B45309" strokeWidth="0.8" />
        </g>
      )}

      {characterId === 'hamza-kurta' && (
        <g>
          {/* Hamza: Crisp White Pakistani Kurta with Gold Buttons */}
          <path d="M15 47C20 50.5 25.5 52 32 52C38.5 52 44 50.5 49 47L50.5 56.5C39 59 25 59 13.5 56.5L15 47Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
          {/* Mandarin Placket */}
          <rect x="29.5" y="46.5" width="5" height="11" rx="1.5" fill="#FFFFFF" stroke={colors.goldPrimary} strokeWidth="1" />
          <circle cx="32" cy="49" r="1.3" fill={colors.goldPrimary} />
          <circle cx="32" cy="52" r="1.3" fill={colors.goldPrimary} />
          <circle cx="32" cy="55" r="1.3" fill={colors.goldPrimary} />
        </g>
      )}

      {characterId === 'nova-bot' && (
        <g>
          {/* Nova: Sleek Brushed Gold Collar Ring & Glowing Power Core */}
          <path d="M17 46C23 49 41 49 47 46" stroke={`url(#${gradGoldId})`} strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="32" cy="49.5" r="3" fill="#38BDF8" stroke="#06B6D4" strokeWidth="1" />
        </g>
      )}

      {characterId === 'milo-owl' && (
        <g>
          {/* Milo: Open Study Book held at bottom */}
          <path d="M18 48L32 51L46 48L44.5 56L32 58L19.5 56Z" fill="#18181B" stroke={colors.goldPrimary} strokeWidth="1.2" strokeLinejoin="round" />
          <line x1="32" y1="50.8" x2="32" y2="57.8" stroke={colors.goldPrimary} strokeWidth="1.2" />
        </g>
      )}

      {/* ── Cheeks / Blush (except Nova) ── */}
      {characterId !== 'nova-bot' && (
        <>
          <ellipse cx="19.5" cy="36.5" rx="3.8" ry="2.3" fill={colors.blush} opacity={isHappy ? 0.75 : 0.45} />
          <ellipse cx="44.5" cy="36.5" rx="3.8" ry="2.3" fill={colors.blush} opacity={isHappy ? 0.75 : 0.45} />
        </>
      )}

      {/* ── Expressive Eyes ── */}
      {characterId === 'nova-bot' ? (
        /* Nova Cyber Visor Eyes: Glowing Cyan/Gold Digital Shape */
        isHappy ? (
          <g>
            {/* Happy Curved Visor Arcs `^ ^` */}
            <path d="M21 29C23 26 27 26 29 29" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
            <path d="M35 29C37 26 41 26 43 29" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
          </g>
        ) : isThinking ? (
          <g>
            {/* Thinking Loading Dots/Spinners */}
            <circle cx="25" cy="30" r="3" fill="#38BDF8" />
            <circle cx="39" cy="30" r="3" fill="#FFE066" />
          </g>
        ) : isSleepy ? (
          <g>
            <line x1="21" y1="30" x2="29" y2="30" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="35" y1="30" x2="43" y2="30" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            {/* Glowing Rounded Visor Eyes with Cyan Halo */}
            <rect x="22" y="27" width="6.5" height="7.5" rx="3" fill="#38BDF8" />
            <rect x="36" y="27" width="6.5" height="7.5" rx="3" fill="#38BDF8" />
            <circle cx="23.8" cy="28.8" r="1.2" fill="#FFFFFF" />
            <circle cx="37.8" cy="28.8" r="1.2" fill="#FFFFFF" />
          </g>
        )
      ) : isHappy ? (
        <>
          <path
            d="M20.5 31.5C21.8 28.8 25.2 28.8 26.5 31.5"
            stroke={colors.eyes}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M37.5 31.5C38.8 28.8 42.2 28.8 43.5 31.5"
            stroke={colors.eyes}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      ) : isSleepy ? (
        <>
          <path
            d="M20.5 32C21.8 34.2 25.2 34.2 26.5 32"
            stroke={colors.eyes}
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <path
            d="M37.5 32C38.8 34.2 42.2 34.2 43.5 32"
            stroke={colors.eyes}
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          {/* Standard Eyes (Zain has extra large excited eyes) */}
          <ellipse
            cx="23.5"
            cy={isThinking ? 30.2 : 31.2}
            rx={characterId === 'zain-explorer' ? 4.2 : 3.4}
            ry={characterId === 'zain-explorer' ? 4.6 : 3.9}
            fill={colors.eyes}
          />
          <circle cx="22.3" cy={isThinking ? 28.8 : 29.8} r={characterId === 'zain-explorer' ? 1.6 : 1.25} fill={colors.eyeCatchlight} />
          <circle cx="24.7" cy={isThinking ? 31.3 : 32.3} r="0.65" fill={colors.eyeCatchlight} opacity="0.85" />

          <ellipse
            cx="40.5"
            cy={isThinking ? 30.2 : 31.2}
            rx={characterId === 'zain-explorer' ? 4.2 : 3.4}
            ry={characterId === 'zain-explorer' ? 4.6 : 3.9}
            fill={colors.eyes}
          />
          <circle cx="39.3" cy={isThinking ? 28.8 : 29.8} r={characterId === 'zain-explorer' ? 1.6 : 1.25} fill={colors.eyeCatchlight} />
          <circle cx="41.7" cy={isThinking ? 31.3 : 32.3} r="0.65" fill={colors.eyeCatchlight} opacity="0.85" />
        </>
      )}

      {/* ── Glasses & Beaks ── */}
      {characterId === 'ayan-scholar' && (
        <g>
          {/* Round Gold-Rimmed Glasses */}
          <circle cx="23.5" cy="31.2" r="5.8" stroke={colors.goldPrimary} strokeWidth="1.6" fill="none" />
          <circle cx="40.5" cy="31.2" r="5.8" stroke={colors.goldPrimary} strokeWidth="1.6" fill="none" />
          <line x1="29.3" y1="31.2" x2="34.7" y2="31.2" stroke={colors.goldPrimary} strokeWidth="1.6" />
        </g>
      )}

      {characterId === 'milo-owl' && (
        <g>
          {/* Milo: Tiny Reading Glasses perched over golden beak */}
          <circle cx="24.5" cy="29.5" r="5.2" stroke={colors.goldPrimary} strokeWidth="1.3" fill="none" />
          <circle cx="39.5" cy="29.5" r="5.2" stroke={colors.goldPrimary} strokeWidth="1.3" fill="none" />
          <line x1="29.7" y1="29.5" x2="34.3" y2="29.5" stroke={colors.goldPrimary} strokeWidth="1.3" />
          {/* Golden Beak */}
          <polygon points="32,35.5 29.5,32.2 34.5,32.2" fill={colors.goldPrimary} stroke={colors.goldDeep} strokeWidth="0.8" />
        </g>
      )}

      {/* ── Mouth ── */}
      {characterId !== 'nova-bot' && (
        isSpeaking ? (
          <ellipse
            cx="32"
            cy="37"
            rx="2.6"
            ry="3.1"
            fill={colors.mouth}
          />
        ) : isThinking ? (
          <circle cx="32" cy="37" r="1.7" fill={colors.mouth} />
        ) : isConcerned ? (
          <path
            d="M29.5 38C30.7 36.8 33.3 36.8 34.5 38"
            stroke={colors.mouth}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M29.2 36C30.5 38 33.5 38 34.8 36"
            stroke={colors.mouth}
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        )
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
