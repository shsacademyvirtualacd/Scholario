import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export interface UseSidebarNavReturn {
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
  isRailCollapsed: boolean;
  drawerOpen: boolean;
  setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRailCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
  isExpandedOrOpen: boolean;
}

export function useSidebarNav(role: 'admin' | 'teacher' | 'student'): UseSidebarNavReturn {
  const location = useLocation();

  // Screen size classification:
  // Desktop: >= 1024px
  // Tablet: 768px to 1023px
  // Mobile / Phone: < 768px
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = windowWidth >= 1024;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isMobile = windowWidth < 768;

  // Desktop rail preference in localStorage
  const storageKey = `scholario_${role}_rail_collapsed`;
  const [isRailCollapsed, setIsRailCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  });

  // Tablet & Phone overlay drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Close drawer on Escape key when open as an overlay
  useEffect(() => {
    if (!drawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // Handle phone Back button (popstate)
  useEffect(() => {
    if (!drawerOpen) return;
    const handlePopState = () => {
      setDrawerOpen(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [drawerOpen]);

  // If resized from tablet/phone to desktop, close the overlay drawer
  useEffect(() => {
    if (isDesktop && drawerOpen) {
      setDrawerOpen(false);
    }
  }, [isDesktop, drawerOpen]);

  // Single toggle handler
  const toggleSidebar = useCallback(() => {
    if (window.innerWidth >= 1024) {
      setIsRailCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem(storageKey, String(next));
        } catch {}
        return next;
      });
    } else {
      setDrawerOpen((prev) => !prev);
    }
  }, [storageKey]);

  // Single source of truth for the hamburger icon state:
  // - On desktop: true when expanded (not collapsed to rail) -> hamburger morphs to X
  // - On tablet & mobile: true when overlay drawer is open -> hamburger morphs to X
  const isExpandedOrOpen = isDesktop ? !isRailCollapsed : drawerOpen;

  return {
    isDesktop,
    isTablet,
    isMobile,
    isRailCollapsed,
    drawerOpen,
    setDrawerOpen,
    setIsRailCollapsed,
    toggleSidebar,
    isExpandedOrOpen,
  };
}

export default useSidebarNav;
