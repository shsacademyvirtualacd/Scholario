import React from 'react';
import { Eye, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { Profile, Enrollment, ClassOffering } from '../../../types';
import { getStudentBoardLabel, getStudentGradeLabel, getStudentStreamLabel } from '../../../lib/taxonomy';

interface StudentTableProps {
  students: Profile[];
  onView: (student: Profile) => void;
  enrollments?: Enrollment[];
  offerings?: ClassOffering[];
  attendanceStatsMap?: Map<string, { attended: number; total: number; rate: number; qualified?: boolean }>;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  onView,
  enrollments = [],
  offerings = [],
  attendanceStatsMap,
}) => {
  // Compute student stats dynamically from real profile and enrollment data
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
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Stream</th>
            <th>Board & Grade</th>
            <th>Phone</th>
            <th className="text-center">Attendance Rate</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const stats = getStats(student);
            const streamLabel = getStudentStreamLabel(student);

            const attData = attendanceStatsMap?.get(student.id);
            const isQualified = attData && attData.total >= 10;

            return (
              <tr key={student.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center text-xs font-bold text-[#111111] shrink-0">
                      {getInitials(student.full_name)}
                    </div>
                    <span className="font-semibold text-[#111111]">{student.full_name}</span>
                  </div>
                </td>
                <td>
                  <span className={`badge border text-[10px] uppercase font-bold py-0.5 px-2 rounded-md ${getStreamColor(student.stream_obj?.name || student.stream)}`}>
                    {streamLabel}
                  </span>
                </td>
                <td>
                  <div className="text-xs font-semibold text-[#525252]">
                    {stats.boardAndGrade}
                  </div>
                </td>
                <td>
                  <span className="text-xs font-medium text-[#737373]">{student.phone || 'N/A'}</span>
                </td>
                <td className="text-center">
                  {isQualified ? (
                    <div className="inline-flex flex-col items-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                          attData.rate >= 75
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : attData.rate >= 70
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                        title={`${attData.attended} attended out of ${attData.total} recorded sessions`}
                      >
                        {attData.rate >= 75 ? (
                          <CheckCircle2 size={11} className="text-emerald-600" />
                        ) : attData.rate >= 70 ? (
                          <Clock size={11} className="text-amber-600" />
                        ) : (
                          <XCircle size={11} className="text-rose-600" />
                        )}
                        {attData.rate}%
                      </span>
                      <span className="text-[9px] text-[#A3A3A3] font-medium mt-0.5">
                        {attData.attended}/{attData.total} sessions
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex flex-col items-center">
                      <span
                        className="text-[11px] text-[#737373] font-semibold px-2.5 py-0.5 rounded-full bg-[#FAFAFA] border border-[#E5E5E5]"
                        title={attData && attData.total > 0 ? `${attData.total}/10 sessions recorded` : '0/10 sessions recorded'}
                      >
                        Collecting data
                      </span>
                      <span className="text-[9px] text-[#A3A3A3] font-medium mt-0.5">
                        {attData?.total || 0}/10 sessions
                      </span>
                    </div>
                  )}
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(student)}
                      title="View Student Profile"
                      className="p-1.5 rounded-lg hover:bg-white text-[#737373] hover:text-[#111111] transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StudentTable;
