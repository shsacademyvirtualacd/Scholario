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
import { APP_VERSION } from '../../utils/version';

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
  };

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

  const getPageTitle = (pathname: string) => {
    if (pathname.startsWith('/admin/schedule')) return 'Schedule Manager';
    if (pathname.startsWith('/admin/attendance')) return 'Attendance';
    if (pathname.startsWith('/admin/roster')) return 'Roster Manager';
    if (pathname.startsWith('/admin/teachers')) return 'Teachers';
    if (pathname.startsWith('/admin/students')) return 'Students';
    if (pathname.startsWith('/admin/notes')) return 'Notes';
    if (pathname.startsWith('/admin/tests')) return 'Testing Center';
    if (pathname.startsWith('/admin/question-bank')) return 'Question Bank';
    if (pathname.startsWith('/admin/announcements')) return 'Announcements';
    if (pathname.startsWith('/admin/chat')) return 'Chat';
    if (pathname.startsWith('/admin/visibility-requests')) return 'Visibility Requests';
    if (pathname.startsWith('/admin/sage')) return 'Sage';
    if (pathname.startsWith('/admin/prices')) return 'Prices';
    if (pathname.startsWith('/admin/fees')) return 'Fees';
    if (pathname.startsWith('/admin/profile')) return 'Admin Profile';
    return 'Admin Portal';
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0E0E10] flex" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Mobile drawer backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/45 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (Icon rail on tablet 640-1023px, slide-in drawer on mobile <640px, full collapsible on desktop) ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-[#111111] border-r border-[var(--admin-card-border)] dark:border-neutral-800 flex flex-col transition-all duration-250 ease-out sm:transition-all sm:duration-300 rounded-r-[28px] sm:rounded-none shadow-2xl sm:shadow-none ${
          sidebarOpen ? 'translate-x-0 visible pointer-events-auto w-[min(86vw,320px)]' : '-translate-x-full invisible sm:visible sm:translate-x-0 pointer-events-none sm:pointer-events-auto sm:w-16'
        } ${isRailCollapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        {/* Top Header: Logo + Collapse Toggle */}
        <div className="h-14 sm:h-16 flex items-center justify-between px-3.5 border-b border-[var(--admin-card-border)] dark:border-neutral-800/80 shrink-0">
          <div className={`${sidebarOpen ? 'flex' : isRailCollapsed ? 'hidden' : 'hidden lg:flex'} items-center gap-2 overflow-hidden`}>
            <Logo size="sm" variant="full" />
          </div>
          <div className={`${sidebarOpen ? 'hidden' : isRailCollapsed ? 'flex' : 'flex lg:hidden'} mx-auto`}>
            <Logo size="sm" variant="icon" />
          </div>

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
            className="sm:hidden w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer"
            aria-label="Close navigation drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Small Admin Panel Badge */}
        <div className={`px-4 py-2.5 border-b border-[var(--admin-card-border)] dark:border-neutral-800/60 ${sidebarOpen ? 'flex' : isRailCollapsed ? 'hidden' : 'hidden lg:flex'} items-center justify-between`}>
          <span className="text-xs font-semibold text-[#8A6A00] dark:text-[#F2C230] bg-[rgba(242,194,48,0.16)] px-2.5 py-0.5 rounded-md">
            Admin Panel
          </span>
          <span className="text-xs text-[var(--admin-muted)] dark:text-neutral-400 font-medium">{APP_VERSION}</span>
        </div>

        {/* ── Independent Scrolling Navigation (Sage, Prices, Fees always reachable) ── */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-4 min-h-0 hide-scrollbar">
          {NAV_GROUPS.map((group, groupIdx) => {
            const hasActiveChild = group.items.some((item) => !item.disabled && isPathActive(item.path));
            const isCollapsed = !hasActiveChild && Boolean(collapsedGroups[group.title]);

            return (
              <div key={groupIdx} className="space-y-1">
                {/* Group Heading (only in expanded mode) */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className={`w-full ${sidebarOpen ? 'flex' : isRailCollapsed ? 'hidden' : 'hidden lg:flex'} items-center justify-between px-3 pt-1.5 pb-1 text-xs font-bold uppercase tracking-wider text-[var(--admin-muted)] dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer`}
                >
                  <span>{group.title}</span>
                  <div className={`transition-transform duration-200 ${isCollapsed ? '' : 'rotate-0'}`}>
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                {/* Group Nav Items */}
                {(!isCollapsed || sidebarOpen) && (
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
                          className={`w-full flex items-center rounded-xl font-semibold transition-all relative group cursor-pointer ${
                            sidebarOpen 
                              ? 'h-[52px] min-h-[52px] justify-between px-3 text-[15px]' 
                              : isRailCollapsed 
                              ? 'min-h-[44px] justify-center p-2.5 text-xs' 
                              : 'min-h-[44px] justify-center sm:p-2.5 lg:h-auto lg:min-h-[44px] lg:justify-between lg:px-3 lg:py-2.5 text-xs'
                          } ${
                            isActive
                              ? 'bg-[rgba(242,194,48,0.14)] text-neutral-900 dark:text-white font-bold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-[#F2C230] before:rounded-r'
                              : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/70'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon
                              size={sidebarOpen ? 22 : 20}
                              className={`shrink-0 transition-colors ${
                                isActive ? 'text-[#8A6A00] dark:text-[#F2C230]' : 'text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white'
                              }`}
                            />
                            <span className={`truncate tracking-tight ${sidebarOpen ? 'inline font-semibold' : isRailCollapsed ? 'hidden' : 'hidden lg:inline'}`}>{label}</span>
                          </div>

                          {/* Right Badges: unread counts or "Soon" tag */}
                          <div className={`items-center gap-1.5 shrink-0 ml-2 ${sidebarOpen ? 'flex' : isRailCollapsed ? 'hidden' : 'hidden lg:flex'}`}>
                            {isChat && unreadCount > 0 && !disabled && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#F2C230] text-neutral-900 leading-none">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </span>
                            )}

                            {isVisibility && pendingVisibilityCount > 0 && !disabled && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white leading-none">
                                {pendingVisibilityCount > 99 ? '99+' : pendingVisibilityCount}
                              </span>
                            )}

                            {disabled && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700">
                                Soon
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Pinned Sign Out inside Drawer on Mobile */}
        <div className="p-3 border-t border-[var(--admin-card-border)] dark:border-neutral-800/80 shrink-0 sm:hidden">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full h-[52px] flex items-center justify-center gap-2 rounded-xl text-[15px] font-bold status-pill-danger transition-colors cursor-pointer"
          >
            <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* ── Main Layout Container ── */}
      <div
        className={`flex-1 flex flex-col min-h-screen max-w-full overflow-x-hidden transition-all duration-300 sm:ml-16 ${
          isRailCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        {/* Site Announcement Banner */}
        <AnnouncementBanner />

        {/* Top Header Bar: 56px sticky glass on mobile, 64px on tablet/desktop */}
        <header className="sticky top-0 z-30 h-14 sm:h-16 backdrop-blur-md bg-white/85 dark:bg-[#111111]/85 border-b border-[var(--admin-card-border)] dark:border-neutral-800/80 flex items-center justify-between px-3 sm:px-6 py-1.5 sm:py-2 pt-[calc(0.375rem+env(safe-area-inset-top))] sm:pt-2 shrink-0 max-w-full overflow-visible">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger for mobile with >= 44px touch target */}
            <button
              type="button"
              className="sm:hidden w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation menu"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {/* Mobile Header Title */}
            <span className="sm:hidden font-bold text-[17px] text-neutral-900 dark:text-neutral-100 truncate">
              {getPageTitle(location.pathname)}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <NotificationBell />
            </div>
            <div className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ThemeToggleSwitch variant="compact" />
            </div>
            <div className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ProfileDropdownMenu
                profile={profile}
                role="admin"
                onSignOut={handleSignOut}
                isSigningOut={isSigningOut}
                avatarSize="md"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-6 overflow-y-auto overflow-x-hidden admin-page max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
