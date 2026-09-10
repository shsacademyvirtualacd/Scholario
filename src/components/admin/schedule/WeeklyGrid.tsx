import React, { useState, useEffect } from 'react';
import { Plus, Clock, Calendar, LayoutGrid } from 'lucide-react';
import SlotCard from './SlotCard';
import { useMobile } from '../../../hooks/useMobile';
import { formatTime12h, timeStrToMins } from '../../../lib/scheduleUtils';

interface WeeklyGridProps {
  slots: any[];
  onAddSlot?: (dayIndex: number, startTime?: string, endTime?: string) => void;
  onEdit: (slot: any) => void;
  onDelete: (slotId: string) => void;
  onToggleCancel: (slotId: string, currentStatus: boolean) => void;
  selectionMode?: boolean;
  selectedSlotIds?: string[];
  onToggleSelectSlot?: (slotId: string) => void;
}

const DAYS_NAME = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Canonical period schedule (reference presets & fallback when schedule has no slots yet)
export const CANONICAL_PERIODS = [
  { start_time: '16:30:00', end_time: '17:00:00', label: 'Period 0' },
  { start_time: '17:00:00', end_time: '17:30:00', label: 'Period 1' },
  { start_time: '17:30:00', end_time: '18:00:00', label: 'Period 2' },
  { start_time: '18:00:00', end_time: '18:30:00', label: 'Period 3' },
  { start_time: '18:30:00', end_time: '19:00:00', label: 'Period 4' },
];

