import React, { useState } from 'react';
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
  Target
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../features/auth/AuthContext';
import { useUnreadChatCount } from '../../hooks/useUnreadChatCount';
import { NotificationBell } from '../common/NotificationBell';
import ProfileDropdownMenu from '../common/ProfileDropdownMenu';
import ThemeToggleSwitch from '../common/ThemeToggleSwitch';

interface StudentShellProps {
  children: React.ReactNode;
}

interface NavItem {
  icon: any;
  label: string;
  path: string;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/student' },
  { icon: MessageSquare,   label: 'Chat',      path: '/student/chat' },
  { icon: ClipboardCheck,  label: 'Attendance', path: '/student/attendance' },
  { icon: BookMarked,      label: 'Notes',      path: '/student/notes' },
  { icon: FileCheck2,      label: 'Testing Center', path: '/student/tests' },
  { icon: Target,          label: 'Self Testing', path: '/student/self-testing' },
  { icon: Calendar,        label: 'Schedule',   path: '/student/schedule' },
  { icon: Bell,            label: 'Announcements', path: '/student/announcements' },
  { icon: Sparkles,        label: 'Sage',       path: '/student/sage' },
  { icon: CreditCard,      label: 'Fee Checkout', path: '/student/checkout' },
];

export const StudentShell: React.FC<StudentShellProps> = ({ children }) => {
  const { profile, signOut, feeStatus } = useAuth();
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

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* ── Sidebar overlay (mobile) ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#111111] flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[#1F1F1F] shrink-0">
          <Logo size="sm" variant="full" darkMode />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label, path, disabled }) => {
            const isBlocked = feeStatus !== 'paid' && path !== '/student/checkout';
            const isActive = !disabled && !isBlocked && (activeNav === path || (path !== '/student' && activeNav.startsWith(path)));
            const isChat = path === '/student/chat';
            return (
              <button
                key={path}
                onClick={() => !disabled && !isBlocked && handleNav(path)}
                disabled={disabled || isBlocked}
                title={isBlocked ? "Unlocks after payment verification" : undefined}
                className={`sidebar-link w-full justify-between ${isActive ? 'active' : ''} ${
                  disabled || isBlocked ? 'opacity-40 cursor-not-allowed' : 'interactive'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon size={17} className={`sidebar-icon shrink-0 ${isActive ? '' : 'text-[#525252]'}`} />
                  <span className="truncate">{label}</span>
                </div>
                {isChat && unreadCount > 0 && !disabled && !isBlocked && (
                  <span className="shrink-0 px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#F4C430] text-[#111111] leading-none shadow-sm animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen max-w-full overflow-x-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-50 h-16 bg-white border-b border-[#E5E5E5] flex items-center justify-between px-4 sm:px-6 shrink-0 max-w-full">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors text-[#111111] shrink-0 interactive"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={20} />
            </button>
            <div className="flex-1" />
          </div>
          
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

        {/* Content area */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto overflow-x-hidden bg-[#FAFAFA] max-w-full page-transition">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StudentShell;
