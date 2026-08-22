import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  RotateCcw,
  Filter,
  Check,
  X,
  Lock,
  ChevronDown,
  ChevronRight,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';
import TeacherShell from '../../components/teacher/TeacherShell';
import SectionHeader from '../../components/ui/SectionHeader';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useAuth } from '../../features/auth/AuthContext';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { pageCache } from '../../lib/pageCache';
import {
  getOfferingsForTeacher,
  getSlotsForTeacher,
  getStudentsForTeacher,
  getAllStudents,
  getAllEnrollments,
  getAllRoster,
  getAttendanceForTeacher,
  recordAttendance
} from '../../lib/db';
import type { Attendance, AttendanceStatus, ClassOffering, ClassSlot, Enrollment, Profile, RosterEntry } from '../../types';

export const TeacherAttendancePage: React.FC = () => {
  const { profile } = useAuth();
  const teacherId = profile?.id || 't1';

  // ── Cache initialization ──────────────────────────────────────────
  const cachedOfferings = teacherId ? pageCache.get<ClassOffering[]>('teacher_offerings', teacherId) : null;
  const cachedSlots = teacherId ? pageCache.get<ClassSlot[]>('teacher_slots', teacherId) : null;
  const cachedStudents = teacherId ? pageCache.get<Profile[]>('teacher_students', teacherId) : null;
  const cachedAttendance = teacherId ? pageCache.get<Attendance[]>('teacher_attendance_all', teacherId) : null;
  const cachedEnrollments = teacherId ? pageCache.get<Enrollment[]>('teacher_enrollments', teacherId) : null;
  const cachedRoster = teacherId ? pageCache.get<RosterEntry[]>('teacher_roster', teacherId) : null;

  const [offerings, setOfferings] = useState<ClassOffering[]>(cachedOfferings || []);
  const [slots, setSlots] = useState<ClassSlot[]>(cachedSlots || []);
  const [students, setStudents] = useState<Profile[]>(cachedStudents || []);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(cachedEnrollments || []);
  const [roster, setRoster] = useState<RosterEntry[]>(cachedRoster || []);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>(cachedAttendance || []);
  const [loading, setLoading] = useState(!cachedAttendance || cachedAttendance.length === 0);
  const [refreshing, setRefreshing] = useState(false);

  // ── Filters & View state ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'records' | 'class_rosters'>('records');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');
  const [expandedOfferingId, setExpandedOfferingId] = useState<string | null>(null);

  // ── Attendance update & confirmation state ─────────────────────────
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<{
    studentId: string;
    studentName: string;
    slotId: string;
    sessionDate: string;
    currentStatus: AttendanceStatus | 'unmarked';
    newStatus: AttendanceStatus;
    subjectName?: string;
  } | null>(null);

  // ── Load Teacher Data ─────────────────────────────────────────────
  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else if (attendanceRecords.length === 0) setLoading(true);

    try {
      const [teacherOffs, teacherSlots, teacherStuds, allStuds, attList, allEnrs, rosterList] = await Promise.all([
        getOfferingsForTeacher(teacherId),
        getSlotsForTeacher(teacherId),
        getStudentsForTeacher(teacherId),
        getAllStudents().catch(() => [] as Profile[]),
        getAttendanceForTeacher(teacherId),
        getAllEnrollments().catch(() => [] as Enrollment[]),
        getAllRoster().catch(() => [] as RosterEntry[]),
      ]);

      // Combine student records so we have maximum profile coverage
      const studentMap = new Map<string, Profile>();
      allStuds.forEach(s => studentMap.set(s.id, s));
      teacherStuds.forEach(s => studentMap.set(s.id, s));
      allEnrs.forEach(e => {
        if (e.student && e.student.id) studentMap.set(e.student.id, e.student);
      });
      rosterList.forEach(r => {
        if (r.role === 'student') {
          const sId = r.profile_id || r.id;
          const existing = studentMap.get(sId);
          if (!existing) {
            studentMap.set(sId, {
              id: sId,
              full_name: r.full_name || 'Student',
              role: 'student',
              avatar_url: null,
              phone: r.phone || null,
              created_at: r.created_at || new Date().toISOString(),
              stream: null,
              email: r.email,
              class_id: Array.isArray(r.class_ids) && r.class_ids.length > 0 ? r.class_ids[0] : null,
            } as any);
          } else if (r.full_name && (!existing.full_name || existing.full_name.startsWith('Student '))) {
            existing.full_name = r.full_name;
          }
        }
      });
      const mergedStudents = Array.from(studentMap.values());

      setOfferings(teacherOffs);
      setSlots(teacherSlots);
      setStudents(mergedStudents);
      setEnrollments(allEnrs || []);
      setRoster(rosterList || []);
      setAttendanceRecords(attList);

      if (teacherId) {
        pageCache.set('teacher_offerings', teacherOffs, teacherId);
        pageCache.set('teacher_slots', teacherSlots, teacherId);
        pageCache.set('teacher_students', mergedStudents, teacherId);
        pageCache.set('teacher_enrollments', allEnrs || [], teacherId);
        pageCache.set('teacher_roster', rosterList || [], teacherId);
        pageCache.set('teacher_attendance_all', attList, teacherId);
      }
    } catch (err: any) {
      console.error('[TeacherAttendancePage] loadData error:', err);
      toast.error(err?.message || 'Failed to load attendance records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teacherId]);

  // ── Realtime listeners ────────────────────────────────────────────
  useRealtimeTable({
    table: 'attendance',
    debounceMs: 1200,
    onAny: async () => {
      if (!teacherId) return;
      const attList = await getAttendanceForTeacher(teacherId);
      setAttendanceRecords(attList);
      pageCache.set('teacher_attendance_all', attList, teacherId);
    }
  });

  useRealtimeTable({
    table: 'enrollments',
    debounceMs: 2000,
    onAny: async () => {
      if (!teacherId) return;
      const [studs, enrs, rList] = await Promise.all([
        getStudentsForTeacher(teacherId),
        getAllEnrollments().catch(() => [] as Enrollment[]),
        getAllRoster().catch(() => [] as RosterEntry[]),
      ]);
      setEnrollments(enrs);
      setRoster(rList);
      setStudents(prev => {
        const map = new Map(prev.map(s => [s.id, s]));
        studs.forEach(s => map.set(s.id, s));
        enrs.forEach(e => { if (e.student?.id) map.set(e.student.id, e.student); });
        return Array.from(map.values());
      });
      if (teacherId) {
        pageCache.set('teacher_enrollments', enrs, teacherId);
        pageCache.set('teacher_roster', rList, teacherId);
      }
    }
  });

  // ── Students & Offering Maps for fast lookups ─────────────────────
  const studentsMap = useMemo(() => {
    const map: Record<string, Profile> = {};
    students.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [students]);

  const offeringsMap = useMemo(() => {
    const map: Record<string, ClassOffering> = {};
    offerings.forEach(o => {
      map[o.id] = o;
    });
    return map;
  }, [offerings]);

  const slotsMap = useMemo(() => {
    const map: Record<string, ClassSlot> = {};
    slots.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [slots]);

  // ── Filtered Records ──────────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(rec => {
      // 1. Status Filter
      if (statusFilter !== 'all' && rec.status !== statusFilter) {
        return false;
      }

      // 2. Date Filter
      if (selectedDate && rec.session_date !== selectedDate) {
        return false;
      }

      // 3. Class / Subject Offering Filter
      if (selectedOfferingId !== 'all') {
        const slot = slotsMap[rec.slot_id] || rec.slot;
        const offId = slot?.offering_id || (slot?.offering as any)?.id || rec.class_id;
        if (offId !== selectedOfferingId) {
          return false;
        }
      }

      // 4. Student Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const student = studentsMap[rec.student_id] || rec.student;
        const studentName = (student?.full_name || '').toLowerCase();
        const studentEmail = ((student as any)?.email || '').toLowerCase();
        const subjectName = (rec.subject || '').toLowerCase();
        const matchesName = studentName.includes(q);
        const matchesEmail = studentEmail.includes(q);
        const matchesSubject = subjectName.includes(q);
        if (!matchesName && !matchesEmail && !matchesSubject) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort by session date descending, then timestamp descending
      const dateCompare = (b.session_date || '').localeCompare(a.session_date || '');
      if (dateCompare !== 0) return dateCompare;
      return (b.marked_at || '').localeCompare(a.marked_at || '');
    });
  }, [attendanceRecords, statusFilter, selectedDate, selectedOfferingId, searchQuery, slotsMap, studentsMap]);

  // ── Summary Stats for This Teacher ────────────────────────────────
  const stats = useMemo(() => {
    const totalMarked = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;

    const overallRate = totalMarked > 0
      ? Math.round(((presentCount + lateCount) / totalMarked) * 100)
      : 100;

    const uniqueStudents = new Set(attendanceRecords.map(r => r.student_id)).size;
    const uniqueDates = new Set(attendanceRecords.map(r => r.session_date)).size;

    return {
      totalMarked,
      presentCount,
      lateCount,
      absentCount,
      overallRate,
      uniqueStudents,
      uniqueDates
    };
  }, [attendanceRecords]);

  // ── Execute Attendance Update ─────────────────────────────────────
  const executeAttendanceUpdate = async (
    studentId: string,
    slotId: string,
    sessionDate: string,
    newStatus: AttendanceStatus,
    studentName?: string
  ) => {
    setUpdatingId(studentId);

    // Optimistic UI update
    setAttendanceRecords(prev => {
      const remaining = prev.filter(
        a => !(a.student_id === studentId && a.slot_id === slotId && a.session_date === sessionDate)
      );
      const slot = slotsMap[slotId];
      const newRec: Attendance = {
        id: `att-teacher-${Date.now()}-${studentId}`,
        student_id: studentId,
        slot_id: slotId,
        session_date: sessionDate,
        status: newStatus,
        marked_at: new Date().toISOString(),
        marked_by: 'teacher',
        slot: slot
      };
      return [newRec, ...remaining];
    });

    try {
      await recordAttendance({
        student_id: studentId,
        slot_id: slotId,
        session_date: sessionDate,
        status: newStatus,
        marked_by: 'teacher'
      });
      const formattedStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      toast.success(`Marked ${studentName || 'student'} as ${formattedStatus}`);
    } catch (err: any) {
      console.error('Failed to update attendance:', err);
      toast.error('Failed to update attendance record.');
      // Revert from server
      const refreshed = await getAttendanceForTeacher(teacherId);
      setAttendanceRecords(refreshed);
    } finally {
      setUpdatingId(null);
    }
  };

  // Safe status click handler with confirmation lock modal
  const handleTeacherClickAttendance = (
    studentId: string,
    studentName: string,
    slotId: string,
    sessionDate: string,
    currentStatus: AttendanceStatus | 'unmarked',
    targetStatus: AttendanceStatus,
    subjectName?: string
  ) => {
    if (currentStatus === targetStatus) {
      const formatted = targetStatus.charAt(0).toUpperCase() + targetStatus.slice(1);
      toast.info(`Attendance is already recorded as ${formatted}`);
      return;
    }

    if (currentStatus === 'unmarked') {
      executeAttendanceUpdate(studentId, slotId, sessionDate, targetStatus, studentName);
      return;
    }

    // Changing an existing locked record requires explicit confirmation
    setPendingChange({
      studentId,
      studentName,
      slotId,
      sessionDate,
      currentStatus,
      newStatus: targetStatus,
      subjectName
    });
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <TeacherShell>
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <SectionHeader
            title="Attendance Manager"
            subtitle="Review, monitor, and manage verified student attendance across all your assigned classes."
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="btn btn-secondary text-xs font-bold py-2 px-3.5 inline-flex items-center gap-1.5 interactive"
            title="Refresh attendance records"
          >
            <RotateCcw size={14} className={refreshing ? 'animate-spin text-[#F4C430]' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ── Teacher Summary Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Attendance Rate */}
        <div className="card card-elevated p-4 border border-[#E5E5E5] bg-white rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">Attendance Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#111111]">{stats.overallRate}%</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {stats.overallRate >= 75 ? 'Healthy' : 'Needs Attention'}
            </span>
          </div>
          <p className="text-[10px] text-[#737373] mt-1 font-medium">Across your active classes</p>
        </div>

        {/* Total Sessions Marked */}
        <div className="card card-elevated p-4 border border-[#E5E5E5] bg-white rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">Total Check-ins</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ClipboardCheck size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#111111]">{stats.totalMarked}</span>
            <span className="text-[10px] text-[#737373] font-medium">records</span>
          </div>
          <p className="text-[10px] text-[#737373] mt-1 font-medium">{stats.uniqueStudents} unique students</p>
        </div>

        {/* Present Count */}
        <div className="card card-elevated p-4 border border-[#E5E5E5] bg-white rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">Present</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">{stats.presentCount}</span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {stats.totalMarked > 0 ? `${Math.round((stats.presentCount / stats.totalMarked) * 100)}%` : '0%'}
            </span>
          </div>
          <p className="text-[10px] text-[#737373] mt-1 font-medium">On-time attendances</p>
        </div>

        {/* Late Count */}
        <div className="card card-elevated p-4 border border-[#E5E5E5] bg-white rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">Late</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-700">{stats.lateCount}</span>
            <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              {stats.totalMarked > 0 ? `${Math.round((stats.lateCount / stats.totalMarked) * 100)}%` : '0%'}
            </span>
          </div>
          <p className="text-[10px] text-[#737373] mt-1 font-medium">Late join check-ins</p>
        </div>

        {/* Absent Count */}
        <div className="col-span-2 lg:col-span-1 card card-elevated p-4 border border-[#E5E5E5] bg-white rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">Absent</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-700">{stats.absentCount}</span>
            <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              {stats.totalMarked > 0 ? `${Math.round((stats.absentCount / stats.totalMarked) * 100)}%` : '0%'}
            </span>
          </div>
          <p className="text-[10px] text-[#737373] mt-1 font-medium">Missed sessions</p>
        </div>
      </div>

      {/* ── View Navigation Tabs ── */}
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 ${
              activeTab === 'records'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-white text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] border border-[#E5E5E5]'
            }`}
          >
            <ClipboardCheck size={14} />
            <span>Attendance Log Records</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'records' ? 'bg-[#F4C430] text-[#111111]' : 'bg-[#F0F0F0] text-[#737373]'}`}>
              {filteredRecords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('class_rosters')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 ${
              activeTab === 'class_rosters'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-white text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] border border-[#E5E5E5]'
            }`}
          >
            <BookOpen size={14} />
            <span>By Assigned Class</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'class_rosters' ? 'bg-[#F4C430] text-[#111111]' : 'bg-[#F0F0F0] text-[#737373]'}`}>
              {offerings.length}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#737373]">
          <GraduationCap size={14} className="text-[#F4C430]" />
          <span className="font-semibold text-[#111111]">{offerings.length}</span> classes assigned
        </div>
      </div>

      {/* ── Filters & Controls Toolbar ── */}
      <div className="card card-elevated p-4 bg-white border border-[#E5E5E5] rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Student Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search student name or email..."
              className="w-full pl-9 pr-8 py-2 bg-[#FAFAFA] hover:bg-white focus:bg-white border border-[#E5E5E5] rounded-xl text-xs font-medium text-[#111111] placeholder:text-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-[#F4C430] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#111111] p-0.5"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Class / Subject Offering Filter */}
          <div className="relative">
            <select
              value={selectedOfferingId}
              onChange={e => setSelectedOfferingId(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-[#FAFAFA] hover:bg-white focus:bg-white border border-[#E5E5E5] rounded-xl text-xs font-bold text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#F4C430] transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Assigned Classes ({offerings.length})</option>
              {offerings.map(off => {
                const title = off.subject_name || off.subject?.name || 'Class';
                const gradeName = off.class?.name || (off.class?.grade ? `Grade ${off.class.grade}` : '');
                const boardName = off.class?.board?.name || '';
                return (
                  <option key={off.id} value={off.id}>
                    {title} {gradeName ? `· ${gradeName}` : ''} {boardName ? `(${boardName})` : ''}
                  </option>
                );
              })}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] pointer-events-none" />
          </div>

          {/* Session Date Filter */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-[#FAFAFA] hover:bg-white focus:bg-white border border-[#E5E5E5] rounded-xl text-xs font-bold text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#F4C430] transition-all cursor-pointer"
                title="Filter by session date"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#111111] p-0.5"
                  title="Clear date filter"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-2.5 py-2 text-xs font-bold rounded-xl border transition-all ${
                selectedDate === todayStr
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-[#FAFAFA] text-[#737373] hover:text-[#111111] border-[#E5E5E5]'
              }`}
              title="Filter to today's sessions"
            >
              Today
            </button>
          </div>

          {/* Status Filter Toggle Pills */}
          <div className="flex items-center bg-[#FAFAFA] p-1 rounded-xl border border-[#E5E5E5] gap-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-[#111111] shadow-xs'
                  : 'text-[#737373] hover:text-[#111111]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('present')}
              className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                statusFilter === 'present'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-[#737373] hover:text-emerald-700'
              }`}
            >
              Present
            </button>
            <button
              onClick={() => setStatusFilter('late')}
              className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                statusFilter === 'late'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-[#737373] hover:text-amber-700'
              }`}
            >
              Late
            </button>
            <button
              onClick={() => setStatusFilter('absent')}
              className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                statusFilter === 'absent'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-[#737373] hover:text-rose-700'
              }`}
            >
              Absent
            </button>
          </div>
        </div>

        {/* Active Filter Indicators & Reset Action */}
        {(searchQuery || selectedOfferingId !== 'all' || selectedDate || statusFilter !== 'all') && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F5F5F5] text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-[#737373]">
              <Filter size={13} className="text-[#F4C430]" />
              <span className="font-semibold text-[#111111]">Active Filters:</span>
              {selectedOfferingId !== 'all' && (
                <span className="bg-[#F5F5F5] text-[#111111] px-2 py-0.5 rounded-md font-medium border border-[#E5E5E5]">
                  Class: {offeringsMap[selectedOfferingId]?.subject_name || offeringsMap[selectedOfferingId]?.subject?.name || 'Selected'}
                </span>
              )}
              {selectedDate && (
                <span className="bg-[#F5F5F5] text-[#111111] px-2 py-0.5 rounded-md font-medium border border-[#E5E5E5]">
                  Date: {selectedDate}
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="bg-[#F5F5F5] text-[#111111] px-2 py-0.5 rounded-md font-medium border border-[#E5E5E5] capitalize">
                  Status: {statusFilter}
                </span>
              )}
              {searchQuery && (
                <span className="bg-[#F5F5F5] text-[#111111] px-2 py-0.5 rounded-md font-medium border border-[#E5E5E5]">
                  Search: "{searchQuery}"
                </span>
              )}
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedOfferingId('all');
                setSelectedDate('');
                setStatusFilter('all');
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={12} />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* ── TAB 1: ALL ATTENDANCE LOG RECORDS TABLE ── */}
      {activeTab === 'records' && (
        <div className="card card-elevated bg-white border border-[#E5E5E5] rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F5F5F5]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#111111]">
                Marked Attendance Records
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FAFAFA] text-[#737373] border border-[#E5E5E5]">
                {filteredRecords.length} records
              </span>
            </div>
            <span className="text-[11px] text-[#737373] font-medium hidden sm:inline">
              Sorted by session date & check-in time
            </span>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#737373]">
              <div className="w-8 h-8 rounded-full border-2 border-[#E5E5E5] border-t-[#F4C430] animate-spin" />
              <span className="text-xs font-medium">Loading your attendance records...</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-16 text-center text-[#737373] bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E5E5] p-6">
              <ClipboardCheck size={36} className="mx-auto mb-2 text-[#A3A3A3]" />
              <p className="text-sm font-bold text-[#111111]">No attendance records found</p>
              <p className="text-xs text-[#737373] mt-1 max-w-md mx-auto">
                {attendanceRecords.length === 0
                  ? "You haven't recorded attendance for any student sessions yet. When you or students mark attendance during class, entries will automatically appear here."
                  : "No attendance records match your active filter criteria. Try resetting your search or date filters."}
              </p>
              {(searchQuery || selectedOfferingId !== 'all' || selectedDate || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedOfferingId('all');
                    setSelectedDate('');
                    setStatusFilter('all');
                  }}
                  className="mt-4 px-3.5 py-1.5 bg-[#111111] text-white text-xs font-bold rounded-xl interactive"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F0F0F0]">
                    <th className="py-3 px-3 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Date</th>
                    <th className="py-3 px-3 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Student Name</th>
                    <th className="py-3 px-3 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Class / Subject</th>
                    <th className="py-3 px-3 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Status</th>
                    <th className="py-3 px-3 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Timestamp</th>
                    <th className="py-3 px-3 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider text-right">Quick Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAFAFA]">
                  {filteredRecords.map(rec => {
                    const student = studentsMap[rec.student_id] || rec.student;
                    const slot = slotsMap[rec.slot_id] || rec.slot;
                    const offering = offeringsMap[slot?.offering_id || ''] || (slot?.offering as any);
                    const subjectTitle = offering?.subject_name || offering?.subject?.name || offering?.subject || rec.subject || 'Class';
                    const gradeName = offering?.class?.name || (offering?.class?.grade ? `Grade ${offering?.class?.grade}` : '');
                    const boardName = offering?.class?.board?.name || '';
                    const timeMarked = rec.marked_at ? new Date(rec.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
                    const isUpdating = updatingId === rec.student_id;

                    const studentInitials = (student?.full_name || 'Student')
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <tr key={rec.id} className="hover:bg-[#FAFAFA]/70 transition-colors">
                        {/* Session Date */}
                        <td className="py-3.5 px-3 text-xs font-bold text-[#111111] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-[#737373]" />
                            <span>{rec.session_date}</span>
                          </div>
                        </td>

                        {/* Student Name */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#111111] text-[#F4C430] flex items-center justify-center font-bold text-xs shrink-0">
                              {studentInitials}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-[#111111] block truncate">
                                {student?.full_name || rec.student_id}
                              </span>
                              <span className="text-[10px] text-[#737373] block truncate">
                                {(student as any)?.email || 'Enrolled student'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Class / Subject */}
                        <td className="py-3.5 px-3">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-[#111111] block truncate">
                              {subjectTitle}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-[#737373] mt-0.5">
                              {gradeName && <span>{gradeName}</span>}
                              {gradeName && boardName && <span>·</span>}
                              {boardName && (
                                <span className="bg-[#F0F0F0] text-[#525252] px-1 py-0.2 rounded font-semibold text-[9px]">
                                  {boardName}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3">
                          {rec.status === 'present' ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200"
                              title="Locked: Status is recorded. Click another status in Quick Edit to request a change."
                            >
                              <Check size={12} strokeWidth={3} /> Present <Lock size={10} className="text-emerald-600/70 ml-0.5" />
                            </span>
                          ) : rec.status === 'late' ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200"
                              title="Locked: Status is recorded. Click another status in Quick Edit to request a change."
                            >
                              <Clock size={12} /> Late <Lock size={10} className="text-amber-600/70 ml-0.5" />
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200"
                              title="Locked: Status is recorded. Click another status in Quick Edit to request a change."
                            >
                              <X size={12} strokeWidth={3} /> Absent <Lock size={10} className="text-rose-600/70 ml-0.5" />
                            </span>
                          )}
                        </td>

                        {/* Timestamp & Mode */}
                        <td className="py-3.5 px-3 text-xs font-medium text-[#737373] whitespace-nowrap">
                          <span className="font-semibold text-[#111111]">{timeMarked}</span>
                          <span className="text-[10px] text-[#A3A3A3] block capitalize">
                            via {rec.marked_by || 'teacher'}
                          </span>
                        </td>

                        {/* Quick Edit (P / L / A) */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center bg-[#F5F5F5] p-0.5 rounded-lg border border-[#E5E5E5]">
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleTeacherClickAttendance(
                                rec.student_id,
                                student?.full_name || 'Student',
                                rec.slot_id,
                                rec.session_date,
                                rec.status,
                                'present',
                                subjectTitle
                              )}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                                rec.status === 'present'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-[#737373] hover:text-emerald-700 hover:bg-white'
                              }`}
                              title={rec.status === 'present' ? 'Status is recorded as Present (Locked)' : 'Change status to Present'}
                            >
                              P
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleTeacherClickAttendance(
                                rec.student_id,
                                student?.full_name || 'Student',
                                rec.slot_id,
                                rec.session_date,
                                rec.status,
                                'late',
                                subjectTitle
                              )}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                                rec.status === 'late'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-[#737373] hover:text-amber-700 hover:bg-white'
                              }`}
                              title={rec.status === 'late' ? 'Status is recorded as Late (Locked)' : 'Change status to Late'}
                            >
                              L
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleTeacherClickAttendance(
                                rec.student_id,
                                student?.full_name || 'Student',
                                rec.slot_id,
                                rec.session_date,
                                rec.status,
                                'absent',
                                subjectTitle
                              )}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                                rec.status === 'absent'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-[#737373] hover:text-rose-700 hover:bg-white'
                              }`}
                              title={rec.status === 'absent' ? 'Status is recorded as Absent (Locked)' : 'Change status to Absent'}
                            >
                              A
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: BY ASSIGNED CLASS / OFFERING ROSTER BREAKDOWN ── */}
      {activeTab === 'class_rosters' && (
        <div className="space-y-4">
          {offerings.length === 0 ? (
            <div className="card bg-white border border-[#E5E5E5] rounded-2xl p-12 text-center text-[#737373]">
              <BookOpen size={36} className="mx-auto mb-2 text-[#A3A3A3]" />
              <p className="text-sm font-bold text-[#111111]">No Assigned Classes</p>
              <p className="text-xs text-[#737373] mt-1">
                You do not currently have any class offerings assigned by the platform administrator.
              </p>
            </div>
          ) : (
            offerings.map(off => {
              // 1. Resolve enrolled students for this offering from real enrollment records
              const directEnrolledIds = new Set(
                enrollments.filter(e => e.offering_id === off.id).map(e => e.student_id)
              );

              // 2. Resolve enrolled students from roster records (matching offering ID or class ID)
              const rosterEnrolledIds = new Set<string>();
              roster.forEach(r => {
                if (r.role !== 'student') return;
                const matchesOffering = Array.isArray(r.class_ids) && (
                  r.class_ids.includes(off.id) ||
                  (off.class_id && r.class_ids.includes(off.class_id))
                );
                if (matchesOffering) {
                  rosterEnrolledIds.add(r.profile_id || r.id);
                }
              });

              // 3. Resolve students assigned by grade/board/stream or class_id
              const classEnrolledIds = new Set<string>();
              students.forEach(s => {
                if (s.role !== 'student') return;
                const matchClassId = s.class_id && off.class_id && s.class_id === off.class_id;
                const sGrade = s.class?.grade || (s as any).grade;
                const sBoardId = s.board_id || s.board?.id || (s.class as any)?.board_id;
                const offGrade = off.class?.grade || (off as any).grade;
                const offBoardId = off.class?.board_id || off.board_id || (off.class as any)?.board?.id;
                const matchBoardGrade = (
                  sBoardId &&
                  sGrade &&
                  offBoardId &&
                  offGrade &&
                  sBoardId === offBoardId &&
                  String(sGrade) === String(offGrade) &&
                  (!off.stream_id || s.stream_id === off.stream_id || (s as any).stream === off.stream_id)
                );
                if (matchClassId || matchBoardGrade) {
                  classEnrolledIds.add(s.id);
                }
              });

              // Attendance logs belonging to this offering
              const offRecords = attendanceRecords.filter(r => {
                const slot = slotsMap[r.slot_id] || r.slot;
                const offId = slot?.offering_id || (slot?.offering as any)?.id || r.class_id;
                return offId === off.id;
              });

              const attEnrolledIds = new Set<string>();
              offRecords.forEach(r => {
                if (r.student_id) attEnrolledIds.add(r.student_id);
              });

              // Combine all enrolled student IDs
              const allEnrolledIds = new Set([
                ...directEnrolledIds,
                ...rosterEnrolledIds,
                ...classEnrolledIds,
                ...attEnrolledIds
              ]);

              // Individual breakdown for each enrolled student
              const enrolledStudentList = Array.from(allEnrolledIds).map(stId => {
                const profileObj = studentsMap[stId] || students.find(s => s.id === stId) || (roster.find(r => r.profile_id === stId || r.id === stId) as any) || { id: stId, full_name: 'Student ' + stId.slice(0, 6) } as Profile;
                const stLogs = offRecords.filter(r => r.student_id === stId || (r.student && r.student.id === stId));
                const present = stLogs.filter(r => r.status === 'present').length;
                const late = stLogs.filter(r => r.status === 'late').length;
                const absent = stLogs.filter(r => r.status === 'absent').length;
                const total = stLogs.length;
                const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
                const latestLog = [...stLogs].sort((a, b) => new Date(b.session_date || b.created_at || '').getTime() - new Date(a.session_date || a.created_at || '').getTime())[0];

                return {
                  id: stId,
                  student: profileObj,
                  present,
                  late,
                  absent,
                  total,
                  rate,
                  hasLogs: total > 0,
                  latestStatus: latestLog ? latestLog.status : null,
                };
              }).sort((a, b) => (a.student?.full_name || '').localeCompare(b.student?.full_name || ''));

              const offPresent = offRecords.filter(r => r.status === 'present').length;
              const offLate = offRecords.filter(r => r.status === 'late').length;
              const offAbsent = offRecords.filter(r => r.status === 'absent').length;
              const offTotal = offRecords.length;
              const offRate = offTotal > 0 ? Math.round(((offPresent + offLate) / offTotal) * 100) : 0;
              const isExpanded = expandedOfferingId === off.id;

              const subjectTitle = off.subject_name || off.subject?.name || 'Class';
              const gradeName = off.class?.name || (off.class?.grade ? `Grade ${off.class.grade}` : '');
              const boardName = off.class?.board?.name || '';

              return (
                <div key={off.id} className="card card-elevated bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden">
                  {/* Card Header */}
                  <div
                    onClick={() => setExpandedOfferingId(isExpanded ? null : off.id)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-[#FAFAFA] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#111111] text-[#F4C430] flex items-center justify-center font-bold text-sm shrink-0">
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#111111]">{subjectTitle}</h4>
                          {boardName && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0F0F0] text-[#525252] border border-[#E5E5E5]">
                              {boardName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#737373] mt-0.5">
                          {gradeName ? `${gradeName} · ` : ''}
                          {enrolledStudentList.length === 0 ? (
                            <span className="text-amber-600 font-medium">No students enrolled yet</span>
                          ) : (
                            <span>{enrolledStudentList.length} {enrolledStudentList.length === 1 ? 'enrolled student tracked' : 'enrolled students tracked'}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#F5F5F5]">
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs font-bold text-[#111111] block">
                            {offTotal > 0 ? `${offRate}% Attendance` : 'No Logs Recorded'}
                          </span>
                          <span className="text-[10px] text-[#737373] block">
                            {offPresent} P · {offLate} L · {offAbsent} A ({offTotal} {offTotal === 1 ? 'log' : 'logs'})
                          </span>
                        </div>
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-xs ${
                          offTotal === 0
                            ? 'bg-[#F5F5F5] border-[#E5E5E5] text-[#737373]'
                            : offRate >= 75
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}>
                          {offTotal > 0 ? `${offRate}%` : '0%'}
                        </div>
                      </div>

                      <button className="p-1 text-[#737373] hover:text-[#111111]">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Class Roster */}
                  {isExpanded && (
                    <div className="border-t border-[#E5E5E5] bg-[#FAFAFA] p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                          Student Attendance Breakdown ({enrolledStudentList.length})
                        </h5>
                        <button
                          onClick={() => {
                            setSelectedOfferingId(off.id);
                            setActiveTab('records');
                          }}
                          className="text-xs font-bold text-[#111111] hover:text-[#F4C430] flex items-center gap-1 transition-colors"
                        >
                          <span>View Class Logs</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>

                      {enrolledStudentList.length === 0 ? (
                        <div className="py-8 text-center bg-white rounded-xl border border-[#E5E5E5] px-4">
                          <GraduationCap size={28} className="mx-auto mb-2 text-[#A3A3A3]" />
                          <p className="text-xs font-bold text-[#111111]">No students enrolled yet</p>
                          <p className="text-[11px] text-[#737373] mt-0.5">
                            No students are currently enrolled in this specific class offering.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
                                <th className="py-2.5 px-3 text-[10px] font-black text-[#A3A3A3] uppercase">Student</th>
                                <th className="py-2.5 px-3 text-[10px] font-black text-[#A3A3A3] uppercase">Attended</th>
                                <th className="py-2.5 px-3 text-[10px] font-black text-[#A3A3A3] uppercase">Missed</th>
                                <th className="py-2.5 px-3 text-[10px] font-black text-[#A3A3A3] uppercase">Attendance Rate</th>
                                <th className="py-2.5 px-3 text-[10px] font-black text-[#A3A3A3] uppercase text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F5F5F5]">
                              {enrolledStudentList.map(item => (
                                <tr key={item.id} className="hover:bg-[#FAFAFA]/50 transition-colors">
                                  <td className="py-2.5 px-3">
                                    <span className="text-xs font-bold text-[#111111] block">
                                      {item.student?.full_name || item.id}
                                    </span>
                                    <span className="text-[10px] text-[#737373] block">
                                      {(item.student as any)?.email || (item.student?.class?.grade ? `Grade ${item.student.class.grade} Student` : (item.student as any)?.grade ? `Grade ${(item.student as any).grade} Student` : 'Enrolled Student')}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-xs font-semibold text-emerald-700">
                                    {item.total > 0 ? `${item.present + item.late} / ${item.total} classes` : '0 / 0 classes'}
                                  </td>
                                  <td className="py-2.5 px-3 text-xs font-semibold text-rose-700">
                                    {item.absent} {item.absent === 1 ? 'class' : 'classes'}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-20 bg-[#F0F0F0] rounded-full h-2 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${
                                            !item.hasLogs
                                              ? 'bg-neutral-300'
                                              : item.rate >= 75
                                              ? 'bg-emerald-500'
                                              : 'bg-rose-500'
                                          }`}
                                          style={{ width: item.hasLogs ? `${item.rate}%` : '0%' }}
                                        />
                                      </div>
                                      <span className="text-xs font-bold text-[#111111]">
                                        {item.hasLogs ? `${item.rate}%` : '—'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    {!item.hasLogs ? (
                                      <span className="text-[10px] font-bold bg-[#F5F5F5] text-[#737373] px-2 py-0.5 rounded-full border border-[#E5E5E5]">
                                        Enrolled (No Logs)
                                      </span>
                                    ) : item.rate < 75 && item.total >= 3 ? (
                                      <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                                        Low Attendance
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                                        Good Standing
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Attendance Status Confirmation Lock Modal ── */}
      {pendingChange && (
        <ConfirmModal
          open={true}
          title="Update Recorded Attendance"
          description={`Are you sure you want to change the attendance status for ${pendingChange.studentName} from "${pendingChange.currentStatus.toUpperCase()}" to "${pendingChange.newStatus.toUpperCase()}" for ${pendingChange.subjectName || 'this session'} on ${pendingChange.sessionDate}?`}
          confirmLabel={`Confirm ${pendingChange.newStatus.charAt(0).toUpperCase() + pendingChange.newStatus.slice(1)}`}
          cancelLabel="Cancel"
          danger={pendingChange.newStatus === 'absent'}
          onConfirm={async () => {
            await executeAttendanceUpdate(
              pendingChange.studentId,
              pendingChange.slotId,
              pendingChange.sessionDate,
              pendingChange.newStatus,
              pendingChange.studentName
            );
            setPendingChange(null);
          }}
          onClose={() => setPendingChange(null)}
        >
          <div className="mt-3 p-3 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#737373]">Student:</span>
              <span className="font-bold text-[#111111]">{pendingChange.studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Session Date:</span>
              <span className="font-bold text-[#111111]">{pendingChange.sessionDate}</span>
            </div>
            {pendingChange.subjectName && (
              <div className="flex justify-between">
                <span className="text-[#737373]">Subject:</span>
                <span className="font-bold text-[#111111]">{pendingChange.subjectName}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-[#E5E5E5]">
              <span className="text-[#737373]">New Status:</span>
              <span className={`font-black uppercase ${
                pendingChange.newStatus === 'present'
                  ? 'text-emerald-600'
                  : pendingChange.newStatus === 'late'
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}>
                {pendingChange.newStatus}
              </span>
            </div>
          </div>
        </ConfirmModal>
      )}
    </TeacherShell>
  );
};

export default TeacherAttendancePage;
