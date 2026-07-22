import React, { useState, useEffect } from 'react';
import { Video, MapPin, Clock, Lock } from 'lucide-react';
import StatusPill from '../ui/StatusPill';
import { calcDuration, formatTime12h, getPKTNow, getLinkAvailabilityStatus } from '../../lib/scheduleUtils';

interface ClassSlotCardProps {
  slot: any;
}

export const ClassSlotCard: React.FC<ClassSlotCardProps> = ({ slot }) => {
  const [pktnow, setPktnow] = useState(getPKTNow);

  // Ticker to re-evaluate link availability every 10 seconds in real time
  useEffect(() => {
    const timer = setInterval(() => {
      setPktnow(getPKTNow());
    }, 10_000);
    return () => clearInterval(timer);
  }, []);

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

  // 10-minute timing restriction status
  const linkStatus = getLinkAvailabilityStatus(slot, pktnow);
  const hasRawLink = Boolean(slot.room_or_link && slot.room_or_link.trim().length > 0);

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

      {/* Location / Join links with 10m timing restriction */}
      <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
        {linkStatus.isAvailable ? (
          <a
            href={slot.room_or_link!.startsWith('http') ? slot.room_or_link! : `https://${slot.room_or_link!}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs hover:scale-105"
          >
            <Video size={13} className="text-white" />
            <span>Join Class</span>
          </a>
        ) : linkStatus.status === 'locked' ? (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border bg-amber-50 border-amber-200 text-amber-700" title="Link opens 10 minutes before class start time">
            <Lock size={12} className="text-amber-600 shrink-0" />
            <span className="truncate max-w-[140px]">{linkStatus.message}</span>
          </div>
        ) : linkStatus.status === 'ended' ? (
          <div className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border bg-gray-100 border-gray-200 text-gray-500">
            <Clock size={12} className="text-gray-400 shrink-0" />
            <span>Session Ended</span>
          </div>
        ) : hasRawLink ? (
          <div className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border bg-gray-50 border-gray-200 text-gray-500" title="Link accessible 10 minutes before class">
            <Lock size={12} className="text-gray-400 shrink-0" />
            <span>Unlocks 10m before</span>
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

