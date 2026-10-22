import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Hash,
  ExternalLink,
  MessageCircle,
  UserCheck,
} from 'lucide-react';
import type { Profile, Enrollment, ClassOffering, Teacher, RosterEntry, Attendance } from '../../../types';
import { getEnrollmentsForStudent, getAllOfferings, getAllTeachers, getAllRoster, getAttendanceForStudent } from '../../../lib/db';
import { getStudentBoardLabel, getStudentGradeLabel, getStudentStreamLabel } from '../../../lib/taxonomy';
import { formatStudentId } from '../../../lib/studentId';
import { getStudentSubjectPlanSync } from '../../../lib/subjectEnrollmentService';

interface StudentDetailPanelProps {
  student: Profile;
}

export function capitalizeWords(str?: string | null): string {
  if (!str) return '';
  return str
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatPhoneDisplay(raw?: string | null): string {
  if (!raw) return 'N/A';
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  let local10 = '';
  if (digits.startsWith('92') && digits.length === 12) {
    local10 = digits.slice(2);
  } else if (digits.startsWith('03') && digits.length === 11) {
    local10 = digits.slice(1);
  } else if (digits.length === 10 && digits.startsWith('3')) {
    local10 = digits;
  }
  if (local10.length === 10) {
    return `+92 ${local10.slice(0, 3)} ${local10.slice(3, 6)} ${local10.slice(6)}`;
  }
  return trimmed;
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
      getAttendanceForStudent(student.id),
    ])
      .then(([e, o, t, r, att]) => {
        setEnrollments(e);
        setOfferings(o);
        setTeachers(t);
        setRoster(r);
        setAttendanceRecords(att);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [student.id]);

  const studentEnrollments = enrollments.map((e) => {
    const offering = offerings.find((o) => o.id === e.offering_id);
    const teacher = offering ? teachers.find((t) => t.id === offering.teacher_id) : undefined;
    return {
      ...e,
      offering: offering ? { ...offering, teacher } : undefined,
    };
  });

  const subjectPlan =
    getStudentSubjectPlanSync(student.id) ||
    (student.subjects ? { subjects: student.subjects, plan_type: student.plan_type || 'custom' } : null);
  const isCustomPlan = Boolean(
    subjectPlan && subjectPlan.plan_type === 'custom' && subjectPlan.subjects && subjectPlan.subjects.length > 0
  );

  const getInitials = (name: string) => {
    return (name || '')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const boardLabel = getStudentBoardLabel(student, enrollments, offerings);
  const gradeLabel = getStudentGradeLabel(student, enrollments, offerings);
  const rawStream = getStudentStreamLabel(student);
  const isIelts = boardLabel.toLowerCase().includes('ielts') || rawStream.toLowerCase().includes('ielts');
  const streamLabel = isIelts
    ? rawStream.toLowerCase().includes('general')
      ? 'IELTS · General Training'
      : 'IELTS · Academic'
    : `${rawStream} Stream`;

  const rosterEntry = roster.find((r) => r.profile_id === student.id || r.id === student.id);
  const emailDisplay = rosterEntry ? rosterEntry.email : 'No email registered';
  const rawPhone = student.phone || (rosterEntry as any)?.phone;
  const phoneFormatted = formatPhoneDisplay(rawPhone);
  const rawDigits = (rawPhone || '').replace(/\D/g, '');
  const cleanPhoneIntl = rawDigits.startsWith('92')
    ? rawDigits
    : rawDigits.startsWith('03')
    ? `92${rawDigits.slice(1)}`
    : `92${rawDigits}`;
  const studentIdDisplay = rosterEntry ? formatStudentId(rosterEntry.id) : formatStudentId(student.id);

  // Attendance metrics
  const totalSessions = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((a) => a.status === 'present').length;
  const lateCount = attendanceRecords.filter((a) => a.status === 'late').length;
  const absentCount = attendanceRecords.filter((a) => a.status === 'absent').length;
  const attendedCount = presentCount + lateCount;
  const attendanceRate = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : null;

  if (loading) {
    return (
      <div className="py-24 text-center">
        <span className="w-8 h-8 border-4 border-neutral-300 dark:border-neutral-700 border-t-[#F4C430] rounded-full animate-spin inline-block mb-3" />
        <p className="text-xs text-neutral-500 font-bold">Loading student profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header Profile card */}
      <div className="flex flex-col items-center text-center pb-5 border-b border-neutral-100 dark:border-neutral-800 w-full">
        <div className="w-16 h-16 rounded-full bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-2 border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-xl font-bold mb-3 shadow-inner">
          {getInitials(student.full_name)}
        </div>
        <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100 break-words max-w-full px-2">
          {capitalizeWords(student.full_name)}
        </h3>
        <span className="mt-1.5 uppercase text-[10px] font-bold py-0.5 px-2.5 rounded-md border bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
          {streamLabel}
        </span>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider mt-2.5">
          {gradeLabel} · {boardLabel}
        </p>

        {/* Quick Link to Roster */}
        <Link
          to="/admin/roster"
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-[#F4C430] dark:bg-white dark:text-neutral-900 text-xs font-bold transition-all shadow-xs"
        >
          <UserCheck size={13} />
          <span>Open in Roster</span>
          <ExternalLink size={11} />
        </Link>
      </div>

      {/* Attendance Summary */}
      <div className="space-y-3 w-full">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
            Attendance Performance
          </h4>
          {attendanceRate !== null && (
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                attendanceRate >= 75
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : attendanceRate >= 70
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              }`}
            >
              {attendanceRate}% Rate ({attendanceRate >= 75 ? 'Good' : attendanceRate >= 70 ? 'Fair' : 'At Risk'})
            </span>
          )}
        </div>

        {totalSessions === 0 ? (
          <div className="text-xs text-neutral-400 font-semibold text-center py-4 bg-neutral-50 dark:bg-neutral-800/40 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
            No attendance records logged yet.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
              <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2 sm:p-2.5 min-w-0">
                <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 mb-1">
                  <CheckCircle2 size={13} className="shrink-0" />
                  <span className="text-xs font-bold">{presentCount}</span>
                </div>
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block truncate">Present</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2 sm:p-2.5 min-w-0">
                <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 mb-1">
                  <Clock size={13} className="shrink-0" />
                  <span className="text-xs font-bold">{lateCount}</span>
                </div>
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block truncate">Late</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2 sm:p-2.5 min-w-0">
                <div className="flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400 mb-1">
                  <XCircle size={13} className="shrink-0" />
                  <span className="text-xs font-bold">{absentCount}</span>
                </div>
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block truncate">Absent</span>
              </div>
            </div>

            {totalSessions < 10 && (
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 italic">
                Note: {totalSessions} of 10 sessions needed before formal attendance rate qualification.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="space-y-3 w-full">
        <h4 className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">Contact & Profile</h4>
        <div className="space-y-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 sm:p-3.5 text-xs text-neutral-700 dark:text-neutral-300 font-semibold w-full overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <Hash size={13} className="text-neutral-400 shrink-0" />
            <span className="truncate">
              Student ID: <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">#{studentIdDisplay}</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 min-w-0 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <Phone size={13} className="text-neutral-400 shrink-0" />
              <span className="font-mono">{phoneFormatted}</span>
            </div>
            {rawDigits.length >= 10 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`tel:+${cleanPhoneIntl}`}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-[10px] font-bold text-neutral-700 dark:text-neutral-200 hover:text-black flex items-center gap-1"
                  title="Call student"
                >
                  <Phone size={10} />
                  <span>Call</span>
                </a>
                <a
                  href={`https://wa.me/${cleanPhoneIntl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1"
                  title="Message on WhatsApp"
                >
                  <MessageCircle size={10} />
                  <span>WhatsApp</span>
                </a>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 min-w-0">
            <Mail size={13} className="text-neutral-400 shrink-0 mt-0.5" />
            <span className="break-all min-w-0 flex-1">{emailDisplay}</span>
          </div>
          <div className="flex items-start gap-2 min-w-0">
            <Calendar size={13} className="text-neutral-400 shrink-0 mt-0.5" />
            <span className="break-words min-w-0 flex-1">
              Registered:{' '}
              {rosterEntry?.created_at
                ? new Date(rosterEntry.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Subject list */}
      <div className="space-y-3 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <h4 className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
            Enrolled Subjects
          </h4>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border self-start sm:self-auto whitespace-nowrap shrink-0 ${
              isCustomPlan
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
            }`}
          >
            {isCustomPlan ? `Custom Plan (${subjectPlan?.subjects?.length || 0} Subjects)` : 'All Subjects (Full Stream)'}
          </span>
        </div>
        <div className="space-y-2">
          {studentEnrollments.length === 0 ? (
            <div className="text-xs text-neutral-400 font-semibold text-center py-4 bg-neutral-50 dark:bg-neutral-800/40 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
              No subjects enrolled.
            </div>
          ) : (
            studentEnrollments.map((e) => (
              <div
                key={e.id}
                className="bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 flex items-center justify-between gap-2.5 min-w-0"
              >
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                    {e.offering?.subject}
                  </h5>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium truncate">
                    {capitalizeWords(e.offering?.teacher?.full_name) || 'TBA'}
                  </p>
                </div>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded uppercase shrink-0">
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
