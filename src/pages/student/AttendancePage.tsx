import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Flame,
  Filter,
  BookOpen,
  Info,
  Calendar,
  AlertCircle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import { StudentPageHeader } from '../../components/student/shared/StudentPageHeader';
import { StudentStatusBadge } from '../../components/student/shared/StudentStatusBadge';
import { StudentBottomSheet } from '../../components/student/shared/StudentBottomSheet';
import { StudentEmptyState } from '../../components/student/shared/StudentEmptyState';
import { StudentListSkeleton } from '../../components/student/shared/StudentSkeleton';
import AttendanceCalendar from '../../components/student/AttendanceCalendar';
import { useAuth } from '../../features/auth/AuthContext';
import { getAttendanceForStudent, computeAttendanceStreak } from '../../lib/db';
import { pageCache } from '../../lib/pageCache';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import type { Attendance } from '../../types';
import { formatTime12h } from '../../lib/scheduleUtils';
import {
  formatProperName,
  formatStandardDate,
  formatPKTTime,
} from '../../utils/studentFormatting';

export const AttendancePage: React.FC = () => {
  const { profile } = useAuth();
  const studentId = profile?.id || '';

  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [displayCount, setDisplayCount] = useState<number>(10);

  // Day Bottom Sheet State
  const [selectedDayModal, setSelectedDayModal] = useState<{
    dateStr: string;
    sessions: Attendance[];
  } | null>(null);

  // Policy Modal
  const [policyOpen, setPolicyOpen] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    let mounted = true;

    const cached = pageCache.get<Attendance[]>('student_attendance', studentId);
    if (cached && mounted) {
      setRecords(cached);
      setLoading(false);
    }

    getAttendanceForStudent(studentId)
      .then((attData) => {
        if (!mounted) return;
        setRecords(attData || []);
        pageCache.set('student_attendance', attData || [], studentId);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [studentId]);

  useRealtimeTable({
    table: 'attendance',
    debounceMs: 500,
    onAny: async () => {
      if (studentId) {
        const att = await getAttendanceForStudent(studentId);
        setRecords(att || []);
      }
    },
  });

  const streakMetrics = computeAttendanceStreak(records);

  const totalClasses = records.length;
  const presentCount = records.filter(
    (r) => r.status === 'present' || r.status === 'late'
  ).length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  // Distinct subjects with counts
  const subjectListWithCounts = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => {
      const subj =
        r.subject ||
        (r.slot?.offering as any)?.subject_name ||
        (r.slot?.offering as any)?.subject?.name ||
        'General';
      map.set(subj, (map.get(subj) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [records]);

  // Per-subject attendance rate breakdown
  const subjectRates = useMemo(() => {
    const map = new Map<string, { total: number; attended: number }>();
    records.forEach((r) => {
      const subj =
        r.subject ||
        (r.slot?.offering as any)?.subject_name ||
        (r.slot?.offering as any)?.subject?.name ||
        'General';
      const current = map.get(subj) || { total: 0, attended: 0 };
      current.total += 1;
      if (r.status === 'present' || r.status === 'late') {
        current.attended += 1;
      }
      map.set(subj, current);
    });

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      total: data.total,
      attended: data.attended,
      rate: Math.round((data.attended / data.total) * 100),
    }));
  }, [records]);

  // Filtered session records
  const filteredRecords = useMemo(() => {
    const list = records.filter((r) => {
      if (selectedSubject === 'all') return true;
      const subj =
        r.subject ||
        (r.slot?.offering as any)?.subject_name ||
        (r.slot?.offering as any)?.subject?.name ||
        'General';
      return subj === selectedSubject;
    });

    return list.sort(
      (a, b) => (b.session_date || '').localeCompare(a.session_date || '')
    );
  }, [records, selectedSubject]);

  const displayedSessions = filteredRecords.slice(0, displayCount);

  const handleDayClick = (dateStr: string, daySessions: Attendance[]) => {
    setSelectedDayModal({
      dateStr,
      sessions: daySessions,
    });
  };

  return (
    <StudentShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <StudentPageHeader
          title="My Attendance"
          description="Monitor your presence record, attendance percentage, presence calendar, and class session logs."
        />

        {/* ── Top Summary & Metric Tiles ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 items-stretch">
          {/* Main Attendance Progress Card */}
          <div className="md:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Attendance Progress
              </span>
              {/* Streak Chip */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300/40">
                <Flame size={13} className="text-amber-500" />
                <span>{streakMetrics.currentStreak}d streak</span>
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-3xl font-black text-neutral-900 dark:text-white">
                  {totalClasses === 0 ? '—' : `${attendanceRate}%`}
                </span>
                <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                  ({presentCount} of {totalClasses} classes attended)
                </span>
              </div>

              {/* Status indicator with icon & text */}
              <div className="mt-2 flex items-center gap-1.5 text-xs font-bold">
                {totalClasses === 0 ? (
                  <span className="text-neutral-500 flex items-center gap-1">
                    <Info size={14} /> No attendance recorded yet
                  </span>
                ) : attendanceRate >= 75 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Meets 75% target goal
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle size={14} /> Below 75% goal (Action recommended)
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  totalClasses === 0
                    ? 'bg-neutral-300 dark:bg-neutral-700'
                    : attendanceRate >= 75
                    ? 'bg-emerald-500'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${totalClasses === 0 ? 0 : Math.min(attendanceRate, 100)}%` }}
              />
            </div>
          </div>

          {/* Three Small Metric Tiles: Present, Late, Absent */}
          <div className="md:col-span-2 grid grid-cols-3 gap-3">
            {/* Present */}
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                <CheckCircle2 size={14} className={presentCount > 0 ? 'text-emerald-500' : 'text-neutral-400'} />
                <span>Present</span>
              </div>
              <div className="mt-2">
                <span className={`text-2xl font-black ${presentCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                  {loading ? '—' : presentCount}
                </span>
                <p className="text-[10px] text-neutral-400 mt-0.5">sessions</p>
              </div>
            </div>

            {/* Late */}
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                <Clock size={14} className={lateCount > 0 ? 'text-amber-500' : 'text-neutral-400'} />
                <span>Late</span>
              </div>
              <div className="mt-2">
                <span className={`text-2xl font-black ${lateCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                  {loading ? '—' : lateCount}
                </span>
                <p className="text-[10px] text-neutral-400 mt-0.5">sessions</p>
              </div>
            </div>

            {/* Absent */}
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                <XCircle size={14} className={absentCount > 0 ? 'text-rose-500' : 'text-neutral-400'} />
                <span>Absent</span>
              </div>
              <div className="mt-2">
                <span className={`text-2xl font-black ${absentCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                  {loading ? '—' : absentCount}
                </span>
                <p className="text-[10px] text-neutral-400 mt-0.5">sessions</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-Column Layout (Desktop/Tablet: Calendar & Policy on Left, Session Log on Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 Cols): Calendar + Short Policy Note + Per-Subject Breakdown */}
          <div className="lg:col-span-5 space-y-4">
            {/* Calendar */}
            <AttendanceCalendar
              attendanceRecords={records}
              onSelectDay={handleDayClick}
            />

            {/* Compact Policy Note */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Info size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate">
                  Tap <strong>"Join Now"</strong> to enter class and verify attendance.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPolicyOpen(true)}
                className="text-amber-700 dark:text-amber-400 font-bold underline whitespace-nowrap hover:text-amber-900 cursor-pointer text-xs"
              >
                Read full policy
              </button>
            </div>

            {/* Per-Subject Attendance Breakdown Bars */}
            {subjectRates.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Subject Attendance
                </h4>
                <div className="space-y-2.5">
                  {subjectRates.map((s) => (
                    <div key={s.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300 truncate">
                          {s.name}
                        </span>
                        <span className="font-bold text-neutral-900 dark:text-white ml-2">
                          {s.rate}% ({s.attended}/{s.total})
                        </span>
                      </div>
                      <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            s.rate >= 75 ? 'bg-emerald-500' : 'bg-amber-400'
                          }`}
                          style={{ width: `${Math.min(s.rate, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (7 Cols): Session Attendance Log */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-2xs space-y-4">
              {/* Log Header + Subject Filter Chips */}
              <div className="space-y-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    Session Attendance Log
                  </h3>
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'}
                  </span>
                </div>

                {/* Subject Filter Chips in Single Scrollable Row */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  <button
                    type="button"
                    onClick={() => setSelectedSubject('all')}
                    className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedSubject === 'all'
                        ? 'bg-neutral-950 text-white dark:bg-amber-400 dark:text-neutral-950 shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                    }`}
                  >
                    All ({records.length})
                  </button>

                  {subjectListWithCounts.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => setSelectedSubject(s.name)}
                      className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        selectedSubject === s.name
                          ? 'bg-neutral-950 text-white dark:bg-amber-400 dark:text-neutral-950 shadow-xs'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                      }`}
                    >
                      {s.name} ({s.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Stacked Session Rows */}
              {loading ? (
                <StudentListSkeleton rows={4} />
              ) : displayedSessions.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 dark:text-neutral-400 space-y-2">
                  <BookOpen size={32} className="mx-auto text-neutral-300 dark:text-neutral-700" />
                  <p className="text-sm font-bold">No sessions found</p>
                  <p className="text-xs">No attendance entries match this filter.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedSessions.map((rec) => {
                    const subj =
                      rec.subject ||
                      (rec.slot?.offering as any)?.subject_name ||
                      (rec.slot?.offering as any)?.subject?.name ||
                      'Class Session';
                    const rawTeacher =
                      rec.teacher?.full_name ||
                      (rec.slot?.offering as any)?.teacher?.full_name ||
                      'Faculty Teacher';
                    const teacherName = formatProperName(rawTeacher);
                    const dateFormatted = formatStandardDate(rec.session_date);
                    const timing = rec.slot
                      ? `${formatTime12h(rec.slot.start_time)}–${formatTime12h(rec.slot.end_time)}`
                      : '';
                    const markedTime = rec.marked_at
                      ? formatPKTTime(new Date(rec.marked_at).toLocaleTimeString())
                      : '—';

                    return (
                      <div
                        key={rec.id}
                        className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-150 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors space-y-1.5"
                      >
                        {/* Line 1: Subject and Status Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                            {subj}
                          </h4>
                          <StudentStatusBadge status={rec.status || 'absent'} size="sm" />
                        </div>

                        {/* Line 2: Teacher */}
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium truncate">
                          {teacherName}
                        </p>

                        {/* Line 3: Date · Timing · Marked Time */}
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {dateFormatted} {timing && `· ${timing}`} · Marked {markedTime}
                        </p>
                      </div>
                    );
                  })}

                  {/* Load More Button */}
                  {filteredRecords.length > displayCount && (
                    <button
                      type="button"
                      onClick={() => setDisplayCount((prev) => prev + 10)}
                      className="min-h-[44px] min-w-[44px] w-full py-2.5 rounded-xl text-xs font-bold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                    >
                      Load more sessions ({filteredRecords.length - displayCount} remaining)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Day Sessions Bottom Sheet Modal ── */}
      <StudentBottomSheet
        isOpen={Boolean(selectedDayModal)}
        onClose={() => setSelectedDayModal(null)}
        title={
          selectedDayModal
            ? `Sessions on ${formatStandardDate(selectedDayModal.dateStr)}`
            : 'Day Sessions'
        }
        subtitle={`${selectedDayModal?.sessions.length || 0} classes recorded for this day`}
      >
        {selectedDayModal?.sessions.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <Calendar size={32} className="mx-auto mb-2 text-neutral-400" />
            <p className="text-sm font-bold">No sessions on this date</p>
            <p className="text-xs">There were no classes scheduled or held on this day.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayModal?.sessions.map((session) => {
              const subj =
                session.subject ||
                (session.slot?.offering as any)?.subject_name ||
                (session.slot?.offering as any)?.subject ||
                'Class';
              const rawTeacher =
                session.teacher?.full_name ||
                (session.slot?.offering as any)?.teacher?.full_name ||
                'Teacher';
              const teacherName = formatProperName(rawTeacher);
              const timeRange = session.slot
                ? `${formatTime12h(session.slot.start_time)} – ${formatTime12h(session.slot.end_time)}`
                : 'Regular Session';
              const markedTime = session.marked_at
                ? new Date(session.marked_at).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })
                : 'Not recorded';

              return (
                <div
                  key={session.id}
                  className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                      {subj}
                    </h4>
                    <StudentStatusBadge status={session.status} size="sm" />
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Instructor: <strong className="text-neutral-900 dark:text-neutral-200">{teacherName}</strong>
                  </p>
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                    <span>Timing: {timeRange}</span>
                    <span>Marked at: {markedTime}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </StudentBottomSheet>

      {/* ── Policy Modal ── */}
      <StudentBottomSheet
        isOpen={policyOpen}
        onClose={() => setPolicyOpen(false)}
        title="Scholario Attendance Policy"
      >
        <div className="space-y-3 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            1. <strong>Verification:</strong> Tapping <strong>"Join Now"</strong> from your dashboard or timetable automatically submits your attendance for that live session.
          </p>
          <p>
            2. <strong>Live Window:</strong> Class sessions unlock 10 minutes before the scheduled start time. Attendance is verified by your teacher during roll call.
          </p>
          <p>
            3. <strong>Target Goal:</strong> Students are required to maintain a minimum attendance rate of <strong>75%</strong> to be eligible for terminal exams and board registration.
          </p>
          <p>
            4. <strong>Leave & Absences:</strong> If you are unable to attend due to illness or technical issues, message your teacher or admin through Scholario Chat to request excused absence status.
          </p>
        </div>
      </StudentBottomSheet>
    </StudentShell>
  );
};

export default AttendancePage;
