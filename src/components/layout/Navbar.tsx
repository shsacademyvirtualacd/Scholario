import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';

interface NavbarProps {
  onNavigate: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate: _onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] shadow-sm'
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

          {/* Right Column — Sign In + Sign Up */}
          <div className="hidden md:flex justify-end items-center gap-3">
            <Link
              to="/login"
              className="btn btn-ghost btn-sm"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn btn-primary btn-sm"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Toggle */}
          <div className="flex md:hidden justify-end">
            <button
              className="p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ outline: 'none' }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#E5E5E5] animate-fade-in">
          <div className="px-4 py-4 space-y-2">
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="btn btn-ghost btn-md w-full flex items-center justify-center"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileOpen(false)}
              className="btn btn-primary btn-md w-full flex items-center justify-center"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
