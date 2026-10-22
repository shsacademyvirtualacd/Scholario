import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  CheckCircle2,
  RotateCcw,
  GraduationCap,
  AlignLeft,
  FileQuestion,
  Edit3,
  Plus,
  X,
  Save,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Eye,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { MathText } from '../../common/MathText';
import { useModalScrollLock } from '../../../hooks/useModalScrollLock';
import {
  loadBankData,
  refreshLiveBankData,
  getStoredShortQuestions,
  getStoredLongQuestions,
  updateMCQQuestionInBank,
} from '../../../lib/questionBankService';
import { BOARDS, getGradesForBoard } from '../../../lib/taxonomy';
import {
  FBISE_GRADE_9_CURRICULUM,
  FBISE_GRADE_10_CURRICULUM,
  normalizeFBISEGrade9Subject,
} from '../../../lib/curriculumFBISE9';
import { IELTS_CURRICULUM, isIELTSBoard } from '../../../lib/curriculumIELTS';
import type {
  StoredMCQ,
  StoredShortQuestion,
  StoredLongQuestion,
} from '../../../types/questionBank';

interface AdminMCQVerificationViewProps {
  initialBoard?: string;
  initialGrade?: string;
  initialSubject?: string;
  initialChapter?: string;
}

type BankTab = 'mcq' | 'short' | 'long';

const BOARD_SHORT_NAMES: Record<string, string> = {
  fbise: 'FBISE',
  punjab: 'Punjab',
  sindh: 'Sindh',
  kpk: 'KPK',
  olevel: 'O Levels',
  alevel: 'A Levels',
  ielts: 'IELTS',
};

const PAGE_SIZE = 20;

