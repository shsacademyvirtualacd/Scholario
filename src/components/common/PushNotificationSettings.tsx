import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle2, AlertTriangle, Send, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  isPushSupported,
  isPushSubscribed,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  getDeviceInfo
} from '../../lib/pushSubscriptionService';

export const PushNotificationSettings: React.FC = () => {
  const { profile } = useAuth();
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  const checkStatus = async () => {
    if (!isPushSupported()) {
      setSupported(false);
      setLoading(false);
      return;
    }
    setSupported(true);
    setPermission(Notification.permission);
    const sub = await isPushSubscribed();
    setIsSubscribed(sub);
    setLoading(false);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleToggle = async () => {
    if (!profile?.id) return;
    setActionLoading(true);

    try {
      if (isSubscribed) {
        const success = await unsubscribeUserFromPush();
        if (success) {
          setIsSubscribed(false);
          toast.success('Push notifications turned off on this device.');
        } else {
          toast.error('Failed to unsubscribe. Please check browser settings.');
        }
      } else {
        const perm = await Notification.requestPermission();
        setPermission(perm);

        if (perm === 'granted') {
          const sub = await subscribeUserToPush(profile);
          if (sub) {
            setIsSubscribed(true);
            toast.success('Push notifications enabled!', {
              description: 'You will receive alerts for live classes, links, and reminders.',
            });
          } else {
            toast.error('Could not register push subscription with the server.');
          }
        } else if (perm === 'denied') {
          toast.error('Notifications blocked by browser.', {
            description: 'Please click the lock icon in your address bar to allow notifications for this site.',
          });
        }
      }
    } catch (err: any) {
      console.error('[PushNotificationSettings] Error toggling:', err);
      toast.error('An error occurred while updating push notification settings.');
    } finally {
      setActionLoading(false);
      checkStatus();
    }
  };

  const handleSendTestPush = async () => {
    if (!profile?.id) return;
    setTestingPush(true);

    try {
      console.log('[PushNotificationSettings] Initiating test push for user:', profile.id);

      // 1. Verify browser-level subscription
      if (!isPushSupported()) {
        toast.error('Web Push is not supported in this browser.');
        setTestingPush(false);
        return;
      }

      if (Notification.permission !== 'granted') {
        toast.error('Permission not granted', {
          description: 'Please click the switch to allow notifications first.',
        });
        setTestingPush(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        console.warn('[PushNotificationSettings] No browser subscription found. Attempting to subscribe now...');
        sub = await subscribeUserToPush(profile);
        if (sub) {
          setIsSubscribed(true);
        } else {
          toast.error('No push subscription found', {
            description: 'Could not obtain push subscription from browser. Please toggle off and on.',
          });
          setTestingPush(false);
          return;
        }
      }

      // 2. Ensure subscription exists in Supabase push_subscriptions table
      const { data: dbRows, error: dbQueryErr } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint')
        .eq('user_id', profile.id);

      if (dbQueryErr) {
        console.warn('[PushNotificationSettings] Could not query push_subscriptions table:', dbQueryErr);
      }

      if (!dbRows || dbRows.length === 0) {
        console.warn('[PushNotificationSettings] No push_subscriptions row found in DB. Upserting now...');
        await subscribeUserToPush(profile);
      }

      // 3. Invoke Supabase Edge Function: send-push
      console.log('[PushNotificationSettings] Invoking send-push Edge Function with payload:', {
        user_ids: [profile.id],
        type: 'test_notification',
      });

      const payload = {
        user_ids: [profile.id],
        title: 'Scholario Test Notification',
        body: `Hello ${profile.full_name || 'there'}! Web push is working perfectly on ${getDeviceInfo()}.`,
        url: window.location.pathname,
        type: 'test_notification',
        is_test: true,
      };

      const { data, error } = await supabase.functions.invoke('send-push', {
        body: payload,
      });

      console.log('[PushNotificationSettings] Full Edge Function Response:', { data, error });

      // Handle function execution error
      if (error) {
        let serverErrorMsg = '';
        let errorStatus: number | null = null;

        try {
          if ('context' in error && (error as any).context) {
            const ctxResponse = (error as any).context as Response;
            errorStatus = ctxResponse.status;
            try {
              const errBody = (await ctxResponse.clone().json()) as any;
              serverErrorMsg = errBody?.error || errBody?.message || JSON.stringify(errBody);
            } catch {
              serverErrorMsg = await ctxResponse.clone().text();
            }
          }
        } catch (parseErr) {
          console.warn('[PushNotificationSettings] Could not parse error context:', parseErr);
        }

        const finalErrorMsg = serverErrorMsg || error.message || 'Unknown network error invoking send-push';
        const statusLabel = errorStatus ? ` (HTTP ${errorStatus})` : '';

        console.error('[PushNotificationSettings] Test push failed with error details:', {
          status: errorStatus,
          message: error.message,
          serverErrorMsg: finalErrorMsg,
          rawError: error,
        });

        // Specific, actionable error toasts displaying the real error
        if (finalErrorMsg.includes('VAPID')) {
          toast.error(`VAPID Error${statusLabel}`, {
            description: finalErrorMsg,
          });
        } else if (errorStatus === 404 && finalErrorMsg.includes('No active push subscription')) {
          toast.error('Subscription Not Found in DB (HTTP 404)', {
            description: finalErrorMsg,
          });
        } else if (errorStatus === 410 || finalErrorMsg.includes('expired')) {
          toast.error('Push Token Expired (HTTP 410)', {
            description: finalErrorMsg,
          });
        } else if (errorStatus === 404) {
          toast.error('Edge Function Not Found (HTTP 404)', {
            description: 'The "send-push" Edge Function has not been deployed to Supabase yet. Deploy with: supabase functions deploy send-push',
          });
        } else {
          toast.error(`Push Error${statusLabel}`, {
            description: finalErrorMsg,
          });
        }
        return;
      }

      if (data?.success) {
        toast.success('Test notification sent!', {
          description: `Dispatched to ${data.delivered || 1} device(s). Check your notification shade/lock screen!`,
        });
      } else {
        const errMsg = data?.error || 'Server did not return a success confirmation';
        const statusLabel = data?.status ? ` (HTTP ${data.status})` : '';
        console.error('[PushNotificationSettings] Test push returned non-success response:', data);
        toast.error(`Push Failed${statusLabel}`, {
          description: errMsg,
        });
      }
    } catch (err: any) {
      console.error('[PushNotificationSettings] Unexpected error in handleSendTestPush:', err);
      toast.error('Push Dispatch Error', {
        description: err?.message || 'Check browser developer console for error stack.',
      });
    } finally {
      setTestingPush(false);
    }
  };

  if (!supported) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-xs">
        <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
          <AlertTriangle size={15} className="text-amber-600" />
          <span>Web Push Not Supported</span>
        </div>
        <p className="text-amber-700 dark:text-amber-400 mt-1">
          Your current browser environment does not support background Web Push. For iOS devices, install Scholario to your Home Screen to enable web push.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E5E5E5] dark:border-[#27272A] rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isSubscribed ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>
              {isSubscribed ? <Bell size={18} /> : <BellOff size={18} />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111111] dark:text-[#F4F4F5]">Web Push Notifications</h4>
              <p className="text-xs text-[#737373] dark:text-[#A1A1AA]">
                Receive instant Chrome-style alerts on desktop and phone even when Scholario is closed.
              </p>
            </div>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          disabled={loading || actionLoading || permission === 'denied'}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed ${
            isSubscribed ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
          }`}
          role="switch"
          aria-checked={isSubscribed}
          title={isSubscribed ? 'Click to turn off push notifications' : 'Click to enable push notifications'}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              isSubscribed ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Device Info & Status Details */}
      <div className="pt-3 border-t border-[#F0F0F0] dark:border-[#27272A] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#737373] dark:text-[#A1A1AA]">
          <Smartphone size={14} className="text-[#A3A3A3]" />
          <span>Device: <strong>{getDeviceInfo()}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          {permission === 'denied' ? (
            <span className="inline-flex items-center gap-1 text-red-600 font-semibold bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-full">
              <AlertTriangle size={12} /> Blocked in browser permissions
            </span>
          ) : isSubscribed ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
              <CheckCircle2 size={12} /> Active & Listening
            </span>
          ) : (
            <span className="text-zinc-500 font-medium">Inactive</span>
          )}
        </div>
      </div>

      {/* Test Notification Trigger */}
      {isSubscribed && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={testingPush}
            onClick={handleSendTestPush}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-50"
          >
            <Send size={12} />
            {testingPush ? 'Sending Push...' : 'Send Test Notification'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PushNotificationSettings;
