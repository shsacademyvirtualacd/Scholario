import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Database,
  Search,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Layers,
  BookOpen,
  GraduationCap,
  AlignLeft,
  FileQuestion,
  Edit3,
  Plus,
  X,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { MathText } from '../../common/MathText';
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

export const AdminMCQVerificationView: React.FC<AdminMCQVerificationViewProps> = ({
  initialBoard = 'fbise',
  initialGrade = '9',
  initialSubject = 'Physics',
  initialChapter,
}) => {
  // Bank Type Switcher: 'mcq' | 'short' | 'long'
  const [bankTab, setBankTab] = useState<BankTab>('mcq');

  // Navigation Hierarchy State
  const [selectedBoard, setSelectedBoard] = useState<string>(initialBoard);
  const [selectedGrade, setSelectedGrade] = useState<string>(initialGrade);
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject);
  const [selectedChapter, setSelectedChapter] = useState<string>(initialChapter || '');

  // Live Storage Bank State (MCQs)
  const [liveBank, setLiveBank] = useState<Record<string, Record<string, StoredMCQ[]>>>({});
  const [, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters and UI State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [chapterSearchQuery, setChapterSearchQuery] = useState<string>('');

  // Edit / Add Question Modal State
  const [editingMCQ, setEditingMCQ] = useState<StoredMCQ | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
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

  // 1. Fetch live MCQ bank data from storage
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
        toast.success(`${isPunjab ? 'Punjab Board' : isIelts ? 'IELTS' : 'FBISE'} Question Bank re-synchronized: ${totalCount.toLocaleString()} total MCQs loaded.`);
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

  const isIelts = useMemo(() => isIELTSBoard(selectedBoard, selectedGrade), [selectedBoard, selectedGrade]);

  // 2. Compute available subjects for the selected grade and board
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

  // 3. Compute chapters for the selected subject
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

  // 4. Compute Counts & Statistics
  const bankGrandTotal = useMemo(() => {
    let sum = 0;
    Object.values(liveBank).forEach((subj) => {
      Object.values(subj).forEach((chList) => {
        sum += (chList || []).length;
      });
    });
    return sum;
  }, [liveBank]);

  // Retrieve raw questions for current chapter based on active bank tab
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

    // Single key in subjData
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

  // Dynamic Chapter counts based on selected bank tab
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

  // Subject counts for the active bank tab
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

  // Handlers for Edit / Add Modal
  const handleOpenEditModal = (q: StoredMCQ) => {
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
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
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
    setIsModalOpen(true);
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
        toast.success(`Question successfully saved to ${selectedBoard === 'punjab' ? 'Punjab Board' : selectedBoard.toUpperCase()} bank!`);
        // Update local bank state
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
        setIsModalOpen(false);
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

  // Filtered list based on active tab, search, difficulty
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

  // Filter chapters in sidebar
  const filteredChapters = useMemo(() => {
    if (!chapterSearchQuery.trim()) return currentChapters;
    const q = chapterSearchQuery.toLowerCase().trim();
    return currentChapters.filter((c) =>
      c.name.toLowerCase().includes(q) || String(c.number).includes(q)
    );
  }, [currentChapters, chapterSearchQuery]);

  // Handlers
  const currentQuestionsCount =
    bankTab === 'mcq'
      ? rawMCQs.length
      : bankTab === 'short'
      ? rawShortQuestions.length
      : rawLongQuestions.length;

  return (
    <div className="space-y-6">
      {/* ── 1. Top Header & Bank Selector ── */}
      <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#111111] text-[#F4C430] flex items-center justify-center shadow-xs shrink-0">
              <Database size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-[#111111] tracking-tight">
                  Curriculum Question Bank
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black bg-[#111111] text-[#F4C430]">
                  <Sparkles size={11} />
                  <span>Admin Verification</span>
                </span>
              </div>
              <p className="text-xs text-[#737373] mt-1 max-w-2xl">
                Pre-generated and verified question bank covering Multiple Choice Questions (MCQs), Short Questions, and Long Questions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4C430] text-[#111111] hover:bg-[#e0b020] text-xs font-black transition-all cursor-pointer shadow-xs"
            >
              <Plus size={13} />
              <span>Add Question</span>
            </button>
            <button
              onClick={() => fetchLiveBank(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111111] text-white hover:bg-[#262626] text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <RotateCcw size={13} className={refreshing ? 'animate-spin text-[#F4C430]' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Sync Storage'}</span>
            </button>
          </div>
        </div>

        {/* ── Question Bank Type Sub-Tabs (MCQ Bank, Short Question Bank, Long Question Bank) ── */}
        <div className="flex items-center gap-2 p-1.5 bg-[#F5F5F5] rounded-2xl border border-[#E5E5E5] w-fit flex-wrap">
          <button
            onClick={() => setBankTab('mcq')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              bankTab === 'mcq'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'text-[#525252] hover:text-[#111111] hover:bg-black/5'
            }`}
          >
            <CheckCircle2 size={14} className={bankTab === 'mcq' ? 'text-[#F4C430]' : 'text-[#737373]'} />
            <span>MCQ Bank</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                bankTab === 'mcq' ? 'bg-[#F4C430] text-[#111111]' : 'bg-black/5 text-[#737373]'
              }`}
            >
              {bankGrandTotal.toLocaleString()}
            </span>
          </button>

          <button
            onClick={() => setBankTab('short')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              bankTab === 'short'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'text-[#525252] hover:text-[#111111] hover:bg-black/5'
            }`}
          >
            <AlignLeft size={14} className={bankTab === 'short' ? 'text-[#F4C430]' : 'text-[#737373]'} />
            <span>Short Question Bank</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                bankTab === 'short' ? 'bg-[#F4C430] text-[#111111]' : 'bg-black/5 text-[#737373]'
              }`}
            >
              Section B
            </span>
          </button>

          <button
            onClick={() => setBankTab('long')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              bankTab === 'long'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'text-[#525252] hover:text-[#111111] hover:bg-black/5'
            }`}
          >
            <FileQuestion size={14} className={bankTab === 'long' ? 'text-[#F4C430]' : 'text-[#737373]'} />
            <span>Long Question Bank</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                bankTab === 'long' ? 'bg-[#F4C430] text-[#111111]' : 'bg-black/5 text-[#737373]'
              }`}
            >
              Section C
            </span>
          </button>
        </div>
      </div>

      {/* ── 2. Hierarchical Drilldown Selector (Board → Grade → Subject) ── */}
      <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-xs space-y-4">
        {/* Board Tabs */}
        <div>
          <div className="text-[11px] font-black uppercase tracking-wider text-[#737373] mb-2 flex items-center gap-1.5">
            <GraduationCap size={13} />
            <span>1. Educational Board</span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {BOARDS.map((b) => {
              const isSelected = selectedBoard === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelectedBoard(b.id);
                    if (b.id === 'ielts') {
                      setSelectedGrade('IELTS');
                    } else {
                      setSelectedGrade('9');
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                      : 'bg-[#FAFAFA] text-[#737373] border-[#E5E5E5] hover:text-[#111111] hover:bg-[#F5F5F5]'
                  }`}
                >
                  {b.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grade Selector */}
        <div className="pt-2 border-t border-[#F0F0F0]">
          <div className="text-[11px] font-black uppercase tracking-wider text-[#737373] mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers size={13} />
              <span>2. Select Grade / Class</span>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {availableGrades.map((g) => {
              const isSelected = selectedGrade === g.grade;
              return (
                <button
                  key={g.grade}
                  onClick={() => setSelectedGrade(g.grade)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                      : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#111111] hover:border-[#CCCCCC] hover:bg-[#F5F5F5]'
                  }`}
                >
                  <div>
                    <div className={`text-xs font-black ${isSelected ? 'text-white' : 'text-[#111111]'}`}>
                      {g.grade === 'IELTS' || selectedBoard === 'ielts' ? g.displayName : `Grade ${g.grade} (${g.displayName})`}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/70' : 'text-[#737373]'}`}>
                      {selectedBoard.toUpperCase()} Curriculum
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject Selector */}
        <div className="pt-2 border-t border-[#F0F0F0]">
          <div className="text-[11px] font-black uppercase tracking-wider text-[#737373] mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BookOpen size={13} />
              <span>3. Select Subject</span>
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {availableSubjects.map((subj) => {
              const isSelected = selectedSubject === subj;
              const count = subjectCounts[subj] || 0;
              return (
                <button
                  key={subj}
                  onClick={() => setSelectedSubject(subj)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                      : 'bg-[#FAFAFA] text-[#525252] border-[#E5E5E5] hover:text-[#111111] hover:bg-[#F5F5F5]'
                  }`}
                >
                  <span>{subj}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isSelected
                        ? 'bg-[#F4C430] text-[#111111]'
                        : count > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-[#E5E5E5] text-[#737373]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 3. Main Chapter Drill-Down & Questions Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Chapters List (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F0F0F0]">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#111111]">
                {selectedSubject} Chapters
              </h3>
              <p className="text-[11px] text-[#737373]">
                {currentChapters.length} chapters total
              </p>
            </div>
          </div>

          {/* Chapter Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search chapters..."
              value={chapterSearchQuery}
              onChange={(e) => setChapterSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
            />
          </div>

          {/* Chapters Scrollable List */}
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
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
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                      : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#111111] hover:bg-[#F5F5F5]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider ${
                          isSelected ? 'text-[#F4C430]' : 'text-[#737373]'
                        }`}
                      >
                        Ch {ch.number}
                      </span>
                    </div>
                    <div
                      className={`text-xs font-extrabold truncate mt-0.5 ${
                        isSelected ? 'text-white' : 'text-[#111111]'
                      }`}
                    >
                      {ch.name}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      isSelected
                        ? 'bg-[#F4C430] text-[#111111]'
                        : count > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-[#E5E5E5] text-[#737373]'
                    }`}
                  >
                    {count} {bankTab.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Question Bank Questions (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0F0F0]">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#737373]">
                  <span>{isIelts || selectedGrade === 'IELTS' ? 'IELTS Preparation' : `Grade ${selectedGrade}`}</span>
                  <span>•</span>
                  <span>{selectedSubject}</span>
                  <span>•</span>
                  <span className="text-[#111111] font-black">
                    {bankTab === 'mcq'
                      ? 'MCQ Bank'
                      : bankTab === 'short'
                      ? 'Short Question Bank'
                      : 'Long Question Bank'}
                  </span>
                </div>
                <h2 className="text-lg font-black text-[#111111] tracking-tight mt-0.5">
                  {selectedChapter || 'No Chapter Selected'}
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-[#111111] text-white">
                  <CheckCircle2 size={13} className="text-[#F4C430]" />
                  <span>{currentQuestionsCount} Questions</span>
                </span>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                <input
                  type="text"
                  placeholder="Search in questions, explanations, model answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                />
              </div>

              {/* Difficulty Filter */}
              <div className="flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-xl border border-[#E5E5E5] shrink-0">
                {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold capitalize transition-all cursor-pointer ${
                      difficultyFilter === diff
                        ? 'bg-[#111111] text-white'
                        : 'text-[#737373] hover:text-[#111111]'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Questions Rendering */}
          {bankTab === 'mcq' && (
            <div className="space-y-4">
              {filteredMCQs.length === 0 ? (
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-12 text-center shadow-xs">
                  <p className="text-xs text-[#737373]">No MCQs found for this chapter.</p>
                </div>
              ) : (
                filteredMCQs.map((q, idx) => (
                  <div key={q.id || idx} className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#F0F0F0]">
                      <span className="text-xs font-black text-[#111111]">Q{idx + 1}. ({q.id})</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(q)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#111111] transition-all cursor-pointer"
                          title="Edit this MCQ in question bank"
                        >
                          <Edit3 size={11} />
                          <span>Edit</span>
                        </button>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Verified MCQ
                        </span>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-[#111111]">
                      <MathText text={q.question} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {Object.entries(q.options || {}).map(([key, val]) => (
                        <div
                          key={key}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                            key.toUpperCase() === (q.correctAnswer || '').toUpperCase()
                              ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-extrabold'
                              : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#525252]'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-white border border-[#CCCCCC] flex items-center justify-center font-black text-[10px]">
                            {key}
                          </span>
                          <MathText text={val} />
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="mt-2 text-xs bg-[#FAFAFA] p-3 rounded-xl border border-[#E5E5E5] text-[#525252]">
                        <strong className="text-[#111111]">Explanation:</strong> <MathText text={q.explanation} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {bankTab === 'short' && (
            <div className="space-y-4">
              {filteredShortQuestions.length === 0 ? (
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-12 text-center shadow-xs">
                  <p className="text-xs text-[#737373]">No Short Questions found for this chapter.</p>
                </div>
              ) : (
                filteredShortQuestions.map((q, idx) => (
                  <div key={q.id || idx} className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#F0F0F0]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#111111]">Q{idx + 1}. ({q.id})</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F5F5F5] text-[#737373]">
                          {q.marks || 3} Marks
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Short Answer
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#111111]">
                      <MathText text={q.question} />
                    </div>
                    {q.modelAnswer && (
                      <div className="mt-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800">
                        <strong className="text-[#111111]">Model Answer:</strong> <MathText text={q.modelAnswer} />
                      </div>
                    )}
                    {q.keyPoints && q.keyPoints.length > 0 && (
                      <div className="text-[11px] text-[#737373] space-y-1">
                        <span className="font-bold text-[#111111]">Key Marking Points:</span>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {q.keyPoints.map((kp, kIdx) => (
                            <li key={kIdx}>{kp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {bankTab === 'long' && (
            <div className="space-y-4">
              {filteredLongQuestions.length === 0 ? (
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-12 text-center shadow-xs">
                  <p className="text-xs text-[#737373]">No Long Questions found for this chapter.</p>
                </div>
              ) : (
                filteredLongQuestions.map((q, idx) => (
                  <div key={q.id || idx} className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#F0F0F0]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#111111]">Q{idx + 1}. ({q.id})</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F5F5F5] text-[#737373]">
                          {q.marks || 8} Marks
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        Detailed Theory / Problem
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#111111]">
                      <MathText text={q.question} />
                    </div>
                    {q.parts && q.parts.length > 0 && (
                      <div className="space-y-2 bg-[#FAFAFA] p-3 rounded-xl border border-[#E5E5E5]">
                        <div className="text-xs font-bold text-[#111111]">Sub-Parts:</div>
                        {q.parts.map((p, pIdx) => (
                          <div key={pIdx} className="text-xs text-[#525252] flex items-start justify-between gap-2">
                            <div>
                              <strong>{p.label}</strong> <MathText text={p.text} />
                            </div>
                            <span className="text-[10px] font-bold text-[#737373] shrink-0">
                              ({p.marks} M)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.modelAnswer && (
                      <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800">
                        <strong className="text-[#111111]">Model Answer & Derivation:</strong>{' '}
                        <MathText text={q.modelAnswer} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Edit / Add MCQ Modal Dialog ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#111111] text-[#F4C430] flex items-center justify-center font-black">
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#111111]">
                    {editingMCQ ? 'Edit MCQ Question' : 'Add New Question to Bank'}
                  </h3>
                  <div className="text-[11px] font-semibold text-[#737373] mt-0.5">
                    {selectedBoard === 'punjab' ? 'Punjab Board' : selectedBoard.toUpperCase()} • Grade {selectedGrade} • {selectedSubject} • {selectedChapter}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#525252] hover:text-[#111111] flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveMCQ} className="space-y-4">
              {/* Question Text */}
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Question Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={editForm.question}
                  onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                  placeholder="Enter MCQ problem statement (LaTeX formulas like $F=ma$ supported)..."
                  className="w-full p-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-medium text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                />
              </div>

              {/* Options A, B, C, D */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#111111]">
                  Answer Choices (A, B, C, D) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const fieldKey = `option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD';
                    const isSelectedAnswer = editForm.correctAnswer === opt;
                    return (
                      <div
                        key={opt}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isSelectedAnswer
                            ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                            : 'border-[#E5E5E5] bg-[#FAFAFA]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="w-5 h-5 rounded-full bg-white border border-[#D4D4D4] flex items-center justify-center font-black text-[10px] text-[#111111]">
                            {opt}
                          </span>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-[#525252]">
                            <input
                              type="radio"
                              name="correctAnswerChoice"
                              checked={isSelectedAnswer}
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
                          placeholder={`Option ${opt} text`}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] bg-white text-xs font-medium text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty & Explanation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">
                    Difficulty Level
                  </label>
                  <select
                    value={editForm.difficulty}
                    onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value as any })}
                    className="w-full h-9 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold text-[#111111] focus:outline-hidden cursor-pointer"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">
                    Concept Explanation & Syllabus Note
                  </label>
                  <input
                    type="text"
                    value={editForm.explanation}
                    onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                    placeholder="Rationale or textbook reference..."
                    className="w-full h-9 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-medium text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F0F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#525252] hover:text-[#111111] hover:bg-[#F5F5F5] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMCQ}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#111111] text-white hover:bg-[#262626] text-xs font-black transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save size={13} className={isSavingMCQ ? 'animate-spin' : ''} />
                  <span>{isSavingMCQ ? 'Saving Changes...' : 'Save to Bank'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMCQVerificationView;
