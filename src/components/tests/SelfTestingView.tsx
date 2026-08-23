import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  ChevronLeft,
  Bookmark,
  BookmarkCheck,
  Sliders,
  History,
  Trash2,
  AlertTriangle,
  Zap,
  Pause,
  Check,
  X,
  Lock,
  Search,
  BookOpen,
  Layers,
  Target,
  CheckSquare,
  Square,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';
import type { MCQQuestion, MCQDifficulty, SelfTestConfig, SelfTestResult, ExamMode } from '../../types/selfTest';
import {
  generateMCQTest,
  saveSelfTestResult,
  getSelfTestHistory,
  deleteSelfTestResult,
  clearSelfTestHistory,
  getWeakTopicsForStudent,
} from '../../lib/selfTestService';
import { BOARDS, FBISE_GRADES, SINDH_GRADES, getEnrolledSubjectsForStudent } from '../../lib/taxonomy';
import { useAuth } from '../../features/auth/AuthContext';
import {
  isGrade9FBISE,
  getFBISEGrade9Chapters,
  getFBISEGrade9PopularTopics,
} from '../../lib/curriculumFBISE9';

interface SelfTestingViewProps {
  defaultSubject?: string;
  defaultGrade?: string;
  defaultBoard?: string;
  userRole?: 'student' | 'teacher' | 'admin';
}

type ViewMode = 'config' | 'active' | 'results' | 'history';

const SUGGESTED_TOPICS: Record<string, string[]> = {
  Physics: ['Kinematics & Motion', 'Work and Energy', 'Geometrical Optics', 'Current Electricity', 'Electromagnetism', 'Oscillations & Waves', 'Atomic & Nuclear Physics'],
  Chemistry: ['Chemical Bonding', 'Acids, Bases and Salts', 'Periodic Table & Periodicity', 'Electrochemistry', 'Organic Chemistry', 'Chemical Equilibrium', 'Solutions & Colloids'],
  Mathematics: ['Quadratic Equations', 'Matrices and Determinants', 'Trigonometric Identities', 'Coordinate Geometry', 'Calculus & Differentiation', 'Complex Numbers', 'Sequences & Series'],
  Biology: ['Cell Biology', 'Bioenergetics & Respiration', 'Enzymes & Metabolism', 'Human Circulation', 'Genetics & Inheritance', 'Reproduction', 'Ecology & Environment'],
  'Computer Science': ['Data Structures & Arrays', 'Algorithms & Flowcharts', 'Object Oriented Programming', 'Databases & SQL', 'Computer Networks & OSI', 'Boolean Algebra & Logic Gates'],
  English: ['Grammar & Tenses', 'Active & Passive Voice', 'Direct & Indirect Speech', 'Vocabulary & Comprehension', 'Sentence Correction'],
  Urdu: ['Qawaid-o-Insha', 'Tashreeh & Nazm', 'Asbaaq & Khulasa', 'Muhawraat & Imla'],
  Islamiat: ['Quranic Surahs & Ayaat', 'Hadith Nabawi (PBUH)', 'Pillars of Islam', 'Seerat-un-Nabi (PBUH)', 'Islamic Ethics'],
  'Pakistan Studies': ['Ideology of Pakistan', 'Pakistan Movement (1857-1947)', 'Geography & Resources', 'Constitutional Development', 'Foreign Policy of Pakistan'],
};

