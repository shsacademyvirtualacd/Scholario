import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  BookMarked,
  FileCheck2,
  Bell,
  Menu,
  CreditCard,
  Sparkles,
  ClipboardCheck,
  Target,
  X,
  PanelLeftClose,
  PanelLeft,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../features/auth/AuthContext';
import { useUnreadChatCount } from '../../hooks/useUnreadChatCount';
import { NotificationBell } from '../common/NotificationBell';
import ProfileDropdownMenu from '../common/ProfileDropdownMenu';
import ThemeToggleSwitch from '../common/ThemeToggleSwitch';
import { AnnouncementBanner } from '../common/AnnouncementBanner';
import { APP_VERSION } from '../../utils/version';
import { formatProperName, formatBoardLabel } from '../../utils/studentFormatting';
import QuickStartModal from './QuickStartModal';

interface StudentShellProps {
  children: React.ReactNode;
}

interface NavItem {
  icon: any;
  label: string;
  path: string;
  badge?: number | string | null;
  disabled?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const StudentShell: React.FC<StudentShellProps> = ({ children }) => {
  const { profile, signOut, feeStatus } = useAuth();
  const { unreadCount } = useUnreadChatCount();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickStartOpen, setQuickStartOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Desktop rail collapsed preference
  const [isRailCollapsed, setIsRailCollapsed] = useState(() => {
    try {
      return localStorage.getItem('scholario_student_rail_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Check if first-time user should see quick start guide
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('scholario_quickstart_dismissed');
      if (!dismissed) {
        // Auto-show for fresh visits once profile loads
        const shownSession = sessionStorage.getItem('scholario_quickstart_session_shown');
        if (!shownSession && profile?.role === 'student') {
          sessionStorage.setItem('scholario_quickstart_session_shown', 'true');
          setQuickStartOpen(true);
        }
      }
    } catch {}
  }, [profile?.role]);

  // Close mobile drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  // Touch swipe-left to close on mobile
  const touchStartXRef = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.touches[0].clientX;
    if (diff > 60) {
      setSidebarOpen(false);
      touchStartXRef.current = null;
    }
  };

  const toggleRailCollapse = () => {
    setIsRailCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('scholario_student_rail_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const activeNav = location.pathname;

  const isPathActive = (path: string) => {
    if (path === '/student') {
      return activeNav === '/student';
    }
    return activeNav.startsWith(path);
  };

  const handleNav = (path: string) => {
    setSidebarOpen(false);
    navigate(path);
  };

  // Student academic summary
  const studentName = formatProperName(profile?.full_name);
  const studentGradeRaw = profile?.class?.grade || (profile as any)?.grade || '10';
  const cleanGrade = studentGradeRaw.replace(/^grade\s+/i, '').trim();
  const rawBoard = profile?.board_id || (typeof profile?.board === 'string' ? profile.board : profile?.board?.id) || profile?.class?.board_id || 'Sindh';
  const studentBoard = formatBoardLabel(rawBoard);
  const studentAcademicLabel = `Grade ${cleanGrade} · ${studentBoard} Board`;

  // Navigation Groups strictly matching specification
  const NAV_GROUPS: NavGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/student' },
        { icon: Calendar, label: 'Schedule', path: '/student/schedule' },
        { icon: ClipboardCheck, label: 'Attendance', path: '/student/attendance' },
      ],
    },
    {
      title: 'LEARNING',
      items: [
        { icon: BookMarked, label: 'Notes', path: '/student/notes' },
        { icon: FileCheck2, label: 'Testing Center', path: '/student/tests' },
        { icon: Target, label: 'Self Testing', path: '/student/self-testing' },
        { icon: Sparkles, label: 'Sage', path: '/student/sage' },
      ],
    },
    {
      title: 'COMMUNICATION',
      items: [
        {
          icon: MessageSquare,
          label: 'Chat',
          path: '/student/chat',
          badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : null,
        },
        { icon: Bell, label: 'Announcements', path: '/student/announcements' },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { icon: CreditCard, label: 'Tuition & Fees', path: '/student/checkout' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0E0E10] flex" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* ── Mobile Drawer Backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar (Drawer on mobile <640px, Icon rail on tablet 640-1023px, Collapsible on desktop >=1024px) ── */}
      <aside
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className={`fixed inset-y-0 left-0 z-50 bg-[#111111] border-r border-neutral-800 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full sm:translate-x-0'
        } ${sidebarOpen ? 'w-72' : 'sm:w-16'} ${isRailCollapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        {/* Top Header: Logo + Brand Tagline + Close / Collapse Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-800/80 shrink-0">
          <div className={`${sidebarOpen ? 'flex' : isRailCollapsed ? 'hidden' : 'hidden lg:flex'} flex-col overflow-hidden`}>
            <Logo size="sm" variant="full" darkMode />
          </div>
          <div className={`${sidebarOpen ? 'hidden' : isRailCollapsed ? 'flex' : 'flex lg:hidden'} mx-auto`}>
            <Logo size="sm" variant="icon" darkMode />
          </div>

          {/* Desktop Rail Collapse Toggle */}
          <button
            type="button"
            onClick={toggleRailCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title={isRailCollapsed ? 'Expand sidebar' : 'Collapse to icon rail'}
            aria-label={isRailCollapsed ? 'Expand sidebar' : 'Collapse to icon rail'}
          >
            {isRailCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="sm:hidden p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Student Portal Pill + Version Label (Identical style to Admin Panel) */}
        <div
          className={`px-4 py-2.5 border-b border-neutral-800/60 ${
            sidebarOpen ? 'flex' : isRailCollapsed ? 'hidden' : 'hidden lg:flex'
          } items-center justify-between shrink-0`}
        >
          <span className="text-[11px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">
            Student Portal
          </span>
          <span className="text-[10px] text-neutral-400 font-medium">{APP_VERSION}</span>
        </div>

        {/* ── Navigation Groups ── */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-4 custom-scrollbar min-h-0">
          {NAV_GROUPS.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {/* Group Title (hidden in collapsed/tablet mode) */}
              <div
                className={`px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-neutral-400 uppercase ${
                  sidebarOpen ? 'block' : isRailCollapsed ? 'hidden' : 'hidden lg:block'
                }`}
              >
                {group.title}
              </div>

              {/* Group Nav Items */}
              <div className="space-y-1">
                {group.items.map(({ icon: Icon, label, path, badge, disabled }) => {
                  const isBlocked = feeStatus !== 'paid' && path !== '/student/checkout';
                  const active = !disabled && !isBlocked && isPathActive(path);

                  return (
                    <button
                      key={path}
                      type="button"
                      onClick={() => !disabled && !isBlocked && handleNav(path)}
                      disabled={disabled || isBlocked}
                      title={
                        isBlocked
                          ? 'Unlocks after fee payment verification'
                          : isRailCollapsed
                          ? label
                          : undefined
                      }
                      className={`min-h-[48px] w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer relative ${
                        active
                          ? 'bg-amber-400/15 text-white font-bold border-l-4 border-amber-400'
                          : disabled || isBlocked
                          ? 'text-neutral-500 opacity-40 cursor-not-allowed'
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-800/70'
                      }`}
                    >
                      <Icon
                        size={18}
                        className={`shrink-0 ${
                          active ? 'text-amber-400' : 'text-neutral-400 group-hover:text-white'
                        }`}
                      />

                      <span
                        className={`truncate text-left flex-1 ${
                          sidebarOpen ? 'block' : isRailCollapsed ? 'hidden' : 'hidden lg:block'
                        }`}
                      >
                        {label}
                      </span>

                      {badge && (
                        <span
                          className={`shrink-0 px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-400 text-neutral-950 shadow-xs ${
                            sidebarOpen ? 'block' : isRailCollapsed ? 'hidden' : 'hidden lg:block'
                          }`}
                        >
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Footer: User Profile Card, Quick Start Help, and Logout ── */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/60 shrink-0 space-y-2">
          {/* User Card */}
          <div
            className={`p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-3 ${
              sidebarOpen ? 'flex' : isRailCollapsed ? 'hidden' : 'hidden lg:flex'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center font-black text-sm shrink-0">
              {studentName.charAt(0) || 'S'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{studentName}</p>
              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                {studentAcademicLabel}
              </p>
            </div>
          </div>

          {/* Quick Start Guide Button */}
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              setQuickStartOpen(true);
            }}
            className="min-h-[44px] min-w-[44px] w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-400 hover:text-amber-400 hover:bg-neutral-900 rounded-xl transition-colors cursor-pointer"
            title="Help & Quick Start Walkthrough"
          >
            <HelpCircle size={16} className="shrink-0 text-amber-400" />
            <span className={`${sidebarOpen ? 'block' : isRailCollapsed ? 'hidden' : 'hidden lg:block'} truncate`}>
              Quick Start Guide
            </span>
          </button>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="min-h-[44px] min-w-[44px] w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 rounded-xl transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut size={16} className="shrink-0" />
            <span className={`${sidebarOpen ? 'block' : isRailCollapsed ? 'hidden' : 'hidden lg:block'} truncate`}>
              {isSigningOut ? 'Signing out...' : 'Log out'}
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div
        className={`flex-1 flex flex-col min-h-screen max-w-full overflow-x-hidden transition-all duration-300 ${
          isRailCollapsed ? 'sm:ml-16 lg:ml-16' : 'sm:ml-16 lg:ml-64'
        }`}
      >
        {/* Global Site Announcement Banner */}
        <AnnouncementBanner />

        {/* Top bar (Sticky) */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 sm:px-6 shrink-0 max-w-full">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button (Mobile <640px) */}
            <button
              type="button"
              className="sm:hidden min-h-[44px] min-w-[44px] p-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center cursor-pointer"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>

            {/* Mobile Branding */}
            <div className="sm:hidden flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-neutral-900 dark:text-white">Scholario</span>
              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">
                UI v2
              </span>
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggleSwitch variant="compact" />
            <NotificationBell />
            <ProfileDropdownMenu
              profile={profile}
              role="student"
              onSignOut={handleSignOut}
              isSigningOut={isSigningOut}
              avatarSize="md"
            />
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 bg-neutral-50 dark:bg-[#0E0E10] max-w-full">
          {children}
        </main>
      </div>

      {/* Quick Start Walkthrough Modal */}
      <QuickStartModal isOpen={quickStartOpen} onClose={() => setQuickStartOpen(false)} />
    </div>
  );
};

export default StudentShell;
