import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Camera,
  Save,
  Send,
  FileText,
  CheckCircle2,
  Layers,
  Sparkles,
  Edit2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../features/auth/AuthContext';
import { saveWrittenTest } from '../../../lib/writtenTestService';
import { MathText } from '../../common/MathText';
import { BOARDS, getGradesForBoard, getStreamsForGrade } from '../../../lib/taxonomy';
import { getSubjectsForStream } from '../../../lib/db';
import type {
  WrittenTest,
  WrittenQuestionItem,
  UnifiedQuestionType,
} from '../../../types/writtenTest';

interface AdminCreateUnifiedTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestCreated: (test: WrittenTest) => void;
}

export const AdminCreateUnifiedTestModal: React.FC<AdminCreateUnifiedTestModalProps> = ({
  isOpen,
  onClose,
  onTestCreated,
}) => {
  const { profile } = useAuth();

  // Wizard Steps:
  // 1 = Question Mix & Counts (Upfront selection)
  // 2 = Test Details
  // 3 = Add / Author Questions
  // 4 = Preview & Publish
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // ---------------------------------------------------------------------------
  // STEP 1: Question Mix & Counts
  // ---------------------------------------------------------------------------
  const [includeMCQ, setIncludeMCQ] = useState<boolean>(true);
  const [includeShort, setIncludeShort] = useState<boolean>(true);
  const [includeLong, setIncludeLong] = useState<boolean>(true);

  const [targetMCQCount, setTargetMCQCount] = useState<number>(5);
  const [targetShortCount, setTargetShortCount] = useState<number>(3);
  const [targetLongCount, setTargetLongCount] = useState<number>(2);

  const [marksPerMCQ, setMarksPerMCQ] = useState<number>(1);
  const [marksPerShort, setMarksPerShort] = useState<number>(4);
  const [marksPerLong, setMarksPerLong] = useState<number>(8);

  // ---------------------------------------------------------------------------
  // STEP 2: Test Details
  // ---------------------------------------------------------------------------
  const [title, setTitle] = useState<string>('Comprehensive Assessment Test');
  const [board, setBoard] = useState<string>('fbise');
  const [grade, setGrade] = useState<string>('9');
  const [stream, setStream] = useState<string>('Biology');
  const [subject, setSubject] = useState<string>('Physics');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [passMarks, setPassMarks] = useState<number>(14);
  const [instructions, setInstructions] = useState<string>(
    'Complete the Multiple Choice Questions online. For Short and Long answer questions, write your solutions neatly on blank paper and use the in-app camera to submit a photo for each question. Browser tab switching and screenshots are strictly monitored.'
  );

  // ---------------------------------------------------------------------------
  // STEP 3: Question Authoring State
  // ---------------------------------------------------------------------------
  const [activeAuthoringTab, setActiveAuthoringTab] = useState<UnifiedQuestionType>('mcq');
  const [questions, setQuestions] = useState<WrittenQuestionItem[]>([]);

  // Current MCQ Form
  const [currentMCQText, setCurrentMCQText] = useState<string>('');
  const [currentMCQOptions, setCurrentMCQOptions] = useState<[string, string, string, string]>([
    '',
    '',
    '',
    '',
  ]);
  const [currentMCQCorrect, setCurrentMCQCorrect] = useState<number>(0);
  const [currentMCQExplanation, setCurrentMCQExplanation] = useState<string>('');
  const [currentMCQMarks, setCurrentMCQMarks] = useState<number>(1);
  const [editingMCQId, setEditingMCQId] = useState<string | null>(null);

  // Current Short Question Form
  const [currentShortText, setCurrentShortText] = useState<string>('');
  const [currentShortMarks, setCurrentShortMarks] = useState<number>(4);
  const [currentShortGuidelines, setCurrentShortGuidelines] = useState<string>('');
  const [editingShortId, setEditingShortId] = useState<string | null>(null);

  // Current Long Question Form
  const [currentLongText, setCurrentLongText] = useState<string>('');
  const [currentLongMarks, setCurrentLongMarks] = useState<number>(8);
  const [currentLongGuidelines, setCurrentLongGuidelines] = useState<string>('');
  const [editingLongId, setEditingLongId] = useState<string | null>(null);

  const [saving, setSaving] = useState<boolean>(false);

  // Taxonomy derivation
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
    return getSubjectsForStream(grade, stream, board);
  }, [availableStreams, availableGrades, grade, stream, board]);

  // Adjust selections when board or grade changes
  useEffect(() => {
    if (availableGrades.length > 0 && !availableGrades.some((g) => String(g.grade) === String(grade))) {
      setGrade(String(availableGrades[0].grade));
    }
  }, [availableGrades, grade]);

  useEffect(() => {
    if (availableStreams.length > 0 && !availableStreams.some((s) => s.name.toLowerCase() === stream.toLowerCase())) {
      setStream(availableStreams[0].name);
    }
  }, [availableStreams, stream]);

  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.includes(subject)) {
      setSubject(availableSubjects[0]);
    }
  }, [availableSubjects, subject]);

  // Reset modal state upon open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIncludeMCQ(true);
      setIncludeShort(true);
      setIncludeLong(true);
      setTargetMCQCount(5);
      setTargetShortCount(3);
      setTargetLongCount(2);
      setMarksPerMCQ(1);
      setMarksPerShort(4);
      setMarksPerLong(8);
      setTitle('Mid-Term Assessment & Exam');
      setQuestions([]);
    }
  }, [isOpen]);

  // Initialize Starter Questions when transitioning from Step 2 to Step 3
  const generateStarterQuestions = () => {
    const starters: WrittenQuestionItem[] = [];

    if (includeMCQ) {
      const mcqDefaults = [
        {
          q: 'Which of the following is an SI base unit?',
          opts: ['Kilogram', 'Newton', 'Joule', 'Volt'],
          corr: 0,
          exp: 'Kilogram is the SI base unit of mass.',
        },
        {
          q: 'The rate of change of momentum of a body is directly proportional to:',
          opts: ['Applied force', 'Displacement', 'Velocity', 'Inertia'],
          corr: 0,
          exp: "Newton's second law: F = dp/dt.",
        },
        {
          q: 'Which of the following quantities is a scalar quantity?',
          opts: ['Velocity', 'Work', 'Force', 'Acceleration'],
          corr: 1,
          exp: 'Work is a scalar quantity defined as the dot product of force and displacement.',
        },
        {
          q: 'The value of acceleration due to gravity (g) at the surface of Earth is approximately:',
          opts: ['8.9 m/s²', '9.8 m/s²', '10.8 m/s²', '11.2 m/s²'],
          corr: 1,
          exp: 'Standard gravitational acceleration is 9.8 m/s².',
        },
        {
          q: 'The formula for kinetic energy of a body of mass m moving with velocity v is:',
          opts: ['mgh', '½ mv²', 'mv', '½ m²v'],
          corr: 1,
          exp: 'Kinetic energy = ½ mv².',
        },
      ];

      for (let i = 0; i < targetMCQCount; i++) {
        const item = mcqDefaults[i % mcqDefaults.length];
        starters.push({
          id: `mcq_${Date.now()}_${i + 1}`,
          type: 'mcq',
          question: item.q,
          options: item.opts,
          correctAnswer: item.corr,
          explanation: item.exp,
          marks: marksPerMCQ,
        });
      }
    }

    if (includeShort) {
      const shortDefaults = [
        {
          q: 'Define uniform velocity and give its mathematical equation and SI unit.',
          rubric: '1 mark definition, 1 mark equation (v = s/t), 1 mark SI unit (m/s), 1 mark explanation.',
        },
        {
          q: 'Differentiate between mass and weight with at least two key points.',
          rubric: '2 marks for mass properties (scalar, constant), 2 marks for weight properties (vector, variable with g).',
        },
        {
          q: 'State Pascal’s principle and name two hydraulic devices operating on this principle.',
          rubric: '2 marks statement, 2 marks for examples (hydraulic press, hydraulic brakes).',
        },
        {
          q: 'What is meant by center of gravity of a body? How does it affect stability?',
          rubric: '2 marks definition, 2 marks for relationship with body stability.',
        },
      ];

      for (let i = 0; i < targetShortCount; i++) {
        const item = shortDefaults[i % shortDefaults.length];
        starters.push({
          id: `short_${Date.now()}_${i + 1}`,
          type: 'short_question',
          question: item.q,
          marks: marksPerShort,
          guidelines: item.rubric,
        });
      }
    }

    if (includeLong) {
      const longDefaults = [
        {
          q: 'State Newton’s Second Law of Motion. Mathematically derive the relation F = ma and explain its physical significance with a real-life example.',
          rubric: '2 marks statement, 4 marks mathematical derivation, 2 marks real-life example & significance.',
        },
        {
          q: 'What is resolution of vectors? Explain how a vector can be resolved into two mutually perpendicular components with the help of a neat labeled diagram and equations.',
          rubric: '2 marks definition & diagram, 3 marks horizontal component (Fx = F cosθ), 3 marks vertical component (Fy = F sinθ).',
        },
        {
          q: 'Define work and power. State the work-energy principle and prove that work done on an object equals the change in its kinetic energy.',
          rubric: '2 marks definitions & units, 6 marks mathematical proof of work-energy theorem.',
        },
      ];

      for (let i = 0; i < targetLongCount; i++) {
        const item = longDefaults[i % longDefaults.length];
        starters.push({
          id: `long_${Date.now()}_${i + 1}`,
          type: 'long_question',
          question: item.q,
          marks: marksPerLong,
          guidelines: item.rubric,
        });
      }
    }

    setQuestions(starters);

    // Set first active authoring tab
    if (includeMCQ) setActiveAuthoringTab('mcq');
    else if (includeShort) setActiveAuthoringTab('short_question');
    else setActiveAuthoringTab('long_question');
  };

  // Synchronize suggested duration and pass marks based on mix
  const handleProceedFromStep1 = () => {
    if (!includeMCQ && !includeShort && !includeLong) {
      toast.error('Please select at least one question type for the test.');
      return;
    }
    if (includeMCQ && targetMCQCount <= 0) {
      toast.error('Number of MCQs must be at least 1.');
      return;
    }
    if (includeShort && targetShortCount <= 0) {
      toast.error('Number of Short Answer questions must be at least 1.');
      return;
    }
    if (includeLong && targetLongCount <= 0) {
      toast.error('Number of Long Answer questions must be at least 1.');
      return;
    }

    // Auto-calculate suggested duration (1.5 min per MCQ, 6 min per Short, 15 min per Long)
    const estMinutes =
      (includeMCQ ? targetMCQCount * 1.5 : 0) +
      (includeShort ? targetShortCount * 6 : 0) +
      (includeLong ? targetLongCount * 15 : 0);
    const suggestedDuration = Math.max(20, Math.round(estMinutes / 5) * 5);
    setDurationMinutes(suggestedDuration);

    // Auto-calculate total marks & pass marks (40%)
    const estTotalMarks =
      (includeMCQ ? targetMCQCount * marksPerMCQ : 0) +
      (includeShort ? targetShortCount * marksPerShort : 0) +
      (includeLong ? targetLongCount * marksPerLong : 0);
    setPassMarks(Math.round(estTotalMarks * 0.4));

    setStep(2);
  };

  const handleProceedFromStep2 = () => {
    if (!title.trim()) {
      toast.error('Please enter a test title.');
      return;
    }
    if (durationMinutes < 5) {
      toast.error('Test duration must be at least 5 minutes.');
      return;
    }

    // Populate starter questions if list is empty
    if (questions.length === 0) {
      generateStarterQuestions();
    }
    setStep(3);
  };

  // Question counts added so far
  const addedMCQs = questions.filter((q) => q.type === 'mcq');
  const addedShorts = questions.filter((q) => q.type === 'short_question');
  const addedLongs = questions.filter((q) => q.type === 'long_question');

  const totalCalculatedMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  // ---------------------------------------------------------------------------
  // Question Form Handlers
  // ---------------------------------------------------------------------------

  // MCQ Handlers
  const handleSaveMCQ = () => {
    if (!currentMCQText.trim()) {
      toast.error('Please enter question text.');
      return;
    }
    if (currentMCQOptions.some((opt) => !opt.trim())) {
      toast.error('Please fill in all 4 option choices.');
      return;
    }

    if (editingMCQId) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingMCQId
            ? {
                ...q,
                question: currentMCQText.trim(),
                options: [...currentMCQOptions] as [string, string, string, string],
                correctAnswer: currentMCQCorrect,
                explanation: currentMCQExplanation.trim(),
                marks: currentMCQMarks || 1,
              }
            : q
        )
      );
      toast.success('MCQ updated successfully');
      setEditingMCQId(null);
    } else {
      const newMCQ: WrittenQuestionItem = {
        id: `mcq_${Date.now()}`,
        type: 'mcq',
        question: currentMCQText.trim(),
        options: [...currentMCQOptions] as [string, string, string, string],
        correctAnswer: currentMCQCorrect,
        explanation: currentMCQExplanation.trim(),
        marks: currentMCQMarks || 1,
      };
      setQuestions((prev) => [...prev, newMCQ]);
      toast.success('MCQ added to test');
    }

    // Reset Form
    setCurrentMCQText('');
    setCurrentMCQOptions(['', '', '', '']);
    setCurrentMCQCorrect(0);
    setCurrentMCQExplanation('');
    setCurrentMCQMarks(marksPerMCQ);
  };

  const handleEditMCQ = (item: WrittenQuestionItem) => {
    setEditingMCQId(item.id);
    setCurrentMCQText(item.question);
    setCurrentMCQOptions((item.options as [string, string, string, string]) || ['', '', '', '']);
    setCurrentMCQCorrect(item.correctAnswer ?? 0);
    setCurrentMCQExplanation(item.explanation || '');
    setCurrentMCQMarks(item.marks || 1);
  };

  // Short Question Handlers
  const handleSaveShort = () => {
    if (!currentShortText.trim()) {
      toast.error('Please enter short question text.');
      return;
    }

    if (editingShortId) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingShortId
            ? {
                ...q,
                question: currentShortText.trim(),
                marks: currentShortMarks || 4,
                guidelines: currentShortGuidelines.trim(),
              }
            : q
        )
      );
      toast.success('Short question updated');
      setEditingShortId(null);
    } else {
      const newShort: WrittenQuestionItem = {
        id: `short_${Date.now()}`,
        type: 'short_question',
        question: currentShortText.trim(),
        marks: currentShortMarks || 4,
        guidelines: currentShortGuidelines.trim(),
      };
      setQuestions((prev) => [...prev, newShort]);
      toast.success('Short question added');
    }

    setCurrentShortText('');
    setCurrentShortMarks(marksPerShort);
    setCurrentShortGuidelines('');
  };

  const handleEditShort = (item: WrittenQuestionItem) => {
    setEditingShortId(item.id);
    setCurrentShortText(item.question);
    setCurrentShortMarks(item.marks || 4);
    setCurrentShortGuidelines(item.guidelines || '');
  };

  // Long Question Handlers
  const handleSaveLong = () => {
    if (!currentLongText.trim()) {
      toast.error('Please enter long question text.');
      return;
    }

    if (editingLongId) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingLongId
            ? {
                ...q,
                question: currentLongText.trim(),
                marks: currentLongMarks || 8,
                guidelines: currentLongGuidelines.trim(),
              }
            : q
        )
      );
      toast.success('Long question updated');
      setEditingLongId(null);
    } else {
      const newLong: WrittenQuestionItem = {
        id: `long_${Date.now()}`,
        type: 'long_question',
        question: currentLongText.trim(),
        marks: currentLongMarks || 8,
        guidelines: currentLongGuidelines.trim(),
      };
      setQuestions((prev) => [...prev, newLong]);
      toast.success('Long question added');
    }

    setCurrentLongText('');
    setCurrentLongMarks(marksPerLong);
    setCurrentLongGuidelines('');
  };

  const handleEditLong = (item: WrittenQuestionItem) => {
    setEditingLongId(item.id);
    setCurrentLongText(item.question);
    setCurrentLongMarks(item.marks || 8);
    setCurrentLongGuidelines(item.guidelines || '');
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    toast.info('Question removed');
  };

  // ---------------------------------------------------------------------------
  // Publish / Save Handlers
  // ---------------------------------------------------------------------------
  const handleSaveTest = async (statusToSet: 'draft' | 'published') => {
    if (questions.length === 0) {
      toast.error('Please add at least one question before saving.');
      return;
    }

    setSaving(true);
    try {
      const selectedTypes: UnifiedQuestionType[] = [];
      if (includeMCQ) selectedTypes.push('mcq');
      if (includeShort) selectedTypes.push('short_question');
      if (includeLong) selectedTypes.push('long_question');

      const testPayload: WrittenTest = {
        id: `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        type: 'unified',
        test_type: 'unified',
        question_types: selectedTypes,
        mcq_count: addedMCQs.length,
        short_count: addedShorts.length,
        long_count: addedLongs.length,
        instructions: instructions.trim(),
        board,
        grade,
        stream,
        subject,
        due_date: dueDate,
        duration_minutes: durationMinutes,
        total_marks: totalCalculatedMarks,
        pass_marks: passMarks,
        questions,
        status: statusToSet,
        created_at: new Date().toISOString(),
        published_at: statusToSet === 'published' ? new Date().toISOString() : null,
        created_by: profile?.id || 'admin',
        created_by_name: profile?.full_name || 'Admin',
        is_proctored: true,
      };

      const saved = await saveWrittenTest(testPayload, profile?.role || 'admin');
      toast.success(
        statusToSet === 'published'
          ? 'Test published successfully! Students can now take this assessment.'
          : 'Test saved as draft.'
      );
      onTestCreated(saved);
      onClose();
    } catch (err: any) {
      console.error('Save test error:', err);
      toast.error(err.message || 'Failed to save test.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-[#E5E5E5] flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#111111] text-[#F4C430] flex items-center justify-center font-black shadow-xs">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#111111]">Create a Test</h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 font-mono">
                  Step {step} of 4
                </span>
              </div>
              <p className="text-xs text-[#737373]">
                {step === 1 && 'Choose question types and quantities upfront'}
                {step === 2 && 'Set grade, subject, duration & exam instructions'}
                {step === 3 && 'Author multiple choice, short, and long answer questions'}
                {step === 4 && 'Review questions layout, mark distribution, and publish'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-[#EBEBEB] text-[#737373] hover:text-[#111111] border border-[#E5E5E5] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="grid grid-cols-4 border-b border-[#E5E5E5] bg-white text-xs font-bold text-center">
          <div className={`py-2.5 border-b-2 ${step === 1 ? 'border-[#111111] text-[#111111] bg-amber-50/50' : 'border-transparent text-[#A3A3A3]'}`}>
            1. Question Mix
          </div>
          <div className={`py-2.5 border-b-2 ${step === 2 ? 'border-[#111111] text-[#111111] bg-amber-50/50' : 'border-transparent text-[#A3A3A3]'}`}>
            2. Test Details
          </div>
          <div className={`py-2.5 border-b-2 ${step === 3 ? 'border-[#111111] text-[#111111] bg-amber-50/50' : 'border-transparent text-[#A3A3A3]'}`}>
            3. Add Questions
          </div>
          <div className={`py-2.5 border-b-2 ${step === 4 ? 'border-[#111111] text-[#111111] bg-amber-50/50' : 'border-transparent text-[#A3A3A3]'}`}>
            4. Preview & Publish
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* STEP 1: UPFRONT QUESTION MIX & COUNTS                               */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-950 flex items-start gap-3">
                <Sparkles size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-amber-900 text-sm">Flexible Question Combination</h4>
                  <p className="mt-0.5 text-amber-800 leading-relaxed">
                    Select which question formats you want to include in this single test paper. Students will complete all sections continuously in one unified session.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. MCQ Card */}
                <div
                  className={`rounded-2xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    includeMCQ
                      ? 'border-[#111111] bg-[#FAFAFA] shadow-xs'
                      : 'border-[#E5E5E5] bg-white opacity-80 hover:border-[#CCCCCC]'
                  }`}
                  onClick={() => setIncludeMCQ(!includeMCQ)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-[#111111] text-[#F4C430] flex items-center justify-center font-bold">
                        <CheckCircle2 size={16} />
                      </div>
                      <input
                        type="checkbox"
                        checked={includeMCQ}
                        onChange={(e) => setIncludeMCQ(e.target.checked)}
                        className="w-4 h-4 rounded text-[#111111] focus:ring-0 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#111111]">Multiple Choice (MCQs)</h4>
                      <p className="text-[11px] text-[#737373] mt-1 leading-snug">
                        Single-correct choice options. Auto-graded instantly upon student submission.
                      </p>
                    </div>
                  </div>

                  {includeMCQ && (
                    <div className="mt-4 pt-3 border-t border-[#E5E5E5] space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#737373] block mb-1">
                          Number of Questions
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={targetMCQCount}
                          onChange={(e) => setTargetMCQCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full h-9 px-3 rounded-xl border border-[#E5E5E5] text-xs font-black bg-white focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#737373]">
                        <span>Marks per MCQ:</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={marksPerMCQ}
                          onChange={(e) => setMarksPerMCQ(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 h-7 text-center rounded-lg border border-[#E5E5E5] text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Short Question Card */}
                <div
                  className={`rounded-2xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    includeShort
                      ? 'border-[#111111] bg-[#FAFAFA] shadow-xs'
                      : 'border-[#E5E5E5] bg-white opacity-80 hover:border-[#CCCCCC]'
                  }`}
                  onClick={() => setIncludeShort(!includeShort)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                        <FileText size={16} />
                      </div>
                      <input
                        type="checkbox"
                        checked={includeShort}
                        onChange={(e) => setIncludeShort(e.target.checked)}
                        className="w-4 h-4 rounded text-[#111111] focus:ring-0 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#111111]">Short Answer Questions</h4>
                      <p className="text-[11px] text-[#737373] mt-1 leading-snug">
                        Handwritten answers photographed with camera. Retained 24h for teacher evaluation.
                      </p>
                    </div>
                  </div>

                  {includeShort && (
                    <div className="mt-4 pt-3 border-t border-[#E5E5E5] space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#737373] block mb-1">
                          Number of Questions
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={targetShortCount}
                          onChange={(e) => setTargetShortCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full h-9 px-3 rounded-xl border border-[#E5E5E5] text-xs font-black bg-white focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#737373]">
                        <span>Default marks each:</span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={marksPerShort}
                          onChange={(e) => setMarksPerShort(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 h-7 text-center rounded-lg border border-[#E5E5E5] text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Long Question Card */}
                <div
                  className={`rounded-2xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    includeLong
                      ? 'border-[#111111] bg-[#FAFAFA] shadow-xs'
                      : 'border-[#E5E5E5] bg-white opacity-80 hover:border-[#CCCCCC]'
                  }`}
                  onClick={() => setIncludeLong(!includeLong)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                        <BookOpen size={16} />
                      </div>
                      <input
                        type="checkbox"
                        checked={includeLong}
                        onChange={(e) => setIncludeLong(e.target.checked)}
                        className="w-4 h-4 rounded text-[#111111] focus:ring-0 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#111111]">Long Answer Questions</h4>
                      <p className="text-[11px] text-[#737373] mt-1 leading-snug">
                        Multi-part derivations & essays. Photographed handwritten sheets graded via rubric.
                      </p>
                    </div>
                  </div>

                  {includeLong && (
                    <div className="mt-4 pt-3 border-t border-[#E5E5E5] space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#737373] block mb-1">
                          Number of Questions
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={targetLongCount}
                          onChange={(e) => setTargetLongCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full h-9 px-3 rounded-xl border border-[#E5E5E5] text-xs font-black bg-white focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#737373]">
                        <span>Default marks each:</span>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={marksPerLong}
                          onChange={(e) => setMarksPerLong(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 h-7 text-center rounded-lg border border-[#E5E5E5] text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Bar */}
              <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-[#525252]">
                  <span className="font-black text-[#111111]">Current Test Structure: </span>
                  {[
                    includeMCQ ? `${targetMCQCount} MCQs (${targetMCQCount * marksPerMCQ} marks)` : null,
                    includeShort ? `${targetShortCount} Short Answers (${targetShortCount * marksPerShort} marks)` : null,
                    includeLong ? `${targetLongCount} Long Answers (${targetLongCount * marksPerLong} marks)` : null,
                  ]
                    .filter(Boolean)
                    .join(' + ') || 'No question types selected'}
                </div>
                <div className="text-xs font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-xl">
                  Total: {(includeMCQ ? targetMCQCount : 0) + (includeShort ? targetShortCount : 0) + (includeLong ? targetLongCount : 0)} Questions •{' '}
                  {(includeMCQ ? targetMCQCount * marksPerMCQ : 0) +
                    (includeShort ? targetShortCount * marksPerShort : 0) +
                    (includeLong ? targetLongCount * marksPerLong : 0)}{' '}
                  Total Marks
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* STEP 2: TEST DETAILS                                               */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Title */}
              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1.5">
                  Test Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Physics Chapter 1-3 Comprehensive Assessment"
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#111111] focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              {/* Taxonomy: Board, Grade, Stream, Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1.5">Board</label>
                  <select
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] text-xs font-bold bg-white text-[#111111] focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
                  >
                    {BOARDS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1.5">Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] text-xs font-bold bg-white text-[#111111] focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
                  >
                    {availableGrades.map((g) => (
                      <option key={g.grade} value={g.grade}>
                        {g.grade}th Grade
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1.5">Stream / Group</label>
                  <select
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] text-xs font-bold bg-white text-[#111111] focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
                  >
                    {availableStreams.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1.5">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] text-xs font-bold bg-white text-[#111111] focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
                  >
                    {availableSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Timing & Passing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] text-xs font-bold bg-white text-[#111111] focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1.5">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Math.max(5, parseInt(e.target.value) || 30))}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] text-xs font-bold bg-white text-[#111111] focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1.5">Passing Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={passMarks}
                    onChange={(e) => setPassMarks(Math.max(1, parseInt(e.target.value) || 10))}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] text-xs font-bold bg-white text-[#111111] focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1.5">Student Exam Instructions</label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E5E5E5] text-xs font-medium text-[#111111] focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
                />
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* STEP 3: ADD / AUTHOR QUESTIONS                                     */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Type Switcher Tabs */}
              <div className="flex items-center gap-2 p-1.5 bg-[#EBEBEB] rounded-2xl w-fit flex-wrap">
                {includeMCQ && (
                  <button
                    onClick={() => setActiveAuthoringTab('mcq')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeAuthoringTab === 'mcq'
                        ? 'bg-[#111111] text-white shadow-xs'
                        : 'text-[#525252] hover:text-[#111111]'
                    }`}
                  >
                    <CheckCircle2 size={14} className={activeAuthoringTab === 'mcq' ? 'text-[#F4C430]' : 'text-[#737373]'} />
                    <span>Multiple Choice ({addedMCQs.length}/{targetMCQCount})</span>
                  </button>
                )}

                {includeShort && (
                  <button
                    onClick={() => setActiveAuthoringTab('short_question')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeAuthoringTab === 'short_question'
                        ? 'bg-[#111111] text-white shadow-xs'
                        : 'text-[#525252] hover:text-[#111111]'
                    }`}
                  >
                    <FileText size={14} className={activeAuthoringTab === 'short_question' ? 'text-amber-400' : 'text-[#737373]'} />
                    <span>Short Answers ({addedShorts.length}/{targetShortCount})</span>
                  </button>
                )}

                {includeLong && (
                  <button
                    onClick={() => setActiveAuthoringTab('long_question')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeAuthoringTab === 'long_question'
                        ? 'bg-[#111111] text-white shadow-xs'
                        : 'text-[#525252] hover:text-[#111111]'
                    }`}
                  >
                    <BookOpen size={14} className={activeAuthoringTab === 'long_question' ? 'text-blue-400' : 'text-[#737373]'} />
                    <span>Long Answers ({addedLongs.length}/{targetLongCount})</span>
                  </button>
                )}
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* TAB 1: MCQ AUTHORING                                         */}
              {/* ───────────────────────────────────────────────────────────── */}
              {activeAuthoringTab === 'mcq' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#111111]">
                        {editingMCQId ? 'Edit MCQ Question' : 'Add Multiple Choice Question'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#737373]">Marks:</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={currentMCQMarks}
                          onChange={(e) => setCurrentMCQMarks(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 h-8 text-center rounded-lg border border-[#E5E5E5] text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#737373] block mb-1">
                        Question Statement (LaTeX supported, e.g. $F = ma$)
                      </label>
                      <textarea
                        rows={2}
                        value={currentMCQText}
                        onChange={(e) => setCurrentMCQText(e.target.value)}
                        placeholder="e.g. Which law explains the relation $F = dp/dt$?"
                        className="w-full p-2.5 rounded-xl border border-[#E5E5E5] text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                      />
                      {currentMCQText && (
                        <div className="mt-1 p-2 rounded-lg bg-white border border-[#E5E5E5] text-xs">
                          <span className="text-[10px] font-bold text-[#737373] block">Live Preview:</span>
                          <MathText text={currentMCQText} />
                        </div>
                      )}
                    </div>

                    {/* 4 Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {['A', 'B', 'C', 'D'].map((label, optIdx) => (
                        <div
                          key={label}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                            currentMCQCorrect === optIdx
                              ? 'border-emerald-500 bg-emerald-50/50'
                              : 'border-[#E5E5E5] bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="mcq_correct_option"
                            checked={currentMCQCorrect === optIdx}
                            onChange={() => setCurrentMCQCorrect(optIdx)}
                            className="w-4 h-4 text-emerald-600 focus:ring-0 cursor-pointer"
                          />
                          <span className="text-xs font-black text-[#111111]">{label}:</span>
                          <input
                            type="text"
                            value={currentMCQOptions[optIdx] || ''}
                            onChange={(e) => {
                              const next = [...currentMCQOptions] as [string, string, string, string];
                              next[optIdx] = e.target.value;
                              setCurrentMCQOptions(next);
                            }}
                            placeholder={`Option ${label}`}
                            className="flex-1 h-7 px-2 rounded-lg border border-[#E5E5E5] text-xs font-medium"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    <div>
                      <label className="text-[11px] font-bold text-[#737373] block mb-1">
                        Explanation (Shown to students after test is graded)
                      </label>
                      <input
                        type="text"
                        value={currentMCQExplanation}
                        onChange={(e) => setCurrentMCQExplanation(e.target.value)}
                        placeholder="e.g. By Newton's second law, rate of change of momentum is force."
                        className="w-full h-8 px-3 rounded-lg border border-[#E5E5E5] text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      {editingMCQId && (
                        <button
                          onClick={() => {
                            setEditingMCQId(null);
                            setCurrentMCQText('');
                            setCurrentMCQOptions(['', '', '', '']);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-[#E5E5E5] text-xs font-bold"
                        >
                          Cancel Edit
                        </button>
                      )}
                      <button
                        onClick={handleSaveMCQ}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] text-[#F4C430] font-black text-xs cursor-pointer hover:bg-black shadow-xs"
                      >
                        <Plus size={14} />
                        <span>{editingMCQId ? 'Update MCQ' : 'Add MCQ to Test'}</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Added MCQs */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-[#111111]">
                      MCQ Section ({addedMCQs.length} Questions Added)
                    </h4>
                    {addedMCQs.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-3 rounded-xl bg-white border border-[#E5E5E5] flex items-start justify-between gap-3 shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-[#111111] text-white text-[10px] font-bold">
                              MCQ #{idx + 1}
                            </span>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              {q.marks} Mark
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#111111]">{q.question}</p>
                          <div className="grid grid-cols-2 gap-1.5 mt-2">
                            {q.options?.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className={`text-[11px] px-2 py-1 rounded-md border ${
                                  q.correctAnswer === oIdx
                                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900 font-bold'
                                    : 'border-[#F0F0F0] text-[#737373]'
                                }`}
                              >
                                {['A', 'B', 'C', 'D'][oIdx]}: {opt}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEditMCQ(q)}
                            className="p-1.5 rounded-lg text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5]"
                            title="Edit MCQ"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            title="Delete MCQ"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* TAB 2: SHORT QUESTION AUTHORING                               */}
              {/* ───────────────────────────────────────────────────────────── */}
              {activeAuthoringTab === 'short_question' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#111111]">
                          {editingShortId ? 'Edit Short Question' : 'Add Short Answer Question'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 flex items-center gap-1">
                          <Camera size={11} /> Photo Answer
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#737373]">Marks:</span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={currentShortMarks}
                          onChange={(e) => setCurrentShortMarks(Math.max(1, parseInt(e.target.value) || 4))}
                          className="w-14 h-8 text-center rounded-lg border border-[#E5E5E5] text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#737373] block mb-1">
                        Question Statement (LaTeX supported, e.g. $E = mc^2$)
                      </label>
                      <textarea
                        rows={2}
                        value={currentShortText}
                        onChange={(e) => setCurrentShortText(e.target.value)}
                        placeholder="e.g. Define uniform acceleration. State its formula and SI unit."
                        className="w-full p-2.5 rounded-xl border border-[#E5E5E5] text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                      />
                      {currentShortText && (
                        <div className="mt-1 p-2 rounded-lg bg-white border border-[#E5E5E5] text-xs">
                          <span className="text-[10px] font-bold text-[#737373] block">Live Preview:</span>
                          <MathText text={currentShortText} />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#737373] block mb-1">
                        Marking Guidelines / Rubric for Teacher
                      </label>
                      <input
                        type="text"
                        value={currentShortGuidelines}
                        onChange={(e) => setCurrentShortGuidelines(e.target.value)}
                        placeholder="e.g. 1 mark definition, 2 marks derivation, 1 mark SI unit."
                        className="w-full h-8 px-3 rounded-lg border border-[#E5E5E5] text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      {editingShortId && (
                        <button
                          onClick={() => {
                            setEditingShortId(null);
                            setCurrentShortText('');
                            setCurrentShortGuidelines('');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-[#E5E5E5] text-xs font-bold"
                        >
                          Cancel Edit
                        </button>
                      )}
                      <button
                        onClick={handleSaveShort}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] text-[#F4C430] font-black text-xs cursor-pointer hover:bg-black shadow-xs"
                      >
                        <Plus size={14} />
                        <span>{editingShortId ? 'Update Short Question' : 'Add Short Question'}</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Added Short Questions */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-[#111111]">
                      Short Question Section ({addedShorts.length} Questions Added)
                    </h4>
                    {addedShorts.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-3 rounded-xl bg-white border border-[#E5E5E5] flex items-start justify-between gap-3 shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-bold">
                              Short Q#{idx + 1}
                            </span>
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                              {q.marks} Marks
                            </span>
                            <span className="text-[10px] text-[#737373]">Camera Photo Answer</span>
                          </div>
                          <p className="text-xs font-bold text-[#111111]">{q.question}</p>
                          {q.guidelines && (
                            <p className="text-[11px] text-[#737373] mt-1 bg-[#FAFAFA] p-1.5 rounded-md">
                              <strong>Rubric:</strong> {q.guidelines}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEditShort(q)}
                            className="p-1.5 rounded-lg text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5]"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* TAB 3: LONG QUESTION AUTHORING                                */}
              {/* ───────────────────────────────────────────────────────────── */}
              {activeAuthoringTab === 'long_question' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#111111]">
                          {editingLongId ? 'Edit Long Question' : 'Add Long Answer Question'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 flex items-center gap-1">
                          <Camera size={11} /> Photo Answer
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#737373]">Marks:</span>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={currentLongMarks}
                          onChange={(e) => setCurrentLongMarks(Math.max(1, parseInt(e.target.value) || 8))}
                          className="w-14 h-8 text-center rounded-lg border border-[#E5E5E5] text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#737373] block mb-1">
                        Question Statement (LaTeX supported, e.g. formulas and equations)
                      </label>
                      <textarea
                        rows={3}
                        value={currentLongText}
                        onChange={(e) => setCurrentLongText(e.target.value)}
                        placeholder="e.g. State and explain the law of conservation of momentum. Derive mathematical expression for two colliding spheres."
                        className="w-full p-2.5 rounded-xl border border-[#E5E5E5] text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                      />
                      {currentLongText && (
                        <div className="mt-1 p-2 rounded-lg bg-white border border-[#E5E5E5] text-xs">
                          <span className="text-[10px] font-bold text-[#737373] block">Live Preview:</span>
                          <MathText text={currentLongText} />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#737373] block mb-1">
                        Marking Rubric & Sub-Part Breakdown
                      </label>
                      <input
                        type="text"
                        value={currentLongGuidelines}
                        onChange={(e) => setCurrentLongGuidelines(e.target.value)}
                        placeholder="e.g. 2 marks statement, 4 marks mathematical derivation, 2 marks diagram."
                        className="w-full h-8 px-3 rounded-lg border border-[#E5E5E5] text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      {editingLongId && (
                        <button
                          onClick={() => {
                            setEditingLongId(null);
                            setCurrentLongText('');
                            setCurrentLongGuidelines('');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-[#E5E5E5] text-xs font-bold"
                        >
                          Cancel Edit
                        </button>
                      )}
                      <button
                        onClick={handleSaveLong}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] text-[#F4C430] font-black text-xs cursor-pointer hover:bg-black shadow-xs"
                      >
                        <Plus size={14} />
                        <span>{editingLongId ? 'Update Long Question' : 'Add Long Question'}</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Added Long Questions */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-[#111111]">
                      Long Question Section ({addedLongs.length} Questions Added)
                    </h4>
                    {addedLongs.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-3 rounded-xl bg-white border border-[#E5E5E5] flex items-start justify-between gap-3 shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                              Long Q#{idx + 1}
                            </span>
                            <span className="text-[10px] font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                              {q.marks} Marks
                            </span>
                            <span className="text-[10px] text-[#737373]">Camera Photo Answer</span>
                          </div>
                          <p className="text-xs font-bold text-[#111111]">{q.question}</p>
                          {q.guidelines && (
                            <p className="text-[11px] text-[#737373] mt-1 bg-[#FAFAFA] p-1.5 rounded-md">
                              <strong>Rubric:</strong> {q.guidelines}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEditLong(q)}
                            className="p-1.5 rounded-lg text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5]"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* STEP 4: PREVIEW & PUBLISH                                          */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Summary Card */}
              <div className="p-5 rounded-3xl bg-[#111111] text-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#F4C430]">
                      {board.toUpperCase()} • Grade {grade} • {stream}
                    </span>
                    <h3 className="text-base sm:text-lg font-black mt-0.5">{title}</h3>
                    <p className="text-xs text-white/70 mt-0.5">{subject}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black text-[#F4C430]">{totalCalculatedMarks}</span>
                    <span className="text-xs text-white/60 block">Total Marks</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-white/60 text-[10px] block">Questions</span>
                    <strong className="text-white font-bold">{questions.length} Total</strong>
                  </div>
                  <div>
                    <span className="text-white/60 text-[10px] block">Duration</span>
                    <strong className="text-white font-bold">{durationMinutes} Minutes</strong>
                  </div>
                  <div>
                    <span className="text-white/60 text-[10px] block">Passing Marks</span>
                    <strong className="text-white font-bold">{passMarks} Marks</strong>
                  </div>
                  <div>
                    <span className="text-white/60 text-[10px] block">Due Date</span>
                    <strong className="text-white font-bold">{dueDate}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/10 flex-wrap">
                  {addedMCQs.length > 0 && (
                    <span className="px-2.5 py-1 rounded-xl bg-white/10 text-xs font-bold text-[#F4C430]">
                      {addedMCQs.length} MCQs ({addedMCQs.reduce((s, q) => s + q.marks, 0)} Marks)
                    </span>
                  )}
                  {addedShorts.length > 0 && (
                    <span className="px-2.5 py-1 rounded-xl bg-white/10 text-xs font-bold text-amber-300">
                      {addedShorts.length} Short Answers ({addedShorts.reduce((s, q) => s + q.marks, 0)} Marks)
                    </span>
                  )}
                  {addedLongs.length > 0 && (
                    <span className="px-2.5 py-1 rounded-xl bg-white/10 text-xs font-bold text-blue-300">
                      {addedLongs.length} Long Answers ({addedLongs.reduce((s, q) => s + q.marks, 0)} Marks)
                    </span>
                  )}
                </div>
              </div>

              {/* Questions Section Preview */}
              <div className="space-y-4">
                {/* Section A: MCQs */}
                {addedMCQs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-[#F4C430]" />
                        <span>Section A: Multiple Choice Questions ({addedMCQs.length})</span>
                      </h4>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        Auto-Graded
                      </span>
                    </div>

                    <div className="space-y-2">
                      {addedMCQs.map((q, idx) => (
                        <div key={q.id} className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-black text-[#111111]">Q{idx + 1}.</span>
                            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                              {q.marks} Mark
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#111111]">{q.question}</p>
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            {q.options?.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className={`text-[11px] p-2 rounded-xl border ${
                                  q.correctAnswer === oIdx
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                                    : 'border-[#E5E5E5] bg-white text-[#525252]'
                                }`}
                              >
                                {['A', 'B', 'C', 'D'][oIdx]}: {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section B: Short Questions */}
                {addedShorts.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-[#E5E5E5]">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                        <FileText size={14} className="text-amber-500" />
                        <span>Section B: Short Answer Questions ({addedShorts.length})</span>
                      </h4>
                      <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                        Camera Photo Answer • 24h R2
                      </span>
                    </div>

                    <div className="space-y-2">
                      {addedShorts.map((q, idx) => (
                        <div key={q.id} className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-black text-[#111111]">Short Q{idx + 1}.</span>
                            <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                              {q.marks} Marks
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#111111]">{q.question}</p>
                          {q.guidelines && (
                            <p className="text-[11px] text-[#737373] bg-white p-2 rounded-xl border border-[#E5E5E5]">
                              <strong>Teacher Rubric:</strong> {q.guidelines}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section C: Long Questions */}
                {addedLongs.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-[#E5E5E5]">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                        <BookOpen size={14} className="text-blue-500" />
                        <span>Section C: Long Answer Questions ({addedLongs.length})</span>
                      </h4>
                      <span className="text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                        Camera Photo Answer • 24h R2
                      </span>
                    </div>

                    <div className="space-y-2">
                      {addedLongs.map((q, idx) => (
                        <div key={q.id} className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-black text-[#111111]">Long Q{idx + 1}.</span>
                            <span className="font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded text-[10px]">
                              {q.marks} Marks
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#111111]">{q.question}</p>
                          {q.guidelines && (
                            <p className="text-[11px] text-[#737373] bg-white p-2 rounded-xl border border-[#E5E5E5]">
                              <strong>Teacher Rubric:</strong> {q.guidelines}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Navigation */}
        <div className="p-4 sm:p-5 border-t border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
          <div>
            {step > 1 ? (
              <button
                onClick={() => setStep((prev) => (prev - 1) as any)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-xs font-bold text-[#111111] cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-xs font-bold text-[#737373] cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step === 1 && (
              <button
                onClick={handleProceedFromStep1}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-[#F4C430] font-black text-xs cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <span>Continue to Test Details</span>
                <ArrowRight size={14} />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleProceedFromStep2}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-[#F4C430] font-black text-xs cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <span>Continue to Add Questions</span>
                <ArrowRight size={14} />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={() => {
                  if (questions.length === 0) {
                    toast.error('Please add at least one question before proceeding.');
                    return;
                  }
                  setStep(4);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-[#F4C430] font-black text-xs cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <span>Preview & Publish Test</span>
                <ArrowRight size={14} />
              </button>
            )}

            {step === 4 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={saving}
                  onClick={() => handleSaveTest('draft')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-xs font-black text-[#111111] cursor-pointer shadow-xs"
                >
                  <Save size={14} />
                  <span>Save as Draft</span>
                </button>
                <button
                  disabled={saving}
                  onClick={() => handleSaveTest('published')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  <Send size={14} />
                  <span>Publish to Students</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateUnifiedTestModal;
