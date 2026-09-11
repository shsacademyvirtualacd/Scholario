import React, { useState, useEffect } from 'react';
import { Loader2, Copy, Check, Lock } from 'lucide-react';
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
    is_cancelled?: boolean;
    publish_to_news: boolean;
    notify_affected?: boolean;
    days_of_week?: number[];
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

export const SlotForm: React.FC<SlotFormProps> = ({
  slot,
  offerings,
  taxonomy,
  existingSlots: _existingSlots = [],
  defaultClassId = '',
  defaultStreamId = '',
  isDuplicateMode: isDuplicateModeProp = false,
  onSave,
  onDuplicate,
  onCancelDuplicate,
  onCancel,
}) => {
  const isMobile = useMobile();
  const [isDuplicate, setIsDuplicate] = useState(isDuplicateModeProp);
  const [slotMode, setSlotMode] = useState<'offering' | 'custom'>('offering');
  const [offeringId, setOfferingId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStreamId, setSelectedStreamId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('16:30');
  const [isCancelled, setIsCancelled] = useState(false);
  const [notifyAffected, setNotifyAffected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize internal duplicate state with prop
  useEffect(() => {
    setIsDuplicate(isDuplicateModeProp);
  }, [isDuplicateModeProp]);

  useEffect(() => {
    // Preserve data if slot has ID OR if in duplicate mode OR has an offering/custom title
    const hasSlotData = Boolean(
      slot && (slot.id || isDuplicateModeProp || isDuplicate || slot.offering_id || slot.custom_title)
    );

    if (hasSlotData && slot) {
      setIsCancelled(!!slot.is_cancelled);
      if (slot.offering_id) {
        setSlotMode('offering');
        setOfferingId(slot.offering_id);
        const off = offerings.find(o => o.id === slot.offering_id);
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
      setDayOfWeek(slot.day_of_week ?? 0);
      setStartTime(slot.start_time ? slot.start_time.slice(0, 5) : '16:00');
      setEndTime(slot.end_time ? slot.end_time.slice(0, 5) : '16:30');
    } else {
      // Defaults for a brand new slot
      setIsCancelled(false);
      setSelectedClassId(defaultClassId || '');
      setSelectedStreamId('');
      setSlotMode('offering');
      setOfferingId('');
      setCustomTitle('Break');
      setDayOfWeek(slot && slot.day_of_week !== undefined ? slot.day_of_week : 0);
      setStartTime(slot && slot.start_time ? slot.start_time.slice(0, 5) : '16:00');
      setEndTime(slot && slot.end_time ? slot.end_time.slice(0, 5) : '16:30');
    }
    setNotifyAffected(false);
    setError(null);
  }, [slot, offerings, defaultClassId, defaultStreamId, isDuplicateModeProp]);

  // When admin picks an offering in normal mode, auto-fill the stream from that offering's stream_id
  useEffect(() => {
    if (isDuplicate || slotMode !== 'offering' || !offeringId) return;
    const offering = offerings.find(o => o.id === offeringId);
    if (offering?.stream_id) {
      setSelectedStreamId(offering.stream_id);
    }
  }, [offeringId, isDuplicate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter offerings based on chosen class and stream.
  const selectedClassObj = taxonomy?.classes?.find((c: any) => c.id === selectedClassId);
  const isExcludedIslamiatBoard = ['sindh', 'olevel', 'alevel'].includes(selectedClassObj?.board_id);

  const filteredOfferings = offerings.filter(o => {
    if (selectedClassId && o.class_id !== selectedClassId && (o as any)?.class?.id !== selectedClassId) {
      return false;
    }
    if (selectedStreamId && selectedStreamId !== 'all' && selectedStreamId !== '') {
      const offStreamId = o.stream_id || (o as any)?.stream?.id;
      if (offStreamId && offStreamId !== selectedStreamId) return false;
    }
    // Hard constraint (Rule 3): Islamiat / Tarjuma-tul-Quran are only valid subjects for national/provincial curricula (FBISE, KPK).
    // They must not appear as selectable subject options when Sindh Board or Cambridge O/A Levels are selected.
    const subName = (o.subject_name || o.subject?.name || '').toLowerCase().trim();
    const isReligious = subName.includes('islamiat') || subName.includes('islamiyat') || subName.includes('tarjuma') || subName.includes('quran');
    if (isExcludedIslamiatBoard && isReligious) {
      return false;
    }
    return true;
  });

  const currentSelectedOffering = offerings.find(o => o.id === offeringId);
  const curSubLower = (currentSelectedOffering?.subject_name || currentSelectedOffering?.subject?.name || '').toLowerCase();
  const isCurrentIslamiatExcluded = isExcludedIslamiatBoard && (
    curSubLower.includes('islamiat') ||
    curSubLower.includes('islamiyat') ||
    curSubLower.includes('tarjuma') ||
    curSubLower.includes('quran')
  );
  const selectableOfferings = [...filteredOfferings];
  if (currentSelectedOffering && !isCurrentIslamiatExcluded && !selectableOfferings.some(o => o.id === currentSelectedOffering.id)) {
    selectableOfferings.unshift(currentSelectedOffering);
  }

  const handleClassChange = (val: string) => {
    if (isDuplicate) return;
    setSelectedClassId(val);
    setSelectedStreamId('');
    const cls = taxonomy?.classes?.find((c: any) => c.id === val);
    if (['sindh', 'olevel', 'alevel'].includes(cls?.board_id)) {
      const curSub = offerings.find(o => o.id === offeringId);
      const subName = (curSub?.subject_name || curSub?.subject?.name || '').toLowerCase();
      if (subName.includes('islamiat') || subName.includes('islamiyat') || subName.includes('tarjuma') || subName.includes('quran')) {
        setOfferingId('');
      }
    }
  };

  const handleStreamChange = (val: string) => {
    if (isDuplicate) return;
    setSelectedStreamId(val);
    setOfferingId('');
  };

  const handleModeChange = (mode: 'offering' | 'custom') => {
    if (isDuplicate) return;
    setSlotMode(mode);
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
  };

  const handleEnterDuplicate = () => {
    setIsDuplicate(true);
    setSelectedDays([]);
    onDuplicate?.();
  };

  const handleExitDuplicate = () => {
    setIsDuplicate(false);
    setSelectedDays([]);
    onCancelDuplicate?.();
  };

  const toggleDay = (dayVal: number) => {
    setSelectedDays(prev =>
      prev.includes(dayVal)
        ? prev.filter(d => d !== dayVal)
        : [...prev, dayVal].sort((a, b) => a - b)
    );
  };

  const applyDaysPreset = (preset: 'mwf' | 'tts' | 'weekdays' | 'all' | 'clear') => {
    if (preset === 'mwf') setSelectedDays([0, 2, 4]);
    else if (preset === 'tts') setSelectedDays([1, 3, 5]);
    else if (preset === 'weekdays') setSelectedDays([0, 1, 2, 3, 4]);
    else if (preset === 'all') setSelectedDays([0, 1, 2, 3, 4, 5]);
    else if (preset === 'clear') setSelectedDays([]);
  };

  // Helper strings for confirmation summary
  const currentOfferingObj = offerings.find(o => o.id === offeringId);
  const subjectSummaryText = slotMode === 'offering'
    ? (currentOfferingObj?.subject_name || currentOfferingObj?.subject?.name || 'Selected Subject')
    : (customTitle.trim() || 'Custom Label');

  const teacherSummaryText = slotMode === 'offering'
    ? (currentOfferingObj?.teacher?.full_name || '')
    : '';

  const classObj = taxonomy?.classes?.find((c: any) => c.id === selectedClassId);
  const classSummaryText = classObj
    ? `${getBoardDef(classObj.board_id)?.shortName || 'Board'} ${formatGradeDisplay(classObj.grade, classObj.board_id)}`
    : '';
  const streamObj = taxonomy?.streams?.find((s: any) => s.id === selectedStreamId);
  const streamSummaryText = streamObj ? `${streamObj.name} Stream` : '';
  const timeSummaryText = `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`;

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

    if (isDuplicate && selectedDays.length === 0) {
      setError('Please select at least one day of the week to duplicate this slot to.');
      return;
    }

    // --- HARD CONSTRAINTS VALIDATION ---
    const targetOffering = offerings.find(o => o.id === offeringId);
    const subjectName = (slotMode === 'offering'
      ? (targetOffering?.subject_name || targetOffering?.subject?.name || '')
      : customTitle
    ).toLowerCase().trim();

    const targetClass = taxonomy?.classes?.find((c: any) => c.id === selectedClassId) || (targetOffering as any)?.class;
    const boardId = targetClass?.board_id || '';
    const grade = String(targetClass?.grade || '');

    const timeToMins = (t: string) => {
      if (!t) return 0;
      const [h = 0, m = 0] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const slotStart = timeToMins(startTime);
    const slotEnd = timeToMins(endTime);

    // Period 1 window: 17:00 (5:00 PM) – 17:30 (5:30 PM) -> [1020, 1050 mins]
    const overlapsP1 = Math.max(slotStart, 1020) < Math.min(slotEnd, 1050);
    // Period 2 window: 17:30 (5:30 PM) – 18:00 (6:00 PM) -> [1050, 1080 mins]
    const overlapsP2 = Math.max(slotStart, 1050) < Math.min(slotEnd, 1080);

    // Rule 1: Physics, English, and Mathematics must NEVER be assigned to Period 1 (5:00–5:30 PM)
    const isPhysicsEngMath =
      subjectName.includes('physics') ||
      subjectName.includes('english') ||
      subjectName.includes('mathematics') ||
      subjectName.includes('math');

    if (isPhysicsEngMath && overlapsP1) {
      setError('Rule 1 Violation: Physics, English, and Mathematics must NEVER be assigned to Period 1 (5:00–5:30 PM). Please assign to Period 2, 3, or 4.');
      return;
    }

    // Rule 2: Urdu must NEVER be assigned to Period 1 or Period 2 (5:00–6:00 PM) — only Period 3 or Period 4
    const isUrdu = subjectName.includes('urdu');
    if (isUrdu && (overlapsP1 || overlapsP2)) {
      setError('Rule 2 Violation: Urdu must NEVER be assigned to Period 1 or Period 2 (5:00–6:00 PM). Urdu may only be scheduled in Period 3 (6:00–6:30 PM) or Period 4 (6:30–7:00 PM).');
      return;
    }

    // Rule 3: Islamiat / Tarjuma-tul-Quran are only valid subjects for national/provincial curricula (FBISE and KPK) — must not appear or be saved for Sindh Board or Cambridge O/A levels
    const isReligiousSubject = subjectName.includes('islamiat') || subjectName.includes('islamiyat') || subjectName.includes('tarjuma') || subjectName.includes('quran');
    if (isReligiousSubject && (boardId === 'sindh' || boardId === 'olevel' || boardId === 'alevel')) {
      const displaySub = (subjectName.includes('tarjuma') || subjectName.includes('quran')) ? 'Tarjuma-tul-Quran' : 'Islamiyat';
      setError(`Rule 3 Violation: ${displaySub} is not part of the standard curriculum for ${getBoardDef(boardId)?.name || 'this board'}.`);
      return;
    }

    // Rule 4: Islamiat and Tarjuma-tul-Quran must default to Period 0 (4:30 PM) or Period 3/4 — cannot be in Period 1, except FBISE Grade 11 on Wed/Thu
    if (isReligiousSubject && overlapsP1) {
      const isFbiseGrade11 = boardId === 'fbise' && grade === '11';
      const daysToCheck = isDuplicate ? selectedDays : [dayOfWeek];
      const hasInvalidP1Day = daysToCheck.some(d => !(isFbiseGrade11 && (d === 2 || d === 3))); // 2=Wed, 3=Thu

      if (hasInvalidP1Day) {
        setError('Rule 4 Violation: Islamiat and Tarjuma-tul-Quran cannot be placed in Period 1 (5:00–5:30 PM). They must be scheduled in Period 0 (4:30–5:00 PM) or Period 3/4. (Exception: Period 1 is only permitted for FBISE Grade 11 on Wednesday and Thursday).');
        return;
      }
    }

    // Note: Cohort collision and instructor double-booking checks are handled non-blockingly
    // by the ScheduleConflictModal via onSave -> checkSlotConflict.
    const fullStartTime = startTime.length === 5 ? `${startTime}:00` : startTime;
    const fullEndTime = endTime.length === 5 ? `${endTime}:00` : endTime;

    setIsSaving(true);
    try {
      if (isDuplicate) {
        await onSave({
          offering_id: slotMode === 'offering' ? offeringId : null,
          custom_title: slotMode === 'custom' ? customTitle.trim() : null,
          class_id: selectedClassId || null,
          stream_id: selectedStreamId && selectedStreamId !== 'all' ? selectedStreamId : null,
          day_of_week: selectedDays[0],
          start_time: fullStartTime,
          end_time: fullEndTime,
          is_cancelled: false,
          publish_to_news: notifyAffected,
          notify_affected: notifyAffected,
          days_of_week: selectedDays,
        });
      } else {
        await onSave({
          offering_id: slotMode === 'offering' ? offeringId : null,
          custom_title: slotMode === 'custom' ? customTitle.trim() : null,
          class_id: selectedClassId || null,
          stream_id: selectedStreamId && selectedStreamId !== 'all' ? selectedStreamId : null,
          day_of_week: dayOfWeek,
          start_time: fullStartTime,
          end_time: fullEndTime,
          is_cancelled: isCancelled,
          publish_to_news: notifyAffected,
          notify_affected: notifyAffected,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save class slot.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3.5 text-xs font-bold text-red-700 bg-red-50/90 border border-red-200 rounded-xl flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Duplicate Mode Banner */}
      {isDuplicate && (
        <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Copy size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-950 uppercase tracking-wide">Duplicate Mode</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-200/80 text-amber-900">
                  Multi-Day
                </span>
              </div>
              <p className="text-[11px] text-amber-800 font-medium truncate">
                Duplicating <strong className="text-amber-950">{subjectSummaryText}</strong> to other days
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExitDuplicate}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-900 hover:bg-amber-200/60 transition-colors border border-amber-300/80 shrink-0 cursor-pointer"
          >
            Exit Duplicate
          </button>
        </div>
      )}

      {/* Step 1: Class & Stream Context */}
      <div className="p-4 bg-gray-50/80 border border-gray-200/80 rounded-2xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
            <span>1. Target Class & Stream</span>
          </div>
          {isDuplicate && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200/80">
              <Lock size={10} /> Locked to Source Slot
            </span>
          )}
        </div>
        <div className={`grid gap-3.5 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#262626] block">Class / Cohort Grade</label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              disabled={isDuplicate}
              className={`input py-2.5 text-sm w-full border-[#E5E5E5] rounded-xl font-medium ${
                isDuplicate ? 'bg-gray-100/90 text-gray-700 cursor-not-allowed border-gray-200' : 'bg-white text-gray-800'
              }`}
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
            <label className="text-xs font-bold text-[#262626] block">Stream (Optional)</label>
            <select
              value={selectedStreamId}
              onChange={(e) => handleStreamChange(e.target.value)}
              className={`input py-2.5 text-sm w-full border-[#E5E5E5] rounded-xl font-medium ${
                isDuplicate ? 'bg-gray-100/90 text-gray-700 cursor-not-allowed border-gray-200' : 'bg-white text-gray-800'
              }`}
              disabled={isDuplicate || !selectedClassId}
            >
              <option value="">All Streams / Common</option>
              {taxonomy?.streams?.filter((s: any) => s.class_id === selectedClassId).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} Stream
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Step 2: Slot Type Toggle & Offering/Custom Selector */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
            2. Choose Assignment Type
          </span>
          {isDuplicate ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200/80">
              <Lock size={10} /> Retained from Source
            </span>
          ) : (
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleModeChange('offering')}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                  slotMode === 'offering'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Set Class / Offering
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('custom')}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                  slotMode === 'custom'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Custom Label / Preset
              </button>
            </div>
          )}
        </div>

        {slotMode === 'offering' ? (
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#262626] block">Subject & Offering</label>
            <select
              value={offeringId}
              onChange={(e) => setOfferingId(e.target.value)}
              className={`input py-2.5 text-sm w-full border-[#E5E5E5] rounded-xl font-medium ${
                isDuplicate ? 'bg-gray-100/90 text-gray-700 cursor-not-allowed border-gray-200' : 'bg-white text-gray-800'
              }`}
              disabled={isDuplicate || !selectedClassId}
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
              <p className="text-[11px] text-amber-600 font-medium">Please select a Target Class above to see its available subjects.</p>
            )}
            {selectedClassId && selectableOfferings.length === 0 && (
              <p className="text-[11px] text-red-500 font-medium">No active subjects found for this Class / Stream combination.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2.5 p-3.5 border border-amber-200/80 bg-amber-50/40 rounded-xl">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#262626] block">Custom Display Label</label>
              <input
                type="text"
                placeholder="e.g. Break"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                disabled={isDuplicate}
                className={`input py-2 text-sm w-full border-[#E5E5E5] rounded-xl font-medium ${
                  isDuplicate ? 'bg-gray-100/90 text-gray-700 cursor-not-allowed border-gray-200' : 'bg-white'
                }`}
              />
            </div>
            {!isDuplicate && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider">Quick Presets</label>
                <div className="flex flex-wrap gap-2">
                  {['Break'].map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setCustomTitle(label)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        customTitle === label
                          ? 'bg-[#F4C430] border-[#F4C430] text-[#111111] shadow-sm'
                          : 'bg-white border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Schedule Day & FBISE Period Timings */}
      <div className="space-y-3.5 pt-1">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 block">
          3. Set Day & Period Timing
        </span>

        {!isDuplicate ? (
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#262626] block">Day of the Week</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="input py-2.5 text-sm w-full bg-white border-[#E5E5E5] rounded-xl font-medium"
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          /* Multi-day selection in Duplicate mode (Requirement 2) */
          <div className="space-y-2.5 p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-2xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="text-xs font-black text-amber-950 block">
                  Select Days of the Week (Multi-Select)
                </label>
                <span className="text-[11px] text-amber-800 block">
                  Pick all days you want this class to occur on:
                </span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => applyDaysPreset('mwf')}
                  className="px-2 py-1 rounded-md text-[10px] font-extrabold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors shadow-2xs cursor-pointer"
                  title="Select Monday, Wednesday, Friday"
                >
                  Mon, Wed, Fri
                </button>
                <button
                  type="button"
                  onClick={() => applyDaysPreset('tts')}
                  className="px-2 py-1 rounded-md text-[10px] font-extrabold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors shadow-2xs cursor-pointer"
                  title="Select Tuesday, Thursday, Saturday"
                >
                  Tue, Thu, Sat
                </button>
                <button
                  type="button"
                  onClick={() => applyDaysPreset('weekdays')}
                  className="px-2 py-1 rounded-md text-[10px] font-extrabold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors shadow-2xs cursor-pointer"
                  title="Select Monday through Friday"
                >
                  Mon–Fri
                </button>
                <button
                  type="button"
                  onClick={() => applyDaysPreset('all')}
                  className="px-2 py-1 rounded-md text-[10px] font-extrabold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors shadow-2xs cursor-pointer"
                  title="Select Monday through Saturday"
                >
                  Mon–Sat
                </button>
                {selectedDays.length > 0 && (
                  <button
                    type="button"
                    onClick={() => applyDaysPreset('clear')}
                    className="px-2 py-1 rounded-md text-[10px] font-bold bg-transparent hover:bg-amber-200/50 text-amber-800 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Days grid chips/checkboxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {DAYS.map((d) => {
                const isSelected = selectedDays.includes(d.value);
                const isOriginalDay = slot && (slot as any).day_of_week === d.value;

                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 border-amber-600 text-white shadow-sm font-black'
                        : 'bg-white border-amber-200/90 text-gray-800 hover:bg-amber-50/70 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-white border-white text-amber-600'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="text-xs truncate">{d.label}</span>
                    </div>
                    {isOriginalDay && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-tight shrink-0 ${
                          isSelected
                            ? 'bg-amber-600 text-amber-100'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                        title="Day of the original slot"
                      >
                        Source
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Period Presets */}
        <div className="space-y-1.5 p-3 bg-blue-50/50 border border-blue-100/80 rounded-xl">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-extrabold text-blue-900 block uppercase tracking-wider">
              ⚡ Timetable Period Presets (P0: 4:30 PM | P1–P4: 5:00 – 7:00 PM)
            </label>
            {isDuplicate && (
              <span className="text-[10px] font-bold text-blue-700">Editable for duplicates</span>
            )}
          </div>
          <div className={`grid gap-1.5 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {[
              { label: 'Period 0 (4:30 - 5:00 PM)', start: '16:30', end: '17:00' },
              { label: 'Period 1 (5:00 - 5:30 PM)', start: '17:00', end: '17:30' },
              { label: 'Period 2 (5:30 - 6:00 PM)', start: '17:30', end: '18:00' },
              { label: 'Period 3 (6:00 - 6:30 PM)', start: '18:00', end: '18:30' },
              { label: 'Period 4 (6:30 - 7:00 PM)', start: '18:30', end: '19:00' },
              { label: 'Legacy (4:00 - 4:30 PM)', start: '16:00', end: '16:30' },
            ].map((p, idx) => {
              const isSelected = startTime === p.start && endTime === p.end;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetPeriod(p.start, p.end)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-blue-200/80 text-blue-900 hover:bg-blue-100/60'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#262626] block">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input py-2.5 text-sm w-full bg-white border-[#E5E5E5] rounded-xl font-medium"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#262626] block">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input py-2.5 text-sm w-full bg-white border-[#E5E5E5] rounded-xl font-medium"
            />
          </div>
        </div>
      </div>

      {/* Step 4: Duplicate Summary & Confirmation (Requirement 4) */}
      {isDuplicate && (
        <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-900">
              <Copy size={14} className="text-amber-700" />
              <span>Duplicate Schedule Summary</span>
            </div>
            {selectedDays.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-200/80 text-amber-900">
                {selectedDays.length} {selectedDays.length === 1 ? 'Day' : 'Days'} Selected
              </span>
            )}
          </div>

          {selectedDays.length > 0 ? (
            <div className="text-xs text-amber-950 space-y-2">
              <p className="font-semibold leading-relaxed">
                This will add <strong className="font-black text-[#111111]">{subjectSummaryText}</strong>
                {teacherSummaryText ? (
                  <> &mdash; <strong className="font-bold text-[#111111]">{teacherSummaryText}</strong></>
                ) : null} at <strong className="font-bold text-[#111111]">{timeSummaryText}</strong> to:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {selectedDays.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-xs font-black text-amber-900 shadow-2xs"
                  >
                    <Check size={12} className="text-emerald-600 shrink-0" />
                    {DAYS.find(day => day.value === d)?.label}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-amber-800 font-medium pt-1 border-t border-amber-200/60">
                <span>Target: <strong>{classSummaryText || 'Selected Class'}</strong>{streamSummaryText ? ` • ${streamSummaryText}` : ''}</span>
                <span>•</span>
                <span>Total: <strong>{selectedDays.length}</strong> duplicate {selectedDays.length === 1 ? 'slot' : 'slots'} will be created</span>
              </div>
            </div>
          ) : (
            <div className="py-2.5 text-center text-xs font-bold text-amber-800 bg-amber-100/50 rounded-xl border border-amber-200/60">
              👈 Please select one or more target days above to duplicate this slot to.
            </div>
          )}
        </div>
      )}

      {/* Session Status Toggle for Existing Slots (Only in Edit mode) */}
      {!isDuplicate && slot && (slot as any).id && (
        <div className="p-4 bg-gray-50/80 border border-gray-200/80 rounded-2xl flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#111111] block">Session Status</span>
            <span className="text-[11px] text-[#737373] block mt-0.5">
              {isCancelled ? 'This slot is currently marked as Cancelled.' : 'This slot is active and scheduled on the timetable.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCancelled(!isCancelled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
              isCancelled
                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {isCancelled ? 'Cancelled (Click to Reactivate)' : 'Active (Click to Cancel)'}
          </button>
        </div>
      )}

      {/* Actions with alongside Notify Checkbox */}
      <div className={`flex pt-4 border-t border-[#F5F5F5] mt-6 gap-3 ${isMobile ? 'flex-col' : 'flex-row items-center justify-between flex-wrap'}`}>
        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            id="notifyAffected"
            checked={notifyAffected}
            onChange={(e) => setNotifyAffected(e.target.checked)}
            className="w-4.5 h-4.5 text-[#F4C430] border-gray-300 rounded focus:ring-[#F4C430] cursor-pointer"
          />
          <label htmlFor="notifyAffected" className="text-xs font-bold text-[#111111] cursor-pointer selection:bg-transparent">
            Notify affected students of this change
          </label>
        </div>

        <div className={`flex items-center gap-3 ${isMobile ? 'flex-col w-full' : ''}`}>
          {!isDuplicate && slot && (slot as any).id && onDuplicate && (
            <button
              type="button"
              onClick={handleEnterDuplicate}
              disabled={isSaving}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 flex items-center justify-center gap-1.5 transition-all shadow-sm interactive cursor-pointer ${isMobile ? 'w-full' : ''}`}
            >
              <Copy size={13} />
              <span>Duplicate to another day</span>
            </button>
          )}
          <button
            type="button"
            onClick={isDuplicate ? handleExitDuplicate : onCancel}
            disabled={isSaving}
            className={`btn btn-ghost text-sm font-semibold px-4 py-2 hover:bg-[#F5F5F5] rounded-xl disabled:opacity-50 cursor-pointer ${isMobile ? 'w-full border border-[#E5E5E5]' : ''}`}
          >
            {isDuplicate ? 'Exit Duplicate' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={isSaving || (isDuplicate && selectedDays.length === 0)}
            className={`btn bg-[#111111] hover:bg-[#262626] disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${isMobile ? 'w-full py-3' : ''}`}
          >
            {isSaving && <Loader2 size={14} className="animate-spin shrink-0" />}
            {isDuplicate
              ? selectedDays.length === 0
                ? 'Pick Days to Duplicate'
                : `Add Class Slots (${selectedDays.length} ${selectedDays.length === 1 ? 'Day' : 'Days'})`
              : slot && (slot as any).id
              ? 'Save Changes'
              : 'Add Class Slot'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SlotForm;
