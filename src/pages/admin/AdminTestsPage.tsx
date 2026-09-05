import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  X,
  ShieldAlert,
  Send,
  Lock,
  Eye,
  Trash2,
  FileText,
  Camera,
  Award,
  Layers,
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
import { getAllTests } from '../../lib/db';
import { getGradesForBoard, BOARDS } from '../../lib/taxonomy';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
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

export const AdminTestsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab navigation simplified: 'class-test' vs 'student-results'
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
  const [testTypeFilter, setTestTypeFilter] = useState<'all' | 'unified' | 'proctored' | 'short_question' | 'long_question' | 'standard'>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [selectedWrittenTestId, setSelectedWrittenTestId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isCreateUnifiedModalOpen, setIsCreateUnifiedModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState<boolean>(false);
  const [showActionDropdown, setShowActionDropdown] = useState<boolean>(false);
  const actionDropdownRef = useRef<HTMLDivElement>(null);
  const [viewingTest, setViewingTest] = useState<TestPaper | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<TestSubmission | null>(null);
  const [viewingMCQTest, setViewingMCQTest] = useState<ProctoredMCQTest | null>(null);
  const [viewingWrittenTest, setViewingWrittenTest] = useState<WrittenTest | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionDropdownRef.current && !actionDropdownRef.current.contains(event.target as Node)) {
        setShowActionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
      toast.success('Test published! Students can now see and access this test using their Student ID.');
      setProctoredTests((prev) => prev.map((t) => (t.id === testId ? updated : t)));
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish test.');
    }
  };

  const handleDeleteMCQ = async (testId: string) => {
    if (!window.confirm('Are you sure you want to delete this proctored MCQ test?')) return;
    try {
      await deleteProctoredMCQTest(testId, 'admin');
      toast.success('Proctored MCQ test deleted.');
      setProctoredTests((prev) => prev.filter((t) => t.id !== testId));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete test.');
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

  const handleDeleteWrittenTest = async (testId: string) => {
    if (!window.confirm('Are you sure you want to delete this written test?')) return;
    try {
      await deleteWrittenTest(testId);
      toast.success('Written test deleted.');
      setWrittenTests((prev) => prev.filter((t) => t.id !== testId));
    } catch (err: any) {
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

  const filteredTests = tests.filter((t) => {
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

  const filteredProctoredTests = proctoredTests.filter((t) => {
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

  const filteredWrittenTests = writtenTests.filter((t) => {
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

  const handleTestDelete = (testId: string) => {
    setTests((prev) => prev.filter((t) => t.id !== testId));
    if (selectedTestId === testId) {
      setSelectedTestId(null);
    }
  };

  return (
    <AdminShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-black text-[#111111] tracking-tight">Testing Center</h1>
          <p className="text-xs text-[#737373] mt-1">
            Institutional test management across Grades 9–12, curriculum question bank, and school-wide student MCQ performance.
          </p>
        </div>

        {activeTab === 'class-test' && (
          <div className="w-full sm:w-auto flex items-center gap-2.5 shrink-0">
            {/* Primary Unified Action Button with Dropdown */}
            <div className="relative w-full sm:w-auto" ref={actionDropdownRef}>
              <button
                id="admin-upload-create-test-btn"
                onClick={() => setShowActionDropdown((prev) => !prev)}
                className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2 px-4 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-[#F4C430] text-xs font-black transition-all shadow-sm cursor-pointer border border-[#111111]"
              >
                <div className="flex items-center gap-2">
                  <Plus size={16} />
                  <span>Upload / Create Test Paper</span>
                </div>
                <ChevronDown size={14} className={`text-[#A3A3A3] transition-transform duration-200 ${showActionDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Action Dropdown Menu */}
              {showActionDropdown && (
                <div className="absolute left-0 right-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-88 bg-white rounded-2xl border border-[#E5E5E5] shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-[#F0F0F0] mb-1">
                    <p className="text-[11px] font-black uppercase tracking-wider text-[#737373]">Select Test Paper Method</p>
                  </div>

                  {/* Unified Option: Create a Test */}
                  <button
                    id="admin-menu-create-unified-test-btn"
                    onClick={() => {
                      setShowActionDropdown(false);
                      setIsCreateUnifiedModalOpen(true);
                    }}
                    className="w-full text-left p-2.5 sm:p-3 rounded-xl hover:bg-amber-50/80 transition-colors flex items-start gap-2.5 sm:gap-3 group cursor-pointer border border-transparent hover:border-amber-300"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#111111] border border-black flex items-center justify-center text-[#F4C430] shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      <Layers size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-black text-[#111111]">Create a Test</p>
                      </div>
                      <p className="text-[11px] text-[#737373] mt-0.5 leading-snug break-words">
                        Write your own questions — multiple choice, short answers, or long answers — and students complete them on their phone with photo/camera answers where needed.
                      </p>
                    </div>
                  </button>
                  
                  {/* Option 4: Create from Question Bank / AI */}
                  <button
                    id="admin-menu-create-bank-btn"
                    onClick={() => {
                      setShowActionDropdown(false);
                      setIsCreateModalOpen(true);
                    }}
                    className="w-full text-left p-2.5 sm:p-3 rounded-xl hover:bg-[#FAF9F5] transition-colors flex items-start gap-2.5 sm:gap-3 group cursor-pointer border border-transparent hover:border-amber-200/60 mt-1"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 group-hover:scale-105 transition-transform">
                      <FileCheck2 size={18} className="text-[#F4C430]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-black text-[#111111]">Create Class Test Paper</p>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">AI & Bank</span>
                      </div>
                      <p className="text-[11px] text-[#737373] mt-0.5 leading-snug break-words">
                        Auto-generate structured exam papers with MCQs, short & long questions, custom marks & live PDF layout.
                      </p>
                    </div>
                  </button>

                  {/* Option 3: Manual Upload */}
                  <button
                    id="admin-menu-upload-pdf-btn"
                    onClick={() => {
                      setShowActionDropdown(false);
                      setIsUploadModalOpen(true);
                    }}
                    className="w-full text-left p-2.5 sm:p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors flex items-start gap-2.5 sm:gap-3 group cursor-pointer border border-transparent hover:border-blue-200/60 mt-1"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 group-hover:scale-105 transition-transform">
                      <Upload size={18} className="text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-black text-[#111111]">Upload Test Paper (PDF)</p>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#F0F0F0] text-[#737373]">Manual</span>
                      </div>
                      <p className="text-[11px] text-[#737373] mt-0.5 leading-snug break-words">
                        Upload your own prepared test PDF file, configure due date, and assign to students.
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Subsection Tab Switcher - Simplified to ONLY Class Test & Student Results */}
      <div className="flex items-center gap-2 p-1.5 bg-[#EBEBEB] rounded-2xl w-fit mb-6">
        <button
          id="admin-tab-class-test"
          onClick={() => setActiveTab('class-test')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'class-test'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'text-[#525252] hover:text-[#111111] hover:bg-black/5'
          }`}
        >
          <FileCheck2 size={15} className={activeTab === 'class-test' ? 'text-[#F4C430]' : 'text-[#737373]'} />
          <span>Class Test</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'class-test' ? 'bg-white/20 text-white' : 'bg-black/5 text-[#737373]'
            }`}
          >
            {tests.length + proctoredTests.length + writtenTests.length}
          </span>
        </button>

        <button
          id="admin-tab-student-results"
          onClick={() => setActiveTab('student-results')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'student-results'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'text-[#525252] hover:text-[#111111] hover:bg-black/5'
          }`}
        >
          <GraduationCap size={15} className={activeTab === 'student-results' ? 'text-[#F4C430]' : 'text-[#737373]'} />
          <span>Student Results</span>
          <span className="badge badge-gold text-[10px] font-extrabold px-1.5 py-0.5">
            Grading
          </span>
        </button>
      </div>

      {activeTab === 'student-results' ? (
        <StudentResultsView isTeacher={false} />
      ) : (
        <>
          {/* Board Selector Tabs */}
          <div className="border-b border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex overflow-x-auto gap-6 border-transparent">
              {BOARDS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleBoardChange(b.id)}
                  className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${
                    selectedBoard === b.id
                      ? 'border-[#F4C430] text-[#111111]'
                      : 'border-transparent text-[#737373] hover:text-[#111111]'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>

            {(selectedBoard !== 'fbise' || gradeFilter !== 'all' || subjectFilter !== 'all' || searchTerm !== '') && (
              <button
                onClick={resetFilters}
                className="text-[10px] font-black text-amber-600 hover:text-[#111111] flex items-center gap-0.5 interactive pb-2 sm:pb-0"
              >
                <RotateCcw size={10} />
                Reset Filters
              </button>
            )}
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch justify-between mb-6 bg-white p-4 border border-[#E5E5E5] rounded-2xl shadow-xs">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
              <input
                type="text"
                placeholder="Search tests by title, chapter, or teacher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Grade Selector */}
              <div className="flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-xl border border-[#E5E5E5]">
                <span className="text-[11px] font-bold text-[#737373] px-2">Grade:</span>
                {['all', ...availableGrades.map((g) => g.grade)].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGradeFilter(g)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      gradeFilter === g
                        ? 'bg-[#111111] text-white shadow-xs'
                        : 'text-[#525252] hover:text-[#111111]'
                    }`}
                  >
                    {g === 'all' ? (selectedBoard === 'sindh' ? 'All Sindh' : selectedBoard === 'ielts' ? 'All IELTS' : 'All FBISE') : `${g}th`}
                  </button>
                ))}
              </div>

              {/* Test Type Filter: All vs Online Tests vs Short Qs vs Long Qs vs PDF Papers */}
              <div className="flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-xl border border-[#E5E5E5] flex-wrap">
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      testTypeFilter === type.id
                        ? 'bg-[#111111] text-white shadow-xs'
                        : 'text-[#525252] hover:text-[#111111]'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2-Column Split-Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Test Papers (5 Cols) */}
            <div className="lg:col-span-6 xl:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#111111] flex items-center gap-2">
                  <span>Class Tests & Assessments</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F5F5F5] text-[#737373]">
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

              {loading && tests.length === 0 && proctoredTests.length === 0 ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="bg-white rounded-2xl border border-[#E5E5E5] p-5 h-36" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {/* Proctored MCQ Tests Section */}
                  {testTypeFilter !== 'standard' &&
                    filteredProctoredTests.map((test) => {
                      const isPublished = test.status === 'published';
                      return (
                        <div
                          key={test.id}
                          className="bg-white rounded-2xl border-2 border-[#111111]/10 hover:border-[#111111] p-4 shadow-xs transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#111111] text-[#F4C430] flex items-center gap-1 shadow-2xs">
                                <ShieldAlert size={11} />
                                Proctored MCQ
                              </span>
                              {isPublished ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <Lock size={10} /> Published to Students
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                  Draft (Hidden from Students)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setViewingMCQTest(test)}
                                className="p-1.5 rounded-lg text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] cursor-pointer"
                                title="View Questions & Answer Keys"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteMCQ(test.id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                title="Delete Test"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-black text-[#111111] leading-tight">{test.title}</h4>
                            <p className="text-[11px] font-medium text-[#737373] mt-1">
                              {test.subject} • Grade {test.grade} • {test.duration_minutes} Mins • {test.questions.length} MCQs • {test.total_marks} Marks
                            </p>
                          </div>

                          <div className="pt-2 border-t border-[#F0F0F0] flex items-center justify-between gap-2">
                            <span className="text-[11px] text-[#737373] font-mono">
                              Student ID Access
                            </span>

                            {!isPublished ? (
                              <button
                                onClick={() => handlePublishMCQ(test.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer active:scale-95 transition-all"
                              >
                                <Send size={12} />
                                <span>Publish to Students</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setViewingMCQTest(test)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] text-xs font-bold text-[#111111] cursor-pointer hover:bg-[#F0F0F0]"
                              >
                                <span>Inspect Questions</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {/* Written & Unified Tests Section */}
                  {(testTypeFilter === 'all' || testTypeFilter === 'unified' || testTypeFilter === 'short_question' || testTypeFilter === 'long_question') &&
                    filteredWrittenTests
                      .filter((w) => testTypeFilter === 'all' || (testTypeFilter === 'unified' ? (w.test_type === 'unified' || w.test_type === 'short_question' || w.test_type === 'long_question') : w.test_type === testTypeFilter))
                      .map((test) => {
                        const isPublished = test.status === 'published';
                        const isUnified = test.test_type === 'unified';
                        const isShort = test.test_type === 'short_question';
                        const isSelected = selectedWrittenTestId === test.id;
                        return (
                          <div
                            key={test.id}
                            onClick={() => setSelectedWrittenTestId(test.id)}
                            className={`bg-white rounded-2xl border-2 p-4 shadow-xs transition-all space-y-3 cursor-pointer ${
                              isSelected
                                ? 'border-amber-500 ring-2 ring-amber-400/30'
                                : 'border-amber-300/40 hover:border-amber-400'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black text-amber-400 flex items-center gap-1 shadow-2xs">
                                  {isUnified ? <Layers size={11} /> : isShort ? <FileText size={11} /> : <BookOpen size={11} />}
                                  {isUnified ? 'Online Test' : isShort ? 'Short Question Test' : 'Long Question Test'}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                                  <Camera size={10} /> Camera Capture
                                </span>
                                {isPublished ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                    <Lock size={10} /> Published
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                    Draft
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => setViewingWrittenTest(test)}
                                  className="p-1.5 rounded-lg text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] cursor-pointer"
                                  title="Inspect Test Questions"
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  onClick={() => handleDeleteWrittenTest(test.id)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                  title="Delete Test"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-black text-[#111111] leading-tight">{test.title}</h4>
                              <p className="text-[11px] font-medium text-[#737373] mt-1">
                                {test.subject} • Grade {test.grade} • {test.duration_minutes} Mins • {test.questions.length} Questions • {test.total_marks} Marks
                              </p>
                              {isUnified ? (
                                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                                  {((test.mcq_count ?? 0) > 0 || test.questions.some(q => q.type === 'mcq')) && (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 text-[10px] font-bold">
                                      {test.mcq_count ?? test.questions.filter(q => q.type === 'mcq').length} MCQs (Auto-graded)
                                    </span>
                                  )}
                                  {((test.short_count ?? 0) > 0 || test.questions.some(q => q.type === 'short_question')) && (
                                    <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-950 text-[10px] font-bold">
                                      {test.short_count ?? test.questions.filter(q => q.type === 'short_question').length} Short Qs
                                    </span>
                                  )}
                                  {((test.long_count ?? 0) > 0 || test.questions.some(q => q.type === 'long_question')) && (
                                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-950 text-[10px] font-bold">
                                      {test.long_count ?? test.questions.filter(q => q.type === 'long_question').length} Long Qs
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <p className="text-[10px] text-amber-800 font-bold mt-0.5">
                                  Handwritten capture • 24-hr Cloudflare R2 retention • Manual teacher grading
                                </p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-[#F0F0F0] flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setSelectedWrittenTestId(test.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#111111] text-[#F4C430] shadow-xs'
                                    : 'bg-amber-50 border border-amber-300 text-amber-950 hover:bg-amber-100'
                                }`}
                              >
                                <Award size={13} />
                                <span>Submissions & Grading</span>
                              </button>

                              {!isPublished ? (
                                <button
                                  onClick={() => handlePublishWrittenTest(test.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer active:scale-95 transition-all"
                                >
                                  <Send size={12} />
                                  <span>Publish to Students</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setViewingWrittenTest(test)}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] text-xs font-bold text-[#111111] cursor-pointer hover:bg-[#F0F0F0]"
                                >
                                  <span>Inspect Questions</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                  {/* Standard / PDF Tests Section */}
                  {(testTypeFilter === 'all' || testTypeFilter === 'standard') &&
                    filteredTests.map((test) => (
                      <TeacherTestCard
                        key={test.id}
                        test={test}
                        isSelected={selectedTest?.id === test.id}
                        canDelete={true}
                        onSelect={(t) => setSelectedTestId(t.id)}
                        onView={(t) => setViewingTest(t)}
                        onDelete={handleTestDelete}
                      />
                    ))}

                  {/* Empty state */}
                  {((testTypeFilter === 'proctored' && filteredProctoredTests.length === 0) ||
                    (testTypeFilter === 'short_question' && filteredWrittenTests.filter((w) => w.test_type === 'short_question').length === 0) ||
                    (testTypeFilter === 'long_question' && filteredWrittenTests.filter((w) => w.test_type === 'long_question').length === 0) ||
                    (testTypeFilter === 'standard' && filteredTests.length === 0) ||
                    (testTypeFilter === 'all' &&
                      filteredTests.length === 0 &&
                      filteredProctoredTests.length === 0 &&
                      filteredWrittenTests.length === 0)) && (
                    <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 text-center shadow-xs">
                      <BookOpen size={36} className="mx-auto mb-2 text-[#A3A3A3]" />
                      <p className="text-sm font-bold text-[#111111]">No assessments found</p>
                      <p className="text-xs text-[#737373] mt-1">
                        Try clearing active filters or create a new test paper.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Submissions & Grading (7 Cols) */}
            <div className="lg:col-span-6 xl:col-span-7 sticky top-4">
              {selectedWrittenTest ? (
                <div className="bg-white rounded-2xl border border-[#E5E5E5] p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black text-amber-400 flex items-center gap-1">
                          {selectedWrittenTest.test_type === 'short_question' ? <FileText size={11} /> : <BookOpen size={11} />}
                          {selectedWrittenTest.test_type === 'short_question' ? 'Short Q Test' : 'Long Q Test'}
                        </span>
                        <span className="text-xs font-bold text-[#737373]">
                          Grade {selectedWrittenTest.grade} • {selectedWrittenTest.subject}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-[#111111] mt-1">{selectedWrittenTest.title}</h3>
                      <p className="text-xs text-[#737373] mt-0.5">
                        {selectedWrittenTest.questions.length} Questions • {selectedWrittenTest.duration_minutes} Mins • {selectedWrittenTest.total_marks} Marks
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingWrittenTest(selectedWrittenTest)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-xs font-bold text-[#111111] hover:bg-[#F0F0F0] cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>
                      <button
                        onClick={() => setSelectedWrittenTestId(null)}
                        className="p-1.5 rounded-lg text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] cursor-pointer"
                        title="Back to PDF Submissions"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Written Test Submissions & Grading for this test */}
                  <WrittenTestSubmissionsList filterTestId={selectedWrittenTest.id} isTeacher={false} />
                </div>
              ) : (
                <TeacherSubmissionsPanel
                  selectedTest={selectedTest}
                  onOpenTestViewer={(t) => setViewingTest(t)}
                  onOpenSubmissionViewer={(s) => setViewingSubmission(s)}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* Choice Modal: Create (Bank/AI) vs Manual Upload (PDF) */}
      {isChoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E5E5E5] overflow-hidden p-6 sm:p-7">
            {/* Close Button */}
            <button
              onClick={() => setIsChoiceModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#737373] hover:text-[#111111] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-900 text-[11px] font-black uppercase tracking-wider mb-2">
                <Sparkles size={13} className="text-[#F4C430]" />
                <span>Assessment Builder</span>
              </div>
              <h2 className="text-xl font-black text-[#111111] tracking-tight">Create or Upload Test Paper</h2>
              <p className="text-xs text-[#737373] mt-1">
                Choose how you would like to prepare and publish this class test assessment.
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Option 1: Unified Test (Create a Test) */}
              <button
                onClick={() => {
                  setIsChoiceModalOpen(false);
                  setIsCreateUnifiedModalOpen(true);
                }}
                className="w-full text-left p-4 rounded-2xl border-2 border-[#111111] bg-[#FFFDF5] hover:bg-[#FFF9E6] hover:border-black transition-all flex items-start gap-4 group cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#111111] border border-black flex items-center justify-center text-[#F4C430] shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <Layers size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-[#111111]">Create a Test</h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-mono">
                      All Question Types
                    </span>
                  </div>
                  <p className="text-xs text-[#525252] mt-1 leading-relaxed">
                    Write your own questions — multiple choice, short answers, or long answers — and students complete them on their phone with photo/camera answers where needed.
                  </p>
                </div>
              </button>

              {/* Option 2: AI / Bank Generator */}
              <button
                onClick={() => {
                  setIsChoiceModalOpen(false);
                  setIsCreateModalOpen(true);
                }}
                className="w-full text-left p-4 rounded-2xl border-2 border-amber-300/80 bg-white hover:bg-[#FAF9F5] hover:border-amber-400 transition-all flex items-start gap-4 group cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="w-11 h-11 rounded-2xl bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 group-hover:scale-105 transition-transform">
                  <FileCheck2 size={22} className="text-[#F4C430]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-[#111111]">Create Class Test Paper</h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950">
                      Curriculum
                    </span>
                  </div>
                  <p className="text-xs text-[#525252] mt-1 leading-relaxed">
                    Auto-pull verified questions from FBISE / Sindh curriculum question banks. Customize MCQs, Short & Long Qs, marks distribution, and live PDF preview.
                  </p>
                </div>
              </button>

              {/* Option 3: Upload PDF */}
              <button
                onClick={() => {
                  setIsChoiceModalOpen(false);
                  setIsUploadModalOpen(true);
                }}
                className="w-full text-left p-4 rounded-2xl border border-[#E5E5E5] bg-white hover:bg-[#F8FAFC] hover:border-blue-300 transition-all flex items-start gap-4 group cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 group-hover:scale-105 transition-transform">
                  <Upload size={22} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-[#111111]">Upload Test Paper (PDF)</h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#F0F0F0] text-[#737373]">
                      Manual
                    </span>
                  </div>
                  <p className="text-xs text-[#737373] mt-1 leading-relaxed">
                    Upload an existing prepared question paper PDF, set due date, max marks, and assign directly to teachers and students.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Test Creation Modal (Admin Only) */}
      <AdminCreateUnifiedTestModal
        isOpen={isCreateUnifiedModalOpen}
        onClose={() => setIsCreateUnifiedModalOpen(false)}
        onTestCreated={fetchData}
      />

      {/* Create Test from Question Bank Modal (Admin-Only) */}
      <AdminCreateTestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTestCreated={fetchData}
      />

      {/* Upload Test Modal */}
      <TestUploadModal
        isOpen={isUploadModalOpen}
        defaultBoard={selectedBoard}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleTestUploadSuccess}
      />

      {/* Lightbox Inline Viewer Modal */}
      <TestViewerModal
        test={viewingTest}
        submission={viewingSubmission}
        onClose={() => {
          setViewingTest(null);
          setViewingSubmission(null);
        }}
      />

      {/* Proctored MCQ Test Inspection Modal */}
      {viewingMCQTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E5E5E5] overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#111111] text-[#F4C430] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert size={11} /> Proctored Test
                  </span>
                  <span className="text-xs font-bold text-[#737373]">
                    Grade {viewingMCQTest.grade} • {viewingMCQTest.subject}
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#111111] mt-1">{viewingMCQTest.title}</h3>
                <p className="text-xs text-[#737373] mt-0.5">
                  {viewingMCQTest.questions.length} MCQs • {viewingMCQTest.duration_minutes} Mins • {viewingMCQTest.total_marks} Marks
                </p>
              </div>

              <button
                onClick={() => setViewingMCQTest(null)}
                className="w-8 h-8 rounded-full bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#737373] hover:text-[#111111] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Questions list */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {viewingMCQTest.questions.map((q, qIndex) => (
                <div key={q.id} className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-xs font-black text-[#111111] leading-snug">
                      Q{qIndex + 1}. {q.question || q.question_text}
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-[#E5E5E5] text-[#737373] shrink-0">
                      {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oIndex) => {
                      const isCorrect = oIndex === (q.correctAnswer ?? q.correct_option_index);
                      return (
                        <div
                          key={oIndex}
                          className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                              : 'bg-white border-[#E5E5E5] text-[#525252]'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-[#F0F0F0] text-[#737373]'
                            }`}
                          >
                            {String.fromCharCode(65 + oIndex)}
                          </span>
                          <span className="flex-1 text-[11px]">{opt}</span>
                          {isCorrect && (
                            <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Correct Key
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
              <span className="text-xs text-[#737373]">
                Status:{' '}
                <strong className={viewingMCQTest.status === 'published' ? 'text-emerald-700' : 'text-amber-700'}>
                  {viewingMCQTest.status === 'published' ? 'Published' : 'Draft'}
                </strong>
              </span>

              {viewingMCQTest.status !== 'published' ? (
                <button
                  onClick={async () => {
                    await handlePublishMCQ(viewingMCQTest.id);
                    setViewingMCQTest(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-xs"
                >
                  Publish to Students
                </button>
              ) : (
                <button
                  onClick={() => setViewingMCQTest(null)}
                  className="px-4 py-2 rounded-xl bg-[#111111] text-white font-black text-xs cursor-pointer"
                >
                  Close Preview
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Written Test Inspection Modal */}
      {viewingWrittenTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E5E5E5] overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-black text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    {viewingWrittenTest.test_type === 'unified' ? (
                      <Layers size={11} />
                    ) : viewingWrittenTest.test_type === 'short_question' ? (
                      <FileText size={11} />
                    ) : (
                      <BookOpen size={11} />
                    )}
                    {viewingWrittenTest.test_type === 'unified'
                      ? 'Assessment Test'
                      : viewingWrittenTest.test_type === 'short_question'
                      ? 'Short Question Test'
                      : 'Long Question Test'}
                  </span>
                  <span className="text-xs font-bold text-[#737373]">
                    Grade {viewingWrittenTest.grade} • {viewingWrittenTest.subject}
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#111111] mt-1">{viewingWrittenTest.title}</h3>
                <p className="text-xs text-[#737373] mt-0.5">
                  {viewingWrittenTest.questions.length} Questions • {viewingWrittenTest.duration_minutes} Mins • {viewingWrittenTest.total_marks} Marks
                </p>
              </div>

              <button
                onClick={() => setViewingWrittenTest(null)}
                className="w-8 h-8 rounded-full bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#737373] hover:text-[#111111] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Questions list */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {viewingWrittenTest.questions.map((q, qIndex) => {
                const isMCQ = q.type === 'mcq' || (Array.isArray(q.options) && q.options.length > 0);
                const qTypeLabel = isMCQ
                  ? 'MCQ'
                  : q.type === 'long_question'
                  ? 'Long Question'
                  : 'Short Question';
                const correctIdx = q.correctAnswer ?? q.correct_option_index;

                return (
                  <div key={q.id} className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-[#111111] text-white text-[10px] font-black">
                          {qTypeLabel} #{qIndex + 1}
                        </span>
                        {isMCQ && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono">
                            Auto-graded
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-[#E5E5E5] text-amber-800 shrink-0">
                        {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-[#111111] leading-relaxed">
                      {q.question || q.question_text}
                    </p>

                    {isMCQ && Array.isArray(q.options) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {q.options.map((opt, oIndex) => {
                          const isCorrect = oIndex === correctIdx;
                          return (
                            <div
                              key={oIndex}
                              className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                  : 'bg-white border-[#E5E5E5] text-[#525252]'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-[#F0F0F0] text-[#737373]'
                                }`}
                              >
                                {String.fromCharCode(65 + oIndex)}
                              </span>
                              <span className="flex-1 text-[11px]">{opt}</span>
                              {isCorrect && (
                                <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  Correct Key
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
              <span className="text-xs text-[#737373]">
                Status:{' '}
                <strong className={viewingWrittenTest.status === 'published' ? 'text-emerald-700' : 'text-amber-700'}>
                  {viewingWrittenTest.status === 'published' ? 'Published' : 'Draft'}
                </strong>
              </span>

              {viewingWrittenTest.status !== 'published' ? (
                <button
                  onClick={async () => {
                    await handlePublishWrittenTest(viewingWrittenTest.id);
                    setViewingWrittenTest(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-xs"
                >
                  Publish to Students
                </button>
              ) : (
                <button
                  onClick={() => setViewingWrittenTest(null)}
                  className="px-4 py-2 rounded-xl bg-[#111111] text-white font-black text-xs cursor-pointer"
                >
                  Close Preview
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

export default AdminTestsPage;
