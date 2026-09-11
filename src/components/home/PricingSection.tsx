import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Zap, GraduationCap, BookOpen, Layers, SlidersHorizontal } from 'lucide-react';
import { BOARDS, getGradesForBoard, getDefaultPrice, BoardId, formatGradeDisplay } from '../../lib/taxonomy';
import { getAllLiveFeeConfigs } from '../../lib/db';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';

/**
 * PricingSection: Public-facing interactive Pricing Calculator on the marketing landing page.
 * Completely independent from any authenticated teacher/student profile or assigned board.
 * Any visitor freely selects between Federal Board (FBISE), Sindh Board, IELTS Preparation, O Levels, A Levels, or KPK Board.
 */
const PricingSection: React.FC = () => {
  // Public, visitor-controlled independent selection state
  const [selectedBoardId, setSelectedBoardId] = useState<BoardId>('fbise');
  const [selectedGradeValue, setSelectedGradeValue] = useState('10');
  const [selectedIeltsStream, setSelectedIeltsStream] = useState<'Academic' | 'General Training'>('Academic');
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

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

  // Handle board change: ensure selected grade exists on newly selected board
  const handleBoardSelect = (boardId: BoardId) => {
    setSelectedBoardId(boardId);
    if (boardId !== 'ielts') {
      const boardGrades = getGradesForBoard(boardId);
      if (boardGrades.length > 0 && !boardGrades.some((g) => g.grade === selectedGradeValue)) {
        setSelectedGradeValue(boardGrades[0].grade);
      }
    }
  };

  // Subscribe to realtime fee_configs updates
  useRealtimeTable({
    table: 'fee_configs',
    onInsert: loadAllPrices,
    onUpdate: loadAllPrices,
    onDelete: loadAllPrices,
  });

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
    activeBadgeLabel = `IELTS Preparation · ${selectedIeltsStream}`;
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
      ? `Strictly per-subject tuition. Enroll in individual subjects at PKR ${displayPrice.toLocaleString()} per subject per term, with a flat 5% discount automatically applied when taking 2 or more subjects.`
      : `Structured daily classes, syllabus schedules and interactive note vaults for ${gradeLabel}.`;
    activeBadgeLabel = `${currentBoardDef.name} · ${gradeLabel}`;
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

  const gradesForSelectedBoard = !isIelts ? getGradesForBoard(selectedBoardId) : [];

  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="section-label justify-center mb-4">Pricing Calculator</span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111] mb-5 leading-tight">
            Select your Board & Program
          </h2>
          <p className="text-xl text-[#737373] max-w-2xl mx-auto mb-8">
            Choose your education board and program below to see the exact subjects and official fee rates.
          </p>

          {/* Interactive Selectors Bar */}
          <div className="max-w-xl mx-auto bg-[#FAFAFA] border border-[#E5E5E5] p-5 rounded-2xl mb-12 space-y-4 shadow-sm">
            {/* Board Selector Pills */}
            <div>
              <label className="block text-left text-xs font-bold text-[#737373] uppercase tracking-wider mb-2">
                Select Education Board / Stream
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#EFEFEF] p-1 rounded-xl">
                {BOARDS.map((board) => (
                  <button
                    key={board.id}
                    id={`pricing-board-btn-${board.id}`}
                    type="button"
                    onClick={() => handleBoardSelect(board.id as BoardId)}
                    className={`py-2.5 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedBoardId === board.id
                        ? 'bg-white text-[#111111] shadow-sm border border-[#E5E5E5]'
                        : 'text-[#737373] hover:text-[#111111]'
                    }`}
                  >
                    <Layers size={13} className={selectedBoardId === board.id ? 'text-[#F4C430]' : 'text-[#A3A3A3]'} />
                    <span className="truncate">{board.shortName || board.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stream / Grade Selector */}
            <div>
              <label className="block text-left text-xs font-bold text-[#737373] uppercase tracking-wider mb-2">
                {isIelts ? 'Select IELTS Stream' : `Select Grade / Class (${currentBoardDef.name})`}
              </label>

              {isIelts ? (
                <div className="grid grid-cols-2 gap-2 bg-[#EFEFEF] p-1 rounded-xl">
                  {(['Academic', 'General Training'] as const).map((stream) => (
                    <button
                      key={stream}
                      id={`pricing-ielts-stream-btn-${stream.toLowerCase().replace(/\s+/g, '-')}`}
                      type="button"
                      onClick={() => setSelectedIeltsStream(stream)}
                      className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                        selectedIeltsStream === stream
                          ? 'bg-[#111111] text-white shadow-sm'
                          : 'text-[#737373] hover:text-[#111111] bg-white/40'
                      }`}
                    >
                      {stream}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 bg-[#EFEFEF] p-1 rounded-xl">
                  {gradesForSelectedBoard.map((g) => (
                    <button
                      key={g.grade}
                      id={`pricing-grade-btn-${g.grade}`}
                      type="button"
                      onClick={() => setSelectedGradeValue(g.grade)}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer whitespace-nowrap ${
                        selectedGradeValue === g.grade
                          ? 'bg-[#111111] text-white shadow-sm'
                          : 'text-[#737373] hover:text-[#111111] bg-white/40'
                      }`}
                    >
                      {formatGradeDisplay(g.grade, selectedBoardId)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Layout Grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">

          {/* Included Subjects Info (Left Side - 5 Columns) */}
          <div className="md:col-span-5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#FFFBF0] flex items-center justify-center border border-[#FDF3C8]">
                  <GraduationCap size={16} className="text-[#D4A017]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#111111] text-lg">
                    {isCambridge ? 'Available Cambridge Subjects' : 'Active Subjects Included'}
                  </h3>
                  <p className="text-[11px] font-semibold text-[#D4A017]">{activeBadgeLabel}</p>
                </div>
              </div>
              <p className="text-xs text-[#737373] mb-5 leading-relaxed">
                {isCambridge
                  ? `Cambridge ${selectedBoardId === 'alevel' ? 'A Levels' : 'O Levels'} is strictly per-subject tuition (PKR ${displayPrice.toLocaleString()} per subject per term). Select individual subjects below — a flat 5% discount applies when choosing 2 or more subjects:`
                  : 'You will get comprehensive access to live lectures, notes vaults and announcements for the following curriculum modules:'}
              </p>

              <ul className="space-y-2.5">
                {activeSubjects.map((sub) => (
                  <li key={sub} className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-[#F0F0F0]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center border border-green-100 shrink-0">
                        <Check size={12} className="text-[#22c55e]" />
                      </div>
                      <span className="text-xs font-bold text-[#111111] truncate">{sub}</span>
                    </div>
                    {isCambridge && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0 whitespace-nowrap">
                        PKR {displayPrice.toLocaleString()} / subject / term
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              {/* Compare Plans Link directly below the Active Subjects Included checklist */}
              <div className="mt-4 pt-3.5 border-t border-[#EAEAEA]">
                <Link
                  id="pricing-checklist-compare-plans-link"
                  to={compareUrl}
                  className="group flex items-center justify-between p-3 rounded-xl bg-white border border-[#E5E5E5] hover:border-[#F4C430] hover:bg-[#FFFDF5] transition-all shadow-2xs cursor-pointer gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-[#FFFBF0] flex items-center justify-center border border-[#FDF3C8] shrink-0 text-[#D4A017]">
                      <SlidersHorizontal size={13} />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="text-xs font-extrabold text-[#111111] block group-hover:text-amber-800 transition-colors truncate">
                        {isCambridge ? 'Per-Subject Tuition Calculator' : 'Compare Plans'}
                      </span>
                      <span className="text-[11px] text-[#737373] block truncate">
                        {isCambridge ? 'Calculate total with flat 5% discount' : 'Full Package vs Per-Subject'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-[#111111] shrink-0">
                    <span className="text-[11px] text-[#D4A017] font-extrabold whitespace-nowrap">
                      {isCambridge ? 'Calculate' : 'Compare'}
                    </span>
                    <ArrowRight size={13} className="text-[#F4C430] group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                </Link>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#E5E5E5] text-[11px] text-[#737373] flex items-center gap-2">
              <BookOpen size={13} className="text-[#F4C430] shrink-0" />
              <span>
                Full curriculum aligned with {isIelts ? 'IELTS syllabus guidelines' : `${currentBoardDef.name} syllabus guidelines`}.
              </span>
            </div>
          </div>

          {/* Pricing Cards (Right Side - 7 Columns) */}
          <div className="md:col-span-7 flex justify-center items-stretch">

            {/* Dynamic Growth Plan Card */}
            <div className="relative rounded-2xl bg-[#111111] border border-[#111111] p-5 pt-8 sm:p-7 sm:pt-9 shadow-2xl flex flex-col justify-between text-white w-full max-w-sm">
              {/* Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap pointer-events-none">
                <span
                  className="inline-flex items-center justify-center px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md whitespace-nowrap"
                  style={{ background: '#F4C430', color: '#111111' }}
                >
                  {isCambridge ? 'Per-Subject Active Syllabus' : 'Active Syllabus'}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base font-bold text-white truncate">{planTitle}</span>
                    <Zap size={14} style={{ color: '#F4C430' }} className="shrink-0" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#262626] text-[#F4C430] whitespace-nowrap shrink-0">
                    {currentBoardDef.shortName}
                  </span>
                </div>
                <p className="text-xs text-[#A3A3A3] leading-relaxed mb-6">
                  {planDescription}
                </p>

                {/* Dynamic Price */}
                <div className="mb-6 pb-6 border-b border-[#262626]">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-[#737373]">PKR</span>
                    <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
                      {displayPrice.toLocaleString()}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border whitespace-nowrap shrink-0 ${
                      isCambridge
                        ? 'text-[#111111] bg-[#F4C430] border-[#F4C430]'
                        : 'text-[#A3A3A3] bg-[#262626] border-[#333333]'
                    }`}>
                      {isCambridge ? 'per subject per term' : '/term'}
                    </span>
                  </div>

                  {isCambridge && (
                    <div className="mt-2.5 p-2 rounded-lg bg-[#1F1F1F] border border-[#333333] text-[11px] text-[#D4D4D4] flex items-center gap-1.5">
                      <span className="text-[#F4C430] font-black">★</span>
                      <span>
                        Strictly per subject • Flat <strong>5% discount</strong> applies for 2+ subjects
                      </span>
                    </div>
                  )}
                </div>

                {/* Small checklist */}
                <ul className="space-y-2.5 mb-6 text-xs text-[#D4D4D4]">
                  {isCambridge ? (
                    <>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-[#F4C430] shrink-0" />
                        <span><strong>PKR {displayPrice.toLocaleString()} per subject per term</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-[#F4C430] shrink-0" />
                        <span>Flat 5% discount automatically applied on 2+ subjects</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-[#F4C430] shrink-0" />
                        <span>Daily live interactive schedule per enrolled subject</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-[#F4C430] shrink-0" />
                        <span>Resource library & solved past paper vaults</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-[#F4C430] shrink-0" />
                        <span>Complete {currentBoardDef.name} Program access</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-[#F4C430] shrink-0" />
                        <span>Daily live interactive schedule</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-[#F4C430] shrink-0" />
                        <span>Resource library & solved practice vaults</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="space-y-2 mt-4">
                <a
                  href={registerUrl}
                  className="btn btn-gold btn-md w-full flex items-center justify-center gap-1.5 interactive"
                >
                  <span>
                    {isCambridge ? `Enroll in ${currentBoardDef.shortName} Subjects` : `Get Started with ${currentBoardDef.name}`}
                  </span>
                  <ArrowRight size={14} />
                </a>

                <Link
                  id="pricing-card-compare-plans-btn"
                  to={compareUrl}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#E5E5E5] hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
                >
                  <SlidersHorizontal size={13} className="text-[#F4C430]" />
                  <span>{isCambridge ? 'Per-Subject Tuition Calculator' : 'Compare Plans'}</span>
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Footnote */}
        <p className="text-center text-sm text-[#A3A3A3] mt-12">
          All tuition pricing denominated in Pakistani Rupees (PKR) and billed per academic term. Cambridge A Levels (PKR 6,500) and O Levels (PKR 5,000) are billed strictly per subject per term with a flat 5% discount for 2 or more subjects.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;

