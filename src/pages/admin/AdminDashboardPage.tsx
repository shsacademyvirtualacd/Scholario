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
      colorClass: 'text-[#8A6A00] dark:text-[#F2C230]',
      bgClass: 'bg-[rgba(242,194,48,0.16)]',
      onClick: () => navigate('/admin/students'),
    },
    {
      id: 'attendance',
      label: 'Attendance rate',
      value: `${attendanceStats.attendanceRate}%`,
      subtext: `${attendanceStats.totalRecords} sessions tracked`,
      icon: Percent,
      colorClass: 'text-[#8A6A00] dark:text-[#F2C230]',
      bgClass: 'bg-[rgba(242,194,48,0.16)]',
      onClick: () => navigate('/admin/attendance'),
    },
    {
      id: 'teachers',
      label: 'Teachers on staff',
      value: counts.teachers.toString(),
      subtext: 'Active faculty members',
      icon: GraduationCap,
      colorClass: 'text-[#8A6A00] dark:text-[#F2C230]',
      bgClass: 'bg-[rgba(242,194,48,0.16)]',
      onClick: () => navigate('/admin/teachers'),
    },
    {
      id: 'announcements',
      label: 'Recent announcements',
      value: counts.announcements.toString(),
      subtext: 'Total published broadcasts',
      icon: Megaphone,
      colorClass: 'text-[#8A6A00] dark:text-[#F2C230]',
      bgClass: 'bg-[rgba(242,194,48,0.16)]',
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
      <div className="space-y-4 sm:space-y-6">
        {/* ── a) Page Header: Title, PKT Date, Last Updated & Refresh ── */}
        <header className="pb-3 border-b border-[var(--admin-card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-[var(--admin-text)] leading-tight">
              Dashboard
            </h1>
            <p className="text-[13px] text-[var(--admin-muted)] mt-0.5 font-medium">
              {formatPKTDate(new Date(), 'full')} · PKT (UTC+5)
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <span className="text-[13px] text-[var(--admin-muted)] font-medium">
              Last updated: <span className="font-bold text-[var(--admin-text)] tabular-nums">{formatPKTTime(lastUpdated, true)}</span>
            </span>
            <button
              type="button"
              onClick={() => fetchDashboardData(true)}
              disabled={loading || refreshing}
              className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[var(--admin-text)] transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer shrink-0"
              title="Refresh dashboard data"
              aria-label="Refresh dashboard data"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* ── Live Alerts & Notifications Permission ── */}
        <NotificationPermissionBanner role="admin" />

        {/* ── b) Summary Row: 4 Equal Stat Cards ── */}
        <section aria-label="Summary statistics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
            {loading ? (
              [1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="admin-card p-4 min-h-[112px] flex flex-col justify-between animate-pulse"
                >
                  <div className="w-8 h-8 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                  <div className="space-y-1.5 mt-3">
                    <div className="h-7 bg-neutral-200 dark:bg-neutral-800 rounded w-20" />
                    <div className="h-3.5 bg-neutral-200 dark:bg-neutral-800 rounded w-28" />
                  </div>
                </div>
              ))
            ) : (
              summaryCards.map((card, idx) => {
                const IconComponent = card.icon;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={card.onClick}
                    className={`admin-card p-4 flex flex-col justify-between min-h-[112px] h-auto transition-all hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 group text-left cursor-pointer overflow-hidden admin-stagger-${idx + 1}`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[rgba(242,194,48,0.16)] text-[#8A6A00] dark:text-[#F2C230] group-hover:scale-105 transition-transform"
                      >
                        <IconComponent size={16} />
                      </div>
                    </div>
                    <div className="min-w-0 w-full mt-3">
                      <div className="text-[28px] font-extrabold tracking-tight text-[var(--admin-text)] leading-none tabular-nums">
                        {card.value}
                      </div>

                      {/* 4px bar under Attendance Rate value */}
                      {card.id === 'attendance' && (
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="bg-[#F2C230] h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(attendanceStats.attendanceRate, 100)}%` }}
                          />
                        </div>
                      )}

                      <div className="text-sm font-semibold text-[var(--admin-text)] mt-1.5 leading-snug line-clamp-2 break-words" style={{ overflowWrap: 'anywhere' }}>
                        {card.label}
                      </div>
                      <div className="text-xs text-[var(--admin-muted)] mt-0.5 leading-tight line-clamp-2 break-words" style={{ overflowWrap: 'anywhere' }}>
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
            className="rounded-[20px] p-3 status-pill-warning border border-amber-300/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs"
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Needs attention:</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {staleSessionCount > 0 && (
                <button
                  type="button"
                  onClick={() => scrollToSection('teacher-attendance-section')}
                  className="h-12 sm:h-9 px-4 rounded-xl font-bold text-xs status-pill-warning border border-amber-400/40 hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-[0.98]"
                >
                  <span>{staleSessionCount} {staleSessionCount === 1 ? 'session needs review' : 'sessions need review'} ↗</span>
                </button>
              )}

              {sortedLowAttendance.length > 0 && (
                <button
                  type="button"
                  onClick={() => scrollToSection('low-attendance-watchlist')}
                  className="h-12 sm:h-9 px-4 rounded-xl font-bold text-xs status-pill-danger hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-[0.98]"
                >
                  <span>{sortedLowAttendance.length} {sortedLowAttendance.length === 1 ? 'student' : 'students'} below 75% attendance ↗</span>
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
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 items-start">
          {/* ── e) Teacher Workload (8 cols on wide screens) ── */}
          <section
            aria-labelledby="teacher-workload-title"
            className="admin-card xl:col-span-8 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--admin-card-border)] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2
                  id="teacher-workload-title"
                  className="text-lg font-bold text-[var(--admin-text)] tracking-tight"
                >
                  Teacher workload
                </h2>
                <p className="text-[13px] text-[var(--admin-muted)] line-clamp-2 mt-0.5">
                  Assigned subjects, boards, grades, student reach, and weekly teaching schedule
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/teachers')}
                  className="h-11 min-h-[44px] px-4 rounded-full border border-[var(--admin-card-border)] text-xs font-bold text-[var(--admin-text)] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors inline-flex items-center cursor-pointer"
                >
                  Manage teachers
                </button>
              </div>
            </div>

            {/* Controls: Search & Sort */}
            <div className="p-3.5 bg-neutral-50/50 dark:bg-neutral-900/30 border-b border-[var(--admin-card-border)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* 48px Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3.5 top-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={workloadSearch}
                  onChange={(e) => setWorkloadSearch(e.target.value)}
                  placeholder="Search teacher, subject or board..."
                  className="w-full h-12 text-xs pl-10 pr-3 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-[var(--admin-text)] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* Single-row scrollable 40px chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5 shrink-0">
                <span className="text-xs text-[var(--admin-muted)] font-medium mr-1 shrink-0">Sort:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (workloadSortBy === 'classes') setWorkloadSortAsc(!workloadSortAsc);
                    else {
                      setWorkloadSortBy('classes');
                      setWorkloadSortAsc(false);
                    }
                  }}
                  className={`h-10 px-3.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-colors flex items-center gap-1.5 ${
                    workloadSortBy === 'classes'
                      ? 'bg-[#111111] dark:bg-[#F2C230] text-white dark:text-[#111111] font-bold shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-[var(--admin-muted)] hover:text-[var(--admin-text)]'
                  }`}
                >
                  <span>Classes/wk</span>
                  {workloadSortBy === 'classes' && <ArrowUpDown size={12} />}
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
                  className={`h-10 px-3.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-colors flex items-center gap-1.5 ${
                    workloadSortBy === 'students'
                      ? 'bg-[#111111] dark:bg-[#F2C230] text-white dark:text-[#111111] font-bold shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-[var(--admin-muted)] hover:text-[var(--admin-text)]'
                  }`}
                >
                  <span>Students</span>
                  {workloadSortBy === 'students' && <ArrowUpDown size={12} />}
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
                  className={`h-10 px-3.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-colors flex items-center gap-1.5 ${
                    workloadSortBy === 'name'
                      ? 'bg-[#111111] dark:bg-[#F2C230] text-white dark:text-[#111111] font-bold shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-[var(--admin-muted)] hover:text-[var(--admin-text)]'
                  }`}
                >
                  <span>Name</span>
                  {workloadSortBy === 'name' && <ArrowUpDown size={12} />}
                </button>
              </div>
            </div>

            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-100/80 dark:bg-neutral-800/80 text-[var(--admin-muted)] font-semibold text-[11px] border-b border-[var(--admin-card-border)]">
                  <tr>
                    <th className="py-3 px-4">Teacher</th>
                    <th className="py-3 px-4">Subjects</th>
                    <th className="py-3 px-4">Boards</th>
                    <th className="py-3 px-4">Grades</th>
                    <th className="py-3 px-4">Students</th>
                    <th className="py-3 px-4">Classes/wk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--admin-card-border)]">
                  {processedWorkload.list.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-[var(--admin-muted)]">
                        No teachers found.
                      </td>
                    </tr>
                  ) : (
                    (workloadShowAll ? processedWorkload.list : processedWorkload.list.slice(0, 5)).map(
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
                                    className="w-8 h-8 rounded-xl object-cover shrink-0 border border-[var(--admin-card-border)]"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-xl bg-[rgba(242,194,48,0.16)] text-[#8A6A00] dark:text-[#F2C230] font-bold text-xs flex items-center justify-center shrink-0">
                                    {teacher.avatar}
                                  </div>
                                )}
                                <span className="font-semibold text-[var(--admin-text)] truncate">
                                  {teacher.name}
                                </span>
                              </div>
                            </td>

                            {/* Subjects */}
                            {teacher.isUnassigned ? (
                              <td colSpan={3} className="py-3 px-4 text-[var(--admin-muted)] italic">
                                Not assigned yet
                              </td>
                            ) : (
                              <>
                                <td className="py-3 px-4 text-[var(--admin-text)]">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {teacher.subjects.slice(0, 2).map((s, idx) => (
                                      <span key={idx} className="whitespace-nowrap">
                                        {s}
                                        {idx < Math.min(teacher.subjects.length, 2) - 1 ? ',' : ''}
                                      </span>
                                    ))}
                                    {teacher.subjects.length > 2 && (
                                      <span
                                        className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[var(--admin-muted)] cursor-help"
                                        title={teacher.subjects.join(', ')}
                                      >
                                        +{teacher.subjects.length - 2}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Boards */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {teacher.boards.map((b, idx) => (
                                      <span
                                        key={idx}
                                        className="text-[10px] font-medium px-1.5 py-0.5 rounded status-pill-neutral"
                                      >
                                        {b}
                                      </span>
                                    ))}
                                  </div>
                                </td>

                                {/* Grades */}
                                <td className="py-3 px-4 text-[var(--admin-muted)] tabular-nums font-medium">
                                  {teacher.grades.join(', ') || '—'}
                                </td>
                              </>
                            )}

                            {/* Students */}
                            <td className="py-3 px-4 font-bold text-[var(--admin-text)] tabular-nums">
                              {teacher.studentsCount}
                            </td>

                            {/* Classes/week with gold progress bar */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 min-w-[100px]">
                                <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-[#F2C230] h-full rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                                <span className="font-bold text-[var(--admin-text)] tabular-nums text-xs min-w-[20px] text-right">
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

            {/* Mobile Stacked Cards (< 768px) */}
            <div className="md:hidden divide-y divide-[var(--admin-card-border)] p-3 sm:p-4 space-y-3">
              {(workloadShowAll ? processedWorkload.list : processedWorkload.list.slice(0, 5)).map(
                (teacher) => {
                  const progressPercent = Math.min(
                    Math.round((teacher.classesPerWeek / processedWorkload.maxWeeklyClasses) * 100),
                    100
                  );

                  return (
                    <div key={teacher.id} className="p-3.5 bg-white/60 dark:bg-neutral-900/40 border border-[var(--admin-card-border)] rounded-2xl space-y-2.5">
                      {/* Row 1: 40px avatar, name, subjects, classes/wk right aligned */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {teacher.avatar_url ? (
                            <img
                              src={teacher.avatar_url}
                              alt={teacher.name}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[var(--admin-card-border)]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-[rgba(242,194,48,0.16)] text-[#8A6A00] dark:text-[#F2C230] font-bold text-xs flex items-center justify-center shrink-0">
                              {teacher.avatar}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-base text-[var(--admin-text)] truncate leading-snug">
                              {teacher.name}
                            </div>
                            <div className="text-[13px] text-[var(--admin-muted)] line-clamp-2 mt-0.5 leading-snug">
                              {teacher.isUnassigned ? 'Not assigned yet' : teacher.subjects.join(', ')}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xl font-extrabold text-[var(--admin-text)] tabular-nums leading-none block">
                            {teacher.classesPerWeek}
                          </span>
                          <span className="text-xs text-[var(--admin-muted)] font-medium block mt-0.5">
                            classes/wk
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Board chips */}
                      {!teacher.isUnassigned && teacher.boards.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {teacher.boards.map((b, i) => (
                            <span
                              key={i}
                              className="text-xs font-semibold px-2 py-0.5 rounded status-pill-neutral"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Row 3: Meta line */}
                      {!teacher.isUnassigned && (
                        <div className="text-xs text-[var(--admin-muted)] font-medium flex items-center gap-1.5 flex-wrap">
                          <span className="tabular-nums">Grades {teacher.grades.join(', ') || '—'}</span>
                          <span>·</span>
                          <span className="tabular-nums">{teacher.studentsCount} students</span>
                        </div>
                      )}

                      {/* Row 4: 6px gold progress bar */}
                      <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-[#F2C230] h-full rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* 48px Full-width Pagination / "View all" toggle footer */}
            {processedWorkload.list.length > 5 && (
              <div className="p-3 bg-neutral-50/60 dark:bg-neutral-900/40 border-t border-[var(--admin-card-border)] text-center">
                <button
                  type="button"
                  onClick={() => setWorkloadShowAll(!workloadShowAll)}
                  className="w-full h-12 flex items-center justify-center font-bold text-xs rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[var(--admin-text)] transition-colors cursor-pointer"
                >
                  {workloadShowAll
                    ? 'Show fewer teachers (top 5)'
                    : `View all (${processedWorkload.list.length} teachers)`}
                </button>
              </div>
            )}
          </section>

          {/* ── f) Low Attendance Watchlist (4 cols on wide screens) ── */}
          <section
            id="low-attendance-watchlist"
            aria-labelledby="low-attendance-title"
            className="admin-card xl:col-span-4 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--admin-card-border)]">
              <div className="flex items-center justify-between gap-2">
                <h2
                  id="low-attendance-title"
                  className="text-lg font-bold text-[var(--admin-text)] tracking-tight"
                >
                  Low attendance
                </h2>
                {sortedLowAttendance.length > 0 && (
                  <span className="status-pill-danger text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {sortedLowAttendance.length} at risk
                  </span>
                )}
              </div>

              <div className="mt-1">
                <button
                  type="button"
                  onClick={() => navigate('/admin/attendance')}
                  className="h-11 inline-flex items-center text-xs font-semibold text-[var(--admin-muted)] hover:text-[var(--admin-text)] transition-colors cursor-pointer"
                >
                  Manage attendance ›
                </button>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 text-[13px] text-[var(--admin-muted)] border-b border-[var(--admin-card-border)]">
              Students below 75% attendance threshold (min. 10 class sessions)
            </div>

            {/* List */}
            <div className="p-3.5 sm:p-4">
              {sortedLowAttendance.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--admin-muted)] space-y-2">
                  <ShieldCheck size={28} className="mx-auto text-emerald-600 dark:text-emerald-400" />
                  <p className="font-semibold text-[var(--admin-text)]">
                    No students currently at risk.
                  </p>
                  <p className="text-[11px] text-[var(--admin-muted)] max-w-xs mx-auto">
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

                    return (
                      <div
                        key={idx}
                        onClick={() => navigate('/admin/attendance')}
                        className="p-3 rounded-xl border border-[var(--admin-card-border)] bg-white/60 dark:bg-neutral-900/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer transition-colors space-y-2 min-h-[88px]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-[var(--admin-card-border)] text-[var(--admin-text)] font-bold text-xs flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-base text-[var(--admin-text)] truncate">
                                {item.student.full_name}
                              </div>
                              <div className="text-[13px] text-[var(--admin-muted)] truncate mt-0.5">
                                {item.subject} • {item.attended} of {item.total} classes attended
                              </div>
                            </div>
                          </div>

                          {/* Percentage Pill */}
                          <span
                            className="status-pill-danger text-xs font-bold px-2 py-0.5 rounded-md tabular-nums shrink-0"
                          >
                            {item.rate}%
                          </span>
                        </div>

                        {/* 6px Red Progress Bar */}
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="bg-rose-500 h-full rounded-full transition-all duration-300"
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
