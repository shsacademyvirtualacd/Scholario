export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export const pageCache = {
  /**
   * Get cached data for a specific key and user ID from sessionStorage.
   */
  get<T>(key: string, userId?: string): T | null {
    if (!userId || typeof window === 'undefined') return null;
    try {
      const storageKey = `scholario_cache_${key}_${userId}`;
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      return entry?.data !== undefined ? entry.data : null;
    } catch (err) {
      console.warn(`[pageCache] Failed to retrieve cache for ${key}:`, err);
      return null;
    }
  },

  /**
   * Set cached data for a specific key and user ID inside sessionStorage.
   */
  set<T>(key: string, data: T, userId?: string): void {
    if (!userId || typeof window === 'undefined') return;
    try {
      const storageKey = `scholario_cache_${key}_${userId}`;
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (err) {
      console.warn(`[pageCache] Failed to save cache for ${key}:`, err);
    }
  },

  /**
   * Clear cache entries (either specific key+user, or all entries for user/all).
   */
  clear(key?: string, userId?: string): void {
    if (typeof window === 'undefined') return;
    try {
      if (key && userId) {
        sessionStorage.removeItem(`scholario_cache_${key}_${userId}`);
      } else {
        const prefix = 'scholario_cache_';
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith(prefix)) {
            if (!userId || k.endsWith(`_${userId}`)) {
              sessionStorage.removeItem(k);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[pageCache] Failed to clear cache:', err);
    }
  },
};
