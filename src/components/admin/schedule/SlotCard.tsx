import React, { useState } from 'react';
import { Edit2, Trash2, X, Video } from 'lucide-react';
import type { ClassSlot, ClassSessionLink } from '../../../types';
import { getSubjectCardClasses, SCHEDULE_CARD_CLASSES } from '../../../lib/scheduleCardTheme';

interface SlotCardProps {
  slot: ClassSlot & {
    streamName?: string;
    offering?: {
      board?: string;
      grade?: string;
      subject_name?: string;
      subject?: string;
      stream_id?: string | null;
      stream?: string;
      teacher?: { full_name: string };
    };
  };
  sessionLink?: ClassSessionLink | null;
  onEdit: (slot: any) => void;
  onDelete: (slotId: string) => void;
  onEditLink?: (slot: any) => void;
  onToggleCancel?: (slotId: string, currentStatus: boolean) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (slotId: string) => void;
}

export const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  sessionLink,
  onEdit,
  onDelete,
  onEditLink,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const [isActive, setIsActive] = useState(false);
  const isCancelled = slot.is_cancelled;
  const subject = slot.custom_title || slot.offering?.subject_name || slot.offering?.subject || 'Class';
  const teacherName = slot.offering?.teacher?.full_name || 'Staff';

  // Meeting Link Status and Audit Resolution
  const effectiveLink = (sessionLink?.link_url || slot.room_or_link || '').trim();
  const hasLink = Boolean(effectiveLink);
  const auditRole = sessionLink?.link_updated_by_role || slot.link_updated_by_role;
  const isAdminOverride = auditRole === 'admin';
  const substituteName = sessionLink?.substitute_teacher_name || slot.substitute_teacher_name;

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
  const theme = getSubjectCardClasses(subject);

  return (
    <div
      onClick={handleCardClick}
      title={selectionMode ? undefined : `${subject} (${teacherName})`}
      className={`relative rounded-xl p-2.5 flex flex-col justify-between min-h-[68px] transition-all duration-200 group border text-left touch-manipulation select-none border-l-[3.5px] ${
        selectionMode ? 'cursor-pointer' : 'cursor-pointer hover:shadow-md'
      } ${
        isSelected
          ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 shadow-md'
          : isActive
            ? 'ring-2 ring-amber-400/80 border-amber-400 bg-amber-50/40 dark:bg-amber-950/40 shadow-md'
            : isCancelled
              ? 'opacity-50 bg-gray-100/70 dark:bg-neutral-800/60 border-gray-300 dark:border-neutral-700 border-l-gray-400 dark:border-l-neutral-600'
              : theme.card
      }`}
      style={{
        touchAction: 'manipulation',
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
            className="w-4 h-4 text-blue-600 border-gray-300 dark:border-neutral-600 rounded focus:ring-blue-500 cursor-pointer"
          />
        </div>
      )}

      {/* Subject + Teacher Header */}
      <div>
        <div className="flex items-start justify-between gap-1 pr-16">
          <span
            className={`text-xs font-black tracking-tight leading-snug truncate ${
              isCancelled ? 'line-through text-gray-500 dark:text-neutral-500' : theme.title
            }`}
            title={subject}
          >
            {subject}
          </span>
        </div>

        {/* Teacher Name: explicit contrast in both themes */}
        <div className={`text-[10px] ${SCHEDULE_CARD_CLASSES.teacherName} truncate mt-0.5`} title={teacherName}>
          {teacherName}
        </div>

        {/* Live Meeting Link Status Pill / Quick Add */}
        <div className="mt-1.5 flex items-center gap-1">
          {hasLink ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditLink?.(slot);
              }}
              className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-md border transition-all cursor-pointer truncate max-w-full shadow-2xs ${
                isAdminOverride
                  ? SCHEDULE_CARD_CLASSES.adminLinkPill
                  : SCHEDULE_CARD_CLASSES.linkReadyPill
              }`}
              title={
                isAdminOverride
                  ? `Admin override link: ${effectiveLink}${substituteName ? ` (Substitute: ${substituteName})` : ''} - Click to edit`
                  : `Class link: ${effectiveLink} - Click to edit or substitute`
              }
            >
              <Video size={10} className={isAdminOverride ? 'text-amber-700 dark:text-amber-300 shrink-0' : 'text-emerald-700 dark:text-emerald-300 shrink-0'} />
              <span className="truncate">
                {isAdminOverride
                  ? (substituteName ? `Sub: ${substituteName}` : 'Admin Link')
                  : 'Link Ready'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditLink?.(slot);
              }}
              className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-all cursor-pointer shadow-2xs ${SCHEDULE_CARD_CLASSES.addLinkButton}`}
              title="Add meeting link on behalf of teacher"
            >
              <Video size={10} className="text-slate-400 dark:text-neutral-400 shrink-0" />
              <span>+ Add Link</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer: Core/Elective/Stream badge & Cancelled status */}
      <div className="flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-black/5 dark:border-white/10">
        <span
          className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
            isCore
              ? SCHEDULE_CARD_CLASSES.coreBadge
              : SCHEDULE_CARD_CLASSES.electiveBadge
          }`}
          title={isCore ? 'Core subject (shared across streams)' : `Stream: ${slot.streamName || 'Elective'}`}
        >
          {slot.streamName ? `◆ ${slot.streamName}` : isCore ? '• Core' : '◆ Elective'}
        </span>

        {isCancelled && (
          <span className="text-[8px] font-black uppercase text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 px-1 py-0.2 rounded">
            Cancelled
          </span>
        )}
      </div>

      {/* Explicit Action Controls (Always visible on touch/mobile, hover on desktop) */}
      {!selectionMode && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-1.5 right-1.5 flex items-center gap-0.5 backdrop-blur-sm rounded-lg p-0.5 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 z-10 ${SCHEDULE_CARD_CLASSES.actionControls}`}
        >
          {/* Edit / Substitute Link (Video Camera) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditLink?.(slot);
            }}
            title={hasLink ? 'Edit / Substitute class meeting link' : 'Add class meeting link on behalf of teacher'}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              hasLink
                ? SCHEDULE_CARD_CLASSES.actionVideo
                : 'text-slate-700 dark:text-neutral-200 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/40'
            }`}
          >
            <Video size={12} />
          </button>

          {/* Edit (Pencil) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(slot);
            }}
            title="Edit class slot"
            className={`p-1 rounded-md transition-colors cursor-pointer ${SCHEDULE_CARD_CLASSES.actionEdit}`}
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
            className={`p-1 rounded-md transition-colors cursor-pointer ${SCHEDULE_CARD_CLASSES.actionDelete}`}
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
            className={`p-1 rounded-md transition-colors cursor-pointer ${SCHEDULE_CARD_CLASSES.actionClose}`}
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SlotCard;

