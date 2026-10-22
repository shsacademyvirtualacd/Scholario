import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, LogIn, UserPlus, ExternalLink, Sun, Moon, Laptop } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { isRedesignEnabled } from '../../lib/featureFlags';
import { NavbarOld } from './NavbarOld';
import { AboutModal } from '../ui/AboutModal';
import { ContactModal } from '../ui/ContactModal';

interface NavbarProps {
  onNavigate?: (page: string) => void;
  onOpenAbout?: () => void;
  onOpenContact?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, onOpenAbout, onOpenContact }) => {
  if (!isRedesignEnabled()) {
    return <NavbarOld onNavigate={onNavigate} />;
  }

  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const menuCardRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const { session, profile } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Close menu automatically if window is resized to desktop (>= 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuOpen]);

  // Close desktop theme dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Lock body scroll while menu is open
  useEffect(() => {
    if (menuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [menuOpen]);

  // Close menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        menuOpen &&
        navContainerRef.current &&
        !navContainerRef.current.contains(e.target as Node) &&
        menuCardRef.current &&
        !menuCardRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [menuOpen]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleAuthAction = () => {
    setMenuOpen(false);
    if (session) {
      if (profile?.role === 'admin') navigate('/admin');
      else if (profile?.role === 'teacher') navigate('/teacher');
      else navigate('/student');
      return;
    }
    if (onNavigate) {
      onNavigate('login');
    } else {
      navigate('/login');
    }
  };

  const handleOpenAbout = () => {
    setMenuOpen(false);
    if (onOpenAbout) {
      onOpenAbout();
    } else {
      setAboutOpen(true);
    }
  };

  const handleOpenContact = () => {
    setMenuOpen(false);
    if (onOpenContact) {
      onOpenContact();
    } else {
      setContactOpen(true);
    }
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    setMenuOpen(false);
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const themeOptions: { mode: ThemeMode; label: string }[] = [
    { mode: 'light', label: 'Light' },
    { mode: 'dark', label: 'Dark' },
    { mode: 'system', label: 'System' },
  ];

  return (
    <>
      {/* ── Dim Backdrop: light dim rgba(0,0,0,0.25) + 6px blur so glass card blurs page content ── */}
      <div
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
        style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        className={`fixed inset-0 z-40 bg-black/25 backdrop-blur-[6px] transition-all duration-300 ease-out ${
          menuOpen ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible'
        }`}
      />

      {/* ── Floating Header & Dropdown Container ── */}
      <header className="fixed top-3.5 sm:top-4 inset-x-4 sm:inset-x-6 lg:inset-x-8 z-50 mx-auto w-auto max-w-full sm:max-w-[720px] lg:max-w-[1200px] pointer-events-none flex flex-col items-center">
        {/* Floating Pill Navbar: Glassmorphic rgba(255,255,255,0.6) / rgba(22,22,22,0.6) */}
        <nav
          ref={navContainerRef}
          aria-label="Main Navigation"
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
          className="pointer-events-auto w-full transition-all duration-300 ease-out bg-white/[0.60] dark:bg-[#161616]/[0.60] text-[#111111] dark:text-white rounded-[28px] sm:rounded-[32px] border border-white/60 dark:border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]"
        >
          <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6">
            {/* Left: Scholario logo & wordmark */}
            <Link
              to="/"
              onClick={handleHomeClick}
              className="flex items-center gap-2.5 shrink-0 rounded-2xl p-1 -ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230] active:scale-95 transition-transform"
              aria-label="Scholario — Home"
            >
              {/* Logo icon tile with subtle gold-tinted background and border (not cropped) */}
              <div
                style={{
                  backgroundColor: 'rgba(242,194,48,0.12)',
                  borderColor: 'rgba(242,194,48,0.35)',
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] border p-1 shrink-0 shadow-xs flex items-center justify-center"
              >
                <img
                  src="/logo.svg"
                  alt="Scholario"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/favicon.svg';
                  }}
                />
              </div>

              {/* Wordmark & Tagline */}
              <div className="flex flex-col leading-tight">
                <span className="font-extrabold tracking-tight text-base sm:text-lg text-[#111111] dark:text-white">
                  Scholario
                </span>
                <span className="hidden md:inline-block text-[8px] font-bold tracking-[0.16em] uppercase text-[#737373] dark:text-[#A3A3A3]">
                  LEARN · GROW · ACHIEVE
                </span>
              </div>
            </Link>

            {/* Desktop Center: Inline Links (Home, About Us, Leadership, Contact with gold underline on active) */}
            <div className="hidden lg:flex items-center gap-8">
              <Link
                to="/"
                onClick={handleHomeClick}
                className={`text-[14px] font-bold transition-all pb-1 ${
                  location.pathname === '/'
                    ? 'text-[#111111] dark:text-white border-b-2 border-[#F2C230]'
                    : 'text-[#666666] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white border-b-2 border-transparent'
                }`}
              >
                Home
              </Link>
              <button
                type="button"
                onClick={handleOpenAbout}
                className="text-[14px] font-bold text-[#666666] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white transition-all pb-1 cursor-pointer border-b-2 border-transparent"
              >
                About Us
              </button>
              <Link
                id="desktop-nav-leadership"
                to="/leadership"
                className={`text-[14px] font-bold transition-all pb-1 ${
                  location.pathname === '/leadership'
                    ? 'text-[#111111] dark:text-white border-b-2 border-[#F2C230]'
                    : 'text-[#666666] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white border-b-2 border-transparent'
                }`}
              >
                Leadership
              </Link>
              <button
                type="button"
                onClick={handleOpenContact}
                className="text-[14px] font-bold text-[#666666] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white transition-all pb-1 cursor-pointer border-b-2 border-transparent"
              >
                Contact
              </button>
            </div>

            {/* Desktop Right: Theme Toggle, Sign in, Register & Apply */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Compact theme toggle */}
              <div className="relative" ref={themeMenuRef}>
                <button
                  type="button"
                  onClick={() => setThemeDropdownOpen((p) => !p)}
                  aria-label="Toggle theme mode"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#111111] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
                >
                  {themeMode === 'dark' ? (
                    <Moon size={18} className="stroke-[2.2]" />
                  ) : themeMode === 'light' ? (
                    <Sun size={18} className="stroke-[2.2]" />
                  ) : (
                    <Laptop size={18} className="stroke-[2.2]" />
                  )}
                </button>

                {themeDropdownOpen && (
                  <div className="absolute right-0 top-11 p-1.5 rounded-2xl bg-white/95 dark:bg-[#161616]/95 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-xl flex flex-col gap-1 z-50 min-w-[130px] animate-in fade-in zoom-in-95">
                    {themeOptions.map(({ mode, label }) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setThemeMode(mode);
                          setThemeDropdownOpen(false);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-colors ${
                          themeMode === mode
                            ? 'bg-[#F2C230] text-[#111111]'
                            : 'text-[#737373] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <span>{label}</span>
                        {themeMode === mode && <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sign in outlined pill */}
              <button
                type="button"
                onClick={handleAuthAction}
                className="h-10 px-4 rounded-full border border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white text-xs sm:text-sm font-bold text-[#111111] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
              >
                {session ? 'Dashboard' : 'Sign in'}
              </button>

              {/* Register & Apply gold pill */}
              <Link
                to="/register"
                className="h-10 px-5 rounded-full bg-[#F2C230] hover:bg-[#E5B520] text-[#111111] font-extrabold text-xs sm:text-sm shadow-[0_2px_12px_rgba(242,194,48,0.3)] active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                Register &amp; Apply
              </Link>
            </div>

            {/* Mobile / Tablet Right: Hamburger / X button ONLY (Hidden on Desktop) */}
            <div className="flex items-center lg:hidden">
              <button
                id="mobile-menu-toggle"
                type="button"
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((prev) => !prev)}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-[#111111] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-90 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
              >
                {menuOpen ? (
                  <X size={22} className="stroke-[2.5]" />
                ) : (
                  <Menu size={22} className="stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* ── Compact Floating Dropdown Card: Frosted glass (Full width on mobile, max-width 420px aligned to the right on tablet, hidden on desktop) ── */}
        <div
          ref={menuCardRef}
          id="mobile-nav-card"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          style={{
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          }}
          className={`pointer-events-auto mt-2 w-full sm:self-end sm:max-w-[420px] lg:hidden bg-white/[0.55] dark:bg-[#161616]/[0.55] text-[#111111] dark:text-white rounded-[28px] border border-white/60 dark:border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.15)] max-h-[calc(100dvh-120px)] overflow-y-auto overscroll-contain transition-all duration-300 ease-out origin-top ${
            menuOpen
              ? 'opacity-100 translate-y-0 visible scale-100'
              : 'opacity-0 -translate-y-2 pointer-events-none invisible scale-[0.98]'
          }`}
        >
          <div className="p-5 flex flex-col">
            {/* 1. Navigation Links: Home, About Us, Leadership, Contact */}
            <nav aria-label="Overlay links" className="flex flex-col space-y-3 sm:space-y-3.5">
              {/* Home */}
              <div
                className={`transition-all duration-300 ease-out ${
                  menuOpen ? 'opacity-100 translate-y-0 delay-75' : 'opacity-0 translate-y-2'
                }`}
              >
                <Link
                  to="/"
                  onClick={handleHomeClick}
                  className={`w-full min-h-[48px] py-1 flex items-center justify-between text-left text-2xl sm:text-[26px] font-extrabold tracking-tight group active:scale-[0.98] transition-colors ${
                    location.pathname === '/'
                      ? 'text-[#D4A017] dark:text-[#F2C230]'
                      : 'text-[#111111] dark:text-white hover:text-[#D4A017] dark:hover:text-[#F2C230]'
                  }`}
                >
                  <span>Home</span>
                  <span
                    className={`text-xl sm:text-2xl group-hover:translate-x-1 transition-all ${
                      location.pathname === '/'
                        ? 'text-[#D4A017] dark:text-[#F2C230]'
                        : 'text-[#A3A3A3] group-hover:text-[#D4A017] dark:group-hover:text-[#F2C230]'
                    }`}
                  >
                    →
                  </span>
                </Link>
              </div>

              {/* About Us */}
              <div
                className={`transition-all duration-300 ease-out ${
                  menuOpen ? 'opacity-100 translate-y-0 delay-100' : 'opacity-0 translate-y-2'
                }`}
              >
                <button
                  type="button"
                  onClick={handleOpenAbout}
                  className="w-full min-h-[48px] py-1 flex items-center justify-between text-left text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#111111] dark:text-white hover:text-[#D4A017] dark:hover:text-[#F2C230] group active:scale-[0.98] transition-colors cursor-pointer"
                >
                  <span>About Us</span>
                  <span className="text-xl sm:text-2xl text-[#A3A3A3] group-hover:text-[#D4A017] dark:group-hover:text-[#F2C230] group-hover:translate-x-1 transition-all">
                    →
                  </span>
                </button>
              </div>

              {/* Leadership */}
              <div
                className={`transition-all duration-300 ease-out ${
                  menuOpen ? 'opacity-100 translate-y-0 delay-[125ms]' : 'opacity-0 translate-y-2'
                }`}
              >
                <Link
                  id="nav-leadership-link"
                  to="/leadership"
                  onClick={() => setMenuOpen(false)}
                  className={`w-full min-h-[48px] py-1 flex items-center justify-between text-left text-2xl sm:text-[26px] font-extrabold tracking-tight group active:scale-[0.98] transition-colors ${
                    location.pathname === '/leadership'
                      ? 'text-[#D4A017] dark:text-[#F2C230]'
                      : 'text-[#111111] dark:text-white hover:text-[#D4A017] dark:hover:text-[#F2C230]'
                  }`}
                >
                  <span>Leadership</span>
                  <span
                    className={`text-xl sm:text-2xl group-hover:translate-x-1 transition-all ${
                      location.pathname === '/leadership'
                        ? 'text-[#D4A017] dark:text-[#F2C230]'
                        : 'text-[#A3A3A3] group-hover:text-[#D4A017] dark:group-hover:text-[#F2C230]'
                    }`}
                  >
                    →
                  </span>
                </Link>
              </div>

              {/* Contact */}
              <div
                className={`transition-all duration-300 ease-out ${
                  menuOpen ? 'opacity-100 translate-y-0 delay-150' : 'opacity-0 translate-y-2'
                }`}
              >
                <button
                  type="button"
                  onClick={handleOpenContact}
                  className="w-full min-h-[48px] py-1 flex items-center justify-between text-left text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#111111] dark:text-white hover:text-[#D4A017] dark:hover:text-[#F2C230] group active:scale-[0.98] transition-colors cursor-pointer"
                >
                  <span>Contact</span>
                  <span className="text-xl sm:text-2xl text-[#A3A3A3] group-hover:text-[#D4A017] dark:group-hover:text-[#F2C230] group-hover:translate-x-1 transition-all">
                    →
                  </span>
                </button>
              </div>
            </nav>

            {/* 2. Thin divider line: rgba(0,0,0,0.08) in light, rgba(255,255,255,0.1) in dark */}
            <div
              className={`border-t border-black/[0.08] dark:border-white/[0.10] my-4 transition-all duration-300 ease-out ${
                menuOpen ? 'opacity-100 delay-[180ms]' : 'opacity-0'
              }`}
            />

            {/* 3. Action buttons (Sign in, Register & Apply, WhatsApp Admissions) */}
            <div
              className={`flex flex-col gap-2.5 transition-all duration-300 ease-out ${
                menuOpen ? 'opacity-100 translate-y-0 delay-200' : 'opacity-0 translate-y-2'
              }`}
            >
              {/* Sign in button: transparent background with 1px translucent border */}
              <button
                type="button"
                onClick={handleAuthAction}
                className="w-full h-12 min-h-[48px] rounded-full bg-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.08] border border-black/[0.15] dark:border-white/[0.20] text-[#111111] dark:text-white font-bold text-base active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
              >
                <LogIn size={18} />
                <span>{session ? 'Go to Dashboard' : 'Sign in'}</span>
              </button>

              {/* Register & Apply button: solid gold (#F2C230) with soft gold glow shadow */}
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="w-full h-12 min-h-[48px] rounded-full bg-[#F2C230] hover:bg-[#E5B520] text-[#111111] font-extrabold text-base shadow-[0_4px_16px_rgba(242,194,48,0.35)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                <UserPlus size={18} />
                <span>Register &amp; Apply</span>
              </Link>

              {/* WhatsApp Admissions link (green text, external link icon) */}
              <a
                href="https://wa.me/9230586969050?text=Hi%2C%20I%20have%20an%20inquiry%20regarding%20SHS%20Virtual%20Academy%20admissions."
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="min-h-[40px] pt-1 text-center text-[13px] sm:text-sm font-semibold text-[#128C7E] dark:text-[#25D366] hover:underline flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>WhatsApp Admissions: +92 305 86969050</span>
                <ExternalLink size={14} className="shrink-0" />
              </a>
            </div>

            {/* 4. Theme switcher (Light | Dark | System): translucent glass pill */}
            <div
              className={`mt-5 flex justify-center transition-all duration-300 ease-out ${
                menuOpen ? 'opacity-100 translate-y-0 delay-[240ms]' : 'opacity-0 translate-y-2'
              }`}
            >
              <div
                role="radiogroup"
                aria-label="Theme mode"
                className="inline-flex items-center h-10 p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.12] shadow-2xs"
              >
                {themeOptions.map(({ mode, label }) => {
                  const isActive = themeMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => setThemeMode(mode)}
                      className={`h-8 px-3.5 sm:px-4 rounded-full text-[13px] sm:text-sm font-bold transition-all cursor-pointer select-none flex items-center justify-center ${
                        isActive
                          ? 'bg-[#F2C230] text-[#111111] shadow-xs'
                          : 'text-[#737373] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Global Modals */}
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
};

export default Navbar;
