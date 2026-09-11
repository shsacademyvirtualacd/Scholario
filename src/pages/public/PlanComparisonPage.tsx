import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Zap, 
  BookOpen, 
  Layers,
  HelpCircle
} from 'lucide-react';
import { getSubjectPricingSettings, SubjectPricingSettings } from '../../lib/subjectEnrollmentService';
import { resolveGradeFeeConfig, getTaxonomy } from '../../lib/db';
import { BOARDS, getGradesForBoard, getDefaultPrice } from '../../lib/taxonomy';
import { useNavigate, useSearchParams } from 'react-router-dom';

export interface PlanComparisonProps {
  boardId?: string;
  classId?: string;
  grade?: string;
  streamId?: string | null;
  streamName?: string;
  availableSubjects?: string[];
  initialSelectedSubjects?: string[];
  initialEnrollmentMode?: 'all' | 'custom';
  baseClassFee?: number;
  perSubjectFee?: number;
  onSelectPlan?: (mode: 'all' | 'custom', subjects: string[]) => void;
  onBack?: () => void;
}

export const PlanComparisonPage: React.FC<PlanComparisonProps> = ({
  boardId: propBoardId,
  classId: propClassId,
  grade: propGrade,
  streamId: propStreamId,
  streamName: propStreamName,
  availableSubjects: propSubjects,
  initialSelectedSubjects,
  initialEnrollmentMode: _initialEnrollmentMode = 'all',
  baseClassFee: propBaseFee,
  perSubjectFee: propPerSubFee,
  onSelectPlan,
  onBack,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If used standalone via route, resolve params from query string
  const queryBoard = searchParams.get('board') || 'fbise';
  const queryGrade = searchParams.get('grade') || searchParams.get('class') || '10';
  const queryStream = searchParams.get('stream') || '';

  const activeBoardId = propBoardId || queryBoard;
  const activeGrade = propGrade || queryGrade;

  const [pricingSettings, setPricingSettings] = useState<SubjectPricingSettings>({
    per_subject_fee: propPerSubFee || 1000,
    auto_upgrade_threshold: 3,
  });
  const [baseFee, setBaseFee] = useState<number>(propBaseFee || getDefaultPrice(activeGrade, activeBoardId, propStreamName || queryStream) || 3000);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>(propSubjects || []);
  const [resolvedStreamName, setResolvedStreamName] = useState<string>(propStreamName || queryStream || 'General');
  
  // Per-subject interactive state
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(() => {
    if (initialSelectedSubjects && initialSelectedSubjects.length > 0) {
      return initialSelectedSubjects;
    }
    if (propSubjects && propSubjects.length > 0) {
      return propSubjects.slice(0, 2);
    }
    return [];
  });

  // Load admin-configurable subject pricing
  useEffect(() => {
    if (propPerSubFee && propPerSubFee > 0) {
      setPricingSettings(prev => ({ ...prev, per_subject_fee: propPerSubFee }));
    } else {
      getSubjectPricingSettings()
        .then((cfg) => {
          setPricingSettings(cfg);
        })
        .catch(console.warn);
    }
  }, [propPerSubFee]);

  // Load admin-configurable base class fee if not passed as prop
  useEffect(() => {
    if (propBaseFee && propBaseFee > 0) {
      setBaseFee(propBaseFee);
      return;
    }

    resolveGradeFeeConfig(activeGrade, propClassId, activeBoardId)
      .then((cfg) => {
        if (cfg && typeof cfg.amount === 'number' && cfg.amount > 0) {
          setBaseFee(cfg.amount);
        } else {
          setBaseFee(getDefaultPrice(activeGrade, activeBoardId, propStreamName || queryStream));
        }
      })
      .catch(() => {
        setBaseFee(getDefaultPrice(activeGrade, activeBoardId, propStreamName || queryStream));
      });
  }, [activeGrade, propClassId, activeBoardId, propBaseFee, propStreamName, queryStream]);

  // Load taxonomy if available subjects not provided
  useEffect(() => {
    if (propSubjects && propSubjects.length > 0) {
      setAvailableSubjects(propSubjects);
      if (selectedSubjects.length === 0) {
        setSelectedSubjects(propSubjects.slice(0, 2));
      }
      return;
    }

    if (activeBoardId === 'ielts') {
      const isGt = (queryStream || propStreamName || propStreamId || '').toLowerCase().includes('general') || (queryStream || '').toLowerCase().includes('gt');
      const ieltsSubs = isGt
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
      setAvailableSubjects(ieltsSubs);
      setResolvedStreamName(queryStream || propStreamName || (isGt ? 'General Training' : 'Academic'));
      if (selectedSubjects.length === 0) {
        setSelectedSubjects(ieltsSubs.slice(0, 2));
      }
      return;
    }

    getTaxonomy()
      .then((tax) => {
        const boardClasses = tax.classes.filter((c: any) => c.board_id === activeBoardId);
        const targetCls = propClassId
          ? boardClasses.find((c: any) => c.id === propClassId)
          : (boardClasses.find((c: any) => String(c.grade) === String(activeGrade)) || boardClasses[0]);

        const boardGrades = getGradesForBoard(activeBoardId);
        const gradeDef = boardGrades.find((g) => String(g.grade) === String(targetCls?.grade || activeGrade)) || boardGrades[0];
        const streams = gradeDef?.streams || [];
        const targetStreamQuery = propStreamId || propStreamName || queryStream;
        const selectedSt = targetStreamQuery
          ? streams.find((st) => st.name.toLowerCase() === targetStreamQuery.toLowerCase()) || streams[0]
          : streams[0];

        if (selectedSt) {
          setResolvedStreamName(selectedSt.name);
          setAvailableSubjects(selectedSt.subjects);
          if (selectedSubjects.length === 0) {
            setSelectedSubjects(selectedSt.subjects.slice(0, 2));
          }
        }
      })
      .catch((err) => {
        console.warn('[PlanComparisonPage] Failed to fetch taxonomy, using static definitions:', err);
        const boardGrades = getGradesForBoard(activeBoardId);
        const gradeDef = boardGrades.find((g) => String(g.grade) === String(activeGrade)) || boardGrades[0];
        const streams = gradeDef?.streams || [];
        const targetStreamQuery = propStreamId || propStreamName || queryStream;
        const selectedSt = targetStreamQuery
          ? streams.find((st) => st.name.toLowerCase() === targetStreamQuery.toLowerCase()) || streams[0]
          : streams[0];

        if (selectedSt) {
          setResolvedStreamName(selectedSt.name);
          setAvailableSubjects(selectedSt.subjects);
          if (selectedSubjects.length === 0) {
            setSelectedSubjects(selectedSt.subjects.slice(0, 2));
          }
        }
      });
  }, [activeBoardId, activeGrade, propClassId, propStreamId, propStreamName, queryStream, propSubjects]);

  // Toggle individual subject in Option A
  const toggleSubject = (sub: string) => {
    setSelectedSubjects(prev => 
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  const selectAllSubjects = () => {
    setSelectedSubjects([...availableSubjects]);
  };

  const clearSelectedSubjects = () => {
    setSelectedSubjects([]);
  };

  const isALevel = activeBoardId === 'alevel';
  const isOLevel = activeBoardId === 'olevel';

  // Calculations for live comparison
  const effectivePerSubRate = isALevel
    ? 6500
    : isOLevel
    ? 5000
    : pricingSettings.per_subject_fee;
  const rawTotal = selectedSubjects.length * effectivePerSubRate;
  const discountPercent = (isALevel || isOLevel) && selectedSubjects.length >= 2 ? 0.05 : 0;
  const discountAmount = Math.round(rawTotal * discountPercent);
  const runningTotal = rawTotal - discountAmount;
  const totalAvailableCount = availableSubjects.length || 8;
  const fullIndividualRate = totalAvailableCount * effectivePerSubRate;
  
  // Dynamic savings calculations
  const bundleSavings = Math.max(0, fullIndividualRate - baseFee);
  const liveComparisonDiff = runningTotal - baseFee;

  const currentBoardDef = BOARDS.find((b) => b.id === activeBoardId) || BOARDS[0];

  const handleChooseCustomPlan = () => {
    if (onSelectPlan) {
      onSelectPlan('custom', selectedSubjects.length > 0 ? selectedSubjects : availableSubjects.slice(0, 2));
    } else {
      navigate(`/unregistered?board=${activeBoardId}&grade=${activeGrade}&mode=custom`);
    }
  };

  const handleChooseFullPlan = () => {
    if (onSelectPlan) {
      onSelectPlan('all', availableSubjects);
    } else {
      navigate(`/unregistered?board=${activeBoardId}&grade=${activeGrade}&mode=all`);
    }
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div id="plan-comparison-screen" className="min-h-screen bg-[#FAFAFA] py-8 px-4 sm:px-6 lg:px-8 text-[#111111]">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-5">
          <div>
            <button
              id="back-to-enrollment-btn"
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#737373] hover:text-[#111111] transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>{onBack ? 'Back to Selection' : 'Back to Tuition Estimator'}</span>
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-[#111111]">
                {isALevel || isOLevel
                  ? `Cambridge ${isALevel ? 'A Levels' : 'O Levels'} — Per-Subject Tuition`
                  : 'Enrollment Plan Comparison'}
              </h1>
              <span className="hidden sm:inline-block text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-[#FFFBF0] text-[#92700A] border border-[#FDE68A] whitespace-nowrap shrink-0">
                {isALevel || isOLevel ? 'Per-Subject Enrollment' : 'Decision Guide'}
              </span>
            </div>
            <p className="text-xs text-[#737373] mt-1 max-w-2xl leading-relaxed">
              {isALevel || isOLevel
                ? 'Cambridge qualifications operate strictly on per-subject pricing. Select the subjects you wish to study to calculate your tuition fee. A flat 5% discount applies automatically when selecting 2 or more subjects.'
                : 'Select the right learning structure for your goals. You can choose individual subjects or the complete curriculum package.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-white p-2 rounded-xl border border-[#E5E5E5] shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#111111] font-bold text-xs">
              <Layers size={16} />
            </div>
            <div className="text-left pr-2">
              <div className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider">Active Curriculum</div>
              <div className="text-xs font-extrabold text-[#111111]">
                {currentBoardDef.shortName} • {activeBoardId === 'ielts' ? 'IELTS Track' : `${isALevel ? 'A Levels' : isOLevel ? 'O Levels' : `Grade ${activeGrade}`} (${resolvedStreamName})`}
              </div>
            </div>
          </div>
        </div>

        {/* CAMBRIDGE PER-SUBJECT VIEW (STRICTLY SINGLE-PLAN, NO OPTION A/B FRAMING) */}
        {(isALevel || isOLevel) ? (
          <div className="space-y-6">
            {/* Policy & Rate Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] shadow-xs">
                <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1">
                  Tuition Fee Rate
                </span>
                <div className="text-2xl font-black text-[#111111] font-mono">
                  PKR {effectivePerSubRate.toLocaleString()} <span className="text-xs font-semibold text-[#737373]">/ subject / term</span>
                </div>
                <p className="text-xs text-[#737373] mt-1">
                  Fixed per-subject rate for Cambridge {isALevel ? 'A Levels' : 'O Levels'}. Only pay for enrolled subjects.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFBF0] border border-[#FDE68A] shadow-xs">
                <span className="text-[10px] font-extrabold text-[#92700A] uppercase tracking-wider block mb-1">
                  Multi-Subject Discount Policy
                </span>
                <div className="text-sm font-black text-[#111111]">
                  Flat 5% Off for 2+ Subjects
                </div>
                <p className="text-xs text-[#92700A] mt-1 leading-relaxed">
                  1 subject: Full price (no discount). 2 or more subjects: A flat 5% discount applies to the total tuition.
                </p>
              </div>
            </div>

            {/* Subject Selection & Live Calculator Card */}
            <div className="bg-white rounded-2xl border border-[#E5E5E5] p-5 sm:p-7 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-4">
                <div>
                  <h2 className="text-base font-black text-[#111111] tracking-tight">
                    Select Subjects ({selectedSubjects.length} of {totalAvailableCount} selected)
                  </h2>
                  <p className="text-xs text-[#737373] mt-0.5">
                    Choose the individual subjects you wish to attend for live classes and assessments.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllSubjects}
                    className="text-xs font-bold text-[#737373] hover:text-[#111111] underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-zinc-300">•</span>
                  <button
                    type="button"
                    onClick={clearSelectedSubjects}
                    className="text-xs font-bold text-[#737373] hover:text-[#111111] underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Subject Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableSubjects.map((sub) => {
                  const isSelected = selectedSubjects.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#111111] text-white border-[#111111] shadow-2xs'
                          : 'bg-[#FAFAFA] text-[#262626] border-[#E5E5E5] hover:bg-white hover:border-[#D4D4D4]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 border ${
                            isSelected
                              ? 'bg-[#F4C430] text-[#111111] border-[#F4C430]'
                              : 'border-[#D4D4D4] bg-white'
                          }`}
                        >
                          {isSelected && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span className="text-xs font-bold truncate">{sub}</span>
                      </div>
                      <span className={`text-[11px] font-mono shrink-0 whitespace-nowrap ${isSelected ? 'text-[#F4C430] font-bold' : 'text-[#737373]'}`}>
                        PKR {effectivePerSubRate.toLocaleString()} / term
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Live Tuition Breakdown Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block">
                      Total Tuition Due (Live Calculation)
                    </span>
                    <div className="text-2xl font-black text-[#111111] font-mono">
                      PKR {runningTotal.toLocaleString()} <span className="text-xs font-bold text-amber-900">/ term</span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-bold text-amber-900 block">
                      {selectedSubjects.length} of {totalAvailableCount} Subjects Selected
                    </span>
                    <span className="text-[11px] text-amber-800 font-mono">
                      {selectedSubjects.length === 0
                        ? 'No subjects selected'
                        : `${selectedSubjects.length} × PKR ${effectivePerSubRate.toLocaleString()} = PKR ${rawTotal.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                {/* Calculation Details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  {selectedSubjects.length === 0 ? (
                    <span className="text-amber-800 font-medium">
                      Please select at least 1 subject to calculate your tuition.
                    </span>
                  ) : selectedSubjects.length === 1 ? (
                    <span className="text-amber-900 font-medium">
                      Single subject enrollment: Full standard price (no multi-subject discount).
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300 whitespace-nowrap shrink-0">
                        Flat 5% Multi-Subject Discount Applied
                      </span>
                      <span className="text-xs font-bold text-emerald-900 font-mono whitespace-nowrap">
                        -PKR {discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="text-[11px] text-amber-800">
                    Formula: {selectedSubjects.length >= 2 ? '(Count × Rate) × 0.95' : 'Count × Rate'}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  id="btn-choose-per-subject"
                  type="button"
                  onClick={handleChooseCustomPlan}
                  disabled={selectedSubjects.length === 0}
                  className="btn btn-gold btn-md w-full py-3.5 font-black text-xs flex items-center justify-center gap-2 rounded-xl transition-all interactive cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>
                    {selectedSubjects.length === 0
                      ? 'Select at Least 1 Subject to Continue'
                      : `Proceed to Enrollment with Selected Subjects (${selectedSubjects.length})`}
                  </span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* STANDARD BOARDS: OPTION A vs OPTION B (FBISE, PUNJAB, SINDH, KPK, IELTS) */
          <>
            {/* Informational Guidance Notice */}
            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed">
              <HelpCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Transparent & Flexible Enrollment:</span> Both options below are fully open and selectable. You have full freedom to choose either single subjects tailored to your study schedule or the complete all-inclusive stream bundle.
              </div>
            </div>

            {/* Comparison Grid: Side-by-Side Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              
              {/* OPTION A: Per-Subject Plan */}
              <div 
                id="plan-option-per-subject" 
                className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4 sm:p-6 flex flex-col justify-between shadow-xs transition-all hover:border-[#D4D4D4]"
              >
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="text-xs font-bold text-[#737373] uppercase tracking-wider whitespace-nowrap">
                        Option A
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5] whitespace-nowrap shrink-0">
                        A La Carte
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-[#111111] tracking-tight">
                      Per-Subject Plan
                    </h2>
                    <p className="text-xs text-[#737373] mt-1 leading-relaxed">
                      Enroll in specific subjects of your choice. Pay only for the curriculum areas where you need live instruction, mentoring, and practice.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block">Standard Subject Rate</span>
                      <div className="text-lg font-black text-[#111111] font-mono">
                        PKR {effectivePerSubRate.toLocaleString()} <span className="text-xs font-semibold text-[#737373]">/ subject / term</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white border border-[#E5E5E5] text-[#525252] self-start sm:self-center whitespace-nowrap shrink-0">
                      Admin Configured
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#111111]">
                        Available Subjects ({selectedSubjects.length} selected):
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={selectAllSubjects}
                          className="text-[11px] font-bold text-[#737373] hover:text-[#111111] underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-zinc-300">•</span>
                        <button
                          type="button"
                          onClick={clearSelectedSubjects}
                          className="text-[11px] font-bold text-[#737373] hover:text-[#111111] underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1 overscroll-contain">
                      {availableSubjects.map((sub) => {
                        const isSelected = selectedSubjects.includes(sub);
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => toggleSubject(sub)}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#111111] text-white border-[#111111] shadow-2xs'
                                : 'bg-[#FAFAFA] text-[#262626] border-[#E5E5E5] hover:bg-white hover:border-[#D4D4D4]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div 
                                className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 border ${
                                  isSelected
                                    ? 'bg-[#F4C430] text-[#111111] border-[#F4C430]'
                                    : 'border-[#D4D4D4] bg-white'
                                }`}
                              >
                                {isSelected && <Check size={11} strokeWidth={3} />}
                              </div>
                              <span className="text-xs font-bold truncate">{sub}</span>
                            </div>
                            <span className={`text-[10px] sm:text-[11px] font-mono shrink-0 whitespace-nowrap ${isSelected ? 'text-[#F4C430] font-bold' : 'text-[#737373]'}`}>
                              PKR {effectivePerSubRate.toLocaleString()} / term
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block">
                        Running Total (Live Updating)
                      </span>
                      <div className="text-xl font-black text-[#111111] font-mono">
                        PKR {runningTotal.toLocaleString()} <span className="text-xs font-bold text-amber-900">/ term</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-bold text-amber-900 block">
                        {selectedSubjects.length} of {totalAvailableCount} Subjects
                      </span>
                      <span className="text-[10px] text-amber-700 block">
                        {selectedSubjects.length === 0 ? 'None chosen' : `${selectedSubjects.length} × PKR ${effectivePerSubRate.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#F5F5F5] mt-6">
                  <button
                    id="btn-choose-per-subject"
                    type="button"
                    onClick={handleChooseCustomPlan}
                    className="btn btn-secondary w-full py-3 font-extrabold text-xs flex items-center justify-center gap-2 rounded-xl transition-all interactive cursor-pointer"
                  >
                    <span>Proceed with Selected Subjects ({selectedSubjects.length})</span>
                    <ArrowRight size={14} />
                  </button>
                  <p className="text-[10px] text-[#A3A3A3] text-center mt-2">
                    Subject choices can be fine-tuned on the next screen.
                  </p>
                </div>
              </div>

              {/* OPTION B: Full / All-Subjects Plan */}
              <div 
                id="plan-option-all-subjects" 
                className="relative rounded-2xl bg-[#111111] border-2 border-[#111111] p-4 pt-8 sm:p-7 sm:pt-9 shadow-xl flex flex-col justify-between text-white mt-4 sm:mt-0"
              >
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap pointer-events-none">
                  <span
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-md whitespace-nowrap"
                    style={{ background: '#F4C430', color: '#111111' }}
                  >
                    <Sparkles size={12} className="text-[#111111] shrink-0" />
                    <span className="whitespace-nowrap">Recommended • Best Value</span>
                  </span>
                </div>

                <div className="space-y-6 pt-2">
                  <div>
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider whitespace-nowrap">
                        Option B
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#262626] text-[#F4C430] whitespace-nowrap shrink-0">
                        Complete Curriculum
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-white tracking-tight">
                        All-Subjects Plan
                      </h2>
                      <Zap size={16} className="text-[#F4C430]" />
                    </div>
                    <p className="text-xs text-[#A3A3A3] mt-1 leading-relaxed">
                      Full bundled access to every single subject in your academic grade and stream, including lectures, notes vaults, and scheduled assessments.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-bold text-[#737373]">PKR</span>
                      <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
                        {baseFee.toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-[#A3A3A3]">/ term</span>
                    </div>
                    <div className="text-xs font-bold text-[#F4C430] mt-1 flex items-center gap-1.5">
                      <Check size={13} strokeWidth={3} />
                      <span>Flat Rate — All {totalAvailableCount} Subjects Included</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#1C2619] border border-[#2e4c27] text-emerald-300">
                    <div className="flex items-start gap-2">
                      <Sparkles size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-xs leading-snug">
                        <span className="font-extrabold text-emerald-200 block mb-0.5">
                          {liveComparisonDiff > 0
                            ? `Save PKR ${liveComparisonDiff.toLocaleString()} vs your current selection!`
                            : bundleSavings > 0
                            ? `Save PKR ${bundleSavings.toLocaleString()} compared to individual subjects!`
                            : 'Bundled Curriculum Savings'}
                        </span>
                        <span className="text-[11px] text-emerald-300/80">
                          Buying all {totalAvailableCount} subjects individually would cost PKR {fullIndividualRate.toLocaleString()} (at PKR {effectivePerSubRate.toLocaleString()} each). The flat plan delivers complete curriculum coverage for just PKR {baseFee.toLocaleString()}.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-white tracking-wide">
                      What's Included in the Full Plan:
                    </div>
                    <ul className="space-y-2 text-xs text-[#D4D4D4]">
                      <li className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-[#262626] flex items-center justify-center shrink-0">
                          <Check size={11} className="text-[#F4C430]" strokeWidth={2.5} />
                        </div>
                        <span>All {totalAvailableCount} subjects in the {resolvedStreamName} curriculum</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-[#262626] flex items-center justify-center shrink-0">
                          <Check size={11} className="text-[#F4C430]" strokeWidth={2.5} />
                        </div>
                        <span>Unrestricted access to all live interactive class schedules</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-[#262626] flex items-center justify-center shrink-0">
                          <Check size={11} className="text-[#F4C430]" strokeWidth={2.5} />
                        </div>
                        <span>Class tests, timed assessments & solution vaults across all subjects</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-[#262626] flex items-center justify-center shrink-0">
                          <Check size={11} className="text-[#F4C430]" strokeWidth={2.5} />
                        </div>
                        <span>Comprehensive revision & exam prep for board examination</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#262626] mt-6">
                  <button
                    id="btn-choose-all-subjects"
                    type="button"
                    onClick={handleChooseFullPlan}
                    className="btn btn-gold btn-md w-full py-3.5 font-black text-xs flex items-center justify-center gap-2 rounded-xl transition-all interactive cursor-pointer shadow-lg"
                  >
                    <span>Choose All-Subjects Plan (PKR {baseFee.toLocaleString()})</span>
                    <ArrowRight size={14} />
                  </button>
                  <p className="text-[10px] text-[#737373] text-center mt-2">
                    Includes all {totalAvailableCount} subjects with zero additional fees.
                  </p>
                </div>
              </div>

            </div>
          </>
        )}

        {/* Bottom Help / Information Footer */}
        <div className="p-4 bg-white rounded-xl border border-[#E5E5E5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#737373]">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[#F4C430] shrink-0" />
            <span>Need advice? Both plans grant full student access to student dashboards, Sage AI, and teacher announcements.</span>
          </div>
          <button
            type="button"
            onClick={handleGoBack}
            className="text-xs font-bold text-[#111111] hover:underline shrink-0 cursor-pointer"
          >
            {onBack ? 'Continue with Form' : 'Return to Pricing'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PlanComparisonPage;
