import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  ChevronDown,
  X,
  CalendarDays
} from 'lucide-react';
import type { ClassSlot, ClassOffering } from '../../types';
import {
  DAYS_OF_WEEK_FULL,
  DAYS_OF_WEEK_SHORT,
  formatTime12h,
  calcDuration,
  getPKTNow,
  getClosestDateForDayOfWeek
} from '../../lib/scheduleUtils';

interface AttendanceSessionPickerProps {
  offeringSlots: ClassSlot[];
  selectedOffering?: ClassOffering | null;
  selectedSlotId: string;
  onSelectSlot: (slotId: string) => void;
  sessionDate: string;
  onSelectDate: (date: string) => void;
}

export const AttendanceSessionPicker: React.FC<AttendanceSessionPickerProps> = ({
  offeringSlots,
  selectedOffering,
  selectedSlotId,
  onSelectSlot,
  sessionDate,
  onSelectDate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pktnow = getPKTNow();
  const todayDayIndex = pktnow.dayIndex;
  const todayDateStr = pktnow.dateString;

  const currentSelectedSlot = offeringSlots.find(s => s.id === selectedSlotId);

  // Helper to handle slot selection and auto-align date
  const handleChooseSlot = (slot: ClassSlot) => {
    onSelectSlot(slot.id);
    if (slot.day_of_week !== undefined && slot.day_of_week !== null) {
      const calculatedDate = getClosestDateForDayOfWeek(slot.day_of_week, pktnow);
      onSelectDate(calculatedDate);
    }
    setIsModalOpen(false);
  };

  // Format date nicely (e.g. "Sat, Aug 22, 2026")
  const formatDateLabel = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const isTodaySession = (slot: ClassSlot) => {
    return slot.day_of_week === todayDayIndex;
  };

  return (
    <div className="space-y-3">
      {/* Dynamic Session Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
        {/* Active Session & Dynamic Trigger Modal Button */}
        <div className="lg:col-span-7">
          <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-[#F4C430]" />
              Scheduled Timetable Session
            </span>
            {offeringSlots.length > 0 && (
              <span className="text-[10px] font-bold text-[#111111] bg-[#F5F5F5] px-1.5 py-0.5 rounded-md">
                {offeringSlots.length} {offeringSlots.length === 1 ? 'Slot' : 'Slots'} Configured
              </span>
            )}
          </label>

          {offeringSlots.length === 0 ? (
            <div className="w-full py-2.5 px-3 bg-[#FAFAFA] border border-dashed border-[#E5E5E5] rounded-xl text-xs text-[#737373] font-medium flex items-center gap-2">
              <Clock size={14} className="text-[#A3A3A3]" />
              <span>No timetable lecture slots found for this subject.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex-1 text-left bg-white border border-[#E5E5E5] hover:border-[#F4C430] rounded-xl py-2 px-3 transition-all shadow-xs flex items-center justify-between group interactive"
              >
                <div className="min-w-0 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                    <CalendarDays size={14} />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#111111]">
                        {currentSelectedSlot
                          ? `${DAYS_OF_WEEK_FULL[currentSelectedSlot.day_of_week ?? 0] || 'Day'}`
                          : 'Select Scheduled Session'}
                      </span>
                      {currentSelectedSlot && isTodaySession(currentSelectedSlot) && (
                        <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200">
                          ● Today
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#737373] font-medium truncate">
                      {currentSelectedSlot
                        ? `${formatTime12h(currentSelectedSlot.start_time)} – ${formatTime12h(currentSelectedSlot.end_time)} ${
                            calcDuration(currentSelectedSlot.start_time, currentSelectedSlot.end_time)
                              ? `(${calcDuration(currentSelectedSlot.start_time, currentSelectedSlot.end_time)})`
                              : ''
                          }`
                        : 'Choose an active session'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#737373] group-hover:text-[#111111] shrink-0 pl-2">
                  <span className="text-[11px] font-semibold hidden sm:inline">Change</span>
                  <ChevronDown size={14} />
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Date Selector with quick 'Today' reset */}
        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block flex items-center gap-1">
              <Calendar size={12} className="text-[#A3A3A3]" />
              Session Date
            </label>
            {sessionDate !== todayDateStr && (
              <button
                type="button"
                onClick={() => onSelectDate(todayDateStr)}
                className="text-[10px] font-bold text-amber-700 hover:text-amber-800 underline decoration-amber-300 transition-colors"
              >
                Jump to Today
              </button>
            )}
          </div>

          <div className="relative">
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-white border border-[#E5E5E5] rounded-xl cursor-pointer text-[#111111] font-semibold focus:outline-hidden focus:border-[#F4C430] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Quick session pills if multiple slots exist */}
      {offeringSlots.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] font-extrabold text-[#A3A3A3] uppercase tracking-wider mr-1">
            Quick Pick:
          </span>
          {offeringSlots.map((slot) => {
            const isSelected = slot.id === selectedSlotId;
            const isToday = isTodaySession(slot);
            const dayLabel = DAYS_OF_WEEK_SHORT[slot.day_of_week ?? 0] || 'Day';
            const timeLabel = formatTime12h(slot.start_time);

            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => handleChooseSlot(slot)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 border ${
                  isSelected
                    ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                    : isToday
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-[#FAFAFA] text-[#525252] border-[#E5E5E5] hover:bg-[#F5F5F5] hover:text-[#111111]'
                }`}
              >
                <span>{dayLabel}</span>
                <span className="opacity-70 text-[10px] font-normal">· {timeLabel}</span>
                {isToday && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Personalized Dynamic Session Selection Modal ──────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-[#E5E5E5] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#F0F0F0] flex items-center justify-between bg-[#FAFAFA]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F4C430]/20 border border-[#F4C430]/40 flex items-center justify-center text-amber-900 shrink-0">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#111111]">
                    Select Scheduled Lecture Session
                  </h3>
                  <p className="text-[11px] text-[#737373] font-medium">
                    {selectedOffering?.subject_name || selectedOffering?.subject || 'Class'} · Grade {selectedOffering?.grade || '10'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg text-[#737373] hover:text-[#111111] hover:bg-[#F0F0F0] flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body: Dynamic List of Slots */}
            <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto space-y-2.5">
              {offeringSlots.length === 0 ? (
                <div className="py-8 text-center text-[#737373] text-xs">
                  No active timetable sessions configured for this subject.
                </div>
              ) : (
                offeringSlots.map((slot) => {
                  const isSelected = slot.id === selectedSlotId;
                  const isToday = isTodaySession(slot);
                  const targetDate = getClosestDateForDayOfWeek(slot.day_of_week ?? 0, pktnow);
                  const dayFullName = DAYS_OF_WEEK_FULL[slot.day_of_week ?? 0] || 'Unknown Day';
                  const durationStr = calcDuration(slot.start_time, slot.end_time);

                  return (
                    <div
                      key={slot.id}
                      onClick={() => handleChooseSlot(slot)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-[#F4C430] bg-amber-50/40 shadow-xs'
                          : 'border-[#E5E5E5] hover:border-gray-300 hover:bg-[#FAFAFA]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-[#F4C430] bg-[#F4C430] text-[#111111]'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && <CheckCircle2 size={13} className="stroke-[3]" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#111111]">
                              {dayFullName}
                            </span>
                            {isToday ? (
                              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Today's Session
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-[#737373] bg-[#F5F5F5] px-1.5 py-0.5 rounded">
                                Next: {formatDateLabel(targetDate)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs text-[#525252] font-semibold">
                            <Clock size={12} className="text-[#A3A3A3] shrink-0" />
                            <span>
                              {formatTime12h(slot.start_time)} – {formatTime12h(slot.end_time)}
                            </span>
                            {durationStr && (
                              <span className="text-[10px] text-[#737373] font-normal">
                                · {durationStr}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors inline-block ${
                            isSelected
                              ? 'bg-[#111111] text-white'
                              : 'bg-[#F5F5F5] text-[#525252] group-hover:bg-[#E5E5E5]'
                          }`}
                        >
                          {isSelected ? 'Active' : 'Select'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-[#FAFAFA] border-t border-[#F0F0F0] flex items-center justify-between text-xs text-[#737373]">
              <span className="text-[11px]">
                Showing real scheduled timetable slots for this teacher.
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-[#111111] hover:bg-[#E5E5E5] rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSessionPicker;
