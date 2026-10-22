import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Loader2, LogIn, UserPlus, MessageCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../ui/Logo';
import ThemeToggleSwitch from '../common/ThemeToggleSwitch';
import { useAuth } from '../../features/auth/AuthContext';
import { isRedesignEnabled } from '../../lib/featureFlags';
import { NavbarOld } from './NavbarOld';

interface NavbarProps {
  onNavigate?: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  if (!isRedesignEnabled()) {
    return <NavbarOld onNavigate={onNavigate} />;
  }

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const { signInWithGoogle, session, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close sheet on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleAuthAction = async () => {
    if (session) {
      if (profile?.role === 'admin') navigate('/admin');
      else if (profile?.role === 'teacher') navigate('/teacher');
      else navigate('/student');
      return;
    }
    navigate('/login');
  };

  const handleDirectGoogle = async () => {
    try {
      setSigningIn(true);
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in error:', err);
      setSigningIn(false);
    }
  };

  return (
    <>
      <nav
        aria-label="Main Navigation"
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 dark:bg-[#0D0D0D]/95 backdrop-blur-md border-b border-[#E5E5E5] dark:border-[#262626] shadow-xs'
            : 'bg-white/80 dark:bg-[#0D0D0D]/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-3">
            {/* ── Left Zone: Brand Logo ── */}
            <Link
              to="/"
              className="flex items-center gap-2 shrink-0 rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430] active:scale-95 transition-transform"
              aria-label="Scholario — Home"
            >
              <Logo size="md" variant="full" className="sm:hidden" />
              <Logo size="lg" variant="full" className="hidden sm:flex" />
            </Link>

            {/* ── Right Zone: Desktop Actions (768px+) ── */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggleSwitch variant="compact" />

              {!session ? (
                <>
                  <Link
                    to="/register"
                    className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-[#111111] dark:text-white hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] border border-transparent hover:border-[#E5E5E5] dark:hover:border-[#333333] transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
                  >
                    <UserPlus size={14} className="text-[#D4A017]" />
                    <span>Register & Apply</span>
                  </Link>

                  <button
                    id="desktop-signin-btn"
                    type="button"
                    onClick={handleAuthAction}
                    disabled={signingIn || authLoading}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#F0F0F0] text-white dark:text-[#111111] text-xs font-extrabold shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
                  >
                    {signingIn ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                    <span>Sign in</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleAuthAction}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] text-xs font-black shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Go to Dashboard</span>
                </button>
              )}
            </div>

            {/* ── Right Zone: Mobile Controls (360px - 767px) ── */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggleSwitch variant="compact" />

              {/* Requirement: "Sign in" button VISIBLE ON MOBILE! */}
              <button
                id="mobile-header-signin-btn"
                type="button"
                onClick={handleAuthAction}
                aria-label="Sign in"
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#F0F0F0] text-white dark:text-[#111111] text-xs font-extrabold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
              >
                <LogIn size={13} />
                <span>{session ? 'Portal' : 'Sign in'}</span>
              </button>

              {/* Menu Sheet Toggle */}
              <button
                id="mobile-menu-toggle"
                type="button"
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={menuOpen}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] text-[#111111] dark:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu Sheet / Drawer (Close on outside tap & Esc) ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end animate-fade-in">
          {/* Backdrop (Outside tap closes menu) */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="relative w-full max-w-sm bg-white dark:bg-[#141414] text-[#111111] dark:text-white h-full shadow-2xl flex flex-col justify-between p-6 z-10 overflow-y-auto animate-in slide-in-from-right duration-200"
          >
            {/* Top Sheet Header */}
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-[#E5E5E5] dark:border-[#262626]">
                <Logo size="md" variant="full" />
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl p-2 hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Requirement: "Sign in" and "Register & Apply" as two clear buttons */}
              <div className="mt-6 space-y-3">
                <button
                  id="sheet-signin-btn"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleAuthAction();
                  }}
                  className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#F0F0F0] text-white dark:text-[#111111] font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.99]"
                >
                  <LogIn size={16} />
                  <span>{session ? 'Go to Dashboard' : 'Sign in'}</span>
                </button>

                <Link
                  id="sheet-register-btn"
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
                >
                  <UserPlus size={16} />
                  <span>Register & Apply</span>
                </Link>

                {/* Requirement: Consistent unified messaging (no mismatch) */}
                <p className="text-center text-[11px] text-[#737373] dark:text-[#A3A3A3] pt-1">
                  Existing members sign in · New students register and apply
                </p>
              </div>

              {/* Navigation Links */}
              <div className="mt-6 pt-5 border-t border-[#E5E5E5] dark:border-[#262626] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3] dark:text-[#737373] px-3 mb-2 block">
                  Institutional Information
                </span>

                <Link
                  to="/privacy"
                  onClick={() => setMenuOpen(false)}
                  className="min-h-[44px] px-3 py-2.5 text-sm font-semibold text-[#525252] dark:text-[#D4D4D4] hover:text-[#111111] dark:hover:text-white rounded-xl hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors flex items-center justify-between"
                >
                  <span>Privacy Policy</span>
                  <span className="text-xs text-[#A3A3A3]">→</span>
                </Link>

                <Link
                  to="/terms"
                  onClick={() => setMenuOpen(false)}
                  className="min-h-[44px] px-3 py-2.5 text-sm font-semibold text-[#525252] dark:text-[#D4D4D4] hover:text-[#111111] dark:hover:text-white rounded-xl hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors flex items-center justify-between"
                >
                  <span>Terms of Service</span>
                  <span className="text-xs text-[#A3A3A3]">→</span>
                </Link>

                <Link
                  to="/refund"
                  onClick={() => setMenuOpen(false)}
                  className="min-h-[44px] px-3 py-2.5 text-sm font-semibold text-[#525252] dark:text-[#D4D4D4] hover:text-[#111111] dark:hover:text-white rounded-xl hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors flex items-center justify-between"
                >
                  <span>Refund Policy</span>
                  <span className="text-xs text-[#A3A3A3]">→</span>
                </Link>

                {/* Requirement: WhatsApp admissions link */}
                <a
                  href="https://wa.me/9230586969050?text=Hi%2C%20I%20have%20an%20inquiry%20regarding%20SHS%20Virtual%20Academy%20admissions."
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="min-h-[44px] px-3 py-2.5 text-sm font-semibold text-[#128C7E] dark:text-[#25D366] rounded-xl hover:bg-[#25D366]/10 transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle size={16} />
                    <span>WhatsApp Admissions</span>
                  </span>
                  <ExternalLink size={14} className="text-[#25D366]" />
                </a>
              </div>
            </div>

            {/* Bottom Institutional Info */}
            <div className="pt-6 border-t border-[#E5E5E5] dark:border-[#262626]">
              <div className="flex items-center gap-2 text-[11px] text-[#737373] dark:text-[#A3A3A3] mb-1">
                <ShieldCheck size={14} className="text-[#F4C430]" />
                <span>SHS Virtual Academy · Rawalpindi, Pakistan</span>
              </div>
              <p className="text-[10px] text-[#A3A3A3] dark:text-[#525252]">
                © {new Date().getFullYear()} Scholario. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
