import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Clock,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Camera,
  Save,
  Send,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../features/auth/AuthContext';
import { saveWrittenTest } from '../../../lib/writtenTestService';
import { MathText } from '../../common/MathText';
import { BOARDS, getGradesForBoard, getStreamsForGrade } from '../../../lib/taxonomy';
import { getSubjectsForStream } from '../../../lib/db';
import type { WrittenQuestionItem, WrittenTest, WrittenTestType } from '../../../types/writtenTest';

interface AdminCreateWrittenTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestCreated: (test: WrittenTest) => void;
  defaultType?: WrittenTestType;
  testType?: WrittenTestType;
}

export const AdminCreateWrittenTestModal: React.FC<AdminCreateWrittenTestModalProps> = ({
  isOpen,
  onClose,
  onTestCreated,
  defaultType = 'short_question',
  testType: propTestType,
}) => {
  const effectiveDefaultType = propTestType || defaultType;
  const { profile } = useAuth();

  // Wizard step: 1 = Basic Info, 2 = Add Questions, 3 = Preview & Publish
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Metadata
  const [testType, setTestType] = useState<WrittenTestType>(effectiveDefaultType);
  const [title, setTitle] = useState<string>(
    effectiveDefaultType === 'short_question'
      ? 'Mid-Term Short Question Assessment'
      : 'Comprehensive Long Answer Examination'
  );

  useEffect(() => {
    if (isOpen) {
      const typeToUse = propTestType || defaultType;
      setTestType(typeToUse);
      setTitle(
        typeToUse === 'short_question'
          ? 'Mid-Term Short Question Assessment'
          : 'Comprehensive Long Answer Examination'
      );
      setDurationMinutes(typeToUse === 'short_question' ? 45 : 90);
      setPassMarks(typeToUse === 'short_question' ? 12 : 20);
    }
  }, [isOpen, propTestType, defaultType]);
  const [board, setBoard] = useState<string>('fbise');
  const [grade, setGrade] = useState<string>('9');
  const [stream, setStream] = useState<string>('Biology');
  const [subject, setSubject] = useState<string>('Physics');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(defaultType === 'short_question' ? 45 : 90);
  const [passMarks, setPassMarks] = useState<number>(defaultType === 'short_question' ? 12 : 20);
  const [instructions, setInstructions] = useState<string>(
    'Prepare clear handwritten answers on blank sheets. For each question, use the in-browser camera to capture and submit your written sheet. Tab-switching or minimizing the browser is strictly monitored.'
  );

  // Questions List
  const [questions, setQuestions] = useState<WrittenQuestionItem[]>([
    defaultType === 'short_question'
      ? {
          id: 'wq_init_1',
          question: 'Define velocity and state its SI unit. How does it differ from speed?',
          marks: 4,
          guidelines: '1 mark definition, 1 mark SI unit (m/s), 2 marks vector vs scalar distinction.',
        }
      : {
          id: 'wq_init_1',
          question: 'State Newton’s Second Law of Motion. Derive the formula F = ma and explain its significance with an example.',
          marks: 8,
          guidelines: '2 marks statement, 4 marks mathematical derivation, 2 marks example and significance.',
        },
  ]);

  // Current Question Form (for adding one by one)
  const [currentQuestionText, setCurrentQuestionText] = useState<string>('');
  const [currentMarks, setCurrentMarks] = useState<number>(testType === 'short_question' ? 4 : 8);
  const [currentGuidelines, setCurrentGuidelines] = useState<string>('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const [saving, setSaving] = useState<boolean>(false);

  // Sync testType if defaultType changes
  useEffect(() => {
    if (defaultType) {
      setTestType(defaultType);
      setCurrentMarks(defaultType === 'short_question' ? 4 : 8);
      setDurationMinutes(defaultType === 'short_question' ? 45 : 90);
    }
  }, [defaultType]);

  // Grade & stream dynamic taxonomy (Strict Grade -> Stream/Group -> Subject chain)
  const availableGrades = useMemo(() => getGradesForBoard(board), [board]);
  const availableStreams = useMemo(() => getStreamsForGrade(grade, board), [grade, board]);
  const availableSubjects = useMemo(() => {
    const streamDef = availableStreams.find((s) => s.name.toLowerCase() === stream.toLowerCase());
    if (streamDef && streamDef.subjects && streamDef.subjects.length > 0) {
      return streamDef.subjects;
    }
    const gradeDef = availableGrades.find((g) => String(g.grade) === String(grade));
    if (gradeDef && gradeDef.commonSubjects && gradeDef.commonSubjects.length > 0) {
      return gradeDef.commonSubjects;
    }
    const dbSubs = getSubjectsForStream(grade, stream, board);
    if (dbSubs && dbSubs.length > 0) return dbSubs;
    return ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science'];
  }, [availableStreams, stream, grade, board, availableGrades]);

  // Synchronize Grade if current grade is invalid for board
  useEffect(() => {
    if (availableGrades.length > 0 && !availableGrades.some((g) => String(g.grade) === String(grade))) {
      setGrade(String(availableGrades[0].grade));
    }
  }, [availableGrades, grade]);

  // Synchronize Stream if current stream is invalid for grade/board
  useEffect(() => {
    if (availableStreams.length > 0) {
      const match = availableStreams.find((s) => s.name.toLowerCase() === stream.toLowerCase());
      if (!match) {
        setStream(availableStreams[0].name);
      }
    }
  }, [availableStreams, stream]);

  // Synchronize Subject: if current subject (e.g. Urdu, English) is still valid in the new stream/grade, preserve it!
  useEffect(() => {
    if (availableSubjects.length > 0) {
      const subjectStillValid = availableSubjects.includes(subject);
      if (!subjectStillValid) {
        setSubject(availableSubjects[0]);
      }
    }
  }, [availableSubjects, subject]);

  if (!isOpen) return null;

  const totalCalculatedMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0);

  const handleAddOrUpdateQuestion = () => {
    if (!currentQuestionText.trim()) {
      toast.error('Please enter the question text.');
      return;
    }
    if (currentMarks <= 0) {
      toast.error('Marks must be greater than 0.');
      return;
    }

    if (editingQuestionId) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQuestionId
            ? {
                ...q,
                question: currentQuestionText.trim(),
                marks: currentMarks,
                guidelines: currentGuidelines.trim(),
              }
            : q
        )
      );
      toast.success('Question updated.');
      setEditingQuestionId(null);
    } else {
      const newQuestion: WrittenQuestionItem = {
        id: `wq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        question: currentQuestionText.trim(),
        marks: currentMarks,
        guidelines: currentGuidelines.trim(),
      };
      setQuestions((prev) => [...prev, newQuestion]);
      toast.success(`Question #${questions.length + 1} added!`);
    }

    // Reset current form
    setCurrentQuestionText('');
    setCurrentMarks(testType === 'short_question' ? 4 : 8);
    setCurrentGuidelines('');
  };

  const handleEditQuestion = (q: WrittenQuestionItem) => {
    setEditingQuestionId(q.id);
    setCurrentQuestionText(q.question);
    setCurrentMarks(q.marks);
    setCurrentGuidelines(q.guidelines || '');
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    if (editingQuestionId === id) {
      setEditingQuestionId(null);
      setCurrentQuestionText('');
      setCurrentGuidelines('');
    }
  };

  const handleSave = async (publish: boolean) => {
    const normRole = (profile?.role || '').toLowerCase();
    if (normRole !== 'admin') {
      toast.error('Only administrators are authorized to create or publish tests.');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a test title.');
      setStep(1);
      return;
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question to the test.');
      setStep(2);
      return;
    }

    setSaving(true);
    try {
      const newTest: WrittenTest = {
        id: `wtest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        type: testType,
        instructions: instructions.trim(),
        board,
        board_id: board,
        grade,
        stream,
        subject,
        due_date: dueDate,
        duration_minutes: Number(durationMinutes) || (testType === 'short_question' ? 45 : 90),
        total_marks: totalCalculatedMarks,
        pass_marks: Number(passMarks) || Math.ceil(totalCalculatedMarks * 0.4),
        questions,
        status: publish ? 'published' : 'draft',
        created_at: new Date().toISOString(),
        published_at: publish ? new Date().toISOString() : null,
        created_by: profile?.id || 'admin',
        created_by_name: profile?.full_name || 'Admin',
        is_proctored: true,
      };

      await saveWrittenTest(newTest, 'admin');

      if (publish) {
        toast.success(`${testType === 'short_question' ? 'Short Question' : 'Long Question'} Test published successfully!`);
      } else {
        toast.success('Saved as Draft. This test is hidden until published.');
      }

      onTestCreated(newTest);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save test.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E5E5E5] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              {testType === 'short_question' ? (
                <FileText className="w-5 h-5" />
              ) : (
                <BookOpen className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#111111] text-base">
                  Create {testType === 'short_question' ? 'Short Question' : 'Long Question'} Test
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-black text-amber-400">
                  Camera Proctored
                </span>
              </div>
              <p className="text-xs text-[#737373]">
                Sequential questions with live in-browser handwritten camera submissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Navigation */}
        <div className="px-6 py-3 bg-[#FAFAFA] border-b border-[#F0F0F0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-6">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 text-xs font-bold transition-colors ${
                step === 1 ? 'text-[#111111]' : 'text-[#737373] hover:text-[#111111]'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === 1 ? 'bg-[#111111] text-white' : 'bg-[#E5E5E5] text-[#737373]'
                }`}
              >
                1
              </span>
              Test Details
            </button>
            <div className="w-6 h-px bg-[#E5E5E5]" />
            <button
              onClick={() => setStep(2)}
              className={`flex items-center gap-2 text-xs font-bold transition-colors ${
                step === 2 ? 'text-[#111111]' : 'text-[#737373] hover:text-[#111111]'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === 2 ? 'bg-[#111111] text-white' : 'bg-[#E5E5E5] text-[#737373]'
                }`}
              >
                2
              </span>
              Questions ({questions.length})
            </button>
            <div className="w-6 h-px bg-[#E5E5E5]" />
            <button
              onClick={() => setStep(3)}
              className={`flex items-center gap-2 text-xs font-bold transition-colors ${
                step === 3 ? 'text-[#111111]' : 'text-[#737373] hover:text-[#111111]'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === 3 ? 'bg-[#111111] text-white' : 'bg-[#E5E5E5] text-[#737373]'
                }`}
              >
                3
              </span>
              Preview & Publish
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#111111] bg-white px-3 py-1.5 rounded-xl border border-[#E5E5E5]">
            <span>Total Marks:</span>
            <span className="text-amber-700 font-extrabold">{totalCalculatedMarks}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: Basic Info & Taxonomy */}
          {step === 1 && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTestType('short_question');
                    setCurrentMarks(4);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    testType === 'short_question'
                      ? 'border-[#111111] bg-amber-50/50 shadow-xs ring-1 ring-[#111111]'
                      : 'border-[#E5E5E5] hover:border-[#D4D4D4] bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[#111111]">Short Question Test</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/60 text-amber-900">
                      3 - 5 Marks/Q
                    </span>
                  </div>
                  <p className="text-[11px] text-[#737373]">
                    Concise conceptual questions, definitions, brief explanations, or short numericals.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTestType('long_question');
                    setCurrentMarks(8);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    testType === 'long_question'
                      ? 'border-[#111111] bg-amber-50/50 shadow-xs ring-1 ring-[#111111]'
                      : 'border-[#E5E5E5] hover:border-[#D4D4D4] bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[#111111]">Long Question Test</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/60 text-amber-900">
                      8 - 12 Marks/Q
                    </span>
                  </div>
                  <p className="text-[11px] text-[#737373]">
                    Comprehensive derivations, detailed essays, multipart mathematical problems.
                  </p>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                  Test Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Physics Chapter 3 Written Assessment"
                  className="w-full h-11 px-4 rounded-xl border border-[#E5E5E5] text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                    Board / System
                  </label>
                  <select
                    id="admin-written-board-select"
                    value={board}
                    onChange={(e) => {
                      const newBoard = e.target.value;
                      setBoard(newBoard);
                      const newGrades = getGradesForBoard(newBoard);
                      const validGrade = newGrades.some((g) => String(g.grade) === String(grade))
                        ? grade
                        : String(newGrades[0]?.grade || '9');
                      if (validGrade !== grade) setGrade(validGrade);

                      const newStreams = getStreamsForGrade(validGrade, newBoard);
                      const validStream = newStreams.some((s) => s.name.toLowerCase() === stream.toLowerCase())
                        ? stream
                        : newStreams[0]?.name || '';
                      if (validStream !== stream) setStream(validStream);

                      const newSubs = getSubjectsForStream(validGrade, validStream, newBoard);
                      if (!newSubs.includes(subject) && newSubs.length > 0) {
                        setSubject(newSubs[0]);
                      }
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden bg-white"
                  >
                    {BOARDS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                    Grade / Class
                  </label>
                  <select
                    id="admin-written-grade-select"
                    value={grade}
                    onChange={(e) => {
                      const newGrade = e.target.value;
                      setGrade(newGrade);
                      const newStreams = getStreamsForGrade(newGrade, board);
                      const validStream = newStreams.some((s) => s.name.toLowerCase() === stream.toLowerCase())
                        ? stream
                        : newStreams[0]?.name || '';
                      if (validStream !== stream) setStream(validStream);

                      const newSubs = getSubjectsForStream(newGrade, validStream, board);
                      if (!newSubs.includes(subject) && newSubs.length > 0) {
                        setSubject(newSubs[0]);
                      }
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden bg-white"
                  >
                    {availableGrades.map((g) => (
                      <option key={g.grade} value={g.grade}>
                        {g.displayName || `Grade ${g.grade}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                    Stream / Group
                  </label>
                  <select
                    id="admin-written-stream-select"
                    value={stream}
                    onChange={(e) => {
                      const newStream = e.target.value;
                      setStream(newStream);
                      const newSubs = getSubjectsForStream(grade, newStream, board);
                      // If current subject (e.g. Urdu) exists in the newly chosen stream, preserve it!
                      if (!newSubs.includes(subject) && newSubs.length > 0) {
                        setSubject(newSubs[0]);
                      }
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden bg-white"
                  >
                    {availableStreams.map((st) => (
                      <option key={st.name} value={st.name}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                    Subject
                  </label>
                  <select
                    id="admin-written-subject-select"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden bg-white"
                  >
                    {availableSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                    Duration (Minutes)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={10}
                      max={240}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#E5E5E5] text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden bg-white"
                    />
                    <Clock className="w-4 h-4 text-[#737373] absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                    Passing Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={passMarks}
                    onChange={(e) => setPassMarks(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                  Proctoring Instructions & Camera Submission Guidance
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E5E5E5] text-xs font-medium text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden bg-white"
                />
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
                <Camera className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold">In-Browser Camera Submission Workflow:</span> Students solve each question on handwritten paper. The test displays questions one by one and opens the device camera directly in the browser to snap and attach the answer sheet before advancing to the next question. Submissions auto-expire after 24 hours in Cloudflare R2 storage.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Add Questions One-by-One */}
          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form to Write Question */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-5 rounded-2xl border border-[#E5E5E5] bg-white shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center text-xs font-extrabold">
                        {editingQuestionId ? '✎' : questions.length + 1}
                      </span>
                      <h4 className="text-sm font-extrabold text-[#111111]">
                        {editingQuestionId ? 'Edit Question' : `Add Question #${questions.length + 1}`}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-[#111111]">Marks:</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={currentMarks}
                        onChange={(e) => setCurrentMarks(Number(e.target.value))}
                        className="w-16 h-8 px-2 text-center rounded-lg border border-[#E5E5E5] text-xs font-bold text-[#111111] focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">
                      Question Text (Supports LaTeX math e.g. $E=mc^2$)
                    </label>
                    <textarea
                      rows={4}
                      value={currentQuestionText}
                      onChange={(e) => setCurrentQuestionText(e.target.value)}
                      placeholder="Type the question prompt here..."
                      className="w-full p-3 rounded-xl border border-[#E5E5E5] text-xs font-medium text-[#111111] focus:ring-2 focus:ring-[#111111] bg-white"
                    />
                    {currentQuestionText && (
                      <div className="mt-2 p-2.5 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] text-xs text-[#111111]">
                        <span className="text-[10px] uppercase font-bold text-[#737373] block mb-1">Live Math Preview:</span>
                        <MathText text={currentQuestionText} />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">
                      Grading Rubric / Model Answer (Optional — Visible to Teachers during Grading)
                    </label>
                    <textarea
                      rows={2}
                      value={currentGuidelines}
                      onChange={(e) => setCurrentGuidelines(e.target.value)}
                      placeholder="e.g. 2 marks for formula, 2 marks for derivation steps..."
                      className="w-full p-3 rounded-xl border border-[#E5E5E5] text-xs font-medium text-[#737373] focus:ring-2 focus:ring-[#111111] bg-white"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    {editingQuestionId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuestionId(null);
                          setCurrentQuestionText('');
                          setCurrentGuidelines('');
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-[#737373] hover:bg-[#F5F5F5]"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddOrUpdateQuestion}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-[#262626] transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      {editingQuestionId ? 'Update Question' : 'Add Question to Test'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: List of Added Questions */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                    Configured Questions ({questions.length})
                  </h4>
                  <span className="text-xs font-bold text-amber-700">
                    Total: {totalCalculatedMarks} Marks
                  </span>
                </div>

                {questions.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-[#E5E5E5] bg-[#FAFAFA]">
                    <FileText className="w-8 h-8 text-[#A3A3A3] mx-auto mb-2" />
                    <p className="text-xs font-bold text-[#111111]">No questions added yet</p>
                    <p className="text-[11px] text-[#737373] mt-0.5">
                      Write your first question on the left to begin assembling the test.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                    {questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          editingQuestionId === q.id
                            ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                            : 'border-[#E5E5E5] bg-white hover:border-[#D4D4D4]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#111111] text-white">
                            Q{idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                            {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-[#111111] mb-2 line-clamp-3">
                          <MathText text={q.question} />
                        </div>

                        {q.guidelines && (
                          <div className="text-[11px] text-[#737373] italic mb-2">
                            Rubric: {q.guidelines}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-1 border-t border-[#F5F5F5] pt-2">
                          <button
                            type="button"
                            onClick={() => handleEditQuestion(q)}
                            className="px-2 py-1 text-[11px] font-bold text-[#111111] hover:bg-[#F5F5F5] rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Preview & Publish */}
          {step === 3 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="p-5 rounded-2xl border border-[#E5E5E5] bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                      {testType === 'short_question' ? 'Short Question Test' : 'Long Question Test'}
                    </span>
                    <h3 className="text-base font-extrabold text-[#111111] mt-1">{title}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#737373] block">Total Assessment</span>
                    <span className="text-lg font-black text-[#111111]">{totalCalculatedMarks} Marks</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0]">
                    <span className="text-[#737373] block text-[10px] uppercase font-bold">Class & Board</span>
                    <span className="font-extrabold text-[#111111]">Grade {grade} • {board.toUpperCase()}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0]">
                    <span className="text-[#737373] block text-[10px] uppercase font-bold">Stream</span>
                    <span className="font-extrabold text-[#111111]">{stream}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0]">
                    <span className="text-[#737373] block text-[10px] uppercase font-bold">Subject</span>
                    <span className="font-extrabold text-[#111111]">{subject}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0]">
                    <span className="text-[#737373] block text-[10px] uppercase font-bold">Duration</span>
                    <span className="font-extrabold text-[#111111]">{durationMinutes} Mins</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs space-y-1">
                  <span className="font-bold text-amber-900 block">Student Submission Rules:</span>
                  <p className="text-amber-800 leading-relaxed">{instructions}</p>
                </div>
              </div>

              {/* Questions Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  Questions Review ({questions.length} Sequential Questions)
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="p-3 rounded-xl border border-[#E5E5E5] bg-white text-xs space-y-1">
                      <div className="flex items-center justify-between text-[#737373] text-[11px]">
                        <span className="font-bold text-[#111111]">Question #{idx + 1}</span>
                        <span className="font-extrabold text-amber-700">{q.marks} Marks</span>
                      </div>
                      <div className="font-medium text-[#111111]">
                        <MathText text={q.question} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-[#F0F0F0] bg-white flex items-center justify-between shrink-0">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev - 1) as any)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#111111] hover:bg-[#F5F5F5] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !title.trim()) {
                    toast.error('Please enter a test title.');
                    return;
                  }
                  if (step === 2 && questions.length === 0) {
                    toast.error('Please add at least one question before proceeding.');
                    return;
                  }
                  setStep((prev) => (prev + 1) as any);
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-[#262626] transition-all shadow-sm"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(false)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#111111] hover:bg-[#F5F5F5] transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(true)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-[#262626] transition-all shadow-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {saving ? 'Publishing...' : 'Publish Test'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateWrittenTestModal;

