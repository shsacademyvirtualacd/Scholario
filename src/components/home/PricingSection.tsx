import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Zap, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { BOARDS, getGradesForBoard, getDefaultPrice, BoardId, formatGradeDisplay } from '../../lib/taxonomy';
import { getAllLiveFeeConfigs } from '../../lib/db';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';

/**
 * PricingSection: Redesigned mobile-first interactive Pricing Calculator on the marketing landing page.
 * Keeps all data, fee logic, routes, and functionality intact while providing a fast 3-step UX:
 * 1 · Choose board (single horizontally scrollable pill row)
 * 2 · Choose grade (single-row segmented control with gold active highlight)
 * 3 · Your plan (one combined summary card with compact subject chips & pricing)
 */
const PricingSection: React.FC = () => {
  const [selectedBoardId, setSelectedBoardId] = useState<BoardId>('fbise');
  const [selectedGradeValue, setSelectedGradeValue] = useState('10');
  const [selectedIeltsStream, setSelectedIeltsStream] = useState<'Academic' | 'General Training'>('Academic');
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSectionVisible, setIsSectionVisible] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const boardRowRef = useRef<HTMLDivElement>(null);

  const currentBoardDef = BOARDS.find((b) => b.id === selectedBoardId) || BOARDS[0];
  const isIelts = selectedBoardId === 'ielts';
  const isCambridge = selectedBoardId === 'alevel' || selectedBoardId === 'olevel';

  const loadAllPrices = useCallback(async () => {
    try {
      const { byKey } = await getAllLiveFeeConfigs();
      setLivePrices(byKey);
    } catch (err) {
      console.warn('[PricingSection] Failed to load live fee configs:', err);
    }
  }, []);

  useEffect(() => {
    loadAllPrices();
  }, [loadAllPrices]);

  // Subscribe to realtime fee_configs updates
  useRealtimeTable({
    table: 'fee_configs',
    onInsert: loadAllPrices,
    onUpdate: loadAllPrices,
    onDelete: loadAllPrices,
  });

  // Observe section visibility for mobile sticky bottom bar
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSectionVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Handle board change: ensure selected grade exists on newly selected board
  const handleBoardSelect = (boardId: BoardId) => {
    if (boardId === selectedBoardId) return;
    setIsUpdating(true);
    setSelectedBoardId(boardId);
    setShowAllSubjects(false);

    if (boardId !== 'ielts') {
      const boardGrades = getGradesForBoard(boardId);
      if (boardGrades.length > 0 && !boardGrades.some((g) => g.grade === selectedGradeValue)) {
        setSelectedGradeValue(boardGrades[0].grade);
      }
    }
    setTimeout(() => setIsUpdating(false), 220);
  };

  const handleGradeSelect = (grade: string) => {
    if (grade === selectedGradeValue) return;
    setIsUpdating(true);
    setSelectedGradeValue(grade);
    setTimeout(() => setIsUpdating(false), 220);
  };

  const handleIeltsStreamSelect = (stream: 'Academic' | 'General Training') => {
    if (stream === selectedIeltsStream) return;
    setIsUpdating(true);
    setSelectedIeltsStream(stream);
    setTimeout(() => setIsUpdating(false), 220);
  };

  // Helper to ensure clean short board names in badges without long official names
  const getShortBoardName = (boardId: BoardId): string => {
    switch (boardId) {
      case 'fbise':
        return 'FBISE';
      case 'punjab':
        return 'Punjab';
      case 'sindh':
        return 'Sindh';
      case 'kpk':
        return 'KPK';
      case 'olevel':
        return 'O Levels';
      case 'alevel':
        return 'A Levels';
      case 'ielts':
        return 'IELTS';
      default:
        return 'Scholario';
    }
  };

  const shortBoardName = getShortBoardName(selectedBoardId);

  // Calculate active subjects and dynamic price based on board and stream/grade
  let activeSubjects: string[] = [];
  let displayPrice = 0;
  let planTitle = 'Academic Plan';
  let planDescription = '';
  let activeBadgeLabel = '';
  let registerUrl = '';

  if (isIelts) {
    const isGt = selectedIeltsStream === 'General Training';
    activeSubjects = isGt
      ? [
          'IELTS Listening',
          'IELTS Reading (GT)',
          'IELTS Writing (GT)',
          'IELTS Speaking',
          'IELTS Reading (Academic)',
          'IELTS Writing (Academic)',
        ]
      : [
          'IELTS Listening',
          'IELTS Reading (Academic)',
          'IELTS Writing (Academic)',
          'IELTS Speaking',
        ];

    const lookupKey = isGt ? 'ielts-general-training' : 'ielts-academic';
    const altGradeKey = isGt ? 'ielts-12' : 'ielts-10';
    const altNameKey = selectedIeltsStream;

    displayPrice =
      livePrices[lookupKey] ??
      livePrices[altGradeKey] ??
      livePrices[altNameKey] ??
      livePrices[altNameKey.toLowerCase()] ??
      getDefaultPrice(isGt ? '12' : '10', 'ielts', selectedIeltsStream);

    planTitle = `${selectedIeltsStream} Plan`;
    planDescription = `Structured IELTS preparation, syllabus schedules, and interactive note vaults for ${selectedIeltsStream} stream.`;
    activeBadgeLabel = `IELTS · ${selectedIeltsStream}`;
    registerUrl = `/register?board=ielts&stream=${encodeURIComponent(selectedIeltsStream)}`;
  } else {
    const gradesForSelectedBoard = getGradesForBoard(selectedBoardId);
    const gradeDef = gradesForSelectedBoard.find((g) => g.grade === selectedGradeValue) || gradesForSelectedBoard[0];
    const gradeVal = gradeDef?.grade || selectedGradeValue;

    const allSubjs = new Set<string>();
    if (gradeDef) {
      gradeDef.streams.forEach((s) => s.subjects.forEach((sub) => allSubjs.add(sub)));
    }
    activeSubjects = Array.from(allSubjs);

    const key = `${selectedBoardId}-${gradeVal}`;
    const livePrice = livePrices[key] ?? (selectedBoardId === 'fbise' ? livePrices[gradeVal] : undefined);
    displayPrice = livePrice ?? getDefaultPrice(gradeVal, selectedBoardId);

    const gradeLabel = formatGradeDisplay(gradeVal, selectedBoardId);
    planTitle = isCambridge
      ? `Cambridge ${selectedBoardId === 'alevel' ? 'A Levels' : 'O Levels'} (Per-Subject Plan)`
      : 'Academic Plan';
    planDescription = isCambridge
      ? `Strictly per-subject tuition. Enroll in individual subjects at PKR ${displayPrice.toLocaleString('en-US')} per subject per term, with a flat 5% discount automatically applied when taking 2 or more subjects.`
      : `Structured daily classes, syllabus schedules, and interactive note vaults for ${gradeLabel}.`;
    activeBadgeLabel = `${shortBoardName} · ${gradeLabel}`;
    registerUrl = `/register?board=${selectedBoardId}&grade=${gradeVal}`;
  }

  // Pre-configured URL to pre-load selected board, class and stream on Compare Plans page
  let compareUrl = '';
  if (isIelts) {
    compareUrl = `/enrollment/compare?board=ielts&stream=${encodeURIComponent(selectedIeltsStream)}&grade=IELTS&class=IELTS`;
  } else {
    const gradesForSelectedBoard = getGradesForBoard(selectedBoardId);
    const gradeDef = gradesForSelectedBoard.find((g) => g.grade === selectedGradeValue) || gradesForSelectedBoard[0];
    const gradeVal = gradeDef?.grade || selectedGradeValue;
    const defaultStream = gradeDef?.streams?.[0]?.name || '';
    compareUrl = `/enrollment/compare?board=${selectedBoardId}&grade=${gradeVal}&class=${gradeVal}${defaultStream ? `&stream=${encodeURIComponent(defaultStream)}` : ''}`;
  }

  // Animated price counter for subtle price transitions
  const [animatedPrice, setAnimatedPrice] = useState(displayPrice);
  useEffect(() => {
    if (displayPrice === animatedPrice) return;
    const start = animatedPrice;
    const end = displayPrice;
    const duration = 220;
    const startTime = performance.now();
    let animId: number;

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const current = Math.round(start + (end - start) * progress);
      setAnimatedPrice(current);
      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [displayPrice]);

  const gradesForSelectedBoard = !isIelts ? getGradesForBoard(selectedBoardId) : [];

  // Board display labels
  const getBoardLabel = (board: (typeof BOARDS)[number]) => {
    return getShortBoardName(board.id);
  };

  const displayedSubjects = showAllSubjects ? activeSubjects : activeSubjects.slice(0, 6);
  const remainingSubjectsCount = activeSubjects.length - 6;

  return (
    <section
      ref={sectionRef}
      id="pricing-calculator"
      className="pt-16 sm:pt-24 pb-28 sm:pb-24 bg-white dark:bg-[#111111] text-[#111111] dark:text-white transition-colors"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* ── 1. Section Header ── */}
        <div className="text-center mb-8 sm:mb-10">
          <span className="inline-block text-[11px] font-black uppercase tracking-[0.18em] text-[#D4A017] dark:text-[#F2C230] mb-2.5">
            PRICING CALCULATOR
          </span>
          <h2 className="text-[26px] sm:text-[28px] md:text-3xl font-extrabold tracking-tight text-[#111111] dark:text-white mb-2.5 leading-tight">
            Select your Board &amp; Program
          </h2>
          <p className="text-sm sm:text-[15px] text-[#737373] dark:text-[#A3A3A3] max-w-xl mx-auto leading-relaxed">
            Choose your education board and program below to see the exact subjects and official fee rates.
          </p>
        </div>

        {/* ── 2. Steps Flow Container ── */}
        <div className="space-y-6 sm:space-y-7">

          {/* ── Step 1: Board Selector (Single Horizontally Scrollable Pill Row) ── */}
          <div>
            <label className="block text-left text-xs sm:text-[13px] font-bold text-[#737373] dark:text-[#A3A3A3] tracking-wide mb-2.5">
              1 · Choose your board
            </label>
            <div
              ref={boardRowRef}
              className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1 px-0.5 -mx-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {BOARDS.map((board) => {
                const isSelected = selectedBoardId === board.id;
                return (
                  <button
                    key={board.id}
                    id={`pricing-board-btn-${board.id}`}
                    type="button"
                    onClick={() => handleBoardSelect(board.id as BoardId)}
                    className={`h-[44px] min-h-[44px] px-4 rounded-full flex items-center justify-center shrink-0 snap-start text-xs sm:text-sm font-bold cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] shadow-xs'
                        : 'border border-black/[0.12] dark:border-white/[0.15] bg-transparent text-[#525252] dark:text-[#D4D4D4] hover:text-[#111111] dark:hover:text-white hover:border-black/30 dark:hover:border-white/30'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F2C230] shrink-0" />
                      )}
                      <span>{getBoardLabel(board)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Step 2: Grade / Stream Selector (Single-row segmented control with gold highlight) ── */}
          {(isIelts || gradesForSelectedBoard.length > 0) && (
            <div>
              <label className="block text-left text-xs sm:text-[13px] font-bold text-[#737373] dark:text-[#A3A3A3] tracking-wide mb-2.5">
                {isIelts ? '2 · Choose your stream' : '2 · Choose your grade'}
              </label>

              {isIelts ? (
                <div className="inline-flex p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.12] w-full max-w-md">
                  {(['Academic', 'General Training'] as const).map((stream) => {
                    const isSelected = selectedIeltsStream === stream;
                    return (
                      <button
                        key={stream}
                        id={`pricing-ielts-stream-btn-${stream.toLowerCase().replace(/\s+/g, '-')}`}
                        type="button"
                        onClick={() => handleIeltsStreamSelect(stream)}
                        className={`h-[40px] flex-1 px-3 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#F2C230] text-[#111111] shadow-xs'
                            : 'text-[#737373] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white'
                        }`}
                      >
                        {stream}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-flow-col auto-cols-fr p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.12] w-full max-w-lg">
                  {gradesForSelectedBoard.map((g) => {
                    const isSelected = selectedGradeValue === g.grade;
                    return (
                      <button
                        key={g.grade}
                        id={`pricing-grade-btn-${g.grade}`}
                        type="button"
                        onClick={() => handleGradeSelect(g.grade)}
                        className={`h-[40px] px-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center whitespace-nowrap ${
                          isSelected
                            ? 'bg-[#F2C230] text-[#111111] shadow-xs'
                            : 'text-[#737373] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white'
                        }`}
                      >
                        {formatGradeDisplay(g.grade, selectedBoardId)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Your Plan (ONE Combined Summary Card) ── */}
          <div>
            <label className="block text-left text-xs sm:text-[13px] font-bold text-[#737373] dark:text-[#A3A3A3] tracking-wide mb-2.5">
              3 · Your plan summary
            </label>

            <div
              className={`relative rounded-[28px] bg-[#111111] text-white border border-[#262626] dark:border-white/[0.12] p-5 sm:p-7 pt-7 sm:pt-8 shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition-all duration-300 ease-out ${
                isUpdating ? 'opacity-80 scale-[0.99] translate-y-1' : 'opacity-100 scale-100 translate-y-0'
              }`}
            >
              {/* Gold "ACTIVE SYLLABUS" Badge Tab */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap pointer-events-none">
                <span className="inline-flex items-center justify-center px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md bg-[#F2C230] text-[#111111]">
                  {isCambridge ? 'PER-SUBJECT ACTIVE SYLLABUS' : 'ACTIVE SYLLABUS'}
                </span>
              </div>

              {/* Card Top Row: Plan Name, Board Badge & Grade */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base sm:text-lg font-bold text-white truncate">
                    {planTitle}
                  </span>
                  <Zap size={15} className="text-[#F2C230] shrink-0" />
                </div>
                <span
                  className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-[#262626] text-[#F2C230] border border-white/5 whitespace-nowrap truncate max-w-[200px] shrink-0"
                  title={currentBoardDef.name}
                >
                  {activeBadgeLabel}
                </span>
              </div>

              {/* Short Plan Description */}
              <p className="text-[14px] leading-[1.5] text-[#A3A3A3] mb-5">
                {planDescription}
              </p>

              {/* Price Row */}
              <div className="mb-5 pb-5 border-b border-white/10">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#A3A3A3]">PKR</span>
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white tabular-nums">
                    {animatedPrice.toLocaleString('en-US')}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded border whitespace-nowrap shrink-0 ${
                      isCambridge
                        ? 'text-[#111111] bg-[#F2C230] border-[#F2C230]'
                        : 'text-[#D4D4D4] bg-[#222222] border-white/10'
                    }`}
                  >
                    {isCambridge ? 'per subject per term' : '/term'}
                  </span>
                </div>

                {/* 5% Multi-Subject Discount Note for Cambridge */}
                {isCambridge && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F2C230]/15 border border-[#F2C230]/30 text-xs text-[#F2C230] font-semibold">
                    <span>★</span>
                    <span>
                      Strictly per subject • Flat <strong>5% discount</strong> applies for 2+ subjects
                    </span>
                  </div>
                )}
              </div>

              {/* Compact Wrapping Subject Chips */}
              <div className="mb-5">
                <span className="block text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-2.5">
                  {isCambridge ? 'Available Subjects' : 'Included Subjects'} ({activeSubjects.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {displayedSubjects.map((sub) => (
                    <div
                      key={sub}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white text-[14px] font-semibold border border-white/10 hover:border-white/20 transition-colors whitespace-nowrap"
                    >
                      <Check size={14} className="text-[#F2C230] shrink-0" />
                      <span className="whitespace-nowrap">{sub}</span>
                    </div>
                  ))}

                  {/* Expand / Collapse Chip */}
                  {remainingSubjectsCount > 0 && !showAllSubjects && (
                    <button
                      type="button"
                      onClick={() => setShowAllSubjects(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F2C230]/20 hover:bg-[#F2C230]/30 text-[#F2C230] text-[14px] font-bold border border-[#F2C230]/40 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>+{remainingSubjectsCount} more</span>
                      <ChevronDown size={14} />
                    </button>
                  )}

                  {showAllSubjects && activeSubjects.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowAllSubjects(false)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#A3A3A3] text-[14px] font-bold border border-white/10 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>Show less</span>
                      <ChevronUp size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Three Short Feature Lines with Check Icons */}
              <ul className="space-y-2.5 mb-6 text-[14px] sm:text-[15px] leading-[1.5] text-[#E5E5E5]">
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#F2C230]/20 flex items-center justify-center shrink-0">
                    <Check size={11} className="text-[#F2C230] stroke-[3]" />
                  </div>
                  <span>
                    {isCambridge
                      ? `Complete ${shortBoardName} curriculum per enrolled subject`
                      : `Complete ${shortBoardName} program access`}
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#F2C230]/20 flex items-center justify-center shrink-0">
                    <Check size={11} className="text-[#F2C230] stroke-[3]" />
                  </div>
                  <span>Daily live interactive schedule</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#F2C230]/20 flex items-center justify-center shrink-0">
                    <Check size={11} className="text-[#F2C230] stroke-[3]" />
                  </div>
                  <span>Resource library &amp; solved practice vaults</span>
                </li>
              </ul>

              {/* Action Buttons: Primary Gold Button + Secondary Single Link */}
              <div className="space-y-3">
                <a
                  id="pricing-get-started-btn"
                  href={registerUrl}
                  className="w-full min-h-[52px] h-[52px] px-5 rounded-full bg-[#F2C230] hover:bg-[#E5B520] text-[#111111] font-extrabold text-[15px] sm:text-base leading-[1.25] shadow-[0_4px_16px_rgba(242,194,48,0.35)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white text-center"
                >
                  <span className="line-clamp-2 text-center">Get Started</span>
                  <ArrowRight size={16} className="shrink-0" />
                </a>

                {/* Single Compare Plans link (duplicate block removed) */}
                <div className="text-center pt-1">
                  <Link
                    id="pricing-compare-plans-link"
                    to={compareUrl}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#A3A3A3] hover:text-[#F2C230] transition-colors group cursor-pointer"
                  >
                    <span>
                      {isCambridge
                        ? 'Per-Subject Tuition Calculator & Multi-Subject Discount'
                        : 'Compare Full Package vs Per-Subject'}
                    </span>
                    <ArrowRight size={13} className="text-[#F2C230] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Footnote (Small Rounded Info Row with Info Icon) ── */}
        <div className="max-w-2xl mx-auto mt-8 flex items-start gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-[13px] text-[#737373] dark:text-[#A3A3A3] leading-[1.5]">
          <Info size={16} className="text-[#F2C230] shrink-0 mt-0.5" />
          <span>
            All tuition pricing denominated in Pakistani Rupees (PKR) and billed per academic term. Cambridge A Levels (PKR 6,500) and O Levels (PKR 5,000) are billed strictly per subject per term with a flat 5% discount for 2 or more subjects.
          </span>
        </div>

      </div>

      {/* ── 5. Mobile Sticky Bottom Bar (Visible only while section is on screen) ── */}
      <div
        className={`fixed bottom-3 inset-x-3.5 z-40 sm:hidden transition-all duration-300 ease-out pointer-events-none ${
          isSectionVisible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
          className="bg-white/85 dark:bg-[#161616]/85 border border-white/60 dark:border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.18)] rounded-full px-4 py-2.5 flex items-center justify-between gap-3 text-[#111111] dark:text-white"
        >
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373] dark:text-[#A3A3A3] truncate whitespace-nowrap">
              {activeBadgeLabel}
            </span>
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              <span className="text-[11px] font-semibold text-[#737373]">PKR</span>
              <span className="text-base font-extrabold tabular-nums tracking-tight text-[#111111] dark:text-white">
                {animatedPrice.toLocaleString('en-US')}
              </span>
              <span className="text-[10px] text-[#737373] font-medium">
                {isCambridge ? '/sub' : '/term'}
              </span>
            </div>
          </div>

          <a
            href={registerUrl}
            className="h-10 px-4 rounded-full bg-[#F2C230] hover:bg-[#E5B520] text-[#111111] font-extrabold text-xs shrink-0 shadow-xs flex items-center gap-1.5 active:scale-95 transition-all whitespace-nowrap"
          >
            <span className="whitespace-nowrap">Get Started</span>
            <ArrowRight size={13} className="shrink-0" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
