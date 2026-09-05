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
  Archive,
  ChevronDown,
  ChevronUp,
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
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [expandedRemarks, setExpandedRemarks] = useState<Record<string, boolean>>({});

  // 24-hour grading window timer state
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

  const isArchived = Boolean(submission.photos_purged || submission.retention_status === 'archived');
  const isAutoExtended = Boolean(submission.auto_extended || submission.admin_flagged);

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

  const toggleRemarks = (questionId: string) => {
    setExpandedRemarks((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleSaveGrade = async () => {
    const normRole = (profile?.role || '').toLowerCase();
    if (normRole !== 'teacher' && normRole !== 'admin') {
      toast.error('Only teachers and administrators are authorized to grade written submissions.');
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
        {/* Top Header - Compact & Sticky, shrinks on scroll */}
        {isScrolled ? (
          <div className="px-4 py-2 border-b border-[#F0F0F0] flex items-center justify-between bg-white/95 backdrop-blur-xs shrink-0 transition-all sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-2.5 truncate">
              <span className="font-black text-xs text-[#111111] truncate">
                {submission.student_name}
              </span>
              <span className="text-[11px] text-[#737373] hidden sm:inline truncate">
                • {submission.test_title || 'Assessment'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-neutral-100 text-neutral-800">
                Score: {totalCalculatedScore}/{submission.total_marks}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {writtenAnswers.length > 0 && !isArchived && (
                <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  <Clock className="w-3 h-3" />
                  <span>{expiryState.formatted}</span>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-1 text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 sm:px-6 py-2.5 border-b border-[#F0F0F0] flex items-center justify-between bg-white shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
                {isArchived ? <Archive className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-[#111111] text-xs sm:text-sm">
                    {isArchived ? 'Archived Assessment Record' : 'Grade Assessment'}: {submission.student_name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-black text-amber-400">
                    {submission.test_type === 'unified'
                      ? 'Class Assessment'
                      : submission.test_type === 'short_question'
                      ? 'Short Question'
                      : 'Long Question'}
                  </span>
                  {isArchived ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-900 flex items-center gap-1">
                      <Archive className="w-2.5 h-2.5" />
                      Archived (Photos Purged)
                    </span>
                  ) : submission.status === 'graded' ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Graded
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-[#737373]">
                  {submission.test_title || 'Assessment'} • {submission.subject} • Submitted on{' '}
                  {new Date(submission.submitted_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {writtenAnswers.length > 0 && !isArchived && (
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                    expiryState.isExpired
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {expiryState.isExpired
                      ? 'Grading Window Extended'
                      : `Grading Window: ${expiryState.formatted}`}
                  </span>
                </div>
              )}

              <button
                onClick={onClose}
                className="p-1.5 text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Status Banners */}
        {isArchived ? (
          <div className="px-4 sm:px-6 py-2.5 bg-neutral-100 border-b border-neutral-200 text-neutral-800 text-xs flex items-start gap-2.5">
            <Archive className="w-4 h-4 shrink-0 text-neutral-700 mt-0.5" />
            <div>
              <p className="font-bold text-neutral-900">
                Permanent Academic Record (Storage Retention Policy Completed)
              </p>
              <p className="text-[11px] text-neutral-600 mt-0.5">
                Temporary student handwritten answer sheet photos have been securely purged. Scores, answers, item analysis, and teacher remarks are permanently preserved.
              </p>
            </div>
          </div>
        ) : isAutoExtended || (expiryState.isExpired && submission.status !== 'graded') ? (
          <div className="px-4 sm:px-6 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-700" />
            <span>
              <strong>Grading Safeguard Active:</strong> Window has been extended to ensure handwritten work is evaluated before retention cleanup.
            </span>
          </div>
        ) : null}

        {/* Main Body */}
        <div
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5"
          onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 20)}
        >
          {submission.answers.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA]">
              <p className="text-xs font-bold text-[#111111]">No answer sheets were submitted for this assessment.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* ───────────────────────────────────────────────────────── */}
              {/* SECTION A: MCQs (COMPACT TABLE FORMAT - ONE-SCROLL VIEW)   */}
              {/* ───────────────────────────────────────────────────────── */}
              {mcqAnswers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-[#F0F0F0]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#111111]">
                        Section A: Multiple Choice Questions (Auto-Graded)
                      </h4>
                    </div>
                    <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      Score: {mcqCalculatedScore} / {mcqTotalMax} Marks
                    </span>
                  </div>

                  {/* Compact Table View */}
                  <div className="overflow-x-auto rounded-xl border border-[#E5E5E5] bg-white shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#E5E5E5] bg-[#F7F7F7] text-[#737373] text-[10px] font-black uppercase tracking-wider">
                          <th className="py-2 px-3 w-12 text-center">#</th>
                          <th className="py-2 px-3 min-w-[260px]">Question Prompt</th>
                          <th className="py-2 px-3 w-28 text-center">Student Choice</th>
                          <th className="py-2 px-3 w-28 text-center">Correct Answer</th>
                          <th className="py-2 px-3 w-24 text-center">Auto-Result</th>
                          <th className="py-2 px-3 w-32 text-right">Award Marks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0F0F0]">
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
                            <tr key={ans.question_id} className="hover:bg-[#FAFAFA] transition-colors">
                              <td className="py-2 px-3 text-center font-mono font-black text-neutral-600 text-xs">
                                Q{idx + 1}
                              </td>
                              <td className="py-2 px-3 font-semibold text-[#111111] leading-snug">
                                <MathText text={ans.question_text} />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded font-black text-[11px] ${
                                    ans.is_correct
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {studentChosen === 'None' ? 'None' : `Option ${studentChosen}`}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 rounded font-black text-[11px] bg-blue-100 text-blue-800">
                                  Option {correctChosen}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                {ans.is_correct ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold text-[11px]">
                                    <CheckCircle2 size={12} />
                                    Correct
                                  </span>
                                ) : (
                                  <span className="text-red-600 font-extrabold text-[11px]">
                                    Incorrect
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {isArchived ? (
                                  <span className="font-mono font-extrabold text-xs text-[#111111]">
                                    {currentGrade.marks} / {ans.max_marks}
                                  </span>
                                ) : (
                                  <div className="inline-flex items-center gap-1 justify-end">
                                    <input
                                      type="number"
                                      min={0}
                                      max={ans.max_marks}
                                      step={0.5}
                                      value={currentGrade.marks}
                                      onChange={(e) =>
                                        handleMarksChange(ans.question_id, ans.max_marks, e.target.value)
                                      }
                                      className="w-13 h-6 text-center rounded border border-[#D4D4D4] font-extrabold text-xs text-[#111111] bg-white focus:ring-2 focus:ring-[#111111]"
                                    />
                                    <span className="text-[11px] text-[#737373]">/ {ans.max_marks}</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────── */}
              {/* SECTION B: WRITTEN QUESTIONS (COMPACT, NO EMPTY BOXES)    */}
              {/* ───────────────────────────────────────────────────────── */}
              {writtenAnswers.length > 0 && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between pb-1 border-b border-[#F0F0F0]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#111111]">
                        Section B: Short & Long Answer Questions (Teacher Evaluation)
                      </h4>
                    </div>
                    <span className="text-xs font-black text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                      Score: {writtenCalculatedScore} / {writtenTotalMax} Marks
                    </span>
                  </div>

                  <div className="space-y-3">
                    {writtenAnswers.map((ans, idx) => {
                      const currentGrade = gradesMap[ans.question_id] || { marks: 0, remarks: '' };
                      const hasPhoto = Boolean(ans.photo_url && !isArchived);
                      const isExpanded = Boolean(expandedRemarks[ans.question_id] || currentGrade.remarks);

                      return (
                        <div
                          key={ans.question_id}
                          className="p-3 sm:p-4 rounded-2xl border border-[#E5E5E5] bg-white shadow-xs space-y-2.5"
                        >
                          {/* Question Header & Award Marks Directly Beside Text */}
                          <div className="flex items-start justify-between gap-4 border-b border-[#F0F0F0] pb-2">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-[#111111] text-white text-[10px] font-black">
                                  Written Q#{idx + 1}
                                </span>
                                <span className="text-[11px] font-bold text-amber-800">
                                  Max Marks: {ans.max_marks}
                                </span>
                              </div>
                              <div className="text-xs sm:text-[13px] font-semibold text-[#111111] leading-relaxed pt-0.5">
                                <MathText text={ans.question_text} />
                              </div>
                            </div>

                            {/* Award Marks Box directly beside question text */}
                            <div className="shrink-0 flex items-center gap-2 bg-[#FAFAFA] px-3 py-1.5 rounded-xl border border-[#E5E5E5]">
                              <label className="text-xs font-bold text-[#111111]">Marks:</label>
                              {isArchived ? (
                                <span className="font-mono font-black text-sm text-[#111111]">
                                  {currentGrade.marks}
                                </span>
                              ) : (
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
                              )}
                              <span className="text-xs text-[#737373]">/ {ans.max_marks}</span>
                            </div>
                          </div>

                          {/* Read-Only Archived Mode */}
                          {isArchived ? (
                            <div className="pt-1">
                              {currentGrade.remarks ? (
                                <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-xs">
                                  <span className="font-bold text-[#737373] text-[10px] uppercase block">
                                    Teacher Remarks:
                                  </span>
                                  <p className="text-neutral-800 font-medium mt-0.5">{currentGrade.remarks}</p>
                                </div>
                              ) : (
                                <span className="text-[11px] text-neutral-400 italic">No remarks recorded</span>
                              )}
                            </div>
                          ) : hasPhoto ? (
                            /* When Photo Exists: Side-by-side photo + feedback */
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                              {/* Photo container */}
                              <div className="md:col-span-6 space-y-1">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-[#737373] flex items-center justify-between">
                                  <span>Handwritten Answer Sheet</span>
                                  <button
                                    type="button"
                                    onClick={() => setZoomedPhotoUrl(ans.photo_url || null)}
                                    className="flex items-center gap-1 text-[10px] font-bold text-amber-800 hover:underline cursor-pointer"
                                  >
                                    <Maximize2 className="w-3 h-3" />
                                    Zoom Photo
                                  </button>
                                </div>

                                <div className="relative rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] overflow-hidden h-44 sm:h-52 flex items-center justify-center">
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
                                        msg.className = 'text-center p-3 text-xs text-[#737373]';
                                        msg.innerText = 'Photo expired under retention policy.';
                                        parent.appendChild(msg);
                                      }
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Remarks */}
                              <div className="md:col-span-6 space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[#737373] block">
                                  Question Remarks & Feedback
                                </label>
                                <textarea
                                  rows={6}
                                  value={currentGrade.remarks}
                                  onChange={(e) => handleRemarksChange(ans.question_id, e.target.value)}
                                  placeholder="Add specific corrections or notes on this answer..."
                                  className="w-full p-2.5 rounded-xl border border-[#E5E5E5] text-xs font-medium text-[#111111] bg-white focus:ring-2 focus:ring-[#111111] focus:outline-hidden resize-none"
                                />
                              </div>
                            </div>
                          ) : (
                            /* When NO Photo Exists: Collapse box and hide textarea by default! */
                            <div className="pt-0.5 space-y-2">
                              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#FAFAFA] border border-dashed border-[#E5E5E5] text-xs">
                                <span className="text-[11px] text-[#737373] flex items-center gap-1.5">
                                  <span>⚠️ No photo uploaded by student</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleRemarks(ans.question_id)}
                                  className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer flex items-center gap-1"
                                >
                                  {isExpanded ? (
                                    <>
                                      <span>Hide Remarks</span>
                                      <ChevronUp className="w-3 h-3" />
                                    </>
                                  ) : (
                                    <>
                                      <span>+ Add Question Remarks</span>
                                      <ChevronDown className="w-3 h-3" />
                                    </>
                                  )}
                                </button>
                              </div>

                              {isExpanded && (
                                <textarea
                                  rows={3}
                                  value={currentGrade.remarks}
                                  onChange={(e) => handleRemarksChange(ans.question_id, e.target.value)}
                                  placeholder="Add specific feedback for this question..."
                                  className="w-full p-2.5 rounded-xl border border-[#E5E5E5] text-xs font-medium text-[#111111] bg-white focus:ring-2 focus:ring-[#111111] focus:outline-hidden"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Overall Feedback */}
          <div className="p-4 rounded-2xl border border-[#E5E5E5] bg-white shadow-xs space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
              Overall Assessment Feedback for Student
            </label>
            {isArchived ? (
              <p className="text-xs font-medium text-neutral-800 p-2 bg-[#FAFAFA] rounded-xl border border-[#E5E5E5]">
                {overallFeedback || 'No overall feedback recorded.'}
              </p>
            ) : (
              <textarea
                rows={2}
                value={overallFeedback}
                onChange={(e) => setOverallFeedback(e.target.value)}
                placeholder="Constructive feedback, key strengths, and recommendations..."
                className="w-full p-2.5 rounded-xl border border-[#E5E5E5] text-xs font-medium text-[#111111] bg-white focus:ring-2 focus:ring-[#111111] focus:outline-hidden"
              />
            )}
          </div>
        </div>

        {/* Modal Footer with Auto-Calculated Combined Total & Save */}
        <div className="px-4 sm:px-6 py-3 border-t border-[#F0F0F0] bg-[#FAFAFA] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-bold text-[#737373]">Total:</span>
              <span className="text-xl font-black text-[#111111]">
                {totalCalculatedScore}
              </span>
              <span className="text-xs font-extrabold text-[#737373]">
                / {submission.total_marks} Marks
              </span>
            </div>
            <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
              ({Math.round((totalCalculatedScore / (submission.total_marks || 1)) * 100)}%)
            </span>
            {mcqAnswers.length > 0 && writtenAnswers.length > 0 && (
              <div className="text-[11px] text-[#737373] hidden md:block">
                MCQs: {mcqCalculatedScore}/{mcqTotalMax} • Written: {writtenCalculatedScore}/{writtenTotalMax}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#737373] hover:text-[#111111] hover:bg-white transition-colors cursor-pointer"
            >
              {isArchived ? 'Close Record' : 'Cancel'}
            </button>
            {!isArchived && (
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveGrade}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#111111] text-white text-xs font-extrabold hover:bg-[#262626] transition-all shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Publishing...' : 'Publish Grade & Remarks'}
              </button>
            )}
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
