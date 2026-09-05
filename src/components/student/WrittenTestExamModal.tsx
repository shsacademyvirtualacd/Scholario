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
  ChevronLeft,
  Upload,
  Layers,
  Eye,
  Lock,
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
import { useExamIntegrity } from '../../hooks/useExamIntegrity';
import { ExamWatermarkOverlay } from './ExamWatermarkOverlay';
import { ExamIntegrityBanner } from './ExamIntegrityBanner';

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
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
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

  // Compact sticky header on scroll
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

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
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsCameraStarting(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Dedicated callback ref to immediately attach stream when video mounts in DOM
  const attachVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      if (node.srcObject !== streamRef.current) {
        node.srcObject = streamRef.current;
      }
      node.play().catch((err) => {
        console.warn('attachVideoRef play note:', err);
      });
    }
  }, []);

  // Sync stream to video element whenever stream or active state updates
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch((err) => {
        console.warn('Sync video play note:', err);
      });
    }
  }, [isCameraActive, cameraFacingMode]);

  // Start Camera Stream with comprehensive multi-stage fallbacks & clear errors
  const startCamera = async (facingMode = cameraFacingMode) => {
    isCameraOperatingRef.current = true;
    setCameraError(null);
    setIsCameraStarting(true);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your current browser.');
      }

      let stream: MediaStream | null = null;

      // Level 1: Try requested facing mode with HD resolution
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          },
          audio: false,
        });
      } catch (err1) {
        console.warn('Camera level 1 (ideal facingMode HD) failed:', err1);
      }

      // Level 2: Try requested facing mode with basic resolution
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false,
          });
        } catch (err2) {
          console.warn('Camera level 2 (standard facingMode) failed:', err2);
        }
      }

      // Level 3: Fallback to any available video input device
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (err3) {
          console.warn('Camera level 3 (any video) failed:', err3);
          throw err3;
        }
      }

      if (!stream) {
        throw new Error('Could not establish video stream from camera.');
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setIsCameraStarting(false);

      // Attach immediately to video element if it already exists
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Direct video play notice:', playErr);
        }
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let userMsg = 'Unable to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userMsg = 'Camera permission was denied. Please allow camera access in your browser site settings and click "Retry Camera", or use "Browse Photo" to upload your handwritten solution.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        userMsg = 'No camera device found on this system. You can upload your handwritten solution using "Browse Photo".';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        userMsg = 'Camera hardware is busy or reserved by another application. Please close other camera tabs/apps and click "Retry Camera".';
      } else if (err.name === 'OverconstrainedError') {
        userMsg = 'Requested camera resolution or direction is not supported by your device.';
      } else if (err.message) {
        userMsg = err.message;
      }
      setCameraError(userMsg);
      setIsCameraActive(false);
      setIsCameraStarting(false);
    } finally {
      // Keep isCameraOperatingRef active to shield against blur events during camera acquisition
      setTimeout(() => {
        isCameraOperatingRef.current = false;
      }, 1500);
    }
  };

  const switchCamera = async () => {
    isCameraOperatingRef.current = true;
    const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextMode);
    await startCamera(nextMode);
  };

  const takeSnapshot = () => {
    isCameraOperatingRef.current = true;
    if (!videoRef.current) {
      toast.error('Camera feed is not ready. Please try again.');
      return;
    }
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      toast.error('Camera feed is still initializing. Please wait a moment.');
      return;
    }

    try {
      const width = video.videoWidth;
      const height = video.videoHeight;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.error('Could not initialize snapshot canvas.');
        return;
      }

      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            setCapturedBlob(blob);
          }
        },
        'image/jpeg',
        0.9
      );

      setCapturedPhotoUrl(dataUrl);
      stopCameraStream();
      toast.success('Photo captured! Please review your answer sheet before confirming.');
    } catch (err: any) {
      console.error('Failed to take snapshot:', err);
      toast.error('Failed to capture snapshot. Please try again.');
    }
  };

  const retakePhoto = () => {
    isCameraOperatingRef.current = true;
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    startCamera();
  };

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
      toast.success('Photo loaded! Review before confirming.');
    };
    reader.readAsDataURL(file);
    setTimeout(() => {
      isCameraOperatingRef.current = false;
    }, 1500);
  };

  // Core Submit Handler (bundles both MCQs & Written Questions together)
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
        // Build answers list for all questions in test
        let totalMCQEarned = 0;
        let totalMCQMarks = 0;
        let totalWrittenMarks = 0;

        const answersList: WrittenQuestionAnswer[] = test.questions.map((q, idx) => {
          const existing = answersMap[q.id];
          const isMCQ = q.type === 'mcq';

          if (isMCQ) {
            totalMCQMarks += q.marks;
            const selectedOpt = existing?.selected_option ?? null;
            const correctOpt = q.correctAnswer ?? q.correct_option_index ?? 0;
            const isCorrect = selectedOpt !== null && selectedOpt === correctOpt;
            const awarded = isCorrect ? q.marks : 0;
            totalMCQEarned += awarded;

            return {
              question_id: q.id,
              question_type: 'mcq',
              question_text: q.question,
              question_order: idx + 1,
              max_marks: q.marks,
              selected_option: selectedOpt,
              correct_option: correctOpt,
              is_correct: isCorrect,
              marks_awarded: awarded,
              photo_url: '',
              r2_key: '',
              captured_at: existing?.captured_at || new Date().toISOString(),
            };
          } else {
            totalWrittenMarks += q.marks;
            return {
              question_id: q.id,
              question_type: q.type || 'short_question',
              question_text: q.question,
              question_order: idx + 1,
              max_marks: q.marks,
              photo_url: existing?.photo_url || '',
              photo_data_url: existing?.photo_data_url,
              r2_key: existing?.r2_key || '',
              captured_at: existing?.captured_at || new Date().toISOString(),
              marks_awarded: null, // to be manually graded by teacher
            };
          }
        });

        const hasWrittenQuestions = test.questions.some((q) => q.type !== 'mcq');
        const submissionStatus = hasWrittenQuestions ? 'submitted' : 'graded';
        const initialFinalScore = hasWrittenQuestions ? null : totalMCQEarned;

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
          mcq_score: totalMCQEarned,
          mcq_total: totalMCQMarks,
          written_total: totalWrittenMarks,
          final_score: initialFinalScore,
          total_marks: test.total_marks,
          percentage: !hasWrittenQuestions && test.total_marks > 0
            ? Math.round((totalMCQEarned / test.total_marks) * 100)
            : undefined,
          status: submissionStatus,
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

  // Active Anti-Cheating & Exam Integrity Detection
  useExamIntegrity({
    active: phase === 'in_exam' && !hasAutoSubmittedRef.current,
    onViolation: (reason) => {
      executeSubmission(reason);
    },
    isShielded: () => Boolean(isCameraOperatingRef.current || isCameraActive || !!capturedPhotoUrl || uploadingPhoto),
    studentName: verifiedStudent?.name || profile?.full_name || 'Student',
    studentId: verifiedStudent?.displayId || inputId || 'STD',
  });

  // Exam Countdown Timer
  useEffect(() => {
    if (phase !== 'in_exam') return;

    const interval = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!hasAutoSubmittedRef.current) {
            executeSubmission('Auto-submitted: Allocated time elapsed');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, executeSubmission]);

  // Verify Student ID
  const handleVerifyStudentId = async () => {
    if (!inputId.trim()) {
      toast.error('Please enter your Student ID or Roll Number.');
      return;
    }

    setVerifying(true);
    try {
      const verified = await verifyStudentId(inputId.trim());
      if (!verified) {
        throw new Error('Student ID not found or could not be verified.');
      }
      setVerifiedStudent(verified);
      setPhase('warning');
      toast.success(`Identity verified: ${verified.name} (Grade ${verified.grade})`);
    } catch (err: any) {
      toast.error(err.message || 'Invalid Student ID. Please verify with your teacher.');
    } finally {
      setVerifying(false);
    }
  };

  const handleStartExam = () => {
    setPhase('in_exam');
    startTimeRef.current = Date.now();
    setCurrentQuestionIndex(0);

    // If first question is written, start camera
    if (test && test.questions[0]?.type !== 'mcq') {
      startCamera();
    }
  };

  // MCQ Selection Handler
  const handleSelectMCQOption = (optionIndex: number) => {
    if (!test) return;
    const currentQ = test.questions[currentQuestionIndex];
    if (!currentQ) return;

    const corrOpt = currentQ.correctAnswer ?? currentQ.correct_option_index ?? 0;
    const isCorrect = optionIndex === corrOpt;

    setAnswersMap((prev) => ({
      ...prev,
      [currentQ.id]: {
        question_id: currentQ.id,
        question_type: 'mcq',
        question_text: currentQ.question,
        question_order: currentQuestionIndex + 1,
        max_marks: currentQ.marks,
        selected_option: optionIndex,
        correct_option: corrOpt,
        is_correct: isCorrect,
        marks_awarded: isCorrect ? currentQ.marks : 0,
        photo_url: '',
        r2_key: '',
        captured_at: new Date().toISOString(),
      },
    }));
  };

  // Navigate to Question
  const handleGoToQuestion = (targetIndex: number) => {
    if (!test || targetIndex < 0 || targetIndex >= test.questions.length) return;

    stopCameraStream();
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);

    setCurrentQuestionIndex(targetIndex);

    const targetQ = test.questions[targetIndex];
    // If target question is a written question, check if already answered or start camera
    if (targetQ.type !== 'mcq') {
      const existing = answersMap[targetQ.id];
      if (existing && (existing.photo_url || existing.photo_data_url)) {
        setCapturedPhotoUrl(existing.photo_url || existing.photo_data_url || null);
      } else {
        setTimeout(() => startCamera(), 200);
      }
    }
  };

  // Format Timer
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !test) return null;

  const currentQuestion = test.questions[currentQuestionIndex];
  const totalQuestions = test.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isCurrentMCQ = currentQuestion?.type === 'mcq';
  const currentMCQAnswer = answersMap[currentQuestion?.id]?.selected_option;

  // Handle Photo Attachment for Short/Long Written Questions
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
        question_type: currentQuestion.type || 'short_question',
        question_text: currentQuestion.question,
        max_marks: currentQuestion.marks,
        photo_url: uploadRes.photo_url,
        r2_key: uploadRes.r2_key,
        captured_at: new Date().toISOString(),
      };

      setAnswersMap((prev) => ({
        ...prev,
        [currentQuestion.id]: newAnswer,
      }));

      toast.success(`Answer for Question #${currentQuestionIndex + 1} attached!`);

      setCapturedPhotoUrl(null);
      setCapturedBlob(null);

      if (isLastQuestion) {
        executeSubmission();
      } else {
        handleGoToQuestion(currentQuestionIndex + 1);
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
      <div className="bg-white rounded-3xl border border-[#E5E5E5] w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Dynamic Watermark Overlay during active exam */}
        {phase === 'in_exam' && (
          <ExamWatermarkOverlay
            studentName={verifiedStudent?.name || profile?.full_name}
            studentId={verifiedStudent?.displayId || inputId}
            testTitle={test.title}
          />
        )}

        {/* Top Header - Compact & Sticky, Shrinks to thin bar on scroll */}
        {phase === 'in_exam' && isScrolled ? (
          <div className="px-4 py-2 border-b border-[#F0F0F0] flex items-center justify-between bg-white/95 backdrop-blur-xs shrink-0 transition-all sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="px-2 py-0.5 rounded-md bg-[#111111] text-amber-400 font-mono font-black text-xs shrink-0">
                Q{currentQuestionIndex + 1}/{totalQuestions}
              </span>
              <span className="font-extrabold text-xs text-[#111111] truncate">{test.title}</span>
              <span className="text-[11px] font-bold text-[#737373] hidden sm:inline">
                • {currentQuestion?.marks || 1} Marks
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-bold text-xs border ${
                  timeRemainingSeconds < 300
                    ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                    : 'bg-[#FAFAFA] text-[#111111] border-[#E5E5E5]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(timeRemainingSeconds)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 sm:px-6 py-2.5 border-b border-[#F0F0F0] flex items-center justify-between bg-white shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-800 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-[#111111] text-xs sm:text-sm">{test.title}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-black text-amber-400">
                    {test.type === 'unified'
                      ? 'Class Assessment'
                      : test.type === 'short_question'
                      ? 'Short Question'
                      : 'Long Question'}
                  </span>
                </div>
                <p className="text-[11px] text-[#737373]">
                  {test.subject} • Grade {test.grade} • {test.total_marks} Marks Total
                </p>
              </div>
            </div>

            {phase === 'in_exam' && (
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono font-bold text-xs border ${
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
                className="p-1.5 text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Modal Body with onScroll */}
        <div
          className="flex-1 overflow-y-auto p-3 sm:p-4"
          onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 20)}
        >
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
                className="w-full h-12 rounded-xl bg-[#111111] text-white text-xs font-extrabold tracking-wide uppercase hover:bg-[#262626] transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {verifying ? 'Verifying Student Record...' : 'Verify Student ID'}
              </button>
            </div>
          )}

          {/* PHASE 2: Anti-Cheating & Exam Protocol */}
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

              {/* Prominent Mandatory Disclosure Banner */}
              <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 flex items-start gap-3 shadow-xs">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                    Proctored Assessment Notice
                  </h4>
                  <p className="text-xs font-bold text-amber-950 mt-1 leading-snug">
                    This is a proctored exam. Screenshots, screen recording, tab-switching, or leaving this window will auto-submit your test and may be flagged for review.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-600" />
                  Mandatory Anti-Cheating Protocol
                </h4>
                <div className="p-4 rounded-2xl border border-neutral-200 bg-[#FAFAFA] text-xs text-[#111111] space-y-2.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <p>
                      <strong className="text-red-950">No Tab or Window Switching:</strong> Leaving this tab, minimizing your browser, or switching windows triggers immediate auto-submission.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <p>
                      <strong className="text-red-950">Screenshot & Capture Interception:</strong> Pressing PrintScreen, screenshot shortcuts (Win+Shift+S, Cmd+Shift+3/4/5), print dialogs (Ctrl+P), or recording overlays triggers instant auto-submission.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <p>
                      <strong className="text-red-950">Clipboard & DevTools Blocking:</strong> Text copying, right-click inspection, and opening Developer Tools (F12) are actively intercepted and will terminate the exam.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Eye className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                    <p>
                      <strong className="text-amber-950">Dynamic Watermark Traceability:</strong> Candidate name, ID, and live timestamp are watermarked across all exam pages to make unauthorized leaks permanently traceable.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Camera className="w-4 h-4 text-neutral-600 mt-0.5 shrink-0" />
                    <p>
                      <strong className="text-neutral-900">Camera Submissions:</strong> For written questions, write solutions on blank paper, snap a photo with the in-app camera, and attach it before submitting (camera usage is securely shielded).
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartExam}
                className="w-full h-12 rounded-xl bg-[#111111] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#262626] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Assessment & Start Question #1</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* PHASE 3: In-Exam Question Flow */}
          {phase === 'in_exam' && currentQuestion && (
            <div className="space-y-3 w-full max-w-4xl mx-auto">
              {/* Exam Integrity Banner */}
              <ExamIntegrityBanner
                studentName={verifiedStudent?.name || profile?.full_name}
                studentId={verifiedStudent?.displayId || inputId}
              />

              {/* Question Navigation Palette */}
              <div className="p-2 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#737373]">Question Navigator:</span>
                  <span className="font-bold text-[#111111]">
                    {Object.keys(answersMap).length} of {totalQuestions} Answered
                  </span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {test.questions.map((q, qIdx) => {
                    const isAnswered = !!answersMap[q.id];
                    const isCurrent = qIdx === currentQuestionIndex;
                    const qTypeTag =
                      q.type === 'mcq' ? 'MCQ' : q.type === 'short_question' ? 'Short' : 'Long';

                    return (
                      <button
                        key={q.id}
                        onClick={() => handleGoToQuestion(qIdx)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1 border ${
                          isCurrent
                            ? 'bg-[#111111] text-[#F4C430] border-[#111111] shadow-xs'
                            : isAnswered
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-white text-[#737373] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                        }`}
                      >
                        <span>Q{qIdx + 1}</span>
                        <span className="text-[10px] opacity-80 uppercase">({qTypeTag})</span>
                        {isAnswered && <CheckCircle2 size={11} className="text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Combined Question Header & Prompt Card (No redundant stacked borders) */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-1.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#EAEAEA]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#111111] text-white text-[11px] font-black">
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                    <span className="text-[11px] font-bold text-[#737373]">
                      {currentQuestion.type === 'mcq'
                        ? 'Multiple Choice'
                        : currentQuestion.type === 'short_question'
                        ? 'Short Answer'
                        : 'Long Answer'}
                    </span>
                  </div>
                  <div className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black">
                    {currentQuestion.marks} Marks
                  </div>
                </div>

                <div className="text-xs sm:text-[13px] font-semibold text-[#111111] leading-relaxed pt-0.5">
                  <MathText text={currentQuestion.question} />
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* SECTION A: MCQ CHOICE OPTIONS                                */}
              {/* ───────────────────────────────────────────────────────────── */}
              {isCurrentMCQ ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#737373] uppercase tracking-wider">
                      Select One Correct Answer:
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                      Auto-Graded
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQuestion.options?.map((optText, optIdx) => {
                      const isSelected = currentMCQAnswer === optIdx;
                      const label = ['A', 'B', 'C', 'D'][optIdx];

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectMCQOption(optIdx)}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                            isSelected
                              ? 'border-[#111111] bg-amber-50/70 shadow-xs scale-[1.01]'
                              : 'border-[#E5E5E5] bg-white hover:border-[#CCCCCC]'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              isSelected
                                ? 'bg-[#111111] text-[#F4C430]'
                                : 'bg-[#FAFAFA] border border-[#E5E5E5] text-[#737373]'
                            }`}
                          >
                            {label}
                          </div>
                          <div className="flex-1 text-xs font-bold text-[#111111]">
                            <MathText text={optText} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Navigation Bar for MCQ */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#F0F0F0]">
                    {currentQuestionIndex > 0 ? (
                      <button
                        onClick={() => handleGoToQuestion(currentQuestionIndex - 1)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-[#111111] cursor-pointer hover:bg-[#F5F5F5]"
                      >
                        <ChevronLeft size={14} />
                        <span>Previous Question</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      {!isLastQuestion ? (
                        <button
                          onClick={() => handleGoToQuestion(currentQuestionIndex + 1)}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-[#F4C430] text-xs font-black cursor-pointer shadow-xs active:scale-95 transition-all"
                        >
                          <span>Next Question</span>
                          <ChevronRight size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => executeSubmission()}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer shadow-xs active:scale-95 transition-all"
                        >
                          <span>Review & Submit Assessment</span>
                          <Send size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ───────────────────────────────────────────────────────────── */
                /* SECTION B: WRITTEN CAMERA CAPTURE (SHRUNK TO ~40% HEIGHT)    */
                /* ───────────────────────────────────────────────────────────── */
                <div className="p-3 sm:p-3.5 rounded-xl border border-amber-200 bg-amber-50/25 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-amber-700" />
                      <h4 className="text-[11px] font-extrabold text-[#111111] uppercase tracking-wider">
                        Capture Handwritten Answer Sheet
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-[#737373]">
                      {capturedPhotoUrl ? 'Photo Ready for Review' : 'Live Camera View'}
                    </span>
                  </div>

                  {/* Viewport: Live Video, Captured Photo, Connecting, or Error State - Shrunk to ~40% height */}
                  <div className="relative w-full h-36 sm:h-40 max-h-[160px] bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                    {capturedPhotoUrl ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-neutral-950">
                        <img
                          src={capturedPhotoUrl}
                          alt="Captured handwritten answer"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-xs text-amber-300 text-[10px] font-bold flex items-center gap-1 border border-amber-400/30 shadow-sm">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Photo Captured — Review Below</span>
                        </div>
                      </div>
                    ) : cameraError && !isCameraActive ? (
                      <div className="text-center p-3 space-y-1.5 max-w-sm mx-auto">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center mx-auto shadow-sm">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <h5 className="text-xs font-black text-white">Camera Notice</h5>
                        <p className="text-[11px] text-neutral-300 leading-snug line-clamp-2">
                          {cameraError}
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => startCamera()}
                            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#111111] text-[11px] font-black transition-all cursor-pointer shadow-sm active:scale-95"
                          >
                            Retry Camera
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold border border-white/20 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                          >
                            <Upload className="w-3 h-3" />
                            Browse
                          </button>
                        </div>
                      </div>
                    ) : isCameraStarting ? (
                      <div className="text-center p-3 space-y-2">
                        <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-[11px] text-neutral-300 font-bold">
                          Connecting to {cameraFacingMode === 'user' ? 'front' : 'back'} camera...
                        </p>
                      </div>
                    ) : isCameraActive ? (
                      <>
                        <video
                          ref={attachVideoRef}
                          playsInline
                          muted
                          autoPlay
                          onLoadedMetadata={(e) => {
                            e.currentTarget.play().catch(() => {});
                          }}
                          className={`w-full h-full object-cover transition-transform duration-200 ${
                            cameraFacingMode === 'user' ? 'scale-x-[-1]' : ''
                          }`}
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 border border-white/15">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Live ({cameraFacingMode === 'user' ? 'Front' : 'Back'})</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-3 space-y-1.5">
                        <Camera className="w-7 h-7 text-white/40 mx-auto" />
                        <p className="text-[11px] text-white/80 font-medium">Camera stream paused</p>
                        <button
                          type="button"
                          onClick={() => startCamera()}
                          className="px-3 py-1 rounded-lg bg-white text-[#111111] text-[11px] font-extrabold hover:bg-neutral-100 transition-all shadow-sm cursor-pointer"
                        >
                          Start Camera
                        </button>
                      </div>
                    )}

                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Proctored
                    </div>
                  </div>

                  {/* Review callout notice when photo is captured - compact */}
                  {capturedPhotoUrl && (
                    <div className="p-2 sm:p-2.5 rounded-lg bg-amber-50 border border-amber-300/80 flex items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <h5 className="text-[11px] font-black text-[#111111]">
                            Review Captured Answer Sheet
                          </h5>
                          <p className="text-[10px] text-[#555555]">
                            Check handwriting clarity. Tap <strong>Retake</strong> or <strong>Use This Photo</strong> below.
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 shrink-0">
                        Unconfirmed
                      </span>
                    </div>
                  )}

                  {/* Camera & Confirmation Controls - visible without scrolling */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      {capturedPhotoUrl ? (
                        <button
                          type="button"
                          onClick={retakePhoto}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black text-[#111111] bg-white border border-neutral-300 hover:border-neutral-500 hover:bg-neutral-50 transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                          <span>Retake</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={switchCamera}
                          disabled={isCameraStarting}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#111111] bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-colors cursor-pointer disabled:opacity-50"
                          title="Switch between front and back camera"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isCameraStarting ? 'animate-spin' : ''}`} />
                          <span>Flip Camera</span>
                        </button>
                      )}

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
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#737373] hover:text-[#111111] hover:bg-white/60 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {capturedPhotoUrl ? 'Browse File' : 'Browse'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {currentQuestionIndex > 0 && (
                        <button
                          onClick={() => handleGoToQuestion(currentQuestionIndex - 1)}
                          className="px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-white text-xs font-bold text-[#111111] cursor-pointer hover:bg-neutral-50"
                        >
                          Previous
                        </button>
                      )}

                      {!capturedPhotoUrl ? (
                        <button
                          type="button"
                          disabled={!isCameraActive || isCameraStarting}
                          onClick={takeSnapshot}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Snap Photo</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={uploadingPhoto}
                          onClick={handleAttachAndProceed}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black transition-all shadow-sm cursor-pointer active:scale-95 disabled:opacity-50 ${
                            isLastQuestion
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-[#111111] hover:bg-black text-[#F4C430]'
                          }`}
                        >
                          {uploadingPhoto ? (
                            <>
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : isLastQuestion ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                              <span>Confirm & Submit Assessment</span>
                              <Send className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                              <span>Confirm & Next Question</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                    : 'All test sections were completed in one continuous session and submitted successfully.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] text-left text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-[#737373]">Student:</span>
                  <span className="font-bold text-[#111111]">{verifiedStudent?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Test Title:</span>
                  <span className="font-bold text-[#111111]">{test.title}</span>
                </div>

                {submissionResult?.mcq_total !== undefined && submissionResult.mcq_total > 0 && (
                  <div className="flex justify-between items-center pt-1 border-t border-[#F0F0F0]">
                    <span className="text-[#737373]">MCQ Auto-Score:</span>
                    <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {submissionResult.mcq_score} / {submissionResult.mcq_total} Marks
                    </span>
                  </div>
                )}

                {submissionResult?.written_total !== undefined && submissionResult.written_total > 0 && (
                  <div className="flex justify-between items-center pt-1 border-t border-[#F0F0F0]">
                    <span className="text-[#737373]">Written Answers:</span>
                    <span className="font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      Cloudflare R2 (Awaiting Teacher Grading)
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1 border-t border-[#F0F0F0]">
                  <span className="text-[#737373]">Total Questions:</span>
                  <span className="font-bold text-[#111111]">
                    {submissionResult?.answers.length || 0} / {test.questions.length}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full h-11 rounded-xl bg-[#111111] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#262626] transition-all shadow-sm cursor-pointer"
              >
                Close & Return to Tests
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
