import React from 'react';
import { Video, MapPin, Clock } from 'lucide-react';
import StatusPill from '../ui/StatusPill';
import { calcDuration, formatTime12h } from '../../lib/scheduleUtils';
interface ClassSlotCardProps {
  slot: any;
}

export const ClassSlotCard: React.FC<ClassSlotCardProps> = ({ slot }) => {
  const isCancelled = slot.is_cancelled;
  const rawSubj = slot.custom_title || (slot.offering as any)?.subject_name || slot.offering?.subject || 'Class';
  const subject = typeof rawSubj === 'string' ? rawSubj : (rawSubj?.name || 'Class');
  const teacherName = slot.offering?.teacher?.full_name || 'Staff';

  // Duration computed from raw time strings — no Date objects, no TZ distortion
  const duration = calcDuration(slot.start_time, slot.end_time);

  // Color mappings
  const getSubjectColor = (sub: string) => {
    switch (sub.toLowerCase()) {
      case 'mathematics': return '#F4C430';
      case 'physics': return '#3b82f6';
      case 'chemistry': return '#10b981';
      default: return '#8b5cf6';
    }
  };

  const subjectColor = getSubjectColor(subject);

  // Parse if it is online (Zoom) or offline (Room)
  const isOnline = slot.room_or_link?.toLowerCase().includes('http') || slot.room_or_link?.toLowerCase().includes('zoom');

  return (
    <div
      className={`bg-white border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 border-[#E5E5E5] hover:border-[#D4D4D4] hover:shadow-sm ${
        isCancelled ? 'opacity-60 bg-gray-50' : ''
      }`}
      style={{ borderLeft: isCancelled ? '4px solid #D4D4D4' : `4px solid ${subjectColor}` }}
    >
      {/* Time & Duration */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#737373] shrink-0">
          <Clock size={16} />
        </div>
        <div>
          <div className={`text-sm font-extrabold text-[#111111] ${isCancelled ? 'line-through' : ''}`}>
            {formatTime12h(slot.start_time)} – {formatTime12h(slot.end_time)}
          </div>
          {duration && (
            <span className="text-[10px] text-[#A3A3A3] font-bold">{duration}</span>
          )}
        </div>
      </div>

      {/* Class info */}
      <div className="flex-1 min-w-0 md:pl-4 md:border-l border-[#F5F5F5]">
        <h3 className={`text-base font-extrabold text-[#111111] leading-tight truncate ${isCancelled ? 'line-through text-[#737373]' : ''}`}>
          {subject}
        </h3>
        <p className="text-xs text-[#737373] mt-0.5 font-medium truncate">{teacherName}</p>
      </div>

      {/* Location / Join links */}
      <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
        {isOnline ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border bg-blue-50 border-blue-100 text-blue-600">
            <Video size={13} className="text-blue-500" />
            <a href={slot.room_or_link!.startsWith('http') ? slot.room_or_link! : `https://${slot.room_or_link}`} target="_blank" rel="noreferrer" className="truncate max-w-[120px] hover:underline">
              Join Class
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border bg-[#F5F5F5] border-[#E5E5E5] text-[#525252]">
            <MapPin size={13} className="text-[#737373]" />
            <span className="truncate max-w-[120px]">TBD</span>
          </div>
        )}
        
        {/* Status Pill */}
        <StatusPill status={isCancelled ? 'cancelled' : 'upcoming'} />
      </div>
    </div>
  );
};

export default ClassSlotCard;
