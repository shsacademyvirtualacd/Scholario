import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Video, Clock, Zap } from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import SectionHeader from '../../components/ui/SectionHeader';
import ClassSlotCard from '../../components/student/ClassSlotCard';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../features/auth/AuthContext';
import { getSlotsForStudent } from '../../lib/db';
import { pageCache } from '../../lib/pageCache';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import type { ClassSlot } from '../../types';
import {
  getPKTNow, classWidgetState, formatCountdown, getSlotSubject,
  formatTime12h
} from '../../lib/scheduleUtils';
import { useMobile } from '../../hooks/useMobile';

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
  const isMobile = useMobile();
  const studentId = profile?.id;
  
  const cachedSlots = studentId ? pageCache.get<ClassSlot[]>('schedule_slots', studentId) : null;
  const [scheduleSlots, setScheduleSlots] = useState<ClassSlot[]>(cachedSlots || []);
  const [loading, setLoading] = useState<boolean>(!cachedSlots);

  useEffect(() => {
    if (!studentId) return;
    let mounted = true;

    // If cache becomes available on studentId ready and we don't have slots yet
    const initialCache = pageCache.get<ClassSlot[]>('schedule_slots', studentId);
    if (initialCache && scheduleSlots.length === 0 && mounted) {
      setScheduleSlots(initialCache);
      setLoading(false);
    }

    getSlotsForStudent(studentId)
      .then((freshSlots) => {
        if (!mounted) return;
        const currentCached = pageCache.get<ClassSlot[]>('schedule_slots', studentId);
        const differs = !currentCached || JSON.stringify(currentCached) !== JSON.stringify(freshSlots);
        if (differs) {
          setScheduleSlots(freshSlots);
          pageCache.set('schedule_slots', freshSlots, studentId);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [studentId]);

  useRealtimeTable({
    table: 'class_slots',
    debounceMs: 2000,
    onAny: async () => {
      if (!studentId) return;
      const freshSlots = await getSlotsForStudent(studentId);
      setScheduleSlots(freshSlots);
      pageCache.set('schedule_slots', freshSlots, studentId);
    }
  });

  // PKT-aware next-class banner state (re-ticks every 60s)
  const [pktnow, setPktnow] = useState(getPKTNow);
  useEffect(() => {
    const id = setInterval(() => setPktnow(getPKTNow()), 60_000);
    return () => clearInterval(id);
  }, []);

  const bannerState = classWidgetState(scheduleSlots, pktnow);

  // Active tab defaults to today in PKT
  const getInitialDay = () => {
    const urlDay = searchParams.get('day');
    if (urlDay !== null) {
      const parsed = parseInt(urlDay, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 5) return parsed;
    }
    // Default to today's PKT day, clamped to school days (Mon-Sat)
    const todayIdx = pktnow.dayIndex;
    return todayIdx <= 5 ? todayIdx : 0;
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
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));



  return (
    <StudentShell>
      {/* Page Header */}
      <SectionHeader
        title="My Timetable"
        description="View your weekly scheduled class lectures, timings, and rooms."
      />

      {/* Next Class Banner — 4-state smart display */}
      {bannerState.type !== 'end-of-day' && (
        <div className="bg-[#FFFDF0] border border-[#F4C43033] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              bannerState.type === 'ongoing' ? 'bg-emerald-500' : 'bg-[#F4C430]'
            }`}>
              {bannerState.type === 'ongoing'
                ? <Zap size={16} className="text-white" />
                : <Video size={16} className="text-[#111111]" />}
            </div>
            <div>
              {bannerState.type === 'ongoing' ? (
                <>
                  <h3 className="text-sm font-bold text-[#111111]">
                    In Session: {getSlotSubject(bannerState.activeSlot)}
                  </h3>
                  <p className="text-xs text-emerald-600 mt-0.5 font-bold">
                    {Math.floor(bannerState.minsRemaining / 60) > 0
                      ? `${Math.floor(bannerState.minsRemaining / 60)}h ${bannerState.minsRemaining % 60}m remaining`
                      : `${bannerState.minsRemaining}m remaining`}
                    {bannerState.nextSlot && (
                      <span className="text-[#737373] font-medium ml-2">
                        · Up next: {getSlotSubject(bannerState.nextSlot)} at {formatTime12h(bannerState.nextSlot.start_time)}
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-bold text-[#111111]">
                    Next Scheduled Class: {getSlotSubject(bannerState.nextSlot)}
                  </h3>
                  <p className="text-xs text-[#737373] mt-0.5 font-medium">
                    with {bannerState.nextSlot.offering?.teacher?.full_name || 'Staff'} ·{' '}
                    {(bannerState.nextSlot.room_or_link && (bannerState.nextSlot.room_or_link.includes('http') || bannerState.nextSlot.room_or_link.includes('zoom'))) ? 'Online Link Available' : 'TBD'}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className={`flex items-center gap-2 text-white px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 w-fit self-end md:self-auto ${
            bannerState.type === 'ongoing' ? 'bg-emerald-600' : 'bg-[#111111]'
          }`}>
            <Clock size={13} className={bannerState.type === 'ongoing' ? 'text-white' : 'text-[#F4C430]'} />
            {bannerState.type === 'ongoing'
              ? 'Live Now'
              : `Starts ${formatCountdown(bannerState.minsUntil)}`}
          </div>
        </div>
      )}

      {/* Weekday Tabs */}
      <div className={`py-1 bg-white p-2 border border-[#E5E5E5] rounded-xl shadow-sm mb-6 ${
        isMobile ? 'grid grid-cols-3 gap-2' : 'flex items-center gap-1.5 overflow-x-auto no-scrollbar'
      }`}>
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
        {loading && scheduleSlots.length === 0 ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-[#F5F5F5] rounded w-40" />
                    <div className="h-3 bg-[#F5F5F5] rounded w-28" />
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <div className="h-8 bg-[#F5F5F5] rounded-xl w-24" />
                  <div className="h-8 bg-[#F5F5F5] rounded-xl w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : scheduleSlots.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No schedule set yet"
            description="The school administration or timetable manager has not set a class schedule for your grade and stream yet. Please check back soon!"
          />
        ) : filteredSlots.length === 0 ? (
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
