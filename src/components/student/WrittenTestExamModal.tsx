import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Camera,
  RefreshCw,
  Send,
  UserCheck,
  ChevronRight,
  Upload,
  FileText,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth/AuthContext';
import { MathText } from '../common/MathText';
import { verifyStudentId, type VerifiedStudentInfo } from '../../lib/proctoredMcqService';
import {
  uploadExamQuestionPhoto,
  submitWrittenTest,
} from '../../lib/writtenTestService';
import type {
  WrittenTest,
  WrittenSubmission,
  WrittenQuestionAnswer,
} from '../../types/writtenTest';

interface WrittenTestExamModalProps {
  isOpen: boolean;
  test: WrittenTest | null;
  studentId?: string;
  studentName?: string;
  onClose: () => void;
  onSubmitted?: (submission: WrittenSubmission) => void;
  onSubmitSuccess?: () => void;
}

export const WrittenTestExamModal: React.FC<WrittenTestExamModalProps> = ({
  isOpen,
  test,
  studentId,
  studentName,
  onClose,
  onSubmitted,
  onSubmitSuccess,
}) => {
  const { profile } = useAuth();

  // Phase: 'verify_id' -> 'warning' -> 'in_exam' -> 'submitted'
  const [phase, setPhase] = useState<'verify_id' | 'warning' | 'in_exam' | 'submitted'>('verify_id');

  // Student verification
  const defaultId = studentId || (profile?.id ? profile.id.slice(0, 8) : '');
  const [inputId, setInputId] = useState<string>(defaultId);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verifiedStudent, setVerifiedStudent] = useState<VerifiedStudentInfo | null>(
    studentId
      ? {
          id: studentId,
          name: studentName || 'Student',
          grade: String(test?.grade || '9'),
          stream: test?.stream,
          board: test?.board,
          displayId: studentId,
        }
      : null
  );

  // Exam Progress
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answersMap, setAnswersMap] = useState<Record<string, WrittenQuestionAnswer>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(1800);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<WrittenSubmission | null>(null);
  const [violationTriggered, setViolationTriggered] = useState<string | null>(null);

  // Camera In-Browser Capture State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Proctoring safety refs
  const hasAutoSubmittedRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());
  const isCameraOperatingRef = useRef<boolean>(false);

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
      setAnswersMap({});
      setCurrentQuestionIndex(0);
      setTimeRemainingSeconds((test.duration_minutes || 45) * 60);
      setSubmitting(false);
      setUploadingPhoto(false);
      setSubmissionResult(null);
      setViolationTriggered(null);
      setCapturedPhotoUrl(null);
      setCapturedBlob(null);
      hasAutoSubmittedRef.current = false;
      startTimeRef.current = Date.now();
      isCameraOperatingRef.current = false;
    }
  }, [isOpen, test, profile?.id, profile?.full_name]);

  // Clean up camera stream when unmounting or switching questions
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Start Camera Stream
  const startCamera = async (facingMode = cameraFacingMode) => {
    isCameraOperatingRef.current = true;
    setCameraError(null);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera device access is not supported by your browser.');
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        // Fallback to basic video constraint
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access note:', err);
      setCameraError(err.message || 'Unable to access camera.');
    } finally {
      // Keep small grace period for camera dialog
      setTimeout(() => {
        isCameraOperatingRef.current = false;
      }, 1000);
    }
  };

  // Flip / Switch Camera
  const switchCamera = () => {
    const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Take Snapshot from live video feed
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
        }
      },
      'image/jpeg',
      0.85
    );

    setCapturedPhotoUrl(dataUrl);
    stopCameraStream();
    toast.success('Photo captured! Review below or retake if needed.');
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    startCamera();
  };

  // File fallback upload
  const handleFileFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    isCameraOperatingRef.current = true;
    const file = e.target.files?.[0];
    if (!file) {
      isCameraOperatingRef.current = false;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedPhotoUrl(reader.result as string);
      setCapturedBlob(file);
      stopCameraStream();
    };
    reader.readAsDataURL(file);
    setTimeout(() => {
      isCameraOperatingRef.current = false;
    }, 1000);
  };

  // Core Submit Handler
  const executeSubmission = useCallback(
    async (violationReason?: string) => {
      if (hasAutoSubmittedRef.current || submitting || !test) return;
      hasAutoSubmittedRef.current = true;
      setSubmitting(true);
      stopCameraStream();

      const timeSpent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      const sId = verifiedStudent?.id || profile?.id || inputId || 'student_guest';
      const sName = verifiedStudent?.name || profile?.full_name || 'Student';

      try {
        const answersList = Object.values(answersMap);

        const sub: WrittenSubmission = {
          id: `wsub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          test_id: test.id,
          test_title: test.title,
          test_type: test.type,
          student_id: sId,
          student_name: sName,
          student_email: verifiedStudent?.email || profile?.phone,
          grade: test.grade,
          stream: test.stream,
          subject: test.subject,
          submitted_at: new Date().toISOString(),
          time_spent_seconds: timeSpent,
          answers: answersList,
          final_score: null,
          total_marks: test.total_marks,
          status: 'submitted',
          violation_reason: violationReason || null,
        };

        const savedSub = await submitWrittenTest(sub);

        setSubmissionResult(savedSub);
        setViolationTriggered(violationReason || null);
        setPhase('submitted');

        if (violationReason) {
          toast.error(`Proctoring Trigger: ${violationReason}. Test auto-submitted immediately.`);
        } else {
          toast.success('Assessment submitted successfully!');
        }

        if (onSubmitted) onSubmitted(savedSub);
        if (onSubmitSuccess) onSubmitSuccess();
      } catch (err: any) {
        console.error('Submission error:', err);
        toast.error(err.message || 'Failed to submit test.');
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, test, verifiedStudent, profile, inputId, answersMap, onSubmitted, onSubmitSuccess, stopCameraStream]
  );

  // Active Anti-Cheating Proctoring Listeners
  // Note: During camera interaction (isCameraOperatingRef.current), camera dialogs won't trigger auto-submit!
  useEffect(() => {
    if (phase !== 'in_exam') return;

    // 1. Tab Switch Detection
    const handleVisibilityChange = () => {
      if (document.hidden && !hasAutoSubmittedRef.current && !isCameraOperatingRef.current) {
        executeSubmission('Auto-submitted: Tab/window switch detected (focus lost)');
      }
    };

    // 2. Window Blur Detection
    const handleWindowBlur = () => {
      if (!hasAutoSubmittedRef.current && !isCameraOperatingRef.current) {
        executeSubmission('Auto-submitted: Browser window focus lost (switched away from exam)');
      }
    };

    // 3. Screenshot Detection
    const handleKeyDown = (e: KeyboardEvent) => {
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

    // 4. Clipboard Prevention
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.warning('Copying is disabled during this proctored exam.');
    };

    // 5. Context Menu Prevention
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
          executeSubmission('Auto-submitted: Time limit expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, executeSubmission]);

  // Verify Student ID
  const handleVerifyStudentId = async () => {
    if (!inputId.trim()) {
      toast.error('Please enter your Student ID.');
      return;
    }
    setVerifying(true);
    try {
      const student = await verifyStudentId(inputId);
      if (student) {
        setVerifiedStudent(student);
        toast.success(`Identity Verified: Welcome, ${student.name}!`);
        setPhase('warning');
      } else {
        toast.error('Student ID not found. Please verify with your teacher or administration.');
      }
    } catch {
      toast.error('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Start Exam
  const handleStartExam = () => {
    hasAutoSubmittedRef.current = false;
    startTimeRef.current = Date.now();
    setTimeRemainingSeconds((test?.duration_minutes || 45) * 60);
    setPhase('in_exam');
    setCurrentQuestionIndex(0);
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);

    // Try starting camera right away for Question 1
    setTimeout(() => {
      startCamera();
    }, 300);
  };

  // Format Time Remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !test) return null;

  const currentQuestion = test.questions[currentQuestionIndex];
  const totalQuestions = test.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  // Handle Submit Answer & Advance to Next Question
  const handleAttachAndProceed = async () => {
    if (!capturedPhotoUrl && !capturedBlob) {
      toast.error('Please take a clear photo of your handwritten answer sheet first.');
      return;
    }

    setUploadingPhoto(true);
    isCameraOperatingRef.current = true;

    try {
      const sId = verifiedStudent?.id || profile?.id || inputId || 'student_guest';
      const uploadPayload = capturedBlob || capturedPhotoUrl!;

      const uploadRes = await uploadExamQuestionPhoto(
        test.id,
        sId,
        currentQuestion.id,
        uploadPayload
      );

      const newAnswer: WrittenQuestionAnswer = {
        question_id: currentQuestion.id,
        question_text: currentQuestion.question,
        max_marks: currentQuestion.marks,
        photo_url: uploadRes.photo_url,
        r2_key: uploadRes.r2_key,
        captured_at: new Date().toISOString(),
      };

      // Save to answers map
      setAnswersMap((prev) => ({
        ...prev,
        [currentQuestion.id]: newAnswer,
      }));

      toast.success(`Answer for Question #${currentQuestionIndex + 1} attached!`);

      // Reset photo state for next question
      setCapturedPhotoUrl(null);
      setCapturedBlob(null);

      if (isLastQuestion) {
        // Final question answered: execute full submission
        executeSubmission();
      } else {
        // Advance to next question in sequence
        setCurrentQuestionIndex((prev) => prev + 1);
        // Start camera for the next question
        setTimeout(() => {
          startCamera();
        }, 300);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload photo answer.');
    } finally {
      setUploadingPhoto(false);
      setTimeout(() => {
        isCameraOperatingRef.current = false;
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl border border-[#E5E5E5] w-full max-w-4xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-800">
              {test.type === 'short_question' ? (
                <FileText className="w-5 h-5" />
              ) : (
                <BookOpen className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#111111] text-sm sm:text-base">{test.title}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-black text-amber-400">
                  {test.type === 'short_question' ? 'Short Question' : 'Long Question'}
                </span>
              </div>
              <p className="text-xs text-[#737373]">
                {test.subject} • Grade {test.grade} • {test.total_marks} Marks Total
              </p>
            </div>
          </div>

          {phase === 'in_exam' && (
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-xs border ${
                  timeRemainingSeconds < 300
                    ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                    : 'bg-[#FAFAFA] text-[#111111] border-[#E5E5E5]'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeRemainingSeconds)}</span>
              </div>
            </div>
          )}

          {phase !== 'in_exam' && (
            <button
              onClick={onClose}
              className="p-2 text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* PHASE 1: Verify Student ID */}
          {phase === 'verify_id' && (
            <div className="max-w-md mx-auto py-8 space-y-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                <UserCheck className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#111111]">Student Identification</h3>
                <p className="text-xs text-[#737373] mt-1">
                  Enter your assigned Student ID or Roll Number to access this assessment.
                </p>
              </div>

              <div className="space-y-3 text-left">
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                  Student ID / Roll Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputId}
                    onChange={(e) => setInputId(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyStudentId()}
                    placeholder="e.g. STD-1092"
                    className="w-full h-12 px-4 rounded-xl border border-[#E5E5E5] text-sm font-bold text-[#111111] tracking-wider placeholder:tracking-normal focus:ring-2 focus:ring-[#111111] focus:outline-hidden bg-white uppercase"
                  />
                </div>
              </div>

              <button
                onClick={handleVerifyStudentId}
                disabled={verifying}
                className="w-full h-12 rounded-xl bg-[#111111] text-white text-xs font-extrabold tracking-wide uppercase hover:bg-[#262626] transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifying ? 'Verifying Student Record...' : 'Verify Student ID'}
              </button>
            </div>
          )}

          {/* PHASE 2: Anti-Cheating & Camera Instructions */}
          {phase === 'warning' && (
            <div className="max-w-lg mx-auto py-4 space-y-5">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 font-bold text-sm">
                  {verifiedStudent?.displayId?.slice(0, 3) || 'STD'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[#111111]">{verifiedStudent?.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/60 text-amber-900">
                      ID: #{verifiedStudent?.displayId}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900">
                    Grade {verifiedStudent?.grade} • {test.subject} Assessment
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Mandatory Examination Protocol
                </h4>
                <div className="p-4 rounded-2xl border border-red-100 bg-red-50/40 text-xs text-[#111111] space-y-2.5">
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 shrink-0" />
                    <p>
                      <strong className="text-red-900">Sequential Questions:</strong> Questions appear one by one. You must solve each question on handwritten paper, capture it with the camera, and submit before moving forward.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 shrink-0" />
                    <p>
                      <strong className="text-red-900">No Tab Switching:</strong> Leaving this tab, minimizing the browser, or switching windows triggers immediate auto-submission.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 shrink-0" />
                    <p>
                      <strong className="text-red-900">Live Camera Submissions:</strong> Camera capture operates inside the test page. Your photos are uploaded to secure storage and auto-expire after 24 hours.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartExam}
                className="w-full h-12 rounded-xl bg-[#111111] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#262626] transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Enter Assessment & Start Question #1</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* PHASE 3: In-Exam Sequential Question & Camera Flow */}
          {phase === 'in_exam' && currentQuestion && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Question Sequence Tracker */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-[#111111] text-white text-xs font-black">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                  <span className="text-xs text-[#737373]">
                    {test.type === 'short_question' ? 'Short Question' : 'Long Question'}
                  </span>
                </div>
                <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
                  {currentQuestion.marks} Marks
                </div>
              </div>

              {/* Question Text with LaTeX */}
              <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#737373] block">
                  Question Prompt:
                </span>
                <div className="text-sm font-semibold text-[#111111] leading-relaxed">
                  <MathText text={currentQuestion.question} />
                </div>
              </div>

              {/* In-Browser Camera Capture Area */}
              <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-amber-700" />
                    <h4 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider">
                      Capture Handwritten Answer Sheet
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-[#737373]">
                    {capturedPhotoUrl ? 'Photo Ready' : 'Live Camera View'}
                  </span>
                </div>

                {/* Viewport: Either Live Video or Captured Photo Preview */}
                <div className="relative w-full aspect-4/3 max-h-[360px] bg-black rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                  {capturedPhotoUrl ? (
                    <img
                      src={capturedPhotoUrl}
                      alt="Captured handwritten answer"
                      className="w-full h-full object-contain"
                    />
                  ) : isCameraActive ? (
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-3">
                      <Camera className="w-10 h-10 text-white/40 mx-auto" />
                      <p className="text-xs text-white/80 font-medium">
                        {cameraError ? cameraError : 'Camera stream is paused'}
                      </p>
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="px-4 py-2 rounded-xl bg-white text-[#111111] text-xs font-extrabold hover:bg-neutral-100 transition-all shadow-sm"
                      >
                        Start Camera
                      </button>
                    </div>
                  )}

                  {/* Corner proctoring badge */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Proctored Session
                  </div>
                </div>

                {/* Camera Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    {!capturedPhotoUrl && isCameraActive && (
                      <button
                        type="button"
                        onClick={switchCamera}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-[#111111] hover:bg-[#F5F5F5] transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Flip Camera
                      </button>
                    )}

                    {capturedPhotoUrl && (
                      <button
                        type="button"
                        onClick={retakePhoto}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-[#111111] hover:bg-[#F5F5F5] transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retake Photo
                      </button>
                    )}

                    {/* Secondary File Upload Fallback */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileFallback}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#737373] hover:text-[#111111] hover:bg-white/60 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Browse Photo
                    </button>
                  </div>

                  <div>
                    {!capturedPhotoUrl && isCameraActive ? (
                      <button
                        type="button"
                        onClick={takeSnapshot}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-extrabold hover:bg-amber-700 transition-all shadow-md"
                      >
                        <Camera className="w-4 h-4" />
                        Snap Photo
                      </button>
                    ) : capturedPhotoUrl ? (
                      <button
                        type="button"
                        disabled={uploadingPhoto}
                        onClick={handleAttachAndProceed}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-extrabold hover:bg-[#262626] transition-all shadow-md disabled:opacity-50"
                      >
                        {uploadingPhoto ? (
                          'Uploading to Storage...'
                        ) : isLastQuestion ? (
                          <>
                            <span>Submit Assessment</span>
                            <Send className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <span>Attach & Next Question</span>
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PHASE 4: Final Submission Confirmation */}
          {phase === 'submitted' && (
            <div className="max-w-md mx-auto py-8 text-center space-y-5">
              <div
                className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-md ${
                  violationTriggered ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {violationTriggered ? (
                  <AlertTriangle className="w-8 h-8" />
                ) : (
                  <CheckCircle2 className="w-8 h-8" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#111111]">
                  {violationTriggered ? 'Test Auto-Submitted' : 'Assessment Submitted!'}
                </h3>
                <p className="text-xs text-[#737373] mt-1">
                  {violationTriggered
                    ? violationTriggered
                    : 'Your handwritten answers have been captured and securely stored for teacher grading.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#737373]">Student:</span>
                  <span className="font-bold text-[#111111]">{verifiedStudent?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Test Type:</span>
                  <span className="font-bold text-[#111111]">
                    {test.type === 'short_question' ? 'Short Question' : 'Long Question'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Submitted Questions:</span>
                  <span className="font-bold text-[#111111]">
                    {submissionResult?.answers.length || 0} / {test.questions.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Storage Policy:</span>
                  <span className="font-bold text-amber-700">Cloudflare R2 (24-Hour Expiry)</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full h-11 rounded-xl bg-[#111111] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#262626] transition-all shadow-sm"
              >
                Close & Return
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
