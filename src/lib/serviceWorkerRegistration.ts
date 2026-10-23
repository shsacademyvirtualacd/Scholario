/**
 * Service Worker Registration & Stale-Cache Detection Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Detects:
 * 1. New service worker updates (updatefound / waiting worker).
 * 2. New production builds/deploys via version.json or HTML script hash.
 * 3. Stale chunk loading failures (Failed to fetch dynamically imported module).
 *
 * Automatically checks:
 * - On app startup
 * - On visibility change (returning to foreground)
 * - On window focus
 * - Periodically every few minutes
 */

export const UPDATE_AVAILABLE_EVENT = 'scholario:update-available';

let registrationInstance: ServiceWorkerRegistration | null = null;
let currentAppVersion: string | null = null;
let hasInitializedVersionCheck = false;

/**
 * Triggers the update prompt event across the window
 */
export function triggerUpdatePrompt(reason = 'new-version', version?: string): void {
  if (typeof window === 'undefined') return;

  // Never trigger if user already updated to this version
  const lastUpdated = localStorage.getItem('scholario_last_updated_version');
  if (version && lastUpdated && lastUpdated === version) {
    return;
  }

  // Safety: check if recent reload occurred within the last 15 seconds
  const lastUpdateTime = Number(localStorage.getItem('scholario_last_update_time') || 0);
  if (Date.now() - lastUpdateTime < 15000 && !version) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(UPDATE_AVAILABLE_EVENT, {
      detail: { reason, version: version || Date.now().toString(36) },
    })
  );
}

/**
 * Fetches the latest deploy version identifier from the server
 */
export async function fetchServerDeployVersion(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // 1. Try reading /version.json
  try {
    const res = await fetch(`/version.json?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.version) return String(data.version);
    }
  } catch {}

  // 2. Fallback: inspect root HTML for main script bundle hash
  try {
    const htmlRes = await fetch(`/?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (htmlRes.ok) {
      const html = await htmlRes.text();
      // Match script tag src="/assets/index-[hash].js" or similar
      const match = html.match(/assets\/index-[a-zA-Z0-9_-]+\.js/);
      if (match) return match[0];
      const etag = htmlRes.headers.get('etag');
      if (etag) return etag;
    }
  } catch {}

  return null;
}

/**
 * Performs a full clean update in order:
 * 1. Unregisters all service workers.
 * 2. Deletes all caches using the Cache API.
 * 3. Records acknowledged version in localStorage so banner won't reappear right after reload.
 * 4. Reloads the page with a cache-busting reload.
 */
export async function performFullUpdateAndReload(versionKey?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Tell waiting worker to skip waiting if present
  if (registrationInstance && registrationInstance.waiting) {
    try {
      registrationInstance.waiting.postMessage({ type: 'SKIP_WAITING' });
    } catch {}
  }

  // 2. Unregister all service workers
  if ('serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    } catch (err) {
      console.warn('[SW Registration] Failed unregistering service workers:', err);
    }
  }

  // 3. Delete all caches using the Cache API
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (err) {
      console.warn('[SW Registration] Failed deleting caches:', err);
    }
  }

  // 4. Record update state in localStorage to prevent prompt re-triggering immediately
  try {
    const ver = versionKey || currentAppVersion || String(Date.now());
    localStorage.setItem('scholario_last_updated_version', ver);
    localStorage.setItem('scholario_last_update_time', String(Date.now()));
    sessionStorage.setItem('scholario_update_dismissed_version', ver);
    sessionStorage.removeItem('scholario_chunk_reload_done');
  } catch {}

  // 5. Cache-busting reload
  try {
    window.location.reload();
  } catch {
    window.location.href = window.location.pathname + '?_update=' + Date.now();
  }
}

/**
 * Backwards compatible alias for applyUpdateAndReload
 */
export async function applyUpdateAndReload(): Promise<void> {
  await performFullUpdateAndReload();
}

/**
 * Checks for updates from Service Worker and Server Deploy
 */
export async function checkForUpdates(): Promise<void> {
  if (typeof window === 'undefined') return;

  // A. Check Service Worker for updates
  if ('serviceWorker' in navigator && registrationInstance) {
    try {
      await registrationInstance.update();
      if (registrationInstance.waiting && navigator.serviceWorker.controller) {
        triggerUpdatePrompt('waiting-worker');
        return;
      }
    } catch {}
  }

  // B. Check Server Deploy
  try {
    const latestVersion = await fetchServerDeployVersion();
    if (latestVersion) {
      if (!currentAppVersion) {
        currentAppVersion = latestVersion;
        return;
      }

      if (latestVersion !== currentAppVersion) {
        const lastUpdated = localStorage.getItem('scholario_last_updated_version');
        if (lastUpdated !== latestVersion) {
          triggerUpdatePrompt('server-deploy', latestVersion);
        }
      }
    }
  } catch {}
}

/**
 * Registers the root Service Worker and monitors for background updates
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;

  // Monitor unhandled chunk loading rejections across the window
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    const msg = error?.message || String(error);
    if (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('error loading dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes('Loading CSS chunk')
    ) {
      console.warn('[SW Registration] Chunk load rejection caught:', msg);
      triggerUpdatePrompt('chunk-load-error');
    }
  });

  // Start periodic deploy and SW checks
  if (!hasInitializedVersionCheck) {
    hasInitializedVersionCheck = true;

    // Check when returning to foreground
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    });

    // Check when window gains focus
    window.addEventListener('focus', () => {
      checkForUpdates();
    });

    // Check periodically every 2.5 minutes (150,000 ms)
    setInterval(() => {
      checkForUpdates();
    }, 150000);
  }

  if (!('serviceWorker' in navigator)) {
    // If serviceWorker not supported, still do server version check on app start
    checkForUpdates();
    return;
  }

  const initSW = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      registrationInstance = reg;

      // Initial version check on startup
      await checkForUpdates();

      // Check if a worker is already waiting in background
      if (reg.waiting && navigator.serviceWorker.controller) {
        triggerUpdatePrompt('waiting-worker');
      }

      // Listen for newly installing workers
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            triggerUpdatePrompt('service-worker-update');
          }
        });
      });
    } catch (err) {
      console.warn('[SW Registration] Failed to register service worker:', err);
      // Fallback check server version
      checkForUpdates();
    }
  };

  if (document.readyState === 'complete') {
    initSW();
  } else {
    window.addEventListener('load', initSW);
  }
}
