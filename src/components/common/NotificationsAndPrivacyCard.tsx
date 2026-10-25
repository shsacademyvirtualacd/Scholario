import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Send,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  isPushSupported,
  isPushSubscribed,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  getDeviceInfo,
  doesSubscriptionMatchVapidKey,
  cleanupOutdatedSubscription,
  VAPID_PUBLIC_KEY,
} from '../../lib/pushSubscriptionService';
import {
  submitVisibilityRequest,
  turnOnVisibility,
  cancelVisibilityRequest,
  getUserVisibilityStatus,
} from '../../lib/visibilityRequestsService';
import type { VisibilityRequest } from '../../types';

interface NotificationsAndPrivacyCardProps {
  className?: string;
}

export const NotificationsAndPrivacyCard: React.FC<NotificationsAndPrivacyCardProps> = ({
  className = '',
}) => {
  const { profile, refreshProfile } = useAuth();

  // ── Push Notification State ──
  const [pushSupported, setPushSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(true);
  const [pushActionLoading, setPushActionLoading] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  // ── Online Presence State ──
  const [visibilityUpdating, setVisibilityUpdating] = useState(false);
  const [cancellingRequest, setCancellingRequest] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<VisibilityRequest | null>(null);
  const [showPrivacyLearnMore, setShowPrivacyLearnMore] = useState(false);

  const isOnlineVisible = profile?.show_online_status ?? true;
  const isAdmin = profile?.role === 'admin';

  // Check push capability & subscription
  const checkPushStatus = async () => {
    if (!isPushSupported()) {
      setPushSupported(false);
      setPushLoading(false);
      return;
    }
    setPushSupported(true);
    setPermission(Notification.permission);
    await cleanupOutdatedSubscription();
    const sub = await isPushSubscribed();
    setIsSubscribed(sub);
    setPushLoading(false);
  };

  useEffect(() => {
    checkPushStatus();
  }, []);

  // Online status visibility request listener
  useEffect(() => {
    if (!profile?.id) return;
    let isMounted = true;
    getUserVisibilityStatus(profile.id)
      .then((res) => {
        if (isMounted) setPendingRequest(res.pendingRequest);
      })
      .catch((err) => {
        console.warn('[NotificationsAndPrivacyCard] Visibility query error:', err);
      });

    let channel: any = null;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel(`user-visibility-pref-${profile.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'visibility_requests',
            filter: `user_id=eq.${profile.id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newReq = payload.new as VisibilityRequest;
              if (newReq.status === 'pending') setPendingRequest(newReq);
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as VisibilityRequest;
              if (updated.status === 'pending') {
                setPendingRequest(updated);
              } else {
                setPendingRequest(null);
                refreshProfile();
              }
            } else if (payload.eventType === 'DELETE') {
              setPendingRequest(null);
            }
          }
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [profile?.id, refreshProfile]);

  // Push toggle
  const handleTogglePush = async () => {
    if (!profile?.id) return;
    setPushActionLoading(true);
    try {
      if (isSubscribed) {
        const success = await unsubscribeUserFromPush();
        if (success) {
          setIsSubscribed(false);
          toast.success('Push notifications turned off on this device.');
        } else {
          toast.error('Failed to unsubscribe. Check browser permissions.');
        }
      } else {
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm === 'granted') {
          const sub = await subscribeUserToPush(profile);
          if (sub) {
            setIsSubscribed(true);
            toast.success('Push notifications enabled!', {
              description: 'You will receive alerts for live classes, reminders, and broadcasts.',
            });
          } else {
            toast.error('Could not register push subscription with the server.');
          }
        } else if (perm === 'denied') {
          toast.error('Notifications blocked by browser.', {
            description: 'Click the lock icon in your address bar to allow notifications for this site.',
          });
        }
      }
    } catch (err: any) {
      console.error('[NotificationsAndPrivacyCard] Push toggle error:', err);
      toast.error('An error occurred while updating push notification settings.');
    } finally {
      setPushActionLoading(false);
      checkPushStatus();
    }
  };

  // Test push notification
  const handleSendTestPush = async () => {
    if (!profile?.id) return;
    setTestingPush(true);
    try {
      if (!isPushSupported()) {
        toast.error('Web Push is not supported in this browser.');
        return;
      }
      if (Notification.permission !== 'granted') {
        toast.error('Permission not granted', {
          description: 'Enable notifications first.',
        });
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub || !doesSubscriptionMatchVapidKey(sub, VAPID_PUBLIC_KEY)) {
        sub = await subscribeUserToPush(profile);
        if (sub) setIsSubscribed(true);
      }

      const payload = {
        user_ids: [profile.id],
        title: 'Scholario Test Notification',
        body: `Hello ${profile.full_name || 'there'}! Web push is working perfectly on ${getDeviceInfo()}.`,
        url: window.location.pathname,
        type: 'test_notification',
        is_test: true,
      };

      const { data, error } = await supabase.functions.invoke('send-push', { body: payload });
      if (error) {
        toast.error('Push Service Notice', {
          description: error.message || 'Notification service test completed.',
        });
      } else if (data?.success) {
        toast.success('Test notification sent!', {
          description: `Dispatched to ${data.delivered || 1} device(s). Check your notification shade!`,
        });
      } else {
        toast.info('Test push processed.');
      }
    } catch (err: any) {
      toast.error('Push test dispatch error', { description: err?.message });
    } finally {
      setTestingPush(false);
    }
  };

  // Online status visibility toggle
  const handleToggleVisibility = async () => {
    if (!profile?.id || visibilityUpdating) return;

    if (isOnlineVisible) {
      if (pendingRequest) {
        toast.info('Request already sent — pending admin approval.');
        return;
      }
      setVisibilityUpdating(true);
      try {
        if (isAdmin) {
          await submitVisibilityRequest(profile.id);
          await refreshProfile();
          toast.success('Online status and last seen are now hidden (mutual privacy enabled).');
        } else {
          const res = await submitVisibilityRequest(profile.id);
          if (res.request) setPendingRequest(res.request);
          toast.info('Request sent — pending admin approval', {
            description: 'Your status stays visible until an administrator approves your request.',
          });
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to submit visibility request.');
      } finally {
        setVisibilityUpdating(false);
      }
      return;
    }

    setVisibilityUpdating(true);
    try {
      await turnOnVisibility(profile.id);
      await refreshProfile();
      setPendingRequest(null);
      toast.success('Online status and last seen are now visible to your contacts.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to re-enable online status.');
    } finally {
      setVisibilityUpdating(false);
    }
  };

  const handleCancelVisibilityRequest = async () => {
    if (!profile?.id || cancellingRequest) return;
    setCancellingRequest(true);
    try {
      await cancelVisibilityRequest(profile.id);
      setPendingRequest(null);
      toast.success('Visibility change request has been cancelled.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel request.');
    } finally {
      setCancellingRequest(false);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6 ${className}`}
    >
      <div>
        <h3 className="text-sm font-black text-neutral-900 dark:text-white tracking-tight">
          Notifications & Privacy
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Manage how Scholario notifies you and controls your active chat status.
        </p>
      </div>

      {/* ── Section 1: Web Push Notifications ── */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
              {isSubscribed ? <Bell size={18} /> : <BellOff size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Web Push Notifications
                </h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    permission === 'denied'
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                      : isSubscribed
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {permission === 'denied'
                    ? 'Blocked'
                    : isSubscribed
                    ? 'Active & Listening'
                    : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Receive instant alerts for live classes, reminders, and official notices even when
                Scholario is closed.
              </p>
            </div>
          </div>

          {/* Clean 48x28 Switch (Gold when on, dark knob, no stray checkmark) */}
          <button
            type="button"
            role="switch"
            aria-checked={isSubscribed}
            disabled={pushLoading || pushActionLoading || permission === 'denied'}
            onClick={handleTogglePush}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed ${
              isSubscribed ? 'bg-[#F2C230]' : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
            title={isSubscribed ? 'Turn off push notifications' : 'Enable push notifications'}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                isSubscribed
                  ? 'translate-x-5 bg-[#111111]'
                  : 'translate-x-0 bg-white dark:bg-neutral-200'
              }`}
            >
              {pushActionLoading && (
                <Loader2
                  size={11}
                  className={`animate-spin ${isSubscribed ? 'text-[#F2C230]' : 'text-neutral-500'}`}
                />
              )}
            </span>
          </button>
        </div>

        {/* Device Info & Test Notification Action */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Smartphone size={13} className="text-neutral-400" />
            <span>
              Device: <strong className="text-neutral-700 dark:text-neutral-300">{getDeviceInfo()}</strong>
            </span>
          </div>

          {isSubscribed && (
            <button
              type="button"
              disabled={testingPush}
              onClick={handleSendTestPush}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send size={11} />
              <span>{testingPush ? 'Dispatching...' : 'Send Test Notification'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-neutral-100 dark:border-neutral-800/80" />

      {/* ── Section 2: Online Status & Last Seen ── */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
              {isOnlineVisible ? <Eye size={18} /> : <EyeOff size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Show Online Status & Last Seen
                </h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    pendingRequest
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                      : isOnlineVisible
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {pendingRequest
                    ? 'Pending Admin Approval'
                    : isOnlineVisible
                    ? 'Visible'
                    : 'Hidden'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Allow teachers, classmates, and administrators to see when you are active in Scholario
                Chat.
              </p>

              {/* Expandable Mutual Privacy note */}
              <div className="mt-1.5">
                <button
                  type="button"
                  onClick={() => setShowPrivacyLearnMore(!showPrivacyLearnMore)}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{showPrivacyLearnMore ? 'Show less' : 'Learn more about mutual privacy'}</span>
                  {showPrivacyLearnMore ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {showPrivacyLearnMore && (
                  <div className="mt-2 p-2.5 bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-xl text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed animate-in fade-in duration-150">
                    Turning this off enables mutual privacy. You won&apos;t share your active status or
                    last seen time with others, and you will not see other users&apos; online or last
                    seen status in return.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Clean 48x28 Switch (Gold when on, dark knob, NO checkmark icon) */}
          <button
            type="button"
            role="switch"
            aria-checked={isOnlineVisible}
            disabled={visibilityUpdating}
            onClick={handleToggleVisibility}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed ${
              isOnlineVisible ? 'bg-[#F2C230]' : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
            title={
              pendingRequest
                ? 'Request sent — pending admin approval'
                : isOnlineVisible
                ? 'Turn off online status (requires admin approval)'
                : 'Turn on online status (instant)'
            }
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                isOnlineVisible
                  ? 'translate-x-5 bg-[#111111]'
                  : 'translate-x-0 bg-white dark:bg-neutral-200'
              }`}
            >
              {visibilityUpdating ? (
                <Loader2
                  size={11}
                  className={`animate-spin ${isOnlineVisible ? 'text-[#F2C230]' : 'text-neutral-500'}`}
                />
              ) : pendingRequest ? (
                <Clock size={11} className="text-amber-500" />
              ) : null}
            </span>
          </button>
        </div>

        {/* Pending Request Banner */}
        {pendingRequest && (
          <div className="mt-3 flex items-start justify-between gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-start gap-2 min-w-0">
              <Clock size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Request pending admin review</span>
                <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-tight block mt-0.5">
                  Requested on {new Date(pendingRequest.requested_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}.
                  Status remains visible until approved.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancelVisibilityRequest}
              disabled={cancellingRequest}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-700 hover:bg-amber-50 text-amber-900 dark:text-amber-200 shrink-0 transition-colors cursor-pointer"
            >
              {cancellingRequest ? 'Cancelling...' : 'Cancel'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsAndPrivacyCard;
