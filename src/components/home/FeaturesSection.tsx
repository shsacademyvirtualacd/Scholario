import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Video, LayoutDashboard, FileText, Bell, ClipboardList, Bot, ArrowRight
} from 'lucide-react';

interface FeatureItem {
  icon: React.ComponentType<{ size?: number | string; className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  tag: string;
}

const ALL_FEATURES: FeatureItem[] = [
  {
    icon: Bot,
    title: 'Sage AI Academic Assistant',
    description: 'Advanced AI tutor with multimodal document and diagram analysis, intelligent curriculum semantic search across Subject Note Vault materials, and real-time page-aware context.',
    tag: 'AI',
  },
  {
    icon: LayoutDashboard,
    title: 'Interactive Dashboards',
    description: 'Track active courses, student grades, attendance records, and platform health at a glance with clean, dedicated views.',
    tag: 'Analytics',
  },
  {
    icon: BookOpen,
    title: 'Course Management',
    description: 'Organize study streams (ICS, Pre-Med, Pre-Eng), upload notes, share documents, and track individual course progress.',
    tag: 'Core',
  },
  {
    icon: Video,
    title: 'Live Class Scheduling',
    description: 'Check daily calendars for scheduled live lectures, interactive sessions, and recorded class links directly from the portal.',
    tag: 'Live',
  },
  {
    icon: ClipboardList,
    title: 'Attendance Tracking',
    description: 'Seamlessly record and review student attendance. Access attendance rate charts and trace remaining class slots dynamically.',
    tag: 'Management',
  },
  {
    icon: FileText,
    title: 'Resource Library',
    description: 'Access or share course-specific study resources, worksheets, past papers, syllabus files, and lecture notes instantly.',
    tag: 'Core',
  },
  {
    icon: Bell,
    title: 'Announcements Broadcast',
    description: 'Broadcast and read institution-wide updates filtered by categories, complete with unread notification badges.',
    tag: 'Communication',
  },
];

const CATEGORIES = ['All', 'Core', 'Analytics', 'Live', 'Management', 'Communication', 'AI'] as const;

const FeaturesSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [isInView, setIsInView] = useState<boolean>(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.08 }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  // Filter features based on active category
  const filteredFeatures = ALL_FEATURES.filter(
    (f) => activeCategory === 'All' || f.tag === activeCategory
  );

  // Sage AI feature for hero spot (when active or in 'All' view)
  const sageFeature = ALL_FEATURES.find((f) => f.title === 'Sage AI Academic Assistant');
  const showSageHero = sageFeature && (activeCategory === 'All' || activeCategory === 'AI');

  // Remaining features for the 2-column grid
  const gridFeatures = filteredFeatures.filter(
    (f) => !(showSageHero && f.title === 'Sage AI Academic Assistant')
  );

  return (
    <section
      ref={sectionRef}
      id="features-section"
      className="pt-14 sm:pt-20 lg:pt-24 pb-14 sm:pb-20 lg:pb-24 bg-white dark:bg-[#0E0E0E] text-[#111111] dark:text-white transition-colors relative"
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12">

        {/* ── 1. Section Header ── */}
        <div className="flex flex-col items-start md:items-center text-left md:text-center max-w-xl md:max-w-2xl mx-auto mb-6">
          <span className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#D4A017] dark:text-[#F2C230] mb-2">
            — FEATURES
          </span>
          <h2 className="text-[28px] sm:text-[36px] lg:text-[44px] font-[800] leading-[1.2] tracking-[-0.02em] text-[#111111] dark:text-white mb-3 [text-wrap:balance]">
            Everything you need to run a{' '}
            <span className="text-[#D4A017] dark:text-[#F2C230]">modern institution</span>
          </h2>
          <p className="text-[15px] sm:text-[16px] lg:text-[17px] leading-[1.6] text-[#666666] dark:text-[#A3A3A3] max-w-[36ch] md:max-w-xl text-left md:text-center">
            Scholario is the complete operating system for modern education — designed from the ground up for the Pakistani context.
          </p>
        </div>

        {/* ── 2. Filters (Single row on tablet & desktop, horizontally scrollable on mobile) ── */}
        <div className="sticky top-[68px] sm:top-[74px] z-30 py-2.5 -mx-4 px-4 sm:mx-0 sm:px-0 bg-white dark:bg-[#0E0E0E] transition-colors mb-4">
          <div className="relative w-full">
            <div className="flex items-center sm:justify-center gap-2 overflow-x-auto sm:overflow-x-visible no-scrollbar scroll-smooth snap-x snap-mandatory py-1 px-1 -mx-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    id={`feature-filter-${cat.toLowerCase()}`}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`h-[40px] min-h-[44px] px-4 rounded-full flex items-center justify-center shrink-0 snap-start text-xs sm:text-sm font-bold cursor-pointer transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'bg-[#F2C230] text-[#111111] shadow-xs font-black'
                        : 'border border-black/[0.12] dark:border-white/[0.15] bg-transparent text-[#525252] dark:text-[#D4D4D4] hover:text-[#111111] dark:hover:text-white hover:border-black/30 dark:hover:border-white/30'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Right fade edge on mobile only */}
            <div
              aria-hidden="true"
              className="sm:hidden absolute right-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-l from-white dark:from-[#0E0E0E] to-transparent"
            />
          </div>

