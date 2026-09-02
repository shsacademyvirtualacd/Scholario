import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Eye,
  RefreshCw,
  Check,
  ChevronRight,
  FileCheck,
  PenTool,
  BookOpen,
  Edit3,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { pullTestQuestionsFromBanks } from '../../../lib/questionBankService';
import {
  generateTestPaperPDF,
  generateStudentCopyPDF,
  generateTeacherCopyPDF,
  getShsLogoDataUrl,
} from '../../../lib/testPdfGenerator';
import { renderLaTeXToText } from '../../../lib/latexRenderer';
import { PdfPreviewViewer } from './PdfPreviewViewer';
import { BOARDS, getGradesForBoard, getStreamsForGrade } from '../../../lib/taxonomy';
import { getSubjectsForStream } from '../../../lib/db';
import { FBISE_GRADE_9_CURRICULUM, FBISE_GRADE_10_CURRICULUM } from '../../../lib/curriculumFBISE9';
import { IELTS_CURRICULUM, isIELTSBoard } from '../../../lib/curriculumIELTS';
import type {
  TestQuestionTypeCombination,
  StoredMCQ,
  StoredShortQuestion,
  StoredLongQuestion,
  GeneratedTestSpecification,
} from '../../../types/questionBank';

interface AdminCreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestCreated: () => void;
}

