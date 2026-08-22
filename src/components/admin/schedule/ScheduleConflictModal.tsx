import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Clock,
  User,
  X,
  Check,
  CalendarDays,
} from 'lucide-react';
import { DAYS_OF_WEEK_FULL, DAYS_OF_WEEK_SHORT, formatTime12h } from '../../../lib/scheduleUtils';
import type { ClassSlot } from '../../../types';

export type ConflictType = 'duplicate_class' | 'teacher_double_booking' | 'cohort_clash';

export interface ConflictDetails {
  type: ConflictType;
  title: string;
  message: string;
  subjectName: string;
  teacherName: string;
  dayIndex: number;
  startTime: string;
  endTime: string;
  cohortGrade?: string;
  streamName?: string;
  conflictingSlot: ClassSlot & {
    offering?: any;
    custom_title?: string | null;
  };
  pendingFormData: {
    offering_id: string | null;
    custom_title?: string | null;
    class_id?: string | null;
    stream_id?: string | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    publish_to_news: boolean;
    notify_affected?: boolean;
  };
  isEditMode: boolean;
}

interface ScheduleConflictModalProps {
  conflict: ConflictDetails | null;
  allSlots: any[];
  onResolve: (updatedFormData: any) => void;
  onConfirmAnyway?: (formData: any) => void;
  onCancel: () => void;
}

const CANONICAL_PERIODS = [
  { label: 'Period 1', start: '16:00:00', end: '16:30:00', startShort: '16:00', endShort: '16:30' },
  { label: 'Period 2', start: '16:30:00', end: '17:00:00', startShort: '16:30', endShort: '17:00' },
  { label: 'Period 3', start: '17:00:00', end: '17:30:00', startShort: '17:00', endShort: '17:30' },
  { label: 'Period 4', start: '17:30:00', end: '18:00:00', startShort: '17:30', endShort: '18:00' },
  { label: 'Period 5', start: '18:00:00', end: '18:25:00', startShort: '18:00', endShort: '18:25' },
  { label: 'Period 6', start: '18:25:00', end: '18:50:00', startShort: '18:25', endShort: '18:50' },
];

