import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, ShieldCheck } from 'lucide-react';
import Logo from '../ui/Logo';

interface NavbarProps {
  onNavigate: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', dropdown: true },
    { label: 'For Educators', page: 'home' },
    { label: 'For Students', page: 'home' },
    { label: 'Pricing', page: 'home' },
    { label: 'Blog', page: 'home' },
  ];

  const features = [
    { icon: '📚', title: 'Course Builder', desc: 'Create rich learning experiences' },
    { icon: '📊', title: 'Analytics', desc: 'Track progress in real-time' },
    { icon: '🎯', title: 'Assessments', desc: 'Smart quizzes & assignments' },
    { icon: '🏆', title: 'Certificates', desc: 'Verified digital credentials' },
    { icon: '💬', title: 'Live Classes', desc: 'Integrated video conferencing' },
    { icon: '📱', title: 'Mobile App', desc: 'Learn anywhere, anytime' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-0 cursor-pointer bg-transparent border-none p-0"
          >
            <Logo size="md" variant="full" />
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.dropdown ? (
                <div key={link.label} className="relative">
                  <button
                    className="flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-medium text-[#525252] hover:text-[#111111] hover:bg-[#F5F5F5] transition-all duration-200"
                    onMouseEnter={() => setFeaturesOpen(true)}
                    onMouseLeave={() => setFeaturesOpen(false)}
                  >
                    {link.label}
                    <ChevronDown size={14} className={`transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {featuresOpen && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-[#E5E5E5] rounded-xl shadow-xl p-3 w-[480px] grid grid-cols-2 gap-1"
                      onMouseEnter={() => setFeaturesOpen(true)}
                      onMouseLeave={() => setFeaturesOpen(false)}
                    >
                      {features.map((f) => (
                        <button
                          key={f.title}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#FAFAFA] transition-all duration-150 text-left w-full"
                        >
                          <span className="text-lg mt-0.5">{f.icon}</span>
                          <div>
                            <div className="text-sm font-600 text-[#111111] font-semibold">{f.title}</div>
                            <div className="text-xs text-[#737373] mt-0.5">{f.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  key={link.label}
                  onClick={() => onNavigate(link.page || 'home')}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#525252] hover:text-[#111111] hover:bg-[#F5F5F5] transition-all duration-200"
                >
                  {link.label}
                </button>
              )
            )}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {/* Admin Panel — prototype shortcut */}
            <button
              onClick={() => onNavigate('admin')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5] hover:border-[#D4D4D4] transition-all duration-200"
              title="Prototype: Access Admin Panel"
            >
              <ShieldCheck size={14} className="text-[#F4C430]" />
              Admin Panel
            </button>
            <button
              onClick={() => onNavigate('student')}
              className="btn btn-ghost btn-sm"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate('student')}
              className="btn btn-primary btn-sm"
            >
              Get Started Free
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#E5E5E5] animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => { onNavigate(link.page || 'home'); setMobileOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-[#525252] hover:text-[#111111] hover:bg-[#F5F5F5] transition-all"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-3 space-y-2 border-t border-[#F5F5F5] mt-3">
              <button
                onClick={() => { onNavigate('admin'); setMobileOpen(false); }}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold border border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5] transition-all"
              >
                <ShieldCheck size={14} className="text-[#F4C430]" />
                Admin Panel
              </button>
              <button onClick={() => { onNavigate('student'); setMobileOpen(false); }} className="btn btn-ghost btn-md w-full">
                Sign In
              </button>
              <button onClick={() => { onNavigate('student'); setMobileOpen(false); }} className="btn btn-primary btn-md w-full">
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
