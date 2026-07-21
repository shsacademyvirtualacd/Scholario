import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { subscribeToTracker } from '../../utils/requestTracker';

export const TopLoadingBar: React.FC = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<'idle' | 'pending' | 'loading' | 'completing'>('idle');

  useEffect(() => {
    // On location (route) change, mark transition as pending
    setState('pending');
    setProgress(0);

    // 150ms delay to prevent flashing on instant/cached transitions
    const delayTimer = setTimeout(() => {
      setState((curr) => {
        if (curr === 'pending') {
          setVisible(true);
          setProgress(10);
          return 'loading';
        }
        return curr;
      });
    }, 150);

    return () => {
      clearTimeout(delayTimer);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (state === 'idle') return;

    // Listen to pending requests (suspense + fetches)
    const unsubscribe = subscribeToTracker((pendingCount) => {
      if (pendingCount === 0) {
        setState((curr) => {
          if (curr === 'loading' || curr === 'pending') {
            setProgress(100);
            return 'completing';
          }
          return curr;
        });
      } else {
        setState((curr) => {
          if (curr === 'completing') {
            // Re-activate loading if new requests spawn
            setProgress(50);
            return 'loading';
          }
          return curr;
        });
      }
    });

    return () => unsubscribe();
  }, [state]);

  // Trickle progress when actively loading
  useEffect(() => {
    if (state !== 'loading') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const remaining = 90 - prev;
        const step = Math.max(1, Math.floor(remaining * 0.1));
        return prev + step;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [state]);

  // Handle completion animation and fade-out
  useEffect(() => {
    if (state !== 'completing') return;

    const fadeTimer = setTimeout(() => {
      setVisible(false);
      setProgress(0);
      setState('idle');
    }, 400); // 400ms duration for fade out

    return () => clearTimeout(fadeTimer);
  }, [state]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-[#F5F5F5] transition-all pointer-events-none"
      style={{
        opacity: state === 'completing' && progress === 100 ? 0 : 1,
        transition: state === 'completing' ? 'opacity 0.4s ease-in-out' : 'none',
      }}
    >
      <div
        className="h-full bg-gradient-to-r from-amber-400 via-[#F4C430] to-yellow-600 shadow-[0_1px_10px_rgba(244,196,48,0.8)] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
};
