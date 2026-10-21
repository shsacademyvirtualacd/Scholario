import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  UserCheck,
  UserX,
  Calendar,
  Search,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getStaffAttendanceLogs,
  adminCloseStaffSession,
} from '../../../lib/staffAttendanceService';
import { getAllTeachers } from '../../../lib/db';
import {
  getPKTDateString,
  getYesterdayPKTDateString,
  formatPKTDate,
  formatPKTTime,
  formatDurationHuman,
  formatDurationTimer,
  evaluateSessionStaleness,
} from '../../../utils/pktUtils';
import type { StaffAttendanceLog } from '../../../types/staffAttendance';
import type { Teacher } from '../../../types/database';

interface TeacherAttendanceOverviewCardProps {
  onStaleCountChange?: (count: number) => void;
  refreshTrigger?: number;
}

export const TeacherAttendanceOverviewCard: React.FC<TeacherAttendanceOverviewCardProps> = ({
  onStaleCountChange,
  refreshTrigger,
}) => {
  const navigate = useNavigate();

  const [logs, setLogs] = useState<StaffAttendanceLog[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // PKT Date references
  const todayPKT = useMemo(() => getPKTDateString(), []);
  const yesterdayPKT = useMemo(() => getYesterdayPKTDateString(), []);

  // Filters
  const [dateMode, setDateMode] = useState<'today' | 'yesterday' | 'custom' | 'all'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(todayPKT);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'off_duty' | 'needs_review'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Close session modal state
  const [sessionToClose, setSessionToClose] = useState<{
    log: StaffAttendanceLog;
    teacherName: string;
  } | null>(null);
  const [closeClockOutTime, setCloseClockOutTime] = useState<string>('');
  const [closeAdminNotes, setCloseAdminNotes] = useState<string>('');
  const [isClosingSession, setIsClosingSession] = useState(false);

  // Realtime ticker for running timer on active sessions (1s interval)
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [fetchedLogs, fetchedTeachers] = await Promise.all([
        getStaffAttendanceLogs({ limit: 500 }),
        getAllTeachers().catch(() => [] as Teacher[]),
      ]);

      setLogs(fetchedLogs);
      setTeachers(fetchedTeachers);
      if (isManual) {
        toast.success('Teacher attendance data updated');
      }
    } catch (err) {
      console.warn('[TeacherAttendanceOverviewCard] Error fetching:', err);
      toast.error('Unable to fetch teacher attendance records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  // Teacher map
  const teacherMap = useMemo(() => {
    const map = new Map<string, Teacher>();
    teachers.forEach((t) => map.set(t.id, t));
    return map;
  }, [teachers]);

  const getTeacherInfo = (staffId: string) => {
    const teacher = teacherMap.get(staffId);
    if (teacher) {
      const initials = teacher.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      return {
        name: teacher.full_name,
        email: teacher.email || 'Faculty Staff',
        initials,
        avatar_url: teacher.avatar_url,
      };
    }
    return {
      name: staffId === 'admin' ? 'Administrator' : `Teacher (${staffId.slice(0, 6)})`,
      email: 'Faculty Member',
      initials: staffId === 'admin' ? 'AD' : 'TC',
      avatar_url: null,
    };
  };

  // Evaluate staleness and status for every log
  const evaluatedLogs = useMemo(() => {
    return logs.map((log) => {
      const staleness = evaluateSessionStaleness(log.clock_in_at, log.clock_out_at, currentTimestamp);
      const isLiveActive = !log.clock_out_at && !staleness.isStale;
      const isNeedsReview = staleness.isStale;
      const isOffDuty = !!log.clock_out_at;

      let computedStatus: 'present' | 'off_duty' | 'needs_review' = 'off_duty';
      if (isNeedsReview) computedStatus = 'needs_review';
      else if (isLiveActive) computedStatus = 'present';

      // Duration: if stale, freeze at clock-in duration or max 12h
      let durationSeconds = staleness.durationSeconds;
      if (staleness.isStale && !log.clock_out_at) {
        durationSeconds = Math.min(staleness.durationSeconds, 12 * 3600);
      }

      return {
        ...log,
        staleness,
        isLiveActive,
        isNeedsReview,
        isOffDuty,
        computedStatus,
        effectiveDurationSeconds: durationSeconds,
      };
    });
  }, [logs, currentTimestamp]);

  // Notify parent of total stale sessions needing review
  const staleSessions = useMemo(() => {
    return evaluatedLogs.filter((l) => l.isNeedsReview);
  }, [evaluatedLogs]);

  useEffect(() => {
    if (onStaleCountChange) {
      onStaleCountChange(staleSessions.length);
    }
  }, [staleSessions.length, onStaleCountChange]);

  // Today in PKT logs (for calculating Present Now, Off Duty, and Today's Hours)
  const todayLogs = useMemo(() => {
    return evaluatedLogs.filter((l) => getPKTDateString(l.clock_in_at) === todayPKT);
  }, [evaluatedLogs, todayPKT]);

  // Teachers who are CURRENTLY clocked in right now in an open session today that is NOT stale
  const presentTeacherIds = useMemo(() => {
    const ids = new Set<string>();
    todayLogs.forEach((l) => {
      if (l.isLiveActive) {
        ids.add(l.staff_id);
      }
    });
    return ids;
  }, [todayLogs]);

  const currentlyPresentCount = presentTeacherIds.size;
  const totalTeachersCount = teachers.length;
  // Off duty teachers = teachers not clocked in right now
  const offDutyCount = Math.max(0, totalTeachersCount - currentlyPresentCount);

  // Today's total hours: sum of completed sessions + live non-stale sessions today in PKT
  // Exclude needs-review sessions from total hours
  const todayTotalHoursSeconds = useMemo(() => {
    return todayLogs
      .filter((l) => !l.isNeedsReview)
      .reduce((acc, l) => acc + l.effectiveDurationSeconds, 0);
  }, [todayLogs]);

  // Handle segmented date selection
  const handleSelectDateMode = (mode: 'today' | 'yesterday' | 'custom' | 'all') => {
    setDateMode(mode);
    if (mode === 'today') {
      setSelectedDate(todayPKT);
    } else if (mode === 'yesterday') {
      setSelectedDate(yesterdayPKT);
    } else if (mode === 'all') {
      setSelectedDate('');
    }
  };

  // Filtered logs for the display table
  const filteredLogs = useMemo(() => {
    return evaluatedLogs
      .filter((log) => {
        // Date filter
        if (selectedDate) {
          const logDate = getPKTDateString(log.clock_in_at);
          if (logDate !== selectedDate) return false;
        }

        // Teacher filter
        if (selectedTeacherId !== 'all' && log.staff_id !== selectedTeacherId) {
          return false;
        }

        // Status filter
        if (statusFilter === 'present' && log.computedStatus !== 'present') return false;
        if (statusFilter === 'off_duty' && log.computedStatus !== 'off_duty') return false;
        if (statusFilter === 'needs_review' && log.computedStatus !== 'needs_review') return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const info = getTeacherInfo(log.staff_id);
          const nameMatch = info.name.toLowerCase().includes(q);
          const emailMatch = info.email.toLowerCase().includes(q);
          const notesMatch = log.notes ? log.notes.toLowerCase().includes(q) : false;
          if (!nameMatch && !emailMatch && !notesMatch) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.clock_in_at).getTime() - new Date(a.clock_in_at).getTime());
  }, [evaluatedLogs, selectedDate, selectedTeacherId, statusFilter, searchQuery, teacherMap]);

  // Open "Close session" modal
  const handleOpenCloseModal = (log: StaffAttendanceLog) => {
    const info = getTeacherInfo(log.staff_id);
    // Suggest a default clock out time: 8 hours after clock in or current PKT time
    const clockInDate = new Date(log.clock_in_at);
    const suggestedTime = new Date(Math.min(clockInDate.getTime() + 8 * 3600 * 1000, Date.now()));
    // Format for datetime-local (local to PKT)
    const yyyy = suggestedTime.getFullYear();
    const mm = String(suggestedTime.getMonth() + 1).padStart(2, '0');
    const dd = String(suggestedTime.getDate()).padStart(2, '0');
    const hh = String(suggestedTime.getHours()).padStart(2, '0');
    const min = String(suggestedTime.getMinutes()).padStart(2, '0');
    setCloseClockOutTime(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
    setCloseAdminNotes('Session closed by admin due to missing clock-out punch.');
    setSessionToClose({ log, teacherName: info.name });
  };

  // Submit "Close session"
  const handleConfirmCloseSession = async () => {
    if (!sessionToClose) return;
    setIsClosingSession(true);
    try {
      const clockOutIso = closeClockOutTime ? new Date(closeClockOutTime).toISOString() : new Date().toISOString();
      await adminCloseStaffSession({
        log_id: sessionToClose.log.id,
        clock_out_at: clockOutIso,
        notes: closeAdminNotes.trim() || 'Closed by admin',
        admin_name: 'Administrator',
      });
      toast.success(`Session closed for ${sessionToClose.teacherName}`);
      setSessionToClose(null);
      await loadData();
    } catch (err: any) {
      console.error('Failed to close session:', err);
      toast.error(err?.message || 'Failed to close session');
    } finally {
      setIsClosingSession(false);
    }
  };

  return (
    <section
      id="teacher-attendance-section"
      className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden transition-colors"
      aria-labelledby="teacher-attendance-title"
    >
      {/* ── Card Header ── */}
      <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2
            id="teacher-attendance-title"
            className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight"
          >
            Teacher attendance
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Live clock-ins and clock-outs for today (PKT)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="admin-attendance-refresh-btn"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            title="Refresh attendance records"
            aria-label="Refresh attendance"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/attendance')}
            className="btn btn-primary text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <span>Full Attendance Center</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Four Small Status Tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-neutral-50/50 dark:bg-neutral-900/30 border-b border-neutral-100 dark:border-neutral-800">
        {/* 1. Present Now */}
        <div className="bg-white dark:bg-[#202024] p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Present now</div>
            <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums flex items-center gap-2 mt-0.5">
              <span>{currentlyPresentCount}</span>
              {currentlyPresentCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* 2. Off Duty */}
        <div className="bg-white dark:bg-[#202024] p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 flex items-center justify-center shrink-0">
            <UserX size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Off duty</div>
            <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums mt-0.5">
              <span>{offDutyCount}</span>
              <span className="text-xs font-normal text-neutral-400 dark:text-neutral-500 ml-1.5">
                / {totalTeachersCount} staff
              </span>
            </div>
          </div>
        </div>

        {/* 3. Hours Today */}
        <div className="bg-white dark:bg-[#202024] p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center justify-between gap-1">
              <span>Hours today</span>
              {staleSessions.length > 0 && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  {staleSessions.length} {staleSessions.length === 1 ? 'session' : 'sessions'} review
                </span>
              )}
            </div>
            <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums mt-0.5">
              {formatDurationHuman(todayTotalHoursSeconds)}
            </div>
          </div>
        </div>

        {/* 4. Punches */}
        <div className="bg-white dark:bg-[#202024] p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Calendar size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Punches</div>
            <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums mt-0.5">
              {filteredLogs.length}
              <span className="text-xs font-normal text-neutral-400 dark:text-neutral-500 ml-1.5">
                {selectedDate ? `for ${formatPKTDate(selectedDate, 'short')}` : 'total'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters Toolbar ── */}
      <div className="p-4 bg-white dark:bg-[#18181B] border-b border-neutral-100 dark:border-neutral-800">
        {/* Mobile Filter Button */}
        <div className="sm:hidden flex items-center justify-between gap-2 mb-3">
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700"
          >
            <Filter size={14} />
            <span>Filters ({selectedDate === todayPKT ? 'Today' : selectedDate ? selectedDate : 'All'})</span>
            {showMobileFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Filters Row (Desktop always visible, mobile toggleable) */}
        <div className={`${showMobileFilters ? 'block' : 'hidden'} sm:block space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Segmented Date Control */}
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              <button
                type="button"
                onClick={() => handleSelectDateMode('today')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateMode === 'today'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleSelectDateMode('yesterday')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateMode === 'yesterday'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => handleSelectDateMode('custom')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  dateMode === 'custom'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <span>Pick a date</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectDateMode('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateMode === 'all'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                All
              </button>
            </div>

            {/* Custom Date Input when in custom mode */}
            {dateMode === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            )}
          </div>

          {/* Secondary Row: Teacher, Status, Search */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* Teacher Selector */}
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="text-xs px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              <option value="all">All Teachers ({teachers.length})</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present (Clocked In)</option>
              <option value="off_duty">Off Duty (Clocked Out)</option>
              <option value="needs_review">Needs Review ({staleSessions.length})</option>
            </select>

            {/* Search Box */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teacher or notes..."
                className="w-full text-xs pl-8 pr-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Table (Desktop) / Cards (Mobile) ── */}
      {loading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-14 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        /* Empty State */
        <div className="py-12 text-center text-neutral-500 dark:text-neutral-400">
          <Calendar size={32} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            No punches for this date.
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {selectedDate
              ? `No teacher attendance punches recorded for ${formatPKTDate(selectedDate, 'medium')}.`
              : 'Try adjusting your filters.'}
          </p>
          {selectedDate !== todayPKT && (
            <button
              type="button"
              onClick={() => handleSelectDateMode('today')}
              className="mt-3 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Switch to Today (PKT)
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table: Hidden on Mobile */}
          <div className="hidden md:block overflow-x-auto max-h-[520px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold text-[11px] border-b border-neutral-200 dark:border-neutral-700 shadow-2xs">
                <tr>
                  <th className="py-3 px-4">Teacher</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Clock in</th>
                  <th className="py-3 px-4">Clock out</th>
                  <th className="py-3 px-4">Hours</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredLogs.map((log) => {
                  const teacherInfo = getTeacherInfo(log.staff_id);
                  const isExpanded = expandedNotesId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="min-h-[56px] hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                        {/* Teacher */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {teacherInfo.avatar_url ? (
                              <img
                                src={teacherInfo.avatar_url}
                                alt={teacherInfo.name}
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-neutral-200 dark:border-neutral-700"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center shrink-0">
                                {teacherInfo.initials}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                {teacherInfo.name}
                              </div>
                              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                                {teacherInfo.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Date (PKT) */}
                        <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                          {formatPKTDate(log.clock_in_at, 'short')}
                        </td>

                        {/* Clock In (PKT, Tabular numbers, sans-serif) */}
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
                          {formatPKTTime(log.clock_in_at)}
                        </td>

                        {/* Clock Out (PKT, Tabular numbers, sans-serif) */}
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
                          {log.clock_out_at ? (
                            formatPKTTime(log.clock_out_at)
                          ) : log.isNeedsReview ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              Open (Stale)
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              <span>Live</span>
                            </span>
                          )}
                        </td>

                        {/* Hours (Running timer if live, standard sans-serif) */}
                        <td className="py-3 px-4 whitespace-nowrap font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                          {log.isLiveActive
                            ? formatDurationTimer(log.effectiveDurationSeconds)
                            : formatDurationHuman(log.effectiveDurationSeconds)}
                        </td>

                        {/* Status Pill */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {log.computedStatus === 'present' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Present</span>
                            </span>
                          )}
                          {log.computedStatus === 'off_duty' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-500/10 text-neutral-700 dark:text-neutral-400 border border-neutral-500/20">
                              <span>Off duty</span>
                            </span>
                          )}
                          {log.computedStatus === 'needs_review' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                              <AlertTriangle size={12} className="text-amber-600 dark:text-amber-400" />
                              <span>Needs review</span>
                            </span>
                          )}
                        </td>

                        {/* Actions (Close session or Toggle notes) */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {log.isNeedsReview && (
                              <button
                                type="button"
                                onClick={() => handleOpenCloseModal(log)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-colors"
                              >
                                Close session
                              </button>
                            )}

                            {log.notes && (
                              <button
                                type="button"
                                onClick={() => setExpandedNotesId(isExpanded ? null : log.id)}
                                className="p-1 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded transition-colors"
                                title="Toggle notes"
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Notes Area */}
                      {isExpanded && log.notes && (
                        <tr className="bg-neutral-50 dark:bg-neutral-800/60">
                          <td colSpan={7} className="py-2.5 px-4 text-xs text-neutral-600 dark:text-neutral-300">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-200 mr-2">
                              Session notes:
                            </span>
                            {log.notes}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards (Visible <768px) */}
          <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
            {filteredLogs.map((log) => {
              const teacherInfo = getTeacherInfo(log.staff_id);
              const isExpanded = expandedNotesId === log.id;

              return (
                <div key={log.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center shrink-0">
                        {teacherInfo.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                          {teacherInfo.name}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {formatPKTDate(log.clock_in_at, 'short')}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      {log.computedStatus === 'present' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Present</span>
                        </span>
                      )}
                      {log.computedStatus === 'off_duty' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-500/10 text-neutral-700 dark:text-neutral-400 border border-neutral-500/20">
                          <span>Off duty</span>
                        </span>
                      )}
                      {log.computedStatus === 'needs_review' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                          <AlertTriangle size={11} />
                          <span>Needs review</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Punch times grid */}
                  <div className="grid grid-cols-3 gap-2 bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-lg text-xs">
                    <div>
                      <div className="text-[10px] text-neutral-400">Clock in</div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                        {formatPKTTime(log.clock_in_at)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400">Clock out</div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                        {log.clock_out_at ? formatPKTTime(log.clock_out_at) : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400">Hours</div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                        {log.isLiveActive
                          ? formatDurationTimer(log.effectiveDurationSeconds)
                          : formatDurationHuman(log.effectiveDurationSeconds)}
                      </div>
                    </div>
                  </div>

                  {/* Stale close action & notes */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {log.isNeedsReview ? (
                      <button
                        type="button"
                        onClick={() => handleOpenCloseModal(log)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-2xs"
                      >
                        Close session
                      </button>
                    ) : <span />}

                    {log.notes && (
                      <button
                        type="button"
                        onClick={() => setExpandedNotesId(isExpanded ? null : log.id)}
                        className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1"
                      >
                        <span>Notes</span>
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    )}
                  </div>

                  {isExpanded && log.notes && (
                    <div className="text-xs text-neutral-600 dark:text-neutral-300 p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                      {log.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Single Muted Legend Line Under Table ── */}
      <div className="p-3.5 bg-neutral-50/70 dark:bg-neutral-900/40 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        <span>
          Showing {filteredLogs.length} punch {filteredLogs.length === 1 ? 'record' : 'records'} for {selectedDate ? formatPKTDate(selectedDate, 'medium') : 'all dates'} (PKT).
        </span>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Present = currently clocked in</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-400" />
            <span>Off duty = clocked out</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Needs review = open &gt;12h or across midnight</span>
          </span>
        </div>
      </div>

      {/* ── Close Stale Session Modal ── */}
      {sessionToClose && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                  Close Teacher Session
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSessionToClose(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-300">
              <div>
                <span className="font-medium text-neutral-500 dark:text-neutral-400">Teacher: </span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{sessionToClose.teacherName}</span>
              </div>
              <div>
                <span className="font-medium text-neutral-500 dark:text-neutral-400">Clock-in time: </span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatPKTDate(sessionToClose.log.clock_in_at, 'medium')} at {formatPKTTime(sessionToClose.log.clock_in_at)}
                </span>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                  Clock-out Date & Time (PKT)
                </label>
                <input
                  type="datetime-local"
                  value={closeClockOutTime}
                  onChange={(e) => setCloseClockOutTime(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                  Administrative Note (Audited)
                </label>
                <textarea
                  rows={2}
                  value={closeAdminNotes}
                  onChange={(e) => setCloseAdminNotes(e.target.value)}
                  placeholder="Reason for closing session manually..."
                  className="w-full text-xs px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setSessionToClose(null)}
                disabled={isClosingSession}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseSession}
                disabled={isClosingSession}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                {isClosingSession && <RefreshCw size={12} className="animate-spin" />}
                <span>Confirm & Close Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TeacherAttendanceOverviewCard;
