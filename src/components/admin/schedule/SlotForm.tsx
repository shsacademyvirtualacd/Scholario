import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Loader2,
  Check,
  AlertTriangle,
  Clock,
  Layers,
  BookOpen,
  Calendar,
  Video,
  User,
  X,
} from 'lucide-react';
import { useMobile } from '../../../hooks/useMobile';
import { formatTime12h } from '../../../lib/scheduleUtils';
import { formatGradeDisplay, getBoardDef } from '../../../lib/taxonomy';
import type { ClassSlot, ClassOffering } from '../../../types';

interface SlotFormProps {
  slot?: ClassSlot | Partial<ClassSlot> | null;
  offerings: ClassOffering[];
  taxonomy: any;
  existingSlots?: ClassSlot[];
  defaultClassId?: string;
  defaultStreamId?: string;
  isDuplicateMode?: boolean;
  onSave: (data: {
    offering_id: string | null;
    custom_title?: string | null;
    class_id?: string | null;
    stream_id?: string | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room_or_link?: string | null;
    is_cancelled?: boolean;
    publish_to_news: boolean;
    notify_affected?: boolean;
    days_of_week?: number[];
    allowClash?: boolean;
  }) => Promise<void> | void;
  onDuplicate?: () => void;
  onCancelDuplicate?: () => void;
  onCancel: () => void;
}

const DAYS = [
  { value: 0, label: 'Monday', short: 'Mon' },
  { value: 1, label: 'Tuesday', short: 'Tue' },
  { value: 2, label: 'Wednesday', short: 'Wed' },
  { value: 3, label: 'Thursday', short: 'Thu' },
  { value: 4, label: 'Friday', short: 'Fri' },
  { value: 5, label: 'Saturday', short: 'Sat' },
  { value: 6, label: 'Sunday', short: 'Sun' },
];

const PERIOD_PRESETS = [
  { label: 'Period 0 (4:30 - 5:00 PM)', start: '16:30', end: '17:00' },
  { label: 'Period 1 (5:00 - 5:30 PM)', start: '17:00', end: '17:30' },
  { label: 'Period 2 (5:30 - 6:00 PM)', start: '17:30', end: '18:00' },
  { label: 'Period 3 (6:00 - 6:30 PM)', start: '18:00', end: '18:30' },
  { label: 'Period 4 (6:30 - 7:00 PM)', start: '18:30', end: '19:00' },
  { label: 'Legacy (4:00 - 4:30 PM)', start: '16:00', end: '16:30' },
];

interface ClashItem {
  day: number;
  dayName: string;
  timeRange: string;
  instructorName: string;
  clashingSubject: string;
  clashingClassName: string;
  summary: string;
  detail: string;
}

