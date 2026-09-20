import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone,
  X,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Award,
  CheckCircle2,
  Layers,
  CheckSquare,
  LayoutDashboard,
  CreditCard,
  Zap,
} from 'lucide-react';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { useAuth } from '../../features/auth/AuthContext';
import { getClassesWithFeeConfigs } from '../../lib/db';
import { getSubjectPricingSettings } from '../../lib/subjectEnrollmentService';
import { getScholarshipTiers } from '../../lib/scholarshipService';
import { ScholarshipTier } from '../../types/scholarship';

const SESSION_STORAGE_KEY = 'shs_admissions_announcement_seen';
const ACADEMY_LOGO_URL = 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/IMG-20260627-WA0049.jpg';

type BoardTab = 'fbise' | 'punjab' | 'sindh' | 'kpk' | 'cambridge';

interface BoardTabInfo {
  id: BoardTab;
  label: string;
  enrollName: string;
  boardParam: string;
}

const BOARD_TABS: BoardTabInfo[] = [
  { id: 'fbise', label: 'FBISE', enrollName: 'FBISE Board', boardParam: 'fbise' },
  { id: 'punjab', label: 'Punjab', enrollName: 'Punjab Board', boardParam: 'punjab' },
  { id: 'sindh', label: 'Sindh', enrollName: 'Sindh Board', boardParam: 'sindh' },
  { id: 'kpk', label: 'KPK', enrollName: 'KPK Board', boardParam: 'kpk' },
  { id: 'cambridge', label: 'A/O Levels', enrollName: 'A/O Levels', boardParam: 'alevel' },
];

export const AdmissionsAnnouncementModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<BoardTab>('fbise');

  // Dynamic fee state with reliable fallbacks
  const [fscAllFee, setFscAllFee] = useState<number>(4000);
  const [matricAllFee, setMatricAllFee] = useState<number>(3000);
  const [perSubjectFee, setPerSubjectFee] = useState<number>(1000);
  const [aLevelFee, setALevelFee] = useState<number>(6500);
  const [oLevelFee, setOLevelFee] = useState<number>(5000);

  // Dynamic scholarship tiers with fallbacks
  const [scholarshipTiers, setScholarshipTiers] = useState<ScholarshipTier[]>([]);

  const { session } = useAuth();
  const navigate = useNavigate();

  // 1. Lock background page scroll without moving page position
  useModalScrollLock(isOpen);

  // 2. Fetch live fee configurations & scholarship tiers
  useEffect(() => {
    let isMounted = true;

    const loadLivePricing = async () => {
      try {
        // Fetch per-subject fee
        const pricingSettings = await getSubjectPricingSettings();
        if (isMounted && pricingSettings?.per_subject_fee) {
          setPerSubjectFee(pricingSettings.per_subject_fee);
        }

        // Fetch scholarship tiers
        const tiers = await getScholarshipTiers();
        if (isMounted && Array.isArray(tiers) && tiers.length > 0) {
          setScholarshipTiers(tiers);
        }

        // Fetch class fees (FSC & Matric)
        const classes = await getClassesWithFeeConfigs();
        if (isMounted && Array.isArray(classes)) {
          // Look for FSC (Class 11 or 12)
          const fscCls = classes.find(
            (c) =>
              (c.grade === '11' || c.grade === '12') &&
              c.amount &&
              c.amount > 0
          );
          if (fscCls && fscCls.amount) {
            setFscAllFee(fscCls.amount);
          }

          // Look for Matric (Class 9 or 10)
          const matricCls = classes.find(
            (c) =>
              (c.grade === '9' || c.grade === '10') &&
              c.amount &&
              c.amount > 0
          );
          if (matricCls && matricCls.amount) {
            setMatricAllFee(matricCls.amount);
          }

          // Look for Cambridge A/O Levels
          const aLevelCls = classes.find((c) => c.board_id === 'alevel' && c.amount && c.amount > 0);
          if (aLevelCls && aLevelCls.amount) {
            setALevelFee(aLevelCls.amount);
          }
          const oLevelCls = classes.find((c) => c.board_id === 'olevel' && c.amount && c.amount > 0);
          if (oLevelCls && oLevelCls.amount) {
            setOLevelFee(oLevelCls.amount);
          }
        }
      } catch (err) {
        console.warn('[AdmissionsAnnouncementModal] Live price resolution notice:', err);
      }
    };

    loadLivePricing();

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Check sessionStorage once per session on page load (only for visitors who are NOT logged in)
  useEffect(() => {
    if (session) {
      setIsOpen(false);
      return;
    }
    try {
      const seen = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!seen) {
        // Automatically open modal on first session visit
        setIsOpen(true);
      }
    } catch {
      // If sessionStorage unavailable, default to open
      setIsOpen(true);
    }
  }, [session]);

  // 4. Close handler
  const handleClose = useCallback(() => {
    setIsOpen(false);
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  // 5. ESC key closes modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Do not show modal if closed or if user is logged in (student, teacher, or admin)
  if (!isOpen || session) return null;

  // Resolve scholarship percentages from tiers or fallbacks
  const tier90 = scholarshipTiers.find((t) => t.is_active && t.min_marks_percentage >= 90);
  const tier80 = scholarshipTiers.find((t) => t.is_active && t.min_marks_percentage >= 80 && t.min_marks_percentage < 90);
  const tierImp = scholarshipTiers.find(
    (t) =>
      t.is_active &&
      (t.id === 'tier-improvement-50' ||
        (t.tier_name && t.tier_name.toLowerCase().includes('improvement')) ||
        (t.description && t.description.toLowerCase().includes('improvement')))
  );

  const pct90 = tier90?.discount_percentage ?? 60;
  const pct80 = tier80?.discount_percentage ?? 40;
  const pctImp = tierImp?.discount_percentage ?? 50;

  // Navigation helpers
  const handleStartEnrollment = () => {
    handleClose();
    if (session) {
      navigate('/student/checkout');
    } else {
      navigate('/register');
    }
  };

  const handleEnrollBoard = (boardParam: string) => {
    handleClose();
    if (session) {
      navigate(`/student/checkout?board=${boardParam}`);
    } else {
      navigate(`/register?board=${boardParam}`);
    }
  };

  const handleApplyScholarship = () => {
    handleClose();
    if (session) {
      navigate('/student/checkout?applyScholarship=true');
    } else {
      navigate('/register?scholarship=true');
    }
  };

  const handleOpenDashboard = () => {
    handleClose();
    if (session) {
      navigate('/student');
    } else {
      navigate('/login');
    }
  };

  return createPortal(
    <div
      id="admissions-announcement-portal"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admissions-modal-title"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 -z-10 cursor-pointer"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#121214] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90dvh] overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* 1. Header Bar: Navy #082B5C with gold underline #E6A900 */}
        <div className="bg-[#082B5C] border-b-2 border-[#E6A900] px-4 py-3 sm:px-6 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#E6A900]/20 border border-[#E6A900]/40 flex items-center justify-center shrink-0">
              <Megaphone size={16} className="text-[#E6A900] animate-bounce-subtle" />
            </div>
            <h1
              id="admissions-modal-title"
              className="text-xs sm:text-sm md:text-base font-black tracking-wide text-white uppercase truncate"
            >
              Admissions 2026-27 Now Open
            </h1>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close Announcement"
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content inside modal */}
        <div className="overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
          
          {/* 2. Hero Card: Dark midnight #031426, rounded, subtle border */}
          <div className="bg-[#031426] border border-white/15 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#082B5C] rounded-full blur-3xl opacity-50 pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#E6A900] rounded-full blur-3xl opacity-15 pointer-events-none" />

            <div className="relative z-10">
              {/* Top Row: Green pill & Academy Logo */}
              <div className="flex items-center justify-between gap-2 flex-wrap mb-3.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Admissions Open
                </span>

                <div className="flex items-center gap-2">
                  <img
                    src={ACADEMY_LOGO_URL}
                    alt="SHS Virtual Academy"
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-white/30 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs sm:text-sm font-extrabold text-white tracking-tight">
                    SHS Virtual Academy
                  </span>
                </div>
              </div>

              {/* Headline */}
              <h2 className="text-lg sm:text-2xl font-black text-white leading-tight tracking-tight">
                Enroll Now in FBISE, Punjab, Sindh, KPK Boards &amp; A/O Levels
              </h2>

              {/* Tagline */}
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 font-medium leading-relaxed">
                Live classes, notes, attendance and tests, powered by Scholario LMS.
              </p>

              {/* Two side-by-side mini cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {/* FSC Mini Card */}
                <div className="bg-white/10 hover:bg-white/[0.14] border border-white/15 rounded-xl p-3 sm:p-3.5 transition-colors">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-black text-[#E6A900] uppercase tracking-wide">
                      FSC (Part 1 &amp; 2)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white/90">
                      Intermediate
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    All Subjects: <span className="font-extrabold text-[#E6A900]">PKR {fscAllFee.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Per Subject: <span className="font-semibold text-white">PKR {perSubjectFee.toLocaleString()}</span>
                  </div>
                </div>

                {/* Matric Mini Card */}
                <div className="bg-white/10 hover:bg-white/[0.14] border border-white/15 rounded-xl p-3 sm:p-3.5 transition-colors">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-black text-[#E6A900] uppercase tracking-wide">
                      Matric (9th &amp; 10th)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white/90">
                      Secondary
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    All Subjects: <span className="font-extrabold text-[#E6A900]">PKR {matricAllFee.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Per Subject: <span className="font-semibold text-white">PKR {perSubjectFee.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Big Red/Gold CTA Button */}
              <button
                type="button"
                id="modal-hero-start-enrollment-btn"
                onClick={handleStartEnrollment}
                className="w-full mt-4 min-h-[46px] py-3.5 px-6 rounded-xl font-black text-sm sm:text-base uppercase tracking-wider text-white bg-gradient-to-r from-[#B91C1C] via-[#DC2626] to-[#E6A900] hover:brightness-110 active:scale-[0.99] shadow-lg hover:shadow-red-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start Enrollment Now</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* 3. Section: Coaching Fees by Board */}
          <div className="bg-slate-50 dark:bg-[#1A1A1E] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 border-l-4 border-l-[#082B5C] shadow-xs space-y-3.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-[#082B5C] dark:text-blue-400 shrink-0" />
                <h3 className="text-sm sm:text-base font-extrabold text-[#082B5C] dark:text-blue-300">
                  Coaching Fees by Board
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Monthly tuition rates
              </span>
            </div>

            {/* Board Selector Tabs/Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {BOARD_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#082B5C] text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Pricing Table */}
            <div className="bg-white dark:bg-[#141416] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {activeTab === 'cambridge' ? (
                // Cambridge A/O Levels Table
                <div className="p-3.5 sm:p-4 space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400">
                          <th className="py-2 pr-3">Level / Stream</th>
                          <th className="py-2 px-3">Monthly Tuition</th>
                          <th className="py-2 pl-3">Enrollment Format</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                        <tr>
                          <td className="py-2.5 pr-3 font-bold text-[#082B5C] dark:text-blue-300">
                            A Levels (AS &amp; A2)
                          </td>
                          <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-extrabold">
                            PKR {aLevelFee.toLocaleString()} <span className="font-normal text-[11px] text-slate-500">/ subject</span>
                          </td>
                          <td className="py-2.5 pl-3 text-slate-500 dark:text-slate-400">
                            Modular Per-Subject
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 pr-3 font-bold text-[#082B5C] dark:text-blue-300">
                            O Levels (O1, O2, O3)
                          </td>
                          <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-extrabold">
                            PKR {oLevelFee.toLocaleString()} <span className="font-normal text-[11px] text-slate-500">/ subject</span>
                          </td>
                          <td className="py-2.5 pl-3 text-slate-500 dark:text-slate-400">
                            Modular Per-Subject
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Discount Note */}
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-200 font-semibold flex items-center gap-2">
                    <Sparkles size={14} className="text-[#E6A900] shrink-0" />
                    <span>
                      <strong>Multi-Subject Discount:</strong> 5% per month discount automatically applied if more than one subject is selected.
                    </span>
                  </div>
                </div>
              ) : (
                // FBISE / Punjab / Sindh / KPK Table
                <div className="p-3.5 sm:p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400">
                          <th className="py-2 pr-3">Stream / Grade</th>
                          <th className="py-2 px-3">All Subjects Plan</th>
                          <th className="py-2 pl-3">Per Subject Plan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                        <tr>
                          <td className="py-2.5 pr-3 font-bold text-[#082B5C] dark:text-blue-300">
                            FSC (11th &amp; 12th)
                          </td>
                          <td className="py-2.5 px-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                            PKR {fscAllFee.toLocaleString()} <span className="font-normal text-[11px] text-slate-500">/ month</span>
                          </td>
                          <td className="py-2.5 pl-3 font-bold text-slate-700 dark:text-slate-300">
                            PKR {perSubjectFee.toLocaleString()} <span className="font-normal text-[11px] text-slate-500">/ subject</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 pr-3 font-bold text-[#082B5C] dark:text-blue-300">
                            Matric (9th &amp; 10th)
                          </td>
                          <td className="py-2.5 px-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                            PKR {matricAllFee.toLocaleString()} <span className="font-normal text-[11px] text-slate-500">/ month</span>
                          </td>
                          <td className="py-2.5 pl-3 font-bold text-slate-700 dark:text-slate-300">
                            PKR {perSubjectFee.toLocaleString()} <span className="font-normal text-[11px] text-slate-500">/ subject</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Action button under tab */}
            {(() => {
              const currentTab = BOARD_TABS.find((t) => t.id === activeTab) || BOARD_TABS[0];
              return (
                <button
                  type="button"
                  onClick={() => handleEnrollBoard(currentTab.boardParam)}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-[#082B5C] hover:bg-[#0c3b7a] active:scale-[0.99] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Enroll in {currentTab.enrollName}</span>
                  <ArrowRight size={15} />
                </button>
              );
            })()}
          </div>

          {/* 4. Section: Merit Scholarships */}
          <div className="bg-amber-50/60 dark:bg-[#1A1A1E] rounded-2xl p-4 sm:p-5 border border-amber-200/80 dark:border-amber-900/40 border-l-4 border-l-[#E6A900] shadow-xs space-y-3.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-[#E6A900] shrink-0" />
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-amber-200">
                  Merit Scholarships <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">(FSC Part 1)</span>
                </h3>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-950 text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                Tuition Waivers
              </span>
            </div>

            {/* 3 scholarship blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-white dark:bg-[#141416] border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 text-center">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  80+ Marks / Grade A
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#082B5C] dark:text-blue-400 mt-0.5">
                  {pct80}%
                </div>
                <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mt-0.5">
                  Scholarship
                </div>
              </div>

              <div className="bg-white dark:bg-[#141416] border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 text-center ring-1 ring-[#E6A900]/30">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  90+ Marks / Grade A*
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#E6A900] mt-0.5">
                  {pct90}%
                </div>
                <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mt-0.5">
                  High Distinction
                </div>
              </div>

              <div className="bg-white dark:bg-[#141416] border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 text-center">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Improvement Students
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                  {pctImp}%
                </div>
                <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mt-0.5">
                  Scholarship
                </div>
              </div>
            </div>

            {/* Note & Button */}
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Upload your marksheet or result card during registration. The fee discount will be reflected as provisional on your checkout and verified by academy administrators.
            </p>

            <button
              type="button"
              id="modal-apply-scholarship-btn"
              onClick={handleApplyScholarship}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-[#082B5C] bg-[#E6A900] hover:bg-[#d49b00] active:scale-[0.99] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Apply for Scholarship</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* 5. Section: How to Enroll in 6 Easy Steps */}
          <div className="bg-white dark:bg-[#1A1A1E] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                How to Enroll in 6 Easy Steps
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Step 1 */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#141416] border border-slate-100 dark:border-slate-800/80">
                <span className="w-6 h-6 rounded-full bg-[#082B5C] text-white text-xs font-black flex items-center justify-center shrink-0">
                  1
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 48 48" fill="none" aria-hidden="true" className="shrink-0">
                      <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
                      <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
                      <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
                      <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
                    </svg>
                    <span>Sign in with Google</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Continue with your Google account to create or access your student profile.
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#141416] border border-slate-100 dark:border-slate-800/80">
                <span className="w-6 h-6 rounded-full bg-[#082B5C] text-white text-xs font-black flex items-center justify-center shrink-0">
                  2
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Layers size={13} className="text-[#082B5C] dark:text-blue-400" />
                    <span>Choose Your Stream &amp; Board</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Select FSC, Matric, or Cambridge, then your board.
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#141416] border border-slate-100 dark:border-slate-800/80">
                <span className="w-6 h-6 rounded-full bg-[#082B5C] text-white text-xs font-black flex items-center justify-center shrink-0">
                  3
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <CheckSquare size={13} className="text-[#082B5C] dark:text-blue-400" />
                    <span>Select Your Subjects</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Choose All Subjects or pick specific modular subjects.
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#141416] border border-slate-100 dark:border-slate-800/80">
                <span className="w-6 h-6 rounded-full bg-[#082B5C] text-white text-xs font-black flex items-center justify-center shrink-0">
                  4
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <LayoutDashboard size={13} className="text-[#082B5C] dark:text-blue-400" />
                    <span>Review in Dashboard</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Inspect your class schedules, timetable, and subjects.
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#141416] border border-slate-100 dark:border-slate-800/80">
                <span className="w-6 h-6 rounded-full bg-[#082B5C] text-white text-xs font-black flex items-center justify-center shrink-0">
                  5
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <CreditCard size={13} className="text-[#082B5C] dark:text-blue-400" />
                    <span>Submit Your Fee Proof</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Pick a payment number (Easypaisa/JazzCash) &amp; send receipt.
                  </div>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#141416] border border-slate-100 dark:border-slate-800/80">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                  6
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Zap size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Instant 5-Min Access</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Receive complete LMS access within 5 minutes of verification!
                  </div>
                </div>
              </div>
            </div>

            {/* Open Dashboard Button */}
            <button
              type="button"
              id="modal-open-dashboard-btn"
              onClick={handleOpenDashboard}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.99] transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <span>Open My Dashboard</span>
              <ArrowRight size={15} />
            </button>
          </div>

        </div>

        {/* 6. Footer: Full-Width "Close Announcement" Button */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-[#121214] border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            id="modal-footer-close-btn"
            onClick={handleClose}
            className="w-full min-h-[44px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1E1E22] hover:bg-slate-100 dark:hover:bg-[#28282D] hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer shadow-2xs"
          >
            Close Announcement
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default AdmissionsAnnouncementModal;
