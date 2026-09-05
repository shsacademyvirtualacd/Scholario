import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Save,
  Maximize2,
  MessageSquare,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { MathText } from '../common/MathText';
import { useAuth } from '../../features/auth/AuthContext';
import {
  gradeWrittenSubmission,
  getRemainingGradingTime,
} from '../../lib/writtenTestService';
import type {
  WrittenSubmission,
} from '../../types/writtenTest';

interface WrittenTestGradingModalProps {
  isOpen: boolean;
  submission: WrittenSubmission | null;
  onClose: () => void;
  onGraded: (updatedSubmission: WrittenSubmission) => void;
}

export const WrittenTestGradingModal: React.FC<WrittenTestGradingModalProps> = ({
  isOpen,
  submission,
  onClose,
  onGraded,
}) => {
  const { profile } = useAuth();

  // Question grades state: question_id -> { marks, remarks }
  const [gradesMap, setGradesMap] = useState<
    Record<string, { marks: number; remarks: string }>
  >({});
  const [overallFeedback, setOverallFeedback] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [zoomedPhotoUrl, setZoomedPhotoUrl] = useState<string | null>(null);

  // 24-hour expiry timer
  const [expiryState, setExpiryState] = useState<{
    isExpired: boolean;
    remainingMs: number;
    formatted: string;
  }>({ isExpired: false, remainingMs: 86400000, formatted: '24h 00m' });

  useEffect(() => {
    if (!submission) return;

    // Initialize grades map with existing answers
    const initMap: Record<string, { marks: number; remarks: string }> = {};
    submission.answers.forEach((ans) => {
      // If MCQ and marks_awarded not yet set, default to auto-scored points
      let defMarks = ans.marks_awarded;
      if (defMarks === null || defMarks === undefined) {
        if (ans.question_type === 'mcq') {
          defMarks = ans.is_correct ? ans.max_marks : 0;
        } else {
          defMarks = 0;
        }
      }

      initMap[ans.question_id] = {
        marks: defMarks,
        remarks: ans.remarks || (ans.question_type === 'mcq' ? (ans.is_correct ? 'Correct' : 'Incorrect') : ''),
      };
    });
    setGradesMap(initMap);
    setOverallFeedback(submission.teacher_feedback || '');

    // Check expiry
    const exp = getRemainingGradingTime(submission);
    setExpiryState(exp);

    const timer = setInterval(() => {
      setExpiryState(getRemainingGradingTime(submission));
    }, 10000);

    return () => clearInterval(timer);
  }, [submission]);

  if (!isOpen || !submission) return null;

  // Auto-calculated total score
  const totalCalculatedScore = Object.values(gradesMap).reduce(
    (sum, g) => sum + (Number(g.marks) || 0),
    0
  );

  const mcqAnswers = submission.answers.filter((a) => a.question_type === 'mcq');
  const writtenAnswers = submission.answers.filter((a) => a.question_type !== 'mcq');

  const mcqCalculatedScore = mcqAnswers.reduce(
    (sum, a) => sum + (gradesMap[a.question_id]?.marks || 0),
    0
  );
  const mcqTotalMax = mcqAnswers.reduce((sum, a) => sum + (a.max_marks || 0), 0);

  const writtenCalculatedScore = writtenAnswers.reduce(
    (sum, a) => sum + (gradesMap[a.question_id]?.marks || 0),
    0
  );
  const writtenTotalMax = writtenAnswers.reduce((sum, a) => sum + (a.max_marks || 0), 0);

  const handleMarksChange = (questionId: string, maxMarks: number, valStr: string) => {
    let num = Number(valStr);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > maxMarks) {
      toast.warning(`Maximum marks for this question is ${maxMarks}.`);
      num = maxMarks;
    }

    setGradesMap((prev) => ({
      ...prev,
      [questionId]: {
        marks: num,
        remarks: prev[questionId]?.remarks || '',
      },
    }));
  };

  const handleRemarksChange = (questionId: string, remarks: string) => {
    setGradesMap((prev) => ({
      ...prev,
      [questionId]: {
        marks: prev[questionId]?.marks || 0,
        remarks,
      },
    }));
  };

  const handleSaveGrade = async () => {
    const normRole = (profile?.role || '').toLowerCase();
    if (normRole !== 'teacher' && normRole !== 'admin') {
      toast.error('Only teachers and administrators are authorized to grade written submissions.');
      return;
    }

    if (expiryState.isExpired && submission.status !== 'graded' && writtenAnswers.length > 0) {
      toast.error(
        'This submission has passed the 24-hour grading window and can no longer be graded.'
      );
      return;
    }

    setSaving(true);
    try {
      const perQuestionPayload = Object.entries(gradesMap).map(([qId, val]) => ({
        question_id: qId,
        marks_awarded: val.marks,
        remarks: val.remarks,
      }));

      const updated = await gradeWrittenSubmission({
        submission_id: submission.id,
        per_question_grades: perQuestionPayload,
        teacher_feedback: overallFeedback.trim(),
        graded_by: profile?.id || 'teacher',
        graded_by_name: profile?.full_name || 'Instructor',
      });

      toast.success('Assessment graded and final score published successfully!');
      onGraded(updated);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit grades.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E5E5E5] w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#111111] text-base">
                  Grade Assessment: {submission.student_name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-black text-amber-400">
                  {submission.test_type === 'unified'
                    ? 'Class Assessment'
                    : submission.test_type === 'short_question'
                    ? 'Short Question'
                    : 'Long Question'}
                </span>
                {submission.status === 'graded' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Graded
                  </span>
                )}
              </div>
              <p className="text-xs text-[#737373]">
                {submission.test_title || 'Assessment'} • {submission.subject} • Submitted on{' '}
                {new Date(submission.submitted_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 24-Hour Expiry Window Badge for written questions */}
            {writtenAnswers.length > 0 && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border ${
                  expiryState.isExpired
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {expiryState.isExpired
                    ? 'Expired (24h Elapsed)'
                    : `Grading Window: ${expiryState.formatted}`}
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expiry Banner if elapsed */}
        {expiryState.isExpired && writtenAnswers.length > 0 && (
          <div className="px-6 py-2.5 bg-red-50 border-b border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Grading Window Expired:</strong> In accordance with the 24-hour retention policy, handwritten photos for written questions have expired.
            </span>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {submission.answers.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA]">
              <p className="text-xs font-bold text-[#111111]">No answer sheets were submitted for this assessment.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ───────────────────────────────────────────────────────── */}
              {/* SECTION A: MCQs (AUTO-GRADED)                             */}
              {/* ───────────────────────────────────────────────────────── */}
              {mcqAnswers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-[#F0F0F0]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#111111]">
                        Section A: Multiple Choice Questions (Auto-Graded)
                      </h4>
                    </div>
                    <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      Score: {mcqCalculatedScore} / {mcqTotalMax} Marks
                    </span>
                  </div>

                  <div className="space-y-3">
                    {mcqAnswers.map((ans, idx) => {
                      const currentGrade = gradesMap[ans.question_id] || { marks: 0, remarks: '' };
                      const optLabels = ['A', 'B', 'C', 'D'];
                      const studentChosen =
                        ans.selected_option !== null && ans.selected_option !== undefined
                          ? optLabels[ans.selected_option]
                          : 'None';
                      const correctChosen =
                        ans.correct_option !== null && ans.correct_option !== undefined
                          ? optLabels[ans.correct_option]
                          : 'A';

                      return (
                        <div
                          key={ans.question_id}
                          className="p-4 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-[#111111] text-white text-[10px] font-black">
                                  Q{idx + 1} • MCQ
                                </span>
                                <span className="text-[11px] font-bold text-[#737373]">
                                  Max: {ans.max_marks} Marks
                                </span>
                              </div>
                              <div className="text-xs font-bold text-[#111111] pt-1">
                                <MathText text={ans.question_text} />
                              </div>
                            </div>

                            {/* Marks awarded */}
                            <div className="shrink-0 flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-[#E5E5E5]">
                              <label className="text-[11px] font-bold text-[#111111]">Marks:</label>
                              <input
                                type="number"
                                min={0}
                                max={ans.max_marks}
                                step={0.5}
                                value={currentGrade.marks}
                                onChange={(e) =>
                                  handleMarksChange(ans.question_id, ans.max_marks, e.target.value)
                                }
                                className="w-14 h-7 text-center rounded-lg border border-[#D4D4D4] font-extrabold text-xs text-[#111111] bg-white focus:ring-2 focus:ring-[#111111]"
                              />
                              <span className="text-[11px] text-[#737373]">/ {ans.max_marks}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-bold pt-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#737373]">Student Picked:</span>
                              <span
                                className={`px-2 py-0.5 rounded font-black ${
                                  ans.is_correct
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                Option {studentChosen}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#737373]">Correct Answer:</span>
                              <span className="px-2 py-0.5 rounded font-black bg-blue-100 text-blue-800">
                                Option {correctChosen}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 ml-auto">
                              {ans.is_correct ? (
                                <span className="text-emerald-700 font-extrabold flex items-center gap-1 text-[11px]">
                                  <CheckCircle2 size={13} />
                                  Correct (+{ans.max_marks} pts)
                                </span>
                              ) : (
                                <span className="text-red-600 font-extrabold text-[11px]">
                                  Incorrect (0 pts)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────── */}
              {/* SECTION B: WRITTEN QUESTIONS (MANUAL TEACHER GRADING)     */}
              {/* ───────────────────────────────────────────────────────── */}
              {writtenAnswers.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-[#F0F0F0]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#111111]">
                        Section B: Short & Long Answer Questions (Teacher Evaluation)
                      </h4>
                    </div>
                    <span className="text-xs font-black text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      Score: {writtenCalculatedScore} / {writtenTotalMax} Marks
                    </span>
                  </div>

                  <div className="space-y-6">
                    {writtenAnswers.map((ans, idx) => {
                      const currentGrade = gradesMap[ans.question_id] || { marks: 0, remarks: '' };

                      return (
                        <div
                          key={ans.question_id}
                          className="p-5 rounded-2xl border border-[#E5E5E5] bg-white shadow-xs space-y-4"
                        >
                          <div className="flex items-start justify-between gap-4 border-b border-[#F0F0F0] pb-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-lg bg-[#111111] text-white text-[11px] font-black">
                                  Written Q#{idx + 1}
                                </span>
                                <span className="text-xs font-bold text-amber-800">
                                  Max Marks: {ans.max_marks}
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-[#111111] pt-1">
                                <MathText text={ans.question_text} />
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-2 bg-[#FAFAFA] p-2 rounded-xl border border-[#E5E5E5]">
                              <label className="text-xs font-bold text-[#111111]">Award Marks:</label>
                              <input
                                type="number"
                                min={0}
                                max={ans.max_marks}
                                step={0.5}
                                value={currentGrade.marks}
                                disabled={expiryState.isExpired && submission.status !== 'graded'}
                                onChange={(e) =>
                                  handleMarksChange(ans.question_id, ans.max_marks, e.target.value)
                                }
                                className="w-16 h-8 text-center rounded-lg border border-[#D4D4D4] font-extrabold text-sm text-[#111111] bg-white focus:ring-2 focus:ring-[#111111]"
                              />
                              <span className="text-xs text-[#737373]">/ {ans.max_marks}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                            {/* Photo of handwritten answer */}
                            <div className="md:col-span-7">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-[#737373] mb-1.5 flex items-center justify-between">
                                <span>Student Handwritten Answer Sheet</span>
                                {ans.photo_url && !expiryState.isExpired && (
                                  <button
                                    type="button"
                                    onClick={() => setZoomedPhotoUrl(ans.photo_url || null)}
                                    className="flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
                                  >
                                    <Maximize2 className="w-3 h-3" />
                                    Zoom Photo
                                  </button>
                                )}
                              </div>

                              <div className="relative rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] overflow-hidden min-h-[220px] max-h-[360px] flex items-center justify-center">
                                {expiryState.isExpired ? (
                                  <div className="text-center p-6 space-y-2 text-neutral-400">
                                    <Clock className="w-8 h-8 mx-auto" />
                                    <p className="text-xs font-bold text-[#737373]">
                                      Photo expired after 24 hours
                                    </p>
                                    <p className="text-[11px] text-[#A3A3A3]">
                                      Storage retention policy completed.
                                    </p>
                                  </div>
                                ) : ans.photo_url ? (
                                  <img
                                    src={ans.photo_url}
                                    alt={`Answer for Question ${idx + 1}`}
                                    className="w-full h-full object-contain cursor-pointer hover:opacity-95 transition-opacity"
                                    onClick={() => setZoomedPhotoUrl(ans.photo_url || null)}
                                    onError={(e) => {
                                      (e.currentTarget as HTMLElement).style.display = 'none';
                                      const parent = e.currentTarget.parentElement;
                                      if (parent) {
                                        const msg = document.createElement('div');
                                        msg.className = 'text-center p-4 text-xs text-[#737373]';
                                        msg.innerText = 'Photo answer has expired or is no longer available.';
                                        parent.appendChild(msg);
                                      }
                                    }}
                                  />
                                ) : (
                                  <p className="text-xs text-[#737373]">No photo uploaded.</p>
                                )}
                              </div>
                            </div>

                            {/* Remarks for this question */}
                            <div className="md:col-span-5 space-y-2">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-[#737373] block">
                                Question Remarks & Feedback
                              </label>
                              <textarea
                                rows={6}
                                value={currentGrade.remarks}
                                disabled={expiryState.isExpired && submission.status !== 'graded'}
                                onChange={(e) => handleRemarksChange(ans.question_id, e.target.value)}
                                placeholder="Add specific feedback or corrections on this answer sheet..."
                                className="w-full p-3 rounded-xl border border-[#E5E5E5] text-xs font-medium text-[#111111] bg-white focus:ring-2 focus:ring-[#111111] focus:outline-hidden resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Overall Feedback */}
          <div className="p-5 rounded-2xl border border-[#E5E5E5] bg-white shadow-xs space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-amber-700" />
              Overall Assessment Feedback for Student
            </label>
            <textarea
              rows={3}
              value={overallFeedback}
              disabled={expiryState.isExpired && submission.status !== 'graded' && writtenAnswers.length > 0}
              onChange={(e) => setOverallFeedback(e.target.value)}
              placeholder="Provide constructive feedback, key strengths, and recommendations for improvement..."
              className="w-full p-3 rounded-xl border border-[#E5E5E5] text-xs font-medium text-[#111111] bg-white focus:ring-2 focus:ring-[#111111] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Modal Footer with Auto-Calculated Combined Total & Save */}
        <div className="px-6 py-4 border-t border-[#F0F0F0] bg-[#FAFAFA] flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-5">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-[#737373]">Combined Total:</span>
              <span className="text-2xl font-black text-[#111111]">
                {totalCalculatedScore}
              </span>
              <span className="text-xs font-extrabold text-[#737373]">
                / {submission.total_marks} Marks
              </span>
            </div>
            <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              ({Math.round((totalCalculatedScore / (submission.total_marks || 1)) * 100)}%)
            </span>
            {mcqAnswers.length > 0 && writtenAnswers.length > 0 && (
              <div className="text-[11px] text-[#737373] hidden sm:block">
                MCQs: {mcqCalculatedScore}/{mcqTotalMax} • Written: {writtenCalculatedScore}/{writtenTotalMax}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#737373] hover:text-[#111111] hover:bg-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || (expiryState.isExpired && submission.status !== 'graded' && writtenAnswers.length > 0)}
              onClick={handleSaveGrade}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-extrabold hover:bg-[#262626] transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Publishing Score...' : 'Publish Grade & Remarks'}
            </button>
          </div>
        </div>

        {/* Lightbox / Zoom Modal for Photo */}
        {zoomedPhotoUrl && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs"
            onClick={() => setZoomedPhotoUrl(null)}
          >
            <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
              <button
                type="button"
                onClick={() => setZoomedPhotoUrl(null)}
                className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={zoomedPhotoUrl}
                alt="Enlarged handwritten answer"
                className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
