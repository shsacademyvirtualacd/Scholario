import React from 'react';
import { Eye, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { Profile, Enrollment, ClassOffering } from '../../../types';
import { getStudentBoardLabel, getStudentGradeLabel, getStudentStreamLabel, formatShortClassAndBoard } from '../../../lib/taxonomy';
import { capitalizeWords, formatPhoneDisplay } from './StudentDetailPanel';

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
  const getStats = (student: Profile) => {
    const studentEnrollments = enrollments.filter((e) => e.student_id === student.id);
    const classesCount = studentEnrollments.length;

    const boardName = getStudentBoardLabel(student, enrollments, offerings);
    const gradeName = getStudentGradeLabel(student, enrollments, offerings);
    const streamName = student.stream_obj?.name || student.stream;
    const boardAndGrade = `${gradeName} · ${boardName}`;
    const shortBoardAndGrade = formatShortClassAndBoard({ gradeName, boardName, streamName });

    return { classesCount, boardName, gradeName, boardAndGrade, shortBoardAndGrade };
  };

  const getInitials = (name: string) => {
    return (name || '')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStreamBadge = (student: Profile, boardName: string) => {
    const rawStream = getStudentStreamLabel(student);
    const isIelts = boardName.toLowerCase().includes('ielts') || rawStream.toLowerCase().includes('ielts');

    if (isIelts) {
      const isGt = rawStream.toLowerCase().includes('general');
      return {
        label: isGt ? 'IELTS · General Training' : 'IELTS · Academic',
        style: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      };
    }

    const norm = rawStream.toLowerCase();
    if (norm.includes('pre-med') || norm.includes('biology')) {
      return {
        label: 'Pre-Medical',
        style: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      };
    }
    if (norm.includes('pre-eng') || norm.includes('engineering')) {
      return {
        label: 'Pre-Engineering',
        style: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      };
    }
    if (norm.includes('ics') || norm.includes('computer')) {
      return {
        label: 'ICS',
        style: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      };
    }
    return {
      label: rawStream || 'General',
      style: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
    };
  };

  return (
    <div className="table-container overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
      <table className="table w-full min-w-[680px] text-left text-xs">
        <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800/90 backdrop-blur-xs border-b border-neutral-200 dark:border-neutral-700 z-10">
          <tr>
            <th className="py-3 px-4 font-black uppercase tracking-wider text-[11px] text-neutral-500 dark:text-neutral-400">
              Student
            </th>
            <th className="py-3 px-4 font-black uppercase tracking-wider text-[11px] text-neutral-500 dark:text-neutral-400">
              Stream
            </th>
            <th className="py-3 px-4 font-black uppercase tracking-wider text-[11px] text-neutral-500 dark:text-neutral-400">
              Board & Grade
            </th>
            <th className="py-3 px-4 font-black uppercase tracking-wider text-[11px] text-neutral-500 dark:text-neutral-400 hidden lg:table-cell">
              Phone
            </th>
            <th className="py-3 px-4 font-black uppercase tracking-wider text-[11px] text-neutral-500 dark:text-neutral-400 text-center">
              Attendance
            </th>
            <th className="py-3 px-4 font-black uppercase tracking-wider text-[11px] text-neutral-500 dark:text-neutral-400 text-right">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
          {students.map((student) => {
            const stats = getStats(student);
            const streamInfo = getStreamBadge(student, stats.boardName);
            const attData = attendanceStatsMap?.get(student.id);
            const isQualified = Boolean(attData && attData.total >= 10);
            const total = attData?.total || 0;
            const attended = attData?.attended || 0;
            const rate = attData?.rate ?? 0;

            return (
              <tr
                key={student.id}
                onClick={() => onView(student)}
                className="cursor-pointer hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition-colors group"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onView(student);
                  }
                }}
              >
                {/* Student Name & Initials */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-xs font-black text-neutral-800 dark:text-neutral-200 shrink-0">
                      {getInitials(student.full_name)}
                    </div>
                    <div>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100 block group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {capitalizeWords(student.full_name)}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Stream / IELTS */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span
                    className={`inline-block border text-[10px] font-bold py-0.5 px-2 rounded-md ${streamInfo.style}`}
                  >
                    {streamInfo.label}
                  </span>
                </td>

                {/* Board & Grade */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div
                    className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 truncate max-w-[170px]"
                    title={stats.boardAndGrade}
                  >
                    {stats.shortBoardAndGrade}
                  </div>
                </td>

                {/* Phone (Hidden on tablet, available in drawer) */}
                <td className="py-3 px-4 whitespace-nowrap hidden lg:table-cell">
                  <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                    {formatPhoneDisplay(student.phone)}
                  </span>
                </td>

                {/* Attendance rate with progress bar or status label */}
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  {isQualified ? (
                    <div className="inline-flex flex-col items-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                          rate >= 75
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : rate >= 70
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        }`}
                        title={`${attended} attended out of ${total} recorded sessions`}
                      >
                        {rate >= 75 ? (
                          <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400" />
                        ) : rate >= 70 ? (
                          <Clock size={11} className="text-amber-600 dark:text-amber-400" />
                        ) : (
                          <AlertTriangle size={11} className="text-rose-600 dark:text-rose-400" />
                        )}
                        <span>{rate}% {rate >= 75 ? 'Good' : rate >= 70 ? 'Fair' : 'At Risk'}</span>
                      </span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium mt-0.5">
                        {attended}/{total} sessions
                      </span>
                    </div>
                  ) : (
                    <div
                      className="inline-flex flex-col items-center gap-1"
                      title={`${total} of 10 recorded sessions required before calculating percentage`}
                    >
                      <div className="w-20 bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (total / 10) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                        {total} of 10 sessions
                      </span>
                    </div>
                  )}
                </td>

                {/* Action button */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(student);
                    }}
                    title="View Profile Details"
                    className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  >
                    <Eye size={15} />
                  </button>
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
