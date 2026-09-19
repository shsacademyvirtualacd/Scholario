import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Users,
  AlertTriangle,
  Flame,
  Search,
  RefreshCw,
  Plus,
  Square,
  Layers,
  Trash2,
  Edit2,
  X,
  Check,
  Download,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getStaffShifts,
  getStaffAttendanceLogs,
  upsertStaffShift,
  deleteStaffShift,
  clockOutStaff,
  triggerAutoClockOutSweep,
  buildStaffPresenceSummaries,
  formatDurationHuman,
} from '../../../lib/staffAttendanceService';
import { getAllTeachers } from '../../../lib/db';
import type {
  StaffShift,
  StaffAttendanceLog,
  StaffPresenceSummary,
  StaffShiftSegment,
  ShiftType,
} from '../../../types/staffAttendance';
import type { Profile, Teacher } from '../../../types/database';

export const StaffAttendanceAdminView: React.FC = () => {
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [logs, setLogs] = useState<StaffAttendanceLog[]>([]);
  const [staffProfiles, setStaffProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sweepLoading, setSweepLoading] = useState(false);

  // Filter state
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shiftTypeFilter, setShiftTypeFilter] = useState<string>('all');
  const [onlyIdleFlagged, setOnlyIdleFlagged] = useState(false);
  const [onlyAutoClockedOut, setOnlyAutoClockedOut] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'live' | 'logs' | 'shifts'>('live');

  // Shift Management Modal
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Partial<StaffShift> | null>(null);

  // Force Clock-Out Modal
  const [forceClockOutLog, setForceClockOutLog] = useState<StaffAttendanceLog | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [forceClockOutLoading, setForceClockOutLoading] = useState(false);

  // Fetch all staff attendance data
  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [fetchedShifts, fetchedLogs, teachers] = await Promise.all([
        getStaffShifts(),
        getStaffAttendanceLogs({ limit: 300 }),
        getAllTeachers().catch(() => [] as Teacher[]),
      ]);

      // Map teachers to Profiles for staff roster
      const profilesList: Profile[] = teachers.map((t) => ({
        id: t.id,
        full_name: t.full_name,
        phone: t.phone || null,
        avatar_url: t.avatar_url,
        role: 'teacher',
        created_at: t.created_at,
      }));

      // Merge any staff present in shifts or logs
      const staffMap = new Map<string, Profile>();
      profilesList.forEach((p) => staffMap.set(p.id, p));

      // Add default mock administrator if none
      if (!staffMap.has('admin')) {
        staffMap.set('admin', {
          id: 'admin',
          full_name: 'Principal Administrator',
          phone: null,
          avatar_url: null,
          role: 'admin',
          created_at: new Date().toISOString(),
        });
      }

      setStaffProfiles(Array.from(staffMap.values()));
      setShifts(fetchedShifts);
      setLogs(fetchedLogs);
    } catch (err) {
      console.warn('[StaffAttendanceAdminView] Fetch error:', err);
      toast.error('Failed to refresh staff attendance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute live presence summaries
  const summaries: StaffPresenceSummary[] = useMemo(() => {
    return buildStaffPresenceSummaries(staffProfiles, shifts, logs, selectedDate);
  }, [staffProfiles, shifts, logs, selectedDate]);

  // Overall metrics
  const metrics = useMemo(() => {
    const liveOnline = summaries.filter((s) => s.is_clocked_in).length;
    const idleCount = summaries.filter((s) => s.has_idle_warning).length;
    const autoClockedOutCount = logs.filter(
      (l) => l.status === 'auto_clocked_out' && l.clock_in_at.startsWith(selectedDate)
    ).length;
    const lateCount = logs.filter(
      (l) => l.status === 'late' && l.clock_in_at.startsWith(selectedDate)
    ).length;
    const totalStaffCount = staffProfiles.length;

    return {
      liveOnline,
      idleCount,
      autoClockedOutCount,
      lateCount,
      totalStaffCount,
    };
  }, [summaries, logs, staffProfiles, selectedDate]);

  // Filtered live staff list
  const filteredSummaries = useMemo(() => {
    return summaries.filter((s) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = s.staff_name.toLowerCase().includes(query);
        const matchesEmail = s.email?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail) return false;
      }
      if (statusFilter === 'online' && !s.is_clocked_in) return false;
      if (statusFilter === 'offline' && s.is_clocked_in) return false;
      if (statusFilter === 'late' && !s.today_logs.some((l) => l.status === 'late')) return false;
      if (statusFilter === 'idle' && !s.has_idle_warning) return false;
      if (statusFilter === 'auto_clocked_out' && !s.is_auto_clocked_out_today) return false;

      if (shiftTypeFilter !== 'all') {
        if (s.current_shift?.shift_type !== shiftTypeFilter) return false;
      }

      return true;
    });
  }, [summaries, searchQuery, statusFilter, shiftTypeFilter]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (selectedDate && !l.clock_in_at.startsWith(selectedDate)) return false;

      if (searchQuery) {
        const staff = staffProfiles.find((p) => p.id === l.staff_id);
        const name = staff?.full_name || '';
        const match =
          name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (l.notes && l.notes.toLowerCase().includes(searchQuery.toLowerCase()));
        if (!match) return false;
      }

      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (onlyIdleFlagged && !l.idle_flagged) return false;
      if (onlyAutoClockedOut && l.status !== 'auto_clocked_out') return false;

      return true;
    });
  }, [logs, selectedDate, searchQuery, statusFilter, onlyIdleFlagged, onlyAutoClockedOut, staffProfiles]);

  // Trigger auto clock-out sweep
  const handleAutoClockOutSweep = async () => {
    setSweepLoading(true);
    try {
      const res = await triggerAutoClockOutSweep();
      if (res.affectedCount > 0) {
        toast.success(`Auto clock-out sweep complete: ${res.affectedCount} expired shift(s) closed.`);
      } else {
        toast.info('Auto clock-out sweep complete: No expired shifts found.');
      }
      await fetchData();
    } catch (err: any) {
      toast.error(`Auto clock-out failed: ${err?.message || 'Error'}`);
    } finally {
      setSweepLoading(false);
    }
  };

  // Handle Force Clock-Out
  const handleForceClockOut = async () => {
    if (!forceClockOutLog) return;
    setForceClockOutLoading(true);
    try {
      await clockOutStaff({
        log_id: forceClockOutLog.id,
        notes: adminNote.trim() ? `[Admin Override]: ${adminNote}` : '[Admin Forced Clock-Out]',
        client_time: new Date().toISOString(),
      });
      toast.success('Staff member forcefully clocked out by Administrator.');
      setForceClockOutLog(null);
      setAdminNote('');
      await fetchData();
    } catch (err: any) {
      toast.error(`Force clock out error: ${err?.message || 'Error'}`);
    } finally {
      setForceClockOutLoading(false);
    }
  };

  // Shift Management: Open modal to create/edit
  const handleOpenShiftModal = (shift?: StaffShift) => {
    if (shift) {
      setEditingShift(JSON.parse(JSON.stringify(shift)));
    } else {
      setEditingShift({
        staff_id: staffProfiles[0]?.id || '',
        shift_name: 'Regular Remote Shift',
        shift_type: 'regular',
        segments: [
          { segment_index: 0, name: 'Core Block', start_time: '09:00', end_time: '17:00' },
        ],
        days_of_week: [1, 2, 3, 4, 5],
        grace_period_minutes: 15,
        is_active: true,
      });
    }
    setIsShiftModalOpen(true);
  };

  // Shift Management: Save shift
  const handleSaveShift = async () => {
    if (!editingShift || !editingShift.staff_id || !editingShift.shift_name) {
      toast.error('Please specify staff member and shift name');
      return;
    }

    try {
      await upsertStaffShift(editingShift);
      toast.success('Staff shift schedule saved successfully!');
      setIsShiftModalOpen(false);
      setEditingShift(null);
      await fetchData();
    } catch (err: any) {
      toast.error(`Failed to save shift: ${err?.message || 'Error'}`);
    }
  };

  // Shift Management: Delete shift
  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm('Are you sure you want to remove this shift schedule?')) return;
    try {
      await deleteStaffShift(shiftId);
      toast.success('Shift deleted');
      await fetchData();
    } catch (err: any) {
      toast.error('Failed to delete shift');
    }
  };

  // Shift Management: Add segment to broken/split shift
  const handleAddSegment = () => {
    if (!editingShift) return;
    const current = editingShift.segments || [];
    const nextIdx = current.length;
    const newSeg: StaffShiftSegment = {
      segment_index: nextIdx,
      name: `Segment ${nextIdx + 1}`,
      start_time: '18:00',
      end_time: '21:00',
    };
    setEditingShift({
      ...editingShift,
      shift_type: current.length >= 1 ? (editingShift.shift_type === 'regular' ? 'split' : editingShift.shift_type) : 'regular',
      segments: [...current, newSeg],
    });
  };

  // Shift Management: Remove segment
  const handleRemoveSegment = (index: number) => {
    if (!editingShift || !editingShift.segments) return;
    const updated = editingShift.segments
      .filter((_, i) => i !== index)
      .map((s, idx) => ({ ...s, segment_index: idx }));
    setEditingShift({
      ...editingShift,
      shift_type: updated.length <= 1 ? 'regular' : updated.length === 2 ? 'split' : 'broken',
      segments: updated,
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    const headers = [
      'Log ID',
      'Staff Name',
      'Date',
      'Segment Index',
      'Clock In',
      'Clock Out',
      'Duration (Seconds)',
      'Status',
      'Idle Flagged',
      'Idle Minutes',
      'IP Address',
      'Device Info',
      'Notes',
    ];

    const rows = filteredLogs.map((l) => {
      const staff = staffProfiles.find((p) => p.id === l.staff_id);
      return [
        l.id,
        staff?.full_name || l.staff_id,
        l.clock_in_at.slice(0, 10),
        l.segment_index + 1,
        l.clock_in_at,
        l.clock_out_at || 'In Progress',
        l.total_active_seconds || 0,
        l.status,
        l.idle_flagged ? 'Yes' : 'No',
        l.idle_minutes,
        `"${l.ip_address || ''}"`,
        `"${l.device_info?.replace(/"/g, '""') || ''}"`,
        `"${l.notes?.replace(/"/g, '""') || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `scholario_staff_attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Staff attendance CSV exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* ── Top Highlights & Quick Actions Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Live Online */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
              Currently Clocked In
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-emerald-600">{metrics.liveOnline}</div>
            <div className="text-[11px] text-[#737373]">of {metrics.totalStaffCount} registered staff</div>
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold border-t border-[#F5F5F5] pt-1.5">
            Active verified sessions
          </div>
        </div>

        {/* Today's Late */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
              Late Check-Ins
            </span>
            <Clock size={14} className="text-amber-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-amber-600">{metrics.lateCount}</div>
            <div className="text-[11px] text-[#737373]">Past grace period</div>
          </div>
          <div className="text-[10px] text-amber-700 font-semibold border-t border-[#F5F5F5] pt-1.5">
            Auto-calculated via segment start
          </div>
        </div>

        {/* Idle Flagged */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
              Idle Flagged Sessions
            </span>
            <AlertTriangle size={14} className="text-orange-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-orange-600">{metrics.idleCount}</div>
            <div className="text-[11px] text-[#737373]">&gt;30m inactive</div>
          </div>
          <div className="text-[10px] text-orange-700 font-semibold border-t border-[#F5F5F5] pt-1.5">
            Tab hidden or zero interaction
          </div>
        </div>

        {/* Auto Clock-Outs */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
              Auto Clock-Outs
            </span>
            <Flame size={14} className="text-rose-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-rose-600">{metrics.autoClockedOutCount}</div>
            <div className="text-[11px] text-[#737373]">Shift end + grace exceeded</div>
          </div>
          <div className="text-[10px] text-rose-700 font-semibold border-t border-[#F5F5F5] pt-1.5">
            Closed by system cron
          </div>
        </div>

        {/* Action Button: Auto Clock-out sweep */}
        <div className="col-span-2 lg:col-span-1 bg-[#111111] rounded-xl p-4 text-white flex flex-col justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#F4C430]">
              Remote Governance
            </div>
            <p className="text-[11px] text-[#D4D4D8] mt-1 leading-snug">
              Auto clock-out sweep & broken shift synchronizer
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutoClockOutSweep}
            disabled={sweepLoading}
            className="w-full mt-3 py-1.5 px-3 rounded-lg bg-[#2A2A2A] hover:bg-[#3D3D3D] text-[#F4C430] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={13} className={sweepLoading ? 'animate-spin' : ''} />
            <span>{sweepLoading ? 'Sweeping...' : 'Run Sweep Now'}</span>
          </button>
        </div>
      </div>

      {/* ── Sub Tabs & Toolbar ── */}
      <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0F0F0] pb-3">
          {/* Sub Navigation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('live')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'live'
                  ? 'bg-[#111111] text-[#F4C430]'
                  : 'bg-[#F4F4F5] text-[#71717A] hover:bg-[#E4E4E7]'
              }`}
            >
              <Users size={14} />
              <span>Live Staff Presence ({summaries.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'logs'
                  ? 'bg-[#111111] text-[#F4C430]'
                  : 'bg-[#F4F4F5] text-[#71717A] hover:bg-[#E4E4E7]'
              }`}
            >
              <Clock size={14} />
              <span>Attendance Logs ({filteredLogs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('shifts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'shifts'
                  ? 'bg-[#111111] text-[#F4C430]'
                  : 'bg-[#F4F4F5] text-[#71717A] hover:bg-[#E4E4E7]'
              }`}
            >
              <Layers size={14} />
              <span>Shift Schedules ({shifts.length})</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {activeSubTab === 'shifts' ? (
              <button
                type="button"
                onClick={() => handleOpenShiftModal()}
                className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Add Staff Shift</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExportCSV}
                className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fetchData(true)}
              className="btn btn-secondary text-xs py-1.5 px-2.5"
              title="Refresh data"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-[#A3A3A3]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff name or notes..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg text-[#111111] placeholder:text-[#A3A3A3] focus:outline-hidden"
            />
          </div>

          {/* Date Picker */}
          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg text-[#111111] font-semibold focus:outline-hidden"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg text-[#111111] font-semibold focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="online">Online (Clocked In)</option>
              <option value="offline">Offline (Clocked Out)</option>
              <option value="present">Present (On Time)</option>
              <option value="late">Late</option>
              <option value="idle">Idle Flagged</option>
              <option value="auto_clocked_out">Auto Clocked Out</option>
            </select>
          </div>

          {/* Shift Type Filter */}
          <div>
            <select
              value={shiftTypeFilter}
              onChange={(e) => setShiftTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg text-[#111111] font-semibold focus:outline-hidden"
            >
              <option value="all">All Shift Types</option>
              <option value="regular">Regular Shifts (Single Block)</option>
              <option value="split">Split Shifts (2 Segments)</option>
              <option value="broken">Broken Shifts (Multi Segments)</option>
            </select>
          </div>
        </div>

        {/* Toggle Filters for Idle & Auto-Clocked Out */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#F0F0F0]">
          <button
            type="button"
            onClick={() => setOnlyIdleFlagged(!onlyIdleFlagged)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              onlyIdleFlagged
                ? 'bg-amber-500 text-white'
                : 'bg-[#F4F4F5] text-[#71717A] hover:bg-[#E4E4E7]'
            }`}
          >
            <AlertTriangle size={12} />
            <span>Idle Flagged Only</span>
          </button>
          <button
            type="button"
            onClick={() => setOnlyAutoClockedOut(!onlyAutoClockedOut)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              onlyAutoClockedOut
                ? 'bg-purple-600 text-white'
                : 'bg-[#F4F4F5] text-[#71717A] hover:bg-[#E4E4E7]'
            }`}
          >
            <Clock size={12} />
            <span>Auto-Clocked Out Only</span>
          </button>
          {(onlyIdleFlagged || onlyAutoClockedOut || statusFilter !== 'all' || shiftTypeFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setOnlyIdleFlagged(false);
                setOnlyAutoClockedOut(false);
                setStatusFilter('all');
                setShiftTypeFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-[#A1A1AA] hover:text-[#111111] underline ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-[#737373] bg-white border border-[#E5E5E5] rounded-2xl flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#E5E5E5] border-t-[#F4C430] animate-spin" />
          <p className="text-xs font-semibold">Loading remote staff attendance rosters...</p>
        </div>
      ) : (
        <>
          {/* ── Sub-Tab 1: Live Staff Presence Roster ── */}
      {activeSubTab === 'live' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSummaries.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white border border-[#E5E5E5] rounded-2xl text-[#737373]">
              <Users size={32} className="mx-auto text-[#D4D4D8] mb-2" />
              <p className="font-bold text-[#111111]">No staff members match the selected criteria</p>
              <p className="text-xs text-[#A3A3A3] mt-1">Try clearing your filters or date selection.</p>
            </div>
          ) : (
            filteredSummaries.map((staff) => (
              <div
                key={staff.staff_id}
                className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[#D4D4D8] transition-all"
              >
                <div>
                  {/* Top Bar: Name & Online status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#111111] text-[#F4C430] flex items-center justify-center font-bold text-sm">
                        {staff.staff_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#111111] leading-tight">
                          {staff.staff_name}
                        </h4>
                        <p className="text-xs text-[#737373] capitalize">{staff.role}</p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {staff.is_clocked_in ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F4F4F5] text-[#71717A]">
                        Off Duty
                      </span>
                    )}
                  </div>

                  {/* Shift Information */}
                  <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0] text-xs space-y-1.5 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#737373] text-[11px]">Assigned Shift:</span>
                      <span className="font-bold text-[#111111]">
                        {staff.current_shift?.shift_name || 'Standard (09:00 - 17:00)'}
                      </span>
                    </div>

                    {staff.current_shift && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#737373]">Shift Type:</span>
                        <span
                          className={`font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-sm text-[10px] ${
                            staff.current_shift.shift_type === 'broken' ||
                            staff.current_shift.shift_type === 'split'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {staff.current_shift.shift_type} ({staff.current_shift.segments?.length || 1} segments)
                        </span>
                      </div>
                    )}

                    {staff.active_log && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#EAEAEA]">
                        <span className="text-[#737373]">Active Segment:</span>
                        <span className="font-bold text-emerald-700">
                          Segment {staff.active_log.segment_index + 1}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Live warnings (Idle / Auto Clock-Out) */}
                  {staff.has_idle_warning && (
                    <div className="mb-3 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                      <span className="font-semibold text-[11px]">
                        Session Idle: {staff.active_log?.idle_minutes || 30}m inactive
                      </span>
                    </div>
                  )}

                  {staff.is_auto_clocked_out_today && (
                    <div className="mb-3 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                      <Flame size={14} className="text-rose-600 shrink-0" />
                      <span className="font-semibold text-[11px]">
                        Auto clocked-out earlier today (exceeded grace period)
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer: Hours & Actions */}
                <div className="pt-3 border-t border-[#F0F0F0] flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold text-[#737373] uppercase">Today's Hours</div>
                    <div className="text-base font-mono font-black text-[#111111]">
                      {staff.total_today_hours} hrs
                    </div>
                  </div>

                  {staff.is_clocked_in && staff.active_log && (
                    <button
                      type="button"
                      onClick={() => {
                        setForceClockOutLog(staff.active_log ?? null);
                        setAdminNote('');
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Square size={12} fill="currentColor" />
                      <span>Force Clock-Out</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Sub-Tab 2: Attendance Logs Table ── */}
      {activeSubTab === 'logs' && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F8F8] border-b border-[#E5E5E5] text-[#737373] font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Shift & Segment</th>
                  <th className="py-3 px-4">Clock In</th>
                  <th className="py-3 px-4">Clock Out</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Idle / Audit</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-[#737373]">
                      No attendance logs recorded for this filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const staff = staffProfiles.find((p) => p.id === log.staff_id);
                    const shift = shifts.find((s) => s.id === log.shift_id);
                    const inDate = new Date(log.clock_in_at);
                    const outDate = log.clock_out_at ? new Date(log.clock_out_at) : null;
                    const durationSec = outDate
                      ? Math.floor((outDate.getTime() - inDate.getTime()) / 1000)
                      : null;

                    return (
                      <tr key={log.id} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#111111]">
                            {staff?.full_name || log.staff_id}
                          </div>
                          <div className="text-[10px] text-[#737373]">{staff?.phone ? `Tel: ${staff.phone}` : staff?.role}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#111111]">
                            {shift?.shift_name || 'Standard Shift'}
                          </div>
                          <div className="text-[10px] text-[#737373]">
                            Segment {log.segment_index + 1}
                            {shift && ` (${shift.shift_type})`}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-medium text-[#111111]">
                          <div>
                            {inDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-[10px] text-[#737373]">
                            {inDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-medium text-[#111111]">
                          {outDate ? (
                            <div>
                              <div>
                                {outDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-[10px] text-[#737373]">
                                {outDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            </div>
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
                        </td>

                        <td className="py-3 px-4">
                          {log.idle_flagged ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              <AlertTriangle size={11} />
                              <span>Idle {log.idle_minutes}m</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-semibold">Active</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-[#737373] max-w-[200px] truncate" title={log.notes || ''}>
                          {log.notes || '—'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {!log.clock_out_at && (
                            <button
                              type="button"
                              onClick={() => {
                                setForceClockOutLog(log);
                                setAdminNote('');
                              }}
                              className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold border border-rose-200"
                            >
                              Clock Out
                            </button>
                          )}
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

      {/* ── Sub-Tab 3: Shift Schedules Configuration ── */}
      {activeSubTab === 'shifts' && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-[#FAFAFA] border-b border-[#E5E5E5] flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-[#111111] flex items-center gap-2">
                <Layers size={16} />
                <span>Configured Staff Shifts (Regular, Split & Broken)</span>
              </h4>
              <p className="text-xs text-[#737373] mt-0.5">
                Support for non-contiguous time segments with independent clock-in/out cycles
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenShiftModal()}
              className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Create Shift</span>
            </button>
          </div>

          <div className="divide-y divide-[#F0F0F0]">
            {shifts.length === 0 ? (
              <div className="p-8 text-center text-[#737373]">
                <Layers size={32} className="mx-auto text-[#D4D4D8] mb-2" />
                <p className="font-bold text-[#111111]">No custom shifts configured yet</p>
                <p className="text-xs text-[#A3A3A3] mt-1">
                  Create a regular, split, or broken shift to assign to teachers and remote staff.
                </p>
              </div>
            ) : (
              shifts.map((shift) => {
                const assignedStaff = staffProfiles.find((p) => p.id === shift.staff_id);
                return (
                  <div key={shift.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <h5 className="text-sm font-bold text-[#111111]">{shift.shift_name}</h5>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            shift.shift_type === 'broken' || shift.shift_type === 'split'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {shift.shift_type} shift
                        </span>
                        {!shift.is_active && (
                          <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                            Inactive
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#52525B]">
                        Assigned to:{' '}
                        <span className="font-semibold text-[#111111]">
                          {assignedStaff?.full_name || shift.staff_id}
                        </span>{' '}
                        • Grace Period: <span className="font-semibold">{shift.grace_period_minutes}m</span>
                      </p>

                      {/* Segments list */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {shift.segments?.map((seg) => (
                          <div
                            key={seg.segment_index}
                            className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg bg-[#F4F4F5] border border-[#E4E4E7] text-[#18181B] flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#111111]"></span>
                            <span>{seg.name || `Seg ${seg.segment_index + 1}`}:</span>
                            <span className="font-bold">{seg.start_time} – {seg.end_time}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => handleOpenShiftModal(shift)}
                        className="p-2 rounded-lg bg-[#FAFAFA] hover:bg-[#F0F0F0] text-[#111111] border border-[#E5E5E5] transition-colors cursor-pointer"
                        title="Edit shift"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteShift(shift.id)}
                        className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                        title="Delete shift"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      </>
      )}

      {/* ── Modal: Create / Edit Shift ── */}
      {isShiftModalOpen && editingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-[#FAFAFA] border-b border-[#E5E5E5] flex items-center justify-between">
              <h3 className="text-sm font-black text-[#111111] flex items-center gap-2">
                <Layers size={16} />
                <span>{editingShift.id ? 'Edit Staff Shift' : 'Create Staff Shift Schedule'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#EAEAEA] text-[#737373]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Staff Selector */}
              <div>
                <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-1">
                  Assign to Staff Member *
                </label>
                <select
                  value={editingShift.staff_id || ''}
                  onChange={(e) => setEditingShift({ ...editingShift, staff_id: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg text-[#111111] font-semibold focus:outline-hidden"
                >
                  {staffProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role}){p.phone ? ` - ${p.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Shift Name */}
              <div>
                <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-1">
                  Shift Name *
                </label>
                <input
                  type="text"
                  value={editingShift.shift_name || ''}
                  onChange={(e) => setEditingShift({ ...editingShift, shift_name: e.target.value })}
                  placeholder="e.g. Senior Faculty Broken Shift"
                  className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg text-[#111111] font-semibold focus:outline-hidden"
                />
              </div>

              {/* Shift Type */}
              <div>
                <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-1">
                  Shift Type
                </label>
                <select
                  value={editingShift.shift_type || 'regular'}
                  onChange={(e) =>
                    setEditingShift({ ...editingShift, shift_type: e.target.value as ShiftType })
                  }
                  className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg text-[#111111] font-semibold focus:outline-hidden"
                >
                  <option value="regular">Regular (Single Contiguous Block)</option>
                  <option value="split">Split Shift (2 Blocks with gap)</option>
                  <option value="broken">Broken Shift (Multiple Non-contiguous Segments)</option>
                </select>
              </div>

              {/* Segments Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
                    Time Segments ({editingShift.segments?.length || 0})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSegment}
                    className="text-xs font-bold text-[#111111] hover:text-[#F4C430] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Segment</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {editingShift.segments?.map((seg, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-md bg-[#111111] text-[#F4C430] flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>

                      <input
                        type="text"
                        value={seg.name || ''}
                        onChange={(e) => {
                          const updated = [...(editingShift.segments || [])];
                          updated[idx].name = e.target.value;
                          setEditingShift({ ...editingShift, segments: updated });
                        }}
                        placeholder="Block Name"
                        className="w-28 px-2 py-1 bg-white border border-[#E5E5E5] rounded text-xs text-[#111111]"
                      />

                      <input
                        type="time"
                        value={seg.start_time}
                        onChange={(e) => {
                          const updated = [...(editingShift.segments || [])];
                          updated[idx].start_time = e.target.value;
                          setEditingShift({ ...editingShift, segments: updated });
                        }}
                        className="px-2 py-1 bg-white border border-[#E5E5E5] rounded text-xs text-[#111111] font-semibold"
                      />

                      <span className="text-[#A3A3A3] text-xs">to</span>

                      <input
                        type="time"
                        value={seg.end_time}
                        onChange={(e) => {
                          const updated = [...(editingShift.segments || [])];
                          updated[idx].end_time = e.target.value;
                          setEditingShift({ ...editingShift, segments: updated });
                        }}
                        className="px-2 py-1 bg-white border border-[#E5E5E5] rounded text-xs text-[#111111] font-semibold"
                      />

                      {editingShift.segments && editingShift.segments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSegment(idx)}
                          className="p-1 rounded text-rose-600 hover:bg-rose-50 ml-auto"
                          title="Remove segment"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Grace Period */}
              <div>
                <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-1">
                  Grace Period (Minutes before auto-clockout / late flag)
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={editingShift.grace_period_minutes ?? 15}
                  onChange={(e) =>
                    setEditingShift({
                      ...editingShift,
                      grace_period_minutes: parseInt(e.target.value, 10) || 15,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg text-[#111111] font-semibold focus:outline-hidden"
                />
              </div>

              {/* Working Days */}
              <div>
                <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-1.5">
                  Working Days of Week
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { day: 1, label: 'Mon' },
                    { day: 2, label: 'Tue' },
                    { day: 3, label: 'Wed' },
                    { day: 4, label: 'Thu' },
                    { day: 5, label: 'Fri' },
                    { day: 6, label: 'Sat' },
                    { day: 7, label: 'Sun' },
                  ].map(({ day, label }) => {
                    const isSelected = editingShift.days_of_week?.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const current = editingShift.days_of_week || [];
                          const updated = isSelected
                            ? current.filter((d) => d !== day)
                            : [...current, day];
                          setEditingShift({ ...editingShift, days_of_week: updated });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                          isSelected
                            ? 'bg-[#111111] text-[#F4C430]'
                            : 'bg-[#F4F4F5] text-[#71717A] hover:bg-[#E4E4E7]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#E5E5E5] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(false)}
                className="btn btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveShift}
                className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Save Shift Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Force Clock-Out Confirmation ── */}
      {forceClockOutLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-xl w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-base font-black text-[#111111]">Force Clock-Out Staff</h4>
                <p className="text-xs text-[#737373]">
                  Close active session for {staffProfiles.find((p) => p.id === forceClockOutLog.staff_id)?.full_name || 'Staff Member'}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#52525B] leading-relaxed">
              This will record an immediate clock-out timestamp and log an administrative override note in the audit trail.
            </p>

            <div>
              <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-1">
                Admin Reason / Audit Note
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="e.g. Staff completed evening lecture but forgot to punch out."
                rows={2}
                className="w-full text-xs p-2.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl text-[#111111] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setForceClockOutLog(null)}
                className="btn btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleForceClockOut}
                disabled={forceClockOutLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Square size={13} fill="currentColor" />
                <span>{forceClockOutLoading ? 'Processing...' : 'Confirm Clock-Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAttendanceAdminView;
