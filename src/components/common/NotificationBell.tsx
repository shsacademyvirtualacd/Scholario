import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, BookMarked, AlertCircle } from 'lucide-react';
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
      console.error('[NotificationBell] Failed to mark all read:', err);
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
            ? 'bg-[#111111] border-[#111111] text-[#F4C430]'
            : 'border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#525252] hover:text-[#111111]'
        } ${bellPulsing ? 'animate-pulse ring-2 ring-[#F4C430] border-transparent bg-amber-50/50' : ''}`}
        title="Notifications"
      >
        <Bell size={16} className={bellPulsing ? 'text-[#F4C430]' : ''} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ef4444] border-2 border-white rounded-full notif-pulse" />
        )}
      </button>

      {notifOpen && (
        <>
          {/* Click-out backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
          {/* Popover panel */}
          <div className={`${isMobile ? 'fixed left-2 right-2 top-16 w-auto' : 'absolute right-0 mt-2 w-80'} bg-white border border-[#E5E5E5] rounded-2xl shadow-xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200`}>
            <div className="p-3.5 border-b border-[#F5F5F5] flex items-center justify-between bg-[#FAFAFA]">
              <span className="text-[10px] font-black text-[#111111] uppercase tracking-wider">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-[#737373] hover:text-[#111111] transition-colors interactive"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="divide-y divide-[#F5F5F5] max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#A3A3A3] font-semibold">
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
                          ? 'bg-white hover:bg-[#FAFAFA]'
                          : isCrucial
                          ? 'bg-[#FFF1F2] hover:bg-[#FFE4E6]'
                          : 'bg-[#FFFDF0] hover:bg-[#FFFBEA]'
                      } ${isCrucial ? 'border-l-4 border-l-[#E11D48]' : ''}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isCrucial
                            ? 'bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3]'
                            : notif.type === 'class_reminder'
                            ? 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]'
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}
                      >
                        {isCrucial ? (
                          <AlertCircle size={14} />
                        ) : notif.type === 'class_reminder' ? (
                          <Calendar size={14} />
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
                          <p className="text-xs font-bold text-[#111111] leading-snug truncate">
                            {notif.title}
                          </p>
                        </div>
                        <p className="text-[11px] text-[#525252] leading-relaxed mt-0.5 font-medium">
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-[#A3A3A3] font-bold block mt-1">
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
