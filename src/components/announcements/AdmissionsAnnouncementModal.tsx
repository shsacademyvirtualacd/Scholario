import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  X,
  Megaphone,
  Sparkles,
  ArrowRight,
  Award,
  Layers,
  PhoneCall,
  ExternalLink,
  CheckCircle2,
  Calculator,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { getEnrollmentsForStudent, getFeeStatus } from '../../lib/db';
import {
  getAcademicConfig,
  calculateConfigScholarship,
} from '../../lib/academicConfig';

const SHS_LOGO_URL = 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/IMG-20260627-WA0049.jpg';
const DISMISS_KEY = 'scholario_admissions_dismissed_until';
const DISMISS_VERSION_KEY = 'scholario_admissions_dismissed_version';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const AdmissionsAnnouncementModal: React.FC = () => {
  const { session, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [config] = useState(getAcademicConfig());
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcMarks, setCalcMarks] = useState('');
  const [calcIsImprovement, setCalcIsImprovement] = useState(false);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Set mounted client-side for React portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if current route is an excluded path (login, register, checkout, onboarding)
  const isExcludedRoute = useCallback((pathname: string) => {
    const p = pathname.toLowerCase();
    return (
      p.includes('/login') ||
      p.includes('/register') ||
      p.includes('/checkout') ||
      p.includes('/unregistered') ||
      p.includes('/onboarding')
    );
  }, []);

  // Visibility logic:
  // - Show only to logged-out visitors and students with no active enrollment.
  // - Never show to enrolled or paid students, teachers, or admins.
  // - Show once, remember dismissal for 7 days (unless new version published).
  // - Open after a 2-second delay.
  // - Never on excluded routes.
  useEffect(() => {
    if (!mounted) return;

    if (isExcludedRoute(location.pathname)) {
      setIsOpen(false);
      return;
    }

    // Never show to staff or admins
    if (profile?.role === 'admin' || profile?.role === 'teacher') {
      setIsOpen(false);
      return;
    }

    // Check dismissal cookie/localStorage
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      const dismissedVersion = localStorage.getItem(DISMISS_VERSION_KEY);
      const now = Date.now();

      // If dismissed within 7 days and version matches, suppress
      if (
        dismissedUntil &&
        dismissedVersion === config.announcementVersion &&
        now < parseInt(dismissedUntil, 10)
      ) {
        setIsOpen(false);
        return;
      }
    } catch {}

    let isCancelled = false;

    // If student is logged in, check if they have active enrollment or paid status
    if (session && profile?.id) {
      Promise.all([
        getEnrollmentsForStudent(profile.id).catch(() => []),
        getFeeStatus(profile.id).catch(() => null),
      ]).then(([enrolls, feeStat]) => {
        if (isCancelled) return;
        const hasEnrollments = Array.isArray(enrolls) && enrolls.length > 0;
        const isPaid = feeStat?.status === 'paid';

        if (hasEnrollments || isPaid) {
          setIsOpen(false);
          return;
        }

        // Student has no active enrollments: show after 2-second delay
        const timer = setTimeout(() => {
          if (!isCancelled) setIsOpen(true);
        }, 2000);
        return () => clearTimeout(timer);
      });
    } else if (!session) {
      // Logged out visitor: show after 2-second delay
      const timer = setTimeout(() => {
        if (!isCancelled) setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    return () => {
      isCancelled = true;
    };
  }, [mounted, session, profile, location.pathname, config.announcementVersion, isExcludedRoute]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen && mounted) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, mounted]);

  // Close handler: remembers dismissal for 7 days
  const handleClose = useCallback(() => {
    setIsOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, (Date.now() + SEVEN_DAYS_MS).toString());
      localStorage.setItem(DISMISS_VERSION_KEY, config.announcementVersion);
    } catch {}
  }, [config.announcementVersion]);

  // ESC key closes modal
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

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen || !modalContainerRef.current) return;
    const modal = modalContainerRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleApplyNow = () => {
    handleClose();
    navigate('/register');
  };

  const handleLogin = () => {
    handleClose();
    navigate('/login');
  };

  const handleWhatsApp = () => {
    window.open(config.whatsappDirectLink, '_blank', 'noopener,noreferrer');
  };

  // Scholarship calculator evaluation
  const calcResult = calculateConfigScholarship(
    parseFloat(calcMarks) || 0,
    calcIsImprovement,
    config
  );

  // Maximum discount percentage across all scholarship tiers
  const maxDiscountPercentage = Math.max(
    ...config.scholarshipTiers.map((t) => t.discountPercentage),
    config.improvementTier.discountPercentage
  );

  const modalElement = (
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admissions-announcement-title"
    >
      {/* Click outside to close backdrop */}
      <div
        className="fixed inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Main Dialog Container: Mobile bottom sheet (max 85% height), Desktop centered modal (max 560px) */}
      <div
        ref={modalContainerRef}
        className="relative w-full sm:max-w-[560px] bg-white dark:bg-[#0B1120] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[88vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 z-10"
      >
        {/* Mobile handle indicator */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 bg-[#082B5C]">
          <div className="w-10 h-1 bg-white/30 rounded-full" />
        </div>

        {/* ─── 1. Header Bar (Navy #082B5C, Gold Underline #E6A900) ─── */}
        <div className="bg-[#082B5C] border-b-2 border-[#E6A900] px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between text-white shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#E6A900]/20 flex items-center justify-center text-[#E6A900] shrink-0 border border-[#E6A900]/40">
              <Megaphone size={14} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  id="admissions-announcement-title"
                  className="text-xs sm:text-sm font-black tracking-wider uppercase text-white"
                >
                  Admissions {config.sessionLabel} Now Open
                </h1>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase bg-[#16a34a] text-white">
                  <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                  Open
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Close Announcement"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Scrollable Modal Body ─── */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 text-slate-800 dark:text-slate-200 select-text overscroll-contain flex-1">
          {/* ─── 2. Hero Card (Dark Midnight #031426, Rounded, Subtle Border) ─── */}
          <div className="relative rounded-2xl bg-[#031426] border border-[#0d2847] p-4 text-white overflow-hidden shadow-inner">
            {/* Ambient gold corner flare */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#E6A900]/15 rounded-full blur-2xl pointer-events-none" />

            {/* Top row: SHS Academy branding & Badge */}
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <img
                  src={SHS_LOGO_URL}
                  alt="SHS Virtual Academy"
                  className="w-7 h-7 rounded-full object-cover border border-[#E6A900]"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-black tracking-tight text-slate-100">
                  SHS Virtual Academy
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#E6A900] bg-[#E6A900]/15 px-2 py-0.5 rounded-md border border-[#E6A900]/30">
                Up to {maxDiscountPercentage}% Merit Off
              </span>
            </div>

            {/* Hook Line */}
            <p className="text-xs text-slate-200 mb-3 leading-relaxed">
              <span className="font-bold text-white">Live classes, notes, attendance and tests.</span> Enroll 100% online.
              <span className="block text-[11px] text-slate-400 mt-0.5">
                Boards: FBISE, Punjab, Sindh, KPK, A/O Levels, IELTS prep.
              </span>
            </p>

            {/* ─── 3. Fee Cards from Config: Side by side on tablet/desktop ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Matric Card */}
              <div className="bg-[#08203a] border border-[#133760] rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-black text-[#E6A900] uppercase tracking-wide">
                    {config.feeGroups.matric.name}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-white">
                  All Subjects: PKR {config.feeGroups.matric.allSubjectsFee.toLocaleString()}
                  <span className="text-[10px] text-slate-300 font-normal"> /{config.billingLabel}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Per Subject: <span className="text-white font-semibold">PKR {config.feeGroups.matric.perSubjectFee.toLocaleString()}</span>
                </div>
              </div>

              {/* FSC Card */}
              <div className="bg-[#08203a] border border-[#133760] rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-black text-[#E6A900] uppercase tracking-wide">
                    {config.feeGroups.fsc.name}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-white">
                  All Subjects: PKR {config.feeGroups.fsc.allSubjectsFee.toLocaleString()}
                  <span className="text-[10px] text-slate-300 font-normal"> /{config.billingLabel}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Per Subject: <span className="text-white font-semibold">PKR {config.feeGroups.fsc.perSubjectFee.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 4. Scholarship Strip & Mini-Calculator ─── */}
          <div className="rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Award size={15} className="text-[#E6A900]" />
                <span>Scholarship Tiers:</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCalculator(!showCalculator)}
                className="text-[11px] font-bold text-[#082B5C] dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Calculator size={12} />
                <span>{showCalculator ? 'Hide calculator' : 'Check my eligibility'}</span>
              </button>
            </div>

            {/* Chips from config */}
            <div className="flex flex-wrap gap-1.5">
              {config.scholarshipTiers.map((tier) => (
                <span
                  key={tier.id}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-[11px] font-bold text-amber-900 dark:text-amber-200 shadow-2xs"
                >
                  {tier.label} = <span className="text-emerald-700 dark:text-emerald-400">{tier.discountPercentage}% off</span>
                </span>
              ))}
              <span className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-[11px] font-bold text-amber-900 dark:text-amber-200 shadow-2xs">
                Improvement candidates: <span className="text-emerald-700 dark:text-emerald-400">up to 50% off</span>
              </span>
            </div>

            {/* Inline Mini-Calculator */}
            {showCalculator && (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2 mt-2 animate-in fade-in duration-150">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                  Calculate Your Tuition Discount
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Enter previous marks % (e.g. 88)"
                      value={calcMarks}
                      onChange={(e) => setCalcMarks(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={calcIsImprovement}
                      onChange={(e) => setCalcIsImprovement(e.target.checked)}
                      className="rounded text-[#E6A900] focus:ring-[#E6A900]"
                    />
                    <span>Improvement exam</span>
                  </label>
                </div>

                {/* Instant Calculation Output */}
                {calcResult.discountPercentage > 0 ? (
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span className="font-bold">
                        Eligible for {calcResult.discountPercentage}% Discount!
                      </span>
                    </div>
                    <span className="font-extrabold text-emerald-800 dark:text-emerald-300">
                      Matric: PKR {Math.round(3000 * (1 - calcResult.discountPercentage / 100)).toLocaleString()} /mo
                    </span>
                  </div>
                ) : calcMarks ? (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Merit scholarships start at 70%+ marks. Standard tuition applies below 70%.
                  </p>
                ) : null}
              </div>
            )}
          </div>

          {/* ─── 5. How to Enroll: ONE compact 4-step stepper ─── */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0">
                <Layers size={15} />
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                How to Enroll in 4 Easy Steps
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Step 1 */}
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#082B5C] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Sign in with Google
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Continue with your Google account to create your student profile.
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#082B5C] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Choose Board &amp; Subjects
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Select your academic board, grade, and subjects or full package.
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#082B5C] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Pay &amp; Upload Receipt
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Transfer fee via Easypaisa or JazzCash and upload proof screenshot.
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#082B5C] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Dashboard Unlocks
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Class timetable, lecture vaults, and Sage AI unlock upon verification.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 6. Help Row: WhatsApp Hotline ─── */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <PhoneCall size={15} className="text-[#082B5C] dark:text-blue-400 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs">
                Questions? Message admissions on WhatsApp.
              </span>
            </div>
            <button
              type="button"
              onClick={handleWhatsApp}
              className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-[11px] transition-all flex items-center gap-1 shrink-0 cursor-pointer min-h-[36px]"
            >
              <span>WhatsApp</span>
              <ExternalLink size={11} />
            </button>
          </div>
        </div>

        {/* ─── 7. Sticky Footer: Primary Register & Apply + Sign In + Maybe Later ─── */}
        <div className="bg-slate-50 dark:bg-[#080E1A] border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors order-3 sm:order-1 cursor-pointer"
          >
            Maybe later
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={handleLogin}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-[#082B5C] dark:border-blue-500/40 text-[#082B5C] dark:text-blue-400 hover:bg-[#082B5C]/5 text-xs font-bold transition-all text-center cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={handleApplyNow}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#082B5C] hover:bg-[#0c3b7a] text-white text-xs font-black shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <span>Register &amp; Apply</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
};

export default AdmissionsAnnouncementModal;
