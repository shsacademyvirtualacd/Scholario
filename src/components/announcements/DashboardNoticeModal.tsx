import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Video,
  BookMarked,
  FileCheck2,
  MessageSquare,
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../../features/auth/AuthContext';
import {
  getActiveDashboardAnnouncements,
  dismissDashboardAnnouncement,
  DEFAULT_STUDENT_ONBOARDING_ANNOUNCEMENT,
} from '../../lib/announcementService';
import type { Announcement } from '../../types';

interface DashboardNoticeModalProps {
  role: 'student' | 'teacher';
}

const STUDENT_GUIDE_STEPS = [
  {
    step: 1,
    title: 'Live Classes & Attendance',
    icon: Video,
    subtitle: 'Timetable, Join Link & Attendance Tracking',
    description:
      'Check today\'s schedule on your dashboard. When your class window opens, click the "Join Now" button to enter the live session with your teacher. Your attendance is verified automatically when you attend.',
    tip: 'The "Join Now" button activates during the scheduled lecture time.',
  },
  {
    step: 2,
    title: 'Subject Notes Vault',
    icon: BookMarked,
    subtitle: 'Curriculum-Aligned Chapter Notes',
    description:
      'Visit the Notes tab to view and download chapter slides, formula cheat sheets, solved numericals, and board exam revision materials uploaded by your faculty.',
    tip: 'Filter by subject and format to quickly find study guides.',
  },
  {
    step: 3,
    title: 'Testing Center & Practice',
    icon: FileCheck2,
    subtitle: 'Class Assessments & Instant Quizzes',
    description:
      'Complete tests assigned by your teachers, upload handwritten answer sheets directly from your phone, and practice with timed self-testing quizzes anytime.',
    tip: 'Check due dates to submit your work before the deadline.',
  },
  {
    step: 4,
    title: 'Sage AI Study Companion',
    icon: Sparkles,
    subtitle: '24/7 Academic Explanation Companion',
    description:
      'Have a question about a tricky numerical, grammar rule, or textbook concept? Chat with Sage 24/7 for step-by-step explanations grounded in your curriculum.',
    tip: 'Ask Sage for revision summaries or derivation help anytime.',
  },
  {
    step: 5,
    title: 'Direct Academy & Teacher Chat',
    icon: MessageSquare,
    subtitle: 'Private & Class Conversations',
    description:
      'Reach out directly to your assigned subject teachers, classmates, and academy administration via the Chat tab whenever you need academic or tuition guidance.',
    tip: 'Keep in touch with your teachers for instant doubt resolution.',
  },
];

