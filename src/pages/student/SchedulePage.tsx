import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Video, Clock, Zap, RotateCcw } from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import { StudentPageHeader } from '../../components/student/shared/StudentPageHeader';
import { StudentClassCard } from '../../components/student/shared/StudentClassCard';
import { StudentEmptyState } from '../../components/student/shared/StudentEmptyState';
import { StudentClassCardSkeleton } from '../../components/student/shared/StudentSkeleton';
import { useAuth } from '../../features/auth/AuthContext';
import { getSlotsForStudent, getAttendanceForStudent, getSessionLink } from '../../lib/db';
import { pageCache } from '../../lib/pageCache';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import type { ClassSlot, Attendance } from '../../types';
import {
  getPKTNow,
  classWidgetState,
  formatCountdown,
  getSlotSubject,
  formatTime12h,
  getLinkAvailabilityStatus,
  getClosestDateForDayOfWeek,
} from '../../lib/scheduleUtils';
import { formatStandardDate } from '../../utils/studentFormatting';

const DAYS_OF_WEEK = [
  { short: 'Mon', full: 'Monday', index: 0 },
  { short: 'Tue', full: 'Tuesday', index: 1 },
  { short: 'Wed', full: 'Wednesday', index: 2 },
  { short: 'Thu', full: 'Thursday', index: 3 },
  { short: 'Fri', full: 'Friday', index: 4 },
  { short: 'Sat', full: 'Saturday', index: 5 },
  { short: 'Sun', full: 'Sunday', index: 6 },
];

