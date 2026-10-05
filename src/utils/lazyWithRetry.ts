import React from 'react';
import { triggerUpdatePrompt } from '../lib/serviceWorkerRegistration';

export const CHUNK_RELOAD_STORAGE_KEY = 'scholario_chunk_reload_done';

/**
 * Wraps dynamic React.lazy imports with an automatic single reload recovery guard.
 * If a new build has deployed on Cloudflare Pages and an old tab requests a chunk
 * with a stale hash that returns 404 / Failed to fetch, this catches the error,
 * flags sessionStorage, and reloads once to fetch the latest index.html and manifest.
 *
 * If the retry fails a second time, it throws so the ErrorBoundary can show
 * a friendly "A new version is available. Tap to refresh" card instead of crashing.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  chunkName = 'chunk'
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    const chunkStorageKey = `scholario_chunk_retry_${chunkName}`;
    const hasChunkRetried = window.sessionStorage.getItem(chunkStorageKey) === 'true';
    const hasGlobalRetried = window.sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY) === 'true';
    const hasRetried = hasChunkRetried || hasGlobalRetried;

    try {
      const module = await componentImport();
      // On successful load, clean up the retry flags
      window.sessionStorage.removeItem(chunkStorageKey);
      window.sessionStorage.removeItem(CHUNK_RELOAD_STORAGE_KEY);
      return module;
    } catch (error: any) {
      const msg = error?.message || String(error);
      const isChunkLoadError =
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Importing a module script failed') ||
        msg.includes('error loading dynamically imported module') ||
        msg.includes('Loading chunk') ||
        msg.includes('dynamically imported module') ||
        msg.includes('Loading CSS chunk') ||
        (error?.name === 'TypeError' && msg.includes('fetch')) ||
        (msg.includes('/assets/') && msg.includes('.js'));

      if (isChunkLoadError) {
        triggerUpdatePrompt('chunk-load-error');

        if (!hasRetried) {
          console.warn(`[lazyWithRetry] Stale chunk detected for ${chunkName} (${msg}). Reloading page once to fetch latest version...`);
          window.sessionStorage.setItem(chunkStorageKey, 'true');
          window.sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, 'true');
          window.location.reload();
          // Return a pending promise to halt rendering while reload executes
          return new Promise<{ default: T }>(() => {});
        }
      }

      // If we already retried or it's another error, bubble to ErrorBoundary
      throw error;
    }
  });
}

export default lazyWithRetry;
