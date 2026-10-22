import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  BookOpen,
  RotateCcw,
  FileCheck2,
  GraduationCap,
  ChevronDown,
  Upload,
  X,
  Send,
  Eye,
  Trash2,
  FileText,
  Award,
  Layers,
  CheckCircle2,
  Clock,
  PenTool,
  FileEdit,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '../../components/admin/AdminShell';
import TeacherTestCard from '../../components/teacher/TeacherTestCard';
import TeacherSubmissionsPanel from '../../components/teacher/TeacherSubmissionsPanel';
import TestUploadModal from '../../components/teacher/TestUploadModal';
import TestViewerModal from '../../components/common/TestViewerModal';
import StudentResultsView from '../../components/tests/StudentResultsView';
import AdminCreateTestModal from '../../components/admin/tests/AdminCreateTestModal';
import AdminCreateUnifiedTestModal from '../../components/admin/tests/AdminCreateUnifiedTestModal';
import { WrittenTestSubmissionsList } from '../../components/teacher/WrittenTestSubmissionsList';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { getAllTests, deleteTestPaper } from '../../lib/db';
import { getGradesForBoard, BOARDS } from '../../lib/taxonomy';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import {
  getProctoredMCQTests,
  publishProctoredMCQTest,
  deleteProctoredMCQTest,
} from '../../lib/proctoredMcqService';
import {
  getWrittenTests,
  publishWrittenTest,
  deleteWrittenTest,
} from '../../lib/writtenTestService';
import type { TestPaper, TestSubmission } from '../../types';
import type { ProctoredMCQTest } from '../../types/proctoredMcq';
import type { WrittenTest } from '../../types/writtenTest';

const SHORT_BOARD_NAMES: Record<string, string> = {
  fbise: 'FBISE',
  punjab: 'Punjab',
  sindh: 'Sindh',
  kpk: 'KPK',
  olevel: 'O Levels',
  alevel: 'A Levels',
  ielts: 'IELTS',
};

