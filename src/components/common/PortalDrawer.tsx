import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  X,
  Search,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import Logo from '../ui/Logo';
import ProfileAvatar from './ProfileAvatar';
import type { Profile } from '../../types';

export interface PortalNavItem {
  icon: any;
  label: string;
  path: string;
  badge?: number | string | null;
  badgeColor?: 'gold' | 'amber' | 'neutral';
  disabled?: boolean;
}

export interface PortalNavGroup {
  title: string;
  items: PortalNavItem[];
}

export interface PortalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'admin' | 'teacher' | 'student';
  profile: Profile | null;
  navGroups: PortalNavGroup[];
  onOpenSearch: () => void;
  onSignOut?: () => Promise<void> | void;
  isSigningOut?: boolean;
  activePath?: string;
  extraFooterAction?: React.ReactNode;
}

export const PortalDrawer: React.FC<PortalDrawerProps> = ({
  isOpen,
  onClose,
  role,
  profile,
  navGroups,
  onOpenSearch,
  activePath,
  extraFooterAction,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = activePath || location.pathname;

  const drawerRef = useRef<HTMLElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Swipe left detection
  const touchStartXRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.touches[0].clientX;
    if (diff > 50) {
      onClose();
      touchStartXRef.current = null;
    }
  };

  // Close on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on phone Back button (popstate)
  useEffect(() => {
    if (!isOpen) return;
    const handlePopState = () => {
      onClose();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, onClose]);

  // Lock body scroll and handle focus trapping when overlay drawer is open
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Focus first focusable element inside drawer
      const focusableElements = drawerRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        focusableElements[0].focus();
      }

      const handleTrapTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !drawerRef.current) return;
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      };

      window.addEventListener('keydown', handleTrapTab);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleTrapTab);
        previousActiveElementRef.current?.focus();
      };
    }
  }, [isOpen]);

  // Collapsible group state (saved per role in localStorage)
  const storageKey = `scholario_${role}_drawer_collapsed_groups`;
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [title]: !prev[title] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleNav = (path: string) => {
    onClose();
    navigate(path);
  };

  const isPathActive = (path: string) => {
    if (path === `/${role}`) {
      return currentPath === `/${role}`;
    }
    return currentPath.startsWith(path);
  };

  const roleBadgeText =
    role === 'admin'
      ? 'Administrator'
      : role === 'teacher'
      ? 'Faculty Teacher'
      : 'Student Portal';

  return (
    <>
      {/* ── Backdrop Overlay (Visible on phones & tablets, hidden on desktop lg:) ── */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-280 lg:hidden ${
          isOpen
            ? 'opacity-100 pointer-events-auto visible'
            : 'opacity-0 pointer-events-none invisible'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Slide-in Navigation Overlay Drawer (Phone: 85vw up to 320px, Tablet: 280px wide, Hidden on desktop lg:) ── */}
      <aside
        ref={drawerRef}
        id="portal-sidebar-nav"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        aria-hidden={!isOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
        className={`fixed inset-y-0 left-0 z-50 w-[min(85vw,320px)] md:w-[280px] bg-white dark:bg-[#111111] border-r border-black/[0.08] dark:border-white/[0.12] rounded-r-[28px] shadow-2xl flex flex-col transition-transform duration-280 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
        }}
      >
        {/* ── Header: Logo + 44px Close button (divider line removed, spacious padding) ── */}
        <div className="min-h-[72px] py-3.5 px-4 flex items-center justify-between shrink-0 pt-[calc(0.875rem+env(safe-area-inset-top,0px))]">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <Logo size="sm" variant="full" />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F2C230] transition-colors cursor-pointer shrink-0"
            aria-label="Close navigation drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── User Profile Card ── */}
        <div className="p-3 border-b border-black/[0.06] dark:border-white/[0.08] bg-neutral-50/70 dark:bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <ProfileAvatar
              avatarUrl={profile?.avatar_url}
              name={profile?.full_name || roleBadgeText}
              role={role}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                {profile?.full_name || 'Scholario User'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-semibold text-[#8A6A00] dark:text-[#F2C230] bg-[rgba(242,194,48,0.16)] px-2 py-0.5 rounded-md leading-none">
                  {roleBadgeText}
                </span>
              </div>
            </div>
          </div>

          {/* 48px In-Drawer Search Trigger Button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
            className="w-full h-12 mt-3 px-3.5 rounded-xl bg-neutral-100 dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.10] flex items-center justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-white/[0.10] active:scale-[0.99] transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F2C230]"
          >
            <div className="flex items-center gap-2.5">
              <Search size={16} className="text-neutral-400" />
              <span>Search anything...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-[10px] font-mono text-neutral-500 shadow-2xs">
              /
            </kbd>
          </button>
        </div>

        {/* ── Navigation Links (Fills freed space, Independent Scrolling, 52px Touch Height, Bottom Safe Area Padding) ── */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-3 custom-scrollbar min-h-0 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
          {navGroups.map((group, groupIdx) => {
            const hasActiveChild = group.items.some(
              (item) => !item.disabled && isPathActive(item.path)
            );
            const isCollapsed = !hasActiveChild && Boolean(collapsedGroups[group.title]);

            return (
              <div key={groupIdx} className="space-y-1">
                {/* Group Heading */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-3 pt-1.5 pb-1 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  <span>{group.title}</span>
                  <div className={`transition-transform duration-200 ${isCollapsed ? '' : 'rotate-0'}`}>
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                {/* Group Nav Items */}
                {!isCollapsed && (
                  <div className="space-y-1">
                    {group.items.map(({ icon: Icon, label, path, badge, badgeColor, disabled }) => {
                      const isActive = !disabled && isPathActive(path);

                      return (
                        <button
                          key={path}
                          type="button"
                          onClick={() => !disabled && handleNav(path)}
                          disabled={disabled}
                          className={`w-full h-[52px] min-h-[52px] flex items-center justify-between px-3.5 rounded-xl font-semibold transition-all relative cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F2C230] ${
                            isActive
                              ? 'bg-[rgba(242,194,48,0.14)] dark:bg-[rgba(242,194,48,0.16)] text-neutral-900 dark:text-white font-bold before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-[3px] before:bg-[#F2C230] before:rounded-r'
                              : disabled
                              ? 'text-neutral-400 dark:text-neutral-600 opacity-50 cursor-not-allowed'
                              : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/70'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <Icon
                              size={22}
                              className={`shrink-0 transition-colors ${
                                isActive
                                  ? 'text-[#8A6A00] dark:text-[#F2C230]'
                                  : 'text-neutral-400'
                              }`}
                            />
                            <span className="text-[15px] truncate tracking-tight text-left">
                              {label}
                            </span>
                          </div>

                          {/* Right Badge */}
                          {badge !== undefined && badge !== null && (
                            <span
                              className={`px-2 py-0.5 text-xs font-bold rounded-full leading-none shrink-0 ${
                                badgeColor === 'amber'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-[#F2C230] text-[#111111]'
                              }`}
                            >
                              {badge}
                            </span>
                          )}

                          {disabled && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700">
                              Soon
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {extraFooterAction && (
            <div className="pt-2 px-1">
              {extraFooterAction}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};

export default PortalDrawer;
