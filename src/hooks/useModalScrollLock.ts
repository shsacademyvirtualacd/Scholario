import { useEffect, useRef } from 'react';

/**
 * Robust scroll-locking hook for overlays, modals, and drawers.
 *
 * Guarantees that:
 * 1. The background page does not scroll or jitter while the modal is active.
 * 2. Opening the modal NEVER resets or jumps the background scroll position to top.
 * 3. Closing the modal preserves and restores the exact scroll position of both
 *    the window and any active nested scroll container (e.g., AdminShell/StudentShell <main>).
 */
export function useModalScrollLock(isOpen: boolean) {
  const scrollPositionRef = useRef<{
    windowY: number;
    mainY: number;
    mainEl: HTMLElement | null;
  }>({
    windowY: 0,
    mainY: 0,
    mainEl: null,
  });

  useEffect(() => {
    if (!isOpen) return;

    // 1. Capture exact scroll offsets before any DOM manipulation
    const currentWindowY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const currentMainEl = document.querySelector('main.overflow-y-auto') as HTMLElement | null;
    const currentMainY = currentMainEl ? currentMainEl.scrollTop : 0;

    scrollPositionRef.current = {
      windowY: currentWindowY,
      mainY: currentMainY,
      mainEl: currentMainEl,
    };

    // 2. Save original overflow styles
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalMainOverflow = currentMainEl ? currentMainEl.style.overflowY : '';

    // 3. Lock scroll containers without causing layout shifts
    document.body.style.overflow = 'hidden';

    // If <main> is independently scrollable, lock its overflow as well
    if (currentMainEl) {
      currentMainEl.style.overflowY = 'hidden';
      // Ensure the scroll position of <main> did not jump
      currentMainEl.scrollTop = currentMainY;
    }

    // Ensure the window scroll position did not jump
    if ((window.pageYOffset || document.documentElement.scrollTop) !== currentWindowY) {
      window.scrollTo(0, currentWindowY);
    }

    // 4. Cleanup when modal closes
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;

      if (currentMainEl) {
        currentMainEl.style.overflowY = originalMainOverflow;
      }

      // Restore exact scroll positions immediately and in next microtask / animation frame
      const restoreScroll = () => {
        window.scrollTo({
          top: scrollPositionRef.current.windowY,
          left: 0,
          behavior: 'instant' as ScrollBehavior,
        });

        if (scrollPositionRef.current.mainEl) {
          scrollPositionRef.current.mainEl.scrollTop = scrollPositionRef.current.mainY;
        }
      };

      restoreScroll();
      requestAnimationFrame(restoreScroll);
      setTimeout(restoreScroll, 20);
    };
  }, [isOpen]);
}

export default useModalScrollLock;
