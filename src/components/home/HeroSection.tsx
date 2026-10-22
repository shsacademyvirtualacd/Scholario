import React from 'react';
import { ArrowRight, LogIn, Video, BookOpen, ClipboardCheck, UserCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardPreview from './DashboardPreview';
import { isRedesignEnabled } from '../../lib/featureFlags';
import { HeroSectionOld } from './HeroSectionOld';

interface HeroSectionProps {
  onNavigate: (page: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  if (!isRedesignEnabled()) {
    return <HeroSectionOld onNavigate={onNavigate} />;
  }

  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <section className="relative pt-[94px] sm:pt-[104px] pb-8 sm:pb-12 overflow-hidden bg-white dark:bg-[#0E0E0E] transition-colors">
      {/* ── Soft gold radial glow in top-right corner (blurred, ~40% opacity in light mode, dimmer in dark mode) ── */}
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 w-[360px] sm:w-[500px] md:w-[650px] h-[360px] sm:h-[500px] md:h-[650px] rounded-full pointer-events-none opacity-40 dark:opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(242,194,48,0.55) 0%, rgba(242,194,48,0.15) 50%, transparent 70%)',
        }}
      />

      {/* ── Subtle dot grid fading out toward the bottom ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-dot-pattern opacity-25 dark:opacity-15 pointer-events-none"
        style={{
          maskImage: 'linear-gradient(to bottom, black 25%, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 25%, transparent 85%)',
        }}
      />

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* ── 2-Column Grid on Desktop (55% / 45%), Stacked on Mobile & Tablet ── */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-10 lg:items-center">

          {/* Left Column (about 55% on desktop: col-span-7) */}
          <div className="lg:col-span-7 flex flex-col items-start md:items-center lg:items-start text-left md:text-center lg:text-left max-w-xl md:max-w-3xl lg:max-w-none mx-auto lg:mx-0">

            {/* ── 1. Compact Content-Width Glass Pill Badge ── */}
            <div className="hero-stagger-1 mb-5 self-start md:self-center lg:self-start w-fit max-w-full">
              <div className="inline-flex items-center gap-1.5 h-[32px] min-h-[32px] px-3 rounded-full bg-white/70 dark:bg-[#161616]/70 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.12] shadow-xs max-w-full">
                <Sparkles size={13} className="text-[#F2C230] shrink-0" />
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[13px] font-semibold text-[#333333] dark:text-[#E5E5E5] tracking-tight whitespace-nowrap truncate">
                  Official Portal · SHS Virtual Academy
                </span>
              </div>
            </div>

            {/* ── 2. Headline (Mobile ~30px, Tablet ~44px, Desktop ~56px) ── */}
            <h1 className="hero-stagger-2 text-[30px] min-[390px]:text-[34px] sm:text-[44px] lg:text-[56px] font-[800] leading-[1.12] tracking-[-0.02em] text-[#111111] dark:text-white mb-4 [text-wrap:balance]">
              The Official Virtual Academy Portal for{' '}
              <span className="relative inline-block text-[#D4A017] dark:text-[#F2C230] whitespace-nowrap">
                <span>SHS Virtual Academy</span>
                <svg
                  className="absolute -bottom-1 left-0 w-full overflow-visible pointer-events-none"
                  height="9"
                  viewBox="0 0 240 9"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M2 6.5 C60 1.5, 180 1.5, 238 5.5"
                    stroke="#F2C230"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="hero-swoosh-path"
                  />
                </svg>
              </span>
            </h1>

            {/* ── 3. Description ── */}
            <p className="hero-stagger-3 text-[15px] sm:text-[16px] lg:text-[17px] leading-[1.6] text-[#666666] dark:text-[#A3A3A3] max-w-[36ch] md:max-w-2xl lg:max-w-xl mb-6">
              Built exclusively for enrolled students — live Federal Board (<strong className="font-semibold text-[#111111] dark:text-white">FBISE</strong>), <strong className="font-semibold text-[#111111] dark:text-white">Punjab Board</strong>, <strong className="font-semibold text-[#111111] dark:text-white">Cambridge O/A Levels</strong>, and <strong className="font-semibold text-[#111111] dark:text-white">IELTS</strong> preparation with structured subject note vaults and daily timetables.
            </p>

            {/* ── 4. Buttons (Side by side auto width on tablet & desktop) ── */}
            <div className="hero-stagger-4 w-full sm:w-auto flex flex-col min-[340px]:flex-row gap-3 items-center justify-start md:justify-center lg:justify-start mb-5">
              <button
                id="hero-get-started-btn"
                type="button"
                onClick={handleGetStarted}
                className="w-full sm:w-auto min-[340px]:w-[58%] min-[340px]:flex-[6] sm:flex-initial h-[52px] min-h-[52px] px-6 rounded-full bg-[#F2C230] hover:bg-[#E5B520] text-[#111111] font-extrabold text-[15px] sm:text-base shadow-[0_4px_20px_rgba(242,194,48,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
              >
                <span>Get Started</span>
                <ArrowRight size={16} className="shrink-0" />
              </button>

              <button
                id="hero-signin-btn"
                type="button"
                onClick={handleSignIn}
                className="w-full sm:w-auto min-[340px]:w-[42%] min-[340px]:flex-[4] sm:flex-initial h-[52px] min-h-[52px] px-6 rounded-full bg-white/70 dark:bg-[#161616]/70 backdrop-blur-md border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 text-[#111111] dark:text-white font-bold text-[15px] sm:text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
              >
                <LogIn size={16} className="shrink-0" />
                <span>Sign in</span>
              </button>
            </div>

            {/* ── 5. Small Trust Row ── */}
            <div className="hero-stagger-5 flex items-center gap-2 text-[13px] text-[#737373] dark:text-[#A3A3A3] font-medium mb-6">
              <div className="flex -space-x-1.5 overflow-hidden">
                <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F2C230] text-[#111111] font-extrabold text-[9px] ring-2 ring-white dark:ring-[#0E0E0E]">
                  SA
                </div>
                <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#111111] text-white font-extrabold text-[9px] ring-2 ring-white dark:ring-[#0E0E0E]">
                  DM
                </div>
                <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#737373] text-white font-extrabold text-[9px] ring-2 ring-white dark:ring-[#0E0E0E]">
                  ZK
                </div>
              </div>
              <span>2,800+ active learners</span>
            </div>

            {/* ── 6. Feature Chips (4-col on tablet, 2x2 grid on desktop) ── */}
            <div className="hero-stagger-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 w-full max-w-xl md:max-w-3xl lg:max-w-md mb-8 lg:mb-0">
              <div className="h-[48px] min-h-[48px] px-3.5 rounded-2xl bg-white/70 dark:bg-[#161616]/70 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.12] shadow-xs flex items-center gap-2.5">
                <Video size={16} className="text-[#D4A017] dark:text-[#F2C230] shrink-0" />
                <span className="text-[14px] font-semibold text-[#111111] dark:text-white truncate">Live Classes</span>
              </div>

              <div className="h-[48px] min-h-[48px] px-3.5 rounded-2xl bg-white/70 dark:bg-[#161616]/70 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.12] shadow-xs flex items-center gap-2.5">
                <BookOpen size={16} className="text-[#D4A017] dark:text-[#F2C230] shrink-0" />
                <span className="text-[14px] font-semibold text-[#111111] dark:text-white truncate">Notes Vault</span>
              </div>

              <div className="h-[48px] min-h-[48px] px-3.5 rounded-2xl bg-white/70 dark:bg-[#161616]/70 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.12] shadow-xs flex items-center gap-2.5">
                <ClipboardCheck size={16} className="text-[#D4A017] dark:text-[#F2C230] shrink-0" />
                <span className="text-[14px] font-semibold text-[#111111] dark:text-white truncate">Test Assessments</span>
              </div>

              <div className="h-[48px] min-h-[48px] px-3.5 rounded-2xl bg-white/70 dark:bg-[#161616]/70 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.12] shadow-xs flex items-center gap-2.5">
                <UserCheck size={16} className="text-[#D4A017] dark:text-[#F2C230] shrink-0" />
                <span className="text-[14px] font-semibold text-[#111111] dark:text-white truncate">Real-time Attendance</span>
              </div>
            </div>

          </div>

          {/* Right Column (about 45% on desktop: col-span-5) */}
          <div className="hidden lg:flex lg:col-span-5 justify-end">
            <div className="w-full max-w-[520px] rounded-[32px] shadow-[0_20px_60px_rgba(242,194,48,0.18)] dark:shadow-[0_24px_64px_rgba(242,194,48,0.12)]">
              <DashboardPreview />
            </div>
          </div>

        </div>

        {/* ── Dashboard Preview on Mobile & Tablet (Centered, max-width 640px on tablet, hidden on desktop) ── */}
        <div className="relative max-w-xl sm:max-w-[640px] mx-auto lg:hidden mt-4 sm:mt-6">
          <DashboardPreview />
        </div>

        {/* ── Scroll hint ── */}
        <div className="flex justify-center mt-8 sm:mt-12 mb-2">
          <div className="flex flex-col items-center gap-1.5 text-[#A3A3A3] dark:text-[#737373]">
            <span className="text-[10px] font-bold tracking-widest uppercase">Scroll to explore</span>
            <div className="w-5 h-8 border border-[#D4D4D4] dark:border-[#333333] rounded-full flex items-start justify-center pt-1.5">
              <div
                className="w-1 h-2 bg-[#F2C230] rounded-full"
                style={{ animation: 'scrollHint 1.6s ease-in-out infinite' }}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Staggered entrance animations (60ms apart) */
        .hero-stagger-1 { animation: heroFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0ms both; }
        .hero-stagger-2 { animation: heroFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 60ms both; }
        .hero-stagger-3 { animation: heroFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 120ms both; }
        .hero-stagger-4 { animation: heroFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 180ms both; }
        .hero-stagger-5 { animation: heroFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 240ms both; }
        .hero-stagger-6 { animation: heroFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 300ms both; }

        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Subtle gold swoosh draw animation */
        .hero-swoosh-path {
          stroke-dasharray: 250;
          stroke-dashoffset: 250;
          animation: drawSwoosh 0.75s ease-out 0.35s forwards;
        }

        @keyframes drawSwoosh {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes scrollHint {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(7px); opacity: 0.25; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-stagger-1,
          .hero-stagger-2,
          .hero-stagger-3,
          .hero-stagger-4,
          .hero-stagger-5,
          .hero-stagger-6 {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .hero-swoosh-path {
            stroke-dashoffset: 0 !important;
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
