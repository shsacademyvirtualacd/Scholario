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

// Intercept window.fetch to track Supabase / data requests
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
    
    // Track Supabase queries
    const isTracked = url.includes('.supabase.co');
    
    if (isTracked) {
      activeFetches++;
      notify();
    }
    
    try {
      return await originalFetch.apply(this, args);
    } finally {
      if (isTracked) {
        activeFetches = Math.max(0, activeFetches - 1);
        notify();
      }
    }
  };
}
