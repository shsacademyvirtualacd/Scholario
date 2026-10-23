import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  BookOpen,
  FileCheck2,
  Filter,
  ShieldAlert,
  Award,
  ArrowRight,
  Eye,
  Clock,
  PenTool,
  X,
  ArrowLeft,
  Calendar,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import { StudentPageHeader } from '../../components/student/shared/StudentPageHeader';
import { StudentBottomSheet } from '../../components/student/shared/StudentBottomSheet';
import { StudentEmptyState } from '../../components/student/shared/StudentEmptyState';
import { StudentListSkeleton } from '../../components/student/shared/StudentSkeleton';
import StudentTestCard from '../../components/student/StudentTestCard';
import StudentSubmissionPanel from '../../components/student/StudentSubmissionPanel';
import TestViewerModal from '../../components/common/TestViewerModal';
import ProctoredMCQAccessModal from '../../components/student/ProctoredMCQAccessModal';
import { ProctoredMCQExamModal } from '../../components/student/ProctoredMCQExamModal';
import ProctoredMCQResultModal from '../../components/student/ProctoredMCQResultModal';
import { WrittenTestExamModal } from '../../components/student/WrittenTestExamModal';
import {
  getTestsForStudent,
  getSubmissionsForStudent,
  getOfferingsForStudent,
} from '../../lib/db';
import {
  getProctoredMCQTests,
  getProctoredMCQSubmissions,
} from '../../lib/proctoredMcqService';
import {
  getWrittenTests,
  getWrittenSubmissions,
} from '../../lib/writtenTestService';
import { getEnrolledSubjectsForStudent } from '../../lib/taxonomy';
import { useAuth } from '../../features/auth/AuthContext';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import type { TestPaper, TestSubmission } from '../../types';
import type { ProctoredMCQTest, ProctoredMCQSubmission } from '../../types/proctoredMcq';
import type { WrittenTest, WrittenSubmission } from '../../types/writtenTest';
import { formatProperName, formatTitleCase } from '../../utils/studentFormatting';

type StatusTab = 'todo' | 'submitted' | 'graded' | 'overdue';

