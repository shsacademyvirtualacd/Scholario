import React from 'react';
import { createPortal } from 'react-dom';
import { Award, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import type { ProctoredMCQSubmission, ProctoredMCQItem } from '../../types/proctoredMcq';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';

interface ProctoredMCQResultModalProps {
  isOpen: boolean;
  submission: ProctoredMCQSubmission | null;
  onClose: () => void;
}

export const ProctoredMCQResultModal: React.FC<ProctoredMCQResultModalProps> = ({
  isOpen,
  submission,
  onClose,
}) => {
  useModalScrollLock(isOpen && Boolean(submission));

  if (!isOpen || !submission) return null;

  const finalMarks = submission.final_score ?? submission.auto_score ?? 0;
  const percentage =
    submission.percentage ??
    Math.round((finalMarks / Math.max(1, submission.total_marks)) * 100);

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#E5E5E5] overflow-hidden max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#E5E5E5] flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10px] font-black uppercase tracking-wider mb-1.5">
              <Award size={12} className="text-emerald-600" />
              <span>Graded Assessment Result</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#111111] tracking-tight truncate">
              {submission.test_title || `${submission.subject} Proctored Assessment`}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#737373] mt-0.5 truncate">
              Subject: {submission.subject} • Completed on {new Date(submission.submitted_at).toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#737373] hover:text-[#111111] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Score & Feedback Summary Banner */}
        <div className="p-4 sm:p-6 bg-[#FAF9F5] border-b border-[#E5E5E5] space-y-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#E5E5E5] shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#737373] uppercase tracking-wider">Final Score</span>
              <div className="text-xl sm:text-2xl font-black text-[#111111] mt-0.5">
                {finalMarks}{' '}
                <span className="text-xs font-normal text-[#737373]">/ {submission.total_marks}</span>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#E5E5E5] shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#737373] uppercase tracking-wider">Percentage</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">{percentage}%</div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#E5E5E5] shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#737373] uppercase tracking-wider">Proctoring Status</span>
              <div className="mt-0.5 flex items-center gap-1.5">
                {submission.violation_reason ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                    <AlertTriangle size={12} /> Violation Logged
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    <ShieldCheck size={12} /> Clean Session
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Teacher feedback */}
          {submission.teacher_feedback && (
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-amber-900 tracking-wider">
                Teacher Feedback & Observations
              </span>
              <p className="text-xs text-amber-950 font-medium mt-1 leading-relaxed">
                "{submission.teacher_feedback}"
              </p>
            </div>
          )}
        </div>

        {/* Answers breakdown */}
        <div className="p-4 sm:p-6 overflow-y-auto min-h-0 space-y-3 sm:space-y-4 flex-1 overscroll-contain">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#737373]">Question Breakdown</h3>

          {submission.questions?.map((q: ProctoredMCQItem, idx: number) => {
            const studentAnswerIndex = submission.answers[q.id];
            const correctIdx = q.correctAnswer ?? q.correct_option_index ?? 0;
            const isCorrect = studentAnswerIndex === correctIdx;
            const qText = q.question || q.question_text || '';

            return (
              <div
                key={q.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCorrect
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-rose-600 mt-0.5 shrink-0" />
                    )}
                    <h4 className="text-xs font-black text-[#111111] leading-snug">
                      Q{idx + 1}. {qText}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-[#E5E5E5] text-[#737373] shrink-0">
                    {isCorrect ? `+${q.marks}` : '0'} / {q.marks}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {q.options.map((opt: string, oIdx: number) => {
                    const isStudentChoice = studentAnswerIndex === oIdx;
                    const isKey = correctIdx === oIdx;

                    let badgeClass = 'bg-white border-[#E5E5E5] text-[#525252]';
                    if (isKey) {
                      badgeClass = 'bg-emerald-100 border-emerald-300 text-emerald-950 font-bold';
                    } else if (isStudentChoice && !isKey) {
                      badgeClass = 'bg-rose-100 border-rose-300 text-rose-950 font-bold line-through';
                    }

                    return (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${badgeClass}`}
                      >
                        <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-black/5 shrink-0">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="flex-1 text-[11px]">{opt}</span>
                        {isKey && (
                          <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-200/70 px-1.5 py-0.5 rounded">
                            Correct
                          </span>
                        )}
                        {isStudentChoice && !isKey && (
                          <span className="text-[9px] font-black uppercase text-rose-700 bg-rose-200/70 px-1.5 py-0.5 rounded">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E5E5] bg-[#FAFAFA] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-[#F4C430] font-black text-xs cursor-pointer shadow-xs transition-colors"
          >
            Close Results
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProctoredMCQResultModal;