export const ScheduleConflictModal: React.FC<ScheduleConflictModalProps> = ({
  conflict,
  allSlots,
  onResolve,
  onConfirmAnyway,
  onCancel,
}) => {
  if (!conflict) return null;

  const [activeTab, setActiveTab] = useState<'another_day' | 'different_time' | 'override'>('another_day');
  const [selectedNewDay, setSelectedNewDay] = useState<number>(
    conflict.dayIndex === 0 ? 1 : (conflict.dayIndex + 1) % 7
  );
  const [selectedNewPeriod, setSelectedNewPeriod] = useState<string>(
    CANONICAL_PERIODS[1].start
  );

  const conflictingSubject =
    conflict.conflictingSlot.custom_title ||
    conflict.conflictingSlot.offering?.subject_name ||
    conflict.conflictingSlot.offering?.subject ||
    'Class';
  const conflictingTeacher =
    conflict.conflictingSlot.offering?.teacher?.full_name || conflict.teacherName || 'Instructor';

  // Helper to check if a day is occupied for this teacher/cohort
  const getDayAvailability = (dayIdx: number) => {
    const isSameDay = dayIdx === conflict.dayIndex;
    const sameTimeSlots = allSlots.filter(
      (s) => s.day_of_week === dayIdx && s.start_time === conflict.pendingFormData.start_time && !s.is_cancelled
    );
    return {
      isSameDay,
      occupiedCount: sameTimeSlots.length,
      hasConflict: sameTimeSlots.length > 0,
    };
  };

  // Helper to check if a period is occupied on the original day
  const getPeriodAvailability = (start: string) => {
    const isOriginal = start === conflict.pendingFormData.start_time;
    const matching = allSlots.filter(
      (s) => s.day_of_week === conflict.dayIndex && s.start_time === start && !s.is_cancelled
    );
    return {
      isOriginal,
      hasConflict: matching.length > 0,
      count: matching.length,
    };
  };

  const handleApplyAnotherDay = () => {
    const updated = {
      ...conflict.pendingFormData,
      day_of_week: selectedNewDay,
    };
    onResolve(updated);
  };

  const handleApplyDifferentTime = () => {
    const periodObj = CANONICAL_PERIODS.find((p) => p.start === selectedNewPeriod);
    const start = periodObj ? periodObj.start : conflict.pendingFormData.start_time;
    const end = periodObj ? periodObj.end : conflict.pendingFormData.end_time;

    const updated = {
      ...conflict.pendingFormData,
      start_time: start,
      end_time: end,
    };
    onResolve(updated);
  };

  const handleApplyOverride = () => {
    if (onConfirmAnyway) {
      onConfirmAnyway(conflict.pendingFormData);
    } else {
      onResolve(conflict.pendingFormData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E5E5] rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#F0F0F0] bg-amber-50/60 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-900 shrink-0 mt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                {conflict.type === 'duplicate_class'
                  ? 'Duplicate Class Detected'
                  : conflict.type === 'teacher_double_booking'
                  ? 'Teacher Double-Booking Conflict'
                  : 'Time Slot Collision'}
              </span>
              <h3 className="font-extrabold text-base text-[#111111] leading-snug">
                {conflict.title}
              </h3>
              <p className="text-xs text-[#525252] font-medium mt-1">
                {conflict.message}
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-xl text-[#737373] hover:text-[#111111] hover:bg-black/5 flex items-center justify-center transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Existing vs Pending Visual Comparison Box */}
        <div className="px-5 pt-4">
          <div className="p-3.5 bg-gray-50 border border-gray-200/80 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-gray-500 text-[10px] uppercase tracking-wider">
              <span>Existing Slot in Schedule</span>
              <span>Attempted Change</span>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              {/* Existing slot card preview */}
              <div className="p-2.5 bg-white border border-amber-200 rounded-xl shadow-xs">
                <span className="font-extrabold text-gray-900 block truncate">
                  {conflictingSubject}
                </span>
                <span className="text-[11px] text-gray-600 font-semibold flex items-center gap-1 mt-0.5 truncate">
                  <User size={11} className="text-gray-400 shrink-0" />
                  {conflictingTeacher}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-amber-800 font-bold mt-1">
                  <Calendar size={10} />
                  <span>{DAYS_OF_WEEK_SHORT[conflict.conflictingSlot.day_of_week] || 'Day'}</span>
                  <span>·</span>
                  <Clock size={10} />
                  <span>{formatTime12h(conflict.conflictingSlot.start_time)}</span>
                </div>
              </div>

              {/* Pending slot card preview */}
              <div className="p-2.5 bg-white border border-blue-200 rounded-xl shadow-xs">
                <span className="font-extrabold text-gray-900 block truncate">
                  {conflict.subjectName}
                </span>
                <span className="text-[11px] text-gray-600 font-semibold flex items-center gap-1 mt-0.5 truncate">
                  <User size={11} className="text-gray-400 shrink-0" />
                  {conflict.teacherName}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-blue-700 font-bold mt-1">
                  <Calendar size={10} />
                  <span>{DAYS_OF_WEEK_SHORT[conflict.dayIndex] || 'Day'}</span>
                  <span>·</span>
                  <Clock size={10} />
                  <span>{formatTime12h(conflict.startTime)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Options Tabs */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-gray-700 block mb-2">
              Choose Resolution Strategy:
            </label>
            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('another_day')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'another_day'
                    ? 'bg-white text-[#111111] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CalendarDays size={13} />
                <span>Pick Another Day</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('different_time')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'different_time'
                    ? 'bg-white text-[#111111] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Clock size={13} />
                <span>Pick Different Time</span>
              </button>
            </div>
          </div>

          {/* Option A: Select Another Day (Preserves Time Slot) */}
          {activeTab === 'another_day' && (
            <div className="space-y-3 p-4 bg-amber-50/30 border border-amber-200/60 rounded-2xl animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">
                  Select Target Day ({formatTime12h(conflict.startTime)}):
                </span>
                <span className="text-[10px] text-gray-500 font-semibold">Same period maintained</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {DAYS_OF_WEEK_SHORT.map((shortDay, idx) => {
                  const isSelected = selectedNewDay === idx;
                  const isCurrentConflictDay = idx === conflict.dayIndex;
                  const avail = getDayAvailability(idx);

                  return (
                    <button
                      key={shortDay}
                      type="button"
                      disabled={isCurrentConflictDay}
                      onClick={() => setSelectedNewDay(idx)}
                      className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center ${
                        isCurrentConflictDay
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                          : isSelected
                          ? 'bg-[#111111] text-white border-[#111111] shadow-xs scale-102'
                          : avail.hasConflict
                          ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                          : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-[11px] font-black">{shortDay}</span>
                      <span
                        className={`text-[8px] font-bold mt-0.5 ${
                          isCurrentConflictDay
                            ? 'text-red-500'
                            : isSelected
                            ? 'text-amber-300'
                            : avail.hasConflict
                            ? 'text-amber-700'
                            : 'text-emerald-600'
                        }`}
                      >
                        {isCurrentConflictDay ? 'Conflict' : avail.hasConflict ? 'Busy' : 'Open'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-[11px] text-gray-600 font-medium">
                  Will {conflict.isEditMode ? 'move this class slot to' : 'schedule an additional session on'}{' '}
                  <strong className="text-gray-900">{DAYS_OF_WEEK_FULL[selectedNewDay]}</strong> at {formatTime12h(conflict.startTime)}.
                </span>
                <button
                  type="button"
                  onClick={handleApplyAnotherDay}
                  className="px-4 py-2 bg-[#111111] hover:bg-[#262626] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all shrink-0"
                >
                  <Check size={13} />
                  <span>
                    {conflict.isEditMode ? `Move to ${DAYS_OF_WEEK_SHORT[selectedNewDay]}` : `Add to ${DAYS_OF_WEEK_SHORT[selectedNewDay]}`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Option B: Select Different Time on Same Day */}
          {activeTab === 'different_time' && (
            <div className="space-y-3 p-4 bg-blue-50/30 border border-blue-200/60 rounded-2xl animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">
                  Select Open Period for {DAYS_OF_WEEK_FULL[conflict.dayIndex]}:
                </span>
                <span className="text-[10px] text-blue-700 font-semibold">FBISE Standard Periods</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CANONICAL_PERIODS.map((period) => {
                  const isSelected = selectedNewPeriod === period.start;
                  const avail = getPeriodAvailability(period.start);

                  return (
                    <button
                      key={period.start}
                      type="button"
                      disabled={avail.isOriginal}
                      onClick={() => setSelectedNewPeriod(period.start)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        avail.isOriginal
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                          : isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : avail.hasConflict
                          ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                          : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{period.label}</span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                            avail.isOriginal
                              ? 'bg-gray-200 text-gray-600'
                              : isSelected
                              ? 'bg-white/20 text-white'
                              : avail.hasConflict
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {avail.isOriginal ? 'Conflict' : avail.hasConflict ? 'Busy' : 'Open'}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] block mt-0.5 ${
                          isSelected ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTime12h(period.start)} - {formatTime12h(period.end)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-[11px] text-gray-600 font-medium">
                  Will schedule on <strong className="text-gray-900">{DAYS_OF_WEEK_FULL[conflict.dayIndex]}</strong> at{' '}
                  <strong className="text-gray-900">{formatTime12h(selectedNewPeriod)}</strong>.
                </span>
                <button
                  type="button"
                  onClick={handleApplyDifferentTime}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all shrink-0"
                >
                  <Check size={13} />
                  <span>Apply New Time</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-[#F0F0F0] flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-colors"
          >
            Cancel (Discard Change)
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyOverride}
              title="Explicitly confirm and save anyway if this parallel schedule is intended"
              className="px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-100/70 hover:bg-amber-200 border border-amber-300/80 rounded-xl transition-colors"
            >
              Keep Here Anyway (Confirm)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleConflictModal;
