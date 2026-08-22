import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, XCircle, Flame, Filter, BookOpen } from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import SectionHeader from '../../components/ui/SectionHeader';
import AttendanceCalendar from '../../components/student/AttendanceCalendar';
import { useAuth } from '../../features/auth/AuthContext';
import { getAttendanceForStudent, computeAttendanceStreak } from '../../lib/db';
import { pageCache } from '../../lib/pageCache';
import type { Attendance } from '../../types';
import { formatTime12h } from '../../lib/scheduleUtils';

export const AttendancePage: React.FC = () => {
  const { profile } = useAuth();
  const studentId = profile?.id || '';

  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    if (!studentId) return;
    let mounted = true;

    const cached = pageCache.get<Attendance[]>('student_attendance', studentId);
    if (cached && mounted) setRecords(cached);

    getAttendanceForStudent(studentId)
      .then((attData) => {
        if (!mounted) return;
        setRecords(attData);
        pageCache.set('student_attendance', attData, studentId);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [studentId]);

  const streakMetrics = computeAttendanceStreak(records);

  const totalClasses = records.length;
  const presentCount = records.filter(r => r.status === 'present' || r.status === 'late').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  const lateCount = records.filter(r => r.status === 'late').length;
  const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100;

  // Filter subjects for selector
  const subjectList = Array.from(new Set(records.map(r => r.subject || (r.slot?.offering as any)?.subject_name || (r.slot?.offering as any)?.subject?.name || 'General').filter(Boolean)));

  const filteredRecords = records.filter(r => {
    if (selectedSubject === 'all') return true;
    const subj = r.subject || (r.slot?.offering as any)?.subject_name || (r.slot?.offering as any)?.subject?.name || 'General';
    return subj === selectedSubject;
  });

  return (
    <StudentShell>
      <SectionHeader
        title="My Attendance"
        description="Monitor your class attendance rate, presence calendar, and session logs."
      />

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Attendance Rate */}
        <div className="stat-card">
          <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide block mb-1">
            Attendance Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${attendanceRate >= 85 ? 'text-emerald-600' : attendanceRate >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>
              {loading ? '—' : `${attendanceRate}%`}
            </span>
            <span className="text-xs text-[#737373] font-bold">
              {presentCount}/{totalClasses || 0} classes
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${attendanceRate >= 85 ? 'bg-emerald-500' : attendanceRate >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(attendanceRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Present Sessions */}
        <div className="stat-card">
          <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide block mb-1">
            Present
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-600">{loading ? '—' : presentCount}</span>
            <span className="text-xs text-[#737373] font-semibold">attended</span>
          </div>
          <div className="flex items-center gap-1 mt-3 text-[11px] text-[#737373]">
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            <span>Includes {lateCount} on-time/late</span>
          </div>
        </div>

        {/* Missed Sessions */}
        <div className="stat-card">
          <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide block mb-1">
            Missed Classes
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-600">{loading ? '—' : absentCount}</span>
            <span className="text-xs text-[#737373] font-semibold">absences</span>
          </div>
          <div className="flex items-center gap-1 mt-3 text-[11px] text-[#737373]">
            <XCircle size={13} className="text-rose-500 shrink-0" />
            <span>Target: &lt; 3 per month</span>
          </div>
        </div>

        {/* Attendance Streak */}
        <div className="stat-card">
          <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide block mb-1">
            Active Streak
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#111111]">{loading ? '—' : `${streakMetrics.currentStreak}d`}</span>
            <span className="text-xs text-amber-600 font-bold flex items-center gap-0.5">
              <Flame size={12} /> streak
            </span>
          </div>
          <div className="flex items-center justify-between mt-3 text-[11px] text-[#737373] font-semibold">
            <span>Personal Best</span>
            <span className="font-bold text-[#111111]">{streakMetrics.personalBest} days</span>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Calendar + History Log ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar (Left Column) */}
        <div className="lg:col-span-1 space-y-4">
          <AttendanceCalendar attendanceRecords={records} />

          <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
              <Clock size={14} className="text-amber-700" />
              Attendance Policy
            </h4>
            <p className="text-[12px] text-amber-800 leading-relaxed">
              Mark attendance by clicking <strong>"Join Class"</strong> or <strong>"Mark My Attendance"</strong> during class start. A minimum 75% attendance rate is recommended for board exams.
            </p>
          </div>
        </div>

        {/* History Table (Right 2 Columns) */}
        <div className="lg:col-span-2 bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-sm font-extrabold text-[#111111] uppercase tracking-wide">
                Session Attendance Log
              </h3>
              <p className="text-xs text-[#737373] mt-0.5">
                Detailed record of attended and missed class sessions
              </p>
            </div>

            {subjectList.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter size={13} className="text-[#737373]" />
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="text-xs font-semibold bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg px-2.5 py-1.5 text-[#111111] focus:outline-hidden"
                >
                  <option value="all">All Subjects ({records.length})</option>
                  {subjectList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="h-14 bg-gray-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[#E5E5E5] rounded-xl bg-gray-50/50">
              <BookOpen size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-[#737373]">No attendance records found yet</p>
              <p className="text-[11px] text-[#A3A3A3] mt-1">
                Your presence logs will show up here once you join or mark attendance for your classes.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#F0F0F0] text-[#737373] uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Subject & Teacher</th>
                    <th className="py-2.5 px-3">Timing</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Marked Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F5]">
                  {filteredRecords.map(rec => {
                    const subj = rec.subject || (rec.slot?.offering as any)?.subject_name || (rec.slot?.offering as any)?.subject?.name || 'Class Session';
                    const teacherName = rec.teacher?.full_name || (rec.slot?.offering as any)?.teacher?.full_name || 'Staff';
                    const timeStr = rec.slot ? `${formatTime12h(rec.slot.start_time)} - ${formatTime12h(rec.slot.end_time)}` : '—';
                    const markedAtStr = rec.marked_at ? new Date(rec.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

                    return (
                      <tr key={rec.id} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className="py-3 px-3 font-semibold text-[#111111] whitespace-nowrap">
                          {rec.session_date}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#111111]">{subj}</div>
                          <div className="text-[11px] text-[#737373]">{teacherName}</div>
                        </td>
                        <td className="py-3 px-3 text-[#737373] whitespace-nowrap">
                          {timeStr}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {rec.status === 'present' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 size={11} /> Present
                            </span>
                          ) : rec.status === 'late' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Clock size={11} /> Late
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <XCircle size={11} /> Absent
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right text-[11px] text-[#737373] font-mono whitespace-nowrap">
                          {markedAtStr}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </StudentShell>
  );
};

export default AttendancePage;
