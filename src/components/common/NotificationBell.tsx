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

    const role = profile?.role || 'student';
    if (notif.title === 'Schedule Update' || notif.title === 'Class Cancellation' || notif.type === 'announcement') {
      navigate(`/${role}/announcements`);
    } else if (notif.type === 'class_reminder') {
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
        className={`relative w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
          notifOpen
            ? 'bg-[#111111] dark:bg-zinc-800 border-[#111111] dark:border-zinc-700 text-[#F4C430]'
            : 'border-[#E5E5E5] dark:border-zinc-800 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 text-[#525252] dark:text-zinc-300 hover:text-[#111111] dark:hover:text-white'
        } ${bellPulsing ? 'animate-pulse ring-2 ring-[#F4C430] border-transparent bg-amber-50/50 dark:bg-amber-950/30' : ''}`}
        title="Notifications"
      >
        <Bell size={16} className={bellPulsing ? 'text-[#F4C430]' : ''} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ef4444] border-2 border-white dark:border-zinc-900 rounded-full notif-pulse" />
        )}
      </button>

      {notifOpen && (
        <>
          {/* Click-out backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
          {/* Popover panel */}
          <div className={`${isMobile ? 'fixed left-2 right-2 top-16 w-auto' : 'absolute right-0 mt-2 w-80'} bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 rounded-2xl shadow-xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200`}>
            <div className="p-3.5 border-b border-[#F5F5F5] dark:border-zinc-800 flex items-center justify-between bg-[#FAFAFA] dark:bg-zinc-900/80">
              <span className="text-[10px] font-black text-[#111111] dark:text-zinc-100 uppercase tracking-wider">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-[#737373] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white transition-colors interactive"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="divide-y divide-[#F5F5F5] dark:divide-zinc-800 max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#A3A3A3] dark:text-zinc-500 font-semibold">
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
                          ? 'bg-white dark:bg-zinc-900 hover:bg-[#FAFAFA] dark:hover:bg-zinc-800/60'
                          : isCrucial
                          ? 'bg-[#FFF1F2] dark:bg-rose-950/30 hover:bg-[#FFE4E6] dark:hover:bg-rose-950/50'
                          : 'bg-[#FFFDF0] dark:bg-amber-950/20 hover:bg-[#FFFBEA] dark:hover:bg-amber-950/40'
                      } ${isCrucial ? 'border-l-4 border-l-[#E11D48]' : ''}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isCrucial
                            ? 'bg-[#FFE4E6] dark:bg-rose-950/50 text-[#E11D48] dark:text-rose-400 border border-[#FECDD3] dark:border-rose-900/40'
                            : notif.type === 'class_reminder'
                            ? 'bg-[#FFFBEB] dark:bg-amber-950/50 text-[#92400E] dark:text-amber-400 border border-[#FDE68A] dark:border-amber-900/40'
                            : (notif.type as string) === 'privacy'
                            ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/40'
                            : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40'
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
                          <p className="text-xs font-bold text-[#111111] dark:text-zinc-100 leading-snug truncate">
                            {notif.title}
                          </p>
                        </div>
                        <p className="text-[11px] text-[#525252] dark:text-zinc-300 leading-relaxed mt-0.5 font-medium">
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-[#A3A3A3] dark:text-zinc-500 font-bold block mt-1">
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
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
