import React, { useState } from 'react';
import {
  Video,
  BookMarked,
  FileCheck2,
  Sparkles,
  MessageSquare,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: <Video size={28} className="text-amber-500" />,
    title: '1. Join Classes & Mark Attendance',
    subtitle: 'Live Sessions & Presence',
    description:
      'Class links unlock 10 minutes before session start time. Tap "Join Now" to enter the live room, or tap "Mark Attendance" during ongoing classes to record your attendance.',
    tip: 'Your attendance is updated live and verified by your subject teacher.',
  },
  {
    icon: <BookMarked size={28} className="text-blue-500" />,
    title: '2. Notes Library',
    subtitle: 'Curriculum & Lecture Slides',
    description:
      'Access teacher-uploaded chapter notes, revision PDFs, and past paper answers organized neatly by board, grade, and subject.',
    tip: 'Tap any note card to preview inside Scholario or download offline.',
  },
  {
    icon: <FileCheck2 size={28} className="text-emerald-500" />,
    title: '3. Testing Center & Self-Practice',
    subtitle: 'Class Tests & Instant Quizzes',
    description:
      'View assigned class tests, download question papers, and upload answer sheets before deadlines. Practice anytime with syllabus-aligned AI quizzes in Self Testing.',
    tip: 'Always check submission due dates to avoid overdue penalties.',
  },
  {
    icon: <Sparkles size={28} className="text-purple-500" />,
    title: '4. Sage AI Academic Assistant',
    subtitle: '24/7 Study Help',
    description:
      'Ask questions about difficult syllabus concepts, solve complex math equations, reshuffle Urdu grammar, or get exam tips directly from your curriculum notes.',
    tip: 'Tap suggested question prompts for instant comprehensive answers.',
  },
  {
    icon: <MessageSquare size={28} className="text-amber-500" />,
    title: '5. Direct Chat with Faculty & Admin',
    subtitle: 'Communication & Inquiries',
    description:
      'Send direct messages, share homework images, or submit academic inquiries to your assigned teachers and the school office in real time.',
    tip: 'Faculty responds during standard school operating hours.',
  },
];

export const QuickStartModal: React.FC<QuickStartModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleFinish = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('scholario_quickstart_dismissed', 'true');
      } catch {}
    }
    onClose();
  };

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickstart-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#141416] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-300/40">
              Quick Start Guide
            </span>
            <span className="text-xs text-neutral-400">
              Step {currentStep + 1} of {STEPS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="min-h-[44px] min-w-[44px] p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-neutral-700">
              {step.icon}
            </div>
            <div>
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                {step.subtitle}
              </span>
              <h2 id="quickstart-title" className="text-lg font-bold text-neutral-900 dark:text-white">
                {step.title}
              </h2>
            </div>
          </div>

          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {step.description}
          </p>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>{step.tip}</span>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStep
                    ? 'w-6 bg-amber-400'
                    : 'w-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer self-start sm:self-auto min-h-[44px]">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-neutral-300 dark:border-neutral-700 cursor-pointer"
            />
            <span>Don't show again</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="min-h-[44px] min-w-[44px] px-3.5 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            )}

            {!isLast ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="min-h-[44px] min-w-[44px] px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="min-h-[44px] min-w-[44px] px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Got it, let's start!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStartModal;
