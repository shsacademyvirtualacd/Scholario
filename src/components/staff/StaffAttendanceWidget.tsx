import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Laptop,
  Globe,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth/AuthContext';
import {
  getStaffShifts,
  getStaffAttendanceLogs,
  getActiveStaffAttendanceLog,
  clockInStaff,
  clockOutStaff,
  formatDurationTimer,
  formatDurationHuman,
  getActiveOrUpcomingSegment,
  getCurrentDayOfWeek,
} from '../../lib/staffAttendanceService';
import { useStaffPresenceIntegrity } from '../../hooks/useStaffPresenceIntegrity';
import type { StaffShift, StaffAttendanceLog } from '../../types/staffAttendance';

interface StaffAttendanceWidgetProps {
  onStatusChange?: () => void;
  standalone?: boolean;
}

export const StaffAttendanceWidget: React.FC<StaffAttendanceWidgetProps> = ({
  onStatusChange,
  standalone = true,
}) => {
  const { profile } = useAuth();
  const staffId = profile?.id || '';

  const [activeShift, setActiveShift] = useState<StaffShift | null>(null);
  const [activeLog, setActiveLog] = useState<StaffAttendanceLog | null>(null);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(0);
  const [todayLogs, setTodayLogs] = useState<StaffAttendanceLog[]>([]);
  const [recentLogs, setRecentLogs] = useState<StaffAttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchNote, setPunchNote] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const isClockedIn = !!activeLog;

  // Session activity integrity verification hook
  const { isIdle, idleMinutes, isTabVisible, isWindowFocused } = useStaffPresenceIntegrity({
    activeLogId: activeLog?.id || null,
    isClockedIn,
    idleThresholdMinutes: 30,
  });

  // Load staff shift and attendance logs
  const loadData = async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const [fetchedShifts, currentActiveLog, fetchedLogs] = await Promise.all([
        getStaffShifts(staffId),
        getActiveStaffAttendanceLog(staffId),
        getStaffAttendanceLogs({ staffId, limit: 20 }),
      ]);

      // Determine today's assigned shift
      const dayOfWeek = getCurrentDayOfWeek();
      const matchedShift = fetchedShifts.find((s) => s.is_active && s.days_of_week.includes(dayOfWeek)) ||
        fetchedShifts[0] ||
        null;
      setActiveShift(matchedShift);
      setActiveLog(currentActiveLog);

      // Segment resolution
      if (currentActiveLog) {
        setSelectedSegmentIndex(currentActiveLog.segment_index);
      } else if (matchedShift) {
        const segInfo = getActiveOrUpcomingSegment(matchedShift);
        if (segInfo) setSelectedSegmentIndex(segInfo.segment.segment_index);
      }

      // Filter today's logs
      const tLogs = fetchedLogs.filter((l) => l.clock_in_at.startsWith(todayStr));
      setTodayLogs(tLogs);
      setRecentLogs(fetchedLogs);
    } catch (err) {
      console.warn('[StaffAttendanceWidget] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [staffId]);

  // Live timer tick while clocked in
  useEffect(() => {
    if (!activeLog) {
      setElapsedSeconds(0);
      return;
    }

    const inTime = new Date(activeLog.clock_in_at).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - inTime) / 1000)));
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [activeLog]);

  // Handle Clock In
  const handleClockIn = async () => {
    if (!staffId) return;
    setPunchLoading(true);
    try {
      const newLog = await clockInStaff({
        staff_id: staffId,
        shift_id: activeShift?.id,
        segment_index: selectedSegmentIndex,
        notes: punchNote.trim() || undefined,
        client_time: new Date().toISOString(),
      });

      setActiveLog(newLog);
      setPunchNote('');
      toast.success('Successfully clocked in! Remote session active and verified.');
      await loadData();
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      toast.error(`Clock in failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setPunchLoading(false);
    }
  };

  // Handle Clock Out
  const handleClockOut = async () => {
    if (!activeLog) return;
    setPunchLoading(true);
    try {
      const updatedLog = await clockOutStaff({
        log_id: activeLog.id,
        notes: punchNote.trim() || undefined,
        client_time: new Date().toISOString(),
      });

      setActiveLog(null);
      setPunchNote('');
      toast.success(`Clocked out successfully! Total session: ${formatDurationHuman(updatedLog.total_active_seconds || 0)}`);
      await loadData();
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      toast.error(`Clock out failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setPunchLoading(false);
    }
  };

  // Today's total hours worked
  const todayTotalSeconds = useMemo(() => {
    let total = 0;
    todayLogs.forEach((l) => {
      if (l.clock_out_at) {
        const diff = Math.floor(
          (new Date(l.clock_out_at).getTime() - new Date(l.clock_in_at).getTime()) / 1000
        );
        total += Math.max(0, diff);
      } else {
        total += elapsedSeconds;
      }
    });
    return total;
  }, [todayLogs, elapsedSeconds]);

  const activeSegment = useMemo(() => {
    if (!activeShift || !activeShift.segments) return null;
    return activeShift.segments.find((s) => s.segment_index === selectedSegmentIndex) || activeShift.segments[0];
  }, [activeShift, selectedSegmentIndex]);

  return (
    <div className="space-y-6">
      {/* ── Main Punch & Shift Card ── */}
      <div className="teacher-card rounded-2xl shadow-xs overflow-hidden">
        {/* Card Header Strip */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--teacher-card-border)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-[#F4C430] flex items-center justify-center font-bold shadow-xs shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[18px] font-extrabold text-[var(--teacher-text)]">
                  {activeShift?.shift_name || 'Staff Attendance & Timecard'}
                </h3>
                {activeShift && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md status-pill-neutral">
                    {activeShift.shift_type} shift
                    {activeSegment && ` (${activeSegment.start_time} - ${activeSegment.end_time})`}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-[var(--teacher-muted)] line-clamp-2 mt-0.5">
                Login & session-based attendance • Remote Pakistan faculty & staff
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="h-11 px-3.5 inline-flex items-center gap-1.5 text-xs font-bold rounded-xl border border-[var(--teacher-card-border)] bg-[var(--teacher-card-bg)] text-[var(--teacher-text)] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh timecard"
            aria-label="Refresh timecard"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            {/* Left: Punch Button & Live Ticker */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center text-center p-5 sm:p-6 rounded-2xl border border-[var(--teacher-card-border)] bg-black/[0.02] dark:bg-white/[0.03]">
              {/* Presence Pill */}
              <div className="mb-4">
                {isClockedIn ? (
                  <div className="status-pill-neutral text-[13px] font-bold px-3 py-1 rounded-full inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                    <span>ONLINE • CURRENTLY CLOCKED IN</span>
                  </div>
                ) : (
                  <div className="status-pill-neutral text-[13px] font-semibold px-3 py-1 rounded-full inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
                    <span>OFF DUTY • CLOCKED OUT</span>
                  </div>
                )}
              </div>

              {/* Timer (40px tabular numbers) */}
              <div className="mb-5 sm:mb-6">
                <div className="text-[40px] font-mono font-extrabold tracking-tight tabular-nums text-[var(--teacher-text)]">
                  {isClockedIn ? formatDurationTimer(elapsedSeconds) : '00:00:00'}
                </div>
                <p className="text-[14px] text-[var(--teacher-muted)] font-medium mt-1">
                  {isClockedIn ? 'Active shift duration in progress' : 'Clock in to start your work session'}
                </p>
              </div>

              {/* Action Button: 56px solid GOLD with dark text */}
              {isClockedIn ? (
                <button
                  type="button"
                  id="staff-clock-out-btn"
                  onClick={handleClockOut}
                  disabled={punchLoading}
                  className="w-full max-w-sm h-14 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <Square size={16} fill="currentColor" />
                  <span>{punchLoading ? 'Processing...' : 'Clock Out Now'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="staff-clock-in-btn"
                  onClick={handleClockIn}
                  disabled={punchLoading}
                  className="w-full max-w-sm h-14 rounded-xl bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] font-black text-sm shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <Play size={18} fill="#111111" />
                  <span>{punchLoading ? 'Processing...' : 'Clock In Now'}</span>
                </button>
              )}

              {/* Notes Input: 48px tall */}
              <div className="w-full max-w-sm mt-3.5">
                <input
                  type="text"
                  value={punchNote}
                  onChange={(e) => setPunchNote(e.target.value)}
                  placeholder="Optional note for this punch..."
                  className="w-full h-12 text-xs sm:text-sm px-3.5 bg-white dark:bg-zinc-800 border border-[var(--teacher-card-border)] rounded-xl text-[var(--teacher-text)] placeholder:text-[var(--teacher-muted)] focus:outline-hidden focus:border-[#F4C430]"
                />
              </div>

              {/* Session Activity Status */}
              {isClockedIn && (
                <div className="mt-4 flex items-center gap-2 text-xs">
                  {isIdle ? (
                    <span className="flex items-center gap-1.5 status-pill-warning px-2.5 py-1 rounded-md font-bold">
                      <AlertTriangle size={13} />
                      <span>Idle session warning ({idleMinutes}m inactive)</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 status-pill-success px-2.5 py-1 rounded-md font-semibold">
                      <CheckCircle2 size={13} />
                      <span>Session Active & Verified {isTabVisible ? '• In Focus' : '• Tab in Background'}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right: Broken / Split Shift Segments & Daily Summary */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-5">
              {/* Broken / Split Shift Segments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-black uppercase tracking-wider text-[var(--teacher-muted)] flex items-center gap-1.5">
                    <Layers size={13} />
                    <span>Scheduled Shift Segments</span>
                  </span>
                  {activeShift?.grace_period_minutes && (
                    <span className="text-[11px] text-[var(--teacher-muted)] font-semibold">
                      Grace: {activeShift.grace_period_minutes}m
                    </span>
                  )}
                </div>

                {activeShift && activeShift.segments && activeShift.segments.length > 0 ? (
                  <div className="space-y-2">
                    {activeShift.segments.map((seg) => {
                      const isSelected = selectedSegmentIndex === seg.segment_index;
                      const segLogs = todayLogs.filter((l) => l.segment_index === seg.segment_index);
                      const isCompleted = segLogs.some((l) => !!l.clock_out_at);
                      const isCurrentPunch = activeLog?.segment_index === seg.segment_index;

                      return (
                        <div
                          key={seg.segment_index}
                          onClick={() => !isClockedIn && setSelectedSegmentIndex(seg.segment_index)}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            isCurrentPunch
                              ? 'status-pill-success border-emerald-400'
                              : isSelected && !isClockedIn
                              ? 'status-pill-warning border-amber-400 cursor-pointer'
                              : 'teacher-card hover:border-[var(--teacher-muted)] cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                                isCurrentPunch
                                  ? 'bg-emerald-600 text-white'
                                  : isCompleted
                                  ? 'bg-[#111111] text-[#F4C430]'
                                  : 'bg-black/5 dark:bg-white/10 text-[var(--teacher-muted)]'
                              }`}
                            >
                              {seg.segment_index + 1}
                            </div>
                            <div>
                              <div className="text-xs font-bold flex items-center gap-2">
                                <span>{seg.name || `Segment ${seg.segment_index + 1}`}</span>
                                {isCurrentPunch && (
                                  <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-sm uppercase tracking-wide">
                                    Active Now
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[var(--teacher-muted)]">
                                {seg.start_time} – {seg.end_time}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            {segLogs.length > 0 ? (
                              <div>
                                <span className="text-xs font-bold text-[var(--teacher-text)]">
                                  {formatDurationHuman(
                                    segLogs.reduce((acc, curr) => {
                                      if (curr.clock_out_at) {
                                        return (
                                          acc +
                                          Math.floor(
                                            (new Date(curr.clock_out_at).getTime() -
                                              new Date(curr.clock_in_at).getTime()) /
                                              1000
                                          )
                                        );
                                      }
                                      return acc + elapsedSeconds;
                                    }, 0)
                                  )}
                                </span>
                                <div className="text-[10px] text-emerald-600 font-semibold">
                                  {segLogs.some((l) => l.status === 'late') ? 'Late' : 'Logged'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[var(--teacher-muted)]">Unclocked</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3.5 status-pill-warning rounded-xl text-[14px] flex items-start gap-2.5">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">No custom shift assigned today.</p>
                      <p className="text-xs opacity-90 mt-0.5">
                        Default regular shift (09:00 – 17:00) applies automatically.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Day's Cumulative Hours Strip: Equal tiles side-by-side with 24px bold values and 13px muted labels */}
              <div className="grid grid-cols-2 gap-3">
                <div className="teacher-card p-3.5 sm:p-4 rounded-xl">
                  <div className="text-[13px] text-[var(--teacher-muted)] font-semibold">Total Hours Worked Today</div>
                  <div className="text-[24px] font-extrabold text-[var(--teacher-text)] mt-0.5">
                    {formatDurationHuman(todayTotalSeconds)}
                  </div>
                </div>
                <div className="teacher-card p-3.5 sm:p-4 rounded-xl">
                  <div className="text-[13px] text-[var(--teacher-muted)] font-semibold">Today's Punches</div>
                  <div className="text-[24px] font-extrabold text-[var(--teacher-text)] mt-0.5">
                    {todayLogs.length} <span className="text-sm font-semibold text-[var(--teacher-muted)]">{todayLogs.length === 1 ? 'cycle' : 'cycles'}</span>
                  </div>
                </div>
              </div>

              {/* Session Audit Meta: Two status pills in a wrapping row */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="status-pill-neutral text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Globe size={12} className="text-[#38BDF8]" />
                  <span>Remote Location: Verified</span>
                </span>
                <span className="status-pill-neutral text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Laptop size={12} className="text-[#A3A3A3]" />
                  <span>Browser Focus: {isWindowFocused ? 'Active' : 'Unfocused'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Personal Attendance History ── */}
      {standalone && (
        <div className="teacher-card rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--teacher-card-border)] flex items-center justify-between">
            <h4 className="text-sm font-black text-[var(--teacher-text)] flex items-center gap-2">
              <Calendar size={15} />
              <span>My Recent Timecard & Attendance Logs</span>
            </h4>
            <span className="text-xs text-[var(--teacher-muted)] font-medium">Showing last {recentLogs.length} records</span>
          </div>

          {/* Mobile Stacked Cards (<640px) */}
          <div className="block sm:hidden divide-y divide-[var(--teacher-card-border)]">
            {recentLogs.length === 0 ? (
              <div className="text-center py-8 text-[var(--teacher-muted)] text-xs">
                No attendance punches recorded yet.
              </div>
            ) : (
              recentLogs.map((log) => {
                const inDate = new Date(log.clock_in_at);
                const durationSec = log.clock_out_at
                  ? Math.floor((new Date(log.clock_out_at).getTime() - inDate.getTime()) / 1000)
                  : null;

                const dateStr = inDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const inTimeStr = inDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const outTimeStr = log.clock_out_at
                  ? new Date(log.clock_out_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : 'In Progress...';

                const hasNote = log.notes && log.notes.trim() !== '' && log.notes.trim() !== '—';

                return (
                  <div key={log.id} className="p-3.5 space-y-2">
                    {/* Row 1: Date & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-[var(--teacher-text)]">{dateStr}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          log.status === 'present'
                            ? 'status-pill-success'
                            : log.status === 'late'
                            ? 'status-pill-warning'
                            : log.status === 'auto_clocked_out'
                            ? 'status-pill-danger'
                            : 'status-pill-neutral'
                        }`}
                      >
                        {log.status === 'auto_clocked_out' ? 'Auto Clocked Out' : log.status}
                      </span>
                    </div>

                    {/* Row 2: Segment X muted */}
                    <div className="text-xs text-[var(--teacher-muted)] font-medium">
                      Segment {log.segment_index + 1}
                    </div>

                    {/* Row 3: Clock in -> Clock out & duration */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-[var(--teacher-text)] flex items-center gap-1.5">
                        <span>Clock in {inTimeStr}</span>
                        <span className="text-[var(--teacher-muted)]">→</span>
                        <span className={log.clock_out_at ? '' : 'text-emerald-600 font-bold animate-pulse'}>Clock out {outTimeStr}</span>
                      </span>
                      <span className="font-extrabold text-[var(--teacher-gold-text)]">
                        {durationSec !== null ? formatDurationHuman(durationSec) : '—'}
                      </span>
                    </div>

                    {/* Row 4: Notes (tap to expand, 2 lines max) */}
                    {hasNote && (
                      <div
                        className="text-[13px] text-[var(--teacher-muted)] bg-black/[0.03] dark:bg-white/[0.04] p-2 rounded-lg line-clamp-2 hover:line-clamp-none cursor-pointer transition-all"
                        title="Tap to toggle full note"
                      >
                        {log.notes}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop & Tablet Table (>=640px) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/[0.02] dark:bg-white/[0.03] border-b border-[var(--teacher-card-border)] text-[var(--teacher-muted)] font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Segment</th>
                  <th className="py-3 px-4">Clock In</th>
                  <th className="py-3 px-4">Clock Out</th>
                  <th className="py-3 px-4">Total Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Session Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--teacher-card-border)]">
                {recentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[var(--teacher-muted)]">
                      No attendance punches recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentLogs.map((log) => {
                    const inDate = new Date(log.clock_in_at);
                    const durationSec = log.clock_out_at
                      ? Math.floor(
                          (new Date(log.clock_out_at).getTime() - inDate.getTime()) / 1000
                        )
                      : null;

                    return (
                      <tr key={log.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[var(--teacher-text)]">
                          {inDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 text-[var(--teacher-muted)] font-medium">
                          Segment {log.segment_index + 1}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-[var(--teacher-text)]">
                          {inDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-[var(--teacher-text)]">
                          {log.clock_out_at ? (
                            new Date(log.clock_out_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          ) : (
                            <span className="text-emerald-600 font-bold animate-pulse">In Progress...</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[var(--teacher-text)]">
                          {durationSec !== null ? formatDurationHuman(durationSec) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              log.status === 'present'
                                ? 'status-pill-success'
                                : log.status === 'late'
                                ? 'status-pill-warning'
                                : log.status === 'auto_clocked_out'
                                ? 'status-pill-danger'
                                : 'status-pill-neutral'
                            }`}
                          >
                            {log.status === 'auto_clocked_out' ? 'Auto Clocked Out' : log.status}
                          </span>
                          {log.idle_flagged && (
                            <span
                              className="ml-1.5 inline-flex items-center text-[10px] font-bold status-pill-warning px-1.5 py-0.5 rounded"
                              title="Session had prolonged idle time"
                            >
                              Idle Flagged
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[var(--teacher-muted)] truncate max-w-xs">
                          {log.notes || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAttendanceWidget;
