/**
 * ConcurrentLiveLinkEditor.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Teacher Live Class Meeting Link Editor with full support for:
 * 1. Single class slots (simple, clean UI)
 * 2. Concurrent classes in the same time slot (e.g. 2, 3, or more classes/sections)
 *    - Displays clearly how many classes run in this slot and lists them
 *    - Entering the link once applies to ALL concurrent classes via upsertSessionLinkBatch
 *    - Students in all classes immediately receive the link via Supabase realtime
 *    - Optional per-class override allowing distinct meeting links per section
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import {
  Link as LinkIcon,
  Check,
  X,
  Layers,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Settings,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  getSessionLinksForSlots,
  upsertSessionLink,
  upsertSessionLinkBatch,
  deleteSessionLink,
  deleteSessionLinkBatch,
} from '../../lib/db';
import { getSlotSubject, formatTime12h } from '../../lib/scheduleUtils';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import type { ClassSlot } from '../../types';

interface ConcurrentLiveLinkEditorProps {
  slots: ClassSlot[]; // One or more concurrent class slots in this time block
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
  compact: _compact = false,
}) => {
  const [linksMap, setLinksMap] = useState<Record<string, string | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingShared, setIsEditingShared] = useState(false);
  const [sharedLinkInput, setSharedLinkInput] = useState('');
  const [showOverrides, setShowOverrides] = useState(false);
  const [editingOverrideSlotId, setEditingOverrideSlotId] = useState<string | null>(null);
  const [overrideInput, setOverrideInput] = useState('');

  const slotIds = slots.map(s => s.id);
  const isConcurrent = slots.length > 1;

  // Load existing session links for all slots in this time block
  const fetchLinks = async () => {
    if (slotIds.length === 0 || !sessionDate) {
      setIsLoading(false);
      return;
    }
    try {
      const records = await getSessionLinksForSlots(slotIds, sessionDate);
      const newMap: Record<string, string | null> = {};
      slotIds.forEach(id => {
        newMap[id] = records[id]?.link_url || null;
      });
      setLinksMap(newMap);

      // Determine initial shared link candidate
      const existingUrls = Object.values(newMap).filter(Boolean) as string[];
      if (existingUrls.length > 0) {
        setSharedLinkInput(existingUrls[0]);
      }

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

  // Realtime updates if another admin/teacher modifies the links
  useRealtimeTable({
    table: 'class_session_links',
    debounceMs: 500,
    onAny: fetchLinks,
  });

  // Calculate shared vs override status
  const existingLinks = slotIds.map(id => linksMap[id] || null);
  const nonNullLinks = existingLinks.filter(Boolean) as string[];
  const allHaveSameLink = nonNullLinks.length > 0 && nonNullLinks.every(url => url === nonNullLinks[0]) && nonNullLinks.length === slotIds.length;
  const currentSharedLink = allHaveSameLink ? nonNullLinks[0] : (nonNullLinks[0] || null);
  const hasAnyLink = nonNullLinks.length > 0;

  // Check if any slot has an override that differs from the primary/shared link
  const hasDistinctOverrides = isConcurrent && nonNullLinks.length > 0 && (!allHaveSameLink || nonNullLinks.length < slotIds.length);

  // ── Handlers ─────────────────────────────────────────────────────────

  // 1. Save shared link for ALL concurrent classes in this slot
  const handleSaveSharedLink = async () => {
    const trimmed = sharedLinkInput.trim();
    if (!trimmed) {
      handleRemoveAll();
      return;
    }

    setIsSaving(true);
    try {
      const metadata = slots.map(s => ({ slotId: s.id, offeringId: s.offering_id }));
      await upsertSessionLinkBatch(
        slotIds,
        sessionDate,
        trimmed,
        metadata,
        teacherId,
        {
          updatedBy: teacherId,
          updatedByRole: 'teacher',
        }
      );

      const updatedMap: Record<string, string | null> = {};
      slotIds.forEach(id => {
        updatedMap[id] = trimmed;
      });
      setLinksMap(updatedMap);
      setIsEditingShared(false);
      onLinkUpdated?.(updatedMap);
    } catch (err) {
      console.error('[ConcurrentLiveLinkEditor] failed to save batch link:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Save individual class override
  const handleSaveOverride = async (slot: ClassSlot) => {
    const trimmed = overrideInput.trim();
    setIsSaving(true);
    try {
      if (trimmed) {
        await upsertSessionLink(slot.id, sessionDate, trimmed, slot.offering_id, teacherId, {
          updatedBy: teacherId,
          updatedByRole: 'teacher',
        });
        setLinksMap(prev => ({ ...prev, [slot.id]: trimmed }));
      } else {
        await deleteSessionLink(slot.id, sessionDate);
        setLinksMap(prev => ({ ...prev, [slot.id]: null }));
      }
      setEditingOverrideSlotId(null);
      setOverrideInput('');
      onLinkUpdated?.({ ...linksMap, [slot.id]: trimmed || null });
    } catch (err) {
      console.error('[ConcurrentLiveLinkEditor] failed to save override:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Remove link for all concurrent classes
  const handleRemoveAll = async () => {
    setIsSaving(true);
    try {
      await deleteSessionLinkBatch(slotIds, sessionDate);
      const cleared: Record<string, string | null> = {};
      slotIds.forEach(id => {
        cleared[id] = null;
      });
      setLinksMap(cleared);
      setSharedLinkInput('');
      setIsEditingShared(false);
      onLinkUpdated?.(cleared);
    } catch (err) {
      console.error('[ConcurrentLiveLinkEditor] failed to remove batch links:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-8 bg-gray-100 rounded-lg animate-pulse mt-2" />
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // A. SINGLE CLASS SLOT
  // ───────────────────────────────────────────────────────────────────────────
  if (!isConcurrent) {
    const singleSlot = slots[0];
    const link = linksMap[singleSlot?.id] || null;

    if (isEditingShared) {
      return (
        <div className="w-full mt-2 bg-white border border-[#E5E5E5] rounded-xl p-3 shadow-xs">
          <label className="block text-[11px] font-bold text-[#111111] mb-1">
            Meeting Link (Zoom / Google Meet)
          </label>
          <div className="flex items-center gap-1.5 w-full">
            <input
              type="text"
              placeholder="https://meet.google.com/... or https://zoom.us/j/..."
              value={sharedLinkInput}
              onChange={e => setSharedLinkInput(e.target.value)}
              className="flex-1 text-xs px-2.5 py-1.5 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#F4C430] bg-white shadow-2xs"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSaveSharedLink()}
            />
            <button
              onClick={handleSaveSharedLink}
              disabled={isSaving}
              className="px-3 py-1.5 bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] text-xs font-bold rounded-lg interactive disabled:opacity-50 flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Check size={13} strokeWidth={3} />
              <span>Save</span>
            </button>
            <button
              onClick={() => {
                setIsEditingShared(false);
                setSharedLinkInput(link || '');
              }}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs"
              title="Cancel"
            >
              <X size={13} />
            </button>
          </div>
          <p className="text-[10px] text-[#737373] mt-1.5">
            Applies to today's session ({sessionDate}). Students will immediately see the Join button.
          </p>
        </div>
      );
    }

    if (link) {
      const fullUrl = link.startsWith('http') ? link : `https://${link}`;
      return (
        <div className="w-full mt-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl p-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate min-w-0 flex-1">
              <LinkIcon size={13} className="text-emerald-600 shrink-0" />
              <a
                href={fullUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-600 hover:underline truncate"
              >
                {link}
              </a>
              <ExternalLink size={11} className="text-[#A3A3A3] shrink-0" />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  setSharedLinkInput(link);
                  setIsEditingShared(true);
                }}
                className="text-[10px] font-bold text-[#525252] hover:text-[#111111] bg-white border border-[#E5E5E5] hover:bg-gray-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
              >
                Edit
              </button>
              <button
                onClick={handleRemoveAll}
                disabled={isSaving}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 px-1.5 py-1 rounded-md transition-colors cursor-pointer"
                title="Remove link"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>Live link active — students can join directly</span>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full mt-2">
        <button
          onClick={() => {
            setSharedLinkInput('');
            setIsEditingShared(true);
          }}
          className="flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-bold text-[#111111] bg-[#FFFEF5] hover:bg-[#FFF9E5] border border-dashed border-[#F4C430] hover:border-[#E5B520] rounded-xl transition-all shadow-2xs cursor-pointer interactive"
        >
          <LinkIcon size={13} className="text-[#B38E1B]" />
          <span>Add Live Class Link (Zoom / Meet)</span>
        </button>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // B. CONCURRENT CLASSES IN THIS SLOT (Multi-Class / Shared One-Time Link)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full mt-3 bg-gradient-to-b from-[#FFFDF5] to-white border-2 border-[#F4C430]/40 rounded-2xl p-3.5 shadow-xs">
      {/* Header: Clear Concurrent Banner */}
      <div className="flex items-start justify-between gap-2 border-b border-[#F5F5F5] pb-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F4C430] text-[#111111]">
              <Layers size={11} />
              {slots.length} Concurrent Classes
            </span>
            <span className="text-xs font-bold text-[#111111]">
              {formatTime12h(slots[0]?.start_time)} – {formatTime12h(slots[0]?.end_time)}
            </span>
          </div>
          <p className="text-[11px] text-[#737373] font-medium mt-1">
            Running simultaneously. Enter the meeting link once below to apply it to all {slots.length} classes.
          </p>
        </div>

        {/* Link summary badge */}
        {hasAnyLink && (
          <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            {allHaveSameLink ? 'Shared Link Active' : 'Active (Overrides Applied)'}
          </span>
        )}
      </div>

      {/* List of concurrent classes running in this slot */}
      <div className="flex items-center gap-1.5 flex-wrap my-2.5">
        {slots.map(s => {
          const subj = getSlotSubject(s);
          const gr = s.offering?.grade || (s.offering as any)?.class?.grade || '';
          const bd = String(
            s.offering?.board ||
            (s.offering as any)?.class?.board?.name ||
            (s.offering as any)?.board_name ||
            ''
          ).toUpperCase();

          const hasOverride = linksMap[s.id] && linksMap[s.id] !== currentSharedLink;

          return (
            <div
              key={s.id}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                hasOverride
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-white text-[#111111] border-[#E5E5E5]'
              }`}
            >
              <span>{subj}</span>
              {gr && <span className="text-[10px] font-semibold text-[#737373] bg-gray-100 px-1 rounded">Gr.{gr}</span>}
              {bd && <span className="text-[10px] font-bold text-amber-800">{bd}</span>}
              {hasOverride && (
                <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded font-extrabold">Override</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Main One-Time Shared Link Input Area */}
      {isEditingShared ? (
        <div className="space-y-2 bg-white border border-[#E5E5E5] p-3 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-[#111111] flex items-center gap-1">
              <Sparkles size={12} className="text-[#F4C430]" />
              Universal Link for All {slots.length} Classes
            </label>
            <span className="text-[10px] text-[#737373]">Zoom or Google Meet</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Paste Zoom / Google Meet URL..."
              value={sharedLinkInput}
              onChange={e => setSharedLinkInput(e.target.value)}
              className="flex-1 text-xs px-3 py-2 border border-[#E5E5E5] rounded-xl focus:outline-none focus:border-[#F4C430] bg-white shadow-2xs font-medium"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSaveSharedLink()}
            />
            <button
              onClick={handleSaveSharedLink}
              disabled={isSaving}
              className="px-3.5 py-2 bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] text-xs font-black rounded-xl interactive disabled:opacity-50 flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
            >
              <Check size={14} strokeWidth={3} />
              <span>{isSaving ? 'Applying...' : `Apply to All (${slots.length})`}</span>
            </button>
            <button
              onClick={() => {
                setIsEditingShared(false);
                setSharedLinkInput(currentSharedLink || '');
              }}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : hasAnyLink ? (
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <LinkIcon size={13} className="text-emerald-600 shrink-0" />
                <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
                  {allHaveSameLink ? `Universal Link (${slots.length} Classes)` : 'Shared Meeting Link'}
                </span>
              </div>
              <a
                href={currentSharedLink ? (currentSharedLink.startsWith('http') ? currentSharedLink : `https://${currentSharedLink}`) : '#'}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-600 hover:underline truncate block mt-0.5"
              >
                {currentSharedLink || 'Mixed per-class links'}
              </a>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setSharedLinkInput(currentSharedLink || '');
                  setIsEditingShared(true);
                }}
                className="px-2.5 py-1 text-xs font-bold text-[#111111] bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Update Link
              </button>
              <button
                onClick={handleRemoveAll}
                disabled={isSaving}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Remove link for all concurrent classes"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setSharedLinkInput('');
            setIsEditingShared(true);
          }}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 text-xs font-extrabold text-[#111111] bg-[#F4C430] hover:bg-[#E5B520] rounded-xl transition-all shadow-xs cursor-pointer interactive"
        >
          <LinkIcon size={14} />
          <span>Add Meeting Link for All {slots.length} Classes</span>
        </button>
      )}

      {/* Per-Class Override Toggle & Options */}
      <div className="mt-3 pt-2.5 border-t border-[#F0F0F0]">
        <button
          onClick={() => setShowOverrides(prev => !prev)}
          className="flex items-center justify-between w-full text-xs font-bold text-[#525252] hover:text-[#111111] transition-colors py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Settings size={12} className="text-[#A3A3A3]" />
            <span>Per-Class Link Overrides</span>
            {hasDistinctOverrides && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                Custom set
              </span>
            )}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-[#737373]">
            {showOverrides ? 'Hide overrides' : 'Customize per class'}
            {showOverrides ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </span>
        </button>

        {showOverrides && (
          <div className="space-y-2 mt-2 pt-2 border-t border-dashed border-[#E5E5E5]">
            <p className="text-[10px] text-[#737373]">
              Need a separate Zoom room or breakout link for a specific section? Override individual classes below:
            </p>

            {slots.map(s => {
              const subj = getSlotSubject(s);
              const gr = s.offering?.grade || (s.offering as any)?.class?.grade || '';
              const bd = String(
                s.offering?.board ||
                (s.offering as any)?.class?.board?.name ||
                (s.offering as any)?.board_name ||
                ''
              ).toUpperCase();

              const slotLink = linksMap[s.id] || null;
              const isOverridden = slotLink && currentSharedLink && slotLink !== currentSharedLink;
              const isEditingThis = editingOverrideSlotId === s.id;

              return (
                <div
                  key={s.id}
                  className="p-2.5 bg-white border border-[#E5E5E5] rounded-xl text-xs flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-extrabold text-[#111111]">{subj}</span>
                      <span className="text-[10px] text-[#737373] ml-1.5 font-medium">
                        {gr ? `Gr. ${gr}` : ''} {bd ? `· ${bd}` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isOverridden ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          Custom Link
                        </span>
                      ) : slotLink ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          Shared Link
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">No link</span>
                      )}

                      {!isEditingThis && (
                        <button
                          onClick={() => {
                            setEditingOverrideSlotId(s.id);
                            setOverrideInput(slotLink || '');
                          }}
                          className="text-[10px] font-bold text-[#111111] hover:underline px-1.5 py-0.5 cursor-pointer"
                        >
                          {slotLink ? 'Override' : 'Set Link'}
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditingThis ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="text"
                        placeholder="Custom link for this section..."
                        value={overrideInput}
                        onChange={e => setOverrideInput(e.target.value)}
                        className="flex-1 text-xs px-2.5 py-1.5 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#F4C430] bg-white"
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleSaveOverride(s)}
                      />
                      <button
                        onClick={() => handleSaveOverride(s)}
                        disabled={isSaving}
                        className="px-2.5 py-1.5 bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] text-xs font-bold rounded-lg interactive disabled:opacity-50 cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingOverrideSlotId(null)}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    slotLink && (
                      <div className="text-[11px] text-[#737373] truncate">
                        Link: <span className="text-blue-600 font-medium">{slotLink}</span>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConcurrentLiveLinkEditor;
