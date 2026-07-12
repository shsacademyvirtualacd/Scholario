import React from 'react';
import { Calendar, BookOpen } from 'lucide-react';

interface SessionSelectorProps {
  slots: any[];
  selectedSlotId: string;
  onSelectSlot: (slotId: string) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const DAYS_NAME = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const SessionSelector: React.FC<SessionSelectorProps> = ({
  slots,
  selectedSlotId,
  onSelectSlot,
  selectedDate,
  onSelectDate,
}) => {
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="card bg-white border border-[#E5E5E5] p-5 flex flex-col md:flex-row items-stretch md:items-center gap-4 shadow-sm interactive">
      
      {/* Slot Selector Dropdown */}
      <div className="flex-1 space-y-1">
        <label className="text-xs font-bold text-[#525252] flex items-center gap-1.5">
          <BookOpen size={13} className="text-[#A3A3A3]" />
          Select Timetable Class:
        </label>
        <select
          value={selectedSlotId}
          onChange={(e) => onSelectSlot(e.target.value)}
          className="input py-2 px-3 text-xs w-full bg-white border-[#E5E5E5] rounded-xl cursor-pointer"
        >
          <option value="" disabled>Select a scheduled class offering...</option>
          {slots.map((slot) => {
            const subject = slot.offering?.subject || 'Class';
            const teacherName = slot.offering?.teacher?.full_name || 'Staff';
            const dayName = DAYS_NAME[slot.day_of_week];
            const grade = slot.offering?.grade || '';
            const board = slot.offering?.board?.toUpperCase() || '';

            return (
              <option key={slot.id} value={slot.id}>
                {subject} (Gr. {grade} - {board}) · {dayName} at {formatTime(slot.start_time)} (Taught by {teacherName})
              </option>
            );
          })}
        </select>
      </div>

      {/* Date Picker Input */}
      <div className="w-full md:w-56 space-y-1">
        <label className="text-xs font-bold text-[#525252] flex items-center gap-1.5">
          <Calendar size={13} className="text-[#A3A3A3]" />
          Lecture Session Date:
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onSelectDate(e.target.value)}
          className="input py-2 px-3 text-xs w-full bg-white border-[#E5E5E5] rounded-xl cursor-pointer font-mono"
        />
      </div>

    </div>
  );
};

export default SessionSelector;
