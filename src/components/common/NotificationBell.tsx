import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Calendar, BookMarked, AlertCircle, Shield, X, CheckCheck } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import {
  NotificationRow,
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead
} from '../../lib/db';

export interface NotificationBellProps {
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
  role?: 'admin' | 'teacher' | 'student';
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  onClose: controlledOnClose,
}) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Internal state fallback for uncontrolled usage
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;

  const handleToggle = useCallback(() => {
    if (controlledOnToggle) {
      controlledOnToggle();
    } else {
      setInternalOpen((prev) => !prev);
    }
  }, [controlledOnToggle]);

  const handleClose = useCallback(() => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  }, [controlledOnClose]);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [bellPulsing, setBellPulsing] = useState(false);

  // Position for desktop/tablet dropdown card
  const [dropdownPos, setDropdownPos] = useState({
    top: 64,
    left: 12,
    width: 380,
    maxHeight: 500,
  });

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const isDesktopOrTablet = window.innerWidth >= 768;

    if (isDesktopOrTablet) {
      const cardWidth = 380;
      const top = rect.bottom + 8;
      // Clamp position between 12px from left and 12px from right
      const idealLeft = rect.right - cardWidth;
      const maxLeft = window.innerWidth - cardWidth - 12;
      const clampedLeft = Math.max(12, Math.min(idealLeft, maxLeft));
      const maxHeight = Math.max(220, window.innerHeight - top - 24);

      setDropdownPos({
        top,
        left: clampedLeft,
        width: cardWidth,
        maxHeight,
      });
    }
  }, []);

  // Update position on open and on window resize
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }
  }, [isOpen, updatePosition]);

  // Lock body scroll on phones (<768px) when sheet is open
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Close on route change
  useEffect(() => {
    if (isOpen) {
      handleClose();
    }
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        buttonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Close on phone Back button (popstate)
  useEffect(() => {
    if (!isOpen) return;
    const handlePopState = () => {
      handleClose();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, handleClose]);

  const fetchNotifications = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const data = await getNotificationsForUser(profile.id);
      setNotifications(data);
    } catch (err) {
      console.error('[NotificationBell] Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (!profile?.id) return;

    const channel = supabase
      .channel(`realtime-notifications-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${profile.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as NotificationRow, ...prev]);
            if ((payload.new as any).type === 'announcement') {
              setBellPulsing(true);
            }
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(n => (n.id === payload.new.id ? (payload.new as NotificationRow) : n))
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  useEffect(() => {
    if (bellPulsing) {
      const timer = setTimeout(() => setBellPulsing(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [bellPulsing]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const toggleRead = async (id: string) => {
    const target = notifications.find(n => n.id === id);
    if (!target || target.is_read) return;

    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );

    try {
      await markNotificationRead(id);
    } catch (err) {
      console.error('[NotificationBell] Failed to mark read:', err);
      toast.error('Failed to update notification status.');
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: false } : n))
      );
    }
  };

  const handleNotificationClick = (notif: NotificationRow) => {
    if (!notif.is_read) {
      toggleRead(notif.id);
    }
    handleClose();

    if (notif.url) {
      if (notif.url.startsWith('http://') || notif.url.startsWith('https://')) {
        window.open(notif.url, '_blank');
      } else {
        navigate(notif.url);
      }
      return;
    }

    const role = profile?.role || 'student';
    if (notif.type === 'class_started') {
      navigate(role === 'student' ? '/student/schedule' : '/admin/schedule');
    } else if (notif.type === 'teacher_reminder') {
      navigate('/teacher/schedule');
    } else if (notif.type === 'admin_live_alert') {
      navigate('/admin/schedule');
    } else if (notif.title === 'Schedule Update' || notif.title === 'Class Cancellation' || notif.type === 'announcement') {
      navigate(`/${role}/announcements`);
    } else {
      navigate(`/${role}/schedule`);
    }
  };

  const markAllAsRead = async () => {
    if (!profile?.id) return;
    const backupNotifications = [...notifications];

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

    try {
      await markAllNotificationsRead(profile.id);
    } catch (err) {
      console.error('[NotificationBell] Failed to mark all read:', err);
      toast.error('Failed to mark all notifications as read.');
      setNotifications(backupNotifications);
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const isDesktopOrTablet = typeof window !== 'undefined' && window.innerWidth >= 768;

  const renderContentList = () => {
    if (notifications.length === 0) {
      return (
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
            <Bell size={20} className="opacity-60" />
          </div>
          <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {loading ? 'Loading notifications...' : "You're all caught up."}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            No new notifications right now.
          </p>
        </div>
      );
    }

    return notifications.map((notif) => {
      const isCrucial = notif.severity === 'crucial';
      return (
        <div
          key={notif.id}
          onClick={() => handleNotificationClick(notif)}
          className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
            notif.is_read
              ? 'bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
              : isCrucial
              ? 'bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-100/50 dark:hover:bg-rose-950/30'
              : 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-100/40 dark:hover:bg-amber-950/30'
          } ${isCrucial ? 'border-l-4 border-l-[#E11D48]' : ''}`}
        >
          {/* Unread indicator dot */}
          <div className="pt-1.5 shrink-0">
            {!notif.is_read ? (
              <span
                className={`block w-2 h-2 rounded-full ${
                  isCrucial ? 'bg-[#E11D48] animate-pulse' : 'bg-[#F4C430]'
                }`}
                title="Unread"
              />
            ) : (
              <span className="block w-2 h-2" />
            )}
          </div>

          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isCrucial
                ? 'bg-rose-100 dark:bg-rose-950/50 text-[#E11D48] dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                : notif.type === 'class_reminder'
                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
                : (notif.type as string) === 'privacy'
                ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/40'
                : 'bg-[rgba(242,194,48,0.16)] text-[#8A6A00] dark:text-[#F2C230] border border-amber-300/30'
            }`}
          >
            {isCrucial ? (
              <AlertCircle size={15} />
            ) : notif.type === 'class_reminder' ? (
              <Calendar size={15} />
            ) : (notif.type as string) === 'privacy' ? (
              <Shield size={15} />
            ) : (
              <BookMarked size={15} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {isCrucial && (
                <span className="text-[8px] font-black uppercase tracking-wider bg-[#E11D48] text-white px-1.5 py-0.5 rounded leading-none">
                  Crucial
                </span>
              )}
              <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-snug truncate">
                {notif.title}
              </p>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed mt-0.5 font-medium line-clamp-2">
              {notif.message}
            </p>
            <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-bold block mt-1">
              {formatTimestamp(notif.created_at)}
            </span>
          </div>
        </div>
      );
    });
  };

  return (
    <>
      {/* ── Bell Trigger Button (44x44px target) ── */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          handleToggle();
          setBellPulsing(false);
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        title="Notifications"
        className={`relative w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F2C230] ${
          isOpen
            ? 'bg-[rgba(242,194,48,0.18)] border-amber-400/40 text-[#8A6A00] dark:text-[#F4C430]'
            : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
        } ${bellPulsing ? 'animate-pulse ring-2 ring-[#F4C430] border-transparent bg-amber-50/50 dark:bg-amber-950/30' : ''}`}
      >
        <Bell size={18} className={bellPulsing ? 'text-[#F4C430]' : ''} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#ef4444] border-2 border-white dark:border-neutral-900 rounded-full" />
        )}
      </button>

      {/* ── Portaled Dropdown / Bottom Sheet ── */}
      {isOpen &&
        createPortal(
          <>
            {/* Light Dim Backdrop */}
            <div
              className="fixed inset-0 z-[9998] bg-black/35 backdrop-blur-xs transition-opacity duration-150"
              onClick={handleClose}
              aria-hidden="true"
            />

            {/* Panel Rendering: Bottom sheet on phone (<768px), Dropdown card on Desktop/Tablet (>=768px) */}
            {isDesktopOrTablet ? (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Notifications"
                style={{
                  position: 'fixed',
                  top: `${dropdownPos.top}px`,
                  left: `${dropdownPos.left}px`,
                  width: `${dropdownPos.width}px`,
                  maxHeight: `${dropdownPos.maxHeight}px`,
                }}
                className="z-[9999] bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-180"
              >
                {/* Pinned Card Header */}
                <div className="p-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/90 dark:bg-neutral-900/90 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F4C430] text-[#111111]">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <CheckCheck size={14} />
                      <span>Mark all as read</span>
                    </button>
                  )}
                </div>

                {/* Scrollable Notification List */}
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 overflow-y-auto flex-1 overscroll-contain">
                  {renderContentList()}
                </div>

                {/* Pinned Card Footer */}
                <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 shrink-0 bg-neutral-50/90 dark:bg-neutral-900/90 backdrop-blur-sm text-center">
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      const userRole = profile?.role || 'student';
                      navigate(`/${userRole}/notifications`);
                    }}
                    className="w-full h-9 flex items-center justify-center font-bold text-xs rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 transition-colors cursor-pointer"
                  >
                    View all notifications →
                  </button>
                </div>
              </div>
            ) : (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Notifications"
                className="fixed inset-x-0 bottom-0 z-[9999] bg-white dark:bg-[#141416] rounded-t-[28px] border-t border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[80vh] animate-in slide-in-from-bottom duration-250 pb-[calc(1rem+env(safe-area-inset-bottom))]"
              >
                {/* Drag handle */}
                <div
                  className="w-10 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mt-3 mb-1 shrink-0 cursor-grab"
                  onClick={handleClose}
                />

                {/* Mobile Sheet Header */}
                <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#F4C430] text-[#111111]">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                      aria-label="Close notifications"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Scrollable Notification List */}
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 overflow-y-auto flex-1 overscroll-contain">
                  {renderContentList()}
                </div>

                {/* Pinned Mobile Footer */}
                <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      const userRole = profile?.role || 'student';
                      navigate(`/${userRole}/notifications`);
                    }}
                    className="w-full h-11 flex items-center justify-center font-bold text-xs rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 transition-colors cursor-pointer"
                  >
                    View all notifications →
                  </button>
                </div>
              </div>
            )}
          </>,
          document.body
        )}
    </>
  );
};

export default NotificationBell;
