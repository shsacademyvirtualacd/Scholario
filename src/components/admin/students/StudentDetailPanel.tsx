import React from 'react';
import { Phone, Mail } from 'lucide-react';
import type { Profile } from '../../../types';
import { MOCK_ATTENDANCE, MOCK_ENROLLMENTS, MOCK_OFFERINGS, MOCK_TEACHERS } from '../../../lib/mockData';
import AttendanceCalendar from '../../student/AttendanceCalendar';

interface StudentDetailPanelProps {
  student: Profile;
}

export const StudentDetailPanel: React.FC<StudentDetailPanelProps> = ({ student }) => {
  // Filter attendance records for this student
  const studentAttendance = MOCK_ATTENDANCE.filter((a) => a.student_id === student.id);

  // Filter enrollments for this student and enrich them with offering/teacher data
  const studentEnrollments = MOCK_ENROLLMENTS.filter((e) => e.student_id === student.id).map(e => {
    const offering = MOCK_OFFERINGS.find(o => o.id === e.offering_id);
    const teacher = offering ? MOCK_TEACHERS.find(t => t.id === offering.teacher_id) : undefined;
    return {
      ...e,
      offering: offering ? { ...offering, teacher } : undefined
    };
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStreamLabel = (stream?: string) => {
    if (!stream) return 'General Stream';
    return stream.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Header Profile card */}
      <div className="flex flex-col items-center text-center pb-5 border-b border-[#F5F5F5]">
        <div className="w-16 h-16 rounded-full bg-[#FAFAFA] text-[#111111] border-2 border-[#E5E5E5] flex items-center justify-center text-xl font-bold mb-3 shadow-inner">
          {getInitials(student.full_name)}
        </div>
        <h3 className="text-lg font-black text-[#111111]">{student.full_name}</h3>
        <span className="badge badge-gold mt-1.5 uppercase text-[9px] font-bold py-0.5 px-2.5 rounded-md border border-[#FDE68A]">
          {getStreamLabel(student.stream)}
        </span>
        <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider mt-3">
          Grade 10 · FBISE board
        </p>
      </div>

      {/* Info Card */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-[#111111] uppercase tracking-wider">Contact & Profile</h4>
        <div className="space-y-2 bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl p-3.5 text-xs text-[#525252] font-semibold">
          <div className="flex items-center gap-2">
            <Phone size={13} className="text-[#A3A3A3] shrink-0" />
            <span>{student.phone || 'No phone number registered'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={13} className="text-[#A3A3A3] shrink-0" />
            <span>{student.id === 'mock-user-id' ? 'rayn.ahmad@gmail.com' : `${student.full_name.toLowerCase().replace(' ', '.')}@example.com`}</span>
          </div>
        </div>
      </div>

      {/* Stats Counter */}
      <div className="grid grid-cols-3 gap-2.5 opacity-40 pointer-events-none select-none">
        <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl p-3 text-center">
          <div className="text-lg font-black text-[#111111]">—</div>
          <div className="text-[9px] text-[#737373] font-black uppercase mt-0.5">Attendance</div>
        </div>
        <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl p-3 text-center">
          <div className="text-lg font-black text-[#111111]">—</div>
          <div className="text-[9px] text-[#737373] font-black uppercase mt-0.5">Present / Late</div>
        </div>
        <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl p-3 text-center">
          <div className="text-lg font-black text-[#111111]">—</div>
          <div className="text-[9px] text-[#737373] font-black uppercase mt-0.5">Absences</div>
        </div>
      </div>

      {/* Subject list */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-[#111111] uppercase tracking-wider">Enrolled Subjects</h4>
        <div className="space-y-2">
          {studentEnrollments.map((e) => (
            <div key={e.id} className="bg-white border border-[#E5E5E5] rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-[#111111] truncate">{e.offering?.subject}</h5>
                <p className="text-[10px] text-[#737373] mt-0.5 font-medium truncate">{e.offering?.teacher?.full_name || 'TBA'}</p>
              </div>
              <span className="text-[9px] font-black text-[#A3A3A3] uppercase shrink-0">
                {e.total_classes} classes total
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mini attendance calendar */}
      <div className="space-y-3 relative">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-black text-[#111111] uppercase tracking-wider">Attendance Logs</h4>
          <span className="text-[8px] bg-zinc-200 text-zinc-500 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
            Soon
          </span>
        </div>
        <div className="opacity-40 pointer-events-none select-none">
          <AttendanceCalendar attendanceRecords={studentAttendance} />
        </div>
      </div>
    </div>
  );
};

export default StudentDetailPanel;
