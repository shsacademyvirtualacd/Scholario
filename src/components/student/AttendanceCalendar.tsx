import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Clock } from 'lucide-react';
import type { Attendance } from '../../types';

interface AttendanceCalendarProps {
  attendanceRecords: Attendance[];
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ attendanceRecords }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get month details
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  const numDaysInMonth = lastDayOfMonth.getDate();
  
  // Day of week of the first day (0 = Sun, 1 = Mon, ..., 6 = Sat)
  // Shift so Mon is 0, Tue is 1, ..., Sun is 6
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Generate calendar days grid
  const daysGrid: (number | null)[] = [];
  
  // Padding for start of month
  for (let i = 0; i < startDayOfWeek; i++) {
    daysGrid.push(null);
  }
  
  // Days of month
  for (let i = 1; i <= numDaysInMonth; i++) {
    daysGrid.push(i);
  }

  // Get status color for a specific day
  const getDayAttendance = (day: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendanceRecords.find(record => record.session_date === formattedDate);
  };

  const DAYS_HEADER = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider">
          {monthName} {year}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg border border-[#E5E5E5] hover:bg-[#F5F5F5] flex items-center justify-center text-[#525252] transition-colors interactive"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg border border-[#E5E5E5] hover:bg-[#F5F5F5] flex items-center justify-center text-[#525252] transition-colors interactive"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center mb-2">
        {DAYS_HEADER.map((day, idx) => (
          <span key={idx} className="text-[10px] font-bold text-[#A3A3A3] uppercase">
            {day}
          </span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-2 gap-x-1.5 text-center">
        {daysGrid.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-10" />;
          }

          const record = getDayAttendance(day);
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

          let dayStyles = 'text-[#111111] hover:bg-[#F5F5F5]';
          let indicatorElement = null;

          if (record) {
            if (record.status === 'present') {
              dayStyles = 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]';
              indicatorElement = <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#10b981]" />;
            } else if (record.status === 'absent') {
              dayStyles = 'bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5]';
              indicatorElement = <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#ef4444]" />;
            } else if (record.status === 'late') {
              dayStyles = 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]';
              indicatorElement = <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#F4C430]" />;
            }
          }

          return (
            <div
              key={`day-${day}`}
              className={`relative h-10 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-colors cursor-pointer ${dayStyles} ${
                isToday ? 'ring-2 ring-[#F4C430] ring-offset-2' : ''
              }`}
            >
              <span>{day}</span>
              {indicatorElement}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-[#F5F5F5] text-[10px] font-bold text-[#737373]">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[7px] text-[#065F46] font-extrabold"><Check size={6} /></span>
          Present
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center text-[7px] text-[#92400E] font-extrabold"><Clock size={6} /></span>
          Late
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-center text-[7px] text-[#991B1B] font-extrabold"><X size={6} /></span>
          Absent
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
