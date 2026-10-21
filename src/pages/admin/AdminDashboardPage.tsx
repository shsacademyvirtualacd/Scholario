import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Percent,
  Megaphone,
  RefreshCw,
  Search,
  ArrowUpDown,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import TeacherAttendanceOverviewCard from '../../components/admin/attendance/TeacherAttendanceOverviewCard';
import {
  getDashboardCounts,
  getAllTeachers,
  getAllOfferings,
  getAllSlots,
  getAllEnrollments,
  getOverallAttendanceStats,
} from '../../lib/db';
import type { Teacher, ClassOffering, ClassSlot, Enrollment, Profile } from '../../types';
import { NotificationPermissionBanner } from '../../components/student/NotificationPermissionBanner';
import {
  formatPKTDate,
  formatPKTTime,
  normalizeSubject,
  sortBoards,
  sortGrades,
} from '../../utils/pktUtils';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [counts, setCounts] = useState({ students: 0, teachers: 0, offerings: 0, announcements: 0 });
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [slots, setSlots] = useState<ClassSlot[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<{
    attendanceRate: number;
    totalRecords: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    lowAttendanceStudents: Array<{
      student: Profile;
      rate: number;
      attended: number;
      total: number;
      subject: string;
    }>;
  }>({
    attendanceRate: 100,
    totalRecords: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    lowAttendanceStudents: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [staleSessionCount, setStaleSessionCount] = useState<number>(0);

  // Teacher Workload table state
  const [workloadSearch, setWorkloadSearch] = useState('');
  const [workloadSortBy, setWorkloadSortBy] = useState<'name' | 'students' | 'classes'>('classes');
  const [workloadSortAsc, setWorkloadSortAsc] = useState(false);
  const [workloadShowAll, setWorkloadShowAll] = useState(false);

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [c, t, o, s, e, att] = await Promise.all([
        getDashboardCounts().catch(() => ({ students: 0, teachers: 0, offerings: 0, announcements: 0 })),
        getAllTeachers().catch(() => [] as Teacher[]),
        getAllOfferings().catch(() => [] as ClassOffering[]),
        getAllSlots().catch(() => [] as ClassSlot[]),
        getAllEnrollments().catch(() => [] as Enrollment[]),
        getOverallAttendanceStats().catch(() => ({
          attendanceRate: 100,
          totalRecords: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          lowAttendanceStudents: [],
        })),
      ]);

      setCounts(c);
      setTeachers(t);
      setOfferings(o);
      setSlots(s);
      setEnrollments(e);
      setAttendanceStats(att);
      setLastUpdated(new Date());
      if (isManual) {
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      console.error('[AdminDashboardPage] Error loading dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ─── 4 Summary Cards (28px bold, 14px label, muted subtext, clickable) ───────
  const summaryCards = [
    {
      id: 'students',
      label: 'Total students',
      value: counts.students.toString(),
      subtext: 'Enrolled students',
      icon: Users,
      colorClass: 'text-blue-600 dark:text-blue-400',
      bgClass: 'bg-blue-500/10 dark:bg-blue-500/20',
      onClick: () => navigate('/admin/students'),
    },
    {
      id: 'attendance',
      label: 'Attendance rate',
      value: `${attendanceStats.attendanceRate}%`,
      subtext: `${attendanceStats.totalRecords} sessions tracked`,
      icon: Percent,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      onClick: () => navigate('/admin/attendance'),
    },
    {
      id: 'teachers',
      label: 'Teachers on staff',
      value: counts.teachers.toString(),
      subtext: 'Active faculty members',
      icon: GraduationCap,
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-500/10 dark:bg-amber-500/20',
      onClick: () => navigate('/admin/teachers'),
    },
    {
      id: 'announcements',
      label: 'Recent announcements',
      value: counts.announcements.toString(),
      subtext: 'Total published broadcasts',
      icon: Megaphone,
      colorClass: 'text-purple-600 dark:text-purple-400',
      bgClass: 'bg-purple-500/10 dark:bg-purple-500/20',
      onClick: () => navigate('/admin/announcements'),
    },
  ];

  // ─── Teacher Workload Calculation with Subject Normalization & Board Sorting ───
  const processedWorkload = useMemo(() => {
    const list = teachers.map((teacher) => {
      const teacherOfferings = offerings.filter((o) => o.teacher_id === teacher.id);
      const isUnassigned = teacherOfferings.length === 0;

      // Normalize subjects and deduplicate spelling variants (e.g. Islamiat / Islamiyat)
      const rawSubjectNames = teacherOfferings
        .map((o) => normalizeSubject(o.subject_name || o.subject))
        .filter(Boolean);

      // Check IELTS
      const hasIelts = teacherOfferings.some((o) => {
        const b = (o.board_id || o.board || o.class?.board_id || '').toLowerCase();
        const s = (o.subject_name || o.subject || '').toLowerCase();
        return b === 'ielts' || s.includes('ielts');
      });

      const uniqueSubjectsSet = new Set<string>();
      if (hasIelts) {
        uniqueSubjectsSet.add('IELTS Preparation');
      }
      rawSubjectNames.forEach((s) => {
        if (!s.toLowerCase().includes('ielts')) {
          uniqueSubjectsSet.add(s);
        }
      });
      const uniqueSubjects = Array.from(uniqueSubjectsSet);

      // Unique boards, sorted in canonical order: FBISE, Punjab, Sindh, then others
      const rawBoards = teacherOfferings
        .map((o) => {
          const b = (o.board_id || o.board || o.class?.board_id || '').toLowerCase();
          const s = (o.subject_name || o.subject || '').toLowerCase();
          const bName = o.class?.board?.name || (o as any).board_name;
          if (b === 'ielts' || s.includes('ielts')) return 'IELTS';
          if (b === 'punjab') return 'Punjab';
          if (b === 'sindh') return 'Sindh';
          if (b === 'kpk') return 'KPK';
          if (b === 'olevel') return 'O Levels';
          if (b === 'alevel') return 'A Levels';
          if (b === 'fbise') return 'FBISE';
          if (bName) return bName;
          return b ? b.toUpperCase() : null;
        })
        .filter(Boolean) as string[];

      const sortedBoards = sortBoards(Array.from(new Set(rawBoards)));

      // Unique grades, sorted numerically
      const rawGrades = teacherOfferings
        .map((o) => {
          const b = (o.board_id || o.board || o.class?.board_id || '').toLowerCase();
          const s = (o.subject_name || o.subject || '').toLowerCase();
          if (b === 'ielts' || s.includes('ielts')) return 'IELTS';
          return o.grade ? String(o.grade) : null;
        })
        .filter(Boolean) as string[];

      const sortedGrades = sortGrades(Array.from(new Set(rawGrades)));

      // Enrolled students count
      const offeringIds = teacherOfferings.map((o) => o.id);
      const enrolledStudentIds = new Set(
        enrollments.filter((e) => offeringIds.includes(e.offering_id)).map((e) => e.student_id)
      );
      const studentsCount = enrolledStudentIds.size;

      // Classes per week
      const classesPerWeek = slots.filter(
        (s) => s.offering_id !== null && offeringIds.includes(s.offering_id) && !s.is_cancelled
      ).length;

      // Initials for avatar
      const initials = teacher.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      return {
        id: teacher.id,
        name: teacher.full_name,
        avatar: initials,
        avatar_url: teacher.avatar_url,
        isUnassigned,
        subjects: uniqueSubjects,
        boards: sortedBoards,
        grades: sortedGrades,
        studentsCount,
        classesPerWeek,
      };
    });

    // Determine max weekly classes to scale progress bars comparatively
    const maxWeeklyClasses = Math.max(...list.map((t) => t.classesPerWeek), 1);

    // Filter by search query
    const filtered = list.filter((t) => {
      if (!workloadSearch.trim()) return true;
      const q = workloadSearch.toLowerCase();
      const nameMatch = t.name.toLowerCase().includes(q);
      const subjMatch = t.subjects.some((s) => s.toLowerCase().includes(q));
      const boardMatch = t.boards.some((b) => b.toLowerCase().includes(q));
      return nameMatch || subjMatch || boardMatch;
    });

    // Sort: unassigned teachers always sorted to the bottom!
    filtered.sort((a, b) => {
      if (a.isUnassigned && !b.isUnassigned) return 1;
      if (!a.isUnassigned && b.isUnassigned) return -1;

      let comparison = 0;
      if (workloadSortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (workloadSortBy === 'students') {
        comparison = a.studentsCount - b.studentsCount;
      } else if (workloadSortBy === 'classes') {
        comparison = a.classesPerWeek - b.classesPerWeek;
      }
      return workloadSortAsc ? comparison : -comparison;
    });

    return { list: filtered, maxWeeklyClasses };
  }, [teachers, offerings, slots, enrollments, workloadSearch, workloadSortBy, workloadSortAsc]);

  // ─── Low Attendance Watchlist Sorted from Lowest to Highest % ────────────────
  const sortedLowAttendance = useMemo(() => {
    return [...attendanceStats.lowAttendanceStudents].sort((a, b) => a.rate - b.rate);
  }, [attendanceStats.lowAttendanceStudents]);

  // ─── Needs Attention Checklist ───────────────────────────────────────────────
  const hasUrgentAttention = staleSessionCount > 0 || sortedLowAttendance.length > 0;

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* ── a) Page Header: Title, PKT Date, Last Updated & Refresh ── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200/80 dark:border-neutral-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Dashboard
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {formatPKTDate(new Date(), 'full')} (PKT, UTC+5)
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Last updated: <span className="font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">{formatPKTTime(lastUpdated, true)}</span>
            </span>
            <button
              type="button"
              onClick={() => fetchDashboardData(true)}
              disabled={loading || refreshing}
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              title="Refresh dashboard data"
              aria-label="Refresh dashboard data"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* ── Live Alerts & Notifications Permission ── */}
        <NotificationPermissionBanner role="admin" />

        {/* ── b) Summary Row: 4 Equal Stat Cards ── */}
        <section aria-label="Summary statistics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              [1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 h-[124px] flex flex-col justify-between animate-pulse"
                >
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
                  <div className="space-y-1.5">
                    <div className="h-7 bg-neutral-100 dark:bg-neutral-800 rounded w-20" />
                    <div className="h-3.5 bg-neutral-100 dark:bg-neutral-800 rounded w-28" />
                  </div>
                </div>
              ))
            ) : (
              summaryCards.map((card) => {
                const IconComponent = card.icon;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={card.onClick}
                    className="text-left bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 rounded-2xl p-4 flex flex-col justify-between h-[124px] transition-all hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 group"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${card.bgClass} group-hover:scale-105 transition-transform`}
                      >
                        <IconComponent size={16} className={card.colorClass} />
                      </div>
                    </div>
                    <div>
                      <div className="text-[28px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 leading-none tabular-nums">
                        {card.value}
                      </div>
                      <div className="text-sm font-medium text-neutral-600 dark:text-neutral-300 mt-1.5">
                        {card.label}
                      </div>
                      <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                        {card.subtext}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* ── c) "Needs Attention" Strip (Only shows when there is something urgent) ── */}
        {hasUrgentAttention && (
          <section
            aria-label="Needs attention"
            className="bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 dark:border-amber-500/30 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
              <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Needs attention:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {staleSessionCount > 0 && (
                <button
                  type="button"
                  onClick={() => scrollToSection('teacher-attendance-section')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <span>{staleSessionCount} {staleSessionCount === 1 ? 'session needs review' : 'sessions need review'}</span>
                  <ExternalLink size={11} />
                </button>
              )}

              {sortedLowAttendance.length > 0 && (
                <button
                  type="button"
                  onClick={() => scrollToSection('low-attendance-watchlist')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <span>{sortedLowAttendance.length} {sortedLowAttendance.length === 1 ? 'student' : 'students'} below 75% attendance</span>
                  <ExternalLink size={11} />
                </button>
              )}
            </div>
          </section>
        )}

        {/* ── d) Teacher Attendance (Today PKT) ── */}
        <TeacherAttendanceOverviewCard
          onStaleCountChange={setStaleSessionCount}
          refreshTrigger={refreshTrigger}
        />

        {/* ── e & f) Teacher Workload & Low Attendance Watchlist (Side-by-side on wide screens) ── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* ── e) Teacher Workload (8 cols on wide screens) ── */}
          <section
            aria-labelledby="teacher-workload-title"
            className="xl:col-span-8 bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2
                  id="teacher-workload-title"
                  className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight"
                >
                  Teacher workload
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Assigned subjects, boards, grades, student reach, and weekly teaching schedule
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/teachers')}
                  className="btn btn-secondary text-xs font-semibold px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                >
                  Manage teachers
                </button>
              </div>
            </div>

            {/* Controls: Search & Sort */}
            <div className="p-3.5 bg-neutral-50/50 dark:bg-neutral-900/30 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2.5">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search size={13} className="absolute left-2.5 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  value={workloadSearch}
                  onChange={(e) => setWorkloadSearch(e.target.value)}
                  placeholder="Search teacher, subject or board..."
                  className="w-full text-xs pl-8 pr-2.5 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <span>Sort:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (workloadSortBy === 'classes') setWorkloadSortAsc(!workloadSortAsc);
                    else {
                      setWorkloadSortBy('classes');
                      setWorkloadSortAsc(false);
                    }
                  }}
                  className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                    workloadSortBy === 'classes'
                      ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>Classes/wk</span>
                  {workloadSortBy === 'classes' && <ArrowUpDown size={11} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (workloadSortBy === 'students') setWorkloadSortAsc(!workloadSortAsc);
                    else {
                      setWorkloadSortBy('students');
                      setWorkloadSortAsc(false);
                    }
                  }}
                  className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                    workloadSortBy === 'students'
                      ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>Students</span>
                  {workloadSortBy === 'students' && <ArrowUpDown size={11} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (workloadSortBy === 'name') setWorkloadSortAsc(!workloadSortAsc);
                    else {
                      setWorkloadSortBy('name');
                      setWorkloadSortAsc(true);
                    }
                  }}
                  className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                    workloadSortBy === 'name'
                      ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>Name</span>
                  {workloadSortBy === 'name' && <ArrowUpDown size={11} />}
                </button>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold text-[11px] border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="py-3 px-4">Teacher</th>
                    <th className="py-3 px-4">Subjects</th>
                    <th className="py-3 px-4">Boards</th>
                    <th className="py-3 px-4">Grades</th>
                    <th className="py-3 px-4">Students</th>
                    <th className="py-3 px-4">Classes/wk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {processedWorkload.list.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-neutral-400">
                        No teachers found.
                      </td>
                    </tr>
                  ) : (
                    (workloadShowAll ? processedWorkload.list : processedWorkload.list.slice(0, 8)).map(
                      (teacher) => {
                        const progressPercent = Math.min(
                          Math.round((teacher.classesPerWeek / processedWorkload.maxWeeklyClasses) * 100),
                          100
                        );

                        return (
                          <tr
                            key={teacher.id}
                            className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                          >
                            {/* Teacher */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                {teacher.avatar_url ? (
                                  <img
                                    src={teacher.avatar_url}
                                    alt={teacher.name}
                                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-neutral-200 dark:border-neutral-700"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center shrink-0">
                                    {teacher.avatar}
                                  </div>
                                )}
                                <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                  {teacher.name}
                                </span>
                              </div>
                            </td>

                            {/* Subjects (max 2 shown, +N tooltip) or "Not assigned yet" */}
                            {teacher.isUnassigned ? (
                              <td colSpan={3} className="py-3 px-4 text-neutral-400 dark:text-neutral-500 italic">
                                Not assigned yet
                              </td>
                            ) : (
                              <>
                                <td className="py-3 px-4 text-neutral-800 dark:text-neutral-200">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {teacher.subjects.slice(0, 2).map((s, idx) => (
                                      <span key={idx} className="whitespace-nowrap">
                                        {s}
                                        {idx < Math.min(teacher.subjects.length, 2) - 1 ? ',' : ''}
                                      </span>
                                    ))}
                                    {teacher.subjects.length > 2 && (
                                      <span
                                        className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 cursor-help"
                                        title={teacher.subjects.join(', ')}
                                      >
                                        +{teacher.subjects.length - 2}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Boards: small neutral chips in FBISE, Punjab, Sindh order */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {teacher.boards.map((b, idx) => (
                                      <span
                                        key={idx}
                                        className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60"
                                      >
                                        {b}
                                      </span>
                                    ))}
                                  </div>
                                </td>

                                {/* Grades: "9, 10, 11" sorted */}
                                <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300 tabular-nums">
                                  {teacher.grades.join(', ') || '—'}
                                </td>
                              </>
                            )}

                            {/* Students */}
                            <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                              {teacher.studentsCount}
                            </td>

                            {/* Classes/week with scaled progress bar */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 min-w-[100px]">
                                <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                                <span className="font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums text-xs min-w-[20px] text-right">
                                  {teacher.classesPerWeek}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
              {(workloadShowAll ? processedWorkload.list : processedWorkload.list.slice(0, 8)).map(
                (teacher) => {
                  const progressPercent = Math.min(
                    Math.round((teacher.classesPerWeek / processedWorkload.maxWeeklyClasses) * 100),
                    100
                  );

                  return (
                    <div key={teacher.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center shrink-0">
                            {teacher.avatar}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                              {teacher.name}
                            </div>
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                              {teacher.isUnassigned ? 'Not assigned yet' : teacher.subjects.join(', ')}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                            {teacher.classesPerWeek} classes/wk
                          </span>
                        </div>
                      </div>

                      {!teacher.isUnassigned && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-neutral-600 dark:text-neutral-300">
                          <div className="flex items-center gap-1">
                            {teacher.boards.map((b, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                          <span className="text-neutral-400">•</span>
                          <span className="tabular-nums">Grades: {teacher.grades.join(', ') || '—'}</span>
                          <span className="text-neutral-400">•</span>
                          <span className="tabular-nums">{teacher.studentsCount} students</span>
                        </div>
                      )}

                      <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* Pagination / "View all" toggle footer */}
            {processedWorkload.list.length > 8 && (
              <div className="p-3 bg-neutral-50/60 dark:bg-neutral-900/40 border-t border-neutral-100 dark:border-neutral-800 text-center">
                <button
                  type="button"
                  onClick={() => setWorkloadShowAll(!workloadShowAll)}
                  className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  {workloadShowAll
                    ? 'Show fewer teachers (top 8)'
                    : `View all (${processedWorkload.list.length} teachers)`}
                </button>
              </div>
            )}
          </section>

          {/* ── f) Low Attendance Watchlist (4 cols on wide screens) ── */}
          <section
            id="low-attendance-watchlist"
            aria-labelledby="low-attendance-title"
            className="xl:col-span-4 bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2
                  id="low-attendance-title"
                  className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight"
                >
                  Low attendance
                </h2>
                {sortedLowAttendance.length > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                    {sortedLowAttendance.length} at risk
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate('/admin/attendance')}
                className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Manage attendance
              </button>
            </div>

            <div className="p-4 bg-neutral-50/50 dark:bg-neutral-900/30 border-b border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
              Students below 75% attendance threshold (min. 10 class sessions)
            </div>

            {/* List */}
            <div className="p-4">
              {sortedLowAttendance.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500 dark:text-neutral-400 space-y-2">
                  <ShieldCheck size={28} className="mx-auto text-emerald-600 dark:text-emerald-400" />
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                    No students currently at risk.
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                    All students with 10+ sessions meet or exceed the 75% attendance requirement.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedLowAttendance.map((item, idx) => {
                    const initials = item.student.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    const isVeryLow = item.rate < 50;

                    return (
                      <div
                        key={idx}
                        onClick={() => navigate('/admin/attendance')}
                        className="p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                                {item.student.full_name}
                              </div>
                              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                                {item.subject} • {item.attended} of {item.total} classes attended
                              </div>
                            </div>
                          </div>

                          {/* Percentage Pill */}
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md tabular-nums shrink-0 border ${
                              isVeryLow
                                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20'
                            }`}
                          >
                            {item.rate}%
                          </span>
                        </div>

                        {/* Thin Progress Bar */}
                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isVeryLow ? 'bg-rose-500' : 'bg-amber-500'}`}
                            style={{ width: `${item.rate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminDashboardPage;
