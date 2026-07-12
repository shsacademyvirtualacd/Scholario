import React, { useState } from 'react';
import { CalendarDays } from 'lucide-react';
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

  const isMobile = useMobile();
  const [activeDay, setActiveDay] = useState(0);

  if (isMobile) {
    const daySlots = getSlotsForDay(activeDay);
    return (
      <div className="flex flex-col gap-4">
        {/* Mobile Agenda Header */}
        <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
          {SHORT_DAYS.map((shortName, idx) => (
             <button 
               key={idx} 
               onClick={() => setActiveDay(idx)}
               className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 shadow-sm ${activeDay === idx ? 'bg-[#111111] text-white border border-[#111111]' : 'bg-white text-[#737373] border border-[#E5E5E5]'}`}
             >
               {shortName}
             </button>
          ))}
        </div>
        
        {/* Mobile Agenda Content */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-sm min-h-[350px]">
           <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#F5F5F5]">
              <span className="text-sm font-black text-[#111111] uppercase tracking-wider">{DAYS_NAME[activeDay]}</span>
              <span className="text-[10px] bg-[#FAFAFA] border border-[#E5E5E5] px-2 py-1 rounded-md text-[#525252] font-bold">
                {daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'}
              </span>
           </div>
           
           <div className="space-y-3">
              {daySlots.length === 0 ? (
                <div className="h-full py-16 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center text-[#A3A3A3] mb-3">
                    <CalendarDays size={16} />
                  </div>
                  <span className="text-[11px] text-[#A3A3A3] font-black uppercase tracking-wider">No Classes</span>
                  {onAddSlot && (
                    <button
                      onClick={() => onAddSlot(activeDay)}
                      className="text-xs text-[#111111] font-bold mt-2 underline"
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
      </div>
    );
  }

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
