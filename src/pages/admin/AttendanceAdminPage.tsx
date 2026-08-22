import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import {
  ClipboardCheck, Search, CheckCircle2,
  Clock, AlertTriangle, ChevronDown, ChevronRight, RefreshCw,
  GraduationCap, ShieldCheck, X, Users, BookOpen, Layers, UserCheck
} from 'lucide-react';
import TeacherAttendanceRatingsAdminView from '../../components/admin/TeacherAttendanceRatingsAdminView';
import {
  getAllTeachers,
  getAllOfferings,
  getAllSlots,
  getAllStudents,
  getAllEnrollments,
  getAllAttendance,
  getOverallAttendanceStats,
  recordAttendance,
  upsertAttendanceBatch,
  getAllTeacherAttendanceRatings
} from '../../lib/db';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import {
  DAYS_OF_WEEK_SHORT,
  formatTime12h
} from '../../lib/scheduleUtils';
import type { Teacher, ClassOffering, ClassSlot, Profile, Attendance, AttendanceStatus, Enrollment, TeacherAttendanceRating } from '../../types';
import { toast } from 'sonner';

export const AttendanceAdminPage: React.FC = () => {
  const { classId } = useParams<{ classId?: string }>();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [slots, setSlots] = useState<ClassSlot[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [teacherRatings, setTeacherRatings] = useState<TeacherAttendanceRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
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

  // Filters State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'late' | 'absent' | 'low_attendance'>('all');
  const [expandedTeacherIds, setExpandedTeacherIds] = useState<Set<string>>(new Set());
  const [expandedClassIds, setExpandedClassIds] = useState<Set<string>>(new Set());
  const [hideEmptyClasses, setHideEmptyClasses] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'by_teacher' | 'all_records' | 'low_attendance' | 'teacher_ratings'>('by_teacher');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Auto-filter and expand if classId param is provided in route
  useEffect(() => {
    if (classId && offerings.length > 0) {
      const matched = offerings.find(o => o.id === classId);
      if (matched) {
        if (matched.teacher_id) {
          setSelectedTeacherId(matched.teacher_id);
          setExpandedTeacherIds(new Set([matched.teacher_id]));
        }
        setExpandedClassIds(new Set([matched.id]));
        setSelectedSubject(matched.subject_name || matched.subject || 'all');
      }
    }
  }, [classId, offerings]);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [tList, oList, sList, stList, eList, attList, overallStats, ratingsList] = await Promise.all([
        getAllTeachers(),
        getAllOfferings(),
        getAllSlots(),
        getAllStudents(),
        getAllEnrollments(),
        getAllAttendance(),
        getOverallAttendanceStats(),
        getAllTeacherAttendanceRatings(),
      ]);

      setTeachers(tList);
      setOfferings(oList);
      setSlots(sList);
      setStudents(stList);
      setEnrollments(eList);
      setAttendanceRecords(attList);
      setTeacherRatings(ratingsList);
      setStats(overallStats);

      // Collapsed by default unless a specific class was requested via URL
      if (classId) {
        const matched = oList.find(o => o.id === classId);
        if (matched?.teacher_id) {
          setExpandedTeacherIds(new Set([matched.teacher_id]));
          setExpandedClassIds(new Set([matched.id]));
        }
      }
    } catch (err) {
      console.error('Failed loading admin attendance data:', err);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Subscribe to realtime updates on attendance
  useRealtimeTable({
    table: 'attendance',
    debounceMs: 1500,
    onAny: async () => {
      const [attList, overallStats] = await Promise.all([
        getAllAttendance(),
        getOverallAttendanceStats(),
      ]);
      setAttendanceRecords(attList);
      setStats(overallStats);
    }
  });

  useRealtimeTable({
    table: 'teacher_attendance_ratings',
    debounceMs: 1000,
    onAny: async () => {
      const ratingsList = await getAllTeacherAttendanceRatings();
      setTeacherRatings(ratingsList);
    }
  });

  // Toggle teacher accordion
  const toggleTeacherExpand = (tId: string) => {
    setExpandedTeacherIds(prev => {
      const next = new Set(prev);
      if (next.has(tId)) next.delete(tId);
      else next.add(tId);
      return next;
    });
  };

  // Toggle class roster inline drawer
  const toggleClassExpand = (offId: string) => {
    setExpandedClassIds(prev => {
      const next = new Set(prev);
      if (next.has(offId)) next.delete(offId);
      else next.add(offId);
      return next;
    });
  };

  // Expand or collapse all teachers
  const toggleAllTeachers = () => {
    if (expandedTeacherIds.size > 0) {
      setExpandedTeacherIds(new Set());
    } else {
      setExpandedTeacherIds(new Set(teachers.map(t => t.id)));
    }
  };

  // Toggle or record single student attendance
  const handleAdminToggleAttendance = async (
    studentId: string,
    slotId: string,
    sessionDate: string,
    newStatus: AttendanceStatus
  ) => {
    setUpdatingId(studentId);

    // Optimistic UI update
    setAttendanceRecords(prev => {
      const remaining = prev.filter(
        a => !(a.student_id === studentId && a.slot_id === slotId && a.session_date === sessionDate)
      );
      const newRec: Attendance = {
        id: `att-admin-${Date.now()}-${studentId}`,
        student_id: studentId,
        slot_id: slotId,
        session_date: sessionDate,
        status: newStatus,
        marked_at: new Date().toISOString(),
        marked_by: 'admin'
      };
      return [...remaining, newRec];
    });

    try {
      await recordAttendance({
        student_id: studentId,
        slot_id: slotId,
        session_date: sessionDate,
        status: newStatus,
        marked_by: 'admin'
      });
      toast.success(`Marked student as ${newStatus}`);
    } catch (err) {
      console.error('Failed to record attendance:', err);
      toast.error('Failed to update attendance');
    } finally {
      setUpdatingId(null);
    }
  };

  // Batch mark all enrolled students in a slot as Present
  const handleMarkAllSlotPresent = async (slotId: string, offeringId: string) => {
    const offeringStudentIds = enrollments
      .filter(e => e.offering_id === offeringId)
      .map(e => e.student_id);

    if (offeringStudentIds.length === 0) {
      toast.info('No students enrolled in this offering');
      return;
    }

    const updates = offeringStudentIds.map(stId => ({
      student_id: stId,
      slot_id: slotId,
      session_date: selectedDate,
      status: 'present' as AttendanceStatus,
      marked_at: new Date().toISOString(),
    }));

    // Optimistic update
    setAttendanceRecords(prev => {
      const studentIdSet = new Set(offeringStudentIds);
      const remaining = prev.filter(
        a => !(studentIdSet.has(a.student_id) && a.slot_id === slotId && a.session_date === selectedDate)
      );
      return [
        ...remaining,
        ...updates.map(u => ({ ...u, id: `att-batch-${Date.now()}-${u.student_id}`, marked_by: 'admin' as const }))
      ];
    });

    try {
      await upsertAttendanceBatch(updates);
      toast.success(`Marked ${offeringStudentIds.length} students as Present`);
    } catch (err) {
      console.error('Batch marking failed:', err);
      toast.error('Failed to mark all as present');
    }
  };

  // Unique Subjects for filter
  const allSubjects = useMemo(() => {
    const subs = new Set<string>();
    offerings.forEach(o => {
      const name = o.subject_name || o.subject;
      if (name) subs.add(name);
    });
    return Array.from(subs);
  }, [offerings]);

  return (
    <AdminShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <SectionHeader
            title="Attendance Manager"
            description="Institutional attendance tracking across every teacher, class slot, and student session."
          />
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={fetchData}
            className="btn btn-secondary text-xs flex items-center gap-1.5 py-2 px-3"
            title="Refresh Attendance Data"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Attendance Rate */}
        <div className="stat-card flex flex-col justify-between min-h-[120px] interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Overall Rate</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#111111]">{stats.attendanceRate}%</div>
            <div className="text-xs text-[#737373] font-medium mt-0.5">Across all recorded sessions</div>
          </div>
          <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between text-[10px] font-bold text-emerald-700">
            <span>Institution Target: 85%+</span>
            <span>{stats.attendanceRate >= 85 ? '✓ On Track' : '⚠ Below Target'}</span>
          </div>
        </div>

        {/* Present Sessions */}
        <div className="stat-card flex flex-col justify-between min-h-[120px] interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Present Logs</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ClipboardCheck size={14} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#111111]">{stats.presentCount}</div>
            <div className="text-xs text-[#737373] font-medium mt-0.5">Student presence check-ins</div>
          </div>
          <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between text-[10px] font-bold text-[#737373]">
            <span>Late Check-ins: {stats.lateCount}</span>
            <span className="text-blue-600">Active</span>
          </div>
        </div>

        {/* Absent Count */}
        <div className="stat-card flex flex-col justify-between min-h-[120px] interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Absent Logs</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <X size={14} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#111111]">{stats.absentCount}</div>
            <div className="text-xs text-[#737373] font-medium mt-0.5">Missed lecture sessions</div>
          </div>
          <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between text-[10px] font-bold text-rose-600">
            <span>Requires Follow-up</span>
            <span>{stats.absentCount > 0 ? 'Action Needed' : 'None'}</span>
          </div>
        </div>

        {/* Low Attendance Alerts (<75%) */}
        <div
          onClick={() => setActiveTab('low_attendance')}
          className="stat-card flex flex-col justify-between min-h-[120px] cursor-pointer hover:border-amber-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Low Attendance (&lt;75%)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle size={14} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600">{stats.lowAttendanceStudents.length}</div>
            <div className="text-xs text-[#737373] font-medium mt-0.5">Students with &lt;75% attendance (min. 10 sessions)</div>
          </div>
          <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between text-[10px] font-bold text-amber-700">
            <span>Click to review list</span>
            <ChevronRight size={12} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E5E5] mb-6">
        <button
          onClick={() => setActiveTab('by_teacher')}
          className={`pb-3 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'by_teacher' ? 'text-[#111111]' : 'text-[#737373] hover:text-[#111111]'
          }`}
        >
          <GraduationCap size={15} />
          <span>By Teacher & Class Breakdown</span>
          {activeTab === 'by_teacher' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F4C430]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('all_records')}
          className={`pb-3 text-xs font-bold transition-colors relative flex items-center gap-1.5 ml-4 ${
            activeTab === 'all_records' ? 'text-[#111111]' : 'text-[#737373] hover:text-[#111111]'
          }`}
        >
          <ClipboardCheck size={15} />
          <span>All Attendance Logs</span>
          {activeTab === 'all_records' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F4C430]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('low_attendance')}
          className={`pb-3 text-xs font-bold transition-colors relative flex items-center gap-1.5 ml-4 ${
            activeTab === 'low_attendance' ? 'text-amber-700' : 'text-[#737373] hover:text-amber-700'
          }`}
        >
          <AlertTriangle size={15} />
          <span>Low Attendance Watchlist ({stats.lowAttendanceStudents.length})</span>
          {activeTab === 'low_attendance' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('teacher_ratings')}
          className={`pb-3 text-xs font-bold transition-colors relative flex items-center gap-1.5 ml-4 ${
            activeTab === 'teacher_ratings' ? 'text-[#111111]' : 'text-[#737373] hover:text-[#111111]'
          }`}
        >
          <UserCheck size={15} />
          <span>Teacher Attendance Ratings ({teacherRatings.length})</span>
          {activeTab === 'teacher_ratings' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F4C430]" />
          )}
        </button>
      </div>

      {/* Filters Toolbar for Student Attendance Tabs */}
      {activeTab !== 'teacher_ratings' && (
        <div className="card mb-6 p-4 bg-white border border-[#E5E5E5] rounded-xl shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Session Date */}
            <div>
              <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-1">Session Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg text-[#111111] font-semibold focus:outline-hidden"
              />
            </div>

            {/* Teacher Selector */}
            <div>
              <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-1">Teacher</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg text-[#111111] font-semibold focus:outline-hidden"
              >
                <option value="all">All Teachers ({teachers.length})</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selector */}
            <div>
              <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-1">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg text-[#111111] font-semibold focus:outline-hidden"
              >
                <option value="all">All Subjects</option>
                {allSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full py-1.5 px-2.5 text-xs bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg text-[#111111] font-semibold focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="present">Present Only</option>
                <option value="late">Late Only</option>
                <option value="absent">Absent Only</option>
              </select>
            </div>

            {/* Search Box */}
            <div>
              <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-1">Search Student</label>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#737373]" />
                <input
                  type="text"
                  placeholder="Name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg text-[#111111] font-semibold focus:outline-hidden placeholder:text-[#A3A3A3]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 1: TEACHER & CLASS BREAKDOWN (Compact Scannable Table Layout) ── */}
      {activeTab === 'by_teacher' && (
        <div className="space-y-4">
          {/* Top Bar Controls & Noise Reduction Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E5E5E5] rounded-xl px-4 py-2.5 shadow-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={toggleAllTeachers}
                className="text-xs font-bold text-[#111111] hover:text-[#000000] bg-[#F5F5F5] hover:bg-[#E5E5E5] px-3 py-1.5 rounded-lg border border-[#E0E0E0] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Layers size={13} className="text-[#525252]" />
                <span>{expandedTeacherIds.size === teachers.length && teachers.length > 0 ? 'Collapse All Teachers' : 'Expand All Teachers'}</span>
              </button>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-[#525252] hover:text-[#111111]">
                <input
                  type="checkbox"
                  checked={hideEmptyClasses}
                  onChange={(e) => setHideEmptyClasses(e.target.checked)}
                  className="rounded border-[#D4D4D4] text-[#111111] focus:ring-[#F4C430] w-3.5 h-3.5"
                />
                <span>Hide classes with 0 enrolled students</span>
              </label>
            </div>

            <div className="text-[11px] font-semibold text-[#737373] flex items-center gap-1.5">
              <Users size={13} className="text-[#A3A3A3]" />
              <span>
                Showing {teachers.filter(t => selectedTeacherId === 'all' || t.id === selectedTeacherId).length} Teachers · {offerings.filter(o => selectedSubject === 'all' || (o.subject_name || o.subject) === selectedSubject).length} Classes
              </span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map(n => (
                <div key={n} className="bg-white border border-[#E5E5E5] rounded-xl p-4 space-y-3">
                  <div className="h-5 bg-gray-100 rounded w-48" />
                  <div className="h-4 bg-gray-100 rounded w-32" />
                  <div className="h-16 bg-gray-50 rounded" />
                </div>
              ))}
            </div>
          ) : teachers.length === 0 ? (
            <div className="card text-center py-16 bg-white border border-[#E5E5E5] rounded-2xl">
              <GraduationCap size={32} className="text-[#A3A3A3] mx-auto mb-2" />
              <h3 className="font-bold text-sm text-[#111111]">No Teachers Found</h3>
              <p className="text-xs text-[#737373] mt-1">Configure teachers and class offerings to track attendance.</p>
            </div>
          ) : (
            teachers
              .filter(t => selectedTeacherId === 'all' || t.id === selectedTeacherId)
              .map(teacher => {
                const rawTeacherOfferings = offerings.filter(o => o.teacher_id === teacher.id);
                const isExpanded = expandedTeacherIds.has(teacher.id);

                // Calculate teacher overall counts for selectedDate
                let teacherTotalEnrolled = 0;
                let teacherPresent = 0;
                let teacherLate = 0;
                let teacherAbsent = 0;
                let teacherUnmarked = 0;

                const filteredOfferings = rawTeacherOfferings
                  .filter(o => selectedSubject === 'all' || (o.subject_name || o.subject) === selectedSubject)
                  .filter(o => {
                    if (!hideEmptyClasses) return true;
                    const enrolledCount = enrollments.filter(e => e.offering_id === o.id).length;
                    return enrolledCount > 0;
                  });

                // Compute aggregated numbers across this teacher's classes
                rawTeacherOfferings.forEach(off => {
                  const offSlots = slots.filter(s => s.offering_id === off.id || (s.offering as any)?.id === off.id);
                  const offStudentIds = enrollments.filter(e => e.offering_id === off.id).map(e => e.student_id);
                  teacherTotalEnrolled += offStudentIds.length;

                  offStudentIds.forEach(stId => {
                    const rec = attendanceRecords.find(
                      a => a.student_id === stId && (offSlots.some(s => s.id === a.slot_id) || a.slot_id === offSlots[0]?.id) && a.session_date === selectedDate
                    );
                    const stStatus = rec?.status || 'unmarked';
                    if (stStatus === 'present') teacherPresent++;
                    else if (stStatus === 'late') teacherLate++;
                    else if (stStatus === 'absent') teacherAbsent++;
                    else teacherUnmarked++;
                  });
                });

                return (
                  <div
                    key={teacher.id}
                    className="bg-white border border-[#E5E5E5] rounded-xl shadow-xs overflow-hidden transition-all"
                  >
                    {/* Teacher Header Accordion Bar */}
                    <div
                      onClick={() => toggleTeacherExpand(teacher.id)}
                      className="p-3.5 bg-[#FAFAFA] border-b border-[#F0F0F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-[#F5F5F5] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#111111] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {teacher.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-extrabold text-[#111111]">{teacher.full_name}</h3>
                            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md border border-blue-200">
                              {rawTeacherOfferings.length} {rawTeacherOfferings.length === 1 ? 'Class' : 'Classes'}
                            </span>
                            <span className="text-[10px] bg-[#F0F0F0] text-[#525252] font-bold px-2 py-0.5 rounded-md border border-[#E5E5E5]">
                              {teacherTotalEnrolled} Enrolled
                            </span>
                          </div>
                          <p className="text-[11px] text-[#737373] mt-0.5 font-medium">
                            {teacher.email || 'Faculty Staff'} · {(teacher as any).subjects?.join(', ') || 'Academic Faculty'}
                          </p>
                        </div>
                      </div>

                      {/* Teacher Date Attendance Summary Badges */}
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                            ✓ {teacherPresent} Present
                          </span>
                          {teacherLate > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                              ⏱ {teacherLate} Late
                            </span>
                          )}
                          {teacherAbsent > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md">
                              ✕ {teacherAbsent} Absent
                            </span>
                          )}
                          {teacherUnmarked > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-md">
                              ○ {teacherUnmarked} Unmarked
                            </span>
                          )}
                        </div>

                        <div className="w-6 h-6 rounded-lg bg-white border border-[#E5E5E5] flex items-center justify-center text-[#111111] shrink-0 ml-1">
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                      </div>
                    </div>

                    {/* Compact Table View for Teacher Classes */}
                    {isExpanded && (
                      <div className="p-0">
                        {filteredOfferings.length === 0 ? (
                          <div className="p-6 text-center text-xs text-[#737373] bg-[#FAFAFA]">
                            {rawTeacherOfferings.length > 0 && hideEmptyClasses
                              ? 'All assigned classes currently have 0 enrolled students (Hidden by filter).'
                              : 'No class offerings assigned to this teacher matching filters.'}
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA]/70 text-[10px] font-black text-[#737373] uppercase tracking-wider">
                                  <th className="py-2.5 px-3.5">Subject & Cohort</th>
                                  <th className="py-2.5 px-3">Weekly Timetable</th>
                                  <th className="py-2.5 px-3 text-center">Enrolled</th>
                                  <th className="py-2.5 px-3">Attendance Breakdown ({selectedDate})</th>
                                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#F0F0F0]">
                                {filteredOfferings.map(offering => {
                                  const offeringSlots = slots.filter(
                                    s => s.offering_id === offering.id || (s.offering as any)?.id === offering.id
                                  );
                                  const enrolledStudentIds = enrollments
                                    .filter(e => e.offering_id === offering.id)
                                    .map(e => e.student_id);
                                  const enrolledStudentsList = students.filter(st =>
                                    enrolledStudentIds.includes(st.id) &&
                                    (searchQuery === '' ||
                                      st.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      Boolean((st as any).email && (st as any).email.toLowerCase().includes(searchQuery.toLowerCase())))
                                  );

                                  const isClassExpanded = expandedClassIds.has(offering.id);
                                  const primarySlotId = offeringSlots[0]?.id || 'slot-1';

                                  // Count breakdown on selectedDate
                                  let presCount = 0;
                                  let lateCount = 0;
                                  let absCount = 0;
                                  let unCount = 0;

                                  enrolledStudentsList.forEach(st => {
                                    const rec = attendanceRecords.find(
                                      a => a.student_id === st.id && 
                                           (offeringSlots.some(s => s.id === a.slot_id) || a.slot_id === primarySlotId) && 
                                           a.session_date === selectedDate
                                    );
                                    const status = rec?.status || 'unmarked';
                                    if (status === 'present') presCount++;
                                    else if (status === 'late') lateCount++;
                                    else if (status === 'absent') absCount++;
                                    else unCount++;
                                  });

                                  const totalEnrolledInClass = enrolledStudentsList.length;
                                  const markedCount = presCount + lateCount + absCount;
                                  const markedPct = totalEnrolledInClass > 0 ? Math.round((markedCount / totalEnrolledInClass) * 100) : 0;

                                  // Timetable schedule string / chips
                                  const renderScheduleChips = () => {
                                    if (offeringSlots.length === 0) {
                                      return <span className="text-[10px] text-[#A3A3A3] italic font-medium">No slots scheduled</span>;
                                    }
                                    const sorted = [...offeringSlots].sort((a, b) => {
                                      const dayA = a.day_of_week ?? 0;
                                      const dayB = b.day_of_week ?? 0;
                                      if (dayA !== dayB) return dayA - dayB;
                                      return (a.start_time || '').localeCompare(b.start_time || '');
                                    });

                                    return (
                                      <div className="flex flex-wrap items-center gap-1">
                                        {sorted.map(s => {
                                          const dayLabel = DAYS_OF_WEEK_SHORT[s.day_of_week ?? 0] || 'Day';
                                          const timeLabel = s.start_time ? `${formatTime12h(s.start_time)}` : '';
                                          return (
                                            <span
                                              key={s.id}
                                              className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#F5F5F5] text-[#333333] border border-[#E5E5E5] px-1.5 py-0.5 rounded-md"
                                            >
                                              <span className="text-[#111111] font-black">{dayLabel}</span>
                                              {timeLabel && <span className="text-[#737373]">{timeLabel}</span>}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    );
                                  };

                                  const subjectTitle = offering.subject_name || offering.subject;
                                  const gradeLabel = offering.grade || (offering as any).class?.grade || '10';
                                  const streamLabel = offering.stream ? (typeof offering.stream === 'string' ? offering.stream : (offering.stream as any).name) : null;
                                  const boardLabel = offering.board ? offering.board.toUpperCase() : 'FBISE';

                                  return (
                                    <React.Fragment key={offering.id}>
                                      {/* Main Class Row */}
                                      <tr className={`hover:bg-[#FAFAFA] transition-colors ${isClassExpanded ? 'bg-amber-50/20' : ''}`}>
                                        {/* Subject & Cohort */}
                                        <td className="py-3 px-3.5">
                                          <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#F4C430] shrink-0" />
                                            <div>
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-black text-xs text-[#111111]">{subjectTitle}</span>
                                                <span className="text-[10px] font-bold bg-[#F0F0F0] text-[#525252] px-1.5 py-0.2 rounded">
                                                  Grade {gradeLabel}
                                                </span>
                                                {streamLabel && (
                                                  <span className="text-[10px] font-semibold text-[#737373]">
                                                    · {streamLabel}
                                                  </span>
                                                )}
                                              </div>
                                              <span className="text-[10px] text-[#A3A3A3] font-medium block">
                                                {boardLabel} Board · {offeringSlots.length} lecture {offeringSlots.length === 1 ? 'slot' : 'slots'}
                                              </span>
                                            </div>
                                          </div>
                                        </td>

                                        {/* Weekly Timetable */}
                                        <td className="py-3 px-3">
                                          {renderScheduleChips()}
                                        </td>

                                        {/* Enrolled Count */}
                                        <td className="py-3 px-3 text-center">
                                          <span className={`inline-block text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                                            totalEnrolledInClass > 0
                                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                                          }`}>
                                            {totalEnrolledInClass} {totalEnrolledInClass === 1 ? 'Student' : 'Students'}
                                          </span>
                                        </td>

                                        {/* Attendance Breakdown on selectedDate */}
                                        <td className="py-3 px-3">
                                          <div className="space-y-1.5 min-w-[200px]">
                                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
                                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                                ✓ {presCount}
                                              </span>
                                              {lateCount > 0 && (
                                                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                                  ⏱ {lateCount}
                                                </span>
                                              )}
                                              {absCount > 0 && (
                                                <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                                  ✕ {absCount}
                                                </span>
                                              )}
                                              {unCount > 0 && (
                                                <span className="text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                                  ○ {unCount}
                                                </span>
                                              )}
                                              <span className="text-[9px] text-[#737373] ml-auto font-medium">
                                                {markedPct}% marked
                                              </span>
                                            </div>

                                            {/* Visual Progress Line */}
                                            <div className="w-full h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden flex">
                                              {totalEnrolledInClass > 0 && (
                                                <>
                                                  <div style={{ width: `${(presCount / totalEnrolledInClass) * 100}%` }} className="bg-emerald-500 h-full" />
                                                  <div style={{ width: `${(lateCount / totalEnrolledInClass) * 100}%` }} className="bg-amber-400 h-full" />
                                                  <div style={{ width: `${(absCount / totalEnrolledInClass) * 100}%` }} className="bg-rose-500 h-full" />
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                          <div className="inline-flex items-center gap-2">
                                            {totalEnrolledInClass > 0 && (
                                              <button
                                                onClick={() => handleMarkAllSlotPresent(primarySlotId, offering.id)}
                                                className="text-[10px] font-bold bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                                                title={`Mark all ${totalEnrolledInClass} students Present for ${selectedDate}`}
                                              >
                                                <CheckCircle2 size={11} />
                                                <span>Mark All</span>
                                              </button>
                                            )}

                                            <button
                                              onClick={() => toggleClassExpand(offering.id)}
                                              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                                                isClassExpanded
                                                  ? 'bg-[#111111] text-white border-[#111111]'
                                                  : 'bg-white hover:bg-[#F5F5F5] text-[#111111] border-[#E5E5E5]'
                                              }`}
                                            >
                                              <span>{isClassExpanded ? 'Hide Roster' : 'View Roster'}</span>
                                              <ChevronDown size={12} className={`transition-transform ${isClassExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>

                                      {/* Inline Expandable Student Roster Drawer */}
                                      {isClassExpanded && (
                                        <tr>
                                          <td colSpan={5} className="p-0 bg-[#FAFAFA]/70 border-b border-[#E5E5E5]">
                                            <div className="p-4 space-y-3">
                                              <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E5E5E5]">
                                                <div className="flex items-center gap-2">
                                                  <BookOpen size={14} className="text-[#111111]" />
                                                  <h5 className="font-extrabold text-xs text-[#111111]">
                                                    {subjectTitle} Student Attendance Roster ({selectedDate})
                                                  </h5>
                                                  <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                                                    {enrolledStudentsList.length} Students
                                                  </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                  <button
                                                    onClick={() => handleMarkAllSlotPresent(primarySlotId, offering.id)}
                                                    className="text-[10px] font-bold bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] px-2.5 py-1 rounded-md transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                                                  >
                                                    <CheckCircle2 size={12} />
                                                    <span>Mark All Present</span>
                                                  </button>
                                                  <button
                                                    onClick={() => toggleClassExpand(offering.id)}
                                                    className="text-[10px] font-semibold text-[#737373] hover:text-[#111111] px-2 py-1 bg-[#F5F5F5] rounded-md border border-[#E5E5E5] cursor-pointer"
                                                  >
                                                    Close
                                                  </button>
                                                </div>
                                              </div>

                                              {enrolledStudentsList.length === 0 ? (
                                                <div className="py-6 text-center text-xs text-[#737373] bg-white rounded-xl border border-[#E5E5E5]">
                                                  No students enrolled in this offering or matching search.
                                                </div>
                                              ) : (
                                                <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden">
                                                  <table className="w-full text-left border-collapse">
                                                    <thead>
                                                      <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA] text-[9px] font-black text-[#A3A3A3] uppercase tracking-wider">
                                                        <th className="py-2 px-3">Student Name</th>
                                                        <th className="py-2 px-3">Stream</th>
                                                        <th className="py-2 px-3">Attendance Status & Timestamp</th>
                                                        <th className="py-2 px-3 text-right">Admin Override</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#FAFAFA]">
                                                      {enrolledStudentsList.map(st => {
                                                        const record = attendanceRecords.find(
                                                          a => a.student_id === st.id && 
                                                               (offeringSlots.some(s => s.id === a.slot_id) || a.slot_id === primarySlotId) && 
                                                               a.session_date === selectedDate
                                                        );
                                                        const status = record?.status || 'unmarked';
                                                        const isUpdating = updatingId === st.id;
                                                        const joinTime = record?.marked_at
                                                          ? new Date(record.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                          : null;

                                                        if (statusFilter !== 'all' && statusFilter !== status) {
                                                          return null;
                                                        }

                                                        return (
                                                          <tr key={st.id} className="hover:bg-[#FAFAFA]/50 transition-colors">
                                                            <td className="py-2.5 px-3">
                                                              <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center text-[9px] font-bold text-[#525252] shrink-0">
                                                                  {st.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                                </div>
                                                                <div className="min-w-0">
                                                                  <span className="text-xs font-bold text-[#111111] block leading-tight truncate">
                                                                    {st.full_name}
                                                                  </span>
                                                                  <span className="text-[9px] text-[#737373] font-medium leading-tight truncate block">
                                                                    {(st as any).email || `ID: ${st.id.slice(0, 8)}`}
                                                                  </span>
                                                                </div>
                                                              </div>
                                                            </td>

                                                            <td className="py-2.5 px-3 text-xs font-semibold text-[#525252] capitalize">
                                                              {st.stream || 'General'}
                                                            </td>

                                                            <td className="py-2.5 px-3">
                                                              <div className="flex items-center gap-2 flex-wrap">
                                                                {status === 'present' ? (
                                                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                                    ✓ Present
                                                                  </span>
                                                                ) : status === 'late' ? (
                                                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                                    ⏱ Late
                                                                  </span>
                                                                ) : status === 'absent' ? (
                                                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                                                    ✕ Absent
                                                                  </span>
                                                                ) : (
                                                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                                                                    ○ Unmarked
                                                                  </span>
                                                                )}

                                                                {joinTime && (
                                                                  <span className="text-[9px] text-[#737373] font-medium bg-[#FAFAFA] px-1.5 py-0.5 rounded border border-[#E5E5E5] flex items-center gap-1">
                                                                    <Clock size={10} className="text-emerald-600" />
                                                                    <span>Joined at {joinTime}</span>
                                                                    {record?.marked_by === 'self' && (
                                                                      <span className="text-emerald-600 font-bold">(Self-Checkin)</span>
                                                                    )}
                                                                  </span>
                                                                )}
                                                              </div>
                                                            </td>

                                                            <td className="py-2.5 px-3 text-right">
                                                              <div className="inline-flex items-center bg-[#F5F5F5] p-0.5 rounded-lg border border-[#E5E5E5]">
                                                                <button
                                                                  onClick={() => handleAdminToggleAttendance(st.id, primarySlotId, selectedDate, 'present')}
                                                                  disabled={isUpdating}
                                                                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                                                                    status === 'present'
                                                                      ? 'bg-emerald-600 text-white shadow-xs'
                                                                      : 'text-[#737373] hover:text-emerald-700 hover:bg-white'
                                                                  }`}
                                                                  title="Mark Present"
                                                                >
                                                                  P
                                                                </button>
                                                                <button
                                                                  onClick={() => handleAdminToggleAttendance(st.id, primarySlotId, selectedDate, 'late')}
                                                                  disabled={isUpdating}
                                                                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                                                                    status === 'late'
                                                                      ? 'bg-amber-500 text-white shadow-xs'
                                                                      : 'text-[#737373] hover:text-amber-700 hover:bg-white'
                                                                  }`}
                                                                  title="Mark Late"
                                                                >
                                                                  L
                                                                </button>
                                                                <button
                                                                  onClick={() => handleAdminToggleAttendance(st.id, primarySlotId, selectedDate, 'absent')}
                                                                  disabled={isUpdating}
                                                                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                                                                    status === 'absent'
                                                                      ? 'bg-rose-600 text-white shadow-xs'
                                                                      : 'text-[#737373] hover:text-rose-700 hover:bg-white'
                                                                  }`}
                                                                  title="Mark Absent"
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
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
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

      {/* ── TAB 2: ALL ATTENDANCE LOGS (Flat Table) ── */}
      {activeTab === 'all_records' && (
        <div className="card bg-white border border-[#E5E5E5] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#F5F5F5]">
            <h3 className="text-sm font-bold text-[#111111]">
              Institution Log Records ({attendanceRecords.length})
            </h3>
            <span className="text-xs text-[#737373] font-medium">Sorted by recent check-in</span>
          </div>

          {attendanceRecords.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#737373]">
              No attendance records recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F0F0F0]">
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Date</th>
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Student</th>
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Subject & Teacher</th>
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Status</th>
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Timestamp</th>
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAFAFA]">
                  {attendanceRecords
                    .filter(rec => {
                      if (statusFilter !== 'all' && rec.status !== statusFilter) return false;
                      const student = students.find(s => s.id === rec.student_id);
                      if (searchQuery && student) {
                        const q = searchQuery.toLowerCase();
                        return student.full_name.toLowerCase().includes(q) || Boolean((student as any).email && (student as any).email.toLowerCase().includes(q));
                      }
                      return true;
                    })
                    .slice(0, 100)
                    .map(rec => {
                      const student = students.find(s => s.id === rec.student_id);
                      const slot = slots.find(s => s.id === rec.slot_id);
                      const offering = offerings.find(o => o.id === (slot?.offering_id || (slot?.offering as any)?.id));
                      const teacher = teachers.find(t => t.id === offering?.teacher_id);
                      const joinTime = rec.marked_at ? new Date(rec.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';

                      return (
                        <tr key={rec.id} className="hover:bg-[#FAFAFA]/50 transition-colors">
                          <td className="py-3 text-xs font-bold text-[#111111] whitespace-nowrap">
                            {rec.session_date}
                          </td>
                          <td className="py-3 pr-3">
                            <span className="text-xs font-bold text-[#111111] block">{student?.full_name || rec.student_id}</span>
                            <span className="text-[9px] text-[#737373] block">{(student as any)?.email || 'N/A'}</span>
                          </td>
                          <td className="py-3">
                            <span className="text-xs font-semibold text-[#111111] block">
                              {offering?.subject_name || offering?.subject || 'Class'}
                            </span>
                            <span className="text-[9px] text-[#737373] block">
                              Teacher: {teacher?.full_name || 'Staff'}
                            </span>
                          </td>
                          <td className="py-3">
                            {rec.status === 'present' ? (
                              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                ✓ Present
                              </span>
                            ) : rec.status === 'late' ? (
                              <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                ⏱ Late
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                ✕ Absent
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-xs font-medium text-[#737373] whitespace-nowrap">
                            {joinTime} ({rec.marked_by || 'system'})
                          </td>
                          <td className="py-3 text-right">
                            <div className="inline-flex items-center bg-[#F5F5F5] p-0.5 rounded-lg border border-[#E5E5E5]">
                              <button
                                onClick={() => handleAdminToggleAttendance(rec.student_id, rec.slot_id, rec.session_date, 'present')}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                  rec.status === 'present' ? 'bg-emerald-600 text-white' : 'text-[#737373]'
                                }`}
                              >
                                P
                              </button>
                              <button
                                onClick={() => handleAdminToggleAttendance(rec.student_id, rec.slot_id, rec.session_date, 'late')}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                  rec.status === 'late' ? 'bg-amber-500 text-white' : 'text-[#737373]'
                                }`}
                              >
                                L
                              </button>
                              <button
                                onClick={() => handleAdminToggleAttendance(rec.student_id, rec.slot_id, rec.session_date, 'absent')}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                  rec.status === 'absent' ? 'bg-rose-600 text-white' : 'text-[#737373]'
                                }`}
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

      {/* ── TAB 3: LOW ATTENDANCE WATCHLIST (<75%) ── */}
      {activeTab === 'low_attendance' && (
        <div className="card bg-white border border-[#E5E5E5] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#F5F5F5]">
            <div>
              <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                <span>Low Attendance Intervention Watchlist</span>
                <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                  {stats.lowAttendanceStudents.length} Students At Risk
                </span>
              </h3>
              <p className="text-xs text-[#737373] mt-0.5">
                Students with at least 10 recorded class sessions who fall below the 75% institutional attendance requirement.
              </p>
            </div>
          </div>

          {stats.lowAttendanceStudents.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#737373] bg-[#FAFAFA] rounded-xl flex flex-col items-center">
              <ShieldCheck size={36} className="text-emerald-500 mb-2" />
              <span className="font-bold text-sm text-[#111111]">All Eligible Students Compliant</span>
              <span className="text-[10px] text-[#737373] mt-0.5">No students with 10+ recorded sessions currently fall below the 75% attendance threshold.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F0F0F0]">
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Student Name</th>
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Attendance Rate</th>
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Sessions Ratio</th>
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Subject Focus</th>
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Contact Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAFAFA]">
                  {stats.lowAttendanceStudents.map((item, idx) => (
                    <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {item.student.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#111111] block leading-tight">{item.student.full_name}</span>
                            <span className="text-[9px] text-[#737373] font-medium">{(item.student as any).email || `ID: ${item.student.id.slice(0, 8)}`}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                            {item.rate}%
                          </span>
                          <span className="text-[9px] text-rose-600 font-bold">
                            &lt; 75% Minimum
                          </span>
                        </div>
                      </td>

                      <td className="py-3 text-xs font-semibold text-[#525252]">
                        {item.attended} / {item.total} lectures
                      </td>

                      <td className="py-3 text-xs font-medium text-[#737373]">
                        {item.subject}
                      </td>

                      <td className="py-3 text-xs font-semibold text-[#111111]">
                        {item.student.phone || 'No phone record'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: TEACHER ATTENDANCE RATINGS ── */}
      {activeTab === 'teacher_ratings' && (
        <TeacherAttendanceRatingsAdminView
          ratings={teacherRatings}
          teachers={teachers}
          offerings={offerings}
          slots={slots}
          students={students}
          loading={loading}
          onRefresh={fetchData}
        />
      )}
    </AdminShell>
  );
};

export default AttendanceAdminPage;
