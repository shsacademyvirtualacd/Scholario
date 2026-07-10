import React from 'react';
import { Clock, MapPin, Video, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import type { ClassSlot } from '../../../types';

interface SlotCardProps {
  slot: ClassSlot & {
    offering?: {
      board: string;
      grade: string;
      subject_name?: string;
      subject?: string;
      teacher?: { full_name: string };
    };
  };
  onEdit: (slot: any) => void;
  onDelete: (slotId: string) => void;
  onToggleCancel: (slotId: string, currentStatus: boolean) => void;
}

export const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  onEdit,
  onDelete,
  onToggleCancel,
}) => {
  const isCancelled = slot.is_cancelled;
  const subject = slot.custom_title || slot.offering?.subject_name || slot.offering?.subject || 'Class';
  const teacherName = slot.offering?.teacher?.full_name || 'Staff';
  const board = 'FBISE';
  const grade = slot.offering?.grade || '10';

  const formatTime = (timeStr?: string) => {
    if (!timeStr || typeof timeStr !== 'string') return '';
    const [hours = 16, minutes = 0] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const getSubjectColor = (sub: string) => {
    switch (sub.toLowerCase()) {
      case 'mathematics': return '#F4C430';
      case 'physics': return '#3b82f6';
      case 'chemistry': return '#10b981';
      case 'biology': return '#ec4899';
      case 'computer science': return '#8b5cf6';
      default: return '#737373';
    }
  };

  const subjectColor = getSubjectColor(subject);
  const isOnline = slot.room_or_link?.toLowerCase().includes('http') || slot.room_or_link?.toLowerCase().includes('zoom');

  return (
    <div
      className={`bg-white border rounded-xl p-3 flex flex-col gap-2 transition-all duration-200 border-[#E5E5E5] hover:border-[#D4D4D4] hover:shadow-md hover:scale-[1.01] relative overflow-hidden group ${
        isCancelled ? 'opacity-60 bg-gray-50/50' : ''
      }`}
      style={{ borderLeft: `3px solid ${isCancelled ? '#D4D4D4' : subjectColor}` }}
    >
      {/* Subject & Actions Header */}
      <div className="flex items-center justify-between gap-1">
        <h4 className={`text-xs font-black text-[#111111] truncate ${isCancelled ? 'line-through text-[#737373]' : ''}`} title={subject}>
          {subject}
        </h4>
        
        {/* Hover action icons */}
        <div className="flex items-center gap-0.5 shrink-0 bg-[#FAFAFA] border border-[#E5E5E5] rounded-md p-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onToggleCancel(slot.id, isCancelled)}
            title={isCancelled ? 'Mark Active' : 'Mark Cancelled'}
            className={`p-0.5 rounded text-[#737373] transition-colors ${
              isCancelled ? 'hover:text-[#22c55e] hover:bg-emerald-50' : 'hover:text-amber-500 hover:bg-amber-50'
            }`}
          >
            {isCancelled ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
          </button>
          <button
            onClick={() => onEdit(slot)}
            title="Edit"
            className="p-0.5 rounded text-[#737373] hover:text-[#111111] hover:bg-[#E5E5E5] transition-colors"
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={() => onDelete(slot.id)}
            title="Delete"
            className="p-0.5 rounded text-[#737373] hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Grade and Board Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-black text-[#A3A3A3] uppercase tracking-wide">
          {board} Gr. {grade}
        </span>
        {isCancelled && (
          <span className="text-[8px] font-extrabold px-1 rounded bg-red-100 text-red-700 border border-red-200 uppercase scale-90">
            Cancelled
          </span>
        )}
      </div>

      {/* Time & Teacher row */}
      <div className="space-y-1 text-[10px] font-semibold text-[#525252]">
        <div className="flex items-center gap-1">
          <Clock size={10} className="text-[#A3A3A3] shrink-0" />
          <span className={isCancelled ? 'line-through text-[#A3A3A3]' : ''}>
            {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
          </span>
        </div>
        <div className="text-[#737373] truncate pl-3.5">
          {teacherName}
        </div>
      </div>

      {/* Location / Link */}
      {slot.room_or_link && (
        <div className="flex items-center gap-1 text-[9px] text-[#525252] font-bold bg-[#F5F5F5] px-1.5 py-0.5 rounded border border-[#E5E5E5] self-start max-w-full">
          {isOnline ? (
            <Video size={9} className="text-[#3b82f6] shrink-0" />
          ) : (
            <MapPin size={9} className="text-[#737373] shrink-0" />
          )}
          <span className="truncate max-w-[120px]">{slot.room_or_link}</span>
        </div>
      )}
    </div>
  );
};

export default SlotCard;
