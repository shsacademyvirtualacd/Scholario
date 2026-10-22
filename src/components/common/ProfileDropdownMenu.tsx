import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  LogOut,
  ChevronRight,
  Loader2,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import ProfileAvatar from './ProfileAvatar';
import { useTheme } from '../../context/ThemeContext';
import type { Profile } from '../../types';

interface ProfileDropdownMenuProps {
  profile: Profile | null;
  role: 'admin' | 'teacher' | 'student';
  onSignOut?: () => Promise<void> | void;
  isSigningOut?: boolean;
  align?: 'right' | 'left';
  className?: string;
  avatarSize?: 'sm' | 'md' | 'lg';
}

export const ProfileDropdownMenu: React.FC<ProfileDropdownMenuProps> = ({
  profile,
  role,
  onSignOut,
  isSigningOut = false,
  align = 'right',
  className = '',
  avatarSize = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, themeMode, setThemeMode } = useTheme();

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Click outside and Esc handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const profilePath =
    role === 'admin'
      ? '/admin/profile'
      : role === 'teacher'
      ? '/teacher/profile'
      : '/student/profile';

  const roleLabel =
    role === 'admin'
      ? 'ADMINISTRATOR'
      : role === 'teacher'
      ? 'FACULTY TEACHER'
      : 'STUDENT';

  const subtitle =
    role === 'admin'
      ? profile?.phone || 'Administrator'
      : role === 'teacher'
      ? 'Active Member'
      : profile?.class?.display_name || 'Active Student';

  // Glass panel style class string
  const glassPanelClasses = isDark
    ? 'border border-[rgba(255,255,255,0.18)] shadow-[0_12px_40px_rgba(0,0,0,0.45)] text-neutral-100'
    : 'border border-black/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.12)] text-neutral-900';

  const glassInlineStyle: React.CSSProperties = isDark
    ? {
        backgroundColor: 'rgba(255, 255, 255, 0.07)',
        backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%)',
        backdropFilter: 'blur(28px) saturate(170%) brightness(1.1)',
        WebkitBackdropFilter: 'blur(28px) saturate(170%) brightness(1.1)',
      }
    : {
        backgroundColor: 'rgba(255, 255, 255, 0.90)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {/* ── Trigger Button ── */}
      <button
        ref={triggerRef}
        type="button"
        id="profile-dropdown-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={profile?.full_name || 'Profile & Settings'}
        className="rounded-xl overflow-hidden hover:scale-105 active:scale-95 transition-all p-0.5 border border-transparent focus:outline-hidden focus:ring-2 focus:ring-[#F2C230] cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <ProfileAvatar
          avatarUrl={profile?.avatar_url}
          name={profile?.full_name ?? (role === 'admin' ? 'Administrator' : role === 'teacher' ? 'Teacher' : 'Student')}
          role={role}
          size={avatarSize}
        />
      </button>

      {/* ── Mobile Dim Backdrop (<640px) ── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/35 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Dropdown / Bottom Sheet ── */}
      {isOpen && (
        <div
          id="profile-dropdown-menu"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="profile-dropdown-trigger"
          tabIndex={-1}
          style={glassInlineStyle}
          className={`
            fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200
            sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-full sm:mt-2.5 sm:w-[320px] sm:rounded-[20px] sm:max-h-none sm:animate-in sm:fade-in sm:zoom-in-95
            ${align === 'right' ? 'sm:right-0' : 'sm:left-0'}
            ${glassPanelClasses}
          `}
        >
          {/* Desktop Arrow Pointer */}
          <div
            className={`hidden sm:block absolute -top-1.5 w-3 h-3 rotate-45 border-t border-l transition-colors ${
              align === 'right' ? 'right-4' : 'left-4'
            } ${
              isDark
                ? 'bg-[#18181B] border-[rgba(255,255,255,0.18)]'
                : 'bg-white border-black/[0.08]'
            }`}
            aria-hidden="true"
          />

          {/* Mobile Drag Handle */}
          <div className="sm:hidden pt-3 pb-1 flex justify-center">
            <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
          </div>

          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.10]">
            {/* ── 1. User Identity Header ── */}
            <div className="p-4 sm:p-5 flex items-center gap-3.5">
              {/* 56px Avatar with Gold Ring */}
              <div className="w-14 h-14 rounded-2xl ring-2 ring-[#F2C230] p-0.5 shrink-0 overflow-hidden flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                <ProfileAvatar
                  avatarUrl={profile?.avatar_url}
                  name={profile?.full_name ?? 'User'}
                  role={role}
                  size="lg"
                  className="w-full h-full rounded-[14px]"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-[17px] font-bold text-neutral-900 dark:text-neutral-100 truncate leading-tight">
                  {profile?.full_name || 'User Account'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                  {subtitle}
                </p>
                <div className="inline-flex items-center mt-1 px-2 py-0.5 rounded-md bg-[#F2C230]/15 border border-[#F2C230]/30 text-[#B45309] dark:text-[#F2C230] text-[10px] font-extrabold tracking-wider uppercase">
                  {roleLabel}
                </div>
              </div>
            </div>

            {/* ── 2. Profile & Account Settings Row (52px tall) ── */}
            <div className="p-1.5 sm:p-2">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  navigate(profilePath);
                }}
                className="w-full h-[52px] min-h-[52px] px-3 rounded-xl flex items-center justify-between text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                    <User size={16} />
                  </div>
                  <span>Profile & Account Settings</span>
                </div>
                <ChevronRight size={15} className="text-neutral-400 dark:text-neutral-500" />
              </button>
            </div>

            {/* ── 3. Appearance Row (Light | Dark | System) ── */}
            <div className="p-3 sm:p-3.5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-400 block px-1">
                Appearance
              </span>
              <div className="grid grid-cols-3 gap-1 bg-black/5 dark:bg-black/30 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    themeMode === 'light'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="Light Theme"
                >
                  <Sun size={13} className={themeMode === 'light' ? 'text-amber-500' : ''} />
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    themeMode === 'dark'
                      ? 'bg-[#18181B] text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="Dark Theme"
                >
                  <Moon size={13} className={themeMode === 'dark' ? 'text-[#F2C230]' : ''} />
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setThemeMode('system')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    themeMode === 'system'
                      ? 'bg-white dark:bg-[#18181B] text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="System Theme"
                >
                  <Laptop size={13} />
                  <span>System</span>
                </button>
              </div>
            </div>

            {/* ── 4 & 5. Sign Out (52px tall, red) ── */}
            {onSignOut && (
              <div className="p-1.5 sm:p-2">
                <button
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    setIsOpen(false);
                    await onSignOut();
                  }}
                  disabled={isSigningOut}
                  className="w-full h-[52px] min-h-[52px] px-3 rounded-xl flex items-center gap-3 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
                    {isSigningOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                  </div>
                  <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdownMenu;
