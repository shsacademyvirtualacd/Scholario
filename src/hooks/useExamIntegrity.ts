import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * ============================================================================
 * EXAM INTEGRITY & PROCTORING PROTECTION HOOK
 * ============================================================================
 *
 * ARCHITECTURAL NOTICE & SECURITY CAVEAT:
 * Browser-based security sandboxes cannot prevent:
 * 1) A secondary physical device (e.g., phone camera) photographing the screen.
 * 2) OS-level or hardware-level screen recording tools that do not fire DOM or
 *    Page Visibility API events.
 *
 * True capture-proof execution requires native client-side proctoring software with
 * OS kernel hooks (e.g., Examity, ProctorU). Within a standard web browser, the
 * strongest deterrence model relies on:
 * - Immediate detection & auto-submission on any detectable browser event:
 *   visibility change, window blur, DevTools inspection, PrintScreen / shortcut
 *   combos, context menu abuse, and clipboard copying.
 * - Dynamic visual watermarking burned across the screen making any physical or
 *   digital leak strictly traceable back to the student's identity.
 * - Transparent disclosure banners setting unambiguous student expectations.
 * ============================================================================
 */

export interface UseExamIntegrityOptions {
  active: boolean;
  onViolation: (reason: string) => void;
  isShielded?: () => boolean;
  studentName?: string;
  studentId?: string;
}

export function useExamIntegrity({
  active,
  onViolation,
  isShielded,
}: UseExamIntegrityOptions) {
  const hasTriggeredRef = useRef<boolean>(false);
  const contextMenuAttemptsRef = useRef<number>(0);
  const baselineDiffRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  // Reset trigger state when exam status changes
  useEffect(() => {
    if (!active) {
      hasTriggeredRef.current = false;
      contextMenuAttemptsRef.current = 0;
    } else {
      // Record baseline window dimension delta to detect DevTools opening
      if (typeof window !== 'undefined') {
        baselineDiffRef.current = {
          width: Math.max(0, window.outerWidth - window.innerWidth),
          height: Math.max(0, window.outerHeight - window.innerHeight),
        };
      }
    }
  }, [active]);

  useEffect(() => {
    if (!active) return;

    const triggerViolation = (reason: string) => {
      if (hasTriggeredRef.current) return;
      if (isShielded && isShielded()) return;

      hasTriggeredRef.current = true;
      onViolation(reason);
    };

    // ──────────────────────────────────────────────────────────────────────────
    // 1. VISIBILITY & FOCUS LOSS DETECTION (DESKTOP & MOBILE)
    // ──────────────────────────────────────────────────────────────────────────
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('Auto-submitted: Tab or browser switch detected (document hidden)');
      }
    };

    const handleWindowBlur = () => {
      triggerViolation('Auto-submitted: Window focus lost (switched away from proctored exam)');
    };

    const handlePageHide = () => {
      triggerViolation('Auto-submitted: Page hidden / navigated away from proctored exam');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // 2. KEYBOARD SHORTCUT INTERCEPTION & PRINTSCREEN DETECTION
    // ──────────────────────────────────────────────────────────────────────────
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.code;
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // PrintScreen keydown
      if (key === 'PrintScreen' || code === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('Auto-submitted: Screen capture attempt detected (PrintScreen keydown)');
        return;
      }

      // Print shortcut (Ctrl+P / Cmd+P)
      if (isCtrlOrCmd && (key === 'p' || key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('Auto-submitted: Print shortcut (Ctrl/Cmd+P) detected');
        return;
      }

      // Save page shortcut (Ctrl+S / Cmd+S without Shift)
      if (isCtrlOrCmd && !e.shiftKey && (key === 's' || key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('Auto-submitted: Page save shortcut (Ctrl/Cmd+S) detected');
        return;
      }

      // Windows Snipping Tool shortcut (Win+Shift+S / Ctrl+Shift+S)
      if (isCtrlOrCmd && e.shiftKey && (key === 's' || key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('Auto-submitted: Snipping tool / screen capture shortcut detected');
        return;
      }

      // Mac screenshot shortcuts (Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5)
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('Auto-submitted: Screen capture shortcut (Cmd+Shift+3/4/5) detected');
        return;
      }

      // DevTools shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U)
      if (key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('Auto-submitted: Developer Tools shortcut (F12) detected');
        return;
      }

      if (isCtrlOrCmd && (e.shiftKey || e.altKey) && ['i', 'I', 'j', 'J', 'c', 'C'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('Auto-submitted: Developer Tools / Inspector shortcut detected');
        return;
      }

      if (isCtrlOrCmd && (key === 'u' || key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('Auto-submitted: View Page Source shortcut (Ctrl/Cmd+U) detected');
        return;
      }
    };

    // PrintScreen keyup: specifically required because OS intercepts keydown on some platforms
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.code;
      if (key === 'PrintScreen' || code === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('Auto-submitted: Screen capture attempt detected (PrintScreen keyup)');
      }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // 3. CLIPBOARD MONITORING (COPY / CUT PREVENTION & AUTO-SUBMIT)
    // ──────────────────────────────────────────────────────────────────────────
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerViolation('Auto-submitted: Unauthorized text copying attempt detected');
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerViolation('Auto-submitted: Unauthorized text cut/copy attempt detected');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // 4. RIGHT-CLICK CONTEXT MENU PREVENTION & INSPECTION DETECTION
    // ──────────────────────────────────────────────────────────────────────────
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      contextMenuAttemptsRef.current += 1;
      if (contextMenuAttemptsRef.current >= 2) {
        triggerViolation('Auto-submitted: Repeated unauthorized right-click / context menu attempts detected');
      } else {
        toast.warning(
          'Right-click context menu is disabled during proctored exams. A repeated attempt will terminate your exam.',
          { duration: 4000 }
        );
      }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // 5. DEVTOOLS OPENING DETECTION (WINDOW DIMENSIONS & DEBUGGER TIMING)
    // ──────────────────────────────────────────────────────────────────────────
    const checkDevTools = () => {
      if (typeof window === 'undefined') return;

      // Dimension threshold check: docked DevTools changes inner dimensions relative to outer
      const curWidthDiff = window.outerWidth - window.innerWidth;
      const curHeightDiff = window.outerHeight - window.innerHeight;
      const deltaWidth = Math.abs(curWidthDiff - baselineDiffRef.current.width);
      const deltaHeight = Math.abs(curHeightDiff - baselineDiffRef.current.height);

      // A sudden shift of > 160px while not fullscreened typically indicates docked DevTools
      if (deltaWidth > 170 || deltaHeight > 170) {
        triggerViolation('Auto-submitted: Developer Tools docked window detected via viewport dimension shift');
        return;
      }

      // Timing check: debugger statement pause measurement
      const t0 = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const t1 = performance.now();
      if (t1 - t0 > 120) {
        triggerViolation('Auto-submitted: Developer Tools debugger inspection detected');
      }
    };

    const devToolsInterval = setInterval(checkDevTools, 2500);

    // Attach listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      clearInterval(devToolsInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [active, onViolation, isShielded]);
}
