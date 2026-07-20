import React, { useState } from 'react';
import { Plus, Clock } from 'lucide-react';
import SlotCard from './SlotCard';
import { useMobile } from '../../../hooks/useMobile';

interface WeeklyGridProps {
  slots: any[];
  onAddSlot?: (dayIndex: number) => void;
  onEdit: (slot: any) => void;
  onDelete: (slotId: string) => void;
  onToggleCancel: (slotId: string, currentStatus: boolean) => void;
}

const DAYS_NAME = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Standard default FBISE periods if no slots are available
const DEFAULT_PERIODS = [
  { start_time: '16:00:00', end_time: '16:30:00' },
  { start_time: '16:30:00', end_time: '17:00:00' },
  { start_time: '17:00:00', end_time: '17:30:00' },
  { start_time: '17:30:00', end_time: '18:00:00' },
  { start_time: '18:00:00', end_time: '18:25:00' },
  { start_time: '18:25:00', end_time: '18:50:00' },
];

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({
  slots,
  onAddSlot,
  onEdit,
  onDelete,
  onToggleCancel,
}) => {
  const isMobile = useMobile();
  const [activeDay, setActiveDay] = useState(0);

  const formatTime = (timeStr?: string) => {
    if (!timeStr || typeof timeStr !== 'string') return '';
    const [hours = 16, minutes = 0] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  // Derive unique period time slots from current slots, sorted chronologically
  const extractPeriods = () => {
    const map = new Map<string, { start_time: string; end_time: string }>();

    slots.forEach((s) => {
      const key = `${s.start_time || '16:00:00'}-${s.end_time || '17:00:00'}`;
      if (!map.has(key)) {
        map.set(key, {
          start_time: s.start_time || '16:00:00',
          end_time: s.end_time || '17:00:00',
        });
      }
    });

    const uniquePeriods = Array.from(map.values()).sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );

    return uniquePeriods.length > 0 ? uniquePeriods : DEFAULT_PERIODS;
  };

  const periods = extractPeriods();

  // Find matching slot for a specific period & day
  const getSlotForPeriodAndDay = (startTime: string, dayIndex: number) => {
    return slots.find(
      (s) => s.day_of_week === dayIndex && s.start_time === startTime
    );
  };

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4">
        {/* Mobile Day Switcher Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
          {SHORT_DAYS.map((shortName, idx) => {
            const countForDay = slots.filter((s) => s.day_of_week === idx).length;
            return (
              <button
                key={idx}
                onClick={() => setActiveDay(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 border ${
                  activeDay === idx
                    ? 'bg-[#111111] text-white border-[#111111] shadow-sm'
                    : 'bg-white text-[#737373] border-[#E5E5E5]'
                }`}
              >
                <span>{shortName}</span>
                {countForDay > 0 && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                      activeDay === idx ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {countForDay}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Agenda Grid */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#F5F5F5]">
            <span className="text-sm font-black text-[#111111] uppercase tracking-wider">
              {DAYS_NAME[activeDay]}
            </span>
            {onAddSlot && (
              <button
                onClick={() => onAddSlot(activeDay)}
                className="flex items-center gap-1 text-xs font-bold text-[#111111] bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <Plus size={13} />
                <span>Add Slot</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {periods.map((period, pIdx) => {
              const matchedSlot = getSlotForPeriodAndDay(period.start_time, activeDay);
              return (
                <div key={pIdx} className="flex gap-3 items-stretch">
                  <div className="w-24 shrink-0 text-left pt-2 border-r border-gray-100 pr-2">
                    <span className="text-[10px] font-black text-[#111111] block uppercase tracking-wider">
                      Period {pIdx + 1}
                    </span>
                    <span className="text-[9px] font-semibold text-[#737373] block mt-0.5">
                      {formatTime(period.start_time)}
                    </span>
                  </div>

                  <div className="flex-1">
                    {matchedSlot ? (
                      <SlotCard
                        slot={matchedSlot}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onToggleCancel={onToggleCancel}
                      />
                    ) : (
                      <div
                        onClick={() => onAddSlot && onAddSlot(activeDay)}
                        className="h-full min-h-[64px] border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-300 hover:border-gray-400 hover:text-gray-500 cursor-pointer transition-colors p-2"
                      >
                        <span className="text-[10px] font-bold flex items-center gap-1">
                          <Plus size={12} /> Empty Slot
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
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
            {periods.map((period, pIdx) => (
              <tr key={pIdx} className="hover:bg-[#FAFAFA]/40 transition-colors">
                {/* Time Row Label */}
                <td className="p-3 bg-[#FAFAFA] border-r border-[#E5E5E5] sticky left-0 z-10 align-middle">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Clock size={11} className="text-[#A3A3A3] shrink-0" />
                    <span className="text-xs font-black text-[#111111] tracking-tight">
                      Period {pIdx + 1}
                    </span>
                  </div>
                  <div className="text-[10px] font-semibold text-[#737373]">
                    {formatTime(period.start_time)} – {formatTime(period.end_time)}
                  </div>
                </td>

                {/* Day Columns for this period */}
                {SHORT_DAYS.map((_, dayIdx) => {
                  const matchedSlot = getSlotForPeriodAndDay(period.start_time, dayIdx);

                  return (
                    <td
                      key={dayIdx}
                      className="p-2 border-r border-[#F0F0F0] last:border-r-0 align-top transition-colors relative group/cell min-w-[130px]"
                    >
                      {matchedSlot ? (
                        <SlotCard
                          slot={matchedSlot}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onToggleCancel={onToggleCancel}
                        />
                      ) : (
                        <div
                          onClick={() => onAddSlot && onAddSlot(dayIdx)}
                          className="h-full min-h-[68px] rounded-xl border border-dashed border-transparent hover:border-amber-300 hover:bg-amber-50/40 flex items-center justify-center transition-all cursor-pointer group/btn"
                          title={`Click to schedule a class for ${SHORT_DAYS[dayIdx]} Period ${pIdx + 1}`}
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
  );
};

export default WeeklyGrid;

