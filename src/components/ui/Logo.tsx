import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  darkMode?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', variant = 'full', darkMode = false, className = '' }) => {
  const sizes = {
    sm: { tile: 32, text: 'text-lg', sub: 'text-[8px]' },
    md: { tile: 40, text: 'text-xl', sub: 'text-[9px]' },
    lg: { tile: 52, text: 'text-3xl', sub: 'text-[10px]' },
  };

  const { tile, text, sub } = sizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon tile: new logo */}
      <img
        id="scholario-logo-img"
        src="/logo.svg"
        alt="Scholario Logo"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/favicon.svg';
        }}
        style={{
          width: tile,
          height: tile,
          borderRadius: tile * 0.25,
          objectFit: 'cover',
          flexShrink: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        }}
      />

      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <span
            className={`${text} font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-[#111111]'}`}
            style={{ letterSpacing: '-0.03em' }}
          >
            Scholario
          </span>
          <span
            className={`${sub} font-semibold tracking-[0.15em] uppercase ${darkMode ? 'text-[#525252]' : 'text-[#737373]'} mt-0.5`}
          >
            Learn&nbsp;·&nbsp;Grow&nbsp;·&nbsp;Achieve
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
