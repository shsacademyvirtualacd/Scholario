import React, { useState, useEffect } from 'react';
import { useMobile } from '../../../hooks/useMobile';
import type { ClassSlot, ClassOffering } from '../../../types';

interface SlotFormProps {
  slot?: ClassSlot | Partial<ClassSlot> | null;
  offerings: ClassOffering[];
  taxonomy: any;
  defaultClassId?: string;
  defaultStreamId?: string;
  onSave: (data: {
    offering_id: string | null;
    custom_title?: string | null;
    class_id?: string | null;
    stream_id?: string | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    publish_to_news: boolean;
    notify_affected?: boolean;
  }) => void;
  onCancel: () => void;
}

const DAYS = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
];

export const SlotForm: React.FC<SlotFormProps> = ({
  slot,
  offerings,
  taxonomy,
  defaultClassId = '',
  defaultStreamId = '',
  onSave,
  onCancel,
}) => {
  const isMobile = useMobile();
  const [slotMode, setSlotMode] = useState<'offering' | 'custom'>('offering');
  const [offeringId, setOfferingId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStreamId, setSelectedStreamId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('16:30');
  const [notifyAffected, setNotifyAffected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slot && slot.id) {
      if (slot.offering_id) {
        setSlotMode('offering');
        setOfferingId(slot.offering_id);
        const off = offerings.find(o => o.id === slot.offering_id);
        setSelectedClassId(off?.class_id || slot.class_id || '');
        setSelectedStreamId(slot.stream_id || '');
      } else {
        setSlotMode('custom');
        setOfferingId('');
        setCustomTitle(slot.custom_title || 'Break');
        setSelectedClassId(slot.class_id || defaultClassId || '');
        setSelectedStreamId(slot.stream_id || defaultStreamId || '');
      }
      setDayOfWeek(slot.day_of_week ?? 0);
      setStartTime(slot.start_time ? slot.start_time.slice(0, 5) : '16:00');
      setEndTime(slot.end_time ? slot.end_time.slice(0, 5) : '16:30');
    } else {
      // Defaults for new slot
      setSelectedClassId(defaultClassId || '');
      setSelectedStreamId(defaultStreamId || '');
      setSlotMode('offering');
      setOfferingId('');
      setCustomTitle('Break');
      setDayOfWeek(slot && slot.day_of_week !== undefined ? slot.day_of_week : 0);
      setStartTime(slot && slot.start_time ? slot.start_time.slice(0, 5) : '16:00');
      setEndTime(slot && slot.end_time ? slot.end_time.slice(0, 5) : '16:30');
    }
    setNotifyAffected(false);
    setError(null);
  }, [slot, offerings, defaultClassId, defaultStreamId]);

  // Filter offerings based on chosen class and stream
  const filteredOfferings = offerings.filter(o => {
    if (selectedClassId && o.class_id !== selectedClassId && (o as any)?.class?.id !== selectedClassId) {
      return false;
    }
    if (selectedStreamId && selectedStreamId !== 'all' && selectedStreamId !== '') {
      const offStreamId = o.stream_id || (o as any)?.stream?.id;
      const offStreamName = typeof o.stream === 'string' ? o.stream : ((o as any)?.stream?.name || (o as any)?.stream_name || '');
      const chosenStream = taxonomy?.streams?.find((s: any) => s.id === selectedStreamId)?.name || '';
      if (offStreamId && offStreamId !== selectedStreamId) return false;
      if (chosenStream && offStreamName && !offStreamName.toLowerCase().includes(chosenStream.toLowerCase())) return false;
    }
    return true;
  });

  const handleClassChange = (val: string) => {
    setSelectedClassId(val);
    setSelectedStreamId('');
    setOfferingId('');
  };

  const handleStreamChange = (val: string) => {
    setSelectedStreamId(val);
    setOfferingId('');
  };

  const handleModeChange = (mode: 'offering' | 'custom') => {
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

  const handleSubmit = (e: React.FormEvent) => {
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

    const fullStartTime = startTime.length === 5 ? `${startTime}:00` : startTime;
    const fullEndTime = endTime.length === 5 ? `${endTime}:00` : endTime;

    onSave({
      offering_id: slotMode === 'offering' ? offeringId : null,
      custom_title: slotMode === 'custom' ? customTitle.trim() : null,
      class_id: selectedClassId || null,
      stream_id: selectedStreamId && selectedStreamId !== 'all' ? selectedStreamId : null,
      day_of_week: dayOfWeek,
      start_time: fullStartTime,
      end_time: fullEndTime,
      publish_to_news: notifyAffected,
      notify_affected: notifyAffected,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3.5 text-xs font-bold text-red-700 bg-red-50/90 border border-red-200 rounded-xl flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Class & Stream Context */}
      <div className="p-4 bg-gray-50/80 border border-gray-200/80 rounded-2xl space-y-3.5">
        <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
          <span>1. Select Target Class & Stream</span>
        </div>
        <div className={`grid gap-3.5 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#262626] block">Class / Cohort Grade</label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="input py-2.5 text-sm w-full bg-white border-[#E5E5E5] rounded-xl font-medium text-gray-800"
            >
              <option value="">-- Select Class --</option>
              {taxonomy?.classes?.filter((c: any) => c.board_id === 'fbise').map((c: any) => (
                <option key={c.id} value={c.id}>
                  Grade {c.display_name || c.grade} ({c.board_id?.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#262626] block">Stream (Optional)</label>
            <select
              value={selectedStreamId}
              onChange={(e) => handleStreamChange(e.target.value)}
              className="input py-2.5 text-sm w-full bg-white border-[#E5E5E5] rounded-xl font-medium text-gray-800"
              disabled={!selectedClassId}
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
        </div>

        {slotMode === 'offering' ? (
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#262626] block">Subject & Offering</label>
            <select
              value={offeringId}
              onChange={(e) => setOfferingId(e.target.value)}
              className="input py-2.5 text-sm w-full bg-white border-[#E5E5E5] rounded-xl font-medium text-gray-800"
              disabled={!selectedClassId}
            >
              <option value="">-- Choose Subject Offering --</option>
              {filteredOfferings.map((offering) => (
                <option key={offering.id} value={offering.id}>
                  {offering.subject_name || offering.subject?.name} — {offering.teacher?.full_name || 'Assigned Teacher'}
                  {offering.stream ? ` (${typeof offering.stream === 'string' ? offering.stream : offering.stream.name})` : ''}
                </option>
              ))}
            </select>
            {!selectedClassId && (
              <p className="text-[11px] text-amber-600 font-medium">Please select a Target Class above to see its available subjects.</p>
            )}
            {selectedClassId && filteredOfferings.length === 0 && (
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
                className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl font-medium"
              />
            </div>
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
          </div>
        )}
      </div>

      {/* Step 3: Schedule Day & FBISE Period Timings */}
      <div className="space-y-3.5 pt-1">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 block">
          3. Set Day & Period Timing
        </span>

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

        {/* FBISE Quick Period Presets */}
        <div className="space-y-1.5 p-3 bg-blue-50/50 border border-blue-100/80 rounded-xl">
          <label className="text-[10px] font-extrabold text-blue-900 block uppercase tracking-wider">
            ⚡ FBISE Period Presets (4:00 PM – 6:50 PM)
          </label>
          <div className={`grid gap-1.5 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {[
              { label: 'Period 1 (4:00 - 4:30 PM)', start: '16:00', end: '16:30' },
              { label: 'Period 2 (4:30 - 5:00 PM)', start: '16:30', end: '17:00' },
              { label: 'Period 3 (5:00 - 5:30 PM)', start: '17:00', end: '17:30' },
              { label: 'Period 4 (5:30 - 6:00 PM)', start: '17:30', end: '18:00' },
              { label: 'Period 5 (6:00 - 6:25 PM)', start: '18:00', end: '18:25' },
              { label: 'Period 6 (6:25 - 6:50 PM)', start: '18:25', end: '18:50' },
            ].map((p, idx) => {
              const isSelected = startTime === p.start && endTime === p.end;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetPeriod(p.start, p.end)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border text-center transition-all ${
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
          <button
            type="button"
            onClick={onCancel}
            className={`btn btn-ghost text-sm font-semibold px-4 py-2 hover:bg-[#F5F5F5] rounded-xl ${isMobile ? 'w-full border border-[#E5E5E5]' : ''}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`btn bg-[#111111] hover:bg-[#262626] text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-sm ${isMobile ? 'w-full py-3' : ''}`}
          >
            {slot ? 'Save Changes' : 'Add Class Slot'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SlotForm;
