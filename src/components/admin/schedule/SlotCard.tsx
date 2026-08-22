import React, { useState } from 'react';
import { Edit2, Trash2, X } from 'lucide-react';
import type { ClassSlot } from '../../../types';

interface SlotCardProps {
  slot: ClassSlot & {
    offering?: {
      board?: string;
      grade?: string;
      subject_name?: string;
      subject?: string;
      stream_id?: string | null;
      teacher?: { full_name: string };
    };
  };
  onEdit: (slot: any) => void;
  onDelete: (slotId: string) => void;
  onToggleCancel?: (slotId: string, currentStatus: boolean) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (slotId: string) => void;
}

export const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  onEdit,
  onDelete,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const [isActive, setIsActive] = useState(false);
  const isCancelled = slot.is_cancelled;
  const subject = slot.custom_title || slot.offering?.subject_name || slot.offering?.subject || 'Class';
  const teacherName = slot.offering?.teacher?.full_name || 'Staff';

  const handleCardClick = (e: React.MouseEvent) => {
    if (selectionMode && onToggleSelect) {
      e.stopPropagation();
      onToggleSelect(slot.id);
      return;
    }
    setIsActive(prev => !prev);
  };

  // Core vs Elective distinction: null stream_id means core (shared across streams)
  const isCore = !slot.stream_id && !slot.offering?.stream_id;

  const getSubjectStyle = (sub: string) => {
    switch (sub.toLowerCase()) {
      case 'mathematics':
      case 'math':
        return { color: '#B48200', bg: '#FFFBF0', border: '#F4C430' };
      case 'physics':
        return { color: '#1d4ed8', bg: '#EFF6FF', border: '#3b82f6' };
      case 'chemistry':
        return { color: '#047857', bg: '#ECFDF5', border: '#10b981' };
      case 'biology':
        return { color: '#be185d', bg: '#FDF2F8', border: '#ec4899' };
      case 'computer science':
      case 'computer':
        return { color: '#6d28d9', bg: '#F5F3FF', border: '#8b5cf6' };
      case 'english':
        return { color: '#0e7490', bg: '#ECFEFF', border: '#06b6d4' };
      case 'urdu':
        return { color: '#c2410c', bg: '#FFF7ED', border: '#f97316' };
      case 'islamiat':
        return { color: '#4338ca', bg: '#EEF2FF', border: '#6366f1' };
      default:
        return { color: '#475569', bg: '#F8FAFC', border: '#94a3b8' };
    }
  };

  const style = getSubjectStyle(subject);

  return (
    <div
      onClick={handleCardClick}
      title={selectionMode ? undefined : `${subject} (${teacherName})`}
      className={`relative rounded-xl p-2.5 flex flex-col justify-between min-h-[68px] transition-all duration-200 group border text-left touch-manipulation select-none ${
        selectionMode ? 'cursor-pointer' : 'cursor-pointer hover:shadow-md'
      } ${
        isSelected
          ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/80 shadow-md'
          : isActive
            ? 'ring-2 ring-amber-400/80 border-amber-400 bg-amber-50/30 shadow-md'
            : isCancelled ? 'opacity-50 bg-gray-100/70 border-gray-300' : ''
      }`}
      style={{
        touchAction: 'manipulation',
        backgroundColor: isSelected ? undefined : (isCancelled ? undefined : style.bg),
        borderColor: isSelected ? undefined : (isCancelled ? undefined : `${style.border}40`),
        borderLeft: `3.5px solid ${isSelected ? '#2563eb' : (isCancelled ? '#9ca3af' : style.border)}`,
      }}
    >
      {/* Checkbox indicator in Selection Mode */}
      {selectionMode && (
        <div className="absolute top-2 right-2 z-20">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect && onToggleSelect(slot.id)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          />
        </div>
      )}

      {/* Subject + Teacher Header */}
      <div>
        <div className="flex items-start justify-between gap-1 pr-16">
          <span
            className={`text-xs font-black tracking-tight leading-snug truncate ${
              isCancelled ? 'line-through text-gray-500' : ''
            }`}
            style={{ color: isCancelled ? undefined : style.color }}
            title={subject}
          >
            {subject}
          </span>
        </div>

        {/* Teacher Name */}
        <div className="text-[10px] font-bold text-[#525252] truncate mt-0.5" title={teacherName}>
          {teacherName}
        </div>
      </div>

      {/* Footer: Core/Elective badge & Cancelled status */}
      <div className="flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-black/5">
        <span
          className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded shrink-0 ${
            isCore
              ? 'bg-slate-200/80 text-slate-700'
              : 'bg-purple-100 text-purple-800 border border-purple-200/60'
          }`}
          title={isCore ? 'Core subject (shared across streams)' : 'Stream elective subject'}
        >
          {isCore ? '• Core' : '◆ Elective'}
        </span>

        {isCancelled && (
          <span className="text-[8px] font-black uppercase text-red-600 bg-red-100 px-1 rounded">
            Cancelled
          </span>
        )}
      </div>

      {/* Explicit Action Controls (Always visible on touch/mobile, hover on desktop) */}
      {!selectionMode && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-white/95 backdrop-blur-sm border border-gray-200/90 rounded-lg p-0.5 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 z-10"
        >
          {/* Edit (Pencil) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(slot);
            }}
            title="Edit class slot"
            className="p-1 rounded-md text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <Edit2 size={12} />
          </button>

          {/* Delete (Trash) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(slot.id);
            }}
            title="Delete class slot"
            className="p-1 rounded-md text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
          </button>

          {/* Neutral Dismiss / Close (X) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsActive(false);
            }}
            title="Deselect / Dismiss"
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SlotCard;