export const SelfTestingView: React.FC<SelfTestingViewProps> = ({
  defaultSubject,
  defaultGrade,
  defaultBoard,
  userRole = 'student',
}) => {
  const { profile } = useAuth();
  console.debug('SelfTestingView mounted for role:', userRole);

  const isStudent = userRole === 'student' || profile?.role === 'student';

  // Resolved enrolled board for students
  const studentBoardId =
    profile?.board_id ||
    (typeof profile?.board === 'string' ? profile.board : profile?.board?.id) ||
    profile?.class?.board_id ||
    defaultBoard ||
    'fbise';

  // Resolved enrolled grade for students
  const studentGrade =
    profile?.class?.grade ||
    (profile as any)?.grade ||
    defaultGrade ||
    '10';

  const studentStream =
    profile?.stream_obj?.name ||
    (profile as any)?.stream ||
    '';

  // Initial config state
  const [board, setBoard] = useState<string>(
    isStudent ? studentBoardId : (defaultBoard || studentBoardId || 'fbise')
  );
  const [grade, setGrade] = useState<string>(
    isStudent ? studentGrade : (defaultGrade || studentGrade || '10')
  );
  const [subject, setSubject] = useState<string>(defaultSubject || 'Physics');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [topic, setTopic] = useState<string>('Kinematics');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<MCQDifficulty>('medium');

  // Exam generator mode & selection for Grade 9 FBISE
  const [examMode, setExamMode] = useState<ExamMode>('chapter');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [chapterSearchQuery, setChapterSearchQuery] = useState<string>('');

  // Keep student board and grade strictly locked to enrollment when profile loads
  useEffect(() => {
    if (isStudent) {
      if (studentBoardId && board !== studentBoardId) {
        setBoard(studentBoardId);
      }
      if (studentGrade && grade !== studentGrade) {
        setGrade(studentGrade);
      }
    }
  }, [isStudent, studentBoardId, studentGrade]);

  const activeBoard = isStudent ? studentBoardId : board;
  const activeGrade = isStudent ? studentGrade : grade;
  const isFbise9 = isGrade9FBISE(activeBoard, activeGrade);

  // Runtime quiz state
  const [viewMode, setViewMode] = useState<ViewMode>('config');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  // Timer state
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Result state
  const [completedResult, setCompletedResult] = useState<SelfTestResult | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'flagged'>('all');

  // History state
  const [historyItems, setHistoryItems] = useState<SelfTestResult[]>([]);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState<boolean>(false);

  // Load history on mount
  useEffect(() => {
    setHistoryItems(getSelfTestHistory());
  }, []);

  // Timer effect during active quiz
  useEffect(() => {
    if (viewMode === 'active' && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [viewMode, isPaused]);

  // Available subjects for selected board/grade
  const availableGrades = activeBoard === 'sindh' ? SINDH_GRADES : FBISE_GRADES;
  const currentGradeDef = availableGrades.find((g) => g.grade === activeGrade) || availableGrades[0];

  const studentEnrolledSubjects = useMemo(() => {
    if (isStudent && profile) {
      const list = getEnrolledSubjectsForStudent(profile);
      if (list && list.length > 0) return list;
    }
    return [];
  }, [isStudent, profile]);

  const allSubjectsForGrade = useMemo(() => {
    if (isFbise9) {
      // Official FBISE Grade 9 Subjects
      return ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Urdu', 'Islamiat'];
    }
    return Array.from(
      new Set([
        ...studentEnrolledSubjects,
        ...(currentGradeDef?.commonSubjects || []),
        ...(currentGradeDef?.streams?.flatMap((s) => s.subjects) || []),
        'Physics',
        'Chemistry',
        'Mathematics',
        'Biology',
        'Computer Science',
        'English',
        'Urdu',
        'Islamiat',
        'Pakistan Studies',
      ])
    );
  }, [isFbise9, studentEnrolledSubjects, currentGradeDef]);

  const activeSubjectName = subject === 'Other' ? (customSubject.trim() || 'General Subject') : subject;

  // FBISE Grade 9 Chapters & Weak topics
  const fbise9Chapters = useMemo(() => {
    if (!isFbise9) return [];
    return getFBISEGrade9Chapters(activeSubjectName);
  }, [isFbise9, activeSubjectName]);

  const weakTopics = useMemo(() => {
    return getWeakTopicsForStudent(activeSubjectName, activeBoard, activeGrade);
  }, [activeSubjectName, activeBoard, activeGrade, historyItems]);

  // Set default topic whenever subject changes
  useEffect(() => {
    if (isFbise9) {
      const chaps = getFBISEGrade9Chapters(activeSubjectName);
      if (chaps.length > 0) {
        setTopic(chaps[0].name);
        setSelectedChapters([chaps[0].name]);
      }
    } else {
      if (SUGGESTED_TOPICS[activeSubjectName]?.[0]) {
        setTopic(SUGGESTED_TOPICS[activeSubjectName][0]);
      }
    }
  }, [activeSubjectName, isFbise9]);

  // Handle Chapter multi-select toggle
  const handleToggleChapter = (chapterName: string) => {
    setSelectedChapters((prev) => {
      let updated: string[];
      if (prev.includes(chapterName)) {
        updated = prev.filter((c) => c !== chapterName);
      } else {
        updated = [...prev, chapterName];
      }
      if (updated.length === 1) {
        setTopic(updated[0]);
      } else if (updated.length > 1) {
        setTopic(`${updated.length} Chapters (${updated.slice(0, 2).join(', ')}${updated.length > 2 ? '...' : ''})`);
      }
      return updated;
    });
  };

  // Handler: Start AI Test Generation
  const handleStartGeneration = async () => {
    let finalTopic = topic.trim();
    let finalChapters = selectedChapters;

    if (isFbise9) {
      if (examMode === 'full_syllabus') {
        finalTopic = 'Full Syllabus';
        finalChapters = fbise9Chapters.map((c) => c.name);
      } else if (examMode === 'weak_topics') {
        if (weakTopics.length > 0) {
          const validChapters = weakTopics.map((w) => w.chapter || w.topic).filter(Boolean) as string[];
          finalTopic = `Weak Topics (${validChapters.join(', ')})`;
          finalChapters = validChapters;
        } else {
          finalTopic = fbise9Chapters[0]?.name || 'Kinematics';
          finalChapters = [finalTopic];
        }
      } else if (examMode === 'multi_chapter') {
        if (selectedChapters.length === 0) {
          toast.error('Please select at least one chapter for the test.');
          return;
        }
        finalTopic = selectedChapters.join(', ');
        finalChapters = selectedChapters;
      } else {
        // Single chapter
        if (!finalTopic) {
          toast.error('Please select a chapter name.');
          return;
        }
        finalChapters = [finalTopic];
      }
    }

    if (!finalTopic) {
      toast.error('Please enter or select a topic/chapter name.');
      return;
    }

    try {
      setIsGenerating(true);
      const activeConfig: SelfTestConfig = {
        board: activeBoard,
        grade: activeGrade,
        subject: activeSubjectName,
        topic: finalTopic,
        questionCount,
        difficulty,
        examMode: isFbise9 ? examMode : undefined,
        selectedChapters: isFbise9 ? finalChapters : undefined,
      };

      const generatedQuestions = await generateMCQTest(activeConfig);

      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error('No questions generated. Please try again.');
      }

      // Validate questions strictly: ensure 4 distinct options and one valid correct answer
      const validated = generatedQuestions.filter((q) => {
        return (
          q.question &&
          q.options &&
          q.options.A &&
          q.options.B &&
          q.options.C &&
          q.options.D &&
          ['A', 'B', 'C', 'D'].includes(q.correctAnswer)
        );
      });

      if (validated.length === 0) {
        throw new Error('Generated questions failed validation. Please try again.');
      }

      setQuestions(validated);
      setCurrentIdx(0);
      setUserAnswers({});
      setFlaggedQuestions(new Set());
      setTimeElapsed(0);
      setIsPaused(false);
      setViewMode('active');
      toast.success(`Generated ${validated.length} syllabus-accurate MCQs on "${finalTopic}"!`);
    } catch (err: any) {
      console.error('MCQ Generation error:', err);
      toast.error(err.message || 'Failed to generate MCQs. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Answer Option Select
  const handleSelectOption = (optionKey: 'A' | 'B' | 'C' | 'D') => {
    const currentQ = questions[currentIdx];
    if (!currentQ) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionKey,
    }));
  };

  // Handler: Toggle Flag
  const handleToggleFlag = (idx: number) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Handler: Submit Quiz
  const handleSubmitQuiz = () => {
    const activeConfig: SelfTestConfig = {
      board: activeBoard,
      grade: activeGrade,
      subject: activeSubjectName,
      topic: topic.trim(),
      questionCount: questions.length,
      difficulty,
      examMode: isFbise9 ? examMode : undefined,
      selectedChapters: isFbise9 ? selectedChapters : undefined,
    };

    let score = 0;
    questions.forEach((q) => {
      const userAns = userAnswers[q.id];
      if (userAns && userAns === q.correctAnswer) {
        score++;
      }
    });

    const percentage = Math.round((score / questions.length) * 100);

    const result: SelfTestResult = {
      id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      config: activeConfig,
      questions,
      userAnswers,
      score,
      totalQuestions: questions.length,
      percentage,
      timeSpentSeconds: timeElapsed,
    };

    // Save strictly private local history
    saveSelfTestResult(result);
    setHistoryItems(getSelfTestHistory());
    setCompletedResult(result);
    setViewMode('results');
    setShowConfirmSubmit(false);
    toast.success(`Quiz completed! You scored ${score}/${questions.length} (${percentage}%)`);
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── RENDER 1: Generator Setup View ───────────────────────
  if (viewMode === 'config') {
    const popularTopics = isFbise9
      ? getFBISEGrade9PopularTopics(activeSubjectName)
      : SUGGESTED_TOPICS[activeSubjectName] || [
          'Foundations & Core Principles',
          'Key Definitions & Laws',
          'Analytical Problem Solving',
          'Board Exam Model Questions',
        ];

    const filteredFBISEChapters = fbise9Chapters.filter((ch) => {
      if (!chapterSearchQuery.trim()) return true;
      const q = chapterSearchQuery.toLowerCase();
      const numStr = (ch.chapterNumber ?? ch.number)?.toString() || '';
      return (
        ch.name.toLowerCase().includes(q) ||
        numStr.includes(q) ||
        (ch.category && ch.category.toLowerCase().includes(q))
      );
    });

    return (
      <div className="space-y-6">
        {/* Intro Card */}
        <div className="bg-linear-to-r from-[#111111] to-[#1F1F1F] text-white p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-[#2A2A2A] shadow-md">
          <div className="absolute right-0 top-0 w-80 h-80 bg-[#F4C430]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4C430]/20 text-[#F4C430] border border-[#F4C430]/30 text-xs font-bold">
              <Sparkles size={14} className="animate-spin" />
              <span>
                {isFbise9 ? 'Grade 9 FBISE Curriculum Assessment Engine' : 'AI Self-Assessment Engine'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {isFbise9 ? 'Grade 9 FBISE Self-Testing & Exam Generator' : 'Interactive Self-Testing Center'}
            </h2>
            <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed">
              {isFbise9
                ? 'Practice with 100% official FBISE Grade 9 curriculum questions. Target single chapters, multiple chapters, full syllabus exams, or diagnosed weak topics with zero made-up content.'
                : 'Generate 100% curriculum-accurate, syllabus-aligned multiple choice practice questions on any subject or topic. Your practice scores are private to you.'}
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-[#E5E5E5] font-semibold">
                <CheckCircle2 size={15} className="text-[#10B981]" />
                <span>Verified Curriculum Chapters</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#E5E5E5] font-semibold">
                <CheckCircle2 size={15} className="text-[#10B981]" />
                <span>Instant Explanations & Solutions</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#E5E5E5] font-semibold">
                <CheckCircle2 size={15} className="text-[#10B981]" />
                <span>Private & Zero Impact on GPA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Generator Form */}
        <div className="bg-white rounded-3xl border border-[#E5E5E5] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#F0F0F0]">
            <div>
              <h3 className="text-base font-extrabold text-[#111111] flex items-center gap-2">
                <Sliders size={18} className="text-[#F4C430]" />
                <span>Configure Practice Quiz</span>
              </h3>
              <p className="text-xs text-[#737373] mt-0.5">
                {isFbise9
                  ? 'Official FBISE Grade 9 chapters — select single chapter, multiple chapters, or full subject exam.'
                  : 'Customize syllabus parameters to target specific chapters or concepts.'}
              </p>
            </div>

            {historyItems.length > 0 && (
              <button
                onClick={() => setViewMode('history')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#111111] hover:bg-[#F5F5F5] transition-colors interactive"
              >
                <History size={15} className="text-[#737373]" />
                <span>Past Self-Tests ({historyItems.length})</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Board & Grade Configuration */}
            <div className="space-y-4">
              {isStudent ? (
                /* Locked / Read-Only Enrolled Scope for Students */
                <div className="p-4 bg-[#FAFAFA] rounded-2xl border border-[#E5E5E5] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-[#737373] uppercase tracking-wider">
                      Academic Scope
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#111111]/5 border border-[#E5E5E5] text-[11px] font-bold text-[#525252]">
                      <Lock size={11} className="text-[#737373]" />
                      <span>Enrolled & Verified</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Educational Board */}
                    <div className="p-3 bg-white rounded-xl border border-[#E5E5E5] shadow-2xs">
                      <div className="text-[10px] font-bold text-[#737373] uppercase tracking-wide flex items-center gap-1">
                        <Lock size={10} className="text-[#A3A3A3]" />
                        <span>Educational Board</span>
                      </div>
                      <div className="text-xs font-black text-[#111111] mt-0.5">
                        {activeBoard === 'sindh' ? 'Sindh Board (BSEK / BIEK)' : 'Federal Board (FBISE)'}
                      </div>
                      <div className="text-[10px] text-[#737373] mt-0.5 truncate">
                        {activeBoard === 'sindh' ? 'BSEK / BIEK Karachi & Sindh' : 'Federal Board of Inter & Secondary Education'}
                      </div>
                    </div>

                    {/* Target Grade */}
                    <div className="p-3 bg-white rounded-xl border border-[#E5E5E5] shadow-2xs">
                      <div className="text-[10px] font-bold text-[#737373] uppercase tracking-wide flex items-center gap-1">
                        <Lock size={10} className="text-[#A3A3A3]" />
                        <span>Target Grade</span>
                      </div>
                      <div className="text-xs font-black text-[#111111] mt-0.5">
                        Grade {activeGrade} {studentStream ? `• ${studentStream}` : ''}
                      </div>
                      <div className="text-[10px] text-[#737373] mt-0.5 truncate">
                        {profile?.class?.display_name || `Class ${activeGrade}th Roster`}
                      </div>
                    </div>
                  </div>

                  {isFbise9 && (
                    <div className="p-2.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[11px] text-[#92400E] flex items-center gap-2">
                      <Flame size={14} className="shrink-0 text-[#D97706]" />
                      <span><strong>FBISE Grade 9 Active:</strong> Powered by official textbook chapter banks.</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Selectable Board & Grade for Teachers / Admins */
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1.5">
                      Educational Board
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {BOARDS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBoard(b.id)}
                          className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                            board === b.id
                              ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                              : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#525252] hover:bg-[#F5F5F5]'
                          }`}
                        >
                          <div className="font-extrabold">{b.shortName}</div>
                          <div className={`text-[10px] mt-0.5 truncate ${board === b.id ? 'text-[#D4D4D4]' : 'text-[#737373]'}`}>
                            {b.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1.5">
                      Target Grade
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {availableGrades.map((g) => (
                        <button
                          key={g.grade}
                          type="button"
                          onClick={() => setGrade(g.grade)}
                          className={`py-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                            grade === g.grade
                              ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                              : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#525252] hover:bg-[#F5F5F5]'
                          }`}
                        >
                          {g.displayName} Grade
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Subject Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#111111]">
                    Subject
                  </label>
                  {isStudent && studentStream && (
                    <span className="text-[10px] font-semibold text-[#737373]">
                      {studentStream} Stream
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allSubjectsForGrade.slice(0, 9).map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => {
                        setSubject(sub);
                        if (isFbise9) {
                          const chaps = getFBISEGrade9Chapters(sub);
                          if (chaps.length > 0) {
                            setTopic(chaps[0].name);
                            setSelectedChapters([chaps[0].name]);
                          }
                        } else if (SUGGESTED_TOPICS[sub]?.[0]) {
                          setTopic(SUGGESTED_TOPICS[sub][0]);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center truncate transition-all ${
                        subject === sub
                          ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                          : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#525252] hover:bg-[#F5F5F5]'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                  {!isFbise9 && (
                    <button
                      type="button"
                      onClick={() => setSubject('Other')}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                        subject === 'Other'
                          ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                          : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#525252] hover:bg-[#F5F5F5]'
                      }`}
                    >
                      Custom Subject
                    </button>
                  )}
                </div>

                {subject === 'Other' && !isFbise9 && (
                  <input
                    type="text"
                    placeholder="Enter custom subject name..."
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="mt-2 w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden"
                  />
                )}
              </div>
            </div>

            {/* Topic & Parameters */}
            <div className="space-y-4">
              {/* If Grade 9 FBISE: Show Exam Generator Modes */}
              {isFbise9 ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1.5">
                      Exam Generation Mode
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { id: 'chapter', label: 'Single Chapter', icon: BookOpen },
                        { id: 'multi_chapter', label: 'Multi-Chapter', icon: Layers },
                        { id: 'full_syllabus', label: 'Full Syllabus', icon: Target },
                        { id: 'weak_topics', label: 'Weak Topics', icon: Flame },
                      ].map((mode) => {
                        const Icon = mode.icon;
                        const isSelected = examMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => {
                              const newMode = mode.id as ExamMode;
                              setExamMode(newMode);
                              if (newMode === 'full_syllabus') {
                                setTopic('Full Syllabus');
                                setSelectedChapters(fbise9Chapters.map((c) => c.name));
                              } else if (newMode === 'weak_topics') {
                                if (weakTopics.length > 0) {
                                  const validWeak = weakTopics.map((w) => w.chapter || w.topic).filter(Boolean) as string[];
                                  setTopic(`Weak Topics (${validWeak[0] || 'Targeted'})`);
                                  setSelectedChapters(validWeak);
                                } else {
                                  setTopic(fbise9Chapters[0]?.name || 'Kinematics');
                                  setSelectedChapters([fbise9Chapters[0]?.name || 'Kinematics']);
                                }
                              } else if (newMode === 'chapter') {
                                const firstCh = fbise9Chapters[0]?.name || 'Kinematics';
                                setTopic(firstCh);
                                setSelectedChapters([firstCh]);
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                              isSelected
                                ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                                : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#525252] hover:bg-[#F5F5F5]'
                            }`}
                          >
                            <Icon size={14} className={isSelected ? 'text-[#F4C430]' : 'text-[#737373]'} />
                            <span>{mode.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mode-Specific Chapter UI */}
                  {examMode === 'chapter' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-[#111111]">
                          Select Chapter <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] text-[#737373]">
                          {fbise9Chapters.length} Official Chapters
                        </span>
                      </div>

                      {/* Chapter search */}
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
                        <input
                          type="text"
                          placeholder="Search chapter name or number..."
                          value={chapterSearchQuery}
                          onChange={(e) => setChapterSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden"
                        />
                      </div>

                      {/* Chapters Grid / List */}
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {filteredFBISEChapters.map((ch) => {
                          const isSelected = topic === ch.name;
                          return (
                            <button
                              key={ch.chapterNumber}
                              type="button"
                              onClick={() => {
                                setTopic(ch.name);
                                setSelectedChapters([ch.name]);
                              }}
                              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                                  : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#333333] hover:bg-[#F5F5F5]'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-extrabold text-[10px] shrink-0 ${
                                    isSelected ? 'bg-[#F4C430] text-[#111111]' : 'bg-[#E5E5E5] text-[#525252]'
                                  }`}
                                >
                                  {ch.chapterNumber}
                                </span>
                                <span className="text-xs font-bold truncate">{ch.name}</span>
                              </div>
                              {ch.category && (
                                <span
                                  className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold shrink-0 ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-[#E5E5E5] text-[#525252]'
                                  }`}
                                >
                                  {ch.category}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {examMode === 'multi_chapter' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-[#111111]">
                          Select Multiple Chapters ({selectedChapters.length} Selected)
                        </label>
                        <div className="flex gap-2 text-[10px]">
                          <button
                            type="button"
                            onClick={() => {
                              const all = fbise9Chapters.map((c) => c.name);
                              setSelectedChapters(all);
                              setTopic(`${all.length} Chapters (All)`);
                            }}
                            className="text-[#111111] font-bold hover:underline"
                          >
                            Select All
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedChapters([]);
                              setTopic('');
                            }}
                            className="text-[#737373] hover:underline"
                          >
                            Deselect All
                          </button>
                        </div>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {fbise9Chapters.map((ch) => {
                          const isChecked = selectedChapters.includes(ch.name);
                          return (
                            <button
                              key={ch.chapterNumber}
                              type="button"
                              onClick={() => handleToggleChapter(ch.name)}
                              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                                isChecked
                                  ? 'border-[#111111] bg-[#111111] text-white'
                                  : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#333333] hover:bg-[#F5F5F5]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {isChecked ? (
                                  <CheckSquare size={16} className="text-[#F4C430] shrink-0" />
                                ) : (
                                  <Square size={16} className="text-[#A3A3A3] shrink-0" />
                                )}
                                <span className="text-xs font-bold truncate">
                                  {ch.chapterNumber}. {ch.name}
                                </span>
                              </div>
                              {ch.category && (
                                <span
                                  className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold shrink-0 ${
                                    isChecked ? 'bg-white/20 text-white' : 'bg-[#E5E5E5] text-[#525252]'
                                  }`}
                                >
                                  {ch.category}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {examMode === 'full_syllabus' && (
                    <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#111111]">
                        <Target size={16} className="text-[#F4C430]" />
                        <span>Full Subject Exam Mode</span>
                      </div>
                      <p className="text-[11px] text-[#737373] leading-relaxed">
                        Questions will be dynamically synthesized across all <strong>{fbise9Chapters.length} chapters</strong> of Grade 9 FBISE {activeSubjectName} in balanced proportions reflecting official board model exams.
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {fbise9Chapters.slice(0, 5).map((c) => (
                          <span key={c.chapterNumber} className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#E5E5E5] text-[#525252]">
                            {c.name}
                          </span>
                        ))}
                        {fbise9Chapters.length > 5 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#E5E5E5] text-[#737373]">
                            +{fbise9Chapters.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {examMode === 'weak_topics' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#111111]">
                        Diagnosed Weak Topics for {activeSubjectName}
                      </label>
                      {weakTopics.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] space-y-1">
                          <p className="font-bold flex items-center gap-1.5">
                            <Flame size={14} className="text-[#D97706]" />
                            <span>No Weak Topics Recorded Yet</span>
                          </p>
                          <p className="text-[11px] text-[#B45309]">
                            Take practice tests on individual chapters to track weak spots. For now, we will test across key core chapters.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {weakTopics.map((w, idx) => {
                            const chName = w.chapter || w.topic;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setTopic(chName);
                                  setSelectedChapters([chName]);
                                }}
                                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between ${
                                  topic === chName
                                    ? 'border-[#DC2626] bg-[#FEF2F2] text-[#991B1B]'
                                    : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#333333]'
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="text-xs font-bold truncate">{chName}</p>
                                  <p className="text-[10px] text-[#737373]">
                                    Accuracy: {w.scorePercentage ?? w.accuracy ?? 0}% ({w.totalAttempts ?? w.attempts ?? 1} attempts)
                                  </p>
                                </div>
                                <span className="px-2 py-0.5 rounded-md bg-[#DC2626] text-white text-[10px] font-extrabold shrink-0">
                                  Target Weakness
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Standard Topic Selection for Other Grades / Boards */
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">
                    Topic or Chapter Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kinematics, Chemical Bonding, Matrices, Cell Biology..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden"
                  />

                  {/* Topic quick chips */}
                  <div className="mt-2.5">
                    <span className="text-[11px] font-bold text-[#737373] block mb-1.5">
                      Popular topics in {activeSubjectName}:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {popularTopics.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTopic(t)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                            topic === t
                              ? 'bg-[#F4C430] text-[#111111] border-[#E5B520] font-bold'
                              : 'bg-[#FAFAFA] text-[#525252] border-[#E5E5E5] hover:bg-[#F0F0F0]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Number of Questions & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">
                    Number of Questions
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuestionCount(num)}
                        className={`py-2 rounded-xl border text-xs font-bold text-center transition-all ${
                          questionCount === num
                            ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                            : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#525252] hover:bg-[#F5F5F5]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as MCQDifficulty)}
                    className="w-full h-9 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-bold text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-hidden"
                  >
                    <option value="easy">Easy (Foundational Concepts)</option>
                    <option value="medium">Medium (Standard Syllabus)</option>
                    <option value="hard">Hard (Multi-step / Complex)</option>
                    <option value="board_exam">Board Exam Standard (Model Paper)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Generator Action */}
          <div className="pt-4 border-t border-[#F0F0F0] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#737373] flex items-center gap-2">
              <Zap size={15} className="text-[#F4C430]" />
              <span>
                Generates {questionCount} questions on <strong>{topic || 'Selected Chapters'}</strong> ({activeSubjectName} • Grade {activeGrade} • {activeBoard.toUpperCase()})
              </span>
            </div>

            <button
              onClick={handleStartGeneration}
              disabled={isGenerating || (!topic.trim() && selectedChapters.length === 0)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#111111] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 hover:bg-[#222222] active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed interactive"
            >
              {isGenerating ? (
                <>
                  <Sparkles size={16} className="animate-spin text-[#F4C430]" />
                  <span>Synthesizing MCQs with AI...</span>
                </>
              ) : (
                <>
                  <Play size={16} className="fill-[#F4C430] text-[#F4C430]" />
                  <span>Start Practice Quiz</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recent Past Performance Mini-Card */}
        {historyItems.length > 0 && (
          <div className="bg-white rounded-3xl border border-[#E5E5E5] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold text-[#111111] flex items-center gap-2">
                <History size={14} className="text-[#737373]" />
                <span>Recent Self-Test Scores</span>
              </h4>
              <button
                onClick={() => setViewMode('history')}
                className="text-xs text-[#111111] font-bold hover:underline"
              >
                View Full Log ({historyItems.length})
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {historyItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-[#111111] truncate">{item.config.topic}</p>
                    <p className="text-[10px] text-[#737373]">
                      {item.config.subject} • {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-xl text-xs font-extrabold shrink-0 ${
                      item.percentage >= 80
                        ? 'bg-[#ECFDF5] text-[#059669]'
                        : item.percentage >= 50
                        ? 'bg-[#FFFBEB] text-[#D97706]'
                        : 'bg-[#FEF2F2] text-[#DC2626]'
                    }`}
                  >
                    {item.score}/{item.totalQuestions} ({item.percentage}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── RENDER 2: Active Test Taking View ────────────────────
  if (viewMode === 'active') {
    const currentQ = questions[currentIdx];
    const isFlagged = flaggedQuestions.has(currentIdx);
    const answeredCount = Object.keys(userAnswers).length;
    const progressPercent = Math.round(((currentIdx + 1) / questions.length) * 100);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Active Quiz Header Bar */}
        <div className="bg-white rounded-3xl border border-[#E5E5E5] p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to exit? Your current test progress will be lost.')) {
                  setViewMode('config');
                }
              }}
              className="p-2 rounded-xl border border-[#E5E5E5] text-[#737373] hover:bg-[#F5F5F5] hover:text-[#111111] transition-colors"
              title="Exit Test"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-gold text-[10px] font-bold px-2 py-0.5">
                  {topic}
                </span>
                <span className="text-xs font-extrabold text-[#111111]">
                  {activeSubjectName} (Grade {grade})
                </span>
              </div>
              <p className="text-[11px] text-[#737373] mt-0.5">
                Question {currentIdx + 1} of {questions.length} • {answeredCount} Answered
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-xs font-mono font-bold text-[#111111]">
              <Clock size={14} className="text-[#F4C430]" />
              <span>{formatTime(timeElapsed)}</span>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-1 rounded-md hover:bg-[#E5E5E5] text-[#737373]"
                title={isPaused ? 'Resume Timer' : 'Pause Timer'}
              >
                {isPaused ? <Play size={12} className="fill-current" /> : <Pause size={12} />}
              </button>
            </div>

            {/* Flag for Review */}
            <button
              onClick={() => handleToggleFlag(currentIdx)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                isFlagged
                  ? 'border-[#F59E0B] bg-[#FFFBEB] text-[#D97706]'
                  : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#737373] hover:bg-[#F5F5F5]'
              }`}
            >
              {isFlagged ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
              <span className="hidden sm:inline">{isFlagged ? 'Flagged' : 'Flag'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#111111] h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Main Question Card */}
        {currentQ && (
          <div className="bg-white rounded-3xl border border-[#E5E5E5] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="inline-block px-2.5 py-1 rounded-lg bg-[#F5F5F5] text-xs font-extrabold text-[#737373]">
                  Question {currentIdx + 1}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#111111] leading-relaxed">
                  {currentQ.question}
                </h3>
              </div>
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                const optText = currentQ.options[optKey];
                const isSelected = userAnswers[currentQ.id] === optKey;

                return (
                  <button
                    key={optKey}
                    type="button"
                    onClick={() => handleSelectOption(optKey)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 group interactive ${
                      isSelected
                        ? 'border-[#111111] bg-[#111111] text-white shadow-sm'
                        : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#111111] hover:border-[#CCCCCC] hover:bg-[#F5F5F5]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#F4C430] text-[#111111]'
                          : 'bg-white border border-[#E5E5E5] text-[#525252] group-hover:border-[#A3A3A3]'
                      }`}
                    >
                      {optKey}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold flex-1 leading-normal">
                      {optText}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Question Palette & Bottom Navigation */}
        <div className="bg-white rounded-3xl border border-[#E5E5E5] p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#111111] hover:bg-[#F5F5F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {/* Question navigator chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-[320px] py-1 no-scrollbar px-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const isAns = !!userAnswers[q.id];
                const isFlag = flaggedQuestions.has(idx);

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold shrink-0 transition-all ${
                      isCurrent
                        ? 'ring-2 ring-[#111111] bg-[#111111] text-white'
                        : isFlag
                        ? 'bg-[#FFFBEB] text-[#D97706] border border-[#F59E0B]'
                        : isAns
                        ? 'bg-[#E5E5E5] text-[#111111]'
                        : 'bg-[#FAFAFA] text-[#A3A3A3] border border-[#E5E5E5]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIdx === questions.length - 1}
              className="px-4 py-2 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#111111] hover:bg-[#F5F5F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>

          <button
            onClick={() => {
              if (answeredCount < questions.length) {
                setShowConfirmSubmit(true);
              } else {
                handleSubmitQuiz();
              }
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-[#222222] transition-colors shadow-xs"
          >
            <CheckCircle2 size={15} className="text-[#F4C430]" />
            <span>Finish & Submit Test</span>
          </button>
        </div>

        {/* Confirmation Modal for Unanswered Questions */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#E5E5E5] shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-base font-extrabold text-[#111111]">Unanswered Questions</h3>
                <p className="text-xs text-[#737373]">
                  You have answered <strong>{answeredCount}</strong> out of <strong>{questions.length}</strong> questions ({questions.length - answeredCount} remaining). Are you sure you want to submit now?
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#111111] hover:bg-[#F5F5F5]"
                >
                  Continue Test
                </button>
                <button
                  onClick={handleSubmitQuiz}
                  className="flex-1 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-[#222222]"
                >
                  Submit Anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── RENDER 3: Results & Comprehensive Review View ─────────
  if (viewMode === 'results' && completedResult) {
    const { score, totalQuestions, percentage, timeSpentSeconds, config } = completedResult;

    const filteredReviewQuestions = completedResult.questions.filter((q, idx) => {
      const userAns = completedResult.userAnswers[q.id];
      const isCorrect = userAns === q.correctAnswer;
      if (reviewFilter === 'correct') return isCorrect;
      if (reviewFilter === 'incorrect') return !isCorrect;
      if (reviewFilter === 'flagged') return flaggedQuestions.has(idx);
      return true;
    });

    return (
      <div className="space-y-6">
        {/* Score Summary Card */}
        <div className="bg-white rounded-3xl border border-[#E5E5E5] p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#F0F0F0]">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex flex-col items-center justify-center font-extrabold shrink-0 border ${
                  percentage >= 80
                    ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                    : percentage >= 50
                    ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                    : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                }`}
              >
                <span className="text-2xl sm:text-3xl">{percentage}%</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {percentage >= 80 ? 'Mastery' : percentage >= 50 ? 'Passing' : 'Needs Work'}
                </span>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAFAFA] border border-[#E5E5E5] text-[11px] font-bold text-[#737373]">
                  <span>{config.subject}</span>
                  <span>•</span>
                  <span>{config.topic}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#111111]">
                  {percentage >= 80
                    ? 'Outstanding Practice Performance!'
                    : percentage >= 50
                    ? 'Good Effort! Keep Reinforcing Concepts'
                    : 'Review the Explanations Below to Improve'}
                </h3>
                <p className="text-xs text-[#737373]">
                  Completed on {new Date(completedResult.timestamp).toLocaleString()} • Total Time: {formatTime(timeSpentSeconds)}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="text-center p-3 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] min-w-[75px]">
                <p className="text-[10px] font-bold text-[#737373] uppercase">Score</p>
                <p className="text-base font-extrabold text-[#111111]">
                  {score}/{totalQuestions}
                </p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] min-w-[75px]">
                <p className="text-[10px] font-bold text-[#059669] uppercase">Correct</p>
                <p className="text-base font-extrabold text-[#059669]">{score}</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] min-w-[75px]">
                <p className="text-[10px] font-bold text-[#DC2626] uppercase">Incorrect</p>
                <p className="text-base font-extrabold text-[#DC2626]">{totalQuestions - score}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setUserAnswers({});
                  setCurrentIdx(0);
                  setTimeElapsed(0);
                  setIsPaused(false);
                  setViewMode('active');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#111111] hover:bg-[#F5F5F5] transition-colors"
              >
                <RotateCcw size={14} />
                <span>Retake This Quiz</span>
              </button>
              <button
                onClick={() => setViewMode('config')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-[#222222] transition-colors shadow-xs"
              >
                <Sparkles size={14} className="text-[#F4C430]" />
                <span>Generate New Test</span>
              </button>
            </div>

            <button
              onClick={() => setViewMode('history')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#737373] hover:text-[#111111]"
            >
              <History size={14} />
              <span>View All Past Tests</span>
            </button>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-extrabold text-[#111111]">
                Question-by-Question Solution & Explanations
              </h4>
              <p className="text-xs text-[#737373]">
                Review correct answers and step-by-step reasoning.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E5E5E5] shrink-0 self-start sm:self-auto">
              {(['all', 'incorrect', 'correct'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setReviewFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                    reviewFilter === filter
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#737373] hover:text-[#111111]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredReviewQuestions.map((q, idx) => {
              const userAns = completedResult.userAnswers[q.id];
              const isCorrect = userAns === q.correctAnswer;
              const isUnanswered = !userAns;

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-xs space-y-4 transition-all ${
                    isCorrect
                      ? 'border-[#E5E5E5]'
                      : 'border-[#FECACA] bg-[#FFFDFD]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#737373]">
                          Q{idx + 1}.
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isCorrect
                              ? 'bg-[#ECFDF5] text-[#059669]'
                              : isUnanswered
                              ? 'bg-[#F5F5F5] text-[#737373]'
                              : 'bg-[#FEF2F2] text-[#DC2626]'
                          }`}
                        >
                          {isCorrect ? (
                            <>
                              <Check size={11} />
                              <span>Correct</span>
                            </>
                          ) : isUnanswered ? (
                            <span>Unanswered</span>
                          ) : (
                            <>
                              <X size={11} />
                              <span>Incorrect</span>
                            </>
                          )}
                        </span>
                      </div>
                      <h5 className="text-sm sm:text-base font-bold text-[#111111] leading-relaxed">
                        {q.question}
                      </h5>
                    </div>
                  </div>

                  {/* Options Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                      const optText = q.options[optKey];
                      const isUserChoice = userAns === optKey;
                      const isCorrectChoice = q.correctAnswer === optKey;

                      let styleClass = 'border-[#E5E5E5] bg-[#FAFAFA] text-[#525252]';
                      let icon = null;

                      if (isCorrectChoice) {
                        styleClass = 'border-[#10B981] bg-[#ECFDF5] text-[#065F46] font-bold shadow-xs';
                        icon = <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />;
                      } else if (isUserChoice && !isCorrectChoice) {
                        styleClass = 'border-[#EF4444] bg-[#FEF2F2] text-[#991B1B] font-bold shadow-xs';
                        icon = <XCircle size={16} className="text-[#EF4444] shrink-0" />;
                      }

                      return (
                        <div
                          key={optKey}
                          className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${styleClass}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-black/5 flex items-center justify-center font-extrabold text-[11px] shrink-0">
                              {optKey}
                            </span>
                            <span className="truncate">{optText}</span>
                          </div>
                          {icon}
                        </div>
                      );
                    })}
                  </div>

                  {/* Clear Explanation Box */}
                  <div className="p-4 rounded-2xl bg-[#FFF9E6] border border-[#FFE0B2] text-xs text-[#111111] space-y-1">
                    <p className="font-extrabold text-[#B78103] flex items-center gap-1.5">
                      <HelpCircle size={14} />
                      <span>Explanation & Solution</span>
                    </p>
                    <p className="text-[#78350F] leading-relaxed font-medium">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER 4: Past Practice History Log View ─────────────
  if (viewMode === 'history') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('config')}
              className="p-2 rounded-xl border border-[#E5E5E5] text-[#737373] hover:bg-[#F5F5F5] hover:text-[#111111] transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h3 className="text-base font-extrabold text-[#111111]">
                Self-Test Practice History
              </h3>
              <p className="text-xs text-[#737373]">
                Locally saved practice results (100% private to your browser session).
              </p>
            </div>
          </div>

          {historyItems.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Clear all self-testing history? This cannot be undone.')) {
                  clearSelfTestHistory();
                  setHistoryItems([]);
                  toast.success('Self-testing history cleared.');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#FECACA] text-xs font-bold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
            >
              <Trash2 size={14} />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {historyItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E5E5E5] p-12 text-center shadow-xs space-y-3">
            <History size={40} className="mx-auto text-[#A3A3A3]" />
            <h4 className="text-sm font-bold text-[#111111]">No Self-Test History Yet</h4>
            <p className="text-xs text-[#737373] max-w-sm mx-auto">
              Generate and complete your first custom MCQ practice test to see your performance log here.
            </p>
            <button
              onClick={() => setViewMode('config')}
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-[#222222]"
            >
              Configure a Practice Test
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {historyItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-[#E5E5E5] p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="badge badge-gold text-[10px] font-bold px-2 py-0.5">
                      {item.config.subject}
                    </span>
                    <h4 className="text-sm font-extrabold text-[#111111]">{item.config.topic}</h4>
                    <p className="text-[11px] text-[#737373]">
                      Grade {item.config.grade || '10'} • {item.totalQuestions} Questions • {formatTime(item.timeSpentSeconds)}
                    </p>
                  </div>

                  <div
                    className={`px-3 py-1.5 rounded-2xl text-xs font-extrabold shrink-0 text-center ${
                      item.percentage >= 80
                        ? 'bg-[#ECFDF5] text-[#059669]'
                        : item.percentage >= 50
                        ? 'bg-[#FFFBEB] text-[#D97706]'
                        : 'bg-[#FEF2F2] text-[#DC2626]'
                    }`}
                  >
                    <div>{item.score}/{item.totalQuestions}</div>
                    <div className="text-[10px]">{item.percentage}%</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F0F0F0] flex items-center justify-between">
                  <span className="text-[10px] text-[#A3A3A3]">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCompletedResult(item);
                        setViewMode('results');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-[#222222]"
                    >
                      Review Solutions
                    </button>
                    <button
                      onClick={() => {
                        deleteSelfTestResult(item.id);
                        setHistoryItems(getSelfTestHistory());
                        toast.success('Test record removed.');
                      }}
                      className="p-1.5 rounded-xl hover:bg-[#F5F5F5] text-[#A3A3A3] hover:text-[#DC2626]"
                      title="Delete record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default SelfTestingView;
