import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, BookOpen, BarChart2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Create Your Account',
    description: 'Sign up in under 60 seconds. No credit card required. Choose between educator, student, or institution roles.',
  },
  {
    number: '02',
    icon: BookOpen,
    title: 'Manage or Access Courses',
    description: 'Educators organize classes and resource materials. Students view and access their active enrolled subjects.',
  },
  {
    number: '03',
    icon: BarChart2,
    title: 'Track Progress in Real-Time',
    description: 'Monitor course metrics, grading charts, and class attendance records with active live dashboards.',
  },
];

interface HowItWorksSectionProps {
  onNavigate?: (page: string) => void;
}

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [lineProgress, setLineProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Viewport entrance observer for staggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentSection = sectionRef.current;
    if (currentSection) {
      observer.observe(currentSection);
    }

    return () => {
      if (currentSection) observer.unobserve(currentSection);
    };
  }, []);

  // Scroll listener to smoothly fill the gold timeline connecting line
  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const startTrigger = windowHeight * 0.75;
      const endTrigger = windowHeight * 0.35;
      const totalSpan = rect.height + (startTrigger - endTrigger);
      const scrolledSpan = startTrigger - rect.top;
      const pct = Math.min(Math.max((scrolledSpan / totalSpan) * 100, 0), 100);
      setLineProgress(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCreateAccount = () => {
    if (onNavigate) {
      onNavigate('register');
    } else {
      navigate('/register');
    }
  };

  return (
    <section
      ref={sectionRef}
      id="how-it-works-section"
      className="pt-14 sm:pt-20 lg:pt-24 pb-14 sm:pb-20 lg:pb-24 bg-white dark:bg-[#0E0E0E] text-[#111111] dark:text-white relative overflow-hidden transition-colors"
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      {/* ── Soft gold radial glow behind the timeline ── */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[520px] lg:w-[700px] h-[340px] sm:h-[520px] lg:h-[700px] rounded-full pointer-events-none opacity-15 dark:opacity-10 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(242,194,48,0.55) 0%, rgba(242,194,48,0.15) 50%, transparent 70%)',
        }}
      />

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12">

        {/* ── 1. Section Header ── */}
        <div className="flex flex-col items-start md:items-center text-left md:text-center max-w-xl md:max-w-2xl mx-auto mb-8 sm:mb-10 lg:mb-14">
          <span className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#D4A017] dark:text-[#F2C230] mb-2">
            — HOW IT WORKS
          </span>
          <h2 className="text-[28px] sm:text-[36px] lg:text-[44px] font-[800] leading-[1.2] tracking-[-0.02em] text-[#111111] dark:text-white mb-3 [text-wrap:balance]">
            Up and running{' '}
            <span className="text-[#D4A017] dark:text-[#F2C230]">in minutes</span>
          </h2>
          <p className="text-[15px] sm:text-[16px] lg:text-[17px] leading-[1.6] text-[#666666] dark:text-[#A3A3A3] max-w-[36ch] md:max-w-xl text-left md:text-center">
            Scholario is designed to be immediately intuitive — no training, no onboarding calls, no waiting.
          </p>
        </div>

        {/* ── 2A. Tablet & Mobile: Vertical Timeline (centered, max-width 640px) ── */}
        <div ref={timelineRef} className="lg:hidden relative max-w-xl sm:max-w-[640px] mx-auto mb-8">
          {/* Background track line */}
          <div
            aria-hidden="true"
            className="absolute left-[17px] top-6 bottom-6 w-[2px] bg-[#F2C230]/30 rounded-full"
          />

          {/* Active fill line */}
          <div
            aria-hidden="true"
            className="absolute left-[17px] top-6 w-[2px] bg-[#F2C230] rounded-full transition-all duration-150 ease-out timeline-progress-line"
            style={{
              height: `${lineProgress}%`,
              maxHeight: 'calc(100% - 48px)',
            }}
          />

          {/* 3 Step Cards */}
          <div className="space-y-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  style={{
                    transitionDelay: `${i * 80}ms`,
                  }}
                  className={`relative flex items-start gap-3 sm:gap-4 group transition-all duration-300 ease-out ${
                    isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                >
                  {/* 36px Numbered Circle */}
                  <div className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-[#F2C230] text-[#111111] font-black text-sm flex items-center justify-center shadow-md ring-4 ring-white dark:ring-[#0E0E0E] shrink-0 z-10 mt-3 transition-transform duration-200 group-hover:scale-105">
                    {i + 1}
                  </div>

                  {/* Glass Card */}
                  <div className="flex-1 min-w-0 rounded-[20px] bg-white/85 dark:bg-[#161616]/85 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.1] p-4 sm:p-5 shadow-xs hover:border-[#F2C230]/50 transition-all duration-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 min-w-[40px] rounded-xl bg-[#F2C230]/15 dark:bg-[#F2C230]/20 border border-[#F2C230]/30 text-[#D4A017] dark:text-[#F2C230] flex items-center justify-center shrink-0">
                        <Icon size={20} className="stroke-[2.2]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#737373] dark:text-[#A3A3A3] block mb-1">
                          STEP {step.number}
                        </span>
                        <h3 className="text-[17px] font-bold text-[#111111] dark:text-white leading-snug line-clamp-2 mb-1.5 group-hover:text-[#D4A017] dark:group-hover:text-[#F2C230] transition-colors">
                          {step.title}
                        </h3>
                        <p className="text-[14px] leading-[1.5] text-[#666666] dark:text-[#A3A3A3] line-clamp-3">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 2B. Desktop: Horizontal 3-Step Layout in a Row with Gold Progress Line Across the Top ── */}
        <div className="hidden lg:block relative mb-12">
          {/* Background horizontal track line across top */}
          <div
            aria-hidden="true"
            className="absolute top-[22px] left-[16%] right-[16%] h-[2px] bg-[#F2C230]/25 rounded-full"
          />

          {/* Active fill line */}
          <div
            aria-hidden="true"
            className="absolute top-[22px] left-[16%] h-[2px] bg-[#F2C230] rounded-full transition-all duration-200"
            style={{
              width: `${(lineProgress / 100) * 68}%`,
            }}
          />

          <div className="grid grid-cols-3 gap-6 relative z-10">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  style={{
                    transitionDelay: `${i * 100}ms`,
                  }}
                  className={`flex flex-col items-center text-center group transition-all duration-300 ease-out ${
                    isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                >
                  {/* Step Number Badge centered on track line */}
                  <div className="w-11 h-11 rounded-full bg-[#F2C230] text-[#111111] font-black text-sm flex items-center justify-center shadow-md ring-4 ring-white dark:ring-[#0E0E0E] mb-5 transition-transform duration-200 group-hover:scale-110">
                    {i + 1}
                  </div>

                  {/* Glass Card */}
                  <div className="w-full h-full rounded-[24px] bg-white/85 dark:bg-[#161616]/85 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.1] p-6 shadow-xs hover:border-[#F2C230]/50 transition-all duration-200 flex flex-col items-center justify-start text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#F2C230]/15 dark:bg-[#F2C230]/20 border border-[#F2C230]/30 text-[#D4A017] dark:text-[#F2C230] flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                      <Icon size={24} className="stroke-[2.2]" />
                    </div>

                    <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#737373] dark:text-[#A3A3A3] block mb-1">
                      STEP {step.number}
                    </span>

                    <h3 className="text-[18px] font-bold text-[#111111] dark:text-white leading-snug mb-2 group-hover:text-[#D4A017] dark:group-hover:text-[#F2C230] transition-colors">
                      {step.title}
                    </h3>

                    <p className="text-[14px] leading-[1.6] text-[#666666] dark:text-[#A3A3A3]">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 3. Call to Action Card (Full width on Desktop: Text Left, Button Right) ── */}
        <div className="w-full max-w-xl md:max-w-2xl lg:max-w-none mx-auto rounded-[28px] bg-gradient-to-br from-[#F2C230] to-[#E0A800] p-6 sm:p-8 lg:p-10 text-[#111111] shadow-[0_12px_40px_rgba(242,194,48,0.28)] relative overflow-hidden">
          {/* Subtle ambient light shape */}
          <div
            aria-hidden="true"
            className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/20 blur-2xl pointer-events-none"
          />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 text-left">
            <div>
              <h3 className="text-[22px] sm:text-[26px] lg:text-[28px] font-extrabold text-[#111111] tracking-tight leading-tight mb-2">
                Ready to get started?
              </h3>
              <p className="text-[15px] sm:text-[16px] leading-relaxed text-[#111111]/75 max-w-xl">
                Create your account today and start tracking your education.
              </p>
            </div>

            <button
              id="how-it-works-create-account-btn"
              type="button"
              onClick={handleCreateAccount}
              className="w-full lg:w-auto h-[52px] min-h-[52px] px-8 rounded-full bg-[#111111] hover:bg-black/90 active:scale-[0.98] text-white font-extrabold text-[15px] sm:text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>Create Account</span>
              <ArrowRight size={17} className="text-[#F2C230] shrink-0" />
            </button>
          </div>
        </div>

      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          #how-it-works-section * {
            animation: none !important;
            transition-delay: 0ms !important;
          }
          .timeline-progress-line {
            height: 100% !important;
          }
        }
      `}</style>
    </section>
  );
};

export default HowItWorksSection;
