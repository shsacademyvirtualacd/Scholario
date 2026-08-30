import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Eye,
  RefreshCw,
  Check,
  ChevronRight,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { pullTestQuestionsFromBanks } from '../../../lib/questionBankService';
import { generateTestPaperPDF } from '../../../lib/testPdfGenerator';
import { renderLaTeXToText } from '../../../lib/latexRenderer';
import { PdfPreviewViewer } from './PdfPreviewViewer';
import { BOARDS, getGradesForBoard, getStreamsForGrade } from '../../../lib/taxonomy';
import { getSubjectsForStream } from '../../../lib/db';
import { FBISE_GRADE_9_CURRICULUM, FBISE_GRADE_10_CURRICULUM } from '../../../lib/curriculumFBISE9';
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

  // Pulled Questions State
  const [pulledMCQs, setPulledMCQs] = useState<StoredMCQ[]>([]);
  const [pulledShortQuestions, setPulledShortQuestions] = useState<StoredShortQuestion[]>([]);
  const [pulledLongQuestions, setPulledLongQuestions] = useState<StoredLongQuestion[]>([]);
  const [pullingQuestions, setPullingQuestions] = useState<boolean>(false);

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

  // Safe number parsing helper
  const safeNum = (val: number | string, fallback: number = 0): number => {
    if (typeof val === 'number') return isNaN(val) ? fallback : val;
    const parsed = parseInt(String(val), 10);
    return isNaN(parsed) ? fallback : parsed;
  };

  // Available grades for selected board
  const availableGrades = useMemo(() => {
    return getGradesForBoard(board);
  }, [board]);

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

  // Compute available chapters
  const availableChapters = useMemo(() => {
    const curriculum = grade === '10' ? FBISE_GRADE_10_CURRICULUM : FBISE_GRADE_9_CURRICULUM;
    const subjData = curriculum ? curriculum[subject] : undefined;
    if (subjData && subjData.chapters && subjData.chapters.length > 0) {
      return [{ id: 'all', number: 0, name: 'All' }, ...subjData.chapters];
    }
    return [{ id: 'all', number: 0, name: 'All' }];
  }, [grade, subject]);

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

  // Pull Questions From Question Banks
  const handlePullQuestions = async () => {
    setPullingQuestions(true);
    try {
      const res = await pullTestQuestionsFromBanks({
        combination: derivedCombination,
        includeMCQs,
        includeShort,
        includeLong,
        board,
        grade,
        subject,
        chapter: selectedChapter,
        mcqCount: includeMCQs ? safeNum(mcqCount, 10) : 0,
        shortCount: includeShort ? safeNum(shortCount, 6) : 0,
        longCount: includeLong ? safeNum(longCount, 3) : 0,
      });

      setPulledMCQs(includeMCQs ? res.mcqs : []);
      setPulledShortQuestions(includeShort ? res.shortQuestions : []);
      setPulledLongQuestions(includeLong ? res.longQuestions : []);
      toast.success(
        `Pulled questions: ${includeMCQs ? res.mcqs.length + ' MCQs, ' : ''}${includeShort ? res.shortQuestions.length + ' Short, ' : ''}${includeLong ? res.longQuestions.length + ' Long' : ''}`
      );
    } catch (err: any) {
      toast.error('Failed to pull questions from bank: ' + (err.message || 'Error'));
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

  // Generate Branded PDF Preview with strict timeout and validation
  const handleGeneratePdfPreview = async () => {
    setGeneratingPdf(true);
    setPdfError(null);
    setIsPdfPreviewValid(false);

    try {
      // 10-second timeout to prevent indefinite spinning
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PDF preview compilation timed out. Please try again.')), 10000)
      );

      const result = await Promise.race([generateTestPaperPDF(currentTestSpec), timeoutPromise]);

      if (!result.blob || result.blob.size === 0) {
        throw new Error('Compiled PDF is empty or invalid.');
      }

      setGeneratedPdfBlob(result.blob);
      setPreviewPdfUrl(result.dataUrl);
      setPdfArrayBuffer(result.arrayBuffer);
      setIsPdfPreviewValid(true);
      toast.success('Test Paper PDF generated with official SHS & Scholario branding!');
    } catch (err: any) {
      console.error('[PDF Gen Error]:', err);
      const errMsg = err?.message || 'Could not compile test paper layout';
      setPdfError(errMsg);
      setIsPdfPreviewValid(false);
      toast.error('Failed to generate PDF preview: ' + errMsg);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Step navigation to Step 4
  const goToPreviewStep = async () => {
    setStep(4);
    await handleGeneratePdfPreview();
  };

  // Convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Submit and Publish Test via Admin Endpoint
  const handlePublishTest = async () => {
    setIsSubmitting(true);
    try {
      let pdfBase64 = '';
      if (generatedPdfBlob) {
        pdfBase64 = await blobToBase64(generatedPdfBlob);
      } else {
        const spec: GeneratedTestSpecification = {
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
        };
        const result = await generateTestPaperPDF(spec);
        pdfBase64 = await blobToBase64(result.blob);
      }

      // Get user auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication session not found. Please log in again.');
      }

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
        const errJson: any = await response.json().catch(() => ({ error: 'Failed to publish test' }));
        throw new Error(errJson?.error || `Server responded with ${response.status}`);
      }

      await response.json();
      toast.success('Test Paper successfully created, branded, and published to Class Tests!');
      onTestCreated();
      onClose();
    } catch (err: any) {
      console.error('[Create Test Error]:', err);
      toast.error('Test Creation Error: ' + (err.message || 'Could not publish test'));
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
                        Grade {g.grade} ({g.displayName} {board === 'sindh' ? 'Sindh' : 'FBISE'})
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
                      <div className="p-3 bg-white rounded-xl border border-[#E5E5E5] space-y-2">
                        <div className="text-xs font-extrabold text-[#111111] flex items-center justify-between">
                          <span>Short Questions</span>
                          <span className="text-emerald-700 text-[11px] font-bold">
                            {safeNum(shortAttemptCount, 5) * safeNum(shortMarksEach, 4)} M
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-[#737373] w-20">Total Short:</label>
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
                          <label className="text-[11px] text-[#737373] w-20">To Attempt:</label>
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
                          <label className="text-[11px] text-[#737373] w-20">Marks each:</label>
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
                    )}

                    {/* Long questions config */}
                    {includeLong && (
                      <div className="p-3 bg-white rounded-xl border border-[#E5E5E5] space-y-2">
                        <div className="text-xs font-extrabold text-[#111111] flex items-center justify-between">
                          <span>Long Questions</span>
                          <span className="text-emerald-700 text-[11px] font-bold">
                            {safeNum(longAttemptCount, 2) * safeNum(longMarksEach, 10)} M
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-[#737373] w-20">Total Long:</label>
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
                          <label className="text-[11px] text-[#737373] w-20">To Attempt:</label>
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
                          <label className="text-[11px] text-[#737373] w-20">Marks each:</label>
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
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: BANK QUESTIONS REVIEW */}
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
                      Pulled Questions from Question Bank
                    </h3>
                    <p className="text-xs text-[#737373]">
                      Review the verified questions retrieved for Grade {grade} {subject} ({selectedChapter}).
                    </p>
                  </div>
                  <button
                    onClick={handlePullQuestions}
                    disabled={pullingQuestions}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] hover:bg-[#F5F5F5] text-xs font-bold text-[#111111] transition-all cursor-pointer shrink-0"
                  >
                    <RefreshCw size={13} className={pullingQuestions ? 'animate-spin' : ''} />
                    <span>Re-shuffle from Bank</span>
                  </button>
                </div>

                {pullingQuestions ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-8 h-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mx-auto" />
                    <div className="text-xs font-bold text-[#111111]">Pulling from Question Banks...</div>
                  </div>
                ) : (
                  <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-1">
                    {/* MCQs Preview */}
                    {includeMCQs && pulledMCQs.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-black uppercase text-[#111111] flex items-center justify-between bg-[#F5F5F5] p-2 rounded-lg">
                          <span>Section {mcqSec}: {pulledMCQs.length} MCQs ({pulledMCQs.length * safeNum(mcqMarksEach, 1)} Marks)</span>
                          <span className="text-[10px] font-bold text-[#737373]">All Compulsory</span>
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
                        </div>
                        <div className="space-y-2">
                          {pulledShortQuestions.map((sq, idx) => {
                            const roman = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'][idx] || `${idx + 1}`;
                            return (
                              <div key={sq.id || idx} className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E5E5] text-xs">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="font-extrabold text-[#111111]">
                                    {shortQPrefix}.({roman}) {renderLaTeXToText(sq.question)}
                                  </div>
                                  <span className="text-[10px] font-bold text-[#737373] shrink-0">
                                    [{sq.marks || safeNum(shortMarksEach, 4)} Marks]
                                  </span>
                                </div>
                                {sq.modelAnswer && (
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
                        </div>
                        <div className="space-y-2">
                          {pulledLongQuestions.map((lq, idx) => (
                            <div key={lq.id || idx} className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E5E5] text-xs space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-extrabold text-[#111111]">
                                  Q{longQStart + idx}. {renderLaTeXToText(lq.question)}
                                </div>
                                <span className="text-[10px] font-bold text-[#737373] shrink-0">
                                  [{lq.marks || safeNum(longMarksEach, 10)} Marks]
                                </span>
                              </div>
                              {lq.parts && lq.parts.length > 0 && (
                                <div className="space-y-1 pl-2">
                                  {lq.parts.map((p, pIdx) => (
                                    <div key={pIdx} className="text-[11px] text-[#525252] flex justify-between">
                                      <span>{p.label} {renderLaTeXToText(p.text)}</span>
                                      <span className="text-[10px] text-[#737373]">({p.marks} M)</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
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
