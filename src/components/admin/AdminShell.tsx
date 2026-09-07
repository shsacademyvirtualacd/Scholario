import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  GraduationCap,
  Users,
  BookMarked,
  FileCheck2,
  Bell,
  Menu,
  X,
  DollarSign,
  UserCheck,
  Coins,
  Sparkles,
  ClipboardCheck,
  ShieldAlert,
  Database
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../features/auth/AuthContext';
import { useUnreadChatCount } from '../../hooks/useUnreadChatCount';
import { supabase } from '../../lib/supabase';
import ProfileDropdownMenu from '../common/ProfileDropdownMenu';
import ThemeToggleSwitch from '../common/ThemeToggleSwitch';

interface AdminShellProps {
  children: React.ReactNode;
}

interface NavItem {
  icon: any;
  label: string;
  path: string;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard',  path: '/admin' },
  { icon: MessageSquare,   label: 'Chat',       path: '/admin/chat' },
  { icon: ShieldAlert,     label: 'Visibility Requests', path: '/admin/visibility-requests' },
  { icon: ClipboardCheck,  label: 'Attendance', path: '/admin/attendance' },
  { icon: UserCheck,       label: 'Roster Manager', path: '/admin/roster' },
  { icon: Calendar,        label: 'Schedule',   path: '/admin/schedule' },
  { icon: GraduationCap,   label: 'Teachers',   path: '/admin/teachers' },
  { icon: Users,           label: 'Students',   path: '/admin/students' },
  { icon: BookMarked,      label: 'Notes',      path: '/admin/notes' },
  { icon: FileCheck2,      label: 'Testing Center', path: '/admin/tests' },
  { icon: Database,        label: 'Question Bank', path: '/admin/question-bank' },
  { icon: Bell,            label: 'Announcements', path: '/admin/announcements' },
  { icon: Sparkles,        label: 'Sage',       path: '/admin/sage' },
  { icon: DollarSign,      label: 'Prices',     path: '/admin/prices' },
  { icon: Coins,           label: 'Fees',       path: '/admin/fees' },
];

export const AdminShell: React.FC<AdminShellProps> = ({ children }) => {
  const { profile, signOut } = useAuth();
  const { unreadCount } = useUnreadChatCount();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [pendingVisibilityCount, setPendingVisibilityCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchPending = async () => {
      try {
        const res = await fetch('/api/admin/visibility-requests');
        if (res.ok) {
          const data: any = await res.json();
          if (isMounted) setPendingVisibilityCount(data?.pendingCount || 0);
        }
      } catch (err) {
        console.warn('[AdminShell] Failed to fetch pending visibility requests:', err);
      }
    };
    fetchPending();

    const channel = supabase
      .channel('admin-shell-visibility-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visibility_requests' }, () => {
        fetchPending();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

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
    if (path === '/admin') {
      return activeNav === '/admin';
    }
    if (path.startsWith('/admin/attendance')) {
      return activeNav.startsWith('/admin/attendance');
    }
    return activeNav.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0E0E10] flex" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
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

        {/* Admin badge */}
        <div className="px-4 py-3 border-b border-[#1F1F1F] flex justify-center">
          <span className="badge badge-gold text-xs px-3.5 py-1 font-bold tracking-wide">⚙ Admin Panel</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label, path, disabled }) => {
            const isActive = !disabled && isPathActive(path);
            const isChat = path === '/admin/chat';
            const isVisibility = path === '/admin/visibility-requests';
            return (
              <button
                key={path}
                onClick={() => !disabled && handleNav(path)}
                disabled={disabled}
                className={`sidebar-link w-full justify-between ${isActive ? 'active' : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon size={17} className={`sidebar-icon shrink-0 ${isActive ? '' : 'text-[#525252]'}`} />
                  <span className="truncate">{label}</span>
                </div>
                {isChat && unreadCount > 0 && !disabled && (
                  <span className="shrink-0 px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#F4C430] text-[#111111] leading-none shadow-sm animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {isVisibility && pendingVisibilityCount > 0 && !disabled && (
                  <span className="shrink-0 px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500 text-white leading-none shadow-sm animate-pulse">
                    {pendingVisibilityCount > 99 ? '99+' : pendingVisibilityCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main container */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen max-w-full overflow-x-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-50 h-16 bg-white dark:bg-[#141416] border-b border-[#E5E5E5] dark:border-[#27272A] flex items-center justify-between px-4 sm:px-6 shrink-0 max-w-full">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#27272A] transition-colors text-[#111111] dark:text-[#F4F4F5] shrink-0 interactive"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggleSwitch variant="compact" />
            <ProfileDropdownMenu
              profile={profile}
              role="admin"
              onSignOut={handleSignOut}
              isSigningOut={isSigningOut}
              avatarSize="md"
            />
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto overflow-x-hidden bg-[#FAFAFA] dark:bg-[#0E0E10] max-w-full page-transition">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
