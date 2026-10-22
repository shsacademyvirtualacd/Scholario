import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, BookMarked, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { useMobile } from '../../hooks/useMobile';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import {
  NotificationRow,
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead
} from '../../lib/db';

export const NotificationBell: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [bellPulsing, setBellPulsing] = useState(false);

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
          console.log('[NotificationBell] Realtime payload received:', payload);
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
    if (notifOpen) {
      fetchNotifications();
    }
  }, [notifOpen]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const toggleRead = async (id: string) => {
    const target = notifications.find(n => n.id === id);
    if (!target || target.is_read) return;

    // Optimistic Update: Set is_read to true immediately
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );

    try {
      await markNotificationRead(id);
    } catch (err) {
      console.error('[NotificationBell] Failed to mark read:', err);
      toast.error('Failed to update notification status.');
      // Rollback: Revert is_read back to false
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: false } : n))
      );
    }
  };

  const handleNotificationClick = (notif: NotificationRow) => {
    if (!notif.is_read) {
      toggleRead(notif.id);
    }
    setNotifOpen(false);

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

    // Optimistic Update: Mark all as read immediately
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

    try {
      await markAllNotificationsRead(profile.id);
    } catch (err) {
      console.error('[NotificationBell] Failed to mark all read:', {
        userId: profile.id,
        timestamp: new Date().toISOString(),
        err
      });
      toast.error('Failed to mark all notifications as read.');
      // Rollback to previous state
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

  return (
    <div className="relative">
      <button
        onClick={() => {
          setNotifOpen(!notifOpen);
          setBellPulsing(false);
        }}
        className={`relative w-11 h-11 min-h-[44px] min-w-[44px] rounded-full border flex items-center justify-center transition-all cursor-pointer ${
          notifOpen
            ? 'bg-[rgba(242,194,48,0.18)] border-amber-400/40 text-[#8A6A00] dark:text-[#F4C430]'
            : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
        } ${bellPulsing ? 'animate-pulse ring-2 ring-[#F4C430] border-transparent bg-amber-50/50 dark:bg-amber-950/30' : ''}`}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={18} className={bellPulsing ? 'text-[#F4C430]' : ''} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#ef4444] border-2 border-white dark:border-neutral-900 rounded-full notif-pulse" />
        )}
      </button>

      {notifOpen && (
        <>
          {/* Mobile Glass Bottom Sheet (< 640px) */}
          <div className="sm:hidden">
            <div 
              className="fixed inset-0 bg-black/35 backdrop-blur-xs z-50 animate-in fade-in duration-200"
              onClick={() => setNotifOpen(false)} 
            />
            <div className="fixed inset-x-0 bottom-0 z-50 bg-white/95 dark:bg-[#141416]/95 backdrop-blur-md rounded-t-[28px] border-t border-[var(--admin-card-border)] dark:border-neutral-800 shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-250 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {/* Drag handle */}
              <div 
                className="w-10 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mt-3 mb-2 shrink-0 cursor-grab" 
                onClick={() => setNotifOpen(false)} 
              />
              <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
                <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 overflow-y-auto flex-1 overscroll-contain">
                {notifications.length === 0 ? (
                  <div className="h-[120px] flex flex-col items-center justify-center text-center p-4">
                    <Bell size={22} className="text-neutral-400 dark:text-neutral-500 mb-1.5 opacity-60" />
                    <span className="text-[15px] font-medium text-neutral-500 dark:text-neutral-400">
                      {loading ? 'Loading notifications...' : 'You are all caught up!'}
                    </span>
                  </div>
                ) : (
                  notifications.map(notif => {
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
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
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
                            <AlertCircle size={14} />
                          ) : notif.type === 'class_reminder' ? (
                            <Calendar size={14} />
                          ) : (notif.type as string) === 'privacy' ? (
                            <Shield size={14} />
                          ) : (
                            <BookMarked size={14} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {isCrucial && (
                              <span className="text-[8px] font-black uppercase tracking-wider bg-[#E11D48] text-white px-1.5 py-0.5 rounded">
                                Crucial
                              </span>
                            )}
                            <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-snug truncate">
                              {notif.title}
                            </p>
                          </div>
                          <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed mt-0.5 font-medium">
                            {notif.message}
                          </p>
                          <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-bold block mt-1">
                            {formatTimestamp(notif.created_at)}
                          </span>
                        </div>
                        {!notif.is_read && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                              isCrucial ? 'bg-[#E11D48]' : 'bg-[#F4C430]'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen(false);
                    const role = profile?.role || 'student';
                    navigate(`/${role}/notifications`);
                  }}
                  className="w-full h-12 flex items-center justify-center font-bold text-xs rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 transition-colors cursor-pointer"
                >
                  View all notifications →
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Popover (>= 640px) */}
          <div className="hidden sm:block">
            {/* Click-out backdrop */}
            <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
            {/* Popover panel */}
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="p-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-900/80">
                <span className="text-[10px] font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-400 dark:text-neutral-500 font-semibold">
                    {loading ? 'Loading notifications...' : 'You are all caught up!'}
                  </div>
                ) : (
                  notifications.map(notif => {
                    const isCrucial = notif.severity === 'crucial';
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                          notif.is_read
                            ? 'bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                            : isCrucial
                            ? 'bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-100/60 dark:hover:bg-rose-950/50'
                            : 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-100/40 dark:hover:bg-amber-950/40'
                        } ${isCrucial ? 'border-l-4 border-l-[#E11D48]' : ''}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
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
                            <AlertCircle size={14} />
                          ) : notif.type === 'class_reminder' ? (
                            <Calendar size={14} />
                          ) : (notif.type as string) === 'privacy' ? (
                            <Shield size={14} />
                          ) : (
                            <BookMarked size={14} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {isCrucial && (
                              <span className="text-[8px] font-black uppercase tracking-wider bg-[#E11D48] text-white px-1.5 py-0.5 rounded">
                                Crucial
                              </span>
                            )}
                            <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-snug truncate">
                              {notif.title}
                            </p>
                          </div>
                          <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed mt-0.5 font-medium">
                            {notif.message}
                          </p>
                          <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-bold block mt-1">
                            {formatTimestamp(notif.created_at)}
                          </span>
                        </div>
                        {!notif.is_read && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                              isCrucial ? 'bg-[#E11D48]' : 'bg-[#F4C430]'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-2.5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen(false);
                    const role = profile?.role || 'student';
                    navigate(`/${role}/notifications`);
                  }}
                  className="text-[11px] font-bold text-neutral-900 dark:text-neutral-200 hover:text-amber-600 dark:hover:text-[#F4C430] transition-colors cursor-pointer"
                >
                  View all notifications →
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
