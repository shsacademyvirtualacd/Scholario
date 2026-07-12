import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the current viewport is mobile-sized.
 * @param breakpoint The pixel width threshold (default: 768)
 * @returns boolean indicating if the viewport is narrower than the breakpoint
 */
export function useMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Set initial value just in case it changed between initial render and effect
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}
