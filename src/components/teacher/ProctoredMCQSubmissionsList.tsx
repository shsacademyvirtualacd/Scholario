import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Award,
  Search,
  CheckCircle2,
  FileCheck2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getProctoredMCQSubmissions,
  getProctoredMCQTests,
} from '../../lib/proctoredMcqService';
import type { ProctoredMCQTest, ProctoredMCQSubmission } from '../../types/proctoredMcq';
import { ProctoredMCQGradingModal } from './ProctoredMCQGradingModal';
import { useAuth } from '../../features/auth/AuthContext';

interface ProctoredMCQSubmissionsListProps {
  isTeacher?: boolean;
}

export const ProctoredMCQSubmissionsList: React.FC<ProctoredMCQSubmissionsListProps> = ({
  isTeacher = false,
}) => {
  const { profile } = useAuth();
  const userRole = (profile?.role || (isTeacher ? 'teacher' : 'admin')).toLowerCase();

  const [submissions, setSubmissions] = useState<ProctoredMCQSubmission[]>([]);
  const [tests, setTests] = useState<ProctoredMCQTest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'graded' | 'violation'>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  // Grading Modal
  const [gradingModalOpen, setGradingModalOpen] = useState<boolean>(false);
  const [selectedSubmission, setSelectedSubmission] = useState<ProctoredMCQSubmission | null>(null);
  const [selectedTest, setSelectedTest] = useState<ProctoredMCQTest | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedSubs, fetchedTests] = await Promise.all([
        getProctoredMCQSubmissions(),
        getProctoredMCQTests(userRole),
      ]);
      setSubmissions(fetchedSubs);
      setTests(fetchedTests);
    } catch (err) {
      console.error('Failed to load proctored MCQ data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userRole]);

  const testMap = useMemo(() => {
    const map = new Map<string, ProctoredMCQTest>();
    tests.forEach((t) => map.set(t.id, t));
    return map;
  }, [tests]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const test = testMap.get(sub.test_id);
      const q = searchTerm.toLowerCase();

      // Search match
      const matchesSearch =
        !q ||
        sub.student_name.toLowerCase().includes(q) ||
        (sub.student_roll_no || '').toLowerCase().includes(q) ||
        (test?.title || '').toLowerCase().includes(q) ||
        (test?.subject || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === 'pending' && sub.status !== 'submitted') return false;
      if (statusFilter === 'graded' && sub.status !== 'graded') return false;
      if (statusFilter === 'violation' && !sub.violation_reason) return false;

      // Grade filter
      if (gradeFilter !== 'all' && String(test?.grade) !== gradeFilter) return false;

      return true;
    });
  }, [submissions, testMap, searchTerm, statusFilter, gradeFilter]);

  const handleOpenGrading = (sub: ProctoredMCQSubmission) => {
    const test = testMap.get(sub.test_id);
    if (!test) {
      toast.error('Test definition not found.');
      return;
    }
    setSelectedSubmission(sub);
    setSelectedTest(test);
    setGradingModalOpen(true);
  };

  const handleGradedSuccess = (updated: ProctoredMCQSubmission) => {
    setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  // KPIs
  const totalSubmissions = submissions.length;
  const pendingGradingCount = submissions.filter((s) => s.status === 'submitted').length;
  const violationCount = submissions.filter((s) => !!s.violation_reason).length;
  const avgScore = totalSubmissions > 0
    ? Math.round(
        submissions.reduce((acc, curr) => acc + (curr.final_score ?? curr.auto_score ?? 0), 0) /
          totalSubmissions
      )
    : 0;

  return (
    <div className="space-y-4">
      {/* Top Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] shadow-xs">
          <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider block">
            Submissions Received
          </span>
          <strong className="text-2xl font-black text-[#111111] font-mono mt-1 block">
            {totalSubmissions}
          </strong>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] shadow-xs">
          <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider block">
            Pending Finalization
          </span>
          <strong className={`text-2xl font-black font-mono mt-1 block ${
            pendingGradingCount > 0 ? 'text-amber-600' : 'text-[#111111]'
          }`}>
            {pendingGradingCount}
          </strong>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] shadow-xs">
          <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider block">
            Proctoring Violations
          </span>
          <strong className={`text-2xl font-black font-mono mt-1 block ${
            violationCount > 0 ? 'text-red-600' : 'text-emerald-600'
          }`}>
            {violationCount}
          </strong>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] shadow-xs">
          <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider block">
            Avg Final Score
          </span>
          <strong className="text-2xl font-black text-[#111111] font-mono mt-1 block">
            {avgScore} Marks
          </strong>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search by student name, ID, or assessment title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold text-[#111111] focus:ring-1 focus:ring-[#111111] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-xl border border-[#E5E5E5]">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Needs Grading' },
              { id: 'graded', label: 'Graded' },
              { id: 'violation', label: 'Violations' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-[#111111] text-white shadow-xs'
                    : 'text-[#525252] hover:text-[#111111]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Grade filter */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-bold text-[#111111] focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Grades</option>
            <option value="9">Grade 9</option>
            <option value="10">Grade 10</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
        </div>
      </div>

      {/* Submissions Table / Cards */}
      <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-[#737373]">
            Loading candidate submissions...
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileCheck2 size={36} className="mx-auto text-[#A3A3A3]" />
            <h3 className="text-sm font-black text-[#111111]">No Submissions Found</h3>
            <p className="text-xs text-[#737373] max-w-sm mx-auto">
              No candidate submissions match the selected filters or proctored assessments.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5] text-[11px] font-black uppercase text-[#737373] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Assessment & Subject</th>
                  <th className="px-5 py-3.5">Score</th>
                  <th className="px-5 py-3.5">Proctoring Status</th>
                  <th className="px-5 py-3.5">Grading</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {filteredSubmissions.map((sub) => {
                  const test = testMap.get(sub.test_id);
                  const isGraded = sub.status === 'graded';
                  const hasViolation = !!sub.violation_reason;

                  return (
                    <tr key={sub.id} className="hover:bg-[#FCFCFC] transition-colors">
                      {/* Candidate */}
                      <td className="px-5 py-4">
                        <div className="font-extrabold text-[#111111]">{sub.student_name}</div>
                        <div className="text-[11px] font-mono text-[#737373] mt-0.5">
                          #{sub.student_roll_no || sub.student_id.slice(0, 8)}
                        </div>
                      </td>

                      {/* Assessment */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#111111]">{test?.title || 'MCQ Test'}</div>
                        <div className="text-[11px] text-[#737373] mt-0.5">
                          {test?.subject} • Grade {test?.grade} • {test?.questions.length || 0} MCQs
                        </div>
                      </td>

                      {/* Score */}
                      <td className="px-5 py-4 font-mono">
                        <div className="font-black text-[#111111]">
                          {isGraded ? sub.final_score : sub.auto_score} / {sub.total_marks}
                        </div>
                        <div className="text-[11px] text-[#737373]">
                          {sub.percentage}% • {Math.round(sub.time_spent_seconds / 60)}m
                        </div>
                      </td>

                      {/* Proctoring */}
                      <td className="px-5 py-4">
                        {hasViolation ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 text-[10px] font-black uppercase" title={sub.violation_reason || ''}>
                            <ShieldAlert size={12} className="text-red-600" />
                            <span>Auto-Submitted: Focus/Screen</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>Verified Clean</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {isGraded ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold">
                            <Check size={14} />
                            <span>Graded</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                            Needs Grading
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleOpenGrading(sub)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111111] hover:bg-black text-[#F4C430] font-black text-xs cursor-pointer shadow-2xs active:scale-[0.98]"
                        >
                          <Award size={13} />
                          <span>{isGraded ? 'Review / Edit' : 'Grade Test'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grading Modal */}
      {selectedSubmission && selectedTest && (
        <ProctoredMCQGradingModal
          isOpen={gradingModalOpen}
          test={selectedTest}
          submission={selectedSubmission}
          onClose={() => {
            setGradingModalOpen(false);
            setSelectedSubmission(null);
            setSelectedTest(null);
          }}
          onGraded={handleGradedSuccess}
        />
      )}
    </div>
  );
};

export default ProctoredMCQSubmissionsList;
