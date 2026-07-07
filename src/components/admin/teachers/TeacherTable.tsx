import React from 'react';
import { Edit2, Eye, Power } from 'lucide-react';
import type { Teacher } from '../../../types';
import { MOCK_OFFERINGS, MOCK_SCHEDULE_SLOTS, MOCK_ENROLLMENTS } from '../../../lib/mockData';

interface TeacherTableProps {
  teachers: Teacher[];
  onView: (teacher: Teacher) => void;
}

export const TeacherTable: React.FC<TeacherTableProps> = ({
  teachers,
  onView,
}) => {
  // Compute workload helper locally
  const getWorkload = (teacherId: string) => {
    const teacherOfferings = MOCK_OFFERINGS.filter((o) => o.teacher_id === teacherId);
    const offeringIds = teacherOfferings.map((o) => o.id);
    const classesCount = MOCK_SCHEDULE_SLOTS.filter((s) => offeringIds.includes(s.offering_id)).length;
    const studentCount = MOCK_ENROLLMENTS.filter((e) => offeringIds.includes(e.offering_id)).length;
    const subjects = Array.from(new Set(teacherOfferings.map((o) => o.subject))).join(', ') || 'General';
    const grades = Array.from(new Set(teacherOfferings.map((o) => o.grade.toUpperCase()))).join(', ') || 'N/A';

    return { classesCount, studentCount, subjects, grades };
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
            <th>Subject(s)</th>
            <th>Grade(s)</th>
            <th>Contact</th>
            <th>Status</th>
            <th className="text-center">Classes/wk</th>
            <th className="text-center">Students</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => {
            const workload = getWorkload(teacher.id);
            return (
              <tr key={teacher.id} className={!teacher.is_active ? 'opacity-60 bg-gray-50/50' : ''}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#FFF9E6] text-[#F4C430] border border-[#FDE68A] flex items-center justify-center text-xs font-bold shrink-0">
                      {getInitials(teacher.full_name)}
                    </div>
                    <span className="font-semibold text-[#111111]">{teacher.full_name}</span>
                  </div>
                </td>
                <td>
                  <span className="text-xs text-[#525252] font-semibold">{workload.subjects}</span>
                </td>
                <td>
                  <span className="badge badge-gray">{workload.grades}</span>
                </td>
                <td>
                  <div className="text-xs space-y-0.5 font-medium">
                    <div className="text-[#111111]">{teacher.email || 'No email'}</div>
                    <div className="text-[#737373]">{teacher.phone || 'No phone'}</div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${teacher.is_active ? 'badge-gold' : 'badge-gray'}`}>
                    {teacher.is_active ? 'Active' : 'Inactive'}
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
                      title="View Profile Details"
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

export default TeacherTable;
