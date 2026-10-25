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
  Smartphone,
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../features/auth/AuthContext';
import { useUnreadChatCount } from '../../hooks/useUnreadChatCount';
import { useSidebarNav } from '../../hooks/useSidebarNav';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { AnnouncementBanner } from '../common/AnnouncementBanner';
import { APP_VERSION } from '../../utils/version';
import PortalHeader from '../common/PortalHeader';
import PortalDrawer from '../common/PortalDrawer';
import GlobalSearchModal from '../common/GlobalSearchModal';

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
  {
    title: 'App',
    items: [
      { icon: Smartphone, label: 'Android App', path: '/admin/android-app' },
    ],
  },
];

export const AdminShell: React.FC<AdminShellProps> = ({ children }) => {
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
  } = useSidebarNav('admin');

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

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [pendingVisibilityCount, setPendingVisibilityCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  const drawerNavGroups = React.useMemo(() => {
    return NAV_GROUPS.map((group) => ({
      title: group.title,
      items: group.items.map((item) => ({
        icon: item.icon,
        label: item.label,
        path: item.path,
        disabled: item.disabled,
        badge:
          item.path === '/admin/chat' && unreadCount > 0
            ? unreadCount > 99
              ? '99+'
              : unreadCount
            : item.path === '/admin/visibility-requests' && pendingVisibilityCount > 0
            ? pendingVisibilityCount > 99
              ? '99+'
              : pendingVisibilityCount
            : undefined,
        badgeColor:
          item.path === '/admin/visibility-requests'
            ? ('amber' as const)
            : ('gold' as const),
      })),
    }));
  }, [unreadCount, pendingVisibilityCount]);

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

    let channel: any = null;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('admin-shell-visibility-requests')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'visibility_requests' }, () => {
          fetchPending();
        })
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
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
    setDrawerOpen(false);
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
      {/* ── Overlay Navigation Drawer (Phone & Tablet, hidden on Desktop lg:) ── */}
      <PortalDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="admin"
        profile={profile}
        navGroups={drawerNavGroups}
        onOpenSearch={() => setSearchOpen(true)}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />

      {/* ── Desktop Persistent Sidebar (>=1024px, 72px rail when collapsed, 256px when expanded) ── */}
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 z-40 bg-white dark:bg-[#111111] border-r border-[var(--admin-card-border)] dark:border-neutral-800 flex-col transition-all duration-300 ${
          isRailCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Top Header: Logo + Collapse Toggle */}
        <div className="h-14 sm:h-16 flex items-center justify-between px-3.5 border-b border-[var(--admin-card-border)] dark:border-neutral-800/80 shrink-0">
          <div className={`${isRailCollapsed ? 'hidden' : 'flex'} items-center gap-2 overflow-hidden`}>
            <Logo size="sm" variant="full" />
          </div>
          <div className={`${isRailCollapsed ? 'flex' : 'hidden'} mx-auto`}>
            <Logo size="sm" variant="icon" />
          </div>

          {/* Desktop Rail Collapse Toggle */}
          <button
            type="button"
            onClick={toggleSidebar}
            className={`p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F2C230] ${
              isRailCollapsed ? 'hidden' : 'flex'
            }`}
            title={isRailCollapsed ? 'Expand sidebar' : 'Collapse to icon rail'}
            aria-label={isRailCollapsed ? 'Expand sidebar' : 'Collapse to icon rail'}
          >
            {isRailCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Small Admin Panel Badge */}
        <div className={`px-4 py-2.5 border-b border-[var(--admin-card-border)] dark:border-neutral-800/60 ${isRailCollapsed ? 'hidden' : 'flex'} items-center justify-between`}>
          <span className="text-xs font-semibold text-[#8A6A00] dark:text-[#F2C230] bg-[rgba(242,194,48,0.16)] px-2.5 py-0.5 rounded-md">
            Admin Panel
          </span>
          <span className="text-xs text-[var(--admin-muted)] dark:text-neutral-400 font-medium">{APP_VERSION}</span>
        </div>

        {/* Scrolling Navigation (Independent scroll) */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-4 min-h-0 hide-scrollbar">
          {NAV_GROUPS.map((group, groupIdx) => {
            const hasActiveChild = group.items.some((item) => !item.disabled && isPathActive(item.path));
            const isCollapsed = !hasActiveChild && Boolean(collapsedGroups[group.title]);

            return (
              <div key={groupIdx} className="space-y-1">
                {/* Group Heading (only in expanded desktop mode) */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className={`w-full ${isRailCollapsed ? 'hidden' : 'flex'} items-center justify-between px-3 pt-1.5 pb-1 text-xs font-bold uppercase tracking-wider text-[var(--admin-muted)] dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer`}
                >
                  <span>{group.title}</span>
                  <div className={`transition-transform duration-200 ${isCollapsed ? '' : 'rotate-0'}`}>
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

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
                          aria-label={label}
                          className={`w-full flex items-center rounded-xl font-semibold transition-all relative group cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F2C230] ${
                            isRailCollapsed
                              ? 'min-h-[44px] justify-center p-2.5 text-xs'
                              : 'min-h-[44px] justify-between px-3 py-2.5 text-xs'
                          } ${
                            isActive
                              ? 'bg-[rgba(242,194,48,0.14)] text-neutral-900 dark:text-white font-bold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-[#F2C230] before:rounded-r'
                              : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/70'
                          }`}
                        >
                          <div className={`flex items-center gap-3 min-w-0 ${isRailCollapsed ? 'justify-center' : ''}`}>
                            <Icon
                              size={20}
                              className={`shrink-0 transition-colors ${
                                isActive ? 'text-[#8A6A00] dark:text-[#F2C230]' : 'text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white'
                              }`}
                            />
                            <span className={`truncate tracking-tight ${isRailCollapsed ? 'hidden' : 'inline'}`}>{label}</span>
                          </div>

                          {/* Right Badges */}
                          <div className={`items-center gap-1.5 shrink-0 ml-2 ${isRailCollapsed ? 'hidden' : 'flex'}`}>
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
      </aside>

      {/* ── Main Layout Container (Desktop adapts smoothly: 72px rail vs 256px expanded; Tablet & Mobile ml-0) ── */}
      <div
        className={`flex-1 flex flex-col min-h-screen max-w-full overflow-x-hidden transition-all duration-300 ml-0 ${
          isRailCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
        }`}
      >
        {/* Site Announcement Banner */}
        <AnnouncementBanner />

        {/* ── Shared Unified Portal Header ── */}
        <PortalHeader
          role="admin"
          sidebarOpen={isExpandedOrOpen}
          onToggleSidebar={toggleSidebar}
          onOpenSearch={() => setSearchOpen(true)}
          profile={profile}
          onSignOut={handleSignOut}
          isSigningOut={isSigningOut}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-6 overflow-y-auto overflow-x-hidden admin-page max-w-full">
          {children}
        </main>
      </div>

      {/* ── Global Search Modal ── */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        role="admin"
        onSignOut={handleSignOut}
      />
    </div>
  );
};

export default AdminShell;
