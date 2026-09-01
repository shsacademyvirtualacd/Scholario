/**
 * Scholario Service Worker (Web Push & Notification Handler)
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides background Web Push delivery for students, teachers, and admins
 * when browser tabs are closed or devices are locked.
 */

self.addEventListener('install', (event) => {
  // Activate immediately without waiting for older service workers to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim all active client tabs immediately
  event.waitUntil(self.clients.claim());
});

// ── Web Push Event ───────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('[SW] Push event received with no payload data');
    return;
  }

  let payload = {
    title: 'Scholario Notification',
    body: 'You have a new update from Scholario.',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'scholario-general-alert',
    data: {},
  };

  try {
    const rawData = event.data.json();
    payload = {
      title: rawData.title || payload.title,
      body: rawData.body || payload.body,
      icon: rawData.icon || payload.icon,
      badge: rawData.badge || payload.badge,
      tag: rawData.tag || payload.tag,
      data: rawData.data || rawData,
    };
  } catch (err) {
    try {
      payload.body = event.data.text() || payload.body;
    } catch {
      // ignore
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon || '/logo.png',
    badge: payload.badge || '/logo.png',
    tag: payload.tag, // Browser-level tag collapsing ensures no duplicate stacking with tab-open Notification()
    renotify: true,
    requireInteraction: true,
    data: payload.data || {},
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

// ── Notification Click Handler ───────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = data.url || (data.class_link ? data.class_link : '/');

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a Scholario window is already open, focus it and navigate to target URL
      for (const client of clientList) {
        if ('focus' in client) {
          if (targetUrl && client.url !== targetUrl && 'navigate' in client) {
            try {
              client.navigate(targetUrl);
            } catch (navErr) {
              console.warn('[SW] client.navigate error:', navErr);
            }
          }
          return client.focus();
        }
      }
      // If no window is open, open a new window to the destination
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
