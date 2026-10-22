import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AboutModal } from '../ui/AboutModal';
import { ContactModal } from '../ui/ContactModal';

const SocialIcon: React.FC<{ name: string }> = ({ name }) => {
  const icons: Record<string, React.ReactNode> = {
    instagram: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    youtube: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  };
  return <>{icons[name] ?? null}</>;
};

interface FooterProps {
  onOpenAbout?: () => void;
  onOpenContact?: () => void;
  onNavigate?: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenAbout, onOpenContact }) => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const handleOpenAbout = () => {
    if (onOpenAbout) {
      onOpenAbout();
    } else {
      setAboutOpen(true);
    }
  };

  const handleOpenContact = () => {
    if (onOpenContact) {
      onOpenContact();
    } else {
      setContactOpen(true);
    }
  };

  return (
    <>
      {/* 
        Full-width solid brand-colored block with a very large rounded top 
        (border-radius ~48-64px on top-left and top-right).
        In both light and dark mode, we keep Scholario's gold (#F2C230) background with black/dark text.
      */}
      <footer
        className="w-full bg-[#F2C230] text-[#111111] rounded-t-[48px] sm:rounded-t-[64px] overflow-hidden pt-12 sm:pt-16 pb-0 relative shadow-[0_-12px_48px_rgba(242,194,48,0.22)]"
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10">
          {/* ── Top Section & Columns ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Top Left Brand Section */}
            <div className="lg:col-span-6 space-y-4">
              {/* Scholario Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#111111] p-1.5 shadow-sm flex items-center justify-center shrink-0">
                  <img
                    src="/logo.svg"
                    alt="Scholario"
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/favicon.svg';
                    }}
                  />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#111111]">
                    Scholario
                  </span>
                  <span className="text-[9px] font-bold tracking-[0.16em] uppercase text-black/75 mt-1">
                    LEARN · GROW · ACHIEVE
                  </span>
                </div>
              </div>

              {/* Short Description */}
              <p className="text-sm sm:text-base font-semibold text-[#111111] leading-relaxed max-w-md pt-1">
                Scholario: Pakistan's premier Learning Management System, built exclusively for{' '}
                <button
                  type="button"
                  onClick={handleOpenAbout}
                  className="font-black underline underline-offset-2 hover:opacity-75 transition-opacity cursor-pointer inline"
                >
                  SHS Virtual Academy
                </button>{' '}
                students, faculty, and parents.
              </p>

              {/* Precision Subtext */}
              <p className="text-xs sm:text-sm font-bold text-black/75">
                Built with precision for learners across Pakistan.
              </p>
            </div>

            {/* Link Sections: Stacked in a clean 2-column grid on mobile */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-6 sm:gap-10">
              {/* Column 1: Company */}
              <div>
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-black/85 mb-4 sm:mb-5">
                  Company
                </h4>
                <ul className="space-y-3 sm:space-y-3.5">
                  <li>
                    <button
                      type="button"
                      onClick={handleOpenAbout}
                      className="text-base sm:text-lg font-bold text-[#111111] hover:text-black/70 transition-colors inline-block py-1 cursor-pointer"
                    >
                      About Us
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={handleOpenContact}
                      className="text-base sm:text-lg font-bold text-[#111111] hover:text-black/70 transition-colors inline-block py-1 cursor-pointer"
                    >
                      Contact
                    </button>
                  </li>
                </ul>
              </div>

              {/* Column 2: Legal & trust */}
              <div>
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-black/85 mb-4 sm:mb-5">
                  Legal &amp; trust
                </h4>
                <ul className="space-y-3 sm:space-y-3.5">
                  <li>
                    <Link
                      id="footer-privacy-link"
                      to="/privacy"
                      className="text-base sm:text-lg font-bold text-[#111111] hover:text-black/70 transition-colors inline-block py-1"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      id="footer-terms-link"
                      to="/terms"
                      className="text-base sm:text-lg font-bold text-[#111111] hover:text-black/70 transition-colors inline-block py-1"
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      id="footer-refund-link"
                      to="/refund"
                      className="text-base sm:text-lg font-bold text-[#111111] hover:text-black/70 transition-colors inline-block py-1"
                    >
                      Refund Policy
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={handleOpenAbout}
                      className="text-base sm:text-lg font-bold text-[#111111] hover:text-black/70 transition-colors inline-flex items-center gap-1.5 py-1 cursor-pointer group"
                    >
                      <span>SHS Virtual Academy</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                  </li>
                </ul>

                {/* Disclaimer */}
                <p className="mt-4 sm:mt-5 text-[11px] sm:text-xs font-semibold text-black/75 leading-relaxed">
                  Digital-first online institution. No physical public campus.
                </p>
              </div>
            </div>
          </div>

          {/* ── Thin Divider Line ── */}
          <div className="border-t border-black/15 my-8 sm:my-10" />

          {/* ── Centered Copyright ── */}
          <div className="text-center">
            <p className="text-xs sm:text-sm font-bold text-[#111111]/90">
              © 2026 Scholario. All rights reserved. Made with ❤️ in Pakistan.
            </p>
          </div>

          {/* ── Contact Row under it with dot separators & social icons ── */}
          <div className="mt-3 sm:mt-4 text-center">
            <div className="text-xs sm:text-sm font-semibold text-black/85 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>
                Phone / WhatsApp:{' '}
                <a
                  href="https://wa.me/9230586969050?text=Hi%2C%20I%20have%20an%20inquiry%20regarding%20SHS%20Virtual%20Academy%20admissions."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-black underline underline-offset-2 hover:opacity-75 transition-opacity"
                >
                  +92 305 86969050
                </a>
              </span>
              <span className="hidden sm:inline" aria-hidden="true">•</span>
              <a
                href="mailto:shs.academy.virtual@gmail.com"
                className="hover:underline hover:opacity-75 transition-opacity"
              >
                shs.academy.virtual@gmail.com
              </a>
              <span className="hidden sm:inline" aria-hidden="true">•</span>
              <span>Asia/Karachi (PKT)</span>
            </div>

            {/* Social Icons: Instagram & YouTube */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <a
                href="https://www.instagram.com/shs_academy?igsh=MXR2c2NuZDFwd3RsMQ=="
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Scholario Instagram"
                title="Instagram"
                className="w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 text-[#111111] flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <SocialIcon name="instagram" />
              </a>
              <a
                href="https://youtube.com/@shsacademy-w5x?si=5pBN6W4zd1wRgUhw"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Scholario YouTube"
                title="YouTube"
                className="w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 text-[#111111] flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <SocialIcon name="youtube" />
              </a>
            </div>
          </div>
        </div>

        {/* ── Giant Full-Width "Scholario" Wordmark at bottom ── */}
        <div className="w-full overflow-hidden select-none pointer-events-none mt-6 sm:mt-10 -mb-2 sm:-mb-5 md:-mb-8 text-center leading-none">
          <span
            className="inline-block text-[15.5vw] font-black tracking-[-0.04em] leading-[0.74] text-black/95 uppercase whitespace-nowrap"
            style={{
              fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
            }}
          >
            SCHOLARIO
          </span>
        </div>
      </footer>

      {/* Global Modals for About & Contact */}
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
};

export default Footer;
