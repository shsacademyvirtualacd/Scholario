import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  ClipboardCheck,
  Calendar,
  BookMarked,
  FileCheck2,
  Bell,
  LogOut,
  Menu,
  X,
  Sparkles,
  Loader2
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../features/auth/AuthContext';
import { useUnreadChatCount } from '../../hooks/useUnreadChatCount';
import { NotificationBell } from '../common/NotificationBell';
import ProfileAvatar from '../common/ProfileAvatar';

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
  const [isSigningOut, setIsSigningOut] = useState(false);

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
    <div className="min-h-screen bg-[#FAFAFA] flex" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#111111] flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[#1F1F1F] shrink-0">
          <Logo size="sm" variant="full" darkMode />
        </div>

        {/* Teacher badge */}
        <div className="px-4 py-3 border-b border-[#1F1F1F] flex justify-center">
          <span className="badge badge-gold text-xs px-3.5 py-1 font-bold tracking-wide">🎓 Teacher Portal</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
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

        {/* Profile + Sign Out */}
        <div className="p-3 border-t border-[#1F1F1F] space-y-0.5">
          <div
            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-white text-left shrink-0"
          >
            <ProfileAvatar
              avatarUrl={profile?.avatar_url}
              name={profile?.full_name ?? 'Teacher'}
              role="teacher"
              size="sm"
              className="shrink-0 ring-1 ring-white/10"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate leading-tight text-white">
                {profile?.full_name ?? 'Teacher'}
              </p>
              <p className="text-[10px] leading-tight mt-0.5 truncate text-[#737373]">
                SHS Faculty
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="sidebar-link w-full text-[#737373] hover:text-red-400 mt-2 disabled:opacity-50 inline-flex items-center gap-1.5 interactive"
          >
            {isSigningOut ? (
              <Loader2 size={17} className="animate-spin shrink-0" />
            ) : (
              <LogOut size={17} className="shrink-0" />
            )}
            <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Main container */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen max-w-full overflow-x-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-50 h-16 bg-white border-b border-[#E5E5E5] flex items-center justify-between px-4 sm:px-6 shrink-0 max-w-full">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors text-[#111111] interactive"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => handleNav('/teacher/profile')}
              title={profile?.full_name || 'Profile'}
              className="rounded-lg overflow-hidden hover:scale-105 transition-transform interactive"
            >
              <ProfileAvatar
                avatarUrl={profile?.avatar_url}
                name={profile?.full_name ?? 'Teacher'}
                role="teacher"
                size="md"
              />
            </button>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full overflow-x-hidden page-transition">
          {children}
        </main>
      </div>



    </div>
  );
};

export default TeacherShell;
