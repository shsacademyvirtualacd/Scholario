import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BookMarked,
  Bell,
  LogOut,
  Menu,
  Search,
  X,
  User
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../features/auth/AuthContext';
import { NotificationBell } from '../common/NotificationBell';

interface TeacherShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',  path: '/teacher' },
  { icon: BookMarked,      label: 'Notes Manager', path: '/teacher/notes' },
  { icon: Calendar,        label: 'Schedule',   path: '/teacher/schedule' },
  { icon: Bell,            label: 'Announcements', path: '/teacher/announcements' },
];

export const TeacherShell: React.FC<TeacherShellProps> = ({ children }) => {
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
            return (
              <button
                key={path}
                onClick={() => handleNav(path)}
                className={`sidebar-link w-full ${isActive ? 'active' : ''}`}
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
            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-white text-left shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-[#F4C430] text-[#111111] flex items-center justify-center font-bold text-xs shrink-0">
              {(profile?.full_name?.[0] ?? 'T').toUpperCase()}
            </div>
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
              className="w-9 h-9 rounded-lg bg-[#111111] flex items-center justify-center text-sm font-bold text-[#F4C430] hover:scale-105 transition-transform"
            >
              {(profile?.full_name?.[0] ?? 'T').toUpperCase()}
            </button>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full overflow-x-hidden page-transition">
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

export default TeacherShell;
