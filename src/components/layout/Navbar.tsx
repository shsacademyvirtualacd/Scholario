import React, { useState, useEffect } from 'react';
import { Menu, X, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../ui/Logo';
import ThemeToggleSwitch from '../common/ThemeToggleSwitch';
import { useAuth } from '../../features/auth/AuthContext';

interface NavbarProps {
  onNavigate?: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate: _onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  const { signInWithGoogle, session, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGoogleAuth = async () => {
    if (session) {
      if (profile?.role === 'admin') navigate('/admin');
      else if (profile?.role === 'teacher') navigate('/teacher');
      else navigate('/student');
      return;
    }

    try {
      setAuthenticating(true);
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in error:', err);
      setAuthenticating(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-[#111111]/95 backdrop-blur-md border-b border-[#E5E5E5] dark:border-[#262626] shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Balanced 3-column grid: empty | centered logo | right actions */}
        <div className="grid grid-cols-3 items-center h-20">

          {/* Left Column — empty spacer */}
          <div />

          {/* Center Column — Logo */}
          <div className="flex justify-center">
            <Link
              to="/"
              className="flex items-center gap-0"
              style={{ outline: 'none', border: 'none', boxShadow: 'none', WebkitTapHighlightColor: 'transparent' }}
            >
              <Logo size="lg" variant="full" />
            </Link>
          </div>

          {/* Right Column — Theme Toggle + Single Unified CTA */}
          <div className="hidden md:flex justify-end items-center gap-4">
            <ThemeToggleSwitch variant="compact" />
            
            <div className="flex flex-col items-end">
              <button
                id="desktop-auth-btn"
                type="button"
                onClick={handleGoogleAuth}
                disabled={authenticating || authLoading}
                className="btn btn-primary btn-sm interactive flex items-center gap-2"
              >
                {authenticating ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>{session ? 'Go to Dashboard' : 'Get Started'}</span>
              </button>

              {!session && (
                <span className="text-[11px] text-[#737373] dark:text-[#A3A3A3] mt-1 tracking-tight">
                  Don't have an account?{' '}
                  <button
                    id="desktop-create-account-link"
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={authenticating || authLoading}
                    className="font-semibold text-[#D4A017] hover:underline cursor-pointer"
                  >
                    Create one
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Mobile Toggle */}
          <div className="flex md:hidden justify-end items-center gap-2">
            <ThemeToggleSwitch variant="compact" />
            <button
              id="mobile-menu-toggle"
              aria-label="Toggle Menu"
              className="p-2 rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors interactive text-[#111111] dark:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ outline: 'none' }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Hamburger Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-[#171717] border-t border-[#E5E5E5] dark:border-[#262626] animate-fade-in shadow-xl">
          <div className="px-5 py-4 space-y-4">
            
            {/* Unified CTA Button */}
            <div>
              <button
                id="mobile-auth-btn"
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleGoogleAuth();
                }}
                disabled={authenticating || authLoading}
                className="btn btn-primary btn-md w-full flex items-center justify-center gap-2 font-semibold interactive shadow-sm"
              >
                {authenticating ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>{session ? 'Go to Dashboard' : 'Get Started'}</span>
              </button>

              {!session && (
                <p className="text-center text-xs text-[#737373] dark:text-[#A3A3A3] mt-2.5">
                  Don't have an account?{' '}
                  <button
                    id="mobile-create-account-link"
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      handleGoogleAuth();
                    }}
                    disabled={authenticating || authLoading}
                    className="font-semibold text-[#D4A017] hover:underline cursor-pointer"
                  >
                    Create one
                  </button>
                </p>
              )}
            </div>

            {/* Subtle Divider */}
            <div className="border-t border-[#E5E5E5] dark:border-[#262626] pt-3">
              <div className="flex flex-col space-y-1">
                <Link
                  id="mobile-privacy-policy-link"
                  to="/privacy"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-[#525252] dark:text-[#D4D4D4] hover:text-[#111111] dark:hover:text-white rounded-xl hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors flex items-center justify-between"
                >
                  <span>Privacy Policy</span>
                  <span className="text-xs text-[#A3A3A3]">→</span>
                </Link>
                <Link
                  id="mobile-terms-service-link"
                  to="/terms"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-[#525252] dark:text-[#D4D4D4] hover:text-[#111111] dark:hover:text-white rounded-xl hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors flex items-center justify-between"
                >
                  <span>Terms of Service</span>
                  <span className="text-xs text-[#A3A3A3]">→</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
