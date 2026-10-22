import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookMarked,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Lock,
  Video,
  XCircle,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calendar,
  Timer,
} from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import { SectionErrorBoundary } from '../../components/common/ErrorBoundary';
import { useAuth } from '../../features/auth/AuthContext';
import {
  getSlotsForStudent,
  getNotesForOfferings,
  getOfferingsForStudent,
  getAttendanceForStudent,
  computeAttendanceStreak,
} from '../../lib/db';
import NotificationPermissionBanner from '../../components/student/NotificationPermissionBanner';
import DashboardNoticeModal from '../../components/announcements/DashboardNoticeModal';
import { pageCache } from '../../lib/pageCache';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import type { ClassSlot, Note, Attendance, ClassOffering } from '../../types';
import {
  getPKTNow,
  classWidgetState,
  getSlotSubject,
  formatTime12h,
  isSlotOngoing,
  timeStrToMins,
} from '../../lib/scheduleUtils';
import { StudentPageHeader } from '../../components/student/shared/StudentPageHeader';
import { StudentClassCard } from '../../components/student/shared/StudentClassCard';
import { StudentStatusBadge } from '../../components/student/shared/StudentStatusBadge';
import { StudentStatSkeleton, StudentClassCardSkeleton } from '../../components/student/shared/StudentSkeleton';
import {
  formatProperName,
  formatStandardDate,
} from '../../utils/studentFormatting';

