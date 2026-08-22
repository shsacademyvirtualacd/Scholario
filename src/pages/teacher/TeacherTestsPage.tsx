import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, BookOpen } from 'lucide-react';
import TeacherShell from '../../components/teacher/TeacherShell';
import TeacherTestCard from '../../components/teacher/TeacherTestCard';
import TeacherSubmissionsPanel from '../../components/teacher/TeacherSubmissionsPanel';
import TestViewerModal from '../../components/common/TestViewerModal';
import { getTestsForTeacher } from '../../lib/db';
import { useAuth } from '../../features/auth/AuthContext';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import type { TestPaper, TestSubmission } from '../../types';

export const TeacherTestsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [tests, setTests] = useState<TestPaper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [viewingTest, setViewingTest] = useState<TestPaper | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<TestSubmission | null>(null);

  // Filters
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  const fetchData = async () => {
    try {
      setLoading(true);
      const teacherId = profile?.id;
      const teacherEmail = user?.email || (profile as any)?.email;
      const teacherName = profile?.full_name;

      const teacherTests = await getTestsForTeacher(teacherId, teacherEmail, teacherName);
      setTests(teacherTests);
      if (!selectedTestId && teacherTests.length > 0) {
        setSelectedTestId(teacherTests[0].id);
      }
    } catch (err) {
      console.error('Error fetching tests for teacher:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.id, user?.email, profile?.full_name]);

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

  // Extract distinct subjects from available tests
  const distinctSubjects = React.useMemo(() => {
    const s = new Set<string>();
    tests.forEach((t) => {
      if (t.subject) s.add(t.subject);
    });
    return Array.from(s).sort();
  }, [tests]);

  // Filter tests based on grade, subject, and search
  const filteredTests = tests.filter((t) => {
    const matchesGrade = gradeFilter === 'all' || t.grade === gradeFilter;
    const matchesSubject = subjectFilter === 'all' || t.subject === subjectFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      (t.teacher_name || '').toLowerCase().includes(q) ||
      (t.instructions || '').toLowerCase().includes(q);

    return matchesGrade && matchesSubject && matchesSearch;
  });

  const selectedTest = tests.find((t) => t.id === selectedTestId) || filteredTests[0] || null;

  return (
    <TeacherShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#111111] tracking-tight">Test Assessments & Grading</h1>
          <p className="text-xs text-[#737373] mt-1">
            View assigned question papers and evaluate student answer sheet submissions with marks and remarks.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch justify-between mb-6 bg-white p-4 border border-[#E5E5E5] rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search tests by title or chapter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Grade Selector */}
          <div className="flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-xl border border-[#E5E5E5]">
            <span className="text-[11px] font-bold text-[#737373] px-2">Grade:</span>
            {['all', '9', '10', '11', '12'].map((g) => (
              <button
                key={g}
                onClick={() => setGradeFilter(g)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  gradeFilter === g
                    ? 'bg-[#111111] text-white shadow-xs'
                    : 'text-[#525252] hover:text-[#111111]'
                }`}
              >
                {g === 'all' ? 'All' : g}
              </button>
            ))}
          </div>

          {/* Subject Dropdown */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold text-[#111111] focus:outline-hidden"
          >
            <option value="all">All Subjects</option>
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
              <span>Assigned Test Papers</span>
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
              <p className="text-sm font-bold text-[#111111]">No tests found</p>
              <p className="text-xs text-[#737373] mt-1">
                {searchTerm || gradeFilter !== 'all' || subjectFilter !== 'all'
                  ? 'Try clearing active filters to see more tests.'
                  : 'No tests have been assigned to your subject and class yet. Tests uploaded and assigned by Admin will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {filteredTests.map((test) => (
                <TeacherTestCard
                  key={test.id}
                  test={test}
                  isSelected={selectedTest?.id === test.id}
                  canDelete={false}
                  onSelect={(t) => setSelectedTestId(t.id)}
                  onView={(t) => setViewingTest(t)}
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

      {/* Lightbox Question Paper / Submission Viewer Modal */}
      <TestViewerModal
        test={viewingTest}
        submission={viewingSubmission}
        onClose={() => {
          setViewingTest(null);
          setViewingSubmission(null);
        }}
      />
    </TeacherShell>
  );
};

export default TeacherTestsPage;
