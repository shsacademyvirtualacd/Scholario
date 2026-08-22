type Listener = (count: number) => void;
const listeners = new Set<Listener>();

let activeFetches = 0;
let activeSuspense = 0;

export const subscribeToTracker = (listener: Listener) => {
  listeners.add(listener);
  // Emit initial total
  listener(activeFetches + activeSuspense);
  return () => {
    listeners.delete(listener);
  };
};

const notify = () => {
  const total = activeFetches + activeSuspense;
  listeners.forEach((l) => l(total));
};

export const incrementSuspense = () => {
  activeSuspense++;
  notify();
};

export const decrementSuspense = () => {
  activeSuspense = Math.max(0, activeSuspense - 1);
  notify();
};

export const getPendingCount = () => activeFetches + activeSuspense;

export const trackedFetch: typeof fetch = async (...args) => {
  const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || '';
  const isTracked = typeof url === 'string' && url.includes('.supabase.co');

  if (isTracked) {
    activeFetches++;
    notify();
  }

  try {
    const rawFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : fetch;
    return await rawFetch(...args);
  } finally {
    if (isTracked) {
      activeFetches = Math.max(0, activeFetches - 1);
      notify();
    }
  }
};

// Safely attempt to intercept global window.fetch without throwing if window.fetch is a read-only getter
if (typeof window !== 'undefined') {
  try {
    const originalFetch = window.fetch.bind(window);
    const customFetch: typeof fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || '';
      const isTracked = typeof url === 'string' && url.includes('.supabase.co');

      if (isTracked) {
        activeFetches++;
        notify();
      }

      try {
        return await originalFetch(...args);
      } finally {
        if (isTracked) {
          activeFetches = Math.max(0, activeFetches - 1);
          notify();
        }
      }
    };

    try {
      window.fetch = customFetch;
    } catch {
      try {
        Object.defineProperty(window, 'fetch', {
          value: customFetch,
          writable: true,
          configurable: true,
        });
      } catch {
        // Fetch is non-configurable and getter-only in this iframe environment; fallback smoothly
      }
    }
  } catch {
    // Ignore any runtime window environment restrictions
  }
}

