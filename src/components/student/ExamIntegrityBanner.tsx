import React, { useState } from 'react';
import { ShieldAlert, Info, X, Lock, Eye, AlertTriangle } from 'lucide-react';

interface ExamIntegrityBannerProps {
  studentName?: string;
  studentId?: string;
}

export const ExamIntegrityBanner: React.FC<ExamIntegrityBannerProps> = ({
  studentName = 'Student',
  studentId = 'STD',
}) => {
  const [showDisclosureModal, setShowDisclosureModal] = useState<boolean>(false);

  return (
    <>
      <div className="w-full bg-amber-500/10 border border-amber-400/40 rounded-xl px-3 py-2 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <p className="text-[11px] sm:text-xs font-bold leading-tight truncate">
            <span className="font-extrabold text-amber-950">This is a proctored exam.</span>{' '}
            Screenshots, screen recording, tab-switching, or leaving this window will auto-submit your test and may be flagged for review.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-extrabold border border-emerald-300/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Integrity Guard Active</span>
          </div>

          <button
            type="button"
            onClick={() => setShowDisclosureModal(true)}
            className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
            title="View Proctored Exam Safeguards & Protocol"
          >
            <Info className="w-3 h-3" />
            <span>Details</span>
          </button>
        </div>
      </div>

      {/* Proctoring Protocol & Technical Disclosure Modal */}
      {showDisclosureModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowDisclosureModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E5E5E5] w-full max-w-md p-5 shadow-2xl space-y-4 text-[#111111]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-black uppercase tracking-wide">
                  Proctored Exam Security Protocol
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowDisclosureModal(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 text-[#737373] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <span className="font-bold text-[#737373] text-[10px] uppercase block">
                  Authenticated Candidate:
                </span>
                <span className="font-extrabold text-[#111111]">
                  {studentName} (ID: #{studentId})
                </span>
              </div>

              <div className="space-y-2">
                <h5 className="font-black text-xs text-[#111111] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  Immediate Auto-Submit Triggers:
                </h5>
                <ul className="list-disc pl-4 space-y-1 text-[#555555]">
                  <li>
                    <strong className="text-neutral-900">Switching tabs or windows:</strong> Leaving this active window immediately terminates the assessment.
                  </li>
                  <li>
                    <strong className="text-neutral-900">Screen Capture & Shortcuts:</strong> Pressing PrintScreen, Win+Shift+S, Cmd+Shift+3/4/5, Ctrl+P, or F12.
                  </li>
                  <li>
                    <strong className="text-neutral-900">Copying Content:</strong> Selecting and copying text from questions or answer options is monitored and blocked.
                  </li>
                  <li>
                    <strong className="text-neutral-900">Developer Tools:</strong> Opening console/inspect or resizing the browser window for DevTools docking.
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                <span className="font-black text-[11px] flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-amber-700" />
                  Dynamic Watermark Traceability:
                </span>
                <p className="text-[11px] text-amber-900">
                  Your identity and timestamp are watermarked across this exam view. Any unauthorized photo or leak is permanently traceable to your academic record.
                </p>
              </div>

              <div className="text-[10px] text-neutral-400 italic pt-1 border-t border-neutral-100">
                Notice: Browser-level protections detect and terminate on capture shortcuts and focus loss. For continuous academic integrity, keep your hands on your work and remain on this screen.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDisclosureModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#111111] text-white font-extrabold text-xs hover:bg-[#262626] transition-all cursor-pointer"
            >
              I Understand & Agree
            </button>
          </div>
        </div>
      )}
    </>
  );
};
