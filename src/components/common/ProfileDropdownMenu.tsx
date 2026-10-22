import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  LogOut,
  ChevronRight,
  Loader2,
  Sun,
  Moon,
  Laptop,
  X,
  AlertTriangle,
} from 'lucide-react';
import ProfileAvatar from './ProfileAvatar';
import { useTheme } from '../../context/ThemeContext';
import type { Profile } from '../../types';

export interface ProfileDropdownMenuProps {
  profile: Profile | null;
  role: 'admin' | 'teacher' | 'student';
  onSignOut?: () => Promise<void> | void;
  isSigningOut?: boolean;
  align?: 'right' | 'left';
  className?: string;
  avatarSize?: 'sm' | 'md' | 'lg';
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export const ProfileDropdownMenu: React.FC<ProfileDropdownMenuProps> = ({
  profile,
  role,
  onSignOut,
  isSigningOut = false,
  className = '',
  avatarSize = 'md',
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  onClose: controlledOnClose,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;

  const handleToggle = useCallback(() => {
    if (controlledOnToggle) {
      controlledOnToggle();
    } else {
      setInternalOpen((prev) => !prev);
    }
  }, [controlledOnToggle]);

  const handleClose = useCallback(() => {
    setShowConfirmSignOut(false);
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  }, [controlledOnClose]);

  const [showConfirmSignOut, setShowConfirmSignOut] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, themeMode, setThemeMode } = useTheme();

  // Desktop/tablet position state
  const [dropdownPos, setDropdownPos] = useState({
    top: 64,
    left: 12,
    width: 320,
    maxHeight: 520,
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const isDesktopOrTablet = window.innerWidth >= 768;

    if (isDesktopOrTablet) {
      const cardWidth = 320;
      const top = rect.bottom + 8;
      // Clamp between 12px from left and 12px from right edge
      const idealLeft = rect.right - cardWidth;
      const maxLeft = window.innerWidth - cardWidth - 12;
      const clampedLeft = Math.max(12, Math.min(idealLeft, maxLeft));
      const maxHeight = Math.max(240, window.innerHeight - top - 24);

      setDropdownPos({
        top,
        left: clampedLeft,
        width: cardWidth,
        maxHeight,
      });
    }
  }, []);

  // Update position on open and resize
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    } else {
      setShowConfirmSignOut(false);
    }
  }, [isOpen, updatePosition]);

  // Lock body scroll on phones (<768px) when open
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Close on route change
  useEffect(() => {
    if (isOpen) {
      handleClose();
    }
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Close on phone Back button (popstate)
  useEffect(() => {
    if (!isOpen) return;
    const handlePopState = () => {
      handleClose();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, handleClose]);

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

  const isDesktopOrTablet = typeof window !== 'undefined' && window.innerWidth >= 768;

  const glassInlineStyle: React.CSSProperties = isDark
    ? {
        backgroundColor: 'rgba(20, 20, 22, 0.96)',
        backdropFilter: 'blur(28px) saturate(170%)',
        WebkitBackdropFilter: 'blur(28px) saturate(170%)',
      }
    : {
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      };

  const renderMenuContent = () => (
    <div className="divide-y divide-black/[0.06] dark:divide-white/[0.10]">
      {/* ── 1. User Identity Header ── */}
      <div className="p-4 sm:p-5 flex items-center gap-3.5">
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
          <div className="inline-flex items-center mt-1 px-2 py-0.5 rounded-md bg-[#F2C230]/15 border border-[#F2C230]/30 text-[#8A6A00] dark:text-[#F2C230] text-[10px] font-extrabold tracking-wider uppercase">
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
            handleClose();
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

      {/* ── 4. Sign Out with Confirmation Flow ── */}
      {onSignOut && (
        <div className="p-2 sm:p-2.5">
          {showConfirmSignOut ? (
            <div className="p-3 bg-red-50/80 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/50 rounded-xl space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle size={15} />
                <span className="text-xs font-bold">Sign out of Scholario?</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmSignOut(false)}
                  className="flex-1 h-9 rounded-lg text-xs font-bold bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    handleClose();
                    await onSignOut();
                  }}
                  disabled={isSigningOut}
                  className="flex-1 h-9 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSigningOut ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <LogOut size={13} />
                  )}
                  <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => setShowConfirmSignOut(true)}
              className="w-full h-[52px] min-h-[52px] px-3 rounded-xl flex items-center justify-between text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
                  <LogOut size={16} />
                </div>
                <span>Sign Out</span>
              </div>
              <ChevronRight size={15} className="opacity-60" />
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {/* ── Avatar Trigger Button (44x44px target) ── */}
      <button
        ref={triggerRef}
        type="button"
        id="profile-dropdown-trigger"
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="profile-dropdown-menu"
        title={profile?.full_name || 'Profile & Settings'}
        className="rounded-xl overflow-hidden hover:scale-105 active:scale-95 transition-all p-0.5 border border-transparent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F2C230] cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <ProfileAvatar
          avatarUrl={profile?.avatar_url}
          name={profile?.full_name ?? (role === 'admin' ? 'Administrator' : role === 'teacher' ? 'Teacher' : 'Student')}
          role={role}
          size={avatarSize}
        />
      </button>

      {/* ── Portaled Dropdown / Bottom Sheet ── */}
      {isOpen &&
        createPortal(
          <>
            {/* Light Dim Backdrop */}
            <div
              className="fixed inset-0 z-[9998] bg-black/35 backdrop-blur-xs transition-opacity duration-150"
              onClick={handleClose}
              aria-hidden="true"
            />

            {/* Desktop / Tablet anchored card (>=768px) vs Phone Bottom Sheet (<768px) */}
            {isDesktopOrTablet ? (
              <div
                id="profile-dropdown-menu"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="profile-dropdown-trigger"
                tabIndex={-1}
                style={{
                  ...glassInlineStyle,
                  position: 'fixed',
                  top: `${dropdownPos.top}px`,
                  left: `${dropdownPos.left}px`,
                  width: `${dropdownPos.width}px`,
                  maxHeight: `${dropdownPos.maxHeight}px`,
                }}
                className="z-[9999] rounded-[20px] border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-180"
              >
                {renderMenuContent()}
              </div>
            ) : (
              <div
                id="profile-dropdown-menu"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="profile-dropdown-trigger"
                tabIndex={-1}
                style={glassInlineStyle}
                className="fixed inset-x-0 bottom-0 z-[9999] rounded-t-[28px] border-t border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-250 pb-[calc(1rem+env(safe-area-inset-bottom))]"
              >
                {/* Drag Handle & Mobile Close */}
                <div className="pt-3 pb-1 px-4 flex items-center justify-between">
                  <div className="w-8" />
                  <div
                    className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600 cursor-grab"
                    onClick={handleClose}
                  />
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                    aria-label="Close menu"
                  >
                    <X size={18} />
                  </button>
                </div>

                {renderMenuContent()}
              </div>
            )}
          </>,
          document.body
        )}
    </div>
  );
};

export default ProfileDropdownMenu;
