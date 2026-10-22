/**
 * Feature flag control for Scholario Public & Auth UI Redesign v2.
 * Enabled by default across the application, with zero-risk fallback to v1 components.
 */

const REDESIGN_KEY = 'scholario_redesign_v2';

export function isRedesignEnabled(): boolean {
  if (typeof window === 'undefined') return true;

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('v2') === 'false' || params.get('v2') === '0' || params.get('redesign') === 'false') {
      return false;
    }
    if (params.get('v2') === 'true' || params.get('v2') === '1' || params.get('redesign') === 'true') {
      return true;
    }

    const stored = localStorage.getItem(REDESIGN_KEY);
    if (stored === 'false') return false;
  } catch {}

  return true;
}

export function setRedesignEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REDESIGN_KEY, enabled ? 'true' : 'false');
  } catch {}
}
