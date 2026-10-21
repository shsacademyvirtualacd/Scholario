import React, { useState, useEffect } from 'react';
import {
  X,
  Video,
  Clock,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Trash2,
  Save,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { DAYS_OF_WEEK_FULL, formatTime12h } from '../../../lib/scheduleUtils';
import { upsertSlot } from '../../../lib/db';
import type { ClassSlot, ClassSessionLink, Teacher } from '../../../types';

interface SlotDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  slot: (ClassSlot & {
    streamName?: string;
    offering?: {
      id?: string;
      board?: string;
      grade?: string;
      subject_name?: string;
      subject?: string;
      teacher?: { full_name: string; id?: string };
    };
  }) | null;
  sessionLink?: ClassSessionLink | null;
  teachers?: Teacher[];
  onEditFullSlot: (slot: any) => void;
  onOpenLinkModal: (slot: any) => void;
  onToggleCancel: (slotId: string, currentStatus: boolean) => void;
  onDeleteSlot: (slotId: string) => void;
  onRefreshData: () => Promise<void>;
}

export const SlotDetailDrawer: React.FC<SlotDetailDrawerProps> = ({
  open,
  onClose,
  slot,
  sessionLink,
  teachers: _teachers,
  onEditFullSlot,
  onOpenLinkModal,
  onToggleCancel,
  onDeleteSlot,
  onRefreshData,
}) => {
  const [quickLink, setQuickLink] = useState('');
  const [isSavingLink, setIsSavingLink] = useState(false);

  useEffect(() => {
    if (slot) {
      const currentLink = sessionLink?.link_url || slot.room_or_link || '';
      setQuickLink(currentLink);
    }
  }, [slot, sessionLink]);

  if (!open || !slot) return null;

  const subject = slot.custom_title || slot.offering?.subject_name || slot.offering?.subject || 'Class';
  const teacherName = slot.offering?.teacher?.full_name || 'Unassigned Staff';
  const dayName = DAYS_OF_WEEK_FULL[slot.day_of_week] || 'Day';
  const startTime = formatTime12h(slot.start_time);
  const endTime = slot.end_time ? formatTime12h(slot.end_time) : '';
  const effectiveLink = (sessionLink?.link_url || slot.room_or_link || '').trim();
  const hasLink = Boolean(effectiveLink);
  const isCancelled = slot.is_cancelled;

  const handleSaveQuickLink = async () => {
    if (!slot) return;
    setIsSavingLink(true);
    try {
      await upsertSlot({
        ...slot,
        room_or_link: quickLink.trim() || null,
      });
      await onRefreshData();
      toast.success('Meeting link updated successfully.');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update meeting link.');
    } finally {
      setIsSavingLink(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Class Details & Actions
            </span>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
              {subject}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs text-neutral-700 dark:text-neutral-300">
          {/* Key Schedule Metadata */}
          <div className="grid grid-cols-2 gap-3 bg-neutral-50 dark:bg-neutral-800/40 p-3.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
            <div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <Calendar size={12} />
                <span>Day</span>
              </div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                {dayName}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <Clock size={12} />
                <span>Time (PKT)</span>
              </div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5 tabular-nums">
                {startTime} {endTime ? `- ${endTime}` : ''}
              </div>
            </div>

            <div className="col-span-2 pt-2 border-t border-neutral-200/40 dark:border-neutral-700/40 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <User size={12} />
                  <span>Instructor</span>
                </div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                  {teacherName}
                </div>
              </div>

              {slot.streamName && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                  {slot.streamName}
                </span>
              )}
            </div>
          </div>

          {/* Join Link Status Card */}
          <div className="space-y-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/20">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Video size={14} className="text-amber-500" />
                <span>Meeting Join Link</span>
              </span>

              {hasLink ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 size={11} />
                  <span>Link ready</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                  <AlertCircle size={11} />
                  <span>Missing Link</span>
                </span>
              )}
            </div>

            {/* Quick URL Input */}
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={quickLink}
                  onChange={(e) => setQuickLink(e.target.value)}
                  placeholder="https://meet.google.com/... or zoom.us/..."
                  className="w-full text-xs px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
                <button
                  type="button"
                  onClick={handleSaveQuickLink}
                  disabled={isSavingLink}
                  className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-neutral-950 rounded-lg font-bold flex items-center gap-1 shrink-0 transition-colors"
                >
                  {isSavingLink ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  <span>Save</span>
                </button>
              </div>

              {hasLink && (
                <a
                  href={effectiveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline pt-0.5"
                >
                  <span>Test open meeting room</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>

            {/* Advanced Override Button */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLinkModal(slot);
                }}
                className="w-full text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <span>Date-specific link or substitute teacher...</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Advanced</span>
              </button>
            </div>
          </div>

          {/* Cancellation State Card */}
          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-neutral-900 dark:text-neutral-100">
                {isCancelled ? 'Lecture is Cancelled' : 'Lecture is Active'}
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {isCancelled
                  ? 'Appears as strike-through on student timetable'
                  : 'Visible to students and faculty'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onToggleCancel(slot.id, isCancelled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isCancelled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-300'
              }`}
            >
              {isCancelled ? 'Restore Class' : 'Cancel Lecture'}
            </button>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDeleteSlot(slot.id);
            }}
            className="px-3.5 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEditFullSlot(slot);
              }}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-neutral-950 flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Edit2 size={13} />
              <span>Edit Full Slot</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotDetailDrawer;
