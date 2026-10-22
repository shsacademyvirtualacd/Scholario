import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ClassSlot, ClassSessionLink } from '../../../types';
import { getSubjectCardClasses } from '../../../lib/scheduleCardTheme';
import { formatTime12h } from '../../../lib/scheduleUtils';

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
  onClick: (slot: any) => void;
  hasConflict?: boolean;
  conflictReason?: string;
  isLiveNow?: boolean;
  startsSoonMins?: number;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (slotId: string) => void;
}

export const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  sessionLink,
  onClick,
  hasConflict = false,
  conflictReason,
  isLiveNow = false,
  startsSoonMins,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const isCancelled = slot.is_cancelled;
  const subject = slot.custom_title || slot.offering?.subject_name || slot.offering?.subject || 'Class';
  const teacherName = slot.offering?.teacher?.full_name || 'Staff';

  // Join link resolution
  const effectiveLink = (sessionLink?.link_url || slot.room_or_link || '').trim();
  const hasLink = Boolean(effectiveLink);
  const isCore = !slot.stream_id && !slot.offering?.stream_id;
  const theme = getSubjectCardClasses(subject);

  const startTimeStr = formatTime12h(slot.start_time);
  const endTimeStr = slot.end_time ? formatTime12h(slot.end_time) : '';

  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode && onToggleSelect) {
      e.stopPropagation();
      onToggleSelect(slot.id);
      return;
    }
    onClick(slot);
  };

  return (
    <div
      onClick={handleClick}
      className={`relative rounded-xl p-2.5 flex flex-col justify-between transition-all duration-150 select-none border border-l-4 text-left cursor-pointer group hover:shadow-md ${
        isSelected
          ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/90 dark:bg-blue-950/70 shadow-sm'
          : isCancelled
          ? 'opacity-60 bg-neutral-100 dark:bg-neutral-800/60 border-neutral-300 dark:border-neutral-700 border-l-neutral-400'
          : hasConflict
          ? 'ring-1 ring-amber-500 border-amber-300 dark:border-amber-700 ' + theme.card
          : isLiveNow
          ? 'ring-2 ring-emerald-500/80 shadow-md ' + theme.card
          : theme.card
      }`}
      title={
        hasConflict
          ? `Conflict: ${conflictReason || 'Double-booked'}`
          : `${subject} (${teacherName}) - Click to manage`
      }
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="absolute top-2 right-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect && onToggleSelect(slot.id)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer"
          />
        </div>
      )}

      {/* ── Mobile View (<640px): Compact ~84px 2-line layout, tap to edit ── */}
      <div className="sm:hidden flex flex-col justify-between min-h-[76px] w-full">
        {/* Line 1: Subject + Timing */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`text-xs font-bold truncate ${
                isCancelled ? 'line-through text-neutral-400 dark:text-neutral-500' : theme.title
              }`}
            >
              {subject}
            </span>
            {hasConflict && !isCancelled && (
              <AlertTriangle size={13} className="text-amber-500 shrink-0" />
            )}
          </div>
          <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 shrink-0 font-medium">
            {startTimeStr}{endTimeStr ? ` - ${endTimeStr}` : ''}
          </span>
        </div>

        {/* Line 2: Teacher Name + Status Pills */}
        <div className="flex items-center justify-between gap-2 text-[10px] mt-2">
          <span className="text-neutral-600 dark:text-neutral-400 truncate text-[11px] font-medium">
            {teacherName}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {isLiveNow && !isCancelled && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded-md animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Live</span>
              </span>
            )}
            {isCancelled ? (
              <span className="text-[9px] font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950 px-1.5 py-0.5 rounded">
                Cancelled
              </span>
            ) : hasLink ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800/60">
                <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Link ready</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-700">
                <AlertCircle size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span>No link</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Tablet & Desktop View (>= 640px): Untouched layout ── */}
      <div className="hidden sm:flex sm:flex-col sm:justify-between w-full h-full">
        {/* Top: Subject + Conflict/Live Status */}
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <span
              className={`text-xs font-bold tracking-tight truncate leading-tight ${
                isCancelled ? 'line-through text-neutral-400 dark:text-neutral-500' : theme.title
              }`}
            >
              {subject}
            </span>

            {/* Conflict Indicator */}
            {hasConflict && !isCancelled && (
              <span
                className="shrink-0 text-amber-600 dark:text-amber-400"
                title={conflictReason || 'Double-booking conflict'}
              >
                <AlertTriangle size={13} />
              </span>
            )}
          </div>

          {/* Teacher Name */}
          <div className="text-[11px] text-neutral-600 dark:text-neutral-400 truncate mt-0.5">
            {teacherName}
          </div>

          {/* Timing string */}
          <div className="text-[10px] text-neutral-500 dark:text-neutral-400 tabular-nums mt-0.5">
            {startTimeStr}{endTimeStr ? ` - ${endTimeStr}` : ''}
          </div>
        </div>

        {/* Bottom Row: Link Status (Primary Signal) + Live/Tag status */}
        <div className="mt-2 pt-1.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-1 text-[10px]">
          {/* Link Status Pill - Most Obvious Signal */}
          {hasLink ? (
            <span
              className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800/60 truncate"
              title={`Meeting link ready: ${effectiveLink}`}
            >
              <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">Link ready</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-700 truncate"
              title="No join link configured for this class! Students will not be able to join."
            >
              <AlertCircle size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate">No link</span>
            </span>
          )}

          {/* Right side tags: Live Now / Starts in X min / Non-core Stream tag */}
          <div className="flex items-center gap-1 shrink-0">
            {isLiveNow && !isCancelled && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded-md animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Live</span>
              </span>
            )}

            {Boolean(startsSoonMins && startsSoonMins > 0) && !isLiveNow && !isCancelled && (
              <span className="text-[9px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded-md">
                In {startsSoonMins}m
              </span>
            )}

            {isCancelled && (
              <span className="text-[9px] font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950 px-1.5 py-0.5 rounded">
                Cancelled
              </span>
            )}

            {!isCore && slot.streamName && !isCancelled && (
              <span
                className="text-[9px] font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded truncate max-w-[60px]"
                title={`Stream: ${slot.streamName}`}
              >
                {slot.streamName}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotCard;
