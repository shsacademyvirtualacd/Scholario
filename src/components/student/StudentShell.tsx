import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BookMarked,
  LogOut,
  Bell,
  Menu,
  CreditCard,
  Sparkles,
  Loader2,
  ClipboardCheck
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../features/auth/AuthContext';
import { NotificationBell } from '../common/NotificationBell';

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
  { icon: ClipboardCheck,  label: 'Attendance', path: '/student/attendance' },
  { icon: BookMarked,      label: 'Notes',      path: '/student/notes' },
  { icon: Calendar,        label: 'Schedule',   path: '/student/schedule' },
  { icon: Bell,            label: 'Announcements', path: '/student/announcements' },
  { icon: Sparkles,        label: 'Sage',       path: '/student/sage' },
  { icon: CreditCard,      label: 'Fee Checkout', path: '/student/checkout' },
];

export const StudentShell: React.FC<StudentShellProps> = ({ children }) => {
  const { profile, signOut, feeStatus } = useAuth();
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
            return (
              <button
                key={path}
                onClick={() => !disabled && !isBlocked && handleNav(path)}
                disabled={disabled || isBlocked}
                title={isBlocked ? "Unlocks after payment verification" : undefined}
                className={`sidebar-link w-full ${isActive ? 'active' : ''} ${
                  disabled || isBlocked ? 'opacity-40 cursor-not-allowed' : 'interactive'
                }`}
              >
                <Icon size={17} className={`sidebar-icon shrink-0 ${isActive ? '' : 'text-[#525252]'}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Profile + logout */}
        <div className="p-3 border-t border-[#1F1F1F] space-y-2">
          {/* Sidebar Profile Card (Non-interactive) */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1A1A1A] text-white border border-[#2A2A2A]">
            <div className="w-8 h-8 rounded-lg bg-[#F4C430] text-[#111111] flex items-center justify-center font-bold text-xs shrink-0">
              {(profile?.full_name?.[0] ?? 'S').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate leading-tight text-white">
                {profile?.full_name ?? 'Student'}
              </p>
              <p className="text-[10px] leading-tight mt-0.5 truncate text-[#737373]">
                {profile?.class?.display_name || 'SHS Student'}
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="sidebar-link w-full text-[#737373] hover:text-red-400 disabled:opacity-50 inline-flex items-center gap-1.5 interactive"
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
            <NotificationBell />
            <button
              onClick={() => feeStatus === 'paid' && navigate('/student/profile')}
              disabled={feeStatus !== 'paid'}
              title={feeStatus !== 'paid' ? "Unlocks after payment verification" : undefined}
              className={`w-9 h-9 rounded-lg bg-[#111111] flex items-center justify-center text-sm font-bold text-white ${
                feeStatus !== 'paid' ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 transition-transform interactive'
              }`}
            >
              {(profile?.full_name?.[0] ?? 'S').toUpperCase()}
            </button>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto overflow-x-hidden bg-[#FAFAFA] max-w-full page-transition">
          {/* Development Banner */}
          <div className="bg-[#FFF9E6] border border-[#FFE0B2] text-[#B78103] px-4 py-3 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-medium">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B78103] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B78103]"></span>
            </span>
            <span>Scholario is under development. In case of any issues, contact +92 322 2314436 on WhatsApp.</span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};

export default StudentShell;