export const AdminCreateTestModal: React.FC<AdminCreateTestModalProps> = ({
  isOpen,
  onClose,
  onTestCreated,
}) => {
  // Wizard Steps
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields: Curriculum & Metadata
  const [board, setBoard] = useState<string>('fbise');
  const [grade, setGrade] = useState<string>('9');
  const [stream, setStream] = useState<string>('Science');
  const [subject, setSubject] = useState<string>('Physics');
  const [selectedChapter, setSelectedChapter] = useState<string>('All');
  const [title, setTitle] = useState<string>('Class Assessment Test');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [timeAllowed, setTimeAllowed] = useState<number | string>(45);
  const [instructions, setInstructions] = useState<string>(
    'Read all questions carefully. Electronic calculators are permitted where applicable.'
  );

  // Teacher Assignment
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('Admin / Department Head');

  // Question Types Multi-Select & Section Config
  const [includeMCQs, setIncludeMCQs] = useState<boolean>(true);
  const [includeShort, setIncludeShort] = useState<boolean>(true);
  const [includeLong, setIncludeLong] = useState<boolean>(true);

  const [mcqCount, setMcqCount] = useState<number | string>(10);
  const [mcqMarksEach, setMcqMarksEach] = useState<number | string>(1);
  const [shortCount, setShortCount] = useState<number | string>(6);
  const [shortAttemptCount, setShortAttemptCount] = useState<number | string>(5);
  const [shortMarksEach, setShortMarksEach] = useState<number | string>(4);
  const [longCount, setLongCount] = useState<number | string>(3);
  const [longAttemptCount, setLongAttemptCount] = useState<number | string>(2);
  const [longMarksEach, setLongMarksEach] = useState<number | string>(10);

  // Question Source State (Short & Long only; MCQs remain Bank-only)
  const [shortSource, setShortSource] = useState<'bank' | 'manual'>('bank');
  const [longSource, setLongSource] = useState<'bank' | 'manual'>('bank');

  // Manual Question Text Inputs (One per question item based on count)
  const [manualShortQuestions, setManualShortQuestions] = useState<string[]>([]);
  const [manualLongQuestions, setManualLongQuestions] = useState<string[]>([]);

  // Pulled / Configured Questions State
  const [pulledMCQs, setPulledMCQs] = useState<StoredMCQ[]>([]);
  const [pulledShortQuestions, setPulledShortQuestions] = useState<StoredShortQuestion[]>([]);
  const [pulledLongQuestions, setPulledLongQuestions] = useState<StoredLongQuestion[]>([]);
  const [pullingQuestions, setPullingQuestions] = useState<boolean>(false);

  // Inline editing state for Step 3
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // PDF Preview & Publishing State
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isPdfPreviewValid, setIsPdfPreviewValid] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Toggle question type with minimum 1 requirement
  const toggleQuestionType = (type: 'mcq' | 'short' | 'long') => {
    if (type === 'mcq') {
      if (includeMCQs && !includeShort && !includeLong) {
        toast.error('At least one question type must be selected.');
        return;
      }
      setIncludeMCQs(!includeMCQs);
    } else if (type === 'short') {
      if (!includeMCQs && includeShort && !includeLong) {
        toast.error('At least one question type must be selected.');
        return;
      }
      setIncludeShort(!includeShort);
    } else if (type === 'long') {
      if (!includeMCQs && !includeShort && includeLong) {
        toast.error('At least one question type must be selected.');
        return;
      }
      setIncludeLong(!includeLong);
    }
  };

  // Derive Combination Identifier
  const derivedCombination = useMemo<TestQuestionTypeCombination>(() => {
    if (includeMCQs && includeShort && includeLong) return 'all_types';
    if (includeMCQs && includeShort && !includeLong) return 'mcqs_and_short';
    if (includeMCQs && !includeShort && includeLong) return 'mcqs_and_long';
    if (!includeMCQs && includeShort && includeLong) return 'short_and_long';
    if (includeMCQs && !includeShort && !includeLong) return 'mcqs_only';
    if (!includeMCQs && includeShort && !includeLong) return 'short_only';
    if (!includeMCQs && !includeShort && includeLong) return 'long_only';
    return 'all_types';
  }, [includeMCQs, includeShort, includeLong]);

  // Safe number parsing helper
  const safeNum = (val: number | string, fallback: number = 0): number => {
    if (typeof val === 'number') return isNaN(val) ? fallback : val;
    const parsed = parseInt(String(val), 10);
    return isNaN(parsed) ? fallback : parsed;
  };

  // Fetch available teachers from profiles
  useEffect(() => {
    async function loadTeachers() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .in('role', ['teacher', 'admin'])
          .order('full_name');

        if (!error && data && Array.isArray(data) && data.length > 0) {
          const list = (data as any[]).map((t) => ({ id: t.id, name: t.full_name || 'Faculty Member' }));
          setTeachers(list);
          setSelectedTeacherId(list[0].id);
          setSelectedTeacherName(list[0].name);
        }
      } catch (err) {
        console.warn('Teacher fetch notice:', err);
      }
    }
    loadTeachers();
  }, []);

  // Handle manual question input changes
  const handleManualShortChange = (index: number, text: string) => {
    setManualShortQuestions((prev) => {
      const next = [...prev];
      while (next.length <= index) {
        next.push('');
      }
      next[index] = text;
      return next;
    });
  };

  const handleManualLongChange = (index: number, text: string) => {
    setManualLongQuestions((prev) => {
      const next = [...prev];
      while (next.length <= index) {
        next.push('');
      }
      next[index] = text;
      return next;
    });
  };

  // Available grades for selected board
  const availableGrades = useMemo(() => {
    return getGradesForBoard(board);
  }, [board]);

  useEffect(() => {
    if (availableGrades.length > 0 && !availableGrades.some((g) => g.grade === grade)) {
      setGrade(availableGrades[0].grade);
    }
  }, [availableGrades, grade]);

  // Available streams for selected grade and board (strictly scoped per grade taxonomy)
  const availableStreams = useMemo(() => {
    return getStreamsForGrade(grade, board);
  }, [grade, board]);

  // Re-filter or reset stream when availableStreams change
  useEffect(() => {
    if (availableStreams.length > 0) {
      const isCurrentStreamValid = availableStreams.some((s) => s.name === stream);
      if (!isCurrentStreamValid) {
        setStream(availableStreams[0].name);
      }
    }
  }, [availableStreams, stream]);

  // Available subjects based on grade + stream + board taxonomy
  const availableSubjects = useMemo(() => {
    const streamDef = availableStreams.find((s) => s.name === stream);
    if (streamDef && streamDef.subjects && streamDef.subjects.length > 0) {
      return streamDef.subjects;
    }
    const gradeDef = availableGrades.find((g) => g.grade === grade);
    if (gradeDef && gradeDef.commonSubjects && gradeDef.commonSubjects.length > 0) {
      return gradeDef.commonSubjects;
    }
    const dbSubjects = getSubjectsForStream(grade, stream, board);
    if (dbSubjects && dbSubjects.length > 0) return dbSubjects;
    return ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Urdu', 'Computer Science', 'Pakistan Studies'];
  }, [availableStreams, stream, grade, board, availableGrades]);

  // Re-filter or reset subject when availableSubjects change
  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.includes(subject)) {
      setSubject(availableSubjects[0]);
    }
  }, [availableSubjects, subject]);

  // Reset chapter selection when grade or subject changes
  useEffect(() => {
    setSelectedChapter('All');
  }, [grade, subject]);

  // Preload branding assets when modal opens to ensure instantaneous PDF rendering
  useEffect(() => {
    if (isOpen) {
      getShsLogoDataUrl().catch(() => {});
    }
  }, [isOpen]);

  // Compute available chapters
  const availableChapters = useMemo(() => {
    if (isIELTSBoard(board, grade)) {
      const subjData = IELTS_CURRICULUM[subject];
      if (subjData && subjData.chapters && subjData.chapters.length > 0) {
        return [{ id: 'all', number: 0, name: 'All' }, ...subjData.chapters];
      }
      return [{ id: 'all', number: 0, name: 'All' }];
    }

    const curriculum = grade === '10' ? FBISE_GRADE_10_CURRICULUM : FBISE_GRADE_9_CURRICULUM;
    const subjData = curriculum ? curriculum[subject] : undefined;
    if (subjData && subjData.chapters && subjData.chapters.length > 0) {
      return [{ id: 'all', number: 0, name: 'All' }, ...subjData.chapters];
    }
    return [{ id: 'all', number: 0, name: 'All' }];
  }, [board, grade, subject]);

  // Total Marks Calculation
  const totalCalculatedMarks = useMemo(() => {
    let total = 0;
    if (includeMCQs) {
      total += safeNum(mcqCount, 10) * safeNum(mcqMarksEach, 1);
    }
    if (includeShort) {
      total += safeNum(shortAttemptCount, 5) * safeNum(shortMarksEach, 4);
    }
    if (includeLong) {
      total += safeNum(longAttemptCount, 2) * safeNum(longMarksEach, 10);
    }
    return total;
  }, [includeMCQs, includeShort, includeLong, mcqCount, mcqMarksEach, shortAttemptCount, shortMarksEach, longAttemptCount, longMarksEach]);

  // Update default title when subject or chapter changes
  useEffect(() => {
    const chapSuffix = selectedChapter && selectedChapter !== 'All' ? ` - ${selectedChapter}` : '';
    setTitle(`Assessment Test: ${subject}${chapSuffix}`);
  }, [subject, selectedChapter]);

  // Pull Questions From Question Banks & Assemble Manual Questions
  const handlePullQuestions = async () => {
    setPullingQuestions(true);
    try {
      const targetShortCount = includeShort ? safeNum(shortCount, 6) : 0;
      const targetLongCount = includeLong ? safeNum(longCount, 3) : 0;
      const targetMcqCount = includeMCQs ? safeNum(mcqCount, 10) : 0;

      // Count how many short questions need to be pulled from the bank
      let shortCountToPull = 0;
      if (includeShort) {
        if (shortSource === 'bank') {
          shortCountToPull = targetShortCount;
        } else {
          // Manual mode: count empty slots that need bank auto-filling
          let filled = 0;
          for (let i = 0; i < targetShortCount; i++) {
            if (manualShortQuestions[i] && manualShortQuestions[i].trim().length > 0) {
              filled++;
            }
          }
          shortCountToPull = Math.max(0, targetShortCount - filled);
        }
      }

      // Count how many long questions need to be pulled from the bank
      let longCountToPull = 0;
      if (includeLong) {
        if (longSource === 'bank') {
          longCountToPull = targetLongCount;
        } else {
          let filled = 0;
          for (let i = 0; i < targetLongCount; i++) {
            if (manualLongQuestions[i] && manualLongQuestions[i].trim().length > 0) {
              filled++;
            }
          }
          longCountToPull = Math.max(0, targetLongCount - filled);
        }
      }

      // Fetch from bank if any question types need bank retrieval
      let bankRes: { mcqs: StoredMCQ[]; shortQuestions: StoredShortQuestion[]; longQuestions: StoredLongQuestion[] } = {
        mcqs: [],
        shortQuestions: [],
        longQuestions: [],
      };

      if (targetMcqCount > 0 || shortCountToPull > 0 || longCountToPull > 0) {
        bankRes = await pullTestQuestionsFromBanks({
          combination: derivedCombination,
          includeMCQs: targetMcqCount > 0,
          includeShort: shortCountToPull > 0,
          includeLong: longCountToPull > 0,
          board,
          grade,
          subject,
          chapter: selectedChapter,
          mcqCount: targetMcqCount,
          shortCount: shortCountToPull,
          longCount: longCountToPull,
        });
      }

      // Final MCQs list (Bank-only)
      const finalMCQs = includeMCQs ? bankRes.mcqs : [];

      // Final Short Questions list
      let finalShorts: StoredShortQuestion[] = [];
      if (includeShort) {
        if (shortSource === 'bank') {
          finalShorts = bankRes.shortQuestions.slice(0, targetShortCount);
        } else {
          let bankIndex = 0;
          for (let i = 0; i < targetShortCount; i++) {
            const manualText = manualShortQuestions[i]?.trim();
            if (manualText) {
              finalShorts.push({
                id: `manual-sq-${i + 1}`,
                board,
                grade,
                subject,
                chapter: selectedChapter,
                question: manualText,
                marks: safeNum(shortMarksEach, 4),
                verified: true,
                source: 'expert-verified',
              });
            } else if (bankIndex < bankRes.shortQuestions.length) {
              finalShorts.push(bankRes.shortQuestions[bankIndex++]);
            } else {
              const isUrdu = subject.toLowerCase().includes('urdu') || /[\u0600-\u06FF]/.test(selectedChapter);
              finalShorts.push({
                id: `sq-${i + 1}`,
                board,
                grade,
                subject,
                chapter: selectedChapter,
                question: isUrdu
                  ? `${selectedChapter && selectedChapter !== 'All' ? selectedChapter : 'اس سبق'} کے اہم نکات اور بنیادی مفہوم کی وضاحت دو مثالوں سے کریں۔`
                  : `Explain the fundamental principles and characteristics of ${selectedChapter && selectedChapter !== 'All' ? selectedChapter : subject}.`,
                modelAnswer: isUrdu
                  ? 'درسی کتاب کے مطابق متعلقہ سوال کی جامع تعریف اور دو مثالیں۔'
                  : 'Key concepts and comprehensive explanation according to curriculum.',
                marks: safeNum(shortMarksEach, 4),
                verified: true,
                source: 'expert-verified',
              });
            }
          }
        }
      }

      // Final Long Questions list
      let finalLongs: StoredLongQuestion[] = [];
      if (includeLong) {
        if (longSource === 'bank') {
          finalLongs = bankRes.longQuestions.slice(0, targetLongCount);
        } else {
          let bankIndex = 0;
          for (let i = 0; i < targetLongCount; i++) {
            const manualText = manualLongQuestions[i]?.trim();
            if (manualText) {
              finalLongs.push({
                id: `manual-lq-${i + 1}`,
                board,
                grade,
                subject,
                chapter: selectedChapter,
                question: manualText,
                marks: safeNum(longMarksEach, 10),
                verified: true,
                source: 'expert-verified',
              });
            } else if (bankIndex < bankRes.longQuestions.length) {
              finalLongs.push(bankRes.longQuestions[bankIndex++]);
            } else {
              const isUrdu = subject.toLowerCase().includes('urdu') || /[\u0600-\u06FF]/.test(selectedChapter);
              finalLongs.push({
                id: `lq-${i + 1}`,
                board,
                grade,
                subject,
                chapter: selectedChapter,
                question: isUrdu
                  ? `${selectedChapter && selectedChapter !== 'All' ? selectedChapter : 'اس موضوع'} پر تفصیلی اور جامع نوٹ تحریر کریں۔`
                  : `Discuss comprehensively the key laws, mathematical formulations, and practical applications of ${selectedChapter && selectedChapter !== 'All' ? selectedChapter : subject}.`,
                parts: [
                  {
                    label: isUrdu ? '(الف)' : '(a)',
                    text: isUrdu ? 'بنیادی تصورات، تعریف اور پس منظر بیان کریں۔' : 'Explain key definitions and background.',
                    marks: Math.ceil(safeNum(longMarksEach, 10) / 2),
                  },
                  {
                    label: isUrdu ? '(ب)' : '(b)',
                    text: isUrdu ? 'مثالوں اور عملی انطباق کے ساتھ وضاحت کریں۔' : 'Discuss practical applications and examples.',
                    marks: Math.floor(safeNum(longMarksEach, 10) / 2),
                  },
                ],
                marks: safeNum(longMarksEach, 10),
                verified: true,
                source: 'expert-verified',
              });
            }
          }
        }
      }

      setPulledMCQs(finalMCQs);
      setPulledShortQuestions(finalShorts);
      setPulledLongQuestions(finalLongs);

      toast.success(
        `Configured questions: ${includeMCQs ? finalMCQs.length + ' MCQs, ' : ''}${includeShort ? finalShorts.length + ' Short (' + (shortSource === 'manual' ? 'Manual/Mixed' : 'Bank') + '), ' : ''}${includeLong ? finalLongs.length + ' Long (' + (longSource === 'manual' ? 'Manual/Mixed' : 'Bank') + ')' : ''}`
      );
    } catch (err: any) {
      toast.error('Failed to pull questions: ' + (err.message || 'Error'));
    } finally {
      setPullingQuestions(false);
    }
  };

  // Trigger question pull when entering step 3 or changing config
  useEffect(() => {
    if (isOpen && step === 3) {
      handlePullQuestions();
    }
  }, [step, isOpen]);

  // Memoized current test specification for generator and preview
  const currentTestSpec = useMemo<GeneratedTestSpecification>(
    () => ({
      title,
      institutionName: 'SHS Virtual Academy',
      board,
      grade,
      stream,
      subject,
      chapter: selectedChapter,
      teacherId: selectedTeacherId,
      teacherName: selectedTeacherName,
      dueDate,
      timeAllowedMinutes: safeNum(timeAllowed, 45),
      totalMarks: totalCalculatedMarks,
      instructions,
      combination: derivedCombination,
      mcqs: includeMCQs ? pulledMCQs : [],
      shortQuestions: includeShort ? pulledShortQuestions : [],
      longQuestions: includeLong ? pulledLongQuestions : [],
      mcqMarksEach: safeNum(mcqMarksEach, 1),
      shortMarksEach: safeNum(shortMarksEach, 4),
      shortAttemptCount: safeNum(shortAttemptCount, 5),
      longMarksEach: safeNum(longMarksEach, 10),
      longAttemptCount: safeNum(longAttemptCount, 2),
    }),
    [
      title,
      board,
      grade,
      stream,
      subject,
      selectedChapter,
      selectedTeacherId,
      selectedTeacherName,
      dueDate,
      timeAllowed,
      totalCalculatedMarks,
      instructions,
      derivedCombination,
      includeMCQs,
      pulledMCQs,
      includeShort,
      pulledShortQuestions,
      includeLong,
      pulledLongQuestions,
      mcqMarksEach,
      shortMarksEach,
      shortAttemptCount,
      longMarksEach,
      longAttemptCount,
    ]
  );

  // Generate Branded PDF Preview with generous timeout and validation
  const handleGeneratePdfPreview = async () => {
    setGeneratingPdf(true);
    setPdfError(null);
    setIsPdfPreviewValid(false);

    let timeoutId: any;
    try {
      // 40-second timeout to allow full multi-page high-DPI rendering even on initial cold runs
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('PDF preview compilation timed out. Please try again.')),
          40000
        );
      });

      const result = await Promise.race([generateTestPaperPDF(currentTestSpec), timeoutPromise]);
      clearTimeout(timeoutId);

      if (!result.blob || result.blob.size === 0) {
        throw new Error('Compiled PDF is empty or invalid.');
      }

      setGeneratedPdfBlob(result.blob);
      setPreviewPdfUrl(result.dataUrl);
      setPdfArrayBuffer(result.arrayBuffer);
      setIsPdfPreviewValid(true);
      toast.success('Test Paper PDF generated with official SHS & Scholario branding!');
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('[PDF Gen Error]:', err);
      const errMsg = err?.message || 'Could not compile test paper layout';
      setPdfError(errMsg);
      setIsPdfPreviewValid(false);
      toast.error('Failed to generate PDF preview: ' + errMsg);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Step navigation to Step 4 with validation
  const goToPreviewStep = async () => {
    const missingSections: string[] = [];
    if (includeMCQs && pulledMCQs.length === 0) missingSections.push('Multiple Choice Questions (MCQs)');
    if (includeShort && pulledShortQuestions.length === 0) missingSections.push('Short Answer Questions');
    if (includeLong && pulledLongQuestions.length === 0) missingSections.push('Long / Detailed Questions');

    if (missingSections.length > 0) {
      toast.error(
        `Cannot generate test paper: No questions available for ${missingSections.join(
          ', '
        )}. Please switch to "Write Manually" or choose another chapter/full syllabus.`
      );
      return;
    }

    setStep(4);
    await handleGeneratePdfPreview();
  };

  // Ensure PDF is generated if Step 4 is opened directly
  useEffect(() => {
    if (step === 4 && !generatedPdfBlob && !generatingPdf && !pdfError) {
      handleGeneratePdfPreview();
    }
  }, [step, generatedPdfBlob, generatingPdf, pdfError]);

  // Convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Submit and Publish Test via Admin Endpoint (Sanitizes student copy & secures teacher scheme)
  const handlePublishTest = async () => {
    setIsSubmitting(true);
    try {
      // 1. ALWAYS generate the sanitized Student Copy for the student in-app test payload
      // This strictly excludes the Official Answer Key and Teacher Marking Scheme from student access
      toast.loading('Compiling student test paper...', { id: 'publish-toast' });
      const studentPdfResult = await generateStudentCopyPDF(currentTestSpec);
      const pdfBase64 = await blobToBase64(studentPdfResult.blob);

      // Get user auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication session not found. Please log in again.');
      }

      toast.loading('Publishing test paper to class assessments...', { id: 'publish-toast' });
      const response = await fetch('/api/admin/tests/create-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title,
          instructions,
          board,
          subject,
          grade,
          stream,
          total_marks: totalCalculatedMarks,
          due_date: dueDate,
          teacher_id: selectedTeacherId,
          teacher_name: selectedTeacherName,
          combination: derivedCombination,
          pdfBase64,
          filename: `SHS_Test_${subject}_Grade${grade}.pdf`,
        }),
      });

      if (!response.ok) {
        let errMessage = `Server responded with HTTP ${response.status} ${response.statusText || ''}`.trim();
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const errJson: any = await response.json();
            if (errJson?.error) {
              errMessage = errJson.error;
            } else if (errJson?.message) {
              errMessage = errJson.message;
            }
          } else {
            const errText = await response.text();
            if (errText && errText.trim().length > 0 && errText.length < 300) {
              errMessage = errText.trim();
            }
          }
        } catch {
          // Keep default status message
        }
        throw new Error(errMessage);
      }

      const result: any = await response.json();
      const createdTestId = result?.test?.id || result?.testId;

      // 2. If test was created and has answer scheme, upload confidential teacher scheme to secured endpoint
      if (createdTestId && (currentTestSpec.mcqs.length > 0 || currentTestSpec.shortQuestions.some(q => q.modelAnswer))) {
        try {
          toast.loading('Securing teacher marking scheme & answer key...', { id: 'publish-toast' });
          const teacherPdfResult = await generateTeacherCopyPDF(currentTestSpec);
          const teacherFormData = new FormData();
          teacherFormData.append('file', teacherPdfResult.blob, `SHS_Answer_Key_${subject}_Grade${grade}.pdf`);
          
          await fetch(`/api/tests/answer-key/upload/${createdTestId}`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            body: teacherFormData,
          });
        } catch (schemeErr) {
          console.warn('[Teacher Answer Key Upload Note]:', schemeErr);
        }
      }

      toast.dismiss('publish-toast');
      toast.success('Test Paper successfully created, branded, and published to Class Tests!');
      onTestCreated();
      onClose();
    } catch (err: any) {
      toast.dismiss('publish-toast');
      console.error('[Create Test Error]:', err);
      const detailedMessage = err?.message || 'Could not publish test';
      toast.error(`Test Creation Error: ${detailedMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-[#E5E5E5] flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E5E5E5] bg-[#FAFAFA] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-[#F4C430] flex items-center justify-center shadow-xs">
              <FileCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#111111]">Create Class Test Paper</h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#111111] text-[#F4C430]">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-[#737373] mt-0.5">
                Generate authentic test papers from Question Bank with official SHS Academy branding
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#737373] hover:text-[#111111] hover:bg-[#E5E5E5] transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Progress Indicator */}
        <div className="px-6 py-3 border-b border-[#F0F0F0] bg-white flex items-center justify-between shrink-0">
          {[
            { num: 1, label: 'Scope & Syllabus' },
            { num: 2, label: 'Question Types' },
            { num: 3, label: 'Bank Questions' },
            { num: 4, label: 'Branded Preview' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => {
                if (s.num < step || (s.num === 3 && step >= 2) || (s.num === 4 && step >= 3)) {
                  if (s.num === 4) goToPreviewStep();
                  else setStep(s.num as any);
                }
              }}
              className={`flex items-center gap-2 text-xs font-black transition-all cursor-pointer ${
                step === s.num
                  ? 'text-[#111111]'
                  : step > s.num
                  ? 'text-emerald-700'
                  : 'text-[#A3A3A3]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                  step === s.num
                    ? 'bg-[#111111] text-[#F4C430]'
                    : step > s.num
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-[#F0F0F0] text-[#737373]'
                }`}
              >
                {step > s.num ? <Check size={12} strokeWidth={3} /> : s.num}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: SCOPE & CURRICULUM */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Board */}
                <div>
                  <label className="block text-xs font-extrabold text-[#111111] mb-1.5">Board</label>
                  <select
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-bold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                  >
                    {BOARDS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grade */}
                <div>
                  <label className="block text-xs font-extrabold text-[#111111] mb-1.5">Class / Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-bold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                  >
                    {availableGrades.map((g) => (
                      <option key={g.grade} value={g.grade}>
                        Grade {g.grade} ({g.displayName} {board === 'sindh' ? 'Sindh' : board === 'ielts' ? 'IELTS' : 'FBISE'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stream */}
                <div>
                  <label className="block text-xs font-extrabold text-[#111111] mb-1.5">Stream / Group</label>
                  <select
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-bold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                  >
                    {availableStreams.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Subject */}
                <div>
                  <label className="block text-xs font-extrabold text-[#111111] mb-1.5">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-bold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                  >
                    {availableSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chapter / Syllabus Scope */}
                <div>
                  <label className="block text-xs font-extrabold text-[#111111] mb-1.5">
                    Chapter / Scope
                  </label>
                  <select
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-bold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                  >
                    {availableChapters.map((ch) => (
                      <option key={ch.name} value={ch.name}>
                        {ch.name === 'All' ? 'All Chapters (Full Syllabus)' : `Ch ${ch.number}: ${ch.name}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title & Teacher Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#111111] mb-1.5">Test Paper Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Chapter Assessment Test 1"
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-bold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#111111] mb-1.5">Assign Teacher</label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => {
                      setSelectedTeacherId(e.target.value);
                      const t = teachers.find((x) => x.id === e.target.value);
                      if (t) setSelectedTeacherName(t.name);
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-bold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#111111] mb-1.5">Due / Exam Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-bold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#111111] mb-1.5">Time Allowed (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="360"
                    step="5"
                    value={timeAllowed}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setTimeAllowed('');
                      } else {
                        const num = parseInt(val, 10);
                        setTimeAllowed(isNaN(num) ? '' : num);
                      }
                    }}
                    onBlur={() => {
                      const num = safeNum(timeAllowed, 45);
                      if (num < 1) {
                        setTimeAllowed(15);
                      } else if (num > 360) {
                        setTimeAllowed(360);
                      } else {
                        setTimeAllowed(num);
                      }
                    }}
                    placeholder="45"
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-bold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                  />
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-extrabold text-[#111111] mb-1.5">
                  Exam Paper Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Attempt all questions. Use blue or black ballpoint pen only."
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                />
              </div>
            </div>
          )}

          {/* STEP 2: QUESTION TYPE SELECTION (MULTI-SELECT) */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-black text-[#111111] mb-1">
                  Select Question Types (Multi-Select)
                </label>
                <p className="text-xs text-[#737373]">
                  Choose any combination of question types for this test paper. Toggle each section independently.
                </p>
              </div>

              {/* Multi-Select Question Type Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* MCQs Toggle Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleQuestionType('mcq')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleQuestionType('mcq'); }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    includeMCQs
                      ? 'border-[#111111] bg-[#111111] text-white shadow-md'
                      : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#111111] hover:bg-[#F5F5F5]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-md ${
                        includeMCQs
                          ? 'bg-[#F4C430] text-[#111111]'
                          : 'bg-[#E5E5E5] text-[#525252]'
                      }`}
                    >
                      Objective
                    </span>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        includeMCQs
                          ? 'border-[#F4C430] bg-[#F4C430] text-[#111111]'
                          : 'border-[#A3A3A3] bg-white'
                      }`}
                    >
                      {includeMCQs && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm font-black ${includeMCQs ? 'text-white' : 'text-[#111111]'}`}>
                      Multiple Choice (MCQs)
                    </div>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        includeMCQs ? 'text-white/80' : 'text-[#737373]'
                      }`}
                    >
                      Objective questions with 4 answer choices and automatic bubble sheet.
                    </p>
                  </div>
                  <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[11px]">
                    <span className={includeMCQs ? 'text-[#F4C430] font-bold' : 'text-[#737373]'}>
                      {includeMCQs ? 'Included in paper' : 'Click to include'}
                    </span>
                    {includeMCQs && (
                      <span className="font-bold text-white/90">
                        {safeNum(mcqCount, 10)} Qs ({safeNum(mcqCount, 10) * safeNum(mcqMarksEach, 1)}M)
                      </span>
                    )}
                  </div>
                </div>

                {/* Short Questions Toggle Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleQuestionType('short')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleQuestionType('short'); }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    includeShort
                      ? 'border-[#111111] bg-[#111111] text-white shadow-md'
                      : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#111111] hover:bg-[#F5F5F5]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-md ${
                        includeShort
                          ? 'bg-[#F4C430] text-[#111111]'
                          : 'bg-[#E5E5E5] text-[#525252]'
                      }`}
                    >
                      Subjective
                    </span>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        includeShort
                          ? 'border-[#F4C430] bg-[#F4C430] text-[#111111]'
                          : 'border-[#A3A3A3] bg-white'
                      }`}
                    >
                      {includeShort && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm font-black ${includeShort ? 'text-white' : 'text-[#111111]'}`}>
                      Short Answer Questions
                    </div>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        includeShort ? 'text-white/80' : 'text-[#737373]'
                      }`}
                    >
                      Conceptual & analytical questions with optional choice (e.g. attempt 5 of 6).
                    </p>
                  </div>
                  <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[11px]">
                    <span className={includeShort ? 'text-[#F4C430] font-bold' : 'text-[#737373]'}>
                      {includeShort ? 'Included in paper' : 'Click to include'}
                    </span>
                    {includeShort && (
                      <span className="font-bold text-white/90">
                        {safeNum(shortCount, 6)} Qs ({safeNum(shortAttemptCount, 5) * safeNum(shortMarksEach, 4)}M)
                      </span>
                    )}
                  </div>
                </div>

                {/* Long Questions Toggle Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleQuestionType('long')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleQuestionType('long'); }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    includeLong
                      ? 'border-[#111111] bg-[#111111] text-white shadow-md'
                      : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#111111] hover:bg-[#F5F5F5]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-md ${
                        includeLong
                          ? 'bg-[#F4C430] text-[#111111]'
                          : 'bg-[#E5E5E5] text-[#525252]'
                      }`}
                    >
                      Comprehensive
                    </span>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        includeLong
                          ? 'border-[#F4C430] bg-[#F4C430] text-[#111111]'
                          : 'border-[#A3A3A3] bg-white'
                      }`}
                    >
                      {includeLong && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm font-black ${includeLong ? 'text-white' : 'text-[#111111]'}`}>
                      Long / Detailed Questions
                    </div>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        includeLong ? 'text-white/80' : 'text-[#737373]'
                      }`}
                    >
                      Comprehensive theoretical derivations, extensive answers, and multi-part questions.
                    </p>
                  </div>
                  <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[11px]">
                    <span className={includeLong ? 'text-[#F4C430] font-bold' : 'text-[#737373]'}>
                      {includeLong ? 'Included in paper' : 'Click to include'}
                    </span>
                    {includeLong && (
                      <span className="font-bold text-white/90">
                        {safeNum(longCount, 3)} Qs ({safeNum(longAttemptCount, 2) * safeNum(longMarksEach, 10)}M)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!includeMCQs && !includeShort && !includeLong && (
                <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold text-center">
                  Please select at least one question type above to continue.
                </div>
              )}

              {/* Section Configuration based on selection */}
              {(includeMCQs || includeShort || includeLong) && (
                <div className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-[#111111] tracking-wider">
                      Section Question Counts & Marks
                    </h3>
                    <span className="text-xs font-black px-3 py-1 rounded-lg bg-[#111111] text-[#F4C430]">
                      Total Marks: {totalCalculatedMarks}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* MCQs config */}
                    {includeMCQs && (
                      <div className="p-3 bg-white rounded-xl border border-[#E5E5E5] space-y-2">
                        <div className="text-xs font-extrabold text-[#111111] flex items-center justify-between">
                          <span>MCQs Section</span>
                          <span className="text-emerald-700 text-[11px] font-bold">
                            {safeNum(mcqCount, 10) * safeNum(mcqMarksEach, 1)} M
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-[#737373] w-20">Total MCQs:</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={mcqCount}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMcqCount(val === '' ? '' : (parseInt(val, 10) || ''));
                            }}
                            onBlur={() => {
                              const num = safeNum(mcqCount, 10);
                              setMcqCount(Math.max(1, Math.min(50, num)));
                            }}
                            className="w-full h-8 px-2 rounded-lg border border-[#E5E5E5] text-xs font-bold"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-[#737373] w-20">Marks each:</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={mcqMarksEach}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMcqMarksEach(val === '' ? '' : (parseInt(val, 10) || ''));
                            }}
                            onBlur={() => {
                              const num = safeNum(mcqMarksEach, 1);
                              setMcqMarksEach(Math.max(1, Math.min(10, num)));
                            }}
                            className="w-full h-8 px-2 rounded-lg border border-[#E5E5E5] text-xs font-bold"
                          />
                        </div>
                      </div>
                    )}

                    {/* Short questions config */}
                    {includeShort && (
                      <div className="p-4 bg-white rounded-xl border border-[#E5E5E5] space-y-3 sm:col-span-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F0F0F0]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-[#111111]">Short Answer Questions (Subjective)</span>
                            <span className="text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                              {safeNum(shortAttemptCount, 5) * safeNum(shortMarksEach, 4)} Marks Total
                            </span>
                          </div>

                          {/* Source Toggle */}
                          <div className="flex items-center p-0.5 bg-[#F0F0F0] rounded-lg border border-[#E0E0E0] self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={() => setShortSource('bank')}
                              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                shortSource === 'bank'
                                  ? 'bg-white text-[#111111] shadow-xs'
                                  : 'text-[#737373] hover:text-[#111111]'
                              }`}
                            >
                              <BookOpen size={12} />
                              <span>From Question Bank</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShortSource('manual')}
                              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                shortSource === 'manual'
                                  ? 'bg-[#111111] text-[#F4C430] shadow-xs'
                                  : 'text-[#737373] hover:text-[#111111]'
                              }`}
                            >
                              <PenTool size={12} />
                              <span>Write Manually</span>
                            </button>
                          </div>
                        </div>

                        {/* Numeric Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-[#737373] w-24">Total Questions:</label>
                            <input
                              type="number"
                              min="1"
                              max="30"
                              value={shortCount}
                              onChange={(e) => {
                                const val = e.target.value;
                                setShortCount(val === '' ? '' : (parseInt(val, 10) || ''));
                              }}
                              onBlur={() => {
                                const num = safeNum(shortCount, 6);
                                const clamped = Math.max(1, Math.min(30, num));
                                setShortCount(clamped);
                                if (safeNum(shortAttemptCount, 5) > clamped) {
                                  setShortAttemptCount(clamped);
                                }
                              }}
                              className="w-full h-8 px-2 rounded-lg border border-[#E5E5E5] text-xs font-bold"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-[#737373] w-24">To Attempt:</label>
                            <input
                              type="number"
                              min="1"
                              max={safeNum(shortCount, 6)}
                              value={shortAttemptCount}
                              onChange={(e) => {
                                const val = e.target.value;
                                setShortAttemptCount(val === '' ? '' : (parseInt(val, 10) || ''));
                              }}
                              onBlur={() => {
                                const maxAllowed = safeNum(shortCount, 6);
                                const num = safeNum(shortAttemptCount, Math.min(5, maxAllowed));
                                setShortAttemptCount(Math.max(1, Math.min(maxAllowed, num)));
                              }}
                              className="w-full h-8 px-2 rounded-lg border border-[#E5E5E5] text-xs font-bold"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-[#737373] w-24">Marks each:</label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={shortMarksEach}
                              onChange={(e) => {
                                const val = e.target.value;
                                setShortMarksEach(val === '' ? '' : (parseInt(val, 10) || ''));
                              }}
                              onBlur={() => {
                                const num = safeNum(shortMarksEach, 4);
                                setShortMarksEach(Math.max(1, Math.min(20, num)));
                              }}
                              className="w-full h-8 px-2 rounded-lg border border-[#E5E5E5] text-xs font-bold"
                            />
                          </div>
                        </div>

                        {/* Manual Question Input Area for Short Questions */}
                        {shortSource === 'manual' && (
                          <div className="mt-3 pt-3 border-t border-[#F0F0F0] space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-extrabold text-[#111111] flex items-center gap-1.5">
                                <PenTool size={13} className="text-[#111111]" />
                                <span>Manual Short Questions Entry ({safeNum(shortCount, 6)} total fields)</span>
                              </div>
                              <span className="text-[10px] text-[#737373]">
                                Leave any field blank to automatically pull from Question Bank
                              </span>
                            </div>

                            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                              {Array.from({ length: safeNum(shortCount, 6) }).map((_, idx) => {
                                const roman = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv'][idx] || `${idx + 1}`;
                                const isFilled = Boolean(manualShortQuestions[idx]?.trim());
                                return (
                                  <div key={idx} className="p-2.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-[#111111]">
                                        Question Part ({roman})
                                      </span>
                                      <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                          isFilled
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-[#E5E5E5] text-[#737373]'
                                        }`}
                                      >
                                        {isFilled ? '✍️ Manual Entry' : '📚 Auto-fill from Bank'}
                                      </span>
                                    </div>
                                    <textarea
                                      rows={2}
                                      value={manualShortQuestions[idx] || ''}
                                      onChange={(e) => handleManualShortChange(idx, e.target.value)}
                                      placeholder={`Type Short Question (${roman}) here... (e.g. Define uniform acceleration and state its SI unit.)`}
                                      className="w-full p-2 text-xs rounded-lg border border-[#E0E0E0] bg-white text-[#111111] focus:outline-hidden focus:border-[#111111] resize-y"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Long questions config */}
                    {includeLong && (
                      <div className="p-4 bg-white rounded-xl border border-[#E5E5E5] space-y-3 sm:col-span-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F0F0F0]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-[#111111]">Long / Detailed Questions (Comprehensive)</span>
                            <span className="text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                              {safeNum(longAttemptCount, 2) * safeNum(longMarksEach, 10)} Marks Total
                            </span>
                          </div>

                          {/* Source Toggle */}
                          <div className="flex items-center p-0.5 bg-[#F0F0F0] rounded-lg border border-[#E0E0E0] self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={() => setLongSource('bank')}
                              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                longSource === 'bank'
                                  ? 'bg-white text-[#111111] shadow-xs'
                                  : 'text-[#737373] hover:text-[#111111]'
                              }`}
                            >
                              <BookOpen size={12} />
                              <span>From Question Bank</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setLongSource('manual')}
                              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                longSource === 'manual'
                                  ? 'bg-[#111111] text-[#F4C430] shadow-xs'
                                  : 'text-[#737373] hover:text-[#111111]'
                              }`}
                            >
                              <PenTool size={12} />
                              <span>Write Manually</span>
                            </button>
                          </div>
                        </div>

                        {/* Numeric Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-[#737373] w-24">Total Questions:</label>
                            <input
                              type="number"
                              min="1"
                              max="15"
                              value={longCount}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLongCount(val === '' ? '' : (parseInt(val, 10) || ''));
                              }}
                              onBlur={() => {
                                const num = safeNum(longCount, 3);
                                const clamped = Math.max(1, Math.min(15, num));
                                setLongCount(clamped);
                                if (safeNum(longAttemptCount, 2) > clamped) {
                                  setLongAttemptCount(clamped);
                                }
                              }}
                              className="w-full h-8 px-2 rounded-lg border border-[#E5E5E5] text-xs font-bold"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-[#737373] w-24">To Attempt:</label>
                            <input
                              type="number"
                              min="1"
                              max={safeNum(longCount, 3)}
                              value={longAttemptCount}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLongAttemptCount(val === '' ? '' : (parseInt(val, 10) || ''));
                              }}
                              onBlur={() => {
                                const maxAllowed = safeNum(longCount, 3);
                                const num = safeNum(longAttemptCount, Math.min(2, maxAllowed));
                                setLongAttemptCount(Math.max(1, Math.min(maxAllowed, num)));
                              }}
                              className="w-full h-8 px-2 rounded-lg border border-[#E5E5E5] text-xs font-bold"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-[#737373] w-24">Marks each:</label>
                            <input
                              type="number"
                              min="1"
                              max="30"
                              value={longMarksEach}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLongMarksEach(val === '' ? '' : (parseInt(val, 10) || ''));
                              }}
                              onBlur={() => {
                                const num = safeNum(longMarksEach, 10);
                                setLongMarksEach(Math.max(1, Math.min(30, num)));
                              }}
                              className="w-full h-8 px-2 rounded-lg border border-[#E5E5E5] text-xs font-bold"
                            />
                          </div>
                        </div>

                        {/* Manual Question Input Area for Long Questions */}
                        {longSource === 'manual' && (
                          <div className="mt-3 pt-3 border-t border-[#F0F0F0] space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-extrabold text-[#111111] flex items-center gap-1.5">
                                <PenTool size={13} className="text-[#111111]" />
                                <span>Manual Long Questions Entry ({safeNum(longCount, 3)} total fields)</span>
                              </div>
                              <span className="text-[10px] text-[#737373]">
                                Leave any field blank to automatically pull from Question Bank
                              </span>
                            </div>

                            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                              {Array.from({ length: safeNum(longCount, 3) }).map((_, idx) => {
                                const isFilled = Boolean(manualLongQuestions[idx]?.trim());
                                return (
                                  <div key={idx} className="p-2.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-[#111111]">
                                        Long Question {idx + 1}
                                      </span>
                                      <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                          isFilled
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-[#E5E5E5] text-[#737373]'
                                        }`}
                                      >
                                        {isFilled ? '✍️ Manual Entry' : '📚 Auto-fill from Bank'}
                                      </span>
                                    </div>
                                    <textarea
                                      rows={3}
                                      value={manualLongQuestions[idx] || ''}
                                      onChange={(e) => handleManualLongChange(idx, e.target.value)}
                                      placeholder={`Type detailed Long Question ${idx + 1} here... (Include theory, sub-parts (a)/(b), or mathematical proofs)`}
                                      className="w-full p-2 text-xs rounded-lg border border-[#E0E0E0] bg-white text-[#111111] focus:outline-hidden focus:border-[#111111] resize-y"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: QUESTIONS REVIEW & REFINEMENT */}
          {step === 3 && (() => {
            let sectionIdx = 0;
            const letters = ['A', 'B', 'C', 'D'];
            const mcqSec = includeMCQs ? letters[sectionIdx++] : null;
            const shortSec = includeShort ? letters[sectionIdx++] : null;
            const longSec = includeLong ? letters[sectionIdx++] : null;

            const shortQPrefix = includeMCQs ? 'Q2' : 'Q1';
            const longQStart = (includeMCQs ? 1 : 0) + (includeShort ? 1 : 0) + 1;

            return (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0F0F0]">
                  <div>
                    <h3 className="text-sm font-black text-[#111111]">
                      Review & Refine Test Paper Questions
                    </h3>
                    <p className="text-xs text-[#737373]">
                      Review questions configured for Grade {grade} {subject} ({selectedChapter}). You can edit any question inline before generating the PDF.
                    </p>
                  </div>
                  <button
                    onClick={handlePullQuestions}
                    disabled={pullingQuestions}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] hover:bg-[#F5F5F5] text-xs font-bold text-[#111111] transition-all cursor-pointer shrink-0"
                  >
                    <RefreshCw size={13} className={pullingQuestions ? 'animate-spin' : ''} />
                    <span>Re-shuffle Bank Questions</span>
                  </button>
                </div>

                {/* Question Availability / Empty Warning Banner */}
                {(() => {
                  const emptySections: string[] = [];
                  if (includeMCQs && pulledMCQs.length === 0) emptySections.push('MCQs');
                  if (includeShort && pulledShortQuestions.length === 0) emptySections.push('Short Questions');
                  if (includeLong && pulledLongQuestions.length === 0) emptySections.push('Long Questions');

                  if (emptySections.length === 0) return null;

                  return (
                    <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 space-y-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                        <div className="space-y-1">
                          <h4 className="text-xs font-black">
                            Question Bank Notice: Insufficient Questions Found for {emptySections.join(', ')}
                          </h4>
                          <p className="text-[11px] text-amber-800 leading-relaxed">
                            The question bank currently does not have enough pre-loaded questions for <strong>Grade {grade} {subject}</strong> with scope <strong>{selectedChapter}</strong>. To proceed without generating a blank test paper, you can write questions manually or broaden the syllabus scope.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200">
                        {(includeShort || includeLong) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (includeShort) setShortSource('manual');
                              if (includeLong) setLongSource('manual');
                              setStep(2);
                              toast.info('Switched to "Write Manually" mode. Please type your questions in Step 2.');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111111] text-[#F4C430] text-xs font-bold hover:bg-black transition-all cursor-pointer shadow-xs"
                          >
                            <PenTool size={13} />
                            <span>Switch to "Write Manually" in Step 2</span>
                          </button>
                        )}

                        {selectedChapter !== 'All' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedChapter('All');
                              toast.info('Expanded scope to All Chapters. Refreshing question bank...');
                              setTimeout(() => handlePullQuestions(), 100);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold transition-all cursor-pointer shadow-xs"
                          >
                            <BookOpen size={13} />
                            <span>Expand Scope to Full Syllabus (All Chapters)</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E0E0E0] text-[#111111] hover:bg-[#F5F5F5] text-xs font-bold transition-all cursor-pointer shadow-xs"
                        >
                          <span>Adjust Counts / Question Types</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {pullingQuestions ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-8 h-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mx-auto" />
                    <div className="text-xs font-bold text-[#111111]">Configuring and pulling questions...</div>
                  </div>
                ) : (
                  <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-1">
                    {/* MCQs Preview */}
                    {includeMCQs && pulledMCQs.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-black uppercase text-[#111111] flex items-center justify-between bg-[#F5F5F5] p-2 rounded-lg">
                          <span>Section {mcqSec}: {pulledMCQs.length} MCQs ({pulledMCQs.length * safeNum(mcqMarksEach, 1)} Marks)</span>
                          <span className="text-[10px] font-bold text-[#737373]">📚 Bank • All Compulsory</span>
                        </div>
                        <div className="space-y-2">
                          {pulledMCQs.map((mcq, idx) => (
                            <div key={mcq.id || idx} className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E5E5] text-xs">
                              <div className="font-extrabold text-[#111111]">
                                Q1.({idx + 1}) {renderLaTeXToText(mcq.question)}
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-[#525252]">
                                <div>(A) {renderLaTeXToText(mcq.options.A)}</div>
                                <div>(B) {renderLaTeXToText(mcq.options.B)}</div>
                                <div>(C) {renderLaTeXToText(mcq.options.C)}</div>
                                <div>(D) {renderLaTeXToText(mcq.options.D)}</div>
                              </div>
                              <div className="mt-1.5 text-[10px] text-emerald-800 font-bold">
                                Correct: ({mcq.correctAnswer})
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Short Questions Preview */}
                    {includeShort && pulledShortQuestions.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-black uppercase text-[#111111] flex items-center justify-between bg-[#F5F5F5] p-2 rounded-lg">
                          <span>Section {shortSec}: {pulledShortQuestions.length} Short Questions (Attempt {safeNum(shortAttemptCount, 5)} × {safeNum(shortMarksEach, 4)} = {safeNum(shortAttemptCount, 5) * safeNum(shortMarksEach, 4)} Marks)</span>
                          <span className="text-[10px] font-bold text-emerald-700">
                            {shortSource === 'manual' ? '✍️ Manual / Mixed' : '📚 Question Bank'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {pulledShortQuestions.map((sq, idx) => {
                            const roman = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'][idx] || `${idx + 1}`;
                            const isEditing = editingQuestionId === (sq.id || `sq-${idx}`);
                            const isManual = sq.id?.startsWith('manual-');

                            return (
                              <div key={sq.id || idx} className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E5E5] text-xs space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-[#111111]">
                                      {shortQPrefix}.({roman})
                                    </span>
                                    <span
                                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                        isManual
                                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                                      }`}
                                    >
                                      {isManual ? '✍️ Manual' : '📚 Bank'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-[#737373] shrink-0">
                                      [{sq.marks || safeNum(shortMarksEach, 4)} Marks]
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setEditingQuestionId(isEditing ? null : (sq.id || `sq-${idx}`))}
                                      className="p-1 text-[#737373] hover:text-[#111111] hover:bg-white rounded transition-all cursor-pointer"
                                      title="Edit question text"
                                    >
                                      <Edit3 size={12} />
                                    </button>
                                  </div>
                                </div>

                                {isEditing ? (
                                  <div className="space-y-2 pt-1">
                                    <textarea
                                      rows={2}
                                      value={sq.question}
                                      onChange={(e) => {
                                        const newText = e.target.value;
                                        setPulledShortQuestions((prev) =>
                                          prev.map((item, i) => (i === idx ? { ...item, question: newText } : item))
                                        );
                                      }}
                                      className="w-full p-2 text-xs rounded-lg border border-[#111111] bg-white text-[#111111]"
                                    />
                                    <div className="flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => setEditingQuestionId(null)}
                                        className="px-2.5 py-1 bg-[#111111] text-white text-[10px] font-bold rounded-md"
                                      >
                                        Done Editing
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="font-medium text-[#111111] pl-4">
                                    {renderLaTeXToText(sq.question)}
                                  </div>
                                )}

                                {sq.modelAnswer && !isEditing && (
                                  <div className="mt-2 text-[11px] text-[#525252] bg-white p-2 rounded-lg border border-[#F0F0F0]">
                                    <strong>Key Answer:</strong> {renderLaTeXToText(sq.modelAnswer)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Long Questions Preview */}
                    {includeLong && pulledLongQuestions.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-black uppercase text-[#111111] flex items-center justify-between bg-[#F5F5F5] p-2 rounded-lg">
                          <span>Section {longSec}: {pulledLongQuestions.length} Long Questions (Attempt {safeNum(longAttemptCount, 2)} × {safeNum(longMarksEach, 10)} = {safeNum(longAttemptCount, 2) * safeNum(longMarksEach, 10)} Marks)</span>
                          <span className="text-[10px] font-bold text-emerald-700">
                            {longSource === 'manual' ? '✍️ Manual / Mixed' : '📚 Question Bank'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {pulledLongQuestions.map((lq, idx) => {
                            const isEditing = editingQuestionId === (lq.id || `lq-${idx}`);
                            const isManual = lq.id?.startsWith('manual-');

                            return (
                              <div key={lq.id || idx} className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E5E5] text-xs space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-[#111111]">
                                      Q{longQStart + idx}.
                                    </span>
                                    <span
                                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                        isManual
                                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                                      }`}
                                    >
                                      {isManual ? '✍️ Manual' : '📚 Bank'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-[#737373] shrink-0">
                                      [{lq.marks || safeNum(longMarksEach, 10)} Marks]
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setEditingQuestionId(isEditing ? null : (lq.id || `lq-${idx}`))}
                                      className="p-1 text-[#737373] hover:text-[#111111] hover:bg-white rounded transition-all cursor-pointer"
                                      title="Edit question text"
                                    >
                                      <Edit3 size={12} />
                                    </button>
                                  </div>
                                </div>

                                {isEditing ? (
                                  <div className="space-y-2 pt-1">
                                    <textarea
                                      rows={3}
                                      value={lq.question}
                                      onChange={(e) => {
                                        const newText = e.target.value;
                                        setPulledLongQuestions((prev) =>
                                          prev.map((item, i) => (i === idx ? { ...item, question: newText } : item))
                                        );
                                      }}
                                      className="w-full p-2 text-xs rounded-lg border border-[#111111] bg-white text-[#111111]"
                                    />
                                    <div className="flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => setEditingQuestionId(null)}
                                        className="px-2.5 py-1 bg-[#111111] text-white text-[10px] font-bold rounded-md"
                                      >
                                        Done Editing
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="font-medium text-[#111111] pl-4">
                                    {renderLaTeXToText(lq.question)}
                                  </div>
                                )}

                                {lq.parts && lq.parts.length > 0 && !isEditing && (
                                  <div className="space-y-1 pl-6">
                                    {lq.parts.map((p, pIdx) => (
                                      <div key={pIdx} className="text-[11px] text-[#525252] flex justify-between">
                                        <span>{p.label} {renderLaTeXToText(p.text)}</span>
                                        <span className="text-[10px] text-[#737373]">({p.marks} M)</span>
                                      </div>
                                    ))}
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
              </div>
            );
          })()}

          {/* STEP 4: BRANDED PDF PREVIEW & PUBLISH */}
          {step === 4 && (
            <div className="space-y-4">
              <PdfPreviewViewer
                pdfBlob={generatedPdfBlob}
                pdfDataUrl={previewPdfUrl || undefined}
                pdfArrayBuffer={pdfArrayBuffer}
                testSpec={currentTestSpec}
                isGenerating={generatingPdf}
                error={pdfError}
                onRetry={handleGeneratePdfPreview}
                onPreviewReady={(valid) => setIsPdfPreviewValid(valid)}
              />
            </div>
          )}
        </div>

        {/* Footer Actions Bar */}
        <div className="p-5 border-t border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between shrink-0">
          <div>
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1) as any)}
                className="px-4 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-[#111111] hover:bg-[#F0F0F0] transition-all cursor-pointer"
              >
                Back
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#737373] hover:text-[#111111] transition-all cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step < 3 && (
              <button
                onClick={() => setStep((s) => Math.min(4, s + 1) as any)}
                disabled={step === 2 && !includeMCQs && !includeShort && !includeLong}
                className="px-5 py-2 rounded-xl bg-[#111111] text-white text-xs font-extrabold hover:bg-black transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Continue</span>
                <ChevronRight size={14} />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={goToPreviewStep}
                disabled={pullingQuestions}
                className="px-5 py-2 rounded-xl bg-[#111111] text-white text-xs font-extrabold hover:bg-black transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye size={14} className="text-[#F4C430]" />
                <span>Preview Branded PDF</span>
                <ChevronRight size={14} />
              </button>
            )}

            {step === 4 && (
              <div className="flex items-center gap-2">
                {!isPdfPreviewValid && !generatingPdf && !isSubmitting && (
                  <span className="text-[11px] text-amber-800 font-bold hidden sm:inline">
                    ⚠️ Valid preview required to publish
                  </span>
                )}
                <button
                  onClick={handlePublishTest}
                  disabled={isSubmitting || generatingPdf || (!generatedPdfBlob && !isPdfPreviewValid)}
                  title={
                    !generatedPdfBlob && !isPdfPreviewValid
                      ? 'Generate a valid PDF preview before publishing'
                      : 'Publish official test paper'
                  }
                  className="px-6 py-2.5 rounded-xl bg-[#111111] text-[#F4C430] hover:bg-black text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Publishing Test Paper...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Publish & Deploy Test Paper</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateTestModal;
