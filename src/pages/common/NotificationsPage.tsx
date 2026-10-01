import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Video,
  Shield,
  Trash2,
  ExternalLink,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  NotificationRow,
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead
} from '../../lib/db';
import StudentShell from '../../components/student/StudentShell';
import TeacherShell from '../../components/teacher/TeacherShell';
import AdminShell from '../../components/admin/AdminShell';
import { NotificationPermissionBanner } from '../../components/student/NotificationPermissionBanner';
import { toast } from 'sonner';

export const NotificationsPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const role = profile?.role || 'student';

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'classes' | 'announcements'>('all');

  const fetchNotifications = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const data = await getNotificationsForUser(profile.id);
      setNotifications(data);
    } catch (err) {
      console.error('[NotificationsPage] Failed to load notifications:', err);
      toast.error('Could not load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (!profile?.id) return;

    // Realtime subscription on notifications table for instant updates
    const channel = supabase
      .channel(`realtime-notifications-page-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications((prev) => [payload.new as NotificationRow, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? (payload.new as NotificationRow) : n))
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleToggleRead = async (id: string, currentReadStatus: boolean) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: !currentReadStatus } : n))
    );

    try {
      if (!currentReadStatus) {
        await markNotificationRead(id);
      } else {
        await (supabase as any)
          .from('notifications')
          .update({ is_read: false })
          .eq('id', id);
      }
    } catch (err) {
      console.error('[NotificationsPage] Failed to toggle read status:', err);
      // Revert optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: currentReadStatus } : n))
      );
      toast.error('Failed to update status');
    }
  };

  const handleMarkAllRead = async () => {
    if (!profile?.id) return;
    const previous = [...notifications];
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      await markAllNotificationsRead(profile.id);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('[NotificationsPage] Mark all read error:', err);
      setNotifications(previous);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const previous = [...notifications];
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      toast.success('Notification removed');
    } catch (err) {
      console.error('[NotificationsPage] Delete error:', err);
      setNotifications(previous);
      toast.error('Failed to delete notification');
    }
  };

  const handleOpenTarget = (notif: NotificationRow) => {
    if (!notif.is_read) {
      handleToggleRead(notif.id, false);
    }

    if (notif.url) {
      if (notif.url.startsWith('http://') || notif.url.startsWith('https://')) {
        window.open(notif.url, '_blank');
      } else {
        navigate(notif.url);
      }
      return;
    }

    // Default fallback routes by type & role
    if (notif.type === 'class_started') {
      navigate(role === 'student' ? '/student/schedule' : '/admin/schedule');
    } else if (notif.type === 'teacher_reminder') {
      navigate('/teacher/schedule');
    } else if (notif.type === 'admin_live_alert') {
      navigate('/admin/schedule');
    } else if (notif.type === 'announcement') {
      navigate(`/${role}/announcements`);
    } else {
      navigate(`/${role}/schedule`);
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.is_read;
    if (filter === 'classes') {
      return (
        notif.type === 'class_started' ||
        notif.type === 'teacher_reminder' ||
        notif.type === 'admin_live_alert' ||
        notif.type === 'class_reminder'
      );
    }
    if (filter === 'announcements') {
      return notif.type === 'announcement';
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const content = (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner for Web Push Permission */}
      <NotificationPermissionBanner role={role} />

      {/* Header Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
              <Bell size={24} className="text-[#111111] dark:text-[#F4C430]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-black text-[#111111] dark:text-zinc-100 tracking-tight">
                  Notifications & Alerts
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-xs md:text-sm text-[#737373] dark:text-zinc-400 mt-1 font-medium">
                Live class alerts, schedule updates, and system broadcasts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={fetchNotifications}
              title="Refresh"
              className="p-2.5 rounded-xl border border-[#E5E5E5] dark:border-zinc-800 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 text-[#525252] dark:text-zinc-300 transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#111111] dark:bg-zinc-800 hover:bg-[#262626] dark:hover:bg-zinc-700 text-white transition-all shadow-xs"
              >
                <CheckCircle2 size={14} className="text-[#F4C430]" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-[#F5F5F5] dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-[#111111] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'bg-[#F5F5F5] dark:bg-zinc-800/60 text-[#525252] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'unread'
                ? 'bg-[#111111] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'bg-[#F5F5F5] dark:bg-zinc-800/60 text-[#525252] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('classes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'classes'
                ? 'bg-[#111111] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'bg-[#F5F5F5] dark:bg-zinc-800/60 text-[#525252] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
            }`}
          >
            Live Classes & Reminders
          </button>
          <button
            type="button"
            onClick={() => setFilter('announcements')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'announcements'
                ? 'bg-[#111111] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'bg-[#F5F5F5] dark:bg-zinc-800/60 text-[#525252] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
            }`}
          >
            Announcements
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading && notifications.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 rounded-3xl p-12 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#737373] dark:text-zinc-400">Loading notifications…</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 rounded-3xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-200 dark:border-amber-900/40">
              <Bell size={24} />
            </div>
            <h3 className="text-base font-bold text-[#111111] dark:text-zinc-100">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications found'}
            </h3>
            <p className="text-xs text-[#737373] dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              {filter === 'unread'
                ? 'You are all caught up! New alerts for live classes and schedules will appear here.'
                : 'When classes start or announcements are broadcast, alerts will show up here.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isCrucial = notif.severity === 'crucial';
            const isClass =
              notif.type === 'class_started' ||
              notif.type === 'teacher_reminder' ||
              notif.type === 'admin_live_alert';

            return (
              <div
                key={notif.id}
                onClick={() => handleOpenTarget(notif)}
                className={`group cursor-pointer rounded-2xl border transition-all p-4.5 sm:p-5 flex items-start gap-4 ${
                  notif.is_read
                    ? 'bg-white dark:bg-zinc-900 border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700'
                    : isCrucial
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/50 shadow-xs'
                    : isClass
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/50 shadow-xs'
                    : 'bg-zinc-50/70 dark:bg-zinc-800/40 border-zinc-300 dark:border-zinc-700 shadow-xs'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    notif.type === 'class_started'
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/50'
                      : notif.type === 'teacher_reminder'
                      ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/50'
                      : notif.type === 'admin_live_alert'
                      ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800/50'
                      : isCrucial
                      ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800/50'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {notif.type === 'class_started' ? (
                    <Video size={18} />
                  ) : notif.type === 'teacher_reminder' ? (
                    <Clock size={18} />
                  ) : notif.type === 'admin_live_alert' ? (
                    <Shield size={18} />
                  ) : isCrucial ? (
                    <AlertCircle size={18} />
                  ) : (
                    <Calendar size={18} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shrink-0" />
                    )}
                    <h3 className="text-sm font-bold text-[#111111] dark:text-zinc-100">
                      {notif.title}
                    </h3>
                    {notif.type === 'class_started' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        Live Now
                      </span>
                    )}
                    {notif.type === 'teacher_reminder' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        10-Min Reminder
                      </span>
                    )}
                    {notif.type === 'admin_live_alert' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                        Class Monitoring
                      </span>
                    )}
                    <span className="text-[11px] text-[#A3A3A3] dark:text-zinc-500 font-semibold ml-auto">
                      {formatTimestamp(notif.created_at)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#525252] dark:text-zinc-300 mt-1 leading-relaxed font-medium">
                    {notif.body || notif.message}
                  </p>

                  {/* Actions row */}
                  <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-black/5 dark:border-white/5">
                    {notif.url && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 group-hover:underline">
                        <span>Open details</span>
                        <ExternalLink size={12} />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleRead(notif.id, notif.is_read);
                      }}
                      className="text-xs font-semibold text-[#737373] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-zinc-200 transition-colors ml-auto"
                    >
                      {notif.is_read ? 'Mark as unread' : 'Mark as read'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(notif.id, e)}
                      title="Delete"
                      className="p-1 rounded-lg text-[#A3A3A3] hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  if (role === 'admin') {
    return <AdminShell>{content}</AdminShell>;
  }
  if (role === 'teacher') {
    return <TeacherShell>{content}</TeacherShell>;
  }
  return <StudentShell>{content}</StudentShell>;
};

export default NotificationsPage;
