import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  BookMarked,
  FileCheck2,
  Bell,
  CreditCard,
  Bot,
  ClipboardCheck,
  Target,
  PanelLeftClose,
  PanelLeft,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../features/auth/AuthContext';
import { useUnreadChatCount } from '../../hooks/useUnreadChatCount';
import { useSidebarNav } from '../../hooks/useSidebarNav';
import { AnnouncementBanner } from '../common/AnnouncementBanner';
import { formatProperName, formatBoardLabel } from '../../utils/studentFormatting';
import QuickStartModal from './QuickStartModal';
import PortalHeader from '../common/PortalHeader';
import PortalDrawer from '../common/PortalDrawer';
import GlobalSearchModal from '../common/GlobalSearchModal';

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

  // Unified single source of truth for sidebar state
  const {
    isRailCollapsed,
    drawerOpen,
    setDrawerOpen,
    toggleSidebar,
    isExpandedOrOpen,
  } = useSidebarNav('student');

  const [searchOpen, setSearchOpen] = useState(false);
  const [quickStartOpen, setQuickStartOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Check if first-time user should see quick start guide
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('scholario_quickstart_dismissed');
      if (!dismissed) {
        const shownSession = sessionStorage.getItem('scholario_quickstart_session_shown');
        if (!shownSession && profile?.role === 'student') {
          sessionStorage.setItem('scholario_quickstart_session_shown', 'true');
          setQuickStartOpen(true);
        }
      }
    } catch {}
  }, [profile?.role]);

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
    setDrawerOpen(false);
    navigate(path);
  };

  // Student academic summary
  const studentName = formatProperName(profile?.full_name);
  const studentGradeRaw = profile?.class?.grade || (profile as any)?.grade || '10';
  const cleanGrade = studentGradeRaw.replace(/^grade\s+/i, '').trim();
  const rawBoard = profile?.board_id || (typeof profile?.board === 'string' ? profile.board : profile?.board?.id) || profile?.class?.board_id || 'Sindh';
  const studentBoard = formatBoardLabel(rawBoard);
  const studentAcademicLabel = `Grade ${cleanGrade} · ${studentBoard} Board`;

  // Navigation Groups
  const NAV_GROUPS: NavGroup[] = React.useMemo(() => [
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
        { icon: Bot, label: 'Sage', path: '/student/sage' },
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
  ], [unreadCount]);

  const drawerNavGroups = React.useMemo(() => {
    return NAV_GROUPS.map((group) => ({
      title: group.title,
      items: group.items.map((item) => {
        const isBlocked = feeStatus !== 'paid' && item.path !== '/student/checkout';
        return {
          icon: item.icon,
          label: item.label,
          path: item.path,
          badge: item.badge,
          disabled: item.disabled || isBlocked,
        };
      }),
    }));
  }, [NAV_GROUPS, feeStatus]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0E0E10] flex" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* ── Overlay Navigation Drawer (Phone & Tablet, hidden on Desktop lg:) ── */}
      <PortalDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="student"
        profile={profile}
        navGroups={drawerNavGroups}
        onOpenSearch={() => setSearchOpen(true)}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
        extraFooterAction={
          <button
            type="button"
            onClick={() => {
              setDrawerOpen(false);
              setQuickStartOpen(true);
            }}
            className="min-h-[44px] min-w-[44px] w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-[#8A6A00] dark:hover:text-[#F2C230] hover:bg-neutral-100 dark:hover:bg-neutral-800/60 rounded-xl transition-colors cursor-pointer"
          >
            <HelpCircle size={16} className="text-[#8A6A00] dark:text-[#F2C230]" />
            <span>Quick Start Guide</span>
          </button>
        }
      />

      {/* ── Desktop Persistent Sidebar (>=1024px, 72px rail when collapsed, 256px when expanded) ── */}
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 z-40 bg-[#111111] border-r border-neutral-800 flex-col transition-all duration-300 ${
          isRailCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Top Header: Logo + Collapse Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-800/80 shrink-0">
          <div className={`${isRailCollapsed ? 'hidden' : 'flex'} flex-col overflow-hidden`}>
            <Logo size="sm" variant="full" darkMode />
          </div>
          <div className={`${isRailCollapsed ? 'flex' : 'hidden'} mx-auto`}>
            <Logo size="sm" variant="icon" darkMode />
          </div>

          {/* Desktop Rail Collapse Toggle */}
          <button
            type="button"
            onClick={toggleSidebar}
            className={`p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F2C230] ${
              isRailCollapsed ? 'hidden' : 'flex'
            }`}
            title={isRailCollapsed ? 'Expand sidebar' : 'Collapse to icon rail'}
            aria-label={isRailCollapsed ? 'Expand sidebar' : 'Collapse to icon rail'}
          >
            {isRailCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Navigation (Independent scrolling) */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-4 min-h-0 custom-scrollbar">
          {NAV_GROUPS.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <span className={`px-3 text-[10px] font-bold text-neutral-400 tracking-wider uppercase block ${isRailCollapsed ? 'hidden' : 'block'}`}>
                {group.title}
              </span>

              <div className="space-y-0.5">
                {group.items.map(({ icon: Icon, label, path, badge, disabled }) => {
                  const isActive = isPathActive(path);
                  const isBlocked = feeStatus !== 'paid' && path !== '/student/checkout';
                  const isDisabled = disabled || isBlocked;

                  return (
                    <button
                      key={path}
                      type="button"
                      onClick={() => !isDisabled && handleNav(path)}
                      disabled={isDisabled}
                      title={label}
                      aria-label={label}
                      className={`w-full flex items-center rounded-xl font-semibold transition-all relative group cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F2C230] ${
                        isRailCollapsed
                          ? 'min-h-[44px] justify-center p-2.5 text-xs'
                          : 'min-h-[44px] justify-between px-3 py-2.5 text-xs'
                      } ${
                        isActive
                          ? 'bg-[rgba(242,194,48,0.14)] text-white font-bold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-[#F2C230] before:rounded-r'
                          : isDisabled
                          ? 'text-neutral-600 opacity-40 cursor-not-allowed'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800/70'
                      }`}
                    >
                      <div className={`flex items-center gap-3 min-w-0 ${isRailCollapsed ? 'justify-center' : ''}`}>
                        <Icon
                          size={19}
                          className={`shrink-0 transition-colors ${
                            isActive
                              ? 'text-[#F4C430]'
                              : 'text-neutral-400 group-hover:text-white'
                          }`}
                        />
                        <span className={`truncate tracking-tight ${isRailCollapsed ? 'hidden' : 'inline'}`}>
                          {label}
                        </span>
                      </div>

                      {/* Badges */}
                      <div className={`items-center gap-1.5 shrink-0 ml-2 ${isRailCollapsed ? 'hidden' : 'flex'}`}>
                        {badge !== undefined && badge !== null && !isDisabled && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#F4C430] text-neutral-900 leading-none">
                            {badge}
                          </span>
                        )}
                        {isBlocked && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">
                            Locked
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Card & Footer in Sidebar */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-900/40 space-y-2 shrink-0">
          <div className={`flex items-center gap-3 p-1.5 ${isRailCollapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center font-black text-sm shrink-0">
              {studentName.charAt(0) || 'S'}
            </div>
            <div className={`min-w-0 flex-1 ${isRailCollapsed ? 'hidden' : 'block'}`}>
              <p className="text-xs font-bold text-white truncate">{studentName}</p>
              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                {studentAcademicLabel}
              </p>
            </div>
          </div>

          {/* Quick Start Guide Button */}
          <button
            type="button"
            onClick={() => setQuickStartOpen(true)}
            className={`min-h-[44px] min-w-[44px] w-full flex items-center gap-2 p-2 text-xs font-medium text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F2C230] ${
              isRailCollapsed ? 'justify-center' : 'px-3'
            }`}
            title="Quick Start Guide"
            aria-label="Quick Start Guide"
          >
            <HelpCircle size={16} className="shrink-0 text-amber-400" />
            <span className={`${isRailCollapsed ? 'hidden' : 'inline'} truncate`}>
              Quick Start Guide
            </span>
          </button>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={`min-h-[44px] min-w-[44px] w-full flex items-center gap-2 p-2 text-xs font-medium text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F2C230] ${
              isRailCollapsed ? 'justify-center' : 'px-3'
            }`}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={16} className="shrink-0" />
            <span className={`${isRailCollapsed ? 'hidden' : 'inline'} truncate`}>
              {isSigningOut ? 'Signing out...' : 'Log out'}
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area (Desktop adapts smoothly: 72px rail vs 256px expanded; Tablet & Mobile ml-0) ── */}
      <div
        className={`flex-1 flex flex-col min-h-screen max-w-full overflow-x-hidden transition-all duration-300 ml-0 ${
          isRailCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
        }`}
      >
        {/* Global Site Announcement Banner */}
        <AnnouncementBanner />

        {/* ── Shared Unified Portal Header ── */}
        <PortalHeader
          role="student"
          sidebarOpen={isExpandedOrOpen}
          onToggleSidebar={toggleSidebar}
          onOpenSearch={() => setSearchOpen(true)}
          profile={profile}
          onSignOut={handleSignOut}
          isSigningOut={isSigningOut}
        />

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 bg-neutral-50 dark:bg-[#0E0E10] max-w-full">
          {children}
        </main>
      </div>

      {/* Quick Start Walkthrough Modal */}
      <QuickStartModal isOpen={quickStartOpen} onClose={() => setQuickStartOpen(false)} />

      {/* ── Global Search Modal ── */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        role="student"
        onSignOut={handleSignOut}
      />
    </div>
  );
};

export default StudentShell;
