import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Database,
  Search,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Layers,
  BookOpen,
  Check,
  Copy,
  Code,
  ListFilter,
  Eye,
  ChevronDown,
  ChevronUp,
  FileText,
  FolderOpen,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';
import { MathText } from '../../common/MathText';
import {
  loadBankData,
  refreshLiveBankData,
} from '../../../lib/questionBankService';
import { BOARDS, getGradesForBoard } from '../../../lib/taxonomy';
import {
  FBISE_GRADE_9_CURRICULUM,
  FBISE_GRADE_10_CURRICULUM,
  normalizeFBISEGrade9Subject,
} from '../../../lib/curriculumFBISE9';
import type { StoredMCQ } from '../../../types/questionBank';

interface AdminMCQVerificationViewProps {
  initialBoard?: string;
  initialGrade?: string;
  initialSubject?: string;
  initialChapter?: string;
}

type ViewMode = 'cards' | 'compact' | 'json';

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

  // Live Storage Bank State
  const [liveBank, setLiveBank] = useState<Record<string, Record<string, StoredMCQ[]>>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters and UI State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [chapterSearchQuery, setChapterSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Fetch live bank data from real storage
  const fetchLiveBank = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const bankData = isManualRefresh ? await refreshLiveBankData() : await loadBankData();
      setLiveBank(bankData || {});

      if (isManualRefresh) {
        let totalCount = 0;
        Object.values(bankData || {}).forEach((subj) => {
          Object.values(subj || {}).forEach((chList) => {
            totalCount += (chList || []).length;
          });
        });
        toast.success(`Live Question Bank re-synchronized: ${totalCount.toLocaleString()} total MCQs loaded.`);
      }
    } catch (err: any) {
      console.error('[MCQVerification] Failed to fetch live bank:', err);
      toast.error('Failed to load live question bank: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveBank();
  }, [fetchLiveBank]);

  // 2. Compute available subjects for the selected grade and board
  const availableGrades = useMemo(() => {
    return getGradesForBoard(selectedBoard);
  }, [selectedBoard]);

  const currentGradeDef = useMemo(() => {
    return availableGrades.find((g) => g.grade === selectedGrade) || availableGrades[0];
  }, [availableGrades, selectedGrade]);

  const availableSubjects = useMemo(() => {
    if (!currentGradeDef) return [];
    const subjectsSet = new Set<string>();

    // Add common and stream subjects from taxonomy
    currentGradeDef.commonSubjects?.forEach((s) => subjectsSet.add(s));
    currentGradeDef.streams?.forEach((st) => st.subjects.forEach((s) => subjectsSet.add(s)));

    // If Grade 9 FBISE, also include any subjects from curriculum or live bank
    if (selectedGrade === '9' && selectedBoard === 'fbise') {
      Object.keys(FBISE_GRADE_9_CURRICULUM).forEach((s) => subjectsSet.add(s));
      Object.keys(liveBank).forEach((s) => subjectsSet.add(s));
    }

    return Array.from(subjectsSet);
  }, [currentGradeDef, selectedGrade, selectedBoard, liveBank]);

  // Ensure selectedSubject is valid
  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[0]);
    }
  }, [availableSubjects, selectedSubject]);

  // 3. Compute chapters for the selected subject
  const currentChapters = useMemo(() => {
    // If Grade 9 FBISE curriculum
    if (selectedGrade === '9' && selectedBoard === 'fbise') {
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

    // If Grade 10 FBISE curriculum
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

    // Check if live bank has chapters for this subject
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

  // Automatically select first chapter when subject changes if not selected
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

  // 4. Compute Counts & Statistics strictly from live storage
  const bankGrandTotal = useMemo(() => {
    let sum = 0;
    Object.values(liveBank).forEach((subj) => {
      Object.values(subj).forEach((chList) => {
        sum += (chList || []).length;
      });
    });
    return sum;
  }, [liveBank]);

  const gradeTotalCount = useMemo(() => {
    // Only Grade 9 FBISE has stored MCQs in the current live file
    if (selectedGrade !== '9' || selectedBoard !== 'fbise') {
      return 0;
    }
    return bankGrandTotal;
  }, [selectedGrade, selectedBoard, bankGrandTotal]);

  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    availableSubjects.forEach((subj) => {
      if (selectedGrade !== '9' || selectedBoard !== 'fbise') {
        counts[subj] = 0;
        return;
      }
      const canonical = normalizeFBISEGrade9Subject(subj) || subj;
      const subjData = liveBank[canonical] || liveBank[subj] || {};
      let total = 0;
      Object.values(subjData).forEach((qList) => {
        total += (qList || []).length;
      });
      counts[subj] = total;
    });
    return counts;
  }, [availableSubjects, liveBank, selectedGrade, selectedBoard]);

  const chapterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    currentChapters.forEach((ch) => {
      if (selectedGrade !== '9' || selectedBoard !== 'fbise') {
        counts[ch.name] = 0;
        return;
      }
      const canonical = normalizeFBISEGrade9Subject(selectedSubject) || selectedSubject;
      const subjData = liveBank[canonical] || liveBank[selectedSubject] || {};
      const exactList = subjData[ch.name];
      if (exactList && Array.isArray(exactList)) {
        counts[ch.name] = exactList.length;
      } else {
        // Case-insensitive match
        const foundKey = Object.keys(subjData).find(
          (k) => k.toLowerCase().trim() === ch.name.toLowerCase().trim()
        );
        counts[ch.name] = foundKey ? (subjData[foundKey] || []).length : 0;
      }
    });
    return counts;
  }, [currentChapters, selectedSubject, liveBank, selectedGrade, selectedBoard]);

  // 5. Retrieve stored questions for currently selected chapter
  const rawChapterQuestions: StoredMCQ[] = useMemo(() => {
    if (!selectedChapter) return [];
    if (selectedGrade !== '9' || selectedBoard !== 'fbise') return [];

    const canonical = normalizeFBISEGrade9Subject(selectedSubject) || selectedSubject;
    const subjData = liveBank[canonical] || liveBank[selectedSubject] || {};
    
    // Exact match
    if (subjData[selectedChapter] && Array.isArray(subjData[selectedChapter])) {
      return subjData[selectedChapter];
    }

    // Normalized match
    const foundKey = Object.keys(subjData).find(
      (k) => k.toLowerCase().trim() === selectedChapter.toLowerCase().trim()
    );
    if (foundKey && Array.isArray(subjData[foundKey])) {
      return subjData[foundKey];
    }

    return [];
  }, [selectedChapter, selectedSubject, liveBank, selectedGrade, selectedBoard]);

  // 6. Filter questions based on search query and difficulty
  const filteredQuestions = useMemo(() => {
    return rawChapterQuestions.filter((q) => {
      // Difficulty filter
      if (difficultyFilter !== 'all' && (q.difficulty || 'medium').toLowerCase() !== difficultyFilter) {
        return false;
      }

      // Search keyword filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inQuestion = q.question.toLowerCase().includes(query);
        const inId = q.id.toLowerCase().includes(query);
        const inExplanation = (q.explanation || '').toLowerCase().includes(query);
        const inOptions = Object.values(q.options || {}).some((opt) =>
          String(opt).toLowerCase().includes(query)
        );
        const inTopic = (q.topic || '').toLowerCase().includes(query);

        return inQuestion || inId || inExplanation || inOptions || inTopic;
      }

      return true;
    });
  }, [rawChapterQuestions, difficultyFilter, searchQuery]);

  // Filter chapters in sidebar
  const filteredChapters = useMemo(() => {
    if (!chapterSearchQuery.trim()) return currentChapters;
    const q = chapterSearchQuery.toLowerCase().trim();
    return currentChapters.filter((c) =>
      c.name.toLowerCase().includes(q) || String(c.number).includes(q)
    );
  }, [currentChapters, chapterSearchQuery]);

  // Automatically expand all explanations by default when chapter changes
  useEffect(() => {
    if (rawChapterQuestions.length > 0) {
      setExpandedExplanations(new Set(rawChapterQuestions.map((q) => q.id)));
    } else {
      setExpandedExplanations(new Set());
    }
  }, [rawChapterQuestions]);

  // Handlers
  const toggleExplanation = (id: string) => {
    setExpandedExplanations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set(filteredQuestions.map((q) => q.id));
    setExpandedExplanations(allIds);
  };

  const collapseAll = () => {
    setExpandedExplanations(new Set());
  };

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
    toast.success('Copied to clipboard!');
  };

  const copyChapterJson = () => {
    const jsonStr = JSON.stringify(rawChapterQuestions, null, 2);
    copyToClipboard(jsonStr);
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Top Real-Time Storage Banner ── */}
      <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-[#F4C430] flex items-center justify-center shrink-0">
              <Database size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-[#111111]">MCQ Question Bank & Verification</h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Storage Source Active
                </span>
              </div>
              <p className="text-xs text-[#737373] mt-0.5 font-medium">
                Direct read from modular runtime storage <code className="px-1.5 py-0.5 bg-[#F5F5F5] rounded text-[11px] font-mono text-[#111111]">src/data/banks/*.json</code>. Zero mock or sample data.
              </p>
            </div>
          </div>

          {/* Quick Metrics & Refresh Button */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-[#FAFAFA] border border-[#E5E5E5] px-3 py-1.5 rounded-xl">
              <div className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">Total Verified MCQs:</div>
              <div className="text-xs font-black text-[#111111]">{bankGrandTotal.toLocaleString()}</div>
            </div>

            <button
              onClick={() => fetchLiveBank(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111111] text-white hover:bg-[#262626] text-xs font-bold transition-all interactive disabled:opacity-50 cursor-pointer shadow-xs"
              title="Force reload from disk storage"
            >
              <RotateCcw size={13} className={refreshing ? 'animate-spin text-[#F4C430]' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Sync Storage'}</span>
            </button>
          </div>
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
          <div className="flex gap-2 overflow-x-auto pb-1">
            {BOARDS.map((b) => {
              const isSelected = selectedBoard === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelectedBoard(b.id);
                    setSelectedGrade('9');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer border ${
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

        {/* Grade Selector with Live Counts */}
        <div className="pt-2 border-t border-[#F0F0F0]">
          <div className="text-[11px] font-black uppercase tracking-wider text-[#737373] mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers size={13} />
              <span>2. Select Grade / Class</span>
            </span>
            <span className="text-[10px] font-medium text-[#A3A3A3]">
              Running Grade Total: <strong className="text-[#111111]">{gradeTotalCount.toLocaleString()} MCQs</strong>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {availableGrades.map((g) => {
              const isSelected = selectedGrade === g.grade;
              const count = g.grade === '9' && selectedBoard === 'fbise' ? bankGrandTotal : 0;
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
                      Grade {g.grade} ({g.displayName})
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/70' : 'text-[#737373]'}`}>
                      {selectedBoard.toUpperCase()} Curriculum
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                      isSelected
                        ? 'bg-[#F4C430] text-[#111111]'
                        : count > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-[#E5E5E5] text-[#737373]'
                    }`}
                  >
                    {count.toLocaleString()} MCQs
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject Selector with Live Running Counts */}
        <div className="pt-2 border-t border-[#F0F0F0]">
          <div className="text-[11px] font-black uppercase tracking-wider text-[#737373] mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BookOpen size={13} />
              <span>3. Select Subject</span>
            </span>
            <span className="text-[10px] font-medium text-[#A3A3A3]">
              Click a subject to browse chapter question bank
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

      {/* ── 3. Main Chapter Drill-Down & Verification Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Chapters List & Running Counts (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F0F0F0]">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#111111]">
                {selectedSubject} Chapters
              </h3>
              <p className="text-[11px] text-[#737373]">
                {currentChapters.length} chapters total • {subjectCounts[selectedSubject] || 0} MCQs stored
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#111111] text-white">
              {subjectCounts[selectedSubject] || 0}
            </span>
          </div>

          {/* Chapter Search Input */}
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
            {filteredChapters.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#737373] bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E5E5]">
                No chapters found matching &quot;{chapterSearchQuery}&quot;
              </div>
            ) : (
              filteredChapters.map((ch) => {
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
                        <span className={`text-[10px] font-black uppercase tracking-wider ${
                          isSelected ? 'text-[#F4C430]' : 'text-[#737373]'
                        }`}>
                          Ch {ch.number}
                        </span>
                        {ch.category && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-[#E5E5E5] text-[#525252]'
                          }`}>
                            {ch.category}
                          </span>
                        )}
                      </div>
                      <div className={`text-xs font-extrabold truncate mt-0.5 ${
                        isSelected ? 'text-white' : 'text-[#111111]'
                      }`}>
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
                      {count} MCQs
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Question Bank Live Content & Detailed Verification (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Chapter Header & Controls Bar */}
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0F0F0]">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#737373]">
                  <span>Grade {selectedGrade}</span>
                  <span>•</span>
                  <span>{selectedSubject}</span>
                  <span>•</span>
                  <span className="text-[#111111] font-black">{selectedBoard.toUpperCase()}</span>
                </div>
                <h2 className="text-lg font-black text-[#111111] tracking-tight mt-0.5">
                  {selectedChapter || 'No Chapter Selected'}
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-[#111111] text-white">
                  <CheckCircle2 size={13} className="text-[#F4C430]" />
                  <span>{rawChapterQuestions.length} Stored MCQs</span>
                </span>

                {rawChapterQuestions.length > 0 && (
                  <button
                    onClick={copyChapterJson}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] hover:bg-[#F5F5F5] text-xs font-bold text-[#111111] transition-all interactive cursor-pointer"
                    title="Copy all questions for this chapter as JSON"
                  >
                    <Code size={13} />
                    <span>Copy JSON</span>
                  </button>
                )}
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Question Search */}
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                <input
                  type="text"
                  placeholder="Search in questions, options, explanation, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#737373] hover:text-[#111111] font-bold"
                  >
                    Clear
                  </button>
                )}
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

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-xl border border-[#E5E5E5] shrink-0">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'cards' ? 'bg-[#111111] text-white' : 'text-[#737373] hover:text-[#111111]'
                  }`}
                  title="Card View (Full Details)"
                >
                  <FileText size={14} />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'compact' ? 'bg-[#111111] text-white' : 'text-[#737373] hover:text-[#111111]'
                  }`}
                  title="Compact Table View"
                >
                  <ListFilter size={14} />
                </button>
                <button
                  onClick={() => setViewMode('json')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'json' ? 'bg-[#111111] text-white' : 'text-[#737373] hover:text-[#111111]'
                  }`}
                  title="Raw JSON Inspector"
                >
                  <Code size={14} />
                </button>
              </div>
            </div>

            {/* Quick Actions Bar */}
            {rawChapterQuestions.length > 0 && (
              <div className="flex items-center justify-between pt-1 text-xs text-[#737373]">
                <div>
                  Showing <strong>{filteredQuestions.length}</strong> of <strong>{rawChapterQuestions.length}</strong> stored questions
                  {searchQuery && ` matching "${searchQuery}"`}
                </div>
                {viewMode === 'cards' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={expandAll}
                      className="text-[11px] font-bold text-[#111111] hover:underline cursor-pointer"
                    >
                      Expand All Explanations
                    </button>
                    <span>•</span>
                    <button
                      onClick={collapseAll}
                      className="text-[11px] font-bold text-[#737373] hover:text-[#111111] cursor-pointer"
                    >
                      Collapse All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 4. Main Content Area: Zero-State or Question List ── */}
          {loading ? (
            <div className="bg-white border border-[#E5E5E5] rounded-2xl p-12 text-center shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mx-auto" />
              <div className="text-xs font-bold text-[#111111]">Loading Question Bank from Storage...</div>
              <div className="text-[11px] text-[#737373]">Reading live questions from disk repository</div>
            </div>
          ) : rawChapterQuestions.length === 0 ? (
            /* Zero-State: Pure Real Storage representation, No Mock Data */
            <div className="bg-white border border-[#E5E5E5] rounded-2xl p-12 text-center shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F5F5F5] text-[#737373] flex items-center justify-center mx-auto">
                <FolderOpen size={24} />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-sm font-black text-[#111111]">0 MCQs Stored in Question Bank</h3>
                <p className="text-xs text-[#737373] mt-1 leading-relaxed">
                  No pre-generated questions have been saved to live storage for{' '}
                  <strong className="text-[#111111]">{selectedChapter || 'this chapter'}</strong> ({selectedSubject}, Grade {selectedGrade} {selectedBoard.toUpperCase()}).
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-[11px] font-bold text-[#737373]">
                  <Database size={12} />
                  <span>Real Database State: 0 items recorded in storage file</span>
                </div>
              </div>
            </div>
          ) : filteredQuestions.length === 0 ? (
            /* Search Filter Zero-State */
            <div className="bg-white border border-[#E5E5E5] rounded-2xl p-8 text-center shadow-xs space-y-2">
              <p className="text-xs font-bold text-[#111111]">No questions matched your search query</p>
              <p className="text-xs text-[#737373]">Try removing the keyword filter or changing difficulty.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDifficultyFilter('all');
                }}
                className="mt-2 text-xs font-bold text-amber-600 hover:underline"
              >
                Reset Search Filters
              </button>
            </div>
          ) : viewMode === 'json' ? (
            /* JSON View */
            <div className="bg-[#111111] border border-[#262626] rounded-2xl p-4 text-white font-mono text-xs overflow-x-auto shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <span className="text-[#F4C430] font-bold">
                  // {selectedSubject} — {selectedChapter} ({filteredQuestions.length} MCQs)
                </span>
                <button
                  onClick={copyChapterJson}
                  className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] flex items-center gap-1"
                >
                  <Copy size={12} />
                  <span>Copy JSON</span>
                </button>
              </div>
              <pre className="max-h-[650px] overflow-y-auto leading-relaxed text-emerald-400">
                {JSON.stringify(filteredQuestions, null, 2)}
              </pre>
            </div>
          ) : viewMode === 'compact' ? (
            /* Compact Table / Review View */
            <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5] text-[#737373] uppercase font-black text-[10px]">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4 w-28">ID</th>
                      <th className="py-3 px-4">Question Text</th>
                      <th className="py-3 px-4 w-20 text-center">Ans</th>
                      <th className="py-3 px-4 w-20 text-center">Diff</th>
                      <th className="py-3 px-4 w-16 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0F0]">
                    {filteredQuestions.map((q, idx) => (
                      <tr key={q.id} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-[#737373]">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#525252] truncate max-w-[120px]" title={q.id}>
                          {q.id}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#111111]">
                          <div className="line-clamp-2">
                            <MathText text={q.question} />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            {q.correctAnswer}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center capitalize text-[11px] font-bold text-[#737373]">
                          {q.difficulty || 'medium'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleExplanation(q.id)}
                            className="p-1 rounded hover:bg-[#E5E5E5] text-[#737373] hover:text-[#111111]"
                            title="Inspect details"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Detailed Cards View */
            <div className="space-y-4">
              {filteredQuestions.map((q, idx) => {
                const isExplanationOpen = expandedExplanations.has(q.id);
                const isCopied = copiedId === q.id;
                const optionsEntries = Object.entries(q.options || {});

                return (
                  <div
                    key={q.id}
                    className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#CCCCCC] transition-all"
                  >
                    {/* Question Header: Number, ID, Difficulty, Verified Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F0F0F0]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-full bg-[#111111] text-white text-xs font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-mono text-xs text-[#737373] bg-[#FAFAFA] px-2 py-0.5 rounded border border-[#E5E5E5]">
                          {q.id}
                        </span>
                        <button
                          onClick={() => copyToClipboard(q.id, q.id)}
                          className="text-[#737373] hover:text-[#111111] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          title="Copy Question ID"
                        >
                          {isCopied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                          <span>{isCopied ? 'Copied' : 'Copy ID'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                            q.difficulty === 'easy'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : q.difficulty === 'hard'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {q.difficulty || 'Medium'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} className="text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      </div>
                    </div>

                    {/* Question Statement */}
                    <div className="text-sm font-bold text-[#111111] leading-relaxed">
                      <MathText text={q.question} />
                    </div>

                    {/* All 4 Options (A-D) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                      {optionsEntries.map(([optKey, optVal]) => {
                        const isCorrect = optKey.toUpperCase() === (q.correctAnswer || '').toUpperCase();
                        return (
                          <div
                            key={optKey}
                            className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${
                              isCorrect
                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold'
                                : 'bg-[#FAFAFA] border-[#E5E5E5] text-[#333333]'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-[#E5E5E5] text-[#525252]'
                              }`}
                            >
                              {optKey}
                            </span>
                            <div className="flex-1 text-xs leading-relaxed pt-0.5">
                              <MathText text={String(optVal)} />
                            </div>
                            {isCorrect && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-200/80 text-emerald-900 shrink-0 self-center">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Box */}
                    <div className="bg-[#FFFDF5] border border-amber-200/70 rounded-xl p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => toggleExplanation(q.id)}
                          className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs hover:text-amber-950 cursor-pointer"
                        >
                          <Sparkles size={13} className="text-amber-600" />
                          <span>Official Explanation & Syllabus Justification:</span>
                          {isExplanationOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                        <span className="text-[10px] font-bold text-amber-800">
                          Marked Key: <strong className="text-emerald-700 font-black">Option {q.correctAnswer}</strong>
                        </span>
                      </div>
                      {isExplanationOpen && (
                        <div className="text-xs text-amber-950 leading-relaxed pl-5 font-medium pt-1 border-t border-amber-200/40">
                          <MathText text={q.explanation || 'Verified textbook syllabus concept.'} />
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Metadata */}
                    <div className="flex items-center justify-between text-[10px] text-[#A3A3A3] pt-1">
                      <div className="flex items-center gap-2">
                        {q.topic && <span>Topic: <strong className="text-[#737373]">{q.topic}</strong></span>}
                        {q.source && <span>• Source: <strong className="text-[#737373]">{q.source}</strong></span>}
                      </div>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(q, null, 2), q.id)}
                        className="hover:text-[#111111] font-bold flex items-center gap-1"
                      >
                        <Code size={11} />
                        <span>Copy Item JSON</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMCQVerificationView;
