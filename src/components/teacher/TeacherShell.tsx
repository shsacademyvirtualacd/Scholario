import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  ClipboardCheck,
  Calendar,
  BookMarked,
  FileCheck2,
  Bell,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../features/auth/AuthContext';
import { useUnreadChatCount } from '../../hooks/useUnreadChatCount';
import { useSidebarNav } from '../../hooks/useSidebarNav';
import { AnnouncementBanner } from '../common/AnnouncementBanner';
import PortalHeader from '../common/PortalHeader';
import PortalDrawer from '../common/PortalDrawer';
import GlobalSearchModal from '../common/GlobalSearchModal';

interface TeacherShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',     path: '/teacher' },
  { icon: MessageSquare,   label: 'Chat',          path: '/teacher/chat' },
  { icon: ClipboardCheck,  label: 'Attendance',    path: '/teacher/attendance' },
  { icon: BookMarked,      label: 'Notes Manager', path: '/teacher/notes' },
  { icon: FileCheck2,      label: 'Testing Center', path: '/teacher/tests' },
  { icon: Calendar,        label: 'Schedule',      path: '/teacher/schedule' },
  { icon: Bell,            label: 'Announcements', path: '/teacher/announcements' },
  { icon: Sparkles,        label: 'Sage',          path: '/teacher/sage' },
];

export const TeacherShell: React.FC<TeacherShellProps> = ({ children }) => {
  const { profile, signOut } = useAuth();
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
  } = useSidebarNav('teacher');

  const [searchOpen, setSearchOpen] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const drawerNavGroups = useMemo(() => [
    {
      title: 'ACADEMICS & TEACHING',
      items: NAV_ITEMS.map((item) => ({
        icon: item.icon,
        label: item.label,
        path: item.path,
        badge: item.path === '/teacher/chat' && unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
      })),
    },
  ], [unreadCount]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const activeNav = location.pathname;

  const handleNav = (path: string) => {
    setDrawerOpen(false);
    navigate(path);
  };

  const isPathActive = (path: string) => {
    if (path === '/teacher') {
      return activeNav === '/teacher';
    }
    return activeNav.startsWith(path);
  };

  return (
    <div className="min-h-screen teacher-page flex" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* ── Overlay Navigation Drawer (Phone & Tablet, hidden on Desktop lg:) ── */}
      <PortalDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="teacher"
        profile={profile}
        navGroups={drawerNavGroups}
        onOpenSearch={() => setSearchOpen(true)}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />

      {/* ── Desktop Persistent Sidebar (>= 1024px, 72px rail when collapsed, 256px when expanded) ── */}
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 z-40 bg-[#111111] flex-col border-r border-[#1F1F1F] transition-all duration-300 ${
          isRailCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Top Header: Logo + Collapse Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1F1F1F] shrink-0">
          <div className={`${isRailCollapsed ? 'hidden' : 'flex'} items-center gap-2 overflow-hidden`}>
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

        {/* Teacher badge */}
        <div className={`px-4 py-3 border-b border-[#1F1F1F] ${isRailCollapsed ? 'hidden' : 'flex'} justify-center`}>
          <span className="badge badge-gold text-xs px-3.5 py-1 font-bold tracking-wide">🎓 Teacher Portal</span>
        </div>

        {/* Navigation (Independent scrolling) */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-1 custom-scrollbar min-h-0">
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
            const isActive = isPathActive(path);
            const isChat = path === '/teacher/chat';

            return (
              <button
                key={path}
                type="button"
                onClick={() => handleNav(path)}
                title={label}
                aria-label={label}
                className={`w-full flex items-center rounded-xl font-semibold transition-all relative group cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F2C230] ${
                  isRailCollapsed
                    ? 'min-h-[44px] justify-center p-2.5 text-xs'
                    : 'min-h-[44px] justify-between px-3 py-2.5 text-xs'
                } ${
                  isActive
                    ? 'bg-[rgba(242,194,48,0.14)] text-white font-bold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-[#F2C230] before:rounded-r'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/70'
                }`}
              >
                <div className={`flex items-center gap-3 min-w-0 ${isRailCollapsed ? 'justify-center' : ''}`}>
                  <Icon
                    size={19}
                    className={`shrink-0 transition-colors ${
                      isActive ? 'text-[#F4C430]' : 'text-neutral-400 group-hover:text-white'
                    }`}
                  />
                  <span className={`truncate ${isRailCollapsed ? 'hidden' : 'inline'}`}>{label}</span>
                </div>

                {isChat && unreadCount > 0 && (
                  <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#F4C430] text-[#111111] leading-none shadow-xs animate-pulse ${
                    isRailCollapsed ? 'hidden' : 'inline-block'
                  }`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Main Container (Desktop adapts smoothly: 72px rail vs 256px expanded; Tablet & Mobile ml-0) ── */}
      <div
        className={`flex-1 flex flex-col min-h-screen max-w-full overflow-x-hidden transition-all duration-300 ml-0 ${
          isRailCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
        }`}
      >
        {/* Site Announcement Banner */}
        <AnnouncementBanner />

        {/* ── Shared Unified Portal Header ── */}
        <PortalHeader
          role="teacher"
          sidebarOpen={isExpandedOrOpen}
          onToggleSidebar={toggleSidebar}
          onOpenSearch={() => setSearchOpen(true)}
          profile={profile}
          onSignOut={handleSignOut}
          isSigningOut={isSigningOut}
        />

        {/* Page body */}
        <main className="flex-1 p-4 sm:p-6 space-y-3 sm:space-y-6 max-w-7xl mx-auto w-full overflow-x-hidden page-transition pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {children}
        </main>
      </div>

      {/* ── Global Search Modal ── */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        role="teacher"
        onSignOut={handleSignOut}
      />
    </div>
  );
};

export default TeacherShell;
