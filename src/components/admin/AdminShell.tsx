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
  Menu,
  X,
  DollarSign,
  UserCheck,
  Coins,
  Sparkles,
  ClipboardCheck,
  ShieldAlert,
  Database,
  Megaphone,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../features/auth/AuthContext';
import { useUnreadChatCount } from '../../hooks/useUnreadChatCount';
import { supabase } from '../../lib/supabase';
import ProfileDropdownMenu from '../common/ProfileDropdownMenu';
import ThemeToggleSwitch from '../common/ThemeToggleSwitch';
import { NotificationBell } from '../common/NotificationBell';
import { AnnouncementBanner } from '../common/AnnouncementBanner';

interface AdminShellProps {
  children: React.ReactNode;
}

interface NavItem {
  icon: any;
  label: string;
  path: string;
  disabled?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
      { icon: MessageSquare, label: 'Chat', path: '/admin/chat' },
      { icon: ShieldAlert, label: 'Visibility Requests', path: '/admin/visibility-requests' },
    ],
  },
  {
    title: 'People & Scheduling',
    items: [
      { icon: ClipboardCheck, label: 'Attendance', path: '/admin/attendance' },
      { icon: UserCheck, label: 'Roster Manager', path: '/admin/roster' },
      { icon: Calendar, label: 'Schedule', path: '/admin/schedule' },
      { icon: GraduationCap, label: 'Teachers', path: '/admin/teachers' },
      { icon: Users, label: 'Students', path: '/admin/students' },
    ],
  },
  {
    title: 'Academics',
    items: [
      { icon: BookMarked, label: 'Notes', path: '/admin/notes' },
      { icon: FileCheck2, label: 'Testing Center', path: '/admin/tests' },
      { icon: Database, label: 'Question Bank', path: '/admin/question-bank' },
    ],
  },
  {
    title: 'Communication',
    items: [
      { icon: Megaphone, label: 'Announcements', path: '/admin/announcements' },
    ],
  },
  {
    title: 'Finance & Tools',
    items: [
      { icon: Sparkles, label: 'Sage', path: '/admin/sage' },
      { icon: DollarSign, label: 'Prices', path: '/admin/prices' },
      { icon: Coins, label: 'Fees', path: '/admin/fees' },
    ],
  },
];

export const AdminShell: React.FC<AdminShellProps> = ({ children }) => {
  const { profile, signOut } = useAuth();
  const { unreadCount } = useUnreadChatCount();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRailCollapsed, setIsRailCollapsed] = useState(() => {
    try {
      return localStorage.getItem('scholario_admin_rail_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('scholario_admin_collapsed_groups');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [title]: !prev[title] };
      try {
        localStorage.setItem('scholario_admin_collapsed_groups', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleRailCollapse = () => {
    setIsRailCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('scholario_admin_rail_collapsed', String(next));
      } catch {}
      return next;
    });
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
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0E0E10] flex" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Mobile drawer backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (Collapsible to icon rail on laptops, slide-in drawer on mobile) ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#111111] border-r border-neutral-800 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isRailCollapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        {/* Top Header: Logo + Collapse Toggle */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-neutral-800/80 shrink-0">
          {!isRailCollapsed ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <Logo size="sm" variant="full" darkMode />
            </div>
          ) : (
            <div className="mx-auto">
              <Logo size="sm" variant="icon" darkMode />
            </div>
          )}

          {/* Desktop Rail Collapse Toggle */}
          <button
            type="button"
            onClick={toggleRailCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title={isRailCollapsed ? 'Expand sidebar' : 'Collapse to icon rail'}
            aria-label={isRailCollapsed ? 'Expand sidebar' : 'Collapse to icon rail'}
          >
            {isRailCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Small Admin Panel Badge */}
        {!isRailCollapsed && (
          <div className="px-4 py-2.5 border-b border-neutral-800/60 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">
              Admin Panel
            </span>
            <span className="text-[10px] text-neutral-400">v2.4</span>
          </div>
        )}

        {/* ── Independent Scrolling Navigation (Sage, Prices, Fees always reachable) ── */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-4 min-h-0 custom-scrollbar">
          {NAV_GROUPS.map((group, groupIdx) => {
            const hasActiveChild = group.items.some((item) => !item.disabled && isPathActive(item.path));
            const isCollapsed = !hasActiveChild && Boolean(collapsedGroups[group.title]);

            return (
              <div key={groupIdx} className="space-y-1">
                {/* Group Heading (only in expanded mode) */}
                {!isRailCollapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between px-3 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                  >
                    <span>{group.title}</span>
                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}

                {/* Group Nav Items */}
                {!isCollapsed && (
                  <div className="space-y-0.5">
                {group.items.map(({ icon: Icon, label, path, disabled }) => {
                  const isActive = !disabled && isPathActive(path);
                  const isChat = path === '/admin/chat';
                  const isVisibility = path === '/admin/visibility-requests';

                  return (
                    <button
                      key={path}
                      onClick={() => !disabled && handleNav(path)}
                      disabled={disabled}
                      title={label}
                      className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all relative group ${
                        isRailCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
                      } ${
                        isActive
                          ? 'bg-neutral-800 text-white font-bold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-amber-400 before:rounded-r'
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* 20px icon in consistent line style */}
                        <Icon
                          size={20}
                          className={`shrink-0 transition-colors ${
                            isActive ? 'text-amber-400' : 'text-neutral-400 group-hover:text-white'
                          }`}
                        />
                        {!isRailCollapsed && (
                          <span className="truncate tracking-tight">{label}</span>
                        )}
                      </div>

                      {/* Right Badges: unread counts or "Soon" tag */}
                      {!isRailCollapsed && (
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {isChat && unreadCount > 0 && !disabled && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-400 text-neutral-900 leading-none">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}

                          {isVisibility && pendingVisibilityCount > 0 && !disabled && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white leading-none">
                              {pendingVisibilityCount > 99 ? '99+' : pendingVisibilityCount}
                            </span>
                          )}

                          {disabled && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                              Soon
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
        </nav>
      </aside>

      {/* ── Main Layout Container ── */}
      <div
        className={`flex-1 flex flex-col min-h-screen max-w-full overflow-x-hidden transition-all duration-300 ${
          isRailCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        {/* Site Announcement Banner */}
        <AnnouncementBanner />

        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-[#141416] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 sm:px-6 shrink-0 max-w-full">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger for mobile */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation menu"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <NotificationBell />
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

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto overflow-x-hidden bg-neutral-50/50 dark:bg-[#0E0E10] max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
