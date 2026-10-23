import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import NotificationBell from './NotificationBell';
import ProfileDropdownMenu from './ProfileDropdownMenu';
import ThemeToggleSwitch from './ThemeToggleSwitch';
import type { Profile } from '../../types';

export interface PortalHeaderProps {
  role: 'admin' | 'teacher' | 'student';
  title?: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  profile: Profile | null;
  onSignOut?: () => Promise<void> | void;
  isSigningOut?: boolean;
  className?: string;
}

/**
 * Animated 3-bar hamburger icon morphing into an 'X'
 * 3 bars: 20px wide, 2px tall, rounded.
 * Top bar rotates 45deg down, bottom bar rotates -45deg up, middle bar scales to 0.
 * Transition: ~220ms cubic-bezier(0.4, 0, 0.2, 1).
 */
export const AnimatedHamburgerIcon: React.FC<{ isOpen: boolean; className?: string }> = ({
  isOpen,
  className = '',
}) => {
  return (
    <div
      className={`w-5 h-4 relative flex flex-col justify-between items-center ${className}`}
      aria-hidden="true"
    >
      <span
        className={`w-5 h-0.5 rounded-full bg-current transform transition-all duration-220 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? 'translate-y-[7px] rotate-45' : 'translate-y-0 rotate-0'
        }`}
      />
      <span
        className={`w-5 h-0.5 rounded-full bg-current transform transition-all duration-220 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
        }`}
      />
      <span
        className={`w-5 h-0.5 rounded-full bg-current transform transition-all duration-220 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? '-translate-y-[7px] -rotate-45' : 'translate-y-0 rotate-0'
        }`}
      />
    </div>
  );
};

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  role,
  title,
  sidebarOpen,
  onToggleSidebar,
  onOpenSearch,
  profile,
  onSignOut,
  isSigningOut = false,
  className = '',
}) => {
  const location = useLocation();

  // Single source of truth for active header dropdown: mutual exclusivity
  const [activeDropdown, setActiveDropdown] = useState<'notifications' | 'profile' | null>(null);

  // Close dropdowns on route change
  useEffect(() => {
    setActiveDropdown(null);
  }, [location.pathname]);

  // Global keyboard shortcuts (Ctrl+K, Cmd+K, or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenSearch();
        return;
      }

      if (e.key === '/') {
        const target = e.target as HTMLElement;
        const isInputField =
          target?.tagName === 'INPUT' ||
          target?.tagName === 'TEXTAREA' ||
          target?.isContentEditable;
        if (!isInputField) {
          e.preventDefault();
          onOpenSearch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  // Detect OS for shortcut hint (Mac vs PC)
  const isMac =
    typeof navigator !== 'undefined' &&
    (/Mac|iPod|iPhone|iPad/.test(navigator.platform) ||
      (navigator as any)?.userAgentData?.platform === 'macOS');
  const shortcutHint = isMac ? '⌘K' : 'Ctrl K';

  // Role display label
  const roleLabel =
    role === 'admin' ? 'Admin' : role === 'teacher' ? 'Faculty' : 'Student';

  // Compute page title from route if not provided
  const resolvedTitle = React.useMemo(() => {
    if (title) return title;
    const pathname = location.pathname;

    if (role === 'admin') {
      if (pathname === '/admin') return 'Dashboard';
      if (pathname.startsWith('/admin/attendance')) return 'Attendance';
      if (pathname.startsWith('/admin/roster')) return 'Roster Manager';
      if (pathname.startsWith('/admin/schedule')) return 'Schedule Manager';
      if (pathname.startsWith('/admin/teachers')) return 'Teachers';
      if (pathname.startsWith('/admin/students')) return 'Students';
      if (pathname.startsWith('/admin/notes')) return 'Notes';
      if (pathname.startsWith('/admin/tests')) return 'Testing Center';
      if (pathname.startsWith('/admin/question-bank')) return 'Question Bank';
      if (pathname.startsWith('/admin/announcements')) return 'Announcements';
      if (pathname.startsWith('/admin/chat')) return 'Chat';
      if (pathname.startsWith('/admin/visibility-requests')) return 'Visibility Requests';
      if (pathname.startsWith('/admin/sage')) return 'Sage AI';
      if (pathname.startsWith('/admin/prices')) return 'Prices';
      if (pathname.startsWith('/admin/fees')) return 'Fees';
      if (pathname.startsWith('/admin/profile')) return 'Admin Profile';
      return 'Admin Portal';
    }

    if (role === 'teacher') {
      if (pathname === '/teacher') return 'Dashboard';
      if (pathname.startsWith('/teacher/chat')) return 'Chat';
      if (pathname.startsWith('/teacher/attendance')) return 'Attendance';
      if (pathname.startsWith('/teacher/notes')) return 'Notes Manager';
      if (pathname.startsWith('/teacher/tests')) return 'Testing Center';
      if (pathname.startsWith('/teacher/schedule')) return 'Schedule';
      if (pathname.startsWith('/teacher/announcements')) return 'Announcements';
      if (pathname.startsWith('/teacher/sage')) return 'Sage Assistant';
      if (pathname.startsWith('/teacher/profile')) return 'Faculty Profile';
      return 'Faculty Portal';
    }

    // Student
    if (pathname === '/student') return 'Dashboard';
    if (pathname.startsWith('/student/schedule')) return 'Schedule';
    if (pathname.startsWith('/student/attendance')) return 'Attendance';
    if (pathname.startsWith('/student/notes')) return 'Study Notes';
    if (pathname.startsWith('/student/tests')) return 'Testing Center';
    if (pathname.startsWith('/student/self-testing')) return 'Self Testing';
    if (pathname.startsWith('/student/sage')) return 'Sage Tutor';
    if (pathname.startsWith('/student/chat')) return 'Class Chat';
    if (pathname.startsWith('/student/announcements')) return 'Announcements';
    if (pathname.startsWith('/student/checkout')) return 'Tuition & Fees';
    if (pathname.startsWith('/student/profile')) return 'My Profile';
    return 'Student Portal';
  }, [title, location.pathname, role]);

  return (
    <header
      className={`sticky top-0 z-30 w-full backdrop-blur-md bg-white/85 dark:bg-[#111111]/85 flex items-center justify-between px-3.5 sm:px-6 pt-[calc(18px+env(safe-area-inset-top,0px))] pb-[18px] sm:pt-0 sm:pb-0 sm:h-16 min-h-[76px] sm:min-h-0 shrink-0 transition-colors ${className}`}
      style={{
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      {/* ── Left Section: Hamburger + Route Title & Role label ── */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1 max-w-[50%] sm:max-w-none">
        {/* Animated Hamburger (visible on all breakpoints: toggles drawer on mobile/tablet, collapses/expands rail on desktop) */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-800 dark:text-neutral-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F2C230] transition-colors cursor-pointer shrink-0"
          aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={sidebarOpen}
          aria-controls="portal-sidebar-nav"
        >
          <AnimatedHamburgerIcon isOpen={sidebarOpen} />
        </button>

        {/* Title + Role Indicator */}
        <div className="flex flex-col min-w-0 justify-center">
          <span className="font-bold text-[17px] sm:text-lg text-neutral-900 dark:text-neutral-100 truncate leading-snug">
            {resolvedTitle}
          </span>
          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate leading-normal">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* ── Center Section: Global Search Bar (Tablet 220px, Desktop max-480px centered) ── */}
      <div className="hidden sm:flex flex-1 items-center justify-center px-4 max-w-xl">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full sm:w-[220px] lg:max-w-[480px] lg:w-full h-10 lg:h-11 px-3.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.10] hover:border-[#F2C230]/60 dark:hover:border-[#F2C230]/60 flex items-center justify-between text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 hover:bg-black/[0.06] dark:hover:bg-white/[0.09] transition-all cursor-pointer group shadow-2xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F2C230]"
          title={`Search Scholario (${shortcutHint} or /)`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Search size={16} className="text-neutral-400 group-hover:text-[#8A6A00] dark:group-hover:text-[#F2C230] transition-colors shrink-0" />
            <span className="truncate hidden lg:inline">
              {role === 'admin'
                ? 'Search students, classes, notes...'
                : role === 'teacher'
                ? 'Search classes, tests, notes...'
                : 'Search notes, tests, schedule...'}
            </span>
            <span className="truncate lg:hidden">Search...</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 shrink-0 ml-2">
            <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-[10px] font-mono font-semibold text-neutral-600 dark:text-neutral-300 shadow-2xs">
              {shortcutHint}
            </kbd>
          </div>
        </button>
      </div>

      {/* ── Right Section: Search (Mobile), Bell, Theme Toggle, PFP Avatar ── */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Mobile Search Button (44px target) */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="sm:hidden w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.08] dark:hover:bg-white/[0.10] active:scale-95 transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F2C230]"
          aria-label="Open search dialog"
        >
          <Search size={19} />
        </button>

        {/* Notification Bell (44px target) */}
        <div className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <NotificationBell
            isOpen={activeDropdown === 'notifications'}
            onToggle={() =>
              setActiveDropdown((prev) => (prev === 'notifications' ? null : 'notifications'))
            }
            onClose={() => setActiveDropdown(null)}
            role={role}
          />
        </div>

        {/* Theme Toggle (Visible only on Tablet and Desktop; on mobile it resides in drawer footer & PFP menu) */}
        <div className="hidden sm:flex w-11 h-11 min-h-[44px] min-w-[44px] items-center justify-center">
          <ThemeToggleSwitch variant="compact" />
        </div>

        {/* User Profile Avatar with Dropdown Sheet (40px avatar in 44px container) */}
        <div className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ProfileDropdownMenu
            profile={profile}
            role={role}
            onSignOut={onSignOut}
            isSigningOut={isSigningOut}
            avatarSize="md"
            isOpen={activeDropdown === 'profile'}
            onToggle={() =>
              setActiveDropdown((prev) => (prev === 'profile' ? null : 'profile'))
            }
            onClose={() => setActiveDropdown(null)}
          />
        </div>
      </div>
    </header>
  );
};

export default PortalHeader;
