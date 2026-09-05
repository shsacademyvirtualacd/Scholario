import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Clock,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  FileCheck2,
  Save,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../features/auth/AuthContext';
import { saveProctoredMCQTest } from '../../../lib/proctoredMcqService';
import { MathText } from '../../common/MathText';
import { BOARDS, getGradesForBoard, getStreamsForGrade } from '../../../lib/taxonomy';
import { getSubjectsForStream } from '../../../lib/db';
import type { ProctoredMCQItem, ProctoredMCQTest } from '../../../types/proctoredMcq';

interface AdminCreateMCQTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestCreated: (test: ProctoredMCQTest) => void;
}

export const AdminCreateMCQTestModal: React.FC<AdminCreateMCQTestModalProps> = ({
  isOpen,
  onClose,
  onTestCreated,
}) => {
  const { profile } = useAuth();
  const isAdmin = (profile?.role || '').toLowerCase() === 'admin';

  // Wizard step: 1 = Basic Info, 2 = Add MCQs, 3 = Preview & Publish
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Metadata
  const [title, setTitle] = useState<string>('Term 1 Proctored Examination');
  const [board, setBoard] = useState<string>('fbise');
  const [grade, setGrade] = useState<string>('9');
  const [stream, setStream] = useState<string>('Biology');
  const [subject, setSubject] = useState<string>('Physics');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [passMarks, setPassMarks] = useState<number>(10);
  const [instructions, setInstructions] = useState<string>(
    'Ensure a quiet environment. Any tab switch, window minimization, or screenshot attempt will immediately and automatically submit your test.'
  );

  // Questions List
  const [questions, setQuestions] = useState<ProctoredMCQItem[]>([
    {
      id: 'q_init_1',
      question: 'Which of the following is a derived quantity in the SI system of units?',
      options: ['Length', 'Mass', 'Velocity', 'Time'],
      correctAnswer: 2,
      explanation: 'Velocity is defined as displacement over time (m/s), hence a derived quantity.',
      marks: 1,
    },
    {
      id: 'q_init_2',
      question: 'The rate of change of displacement with respect to time is called:',
      options: ['Speed', 'Velocity', 'Acceleration', 'Force'],
      correctAnswer: 1,
      explanation: 'Velocity is the vector quantity representing rate of displacement.',
      marks: 1,
    },
  ]);

  // Current Question Form (for adding one by one)
  const [currentQuestionText, setCurrentQuestionText] = useState<string>('');
  const [currentOptions, setCurrentOptions] = useState<[string, string, string, string]>([
    '',
    '',
    '',
    '',
  ]);
  const [currentCorrectAnswer, setCurrentCorrectAnswer] = useState<number>(0);
  const [currentExplanation, setCurrentExplanation] = useState<string>('');
  const [currentMarks, setCurrentMarks] = useState<number>(1);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const [saving, setSaving] = useState<boolean>(false);

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
    if (currentOptions.some((opt) => !opt.trim())) {
      toast.error('Please provide all 4 options (A, B, C, D).');
      return;
    }

    if (editingQuestionId) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQuestionId
            ? {
                ...q,
                question: currentQuestionText.trim(),
                options: [...currentOptions] as [string, string, string, string],
                correctAnswer: currentCorrectAnswer,
                explanation: currentExplanation.trim() || undefined,
                marks: Number(currentMarks) || 1,
              }
            : q
        )
      );
      toast.success('Question updated.');
      setEditingQuestionId(null);
    } else {
      const newQ: ProctoredMCQItem = {
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        question: currentQuestionText.trim(),
        options: [...currentOptions] as [string, string, string, string],
        correctAnswer: currentCorrectAnswer,
        explanation: currentExplanation.trim() || undefined,
        marks: Number(currentMarks) || 1,
      };
      setQuestions((prev) => [...prev, newQ]);
      toast.success(`Question #${questions.length + 1} added.`);
    }

    // Reset current form
    setCurrentQuestionText('');
    setCurrentOptions(['', '', '', '']);
    setCurrentCorrectAnswer(0);
    setCurrentExplanation('');
    setCurrentMarks(1);
  };

  const handleEditQuestion = (q: ProctoredMCQItem) => {
    setEditingQuestionId(q.id);
    setCurrentQuestionText(q.question);
    setCurrentOptions([...q.options] as [string, string, string, string]);
    setCurrentCorrectAnswer(q.correctAnswer);
    setCurrentExplanation(q.explanation || '');
    setCurrentMarks(q.marks || 1);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    if (editingQuestionId === id) {
      setEditingQuestionId(null);
      setCurrentQuestionText('');
      setCurrentOptions(['', '', '', '']);
      setCurrentCorrectAnswer(0);
      setCurrentExplanation('');
      setCurrentMarks(1);
    }
  };

  const handleSaveTest = async (publish: boolean) => {
    if (!isAdmin) {
      toast.error('Unauthorized: Only administrators can create or publish tests.');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a test title.');
      setStep(1);
      return;
    }

    if (questions.length === 0) {
      toast.error('Please add at least one MCQ question to the test.');
      setStep(2);
      return;
    }

    setSaving(true);
    try {
      const newTest: ProctoredMCQTest = {
        id: `pmcq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        instructions: instructions.trim(),
        board,
        board_id: board,
        grade,
        stream,
        subject,
        due_date: dueDate,
        duration_minutes: Number(durationMinutes) || 30,
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

      await saveProctoredMCQTest(newTest, 'admin');

      if (publish) {
        toast.success('Proctored MCQ Test published! It is now accessible to students via Student ID.');
      } else {
        toast.success('Saved as Draft. This test is completely invisible to students until published.');
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
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <ShieldAlert size={20} className="text-[#F4C430]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#111111]">Create Proctored MCQ Test</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-[#737373]">
                Configure anti-cheating rules, write custom questions, preview, and publish to students.
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

        {/* Step Tabs */}
        <div className="px-6 py-2.5 bg-[#FAFAFA] border-b border-[#E5E5E5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                step === 1 ? 'bg-[#111111] text-white shadow-xs' : 'text-[#737373] hover:bg-black/5'
              }`}
            >
              <span>1. Test Details</span>
            </button>
            <span className="text-[#CCCCCC]">/</span>
            <button
              onClick={() => setStep(2)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                step === 2 ? 'bg-[#111111] text-white shadow-xs' : 'text-[#737373] hover:bg-black/5'
              }`}
            >
              <span>2. Add MCQs</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {questions.length}
              </span>
            </button>
            <span className="text-[#CCCCCC]">/</span>
            <button
              onClick={() => setStep(3)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                step === 3 ? 'bg-[#111111] text-white shadow-xs' : 'text-[#737373] hover:bg-black/5'
              }`}
            >
              <span>3. Preview & Publish</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-[#737373]">
            <span>Total Marks: <strong className="text-[#111111] font-mono">{totalCalculatedMarks}</strong></span>
            <span>•</span>
            <span>Duration: <strong className="text-[#111111] font-mono">{durationMinutes} min</strong></span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                  Test Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Physics Chapter 1-3 Assessment"
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E5E5E5] text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                    Board / System
                  </label>
                  <select
                    id="admin-mcq-board-select"
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
                    id="admin-mcq-grade-select"
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
                    id="admin-mcq-stream-select"
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
                    id="admin-mcq-subject-select"
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
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Math.max(5, parseInt(e.target.value) || 30))}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                    Pass Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={passMarks}
                    onChange={(e) => setPassMarks(Math.max(1, parseInt(e.target.value) || 10))}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                  Proctoring Instructions for Students
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E5E5E5] text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden resize-none"
                />
              </div>

              {/* Proctoring Banner */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-extrabold mb-0.5">Strict Anti-Cheating System Activated</p>
                  <p className="text-amber-800 leading-relaxed">
                    Once published, students will access this exam using their <strong>Student ID</strong>. If a student
                    switches browser tabs/windows or presses a screenshot key combination, the proctoring engine will
                    <strong> automatically auto-submit the exam immediately</strong> and log the incident.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Add MCQs One-by-One */}
          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form to Write / Edit Question */}
              <div className="lg:col-span-7 bg-[#FAFAFA] p-5 rounded-2xl border border-[#E5E5E5] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider flex items-center gap-2">
                    <FileCheck2 size={15} className="text-[#F4C430]" />
                    <span>{editingQuestionId ? 'Edit Question' : `Add Question #${questions.length + 1}`}</span>
                  </h3>
                  {editingQuestionId && (
                    <button
                      onClick={() => {
                        setEditingQuestionId(null);
                        setCurrentQuestionText('');
                        setCurrentOptions(['', '', '', '']);
                        setCurrentCorrectAnswer(0);
                        setCurrentExplanation('');
                      }}
                      className="text-xs font-bold text-[#737373] hover:text-[#111111]"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#737373] uppercase mb-1">
                    Question Text * (supports LaTeX math e.g. $E=mc^2$)
                  </label>
                  <textarea
                    rows={3}
                    value={currentQuestionText}
                    onChange={(e) => setCurrentQuestionText(e.target.value)}
                    placeholder="Enter question statement here..."
                    className="w-full p-3 rounded-xl border border-[#E5E5E5] bg-white text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden"
                  />
                  {currentQuestionText.includes('$') && (
                    <div className="mt-1.5 p-2 bg-white rounded-lg border border-[#E5E5E5] text-xs">
                      <span className="text-[10px] font-bold text-[#A3A3A3] block mb-0.5">Math Preview:</span>
                      <MathText text={currentQuestionText} />
                    </div>
                  )}
                </div>

                {/* 4 Options */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-[#737373] uppercase">
                    4 Options & Select Correct Answer *
                  </label>
                  {(['A', 'B', 'C', 'D'] as const).map((letter, idx) => {
                    const isSelected = currentCorrectAnswer === idx;
                    return (
                      <div
                        key={letter}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                          isSelected ? 'bg-amber-50/50 border-amber-400' : 'bg-white border-[#E5E5E5]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setCurrentCorrectAnswer(idx)}
                          className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#111111] text-[#F4C430] ring-2 ring-amber-400'
                              : 'bg-[#F0F0F0] text-[#737373] hover:bg-[#E5E5E5]'
                          }`}
                        >
                          {letter}
                        </button>
                        <input
                          type="text"
                          value={currentOptions[idx]}
                          onChange={(e) => {
                            const copy = [...currentOptions] as [string, string, string, string];
                            copy[idx] = e.target.value;
                            setCurrentOptions(copy);
                          }}
                          placeholder={`Option ${letter}`}
                          className="flex-1 h-8 px-2.5 rounded-lg border border-transparent bg-transparent text-xs font-semibold text-[#111111] focus:bg-white focus:border-[#E5E5E5] focus:outline-hidden"
                        />
                        {isSelected && (
                          <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md shrink-0">
                            Correct Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#737373] uppercase mb-1">
                      Marks
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={currentMarks}
                      onChange={(e) => setCurrentMarks(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full h-8 px-2.5 rounded-lg border border-[#E5E5E5] bg-white text-xs font-semibold text-[#111111]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#737373] uppercase mb-1">
                      Explanation (Optional)
                    </label>
                    <input
                      type="text"
                      value={currentExplanation}
                      onChange={(e) => setCurrentExplanation(e.target.value)}
                      placeholder="Why this answer is correct..."
                      className="w-full h-8 px-2.5 rounded-lg border border-[#E5E5E5] bg-white text-xs font-semibold text-[#111111]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddOrUpdateQuestion}
                  className="w-full py-2.5 rounded-xl bg-[#111111] text-[#F4C430] hover:bg-black font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-[0.98]"
                >
                  <Plus size={16} />
                  <span>{editingQuestionId ? 'Save Question Changes' : 'Add Question to Test'}</span>
                </button>
              </div>

              {/* Right Column: List of Questions Added */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider">
                    Questions Added ({questions.length})
                  </h4>
                  <span className="text-[11px] font-bold text-[#737373]">
                    {totalCalculatedMarks} Total Marks
                  </span>
                </div>

                {questions.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#CCCCCC] text-[#737373]">
                    <BookOpen size={30} className="mx-auto mb-2 text-[#A3A3A3]" />
                    <p className="text-xs font-bold">No questions added yet</p>
                    <p className="text-[11px] text-[#A3A3A3] mt-0.5">
                      Use the form on the left to write and add questions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className={`p-3.5 rounded-xl border transition-all text-left ${
                          editingQuestionId === q.id
                            ? 'border-[#111111] bg-amber-50/40 ring-1 ring-[#111111]'
                            : 'bg-white border-[#E5E5E5] hover:border-[#CCCCCC]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#111111] text-[#F4C430] text-[10px] font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-[10px] font-extrabold text-[#737373] uppercase">
                              {q.marks || 1} mark{(q.marks || 1) > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditQuestion(q)}
                              className="p-1 text-[#737373] hover:text-[#111111] text-xs font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs font-bold text-[#111111] mt-2 line-clamp-2">
                          {q.question}
                        </p>

                        <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`truncate px-2 py-0.5 rounded ${
                                oIdx === q.correctAnswer
                                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                                  : 'text-[#737373]'
                              }`}
                            >
                              <span className="font-mono mr-1">
                                {String.fromCharCode(65 + oIdx)}:
                              </span>
                              {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Preview Exam & Publish */}
          {step === 3 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Paper Summary Header Preview */}
              <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E5] pb-3 mb-3">
                  <div>
                    <h3 className="text-base font-black text-[#111111]">{title}</h3>
                    <p className="text-xs text-[#737373] mt-0.5">
                      Subject: <strong>{subject}</strong> • Grade: <strong>{grade}</strong> (
                      {stream}) • Board: <strong>{board.toUpperCase()}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-extrabold flex items-center gap-1.5">
                      <Clock size={14} className="text-amber-600" />
                      {durationMinutes} Minutes
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-extrabold">
                      {totalCalculatedMarks} Total Marks
                    </span>
                  </div>
                </div>

                <div className="text-xs text-[#525252] space-y-1">
                  <p>
                    <strong>Instructions:</strong> {instructions}
                  </p>
                  <p>
                    <strong>Due Date:</strong> {dueDate}
                  </p>
                  <p>
                    <strong>Proctoring Protection:</strong> Active (Screenshot prevention & Tab-switch auto-submit)
                  </p>
                </div>
              </div>

              {/* Questions Preview List */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider">
                  Test Questions ({questions.length})
                </h4>
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl bg-white border border-[#E5E5E5] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-[#111111] text-[#F4C430] text-xs font-black flex items-center justify-center shrink-0">
                          Q{idx + 1}
                        </span>
                        <div className="text-xs font-bold text-[#111111] leading-relaxed">
                          <MathText text={q.question} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#737373] shrink-0 font-mono">
                        [{q.marks || 1} mark]
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                            oIdx === q.correctAnswer
                              ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950 font-bold'
                              : 'bg-[#FAFAFA] border-[#E5E5E5] text-[#525252]'
                          }`}
                        >
                          <span className="font-mono font-bold w-5">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          <span className="flex-1">
                            <MathText text={opt} />
                          </span>
                          {oIdx === q.correctAnswer && (
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div className="ml-8 text-[11px] text-[#737373] bg-[#FAFAFA] p-2 rounded-lg border border-[#EBEBEB]">
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#F0F0F0] flex items-center justify-between bg-white shrink-0">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
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
                    toast.error('Please add at least one question.');
                    return;
                  }
                  setStep((s) => (s + 1) as any);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black cursor-pointer shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <>
                {/* Save as Draft */}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveTest(false)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-xs font-bold text-[#111111] cursor-pointer"
                >
                  <Save size={15} />
                  <span>Save as Draft</span>
                </button>

                {/* Publish Test */}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveTest(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-[#F4C430] hover:bg-black text-xs font-black cursor-pointer shadow-md"
                >
                  <Send size={15} />
                  <span>Publish Test Now</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateMCQTestModal;
