import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleSwitchProps {
  variant?: 'compact' | 'switch' | 'segmented';
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggleSwitch: React.FC<ThemeToggleSwitchProps> = ({
  variant = 'switch',
  className = '',
  showLabel = true,
}) => {
  const { isDark, toggleTheme } = useTheme();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center ${
          isDark
            ? 'bg-[#1F1F23] border-[#2E2E33] text-[#F4C430] hover:bg-[#2A2A30] hover:border-[#3E3E45]'
            : 'bg-white border-[#E5E5E5] text-[#111111] hover:bg-[#F5F5F5] hover:border-[#D4D4D4]'
        } ${className}`}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? <Sun size={18} className="text-[#F4C430]" /> : <Moon size={18} className="text-[#111111]" />}
      </button>
    );
  }

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl border transition-colors ${
          isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-[#F5F5F5] border-[#E5E5E5]'
        } ${className}`}
      >
        <button
          type="button"
          onClick={() => isDark && toggleTheme()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            !isDark
              ? 'bg-white text-[#111111] shadow-xs'
              : 'text-[#71717A] hover:text-[#FAFAFA]'
          }`}
        >
          <Sun size={14} className={!isDark ? 'text-amber-500' : ''} />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => !isDark && toggleTheme()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            isDark
              ? 'bg-[#27272A] text-white shadow-xs'
              : 'text-[#737373] hover:text-[#111111]'
          }`}
        >
          <Moon size={14} className={isDark ? 'text-[#F4C430]' : ''} />
          <span>Dark</span>
        </button>
      </div>
    );
  }

  // Default: Interactive Switch row
  return (
    <div
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTheme();
        }
      }}
      className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
        isDark
          ? 'hover:bg-[#27272A]/70 text-[#F4F4F5]'
          : 'hover:bg-[#F5F5F5] text-[#111111]'
      } ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
            isDark
              ? 'bg-[#27272A] text-[#F4C430]'
              : 'bg-[#F0F0F0] text-[#111111]'
          }`}
        >
          {isDark ? <Moon size={16} /> : <Sun size={16} className="text-amber-500" />}
        </div>
        {showLabel && (
          <div className="min-w-0">
            <p className="text-xs font-bold leading-tight truncate">
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </p>
            <p className="text-[10px] leading-tight text-[#71717A] truncate">
              {isDark ? 'Active: OLED Night Palette' : 'Active: Crisp Day Palette'}
            </p>
          </div>
        )}
      </div>

      {/* Pill Switch */}
      <div
        className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 ${
          isDark ? 'bg-[#F4C430]' : 'bg-[#D4D4D4]'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center transform transition-transform duration-200 ${
            isDark ? 'translate-x-5' : 'translate-x-0'
          }`}
        >
          {isDark ? (
            <Moon size={11} className="text-[#111111] fill-current" />
          ) : (
            <Sun size={11} className="text-amber-500" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeToggleSwitch;
