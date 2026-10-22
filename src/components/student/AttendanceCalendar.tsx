import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import type { Attendance } from '../../types';

interface AttendanceCalendarProps {
  attendanceRecords: Attendance[];
  onSelectDay?: (dateStr: string, records: Attendance[]) => void;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  attendanceRecords,
  onSelectDay,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const numDaysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    daysGrid.push(null);
  }
  for (let i = 1; i <= numDaysInMonth; i++) {
    daysGrid.push(i);
  }

  const getDayRecords = (day: number): Attendance[] => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendanceRecords.filter((record) => record.session_date === formattedDate);
  };

  const DAYS_HEADER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-2xs">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
          {monthName} {year}
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={prevMonth}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center mb-2">
        {DAYS_HEADER.map((day, idx) => (
          <span key={idx} className="text-[11px] font-bold text-neutral-400 uppercase">
            {day}
          </span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {daysGrid.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-10" />;
          }

          const dayRecords = getDayRecords(day);
          const hasRecord = dayRecords.length > 0;
          const hasPresent = dayRecords.some((r) => r.status === 'present');
          const hasLate = dayRecords.some((r) => r.status === 'late');
          const hasAbsent = dayRecords.some((r) => r.status === 'absent');
          const hasPending = dayRecords.some((r) => r.status === 'pending');

          const isToday =
            new Date().toDateString() === new Date(year, month, day).toDateString();

          let dayStyles = 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800';
          let indicatorDot = null;

          if (hasRecord) {
            if (hasPresent) {
              dayStyles = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
              indicatorDot = <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />;
            } else if (hasLate) {
              dayStyles = 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
              indicatorDot = <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-500" />;
            } else if (hasAbsent) {
              dayStyles = 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800';
              indicatorDot = <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-rose-500" />;
            } else if (hasPending) {
              dayStyles = 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
              indicatorDot = <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />;
            }
          }

          const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          return (
            <button
              key={`day-${day}`}
              type="button"
              onClick={() => onSelectDay?.(formattedDate, dayRecords)}
              className={`min-h-[44px] relative rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer ${dayStyles} ${
                isToday ? 'ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-neutral-900' : ''
              }`}
            >
              <span>{day}</span>
              {indicatorDot}
            </button>
          );
        })}
      </div>

      {/* Bigger Legend with Icon and Text */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
          <span>Present</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-amber-500 shrink-0" />
          <span>Late</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle size={14} className="text-rose-500 shrink-0" />
          <span>Absent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertCircle size={14} className="text-amber-500 shrink-0" />
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
