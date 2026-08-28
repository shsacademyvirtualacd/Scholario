import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, BookOpen, FileCheck2, Target } from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import SectionHeader from '../../components/ui/SectionHeader';
import StudentTestCard from '../../components/student/StudentTestCard';
import StudentSubmissionPanel from '../../components/student/StudentSubmissionPanel';
import TestViewerModal from '../../components/common/TestViewerModal';
import SelfTestingView from '../../components/tests/SelfTestingView';
import { getTestsForStudent, getSubmissionsForStudent, getOfferingsForStudent, getEnrolledSubjectsForStudent } from '../../lib/db';
import { useAuth } from '../../features/auth/AuthContext';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import type { TestPaper, TestSubmission } from '../../types';

export const TestsPage: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const studentId = profile?.id || '';
  const studentGrade = profile?.class?.grade || (profile as any)?.grade || '10';
  const studentStream = profile?.stream_obj?.name || (profile as any)?.stream || '';

  // Tab navigation: 'class-test' vs 'self-test'
  const activeTab = searchParams.get('tab') === 'self-test' ? 'self-test' : 'class-test';

  const setActiveTab = (tab: 'class-test' | 'self-test') => {
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'class-test') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', 'self-test');
    }
    setSearchParams(newParams);
  };

  const [tests, setTests] = useState<TestPaper[]>([]);
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [viewingTest, setViewingTest] = useState<TestPaper | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<TestSubmission | null>(null);

  const fetchData = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const [fetchedTests, fetchedSubs, fetchedOffs] = await Promise.all([
        getTestsForStudent(studentGrade, studentStream),
        getSubmissionsForStudent(studentId),
        getOfferingsForStudent(studentId).catch(() => []),
      ]);

      setTests(fetchedTests);
      setSubmissions(fetchedSubs);
      setOfferings(fetchedOffs);

      // Default select the first test if none is currently selected
      if (!selectedTestId && fetchedTests.length > 0) {
        setSelectedTestId(fetchedTests[0].id);
      }
    } catch (err) {
      console.error('Error fetching student tests data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [studentId, studentGrade, studentStream]);

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

  // Map submissions by test_id for fast lookup
  const submissionByTestId = React.useMemo(() => {
    const map = new Map<string, TestSubmission>();
    submissions.forEach((s) => map.set(s.test_id, s));
    return map;
  }, [submissions]);

  // Derive enrolled subjects for filter tabs
  const enrolledSubjects = getEnrolledSubjectsForStudent(profile, offerings);
  const subjects = ['All', ...enrolledSubjects];

  // Filter tests based on Subject, Status, and Search Term
  const filteredTests = tests.filter((t) => {
    const matchesSubject = activeSubject === 'All' || t.subject === activeSubject;
    const sub = submissionByTestId.get(t.id);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && !sub) ||
      (statusFilter === 'submitted' && !!sub && sub.status !== 'graded') ||
      (statusFilter === 'graded' && sub?.status === 'graded');

    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      (t.teacher_name || '').toLowerCase().includes(q) ||
      (t.instructions || '').toLowerCase().includes(q);

    return matchesSubject && matchesStatus && matchesSearch;
  });

  // Selected test object
  const selectedTest = tests.find((t) => t.id === selectedTestId) || filteredTests[0] || null;
  const currentSubmission = selectedTest ? submissionByTestId.get(selectedTest.id) : undefined;

  const handleSubmissionSuccess = (newSub: TestSubmission) => {
    setSubmissions((prev) => {
      const filtered = prev.filter((s) => s.test_id !== newSub.test_id);
      return [newSub, ...filtered];
    });
  };

  return (
    <StudentShell>
      {/* Page Header */}
      <SectionHeader
        title="Testing Center"
        description="Access scheduled class assessments and practice curriculum multiple choice quizzes for self-testing."
      />

      {/* Subsection Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-[#EBEBEB] rounded-2xl w-fit mb-6">
        <button
          onClick={() => setActiveTab('class-test')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'class-test'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'text-[#525252] hover:text-[#111111] hover:bg-black/5'
          }`}
        >
          <FileCheck2 size={15} className={activeTab === 'class-test' ? 'text-[#F4C430]' : 'text-[#737373]'} />
          <span>Class Test</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            activeTab === 'class-test' ? 'bg-white/20 text-white' : 'bg-black/5 text-[#737373]'
          }`}>
            {tests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('self-test')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
      </div>

      {activeTab === 'self-test' ? (
        <SelfTestingView
          defaultBoard={profile?.board_id || profile?.board?.id || 'fbise'}
          defaultGrade={studentGrade}
          userRole="student"
        />
      ) : (
        <>
          {/* Filter & Search Bar */}
          <div className="flex flex-col xl:flex-row gap-4 items-stretch justify-between mb-6 bg-white p-4 border border-[#E5E5E5] rounded-2xl shadow-xs">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch flex-1">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                <input
                  type="text"
                  placeholder="Search tests by title, subject, or chapter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold text-[#111111] focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-xl border border-[#E5E5E5] shrink-0">
                {(['all', 'pending', 'submitted', 'graded'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                      statusFilter === st
                        ? 'bg-[#111111] text-white shadow-xs'
                        : 'text-[#737373] hover:text-[#111111] hover:bg-[#E5E5E5]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {subjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setActiveSubject(sub)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    activeSubject === sub
                      ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                      : 'bg-[#FAFAFA] text-[#525252] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Main Split-Panel 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Test Papers List (5 Cols) */}
            <div className="lg:col-span-6 xl:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#111111] flex items-center gap-2">
                  <span>Available Class Tests</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F5F5F5] text-[#737373]">
                    {filteredTests.length}
                  </span>
                </h3>
                <span className="text-xs text-[#737373] font-semibold">
                  Grade {studentGrade} {studentStream ? `• ${studentStream}` : ''}
                </span>
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
                    {searchTerm || activeSubject !== 'All' || statusFilter !== 'all'
                      ? 'Try clearing your active filters or search terms.'
                      : 'No class tests have been scheduled yet for your grade and stream.'}
                  </p>
                  {(searchTerm || activeSubject !== 'All' || statusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setActiveSubject('All');
                        setStatusFilter('all');
                      }}
                      className="mt-4 px-4 py-2 rounded-xl border border-[#E5E5E5] text-xs font-bold hover:bg-[#F5F5F5]"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {filteredTests.map((test) => (
                    <StudentTestCard
                      key={test.id}
                      test={test}
                      submission={submissionByTestId.get(test.id)}
                      isSelected={selectedTest?.id === test.id}
                      onSelect={(t) => setSelectedTestId(t.id)}
                      onView={(t) => setViewingTest(t)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Submissions & Uploading Panel (7 Cols) */}
            <div className="lg:col-span-6 xl:col-span-7 sticky top-4">
              <StudentSubmissionPanel
                selectedTest={selectedTest}
                submission={currentSubmission}
                onOpenTestViewer={(t) => setViewingTest(t)}
                onOpenSubmissionViewer={(s) => setViewingSubmission(s)}
                onSubmissionSuccess={handleSubmissionSuccess}
              />
            </div>
          </div>
        </>
      )}

      {/* Lightbox Inline Viewer Modal */}
      <TestViewerModal
        test={viewingTest}
        submission={viewingSubmission}
        onClose={() => {
          setViewingTest(null);
          setViewingSubmission(null);
        }}
      />
    </StudentShell>
  );
};

export default TestsPage;
