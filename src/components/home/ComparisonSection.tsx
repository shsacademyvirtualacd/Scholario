import React, { useState, useEffect, useRef } from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  'Modern, intuitive interface',
  "Built for Pakistan's curriculum",
  'Live class scheduling',
  'Real-time analytics & stats',
  'Academic Notes sharing',
  'Detailed attendance tracking',
  'Institutional broadcasts',
];

const COMPETITOR_DATA: Record<string, boolean[]> = {
  'Moodle': [false, false, true, true, true, true, true],
  'Google Classroom': [true, false, true, false, true, false, true],
  'Edmodo': [true, false, false, false, true, false, true],
};

const SCHOLARIO_VALUES = [true, true, true, true, true, true, true];

const COMPETITOR_OPTIONS = ['Moodle', 'Google Classroom', 'Edmodo'] as const;
type CompetitorName = (typeof COMPETITOR_OPTIONS)[number];

interface ComparisonSectionProps {
  onNavigate?: (page: string) => void;
}

const ComparisonSection: React.FC<ComparisonSectionProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorName>('Moodle');
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const [isInView, setIsInView] = useState<boolean>(false);
  const sectionRef = useRef<HTMLElement>(null);

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

  const handleCompetitorSelect = (comp: CompetitorName) => {
    if (comp === selectedCompetitor) return;
    setIsSwitching(true);
    setTimeout(() => {
      setSelectedCompetitor(comp);
      setIsSwitching(false);
    }, 120);
  };

  const handleGetStarted = () => {
    if (onNavigate) {
      onNavigate('register');
    } else {
      navigate('/register');
    }
  };

  const scholarioScore = SCHOLARIO_VALUES.filter(Boolean).length;
  const competitorValues = COMPETITOR_DATA[selectedCompetitor] || [];
  const competitorScore = competitorValues.filter(Boolean).length;

  return (
    <section
      ref={sectionRef}
      id="why-scholario-section"
      className="pt-14 sm:pt-18 pb-14 sm:pb-18 bg-white dark:bg-[#0E0E0E] text-[#111111] dark:text-white transition-colors relative overflow-hidden"
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      {/* ── Soft ambient glow ── */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[540px] h-[380px] sm:h-[540px] rounded-full pointer-events-none opacity-15 dark:opacity-10 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(242,194,48,0.55) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12">

        {/* ── 1. Section Header ── */}
        <div className="flex flex-col items-start md:items-center text-left md:text-center max-w-xl md:max-w-2xl mx-auto mb-8 sm:mb-10">
          <span className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#D4A017] dark:text-[#F2C230] mb-2">
            — WHY SCHOLARIO
          </span>
          <h2 className="text-[28px] sm:text-[36px] lg:text-[44px] font-[800] leading-[1.2] tracking-[-0.02em] text-[#111111] dark:text-white mb-3 [text-wrap:balance]">
            Built specifically{' '}
            <span className="text-[#D4A017] dark:text-[#F2C230]">for Pakistan</span>
          </h2>
          <p className="text-[15px] sm:text-[16px] lg:text-[17px] leading-[1.6] text-[#666666] dark:text-[#A3A3A3] max-w-[36ch] md:max-w-xl text-left md:text-center">
            Generic LMS platforms weren't built with Pakistani educators in mind. Scholario was.
          </p>
        </div>

        {/* ── 2. Glass Card Container (Mobile/Tablet: max-w 720px, Desktop: max-w 4xl) ── */}
        <div className="w-full max-w-2xl sm:max-w-[720px] lg:max-w-4xl mx-auto rounded-[24px] sm:rounded-[28px] bg-white/85 dark:bg-[#161616]/85 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.12] p-4 sm:p-6 lg:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.4)]">

          {/* ── Segmented Control (Mobile & Tablet ONLY: Hidden on Desktop) ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 mb-3 border-b border-black/[0.06] dark:border-white/[0.08] lg:hidden">
            <span className="text-xs font-bold text-[#737373] dark:text-[#A3A3A3] uppercase tracking-wider shrink-0">
              Compare with:
            </span>

            <div className="inline-flex p-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.12] overflow-x-auto no-scrollbar max-w-full">
              {COMPETITOR_OPTIONS.map((name) => {
                const isSelected = selectedCompetitor === name;
                return (
                  <button
                    key={name}
                    id={`compare-comp-btn-${name.toLowerCase().replace(/\s+/g, '-')}`}
                    type="button"
                    onClick={() => handleCompetitorSelect(name)}
                    className={`h-[36px] min-h-[36px] px-3.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                      isSelected
                        ? 'bg-[#111111] dark:bg-[#F2C230] text-white dark:text-[#111111] shadow-xs font-black'
                        : 'text-[#737373] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Summary Count Line for Mobile & Tablet ── */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs sm:text-[13px] font-semibold text-[#737373] dark:text-[#A3A3A3] mb-3 px-0.5 lg:hidden">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F2C230]/15 border border-[#F2C230]/30 text-[#111111] dark:text-[#F2C230] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F2C230]" />
              <span>Scholario: {scholarioScore} of {FEATURES.length} features</span>
            </div>

            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-xs transition-opacity duration-150 ${
                isSwitching ? 'opacity-30' : 'opacity-100'
              }`}
            >
              <span>{selectedCompetitor}: {competitorScore} of {FEATURES.length}</span>
            </div>
          </div>

          {/* ── 3A. Mobile & Tablet 3-Column Table (Feature 50% / Scholario 25% / Competitor 25%) ── */}
          <div className="w-full overflow-hidden lg:hidden">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr>
                  <th className="w-[50%] py-3 px-2 sm:px-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#737373] dark:text-[#A3A3A3] align-bottom">
                    Feature
                  </th>
                  <th className="w-[25%] py-3 px-1.5 sm:px-2 text-center align-bottom bg-[#F2C230]/[0.10] dark:bg-[#F2C230]/[0.12] border-x border-t border-[#F2C230]/35 rounded-t-[16px]">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F2C230] text-[#111111] shadow-xs mb-1">
                        Recommended
                      </span>
                      <span className="font-extrabold text-xs sm:text-sm text-[#111111] dark:text-white truncate">
                        Scholario
                      </span>
                    </div>
                  </th>
                  <th
                    className={`w-[25%] py-3 px-1.5 sm:px-2 text-center align-bottom transition-opacity duration-150 ${
                      isSwitching ? 'opacity-30' : 'opacity-100'
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm text-[#525252] dark:text-[#A3A3A3] truncate block">
                      {selectedCompetitor}
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {FEATURES.map((feature, fi) => {
                  const isCompetitorCheck = competitorValues[fi];
                  const isLastRow = fi === FEATURES.length - 1;

                  return (
                    <tr
                      key={feature}
                      style={{
                        transitionDelay: `${fi * 40}ms`,
                      }}
                      className={`h-[56px] border-b border-black/[0.06] dark:border-white/[0.08] transition-all duration-300 ${
                        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      }`}
                    >
                      <td className="py-3 px-2 sm:px-3 text-left">
                        <span className="text-[13px] sm:text-[14px] font-medium text-[#262626] dark:text-[#E5E5E5] line-clamp-2 leading-snug">
                          {feature}
                        </span>
                      </td>

                      <td
                        className={`py-3 px-1.5 sm:px-2 text-center bg-[#F2C230]/[0.10] dark:bg-[#F2C230]/[0.12] border-x border-[#F2C230]/35 ${
                          isLastRow ? 'border-b rounded-b-[16px]' : ''
                        }`}
                      >
                        <div className="w-6 h-6 min-w-[24px] min-h-[24px] rounded-full bg-[#F2C230] text-[#111111] flex items-center justify-center shadow-xs mx-auto">
                          <Check size={13} className="stroke-[3]" />
                        </div>
                      </td>

                      <td
                        className={`py-3 px-1.5 sm:px-2 text-center transition-opacity duration-150 ${
                          isSwitching ? 'opacity-30' : 'opacity-100'
                        }`}
                      >
                        {isCompetitorCheck ? (
                          <div className="flex justify-center text-emerald-600 dark:text-emerald-400 opacity-80">
                            <Check size={16} className="stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="flex justify-center text-[#A3A3A3] dark:text-[#666666] opacity-60">
                            <X size={15} className="stroke-[2]" />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── 3B. Desktop Full Table (ALL 5 Columns at once: Feature, Scholario, Moodle, Google Classroom, Edmodo) ── */}
          <div className="w-full overflow-hidden hidden lg:block">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr>
                  <th className="w-[36%] py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-[#737373] dark:text-[#A3A3A3] align-bottom">
                    Feature
                  </th>

                  {/* Scholario: Highlighted Gold Lane Header */}
                  <th className="w-[16%] py-3.5 px-2 text-center align-bottom bg-[#F2C230]/[0.10] dark:bg-[#F2C230]/[0.12] border-x border-t border-[#F2C230]/35 rounded-t-[16px]">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F2C230] text-[#111111] shadow-xs mb-1">
                        Recommended
                      </span>
                      <span className="font-extrabold text-sm text-[#111111] dark:text-white truncate">
                        Scholario
                      </span>
                    </div>
                  </th>

                  {/* Competitor Columns */}
                  {COMPETITOR_OPTIONS.map((name) => (
                    <th key={name} className="w-[16%] py-3.5 px-2 text-center align-bottom">
                      <span className="font-bold text-sm text-[#525252] dark:text-[#A3A3A3] truncate block">
                        {name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {FEATURES.map((feature, fi) => {
                  const isLastRow = fi === FEATURES.length - 1;

                  return (
                    <tr
                      key={feature}
                      className="h-[56px] border-b border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Feature name */}
                      <td className="py-3 px-4 text-left">
                        <span className="text-[14px] font-medium text-[#262626] dark:text-[#E5E5E5] line-clamp-2 leading-snug">
                          {feature}
                        </span>
                      </td>

                      {/* Scholario Gold Lane Column */}
                      <td
                        className={`py-3 px-2 text-center bg-[#F2C230]/[0.10] dark:bg-[#F2C230]/[0.12] border-x border-[#F2C230]/35 ${
                          isLastRow ? 'border-b rounded-b-[16px]' : ''
                        }`}
                      >
                        <div className="w-6 h-6 min-w-[24px] min-h-[24px] rounded-full bg-[#F2C230] text-[#111111] flex items-center justify-center shadow-xs mx-auto">
                          <Check size={13} className="stroke-[3]" />
                        </div>
                      </td>

                      {/* Other Competitor Columns */}
                      {COMPETITOR_OPTIONS.map((name) => {
                        const hasFeature = (COMPETITOR_DATA[name] || [])[fi];
                        return (
                          <td key={name} className="py-3 px-2 text-center">
                            {hasFeature ? (
                              <div className="flex justify-center text-emerald-600 dark:text-emerald-400 opacity-80">
                                <Check size={16} className="stroke-[2.5]" />
                              </div>
                            ) : (
                              <div className="flex justify-center text-[#A3A3A3] dark:text-[#666666] opacity-60">
                                <X size={15} className="stroke-[2]" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── 4. Full-width Gold Get Started Button (48px, Pill) ── */}
          <button
            id="comparison-get-started-btn"
            type="button"
            onClick={handleGetStarted}
            className="w-full h-12 min-h-[48px] rounded-full bg-[#F2C230] hover:bg-[#E5B520] text-[#111111] font-extrabold text-[15px] shadow-[0_4px_16px_rgba(242,194,48,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
          >
            <span>Get Started</span>
            <ArrowRight size={16} className="shrink-0" />
          </button>
        </div>

        {/* Small Footnote */}
        <p className="text-center text-xs text-[#A3A3A3] mt-5">
          Comparison based on publicly available information as of July 2025. Some features may vary by plan.
        </p>

      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          #why-scholario-section * {
            animation: none !important;
            transition-delay: 0ms !important;
            transition-duration: 0ms !important;
          }
        }
      `}</style>
    </section>
  );
};

export default ComparisonSection;
