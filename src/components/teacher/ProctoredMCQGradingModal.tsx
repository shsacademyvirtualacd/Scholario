import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Award,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth/AuthContext';
import { MathText } from '../common/MathText';
import { gradeProctoredMCQSubmission } from '../../lib/proctoredMcqService';
import type { ProctoredMCQTest, ProctoredMCQSubmission } from '../../types/proctoredMcq';

interface ProctoredMCQGradingModalProps {
  isOpen: boolean;
  test: ProctoredMCQTest | null;
  submission: ProctoredMCQSubmission | null;
  onClose: () => void;
  onGraded: (updatedSubmission: ProctoredMCQSubmission) => void;
}

export const ProctoredMCQGradingModal: React.FC<ProctoredMCQGradingModalProps> = ({
  isOpen,
  test,
  submission,
  onClose,
  onGraded,
}) => {
  const { profile } = useAuth();
  const userRole = (profile?.role || '').toLowerCase();

  const [finalScore, setFinalScore] = useState<number>(
    submission?.final_score !== null && submission?.final_score !== undefined
      ? submission.final_score
      : submission?.auto_score || 0
  );
  const [feedback, setFeedback] = useState<string>(submission?.teacher_feedback || '');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Sync state if submission changes
  React.useEffect(() => {
    if (submission) {
      setFinalScore(
        submission.final_score !== null && submission.final_score !== undefined
          ? submission.final_score
          : submission.auto_score || 0
      );
      setFeedback(submission.teacher_feedback || '');
    }
  }, [submission]);

  if (!isOpen || !submission || !test) return null;

  const handleFinalizeGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'admin' && userRole !== 'teacher') {
      toast.error('Unauthorized: Only teachers and admins can grade submissions.');
      return;
    }

    setSubmitting(true);
    try {
      const updated = await gradeProctoredMCQSubmission(
        submission.id,
        {
          final_score: Number(finalScore),
          teacher_feedback: feedback.trim() || undefined,
          graded_by: profile?.id,
          graded_by_name: profile?.full_name || (userRole === 'admin' ? 'Administrator' : 'Instructor'),
        },
        userRole
      );

      toast.success('Grade finalized and published! The test will now reappear in the student\'s graded view.');
      onGraded(updated);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to finalize grade.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E5E5E5] w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#111111] text-[#F4C430] flex items-center justify-center">
              <Award size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#111111]">Review & Grade Submission</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  submission.status === 'graded' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {submission.status}
                </span>
              </div>
              <p className="text-xs text-[#737373]">
                {test.title} • {test.subject} (Grade {test.grade})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Candidate Overview Card */}
          <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[#737373] block text-[11px]">Candidate Name</span>
              <strong className="text-[#111111] font-bold">{submission.student_name}</strong>
            </div>
            <div>
              <span className="text-[#737373] block text-[11px]">Student ID</span>
              <code className="text-[#111111] font-mono font-bold">
                #{submission.student_roll_no || submission.student_id.slice(0, 8)}
              </code>
            </div>
            <div>
              <span className="text-[#737373] block text-[11px]">Submission Time</span>
              <span className="text-[#111111] font-semibold">
                {new Date(submission.submitted_at).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-[#737373] block text-[11px]">Auto Score</span>
              <strong className="text-[#111111] font-bold font-mono">
                {submission.auto_score} / {submission.total_marks} ({submission.percentage}%)
              </strong>
            </div>
          </div>

          {/* Anti-Cheating Violation Notice (If any) */}
          {submission.violation_reason && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
              <ShieldAlert size={20} className="text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-900">
                <p className="font-extrabold mb-0.5">Proctoring Anti-Cheating Trigger Logged</p>
                <p className="text-red-800">{submission.violation_reason}</p>
                <p className="text-red-700 text-[11px] mt-1">
                  The test was forcibly auto-submitted when this event was detected. You can review the answered questions and adjust marks accordingly.
                </p>
              </div>
            </div>
          )}

          {/* Question Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider">
              Question Responses ({test.questions.length})
            </h4>

            {test.questions.map((q, idx) => {
              const studentAnswerIdx = submission.answers[q.id];
              const isCorrect = studentAnswerIdx !== undefined && studentAnswerIdx === q.correctAnswer;
              const isAnswered = studentAnswerIdx !== undefined;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border text-xs space-y-2 ${
                    isCorrect
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isAnswered
                      ? 'bg-red-50/30 border-red-200'
                      : 'bg-[#FAFAFA] border-[#E5E5E5]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-md bg-[#111111] text-[#F4C430] text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="font-bold text-[#111111]">
                        <MathText text={q.question} />
                      </div>
                    </div>

                    <div className="shrink-0 font-mono font-bold">
                      {isCorrect ? (
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          +{q.marks || 1} mark
                        </span>
                      ) : (
                        <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded">
                          0 / {q.marks || 1}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                    {q.options.map((opt, oIdx) => {
                      const wasSelected = studentAnswerIdx === oIdx;
                      const isOptionCorrect = q.correctAnswer === oIdx;
                      return (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-xl border text-[11px] flex items-center justify-between ${
                            isOptionCorrect
                              ? 'bg-emerald-100/70 border-emerald-300 font-bold text-emerald-950'
                              : wasSelected
                              ? 'bg-red-100/70 border-red-300 font-bold text-red-950'
                              : 'bg-white border-[#E5E5E5] text-[#525252]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono">
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            <MathText text={opt} />
                          </div>

                          {wasSelected && (
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-black/10">
                              Student Choice
                            </span>
                          )}
                          {isOptionCorrect && !wasSelected && (
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800">
                              Correct Key
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

          {/* Grade Adjustment & Feedback Form */}
          <form id="grade-submission-form" onSubmit={handleFinalizeGrade} className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-4">
            <h4 className="text-xs font-black text-[#111111] uppercase tracking-wider flex items-center gap-2">
              <Award size={15} className="text-[#F4C430]" />
              <span>Assign / Adjust Final Grade</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                  Final Marks Obtained * (Max: {submission.total_marks})
                </label>
                <input
                  type="number"
                  min="0"
                  max={submission.total_marks}
                  value={finalScore}
                  onChange={(e) => setFinalScore(Math.max(0, Math.min(submission.total_marks, parseInt(e.target.value) || 0)))}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                  Resulting Percentage
                </label>
                <div className="h-10 px-3.5 rounded-xl bg-white border border-[#E5E5E5] flex items-center text-xs font-bold font-mono text-[#111111]">
                  {submission.total_marks > 0 ? Math.round((finalScore / submission.total_marks) * 100) : 0}%
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                Instructor Feedback & Comments
              </label>
              <textarea
                rows={2}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Add comments or performance guidance for the student..."
                className="w-full p-3 rounded-xl border border-[#E5E5E5] bg-white text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden resize-none"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#F0F0F0] flex items-center justify-between bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="grade-submission-form"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#111111] text-[#F4C430] hover:bg-black font-black text-xs cursor-pointer shadow-md active:scale-[0.98]"
          >
            <Check size={16} />
            <span>{submitting ? 'Finalizing...' : 'Finalize & Publish Grade'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProctoredMCQGradingModal;
