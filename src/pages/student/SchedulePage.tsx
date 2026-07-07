import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Video, Clock } from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import SectionHeader from '../../components/ui/SectionHeader';
import ClassSlotCard from '../../components/student/ClassSlotCard';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../features/auth/AuthContext';
import { getSlotsForStudent } from '../../lib/db';
import type { ClassSlot } from '../../types';

const DAYS_OF_WEEK = [
  { label: 'Monday', index: 0 },
  { label: 'Tuesday', index: 1 },
  { label: 'Wednesday', index: 2 },
  { label: 'Thursday', index: 3 },
  { label: 'Friday', index: 4 },
  { label: 'Saturday', index: 5 }
];

export const SchedulePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const studentId = profile?.id;
  
  const [scheduleSlots, setScheduleSlots] = useState<ClassSlot[]>([]);

  useEffect(() => {
    if (studentId) {
      getSlotsForStudent(studentId).then(setScheduleSlots).catch(console.error);
    }
  }, [studentId]);

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
    return getTodayIndex();
  };

  const [activeDay, setActiveDay] = useState<number>(getInitialDay());


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
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Next class calculation for banner
  const [timeLeft, setTimeLeft] = useState<string>('');
  const currentDayIndex = getTodayIndex();
  const nextUpcomingSlot = scheduleSlots
    .filter(slot => slot.day_of_week >= currentDayIndex && !slot.is_cancelled)
    .sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return a.start_time.localeCompare(b.start_time);
    })[0] || scheduleSlots[0];

  useEffect(() => {
    if (!nextUpcomingSlot) return;

    const updateCountdown = () => {
      const now = new Date();
      const target = new Date();

      let targetDay = nextUpcomingSlot.day_of_week;
      let currentDay = (now.getDay() + 6) % 7;

      let daysToAdd = targetDay - currentDay;
      if (daysToAdd < 0 || (daysToAdd === 0 && nextUpcomingSlot.start_time < `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`)) {
        daysToAdd += 7;
      }

      target.setDate(now.getDate() + daysToAdd);
      const [hours, minutes] = nextUpcomingSlot.start_time.split(':').map(Number);
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

  return (
    <StudentShell>
      {/* Page Header */}
      <SectionHeader
        title="My Timetable"
        description="View your weekly scheduled class lectures, timings, and rooms."
      />

      {/* Next Class Banner Alert */}
      {nextUpcomingSlot && (
        <div className="bg-[#FFFDF0] border border-[#F4C43033] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F4C430] flex items-center justify-center shrink-0">
              <Video size={16} className="text-[#111111]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111]">
                Next Scheduled Class: {nextUpcomingSlot.offering?.subject}
              </h3>
              <p className="text-xs text-[#737373] mt-0.5 font-medium">
                with {nextUpcomingSlot.offering?.teacher?.full_name} ·{' '}
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

      {/* Weekday Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 bg-white p-2 border border-[#E5E5E5] rounded-xl shadow-sm mb-6">
        {DAYS_OF_WEEK.map(day => (
          <button
            key={day.index}
            onClick={() => setActiveDay(day.index)}
            className={`flex-1 min-w-[90px] py-2 text-center rounded-lg text-xs font-bold transition-all border ${
              activeDay === day.index
                ? 'bg-[#111111] text-white border-[#111111] shadow-sm'
                : 'bg-transparent text-[#737373] border-transparent hover:bg-[#F5F5F5] hover:text-[#111111]'
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Slots List */}
      <div className="space-y-4">
        {filteredSlots.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No classes scheduled"
            description={`You have no lectures or classes scheduled for ${
              DAYS_OF_WEEK.find(d => d.index === activeDay)?.label
            }.`}
          />
        ) : (
          filteredSlots.map(slot => (
            <ClassSlotCard key={slot.id} slot={slot} />
          ))
        )}
      </div>
    </StudentShell>
  );
};

export default SchedulePage;
