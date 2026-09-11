import React, { useState, useEffect } from 'react';
import { Phone, Mail, Calendar, CheckCircle2, Clock, XCircle, Hash } from 'lucide-react';
import type { Profile, Enrollment, ClassOffering, Teacher, RosterEntry, Attendance } from '../../../types';
import { getEnrollmentsForStudent, getAllOfferings, getAllTeachers, getAllRoster, getAttendanceForStudent } from '../../../lib/db';
import { getStudentBoardLabel, getStudentGradeLabel, getStudentStreamLabel } from '../../../lib/taxonomy';
import { formatStudentId } from '../../../lib/studentId';
import { getStudentSubjectPlanSync } from '../../../lib/subjectEnrollmentService';

interface StudentDetailPanelProps {
  student: Profile;
}

export const StudentDetailPanel: React.FC<StudentDetailPanelProps> = ({ student }) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getEnrollmentsForStudent(student.id),
      getAllOfferings(),
      getAllTeachers(),
      getAllRoster(),
      getAttendanceForStudent(student.id)
    ]).then(([e, o, t, r, att]) => {
      setEnrollments(e);
      setOfferings(o);
      setTeachers(t);
      setRoster(r);
      setAttendanceRecords(att);
    }).catch(console.error).finally(() => setLoading(false));
  }, [student.id]);

  // Enrich enrollments for this student with offering/teacher data
  const studentEnrollments = enrollments.map(e => {
    const offering = offerings.find(o => o.id === e.offering_id);
    const teacher = offering ? teachers.find(t => t.id === offering.teacher_id) : undefined;
    return {
      ...e,
      offering: offering ? { ...offering, teacher } : undefined
    };
  });

  const subjectPlan = getStudentSubjectPlanSync(student.id) || (student.subjects ? { subjects: student.subjects, plan_type: student.plan_type || 'custom' } : null);
  const isCustomPlan = Boolean(subjectPlan && subjectPlan.plan_type === 'custom' && subjectPlan.subjects && subjectPlan.subjects.length > 0);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const boardLabel = getStudentBoardLabel(student, enrollments, offerings);
  const gradeLabel = getStudentGradeLabel(student, enrollments, offerings);
  const streamLabel = getStudentStreamLabel(student);

  const rosterEntry = roster.find(r => r.profile_id === student.id || r.id === student.id);
  const emailDisplay = rosterEntry ? rosterEntry.email : 'No email address registered';
  const phoneDisplay = student.phone || (rosterEntry as any)?.phone || 'No phone number registered';
  const studentIdDisplay = rosterEntry ? formatStudentId(rosterEntry.id) : formatStudentId(student.id);

  // Attendance metrics
  const totalSessions = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
  const lateCount = attendanceRecords.filter(a => a.status === 'late').length;
  const absentCount = attendanceRecords.filter(a => a.status === 'absent').length;
  const attendedCount = presentCount + lateCount;
  const attendanceRate = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 100;

  if (loading) {
    return (
      <div className="py-24 text-center">
        <span className="w-8 h-8 border-4 border-[#111111]/10 border-t-[#111111] rounded-full animate-spin inline-block mb-3" />
        <p className="text-xs text-[#737373] font-bold">Loading student profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header Profile card */}
      <div className="flex flex-col items-center text-center pb-5 border-b border-[#F5F5F5] w-full">
        <div className="w-16 h-16 rounded-full bg-[#FAFAFA] text-[#111111] border-2 border-[#E5E5E5] flex items-center justify-center text-xl font-bold mb-3 shadow-inner">
          {getInitials(student.full_name)}
        </div>
        <h3 className="text-lg font-black text-[#111111] break-words max-w-full px-2">{student.full_name}</h3>
        <span className="badge badge-gold mt-1.5 uppercase text-[9px] font-bold py-0.5 px-2.5 rounded-md border border-[#FDE68A]">
          {streamLabel} Stream
        </span>
        <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider mt-3">
          {gradeLabel} · {boardLabel}
        </p>
      </div>

      {/* Attendance Summary */}
      <div className="space-y-3 w-full">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-black text-[#111111] uppercase tracking-wider">Attendance Performance</h4>
          {totalSessions > 0 && (
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                attendanceRate >= 75
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : attendanceRate >= 70
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {attendanceRate}% Rate
            </span>
          )}
        </div>

        {totalSessions === 0 ? (
          <div className="text-xs text-[#A3A3A3] font-semibold text-center py-4 bg-[#FAFAFA] border border-dashed border-[#E5E5E5] rounded-xl">
            No attendance records recorded yet.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
            <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl p-2 sm:p-2.5 min-w-0">
              <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
                <CheckCircle2 size={13} className="shrink-0" />
                <span className="text-xs font-bold">{presentCount}</span>
              </div>
              <span className="text-[9px] font-bold text-[#737373] uppercase tracking-wider block truncate">Present</span>
            </div>
            <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl p-2 sm:p-2.5 min-w-0">
              <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
                <Clock size={13} className="shrink-0" />
                <span className="text-xs font-bold">{lateCount}</span>
              </div>
              <span className="text-[9px] font-bold text-[#737373] uppercase tracking-wider block truncate">Late</span>
            </div>
            <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl p-2 sm:p-2.5 min-w-0">
              <div className="flex items-center justify-center gap-1 text-rose-600 mb-1">
                <XCircle size={13} className="shrink-0" />
                <span className="text-xs font-bold">{absentCount}</span>
              </div>
              <span className="text-[9px] font-bold text-[#737373] uppercase tracking-wider block truncate">Absent</span>
            </div>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="space-y-3 w-full">
        <h4 className="text-xs font-black text-[#111111] uppercase tracking-wider">Contact & Profile</h4>
        <div className="space-y-2.5 bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl p-3 sm:p-3.5 text-xs text-[#525252] font-semibold w-full overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <Hash size={13} className="text-[#A3A3A3] shrink-0" />
            <span className="truncate">Student ID: <span className="font-mono font-bold text-[#111111]">#{studentIdDisplay}</span></span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Phone size={13} className="text-[#A3A3A3] shrink-0" />
            <span className="truncate">{phoneDisplay}</span>
          </div>
          <div className="flex items-start gap-2 min-w-0">
            <Mail size={13} className="text-[#A3A3A3] shrink-0 mt-0.5" />
            <span className="break-all min-w-0 flex-1">{emailDisplay}</span>
          </div>
          <div className="flex items-start gap-2 min-w-0">
            <Calendar size={13} className="text-[#A3A3A3] shrink-0 mt-0.5" />
            <span className="break-words min-w-0 flex-1">Registered: {rosterEntry?.created_at ? new Date(rosterEntry.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Subject list */}
      <div className="space-y-3 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <h4 className="text-xs font-black text-[#111111] uppercase tracking-wider">Enrolled Subjects</h4>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border self-start sm:self-auto whitespace-nowrap shrink-0 ${
            isCustomPlan
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-zinc-100 text-zinc-700 border-zinc-200'
          }`}>
            {isCustomPlan ? `Custom Plan (${subjectPlan?.subjects?.length || 0} Subjects)` : 'All Subjects (Full Stream)'}
          </span>
        </div>
        <div className="space-y-2">
          {studentEnrollments.length === 0 ? (
            <div className="text-xs text-[#A3A3A3] font-semibold text-center py-4 bg-[#FAFAFA] border border-dashed border-[#E5E5E5] rounded-xl">
              No subjects enrolled.
            </div>
          ) : (
            studentEnrollments.map((e) => (
              <div key={e.id} className="bg-white border border-[#E5E5E5] rounded-xl p-3 flex items-center justify-between gap-2.5 min-w-0">
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-[#111111] truncate">{e.offering?.subject}</h5>
                  <p className="text-[10px] text-[#737373] mt-0.5 font-medium truncate">{e.offering?.teacher?.full_name || 'TBA'}</p>
                </div>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase shrink-0">
                  Active
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetailPanel;