export const AdminMCQVerificationView: React.FC<AdminMCQVerificationViewProps> = ({
  initialBoard = 'fbise',
  initialGrade = '9',
  initialSubject = 'Physics',
  initialChapter,
}) => {
  // Navigation Hierarchy State
  const [selectedBoard, setSelectedBoard] = useState<string>(initialBoard);
  const [selectedGrade, setSelectedGrade] = useState<string>(initialGrade);
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject);
  const [selectedChapter, setSelectedChapter] = useState<string>(initialChapter || '');

  // Bank Type Switcher: 'mcq' | 'short' | 'long'
  const [bankTab, setBankTab] = useState<BankTab>('mcq');

  // Live Storage Bank State (MCQs)
  const [liveBank, setLiveBank] = useState<Record<string, Record<string, StoredMCQ[]>>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters and UI State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [chapterSearchQuery, setChapterSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Explanation expand states
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState<boolean>(false);

  // Pagination & jump
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jumpInput, setJumpInput] = useState<string>('');

  // Tablet & Mobile UI controls
  const [tabletChapterOpen, setTabletChapterOpen] = useState<boolean>(false);
  const [mobileChapterSheetOpen, setMobileChapterSheetOpen] = useState<boolean>(false);
  const [mobileFilterSheetOpen, setMobileFilterSheetOpen] = useState<boolean>(false);
  const [topMenuOpen, setTopMenuOpen] = useState<boolean>(false);
  const topMenuRef = useRef<HTMLDivElement>(null);

  // Edit / Add Question Drawer State
  const [editingMCQ, setEditingMCQ] = useState<StoredMCQ | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSavingMCQ, setIsSavingMCQ] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<{
    id: string;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>({
    id: '',
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: '',
    difficulty: 'medium',
  });

  useModalScrollLock(isDrawerOpen);
  useModalScrollLock(mobileChapterSheetOpen);
  useModalScrollLock(mobileFilterSheetOpen);

  // Close top action menu on click outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (topMenuRef.current && !topMenuRef.current.contains(e.target as Node)) {
        setTopMenuOpen(false);
      }
    };
    if (topMenuOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [topMenuOpen]);

  // Reset page when chapter, subject, or tab changes
  useEffect(() => {
    setCurrentPage(1);
    setExpandedExplanations({});
    setAllExpanded(false);
  }, [selectedChapter, selectedSubject, selectedGrade, selectedBoard, bankTab]);

  // Fetch live MCQ bank data from storage
  const fetchLiveBank = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const isIelts = isIELTSBoard(selectedBoard);
      const isPunjab = selectedBoard === 'punjab';
      const targetBoard = isIelts ? 'ielts' : (isPunjab ? 'punjab' : 'fbise');
      const bankData = isManualRefresh
        ? await refreshLiveBankData(targetBoard)
        : await loadBankData(false, targetBoard);
      setLiveBank(bankData || {});

      if (isManualRefresh) {
        let totalCount = 0;
        Object.values(bankData || {}).forEach((subj) => {
          Object.values(subj || {}).forEach((chList) => {
            totalCount += (chList || []).length;
          });
        });
        toast.success(`Storage synchronized: ${totalCount.toLocaleString()} total questions available.`);
      }
    } catch (err: any) {
      console.error('[MCQVerification] Failed to fetch live bank:', err);
      toast.error('Failed to load question bank: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBoard]);

  useEffect(() => {
    fetchLiveBank();
  }, [fetchLiveBank]);

  // Compute available grades for the selected board
  const availableGrades = useMemo(() => {
    return getGradesForBoard(selectedBoard);
  }, [selectedBoard]);

  useEffect(() => {
    if (availableGrades.length > 0 && !availableGrades.some((g) => g.grade === selectedGrade)) {
      setSelectedGrade(availableGrades[0].grade);
    }
  }, [availableGrades, selectedGrade]);

  const currentGradeDef = useMemo(() => {
    return availableGrades.find((g) => g.grade === selectedGrade) || availableGrades[0];
  }, [availableGrades, selectedGrade]);

  // Available subjects for the selected grade and board
  const availableSubjects = useMemo(() => {
    if (!currentGradeDef) return [];
    const subjectsSet = new Set<string>();

    currentGradeDef.commonSubjects?.forEach((s) => subjectsSet.add(s));
    currentGradeDef.streams?.forEach((st) => st.subjects.forEach((s) => subjectsSet.add(s)));

    if (isIELTSBoard(selectedBoard)) {
      Object.keys(IELTS_CURRICULUM).forEach((s) => subjectsSet.add(s));
      Object.keys(liveBank).forEach((s) => subjectsSet.add(s));
    } else if (selectedGrade === '9' && (selectedBoard === 'fbise' || selectedBoard === 'punjab')) {
      Object.keys(FBISE_GRADE_9_CURRICULUM).forEach((s) => subjectsSet.add(s));
      Object.keys(liveBank).forEach((s) => subjectsSet.add(s));
    }

    return Array.from(subjectsSet);
  }, [currentGradeDef, selectedGrade, selectedBoard, liveBank]);

  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[0]);
    }
  }, [availableSubjects, selectedSubject]);

  // Compute chapters for the selected subject
  const currentChapters = useMemo(() => {
    if (isIELTSBoard(selectedBoard)) {
      const curData = IELTS_CURRICULUM[selectedSubject];
      if (curData && curData.chapters && curData.chapters.length > 0) {
        return curData.chapters.map((ch, idx) => ({
          number: ch.number || idx + 1,
          name: ch.name,
          category: ch.category,
          subtopics: ch.subtopics,
        }));
      }
    }

    if (selectedGrade === '9' && (selectedBoard === 'fbise' || selectedBoard === 'punjab')) {
      const canonical = normalizeFBISEGrade9Subject(selectedSubject) || selectedSubject;
      const curData = FBISE_GRADE_9_CURRICULUM[canonical];
      if (curData && curData.chapters && curData.chapters.length > 0) {
        return curData.chapters.map((ch, idx) => ({
          number: ch.number || idx + 1,
          name: ch.name,
          category: ch.category,
          subtopics: ch.subtopics,
        }));
      }
    }

    if (selectedGrade === '10' && selectedBoard === 'fbise') {
      const curData = FBISE_GRADE_10_CURRICULUM[selectedSubject];
      if (curData && curData.chapters && curData.chapters.length > 0) {
        return curData.chapters.map((ch, idx) => ({
          number: ch.number || idx + 1,
          name: ch.name,
          category: ch.category,
          subtopics: ch.subtopics,
        }));
      }
    }

    const subjData = liveBank[selectedSubject] || {};
    const bankChapters = Object.keys(subjData);
    if (bankChapters.length > 0) {
      return bankChapters.map((name, idx) => ({
        number: idx + 1,
        name,
        category: undefined,
        subtopics: undefined,
      }));
    }

    return [];
  }, [selectedGrade, selectedBoard, selectedSubject, liveBank]);

  useEffect(() => {
    if (currentChapters.length > 0) {
      const exists = currentChapters.some((c) => c.name === selectedChapter);
      if (!exists) {
        setSelectedChapter(currentChapters[0].name);
      }
    } else {
      setSelectedChapter('');
    }
  }, [currentChapters, selectedChapter]);

  // Counts & Statistics
  const bankGrandTotal = useMemo(() => {
    let sum = 0;
    Object.values(liveBank).forEach((subj) => {
      Object.values(subj).forEach((chList) => {
        sum += (chList || []).length;
      });
    });
    return sum;
  }, [liveBank]);

  // Retrieve raw questions for current chapter
  const rawMCQs: StoredMCQ[] = useMemo(() => {
    if (!selectedChapter) return [];
    const isIelts = isIELTSBoard(selectedBoard);
    if (!isIelts && (selectedGrade !== '9' || (selectedBoard !== 'fbise' && selectedBoard !== 'punjab'))) return [];

    const canonical = isIelts ? selectedSubject : (normalizeFBISEGrade9Subject(selectedSubject) || selectedSubject);
    const subjData = liveBank[canonical] || liveBank[selectedSubject] || {};

    if (subjData[selectedChapter] && Array.isArray(subjData[selectedChapter])) {
      return subjData[selectedChapter];
    }

    const foundKey = Object.keys(subjData).find(
      (k) => k.toLowerCase().trim() === selectedChapter.toLowerCase().trim()
    );
    if (foundKey && Array.isArray(subjData[foundKey])) {
      return subjData[foundKey];
    }

    const allKeys = Object.keys(subjData);
    if (allKeys.length === 1 && Array.isArray(subjData[allKeys[0]])) {
      return subjData[allKeys[0]];
    }

    return [];
  }, [selectedChapter, selectedSubject, liveBank, selectedGrade, selectedBoard]);

  const rawShortQuestions: StoredShortQuestion[] = useMemo(() => {
    if (!selectedChapter) return [];
    return getStoredShortQuestions(selectedSubject, selectedChapter, selectedGrade, selectedBoard);
  }, [selectedSubject, selectedChapter, selectedGrade, selectedBoard]);

  const rawLongQuestions: StoredLongQuestion[] = useMemo(() => {
    if (!selectedChapter) return [];
    return getStoredLongQuestions(selectedSubject, selectedChapter, selectedGrade, selectedBoard);
  }, [selectedSubject, selectedChapter, selectedGrade, selectedBoard]);

  // Chapter counts
  const chapterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const isIelts = isIELTSBoard(selectedBoard);
    currentChapters.forEach((ch) => {
      if (bankTab === 'mcq') {
        const canonical = isIelts ? selectedSubject : (normalizeFBISEGrade9Subject(selectedSubject) || selectedSubject);
        const subjData = liveBank[canonical] || liveBank[selectedSubject] || {};
        const exactList = subjData[ch.name];
        if (exactList && Array.isArray(exactList)) {
          counts[ch.name] = exactList.length;
        } else {
          const foundKey = Object.keys(subjData).find(
            (k) => k.toLowerCase().trim() === ch.name.toLowerCase().trim()
          );
          if (foundKey) {
            counts[ch.name] = (subjData[foundKey] || []).length;
          } else if (Object.keys(subjData).length === 1) {
            counts[ch.name] = Object.values(subjData)[0]?.length || 0;
          } else {
            counts[ch.name] = 0;
          }
        }
      } else if (bankTab === 'short') {
        const list = getStoredShortQuestions(selectedSubject, ch.name, selectedGrade, selectedBoard);
        counts[ch.name] = list.length;
      } else {
        const list = getStoredLongQuestions(selectedSubject, ch.name, selectedGrade, selectedBoard);
        counts[ch.name] = list.length;
      }
    });
    return counts;
  }, [currentChapters, selectedSubject, selectedBoard, liveBank, bankTab, selectedGrade]);

  // Subject counts
  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const isIelts = isIELTSBoard(selectedBoard);
    availableSubjects.forEach((subj) => {
      let total = 0;
      if (bankTab === 'mcq') {
        const canonical = isIelts ? subj : (normalizeFBISEGrade9Subject(subj) || subj);
        const subjData = liveBank[canonical] || liveBank[subj] || {};
        Object.values(subjData).forEach((qList) => {
          total += (qList || []).length;
        });
      } else if (bankTab === 'short') {
        const list = getStoredShortQuestions(subj, 'All', selectedGrade, selectedBoard);
        total = list.length;
      } else {
        const list = getStoredLongQuestions(subj, 'All', selectedGrade, selectedBoard);
        total = list.length;
      }
      counts[subj] = total;
    });
    return counts;
  }, [availableSubjects, selectedBoard, liveBank, bankTab, selectedGrade]);

  // Handlers for Edit / Add Drawer
  const handleOpenEditDrawer = (q: StoredMCQ) => {
    setEditingMCQ(q);
    setEditForm({
      id: q.id,
      question: q.question,
      optionA: q.options?.A || '',
      optionB: q.options?.B || '',
      optionC: q.options?.C || '',
      optionD: q.options?.D || '',
      correctAnswer: (q.correctAnswer as any) || 'A',
      explanation: q.explanation || '',
      difficulty: (q.difficulty as any) || 'medium',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenAddDrawer = () => {
    const newId = `${selectedBoard.toLowerCase()}_${selectedSubject.toLowerCase().slice(0, 3)}_${Date.now()}`;
    setEditingMCQ(null);
    setEditForm({
      id: newId,
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
      difficulty: 'medium',
    });
    setIsDrawerOpen(true);
  };

  const handleSaveMCQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.question.trim() || !editForm.optionA.trim() || !editForm.optionB.trim()) {
      toast.error('Question text and at least Options A and B are required.');
      return;
    }
    if (!selectedChapter) {
      toast.error('Please select a chapter before saving.');
      return;
    }

    try {
      setIsSavingMCQ(true);
      const isIeltsBoardType = isIELTSBoard(selectedBoard);
      const canonicalSubject = isIeltsBoardType ? selectedSubject : (normalizeFBISEGrade9Subject(selectedSubject) || selectedSubject);
      const updatedQuestion: StoredMCQ = {
        id: editForm.id || `q_${Date.now()}`,
        board: selectedBoard,
        grade: selectedGrade,
        subject: canonicalSubject,
        chapter: selectedChapter,
        question: editForm.question.trim(),
        options: {
          A: editForm.optionA.trim(),
          B: editForm.optionB.trim(),
          C: editForm.optionC.trim(),
          D: editForm.optionD.trim(),
        },
        correctAnswer: editForm.correctAnswer,
        explanation: editForm.explanation.trim(),
        difficulty: editForm.difficulty,
        verified: true,
        source: 'expert-verified',
        createdAt: editingMCQ?.createdAt || new Date().toISOString(),
      };

      const res = await updateMCQQuestionInBank({
        board: selectedBoard,
        grade: selectedGrade,
        subject: canonicalSubject,
        chapter: selectedChapter,
        question: updatedQuestion,
      });

      if (res.success) {
        toast.success(`Question saved to ${BOARD_SHORT_NAMES[selectedBoard] || selectedBoard.toUpperCase()} bank.`);
        setLiveBank((prev) => {
          const next = { ...prev };
          if (!next[canonicalSubject]) next[canonicalSubject] = {};
          if (!next[canonicalSubject][selectedChapter]) next[canonicalSubject][selectedChapter] = [];
          const list = [...next[canonicalSubject][selectedChapter]];
          const existingIdx = list.findIndex((q) => q.id === updatedQuestion.id);
          if (existingIdx >= 0) {
            list[existingIdx] = updatedQuestion;
          } else {
            list.push(updatedQuestion);
          }
          next[canonicalSubject][selectedChapter] = list;
          return next;
        });
        setIsDrawerOpen(false);
      } else {
        toast.error(res.message || 'Failed to save question');
      }
    } catch (err: any) {
      console.error('Failed to save MCQ:', err);
      toast.error(err.message || 'An error occurred while saving question');
    } finally {
      setIsSavingMCQ(false);
    }
  };

  // Filtered lists
  const filteredMCQs = useMemo(() => {
    return rawMCQs.filter((q) => {
      if (difficultyFilter !== 'all' && (q.difficulty || 'medium').toLowerCase() !== difficultyFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return (
          q.question.toLowerCase().includes(query) ||
          q.id.toLowerCase().includes(query) ||
          (q.explanation || '').toLowerCase().includes(query) ||
          Object.values(q.options || {}).some((opt) => String(opt).toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [rawMCQs, difficultyFilter, searchQuery]);

  const filteredShortQuestions = useMemo(() => {
    return rawShortQuestions.filter((q) => {
      if (difficultyFilter !== 'all' && (q.difficulty || 'medium').toLowerCase() !== difficultyFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return (
          q.question.toLowerCase().includes(query) ||
          q.id.toLowerCase().includes(query) ||
          (q.modelAnswer || '').toLowerCase().includes(query) ||
          (q.topic || '').toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [rawShortQuestions, difficultyFilter, searchQuery]);

  const filteredLongQuestions = useMemo(() => {
    return rawLongQuestions.filter((q) => {
      if (difficultyFilter !== 'all' && (q.difficulty || 'medium').toLowerCase() !== difficultyFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return (
          q.question.toLowerCase().includes(query) ||
          q.id.toLowerCase().includes(query) ||
          (q.modelAnswer || '').toLowerCase().includes(query) ||
          (q.topic || '').toLowerCase().includes(query) ||
          (q.parts || []).some((p) => p.text.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [rawLongQuestions, difficultyFilter, searchQuery]);

  // Current active filtered list
  const activeQuestions = useMemo(() => {
    return bankTab === 'mcq'
      ? filteredMCQs
      : bankTab === 'short'
      ? filteredShortQuestions
      : filteredLongQuestions;
  }, [bankTab, filteredMCQs, filteredShortQuestions, filteredLongQuestions]);

  // Pagination slice
  const totalPages = Math.ceil(activeQuestions.length / PAGE_SIZE) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return activeQuestions.slice(start, start + PAGE_SIZE);
  }, [activeQuestions, currentPage]);

  // Chapter sidebar search
  const filteredChapters = useMemo(() => {
    if (!chapterSearchQuery.trim()) return currentChapters;
    const q = chapterSearchQuery.toLowerCase().trim();
    return currentChapters.filter((c) =>
      c.name.toLowerCase().includes(q) || String(c.number).includes(q)
    );
  }, [currentChapters, chapterSearchQuery]);

  // Copy ID helper
  const copyToClipboard = (idText: string) => {
    navigator.clipboard.writeText(idText);
    setCopiedId(idText);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle all explanations
  const handleToggleAllExplanations = () => {
    if (allExpanded) {
      setExpandedExplanations({});
      setAllExpanded(false);
    } else {
      const next: Record<string, boolean> = {};
      paginatedQuestions.forEach((q) => {
        next[q.id] = true;
      });
      setExpandedExplanations(next);
      setAllExpanded(true);
    }
  };

  // Jump to question handler
  const handleJumpToQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpInput, 10);
    if (!isNaN(num) && num >= 1 && num <= activeQuestions.length) {
      const targetPage = Math.ceil(num / PAGE_SIZE);
      setCurrentPage(targetPage);
      setJumpInput('');
      toast.success(`Navigated to Question ${num} (Page ${targetPage}).`);
    } else {
      toast.error(`Please enter a valid question number between 1 and ${activeQuestions.length}.`);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── 1. Page Header (Single Header with Primary + More Menu) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-neutral-100 tracking-tight">
            Question Bank
          </h1>
          <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
            Curriculum repository for MCQs, Short Questions, and Long Questions across examination boards.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={handleOpenAddDrawer}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F4C430] hover:bg-[#E5B520] text-zinc-950 text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Add Question</span>
          </button>

          <div className="relative" ref={topMenuRef}>
            <button
              onClick={() => setTopMenuOpen(!topMenuOpen)}
              className="min-h-[44px] min-w-[44px] rounded-xl border border-zinc-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-zinc-700 dark:text-neutral-200 hover:bg-zinc-50 dark:hover:bg-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
              title="More actions"
              aria-label="More actions"
            >
              <MoreVertical size={16} />
            </button>

            {topMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700 rounded-xl shadow-xl z-30 py-1">
                <button
                  onClick={() => {
                    setTopMenuOpen(false);
                    fetchLiveBank(true);
                  }}
                  disabled={refreshing}
                  className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-zinc-700 dark:text-neutral-200 hover:bg-zinc-50 dark:hover:bg-neutral-700 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Re-synchronize question bank from storage without page refresh"
                >
                  <RotateCcw size={14} className={refreshing ? 'animate-spin text-amber-500' : ''} />
                  <span>{refreshing ? 'Syncing...' : 'Sync Storage'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Unified Sticky Compact Selector Bar ── */}
      <div className="sticky top-16 z-20 bg-white/95 dark:bg-[#141416]/95 backdrop-blur-md border border-zinc-200 dark:border-neutral-800 rounded-2xl p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Row 1 Left: Board Dropdown + Grade Segmented Control */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Board Selector (Dropdown ensures long names never cut off) */}
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-neutral-800/80 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-neutral-700">
              <GraduationCap size={14} className="text-zinc-500 shrink-0" />
              <label htmlFor="qb-board-select" className="sr-only">Board</label>
              <select
                id="qb-board-select"
                value={selectedBoard}
                onChange={(e) => {
                  const bId = e.target.value;
                  setSelectedBoard(bId);
                  if (bId === 'ielts') setSelectedGrade('IELTS');
                  else setSelectedGrade('9');
                }}
                className="bg-transparent text-xs font-black text-zinc-900 dark:text-neutral-100 cursor-pointer focus:outline-hidden pr-2 min-h-[32px]"
              >
                {BOARDS.map((b) => (
                  <option key={b.id} value={b.id} className="dark:bg-neutral-900">
                    {BOARD_SHORT_NAMES[b.id] || b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Segmented Pills */}
            <div className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-neutral-800/80 p-1 rounded-xl border border-zinc-200 dark:border-neutral-700">
              {availableGrades.map((g) => {
                const isSelected = selectedGrade === g.grade;
                return (
                  <button
                    key={g.grade}
                    onClick={() => setSelectedGrade(g.grade)}
                    className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-neutral-900 text-zinc-950 dark:text-neutral-100 shadow-xs border border-zinc-200 dark:border-neutral-700'
                        : 'text-zinc-600 dark:text-neutral-400 hover:text-zinc-950 dark:hover:text-neutral-100'
                    }`}
                  >
                    {g.grade === 'IELTS' || selectedBoard === 'ielts' ? 'IELTS' : `Gr. ${g.grade}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 1 Right: MCQ / Short / Long Tabs */}
          <div className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-neutral-800/80 p-1 rounded-xl border border-zinc-200 dark:border-neutral-700 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setBankTab('mcq')}
              className={`min-h-[36px] flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                bankTab === 'mcq'
                  ? 'bg-white dark:bg-neutral-900 text-zinc-950 dark:text-neutral-100 shadow-xs border border-zinc-200 dark:border-neutral-700'
                  : 'text-zinc-600 dark:text-neutral-400 hover:text-zinc-950 dark:hover:text-neutral-100'
              }`}
            >
              <CheckCircle2 size={13} className={bankTab === 'mcq' ? 'text-emerald-600' : 'text-zinc-400'} />
              <span>MCQ Bank</span>
              {loading ? (
                <span className="inline-block w-6 h-3 rounded-full bg-zinc-200 dark:bg-neutral-700 animate-pulse ml-1" />
              ) : (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-zinc-200 dark:bg-neutral-700 text-zinc-800 dark:text-neutral-200">
                  {bankGrandTotal.toLocaleString()}
                </span>
              )}
            </button>

            <button
              onClick={() => setBankTab('short')}
              className={`min-h-[36px] flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                bankTab === 'short'
                  ? 'bg-white dark:bg-neutral-900 text-zinc-950 dark:text-neutral-100 shadow-xs border border-zinc-200 dark:border-neutral-700'
                  : 'text-zinc-600 dark:text-neutral-400 hover:text-zinc-950 dark:hover:text-neutral-100'
              }`}
            >
              <AlignLeft size={13} className={bankTab === 'short' ? 'text-amber-600' : 'text-zinc-400'} />
              <span>Short Qs</span>
            </button>

            <button
              onClick={() => setBankTab('long')}
              className={`min-h-[36px] flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                bankTab === 'long'
                  ? 'bg-white dark:bg-neutral-900 text-zinc-950 dark:text-neutral-100 shadow-xs border border-zinc-200 dark:border-neutral-700'
                  : 'text-zinc-600 dark:text-neutral-400 hover:text-zinc-950 dark:hover:text-neutral-100'
              }`}
            >
              <FileQuestion size={13} className={bankTab === 'long' ? 'text-purple-600' : 'text-zinc-400'} />
              <span>Long Qs</span>
            </button>
          </div>
        </div>

        {/* Row 2: Subject Chips Carousel with Skeleton Placeholders */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-zinc-100 dark:border-neutral-800">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider shrink-0 mr-1">
            Subject:
          </span>
          {availableSubjects.map((subj) => {
            const isSelected = selectedSubject === subj;
            const count = subjectCounts[subj] ?? 0;
            return (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100 shadow-xs'
                    : 'bg-zinc-50 dark:bg-neutral-800/80 text-zinc-700 dark:text-neutral-300 border-zinc-200 dark:border-neutral-700 hover:bg-zinc-100 dark:hover:bg-neutral-700'
                }`}
              >
                <span>{subj}</span>
                {loading ? (
                  <span className="inline-block w-4 h-3 rounded-full bg-zinc-200 dark:bg-neutral-700 animate-pulse" />
                ) : (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isSelected
                        ? 'bg-[#F4C430] text-zinc-950'
                        : count > 0
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-zinc-200 dark:bg-neutral-700 text-zinc-600 dark:text-neutral-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Main Chapter Navigation & Questions Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Tablet Collapsible Chapter Bar (640px to 1023px) */}
        <div className="hidden sm:block lg:hidden sm:col-span-12 bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-zinc-900 dark:text-neutral-100">
                Chapter:
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {selectedChapter || 'Select a chapter'}
              </span>
            </div>
            <button
              onClick={() => setTabletChapterOpen(!tabletChapterOpen)}
              className="min-h-[44px] px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-neutral-700 text-xs font-bold text-zinc-700 dark:text-neutral-300 flex items-center gap-1.5"
            >
              <span>{tabletChapterOpen ? 'Hide Chapters' : 'Browse Chapters'}</span>
              {tabletChapterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {tabletChapterOpen && (
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-neutral-800 space-y-2">
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {currentChapters.map((ch) => {
                  const isSelected = selectedChapter === ch.name;
                  const count = chapterCounts[ch.name] || 0;
                  return (
                    <button
                      key={ch.name}
                      onClick={() => {
                        setSelectedChapter(ch.name);
                        setTabletChapterOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                          : 'border-zinc-200 dark:border-neutral-700 bg-zinc-50 dark:bg-neutral-800 text-zinc-800 dark:text-neutral-200'
                      }`}
                    >
                      <span className="truncate">Ch {ch.number}. {ch.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 shrink-0 ml-1">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Chapter & Filters Bar (<640px) */}
        <div className="sm:hidden col-span-1 flex items-center justify-between gap-2 bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-2xl p-3 shadow-xs">
          <div className="min-w-0 flex-1 pr-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Chapter:</span>
            <span className="text-xs font-bold text-zinc-900 dark:text-neutral-100 truncate block">
              {selectedChapter || 'Tap to choose chapter'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setMobileChapterSheetOpen(true)}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-zinc-100 dark:bg-neutral-800 text-zinc-800 dark:text-neutral-200 text-xs font-bold flex items-center gap-1"
            >
              <span>Chapters</span>
              <ChevronDown size={14} />
            </button>
            <button
              onClick={() => setMobileFilterSheetOpen(true)}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-zinc-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-zinc-800 dark:text-neutral-200 text-xs font-bold flex items-center gap-1.5 relative cursor-pointer"
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
              {(searchQuery || difficultyFilter !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-[#F4C430] absolute -top-1 -right-1" />
              )}
            </button>
          </div>
        </div>

        {/* Desktop Sticky Left Rail (1024px+) */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-[148px] h-[calc(100vh-170px)] bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-2xl p-3.5 shadow-xs flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-neutral-800 shrink-0">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-neutral-100">
                {selectedSubject} Chapters
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-neutral-400">
                {currentChapters.length} chapters in syllabus
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-neutral-800 text-zinc-600 dark:text-neutral-300">
              {BOARD_SHORT_NAMES[selectedBoard] || selectedBoard.toUpperCase()}
            </span>
          </div>

          {/* Chapter Search Input */}
          <div className="relative my-2.5 shrink-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter chapters..."
              value={chapterSearchQuery}
              onChange={(e) => setChapterSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-xl border border-zinc-200 dark:border-neutral-700 bg-zinc-50 dark:bg-neutral-800 text-xs text-zinc-900 dark:text-neutral-100 focus:outline-hidden"
            />
          </div>

          {/* Chapters List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 overscroll-contain">
            {filteredChapters.map((ch) => {
              const isSelected = selectedChapter === ch.name;
              const count = chapterCounts[ch.name] || 0;
              return (
                <button
                  key={ch.name}
                  onClick={() => {
                    setSelectedChapter(ch.name);
                    setSearchQuery('');
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                      : 'border-zinc-200 dark:border-neutral-800 bg-zinc-50/60 dark:bg-neutral-800/40 text-zinc-800 dark:text-neutral-200 hover:bg-zinc-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider ${
                          isSelected ? 'text-[#F4C430] dark:text-amber-600' : 'text-zinc-500'
                        }`}
                      >
                        Ch {ch.number}
                      </span>
                    </div>
                    <div className="text-xs font-bold truncate mt-0.5">
                      {ch.name}
                    </div>
                  </div>

                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      isSelected
                        ? 'bg-[#F4C430] text-zinc-950'
                        : count > 0
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-zinc-200 dark:bg-neutral-700 text-zinc-600 dark:text-neutral-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Area: Questions Stream (8 cols desktop) */}
        <section className="lg:col-span-8 space-y-3.5">
          {/* Chapter Meta & Controls Bar */}
          <div className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-zinc-100 dark:border-neutral-800">
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-zinc-500 dark:text-neutral-400">
                  {selectedSubject} · {BOARD_SHORT_NAMES[selectedBoard] || selectedBoard} {selectedGrade === 'IELTS' ? '' : `Gr. ${selectedGrade}`}
                </span>
                <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-neutral-100 truncate">
                  {selectedChapter || 'No Chapter Selected'}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-neutral-800 text-zinc-800 dark:text-neutral-200">
                  {activeQuestions.length} Questions Available
                </span>

                <button
                  type="button"
                  onClick={handleToggleAllExplanations}
                  className="min-h-[44px] px-3 py-1 rounded-xl border border-zinc-200 dark:border-neutral-700 text-xs font-bold text-zinc-700 dark:text-neutral-300 hover:bg-zinc-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  {allExpanded ? 'Collapse All' : 'Expand All'}
                </button>
              </div>
            </div>

            {/* Search + Difficulty Filter Controls (Desktop & Tablet) */}
            <div className="hidden sm:flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search question text, formulas, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-zinc-200 dark:border-neutral-700 bg-zinc-50 dark:bg-neutral-800 text-xs text-zinc-900 dark:text-neutral-100 focus:outline-hidden"
                />
              </div>

              {/* Difficulty Segmented Chips */}
              <div className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-neutral-800 p-1 rounded-xl border border-zinc-200 dark:border-neutral-700 shrink-0">
                {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      difficultyFilter === diff
                        ? 'bg-white dark:bg-neutral-900 text-zinc-950 dark:text-neutral-100 shadow-xs border border-zinc-200 dark:border-neutral-700'
                        : 'text-zinc-600 dark:text-neutral-400 hover:text-zinc-950 dark:hover:text-neutral-100'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── QUESTION LIST (Compact, accessible with KaTeX, difficulty, copyable ID) ── */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 animate-pulse">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-4 bg-zinc-200 dark:bg-neutral-800 rounded" />
                      <div className="w-16 h-4 bg-zinc-200 dark:bg-neutral-800 rounded" />
                      <div className="w-14 h-4 bg-zinc-200 dark:bg-neutral-800 rounded" />
                    </div>
                    <div className="w-12 h-6 bg-zinc-200 dark:bg-neutral-800 rounded-lg" />
                  </div>
                  <div className="w-3/4 h-4 bg-zinc-200 dark:bg-neutral-800 rounded" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="h-10 bg-zinc-100 dark:bg-neutral-800/60 rounded-xl" />
                    <div className="h-10 bg-zinc-100 dark:bg-neutral-800/60 rounded-xl" />
                    <div className="h-10 bg-zinc-100 dark:bg-neutral-800/60 rounded-xl" />
                    <div className="h-10 bg-zinc-100 dark:bg-neutral-800/60 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeQuestions.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-2xl p-12 text-center shadow-xs">
              <p className="text-xs font-semibold text-zinc-500 dark:text-neutral-400">
                No {bankTab.toUpperCase()} questions found matching current parameters for this chapter.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedQuestions.map((q, idx) => {
                const globalIndex = (currentPage - 1) * PAGE_SIZE + idx + 1;
                const isExplanationOpen = Boolean(expandedExplanations[q.id] || allExpanded);
                const isMCQ = bankTab === 'mcq';
                const mcq = q as StoredMCQ;
                const shortQ = q as StoredShortQuestion;
                const longQ = q as StoredLongQuestion;
                const isUnverified = (q as any).verified === false;

                const diffColor =
                  q.difficulty === 'easy'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : q.difficulty === 'hard'
                    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';

                return (
                  <div
                    key={q.id || idx}
                    id={`question-card-${globalIndex}`}
                    className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 transition-colors hover:border-zinc-300 dark:hover:border-neutral-700"
                  >
                    {/* Card Top: Number, Muted Copyable ID, Difficulty Tag, Unverified Tag, Edit Action */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-100 dark:border-neutral-800 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-zinc-900 dark:text-neutral-100">
                          Q{globalIndex}
                        </span>

                        {/* Copyable Muted ID */}
                        <div className="flex items-center gap-1 group">
                          <span className="text-[11px] font-mono font-semibold text-zinc-400 dark:text-neutral-500">
                            #{q.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(q.id)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-neutral-800 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                            title="Copy Question ID"
                          >
                            {copiedId === q.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                          </button>
                        </div>

                        {/* Difficulty Tag */}
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${diffColor}`}>
                          {q.difficulty || 'Medium'}
                        </span>

                        {/* Unverified Only Warning Badge */}
                        {isUnverified && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300">
                            <AlertCircle size={10} />
                            <span>Unverified</span>
                          </span>
                        )}

                        {!isMCQ && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-neutral-800 text-zinc-600 dark:text-neutral-400">
                            {(q as any).marks || (bankTab === 'short' ? 3 : 8)} Marks
                          </span>
                        )}
                      </div>

                      {/* Edit Button */}
                      {isMCQ && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditDrawer(mcq)}
                          className="min-h-[44px] px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-zinc-700 dark:text-neutral-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Edit this question"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>

                    {/* Question Statement with KaTeX */}
                    <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-neutral-100 leading-relaxed">
                      <MathText text={q.question} />
                    </div>

                    {/* MCQ Options (Desktop 2-col, Mobile stacked) */}
                    {isMCQ && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {Object.entries(mcq.options || {}).map(([key, val]) => {
                          const isCorrect = key.toUpperCase() === (mcq.correctAnswer || '').toUpperCase();
                          return (
                            <div
                              key={key}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-colors ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 font-extrabold ring-1 ring-emerald-500'
                                  : 'border-zinc-200 dark:border-neutral-800 bg-zinc-50 dark:bg-neutral-800/60 text-zinc-700 dark:text-neutral-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-5 h-5 rounded-full border flex items-center justify-center font-black text-[10px] shrink-0 ${
                                  isCorrect 
                                    ? 'bg-emerald-600 text-white border-emerald-600' 
                                    : 'bg-white dark:bg-neutral-900 border-zinc-300 dark:border-neutral-700 text-zinc-700 dark:text-neutral-300'
                                }`}>
                                  {key}
                                </span>
                                <div className="truncate">
                                  <MathText text={val} />
                                </div>
                              </div>

                              {isCorrect && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 dark:text-emerald-400 shrink-0">
                                  <CheckCircle2 size={13} />
                                  <span className="hidden sm:inline">Correct</span>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Short Question Model Answer */}
                    {bankTab === 'short' && shortQ.modelAnswer && (
                      <div className="mt-2 text-xs bg-slate-50 dark:bg-neutral-800/80 p-3 rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200">
                        <strong className="text-zinc-900 dark:text-neutral-100">Model Answer:</strong>{' '}
                        <MathText text={shortQ.modelAnswer} />
                      </div>
                    )}

                    {/* Long Question Sub-Parts & Derivation */}
                    {bankTab === 'long' && (
                      <div className="space-y-2">
                        {longQ.parts && longQ.parts.length > 0 && (
                          <div className="space-y-1.5 bg-zinc-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-zinc-200 dark:border-neutral-700">
                            <span className="text-[11px] font-bold text-zinc-500 block">Sub-parts:</span>
                            {longQ.parts.map((p, pIdx) => (
                              <div key={pIdx} className="text-xs text-zinc-800 dark:text-neutral-200 flex items-start justify-between gap-2">
                                <div>
                                  <strong>{p.label}</strong> <MathText text={p.text} />
                                </div>
                                <span className="text-[10px] font-bold text-zinc-500 shrink-0">({p.marks} M)</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {longQ.modelAnswer && (
                          <div className="text-xs bg-slate-50 dark:bg-neutral-800/80 p-3 rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200">
                            <strong className="text-zinc-900 dark:text-neutral-100">Model Answer & Derivation:</strong>{' '}
                            <MathText text={longQ.modelAnswer} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Collapsible Explanation Toggle */}
                    {'explanation' in q && Boolean((q as any).explanation) && (
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedExplanations((prev) => ({
                              ...prev,
                              [q.id]: !prev[q.id],
                            }))
                          }
                          className="min-h-[36px] text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExplanationOpen ? 'Hide explanation' : 'Show explanation'}</span>
                          {isExplanationOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>

                        {isExplanationOpen && (
                          <div className="mt-1.5 text-xs bg-zinc-50 dark:bg-neutral-800/80 p-3 rounded-xl border border-zinc-200 dark:border-neutral-700 text-zinc-700 dark:text-neutral-300 animate-in fade-in duration-150">
                            <strong className="text-zinc-900 dark:text-neutral-100 block mb-0.5">Explanation:</strong>
                            <MathText text={(q as any).explanation} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── 4. Pagination & Jump-To Controls ── */}
          {activeQuestions.length > PAGE_SIZE && (
            <div className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs font-bold text-zinc-600 dark:text-neutral-400">
                Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, activeQuestions.length)}–
                {Math.min(currentPage * PAGE_SIZE, activeQuestions.length)} of {activeQuestions.length} questions
              </span>

              <div className="flex items-center gap-2">
                {/* Previous Page */}
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold text-zinc-800 dark:text-neutral-200 hover:bg-zinc-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>

                {/* Page Indicator */}
                <span className="text-xs font-bold text-zinc-700 dark:text-neutral-300 px-2">
                  Page {currentPage} of {totalPages}
                </span>

                {/* Next Page */}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold text-zinc-800 dark:text-neutral-200 hover:bg-zinc-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>

                {/* Jump to Question */}
                <form onSubmit={handleJumpToQuestion} className="flex items-center gap-1.5 ml-2">
                  <input
                    type="number"
                    min={1}
                    max={activeQuestions.length}
                    placeholder="Q#"
                    value={jumpInput}
                    onChange={(e) => setJumpInput(e.target.value)}
                    className="w-16 min-h-[44px] px-2 text-xs text-center border border-zinc-200 dark:border-neutral-700 bg-zinc-50 dark:bg-neutral-800 rounded-xl font-bold text-zinc-900 dark:text-neutral-100"
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] px-2.5 py-2 rounded-xl bg-zinc-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-bold cursor-pointer"
                    title="Jump to question number"
                  >
                    Go
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── 5. Mobile Chapter Picker Bottom Sheet (<640px) ── */}
      {mobileChapterSheetOpen && createPortal(
        <div className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileChapterSheetOpen(false)}
          />
          <div className="relative bg-white dark:bg-neutral-900 rounded-t-3xl max-h-[85vh] flex flex-col z-10 shadow-2xl border-t border-zinc-200 dark:border-neutral-800 animate-in slide-in-from-bottom duration-200 overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-neutral-800 flex items-center justify-between bg-zinc-50 dark:bg-neutral-800/50 shrink-0">
              <h3 className="text-sm font-black text-zinc-900 dark:text-neutral-100">
                Choose {selectedSubject} Chapter
              </h3>
              <button
                onClick={() => setMobileChapterSheetOpen(false)}
                className="min-h-[44px] min-w-[44px] p-2 text-zinc-400 hover:text-zinc-700 rounded-lg flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-2 flex-1 overflow-y-auto">
              {currentChapters.map((ch) => {
                const isSelected = selectedChapter === ch.name;
                const count = chapterCounts[ch.name] || 0;
                return (
                  <button
                    key={ch.name}
                    onClick={() => {
                      setSelectedChapter(ch.name);
                      setMobileChapterSheetOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                        : 'border-zinc-200 dark:border-neutral-800 bg-zinc-50 dark:bg-neutral-800 text-zinc-800 dark:text-neutral-200'
                    }`}
                  >
                    <span>Ch {ch.number}. {ch.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/10 shrink-0 ml-2">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Mobile Filters Bottom Sheet (<640px) ── */}
      {mobileFilterSheetOpen && createPortal(
        <div className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFilterSheetOpen(false)}
          />
          <div className="relative bg-white dark:bg-neutral-900 rounded-t-3xl max-h-[85vh] flex flex-col z-10 shadow-2xl border-t border-zinc-200 dark:border-neutral-800 animate-in slide-in-from-bottom duration-200 overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-neutral-800 flex items-center justify-between bg-zinc-50 dark:bg-neutral-800/50 shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-[#F4C430]" />
                <h3 className="text-sm font-black text-zinc-900 dark:text-neutral-100">
                  Search & Filter Questions
                </h3>
              </div>
              <button
                onClick={() => setMobileFilterSheetOpen(false)}
                className="min-h-[44px] min-w-[44px] p-2 text-zinc-400 hover:text-zinc-700 rounded-lg flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {/* Search input */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Search Keywords / ID
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search formula, terms, question text..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-zinc-200 dark:border-neutral-700 bg-zinc-50 dark:bg-neutral-800 text-xs text-zinc-900 dark:text-neutral-100"
                  />
                </div>
              </div>

              {/* Difficulty selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-4 gap-1.5 bg-zinc-100 dark:bg-neutral-800 p-1 rounded-xl">
                  {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficultyFilter(diff)}
                      className={`min-h-[40px] py-1 text-xs font-bold capitalize rounded-lg ${
                        difficultyFilter === diff
                          ? 'bg-white dark:bg-neutral-900 text-zinc-950 dark:text-neutral-100 shadow-xs'
                          : 'text-zinc-600 dark:text-neutral-400'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset or Apply */}
              <div className="pt-2 flex gap-2">
                {(searchQuery || difficultyFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setDifficultyFilter('all');
                    }}
                    className="min-h-[44px] flex-1 rounded-xl border border-zinc-200 dark:border-neutral-700 text-xs font-bold text-zinc-700 dark:text-neutral-300"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  onClick={() => setMobileFilterSheetOpen(false)}
                  className="min-h-[44px] flex-1 rounded-xl bg-[#F4C430] hover:bg-[#E5B520] text-zinc-950 font-bold text-xs"
                >
                  Show ({activeQuestions.length}) Questions
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── 6. Edit / Add Question Drawer with Live Math Preview ── */}
      {isDrawerOpen && createPortal(
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="relative w-full max-w-full sm:max-w-xl md:max-w-2xl bg-white dark:bg-neutral-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-neutral-800 flex items-center justify-between bg-zinc-50 dark:bg-neutral-800/60 shrink-0">
              <div className="min-w-0 pr-2">
                <h3 className="text-base font-black text-zinc-900 dark:text-neutral-100 truncate">
                  {editingMCQ ? 'Edit MCQ Question' : 'Add Question to Bank'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5 truncate">
                  {BOARD_SHORT_NAMES[selectedBoard] || selectedBoard} · Grade {selectedGrade} · {selectedSubject} · {selectedChapter}
                </p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="min-h-[44px] min-w-[44px] p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-neutral-200 rounded-lg flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Form Body */}
            <form onSubmit={handleSaveMCQ} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-4 sm:p-6 flex-1 overflow-y-auto min-h-0 space-y-5 overscroll-contain">
                {/* Question Statement */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    Question Statement (Supports LaTeX e.g. $F = ma$) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={editForm.question}
                    onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                    placeholder="Enter question statement (e.g. Find the acceleration when $F = 20\text{ N}$ and $m = 4\text{ kg}$)..."
                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-neutral-700 bg-zinc-50 dark:bg-neutral-800 text-xs font-medium text-zinc-900 dark:text-neutral-100 focus:outline-hidden"
                  />
                </div>

                {/* Options A, B, C, D */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-neutral-300 uppercase tracking-wider">
                    Options & Correct Answer <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                      const fieldKey = `option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD';
                      const isCorrect = editForm.correctAnswer === opt;
                      return (
                        <div
                          key={opt}
                          className={`p-3 rounded-xl border transition-all ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                              : 'border-zinc-200 dark:border-neutral-800 bg-zinc-50 dark:bg-neutral-800/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="w-5 h-5 rounded-full bg-white dark:bg-neutral-900 border border-zinc-300 dark:border-neutral-700 flex items-center justify-center font-black text-[10px] text-zinc-900 dark:text-neutral-100">
                              {opt}
                            </span>
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-zinc-700 dark:text-neutral-300">
                              <input
                                type="radio"
                                name="drawerCorrectAnswer"
                                checked={isCorrect}
                                onChange={() => setEditForm({ ...editForm, correctAnswer: opt })}
                                className="accent-emerald-600 cursor-pointer"
                              />
                              <span>Correct</span>
                            </label>
                          </div>
                          <input
                            type="text"
                            required={opt === 'A' || opt === 'B'}
                            value={editForm[fieldKey]}
                            onChange={(e) => setEditForm({ ...editForm, [fieldKey]: e.target.value })}
                            placeholder={`Option ${opt} text / formula`}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium text-zinc-900 dark:text-neutral-100"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Difficulty & Explanation */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                      Difficulty Level
                    </label>
                    <select
                      value={editForm.difficulty}
                      onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value as any })}
                      className="w-full min-h-[44px] px-3 rounded-xl border border-zinc-200 dark:border-neutral-700 bg-zinc-50 dark:bg-neutral-800 text-xs font-semibold text-zinc-900 dark:text-neutral-100 cursor-pointer"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                      Explanation & Rationale
                    </label>
                    <input
                      type="text"
                      value={editForm.explanation}
                      onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                      placeholder="Concept reference or step-by-step formula derivation..."
                      className="w-full min-h-[44px] px-3 rounded-xl border border-zinc-200 dark:border-neutral-700 bg-zinc-50 dark:bg-neutral-800 text-xs font-medium text-zinc-900 dark:text-neutral-100"
                    />
                  </div>
                </div>

                {/* ── LIVE MATH PREVIEW PANEL ── */}
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                    <Eye size={13} />
                    <span>Live Math & KaTeX Preview</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase block">Rendered Statement:</span>
                      <div className="text-xs font-bold text-zinc-900 dark:text-neutral-100 bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-amber-200/60 dark:border-neutral-800">
                        {editForm.question ? (
                          <MathText text={editForm.question} />
                        ) : (
                          <span className="text-zinc-400 italic">Type a question above to see rendered formulas...</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                        const fieldKey = `option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD';
                        const text = editForm[fieldKey];
                        return (
                          <div key={opt} className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 flex items-center gap-1.5">
                            <span className="font-bold text-zinc-500">{opt}:</span>
                            <div className="truncate text-xs">
                              <MathText text={text || '—'} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {editForm.explanation && (
                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase block">Rendered Explanation:</span>
                        <div className="text-xs text-zinc-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-zinc-200 dark:border-neutral-800">
                          <MathText text={editForm.explanation} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 sm:px-6 sm:py-4 border-t border-zinc-200 dark:border-neutral-800 flex gap-3 bg-zinc-50 dark:bg-neutral-800/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="min-h-[44px] flex-1 py-2.5 border border-zinc-200 dark:border-neutral-700 text-zinc-700 dark:text-neutral-300 font-bold text-xs rounded-xl hover:bg-white dark:hover:bg-neutral-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMCQ}
                  className="min-h-[44px] flex-1 py-2.5 bg-[#F4C430] hover:bg-[#E5B520] text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Save size={14} className={isSavingMCQ ? 'animate-spin' : ''} />
                  <span>{isSavingMCQ ? 'Saving...' : 'Save to Bank'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminMCQVerificationView;
