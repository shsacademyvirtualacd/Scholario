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
 * Detects friendly browser and OS string for device identification.
 */
export function getDeviceInfo(): string {
  if (typeof window === 'undefined') return 'Unknown Device';
  const ua = navigator.userAgent;
  let browser = 'Browser';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('SamsungBrowser')) browser = 'Samsung Internet';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  else if (ua.includes('Edge') || ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';

  let os = 'Unknown OS';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} on ${os}`;
}

/**
 * Checks if the current browser already has an active push subscription.
 */
/**
 * Checks if the current browser already has an active push subscription.
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return sub !== null;
  } catch {
    return false;
  }
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
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.warn('[PushServiceWorker] Registration failed:', err);
    return null;
  }
}

/**
 * Subscribes the current user to Web Push notifications using VAPID.
 * Sends the subscription to Supabase and stores it in push_subscriptions table.
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
    if (!registration) {
      console.warn('[PushSubscription] Service worker registration unavailable');
      return null;
    }

    // Ensure service worker is active/ready
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

    // If an existing subscription exists, verify if its public key matches the current VAPID key
    if (subscription) {
      try {
        const rawAppKey = subscription.options?.applicationServerKey;
        if (rawAppKey) {
          const existingKeyBytes = new Uint8Array(rawAppKey);
          let keyMatches = existingKeyBytes.length === convertedVapidKey.length;
          if (keyMatches) {
            for (let i = 0; i < existingKeyBytes.length; i++) {
              if (existingKeyBytes[i] !== convertedVapidKey[i]) {
                keyMatches = false;
                break;
              }
            }
          }
          if (!keyMatches) {
            console.warn('[PushSubscription] VAPID key mismatch detected. Re-subscribing with updated key...');
            await subscription.unsubscribe();
            subscription = null;
          }
        }
      } catch (keyErr) {
        console.warn('[PushSubscription] Could not verify existing applicationServerKey:', keyErr);
      }
    }

    // Create a new subscription if none exists or if old one had a key mismatch
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
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
    const deviceInfo = getDeviceInfo();

    // 1. Direct Supabase push_subscriptions upsert
    const { error: dbError } = await (supabase as any)
      .from('push_subscriptions')
      .upsert(
        {
          user_id: profile.id,
          role,
          endpoint,
          p256dh,
          auth,
          device_info: deviceInfo,
          subscription_json: subJson,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

    if (dbError) {
      console.error('[PushSubscription] Supabase push_subscriptions upsert error:', dbError);
      throw new Error(`Failed to save subscription in database: ${dbError.message}`);
    }

    console.log('[PushSubscription] Successfully saved push subscription for user:', profile.id);

    // 2. Remove stale subscriptions for the same user on the same device with older endpoints
    try {
      await (supabase as any)
        .from('push_subscriptions')
        .delete()
        .eq('user_id', profile.id)
        .eq('device_info', deviceInfo)
        .neq('endpoint', endpoint);
    } catch (cleanupErr) {
      console.warn('[PushSubscription] Cleanup stale subscriptions notice:', cleanupErr);
    }

    // 3. Inform Express server API if running in fullstack mode (non-fatal on Cloudflare Pages)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: profile.id,
          role,
          endpoint,
          p256dh,
          auth,
          device_info: deviceInfo,
          subscription_json: subJson,
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }

    return subscription;
  } catch (err: any) {
    console.error('[PushSubscription] Error subscribing user to push:', err);
    throw err;
  }
}

/**
 * Unsubscribes the current device from Web Push and removes it from Supabase.
 */
export async function unsubscribeUserFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      // Delete from Supabase push_subscriptions table
      const { error } = await (supabase as any)
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);

      if (error) {
        console.warn('[PushSubscription] Supabase delete subscription error:', error);
      }

      // Inform Express server API if running (non-fatal)
      try {
        fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        }).catch(() => {});
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
