import { useEffect, useRef, useState, useCallback } from 'react';
import { sendStaffHeartbeat } from '../lib/staffAttendanceService';
import { toast } from 'sonner';

export interface UseStaffPresenceIntegrityOptions {
  activeLogId: string | null;
  isClockedIn: boolean;
  idleThresholdMinutes?: number; // default 30 min
  onIdleStateChange?: (isIdle: boolean, idleMinutes: number) => void;
}

export function useStaffPresenceIntegrity({
  activeLogId,
  isClockedIn,
  idleThresholdMinutes = 30,
  onIdleStateChange,
}: UseStaffPresenceIntegrityOptions) {
  const [isIdle, setIsIdle] = useState(false);
  const [idleMinutes, setIdleMinutes] = useState(0);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  const lastActivityTimestampRef = useRef<number>(Date.now());
  const idleNotifiedRef = useRef<boolean>(false);
  const activeLogIdRef = useRef<string | null>(activeLogId);
  activeLogIdRef.current = activeLogId;

  // Record user activity
  const handleUserActivity = useCallback(() => {
    lastActivityTimestampRef.current = Date.now();
    if (isIdle) {
      setIsIdle(false);
      idleNotifiedRef.current = false;
      if (onIdleStateChange) onIdleStateChange(false, 0);
    }
  }, [isIdle, onIdleStateChange]);

  // Setup DOM event listeners for presence & activity detection
  useEffect(() => {
    if (!isClockedIn) {
      setIsIdle(false);
      setIdleMinutes(0);
      return;
    }

    lastActivityTimestampRef.current = Date.now();

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    let lastThrottled = 0;

    const throttledActivity = () => {
      const now = Date.now();
      if (now - lastThrottled > 2000) {
        lastThrottled = now;
        handleUserActivity();
      }
    };

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, throttledActivity, { passive: true });
    });

    // 1. Page Visibility API
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsTabVisible(visible);
      if (visible) {
        handleUserActivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 2. Window Focus / Blur
    const handleFocus = () => {
      setIsWindowFocused(true);
      handleUserActivity();
    };
    const handleBlur = () => {
      setIsWindowFocused(false);
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // 3. BeforeUnload warning if clocked in
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeLogIdRef.current) {
        const msg = 'You are currently clocked in. Would you like to stay on this page to clock out?';
        e.preventDefault();
        e.returnValue = msg;
        return msg;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 4. Timer interval: calculates idle time and sends periodic heartbeat
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      const elapsedInactiveSeconds = Math.floor((now - lastActivityTimestampRef.current) / 1000);
      const calculatedIdleMins = Math.floor(elapsedInactiveSeconds / 60);

      setIdleMinutes(calculatedIdleMins);

      const isNowIdle = calculatedIdleMins >= idleThresholdMinutes;
      setIsIdle(isNowIdle);

      if (isNowIdle && !idleNotifiedRef.current) {
        idleNotifiedRef.current = true;
        toast.warning(`Session Idle: No activity detected for ${calculatedIdleMins} minutes. Session will be flagged for review.`, {
          duration: 6000,
        });
        if (onIdleStateChange) onIdleStateChange(true, calculatedIdleMins);
      }

      // Send heartbeat if active session exists
      if (activeLogIdRef.current) {
        sendStaffHeartbeat({
          log_id: activeLogIdRef.current,
          idle_minutes: calculatedIdleMins,
          is_tab_visible: !document.hidden,
          is_window_focused: document.hasFocus(),
          client_time: new Date().toISOString(),
        }).catch(() => {});
      }
    }, 60 * 1000); // Check and heartbeat every 60 seconds

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, throttledActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.clearInterval(intervalId);
    };
  }, [isClockedIn, idleThresholdMinutes, handleUserActivity, onIdleStateChange]);

  return {
    isIdle,
    idleMinutes,
    isTabVisible,
    isWindowFocused,
    resetActivity: handleUserActivity,
  };
}
