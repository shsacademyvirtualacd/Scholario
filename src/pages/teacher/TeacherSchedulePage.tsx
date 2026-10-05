import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Video, Clock, CheckCircle2, Zap } from 'lucide-react';
import TeacherShell from '../../components/teacher/TeacherShell';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusPill from '../../components/ui/StatusPill';
import { getSlotsForTeacher } from '../../lib/db';
import { useAuth } from '../../features/auth/AuthContext';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import type { ClassSlot } from '../../types';
import {
  getPKTNow, classWidgetState, formatCountdown, getSlotSubject,
  formatTime12h, calcDuration, getClosestDateForDayOfWeek
} from '../../lib/scheduleUtils';
import { getSubjectCardClasses } from '../../lib/scheduleCardTheme';
import { LiveLinkEditor } from './TeacherDashboardPage';
import { useMobile } from '../../hooks/useMobile';
import { NotificationPermissionBanner } from '../../components/student/NotificationPermissionBanner';

const DAYS_OF_WEEK = [
  { label: 'Monday', index: 0 },
  { label: 'Tuesday', index: 1 },
  { label: 'Wednesday', index: 2 },
  { label: 'Thursday', index: 3 },
  { label: 'Friday', index: 4 },
  { label: 'Saturday', index: 5 },
  { label: 'Sunday', index: 6 }
];

