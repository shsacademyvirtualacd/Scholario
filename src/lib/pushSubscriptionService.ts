import { supabase } from './supabase';
import type { Profile } from '../types';

export const VAPID_PUBLIC_KEY =
  (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY ||
  'BAt10hJjc1FsLa_xXoJNWEYKvR1LALcHu2JLJWPbrOksAQ4rw0M-78JS5xNvr6wkDajphLwdbs-yMBvyrHCE484';

/**
 * Converts a base64url VAPID public key string into a Uint8Array required by pushManager.subscribe().
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks if the current browser environment supports Service Worker and Web Push.
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Registers the root Service Worker (/sw.js) if supported.
 */
export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (err) {
    console.warn('[PushServiceWorker] Registration failed:', err);
    return null;
  }
}

/**
 * Subscribes the current user to Web Push notifications using VAPID.
 * Sends the subscription to the backend server and stores it for background delivery.
 */
export async function subscribeUserToPush(
  profile: Profile | { id: string; role?: string; grade?: string; board?: string } | null
): Promise<PushSubscription | null> {
  if (!isPushSupported() || !profile?.id) {
    return null;
  }

  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const registration = await registerPushServiceWorker();
    if (!registration) return null;

    // Ensure service worker is active/ready
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey.buffer as ArrayBuffer,
      });
    }

    if (!subscription) {
      console.warn('[PushSubscription] Failed to obtain push subscription from browser');
      return null;
    }

    const subJson = subscription.toJSON();
    const endpoint = subscription.endpoint;
    const p256dh = subJson.keys?.p256dh || '';
    const auth = subJson.keys?.auth || '';

    const role = profile.role || 'student';
    const payload = {
      user_id: profile.id,
      role,
      endpoint,
      p256dh,
      auth,
      subscription_json: subJson,
      grade: (profile as any).grade || (profile as any).class_id || null,
      board: (profile as any).board_id || (profile as any).board || null,
    };

    // 1. Send subscription to Express / Cloud backend API
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      console.log('[PushSubscription] Successfully registered push subscription with backend server');
    } catch (apiErr) {
      console.warn('[PushSubscription] API sync warning:', apiErr);
    }

    // 2. Direct Supabase push_subscriptions upsert for defense in depth
    try {
      await (supabase as any)
        .from('push_subscriptions')
        .upsert(
          {
            user_id: profile.id,
            role,
            endpoint,
            p256dh,
            auth,
            subscription_json: subJson,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'endpoint' }
        );
    } catch (dbErr) {
      // Non-fatal if table is still caching or handled by server API
      console.log('[PushSubscription] Direct DB sync status:', dbErr);
    }

    return subscription;
  } catch (err) {
    console.error('[PushSubscription] Error subscribing user to push:', err);
    return null;
  }
}

/**
 * Unsubscribes the current device from Web Push and informs the server.
 */
export async function unsubscribeUserFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      // Notify backend to remove subscription
      try {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        });
      } catch (err) {
        console.warn('[PushSubscription] Unsubscribe server call warning:', err);
      }

      try {
        await (supabase as any)
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', endpoint);
      } catch {
        // ignore
      }

      return true;
    }
    return false;
  } catch (err) {
    console.warn('[PushSubscription] Unsubscribe error:', err);
    return false;
  }
}
