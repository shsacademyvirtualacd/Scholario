import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', variant = 'full', className = '' }) => {
  const sizes = {
    sm: { tile: 32, iconSize: 16, text: 'text-lg', sub: 'text-[8px]' },
    md: { tile: 40, iconSize: 20, text: 'text-xl', sub: 'text-[9px]' },
    lg: { tile: 52, iconSize: 26, text: 'text-3xl', sub: 'text-[10px]' },
  };

  const { tile, iconSize, text, sub } = sizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon tile: dark bg with gold graduation cap */}
      <div
        style={{
          width: tile,
          height: tile,
          background: '#111111',
          borderRadius: tile * 0.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Graduation cap */}
          <polygon points="12,3 22,8 12,8 2,8" fill="#F4C430" />
          <path d="M5 9.5v5.5c0 1.5 3 3.5 7 3.5s7-2 7-3.5V9.5" fill="#F4C430" fillOpacity="0.25" stroke="#F4C430" strokeWidth="1.2" strokeLinejoin="round" />
          {/* Tassel line */}
          <line x1="22" y1="8" x2="22" y2="14" stroke="#F4C430" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="22" cy="15" r="1.2" fill="#F4C430" />
          {/* S letter */}
          <path
            d="M14.5 10.5C14.5 9.4 13.4 8.5 12 8.5C10.6 8.5 9.5 9.4 9.5 10.5C9.5 11.6 10.6 12.5 12 12.5C13.4 12.5 14.5 13.4 14.5 14.5C14.5 15.6 13.4 16.5 12 16.5C10.6 16.5 9.5 15.6 9.5 14.5"
            stroke="white"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <span
            className={`${text} font-extrabold tracking-tight text-[#111111]`}
            style={{ letterSpacing: '-0.03em' }}
          >
            Scholario
          </span>
          <span
            className={`${sub} font-semibold tracking-[0.15em] uppercase text-[#737373] mt-0.5`}
          >
            Learn&nbsp;·&nbsp;Grow&nbsp;·&nbsp;Achieve
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
