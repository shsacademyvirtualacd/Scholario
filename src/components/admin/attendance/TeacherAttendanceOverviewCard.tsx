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
      className="admin-card overflow-hidden transition-colors"
      aria-labelledby="teacher-attendance-title"
    >
      {/* ── Card Header ── */}
      <div className="p-4 sm:p-5 border-b border-[var(--admin-card-border)] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="teacher-attendance-title"
            className="text-lg font-bold text-[var(--admin-text)] tracking-tight"
          >
            Teacher attendance
          </h2>
          <p className="text-[13px] text-[var(--admin-muted)] mt-0.5 line-clamp-2">
            Live clock-ins and clock-outs for today (PKT)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="admin-attendance-refresh-btn"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[var(--admin-card-border)] bg-black/5 dark:bg-white/5 text-[var(--admin-text)] hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            title="Refresh attendance records"
            aria-label="Refresh attendance"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/attendance')}
            className="h-12 min-h-[48px] px-4 rounded-full font-bold text-xs flex items-center gap-1.5 transition-colors bg-[#111111] text-white hover:bg-black/90 dark:bg-[#F2C230] dark:text-[#111111] dark:hover:bg-[#e0b42c] shadow-xs"
          >
            <span>Full Attendance Center</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Four Small Status Tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 sm:p-4 bg-black/[0.015] dark:bg-white/[0.015] border-b border-[var(--admin-card-border)]">
        {/* 1. Present Now */}
        <div className="bg-white/80 dark:bg-white/[0.04] p-3 rounded-xl border border-[var(--admin-card-border)] flex items-center gap-3 min-h-[76px]">
          <div className="w-8 h-8 rounded-xl bg-[rgba(242,194,48,0.16)] text-[#8A6A00] dark:text-[#F2C230] flex items-center justify-center shrink-0">
            <UserCheck size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-[var(--admin-muted)]">Present now</div>
            <div className="text-2xl font-extrabold text-[var(--admin-text)] tabular-nums flex items-center gap-2 mt-0.5">
              <span>{currentlyPresentCount}</span>
              {currentlyPresentCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* 2. Off Duty */}
        <div className="bg-white/80 dark:bg-white/[0.04] p-3 rounded-xl border border-[var(--admin-card-border)] flex items-center gap-3 min-h-[76px]">
          <div className="w-8 h-8 rounded-xl bg-[rgba(242,194,48,0.16)] text-[#8A6A00] dark:text-[#F2C230] flex items-center justify-center shrink-0">
            <UserX size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-[var(--admin-muted)]">Off duty</div>
            <div className="text-2xl font-extrabold text-[var(--admin-text)] tabular-nums mt-0.5 truncate">
              <span>{offDutyCount}</span>
              <span className="text-xs font-normal text-[var(--admin-muted)] ml-1.5">
                / {totalTeachersCount} staff
              </span>
            </div>
          </div>
        </div>

        {/* 3. Hours Today */}
        <div className="bg-white/80 dark:bg-white/[0.04] p-3 rounded-xl border border-[var(--admin-card-border)] flex items-center gap-3 min-h-[76px]">
          <div className="w-8 h-8 rounded-xl bg-[rgba(242,194,48,0.16)] text-[#8A6A00] dark:text-[#F2C230] flex items-center justify-center shrink-0">
            <Clock size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-[var(--admin-muted)] flex items-center justify-between gap-1">
              <span>Hours today</span>
              {staleSessions.length > 0 && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  {staleSessions.length} rev
                </span>
              )}
            </div>
            <div className="text-2xl font-extrabold text-[var(--admin-text)] tabular-nums mt-0.5 truncate">
              {formatDurationHuman(todayTotalHoursSeconds)}
            </div>
          </div>
        </div>

        {/* 4. Punches */}
        <div className="bg-white/80 dark:bg-white/[0.04] p-3 rounded-xl border border-[var(--admin-card-border)] flex items-center gap-3 min-h-[76px]">
          <div className="w-8 h-8 rounded-xl bg-[rgba(242,194,48,0.16)] text-[#8A6A00] dark:text-[#F2C230] flex items-center justify-center shrink-0">
            <Calendar size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-[var(--admin-muted)]">Punches</div>
            <div className="text-2xl font-extrabold text-[var(--admin-text)] tabular-nums mt-0.5">
              {filteredLogs.length}
            </div>
            <div className="text-xs text-[var(--admin-muted)] truncate">
              {selectedDate ? `for ${formatPKTDate(selectedDate, 'short')}` : 'total records'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters Toolbar ── */}
      <div className="p-3.5 sm:p-4 bg-white/40 dark:bg-white/[0.015] border-b border-[var(--admin-card-border)]">
        {/* Mobile Filter Button (48px height) */}
        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => setShowMobileFilters(true)}
            className="w-full h-12 min-h-[48px] flex items-center justify-center gap-2 px-4 rounded-xl border border-[var(--admin-card-border)] bg-black/5 dark:bg-white/5 font-semibold text-xs text-[var(--admin-text)] hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <Filter size={15} className="text-[#8A6A00] dark:text-[#F2C230]" />
            <span>Filters ({selectedDate === todayPKT ? 'Today' : selectedDate ? selectedDate : 'All'})</span>
            <ChevronDown size={14} className="text-[var(--admin-muted)]" />
          </button>
        </div>

        {/* Mobile Filter Bottom Sheet */}
        {showMobileFilters && (
          <div className="sm:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs"
              onClick={() => setShowMobileFilters(false)}
              aria-hidden="true"
            />
            {/* Bottom Sheet */}
            <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] admin-card p-5 shadow-2xl border-b-0 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full mx-auto mb-1" />
              <div className="flex items-center justify-between pb-2 border-b border-[var(--admin-card-border)]">
                <div className="text-base font-bold text-[var(--admin-text)]">Filter Attendance</div>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  className="w-9 h-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full text-[var(--admin-muted)] hover:text-[var(--admin-text)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  aria-label="Close filters"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Segmented Date Control */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)]">Date</label>
                <div className="grid grid-cols-4 gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-xl text-xs font-semibold">
                  {(['today', 'yesterday', 'custom', 'all'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectDateMode(m)}
                      className={`h-9 rounded-lg transition-all capitalize ${
                        dateMode === m
                          ? 'bg-white dark:bg-neutral-700 text-[var(--admin-text)] shadow-xs'
                          : 'text-[var(--admin-muted)] hover:text-[var(--admin-text)]'
                      }`}
                    >
                      {m === 'custom' ? 'Custom' : m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Input */}
              {dateMode === 'custom' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--admin-muted)]">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full h-11 text-xs px-3 border border-[var(--admin-card-border)] rounded-xl bg-white dark:bg-[#18181B] text-[var(--admin-text)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              )}

              {/* Teacher Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)]">Teacher</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full h-11 text-xs px-3 border border-[var(--admin-card-border)] rounded-xl bg-white dark:bg-[#18181B] text-[var(--admin-text)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="all">All Teachers ({teachers.length})</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)]">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full h-11 text-xs px-3 border border-[var(--admin-card-border)] rounded-xl bg-white dark:bg-[#18181B] text-[var(--admin-text)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="all">All Statuses</option>
                  <option value="present">Present (Clocked In)</option>
                  <option value="off_duty">Off Duty (Clocked Out)</option>
                  <option value="needs_review">Needs Review ({staleSessions.length})</option>
                </select>
              </div>

              {/* Search */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)]">Search</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3.5 text-[var(--admin-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search teacher or notes..."
                    className="w-full h-11 text-xs pl-8 pr-3 border border-[var(--admin-card-border)] rounded-xl bg-white dark:bg-[#18181B] text-[var(--admin-text)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {/* Apply / Close button */}
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="w-full h-12 rounded-xl bg-[#F2C230] text-[#111111] font-bold text-xs hover:bg-[#e0b42c] transition-colors shadow-xs"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Desktop Filters (Always visible on sm and up) */}
        <div className="hidden sm:block space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Segmented Date Control */}
            <div className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-xl text-xs font-semibold text-[var(--admin-muted)]">
              <button
                type="button"
                onClick={() => handleSelectDateMode('today')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateMode === 'today'
                    ? 'bg-white dark:bg-neutral-700 text-[var(--admin-text)] shadow-xs'
                    : 'hover:text-[var(--admin-text)]'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleSelectDateMode('yesterday')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateMode === 'yesterday'
                    ? 'bg-white dark:bg-neutral-700 text-[var(--admin-text)] shadow-xs'
                    : 'hover:text-[var(--admin-text)]'
                }`}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => handleSelectDateMode('custom')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  dateMode === 'custom'
                    ? 'bg-white dark:bg-neutral-700 text-[var(--admin-text)] shadow-xs'
                    : 'hover:text-[var(--admin-text)]'
                }`}
              >
                <span>Pick a date</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectDateMode('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateMode === 'all'
                    ? 'bg-white dark:bg-neutral-700 text-[var(--admin-text)] shadow-xs'
                    : 'hover:text-[var(--admin-text)]'
                }`}
              >
                All
              </button>
            </div>

            {/* Custom Date Input */}
            {dateMode === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-[var(--admin-card-border)] rounded-lg bg-white dark:bg-[#18181B] text-[var(--admin-text)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            )}
          </div>

          {/* Secondary Row: Teacher, Status, Search */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="text-xs px-3 py-2 border border-[var(--admin-card-border)] rounded-lg bg-white dark:bg-[#18181B] text-[var(--admin-text)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              <option value="all">All Teachers ({teachers.length})</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs px-3 py-2 border border-[var(--admin-card-border)] rounded-lg bg-white dark:bg-[#18181B] text-[var(--admin-text)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present (Clocked In)</option>
              <option value="off_duty">Off Duty (Clocked Out)</option>
              <option value="needs_review">Needs Review ({staleSessions.length})</option>
            </select>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-[var(--admin-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teacher or notes..."
                className="w-full text-xs pl-8 pr-3 py-2 border border-[var(--admin-card-border)] rounded-lg bg-white dark:bg-[#18181B] text-[var(--admin-text)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Table (Desktop) / Cards (Mobile) ── */}
      {loading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-14 bg-black/5 dark:bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        /* Empty State (compact max ~150px) */
        <div className="py-8 px-4 text-center text-[var(--admin-muted)] max-h-[160px] flex flex-col items-center justify-center">
          <Calendar size={32} className="text-[var(--admin-muted)] opacity-60 mb-1.5" />
          <p className="text-base font-bold text-[var(--admin-text)]">
            No punches for this date.
          </p>
          <p className="text-[13px] text-[var(--admin-muted)] mt-0.5 truncate max-w-sm">
            {selectedDate
              ? `No teacher attendance punches recorded for ${formatPKTDate(selectedDate, 'medium')}.`
              : 'Try adjusting your filters.'}
          </p>
          {selectedDate !== todayPKT && (
            <button
              type="button"
              onClick={() => handleSelectDateMode('today')}
              className="mt-2 text-xs font-bold text-[#8A6A00] dark:text-[#F2C230] hover:underline"
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
              <thead className="sticky top-0 z-10 bg-black/5 dark:bg-white/5 text-[var(--admin-muted)] font-semibold text-[11px] border-b border-[var(--admin-card-border)] shadow-2xs backdrop-blur-md">
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
              <tbody className="divide-y divide-[var(--admin-card-border)]">
                {filteredLogs.map((log) => {
                  const teacherInfo = getTeacherInfo(log.staff_id);
                  const isExpanded = expandedNotesId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="min-h-[56px] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        {/* Teacher */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {teacherInfo.avatar_url ? (
                              <img
                                src={teacherInfo.avatar_url}
                                alt={teacherInfo.name}
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-[var(--admin-card-border)]"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 text-[var(--admin-text)] font-bold text-xs flex items-center justify-center shrink-0">
                                {teacherInfo.initials}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-[var(--admin-text)] truncate">
                                {teacherInfo.name}
                              </div>
                              <div className="text-[11px] text-[var(--admin-muted)] truncate">
                                {teacherInfo.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Date (PKT) */}
                        <td className="py-3 px-4 text-[var(--admin-muted)] whitespace-nowrap">
                          {formatPKTDate(log.clock_in_at, 'short')}
                        </td>

                        {/* Clock In */}
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-[var(--admin-text)] tabular-nums">
                          {formatPKTTime(log.clock_in_at)}
                        </td>

                        {/* Clock Out */}
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-[var(--admin-text)] tabular-nums">
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

                        {/* Hours */}
                        <td className="py-3 px-4 whitespace-nowrap font-semibold text-[var(--admin-text)] tabular-nums">
                          {log.isLiveActive
                            ? formatDurationTimer(log.effectiveDurationSeconds)
                            : formatDurationHuman(log.effectiveDurationSeconds)}
                        </td>

                        {/* Status Pill */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {log.computedStatus === 'present' && (
                            <span className="status-pill-success inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Present</span>
                            </span>
                          )}
                          {log.computedStatus === 'off_duty' && (
                            <span className="status-pill-neutral inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium">
                              <span>Off duty</span>
                            </span>
                          )}
                          {log.computedStatus === 'needs_review' && (
                            <span className="status-pill-warning inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                              <AlertTriangle size={12} />
                              <span>Needs review</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {log.isNeedsReview && (
                              <button
                                type="button"
                                onClick={() => handleOpenCloseModal(log)}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#F2C230] hover:bg-[#e0b42c] text-[#111111] shadow-2xs transition-colors"
                              >
                                Close session
                              </button>
                            )}

                            {log.notes && (
                              <button
                                type="button"
                                onClick={() => setExpandedNotesId(isExpanded ? null : log.id)}
                                className="p-1 text-[var(--admin-muted)] hover:text-[var(--admin-text)] rounded transition-colors"
                                title="Toggle notes"
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Notes */}
                      {isExpanded && log.notes && (
                        <tr className="bg-black/[0.02] dark:bg-white/[0.02]">
                          <td colSpan={7} className="py-2.5 px-4 text-xs text-[var(--admin-muted)]">
                            <span className="font-semibold text-[var(--admin-text)] mr-2">
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
          <div className="md:hidden divide-y divide-[var(--admin-card-border)]">
            {filteredLogs.map((log) => {
              const teacherInfo = getTeacherInfo(log.staff_id);
              const isExpanded = expandedNotesId === log.id;

              return (
                <div key={log.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-black/10 dark:bg-white/10 text-[var(--admin-text)] font-bold text-xs flex items-center justify-center shrink-0">
                        {teacherInfo.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-[var(--admin-text)] truncate">
                          {teacherInfo.name}
                        </div>
                        <div className="text-[11px] text-[var(--admin-muted)]">
                          {formatPKTDate(log.clock_in_at, 'short')}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      {log.computedStatus === 'present' && (
                        <span className="status-pill-success inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Present</span>
                        </span>
                      )}
                      {log.computedStatus === 'off_duty' && (
                        <span className="status-pill-neutral inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium">
                          <span>Off duty</span>
                        </span>
                      )}
                      {log.computedStatus === 'needs_review' && (
                        <span className="status-pill-warning inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          <AlertTriangle size={11} />
                          <span>Needs review</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Punch times grid */}
                  <div className="grid grid-cols-3 gap-2 bg-black/5 dark:bg-white/5 p-2.5 rounded-xl text-xs">
                    <div>
                      <div className="text-[10px] text-[var(--admin-muted)]">Clock in</div>
                      <div className="font-semibold text-[var(--admin-text)] tabular-nums">
                        {formatPKTTime(log.clock_in_at)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--admin-muted)]">Clock out</div>
                      <div className="font-semibold text-[var(--admin-text)] tabular-nums">
                        {log.clock_out_at ? formatPKTTime(log.clock_out_at) : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--admin-muted)]">Hours</div>
                      <div className="font-semibold text-[var(--admin-text)] tabular-nums">
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
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#F2C230] hover:bg-[#e0b42c] text-[#111111] shadow-2xs"
                      >
                        Close session
                      </button>
                    ) : <span />}

                    {log.notes && (
                      <button
                        type="button"
                        onClick={() => setExpandedNotesId(isExpanded ? null : log.id)}
                        className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-text)] flex items-center gap-1"
                      >
                        <span>Notes</span>
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    )}
                  </div>

                  {isExpanded && log.notes && (
                    <div className="text-xs text-[var(--admin-muted)] p-2.5 bg-black/5 dark:bg-white/5 rounded-xl border border-[var(--admin-card-border)]">
                      {log.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Legend Under Table / Cards ── */}
      <div className="p-3.5 sm:p-4 bg-black/[0.015] dark:bg-white/[0.015] border-t border-[var(--admin-card-border)] space-y-2 text-xs text-[var(--admin-muted)]">
        <div className="text-[12px]">
          Showing {filteredLogs.length} punch {filteredLogs.length === 1 ? 'record' : 'records'} for {selectedDate ? formatPKTDate(selectedDate, 'medium') : 'all dates'} (PKT).
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[12px]">
          <span className="status-pill-success inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Present = currently clocked in</span>
          </span>
          <span className="status-pill-neutral inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-neutral-400" />
            <span>Off duty = clocked out</span>
          </span>
          <span className="status-pill-warning inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium">
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
          <div className="admin-card max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--admin-card-border)]">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-[#8A6A00] dark:text-[#F2C230]" />
                <h3 className="font-bold text-base text-[var(--admin-text)]">
                  Close Teacher Session
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSessionToClose(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--admin-muted)] hover:text-[var(--admin-text)] hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[var(--admin-muted)]">
              <div>
                <span className="font-medium">Teacher: </span>
                <span className="font-bold text-[var(--admin-text)]">{sessionToClose.teacherName}</span>
              </div>
              <div>
                <span className="font-medium">Clock-in time: </span>
                <span className="font-semibold text-[var(--admin-text)]">
                  {formatPKTDate(sessionToClose.log.clock_in_at, 'medium')} at {formatPKTTime(sessionToClose.log.clock_in_at)}
                </span>
              </div>

              <div>
                <label className="block font-medium text-[var(--admin-text)] mb-1">
                  Clock-out Date & Time (PKT)
                </label>
                <input
                  type="datetime-local"
                  value={closeClockOutTime}
                  onChange={(e) => setCloseClockOutTime(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[var(--admin-card-border)] rounded-xl bg-white dark:bg-[#18181B] text-[var(--admin-text)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--admin-text)] mb-1">
                  Administrative Note (Audited)
                </label>
                <textarea
                  rows={2}
                  value={closeAdminNotes}
                  onChange={(e) => setCloseAdminNotes(e.target.value)}
                  placeholder="Reason for closing session manually..."
                  className="w-full text-xs px-3 py-2 border border-[var(--admin-card-border)] rounded-xl bg-white dark:bg-[#18181B] text-[var(--admin-text)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--admin-card-border)]">
              <button
                type="button"
                onClick={() => setSessionToClose(null)}
                disabled={isClosingSession}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-[var(--admin-text)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseSession}
                disabled={isClosingSession}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#F2C230] hover:bg-[#e0b42c] text-[#111111] shadow-xs transition-colors flex items-center gap-1.5"
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
