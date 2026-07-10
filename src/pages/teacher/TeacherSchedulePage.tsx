import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Video, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import TeacherShell from '../../components/teacher/TeacherShell';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusPill from '../../components/ui/StatusPill';
import { getSlotsForTeacher } from '../../lib/db';
import { useAuth } from '../../features/auth/AuthContext';
import type { ClassSlot } from '../../types';

const DAYS_OF_WEEK = [
  { label: 'Monday', index: 0 },
  { label: 'Tuesday', index: 1 },
  { label: 'Wednesday', index: 2 },
  { label: 'Thursday', index: 3 },
  { label: 'Friday', index: 4 },
  { label: 'Saturday', index: 5 }
];

export const TeacherSchedulePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const teacherId = profile?.id || 't1';

  // Determine today's day to default select (Sunday maps to Monday)
  const getTodayIndex = () => {
    const rawDay = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    if (rawDay === 0) return 0; // Sun -> Mon
    return rawDay - 1; // Mon=0, Tue=1, ..., Sat=5
  };

  const getInitialDay = () => {
    const urlDay = searchParams.get('day');
    if (urlDay !== null) {
      const parsed = parseInt(urlDay, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 5) {
        return parsed;
      }
    }
    return 0; // Default to Monday
  };

  const [activeDay, setActiveDay] = useState<number>(getInitialDay());
  const [scheduleSlots, setScheduleSlots] = useState<ClassSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSlotsForTeacher(teacherId)
      .then(setScheduleSlots)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [teacherId]);

  // Synchronize day focus if URL query parameters change
  useEffect(() => {
    const urlDay = searchParams.get('day');
    if (urlDay !== null) {
      const parsed = parseInt(urlDay, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 5) {
        setActiveDay(parsed);
      }
    }
  }, [searchParams]);

  // Filter slots for the selected day
  const filteredSlots = scheduleSlots
    .filter(slot => slot.day_of_week === activeDay)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  // Next class calculation for banner
  const [timeLeft, setTimeLeft] = useState<string>('');
  const currentDayIndex = getTodayIndex();
  const nextUpcomingSlot = scheduleSlots
    .filter(slot => slot.day_of_week >= currentDayIndex && !slot.is_cancelled)
    .sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return (a.start_time || '').localeCompare(b.start_time || '');
    })[0] || scheduleSlots[0];

  useEffect(() => {
    if (!nextUpcomingSlot || !nextUpcomingSlot.start_time) return;

    const updateCountdown = () => {
      const now = new Date();
      const target = new Date();

      let targetDay = nextUpcomingSlot.day_of_week ?? 0;
      let currentDay = (now.getDay() + 6) % 7;

      let daysToAdd = targetDay - currentDay;
      const safeStartTime = nextUpcomingSlot.start_time || '16:00:00';
      if (daysToAdd < 0 || (daysToAdd === 0 && safeStartTime < `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`)) {
        daysToAdd += 7;
      }

      target.setDate(now.getDate() + daysToAdd);
      const [hours = 16, minutes = 0] = safeStartTime.split(':').map(Number);
      target.setHours(hours, minutes, 0, 0);

      const diffMs = target.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeft('Starting now');
        return;
      }

      const diffMins = Math.floor(diffMs / 60000);
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;

      if (h > 0) {
        setTimeLeft(`${h}h ${m}m`);
      } else {
        setTimeLeft(`${m}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [nextUpcomingSlot]);

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const getSubjectColor = (sub: string) => {
    switch (sub.toLowerCase()) {
      case 'mathematics': return '#F4C430';
      case 'physics': return '#3b82f6';
      case 'chemistry': return '#10b981';
      case 'computer science': return '#8b5cf6';
      default: return '#ec4899';
    }
  };

  return (
    <TeacherShell>
      {/* Page Header */}
      <SectionHeader
        title="Teaching Schedule"
        description="Review your weekly lecture calendar, classroom assignments, and timing slots."
      />

      {loading ? (
        <div className="py-24 text-center">
          <span className="w-8 h-8 border-4 border-[#111111]/10 border-t-[#111111] rounded-full animate-spin inline-block mb-3" />
          <p className="text-xs text-[#737373] font-bold">Loading schedule...</p>
        </div>
      ) : (
        <>

      {/* Next Class Banner Alert */}
      {nextUpcomingSlot && (
        <div className="bg-[#FFFDF0] border border-[#F4C43033] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F4C430] flex items-center justify-center shrink-0">
              <Video size={16} className="text-[#111111]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111]">
                Next Lecture Session: {nextUpcomingSlot.custom_title || nextUpcomingSlot.offering?.subject_name || nextUpcomingSlot.offering?.subject || 'Class'}
              </h3>
              <p className="text-xs text-[#737373] mt-0.5 font-medium">
                Class {nextUpcomingSlot.offering?.grade} (FBISE) ·{' '}
                {nextUpcomingSlot.room_or_link || 'Room Link'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#111111] text-white px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 w-fit self-end md:self-auto">
            <Clock size={13} className="text-[#F4C430]" />
            Starts in {timeLeft}
          </div>
        </div>
      )}

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 bg-white p-2 border border-[#E5E5E5] rounded-xl shadow-sm mb-6">
        {DAYS_OF_WEEK.map((day) => (
          <button
            key={day.index}
            onClick={() => setActiveDay(day.index)}
            className={`flex-1 min-w-[90px] py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeDay === day.index
                ? 'bg-[#111111] text-white shadow-sm'
                : 'bg-white text-[#525252] hover:bg-[#FAFAFA]'
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Slots List */}
      <div className="space-y-4">
        {filteredSlots.length === 0 ? (
          <div className="card text-center py-20 bg-white border border-[#E5E5E5] rounded-2xl flex flex-col items-center justify-center">
            <CheckCircle2 size={32} className="text-[#D4D4D4] mb-2 animate-bounce" />
            <h3 className="text-sm font-bold text-[#111111]">No classes scheduled</h3>
            <p className="text-xs text-[#737373] mt-1">You have no scheduled lectures for this day.</p>
          </div>
        ) : (
          filteredSlots.map((slot) => {
            const isCancelled = slot.is_cancelled;
            const subject: string = (slot.custom_title || slot.offering?.subject_name || slot.offering?.subject || 'Class') as string;
            const subjectColor = getSubjectColor(subject);
            const isOnline = slot.room_or_link?.toLowerCase().includes('http') || slot.room_or_link?.toLowerCase().includes('zoom');

            return (
              <div
                key={slot.id}
                className={`bg-white border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 border-[#E5E5E5] hover:border-[#D4D4D4] hover:shadow-sm ${
                  isCancelled ? 'opacity-60 bg-gray-50' : ''
                }`}
                style={{ borderLeft: isCancelled ? '4px solid #D4D4D4' : `4px solid ${subjectColor}` }}
              >
                {/* Time & Duration */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#737373] shrink-0">
                    <Clock size={16} />
                  </div>
                  <div>
                    <div className={`text-sm font-extrabold text-[#111111] ${isCancelled ? 'line-through' : ''}`}>
                      {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                    </div>
                    <span className="text-[10px] text-[#A3A3A3] font-bold">90 min duration</span>
                  </div>
                </div>

                {/* Class info */}
                <div className="flex-1 min-w-0 md:pl-4 md:border-l border-[#F5F5F5]">
                  <h3 className={`text-base font-extrabold text-[#111111] leading-tight truncate ${isCancelled ? 'line-through text-[#737373]' : ''}`}>
                    {subject}
                  </h3>
                  <p className="text-xs text-[#737373] mt-0.5 font-medium truncate">
                    Class {slot.offering?.grade} (FBISE)
                  </p>
                </div>

                {/* Location & Status */}
                <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                  {slot.room_or_link && (
                    <div className="flex items-center gap-1.5 text-xs text-[#525252] font-semibold bg-[#F5F5F5] px-2.5 py-1 rounded-lg border border-[#E5E5E5]">
                      {isOnline ? (
                        <Video size={13} className="text-[#3b82f6]" />
                      ) : (
                        <MapPin size={13} className="text-[#737373]" />
                      )}
                      <span className="truncate max-w-[120px]">{slot.room_or_link}</span>
                    </div>
                  )}
                  
                  {/* Status Pill */}
                  <StatusPill status={isCancelled ? 'cancelled' : 'upcoming'} />
                </div>
              </div>
            );
          })
        )}
      </div>
      </>
      )}
    </TeacherShell>
  );
};

export default TeacherSchedulePage;