export const SchedulePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();
  const studentId = profile?.id || '';

  const [scheduleSlots, setScheduleSlots] = useState<ClassSlot[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [pktnow, setPktnow] = useState(getPKTNow);

  // Sync clock every 30s
  useEffect(() => {
    const timer = setInterval(() => setPktnow(getPKTNow()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Initial day selection
  const getInitialDay = () => {
    const urlDay = searchParams.get('day');
    if (urlDay !== null) {
      const parsed = parseInt(urlDay, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 6) return parsed;
    }
    return pktnow.dayIndex <= 6 ? pktnow.dayIndex : 0;
  };

  const [activeDay, setActiveDay] = useState<number>(getInitialDay);

  // Sync day if query param changes
  useEffect(() => {
    const urlDay = searchParams.get('day');
    if (urlDay !== null) {
      const parsed = parseInt(urlDay, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 6) {
        setActiveDay(parsed);
      }
    }
  }, [searchParams]);

  const fetchSlots = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const [slots, att] = await Promise.all([
        getSlotsForStudent(studentId),
        getAttendanceForStudent(studentId),
      ]);
      setScheduleSlots(slots || []);
      setAttendanceRecords(att || []);
    } catch (err) {
      console.warn('[SchedulePage] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [studentId]);

  useRealtimeTable({
    table: 'class_slots',
    debounceMs: 1500,
    onAny: fetchSlots,
  });

  useRealtimeTable({
    table: 'attendance',
    debounceMs: 500,
    onAny: async () => {
      if (studentId) {
        const att = await getAttendanceForStudent(studentId);
        setAttendanceRecords(att || []);
      }
    },
  });

  const handleSelectDay = (dayIndex: number) => {
    setActiveDay(dayIndex);
    setSearchParams({ day: String(dayIndex) });
  };

  // Compute dates for the 7 days of current week based on PKT date
  const weekDayData = useMemo(() => {
    const currentDayIdx = pktnow.dayIndex;
    const todayDateParts = (pktnow.dateString || new Date().toISOString().slice(0, 10))
      .split('-')
      .map(Number);
    const todayYear = todayDateParts[0];
    const todayMonth = todayDateParts[1];
    const todayDay = todayDateParts[2];

    return DAYS_OF_WEEK.map((d) => {
      const dayOffset = d.index - currentDayIdx;
      const targetDate = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay + dayOffset));
      const dateNum = targetDate.getUTCDate();
      const dateStr = targetDate.toISOString().slice(0, 10);
      const hasClasses = scheduleSlots.some(
        (s) => !s.is_cancelled && s.day_of_week === d.index
      );
      return {
        ...d,
        dateNumber: dateNum,
        dateString: dateStr,
        hasClasses,
        isToday: d.index === pktnow.dayIndex,
      };
    });
  }, [pktnow, scheduleSlots]);

  // Active day session date
  const activeDayDateStr = useMemo(() => {
    const found = weekDayData.find((d) => d.index === activeDay);
    return found ? found.dateString : pktnow.dateString;
  }, [weekDayData, activeDay, pktnow.dateString]);

  // Filter slots for selected day
  const activeSlots = useMemo(() => {
    return scheduleSlots
      .filter((s) => !s.is_cancelled && s.day_of_week === activeDay)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  }, [scheduleSlots, activeDay]);

  const activeDayName = DAYS_OF_WEEK.find((d) => d.index === activeDay)?.full || 'Today';

  return (
    <StudentShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <StudentPageHeader
          title="Weekly Schedule"
          description="View your full weekly lecture timetable, room links, and class timings in Pakistan Standard Time (PKT)."
          action={
            <button
              type="button"
              onClick={() => handleSelectDay(pktnow.dayIndex)}
              className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <span>Today</span>
            </button>
          }
        />

        {/* ── Sticky Single-Row Swipeable Day Strip ── */}
        <div className="sticky top-16 z-20 -mx-4 sm:mx-0 px-4 sm:px-0 py-2 bg-neutral-50/95 dark:bg-[#0E0E10]/95 backdrop-blur-md">
          <div className="p-1.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            {weekDayData.map((d) => {
              const isSelected = activeDay === d.index;
              return (
                <button
                  key={d.index}
                  type="button"
                  onClick={() => handleSelectDay(d.index)}
                  className={`min-h-[52px] min-w-[56px] flex-1 py-2 px-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative shrink-0 sm:shrink ${
                    isSelected
                      ? 'bg-neutral-950 text-white dark:bg-amber-400 dark:text-neutral-950 shadow-xs font-bold'
                      : d.isToday
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/50'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span className="text-[11px] font-semibold tracking-wide uppercase">
                    {d.short}
                  </span>
                  <span className="text-sm font-black mt-0.5">
                    {d.dateNumber}
                  </span>

                  {/* Indicator dot on days that have classes */}
                  {d.hasClasses && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isSelected
                          ? 'bg-amber-400 dark:bg-neutral-950'
                          : 'bg-amber-500 dark:bg-amber-400'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Day Header & Schedule List ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                {activeDayName} Classes
              </h2>
              {activeDay === pktnow.dayIndex && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Today
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              {activeSlots.length} {activeSlots.length === 1 ? 'class' : 'classes'} scheduled
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              <StudentClassCardSkeleton />
              <StudentClassCardSkeleton />
              <StudentClassCardSkeleton />
            </div>
          ) : activeSlots.length === 0 ? (
            <StudentEmptyState
              icon={<Calendar size={28} />}
              title={`No classes on ${activeDayName}`}
              description="You have no scheduled lectures for this day. You can review past notes or practice in Self Testing."
              action={{
                label: 'Practice in Self Testing',
                onClick: () => window.location.assign('/student/self-testing'),
              }}
            />
          ) : (
            <div className="space-y-3.5">
              {activeSlots.map((slot) => {
                const att = attendanceRecords.find(
                  (a) => a.slot_id === slot.id && a.session_date === activeDayDateStr
                );
                return (
                  <StudentClassCard
                    key={slot.id}
                    slot={slot}
                    studentId={studentId}
                    sessionDate={activeDayDateStr}
                    attendanceRecord={att}
                    onAttendanceMarked={(slotId, rec) => {
                      setAttendanceRecords((prev) => [
                        rec,
                        ...prev.filter(
                          (a) => !(a.slot_id === slotId && a.session_date === rec.session_date)
                        ),
                      ]);
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentShell>
  );
};

export default SchedulePage;
