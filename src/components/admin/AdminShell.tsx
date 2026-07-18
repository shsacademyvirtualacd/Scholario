import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  Users,
  BookMarked,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  DollarSign,
  UserCheck,
  Coins
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../features/auth/AuthContext';
import { NotificationBell } from '../common/NotificationBell';

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
  { icon: UserCheck,       label: 'Roster Manager', path: '/admin/roster' },
  { icon: Calendar,        label: 'Schedule',   path: '/admin/schedule' },
  { icon: GraduationCap,   label: 'Teachers',   path: '/admin/teachers' },
  { icon: Users,           label: 'Students',   path: '/admin/students' },
  { icon: BookMarked,      label: 'Notes',      path: '/admin/notes' },
  { icon: Bell,            label: 'Announcements', path: '/admin/announcements' },
  { icon: DollarSign,      label: 'Prices',     path: '/admin/prices' },
  { icon: Coins,           label: 'Fees',       path: '/admin/fees' },
];

export const AdminShell: React.FC<AdminShellProps> = ({ children }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

        {/* Admin badge */}
        <div className="px-4 py-3 border-b border-[#1F1F1F] flex justify-center">
          <span className="badge badge-gold text-xs px-3.5 py-1 font-bold tracking-wide">⚙ Admin Panel</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label, path, disabled }) => {
            const isActive = !disabled && isPathActive(path);
            return (
              <button
                key={path}
                onClick={() => !disabled && handleNav(path)}
                disabled={disabled}
                className={`sidebar-link w-full ${isActive ? 'active' : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <Icon size={17} className={`sidebar-icon shrink-0 ${isActive ? '' : 'text-[#525252]'}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Profile + Sign Out */}
        <div className="p-3 border-t border-[#1F1F1F] space-y-0.5">
          <div
            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-white text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#F4C430] text-[#111111] flex items-center justify-center font-bold text-xs shrink-0">
              {(profile?.full_name?.[0] ?? 'A').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate leading-tight text-white">
                {profile?.full_name ?? 'Administrator'}
              </p>
              <p className="text-[10px] leading-tight mt-0.5 truncate text-[#737373]">
                Admin Staff
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="sidebar-link w-full text-[#737373] hover:text-red-400 mt-2 interactive"
          >
            <LogOut size={17} className="shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main container */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen max-w-full overflow-x-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-50 h-16 bg-white border-b border-[#E5E5E5] flex items-center justify-between px-4 sm:px-6 shrink-0 max-w-full">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors text-[#111111] shrink-0 interactive"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

          </div>

          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell />
            <button
              onClick={() => navigate('/admin/profile')}
              className="w-9 h-9 rounded-lg bg-[#111111] flex items-center justify-center text-sm font-bold text-[#F4C430] hover:scale-105 transition-transform"
            >
              {(profile?.full_name?.[0] ?? 'A').toUpperCase()}
            </button>
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

export default AdminShell;
