import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Users,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Phone,
  UserCheck,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  ArrowUpDown,
  RotateCw,
  MoreVertical,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import StudentTable from '../../components/admin/students/StudentTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import StudentDetailPanel, { capitalizeWords, formatPhoneDisplay } from '../../components/admin/students/StudentDetailPanel';
import { getAllStudents, getAllEnrollments, getAllOfferings, getAllAttendance } from '../../lib/db';
import { getStudentBoardLabel, getStudentGradeLabel, getStudentStreamLabel, formatShortClassAndBoard } from '../../lib/taxonomy';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { useMobile } from '../../hooks/useMobile';
import type { Profile, Enrollment, ClassOffering, Attendance } from '../../types';

export const StudentsAdminPage: React.FC = () => {
  const isMobile = useMobile();
  const [students, setStudents] = useState<Profile[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Search, Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [boardFilter, setBoardFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [streamFilter, setStreamFilter] = useState<string>('all');
  const [atRiskOnly, setAtRiskOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'attendance-low' | 'attendance-high' | 'newest'>('name-asc');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // ── Load from DB on mount ──────────────────────────────────────
  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [stList, enList, offList, attList] = await Promise.all([
        getAllStudents(),
        getAllEnrollments(),
        getAllOfferings(),
        getAllAttendance(),
      ]);
      setStudents(stList);
      setEnrollments(enList);
      setOfferings(offList);
      setAttendanceRecords(attList);
    } catch (err: any) {
      console.error('[StudentsAdminPage] loadData error:', err);
      setLoadError(err?.message || 'Failed to load students data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Realtime sync for live profile and attendance updates ───────
  useRealtimeTable({
    table: 'profiles',
    debounceMs: 500,
    onAny: async () => {
      const stList = await getAllStudents();
      setStudents(stList);
    },
  });

  useRealtimeTable({
    table: 'roster',
    debounceMs: 500,
    onAny: async () => {
      const stList = await getAllStudents();
      setStudents(stList);
    },
  });

  useRealtimeTable({
    table: 'attendance',
    debounceMs: 1000,
    onAny: async () => {
      const attList = await getAllAttendance();
      setAttendanceRecords(attList);
    },
  });

  useRealtimeTable({
    table: 'enrollments',
    debounceMs: 1000,
    onAny: async () => {
      const [enList, stList] = await Promise.all([getAllEnrollments(), getAllStudents()]);
      setEnrollments(enList);
      setStudents(stList);
    },
  });

  // Compute student stats
  const totalCount = students.length;

  // Compute attendance stats across all students & per student
  const attendanceStats = useMemo(() => {
    const studentMap = new Map<string, { attended: number; total: number; rate: number; qualified: boolean }>();

    students.forEach((s) => {
      studentMap.set(s.id, { attended: 0, total: 0, rate: 0, qualified: false });
    });

    attendanceRecords.forEach((r) => {
      const curr = studentMap.get(r.student_id) || { attended: 0, total: 0, rate: 0, qualified: false };
      curr.total += 1;
      if (r.status === 'present' || r.status === 'late') {
        curr.attended += 1;
      }
      curr.rate = curr.total > 0 ? Math.round((curr.attended / curr.total) * 100) : 0;
      curr.qualified = curr.total >= 10;
      studentMap.set(r.student_id, curr);
    });

    const qualifiedStudents = Array.from(studentMap.values()).filter((s) => s.qualified);

    let avgRate: number | null = null;
    let qualifiedAttended = 0;
    let qualifiedTotal = 0;

    if (qualifiedStudents.length > 0) {
      qualifiedStudents.forEach((q) => {
        qualifiedAttended += q.attended;
        qualifiedTotal += q.total;
      });
      avgRate = qualifiedTotal > 0 ? Math.round((qualifiedAttended / qualifiedTotal) * 100) : null;
    }

    const riskAlertsCount = qualifiedStudents.filter((val) => val.rate < 70).length;

    return {
      totalSessions: attendanceRecords.length,
      qualifiedStudentsCount: qualifiedStudents.length,
      qualifiedAttended,
      qualifiedTotal,
      avgRate,
      riskAlertsCount,
      studentMap,
    };
  }, [students, attendanceRecords]);

  // Search, Filter & Sort execution
  const filteredStudents = useMemo(() => {
    let result = students.filter((s) => {
      const sBoard = getStudentBoardLabel(s, enrollments, offerings).toLowerCase();
      const sGrade = getStudentGradeLabel(s, enrollments, offerings).toLowerCase();
      const sStream = getStudentStreamLabel(s).toLowerCase();
      const searchLower = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !searchLower ||
        (s.full_name || '').toLowerCase().includes(searchLower) ||
        (s.phone && s.phone.includes(searchLower)) ||
        sBoard.includes(searchLower) ||
        sGrade.includes(searchLower) ||
        sStream.includes(searchLower);

      if (!matchesSearch) return false;

      // Board filter
      if (boardFilter !== 'all' && !sBoard.includes(boardFilter.toLowerCase())) {
        return false;
      }

      // Grade filter
      if (gradeFilter !== 'all') {
        const cleanGrade = gradeFilter.toLowerCase();
        if (!sGrade.includes(cleanGrade)) return false;
      }

      // Stream filter
      if (streamFilter !== 'all') {
        const rawStream = (s.stream_obj?.name || s.stream || '').toLowerCase().replace(/[\s_]+/g, '-');
        if (streamFilter === 'pre-medical' && !rawStream.includes('pre-med') && !rawStream.includes('bio')) return false;
        if (streamFilter === 'pre-engineering' && !rawStream.includes('pre-eng') && !rawStream.includes('eng')) return false;
        if (streamFilter === 'ics' && !rawStream.includes('ics') && !rawStream.includes('comp')) return false;
        if (streamFilter === 'academic' && !rawStream.includes('academic') && !sBoard.includes('ielts')) return false;
        if (streamFilter === 'general-training' && !rawStream.includes('general') && !sBoard.includes('ielts')) return false;
        if (streamFilter === 'ielts' && !sBoard.includes('ielts') && !rawStream.includes('ielts')) return false;
      }

      // At risk filter
      if (atRiskOnly) {
        const att = attendanceStats.studentMap.get(s.id);
        if (!att || !att.qualified || att.rate >= 70) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return (a.full_name || '').localeCompare(b.full_name || '');
      }
      if (sortBy === 'name-desc') {
        return (b.full_name || '').localeCompare(a.full_name || '');
      }
      if (sortBy === 'attendance-low' || sortBy === 'attendance-high') {
        const rateA = attendanceStats.studentMap.get(a.id)?.rate ?? -1;
        const rateB = attendanceStats.studentMap.get(b.id)?.rate ?? -1;
        return sortBy === 'attendance-low' ? rateA - rateB : rateB - rateA;
      }
      if (sortBy === 'newest') {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      }
      return 0;
    });

    return result;
  }, [students, enrollments, offerings, searchTerm, boardFilter, gradeFilter, streamFilter, atRiskOnly, sortBy, attendanceStats.studentMap]);

  // Action handlers
  const handleViewTrigger = (student: Profile) => {
    setSelectedStudent(student);
    setDrawerOpen(true);
    setActiveMenuId(null);
  };

  const getStats = (student: Profile) => {
    const studentEnrollments = enrollments.filter((e) => e.student_id === student.id);
    const classesCount = studentEnrollments.length;

    const boardName = getStudentBoardLabel(student, enrollments, offerings);
    const gradeName = getStudentGradeLabel(student, enrollments, offerings);
    const streamName = student.stream_obj?.name || student.stream;
    const boardAndGrade = `${gradeName} · ${boardName}`;
    const shortBoardAndGrade = formatShortClassAndBoard({ gradeName, boardName, streamName });

    return { classesCount, boardName, gradeName, boardAndGrade, shortBoardAndGrade };
  };

  const getInitials = (name: string) => {
    return (name || '')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStreamBadge = (student: Profile, boardName: string) => {
    const rawStream = getStudentStreamLabel(student);
    const isIelts = boardName.toLowerCase().includes('ielts') || rawStream.toLowerCase().includes('ielts');

    if (isIelts) {
      const isGt = rawStream.toLowerCase().includes('general');
      return {
        label: isGt ? 'IELTS · General Training' : 'IELTS · Academic',
        style: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      };
    }

    const norm = rawStream.toLowerCase();
    if (norm.includes('pre-med') || norm.includes('biology')) {
      return {
        label: 'Pre-Medical',
        style: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      };
    }
    if (norm.includes('pre-eng') || norm.includes('engineering')) {
      return {
        label: 'Pre-Engineering',
        style: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      };
    }
    if (norm.includes('ics') || norm.includes('computer')) {
      return {
        label: 'ICS',
        style: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      };
    }
    return {
      label: rawStream || 'General',
      style: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
    };
  };

  // Status for Avg Attendance
  const avgAttendanceInfo = useMemo(() => {
    if (attendanceStats.avgRate === null) {
      return {
        text: 'Awaiting 10+ sessions',
        color: 'text-neutral-500',
        badge: 'Collecting Data',
        badgeColor: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700',
      };
    }
    const r = attendanceStats.avgRate;
    if (r >= 75) {
      return {
        text: `${r}%`,
        color: 'text-emerald-600 dark:text-emerald-400',
        badge: 'Good Target',
        badgeColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      };
    }
    if (r >= 70) {
      return {
        text: `${r}%`,
        color: 'text-amber-600 dark:text-amber-400',
        badge: 'Fair',
        badgeColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      };
    }
    return {
      text: `${r}%`,
      color: 'text-rose-600 dark:text-rose-400',
      badge: 'Below Target',
      badgeColor: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    };
  }, [attendanceStats.avgRate]);

  return (
    <AdminShell>
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                Students
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#F4C430]/20 text-[#B45309] dark:text-[#F4C430] border border-[#F4C430]/40 shrink-0">
                UI v2
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Academy student registry, attendance performance tracking, and roster profiles.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {/* Real Link to Roster */}
            <Link
              to="/admin/roster"
              className="text-xs font-bold text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-[#F4C430] dark:hover:border-[#F4C430] px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all shadow-xs hover:scale-[1.02] active:scale-95"
              title="Open Roster Manager to manage student admissions and accounts"
            >
              <UserCheck size={14} className="text-[#D4A017] dark:text-[#F4C430]" />
              <span>Managed via Roster</span>
              <ExternalLink size={12} className="text-neutral-400" />
            </Link>
          </div>
        </div>

        {/* Analytics Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Total Students Card */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users size={16} />
              </div>
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Total</span>
            </div>
            <div className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
              {loading ? (
                <span className="inline-block w-8 h-7 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
              ) : (
                totalCount
              )}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
              Registered Students in Academy
            </div>
          </div>

          {/* Avg Attendance Card */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${avgAttendanceInfo.badgeColor}`}
                title="Goal: 75%+ attendance rate"
              >
                {avgAttendanceInfo.badge}
              </span>
            </div>
            <div className={`text-2xl font-black ${avgAttendanceInfo.color}`}>
              {loading ? (
                <span className="inline-block w-12 h-7 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
              ) : (
                avgAttendanceInfo.text
              )}
            </div>
            <div
              className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium flex items-center gap-1"
              title="Calculated across students who have at least 10 recorded lecture sessions."
            >
              <span>
                Based on {attendanceStats.qualifiedStudentsCount} of {totalCount} students with 10+ sessions
              </span>
              <HelpCircle size={12} className="text-neutral-400 shrink-0" />
            </div>
          </div>

          {/* Attendance Warnings Card */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
              <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Threshold: &lt;70%
              </span>
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {loading ? (
                <span className="inline-block w-8 h-7 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
              ) : (
                attendanceStats.riskAlertsCount
              )}
            </div>
            <div
              className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium flex items-center gap-1"
              title="Students with at least 10 recorded sessions whose attendance is below the 70% minimum threshold."
            >
              <span>Students requiring intervention</span>
              <HelpCircle size={12} className="text-neutral-400 shrink-0" />
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters & Sorters */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3.5 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search students by name, phone, or board..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-[#F4C430]"
              />
            </div>

            {/* Desktop / Tablet Filters */}
            <div className="hidden sm:flex items-center gap-2 flex-wrap">
              {/* Board Dropdown */}
              <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 min-h-[44px]">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Board:</span>
                <select
                  value={boardFilter}
                  onChange={(e) => setBoardFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer focus:outline-hidden pr-2 min-h-[36px]"
                >
                  <option value="all">All Boards</option>
                  <option value="fbise">FBISE</option>
                  <option value="punjab">Punjab</option>
                  <option value="sindh">Sindh</option>
                  <option value="kpk">KPK</option>
                  <option value="olevel">O Levels</option>
                  <option value="alevel">A Levels</option>
                  <option value="ielts">IELTS</option>
                </select>
              </div>

              {/* Grade Dropdown */}
              <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 min-h-[44px]">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Grade:</span>
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer focus:outline-hidden pr-2 min-h-[36px]"
                >
                  <option value="all">All Grades</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                  <option value="ielts">IELTS</option>
                </select>
              </div>

              {/* Stream Dropdown */}
              <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 min-h-[44px]">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Stream:</span>
                <select
                  value={streamFilter}
                  onChange={(e) => setStreamFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer focus:outline-hidden pr-2 min-h-[36px]"
                >
                  <option value="all">All Streams</option>
                  <option value="pre-engineering">Pre-Engineering</option>
                  <option value="pre-medical">Pre-Medical</option>
                  <option value="ics">ICS</option>
                  <option value="ielts">IELTS (All)</option>
                  <option value="academic">IELTS Academic</option>
                  <option value="general-training">IELTS General Training</option>
                </select>
              </div>

              {/* At Risk Only Toggle */}
              <button
                type="button"
                onClick={() => setAtRiskOnly(!atRiskOnly)}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  atRiskOnly
                    ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                    : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <AlertTriangle size={13} className={atRiskOnly ? 'text-white' : 'text-rose-500'} />
                <span>At Risk (&lt;70%)</span>
              </button>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 min-h-[44px]">
                <ArrowUpDown size={13} className="text-neutral-400 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer focus:outline-hidden pr-2 min-h-[36px]"
                >
                  <option value="name-asc">Name (A–Z)</option>
                  <option value="name-desc">Name (Z–A)</option>
                  <option value="attendance-low">Attendance (Lowest First)</option>
                  <option value="attendance-high">Attendance (Highest First)</option>
                  <option value="newest">Newest Registered</option>
                </select>
              </div>
            </div>

            {/* Mobile Filter Trigger Button */}
            <div className="flex sm:hidden items-center justify-between gap-2">
              <span className="text-xs font-bold text-neutral-500">
                {filteredStudents.length} of {totalCount} students
              </span>

              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5"
              >
                <SlidersHorizontal size={14} className="text-amber-500" />
                <span>Filter & Sort</span>
                {(boardFilter !== 'all' || gradeFilter !== 'all' || streamFilter !== 'all' || atRiskOnly) && (
                  <span className="w-2 h-2 rounded-full bg-[#F4C430]" />
                )}
              </button>
            </div>
          </div>

          {/* Active Filter Chips & Counter */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-500">
            <span className="font-semibold text-[11px] hidden sm:inline">
              Showing {filteredStudents.length} of {totalCount} students
            </span>

            {(boardFilter !== 'all' || gradeFilter !== 'all' || streamFilter !== 'all' || atRiskOnly || searchTerm) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {boardFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold">
                    Board: {boardFilter.toUpperCase()}
                    <button onClick={() => setBoardFilter('all')} className="hover:text-neutral-900">
                      <X size={10} />
                    </button>
                  </span>
                )}
                {gradeFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold">
                    Grade: {gradeFilter}
                    <button onClick={() => setGradeFilter('all')} className="hover:text-neutral-900">
                      <X size={10} />
                    </button>
                  </span>
                )}
                {streamFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold">
                    Stream: {streamFilter}
                    <button onClick={() => setStreamFilter('all')} className="hover:text-neutral-900">
                      <X size={10} />
                    </button>
                  </span>
                )}
                {atRiskOnly && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                    At Risk
                    <button onClick={() => setAtRiskOnly(false)} className="hover:text-rose-900">
                      <X size={10} />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setBoardFilter('all');
                    setGradeFilter('all');
                    setStreamFilter('all');
                    setAtRiskOnly(false);
                  }}
                  className="text-[11px] text-[#D4A017] dark:text-[#F4C430] font-bold hover:underline cursor-pointer ml-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading / Error / Data Display */}
        {loading ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="w-32 h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
              <div className="w-16 h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2.5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                  <div className="space-y-1.5">
                    <div className="w-36 h-3.5 bg-neutral-200 dark:bg-neutral-800 rounded" />
                    <div className="w-24 h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded" />
                  </div>
                </div>
                <div className="w-20 h-6 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center space-y-3">
            <AlertTriangle size={32} className="mx-auto text-rose-500" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Unable to load students</h3>
            <p className="text-xs text-neutral-500">{loadError}</p>
            <button
              onClick={loadData}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F4C430] hover:bg-[#E5B520] text-black font-extrabold text-xs inline-flex items-center gap-1.5 transition-all"
            >
              <RotateCw size={13} />
              <span>Retry</span>
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-center py-16 p-4 shadow-xs">
            <Sparkles size={28} className="mx-auto text-neutral-400 mb-3" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">No matching students found</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search keywords, board or stream filters, or uncheck "At Risk".
            </p>
          </div>
        ) : isMobile ? (
          /* Mobile Stacked Student Cards (<640px) */
          <div className="space-y-3">
            {filteredStudents.map((student) => {
              const stats = getStats(student);
              const streamInfo = getStreamBadge(student, stats.boardName);
              const attData = attendanceStats.studentMap.get(student.id);
              const isQualified = Boolean(attData && attData.total >= 10);
              const total = attData?.total || 0;
              const attended = attData?.attended || 0;
              const rate = attData?.rate ?? 0;
              const phoneFormatted = formatPhoneDisplay(student.phone);
              const cleanDigits = (student.phone || '').replace(/\D/g, '');
              const cleanPhoneIntl = cleanDigits.startsWith('92')
                ? cleanDigits
                : cleanDigits.startsWith('03')
                ? `92${cleanDigits.slice(1)}`
                : `92${cleanDigits}`;

              return (
                <div
                  key={student.id}
                  onClick={() => handleViewTrigger(student)}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs flex flex-col gap-3 transition-colors active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-xs font-black text-neutral-900 dark:text-neutral-100 shrink-0">
                        {getInitials(student.full_name)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100 block truncate text-sm">
                          {capitalizeWords(student.full_name)}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium mt-0.5">
                          <Phone size={11} className="shrink-0" />
                          <span className="font-mono text-[11px]">{phoneFormatted}</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === student.id ? null : student.id)}
                        className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 flex items-center justify-center transition-colors"
                        aria-label="Actions"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenuId === student.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-20 py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              handleViewTrigger(student);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                          >
                            View Profile
                          </button>
                          {cleanDigits.length >= 10 && (
                            <>
                              <a
                                href={`tel:+${cleanPhoneIntl}`}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-1.5"
                              >
                                <Phone size={12} />
                                <span>Call Student</span>
                              </a>
                              <a
                                href={`https://wa.me/${cleanPhoneIntl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-1.5"
                              >
                                <MessageCircle size={12} />
                                <span>WhatsApp</span>
                              </a>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badges: Stream & Board */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className={`inline-block border text-[10px] font-bold py-0.5 px-2 rounded-md ${streamInfo.style}`}>
                      {streamInfo.label}
                    </span>
                    <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                      {stats.boardAndGrade}
                    </span>
                  </div>

                  {/* Attendance Performance */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Attendance:
                    </span>

                    {isQualified ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full border ${
                            rate >= 75
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200'
                              : rate >= 70
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200'
                          }`}
                        >
                          <span>{rate}%</span>
                          <span>({rate >= 75 ? 'Good' : rate >= 70 ? 'Fair' : 'At Risk'})</span>
                        </span>
                        <span className="text-[10px] text-neutral-400 font-semibold">
                          ({attended}/{total})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full"
                            style={{ width: `${Math.min(100, (total / 10) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500">
                          {total} of 10 sessions
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop & Tablet Table */
          <StudentTable
            students={filteredStudents}
            onView={handleViewTrigger}
            enrollments={enrollments}
            offerings={offerings}
            attendanceStatsMap={attendanceStats.studentMap}
          />
        )}

        {/* Mobile Filter Bottom Sheet */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-end sm:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileFilterOpen(false)}
            />
            <div className="relative bg-white dark:bg-neutral-900 rounded-t-3xl max-h-[85vh] flex flex-col z-10 shadow-2xl border-t border-neutral-200 dark:border-neutral-800 p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="text-sm font-black text-neutral-900 dark:text-neutral-100">
                  Filter & Sort Students
                </h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3.5 overflow-y-auto max-h-[60vh] pr-1">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1">Board</label>
                  <select
                    value={boardFilter}
                    onChange={(e) => setBoardFilter(e.target.value)}
                    className="w-full min-h-[44px] p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-bold text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="all">All Boards</option>
                    <option value="fbise">FBISE</option>
                    <option value="punjab">Punjab</option>
                    <option value="sindh">Sindh</option>
                    <option value="kpk">KPK</option>
                    <option value="olevel">O Levels</option>
                    <option value="alevel">A Levels</option>
                    <option value="ielts">IELTS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1">Grade</label>
                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="w-full min-h-[44px] p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-bold text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="all">All Grades</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                    <option value="ielts">IELTS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1">Stream</label>
                  <select
                    value={streamFilter}
                    onChange={(e) => setStreamFilter(e.target.value)}
                    className="w-full min-h-[44px] p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-bold text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="all">All Streams</option>
                    <option value="pre-engineering">Pre-Engineering</option>
                    <option value="pre-medical">Pre-Medical</option>
                    <option value="ics">ICS</option>
                    <option value="ielts">IELTS (All)</option>
                    <option value="academic">IELTS Academic</option>
                    <option value="general-training">IELTS General Training</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full min-h-[44px] p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-bold text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="name-asc">Name (A–Z)</option>
                    <option value="name-desc">Name (Z–A)</option>
                    <option value="attendance-low">Attendance (Lowest First)</option>
                    <option value="attendance-high">Attendance (Highest First)</option>
                    <option value="newest">Newest Registered</option>
                  </select>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={atRiskOnly}
                      onChange={(e) => setAtRiskOnly(e.target.checked)}
                      className="w-4 h-4 accent-rose-500 rounded"
                    />
                    <span className="text-xs font-bold text-rose-600">Only show At Risk students (&lt;70%)</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBoardFilter('all');
                    setGradeFilter('all');
                    setStreamFilter('all');
                    setAtRiskOnly(false);
                    setSortBy('name-asc');
                  }}
                  className="min-h-[44px] flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="min-h-[44px] flex-1 rounded-xl bg-[#F4C430] hover:bg-[#E5B520] text-black font-extrabold text-xs"
                >
                  Apply ({filteredStudents.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Slide-over Profile Drawer (Full-width on Mobile) */}
        <AdminDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedStudent(null);
          }}
          title="Student Profile Details"
        >
          {selectedStudent && <StudentDetailPanel student={selectedStudent} />}
        </AdminDrawer>
      </div>
    </AdminShell>
  );
};

export default StudentsAdminPage;
