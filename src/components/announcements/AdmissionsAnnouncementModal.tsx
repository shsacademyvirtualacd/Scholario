import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Megaphone,
  Sparkles,
  ArrowRight,
  Award,
  Layers,
  CheckSquare,
  LayoutDashboard,
  PhoneCall,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { resolveGradeFeeConfig } from '../../lib/db';
import { getScholarshipTiers } from '../../lib/scholarshipService';
import type { ScholarshipTier } from '../../types/scholarship';

const SHS_LOGO_URL = 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/IMG-20260627-WA0049.jpg';

export const AdmissionsAnnouncementModal: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(!session);
  const [scholarshipTiers, setScholarshipTiers] = useState<ScholarshipTier[]>([]);
  const [fscFee, setFscFee] = useState<number>(4000);
  const [matricFee, setMatricFee] = useState<number>(3000);

  // 1. Fetch live scholarship tiers for dynamic discounts
  useEffect(() => {
    let isMounted = true;
    getScholarshipTiers()
      .then((tiers) => {
        if (isMounted && tiers && tiers.length > 0) {
          setScholarshipTiers(tiers);
        }
      })
      .catch((err) => {
        console.warn('[AdmissionsAnnouncementModal] Live scholarship tiers notice:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch live fee rates for FSC (grade 11) and Matric (grade 10)
  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      resolveGradeFeeConfig('11', null, 'fbise'),
      resolveGradeFeeConfig('10', null, 'fbise'),
    ]).then(([fscRes, matricRes]) => {
      if (!isMounted) return;
      if (fscRes.status === 'fulfilled' && fscRes.value?.amount) {
        setFscFee(fscRes.value.amount);
      }
      if (matricRes.status === 'fulfilled' && matricRes.value?.amount) {
        setMatricFee(matricRes.value.amount);
      }
    }).catch((err) => {
      console.warn('[AdmissionsAnnouncementModal] Live price resolution notice:', err);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Ensure modal is prominently open on the front when visiting the site
  useEffect(() => {
    if (session) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [session]);

  // 4. Close handler
  const handleClose = useCallback(() => {
    setIsOpen(false);
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
  const maxDiscountPct = tier90?.discount_percentage || 40;
  const midDiscountPct = tier80?.discount_percentage || 30;

  const handleApplyNow = () => {
    handleClose();
    navigate('/register');
  };

  const handleLogin = () => {
    handleClose();
    navigate('/login');
  };

  const handleWhatsApp = () => {
    window.open('https://chat.whatsapp.com/L3EYfjDXFNOGTzZjAjRuvg', '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admissions-announcement-title"
    >
      {/* Click outside to close backdrop */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Main Dialog Container */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0B1120] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh] animate-in zoom-in-95 duration-200 z-10">
        
        {/* ─── 1. Header Bar (Navy #082B5C, Gold Underline #E6A900) ─── */}
        <div className="bg-[#082B5C] border-b-2 border-[#E6A900] px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between text-white shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#E6A900]/20 flex items-center justify-center text-[#E6A900] shrink-0 border border-[#E6A900]/40">
              <Megaphone size={14} className="animate-pulse" />
            </div>
            <h1
              id="admissions-announcement-title"
              className="text-xs sm:text-sm font-black tracking-wider uppercase text-white"
            >
              ADMISSIONS 2026–27 NOW OPEN
            </h1>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all cursor-pointer"
            aria-label="Close Announcement"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Scrollable Modal Body ─── */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 text-slate-800 dark:text-slate-200 select-text">
          
          {/* ─── 2. Hero Card (Dark Midnight #031426, Rounded, Subtle Border) ─── */}
          <div className="relative rounded-2xl bg-[#031426] border border-[#0d2847] p-4 sm:p-5 text-white overflow-hidden shadow-inner">
            {/* Ambient gold corner flare */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#E6A900]/15 rounded-full blur-2xl pointer-events-none" />

            {/* Top row: Green pill + SHS Logo & Name */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black tracking-wider uppercase bg-[#16a34a] text-white shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                ADMISSIONS OPEN
              </span>
              <div className="flex items-center gap-2">
                <img
                  src={SHS_LOGO_URL}
                  alt="SHS Virtual Academy"
                  className="w-7 h-7 rounded-full object-cover border border-[#E6A900]"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-black tracking-tight text-slate-100 hidden xs:inline">
                  SHS Virtual Academy
                </span>
              </div>
            </div>

            {/* Headline */}
            <h2 className="text-base sm:text-xl font-black text-white leading-snug tracking-tight mb-1.5">
              Enroll Now in FBISE, Punjab, Sindh, KPK Boards &amp; A/O Levels
            </h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Live classes, notes, attendance and tests, powered by Scholario LMS.
            </p>

            {/* Side-by-Side Mini Pricing Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* FSC Mini Card */}
              <div className="bg-[#08203a] border border-[#133760] rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-black text-[#E6A900] uppercase tracking-wide">
                    FSC (11th &amp; 12th)
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E6A900]/20 text-[#E6A900]">
                    FBISE / All Boards
                  </span>
                </div>
                <div className="text-sm font-extrabold text-white">
                  All Subjects: PKR {fscFee.toLocaleString()}
                  <span className="text-[10px] text-slate-300 font-normal"> /term</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Per Subject: <span className="text-white font-semibold">PKR 1,000</span>
                </div>
              </div>

              {/* Matric Mini Card */}
              <div className="bg-[#08203a] border border-[#133760] rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-black text-[#E6A900] uppercase tracking-wide">
                    Matric (9th &amp; 10th)
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E6A900]/20 text-[#E6A900]">
                    FBISE / All Boards
                  </span>
                </div>
                <div className="text-sm font-extrabold text-white">
                  All Subjects: PKR {matricFee.toLocaleString()}
                  <span className="text-[10px] text-slate-300 font-normal"> /term</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Per Subject: <span className="text-white font-semibold">PKR 1,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 3. Section: Special Scholarship Offer ─── */}
          <div className="rounded-2xl border border-amber-200 dark:border-amber-950/60 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 dark:from-amber-950/20 dark:via-[#0F172A] dark:to-amber-950/10 p-4 shadow-xs">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Award size={18} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    Merit Scholarship Program (Up to {maxDiscountPct}% Off)
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    High achievers receive automated fee waivers based on verified marks percentage.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleApplyNow}
                className="px-3 py-1.5 rounded-lg bg-[#082B5C] hover:bg-[#0c3b7a] text-white text-[11px] font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Check Eligibility</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Scholarship Breakdown Badges */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-900/40">
              <div className="text-center p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/50 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">90%+ Marks</span>
                <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {maxDiscountPct}% Off
                </span>
              </div>
              <div className="text-center p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/50 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">80%–89% Marks</span>
                <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400">
                  {midDiscountPct}% Off
                </span>
              </div>
              <div className="text-center p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/50 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">70%–79% Marks</span>
                <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                  20% Off
                </span>
              </div>
            </div>
          </div>

          {/* ─── 4. Section: Fast-Track Admissions Process ─── */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <CheckSquare size={18} />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  Fast-Track Admissions Process
                </h3>
              </div>
              <button
                type="button"
                onClick={handleApplyNow}
                className="px-3 py-1.5 rounded-lg bg-[#E6A900] hover:bg-[#d49b00] text-[#082B5C] text-[11px] font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Apply Now</span>
                <ArrowRight size={12} />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Admissions are conducted 100% online through Scholario. Simply sign in with Google, choose your grade &amp; board, select your subjects, upload proof of payment, and access your full classroom dashboard instantly upon approval.
            </p>
          </div>

          {/* ─── 5. Section: How to Enroll in 6 Easy Steps ─── */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0">
                <Layers size={18} />
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                How to Enroll in 6 Easy Steps
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Step 1: Sign in with Google (Authentic Google G Icon) */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#082B5C] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
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

              {/* Step 2: Select Board & Grade */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#082B5C] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <BookOpen size={13} className="text-[#082B5C] dark:text-blue-400" />
                    <span>Select Board &amp; Grade</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Choose FBISE, Punjab, Sindh, KPK, A/O Levels, or IELTS prep.
                  </div>
                </div>
              </div>

              {/* Step 3: Choose Subjects & Plan */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#082B5C] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <CheckSquare size={13} className="text-[#082B5C] dark:text-blue-400" />
                    <span>Choose Subjects &amp; Plan</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Enroll in All Subjects or customize your per-subject curriculum.
                  </div>
                </div>
              </div>

              {/* Step 4: Check Scholarship Eligibility */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#082B5C] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Award size={13} className="text-[#082B5C] dark:text-blue-400" />
                    <span>Instant Scholarship Check</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Enter your past marks to automatically apply up to 40% tuition discounts.
                  </div>
                </div>
              </div>

              {/* Step 5: Submit Fee Payment Proof */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#082B5C] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  5
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#082B5C] dark:text-blue-400" />
                    <span>Submit Payment Proof</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Pay via Easypaisa or JazzCash, then upload your transaction receipt.
                  </div>
                </div>
              </div>

              {/* Step 6: Instant Activation & LMS Access */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#082B5C] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  6
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <LayoutDashboard size={13} className="text-[#082B5C] dark:text-blue-400" />
                    <span>LMS Dashboard Access</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Unlock live interactive classes, notes vault, tests, and Sage AI tutor.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Help & WhatsApp Hotline */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <PhoneCall size={15} className="text-[#082B5C] dark:text-blue-400 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">
                Need guidance? Contact the admissions office on WhatsApp.
              </span>
            </div>
            <button
              type="button"
              onClick={handleWhatsApp}
              className="px-3 py-1 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-[11px] transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>WhatsApp</span>
              <ExternalLink size={11} />
            </button>
          </div>
        </div>

        {/* ─── 6. Footer ("Close Announcement") ─── */}
        <div className="bg-slate-50 dark:bg-[#080E1A] border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:bg-white dark:hover:bg-slate-800 text-xs font-bold transition-all text-center cursor-pointer order-2 sm:order-1"
          >
            Close Announcement
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={handleLogin}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-[#082B5C] dark:border-blue-500/40 text-[#082B5C] dark:text-blue-400 hover:bg-[#082B5C]/5 text-xs font-bold transition-all text-center cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={handleApplyNow}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#082B5C] hover:bg-[#0c3b7a] text-white text-xs font-black shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Register &amp; Apply Now</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdmissionsAnnouncementModal;
