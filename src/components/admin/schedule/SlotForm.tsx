import React, { useState, useEffect } from 'react';
import type { ClassSlot, ClassOffering } from '../../../types';

interface SlotFormProps {
  slot?: ClassSlot | null;
  offerings: ClassOffering[];
  onSave: (data: {
    offering_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room_or_link: string;
    publish_to_news: boolean;
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
  onSave,
  onCancel,
}) => {
  const [offeringId, setOfferingId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:30');
  const [roomOrLink, setRoomOrLink] = useState('');
  const [publishToNews, setPublishToNews] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slot) {
      setOfferingId(slot.offering_id);
      setDayOfWeek(slot.day_of_week);
      // Format '16:00:00' to '16:00'
      setStartTime(slot.start_time.slice(0, 5));
      setEndTime(slot.end_time.slice(0, 5));
      setRoomOrLink(slot.room_or_link || '');
    } else {
      // Set defaults for new slot
      if (offerings.length > 0) {
        setOfferingId(offerings[0].id);
      }
      setDayOfWeek(0);
      setStartTime('16:00');
      setEndTime('17:30');
      setRoomOrLink('');
    }
    setPublishToNews(false);
    setError(null);
  }, [slot, offerings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!offeringId) {
      setError('Please select a subject offering.');
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
    if (!roomOrLink.trim()) {
      setError('Please specify a room or Zoom link.');
      return;
    }

    // Convert '16:00' to database format '16:00:00'
    const fullStartTime = startTime.length === 5 ? `${startTime}:00` : startTime;
    const fullEndTime = endTime.length === 5 ? `${endTime}:00` : endTime;

    onSave({
      offering_id: offeringId,
      day_of_week: dayOfWeek,
      start_time: fullStartTime,
      end_time: fullEndTime,
      room_or_link: roomOrLink.trim(),
      publish_to_news: publishToNews,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* Offering Selector */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#525252] block">Subject & Offering</label>
        <select
          value={offeringId}
          onChange={(e) => setOfferingId(e.target.value)}
          className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
        >
          <option value="" disabled>Select an offering...</option>
          {offerings.map((offering) => (
            <option key={offering.id} value={offering.id}>
              {offering.subject} (Grade {offering.grade} - {offering.board.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {/* Day Selector */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#525252] block">Day of the Week</label>
        <select
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(Number(e.target.value))}
          className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
        >
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Time Picker Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#525252] block">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#525252] block">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
          />
        </div>
      </div>

      {/* Location / Link */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#525252] block">Room or Online Link</label>
        <input
          type="text"
          placeholder="e.g. Room 104, Zoom URL"
          value={roomOrLink}
          onChange={(e) => setRoomOrLink(e.target.value)}
          className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
        />
      </div>

      {/* Publish Checkbox */}
      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id="publishToNews"
          checked={publishToNews}
          onChange={(e) => setPublishToNews(e.target.checked)}
          className="w-4.5 h-4.5 text-[#F4C430] border-gray-300 rounded focus:ring-[#F4C430] cursor-pointer"
        />
        <label htmlFor="publishToNews" className="text-xs font-extrabold text-[#111111] cursor-pointer selection:bg-transparent">
          Publish schedule changes to Student News section
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F5F5F5] mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost text-sm font-semibold px-4 py-2 hover:bg-[#F5F5F5] rounded-xl"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn bg-[#111111] hover:bg-[#262626] text-white text-sm font-semibold px-5 py-2 rounded-xl"
        >
          {slot ? 'Save Changes' : 'Add Class Slot'}
        </button>
      </div>
    </form>
  );
};

export default SlotForm;
