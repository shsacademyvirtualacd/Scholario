import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Lock,
  ChevronRight,
  ChevronLeft,
  Send,
  UserCheck,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth/AuthContext';
import { MathText } from '../common/MathText';
import {
  verifyStudentId,
  submitProctoredMCQTest,
  type VerifiedStudentInfo,
} from '../../lib/proctoredMcqService';
import type { ProctoredMCQTest, ProctoredMCQSubmission } from '../../types/proctoredMcq';

interface ProctoredMCQExamModalProps {
  isOpen: boolean;
  test: ProctoredMCQTest | null;
  studentId?: string;
  studentName?: string;
  onClose: () => void;
  onSubmitted: (submission: ProctoredMCQSubmission) => void;
}

export const ProctoredMCQExamModal: React.FC<ProctoredMCQExamModalProps> = ({
  isOpen,
  test,
  studentId,
  studentName,
  onClose,
  onSubmitted,
}) => {
  const { profile } = useAuth();

  // Phase: 'verify_id' -> 'warning' -> 'in_exam' -> 'submitted'
  const [phase, setPhase] = useState<'verify_id' | 'warning' | 'in_exam' | 'submitted'>('verify_id');

  // Student ID State
  const defaultId = studentId || (profile?.id ? profile.id.slice(0, 8) : '');
  const [inputId, setInputId] = useState<string>(defaultId);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verifiedStudent, setVerifiedStudent] = useState<VerifiedStudentInfo | null>(
    studentId
      ? {
          id: studentId,
          name: studentName || 'Student',
          grade: String(test?.grade || '10'),
          stream: test?.stream,
          board: test?.board,
          displayId: studentId,
        }
      : null
  );

  // Exam Progress State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(1800); // 30 min default
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<ProctoredMCQSubmission | null>(null);
  const [violationTriggered, setViolationTriggered] = useState<string | null>(null);

  // Proctoring safety ref to prevent multiple triggers
  const hasAutoSubmittedRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());

  // Reset modal state when test changes or opens
  useEffect(() => {
    if (isOpen && test) {
      setPhase('verify_id');
      const initialId = profile?.id ? profile.id.slice(0, 8) : '';
      setInputId(initialId);
      setVerifiedStudent(
        initialId
          ? {
              id: profile?.id || 'student',
              name: profile?.full_name || 'Student',
              grade: String(test.grade),
              stream: test.stream,
              board: test.board,
              displayId: initialId,
            }
          : null
      );
      setSelectedAnswers({});
      setCurrentQuestionIndex(0);
      setTimeRemainingSeconds((test.duration_minutes || 30) * 60);
      setSubmitting(false);
      setSubmissionResult(null);
      setViolationTriggered(null);
      hasAutoSubmittedRef.current = false;
      startTimeRef.current = Date.now();
    }
  }, [isOpen, test, profile?.id, profile?.full_name]);

  // Core Submit Handler
  const executeSubmission = useCallback(
    async (violationReason?: string) => {
      if (hasAutoSubmittedRef.current || submitting || !test) return;
      hasAutoSubmittedRef.current = true;
      setSubmitting(true);

      const timeSpent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      const studentId = verifiedStudent?.id || profile?.id || inputId || 'student_guest';
      const studentName = verifiedStudent?.name || profile?.full_name || 'Student';

      try {
        const sub = await submitProctoredMCQTest({
          test,
          studentId,
          studentName,
          studentEmail: verifiedStudent?.email || profile?.phone,
          studentRollNo: verifiedStudent?.displayId || inputId,
          answers: selectedAnswers,
          timeSpentSeconds: timeSpent,
          violationReason: violationReason || null,
        });

        setSubmissionResult(sub);
        setViolationTriggered(violationReason || null);
        setPhase('submitted');

        if (violationReason) {
          toast.error(`Proctoring Trigger: ${violationReason}. Test auto-submitted immediately.`);
        } else {
          toast.success('Assessment submitted successfully!');
        }

        onSubmitted(sub);
      } catch (err: any) {
        console.error('Submission error:', err);
        toast.error(err.message || 'Failed to submit test.');
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, test, verifiedStudent, profile, inputId, selectedAnswers, onSubmitted]
  );

  // Active Anti-Cheating Proctoring Listeners
  useEffect(() => {
    if (phase !== 'in_exam') return;

    // 1. Tab / Window Switch Detection (Page Visibility API)
    const handleVisibilityChange = () => {
      if (document.hidden && !hasAutoSubmittedRef.current) {
        executeSubmission('Auto-submitted: Tab/window switch detected (focus lost)');
      }
    };

    // 2. Window Blur Detection (minimize, focus switch, open another window)
    const handleWindowBlur = () => {
      if (!hasAutoSubmittedRef.current) {
        executeSubmission('Auto-submitted: Browser window focus lost (switched away from exam)');
      }
    };

    // 3. Screenshot Key Detection
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        if (!hasAutoSubmittedRef.current) {
          executeSubmission('Auto-submitted: Screenshot key (PrintScreen) pressed');
        }
        return;
      }

      // Mac screenshot combos: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
      // Windows snipping combos: Win+Shift+S, Ctrl+Shift+S
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        if (['3', '4', '5', 's', 'S'].includes(e.key)) {
          e.preventDefault();
          if (!hasAutoSubmittedRef.current) {
            executeSubmission('Auto-submitted: Screen capture keyboard shortcut detected');
          }
          return;
        }
      }

      // Prevent copy
      if ((e.metaKey || e.ctrlKey) && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        toast.warning('Copying is prohibited during proctored exams.');
      }
    };

    // 4. Clipboard / Copy Event Listener
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.warning('Copying is disabled during this proctored exam.');
    };

    // 5. Context Menu (Right-Click) Prevention
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [phase, executeSubmission]);

  // Exam Countdown Timer
  useEffect(() => {
    if (phase !== 'in_exam') return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          executeSubmission('Auto-submitted: Exam time limit expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, executeSubmission]);

  // Format timer MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleVerifyStudentId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputId.trim()) {
      toast.error('Please enter your Student ID.');
      return;
    }

    setVerifying(true);
    try {
      const student = await verifyStudentId(inputId.trim());
      if (student) {
        setVerifiedStudent(student);
        setPhase('warning');
      } else {
        toast.error('Student ID not recognized. Please check your ID and try again.');
      }
    } catch {
      toast.error('Failed to verify Student ID.');
    } finally {
      setVerifying(false);
    }
  };

  const handleStartExam = () => {
    setPhase('in_exam');
    startTimeRef.current = Date.now();
    hasAutoSubmittedRef.current = false;
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  if (!isOpen || !test) return null;

  const currentQ = test.questions[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const isUrgent = timeRemainingSeconds < 300; // less than 5 mins

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E5E5E5] w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Top Indicator Bar (During Exam) */}
        {phase === 'in_exam' && (
          <div className="bg-[#111111] text-white px-5 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Proctoring Active</span>
              </div>
              <span className="text-xs text-white/80 font-semibold hidden md:inline">
                Candidate: <strong className="text-white">{verifiedStudent?.name}</strong> (#{verifiedStudent?.displayId})
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black font-mono tracking-wider ${
                  isUrgent ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' : 'bg-white/10 text-white'
                }`}
              >
                <Clock size={14} className={isUrgent ? 'text-red-400' : 'text-[#F4C430]'} />
                <span>{formatTime(timeRemainingSeconds)}</span>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={() => executeSubmission()}
                className="px-3.5 py-1 rounded-xl bg-[#F4C430] text-[#111111] hover:bg-[#E5B620] text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <Send size={13} />
                <span>Submit Exam</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Header for other phases */}
        {phase !== 'in_exam' && (
          <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <ShieldAlert size={20} className="text-[#F4C430]" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#111111]">{test.title}</h2>
                <p className="text-xs text-[#737373]">
                  {test.subject} • Grade {test.grade} • {test.duration_minutes} Mins • {test.total_marks} Marks
                </p>
              </div>
            </div>
            {phase !== 'submitted' && (
              <button
                onClick={onClose}
                className="p-2 text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* PHASE 1: Verify Student ID (No Password Required) */}
          {phase === 'verify_id' && (
            <div className="max-w-md mx-auto py-6 space-y-5 text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
                <UserCheck size={32} className="text-[#F4C430]" />
              </div>

              <div>
                <h3 className="text-lg font-black text-[#111111]">Confirm Student Identity</h3>
                <p className="text-xs text-[#737373] mt-1">
                  Enter your unique <strong>Student ID</strong> (e.g. 8-character ID or student roll number) to access and begin this proctored test.
                </p>
              </div>

              <form onSubmit={handleVerifyStudentId} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                    Student ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputId}
                      onChange={(e) => setInputId(e.target.value)}
                      placeholder="e.g. d6a8f12b or roll number"
                      className="w-full h-11 px-4 rounded-xl border border-[#E5E5E5] text-xs font-mono font-bold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-[#A3A3A3] mt-1">
                    No password required. Your ID is used to record and authenticate your assessment submission.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full h-11 rounded-xl bg-[#111111] text-[#F4C430] hover:bg-black font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-transform active:scale-[0.98]"
                >
                  <UserCheck size={16} />
                  <span>{verifying ? 'Verifying...' : 'Verify Student ID & Proceed'}</span>
                </button>
              </form>
            </div>
          )}

          {/* PHASE 2: Mandatory Proctoring Warning */}
          {phase === 'warning' && (
            <div className="max-w-xl mx-auto py-4 space-y-5">
              <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 space-y-3">
                <div className="flex items-center gap-2.5 text-amber-900">
                  <ShieldAlert size={24} className="text-amber-600 shrink-0" />
                  <h3 className="text-base font-black uppercase tracking-wide">
                    Mandatory Proctoring Notice
                  </h3>
                </div>

                <p className="text-xs text-amber-950 font-semibold leading-relaxed">
                  Welcome, <strong>{verifiedStudent?.name}</strong> (Student ID: <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">#{verifiedStudent?.displayId}</code>).
                  Please read the strict anti-cheating regulations below carefully before starting your test:
                </p>

                <div className="space-y-2.5 pt-2 border-t border-amber-200 text-xs text-amber-900">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-red-950">Tab & Window Switch Trigger:</strong> If you switch to another browser tab, minimize the window, open another application, or click outside the test window, your test will be <strong>automatically and immediately submitted</strong>.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-red-950">Screenshot Trigger:</strong> Pressing PrintScreen, screenshot shortcuts (e.g. Cmd+Shift+3/4/5 or Win+Shift+S), or screen capture tools will <strong>immediately auto-submit your test</strong>.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Lock size={16} className="text-amber-800 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-950">Single Attempt & Result Lock:</strong> Once you submit this test, it will <strong>disappear from your active/pending view</strong> and cannot be re-attempted. It will reappear in your graded results only after your instructor has finalized grades.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] text-xs text-[#525252] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#111111]">Duration:</span> {test.duration_minutes} minutes
                </div>
                <div>
                  <span className="font-bold text-[#111111]">Questions:</span> {test.questions.length} MCQs
                </div>
                <div>
                  <span className="font-bold text-[#111111]">Total Marks:</span> {test.total_marks}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPhase('verify_id')}
                  className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] cursor-pointer"
                >
                  Change Student ID
                </button>

                <button
                  type="button"
                  onClick={handleStartExam}
                  className="flex-1 py-3 rounded-xl bg-[#111111] text-[#F4C430] hover:bg-black font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98]"
                >
                  <ShieldAlert size={16} />
                  <span>I Understand Anti-Cheating Rules — Start Exam</span>
                </button>
              </div>
            </div>
          )}

          {/* PHASE 3: Active Exam Screen */}
          {phase === 'in_exam' && currentQ && (
            <div className="space-y-6">
              {/* Question Navigation Navigator */}
              <div className="flex items-center gap-1.5 flex-wrap pb-3 border-b border-[#F0F0F0]">
                {test.questions.map((q, idx) => {
                  const isAnswered = selectedAnswers[q.id] !== undefined;
                  const isCurrent = idx === currentQuestionIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                        isCurrent
                          ? 'bg-[#111111] text-[#F4C430] ring-2 ring-[#111111]'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-[#F5F5F5] text-[#737373] hover:bg-[#EBEBEB]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}

                <div className="ml-auto text-xs font-bold text-[#737373]">
                  Answered: <strong className="text-[#111111]">{answeredCount}</strong>/{test.questions.length}
                </div>
              </div>

              {/* Active Question Statement */}
              <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-xl bg-[#111111] text-[#F4C430] text-xs font-black">
                    Question {currentQuestionIndex + 1} of {test.questions.length}
                  </span>
                  <span className="text-xs font-bold text-[#737373] font-mono">
                    [{currentQ.marks || 1} mark{(currentQ.marks || 1) > 1 ? 's' : ''}]
                  </span>
                </div>

                <div className="text-sm font-bold text-[#111111] leading-relaxed">
                  <MathText text={currentQ.question} />
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[currentQ.id] === oIdx;
                  const letter = String.fromCharCode(65 + oIdx);
                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleSelectOption(currentQ.id, oIdx)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'bg-amber-50/60 border-[#111111] ring-2 ring-[#111111]/10 shadow-xs'
                          : 'bg-white border-[#E5E5E5] hover:border-[#CCCCCC]'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-[#111111] text-[#F4C430]' : 'bg-[#F0F0F0] text-[#737373]'
                        }`}
                      >
                        {letter}
                      </div>
                      <div className="flex-1 text-xs font-semibold text-[#111111]">
                        <MathText text={opt} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Prev / Next / Submit Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-[#F0F0F0]">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#737373] hover:text-[#111111] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                {currentQuestionIndex < test.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex((i) => Math.min(test.questions.length - 1, i + 1))}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black cursor-pointer shadow-xs"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => executeSubmission()}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#111111] text-[#F4C430] hover:bg-black text-xs font-black cursor-pointer shadow-md active:scale-[0.98]"
                  >
                    <Send size={14} />
                    <span>Complete & Submit Exam</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* PHASE 4: Post-Submission Screen */}
          {phase === 'submitted' && (
            <div className="max-w-md mx-auto py-8 text-center space-y-5">
              {violationTriggered ? (
                <div className="w-16 h-16 rounded-3xl bg-red-100 border border-red-200 flex items-center justify-center mx-auto text-red-600 animate-bounce">
                  <ShieldAlert size={32} />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 size={32} />
                </div>
              )}

              <div>
                <h3 className="text-lg font-black text-[#111111]">
                  {violationTriggered ? 'Exam Auto-Submitted' : 'Assessment Submitted Successfully'}
                </h3>
                {violationTriggered && (
                  <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 mt-2">
                    {violationTriggered}
                  </p>
                )}
                <p className="text-xs text-[#737373] mt-2 leading-relaxed">
                  Your assessment has been officially submitted and recorded for Candidate{' '}
                  <strong>{verifiedStudent?.name}</strong> (#{verifiedStudent?.displayId}).
                  {submissionResult && (
                    <span className="block mt-1 font-mono text-[11px] text-[#A3A3A3]">
                      Ref: {submissionResult.id} • {new Date(submissionResult.submitted_at).toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </div>

              {/* Status Notice */}
              <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] text-xs text-left space-y-2">
                <div className="flex items-center gap-2 text-[#111111] font-bold">
                  <EyeOff size={15} className="text-[#A3A3A3]" />
                  <span>Hidden from Active / Pending View</span>
                </div>
                <p className="text-[#737373] text-[11px] leading-relaxed">
                  In accordance with examination policy, this test has now been removed from your active tests list and cannot be re-attempted.
                </p>
                <div className="pt-2 border-t border-[#EBEBEB] text-[11px] text-[#525252]">
                  <strong>When will results appear?</strong> The completed test will reappear in your <strong>Graded Results</strong> tab once your instructor has verified and finalized all marks.
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-[#111111] text-white font-extrabold text-xs hover:bg-black cursor-pointer shadow-xs"
              >
                Return to Testing Center
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProctoredMCQExamModal;
