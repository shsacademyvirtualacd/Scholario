import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Users, Sparkles, Eye, TrendingUp, AlertTriangle } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import StudentTable from '../../components/admin/students/StudentTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import StudentDetailPanel from '../../components/admin/students/StudentDetailPanel';
import { getAllStudents, getAllEnrollments, getAllOfferings, getAllAttendance } from '../../lib/db';
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

  // ── Realtime sync for attendance updates ─────────────────────────
  useRealtimeTable({
    table: 'attendance',
    debounceMs: 1200,
    onAny: async () => {
      const attList = await getAllAttendance();
      setAttendanceRecords(attList);
    }
  });

  useRealtimeTable({
    table: 'enrollments',
    debounceMs: 2000,
    onAny: async () => {
      const enList = await getAllEnrollments();
      setEnrollments(enList);
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
    const totalSessions = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
    const attendedCount = presentCount + lateCount;
    const avgRate = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 100;

    // Student-specific map
    const studentMap = new Map<string, { attended: number; total: number; rate: number }>();
    attendanceRecords.forEach(r => {
      const curr = studentMap.get(r.student_id) || { attended: 0, total: 0, rate: 100 };
      curr.total += 1;
      if (r.status === 'present' || r.status === 'late') {
        curr.attended += 1;
      }
      curr.rate = curr.total > 0 ? Math.round((curr.attended / curr.total) * 100) : 100;
      studentMap.set(r.student_id, curr);
    });

    // Risk Alerts count: Students currently below 70% rate with minimum 10 recorded sessions eligibility
    let riskAlertsCount = 0;
    studentMap.forEach(val => {
      if (val.total >= 10 && val.rate < 70) {
        riskAlertsCount += 1;
      }
    });

    return {
      totalSessions,
      presentCount,
      lateCount,
      attendedCount,
      avgRate,
      riskAlertsCount,
      studentMap,
    };
  }, [attendanceRecords]);

  // Search and Filter logical execution
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone && s.phone.includes(searchTerm));
    const matchesStream = streamFilter === 'all' || s.stream === streamFilter;
    return matchesSearch && matchesStream;
  });

  // Action handlers
  const handleViewTrigger = (student: Profile) => {
    setSelectedStudent(student);
    setDrawerOpen(true);
  };

  const getStats = (studentId: string) => {
    const studentEnrollments = enrollments.filter((e) => e.student_id === studentId);
    const classesCount = studentEnrollments.length;
    
    let boardAndGrade = 'No active classes';
    if (studentEnrollments.length > 0) {
      const primaryOffering = offerings.find(o => o.id === studentEnrollments[0].offering_id);
      if (primaryOffering) {
        boardAndGrade = `Grade ${primaryOffering.grade} · FBISE`;
      }
    }
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
    switch (stream) {
      case 'pre-medical': return 'badge-gold bg-amber-50 text-amber-700 border-amber-200';
      case 'pre-engineering': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ics': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
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
          <div className="stat-value text-emerald-600">
            {attendanceRecords.length > 0 ? `${attendanceStats.avgRate}%` : '100%'}
          </div>
          <div className="stat-label">
            {attendanceStats.totalSessions > 0
              ? `${attendanceStats.attendedCount} of ${attendanceStats.totalSessions} sessions attended`
              : 'Class presence rate'}
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
          <div className="stat-label">Students below 70% rate</div>
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
            const stats = getStats(student.id);
            const streamLabel = student.stream
              ? student.stream.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
              : 'General';

            const attData = attendanceStats.studentMap.get(student.id);
            const hasAtt = attData && attData.total > 0;

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
                    <span className={`inline-block border text-[10px] font-bold py-0.5 px-2 rounded-md mt-1 ${getStreamColor(student.stream)}`}>
                      {streamLabel}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A3A3A3] text-[9px] font-bold block uppercase tracking-wider">Class</span>
                    <span className="font-semibold text-[#525252] mt-1 block truncate">{stats.boardAndGrade}</span>
                  </div>
                  <div>
                    <span className="text-[#A3A3A3] text-[9px] font-bold block uppercase tracking-wider">Attendance</span>
                    {hasAtt ? (
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
                      <span className="text-xs text-[#A3A3A3] font-medium mt-1 block">—</span>
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
