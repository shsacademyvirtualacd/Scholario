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
      <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-xs overflow-hidden">
        {/* Card Header Strip */}
        <div className="px-6 py-4 bg-[#FAFAFA] border-b border-[#E5E5E5] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-[#F4C430] flex items-center justify-center font-bold shadow-xs">
              <Clock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#111111]">
                  {activeShift?.shift_name || 'Staff Attendance & Timecard'}
                </h3>
                {activeShift && (
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      activeShift.shift_type === 'broken' || activeShift.shift_type === 'split'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {activeShift.shift_type} shift
                    {activeSegment && ` (${activeSegment.start_time} - ${activeSegment.end_time})`}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#737373] mt-0.5">
                Login & session-based attendance • Remote Pakistan faculty & staff
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
            title="Refresh timecard"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Punch Button & Live Ticker */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center text-center p-6 bg-[#FAFAFA] rounded-2xl border border-[#EBEBEB]">
              {/* Presence Pill */}
              <div className="mb-4">
                {isClockedIn ? (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span>ONLINE • CURRENTLY CLOCKED IN</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-200 text-neutral-700 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
                    <span>OFF DUTY • CLOCKED OUT</span>
                  </div>
                )}
              </div>

              {/* Timer */}
              <div className="mb-6">
                <div className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-[#111111]">
                  {isClockedIn ? formatDurationTimer(elapsedSeconds) : '00:00:00'}
                </div>
                <p className="text-xs text-[#737373] font-medium mt-1">
                  {isClockedIn ? 'Active shift duration in progress' : 'Clock in to start your work session'}
                </p>
              </div>

              {/* Action Button */}
              {isClockedIn ? (
                <button
                  type="button"
                  id="staff-clock-out-btn"
                  onClick={handleClockOut}
                  disabled={punchLoading}
                  className="w-full max-w-xs py-3.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
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
                  className="w-full max-w-xs py-3.5 px-6 rounded-xl bg-[#111111] hover:bg-black text-[#F4C430] font-bold text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <Play size={16} fill="currentColor" />
                  <span>{punchLoading ? 'Processing...' : 'Clock In Now'}</span>
                </button>
              )}

              {/* Notes Input */}
              <div className="w-full max-w-xs mt-4">
                <input
                  type="text"
                  value={punchNote}
                  onChange={(e) => setPunchNote(e.target.value)}
                  placeholder="Optional note for this punch..."
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E5E5E5] rounded-lg text-[#111111] placeholder:text-[#A3A3A3] focus:outline-hidden focus:border-[#111111]"
                />
              </div>

              {/* Session Activity Status */}
              {isClockedIn && (
                <div className="mt-4 flex items-center gap-2 text-xs">
                  {isIdle ? (
                    <span className="flex items-center gap-1.5 text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                      <AlertTriangle size={13} />
                      <span>Idle session warning ({idleMinutes}m inactive)</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <CheckCircle2 size={13} />
                      <span>Session Active & Verified {isTabVisible ? '• In Focus' : '• Tab in Background'}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right: Broken / Split Shift Segments & Daily Summary */}
            <div className="lg:col-span-6 space-y-5">
              {/* Broken / Split Shift Segments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#737373] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={13} />
                    <span>Scheduled Shift Segments</span>
                  </span>
                  {activeShift?.grace_period_minutes && (
                    <span className="text-[11px] text-[#737373]">
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
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                              : isSelected && !isClockedIn
                              ? 'bg-amber-50/80 border-amber-300 text-amber-950 cursor-pointer'
                              : 'bg-white border-[#E5E5E5] text-[#111111] hover:border-[#D4D4D8] cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                                isCurrentPunch
                                  ? 'bg-emerald-600 text-white'
                                  : isCompleted
                                  ? 'bg-[#111111] text-[#F4C430]'
                                  : 'bg-[#F4F4F5] text-[#71717A]'
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
                              <div className="text-[11px] text-[#737373]">
                                {seg.start_time} – {seg.end_time}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            {segLogs.length > 0 ? (
                              <div>
                                <span className="text-xs font-bold text-[#111111]">
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
                                <div className="text-[10px] text-emerald-700 font-semibold">
                                  {segLogs.some((l) => l.status === 'late') ? 'Late' : 'Logged'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#A3A3A3]">Unclocked</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                    <p className="font-semibold">No custom shift assigned today.</p>
                    <p className="text-[11px] text-amber-800/80 mt-0.5">
                      Default regular shift (09:00 – 17:00) applies automatically.
                    </p>
                  </div>
                )}
              </div>

              {/* Day's Cumulative Hours Strip */}
              <div className="p-4 bg-[#F8F9FA] border border-[#E9EBEF] rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#737373] font-semibold">Total Hours Worked Today</div>
                  <div className="text-xl font-black text-[#111111]">
                    {formatDurationHuman(todayTotalSeconds)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#737373] font-semibold">Today's Punches</div>
                  <div className="text-sm font-black text-[#111111]">
                    {todayLogs.length} segment {todayLogs.length === 1 ? 'cycle' : 'cycles'}
                  </div>
                </div>
              </div>

              {/* Session Audit Meta (IP & Device) */}
              <div className="text-[11px] text-[#737373] flex flex-wrap items-center gap-x-4 gap-y-1 p-2 bg-[#FAFAFA] rounded-lg border border-[#F0F0F0]">
                <span className="flex items-center gap-1">
                  <Globe size={12} className="text-[#38BDF8]" />
                  <span>Remote Location: Verified via login session</span>
                </span>
                <span className="flex items-center gap-1">
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
        <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-[#FAFAFA] border-b border-[#E5E5E5] flex items-center justify-between">
            <h4 className="text-sm font-black text-[#111111] flex items-center gap-2">
              <Calendar size={15} />
              <span>My Recent Timecard & Attendance Logs</span>
            </h4>
            <span className="text-xs text-[#737373]">Showing last {recentLogs.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F8F8] border-b border-[#E5E5E5] text-[#737373] font-bold uppercase text-[10px] tracking-wider">
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
              <tbody className="divide-y divide-[#F0F0F0]">
                {recentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[#A3A3A3]">
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
                      <tr key={log.id} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#111111]">
                          {inDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 text-[#52525B]">
                          Segment {log.segment_index + 1}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-[#111111]">
                          {inDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-[#111111]">
                          {log.clock_out_at ? (
                            new Date(log.clock_out_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          ) : (
                            <span className="text-emerald-600 font-bold animate-pulse">In Progress...</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#111111]">
                          {durationSec !== null ? formatDurationHuman(durationSec) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              log.status === 'present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.status === 'late'
                                ? 'bg-amber-100 text-amber-800'
                                : log.status === 'auto_clocked_out'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {log.status === 'auto_clocked_out' ? 'Auto Clocked Out' : log.status}
                          </span>
                          {log.idle_flagged && (
                            <span
                              className="ml-1.5 inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                              title="Session had prolonged idle time"
                            >
                              Idle Flagged
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#737373] truncate max-w-xs">
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
