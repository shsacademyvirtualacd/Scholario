/**
 * Service Worker Registration & Stale-Cache Detection Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Detects:
 * 1. New service worker updates (updatefound / waiting worker).
 * 2. Stale chunk loading failures (Failed to fetch dynamically imported module).
 * Dispatches 'scholario:update-available' event to prompt the user to reload.
 */

export const UPDATE_AVAILABLE_EVENT = 'scholario:update-available';

let registrationInstance: ServiceWorkerRegistration | null = null;

export function triggerUpdatePrompt(reason = 'new-version'): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(UPDATE_AVAILABLE_EVENT, { detail: { reason } }));
}

/**
 * Sends SKIP_WAITING to the waiting service worker and reloads the page
 */
export function applyUpdateAndReload(): void {
  if (typeof window === 'undefined') return;

  if (registrationInstance && registrationInstance.waiting) {
    registrationInstance.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  // Clear chunk retry flags to ensure clean reload
  try {
    window.sessionStorage.removeItem('scholario_chunk_reload_done');
  } catch {}

  window.location.reload();
}

/**
 * Registers the root Service Worker (/sw.js) and monitors for background updates
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

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

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      registrationInstance = reg;

      // 1. Check if a worker is already waiting in background
      if (reg.waiting && navigator.serviceWorker.controller) {
        triggerUpdatePrompt('waiting-worker');
      }

      // 2. Listen for newly installing workers
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // If a new worker installed and there's already an active controller, a new version is available!
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW Registration] New service worker version detected and installed');
            triggerUpdatePrompt('service-worker-update');
          }
        });
      });

      // 3. Periodic check for updates every 30 minutes or on tab focus
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          reg.update().catch(() => {});
        }
      });
    } catch (err) {
      console.warn('[SW Registration] Failed to register service worker:', err);
    }
  });
}