// ─── Compact Collapsible Pomodoro Timer ──────────────────────────────
const FocusTimerCard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const FOCUS_SECS = 25 * 60;
  const BREAK_SECS = 5 * 60;

  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [seconds, setSeconds] = useState(FOCUS_SECS);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            if (mode === 'focus') {
              setSessions((s) => s + 1);
              setMode('break');
              return BREAK_SECS;
            } else {
              setMode('focus');
              return FOCUS_SECS;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, mode]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const reset = () => {
    setRunning(false);
    setSeconds(mode === 'focus' ? FOCUS_SECS : BREAK_SECS);
  };

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 dark:border-amber-800/40">
            <Timer size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Study Focus Timer
              </h3>
              {running && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {timeFormatted} Active
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {running ? `Session in progress (${mode})` : '25m focus / 5m break interval'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isExpanded && (
            <span className="font-mono font-bold text-sm text-neutral-700 dark:text-neutral-300">
              {timeFormatted}
            </span>
          )}
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setMode('focus');
                  setSeconds(FOCUS_SECS);
                  setRunning(false);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'focus'
                    ? 'bg-amber-400 text-neutral-950 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Focus (25m)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('break');
                  setSeconds(BREAK_SECS);
                  setRunning(false);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'break'
                    ? 'bg-amber-400 text-neutral-950 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Break (5m)
              </button>
            </div>

            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
              {sessions} completed
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-mono text-3xl font-black text-neutral-900 dark:text-white">
              {timeFormatted}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRunning((r) => !r)}
                className="min-h-[44px] min-w-[44px] px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                {running ? <Pause size={14} /> : <Play size={14} />}
                <span>{running ? 'Pause' : 'Start'}</span>
              </button>
              <button
                type="button"
                onClick={reset}
                className="min-h-[44px] min-w-[44px] p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                title="Reset timer"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const StudentDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const studentId = profile?.id || '';

  const [loading, setLoading] = useState(true);
  const [scheduleSlots, setScheduleSlots] = useState<ClassSlot[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [pktnow, setPktnow] = useState(getPKTNow);

  // Sync clock every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPktnow(getPKTNow());
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial student data
  const fetchData = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const [slotsData, attData, offsData] = await Promise.all([
        getSlotsForStudent(studentId),
        getAttendanceForStudent(studentId),
        getOfferingsForStudent(studentId),
      ]);

      setScheduleSlots(slotsData || []);
      setAttendanceRecords(attData || []);
      setOfferings(offsData || []);

      if (offsData && offsData.length > 0) {
        const offIds = offsData.map((o) => o.id);
        const notesData = await getNotesForOfferings(offIds);
        setRecentNotes(notesData?.slice(0, 3) || []);
      }
    } catch (err) {
      console.error('[StudentDashboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [studentId]);

  // Realtime updates for attendance & schedule
  useRealtimeTable({
    table: 'attendance',
    debounceMs: 500,
    onAny: () => {
      if (studentId) {
        getAttendanceForStudent(studentId).then((data) => setAttendanceRecords(data || []));
      }
    },
  });

  // Calculate stats
  const safeAttendance = attendanceRecords || [];
  const streakMetrics = computeAttendanceStreak(safeAttendance);

  const totalClassesHeld = safeAttendance.length;
  const totalClassesAttended = safeAttendance.filter(
    (r) =>
      r &&
      (r.marked_by === 'teacher' || r.marked_by === 'admin') &&
      (r.status === 'present' || r.status === 'late')
  ).length;

  const attendanceRate =
    totalClassesHeld > 0 ? Math.round((totalClassesAttended / totalClassesHeld) * 100) : 0;

  // Course term quota explanation: 48 sessions planned in term syllabus
  const termClassesTotal =
    offerings.reduce((acc, curr) => acc + (curr?.total_classes || 0), 0) ||
    (totalClassesHeld > 0 ? Math.max(totalClassesHeld, 48) : 48);
  const classesLeftInTerm = Math.max(0, termClassesTotal - totalClassesAttended);

  // Today's classes
  const todayDateStr = pktnow.dateString;
  const safeSlots = scheduleSlots.filter((s) => !s.is_cancelled);
  const todayClasses = safeSlots
    .filter((slot) => slot && slot.day_of_week === pktnow.dayIndex)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  // Identify next upcoming or ongoing class
  const widgetState = classWidgetState(safeSlots, pktnow);
  const activeOrNextSlot =
    widgetState.type === 'ongoing'
      ? widgetState.activeSlot
      : widgetState.nextSlot;

  // Filter remaining today's classes so the Next Class hero is not duplicated below
  const remainingTodayClasses = todayClasses.filter(
    (s) => s.id !== activeOrNextSlot?.id
  );

  const studentFirstName = formatProperName(profile?.full_name?.split(' ')[0]);

  // Recent 5 attendance sessions
  const recentAttendanceSessions = [...safeAttendance]
    .sort((a, b) => (b.session_date || '').localeCompare(a.session_date || ''))
    .slice(0, 5);

  return (
    <StudentShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <NotificationPermissionBanner />

        {/* ── Page Header & Greeting ── */}
        <StudentPageHeader
          title={`Good ${
            new Date().getHours() < 12
              ? 'morning'
              : new Date().getHours() < 17
              ? 'afternoon'
              : 'evening'
          }, ${studentFirstName} 👋`}
          description="Here's your live study schedule, attendance progress, and learning resources for today."
          action={
            <button
              type="button"
              onClick={() => navigate('/student/schedule')}
              className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Weekly Schedule</span>
              <ChevronRight size={14} />
            </button>
          }
        />

        {/* ── Compact Stat Row (3 Tiles: Attendance Rate, Streak, Term Remaining) ── */}
        <SectionErrorBoundary name="Student Stats">
          {loading ? (
            <StudentStatSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Attendance Rate */}
              <div
                onClick={() => navigate('/student/attendance')}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 hover:border-amber-400/50 transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Attendance</span>
                  <ClipboardCheck size={16} className="text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                    {totalClassesHeld === 0 ? '—' : `${attendanceRate}%`}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    ({totalClassesAttended} of {totalClassesHeld} held)
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  {totalClassesHeld === 0
                    ? 'No classes marked yet'
                    : attendanceRate >= 75
                    ? 'On track for 75% target'
                    : 'Below 75% goal'}
                </p>
              </div>

              {/* Day Streak */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-2xs">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Study Streak</span>
                  <span className="text-base">🔥</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                    {streakMetrics.currentStreak} {streakMetrics.currentStreak === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  {streakMetrics.currentStreak === 0
                    ? 'Join a class today to start your streak'
                    : 'Keep attending classes to build consistency'}
                </p>
              </div>

              {/* Classes Left in Term */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-2xs">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Term Classes</span>
                  <Calendar size={16} className="text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                    {classesLeftInTerm} left
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    of {termClassesTotal} planned
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  Total curriculum sessions across all enrolled subjects
                </p>
              </div>
            </div>
          )}
        </SectionErrorBoundary>

        {/* ── Main Two-Column Viewport (Desktop/Tablet: Schedule on Left, Widgets on Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column (Span 2): Next Class Hero + Today's Scheduled Classes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Next Class Hero Section */}
            {activeOrNextSlot && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    {widgetState.type === 'ongoing' ? '● Live Right Now' : 'Up Next Today'}
                  </span>
                </div>
                <StudentClassCard
                  slot={activeOrNextSlot}
                  studentId={studentId}
                  sessionDate={todayDateStr}
                  attendanceRecord={safeAttendance.find(
                    (a) => a.slot_id === activeOrNextSlot.id && a.session_date === todayDateStr
                  )}
                  onAttendanceMarked={(slotId, rec) => {
                    setAttendanceRecords((prev) => [
                      rec,
                      ...prev.filter(
                        (p) => !(p.slot_id === slotId && p.session_date === todayDateStr)
                      ),
                    ]);
                  }}
                  isNextOrLive
                />
              </div>
            )}

            {/* Remaining Today's Classes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                <div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                    Today's Classes
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    All lectures scheduled for today in Pakistan Standard Time (PKT).
                  </p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {todayClasses.length} {todayClasses.length === 1 ? 'class' : 'classes'}
                </span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <StudentClassCardSkeleton />
                  <StudentClassCardSkeleton />
                </div>
              ) : todayClasses.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 text-center space-y-2">
                  <CheckCircle2 size={32} className="text-emerald-500 mx-auto" />
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    No more classes scheduled for today
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                    Enjoy your study break or practice your syllabus topics in Self Testing!
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/student/self-testing')}
                    className="min-h-[44px] min-w-[44px] mt-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Practice in Self Testing
                  </button>
                </div>
              ) : remainingTodayClasses.length === 0 && activeOrNextSlot ? (
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 text-xs text-neutral-500 dark:text-neutral-400 text-center">
                  All other classes for today are shown in the hero card above.
                </div>
              ) : (
                <div className="space-y-3">
                  {remainingTodayClasses.map((cls) => {
                    const att = safeAttendance.find(
                      (a) => a.slot_id === cls.id && a.session_date === todayDateStr
                    );
                    return (
                      <StudentClassCard
                        key={cls.id}
                        slot={cls}
                        studentId={studentId}
                        sessionDate={todayDateStr}
                        attendanceRecord={att}
                        onAttendanceMarked={(slotId, rec) => {
                          setAttendanceRecords((prev) => [
                            rec,
                            ...prev.filter(
                              (p) => !(p.slot_id === slotId && p.session_date === todayDateStr)
                            ),
                          ]);
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Collapsible Focus Timer + Attendance Summary + Notes (if available) */}
          <div className="space-y-6">
            {/* Focus Timer */}
            <FocusTimerCard />

            {/* Compact Attendance Summary (Recent 5 Sessions) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={16} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Recent Attendance
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/student/attendance')}
                  className="text-xs text-neutral-500 hover:text-amber-500 font-bold transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View all</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {recentAttendanceSessions.length === 0 ? (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 py-3 text-center">
                  No attendance sessions logged yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {recentAttendanceSessions.map((rec) => {
                    const subj =
                      rec.subject ||
                      (rec.slot?.offering as any)?.subject_name ||
                      (rec.slot?.offering as any)?.subject ||
                      'Class Session';
                    const dateFormatted = formatStandardDate(rec.session_date);
                    return (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-150 dark:border-neutral-800 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-neutral-900 dark:text-white truncate">
                            {subj}
                          </p>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            {dateFormatted}
                          </p>
                        </div>
                        <StudentStatusBadge
                          status={rec.status || 'absent'}
                          size="sm"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes Library Preview (Shown ONLY if notes exist) */}
            {recentNotes.length > 0 && (
              <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <BookMarked size={16} className="text-amber-500" />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Recent Notes
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/student/notes')}
                    className="text-xs text-neutral-500 hover:text-amber-500 font-bold transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Open library</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="space-y-2">
                  {recentNotes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => navigate('/student/notes')}
                      className="min-h-[44px] w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-150 dark:border-neutral-800 hover:border-amber-400/50 flex items-center justify-between text-left transition-all cursor-pointer"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {note.title}
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                          {note.chapter_name || 'Study Material'}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-neutral-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DashboardNoticeModal role="student" />
    </StudentShell>
  );
};

export default StudentDashboardPage;