export const TeacherSchedulePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const isMobile = useMobile();
  const teacherId = profile?.id || 't1';

  // PKT-aware next-class banner state (re-ticks every 60s)
  const [pktnow, setPktnow] = useState(getPKTNow);
  useEffect(() => {
    const id = setInterval(() => setPktnow(getPKTNow()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Active tab defaults to today in PKT
  const getInitialDay = () => {
    const urlDay = searchParams.get('day');
    if (urlDay !== null) {
      const parsed = parseInt(urlDay, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 6) return parsed;
    }
    const todayIdx = getPKTNow().dayIndex;
    return todayIdx <= 6 ? todayIdx : 0;
  };

  const [activeDay, setActiveDay] = useState<number>(getInitialDay());
  const [scheduleSlots, setScheduleSlots] = useState<ClassSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Compute calendar session date for the active day of week
  const activeSessionDate = getClosestDateForDayOfWeek(activeDay, pktnow);

  const fetchSlots = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const slots = await getSlotsForTeacher(teacherId);
      setScheduleSlots(slots);
    } catch (err: any) {
      console.error('[TeacherSchedulePage] fetchSlots error:', err);
      setFetchError(err?.message || 'Failed to load schedule. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [teacherId]);

  useRealtimeTable({
    table: 'class_slots',
    debounceMs: 2000,
    onAny: fetchSlots
  });

  // Refetch slots when admin assigns/deassigns teacher classes
  useRealtimeTable({
    table: 'class_offerings',
    debounceMs: 1500,
    onAny: fetchSlots
  });

  // Refetch session links when updated
  useRealtimeTable({
    table: 'class_session_links',
    debounceMs: 1000,
    onAny: fetchSlots
  });

  // Synchronize day focus if URL query parameters change
  useEffect(() => {
    const urlDay = searchParams.get('day');
    if (urlDay !== null) {
      const parsed = parseInt(urlDay, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 6) {
        setActiveDay(parsed);
      }
    }
  }, [searchParams]);

  // Filter slots for the selected day
  const filteredSlots = scheduleSlots
    .filter(slot => slot.day_of_week === activeDay)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  // PKT-aware next-class banner state
  const bannerState = classWidgetState(scheduleSlots, pktnow);



  return (
    <TeacherShell>
      {/* Page Header */}
      <SectionHeader
        title="Teaching Schedule"
        description="Review your weekly lecture calendar, classroom assignments, and timing slots."
      />

      <NotificationPermissionBanner role="teacher" />

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-[#E5E5E5] border-l-4 border-l-gray-200">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-24" />
                  <div className="h-3 bg-gray-100 rounded w-16" />
                </div>
              </div>
              <div className="flex-1 min-w-0 md:pl-4 md:border-l border-[#F5F5F5] space-y-2">
                <div className="h-5 bg-gray-100 rounded w-32" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
              <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                <div className="h-7 bg-gray-100 rounded-lg w-20" />
                <div className="h-7 bg-gray-100 rounded-lg w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : fetchError ? (
        <div className="py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-[#FEF2F2] border border-[#fecaca] text-[#dc2626] text-xs font-semibold px-4 py-3 rounded-xl">
            <span>⚠</span>
            <span>{fetchError}</span>
          </div>
          <button
            onClick={fetchSlots}
            className="mt-4 block mx-auto text-xs font-bold text-[#737373] hover:text-[#111111] underline underline-offset-2 transition-colors"
          >
            Try again
          </button>
        </div>
      ) : (
        <>

      {/* Next Class Banner — 4-state smart display */}
      {bannerState.type !== 'end-of-day' && (
        <div className={`bg-[#FFFDF0] dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/50 rounded-2xl p-4 flex ${isMobile ? 'flex-col gap-4' : 'flex-row items-center justify-between gap-4'} shadow-sm mb-6`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              bannerState.type === 'ongoing' ? 'bg-emerald-500' : 'bg-[#F4C430]'
            }`}>
              {bannerState.type === 'ongoing'
                ? <Zap size={16} className="text-white" />
                : <Video size={16} className="text-slate-950" />}
            </div>
            <div>
              {bannerState.type === 'ongoing' ? (
                <>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    In Session: {getSlotSubject(bannerState.activeSlot)}
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 font-bold">
                    {Math.floor(bannerState.minsRemaining / 60) > 0
                      ? `${Math.floor(bannerState.minsRemaining / 60)}h ${bannerState.minsRemaining % 60}m remaining`
                      : `${bannerState.minsRemaining}m remaining`}
                    {bannerState.nextSlot && (
                      <span className="text-slate-600 dark:text-slate-400 font-medium ml-2">
                        · Up next: {getSlotSubject(bannerState.nextSlot)} at {formatTime12h(bannerState.nextSlot.start_time)}
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Next Lecture Session: {getSlotSubject(bannerState.nextSlot)}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                    Class {bannerState.nextSlot.offering?.grade || (bannerState.nextSlot.offering as any)?.class?.grade || ''} ({String(bannerState.nextSlot.offering?.board || (bannerState.nextSlot.offering as any)?.class?.board?.name || (bannerState.nextSlot.offering as any)?.class?.board_id || (bannerState.nextSlot.offering as any)?.board_name || 'Curriculum').toUpperCase()}) · Scheduled Lecture
                  </p>
                </>
              )}
            </div>
          </div>
          <div className={`flex items-center gap-2 text-white px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 w-fit self-end md:self-auto ${
            bannerState.type === 'ongoing' ? 'bg-emerald-600' : 'bg-slate-900 dark:bg-amber-400 dark:text-slate-950'
          }`}>
            <Clock size={13} className={bannerState.type === 'ongoing' ? 'text-white' : 'text-amber-400 dark:text-slate-950'} />
            {bannerState.type === 'ongoing'
              ? 'Live Now'
              : `Starts ${formatCountdown(bannerState.minsUntil)}`}
          </div>
        </div>
      )}

      {/* Day Selector Tabs */}
      <div className={`${isMobile ? 'grid grid-cols-3 gap-2' : 'flex items-center gap-1.5 overflow-x-auto no-scrollbar'} py-0.5 bg-white dark:bg-neutral-900 p-2 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-sm mb-6`}>
        {DAYS_OF_WEEK.map((day) => (
          <button
            key={day.index}
            onClick={() => setActiveDay(day.index)}
            className={`flex-1 min-w-[90px] py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeDay === day.index
                ? 'bg-slate-900 text-white shadow-sm dark:bg-amber-400 dark:text-slate-950'
                : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-neutral-800 dark:text-slate-300 dark:hover:bg-neutral-700'
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Slots List */}
      <div className="space-y-4">
        {filteredSlots.length === 0 ? (
          <div className="card text-center py-20 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center interactive">
            <CheckCircle2 size={32} className="text-slate-400 dark:text-neutral-500 mb-2 animate-bounce" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">No classes scheduled</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">You have no scheduled lectures for this day.</p>
          </div>
        ) : (
          filteredSlots.map((slot) => {
            const isCancelled = slot.is_cancelled;
            const subject: string = (slot.custom_title || slot.offering?.subject_name || slot.offering?.subject || 'Class') as string;
            const theme = getSubjectCardClasses(subject);

            return (
              <div
                key={slot.id}
                className={`border rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 border-l-[4px] hover:shadow-sm ${
                  isCancelled
                    ? 'opacity-60 bg-gray-50 dark:bg-neutral-900/60 border-gray-200 dark:border-neutral-800 border-l-gray-400 dark:border-l-neutral-600'
                    : theme.card
                }`}
              >
                <div className={`flex ${isMobile ? 'flex-col items-start gap-4' : 'flex-row items-center justify-between gap-4'}`}>
                  {/* Time & Duration */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-neutral-700">
                      <Clock size={16} />
                    </div>
                    <div>
                      <div className={`text-sm font-extrabold text-slate-900 dark:text-slate-100 ${isCancelled ? 'line-through text-slate-500 dark:text-slate-500' : ''}`}>
                        {formatTime12h(slot.start_time)} – {formatTime12h(slot.end_time)}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                        {calcDuration(slot.start_time, slot.end_time) || '90m'} duration
                      </span>
                    </div>
                  </div>

                  {/* Class info */}
                  <div className="flex-1 min-w-0 md:pl-4 md:border-l border-slate-200 dark:border-neutral-800">
                    <h3 className={`text-base font-extrabold leading-tight truncate ${isCancelled ? 'line-through text-slate-500 dark:text-slate-500' : theme.title}`}>
                      {subject}
                    </h3>
                    <p className={`text-xs ${theme.teacher} mt-0.5 truncate`}>
                      Class {slot.offering?.grade || (slot.offering as any)?.class?.grade || ''} ({String(slot.offering?.board || (slot.offering as any)?.class?.board?.name || (slot.offering as any)?.class?.board_id || (slot.offering as any)?.board_name || 'Curriculum').toUpperCase()}) · Session date: {activeSessionDate}
                    </p>
                  </div>

                  {/* Status Pill */}
                  <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end">
                    <StatusPill status={isCancelled ? 'cancelled' : 'upcoming'} />
                  </div>
                </div>

                {/* Per-session Live Link Editor */}
                {!isCancelled && (
                  <div className="pt-2 border-t border-slate-200 dark:border-neutral-800">
                    <LiveLinkEditor
                      slot={slot}
                      sessionDate={activeSessionDate}
                      teacherId={teacherId}
                    />
                  </div>
                )}
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
