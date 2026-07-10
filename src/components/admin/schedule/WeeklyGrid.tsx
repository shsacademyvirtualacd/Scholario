import React from 'react';
import { CalendarDays } from 'lucide-react';
import SlotCard from './SlotCard';

interface WeeklyGridProps {
  slots: any[];
  onAddSlot?: (dayIndex: number) => void;
  onEdit: (slot: any) => void;
  onDelete: (slotId: string) => void;
  onToggleCancel: (slotId: string, currentStatus: boolean) => void;
}

const DAYS_NAME = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({
  slots,
  onAddSlot,
  onEdit,
  onDelete,
  onToggleCancel,
}) => {
  // Group slots by day of the week (0 to 5)
  const getSlotsForDay = (dayIndex: number) => {
    return slots
      .filter((s) => s.day_of_week === dayIndex)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
      {DAYS_NAME.map((dayName, dayIndex) => {
        const daySlots = getSlotsForDay(dayIndex);
        
        return (
          <div key={dayName} className="flex flex-col bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shrink-0 shadow-sm min-h-[300px]">
            
            {/* Column Header */}
            <div className="px-4 py-3 border-b border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs font-black text-[#111111] uppercase tracking-wider">{dayName}</span>
                <span className="text-[10px] text-[#737373] font-bold block mt-0.5">
                  {daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div className="p-3 space-y-2.5 flex-1">
              {daySlots.length === 0 ? (
                <div className="h-full py-16 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-8 h-8 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0] flex items-center justify-center text-[#A3A3A3] mb-2">
                    <CalendarDays size={14} />
                  </div>
                  <span className="text-[10px] text-[#A3A3A3] font-extrabold uppercase tracking-wider">No Classes</span>
                  {onAddSlot && (
                    <button
                      onClick={() => onAddSlot(dayIndex)}
                      className="text-[10px] text-[#737373] hover:text-[#111111] font-bold mt-1.5 underline"
                    >
                      Schedule one
                    </button>
                  )}
                </div>
              ) : (
                daySlots.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleCancel={onToggleCancel}
                  />
                ))
              )}
            </div>
            
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyGrid;