export const DashboardNoticeModal: React.FC<DashboardNoticeModalProps> = ({ role }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false); // Unchecked by default as required
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const userId = user?.id || profile?.id;

    getActiveDashboardAnnouncements(role, userId)
      .then((announcements) => {
        if (!isMounted) return;
        if (announcements && announcements.length > 0) {
          setQueue(announcements);
          setCurrentIndex(0);
          setGuideStep(0);
          // Show modal after dashboard initial render settles
          const timer = setTimeout(() => {
            if (isMounted) setIsOpen(true);
          }, 500);
          return () => clearTimeout(timer);
        }
      })
      .catch((err) => {
        console.warn('[DashboardNoticeModal] Error loading active announcements:', err);
      });

    // Support manual trigger from "Help" menu item
    const handleManualOpen = () => {
      setQueue([DEFAULT_STUDENT_ONBOARDING_ANNOUNCEMENT]);
      setCurrentIndex(0);
      setGuideStep(0);
      setDontShowAgain(false);
      setIsOpen(true);
    };

    window.addEventListener('open-student-guide', handleManualOpen);

    return () => {
      isMounted = false;
      window.removeEventListener('open-student-guide', handleManualOpen);
    };
  }, [role, user?.id, profile?.id]);

  if (!isOpen || queue.length === 0 || currentIndex >= queue.length) {
    return null;
  }

  const currentAnnouncement = queue[currentIndex];
  const totalCount = queue.length;
  const isLast = currentIndex === totalCount - 1;

  const isStudentGuide =
    role === 'student' &&
    (currentAnnouncement.id === DEFAULT_STUDENT_ONBOARDING_ANNOUNCEMENT.id ||
      (currentAnnouncement.title && currentAnnouncement.title.toLowerCase().includes('quick start')) ||
      (currentAnnouncement.title && currentAnnouncement.title.toLowerCase().includes('guide')));

  const handleDismissAndAdvance = async (permanent: boolean) => {
    const userId = user?.id || profile?.id;
    if (permanent && userId && currentAnnouncement?.id) {
      try {
        setIsSubmitting(true);
        await dismissDashboardAnnouncement(currentAnnouncement.id, userId);
      } catch (err) {
        console.warn('[DashboardNoticeModal] Error recording dismissal:', err);
      } finally {
        setIsSubmitting(false);
      }
    }

    if (!isLast) {
      setCurrentIndex((prev) => prev + 1);
      setGuideStep(0);
      setDontShowAgain(false);
    } else {
      setIsOpen(false);
    }
  };

  const handleActionClick = async () => {
    const targetUrl = currentAnnouncement.action_url;
    await handleDismissAndAdvance(dontShowAgain);

    if (targetUrl) {
      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      } else {
        navigate(targetUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Banner */}
        <div className="relative bg-[#111111] p-5 sm:p-6 text-white shrink-0 overflow-hidden border-b border-neutral-800">
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#F4C430]/15 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F4C430] text-[#111111] shadow-2xs">
                  <Sparkles size={12} className="text-[#111111]" />
                  {isStudentGuide ? 'Quick Start Walkthrough' : (currentAnnouncement.badge_label || (role === 'student' ? 'Student Guide' : 'Faculty Notice'))}
                </span>

                {isStudentGuide ? (
                  <span className="text-[11px] font-bold text-[#A3A3A3] bg-white/10 px-2.5 py-0.5 rounded-full">
                    Step {guideStep + 1} of {STUDENT_GUIDE_STEPS.length}
                  </span>
                ) : (
                  totalCount > 1 && (
                    <span className="text-[11px] font-bold text-[#A3A3A3] bg-white/10 px-2.5 py-0.5 rounded-full">
                      Notice {currentIndex + 1} of {totalCount}
                    </span>
                  )
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
                {isStudentGuide ? STUDENT_GUIDE_STEPS[guideStep].title : currentAnnouncement.title}
              </h2>
            </div>

            <button
              onClick={() => handleDismissAndAdvance(false)}
              className="min-h-[44px] min-w-[44px] rounded-full bg-white/10 hover:bg-white/20 text-[#A3A3A3] hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer"
              title="Close guide"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper Dots for Student Walkthrough */}
          {isStudentGuide && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-800">
              {STUDENT_GUIDE_STEPS.map((s, idx) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setGuideStep(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    guideStep === idx
                      ? 'w-8 bg-[#F4C430]'
                      : 'w-2 bg-neutral-700 hover:bg-neutral-500'
                  }`}
                  aria-label={`Go to step ${s.step}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
          {isStudentGuide ? (
            <div className="space-y-4">
              {(() => {
                const stepData = STUDENT_GUIDE_STEPS[guideStep];
                const StepIcon = stepData.icon;
                return (
                  <div className="space-y-3.5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#F4C430]/20 text-[#D4A017] dark:text-[#F4C430] flex items-center justify-center shrink-0 border border-[#F4C430]/30 shadow-xs">
                        <StepIcon size={24} />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                          Step {guideStep + 1}: {stepData.subtitle}
                        </span>
                        <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                          {stepData.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                      {stepData.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 px-3.5 py-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800/50">
                      <Sparkles size={14} className="shrink-0 text-[#D4A017] dark:text-[#F4C430]" />
                      <span>{stepData.tip}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert text-neutral-700 dark:text-neutral-300">
              <Markdown remarkPlugins={[remarkGfm]}>
                {currentAnnouncement.body}
              </Markdown>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Don't show again checkbox (unchecked by default) */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 text-[#F4C430] rounded border-neutral-300 dark:border-neutral-700 focus:ring-[#F4C430] accent-[#F4C430] cursor-pointer"
              />
              <span>Don't show this notice again</span>
            </label>

            {/* Stepper / Action Buttons */}
            {isStudentGuide ? (
              <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => handleDismissAndAdvance(dontShowAgain)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
                >
                  Skip
                </button>

                {guideStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setGuideStep((prev) => Math.max(0, prev - 1))}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                )}

                {guideStep < STUDENT_GUIDE_STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setGuideStep((prev) => prev + 1)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F4C430] hover:bg-[#E5B520] text-neutral-950 text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDismissAndAdvance(dontShowAgain)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 size={14} className="text-[#22c55e]" />
                    <span>Done</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDismissAndAdvance(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
                >
                  Remind later
                </button>

                {currentAnnouncement.action_label ? (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleActionClick}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{currentAnnouncement.action_label}</span>
                    {currentAnnouncement.action_url?.startsWith('http') ? (
                      <ExternalLink size={14} />
                    ) : (
                      <ArrowRight size={14} />
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDismissAndAdvance(dontShowAgain)}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 size={14} className="text-[#22c55e]" />
                    <span>{isLast ? 'Got it' : 'Next Notice'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardNoticeModal;
