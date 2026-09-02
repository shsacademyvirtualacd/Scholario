import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, BookOpen, RotateCcw, FileCheck2, Database, GraduationCap, Target, ChevronDown, Upload, Sparkles, X } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import TeacherTestCard from '../../components/teacher/TeacherTestCard';
import TeacherSubmissionsPanel from '../../components/teacher/TeacherSubmissionsPanel';
import TestUploadModal from '../../components/teacher/TestUploadModal';
import TestViewerModal from '../../components/common/TestViewerModal';
import SelfTestingView from '../../components/tests/SelfTestingView';
import AdminMCQVerificationView from '../../components/admin/mcq/AdminMCQVerificationView';
import StudentResultsView from '../../components/tests/StudentResultsView';
import AdminCreateTestModal from '../../components/admin/tests/AdminCreateTestModal';
import { getAllTests } from '../../lib/db';
import { getGradesForBoard, BOARDS } from '../../lib/taxonomy';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import type { TestPaper, TestSubmission } from '../../types';

export const AdminTestsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab navigation: 'class-test' vs 'self-test' vs 'question-bank' vs 'student-results'
  const rawTab = searchParams.get('tab');
  const activeTab: 'class-test' | 'self-test' | 'question-bank' | 'student-results' =
    rawTab === 'self-test'
      ? 'self-test'
      : rawTab === 'question-bank' || rawTab === 'mcq-verification' || rawTab === 'bank'
      ? 'question-bank'
      : rawTab === 'student-results' || rawTab === 'results'
      ? 'student-results'
      : 'class-test';

  const setActiveTab = (tab: 'class-test' | 'self-test' | 'question-bank' | 'student-results') => {
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'class-test') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
    }
    setSearchParams(newParams);
  };

  const [tests, setTests] = useState<TestPaper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState<boolean>(false);
  const [showActionDropdown, setShowActionDropdown] = useState<boolean>(false);
  const actionDropdownRef = useRef<HTMLDivElement>(null);
  const [viewingTest, setViewingTest] = useState<TestPaper | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<TestSubmission | null>(null);

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
      const allTests = await getAllTests();
      setTests(allTests);
      if (!selectedTestId && allTests.length > 0) {
        setSelectedTestId(allTests[0].id);
      }
    } catch (err) {
      console.error('Error fetching tests for admin:', err);
    } finally {
      setLoading(false);
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

  const distinctSubjects = React.useMemo(() => {
    const s = new Set<string>();
    tests.forEach((t) => {
      const testBoard = t.board || t.board_id || 'fbise';
      if (!selectedBoard || selectedBoard === 'all' || testBoard === selectedBoard) {
        if (t.subject) s.add(t.subject);
      }
    });
    return Array.from(s).sort();
  }, [tests, selectedBoard]);

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

  const selectedTest = tests.find((t) => t.id === selectedTestId) || filteredTests[0] || null;

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
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* Primary Unified Action Button with Dropdown */}
            <div className="relative" ref={actionDropdownRef}>
              <button
                id="admin-upload-create-test-btn"
                onClick={() => setShowActionDropdown((prev) => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-[#F4C430] text-xs font-black transition-all shadow-sm cursor-pointer border border-[#111111]"
              >
                <Plus size={16} />
                <span>Upload / Create Test Paper</span>
                <ChevronDown size={14} className={`text-[#A3A3A3] transition-transform duration-200 ${showActionDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Action Dropdown Menu */}
              {showActionDropdown && (
                <div className="absolute right-0 mt-2 w-84 bg-white rounded-2xl border border-[#E5E5E5] shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-[#F0F0F0] mb-1">
                    <p className="text-[11px] font-black uppercase tracking-wider text-[#737373]">Select Test Paper Method</p>
                  </div>
                  
                  {/* Option 1: Create from Question Bank */}
                  <button
                    id="admin-menu-create-bank-btn"
                    onClick={() => {
                      setShowActionDropdown(false);
                      setIsCreateModalOpen(true);
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-[#FAF9F5] transition-colors flex items-start gap-3 group cursor-pointer border border-transparent hover:border-amber-200/60"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 group-hover:scale-105 transition-transform">
                      <FileCheck2 size={18} className="text-[#F4C430]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-[#111111]">Create Class Test Paper</p>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">AI & Bank</span>
                      </div>
                      <p className="text-[11px] text-[#737373] mt-0.5 leading-snug">
                        Auto-generate structured exam papers with MCQs, short & long questions, custom marks & live PDF layout.
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Manual Upload */}
                  <button
                    id="admin-menu-upload-pdf-btn"
                    onClick={() => {
                      setShowActionDropdown(false);
                      setIsUploadModalOpen(true);
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors flex items-start gap-3 group cursor-pointer border border-transparent hover:border-blue-200/60 mt-1"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 group-hover:scale-105 transition-transform">
                      <Upload size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-[#111111]">Upload Test Paper (PDF)</p>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#F0F0F0] text-[#737373]">Manual</span>
                      </div>
                      <p className="text-[11px] text-[#737373] mt-0.5 leading-snug">
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

      {/* Subsection Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-[#EBEBEB] rounded-2xl w-fit mb-6 flex-wrap">
        <button
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
            {tests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('self-test')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'self-test'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'text-[#525252] hover:text-[#111111] hover:bg-black/5'
          }`}
        >
          <Target size={15} className={activeTab === 'self-test' ? 'text-[#F4C430]' : 'text-[#737373]'} />
          <span>Self Testing</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F4C430]/20 text-[#111111]">
            MCQ
          </span>
        </button>

        <button
          onClick={() => setActiveTab('question-bank')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'question-bank'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'text-[#525252] hover:text-[#111111] hover:bg-black/5'
          }`}
        >
          <Database size={15} className={activeTab === 'question-bank' ? 'text-[#F4C430]' : 'text-[#737373]'} />
          <span>Question Bank</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'question-bank' ? 'bg-[#F4C430] text-[#111111]' : 'bg-black/5 text-[#737373]'
            }`}
          >
            Live Bank
          </span>
        </button>

        <button
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
            MCQ
          </span>
        </button>
      </div>

      {activeTab === 'student-results' ? (
        <StudentResultsView isTeacher={false} />
      ) : activeTab === 'question-bank' ? (
        <AdminMCQVerificationView
          initialBoard={selectedBoard}
          initialGrade="9"
          initialSubject="Physics"
        />
      ) : activeTab === 'self-test' ? (
        <SelfTestingView
          defaultBoard={selectedBoard}
          userRole="admin"
        />
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

              {/* Subject Dropdown */}
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold text-[#111111] focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Subjects ({distinctSubjects.length})</option>
                {distinctSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2-Column Split-Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Test Papers (5 Cols) */}
            <div className="lg:col-span-6 xl:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#111111] flex items-center gap-2">
                  <span>All Class Tests</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F5F5F5] text-[#737373]">
                    {filteredTests.length}
                  </span>
                </h3>
              </div>

              {loading && tests.length === 0 ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="bg-white rounded-2xl border border-[#E5E5E5] p-5 h-36" />
                  ))}
                </div>
              ) : filteredTests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 text-center shadow-xs">
                  <BookOpen size={36} className="mx-auto mb-2 text-[#A3A3A3]" />
                  <p className="text-sm font-bold text-[#111111]">No class tests found</p>
                  <p className="text-xs text-[#737373] mt-1">
                    {searchTerm || gradeFilter !== 'all' || subjectFilter !== 'all'
                      ? 'Try clearing active filters to see more tests.'
                      : 'Get started by uploading an assessment paper.'}
                  </p>
                  <button
                    id="admin-empty-upload-test-btn"
                    onClick={() => setIsChoiceModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-[#F4C430] text-xs font-black transition-all shadow-sm cursor-pointer border border-[#111111]"
                  >
                    <Plus size={15} />
                    <span>Upload / Create Test Paper</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {filteredTests.map((test) => (
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
                </div>
              )}
            </div>

            {/* Right Column: Submissions & Grading (7 Cols) */}
            <div className="lg:col-span-6 xl:col-span-7 sticky top-4">
              <TeacherSubmissionsPanel
                selectedTest={selectedTest}
                onOpenTestViewer={(t) => setViewingTest(t)}
                onOpenSubmissionViewer={(s) => setViewingSubmission(s)}
              />
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
              {/* Option 1: AI / Bank Generator */}
              <button
                onClick={() => {
                  setIsChoiceModalOpen(false);
                  setIsCreateModalOpen(true);
                }}
                className="w-full text-left p-4 rounded-2xl border-2 border-amber-300/80 bg-[#FFFDF7] hover:bg-[#FFF9EB] hover:border-amber-400 transition-all flex items-start gap-4 group cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="w-11 h-11 rounded-2xl bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 group-hover:scale-105 transition-transform">
                  <FileCheck2 size={22} className="text-[#F4C430]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-[#111111]">Create Class Test Paper</h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-[#525252] mt-1 leading-relaxed">
                    Auto-pull verified questions from FBISE / Sindh curriculum question banks. Customize MCQs, Short & Long Qs, marks distribution, and live PDF preview.
                  </p>
                </div>
              </button>

              {/* Option 2: Upload PDF */}
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
    </AdminShell>
  );
};

export default AdminTestsPage;
