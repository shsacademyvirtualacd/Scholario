import React from 'react';
import { Eye } from 'lucide-react';
import type { Teacher, ClassOffering, ClassSlot, Enrollment } from '../../../types';

interface TeacherTableProps {
  teachers: Teacher[];
  onView: (teacher: Teacher) => void;
  offerings?: ClassOffering[];
  slots?: ClassSlot[];
  enrollments?: Enrollment[];
}

export const TeacherTable: React.FC<TeacherTableProps> = ({
  teachers,
  onView,
  offerings = [],
  slots = [],
  enrollments = [],
}) => {
  // Workload calculations
  const getWorkload = (teacherId: string) => {
    const teacherOfferings = offerings.filter((o) => o.teacher_id === teacherId);
    const offeringIds = teacherOfferings.map((o) => o.id);
    const classesCount = slots.filter((s) => offeringIds.includes(s.offering_id || '')).length;
    const studentCount = enrollments.filter((e) => offeringIds.includes(e.offering_id || '')).length;
    
    // Unique streams count
    const streams = Array.from(new Set(teacherOfferings.map((o) => o.subject))).join(', ') || 'N/A';
    return { classesCount, studentCount, streams };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Teacher</th>
            <th>Contact Details</th>
            <th>Subjects Assigned</th>
            <th className="text-center">Classes / Wk</th>
            <th className="text-center">Enrolled Students</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => {
            const workload = getWorkload(teacher.id);
            return (
              <tr key={teacher.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#FFF9E6] text-[#F4C430] border border-[#FDE68A] flex items-center justify-center text-xs font-bold shrink-0">
                      {getInitials(teacher.full_name)}
                    </div>
                    <div>
                      <span className="font-semibold text-[#111111] block leading-tight">{teacher.full_name}</span>
                      <span className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider mt-0.5 block">
                        Joined {teacher.joining_date || 'N/A'}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="text-xs font-medium text-[#525252]">
                    <div>{teacher.email || 'No email address registered'}</div>
                  </div>
                </td>
                <td>
                  <span className="text-xs font-semibold text-[#525252] max-w-[200px] block truncate" title={workload.streams}>
                    {workload.streams}
                  </span>
                </td>
                <td className="text-center font-bold text-[#111111]">
                  {workload.classesCount}
                </td>
                <td className="text-center font-bold text-[#111111]">
                  {workload.studentCount}
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(teacher)}
                      title="View workload timetable"
                      className="p-1.5 rounded-lg hover:bg-[#FAFAFA] text-[#737373] hover:text-[#111111] transition-colors"
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

export default TeacherTable;
