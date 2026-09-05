import React, { memo } from 'react';

/**
 * WhatsApp-style subtle doodle wallpaper background.
 * Renders an optimized SVG doodle pattern (academic + chat icons)
 * at a low opacity over WhatsApp's classic warm neutral backdrop (#EFEAE2).
 */
export const ChatWallpaper: React.FC<{ className?: string }> = memo(({ className = '' }) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none z-0 overflow-hidden bg-[#EFEAE2] ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full opacity-[0.065] text-[#111111]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="wa-doodle-pattern"
            width="200"
            height="200"
            patternUnits="userSpaceOnUse"
          >
            {/* Academic Graduation Cap */}
            <path
              d="M20 30 L45 18 L70 30 L45 42 Z M45 42 V55 M65 33 V50"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Chat Bubble */}
            <path
              d="M130 25 C130 18 140 14 155 14 C170 14 180 20 180 28 C180 36 170 42 155 42 C150 42 145 44 140 48 C141 44 141 42 140 40 C134 38 130 33 130 25 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Pencil */}
            <path
              d="M95 15 L108 28 L98 38 L85 25 Z M85 25 L80 40 L95 35"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Open Book */}
            <path
              d="M25 85 C32 80 42 80 48 83 C54 80 64 80 71 85 V105 C64 100 54 100 48 103 C42 100 32 100 25 105 Z M48 83 V103"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Clock */}
            <circle
              cx="115"
              cy="75"
              r="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M115 67 V75 L121 78"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Paper Airplane */}
            <path
              d="M165 80 L185 92 L155 102 L163 92 L165 80 Z M163 92 L172 95"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Coffee Mug */}
            <path
              d="M28 145 H48 V162 C48 167 44 171 38 171 C32 171 28 167 28 162 Z M48 150 H54 C56 150 58 152 58 155 C58 158 56 160 54 160 H48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Sparkle / Star */}
            <path
              d="M100 135 Q100 145 108 145 Q100 145 100 155 Q100 145 92 145 Q100 145 100 135"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />

            {/* Smiley Face */}
            <circle
              cx="155"
              cy="145"
              r="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M150 141 A1 1 0 0 1 150 142 M160 141 A1 1 0 0 1 160 142 M149 148 Q155 154 161 148"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Lightbulb */}
            <path
              d="M80 85 C75 85 71 89 71 94 C71 97 73 99 75 101 V104 H85 V101 C87 99 89 97 89 94 C89 89 85 85 80 85 Z M76 104 H84"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Music Note */}
            <path
              d="M135 180 V165 L148 161 V176 M135 174 A3 3 0 1 1 130 178 M148 170 A3 3 0 1 1 143 174"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Heart */}
            <path
              d="M75 180 C70 174 62 178 62 184 C62 191 75 198 75 198 C75 198 88 191 88 184 C88 178 80 174 75 180 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Headphones */}
            <path
              d="M175 178 A10 10 0 0 0 155 178 V186 H160 V180 H157 M175 186 H170 V180 H173"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Dots accents */}
            <circle cx="20" cy="65" r="1.5" fill="currentColor" />
            <circle cx="105" cy="48" r="1.5" fill="currentColor" />
            <circle cx="180" cy="55" r="1.5" fill="currentColor" />
            <circle cx="50" cy="125" r="1.5" fill="currentColor" />
            <circle cx="130" cy="115" r="1.5" fill="currentColor" />
            <circle cx="115" cy="180" r="1.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wa-doodle-pattern)" />
      </svg>
    </div>
  );
});
