import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { Profile, AttendanceStatus, Attendance } from '../../../types';
import StatusToggle from './StatusToggle';

interface AttendanceGridProps {
  students: Profile[];
  attendanceState: Record<string, AttendanceStatus>;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  allAttendance?: Attendance[];
}

export const AttendanceGrid: React.FC<AttendanceGridProps> = ({
  students,
  attendanceState,
  onStatusChange,
  allAttendance = [],
}) => {
  // Compute overall attendance % helper
  const getOverallAttendancePct = (studentId: string) => {
    const records = allAttendance.filter((a) => a.student_id === studentId);
    const total = records.length;
    const attended = records.filter((a) => a.status === 'present' || a.status === 'late').length;
    return total > 0 ? Math.round((attended / total) * 100) : 100;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStreamLabel = (stream?: string) => {
    if (!stream) return 'General';
    return stream.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="table-container bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-sm">
      <table className="table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th className="hidden sm:table-cell">Academic Stream</th>
            <th className="text-center">Overall Attendance</th>
            <th className="text-right pr-6">Record Session Presence</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const overallPct = getOverallAttendancePct(student.id);
            const activeStatus = attendanceState[student.id] || null;
            const isWarning = overallPct < 70;

            return (
              <tr key={student.id} className={isWarning ? 'bg-amber-50/20' : ''}>
                {/* Name */}
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center text-xs font-bold text-[#111111] shrink-0">
                      {getInitials(student.full_name)}
                    </div>
                    <div>
                      <span className="font-semibold text-[#111111] block leading-tight">{student.full_name}</span>
                      {isWarning && (
                        <span className="text-[9px] font-black text-amber-600 flex items-center gap-0.5 mt-0.5 uppercase tracking-wide">
                          <AlertCircle size={8} /> Low Attendance
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                <td className="hidden sm:table-cell">
                  <span className="text-xs font-semibold text-[#525252]">{getStreamLabel(student.stream || undefined)}</span>
                </td>

                {/* Overall Attendance */}
                <td className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-xs font-extrabold ${
                      overallPct >= 80 ? 'text-[#22c55e]' : overallPct >= 70 ? 'text-amber-600' : 'text-red-500'
                    }`}>
                      {overallPct}%
                    </span>
                  </div>
                </td>

                {/* Record Status Selector */}
                <td className="text-right pr-4">
                  <StatusToggle
                    value={activeStatus}
                    onChange={(status) => onStatusChange(student.id, status)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceGrid;
