import React, { useState, useEffect, useCallback } from 'react';
import { Check, ArrowRight, Zap, GraduationCap, BookOpen, Layers } from 'lucide-react';
import { BOARDS, getGradesForBoard, getDefaultPrice } from '../../lib/taxonomy';
import { getAllLiveFeeConfigs } from '../../lib/db';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';

const PricingSection: React.FC = () => {
  const [selectedBoardId, setSelectedBoardId] = useState<'fbise' | 'sindh' | 'ielts'>('fbise');
  const [selectedGradeValue, setSelectedGradeValue] = useState('10');
  const [selectedIeltsStream, setSelectedIeltsStream] = useState<'Academic' | 'General Training'>('Academic');
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  const currentBoardDef = BOARDS.find((b) => b.id === selectedBoardId) || BOARDS[0];
  const isIelts = selectedBoardId === 'ielts';

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

    planTitle = 'Academic Plan';
    planDescription = `Structured daily classes, syllabus schedules and interactive note vaults for Class ${gradeVal}th.`;
    activeBadgeLabel = `${currentBoardDef.name} · Class ${gradeVal}th`;
    registerUrl = `/register?board=${selectedBoardId}&grade=${gradeVal}`;
  }

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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#EFEFEF] p-1 rounded-xl">
                {BOARDS.map((board) => (
                  <button
                    key={board.id}
                    type="button"
                    onClick={() => {
                      setSelectedBoardId(board.id as 'fbise' | 'sindh' | 'ielts');
                    }}
                    className={`py-2.5 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                      selectedBoardId === board.id
                        ? 'bg-white text-[#111111] shadow-sm border border-[#E5E5E5]'
                        : 'text-[#737373] hover:text-[#111111]'
                    }`}
                  >
                    <Layers size={13} className={selectedBoardId === board.id ? 'text-[#F4C430]' : 'text-[#A3A3A3]'} />
                    <span>{board.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stream / Grade Selector */}
            <div>
              <label className="block text-left text-xs font-bold text-[#737373] uppercase tracking-wider mb-2">
                {isIelts ? 'Select IELTS Stream' : `Select Class (${currentBoardDef.name})`}
              </label>

              {isIelts ? (
                <div className="grid grid-cols-2 gap-2 bg-[#EFEFEF] p-1 rounded-xl">
                  {(['Academic', 'General Training'] as const).map((stream) => (
                    <button
                      key={stream}
                      type="button"
                      onClick={() => setSelectedIeltsStream(stream)}
                      className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${
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
                <div className="grid grid-cols-4 gap-1.5 bg-[#EFEFEF] p-1 rounded-xl">
                  {['9', '10', '11', '12'].map((gr) => (
                    <button
                      key={gr}
                      type="button"
                      onClick={() => setSelectedGradeValue(gr)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                        selectedGradeValue === gr
                          ? 'bg-[#111111] text-white shadow-sm'
                          : 'text-[#737373] hover:text-[#111111] bg-white/40'
                      }`}
                    >
                      Class {gr}th
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
          <div className="md:col-span-5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#FFFBF0] flex items-center justify-center border border-[#FDF3C8]">
                  <GraduationCap size={16} className="text-[#D4A017]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#111111] text-lg">Active Subjects Included</h3>
                  <p className="text-[11px] font-semibold text-[#D4A017]">{activeBadgeLabel}</p>
                </div>
              </div>
              <p className="text-xs text-[#737373] mb-5 leading-relaxed">
                You will get comprehensive access to live lectures, notes vaults and announcements for the following curriculum modules:
              </p>

              <ul className="space-y-2.5">
                {activeSubjects.map((sub) => (
                  <li key={sub} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-[#F0F0F0]">
                    <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center border border-green-100 shrink-0">
                      <Check size={12} className="text-[#22c55e]" />
                    </div>
                    <span className="text-xs font-bold text-[#111111]">{sub}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E5E5E5] text-[11px] text-[#737373] flex items-center gap-2">
              <BookOpen size={13} className="text-[#F4C430] shrink-0" />
              <span>
                Full curriculum aligned with {isIelts ? 'IELTS syllabus guidelines' : `${currentBoardDef.name} syllabus guidelines`}.
              </span>
            </div>
          </div>

          {/* Pricing Cards (Right Side - 7 Columns) */}
          <div className="md:col-span-7 flex justify-center items-stretch">

            {/* Dynamic Growth Plan Card */}
            <div className="relative rounded-2xl bg-[#111111] border border-[#111111] p-7 shadow-2xl flex flex-col justify-between text-white w-full max-w-sm">
              {/* Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span
                  className="px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide shadow-sm"
                  style={{ background: '#F4C430', color: '#111111' }}
                >
                  Active Syllabus
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{planTitle}</span>
                    <Zap size={14} style={{ color: '#F4C430' }} />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#262626] text-[#F4C430]">
                    {currentBoardDef.name}
                  </span>
                </div>
                <p className="text-xs text-[#A3A3A3] leading-relaxed mb-6">
                  {planDescription}
                </p>

                {/* Dynamic Price */}
                <div className="mb-6 pb-6 border-b border-[#262626]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-semibold text-[#737373]">PKR</span>
                    <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
                      {displayPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-[#737373]">/term</span>
                  </div>
                </div>

                {/* Small checklist */}
                <ul className="space-y-2.5 mb-6 text-xs text-[#D4D4D4]">
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-[#F4C430]" />
                    <span>Complete {currentBoardDef.name} Program access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-[#F4C430]" />
                    <span>Daily live interactive schedule</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-[#F4C430]" />
                    <span>Resource library & solved practice vaults</span>
                  </li>
                </ul>
              </div>

              <a
                href={registerUrl}
                className="btn btn-gold btn-md w-full flex items-center justify-center gap-1 interactive mt-4"
              >
                Get Started with {currentBoardDef.name}
                <ArrowRight size={14} />
              </a>
            </div>

          </div>
        </div>

        {/* Footnote */}
        <p className="text-center text-sm text-[#A3A3A3] mt-12">
          All tuition pricing denominated in Pakistani Rupees (PKR) and billed per academic term.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;

