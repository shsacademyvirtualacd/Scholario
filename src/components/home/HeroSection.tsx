import React from 'react';
import { ArrowRight, LogIn, Video, BookOpen, ClipboardCheck, UserCheck, Shield, Sparkles } from 'lucide-react';
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
    <section className="relative pt-24 sm:pt-28 lg:pt-32 pb-16 overflow-hidden bg-white dark:bg-[#0D0D0D] transition-colors">
      {/* Background dot pattern */}
      <div
        className="absolute inset-0 bg-dot-pattern opacity-40 dark:opacity-20 pointer-events-none"
        style={{
          maskImage: 'radial-gradient(ellipse 90% 80% at 50% 25%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 25%, black 40%, transparent 100%)',
        }}
      />

      {/* Gold ambient glow — top */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '450px',
          background: 'radial-gradient(ellipse, rgba(244,196,48,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Kicker badge */}
        <div className="flex justify-center mb-6 sm:mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#1A1A1A] shadow-xs">
            <span
              className="flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold shrink-0 bg-[#F4C430] text-[#111111]"
            >
              <Sparkles size={9} />
            </span>
            <span className="text-xs font-semibold text-[#525252] dark:text-[#D4D4D4] tracking-tight">
              Official Virtual Portal for SHS Virtual Academy
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-8 max-w-4xl mx-auto animate-fade-up">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-black tracking-tight text-[#111111] dark:text-white leading-[1.08] mb-5">
            The Official Virtual Academy Portal for{' '}
            <span className="relative inline-block whitespace-nowrap">
              <span className="text-[#D4A017] dark:text-[#F4C430]">SHS Virtual Academy</span>
              <svg
                className="absolute w-full"
                style={{ bottom: '-5px', left: 0 }}
                height="8"
                viewBox="0 0 200 8"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M0 6 Q50 1 100 5 Q150 9 200 4"
                  stroke="#F4C430"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              </svg>
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[#737373] dark:text-[#A3A3A3] font-normal leading-relaxed max-w-2xl mx-auto">
            Built exclusively for enrolled students — live Federal Board (FBISE), Punjab Board, Cambridge O/A Levels, and IELTS preparation with structured subject note vaults and daily timetables.
          </p>
        </div>

        {/* CTA Buttons: Primary "Get Started" + Secondary "Sign in" */}
        <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center mb-10 animate-fade-up">
          <button
            id="hero-get-started-btn"
            type="button"
            onClick={handleGetStarted}
            className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-2xl bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] font-extrabold text-sm shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
          >
            <span>Get Started</span>
            <ArrowRight size={16} />
          </button>

          <button
            id="hero-signin-btn"
            type="button"
            onClick={handleSignIn}
            className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-2xl border border-[#D4D4D4] dark:border-[#333333] bg-white dark:bg-[#1A1A1A] hover:bg-[#F5F5F5] dark:hover:bg-[#262626] text-[#111111] dark:text-white font-bold text-sm shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
          >
            <LogIn size={15} />
            <span>Sign in</span>
          </button>
        </div>

        {/* Short Trust Row: Live classes, notes vault, tests, attendance */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-12 sm:mb-14 text-xs font-semibold text-[#525252] dark:text-[#A3A3A3] animate-fade-up">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] border border-[#E5E5E5] dark:border-[#262626]">
            <Video size={14} className="text-[#D4A017]" />
            <span>Live Classes</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] border border-[#E5E5E5] dark:border-[#262626]">
            <BookOpen size={14} className="text-[#D4A017]" />
            <span>Notes Vault</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] border border-[#E5E5E5] dark:border-[#262626]">
            <ClipboardCheck size={14} className="text-[#D4A017]" />
            <span>Test Assessments</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] border border-[#E5E5E5] dark:border-[#262626]">
            <UserCheck size={14} className="text-[#D4A017]" />
            <span>Real-time Attendance</span>
          </div>
        </div>

        {/* Single Clean Interactive Dashboard Preview Mockup */}
        <div className="relative max-w-6xl mx-auto animate-fade-up">
          <DashboardPreview />
        </div>

        {/* Scroll hint with generous non-overlapping margin */}
        <div className="flex justify-center mt-12 sm:mt-16 mb-4">
          <div className="flex flex-col items-center gap-1.5 text-[#A3A3A3] dark:text-[#737373]">
            <span className="text-[10px] font-bold tracking-widest uppercase">Scroll to explore</span>
            <div className="w-5 h-8 border border-[#D4D4D4] dark:border-[#333333] rounded-full flex items-start justify-center pt-1.5">
              <div
                className="w-1 h-2 bg-[#F4C430] rounded-full"
                style={{ animation: 'scrollHint 1.6s ease-in-out infinite' }}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scrollHint {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(7px); opacity: 0.25; }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
