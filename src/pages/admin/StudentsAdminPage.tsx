import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Users, Sparkles, Eye, TrendingUp, AlertTriangle } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import StudentTable from '../../components/admin/students/StudentTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import StudentDetailPanel from '../../components/admin/students/StudentDetailPanel';
import { getAllStudents, getAllEnrollments, getAllOfferings, getAllAttendance } from '../../lib/db';
import { getStudentBoardLabel, getStudentGradeLabel, getStudentStreamLabel } from '../../lib/taxonomy';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { useMobile } from '../../hooks/useMobile';
import type { Profile, Enrollment, ClassOffering, Attendance } from '../../types';

export const StudentsAdminPage: React.FC = () => {
  const isMobile = useMobile();
  const [students, setStudents] = useState<Profile[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);

  // ── Load from DB on mount ──────────────────────────────────────
  const loadData = async () => {
    try {
      const [stList, enList, offList, attList] = await Promise.all([
        getAllStudents(),
        getAllEnrollments(),
        getAllOfferings(),
        getAllAttendance()
      ]);
      setStudents(stList);
      setEnrollments(enList);
      setOfferings(offList);
      setAttendanceRecords(attList);
    } catch (err) {
      console.error('[StudentsAdminPage] loadData error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Realtime sync for live profile and attendance updates ───────
  useRealtimeTable({
    table: 'profiles',
    debounceMs: 500,
    onAny: async () => {
      const stList = await getAllStudents();
      setStudents(stList);
    }
  });

  useRealtimeTable({
    table: 'roster',
    debounceMs: 500,
    onAny: async () => {
      const stList = await getAllStudents();
      setStudents(stList);
    }
  });

  useRealtimeTable({
    table: 'attendance',
    debounceMs: 1000,
    onAny: async () => {
      const attList = await getAllAttendance();
      setAttendanceRecords(attList);
    }
  });

  useRealtimeTable({
    table: 'enrollments',
    debounceMs: 1000,
    onAny: async () => {
      const [enList, stList] = await Promise.all([getAllEnrollments(), getAllStudents()]);
      setEnrollments(enList);
      setStudents(stList);
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [streamFilter, setStreamFilter] = useState<'all' | 'pre-medical' | 'pre-engineering' | 'ics'>('all');

  // Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);

  // Compute student stats
  const totalCount = students.length;

  // Compute attendance stats across all students & per student
  const attendanceStats = useMemo(() => {
    // Student-specific map
    const studentMap = new Map<string, { attended: number; total: number; rate: number; qualified: boolean }>();
    
    // Initialize student entries
    students.forEach(s => {
      studentMap.set(s.id, { attended: 0, total: 0, rate: 0, qualified: false });
    });

    attendanceRecords.forEach(r => {
      const curr = studentMap.get(r.student_id) || { attended: 0, total: 0, rate: 0, qualified: false };
      curr.total += 1;
      if (r.status === 'present' || r.status === 'late') {
        curr.attended += 1;
      }
      curr.rate = curr.total > 0 ? Math.round((curr.attended / curr.total) * 100) : 0;
      curr.qualified = curr.total >= 10;
      studentMap.set(r.student_id, curr);
    });

    // Qualified students: students who have reached the 10-session threshold
    const qualifiedStudents = Array.from(studentMap.values()).filter(s => s.qualified);

    // Avg Attendance: calculated ONLY from students who've reached the 10-session threshold
    let avgRate: number | null = null;
    let qualifiedAttended = 0;
    let qualifiedTotal = 0;

    if (qualifiedStudents.length > 0) {
      qualifiedStudents.forEach(q => {
        qualifiedAttended += q.attended;
        qualifiedTotal += q.total;
      });
      avgRate = qualifiedTotal > 0 ? Math.round((qualifiedAttended / qualifiedTotal) * 100) : null;
    }

    // Risk Alerts count: ONLY students with 10+ sessions AND attendance below 70%
    const riskAlertsCount = qualifiedStudents.filter(val => val.rate < 70).length;

    return {
      totalSessions: attendanceRecords.length,
      qualifiedStudentsCount: qualifiedStudents.length,
      qualifiedAttended,
      qualifiedTotal,
      avgRate,
      riskAlertsCount,
      studentMap,
    };
  }, [students, attendanceRecords]);

  // Search and Filter logical execution
  const filteredStudents = students.filter((s) => {
    const sBoard = getStudentBoardLabel(s, enrollments, offerings).toLowerCase();
    const sGrade = getStudentGradeLabel(s, enrollments, offerings).toLowerCase();
    const sStream = getStudentStreamLabel(s).toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      s.full_name.toLowerCase().includes(searchLower) ||
      (s.phone && s.phone.includes(searchTerm)) ||
      sBoard.includes(searchLower) ||
      sGrade.includes(searchLower) ||
      sStream.includes(searchLower);

    if (!matchesSearch) return false;
    if (streamFilter === 'all') return true;

    const rawStream = (s.stream_obj?.name || s.stream || '').toLowerCase().replace(/[\s_]+/g, '-');
    if (streamFilter === 'pre-medical') return rawStream.includes('pre-med') || rawStream.includes('bio');
    if (streamFilter === 'pre-engineering') return rawStream.includes('pre-eng') || rawStream.includes('eng');
    if (streamFilter === 'ics') return rawStream.includes('ics') || rawStream.includes('comp');
    if (streamFilter === 'academic') return rawStream.includes('academic') || sBoard.includes('ielts');
    if (streamFilter === 'general-training') return rawStream.includes('general') || sBoard.includes('ielts');
    if (streamFilter === 'ielts') return sBoard.includes('ielts') || rawStream.includes('ielts');
    return rawStream === streamFilter;
  });

  // Action handlers
  const handleViewTrigger = (student: Profile) => {
    setSelectedStudent(student);
    setDrawerOpen(true);
  };

  const getStats = (student: Profile) => {
    const studentEnrollments = enrollments.filter((e) => e.student_id === student.id);
    const classesCount = studentEnrollments.length;
    
    const boardName = getStudentBoardLabel(student, enrollments, offerings);
    const gradeName = getStudentGradeLabel(student, enrollments, offerings);
    const boardAndGrade = `${gradeName} · ${boardName}`;

    return { classesCount, boardAndGrade };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStreamColor = (stream?: string | null) => {
    const norm = (stream || '').toLowerCase();
    if (norm.includes('pre-med') || norm.includes('biology')) return 'badge-gold bg-amber-50 text-amber-700 border-amber-200';
    if (norm.includes('pre-eng') || norm.includes('engineering')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (norm.includes('ics') || norm.includes('computer')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <AdminShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionHeader
          title="Students"
          description="Enrolment list of academy students, check stream filters, and view profile details."
        />
        <div className="text-xs text-[#737373] bg-[#FAFAFA] border border-[#E5E5E5] px-3 py-1.5 rounded-xl font-bold shrink-0 self-start sm:self-center">
          Managed via Roster
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Card */}
        <div className="stat-card interactive">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={15} />
            </div>
            <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Total</span>
          </div>
          <div className="stat-value">{totalCount}</div>
          <div className="stat-label">Enrolled Students</div>
        </div>

        {/* Avg Attendance Card */}
        <div className="stat-card interactive">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={15} />
            </div>
            <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Avg Attendance</span>
          </div>
          <div className={`stat-value ${attendanceStats.avgRate !== null ? 'text-emerald-600' : 'text-sm font-bold text-[#737373] tracking-tight'}`}>
            {attendanceStats.avgRate !== null ? `${attendanceStats.avgRate}%` : 'Not enough data yet'}
          </div>
          <div className="stat-label">
            {attendanceStats.avgRate !== null
              ? `${attendanceStats.qualifiedStudentsCount} student${attendanceStats.qualifiedStudentsCount === 1 ? '' : 's'} (≥10 sessions)`
              : 'Requires ≥10 recorded sessions'}
          </div>
        </div>

        {/* Attendance Warnings Card */}
        <div className="stat-card interactive">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle size={15} />
            </div>
            <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Risk Alerts</span>
          </div>
          <div className="stat-value text-red-500">{attendanceStats.riskAlertsCount}</div>
          <div className="stat-label">
            {attendanceStats.qualifiedStudentsCount > 0
              ? 'Students below 70% (≥10 sessions)'
              : 'Students below 70% rate'}
          </div>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="card bg-white border border-[#E5E5E5] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 interactive">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search students by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-9 py-2 text-xs w-full bg-[#FAFAFA] border-[#F0F0F0]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#737373]">
            <Filter size={14} />
            <span>Academic Stream:</span>
          </div>
          <select
            value={streamFilter}
            onChange={(e) => setStreamFilter(e.target.value as any)}
            className="input py-1.5 px-3 text-xs bg-[#FAFAFA] border-[#E5E5E5] rounded-lg cursor-pointer"
          >
            <option value="all">All Streams</option>
            <option value="pre-engineering">Pre-Engineering</option>
            <option value="pre-medical">Pre-Medical</option>
            <option value="ics">ICS</option>
            <option value="ielts">IELTS (All)</option>
            <option value="academic">IELTS Academic</option>
            <option value="general-training">IELTS General Training</option>
          </select>
        </div>
      </div>

      {/* Students Table or Card List */}
      {filteredStudents.length === 0 ? (
        <div className="card text-center py-16 interactive">
          <Sparkles size={28} className="mx-auto text-[#A3A3A3] mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-[#111111]">No matching students found</h3>
          <p className="text-xs text-[#737373] mt-1">Try tweaking your search keywords or choosing a different stream filter.</p>
        </div>
      ) : isMobile ? (
        <div className="space-y-4">
          {filteredStudents.map((student) => {
            const stats = getStats(student);
            const streamLabel = getStudentStreamLabel(student);

            const attData = attendanceStats.studentMap.get(student.id);

            return (
              <div key={student.id} className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center text-xs font-bold text-[#111111] shrink-0">
                      {getInitials(student.full_name)}
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-[#111111] block leading-tight truncate">{student.full_name}</span>
                      <span className="text-[10px] text-[#737373] mt-0.5 block">{student.phone || 'No Phone'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewTrigger(student)}
                    className="p-2 bg-[#FAFAFA] hover:bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl text-zinc-600 transition-colors"
                  >
                    <Eye size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-[#F5F5F5] pt-3 text-xs">
                  <div>
                    <span className="text-[#A3A3A3] text-[9px] font-bold block uppercase tracking-wider">Stream</span>
                    <span className={`inline-block border text-[10px] font-bold py-0.5 px-2 rounded-md mt-1 ${getStreamColor(student.stream_obj?.name || student.stream)}`}>
                      {streamLabel}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A3A3A3] text-[9px] font-bold block uppercase tracking-wider">Class</span>
                    <span className="font-semibold text-[#525252] mt-1 block truncate">{stats.boardAndGrade}</span>
                  </div>
                  <div>
                    <span className="text-[#A3A3A3] text-[9px] font-bold block uppercase tracking-wider">Attendance</span>
                    {attData && attData.total >= 10 ? (
                      <span
                        className={`inline-block border text-[10px] font-bold py-0.5 px-2 rounded-md mt-1 ${
                          attData.rate >= 75
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : attData.rate >= 70
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {attData.rate}%
                      </span>
                    ) : (
                      <span className="inline-block text-[10px] text-[#737373] font-semibold bg-[#FAFAFA] border border-[#E5E5E5] py-0.5 px-1.5 rounded-md mt-1 whitespace-nowrap">
                        Collecting data
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <StudentTable
          students={filteredStudents}
          onView={handleViewTrigger}
          enrollments={enrollments}
          offerings={offerings}
          attendanceStatsMap={attendanceStats.studentMap}
        />
      )}

      {/* Slide-over Detail / Form Drawer */}
      <AdminDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedStudent(null);
        }}
        title="Student Profile Details"
      >
        {selectedStudent && <StudentDetailPanel student={selectedStudent} />}
      </AdminDrawer>
    </AdminShell>
  );
};

export default StudentsAdminPage;
