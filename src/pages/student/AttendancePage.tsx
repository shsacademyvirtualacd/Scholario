import React, { useState, useEffect } from 'react';
import StudentShell from '../../components/student/StudentShell';
import SectionHeader from '../../components/ui/SectionHeader';
import AttendanceCalendar from '../../components/student/AttendanceCalendar';
import StatusPill from '../../components/ui/StatusPill';
import { MOCK_ENROLLMENT } from '../../lib/mockData';
import { getAttendanceForStudent } from '../../lib/db';
import { useAuth } from '../../features/auth/AuthContext';
import type { Attendance } from '../../types';

export const AttendancePage: React.FC = () => {
  const { profile } = useAuth();
  const studentId = profile?.id || '';

  const [studentRecords, setStudentRecords] = useState<Attendance[]>([]);

  useEffect(() => {
    if (!studentId) return;
    getAttendanceForStudent(studentId).then(setStudentRecords).catch(console.error);
  }, [studentId]);

  // States
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Stats calculation
  const totalClassesCount = studentRecords.length;
  const attendedCount = studentRecords.filter((a) => a.status === 'present' || a.status === 'late').length;
  const absentCount = totalClassesCount - attendedCount;
  const attendancePct = totalClassesCount > 0 ? Math.round((attendedCount / totalClassesCount) * 100) : 0;
  
  const streak = MOCK_ENROLLMENT.streak;
  const personalBest = MOCK_ENROLLMENT.personal_best_streak;

  // Group stats by subject
  const subjectsMap: Record<string, { total: number; attended: number }> = {};
  studentRecords.forEach((a) => {
    const sub = a.slot?.offering?.subject;
    if (!sub) return;
    if (!subjectsMap[sub]) {
      subjectsMap[sub] = { total: 0, attended: 0 };
    }
    subjectsMap[sub].total += 1;
    if (a.status === 'present' || a.status === 'late') {
      subjectsMap[sub].attended += 1;
    }
  });

  const subjectBreakdown = Object.entries(subjectsMap).map(([subject, counts]) => {
    const pct = counts.total > 0 ? Math.round((counts.attended / counts.total) * 100) : 100;
    return { subject, total: counts.total, attended: counts.attended, pct };
  });

  // Filter logs for table
  const filteredRecords = studentRecords.filter((a) => {
    return subjectFilter === 'all' || a.slot?.offering?.subject === subjectFilter;
  });

  const uniqueSubjects = Array.from(
    new Set(studentRecords.map((a) => a.slot?.offering?.subject).filter(Boolean))
  );

  const getSubjectColor = (sub: string) => {
    switch (sub.toLowerCase()) {
      case 'mathematics': return '#F4C430';
      case 'physics': return '#3b82f6';
      case 'chemistry': return '#10b981';
      case 'biology': return '#ec4899';
      case 'computer science': return '#8b5cf6';
      default: return '#8b5cf6';
    }
  };

  const getProgressColorClass = (pct: number) => {
    if (pct >= 80) return 'bg-[#22c55e]';
    if (pct >= 70) return 'bg-[#F4C430]';
    return 'bg-[#ef4444]';
  };

  const getProgressTextClass = (pct: number) => {
    if (pct >= 80) return 'text-[#22c55e]';
    if (pct >= 70) return 'text-amber-600';
    return 'text-red-500';
  };

  return (
    <StudentShell>
      {/* Header */}
      <SectionHeader
        title="My Attendance"
        description="Monitor your weekly presence rate, subject stats, and calendar summaries."
      />

      {/* Summary stats */}
      <div className="space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Attendance Rate */}
          <div className="stat-card">
            <span className="text-[9px] font-black text-[#A3A3A3] uppercase tracking-wider block">Attendance Rate</span>
            <div className={`stat-value mt-2 ${getProgressTextClass(attendancePct)}`}>{attendancePct}%</div>
            <span className="text-[10px] text-[#737373] font-bold block mt-1">Target is 75%+</span>
          </div>

          {/* Classes Attended */}
          <div className="stat-card">
            <span className="text-[9px] font-black text-[#A3A3A3] uppercase tracking-wider block">Lectures Attended</span>
            <div className="stat-value mt-2 text-[#111111]">{attendedCount}</div>
            <span className="text-[10px] text-[#737373] font-bold block mt-1">Out of {totalClassesCount} sessions</span>
          </div>

          {/* Absences */}
          <div className="stat-card">
            <span className="text-[9px] font-black text-[#A3A3A3] uppercase tracking-wider block">Missed Classes</span>
            <div className={`stat-value mt-2 ${absentCount > 2 ? 'text-red-500' : 'text-[#111111]'}`}>{absentCount}</div>
            <span className="text-[10px] text-[#737373] font-bold block mt-1">Absences logged</span>
          </div>

          {/* Streak */}
          <div className="stat-card">
            <span className="text-[9px] font-black text-[#A3A3A3] uppercase tracking-wider block">Current Streak</span>
            <div className="stat-value mt-2 text-[#F4C430]">🔥 {streak}</div>
            <span className="text-[10px] text-[#737373] font-bold block mt-1">Classes in a row</span>
          </div>

          {/* Personal Best */}
          <div className="stat-card col-span-2 lg:col-span-1">
            <span className="text-[9px] font-black text-[#A3A3A3] uppercase tracking-wider block">Personal Best</span>
            <div className="stat-value mt-2 text-[#111111]">🏆 {personalBest}</div>
            <span className="text-[10px] text-[#737373] font-bold block mt-1">Record class streak</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Calendar & Subject Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Calendar Heatmap */}
            <div className="space-y-3">
              <h2 className="text-xs font-black text-[#111111] uppercase tracking-wider">Attendance Calendar</h2>
              <AttendanceCalendar attendanceRecords={studentRecords} />
            </div>

            {/* Subject Breakdown */}
            <div className="card card-elevated p-5">
              <h2 className="text-sm font-bold text-[#111111] mb-4">Subject Wise Breakdown</h2>
              <div className="space-y-4">
                {subjectBreakdown.length === 0 ? (
                  <div className="text-xs text-[#A3A3A3] font-bold text-center py-4">No subjects found.</div>
                ) : (
                  subjectBreakdown.map((row) => (
                    <div key={row.subject} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-[#111111]">{row.subject}</span>
                        <span className={getProgressTextClass(row.pct)}>
                          {row.pct}% ({row.attended}/{row.total})
                        </span>
                      </div>
                      <div className="w-full bg-[#FAFAFA] h-2 rounded-full border border-[#F0F0F0] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${getProgressColorClass(row.pct)}`}
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>

          {/* Right Column: Session Log List */}
          <div className="space-y-3">
            
            {/* Section Header with Subject Filter */}
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-[#111111] uppercase tracking-wider">Lecture Logs</h2>
              
              <div className="flex items-center gap-1">
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="input py-1 px-2 text-[10px] bg-white border-[#E5E5E5] rounded-lg cursor-pointer"
                >
                  <option value="all">All Subjects</option>
                  {uniqueSubjects.map((sub: any) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Logs Card list */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredRecords.length === 0 ? (
                <div className="card text-center py-12 text-xs font-bold text-[#A3A3A3]">
                  No lectures logged for selection
                </div>
              ) : (
                filteredRecords
                  .sort((a, b) => b.session_date.localeCompare(a.session_date))
                  .map((a) => {
                    const subjectName = a.slot?.offering?.subject || 'Class';
                    const teacherName = a.slot?.offering?.teacher?.full_name || 'Staff';
                    const subjectColor = getSubjectColor(subjectName);

                    return (
                      <div
                        key={a.id}
                        className="bg-white border border-[#E5E5E5] rounded-xl p-3 flex justify-between gap-3 shadow-sm hover:border-[#D4D4D4] transition-all"
                        style={{ borderLeft: `3px solid ${subjectColor}` }}
                      >
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold text-[#A3A3A3] uppercase">
                            {new Date(a.session_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <h4 className="text-xs font-bold text-[#111111] mt-0.5 truncate">{subjectName}</h4>
                          <span className="text-[10px] text-[#737373] font-medium block mt-0.5 truncate">{teacherName}</span>
                        </div>
                        
                        <div className="flex flex-col items-end shrink-0 justify-between">
                          <StatusPill status={a.status as any} />
                          <span className="text-[8px] text-[#A3A3A3] font-bold">
                            {a.slot ? a.slot.start_time.slice(0, 5) : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
            
          </div>
          
        </div>
      </div>
    </StudentShell>
  );
};

export default AttendancePage;