export const getPeriodDisplayLabel = (startTime: string, fallbackIdx: number): string => {
  const mins = timeStrToMins(startTime);
  if (mins >= 16 * 60 + 20 && mins <= 16 * 60 + 40) return 'Period 0'; // 16:30 (4:30 PM)
  if (mins >= 16 * 60 + 50 && mins <= 17 * 60 + 10) return 'Period 1'; // 17:00 (5:00 PM)
  if (mins >= 17 * 60 + 20 && mins <= 17 * 60 + 40) return 'Period 2'; // 17:30 (5:30 PM)
  if (mins >= 17 * 60 + 50 && mins <= 18 * 60 + 10) return 'Period 3'; // 18:00 (6:00 PM)
  if (mins >= 18 * 60 + 20 && mins <= 18 * 60 + 40) return 'Period 4'; // 18:30 (6:30 PM)
  return `Period ${fallbackIdx + 1}`;
};

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({
  slots,
  onAddSlot,
  onEdit,
  onDelete,
  onToggleCancel,
  selectionMode = false,
  selectedSlotIds = [],
  onToggleSelectSlot,
}) => {
  const isMobile = useMobile();
  const [activeDay, setActiveDay] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'day'>(isMobile ? 'day' : 'grid');

  useEffect(() => {
    if (isMobile) {
      setViewMode('day');
    }
  }, [isMobile]);

  // Derive unique active time periods across all current slots, sorted strictly chronologically.
  // Unused preset periods are NOT added, preventing phantom empty rows/dead space.
  const getWeeklyPeriods = () => {
    if (slots.length === 0) {
      return CANONICAL_PERIODS.map((p) => ({
        start_time: p.start_time,
        end_time: p.end_time,
      }));
    }

    const timeMap = new Map<number, { start_time: string; end_time: string }>();

    slots.forEach((s) => {
      if (s.start_time) {
        const startMins = timeStrToMins(s.start_time);
        if (!timeMap.has(startMins)) {
          timeMap.set(startMins, {
            start_time: s.start_time,
            end_time: s.end_time || s.start_time,
          });
        }
      }
    });

    // Chronological order by start time in minutes
    return Array.from(timeMap.values()).sort(
      (a, b) => timeStrToMins(a.start_time) - timeStrToMins(b.start_time)
    );
  };

  const weeklyPeriods = getWeeklyPeriods();

  // Return all matching slots for a specific start time & day index
  const getSlotsForPeriodAndDay = (startTime: string, dayIndex: number) => {
    const targetMins = timeStrToMins(startTime);
    return slots.filter(
      (s) => s.day_of_week === dayIndex && timeStrToMins(s.start_time || '') === targetMins
    );
  };

  // Slots for the currently selected day in day view, sorted strictly chronologically
  const daySlots = slots
    .filter((s) => s.day_of_week === activeDay)
    .sort((a, b) => timeStrToMins(a.start_time || '00:00') - timeStrToMins(b.start_time || '00:00'));

  // Group active day's slots by unique start time for clean chronological display
  const dayTimeGroups: { startTime: string; endTime: string; slots: any[] }[] = [];
  const dayTimeMap = new Map<number, { startTime: string; endTime: string; slots: any[] }>();

  daySlots.forEach((slot) => {
    const startMins = timeStrToMins(slot.start_time || '00:00');
    if (!dayTimeMap.has(startMins)) {
      const entry = {
        startTime: slot.start_time || '00:00:00',
        endTime: slot.end_time || slot.start_time || '00:00:00',
        slots: [],
      };
      dayTimeMap.set(startMins, entry);
      dayTimeGroups.push(entry);
    }
    dayTimeMap.get(startMins)!.slots.push(slot);
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Top Bar with View Mode Toggle on Desktop */}
      {!isMobile && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#111111] uppercase tracking-wider">
              {viewMode === 'grid' ? 'Weekly Timetable Grid' : `${DAYS_NAME[activeDay]} Schedule`}
            </span>
            <span className="text-[10px] font-bold text-[#737373] bg-gray-100 px-2 py-0.5 rounded-full">
              {slots.length} {slots.length === 1 ? 'slot' : 'slots'} scheduled
            </span>
          </div>

          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#111111] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LayoutGrid size={13} />
              <span>Weekly Grid</span>
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-white text-[#111111] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Calendar size={13} />
              <span>Daily View</span>
            </button>
          </div>
        </div>
      )}

      {/* Day Switcher Tabs (Always visible on mobile, or on desktop when in Daily View) */}
      {(isMobile || viewMode === 'day') && (
        <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
          {SHORT_DAYS.map((shortName, idx) => {
            const countForDay = slots.filter((s) => s.day_of_week === idx).length;
            const isSelected = activeDay === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveDay(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                  isSelected
                    ? 'bg-[#111111] text-white border-[#111111] shadow-sm'
                    : 'bg-white text-[#737373] border-[#E5E5E5] hover:bg-gray-50'
                }`}
              >
                <span>{shortName}</span>
                {countForDay > 0 && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {countForDay}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── View 1: Daily Schedule View (Mobile & Desktop Day View) ── */}
      {(isMobile || viewMode === 'day') && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#F5F5F5]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-[#111111] uppercase tracking-wider">
                {DAYS_NAME[activeDay]}
              </span>
              <span className="text-[10px] font-bold text-[#737373] bg-gray-100 px-2 py-0.5 rounded-full">
                {daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'}
              </span>
            </div>
            {onAddSlot && (
              <button
                onClick={() => onAddSlot(activeDay)}
                className="flex items-center gap-1 text-xs font-bold text-[#111111] bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus size={13} />
                <span>Add Slot</span>
              </button>
            )}
          </div>

          {dayTimeGroups.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
              <Clock className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-bold text-gray-600">
                No classes scheduled for {DAYS_NAME[activeDay]}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Click below to add a class slot to this day.
              </p>
              {onAddSlot && (
                <button
                  onClick={() => onAddSlot(activeDay)}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Schedule Class</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {dayTimeGroups.map((group, idx) => (
                <div key={idx} className="flex gap-3 items-stretch">
                  {/* Period Time Column - strictly ordered by actual chronological time */}
                  <div className="w-28 shrink-0 text-left pt-2 border-r border-gray-100 pr-2.5">
                    <div className="flex items-center gap-1">
                      <Clock size={10} className="text-[#A3A3A3] shrink-0" />
                      <span className="text-[10px] font-black text-[#111111] block uppercase tracking-wider">
                        {getPeriodDisplayLabel(group.startTime, idx)}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#525252] block mt-0.5">
                      {formatTime12h(group.startTime)}
                    </span>
                    <span className="text-[9px] font-semibold text-[#8C8C8C] block">
                      to {formatTime12h(group.endTime)}
                    </span>
                  </div>

                  {/* Slot Cards Column */}
                  <div className="flex-1 min-w-0">
                    <div className="space-y-2">
                      {group.slots.map((slot) => (
                        <SlotCard
                          key={slot.id}
                          slot={slot}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onToggleCancel={onToggleCancel}
                          selectionMode={selectionMode}
                          isSelected={selectedSlotIds.includes(slot.id)}
                          onToggleSelect={onToggleSelectSlot}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {onAddSlot && (
                <div className="pt-3 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => onAddSlot(activeDay)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Add Another Slot for {SHORT_DAYS[activeDay]}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── View 2: Weekly Table Grid (Desktop) ── */}
      {!isMobile && viewMode === 'grid' && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[900px]">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                  <th className="p-3 text-[10px] font-black text-[#737373] uppercase tracking-wider w-36 border-r border-[#E5E5E5] sticky left-0 bg-[#FAFAFA] z-10">
                    Period / Time
                  </th>
                  {SHORT_DAYS.map((dayName) => (
                    <th
                      key={dayName}
                      className="p-3 text-xs font-black text-[#111111] uppercase tracking-wider border-r border-[#E5E5E5] last:border-r-0 text-center w-[15%]"
                    >
                      {dayName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {weeklyPeriods.map((period, pIdx) => (
                  <tr key={pIdx} className="hover:bg-[#FAFAFA]/40 transition-colors">
                    {/* Time Row Label */}
                    <td className="p-3 bg-[#FAFAFA] border-r border-[#E5E5E5] sticky left-0 z-10 align-middle">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Clock size={11} className="text-[#A3A3A3] shrink-0" />
                        <span className="text-xs font-black text-[#111111] tracking-tight">
                          {getPeriodDisplayLabel(period.start_time, pIdx)}
                        </span>
                      </div>
                      <div className="text-[10px] font-semibold text-[#737373]">
                        {formatTime12h(period.start_time)} – {formatTime12h(period.end_time)}
                      </div>
                    </td>

                    {/* Day Columns for this period */}
                    {SHORT_DAYS.map((_, dayIdx) => {
                      const matchedSlots = getSlotsForPeriodAndDay(period.start_time, dayIdx);

                      return (
                        <td
                          key={dayIdx}
                          className="p-2 border-r border-[#F0F0F0] last:border-r-0 align-top transition-colors relative group/cell min-w-[130px]"
                        >
                          {matchedSlots.length > 0 ? (
                            <div className="space-y-2">
                              {matchedSlots.map((slot) => (
                                <SlotCard
                                  key={slot.id}
                                  slot={slot}
                                  onEdit={onEdit}
                                  onDelete={onDelete}
                                  onToggleCancel={onToggleCancel}
                                  selectionMode={selectionMode}
                                  isSelected={selectedSlotIds.includes(slot.id)}
                                  onToggleSelect={onToggleSelectSlot}
                                />
                              ))}
                            </div>
                          ) : (
                            <div
                              onClick={() =>
                                onAddSlot && onAddSlot(dayIdx, period.start_time, period.end_time)
                              }
                              className="h-full min-h-[68px] rounded-xl border border-dashed border-transparent hover:border-amber-300 hover:bg-amber-50/40 flex items-center justify-center transition-all cursor-pointer group/btn"
                              title={`Click to schedule a class for ${SHORT_DAYS[dayIdx]} (${formatTime12h(period.start_time)})`}
                            >
                              <div className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center group-hover/btn:border-amber-400 group-hover/btn:text-amber-600 group-hover/btn:scale-110 transition-all opacity-0 group-hover/cell:opacity-100 shadow-sm">
                                <Plus size={12} />
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyGrid;


