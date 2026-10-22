import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Clock, Calendar, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import SlotCard from './SlotCard';
import { useMobile } from '../../../hooks/useMobile';
import { formatTime12h, timeStrToMins, getPKTNow } from '../../../lib/scheduleUtils';

interface WeeklyGridProps {
  slots: any[];
  sessionLinks?: Record<string, any>;
  conflictSlotIds?: Set<string>;
  onAddSlot?: (dayIndex: number, startTime?: string, endTime?: string) => void;
  onSelectSlot: (slot: any) => void;
  selectionMode?: boolean;
  selectedSlotIds?: string[];
  onToggleSelectSlot?: (slotId: string) => void;
}

const DAYS_NAME = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CANONICAL_PERIODS = [
  { start_time: '16:30:00', end_time: '17:00:00', label: 'Period 0' },
  { start_time: '17:00:00', end_time: '17:30:00', label: 'Period 1' },
  { start_time: '17:30:00', end_time: '18:00:00', label: 'Period 2' },
  { start_time: '18:00:00', end_time: '18:30:00', label: 'Period 3' },
  { start_time: '18:30:00', end_time: '19:00:00', label: 'Period 4' },
];

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({
  slots,
  sessionLinks = {},
  conflictSlotIds = new Set(),
  onAddSlot,
  onSelectSlot,
  selectionMode = false,
  selectedSlotIds = [],
  onToggleSelectSlot,
}) => {
  const isMobile = useMobile();
  const pktnow = useMemo(() => getPKTNow(), []);
  // Today's day index in Mon-first: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat
  const todayDayIndex = pktnow.dayIndex < 6 ? pktnow.dayIndex : 0;

  // Active day on mobile / day-view
  const [activeMobileDay, setActiveMobileDay] = useState(todayDayIndex);
  // Tablet 3-day window offset (0 = Mon-Wed, 3 = Thu-Sat)
  const [tabletWindowOffset, setTabletWindowOffset] = useState(() => (todayDayIndex >= 3 ? 3 : 0));
  // Mobile week overview toggle
  const [showMobileWeekMiniGrid, setShowMobileWeekMiniGrid] = useState(false);

  // Time ticker (updates live/next up class every 30s)
  const [currentMins, setCurrentMins] = useState(pktnow.totalMins);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMins(getPKTNow().totalMins);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Derive unique active time periods across all current slots sorted chronologically
  const periods = useMemo(() => {
    if (slots.length === 0) {
      return CANONICAL_PERIODS.map((p) => ({
        start_time: p.start_time,
        end_time: p.end_time,
      }));
    }

    const timeMap = new Map<number, { start_time: string; end_time: string }>();
    slots.forEach((s) => {
      if (s.start_time) {
        const startMins = timeStrToMins(s.start_time);
        if (!timeMap.has(startMins)) {
          timeMap.set(startMins, {
            start_time: s.start_time,
            end_time: s.end_time || s.start_time,
          });
        }
      }
    });

    return Array.from(timeMap.values()).sort(
      (a, b) => timeStrToMins(a.start_time) - timeStrToMins(b.start_time)
    );
  }, [slots]);

  // Map of day index -> count of classes missing link
  const dayMissingLinkCounts = useMemo(() => {
    const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    slots.forEach((s) => {
      const link = (sessionLinks[s.id]?.link_url || s.room_or_link || '').trim();
      if (!link && !s.is_cancelled && s.day_of_week >= 0 && s.day_of_week < 6) {
        counts[s.day_of_week] = (counts[s.day_of_week] || 0) + 1;
      }
    });
    return counts;
  }, [slots, sessionLinks]);

  // Helper to evaluate live now / starts soon for a slot
  const getSlotTimingStatus = (slot: any) => {
    if (slot.day_of_week !== todayDayIndex || slot.is_cancelled) {
      return { isLiveNow: false, startsSoonMins: undefined };
    }
    const startMins = timeStrToMins(slot.start_time);
    const endMins = timeStrToMins(slot.end_time || slot.start_time);

    if (currentMins >= startMins && currentMins <= endMins) {
      return { isLiveNow: true, startsSoonMins: undefined };
    }
    if (currentMins < startMins && startMins - currentMins <= 45) {
      return { isLiveNow: false, startsSoonMins: startMins - currentMins };
    }
    return { isLiveNow: false, startsSoonMins: undefined };
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MOBILE VIEW (< 640px)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isMobile && !showMobileWeekMiniGrid) {
    const mobileDaySlots = slots
      .filter((s) => s.day_of_week === activeMobileDay)
      .sort((a, b) => timeStrToMins(a.start_time) - timeStrToMins(b.start_time));

    return (
      <div className="space-y-4">
        {/* Horizontal Day Selector Scroll-Snap Strip */}
        <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-1.5 shadow-xs flex items-center justify-between gap-1.5 overflow-x-auto snap-x snap-mandatory no-scrollbar">
          {SHORT_DAYS.map((dayShort, idx) => {
            const isToday = idx === todayDayIndex;
            const isSelected = idx === activeMobileDay;
            const missingLinks = dayMissingLinkCounts[idx] || 0;

            return (
              <button
                key={dayShort}
                type="button"
                onClick={() => setActiveMobileDay(idx)}
                className={`snap-center relative flex-1 min-w-[50px] py-2 px-1 rounded-xl text-center transition-all ${
                  isSelected
                    ? 'bg-neutral-900 text-white dark:bg-[#F2C230] dark:text-neutral-950 font-bold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="text-[11px] uppercase tracking-wide font-bold">{dayShort}</div>
                {isToday && (
                  <div
                    className={`text-[9px] font-extrabold ${
                      isSelected ? 'text-[#F2C230] dark:text-neutral-900' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    Today
                  </div>
                )}

                {/* Dot for days that have classes missing links */}
                {missingLinks > 0 && (
                  <span
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                    title={`${missingLinks} classes missing meeting link`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* View Switcher toggle: Day vs Week Overview */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            {DAYS_NAME[activeMobileDay]} ({mobileDaySlots.length} {mobileDaySlots.length === 1 ? 'class' : 'classes'})
          </span>

          <button
            type="button"
            onClick={() => setShowMobileWeekMiniGrid(true)}
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1"
          >
            <LayoutGrid size={13} />
            <span>Week overview</span>
          </button>
        </div>

        {/* Vertical Timeline List of Classes */}
        <div className="space-y-2.5">
          {mobileDaySlots.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-2">
              <Calendar size={28} className="mx-auto text-neutral-300 dark:text-neutral-600" />
              <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                No classes scheduled for {DAYS_NAME[activeMobileDay]}.
              </p>
              {onAddSlot && (
                <button
                  type="button"
                  onClick={() => onAddSlot(activeMobileDay)}
                  className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  + Add class for {DAYS_NAME[activeMobileDay]}
                </button>
              )}
            </div>
          ) : (
            mobileDaySlots.map((slot) => {
              const timing = getSlotTimingStatus(slot);
              return (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  sessionLink={sessionLinks[slot.id]}
                  onClick={onSelectSlot}
                  hasConflict={conflictSlotIds.has(slot.id)}
                  isLiveNow={timing.isLiveNow}
                  startsSoonMins={timing.startsSoonMins}
                  selectionMode={selectionMode}
                  isSelected={selectedSlotIds.includes(slot.id)}
                  onToggleSelect={onToggleSelectSlot}
                />
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TABLET VIEW (640px to 1023px): 3-day swipeable window with sticky time column
  // ─────────────────────────────────────────────────────────────────────────────
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024;
  const visibleDayIndices = isTablet
    ? [tabletWindowOffset, tabletWindowOffset + 1, tabletWindowOffset + 2]
    : [0, 1, 2, 3, 4, 5]; // Desktop shows all 6 days

  return (
    <div className="space-y-3">
      {/* Tablet 3-Day Window Controls & Mobile Mini-Grid Switcher */}
      <div className="flex items-center justify-between px-1">
        {isTablet ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Showing: {SHORT_DAYS[visibleDayIndices[0]]} – {SHORT_DAYS[visibleDayIndices[2]]}
            </span>
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setTabletWindowOffset(0)}
                disabled={tabletWindowOffset === 0}
                className="p-1 rounded text-neutral-600 dark:text-neutral-300 disabled:opacity-30 hover:bg-white dark:hover:bg-neutral-700"
                title="Mon - Wed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setTabletWindowOffset(3)}
                disabled={tabletWindowOffset === 3}
                className="p-1 rounded text-neutral-600 dark:text-neutral-300 disabled:opacity-30 hover:bg-white dark:hover:bg-neutral-700"
                title="Thu - Sat"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : showMobileWeekMiniGrid ? (
          <button
            type="button"
            onClick={() => setShowMobileWeekMiniGrid(false)}
            className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 flex items-center gap-1 hover:underline"
          >
            <ChevronLeft size={14} />
            <span>Back to day view</span>
          </button>
        ) : (
          <div />
        )}

        <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
          Click any class card to view or edit join links, teachers, and timings.
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          DESKTOP & TABLET TIMETABLE GRID
          Designed to fit Mon-Sat in one viewport at 1366x768 without horizontal scroll
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full border-collapse table-fixed text-xs">
            {/* Sticky Day Header Row */}
            <thead>
              <tr className="bg-neutral-100/80 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold">
                {/* Sticky Time Column Header */}
                <th className="w-20 sm:w-24 p-2.5 text-center text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-r border-neutral-200/80 dark:border-neutral-700/80">
                  <div className="flex items-center justify-center gap-1">
                    <Clock size={12} />
                    <span>Time</span>
                  </div>
                </th>

                {/* Day Columns */}
                {visibleDayIndices.map((dayIdx) => {
                  const isToday = dayIdx === todayDayIndex;
                  const missingLinks = dayMissingLinkCounts[dayIdx] || 0;

                  return (
                    <th
                      key={dayIdx}
                      className={`p-2.5 text-center transition-colors border-r last:border-r-0 border-neutral-200/80 dark:border-neutral-700/80 ${
                        isToday
                          ? 'bg-amber-400/15 dark:bg-amber-400/10 text-neutral-900 dark:text-amber-300'
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-xs font-bold">{DAYS_NAME[dayIdx]}</span>
                        {isToday && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-400 text-neutral-950 uppercase tracking-wider">
                            Today
                          </span>
                        )}
                        {missingLinks > 0 && (
                          <span
                            className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                            title={`${missingLinks} classes missing join link on ${DAYS_NAME[dayIdx]}`}
                          />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Grid Body */}
            <tbody className="divide-y divide-neutral-200/80 dark:divide-neutral-800">
              {periods.map((period, _periodIdx) => {
                const startTimeStr = formatTime12h(period.start_time);
                const endTimeStr = period.end_time ? formatTime12h(period.end_time) : '';

                return (
                  <tr key={period.start_time} className="hover:bg-neutral-50/40 dark:hover:bg-neutral-800/20">
                    {/* Sticky Period/Time Cell */}
                    <td className="w-20 sm:w-24 p-2 text-center bg-neutral-50/70 dark:bg-neutral-900/90 border-r border-neutral-200/80 dark:border-neutral-700/80 text-neutral-600 dark:text-neutral-400 tabular-nums select-none">
                      <div className="font-bold text-neutral-800 dark:text-neutral-200 text-[11px]">
                        {startTimeStr}
                      </div>
                      <div className="text-[10px] text-neutral-400 dark:text-neutral-500">
                        {endTimeStr}
                      </div>
                    </td>

                    {/* Day Cells */}
                    {visibleDayIndices.map((dayIdx) => {
                      const isToday = dayIdx === todayDayIndex;
                      // Find matching slots for this day and time period
                      const cellSlots = slots.filter(
                        (s) =>
                          s.day_of_week === dayIdx &&
                          timeStrToMins(s.start_time) === timeStrToMins(period.start_time)
                      );

                      return (
                        <td
                          key={dayIdx}
                          className={`p-1.5 align-top border-r last:border-r-0 border-neutral-200/80 dark:border-neutral-700/80 transition-colors ${
                            isToday ? 'bg-amber-400/[0.03] dark:bg-amber-400/[0.02]' : ''
                          }`}
                        >
                          {cellSlots.length > 0 ? (
                            <div className="space-y-1.5">
                              {cellSlots.map((slot) => {
                                const timing = getSlotTimingStatus(slot);
                                return (
                                  <SlotCard
                                    key={slot.id}
                                    slot={slot}
                                    sessionLink={sessionLinks[slot.id]}
                                    onClick={onSelectSlot}
                                    hasConflict={conflictSlotIds.has(slot.id)}
                                    isLiveNow={timing.isLiveNow}
                                    startsSoonMins={timing.startsSoonMins}
                                    selectionMode={selectionMode}
                                    isSelected={selectedSlotIds.includes(slot.id)}
                                    onToggleSelect={onToggleSelectSlot}
                                  />
                                );
                              })}
                            </div>
                          ) : (
                            /* Empty Period Cell: subtle hover + Add button */
                            onAddSlot && !selectionMode && (
                              <button
                                type="button"
                                onClick={() => onAddSlot(dayIdx, period.start_time, period.end_time)}
                                className="w-full h-full min-h-[52px] rounded-lg border border-dashed border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center justify-center transition-all group"
                                title={`Schedule class on ${DAYS_NAME[dayIdx]} at ${startTimeStr}`}
                              >
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold flex items-center gap-1">
                                  <Plus size={12} />
                                  <span>Add</span>
                                </span>
                              </button>
                            )
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WeeklyGrid;
