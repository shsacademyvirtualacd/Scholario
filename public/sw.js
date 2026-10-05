/**
 * Scholario Service Worker (Web Push & Stale-Cache Protection)
 * ─────────────────────────────────────────────────────────────────────────────
 * Caching & Stale-Cache Protection Policy:
 * 1. Cache name is versioned per build (__BUILD_HASH__).
 * 2. On activate, old caches are automatically deleted.
 * 3. Calls skipWaiting() on install and clients.claim() on activate.
 * 4. Strictly NETWORK-FIRST for index.html and all navigation requests.
 * 5. Strictly NETWORK-FIRST for /assets/*.js (never served cache-first to prevent stale JS bundles).
 * 6. Cache-first for other hashed assets (CSS, fonts, images) within the active build cache.
 * 7. Bypasses cache entirely for API endpoints (/api/*) and non-GET requests.
 */

// Build hash replaced during build with a unique build ID
const CACHE_VERSION = '__BUILD_HASH__';
const CACHE_NAME = `scholario-cache-${CACHE_VERSION}`;

self.addEventListener('install', (_event) => {
  // Activate immediately without waiting for older service workers to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // 1. Delete all old / stale caches that do not match the current build cache name
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('scholario-cache-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting stale cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // 2. Claim all active client tabs immediately
      return self.clients.claim();
    })
  );
});

// Allow client app to trigger immediate skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Fetch Handler with Stale-Cache Protection ────────────────────────────────
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Never intercept non-GET requests
  if (req.method !== 'GET') {
    return;
  }

  // 2. Never intercept backend API calls or cross-origin requests
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    return;
  }

  // 3. Navigation requests & index.html: strictly NETWORK-FIRST
  // Must never be served cache-first to avoid loading outdated bundle hashes!
  const isNavigation =
    req.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname === '/index.html' ||
    url.pathname.endsWith('.html');

  if (isNavigation) {
    event.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // If offline or network unavailable, fall back to cached index.html
          const cached = await caches.match(req);
          if (cached) return cached;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 4. /assets/*.js: strictly NETWORK-FIRST (never cache-first)
  // Guarantees that newly deployed JS chunks are always fetched fresh from the server
  const isJsAsset = url.pathname.startsWith('/assets/') && url.pathname.endsWith('.js');
  if (isJsAsset) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, responseClone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 5. Other hashed static assets (CSS, fonts, images): CACHE-FIRST within current build
  const isStaticHashedAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname === '/logo.png' ||
    url.pathname === '/logo.svg' ||
    url.pathname === '/favicon.svg';

  if (isStaticHashedAsset) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
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
  } catch (_err) {
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