export const AdminTestsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab navigation: 'class-test' vs 'student-results'
  const rawTab = searchParams.get('tab');
  const activeTab: 'class-test' | 'student-results' =
    rawTab === 'student-results' || rawTab === 'results'
      ? 'student-results'
      : 'class-test';

  const setActiveTab = (tab: 'class-test' | 'student-results') => {
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'class-test') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
    }
    setSearchParams(newParams);
  };

  const [tests, setTests] = useState<TestPaper[]>([]);
  const [proctoredTests, setProctoredTests] = useState<ProctoredMCQTest[]>([]);
  const [writtenTests, setWrittenTests] = useState<WrittenTest[]>([]);
  const [testTypeFilter, setTestTypeFilter] = useState<
    'all' | 'unified' | 'proctored' | 'short_question' | 'long_question' | 'standard'
  >('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [selectedWrittenTestId, setSelectedWrittenTestId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isCreateUnifiedModalOpen, setIsCreateUnifiedModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [showActionDropdown, setShowActionDropdown] = useState<boolean>(false);
  const actionDropdownRef = useRef<HTMLDivElement>(null);
  const [viewingTest, setViewingTest] = useState<TestPaper | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<TestSubmission | null>(null);
  const [viewingMCQTest, setViewingMCQTest] = useState<ProctoredMCQTest | null>(null);
  const [viewingWrittenTest, setViewingWrittenTest] = useState<WrittenTest | null>(null);

  // Active (...) card dropdown menu ID
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const cardMenuRef = useRef<HTMLDivElement>(null);

  // Confirm delete modal states
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    title: string;
    type: 'mcq' | 'written' | 'standard';
  } | null>(null);

  // Lock background scroll for modals
  const isAnyInspectionModalOpen = Boolean(viewingMCQTest) || Boolean(viewingWrittenTest);
  useModalScrollLock(isAnyInspectionModalOpen);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionDropdownRef.current &&
        !actionDropdownRef.current.contains(event.target as Node)
      ) {
        setShowActionDropdown(false);
      }
      if (cardMenuRef.current && !cardMenuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filters
  const [selectedBoard, setSelectedBoard] = useState<string>('fbise');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allTests, allMCQTests, allWrittenTests] = await Promise.all([
        getAllTests(),
        getProctoredMCQTests('admin').catch(() => []),
        getWrittenTests().catch(() => []),
      ]);
      setTests(allTests);
      setProctoredTests(allMCQTests);
      setWrittenTests(allWrittenTests);
      if (!selectedTestId && allTests.length > 0) {
        setSelectedTestId(allTests[0].id);
      }
    } catch (err) {
      console.error('Error fetching tests for admin:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishMCQ = async (testId: string) => {
    try {
      const updated = await publishProctoredMCQTest(testId, 'admin');
      toast.success('Test published! Students can now access this test with their Student ID.');
      setProctoredTests((prev) => prev.map((t) => (t.id === testId ? updated : t)));
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish test.');
    }
  };

  const handlePublishWrittenTest = async (testId: string) => {
    try {
      const updated = await publishWrittenTest(testId);
      toast.success('Written test published to assigned students!');
      setWrittenTests((prev) => prev.map((t) => (t.id === testId ? updated : t)));
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish test.');
    }
  };

  // Safe delete flow with ConfirmModal
  const triggerDelete = (id: string, title: string, type: 'mcq' | 'written' | 'standard') => {
    setActiveMenuId(null);
    setItemToDelete({ id, title, type });
    setConfirmDeleteOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'mcq') {
        await deleteProctoredMCQTest(itemToDelete.id, 'admin');
        setProctoredTests((prev) => prev.filter((t) => t.id !== itemToDelete.id));
        toast.success(`MCQ test "${itemToDelete.title}" deleted.`);
      } else if (itemToDelete.type === 'written') {
        await deleteWrittenTest(itemToDelete.id);
        setWrittenTests((prev) => prev.filter((t) => t.id !== itemToDelete.id));
        if (selectedWrittenTestId === itemToDelete.id) {
          setSelectedWrittenTestId(null);
        }
        toast.success(`Written test "${itemToDelete.title}" deleted.`);
      } else {
        await deleteTestPaper(itemToDelete.id);
        setTests((prev) => prev.filter((t) => t.id !== itemToDelete.id));
        if (selectedTestId === itemToDelete.id) {
          setSelectedTestId(null);
        }
        toast.success(`Test paper "${itemToDelete.title}" deleted.`);
      }
      setConfirmDeleteOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete test.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useRealtimeTable({
    table: 'tests',
    debounceMs: 1500,
    onAny: () => fetchData(),
  });

  useRealtimeTable({
    table: 'test_submissions',
    debounceMs: 1500,
    onAny: () => fetchData(),
  });

  const availableGrades = getGradesForBoard(selectedBoard);

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const testBoard = t.board || t.board_id || 'fbise';
      const matchesBoard = !selectedBoard || selectedBoard === 'all' || testBoard === selectedBoard;
      const matchesGrade = gradeFilter === 'all' || t.grade === gradeFilter;
      const matchesSubject = subjectFilter === 'all' || t.subject === subjectFilter;
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.teacher_name || '').toLowerCase().includes(q) ||
        (t.instructions || '').toLowerCase().includes(q);

      return matchesBoard && matchesGrade && matchesSubject && matchesSearch;
    });
  }, [tests, selectedBoard, gradeFilter, subjectFilter, searchTerm]);

  const filteredProctoredTests = useMemo(() => {
    return proctoredTests.filter((t) => {
      const matchesBoard = !selectedBoard || selectedBoard === 'all' || (t.board || 'fbise') === selectedBoard;
      const matchesGrade = gradeFilter === 'all' || String(t.grade) === gradeFilter;
      const matchesSubject = subjectFilter === 'all' || t.subject.toLowerCase() === subjectFilter.toLowerCase();
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.instructions || '').toLowerCase().includes(q);

      return matchesBoard && matchesGrade && matchesSubject && matchesSearch;
    });
  }, [proctoredTests, selectedBoard, gradeFilter, subjectFilter, searchTerm]);

  const filteredWrittenTests = useMemo(() => {
    return writtenTests.filter((t) => {
      const matchesBoard = !selectedBoard || selectedBoard === 'all' || (t.board || 'fbise') === selectedBoard;
      const matchesGrade = gradeFilter === 'all' || String(t.grade) === gradeFilter;
      const matchesSubject = subjectFilter === 'all' || t.subject.toLowerCase() === subjectFilter.toLowerCase();
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.instructions || '').toLowerCase().includes(q);

      return matchesBoard && matchesGrade && matchesSubject && matchesSearch;
    });
  }, [writtenTests, selectedBoard, gradeFilter, subjectFilter, searchTerm]);

  const selectedTest = tests.find((t) => t.id === selectedTestId) || filteredTests[0] || null;
  const selectedWrittenTest = writtenTests.find((w) => w.id === selectedWrittenTestId) || null;

  const handleBoardChange = (bId: string) => {
    setSelectedBoard(bId);
    setGradeFilter('all');
    setSubjectFilter('all');
  };

  const resetFilters = () => {
    setSelectedBoard('fbise');
    setGradeFilter('all');
    setSubjectFilter('all');
    setSearchTerm('');
  };

  const handleTestUploadSuccess = (newTest: TestPaper) => {
    setTests((prev) => [newTest, ...prev]);
    setSelectedTestId(newTest.id);
  };

  const totalAssessmentsCount = tests.length + proctoredTests.length + writtenTests.length;

  return (
    <AdminShell>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Testing Center
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
                UI v2
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Institutional examination management, proctored tests, written assessments, and student grading.
            </p>
          </div>

          {activeTab === 'class-test' && (
            <div className="w-full sm:w-auto flex items-center gap-2.5 shrink-0">
              {/* Primary Action Button with Dropdown */}
              <div className="relative w-full sm:w-auto" ref={actionDropdownRef}>
                <button
                  id="admin-upload-create-test-btn"
                  onClick={() => setShowActionDropdown((prev) => !prev)}
                  className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-between sm:justify-start gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-amber-400 text-xs font-bold transition-all shadow-xs cursor-pointer border border-neutral-900 dark:bg-amber-400 dark:text-neutral-950 dark:hover:bg-amber-300"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Create / Upload Test</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      showActionDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {showActionDropdown && (
                  <div className="absolute left-0 right-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-80 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 border-b border-neutral-100 dark:border-neutral-700 mb-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                        Select Test Creation Method
                      </p>
                    </div>

                    {/* Option 1: Create a Test (Unified) */}
                    <button
                      id="admin-menu-create-unified-test-btn"
                      onClick={() => {
                        setShowActionDropdown(false);
                        setIsCreateUnifiedModalOpen(true);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/60 transition-colors flex items-start gap-2.5 group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-neutral-900 text-amber-400 flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          Create Online Test
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                          MCQs, short and long questions with digital submissions and student camera proctoring.
                        </p>
                      </div>
                    </button>

                    {/* Option 2: AI & Question Bank */}
                    <button
                      id="admin-menu-create-bank-btn"
                      onClick={() => {
                        setShowActionDropdown(false);
                        setIsCreateModalOpen(true);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/60 transition-colors flex items-start gap-2.5 group cursor-pointer mt-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                            Create from Question Bank
                          </p>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                            Bank
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                          Select from verified curriculum questions or auto-generate with exam layout.
                        </p>
                      </div>
                    </button>

                    {/* Option 3: Manual PDF Upload */}
                    <button
                      id="admin-menu-upload-pdf-btn"
                      onClick={() => {
                        setShowActionDropdown(false);
                        setIsUploadModalOpen(true);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/60 transition-colors flex items-start gap-2.5 group cursor-pointer mt-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          Upload Test Paper (PDF)
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                          Upload prepared PDF question paper and assign due date to classes.
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── SUBSECTION TABS: CLASS TEST vs STUDENT RESULTS ── */}
        <div className="flex items-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit max-w-full overflow-x-auto no-scrollbar">
          <button
            id="admin-tab-class-test"
            onClick={() => setActiveTab('class-test')}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'class-test'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <FileCheck2 className={`w-4 h-4 ${activeTab === 'class-test' ? 'text-amber-500' : 'text-neutral-400'}`} />
            <span>Class Tests</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
              {loading ? '…' : totalAssessmentsCount}
            </span>
          </button>

          <button
            id="admin-tab-student-results"
            onClick={() => setActiveTab('student-results')}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'student-results'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <GraduationCap className={`w-4 h-4 ${activeTab === 'student-results' ? 'text-amber-500' : 'text-neutral-400'}`} />
            <span>Student Results</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
              Grading
            </span>
          </button>
        </div>

        {activeTab === 'student-results' ? (
          <StudentResultsView isTeacher={false} />
        ) : (
          <>
            {/* ── BOARD SELECTOR BAR: SHORT LABELS, NO OVERFLOW ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full pb-1">
                {BOARDS.map((b) => {
                  const label = SHORT_BOARD_NAMES[b.id] || b.name;
                  const isSelected = selectedBoard === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => handleBoardChange(b.id)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-900 text-amber-400 dark:bg-amber-400 dark:text-neutral-950 shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {(selectedBoard !== 'fbise' || gradeFilter !== 'all' || subjectFilter !== 'all' || searchTerm !== '') && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="min-h-[44px] text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 inline-flex items-center gap-1 whitespace-nowrap shrink-0 self-start sm:self-center"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {/* ── SEARCH & FILTER CONTROLS ── */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs space-y-3">
              <div className="flex flex-col lg:flex-row gap-3 items-stretch justify-between">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search tests by title, chapter, or teacher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 min-h-[44px] text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Grade Selector */}
                  <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg overflow-x-auto no-scrollbar shrink-0">
                    <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 px-2 whitespace-nowrap">
                      Grade:
                    </span>
                    {['all', ...availableGrades.map((g) => g.grade)].map((g) => (
                      <button
                        key={g}
                        onClick={() => setGradeFilter(g)}
                        className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          gradeFilter === g
                            ? 'bg-neutral-900 text-white dark:bg-amber-400 dark:text-neutral-950 shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                        }`}
                      >
                        {g === 'all'
                          ? `All ${SHORT_BOARD_NAMES[selectedBoard] || selectedBoard}`
                          : `${g}th`}
                      </button>
                    ))}
                  </div>

                  {/* Test Type Selector */}
                  <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg overflow-x-auto no-scrollbar shrink-0">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'unified', label: 'Online Tests' },
                      { id: 'short_question', label: 'Short Qs' },
                      { id: 'long_question', label: 'Long Qs' },
                      { id: 'standard', label: 'PDF Papers' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setTestTypeFilter(type.id as any)}
                        className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          testTypeFilter === type.id
                            ? 'bg-neutral-900 text-white dark:bg-amber-400 dark:text-neutral-950 shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── 2-COLUMN SPLIT PANEL LAYOUT ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Test Papers Directory (5 cols) */}
              <div className="lg:col-span-6 xl:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <span>Assessments & Exam Papers</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      {(testTypeFilter === 'all' || testTypeFilter === 'proctored' ? filteredProctoredTests.length : 0) +
                        (testTypeFilter === 'all' || testTypeFilter === 'unified'
                          ? filteredWrittenTests.filter((w) => w.test_type === 'unified').length
                          : 0) +
                        (testTypeFilter === 'all' || testTypeFilter === 'short_question'
                          ? filteredWrittenTests.filter((w) => w.test_type === 'short_question').length
                          : 0) +
                        (testTypeFilter === 'all' || testTypeFilter === 'long_question'
                          ? filteredWrittenTests.filter((w) => w.test_type === 'long_question').length
                          : 0) +
                        (testTypeFilter === 'all' || testTypeFilter === 'standard' ? filteredTests.length : 0)}
                    </span>
                  </h3>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 h-36 animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                    {/* Proctored MCQ Tests */}
                    {testTypeFilter !== 'standard' &&
                      filteredProctoredTests.map((test) => {
                        const isPublished = test.status === 'published';
                        return (
                          <div
                            key={test.id}
                            className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 p-4 shadow-2xs transition-all text-left flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-2">
                              {/* Title + (...) Safe Menu */}
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1 flex-1">
                                  {test.title}
                                </h4>

                                <div className="relative shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveMenuId(activeMenuId === test.id ? null : test.id)
                                    }
                                    className="p-1.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    aria-label="Test options"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {activeMenuId === test.id && (
                                    <div
                                      ref={cardMenuRef}
                                      className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-30 py-1"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setViewingMCQTest(test);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-2"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-neutral-400" />
                                        <span>Preview Test</span>
                                      </button>

                                      {!isPublished && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveMenuId(null);
                                            handlePublishMCQ(test.id);
                                          }}
                                          className="w-full text-left px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2"
                                        >
                                          <Send className="w-3.5 h-3.5" />
                                          <span>Publish Test</span>
                                        </button>
                                      )}

                                      <div className="border-t border-neutral-100 dark:border-neutral-700 my-1 pt-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            triggerDelete(test.id, test.title, 'mcq')
                                          }
                                          className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>Delete Test...</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Subtitle */}
                              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {test.subject} • Grade {test.grade} • {test.total_marks} Marks
                              </p>

                              {/* Duration & Qs breakdown */}
                              <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{test.duration_minutes}m</span>
                                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1">
                                  <PenTool className="w-3.5 h-3.5" />
                                  <span>{test.questions.length} MCQs</span>
                                </span>
                              </div>

                              {/* Status Tag */}
                              <div className="flex items-center justify-between gap-2 pt-1">
                                <div className="flex items-center gap-2">
                                  {isPublished ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Published
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                      <FileEdit className="w-3 h-3 text-amber-600" />
                                      Draft
                                    </span>
                                  )}
                                  <span className="text-[11px] text-neutral-400">
                                    Camera Proctored
                                  </span>
                                </div>

                                {!isPublished && (
                                  <button
                                    type="button"
                                    onClick={() => handlePublishMCQ(test.id)}
                                    className="px-2.5 py-1 min-h-[44px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                                  >
                                    <Send className="w-3.5 h-3.5" /> Publish
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setActiveTab('student-results')}
                                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>Results</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setViewingMCQTest(test)}
                                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Paper</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}

                    {/* Written & Unified Tests */}
                    {(testTypeFilter === 'all' ||
                      testTypeFilter === 'unified' ||
                      testTypeFilter === 'short_question' ||
                      testTypeFilter === 'long_question') &&
                      filteredWrittenTests
                        .filter(
                          (w) =>
                            testTypeFilter === 'all' ||
                            (testTypeFilter === 'unified'
                              ? w.test_type === 'unified' ||
                                w.test_type === 'short_question' ||
                                w.test_type === 'long_question'
                              : w.test_type === testTypeFilter)
                        )
                        .map((test) => {
                          const isPublished = test.status === 'published';
                          const isUnified = test.test_type === 'unified';
                          const isShort = test.test_type === 'short_question';
                          const isSelected = selectedWrittenTestId === test.id;

                          const mcqCount =
                            test.mcq_count ??
                            test.questions.filter((q) => q.type === 'mcq').length;
                          const shortCount =
                            test.short_count ??
                            test.questions.filter((q) => q.type === 'short_question').length;
                          const longCount =
                            test.long_count ??
                            test.questions.filter((q) => q.type === 'long_question').length;

                          let questionBreakdown = '';
                          if (isUnified) {
                            const parts: string[] = [];
                            if (mcqCount > 0) parts.push(`${mcqCount} MCQ`);
                            if (shortCount > 0) parts.push(`${shortCount} Short`);
                            if (longCount > 0) parts.push(`${longCount} Long`);
                            questionBreakdown =
                              parts.length > 0 ? parts.join(' • ') : `${test.questions.length} Qs`;
                          } else if (isShort) {
                            questionBreakdown = `${test.questions.length} Short Qs`;
                          } else {
                            questionBreakdown = `${test.questions.length} Long Qs`;
                          }

                          return (
                            <div
                              key={test.id}
                              onClick={() => setSelectedWrittenTestId(test.id)}
                              className={`bg-white dark:bg-neutral-900 rounded-xl border transition-all p-4 cursor-pointer text-left flex flex-col justify-between space-y-3 ${
                                isSelected
                                  ? 'border-neutral-900 dark:border-amber-400 ring-2 ring-neutral-900/10 dark:ring-amber-400/20 shadow-sm'
                                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-2xs'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1 flex-1">
                                    {test.title}
                                  </h4>

                                  <div
                                    className="relative shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveMenuId(activeMenuId === test.id ? null : test.id)
                                      }
                                      className="p-1.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                      aria-label="Test options"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {activeMenuId === test.id && (
                                      <div
                                        ref={cardMenuRef}
                                        className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-30 py-1"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveMenuId(null);
                                            setViewingWrittenTest(test);
                                          }}
                                          className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-2"
                                        >
                                          <Eye className="w-3.5 h-3.5 text-neutral-400" />
                                          <span>Preview Test</span>
                                        </button>

                                        {!isPublished && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveMenuId(null);
                                              handlePublishWrittenTest(test.id);
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2"
                                          >
                                            <Send className="w-3.5 h-3.5" />
                                            <span>Publish Test</span>
                                          </button>
                                        )}

                                        <div className="border-t border-neutral-100 dark:border-neutral-700 my-1 pt-1">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              triggerDelete(test.id, test.title, 'written')
                                            }
                                            className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Delete Test...</span>
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                  {test.subject} • Grade {test.grade} • {test.total_marks} Marks
                                </p>

                                <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{test.duration_minutes}m</span>
                                  </span>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1">
                                    <PenTool className="w-3.5 h-3.5" />
                                    <span>{questionBreakdown}</span>
                                  </span>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-1">
                                  <div className="flex items-center gap-2">
                                    {isPublished ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        Published
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                        <FileEdit className="w-3 h-3 text-amber-600" />
                                        Draft
                                      </span>
                                    )}
                                    <span className="text-[11px] text-neutral-400">
                                      {isUnified ? 'Online' : isShort ? 'Short Qs' : 'Long Qs'} • Camera Proctored
                                    </span>
                                  </div>

                                  {!isPublished && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePublishWrittenTest(test.id);
                                      }}
                                      className="px-2.5 py-1 min-h-[44px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                                    >
                                      <Send className="w-3.5 h-3.5" /> Publish
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div
                                className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => setSelectedWrittenTestId(test.id)}
                                  className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    isSelected
                                      ? 'bg-neutral-900 text-amber-400 dark:bg-amber-400 dark:text-neutral-950 shadow-xs'
                                      : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                                  }`}
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Grade</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setViewingWrittenTest(test)}
                                  className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Paper</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}

                    {/* Standard PDF Test Cards */}
                    {(testTypeFilter === 'all' || testTypeFilter === 'standard') &&
                      filteredTests.map((test) => (
                        <TeacherTestCard
                          key={test.id}
                          test={test}
                          isSelected={selectedTest?.id === test.id}
                          canDelete={true}
                          onSelect={(t) => setSelectedTestId(t.id)}
                          onView={(t) => setViewingTest(t)}
                          onDelete={() => triggerDelete(test.id, test.title, 'standard')}
                        />
                      ))}

                    {/* Friendly Empty State */}
                    {filteredTests.length === 0 &&
                      filteredProctoredTests.length === 0 &&
                      filteredWrittenTests.length === 0 && (
                        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 text-center space-y-3">
                          <BookOpen className="w-8 h-8 mx-auto text-neutral-400 animate-pulse" />
                          <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                            No assessments found
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            No tests match the current board, grade, or search criteria.
                          </p>
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                          >
                            Reset filters
                          </button>
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Right Column: Submissions & Grading Workspace (7 cols) */}
              <div className="lg:col-span-6 xl:col-span-7 sticky top-4">
                {selectedWrittenTest ? (
                  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-900 text-amber-400 dark:bg-amber-400 dark:text-neutral-950 flex items-center gap-1">
                            {selectedWrittenTest.test_type === 'short_question' ? (
                              <FileText className="w-3 h-3" />
                            ) : (
                              <BookOpen className="w-3 h-3" />
                            )}
                            {selectedWrittenTest.test_type === 'short_question'
                              ? 'Short Q Test'
                              : 'Long Q Test'}
                          </span>
                          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            Grade {selectedWrittenTest.grade} • {selectedWrittenTest.subject}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                          {selectedWrittenTest.title}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {selectedWrittenTest.questions.length} Questions •{' '}
                          {selectedWrittenTest.duration_minutes} Mins •{' '}
                          {selectedWrittenTest.total_marks} Marks
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingWrittenTest(selectedWrittenTest)}
                          className="min-h-[44px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedWrittenTestId(null)}
                          className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          title="Close grading panel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <WrittenTestSubmissionsList
                      filterTestId={selectedWrittenTest.id}
                      isTeacher={false}
                    />
                  </div>
                ) : (
                  <TeacherSubmissionsPanel
                    selectedTest={selectedTest}
                    onOpenTestViewer={(t: TestPaper) => setViewingTest(t)}
                    onOpenSubmissionViewer={(s: TestSubmission) => setViewingSubmission(s)}
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* ── CREATE / UPLOAD MODALS ── */}
        <AdminCreateTestModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onTestCreated={() => {
            setIsCreateModalOpen(false);
            fetchData();
          }}
        />

        <AdminCreateUnifiedTestModal
          isOpen={isCreateUnifiedModalOpen}
          onClose={() => setIsCreateUnifiedModalOpen(false)}
          onTestCreated={() => {
            setIsCreateUnifiedModalOpen(false);
            fetchData();
          }}
        />

        <TestUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={(newTest) => {
            setIsUploadModalOpen(false);
            handleTestUploadSuccess(newTest);
          }}
          defaultBoard={selectedBoard}
          defaultGrade={gradeFilter !== 'all' ? gradeFilter : undefined}
          defaultSubject={subjectFilter !== 'all' ? subjectFilter : undefined}
        />

        {/* ── VIEWER MODALS ── */}
        {viewingTest && (
          <TestViewerModal
            test={viewingTest}
            onClose={() => setViewingTest(null)}
          />
        )}

        {viewingSubmission && (
          <TestViewerModal
            submission={viewingSubmission}
            onClose={() => setViewingSubmission(null)}
          />
        )}

        {viewingMCQTest && (
          <TestViewerModal
            onClose={() => setViewingMCQTest(null)}
            test={{
              id: viewingMCQTest.id,
              title: viewingMCQTest.title,
              subject: viewingMCQTest.subject,
              grade: String(viewingMCQTest.grade),
              board_id: viewingMCQTest.board || 'fbise',
              total_marks: viewingMCQTest.total_marks,
              duration_minutes: viewingMCQTest.duration_minutes,
              instructions: viewingMCQTest.instructions,
              due_date: new Date().toISOString(),
              created_at: viewingMCQTest.created_at,
              file_url: null,
            } as any}
          />
        )}

        {viewingWrittenTest && (
          <TestViewerModal
            onClose={() => setViewingWrittenTest(null)}
            test={{
              id: viewingWrittenTest.id,
              title: viewingWrittenTest.title,
              subject: viewingWrittenTest.subject,
              grade: String(viewingWrittenTest.grade),
              board_id: viewingWrittenTest.board || 'fbise',
              total_marks: viewingWrittenTest.total_marks,
              duration_minutes: viewingWrittenTest.duration_minutes,
              instructions: viewingWrittenTest.instructions,
              due_date: new Date().toISOString(),
              created_at: viewingWrittenTest.created_at,
              file_url: null,
            } as any}
          />
        )}

        {/* ── CONFIRM DELETE MODAL ── */}
        <ConfirmModal
          open={confirmDeleteOpen}
          onClose={() => {
            setConfirmDeleteOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={executeDelete}
          title={`Delete "${itemToDelete?.title}"?`}
          description="Are you sure you want to delete this test? All student responses, submitted files, and grade sheets linked to this test will be permanently removed."
          confirmLabel="Delete Test"
          cancelLabel="Cancel"
          danger={true}
        />
      </div>
    </AdminShell>
  );
};

export default AdminTestsPage;
