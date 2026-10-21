/**
 * ConcurrentLiveLinkEditor.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Teacher Live Class Meeting Link Editor.
 *
 * Requirements (BUG 3):
 * 1. If a teacher has 2+ classes at the same time, the dashboard must show ONE
 *    SEPARATE CARD PER CLASS, each with its own link input and Save button.
 * 2. Every save must include session_id (slot.id + sessionDate) and offeringId so
 *    one link never overwrites another.
 * 3. Add loading and error states on every save, with clear success/failure feedback.
 * 4. Students in each class only see their own class's link.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import {
  Link as LinkIcon,
  Check,
  ExternalLink,
  Trash2,
  AlertCircle,
  Loader2,
  Clock,
  Layers,
} from 'lucide-react';
import {
  getSessionLinksForSlots,
  upsertSessionLink,
  deleteSessionLink,
} from '../../lib/db';
import { getSlotSubject, formatTime12h } from '../../lib/scheduleUtils';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { toast } from 'sonner';
import type { ClassSlot } from '../../types';

interface ConcurrentLiveLinkEditorProps {
  slots: ClassSlot[]; // One or more class slots in this time block
  sessionDate: string; // YYYY-MM-DD in PKT
  teacherId?: string;
  onLinkUpdated?: (linksMap: Record<string, string | null>) => void;
  compact?: boolean;
}

export const ConcurrentLiveLinkEditor: React.FC<ConcurrentLiveLinkEditorProps> = ({
  slots,
  sessionDate,
  teacherId,
  onLinkUpdated,
  compact = false,
}) => {
  const [linksMap, setLinksMap] = useState<Record<string, string | null>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [savingSlotId, setSavingSlotId] = useState<string | null>(null);
  const [errorSlotMap, setErrorSlotMap] = useState<Record<string, string | null>>({});
  const [successSlotMap, setSuccessSlotMap] = useState<Record<string, string | null>>({});
  const [isLoading, setIsLoading] = useState(true);

  const slotIds = slots.map((s) => s.id);
  const isConcurrent = slots.length > 1;

  // Load existing session links for all slots on this date
  const fetchLinks = async () => {
    if (slotIds.length === 0 || !sessionDate) {
      setIsLoading(false);
      return;
    }
    try {
      const records = await getSessionLinksForSlots(slotIds, sessionDate);
      const newMap: Record<string, string | null> = {};
      const newInputs: Record<string, string> = {};

      slotIds.forEach((id) => {
        const url = records[id]?.link_url || null;
        newMap[id] = url;
        newInputs[id] = url || '';
      });

      setLinksMap(newMap);
      setInputs((prev) => {
        // Retain any user-typed text that hasn't been saved yet if already present
        const merged: Record<string, string> = { ...newInputs };
        Object.keys(prev).forEach((key) => {
          if (prev[key] && !newInputs[key]) merged[key] = prev[key];
        });
        return merged;
      });

      onLinkUpdated?.(newMap);
    } catch (err) {
      console.warn('[ConcurrentLiveLinkEditor] error fetching session links:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchLinks();
  }, [slotIds.join(','), sessionDate]);

  // Realtime updates if link is created or updated
  useRealtimeTable({
    table: 'class_session_links',
    debounceMs: 500,
    onAny: fetchLinks,
  });

  // Handle saving an individual class's link
  const handleSaveSlotLink = async (slot: ClassSlot) => {
    const rawInput = inputs[slot.id] || '';
    const trimmed = rawInput.trim();

    setErrorSlotMap((prev) => ({ ...prev, [slot.id]: null }));
    setSuccessSlotMap((prev) => ({ ...prev, [slot.id]: null }));
    setSavingSlotId(slot.id);

    const subj = getSlotSubject(slot);

    try {
      if (trimmed) {
        // Validate basic URL protocol if typed without https://
        const finalUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')
          ? trimmed
          : `https://${trimmed}`;

        // Save includes session_id (slot.id + sessionDate) and offering_id
        await upsertSessionLink(
          slot.id,
          sessionDate,
          finalUrl,
          slot.offering_id,
          teacherId,
          {
            updatedBy: teacherId,
            updatedByRole: 'teacher',
          }
        );

        setLinksMap((prev) => ({ ...prev, [slot.id]: finalUrl }));
        setInputs((prev) => ({ ...prev, [slot.id]: finalUrl }));
        setSuccessSlotMap((prev) => ({ ...prev, [slot.id]: 'Link active' }));
        toast.success(`Live link saved for ${subj}`);
        onLinkUpdated?.({ ...linksMap, [slot.id]: finalUrl });
      } else {
        // If empty input submitted, remove link
        await deleteSessionLink(slot.id, sessionDate);
        setLinksMap((prev) => ({ ...prev, [slot.id]: null }));
        setInputs((prev) => ({ ...prev, [slot.id]: '' }));
        setSuccessSlotMap((prev) => ({ ...prev, [slot.id]: 'Link removed' }));
        toast.info(`Live link removed for ${subj}`);
        onLinkUpdated?.({ ...linksMap, [slot.id]: null });
      }
    } catch (err: any) {
      console.error('[ConcurrentLiveLinkEditor] failed to save slot link:', err);
      const errMsg = err?.message || 'Failed to save meeting link. Please try again.';
      setErrorSlotMap((prev) => ({ ...prev, [slot.id]: errMsg }));
      toast.error(`Error saving ${subj}: ${errMsg}`);
    } finally {
      setSavingSlotId(null);
    }
  };

  // Handle removing a link for a slot
  const handleRemoveSlotLink = async (slot: ClassSlot) => {
    setSavingSlotId(slot.id);
    setErrorSlotMap((prev) => ({ ...prev, [slot.id]: null }));
    const subj = getSlotSubject(slot);
    try {
      await deleteSessionLink(slot.id, sessionDate);
      setLinksMap((prev) => ({ ...prev, [slot.id]: null }));
      setInputs((prev) => ({ ...prev, [slot.id]: '' }));
      toast.info(`Link removed for ${subj}`);
      onLinkUpdated?.({ ...linksMap, [slot.id]: null });
    } catch (err: any) {
      toast.error(`Failed to remove link for ${subj}`);
    } finally {
      setSavingSlotId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-12 bg-gray-100 dark:bg-neutral-800 rounded-xl animate-pulse mt-2" />
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Render: If 2+ classes run at the same time, show ONE SEPARATE CARD PER CLASS!
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full mt-2.5 space-y-3">
      {/* Informational Banner for Simultaneous Classes */}
      {isConcurrent && (
        <div className="flex items-center justify-between gap-2 p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 rounded-xl text-amber-950 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 shrink-0">
              <Layers size={14} />
            </span>
            <div>
              <p className="text-xs font-extrabold">
                {slots.length} Simultaneous Classes at {formatTime12h(slots[0]?.start_time)}
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Each class has its own independent meeting link. Enter and save each link below.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-800/80 text-amber-950 dark:text-amber-100 shrink-0">
            {Object.values(linksMap).filter(Boolean).length} of {slots.length} Ready
          </span>
        </div>
      )}

      {/* Grid of Separate Cards - One per class */}
      <div className={`grid gap-3 w-full ${isConcurrent && !compact ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {slots.map((slot) => {
          const subj = getSlotSubject(slot);
          const gr = slot.offering?.grade || (slot.offering as any)?.class?.grade || '';
          const rawBoard = String(
            slot.offering?.board ||
            (slot.offering as any)?.class?.board?.name ||
            (slot.offering as any)?.board_name ||
            ''
          ).trim();
          const boardName = rawBoard.toLowerCase().includes('punjab')
            ? 'Punjab'
            : rawBoard.toLowerCase().includes('federal') || rawBoard.toLowerCase().includes('fbise')
            ? 'Federal'
            : rawBoard.toLowerCase().includes('sindh')
            ? 'Sindh'
            : rawBoard || '';

          const currentLink = linksMap[slot.id] || null;
          const isSlotSaving = savingSlotId === slot.id;
          const slotError = errorSlotMap[slot.id];
          const slotSuccess = successSlotMap[slot.id];
          const inputValue = inputs[slot.id] ?? '';

          return (
            <div
              key={slot.id}
              id={`live-link-editor-${slot.id}`}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between shadow-xs ${
                currentLink
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/80'
                  : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800'
              }`}
            >
              {/* Card Header: Subject, Grade, Board, Timing */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                        {subj}
                      </span>
                      {gr && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-neutral-700">
                          Gr. {gr}
                        </span>
                      )}
                      {boardName && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 rounded border border-amber-300 dark:border-amber-700">
                          {boardName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      <Clock size={11} />
                      <span>{formatTime12h(slot.start_time)} – {formatTime12h(slot.end_time)}</span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0">
                    {currentLink ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-100 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping inline-block" />
                        Live Link Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-md">
                        No Link Added
                      </span>
                    )}
                  </div>
                </div>

                {/* Active Link Preview if posted */}
                {currentLink && (
                  <div className="mt-2.5 p-2 bg-white dark:bg-neutral-800/80 rounded-lg border border-slate-200 dark:border-neutral-700 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
                      <LinkIcon size={12} className="text-emerald-600 shrink-0" />
                      <a
                        href={currentLink.startsWith('http') ? currentLink : `https://${currentLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline truncate"
                        title={currentLink}
                      >
                        {currentLink}
                      </a>
                      <ExternalLink size={10} className="text-slate-400 shrink-0" />
                    </div>
                    <button
                      onClick={() => handleRemoveSlotLink(slot)}
                      disabled={isSlotSaving}
                      className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors cursor-pointer shrink-0"
                      title={`Remove link for ${subj}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Input Form & Independent Save Button */}
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-neutral-800">
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {currentLink ? 'Update Meeting Link' : 'Meeting Link (Zoom / Meet / Teams)'}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder={`Paste link for ${subj}...`}
                    value={inputValue}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, [slot.id]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveSlotLink(slot)}
                    className="flex-1 text-xs px-2.5 py-1.5 bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-amber-400 dark:text-slate-100 shadow-2xs font-medium"
                  />
                  <button
                    onClick={() => handleSaveSlotLink(slot)}
                    disabled={isSlotSaving}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 text-xs font-black rounded-lg transition-all shadow-xs cursor-pointer interactive disabled:opacity-50 shrink-0 flex items-center gap-1"
                    title={`Save link for ${subj}`}
                  >
                    {isSlotSaving ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={12} strokeWidth={3} />
                        <span>Save Link</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Inline Error / Success Messages */}
                {slotError && (
                  <p className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1.5">
                    <AlertCircle size={11} className="shrink-0" />
                    <span>{slotError}</span>
                  </p>
                )}
                {slotSuccess && !slotError && (
                  <p className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">
                    <Check size={11} className="shrink-0" />
                    <span>{slotSuccess}</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConcurrentLiveLinkEditor;
