import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  ClipboardCheck,
  Calendar,
  BookMarked,
  FileCheck2,
  Bell,
  Sparkles
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../features/auth/AuthContext';
import { useUnreadChatCount } from '../../hooks/useUnreadChatCount';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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
    setSidebarOpen(false);
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
      {/* ── Mobile Navigation Drawer ── */}
      <PortalDrawer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role="teacher"
        profile={profile}
        navGroups={drawerNavGroups}
        onOpenSearch={() => setSearchOpen(true)}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />

      {/* ── Desktop Persistent Sidebar (>= 1024px) ── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 bg-[#111111] flex-col border-r border-[#1F1F1F]">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[#1F1F1F] shrink-0">
          <Logo size="sm" variant="full" darkMode />
        </div>

        {/* Teacher badge */}
        <div className="px-4 py-3 border-b border-[#1F1F1F] flex justify-center">
          <span className="badge badge-gold text-xs px-3.5 py-1 font-bold tracking-wide">🎓 Teacher Portal</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 custom-scrollbar min-h-0">
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
            const isActive = isPathActive(path);
            const isChat = path === '/teacher/chat';
            return (
              <button
                key={path}
                onClick={() => handleNav(path)}
                className={`sidebar-link w-full justify-between ${isActive ? 'active' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon size={17} className={`sidebar-icon shrink-0 ${isActive ? '' : 'text-[#525252]'}`} />
                  <span className="truncate">{label}</span>
                </div>
                {isChat && unreadCount > 0 && (
                  <span className="shrink-0 px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#F4C430] text-[#111111] leading-none shadow-sm animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Main Container ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen max-w-full overflow-x-hidden">
        {/* Site Announcement Banner */}
        <AnnouncementBanner />

        {/* ── Shared Unified Portal Header ── */}
        <PortalHeader
          role="teacher"
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
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