export const TestsPage: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const studentId = profile?.id || '';
  const studentGrade = profile?.class?.grade || (profile as any)?.grade || '10';
  const studentStream = profile?.stream_obj?.name || (profile as any)?.stream || '';
  const studentBoardId =
    profile?.board_id ||
    (typeof profile?.board === 'string' ? profile.board : profile?.board?.id) ||
    profile?.class?.board_id ||
    'fbise';

  const [tests, setTests] = useState<TestPaper[]>([]);
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active status tab: 'todo' | 'submitted' | 'graded' | 'overdue'
  const [activeTab, setActiveTab] = useState<StatusTab>('todo');

  // Selected test for detail view
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  // Mobile detail screen toggle: true when viewing a selected test on small screens
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Filters
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [activeSubject, setActiveSubject] = useState<string>('All');
  const [testTypeFilter, setTestTypeFilter] = useState<'all' | 'mcq' | 'written' | 'standard'>('all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  // Modals & Viewers
  const [viewingTest, setViewingTest] = useState<TestPaper | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<TestSubmission | null>(null);

  // Proctored MCQ state
  const [proctoredTests, setProctoredTests] = useState<ProctoredMCQTest[]>([]);
  const [proctoredSubmissions, setProctoredSubmissions] = useState<ProctoredMCQSubmission[]>([]);
  const [accessModalTest, setAccessModalTest] = useState<ProctoredMCQTest | null>(null);
  const [activeExamTest, setActiveExamTest] = useState<ProctoredMCQTest | null>(null);
  const [examVerifiedStudentId, setExamVerifiedStudentId] = useState('');
  const [examVerifiedStudentName, setExamVerifiedStudentName] = useState('');
  const [viewingGradedMCQSub, setViewingGradedMCQSub] = useState<ProctoredMCQSubmission | null>(null);

  // Written tests
  const [writtenTests, setWrittenTests] = useState<WrittenTest[]>([]);
  const [writtenSubmissions, setWrittenSubmissions] = useState<WrittenSubmission[]>([]);
  const [activeWrittenExamTest, setActiveWrittenExamTest] = useState<WrittenTest | null>(null);

  const fetchData = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const [
        fetchedTests,
        fetchedSubs,
        fetchedOffs,
        fetchedMcqTests,
        fetchedMcqSubs,
        fetchedWrittenTests,
        fetchedWrittenSubs,
      ] = await Promise.all([
        getTestsForStudent(studentGrade, studentStream, studentBoardId),
        getSubmissionsForStudent(studentId),
        getOfferingsForStudent(studentId).catch(() => []),
        getProctoredMCQTests('student').catch(() => []),
        getProctoredMCQSubmissions({ studentId }).catch(() => []),
        getWrittenTests({ status: 'published' }).catch(() => []),
        getWrittenSubmissions({ studentId }).catch(() => []),
      ]);

      setTests(fetchedTests || []);
      setSubmissions(fetchedSubs || []);
      setOfferings(fetchedOffs || []);
      setProctoredTests(fetchedMcqTests || []);
      setProctoredSubmissions(fetchedMcqSubs || []);
      setWrittenTests(fetchedWrittenTests || []);
      setWrittenSubmissions(fetchedWrittenSubs || []);

      if (!selectedTestId && fetchedTests && fetchedTests.length > 0) {
        setSelectedTestId(fetchedTests[0].id);
      }
    } catch (err) {
      console.error('[TestsPage] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [studentId, studentGrade, studentStream, studentBoardId]);

  useRealtimeTable({
    table: 'tests',
    debounceMs: 1500,
    onAny: fetchData,
  });

  useRealtimeTable({
    table: 'test_submissions',
    debounceMs: 1500,
    onAny: fetchData,
  });

  const submissionByTestId = useMemo(() => {
    const map = new Map<string, TestSubmission>();
    submissions.forEach((s) => map.set(s.test_id, s));
    return map;
  }, [submissions]);

  const proctoredSubByTestId = useMemo(() => {
    const map = new Map<string, ProctoredMCQSubmission>();
    proctoredSubmissions.forEach((s) => map.set(s.test_id, s));
    return map;
  }, [proctoredSubmissions]);

  const enrolledSubjects = useMemo(() => {
    return getEnrolledSubjectsForStudent(profile, offerings);
  }, [profile, offerings]);

  const subjectOptions = useMemo(() => {
    const set = new Set<string>(['All', ...enrolledSubjects]);
    tests.forEach((t) => t.subject && set.add(t.subject));
    proctoredTests.forEach((t) => t.subject && set.add(t.subject));
    writtenTests.forEach((t) => t.subject && set.add(t.subject));
    return Array.from(set);
  }, [enrolledSubjects, tests, proctoredTests, writtenTests]);

  // Standard Test categorized lists
  const categorizedTests = useMemo(() => {
    const now = new Date();

    const todo: TestPaper[] = [];
    const overdue: TestPaper[] = [];
    const submitted: TestPaper[] = [];
    const graded: TestPaper[] = [];

    tests.forEach((t) => {
      // Filter by subject
      if (
        activeSubject !== 'All' &&
        t.subject.toLowerCase().trim() !== activeSubject.toLowerCase().trim()
      ) {
        return;
      }
      // Filter by test type
      if (testTypeFilter !== 'all' && testTypeFilter !== 'standard') {
        return;
      }
      // Filter by search term
      const q = searchTerm.toLowerCase().trim();
      if (
        q &&
        !t.title.toLowerCase().includes(q) &&
        !t.subject.toLowerCase().includes(q) &&
        !(t.teacher_name || '').toLowerCase().includes(q)
      ) {
        return;
      }

      const sub = submissionByTestId.get(t.id);
      const dueDate = new Date(t.due_date);
      dueDate.setHours(23, 59, 59, 999);
      const isPastDue = now.getTime() > dueDate.getTime();

      if (sub) {
        if (sub.status === 'graded') {
          graded.push(t);
        } else {
          submitted.push(t);
        }
      } else {
        if (isPastDue) {
          overdue.push(t);
        } else {
          todo.push(t);
        }
      }
    });

    return { todo, overdue, submitted, graded };
  }, [tests, submissionByTestId, activeSubject, testTypeFilter, searchTerm]);

  // Active list based on selected StatusTab
  const activeTestsList = useMemo(() => {
    switch (activeTab) {
      case 'todo':
        return categorizedTests.todo;
      case 'overdue':
        return categorizedTests.overdue;
      case 'submitted':
        return categorizedTests.submitted;
      case 'graded':
        return categorizedTests.graded;
      default:
        return categorizedTests.todo;
    }
  }, [categorizedTests, activeTab]);

  const selectedTest = useMemo(() => {
    return tests.find((t) => t.id === selectedTestId) || activeTestsList[0] || null;
  }, [tests, selectedTestId, activeTestsList]);

  const currentSubmission = selectedTest
    ? submissionByTestId.get(selectedTest.id)
    : undefined;

  const handleSelectTest = (test: TestPaper) => {
    setSelectedTestId(test.id);
    setMobileDetailOpen(true);
  };

  const handleSubmissionSuccess = (newSub: TestSubmission) => {
    setSubmissions((prev) => [newSub, ...prev.filter((s) => s.test_id !== newSub.test_id)]);
  };

  const hasActiveFilters = activeSubject !== 'All' || testTypeFilter !== 'all' || searchTerm.trim().length > 0;

  return (
    <StudentShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-[calc(4rem+env(safe-area-inset-bottom,0px))] sm:pb-12">
        {/* Header */}
        <StudentPageHeader
          title="Testing Center"
          description="Access assigned class tests, view question papers, submit answer sheets, and review teacher grading feedback."
        />

        {/* ── Toolbar: Search + Single "Filters" Button + Active Filter Chips ── */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search tests by title, subject, or teacher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-h-[44px] w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400/50"
              />
            </div>

            {/* Single Filters Button */}
            <button
              type="button"
              onClick={() => setFilterModalOpen(true)}
              className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <Filter size={15} />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
              <span className="text-neutral-400 text-[11px] font-semibold">Active filters:</span>
              {activeSubject !== 'All' && (
                <button
                  type="button"
                  onClick={() => setActiveSubject('All')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[11px] font-bold cursor-pointer"
                >
                  <span>Subject: {activeSubject}</span>
                  <X size={12} />
                </button>
              )}
              {testTypeFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setTestTypeFilter('all')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 text-[11px] font-bold cursor-pointer"
                >
                  <span>Type: {testTypeFilter.toUpperCase()}</span>
                  <X size={12} />
                </button>
              )}
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 text-[11px] font-bold cursor-pointer"
                >
                  <span>Search: "{searchTerm}"</span>
                  <X size={12} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setActiveSubject('All');
                  setTestTypeFilter('all');
                  setSearchTerm('');
                }}
                className="text-[11px] text-neutral-500 hover:text-neutral-900 underline ml-1 cursor-pointer"
              >
                Reset all
              </button>
            </div>
          )}
        </div>

        {/* ── Status Tabs with Counts: To do, Submitted, Graded, Overdue ── */}
        <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto no-scrollbar hide-scrollbar snap-x snap-mandatory scroll-smooth w-full max-w-full pb-1 pr-6 sm:pr-0">
          {[
            { id: 'todo', label: 'To do', count: categorizedTests.todo.length },
            { id: 'submitted', label: 'Submitted', count: categorizedTests.submitted.length },
            { id: 'graded', label: 'Graded', count: categorizedTests.graded.length },
            { id: 'overdue', label: 'Overdue', count: categorizedTests.overdue.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as StatusTab)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer shrink-0 snap-start ${
                activeTab === tab.id
                  ? 'bg-neutral-950 text-white dark:bg-amber-400 dark:text-neutral-950 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-850'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white dark:bg-neutral-900/20 dark:text-neutral-950'
                    : tab.id === 'overdue' && tab.count > 0
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Main View: Side-by-Side on Desktop, List / Detail view on Mobile ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Test List (Visible on desktop always; on mobile only when NOT in mobile detail mode) */}
          <div
            className={`space-y-4 lg:col-span-5 ${
              mobileDetailOpen ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                {activeTestsList.length} {activeTestsList.length === 1 ? 'assessment' : 'assessments'} in {activeTab}
              </span>
            </div>

            {loading ? (
              <StudentListSkeleton rows={4} />
            ) : activeTestsList.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 text-center space-y-2">
                <FileCheck2 size={32} className="mx-auto text-neutral-400" />
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  No tests in "{activeTab}"
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {activeTab === 'overdue'
                    ? 'Great job! You have no overdue assessments.'
                    : activeTab === 'todo'
                    ? 'You have completed all scheduled assessments.'
                    : 'No assessments currently match this status.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTestsList.map((test) => (
                  <StudentTestCard
                    key={test.id}
                    test={test}
                    submission={submissionByTestId.get(test.id)}
                    isSelected={selectedTest?.id === test.id}
                    onSelect={handleSelectTest}
                    onView={(t) => setViewingTest(t)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Detail / Submission Panel (Visible on desktop; on mobile only when mobileDetailOpen is true) */}
          <div
            className={`lg:col-span-7 ${
              !mobileDetailOpen ? 'hidden lg:block' : 'block'
            }`}
          >
            <StudentSubmissionPanel
              selectedTest={selectedTest}
              submission={currentSubmission}
              onOpenTestViewer={(test) => setViewingTest(test)}
              onOpenSubmissionViewer={(sub) => setViewingSubmission(sub)}
              onSubmissionSuccess={handleSubmissionSuccess}
              onBackToList={() => setMobileDetailOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* ── Filters Bottom Sheet Modal ── */}
      <StudentBottomSheet
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title="Filter Assessments"
        subtitle="Filter by subject or assessment format"
      >
        <div className="space-y-4">
          {/* Subject Options */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-900 dark:text-white block">
              Subject
            </label>
            <div className="flex flex-wrap gap-2">
              {subjectOptions.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setActiveSubject(sub)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSubject === sub
                      ? 'bg-neutral-950 text-white dark:bg-amber-400 dark:text-neutral-950'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Format Options */}
          <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <label className="text-xs font-bold text-neutral-900 dark:text-white block">
              Assessment Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'All Formats' },
                { id: 'standard', label: 'PDF Papers' },
                { id: 'mcq', label: 'Online MCQs' },
                { id: 'written', label: 'Short & Long Qs' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setTestTypeFilter(fmt.id as any)}
                  className={`min-h-[44px] p-2 rounded-xl text-xs font-bold text-left px-3 transition-all cursor-pointer ${
                    testTypeFilter === fmt.id
                      ? 'bg-neutral-950 text-white dark:bg-amber-400 dark:text-neutral-950'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={() => setFilterModalOpen(false)}
              className="min-h-[44px] w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </StudentBottomSheet>

      {/* Lightbox Question Paper Viewer */}
      <TestViewerModal test={viewingTest} onClose={() => setViewingTest(null)} />

      {/* Answer Sheet Viewer */}
      {viewingSubmission && (
        <StudentBottomSheet
          isOpen={Boolean(viewingSubmission)}
          onClose={() => setViewingSubmission(null)}
          title="Submitted Answer Sheet"
          subtitle={`Submitted on ${new Date(viewingSubmission.submitted_at).toLocaleString()}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-850 rounded-xl text-xs">
              <span>Format: {viewingSubmission.file_type.toUpperCase()}</span>
              {viewingSubmission.marks_obtained !== null && (
                <span className="font-bold text-emerald-600">
                  Score: {viewingSubmission.marks_obtained} / {viewingSubmission.max_marks}
                </span>
              )}
            </div>
            {viewingSubmission.file_url ? (
              <iframe
                src={viewingSubmission.file_url}
                title="Submitted Answer Sheet Preview"
                className="w-full h-[60vh] rounded-xl border border-neutral-200 dark:border-neutral-800"
              />
            ) : (
              <p className="text-xs text-neutral-500 py-8 text-center">
                Answer sheet preview is unavailable.
              </p>
            )}
          </div>
        </StudentBottomSheet>
      )}

      {/* Proctored Exam Modals */}
      <ProctoredMCQAccessModal
        isOpen={Boolean(accessModalTest)}
        test={accessModalTest}
        defaultStudentId={studentId}
        defaultStudentName={profile?.full_name || 'Student'}
        onClose={() => setAccessModalTest(null)}
        onVerified={(verifiedId, verifiedName) => {
          setExamVerifiedStudentId(verifiedId);
          setExamVerifiedStudentName(verifiedName);
          setActiveExamTest(accessModalTest);
          setAccessModalTest(null);
        }}
      />

      {activeExamTest && (
        <ProctoredMCQExamModal
          isOpen={Boolean(activeExamTest)}
          test={activeExamTest}
          studentId={studentId}
          studentName={examVerifiedStudentName || profile?.full_name || 'Student'}
          onClose={() => setActiveExamTest(null)}
          onSubmitted={() => {
            setActiveExamTest(null);
            fetchData();
          }}
        />
      )}

      <ProctoredMCQResultModal
        isOpen={Boolean(viewingGradedMCQSub)}
        submission={viewingGradedMCQSub}
        onClose={() => setViewingGradedMCQSub(null)}
      />

      {/* Written Exam Modal */}
      {activeWrittenExamTest && (
        <WrittenTestExamModal
          isOpen={Boolean(activeWrittenExamTest)}
          test={activeWrittenExamTest}
          studentId={studentId}
          studentName={profile?.full_name || 'Student'}
          onClose={() => setActiveWrittenExamTest(null)}
          onSubmitSuccess={() => {
            setActiveWrittenExamTest(null);
            fetchData();
          }}
        />
      )}
    </StudentShell>
  );
};

export default TestsPage;