          {/* Filter count indicator */}
          <div className="flex items-center justify-between text-[13px] text-[#737373] dark:text-[#A3A3A3] font-medium pt-2 px-1 max-w-3xl mx-auto">
            <span>
              Showing {filteredFeatures.length} {filteredFeatures.length === 1 ? 'feature' : 'features'}
            </span>
            {activeCategory !== 'All' && (
              <button
                type="button"
                onClick={() => setActiveCategory('All')}
                className="text-xs font-bold text-[#D4A017] dark:text-[#F2C230] hover:underline cursor-pointer"
              >
                Show all
              </button>
            )}
          </div>
        </div>

        {/* ── 3. Features Grid (Mobile: 1-2 cols, Tablet: 2 cols with Sage hero spanning both, Desktop: 3 cols with Sage hero spanning 2 cols on 1st row) ── */}
        <div className="grid grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 w-full">
          {/* Sage AI Hero Card (Spans 2 columns on tablet and desktop) */}
          {showSageHero && sageFeature && (
            <div
              id="feature-card-sage-hero"
              onClick={() => setExpandedCard(expandedCard === sageFeature.title ? null : sageFeature.title)}
              className={`col-span-1 min-[340px]:col-span-2 sm:col-span-2 lg:col-span-2 group relative w-full rounded-[24px] bg-gradient-to-br from-white/95 via-white/85 to-[#F2C230]/10 dark:from-[#161616]/95 dark:via-[#161616]/90 dark:to-[#F2C230]/15 backdrop-blur-xl border border-[#F2C230]/40 dark:border-[#F2C230]/50 p-5 sm:p-6 shadow-[0_8px_32px_rgba(242,194,48,0.12)] hover:shadow-[0_8px_32px_rgba(242,194,48,0.22)] active:scale-[0.98] transition-all duration-300 cursor-pointer ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl bg-[#F2C230]/20 border border-[#F2C230]/35 text-[#D4A017] dark:text-[#F2C230] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Bot size={22} className="stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#F2C230] text-[#111111] shadow-xs shrink-0">
                  AI FEATURE
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-[#111111] dark:text-white tracking-tight mb-2 flex items-center gap-2">
                <span>{sageFeature.title}</span>
              </h3>

              <p
                className={`text-[13px] sm:text-sm leading-relaxed text-[#525252] dark:text-[#CCCCCC] transition-all duration-200 ${
                  expandedCard === sageFeature.title ? 'line-clamp-none' : 'line-clamp-2 sm:line-clamp-3'
                }`}
              >
                {sageFeature.description}
              </p>

              <div className="mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F2C230]/15 text-[#111111] dark:text-[#F2C230] border border-[#F2C230]/30">
                  AI · Sage
                </span>
                <span className="text-xs font-bold text-[#D4A017] dark:text-[#F2C230] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>{expandedCard === sageFeature.title ? 'Collapse' : 'Explore capabilities'}</span>
                  <ArrowRight size={13} />
                </span>
              </div>
            </div>
          )}

          {/* Regular Feature Cards */}
          {gridFeatures.map((feature, idx) => {
            const Icon = feature.icon;
            const isExpanded = expandedCard === feature.title;
            return (
              <div
                key={feature.title}
                id={`feature-card-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setExpandedCard(isExpanded ? null : feature.title)}
                style={{
                  transitionDelay: `${idx * 50}ms`,
                }}
                className={`group relative rounded-[20px] bg-white/80 dark:bg-[#161616]/80 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.1] hover:border-[#F2C230]/60 dark:hover:border-[#F2C230]/60 p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:shadow-[0_8px_24px_rgba(242,194,48,0.18)] active:scale-[0.98] transition-all duration-200 cursor-pointer min-h-[170px] ${
                  isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                }`}
              >
                <div>
                  {/* 40px soft gold-tinted rounded square with gold icon */}
                  <div className="w-10 h-10 min-w-[40px] rounded-xl bg-[#F2C230]/15 dark:bg-[#F2C230]/20 border border-[#F2C230]/30 text-[#D4A017] dark:text-[#F2C230] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Icon size={19} className="stroke-[2.2]" />
                  </div>

                  {/* Title (16px, bold, max 2 lines) */}
                  <h3 className="text-[15px] sm:text-[16px] font-bold text-[#111111] dark:text-white line-clamp-2 leading-snug mb-1.5 group-hover:text-[#D4A017] dark:group-hover:text-[#F2C230] transition-colors">
                    {feature.title}
                  </h3>

                  {/* Description shortened visually to 3 lines with line-clamp, 13px muted */}
                  <p
                    className={`text-[13px] leading-relaxed text-[#666666] dark:text-[#A3A3A3] transition-all duration-200 ${
                      isExpanded ? 'line-clamp-none' : 'line-clamp-3'
                    }`}
                  >
                    {feature.description}
                  </p>
                </div>

                {/* Bottom row: Category tag at bottom-left as small 11px pill, plus tap hint */}
                <div className="mt-3 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-[#737373] dark:text-[#A3A3A3] border border-black/[0.06] dark:border-white/[0.1] inline-flex items-center">
                    {feature.tag}
                  </span>
                  <span className="text-[11px] text-[#A3A3A3] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {isExpanded ? 'Less' : 'More'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          #features-section * {
            animation: none !important;
            transition-delay: 0ms !important;
          }
        }
      `}</style>
    </section>
  );
};

export default FeaturesSection;
