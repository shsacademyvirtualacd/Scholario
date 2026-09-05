import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Calendar,
  Clock,
  Award,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  GraduationCap,
  FileCheck2,
  X,
  ShieldAlert,
  Target
} from 'lucide-react';
import { ProctoredMCQSubmissionsList } from '../teacher/ProctoredMCQSubmissionsList';
import type { StudentMCQAttempt, ClassOffering } from '../../types';
import { getStudentMCQAttemptsForTeacher, getAllStudentMCQAttempts } from '../../lib/db';
import { useAuth } from '../../features/auth/AuthContext';
import { BOARDS } from '../../lib/taxonomy';

interface StudentResultsViewProps {
  isTeacher?: boolean;
  teacherOfferings?: ClassOffering[];
  teacherId?: string;
  teacherEmail?: string;
  teacherName?: string;
}

export const StudentResultsView: React.FC<StudentResultsViewProps> = ({
  isTeacher = false,
  teacherOfferings = [],
  teacherId,
  teacherEmail,
  teacherName,
}) => {
  const { user, profile } = useAuth();
  const [results, setResults] = useState<StudentMCQAttempt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAttempt, setSelectedAttempt] = useState<StudentMCQAttempt | null>(null);
  const [activeCategory, setActiveCategory] = useState<'proctored' | 'self-test'>('proctored');

  // Filters state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [boardFilter, setBoardFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'high' | 'pass' | 'low'>('all');

  // Teacher scope derivation
  const teacherAssignedGrades = useMemo(() => {
    if (!isTeacher) return ['9', '10', '11', '12'];
    const gSet = new Set<string>();
    teacherOfferings.forEach((o) => {
      const g = o.class?.grade || o.grade;
      if (g) gSet.add(String(g));
    });
    return Array.from(gSet).sort((a, b) => Number(a) - Number(b));
  }, [isTeacher, teacherOfferings]);

  const teacherAssignedSubjects = useMemo(() => {
    if (!isTeacher) return [];
    const sSet = new Set<string>();
    teacherOfferings.forEach((o) => {
      const s = o.subject?.name || o.subject_name || o.subject;
      if (s) sSet.add(String(s));
    });
    return Array.from(sSet).sort();
  }, [isTeacher, teacherOfferings]);

  // Load results
  const fetchResults = async () => {
    setLoading(true);
    try {
      if (isTeacher) {
        const effTeacherId = teacherId || profile?.id;
        const effEmail = teacherEmail || user?.email || (profile as any)?.email;
        const effName = teacherName || profile?.full_name;
        const data = await getStudentMCQAttemptsForTeacher(effTeacherId, effEmail, effName);
        setResults(data);
      } else {
        // Admin or unscoped
        const data = await getAllStudentMCQAttempts();
        setResults(data);
      }
    } catch (err) {
      console.error('Error fetching student MCQ results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [isTeacher, teacherId, teacherEmail, teacherName, profile?.id]);

  // Distinct subjects available in current results dataset
  const distinctSubjects = useMemo(() => {
    if (isTeacher) return teacherAssignedSubjects;
    const s = new Set<string>();
    results.forEach((r) => {
      if (r.subject) s.add(r.subject);
    });
    return Array.from(s).sort();
  }, [results, isTeacher, teacherAssignedSubjects]);

  // Date filtering logic
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = startOfToday - 7 * 24 * 3600 * 1000;
  const thirtyDaysAgo = startOfToday - 30 * 24 * 3600 * 1000;

  // Filtered dataset
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      // 1. Teacher strict scope check (extra safety layer)
      if (isTeacher) {
        const gradeMatches = teacherAssignedGrades.length === 0 || teacherAssignedGrades.includes(String(r.grade));
        const subLower = (r.subject || '').trim().toLowerCase();
        const subjectMatches = teacherAssignedSubjects.some(
          (ts) => ts.trim().toLowerCase() === subLower || ts.toLowerCase().includes(subLower) || subLower.includes(ts.toLowerCase())
        );
        if (!gradeMatches || !subjectMatches) {
          return false;
        }
      }

      // 2. Board filter (Admin only)
      if (!isTeacher && boardFilter !== 'all' && (r.board || 'fbise').toLowerCase() !== boardFilter.toLowerCase()) {
        return false;
      }

      // 3. Grade filter
      if (gradeFilter !== 'all' && String(r.grade) !== String(gradeFilter)) {
        return false;
      }

      // 4. Subject filter
      if (subjectFilter !== 'all' && r.subject.toLowerCase() !== subjectFilter.toLowerCase()) {
        return false;
      }

      // 5. Search term (student name or topic)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = (r.student_name || '').toLowerCase().includes(q);
        const matchesTopic = (r.topic || '').toLowerCase().includes(q);
        const matchesSubject = (r.subject || '').toLowerCase().includes(q);
        const matchesChapters = (r.chapters || []).some((c) => c.toLowerCase().includes(q));
        if (!matchesName && !matchesTopic && !matchesSubject && !matchesChapters) {
          return false;
        }
      }

      // 6. Date Range filter
      const itemTime = new Date(r.created_at).getTime();
      if (dateRange === 'today' && itemTime < startOfToday) {
        return false;
      }
      if (dateRange === '7days' && itemTime < sevenDaysAgo) {
        return false;
      }
      if (dateRange === '30days' && itemTime < thirtyDaysAgo) {
        return false;
      }

      // 7. Performance filter
      if (performanceFilter === 'high' && r.percentage < 80) return false;
      if (performanceFilter === 'pass' && (r.percentage < 60 || r.percentage >= 80)) return false;
      if (performanceFilter === 'low' && r.percentage >= 60) return false;

      return true;
    });
  }, [
    results,
    isTeacher,
    teacherAssignedGrades,
    teacherAssignedSubjects,
    boardFilter,
    gradeFilter,
    subjectFilter,
    searchTerm,
    dateRange,
    performanceFilter,
    startOfToday,
    sevenDaysAgo,
    thirtyDaysAgo,
  ]);

  // Aggregate statistics calculation
  const stats = useMemo(() => {
    const totalAttempts = filteredResults.length;
    if (totalAttempts === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        highestScore: 0,
        uniqueStudents: 0,
        avgTimeMinutes: 0,
      };
    }

    const totalPercentageSum = filteredResults.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    const averageScore = Math.round(totalPercentageSum / totalAttempts);

    const passedCount = filteredResults.filter((r) => r.percentage >= 60).length;
    const passRate = Math.round((passedCount / totalAttempts) * 100);

    const highestScore = Math.max(...filteredResults.map((r) => r.percentage || 0));

    const studentIds = new Set(filteredResults.map((r) => r.student_id || r.student_name));
    const uniqueStudents = studentIds.size;

    const totalSecondsSum = filteredResults.reduce((acc, curr) => acc + (curr.time_spent_seconds || 0), 0);
    const avgTimeMinutes = Math.round(totalSecondsSum / totalAttempts / 60 * 10) / 10;

    return {
      totalAttempts,
      averageScore,
      passRate,
      highestScore,
      uniqueStudents,
      avgTimeMinutes,
    };
  }, [filteredResults]);

  // Helper formatter for time
  const formatSeconds = (secs: number) => {
    if (!secs || isNaN(secs)) return '0m 0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  // Helper formatter for date
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  };

  const formatTimeStr = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Score badge helper
  const getScoreBadge = (score: number, total: number, pct: number) => {
    if (pct >= 80) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={13} className="text-emerald-600" />
          <span>{score}/{total} ({pct}%)</span>
        </span>
      );
    }
    if (pct >= 60) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
          <Award size={13} className="text-amber-600" />
          <span>{score}/{total} ({pct}%)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
        <AlertCircle size={13} className="text-rose-600" />
        <span>{score}/{total} ({pct}%)</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Category Toggle: Proctored Assessments (with grading) vs Self-Test Practice */}
      <div className="flex items-center gap-2 p-1.5 bg-[#EBEBEB] rounded-2xl w-fit">
        <button
          onClick={() => setActiveCategory('proctored')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCategory === 'proctored'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'text-[#525252] hover:text-[#111111] hover:bg-black/5'
          }`}
        >
          <ShieldAlert size={15} className={activeCategory === 'proctored' ? 'text-[#F4C430]' : 'text-[#737373]'} />
          <span>Proctored MCQ Assessments</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F4C430] text-[#111111]">
            Grading
          </span>
        </button>

        <button
          onClick={() => setActiveCategory('self-test')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCategory === 'self-test'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'text-[#525252] hover:text-[#111111] hover:bg-black/5'
          }`}
        >
          <Target size={15} className={activeCategory === 'self-test' ? 'text-[#F4C430]' : 'text-[#737373]'} />
          <span>Self-Testing Practice</span>
        </button>
      </div>

      {activeCategory === 'proctored' ? (
        <ProctoredMCQSubmissionsList isTeacher={isTeacher} />
      ) : (
        <>
          {/* Teacher Scoping Banner */}
          {isTeacher && (
            <div className="bg-linear-to-r from-[#FAFAFA] to-[#F5F5F5] border border-[#E5E5E5] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#111111] text-[#F4C430] flex items-center justify-center font-bold text-sm shrink-0">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#111111]">
                    Class-Scoped Results View
                  </p>
                  <p className="text-[11px] font-medium text-[#737373]">
                    Strictly displaying MCQ practice & exam generator results for your assigned roster:{' '}
                    <span className="font-bold text-[#111111]">
                      {teacherAssignedGrades.length > 0
                        ? teacherAssignedGrades.map((g) => `Grade ${g}`).join(', ')
                        : 'No classes'}{' '}
                      • {teacherAssignedSubjects.join(', ') || 'No subjects'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-2.5 py-1 bg-white border border-[#E5E5E5] rounded-lg text-[11px] font-extrabold text-[#111111] shadow-2xs">
                  {teacherOfferings.length} Active {teacherOfferings.length === 1 ? 'Assignment' : 'Assignments'}
                </span>
              </div>
            </div>
          )}

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Attempts */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#737373] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Attempts</span>
            <FileCheck2 size={16} className="text-[#111111]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#111111] tracking-tight">
              {stats.totalAttempts}
            </span>
            <span className="text-[11px] font-semibold text-[#737373]">
              across {stats.uniqueStudents} {stats.uniqueStudents === 1 ? 'student' : 'students'}
            </span>
          </div>
        </div>

        {/* Class Average Score */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#737373] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Class Average</span>
            <TrendingUp size={16} className={stats.averageScore >= 75 ? 'text-emerald-600' : 'text-amber-600'} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#111111] tracking-tight">
              {stats.averageScore}%
            </span>
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
              stats.averageScore >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {stats.averageScore >= 75 ? 'Strong' : 'Average'}
            </span>
          </div>
        </div>

        {/* Pass Rate */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#737373] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pass Rate (&ge;60%)</span>
            <Award size={16} className="text-[#F4C430]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#111111] tracking-tight">
              {stats.passRate}%
            </span>
            <span className="text-[11px] font-semibold text-[#737373]">
              High: {stats.highestScore}%
            </span>
          </div>
        </div>

        {/* Avg Completion Time */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#737373] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Time / Quiz</span>
            <Clock size={16} className="text-[#111111]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#111111] tracking-tight">
              {stats.avgTimeMinutes} <span className="text-sm font-semibold text-[#737373]">min</span>
            </span>
            <span className="text-[11px] font-semibold text-[#737373]">
              per session
            </span>
          </div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by student name, chapter, or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#111111]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Controls Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Board Selector (Admin only) */}
            {!isTeacher && (
              <select
                value={boardFilter}
                onChange={(e) => setBoardFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold text-[#111111] focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Boards</option>
                {BOARDS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            {/* Grade Selector */}
            <div className="flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-xl border border-[#E5E5E5]">
              <span className="text-[11px] font-bold text-[#737373] px-2">Grade:</span>
              <button
                onClick={() => setGradeFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  gradeFilter === 'all'
                    ? 'bg-[#111111] text-white shadow-xs'
                    : 'text-[#525252] hover:text-[#111111]'
                }`}
              >
                All
              </button>
              {(isTeacher ? teacherAssignedGrades : ['9', '10', '11', '12']).map((g) => (
                <button
                  key={g}
                  onClick={() => setGradeFilter(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    gradeFilter === g
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#525252] hover:text-[#111111]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Subject Selector */}
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold text-[#111111] focus:outline-hidden cursor-pointer max-w-[170px]"
            >
              <option value="all">All Subjects</option>
              {distinctSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>

            {/* Date Range Selector */}
            <div className="flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-xl border border-[#E5E5E5]">
              <Calendar size={13} className="text-[#737373] ml-1.5 mr-0.5" />
              {[
                { key: 'all', label: 'All Time' },
                { key: 'today', label: 'Today' },
                { key: '7days', label: '7 Days' },
                { key: '30days', label: '30 Days' },
              ].map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDateRange(d.key as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    dateRange === d.key
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#525252] hover:text-[#111111]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Reset Filters */}
            {(searchTerm || gradeFilter !== 'all' || subjectFilter !== 'all' || boardFilter !== 'all' || dateRange !== 'all' || performanceFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setGradeFilter('all');
                  setSubjectFilter('all');
                  setBoardFilter('all');
                  setDateRange('all');
                  setPerformanceFilter('all');
                }}
                className="h-9 px-3 rounded-xl border border-dashed border-[#D4D4D4] text-xs font-bold text-[#737373] hover:text-[#111111] hover:border-[#111111] transition-colors flex items-center gap-1.5"
                title="Reset all filters"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Table & Content */}
      <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            <div className="h-6 bg-[#F5F5F5] rounded-md w-1/4 mb-4" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-[#FAFAFA] rounded-xl border border-[#F0F0F0]" />
            ))}
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen size={40} className="mx-auto mb-3 text-[#A3A3A3]" />
            <h4 className="text-base font-extrabold text-[#111111]">No Student MCQ Results Found</h4>
            <p className="text-xs text-[#737373] mt-1.5 max-w-md mx-auto">
              {searchTerm || gradeFilter !== 'all' || subjectFilter !== 'all' || dateRange !== 'all'
                ? 'No student attempts match the active filter criteria. Try broadening your filter selection.'
                : isTeacher
                ? 'Students enrolled in your assigned classes have not taken any self-tests or MCQ practice quizzes yet. Completed attempts will automatically appear here.'
                : 'No student MCQ tests have been taken yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[11px] font-extrabold text-[#737373] uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Class & Board</th>
                  <th className="py-3 px-4">Subject & Topic</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4">Time Taken</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0] text-xs">
                {filteredResults.map((attempt) => {
                  const initials = (attempt.student_name || 'Student')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={attempt.id}
                      onClick={() => setSelectedAttempt(attempt)}
                      className="hover:bg-[#FAFAFA] transition-colors cursor-pointer group"
                    >
                      {/* Student Name */}
                      <td className="py-3.5 px-4 font-bold text-[#111111]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center text-[11px] font-black shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-extrabold text-[#111111] group-hover:text-[#111111]">
                              {attempt.student_name}
                            </p>
                            {attempt.student_email && (
                              <p className="text-[10px] font-medium text-[#737373]">
                                {attempt.student_email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Class & Board */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-[#111111] text-white font-extrabold text-[10px]">
                            Grade {attempt.grade}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#F5F5F5] border border-[#E5E5E5] text-[#525252] font-bold text-[10px] uppercase">
                            {attempt.board || 'FBISE'}
                          </span>
                        </div>
                      </td>

                      {/* Subject & Topic */}
                      <td className="py-3.5 px-4 max-w-[280px]">
                        <div className="font-extrabold text-[#111111] flex items-center gap-1.5">
                          <span>{attempt.subject}</span>
                        </div>
                        <p className="text-[11px] font-medium text-[#737373] truncate mt-0.5" title={attempt.topic}>
                          {attempt.topic || (attempt.chapters && attempt.chapters.join(', ')) || 'General Test'}
                        </p>
                      </td>

                      {/* Exam Mode / Difficulty */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/60 font-extrabold text-[10px] w-fit uppercase">
                            {attempt.exam_mode === 'full_syllabus'
                              ? 'Full Syllabus'
                              : attempt.exam_mode === 'multi_chapter'
                              ? 'Multi-Chapter'
                              : attempt.exam_mode === 'weak_topics'
                              ? 'Weak Topics'
                              : 'Chapter Test'}
                          </span>
                          {attempt.difficulty && (
                            <span className="text-[10px] font-semibold text-[#737373] capitalize">
                              {attempt.difficulty} level
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Score Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {getScoreBadge(attempt.score, attempt.total_questions, attempt.percentage)}
                      </td>

                      {/* Time Taken */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-[#525252]">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-[#A3A3A3]" />
                          <span>{formatSeconds(attempt.time_spent_seconds)}</span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-[#111111]">{formatDate(attempt.created_at)}</p>
                        <p className="text-[10px] font-medium text-[#737373]">{formatTimeStr(attempt.created_at)}</p>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAttempt(attempt);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#FAFAFA] hover:bg-[#111111] hover:text-white text-[#525252] font-bold text-xs border border-[#E5E5E5] transition-all"
                        >
                          View Breakdown
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

      {/* Detail Modal for Selected Attempt */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E5E5E5] max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#111111] text-[#F4C430] flex items-center justify-center font-black text-sm">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#111111]">Student MCQ Attempt Details</h3>
                  <p className="text-xs text-[#737373]">
                    {selectedAttempt.student_name} • Grade {selectedAttempt.grade} {selectedAttempt.subject}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAttempt(null)}
                className="w-8 h-8 rounded-full hover:bg-[#F5F5F5] flex items-center justify-center text-[#737373] hover:text-[#111111] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Score & KPI Snapshot */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-[#FAFAFA] rounded-2xl border border-[#E5E5E5]">
              <div className="text-center">
                <p className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">Score</p>
                <p className="text-xl font-black text-[#111111] mt-0.5">
                  {selectedAttempt.score} / {selectedAttempt.total_questions}
                </p>
                <p className="text-[11px] font-bold text-emerald-600">
                  {selectedAttempt.percentage}%
                </p>
              </div>
              <div className="text-center border-x border-[#E5E5E5]">
                <p className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">Time Taken</p>
                <p className="text-xl font-black text-[#111111] mt-0.5">
                  {formatSeconds(selectedAttempt.time_spent_seconds)}
                </p>
                <p className="text-[10px] font-medium text-[#737373]">
                  {selectedAttempt.total_questions > 0
                    ? `${Math.round(selectedAttempt.time_spent_seconds / selectedAttempt.total_questions)}s/question`
                    : ''}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">Pace & Rating</p>
                <p className="text-xl font-black text-[#111111] mt-0.5">
                  {selectedAttempt.percentage >= 80 ? 'Mastery' : selectedAttempt.percentage >= 60 ? 'Passing' : 'Needs Prep'}
                </p>
                <p className="text-[10px] font-semibold text-[#737373] capitalize">
                  {selectedAttempt.difficulty || 'standard'}
                </p>
              </div>
            </div>

            {/* Metadata list */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#F0F0F0]">
                <span className="font-bold text-[#737373]">Subject</span>
                <span className="font-extrabold text-[#111111]">{selectedAttempt.subject}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F0F0F0]">
                <span className="font-bold text-[#737373]">Topic / Chapters</span>
                <span className="font-extrabold text-[#111111] text-right max-w-[280px]">
                  {selectedAttempt.topic || (selectedAttempt.chapters && selectedAttempt.chapters.join(', '))}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F0F0F0]">
                <span className="font-bold text-[#737373]">Mode</span>
                <span className="font-extrabold text-[#111111] uppercase">
                  {selectedAttempt.exam_mode || 'Chapter Practice'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F0F0F0]">
                <span className="font-bold text-[#737373]">Date Submitted</span>
                <span className="font-extrabold text-[#111111]">
                  {formatDate(selectedAttempt.created_at)} at {formatTimeStr(selectedAttempt.created_at)}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-bold text-[#737373]">Board Curriculum</span>
                <span className="font-extrabold text-[#111111] uppercase">
                  {selectedAttempt.board || 'FBISE'} Board
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedAttempt(null)}
                className="w-full py-2.5 rounded-xl bg-[#111111] text-white text-xs font-black hover:bg-[#262626] transition-colors shadow-xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default StudentResultsView;
