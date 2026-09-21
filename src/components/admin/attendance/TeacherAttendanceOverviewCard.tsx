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
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getStaffAttendanceLogs,
  formatDurationHuman,
  formatDurationTimer,
} from '../../../lib/staffAttendanceService';
import { getAllTeachers } from '../../../lib/db';
import type { StaffAttendanceLog } from '../../../types/staffAttendance';
import type { Teacher } from '../../../types/database';

export const TeacherAttendanceOverviewCard: React.FC = () => {
  const navigate = useNavigate();

  const [logs, setLogs] = useState<StaffAttendanceLog[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'off_duty'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'teacher_name' | 'hours'>('newest');
  const [viewMode, setViewMode] = useState<'punches' | 'roster'>('punches');

  // Realtime second ticker for live clocked-in hours
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
  }, []);

  // Map of teacherId -> Teacher
  const teacherMap = useMemo(() => {
    const map = new Map<string, Teacher>();
    teachers.forEach((t) => map.set(t.id, t));
    return map;
  }, [teachers]);

  // Helper to get teacher display details
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
    // Fallback if staffId is admin or unmapped
    return {
      name: staffId === 'admin' ? 'Administrator' : `Teacher (${staffId.slice(0, 8)})`,
      email: 'Faculty Member',
      initials: staffId === 'admin' ? 'AD' : 'TC',
      avatar_url: null,
    };
  };

  // Helper to calculate total seconds for a log record
  const getLogDurationSeconds = (log: StaffAttendanceLog) => {
    if (log.clock_out_at) {
      const start = new Date(log.clock_in_at).getTime();
      const end = new Date(log.clock_out_at).getTime();
      return Math.max(0, Math.floor((end - start) / 1000));
    }
    const start = new Date(log.clock_in_at).getTime();
    return Math.max(0, Math.floor((currentTimestamp - start) / 1000));
  };

  // Filtered & Sorted activity logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        // Date filter (selectedDate can be empty for 'all')
        if (selectedDate && !log.clock_in_at.startsWith(selectedDate)) {
          return false;
        }

        // Teacher filter
        if (selectedTeacherId !== 'all' && log.staff_id !== selectedTeacherId) {
          return false;
        }

        // Status filter: Present = currently clocked in (!clock_out_at), Off Duty = clocked out (!!clock_out_at)
        const isPresent = !log.clock_out_at;
        if (statusFilter === 'present' && !isPresent) return false;
        if (statusFilter === 'off_duty' && isPresent) return false;

        // Search Query (teacher name or notes)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const info = getTeacherInfo(log.staff_id);
          const nameMatch = info.name.toLowerCase().includes(q);
          const notesMatch = log.notes ? log.notes.toLowerCase().includes(q) : false;
          if (!nameMatch && !notesMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.clock_in_at).getTime() - new Date(a.clock_in_at).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.clock_in_at).getTime() - new Date(b.clock_in_at).getTime();
        }
        if (sortBy === 'teacher_name') {
          const nameA = getTeacherInfo(a.staff_id).name;
          const nameB = getTeacherInfo(b.staff_id).name;
          return nameA.localeCompare(nameB);
        }
        if (sortBy === 'hours') {
          return getLogDurationSeconds(b) - getLogDurationSeconds(a);
        }
        return 0;
      });
  }, [logs, selectedDate, selectedTeacherId, statusFilter, searchQuery, sortBy, teacherMap, currentTimestamp]);

  // Daily summary stats (scoped to selected date, or today if all selected)
  const statsScopeDate = selectedDate || todayStr;
  const dateLogs = useMemo(() => {
    return logs.filter((l) => l.clock_in_at.startsWith(statsScopeDate));
  }, [logs, statsScopeDate]);

  const activeClockedInCount = useMemo(() => {
    return logs.filter((l) => !l.clock_out_at).length;
  }, [logs]);

  const totalHoursSecondsForDate = useMemo(() => {
    return dateLogs.reduce((acc, log) => acc + getLogDurationSeconds(log), 0);
  }, [dateLogs, currentTimestamp]);

  // Teachers presence roster for statsScopeDate (all registered teachers)
  const teacherRoster = useMemo(() => {
    return teachers.map((teacher) => {
      const teacherLogs = logs.filter(
        (l) => l.staff_id === teacher.id && l.clock_in_at.startsWith(statsScopeDate)
      );
      const activePunch = teacherLogs.find((l) => !l.clock_out_at);
      const isPresent = !!activePunch;
      const totalSeconds = teacherLogs.reduce((acc, l) => acc + getLogDurationSeconds(l), 0);

      const firstClockIn = teacherLogs.length > 0
        ? teacherLogs.reduce((earliest, l) => {
            return new Date(l.clock_in_at) < new Date(earliest.clock_in_at) ? l : earliest;
          }, teacherLogs[0])
        : null;

      const lastClockOut = teacherLogs.length > 0
        ? teacherLogs.reduce((latest, l) => {
            if (!l.clock_out_at) return latest;
            if (!latest || !latest.clock_out_at) return l;
            return new Date(l.clock_out_at) > new Date(latest.clock_out_at) ? l : latest;
          }, null as StaffAttendanceLog | null)
        : null;

      return {
        teacher,
        isPresent,
        activePunch,
        punchesCount: teacherLogs.length,
        totalSeconds,
        firstClockIn: firstClockIn ? firstClockIn.clock_in_at : null,
        lastClockOut: lastClockOut ? lastClockOut.clock_out_at : null,
        logs: teacherLogs,
      };
    });
  }, [teachers, logs, statsScopeDate, currentTimestamp]);

  const filteredRoster = useMemo(() => {
    return teacherRoster.filter((item) => {
      if (selectedTeacherId !== 'all' && item.teacher.id !== selectedTeacherId) return false;
      if (statusFilter === 'present' && !item.isPresent) return false;
      if (statusFilter === 'off_duty' && item.isPresent) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!item.teacher.full_name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [teacherRoster, selectedTeacherId, statusFilter, searchQuery]);

  const formatDisplayDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoStr.slice(0, 10);
    }
  };

  const formatDisplayTime = (isoStr?: string | null) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const setDateShortcut = (type: 'today' | 'yesterday' | 'all') => {
    if (type === 'today') {
      setSelectedDate(todayStr);
    } else if (type === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      setSelectedDate(y.toISOString().slice(0, 10));
    } else {
      setSelectedDate('');
    }
  };

  return (
    <div
      id="teacher-attendance-overview-card"
      className="card card-elevated interactive bg-white dark:bg-[#18181B] border border-[#E5E5E5] dark:border-[#27272A] rounded-2xl shadow-xs overflow-hidden"
    >
      {/* ── Card Header Strip ── */}
      <div className="p-5 border-b border-[#F0F0F0] dark:border-[#27272A] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#111111] dark:bg-amber-500/10 text-[#F4C430] dark:text-[#F4C430] flex items-center justify-center font-bold shadow-xs">
            <Clock size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-[#111111] dark:text-[#F4F4F5] tracking-tight">
                Teacher Attendance & Timecard Overview
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                All Faculty
              </span>
            </div>
            <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-0.5">
              Live clock-in & clock-out activity across all instructors • Scoped to admin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="admin-attendance-refresh-btn"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 interactive dark:bg-[#27272A] dark:text-[#F4F4F5] dark:border-[#3F3F46]"
            title="Refresh attendance records"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/attendance')}
            className="btn btn-primary text-xs flex items-center gap-1 py-1.5 px-3 shadow-xs"
            title="Go to full Attendance Center"
          >
            <span>Full Attendance Center</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Summary Counters Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-[#FAFAFA] dark:bg-[#141416] border-b border-[#F0F0F0] dark:border-[#27272A]">
        <div className="p-3 bg-white dark:bg-[#202024] rounded-xl border border-[#E5E5E5] dark:border-[#27272A] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck size={16} />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#737373] dark:text-[#A1A1AA]">Currently Present</div>
            <div className="text-base font-black text-[#111111] dark:text-[#F4F4F5] flex items-center gap-1.5">
              <span>{activeClockedInCount}</span>
              {activeClockedInCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-[#202024] rounded-xl border border-[#E5E5E5] dark:border-[#27272A] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center shrink-0">
            <UserX size={16} />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#737373] dark:text-[#A1A1AA]">Off Duty (Total)</div>
            <div className="text-base font-black text-[#111111] dark:text-[#F4F4F5]">
              {Math.max(0, teachers.length - activeClockedInCount)}
            </div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-[#202024] rounded-xl border border-[#E5E5E5] dark:border-[#27272A] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock size={16} />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#737373] dark:text-[#A1A1AA]">
              {selectedDate === todayStr ? "Today's Total Hours" : 'Logged Hours'}
            </div>
            <div className="text-base font-black text-[#111111] dark:text-[#F4F4F5]">
              {formatDurationHuman(totalHoursSecondsForDate)}
            </div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-[#202024] rounded-xl border border-[#E5E5E5] dark:border-[#27272A] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Calendar size={16} />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#737373] dark:text-[#A1A1AA]">Punches Logged</div>
            <div className="text-base font-black text-[#111111] dark:text-[#F4F4F5]">
              {dateLogs.length} {dateLogs.length === 1 ? 'record' : 'records'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters & Controls Toolbar ── */}
      <div className="p-4 bg-white dark:bg-[#18181B] border-b border-[#F0F0F0] dark:border-[#27272A] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Date Shortcuts & Date Picker */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#737373] dark:text-[#A1A1AA] uppercase tracking-wide mr-1">
              Date:
            </span>
            <button
              type="button"
              id="admin-date-today-btn"
              onClick={() => setDateShortcut('today')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                selectedDate === todayStr
                  ? 'bg-[#111111] text-[#F4C430] dark:bg-[#F4C430] dark:text-[#111111]'
                  : 'bg-neutral-100 text-[#737373] hover:bg-neutral-200 dark:bg-[#27272A] dark:text-[#A1A1AA]'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              id="admin-date-yesterday-btn"
              onClick={() => setDateShortcut('yesterday')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                selectedDate && selectedDate !== todayStr && selectedDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10)
                  ? 'bg-[#111111] text-[#F4C430] dark:bg-[#F4C430] dark:text-[#111111]'
                  : 'bg-neutral-100 text-[#737373] hover:bg-neutral-200 dark:bg-[#27272A] dark:text-[#A1A1AA]'
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              id="admin-date-all-btn"
              onClick={() => setDateShortcut('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                selectedDate === ''
                  ? 'bg-[#111111] text-[#F4C430] dark:bg-[#F4C430] dark:text-[#111111]'
                  : 'bg-neutral-100 text-[#737373] hover:bg-neutral-200 dark:bg-[#27272A] dark:text-[#A1A1AA]'
              }`}
            >
              All Dates
            </button>

            <div className="flex items-center gap-1.5 ml-1">
              <input
                type="date"
                id="admin-teacher-attendance-date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs px-2.5 py-1 border border-[#E5E5E5] dark:border-[#27272A] rounded-lg bg-white dark:bg-[#202024] text-[#111111] dark:text-[#F4F4F5] focus:outline-hidden focus:border-[#111111]"
              />
            </div>
          </div>

          {/* View Mode Toggle: All Punches vs Teacher Daily Roster */}
          <div className="flex items-center bg-[#F4F4F5] dark:bg-[#27272A] p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              id="admin-view-punches-btn"
              onClick={() => setViewMode('punches')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === 'punches'
                  ? 'bg-white dark:bg-[#18181B] text-[#111111] dark:text-[#F4F4F5] shadow-xs'
                  : 'text-[#737373] dark:text-[#A1A1AA] hover:text-[#111111]'
              }`}
            >
              Activity Logs ({filteredLogs.length})
            </button>
            <button
              type="button"
              id="admin-view-roster-btn"
              onClick={() => setViewMode('roster')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === 'roster'
                  ? 'bg-white dark:bg-[#18181B] text-[#111111] dark:text-[#F4F4F5] shadow-xs'
                  : 'text-[#737373] dark:text-[#A1A1AA] hover:text-[#111111]'
              }`}
            >
              Teacher Roster ({filteredRoster.length})
            </button>
          </div>
        </div>

        {/* Second Row: Teacher Select, Status Select, Search & Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-[#F5F5F5] dark:border-[#27272A]">
          {/* Teacher Selector */}
          <div>
            <select
              id="admin-teacher-filter-select"
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-[#E5E5E5] dark:border-[#27272A] rounded-lg bg-white dark:bg-[#202024] text-[#111111] dark:text-[#F4F4F5] focus:outline-hidden focus:border-[#111111]"
            >
              <option value="all">All Teachers ({teachers.length})</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              id="admin-status-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full text-xs px-2.5 py-1.5 border border-[#E5E5E5] dark:border-[#27272A] rounded-lg bg-white dark:bg-[#202024] text-[#111111] dark:text-[#F4F4F5] focus:outline-hidden focus:border-[#111111]"
            >
              <option value="all">All Statuses (Present & Off Duty)</option>
              <option value="present">Present (Clocked In Now)</option>
              <option value="off_duty">Off Duty (Clocked Out)</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-[#A3A3A3]" />
            <input
              type="text"
              id="admin-teacher-attendance-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teacher or notes..."
              className="w-full text-xs pl-8 pr-2.5 py-1.5 border border-[#E5E5E5] dark:border-[#27272A] rounded-lg bg-white dark:bg-[#202024] text-[#111111] dark:text-[#F4F4F5] placeholder:text-[#A3A3A3] focus:outline-hidden focus:border-[#111111]"
            />
          </div>

          {/* Sort Selector */}
          <div>
            <select
              id="admin-sort-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs px-2.5 py-1.5 border border-[#E5E5E5] dark:border-[#27272A] rounded-lg bg-white dark:bg-[#202024] text-[#111111] dark:text-[#F4F4F5] focus:outline-hidden focus:border-[#111111]"
            >
              <option value="newest">Sort: Newest Punch First</option>
              <option value="oldest">Sort: Oldest Punch First</option>
              <option value="teacher_name">Sort: Teacher Name (A-Z)</option>
              <option value="hours">Sort: Total Hours (Highest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Content View ── */}
      {loading ? (
        <div className="p-8 space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-12 bg-neutral-100 dark:bg-[#202024] rounded-xl w-full" />
          ))}
        </div>
      ) : viewMode === 'punches' ? (
        /* ── VIEW MODE: Granular Activity Punches ── */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F8F8] dark:bg-[#202024] border-b border-[#E5E5E5] dark:border-[#27272A] text-[#737373] dark:text-[#A1A1AA] font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Teacher</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Total Hours</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Session Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0] dark:divide-[#27272A]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#A3A3A3] dark:text-[#71717A]">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <Clock size={28} className="mx-auto text-[#D4D4D4] dark:text-[#3F3F46]" />
                      <div className="font-bold text-xs text-[#111111] dark:text-[#F4F4F5]">
                        No Attendance Activity Found
                      </div>
                      <p className="text-[11px] text-[#737373] dark:text-[#A1A1AA]">
                        {selectedDate
                          ? `No teachers recorded clock-in activity on ${formatDisplayDate(selectedDate)}.`
                          : 'No activity matches the current filters.'}
                      </p>
                      {selectedDate !== todayStr && (
                        <button
                          type="button"
                          onClick={() => setSelectedDate(todayStr)}
                          className="btn btn-secondary btn-xs mt-2"
                        >
                          Switch to Today
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const teacherInfo = getTeacherInfo(log.staff_id);
                  const isPresent = !log.clock_out_at;
                  const durationSec = getLogDurationSeconds(log);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-[#FAFAFA] dark:hover:bg-[#202024]/60 transition-colors"
                    >
                      {/* Teacher */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {teacherInfo.avatar_url ? (
                            <img
                              src={teacherInfo.avatar_url}
                              alt={teacherInfo.name}
                              className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#E5E5E5] dark:border-[#27272A]"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#F4C430] text-[#111111] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {teacherInfo.initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-[#111111] dark:text-[#F4F4F5] truncate">
                              {teacherInfo.name}
                            </div>
                            <div className="text-[10px] text-[#737373] dark:text-[#A1A1AA] truncate">
                              {teacherInfo.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-medium text-[#111111] dark:text-[#F4F4F5] whitespace-nowrap">
                        {formatDisplayDate(log.clock_in_at)}
                      </td>

                      {/* Clock In */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-[#111111] dark:text-[#F4F4F5]">
                          {formatDisplayTime(log.clock_in_at)}
                        </div>
                        <div className="text-[10px] text-[#737373] dark:text-[#A1A1AA]">
                          Seg {log.segment_index + 1}
                        </div>
                      </td>

                      {/* Clock Out */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.clock_out_at ? (
                          <div className="font-mono font-medium text-[#111111] dark:text-[#F4F4F5]">
                            {formatDisplayTime(log.clock_out_at)}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/50 text-[10px] uppercase tracking-wide animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>In Progress</span>
                          </span>
                        )}
                      </td>

                      {/* Total Hours */}
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-[#111111] dark:text-[#F4F4F5]">
                        <span className="font-mono">
                          {isPresent ? formatDurationTimer(durationSec) : formatDurationHuman(durationSec)}
                        </span>
                        {isPresent && (
                          <div className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Active Session
                          </div>
                        )}
                      </td>

                      {/* Status (Present / Off Duty) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {isPresent ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-ping" />
                              <span>Present</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 dark:bg-[#27272A] dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                              <span>Off Duty</span>
                            </span>
                          )}

                          {/* Secondary status flags */}
                          {log.status === 'late' && (
                            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-900/40">
                              Late Punch
                            </span>
                          )}
                          {log.status === 'auto_clocked_out' && (
                            <span className="text-[9px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-900/40">
                              Auto Out
                            </span>
                          )}
                          {log.idle_flagged && (
                            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-900/40">
                              Idle Flagged
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4 text-[#737373] dark:text-[#A1A1AA] max-w-xs truncate">
                        {log.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── VIEW MODE: Daily Teacher Roster (Shows ALL teachers and their presence) ── */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F8F8] dark:bg-[#202024] border-b border-[#E5E5E5] dark:border-[#27272A] text-[#737373] dark:text-[#A1A1AA] font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Teacher</th>
                <th className="py-3 px-4">Status Today</th>
                <th className="py-3 px-4">First Clock In</th>
                <th className="py-3 px-4">Last Clock Out</th>
                <th className="py-3 px-4">Total Time Today</th>
                <th className="py-3 px-4">Punches</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0] dark:divide-[#27272A]">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#A3A3A3] dark:text-[#71717A]">
                    No teachers match the current filters.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((item) => {
                  const initials = item.teacher.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr
                      key={item.teacher.id}
                      className="hover:bg-[#FAFAFA] dark:hover:bg-[#202024]/60 transition-colors"
                    >
                      {/* Teacher */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {item.teacher.avatar_url ? (
                            <img
                              src={item.teacher.avatar_url}
                              alt={item.teacher.full_name}
                              className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#E5E5E5] dark:border-[#27272A]"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#F4C430] text-[#111111] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-[#111111] dark:text-[#F4F4F5] truncate">
                              {item.teacher.full_name}
                            </div>
                            <div className="text-[10px] text-[#737373] dark:text-[#A1A1AA] truncate">
                              {item.teacher.email || (item.teacher.phone ? `Phone: ${item.teacher.phone}` : 'Faculty Instructor')}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.isPresent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-ping" />
                            <span>Present</span>
                          </span>
                        ) : item.punchesCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 dark:bg-[#27272A] dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                            <span>Off Duty (Completed)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-50 text-neutral-400 dark:bg-neutral-900 dark:text-neutral-500 border border-neutral-200 dark:border-neutral-800">
                            <span>Not Clocked In Today</span>
                          </span>
                        )}
                      </td>

                      {/* First Clock In */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        {item.firstClockIn ? formatDisplayTime(item.firstClockIn) : '—'}
                      </td>

                      {/* Last Clock Out */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        {item.isPresent ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">In Progress</span>
                        ) : item.lastClockOut ? (
                          formatDisplayTime(item.lastClockOut)
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Total Time */}
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-[#111111] dark:text-[#F4F4F5] font-mono">
                        {item.totalSeconds > 0 ? formatDurationHuman(item.totalSeconds) : '0m'}
                      </td>

                      {/* Punches Count */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-[#737373] dark:text-[#A1A1AA]">
                          {item.punchesCount} {item.punchesCount === 1 ? 'shift block' : 'shift blocks'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTeacherId(item.teacher.id);
                            setViewMode('punches');
                          }}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <span>View Logs</span>
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Footer Strip ── */}
      <div className="p-3.5 bg-[#FAFAFA] dark:bg-[#141416] border-t border-[#F0F0F0] dark:border-[#27272A] flex flex-wrap items-center justify-between gap-3 text-xs text-[#737373] dark:text-[#A1A1AA]">
        <div className="flex items-center gap-2">
          <span>
            Displaying {viewMode === 'punches' ? `${filteredLogs.length} punch records` : `${filteredRoster.length} teachers`} for {selectedDate ? formatDisplayDate(selectedDate) : 'all dates'}.
          </span>
        </div>
        <div className="flex items-center gap-3 font-semibold">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Present = Currently Clocked In</span>
          </span>
          <span className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-neutral-400" />
            <span>Off Duty = Clocked Out</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendanceOverviewCard;