export const SlotForm: React.FC<SlotFormProps> = ({
  slot,
  offerings,
  taxonomy,
  existingSlots = [],
  defaultClassId = '',
  defaultStreamId = '',
  isDuplicateMode = false,
  onSave,
  onCancel,
}) => {
  const isMobile = useMobile();
  const isEditMode = Boolean(!isDuplicateMode && slot && (slot as any).id);

  // Form State
  const [slotMode, setSlotMode] = useState<'offering' | 'custom'>('offering');
  const [offeringId, setOfferingId] = useState('');
  const [customTitle, setCustomTitle] = useState('Break');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStreamId, setSelectedStreamId] = useState('');
  
  // Days state:
  // For edit mode: single day (0..6)
  // For create/duplicate mode: array of days
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [selectedDays, setSelectedDays] = useState<number[]>([0]);

  // Times
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('16:30');

  // Extras
  const [roomOrLink, setRoomOrLink] = useState('');
  const [isCancelled, setIsCancelled] = useState(false);
  const [notifyAffected, setNotifyAffected] = useState(false);

  // Status & Validation
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Clash confirmation modal state (opened when user clicks save & clashes exist)
  const [clashState, setClashState] = useState<{
    clashes: ClashItem[];
    cleanDays: number[];
    allDays: number[];
  } | null>(null);

  // Initialize or re-populate from props
  useEffect(() => {
    const hasSlotData = Boolean(
      slot && ((slot as any).id || isDuplicateMode || slot.offering_id || slot.custom_title)
    );

    if (hasSlotData && slot) {
      setIsCancelled(!!slot.is_cancelled);
      setRoomOrLink(slot.room_or_link || '');

      if (slot.offering_id) {
        setSlotMode('offering');
        setOfferingId(slot.offering_id);
        const off = offerings.find((o) => o.id === slot.offering_id);
        setSelectedClassId(off?.class_id || slot.class_id || (off as any)?.class?.id || defaultClassId || '');
        setSelectedStreamId(slot.stream_id || off?.stream_id || '');
      } else if (slot.custom_title) {
        setSlotMode('custom');
        setOfferingId('');
        setCustomTitle(slot.custom_title || 'Break');
        setSelectedClassId(slot.class_id || defaultClassId || '');
        setSelectedStreamId(slot.stream_id || defaultStreamId || '');
      } else {
        setSlotMode('offering');
        setOfferingId('');
        setSelectedClassId(slot.class_id || defaultClassId || '');
        setSelectedStreamId(slot.stream_id || defaultStreamId || '');
      }

      const initialDay = slot.day_of_week !== undefined && slot.day_of_week !== null ? Number(slot.day_of_week) : 0;
      setDayOfWeek(initialDay);
      setSelectedDays([initialDay]);
      setStartTime(slot.start_time ? slot.start_time.slice(0, 5) : '16:00');
      setEndTime(slot.end_time ? slot.end_time.slice(0, 5) : '16:30');
    } else {
      setIsCancelled(false);
      setRoomOrLink('');
      setSelectedClassId(defaultClassId || '');
      setSelectedStreamId(defaultStreamId || '');
      setSlotMode('offering');
      setOfferingId('');
      setCustomTitle('Break');
      const initialDay = slot?.day_of_week !== undefined && slot?.day_of_week !== null ? Number(slot.day_of_week) : 0;
      setDayOfWeek(initialDay);
      setSelectedDays([initialDay]);
      setStartTime(slot?.start_time ? slot.start_time.slice(0, 5) : '16:00');
      setEndTime(slot?.end_time ? slot.end_time.slice(0, 5) : '16:30');
    }

    setNotifyAffected(false);
    setError(null);
    setClashState(null);
  }, [slot, offerings, defaultClassId, defaultStreamId, isDuplicateMode]);

  // Auto-fill stream when offering is picked
  useEffect(() => {
    if (slotMode !== 'offering' || !offeringId) return;
    const offering = offerings.find((o) => o.id === offeringId);
    if (offering?.stream_id) {
      setSelectedStreamId(offering.stream_id);
    }
  }, [offeringId, slotMode, offerings]);

  // Filter offerings based on chosen class and stream
  const filteredOfferings = useMemo(() => {
    return offerings.filter((o) => {
      if (selectedClassId && o.class_id !== selectedClassId && (o as any)?.class?.id !== selectedClassId) {
        return false;
      }
      if (selectedStreamId && selectedStreamId !== 'all' && selectedStreamId !== '') {
        const offStreamId = o.stream_id || (o as any)?.stream?.id;
        if (offStreamId && offStreamId !== selectedStreamId) return false;
      }
      return true;
    });
  }, [offerings, selectedClassId, selectedStreamId]);

  const selectableOfferings = useMemo(() => {
    const list = [...filteredOfferings];
    const current = offerings.find((o) => o.id === offeringId);
    if (current && !list.some((o) => o.id === current.id)) {
      list.unshift(current);
    }
    return list;
  }, [filteredOfferings, offerings, offeringId]);

  // Handlers
  const handleClassChange = (val: string) => {
    setSelectedClassId(val);
    setSelectedStreamId('');
    setClashState(null);
  };

  const handleStreamChange = (val: string) => {
    setSelectedStreamId(val);
    setOfferingId('');
    setClashState(null);
  };

  const handleModeChange = (mode: 'offering' | 'custom') => {
    setSlotMode(mode);
    setClashState(null);
    if (mode === 'offering') {
      setCustomTitle('');
    } else {
      setOfferingId('');
      if (!customTitle) setCustomTitle('Break');
    }
  };

  const handlePresetPeriod = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
    setClashState(null);
  };

  // Multi-day toggle chip click
  const toggleDay = (dayVal: number) => {
    setClashState(null);
    setError(null);
    if (isEditMode) {
      setDayOfWeek(dayVal);
    } else {
      setSelectedDays((prev) => {
        if (prev.includes(dayVal)) {
          return prev.filter((d) => d !== dayVal);
        } else {
          return [...prev, dayVal].sort((a, b) => a - b);
        }
      });
    }
  };

  // Quick select buttons
  const applyQuickSelect = (preset: 'mon-fri' | 'mon-sat' | 'every-day' | 'clear') => {
    setClashState(null);
    setError(null);
    if (preset === 'mon-fri') setSelectedDays([0, 1, 2, 3, 4]);
    else if (preset === 'mon-sat') setSelectedDays([0, 1, 2, 3, 4, 5]);
    else if (preset === 'every-day') setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    else if (preset === 'clear') setSelectedDays([]);
  };

  // Helper strings for summary
  const currentOfferingObj = offerings.find((o) => o.id === offeringId);
  const subjectSummaryText =
    slotMode === 'offering'
      ? currentOfferingObj?.subject_name || currentOfferingObj?.subject?.name || 'Class'
      : customTitle.trim() || 'Custom Label';

  const teacherSummaryText =
    slotMode === 'offering'
      ? currentOfferingObj?.teacher?.full_name || ''
      : '';

  const classObj = taxonomy?.classes?.find((c: any) => c.id === selectedClassId);
  const classSummaryText = classObj
    ? `${getBoardDef(classObj.board_id)?.shortName || 'Board'} ${formatGradeDisplay(classObj.grade, classObj.board_id)}`
    : '';

  const streamObj = taxonomy?.streams?.find((s: any) => s.id === selectedStreamId);
  const streamSummaryText = streamObj ? `${streamObj.name} Stream` : '';

  const timeSummaryText = `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`;

  // Days display summary
  const daysSummaryText = useMemo(() => {
    if (isEditMode) {
      return DAYS.find((d) => d.value === dayOfWeek)?.label || 'Selected Day';
    }
    if (selectedDays.length === 0) return 'No days selected';
    if (selectedDays.length === 7) return 'Every day (Mon–Sun)';
    if (selectedDays.length === 5 && [0, 1, 2, 3, 4].every((d) => selectedDays.includes(d))) return 'Mon–Fri';
    if (selectedDays.length === 6 && [0, 1, 2, 3, 4, 5].every((d) => selectedDays.includes(d))) return 'Mon–Sat';
    return selectedDays.map((d) => DAYS.find((item) => item.value === d)?.short || `D${d}`).join(', ');
  }, [isEditMode, dayOfWeek, selectedDays]);

  // Clash Checker
  const checkClashes = useCallback(
    (targetDays: number[]): ClashItem[] => {
      const timeToMins = (t: string) => {
        if (!t) return 0;
        const [h = 0, m = 0] = t.split(':').map(Number);
        return h * 60 + m;
      };

      const formStart = timeToMins(startTime);
      const formEnd = timeToMins(endTime);
      const formClassId = selectedClassId;
      const formClass = taxonomy?.classes?.find((c: any) => c.id === formClassId);
      const formGrade = formClass?.grade;
      const formBoard = formClass?.board_id;
      const formStreamId = selectedStreamId && selectedStreamId !== 'all' ? selectedStreamId : null;
      const formTeacherId = currentOfferingObj?.teacher_id || (currentOfferingObj as any)?.teacher?.id;
      const formTeacherName = currentOfferingObj?.teacher?.full_name;
      const currentSlotId = (slot as any)?.id;

      const detectedClashes: ClashItem[] = [];

      for (const d of targetDays) {
        const dayName = DAYS.find((item) => item.value === d)?.label || `Day ${d}`;
        const timeRange = `${formatTime12h(startTime)}–${formatTime12h(endTime)}`;

        for (const s of existingSlots) {
          if (currentSlotId && s.id === currentSlotId) continue;
          if (s.is_cancelled) continue;
          if (s.day_of_week !== d) continue;

          const sStart = timeToMins(s.start_time);
          const sEnd = timeToMins(s.end_time || s.start_time);
          const isOverlap = Math.max(sStart, formStart) < Math.min(sEnd, formEnd);
          if (!isOverlap) continue;

          const sOffering = offerings.find((o) => o.id === s.offering_id) || (s as any).offering;
          const sSubject =
            s.custom_title ||
            sOffering?.subject_name ||
            sOffering?.subject?.name ||
            (typeof sOffering?.subject === 'string' ? sOffering.subject : '') ||
            'Class';
          const sTeacherId = sOffering?.teacher_id || (sOffering as any)?.teacher?.id;
          const sTeacherName = sOffering?.teacher?.full_name || 'Instructor';
          const sClassId = s.class_id || sOffering?.class_id || (sOffering as any)?.class?.id;
          const sClass = taxonomy?.classes?.find((c: any) => c.id === sClassId);
          const sGrade = sClass?.grade || sOffering?.grade || (sOffering as any)?.class?.grade;
          const sBoard = sClass?.board_id || sOffering?.board || (sOffering as any)?.class?.board_id;
          const sBoardDef = sBoard ? getBoardDef(sBoard) : null;
          const sClassName = sClass
            ? `${sBoardDef?.shortName || ''} ${formatGradeDisplay(sClass.grade, sClass.board_id)}`.trim()
            : sGrade
            ? `Grade ${sGrade}`
            : formGrade
            ? `Grade ${formGrade}`
            : '';
          const sStreamId = s.stream_id || sOffering?.stream_id || null;

          const isSameClass =
            (formClassId && sClassId && formClassId === sClassId) ||
            (formBoard && sBoard && formBoard === sBoard && String(formGrade) === String(sGrade));
          const isSameStream =
            !formStreamId ||
            !sStreamId ||
            formStreamId === 'all' ||
            sStreamId === 'all' ||
            formStreamId === sStreamId;
          const isSameTeacher = Boolean(formTeacherId && sTeacherId && formTeacherId === sTeacherId);

          if (isSameTeacher) {
            const instructorName = formTeacherName || sTeacherName;
            detectedClashes.push({
              day: d,
              dayName,
              timeRange,
              instructorName,
              clashingSubject: sSubject,
              clashingClassName: sClassName,
              summary: `${dayName} ${timeRange} already has a class.`,
              detail: `Instructor ${instructorName} is already teaching ${sSubject}${sClassName ? ` (${sClassName})` : ''}.`,
            });
            break;
          } else if (isSameClass && isSameStream) {
            const instructorName = sTeacherName;
            detectedClashes.push({
              day: d,
              dayName,
              timeRange,
              instructorName,
              clashingSubject: sSubject,
              clashingClassName: sClassName,
              summary: `${dayName} ${timeRange} already has a class.`,
              detail: `Instructor ${instructorName} is already teaching ${sSubject}${sClassName ? ` (${sClassName})` : ''}.`,
            });
            break;
          }
        }
      }

      return detectedClashes;
    },
    [
      startTime,
      endTime,
      selectedClassId,
      taxonomy,
      selectedStreamId,
      currentOfferingObj,
      slot,
      existingSlots,
      offerings,
    ]
  );

  // Live non-blocking clash preview inside the drawer
  const liveClashes = useMemo(() => {
    const targetDays = isEditMode ? [dayOfWeek] : selectedDays;
    if (!selectedClassId || targetDays.length === 0 || !startTime || !endTime || startTime >= endTime) {
      return [];
    }
    if (slotMode === 'offering' && !offeringId) return [];
    if (slotMode === 'custom' && !customTitle.trim()) return [];
    return checkClashes(targetDays);
  }, [
    isEditMode,
    dayOfWeek,
    selectedDays,
    selectedClassId,
    startTime,
    endTime,
    slotMode,
    offeringId,
    customTitle,
    checkClashes,
  ]);

  // Commit save to backend
  const commitSave = async (daysToCommit: number[], allowClash: boolean = false) => {
    if (daysToCommit.length === 0) {
      setError('No days selected to schedule.');
      return;
    }

    const fullStartTime = startTime.length === 5 ? `${startTime}:00` : startTime;
    const fullEndTime = endTime.length === 5 ? `${endTime}:00` : endTime;

    setIsSaving(true);
    setError(null);

    try {
      if (isEditMode) {
        await onSave({
          offering_id: slotMode === 'offering' ? offeringId : null,
          custom_title: slotMode === 'custom' ? customTitle.trim() : null,
          class_id: selectedClassId || null,
          stream_id: selectedStreamId && selectedStreamId !== 'all' ? selectedStreamId : null,
          day_of_week: daysToCommit[0],
          start_time: fullStartTime,
          end_time: fullEndTime,
          room_or_link: roomOrLink.trim() || null,
          is_cancelled: isCancelled,
          publish_to_news: notifyAffected,
          notify_affected: notifyAffected,
          allowClash,
        });
      } else {
        await onSave({
          offering_id: slotMode === 'offering' ? offeringId : null,
          custom_title: slotMode === 'custom' ? customTitle.trim() : null,
          class_id: selectedClassId || null,
          stream_id: selectedStreamId && selectedStreamId !== 'all' ? selectedStreamId : null,
          day_of_week: daysToCommit[0],
          start_time: fullStartTime,
          end_time: fullEndTime,
          room_or_link: roomOrLink.trim() || null,
          is_cancelled: false,
          publish_to_news: notifyAffected,
          notify_affected: notifyAffected,
          days_of_week: daysToCommit,
          allowClash,
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to save class slot.');
    } finally {
      setIsSaving(false);
    }
  };

  // Form submit — never blocked by clashes; opens confirmation dialog if clashes exist
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedClassId) {
      setError('Please select a Class / Cohort Grade first.');
      return;
    }
    if (slotMode === 'offering' && !offeringId) {
      setError('Please select a subject offering from the list.');
      return;
    }
    if (slotMode === 'custom' && !customTitle.trim()) {
      setError('Please enter a custom display label (e.g. Break).');
      return;
    }
    if (!startTime || !endTime) {
      setError('Please fill in both start and end times.');
      return;
    }
    if (startTime >= endTime) {
      setError('Start time must be before end time.');
      return;
    }

    const targetDays = isEditMode ? [dayOfWeek] : selectedDays;
    if (targetDays.length === 0) {
      setError('Please select at least one day of the week.');
      return;
    }

    // Clash detection check: open confirmation dialog if clashes exist
    const clashes = checkClashes(targetDays);
    if (clashes.length > 0) {
      const clean = targetDays.filter((d) => !clashes.some((c) => c.day === d));
      setClashState({ clashes, cleanDays: clean, allDays: targetDays });
      return;
    }

    // No clashes: proceed immediately with no dialog
    await commitSave(targetDays, false);
  };

  // Confirm "Add anyway" (saves all selected slots including clashing ones)
  const handleConfirmAddAnyway = async () => {
    if (!clashState) return;
    const allDaysToSave = clashState.allDays;
    setClashState(null);
    await commitSave(allDaysToSave, true);
  };

  // Confirm "Add only non-clashing days" (when only some selected days clash)
  const handleSkipClashesAndSave = async () => {
    if (!clashState || clashState.cleanDays.length === 0) return;
    const clean = clashState.cleanDays;
    setClashState(null);
    await commitSave(clean, false);
  };

  const displayedClashes = clashState?.clashes || liveClashes;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error banner */}
      {error && (
        <div className="p-3.5 text-xs font-bold text-red-700 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Non-Blocking Clash Detection Warning Banner */}
      {displayedClashes.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
              <AlertTriangle size={17} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                Schedule Clashes Detected ({displayedClashes.length})
              </h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                The following {displayedClashes.length === 1 ? 'day already has' : 'days already have'} an overlapping class scheduled:
              </p>
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {displayedClashes.map((c, i) => (
              <div
                key={i}
                className="p-2.5 bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-slate-800 dark:text-slate-200"
              >
                <div className="font-extrabold text-amber-950 dark:text-amber-200">
                  ⚠️ {c.summary}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                  {c.detail}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/60">
            <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 self-center">
              Clashes found. You&apos;ll be asked to confirm when saving.
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog when Saving with Clashes */}
      {clashState &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clash-confirm-dialog-title"
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSaving) {
                setClashState(null);
              }
            }}
          >
            <div
              className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90dvh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Dialog Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-neutral-800 bg-amber-50/70 dark:bg-amber-950/30 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle size={18} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <h3
                      id="clash-confirm-dialog-title"
                      className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug"
                    >
                      Schedule clash detected
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                      {clashState.clashes.length === 1
                        ? '1 selected slot overlaps with an existing scheduled class.'
                        : `${clashState.clashes.length} selected slots overlap with existing scheduled classes.`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setClashState(null)}
                  disabled={isSaving}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Dialog Body: List of clashing slots */}
              <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto flex-1">
                {clashState.clashes.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-amber-50/60 dark:bg-neutral-800/70 border border-amber-200 dark:border-amber-800/70 rounded-xl space-y-1.5 text-xs"
                  >
                    <div className="font-extrabold text-amber-950 dark:text-amber-200">
                      {c.summary} {c.detail}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>{c.dayName}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>{c.timeRange}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <User size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>{c.instructorName}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BookOpen size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>
                          {c.clashingSubject}
                          {c.clashingClassName ? ` (${c.clashingClassName})` : ''}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dialog Footer Actions */}
              <div className="p-4 sm:p-5 bg-slate-50 dark:bg-neutral-900 border-t border-slate-200 dark:border-neutral-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setClashState(null)}
                  disabled={isSaving}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>

                {clashState.cleanDays.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSkipClashesAndSave}
                    disabled={isSaving}
                    className="px-4 py-2.5 text-xs font-bold rounded-xl border border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                  >
                    {isSaving && <Loader2 size={13} className="animate-spin shrink-0" />}
                    <span>Add only non-clashing days</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleConfirmAddAnyway}
                  disabled={isSaving}
                  className="px-5 py-2.5 text-xs font-extrabold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                >
                  {isSaving && <Loader2 size={14} className="animate-spin shrink-0" />}
                  <span>Add anyway</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── STEP 1: Class and Stream ── */}
      <div className="p-4 bg-slate-50/80 dark:bg-neutral-800/40 border border-slate-200/80 dark:border-neutral-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Layers size={13} className="text-[#F4C430]" />
            <span>1. Class and Stream</span>
          </div>
        </div>

        <div className={`grid gap-3.5 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Class / Cohort Grade <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="input py-2.5 text-sm w-full bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-[#F4C430]"
            >
              <option value="">-- Select Class --</option>
              {taxonomy?.classes?.map((c: any) => {
                const boardDef = getBoardDef(c.board_id);
                const boardLabel = boardDef?.shortName || boardDef?.name || 'Board';
                return (
                  <option key={c.id} value={c.id}>
                    {boardLabel} — {formatGradeDisplay(c.grade, c.board_id)}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Stream (Optional)
            </label>
            <select
              value={selectedStreamId}
              onChange={(e) => handleStreamChange(e.target.value)}
              disabled={!selectedClassId}
              className="input py-2.5 text-sm w-full bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-slate-100 rounded-xl font-medium disabled:opacity-50 focus:ring-2 focus:ring-[#F4C430]"
            >
              <option value="">All Streams / Common</option>
              {taxonomy?.streams
                ?.filter((s: any) => s.class_id === selectedClassId)
                .map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} Stream
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── STEP 2: Subject and Teacher ── */}
      <div className="p-4 bg-slate-50/80 dark:bg-neutral-800/40 border border-slate-200/80 dark:border-neutral-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <BookOpen size={13} className="text-[#F4C430]" />
            <span>2. Subject and Teacher</span>
          </div>

          <div className="flex bg-slate-200/70 dark:bg-neutral-700/60 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleModeChange('offering')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                slotMode === 'offering'
                  ? 'bg-white dark:bg-neutral-800 text-slate-950 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Set Class / Offering
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('custom')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                slotMode === 'custom'
                  ? 'bg-white dark:bg-neutral-800 text-slate-950 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Custom Label / Preset
            </button>
          </div>
        </div>

        {slotMode === 'offering' ? (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Subject & Offering <span className="text-red-500">*</span>
            </label>
            <select
              value={offeringId}
              onChange={(e) => {
                setOfferingId(e.target.value);
                setClashState(null);
              }}
              disabled={!selectedClassId}
              className="input py-2.5 text-sm w-full bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-slate-100 rounded-xl font-medium disabled:opacity-50 focus:ring-2 focus:ring-[#F4C430]"
            >
              <option value="">-- Choose Subject Offering --</option>
              {selectableOfferings.map((offering) => (
                <option key={offering.id} value={offering.id}>
                  {offering.subject_name || offering.subject?.name} — {offering.teacher?.full_name || 'Assigned Teacher'}
                  {offering.stream ? ` (${typeof offering.stream === 'string' ? offering.stream : offering.stream.name})` : ''}
                </option>
              ))}
            </select>
            {!selectedClassId && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Please select a Class above to see active subject offerings.
              </p>
            )}
            {selectedClassId && selectableOfferings.length === 0 && (
              <p className="text-[11px] text-red-500 font-medium">
                No active subjects found for this Class / Stream combination.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2.5 p-3.5 border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Custom Display Label <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Break"
                value={customTitle}
                onChange={(e) => {
                  setCustomTitle(e.target.value);
                  setClashState(null);
                }}
                className="input py-2 text-sm w-full bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-[#F4C430]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                Quick Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {['Break'].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setCustomTitle(label);
                      setClashState(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      customTitle === label
                        ? 'bg-[#F4C430] border-[#F4C430] text-[#111111] shadow-xs'
                        : 'bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── STEP 3: Days and Time ── */}
      <div className="p-4 bg-slate-50/80 dark:bg-neutral-800/40 border border-slate-200/80 dark:border-neutral-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Calendar size={13} className="text-[#F4C430]" />
            <span>3. Days and Time</span>
          </div>
          {isEditMode ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-slate-300">
              Editing Single Slot
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700">
              Multi-Day Batch
            </span>
          )}
        </div>

        {/* Days Selection Section */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                {isEditMode ? 'Day of the Week' : 'Select Class Days'} <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isEditMode
                  ? 'Pick the day for this scheduled session'
                  : 'Toggle days to schedule this class at the same time every day'}
              </p>
            </div>

            {/* Quick-select buttons for multi-day mode */}
            {!isEditMode && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => applyQuickSelect('mon-fri')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-slate-200 hover:border-[#F4C430] hover:text-[#111111] transition-all shadow-2xs cursor-pointer"
                >
                  Mon-Fri
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickSelect('mon-sat')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-slate-200 hover:border-[#F4C430] hover:text-[#111111] transition-all shadow-2xs cursor-pointer"
                >
                  Mon-Sat
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickSelect('every-day')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-slate-200 hover:border-[#F4C430] hover:text-[#111111] transition-all shadow-2xs cursor-pointer"
                >
                  Every day
                </button>
                {selectedDays.length > 0 && (
                  <button
                    type="button"
                    onClick={() => applyQuickSelect('clear')}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Day Toggle Chips Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
            {DAYS.map((d) => {
              const isSelected = isEditMode
                ? dayOfWeek === d.value
                : selectedDays.includes(d.value);

              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={`min-h-[44px] px-3 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs select-none cursor-pointer ${
                    isSelected
                      ? 'bg-[#F4C430] border-[#F4C430] text-[#111111] font-extrabold shadow-xs'
                      : 'bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-neutral-600 font-semibold'
                  }`}
                  aria-pressed={isSelected}
                >
                  {isSelected && <Check size={14} className="stroke-[3] shrink-0" />}
                  <span className="truncate">{d.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timetable Period Presets */}
        <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              ⚡ Timetable Period Presets
            </label>
            <span className="text-[10px] text-slate-500 font-medium">Click to populate</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PERIOD_PRESETS.map((p, idx) => {
              const isSelected = startTime === p.start && endTime === p.end;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetPeriod(p.start, p.end)}
                  className={`min-h-[40px] px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all text-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#F4C430] text-[#111111] border-[#F4C430] font-black shadow-xs ring-2 ring-[#F4C430]/30'
                      : 'bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-700'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Start and End Times */}
        <div className="grid grid-cols-2 gap-3.5 pt-1">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Start Time <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setClashState(null);
                }}
                className="input py-2.5 text-sm w-full bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-[#F4C430]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              End Time <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setClashState(null);
                }}
                className="input py-2.5 text-sm w-full bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-[#F4C430]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── STEP 4: Meeting Link and Notify ── */}
      <div className="p-4 bg-slate-50/80 dark:bg-neutral-800/40 border border-slate-200/80 dark:border-neutral-800 rounded-2xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Video size={13} className="text-[#F4C430]" />
            <span>4. Meeting Link and Notify</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Meeting / Room Link (Default)
            </label>
            <span className="text-[10px] text-slate-500 font-semibold">Optional</span>
          </div>
          <input
            type="text"
            placeholder="https://meet.google.com/... or https://zoom.us/j/..."
            value={roomOrLink}
            onChange={(e) => setRoomOrLink(e.target.value)}
            className="input py-2.5 text-sm w-full bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-[#F4C430]"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Default recurring meeting link for this timetable slot. You can override it per-session from the schedule view.
          </p>
        </div>

        {/* Edit mode: Session Status toggle */}
        {isEditMode && (
          <div className="pt-2 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Session Status</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                {isCancelled ? 'Marked as Cancelled on timetable' : 'Active and scheduled'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCancelled(!isCancelled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                isCancelled
                  ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              }`}
            >
              {isCancelled ? 'Cancelled (Click to Activate)' : 'Active (Click to Cancel)'}
            </button>
          </div>
        )}

        {/* Notify affected students */}
        <div className="flex items-center gap-2.5 pt-1">
          <input
            type="checkbox"
            id="notifyAffected"
            checked={notifyAffected}
            onChange={(e) => setNotifyAffected(e.target.checked)}
            className="w-4.5 h-4.5 text-[#F4C430] border-gray-300 rounded focus:ring-[#F4C430] cursor-pointer"
          />
          <label
            htmlFor="notifyAffected"
            className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none"
          >
            Notify affected students of this change
          </label>
        </div>
      </div>

      {/* ── LIVE SUMMARY CARD ── */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 dark:bg-amber-400/10 dark:border-amber-400/25 space-y-1">
        <div className="flex items-center justify-between text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wide">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-[#F4C430]" />
            <span>Schedule Summary</span>
          </div>
          {!isEditMode && selectedDays.length > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#F4C430] text-[#111111]">
              {selectedDays.length} {selectedDays.length === 1 ? 'Day' : 'Days'}
            </span>
          )}
        </div>

        <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-snug">
          {daysSummaryText} &bull; {timeSummaryText} &bull; {subjectSummaryText}
          {teacherSummaryText ? ` — ${teacherSummaryText}` : ''}
        </p>

        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
          {classSummaryText || 'Select a Class'}
          {streamSummaryText ? ` • ${streamSummaryText}` : ''}
          {' &bull; '}
          {isEditMode
            ? 'Updating 1 class slot'
            : selectedDays.length === 0
            ? 'Select days above to create slots'
            : `${selectedDays.length} class ${selectedDays.length === 1 ? 'slot' : 'slots'} will be added at once`}
        </p>
      </div>

      {/* ── STICKY FOOTER ── */}
      <div className="sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-slate-200 dark:border-neutral-800 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] z-20 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors text-xs sm:text-sm order-2 sm:order-1 cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSaving || (!isEditMode && selectedDays.length === 0)}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#F4C430] hover:bg-[#e0b328] disabled:opacity-50 text-slate-950 font-extrabold shadow-sm flex items-center justify-center gap-2 transition-all text-xs sm:text-sm order-1 sm:order-2 cursor-pointer"
        >
          {isSaving && <Loader2 size={16} className="animate-spin shrink-0" />}
          {isEditMode
            ? 'Save Changes'
            : selectedDays.length === 0
            ? 'Add Class Slot'
            : `Add ${selectedDays.length} Class Slot${selectedDays.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </form>
  );
};

export default SlotForm;
