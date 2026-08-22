/**
 * scheduleUtils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source-of-truth for all "Next Class" scheduling logic across the
 * Student and Teacher dashboards and schedule pages.
 *
 * Design goals:
 *  - NEVER use raw new Date() for timezone-sensitive comparisons.
 *  - NEVER construct a Date object from start_time / end_time strings
 *    (avoids browser-local-timezone distortion when computing duration).
 *  - All day-of-week arithmetic is Monday-first (0=Mon ... 5=Sat).
 *    Sunday (JS getDay()===0) maps to index 6, outside school days,
 *    so the widget correctly rolls forward to Monday.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { ClassSlot } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const DAYS_OF_WEEK_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const DAYS_OF_WEEK_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Gap threshold in minutes. Classes beyond this are "end-of-day" mode. */
const BUFFER_MINS = 4 * 60; // 4 hours

// ─── PKT Clock ────────────────────────────────────────────────────────────────

export interface PKTNow {
  /** Monday-first day index: 0=Mon, 1=Tue ... 5=Sat, 6=Sun */
  dayIndex: number;
  /** Minutes elapsed since midnight in PKT: e.g. 9:30 AM = 570 */
  totalMins: number;
  /** Human-readable hour (0-23) in PKT */
  hour: number;
  /** Human-readable minute (0-59) in PKT */
  minute: number;
  /** Formatted date string in PKT timezone (YYYY-MM-DD) */
  dateString: string;
}

/**
 * Returns the current Pakistan Standard Time (UTC+5) as a plain object.
 * Uses Intl.DateTimeFormat with hourCycle: 'h23' to extract wall-clock parts — 
 * no manual UTC offset arithmetic, making it independent of the user's local device clock timezone.
 */
export function getPKTNow(): PKTNow {
  const now = new Date();

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  });

  const dateFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = fmt.formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';

  // Intl weekday lowercase maps: 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'
  const weekdayMap: Record<string, number> = {
    mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6,
  };

  const weekdayStr = get('weekday').toLowerCase().slice(0, 3);
  const dayIndex = weekdayMap[weekdayStr] ?? 0;

  const hour = parseInt(get('hour'), 10) || 0;
  const minute = parseInt(get('minute'), 10) || 0;
  const totalMins = hour * 60 + minute;
  const dateString = dateFmt.format(now);

  return { dayIndex, totalMins, hour, minute, dateString };
}

// ─── Time String Helpers ───────────────────────────────────────────────────────

/**
 * Converts a "HH:MM:SS" or "HH:MM" string to minutes from midnight.
 * Strips non-digit parts defensively and handles potential AM/PM indicators to prevent NaN.
 */
export function timeStrToMins(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  
  const parts = timeStr.trim().split(':');
  const cleanParts = parts.map(part => {
    const digits = part.replace(/\D/g, '');
    return digits ? parseInt(digits, 10) : 0;
  });

  let h = cleanParts[0] ?? 0;
  const m = cleanParts[1] ?? 0;

  // Handle potential 12-hour AM/PM formats
  const isPM = /pm/i.test(timeStr);
  const isAM = /am/i.test(timeStr);
  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  return h * 60 + m;
}

/**
 * Formats a "HH:MM:SS" time string to "H:MM AM/PM".
 */
export function formatTime12h(timeStr?: string): string {
  if (!timeStr || typeof timeStr !== 'string') return 'TBA';
  const mins = timeStrToMins(timeStr);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const fh = h % 12 || 12;
  return `${fh}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Computes the duration between two "HH:MM:SS" strings as a human-readable
 * label (e.g. "1h 30m"). Falls back gracefully if either string is missing.
 * NEVER constructs a Date object — purely integer arithmetic.
 */
export function calcDuration(startTime?: string, endTime?: string): string {
  if (!startTime || !endTime) return '';
  const startMins = timeStrToMins(startTime);
  const endMins = timeStrToMins(endTime);
  const diff = endMins - startMins;
  if (diff <= 0) return '';
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// ─── Next Slot Finder ─────────────────────────────────────────────────────────

/**
 * Finds the single best "next" class slot using a two-pass algorithm.
 *
 * Pass 1 (Today): slots whose day_of_week === pktnow.dayIndex AND
 *   start_time_mins > pktnow.totalMins. Sorted by start_time. Return earliest.
 *
 * Pass 2 (Rollover): slots from future days (day_of_week !== pktnow.dayIndex).
 *   Compute "days ahead" with wraparound into next week. Sort by
 *   daysAhead then start_time. Return earliest.
 *
 * Returns null if the slot list is empty.
 */
export function findNextSlot(
  slots: ClassSlot[],
  pktnow: PKTNow,
): ClassSlot | null {
  const active = slots.filter(s => !s.is_cancelled);
  if (active.length === 0) return null;

  // Pass 1: remaining slots today (not yet started)
  const todayRemaining = active
    .filter(s => s.day_of_week === pktnow.dayIndex && s.start_time != null)
    .filter(s => timeStrToMins(s.start_time!) > pktnow.totalMins)
    .sort((a, b) => timeStrToMins(a.start_time!) - timeStrToMins(b.start_time!));

  if (todayRemaining.length > 0) return todayRemaining[0];

  // Pass 2: rollover to future days
  const futureDays = active
    .filter(s => s.day_of_week !== pktnow.dayIndex && s.start_time != null)
    .map(s => {
      const targetDay = s.day_of_week ?? 0;
      let daysAhead = targetDay - pktnow.dayIndex;
      if (daysAhead <= 0) daysAhead += 7;
      return { slot: s, daysAhead };
    })
    .sort((a, b) => {
      if (a.daysAhead !== b.daysAhead) return a.daysAhead - b.daysAhead;
      return timeStrToMins(a.slot.start_time!) - timeStrToMins(b.slot.start_time!);
    });

  return futureDays.length > 0 ? futureDays[0].slot : null;
}

// ─── 4-State Widget Machine ────────────────────────────────────────────────────

export type WidgetStateType = 'ongoing' | 'end-of-day' | 'morning-buffer' | 'countdown';

export interface OngoingState {
  type: 'ongoing';
  activeSlot: ClassSlot;
  minsRemaining: number;
  nextSlot: ClassSlot | null;
}

export interface EndOfDayState {
  type: 'end-of-day';
  nextSlot: ClassSlot | null;
  minsUntil: number | null;
}

export interface MorningBufferState {
  type: 'morning-buffer';
  nextSlot: ClassSlot;
  minsUntil: number;
}

export interface CountdownState {
  type: 'countdown';
  nextSlot: ClassSlot;
  minsUntil: number;
}

export type WidgetState =
  | OngoingState
  | EndOfDayState
  | MorningBufferState
  | CountdownState;

/**
 * Determines the correct 4-state widget display from the full slot list.
 *
 * State A (ongoing)        — A class is currently in session.
 * State B (end-of-day)     — All today's classes are done AND next class > BUFFER_MINS away (carries next class info).
 * State C (morning-buffer) — Next class is today and within BUFFER_MINS, no class active.
 * State D (countdown)      — Normal daytime gap or cross-day within buffer.
 */
export function classWidgetState(
  slots: ClassSlot[],
  pktnow: PKTNow,
): WidgetState {
  const active = slots.filter(s => !s.is_cancelled);

  // ── Check if any class is ONGOING right now ─────────────────────────────
  const ongoingSlot = active.find(s => {
    if (s.day_of_week !== pktnow.dayIndex) return false;
    if (!s.start_time || !s.end_time) return false;
    const startMins = timeStrToMins(s.start_time);
    const endMins = timeStrToMins(s.end_time);
    return startMins <= pktnow.totalMins && pktnow.totalMins < endMins;
  });

  if (ongoingSlot) {
    const endMins = timeStrToMins(ongoingSlot.end_time!);
    const minsRemaining = endMins - pktnow.totalMins;
    const afterActive = active.filter(s => s.id !== ongoingSlot.id);
    const nextSlot = findNextSlot(afterActive, pktnow);
    return { type: 'ongoing', activeSlot: ongoingSlot, minsRemaining, nextSlot };
  }

  // ── No ongoing class — find the next upcoming slot ──────────────────────
  const nextSlot = findNextSlot(active, pktnow);

  if (!nextSlot) {
    return { type: 'end-of-day', nextSlot: null, minsUntil: null };
  }

  // Compute how many minutes away the next slot is (cross-day aware)
  let daysAhead = (nextSlot.day_of_week ?? 0) - pktnow.dayIndex;
  if (daysAhead < 0) daysAhead += 7;
  const nextStartMins = timeStrToMins(nextSlot.start_time ?? '09:00');
  const minsUntil = daysAhead * 24 * 60 + (nextStartMins - pktnow.totalMins);

  // State B — end of day: no more slots today and next class far away
  if (daysAhead > 0 && minsUntil > BUFFER_MINS) {
    const todayHasMoreSlots = active.some(
      s => s.day_of_week === pktnow.dayIndex &&
           s.start_time != null &&
           timeStrToMins(s.start_time) > pktnow.totalMins
    );
    if (!todayHasMoreSlots) {
      return { type: 'end-of-day', nextSlot, minsUntil };
    }
  }

  // State C — morning-buffer: next class is today and within BUFFER_MINS
  if (daysAhead === 0 && minsUntil <= BUFFER_MINS) {
    return { type: 'morning-buffer', nextSlot, minsUntil };
  }

  // State D — standard countdown
  return { type: 'countdown', nextSlot, minsUntil };
}

// ─── Countdown String Formatter ───────────────────────────────────────────────

/**
 * Formats a total-minutes value to "in Xh Ym" or "in Ym".
 */
export function formatCountdown(minsUntil: number): string {
  if (minsUntil <= 0) return 'Starting now';
  const h = Math.floor(minsUntil / 60);
  const m = minsUntil % 60;
  if (h > 0 && m > 0) return `in ${h}h ${m}m`;
  if (h > 0) return `in ${h}h`;
  return `in ${m}m`;
}

/**
 * Extracts a display-ready subject name from a ClassSlot, resolving the
 * multiple possible fields (custom_title, offering.subject_name, offering.subject).
 */
export function getSlotSubject(slot: ClassSlot): string {
  const raw = slot.custom_title || (slot.offering as any)?.subject_name || slot.offering?.subject || 'Class';
  return typeof raw === 'string' ? raw : ((raw as any)?.name ?? 'Class');
}

// ─── Class Link Timing Restriction Helpers ─────────────────────────────────────

export type LinkAvailabilityState = 'no_link' | 'locked' | 'available' | 'ended' | 'future_day';

export interface LinkAvailabilityStatus {
  isAvailable: boolean;
  status: LinkAvailabilityState;
  message: string;
  minsUntilUnlock?: number;
}

/**
 * Evaluates whether a class slot's live link should be accessible to students.
 * Rules:
 *  1. Teacher can post/edit a link at any time.
 *  2. For students, the link is accessible ONLY starting 10 minutes prior to class
 *     start time up until the class end time.
 *  3. If uploaded within 10 minutes (or during class), it is immediately available.
 *  4. Outside the 10-minute window, the link is locked/hidden from students.
 */
export function getLinkAvailabilityStatus(
  slot: ClassSlot,
  pktnow: PKTNow = getPKTNow()
): LinkAvailabilityStatus {
  const link = slot?.room_or_link?.trim();
  if (!link) {
    return {
      isAvailable: false,
      status: 'no_link',
      message: 'No link added',
    };
  }

  const slotDay = slot.day_of_week ?? 0;
  if (slotDay !== pktnow.dayIndex) {
    return {
      isAvailable: false,
      status: 'future_day',
      message: 'Available 10m before class',
    };
  }

  const startMins = slot.start_time ? timeStrToMins(slot.start_time) : 0;
  const endMins = slot.end_time ? timeStrToMins(slot.end_time) : startMins + 60;
  const windowStartMins = startMins - 10;
  const currentMins = pktnow.totalMins;

  if (currentMins < windowStartMins) {
    const minsUntilUnlock = windowStartMins - currentMins;
    const hours = Math.floor(minsUntilUnlock / 60);
    const mins = minsUntilUnlock % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    return {
      isAvailable: false,
      status: 'locked',
      message: `Unlocks in ${timeStr}`,
      minsUntilUnlock,
    };
  }

  if (currentMins >= windowStartMins && currentMins <= endMins) {
    return {
      isAvailable: true,
      status: 'available',
      message: 'Join Live Class',
    };
  }

  return {
    isAvailable: false,
    status: 'ended',
    message: 'Class session ended',
  };
}

// ─── Dynamic Attendance Session & Day Helpers ─────────────────────────────────

/**
 * Calculates the calendar date string (YYYY-MM-DD) for a given target day of week (0=Mon...6=Sun).
 * If targetDayIndex matches today's day of week, returns today's date in PKT/device timezone.
 * If targetDayIndex is in the future this week or rolls over to next week, calculates the exact upcoming date.
 */
export function getClosestDateForDayOfWeek(
  targetDayIndex: number,
  basePktNow: PKTNow = getPKTNow()
): string {
  const currentDayIndex = basePktNow.dayIndex;
  let daysOffset = targetDayIndex - currentDayIndex;
  if (daysOffset < 0) {
    daysOffset += 7;
  }

  // Parse today's base date in YYYY-MM-DD
  const [year, month, day] = basePktNow.dateString.split('-').map(Number);
  const targetDate = new Date(Date.UTC(year, month - 1, day + daysOffset));
  return targetDate.toISOString().slice(0, 10);
}

/**
 * Given a list of class slots for a subject offering:
 * 1. Checks if any slot is scheduled TODAY (day_of_week === pktnow.dayIndex).
 *    If so, returns that slot and today's date.
 * 2. If no slot today, finds the closest upcoming slot in the schedule cycle,
 *    and calculates its upcoming calendar date.
 */
export function findBestSlotForOffering(
  slots: ClassSlot[],
  pktnow: PKTNow = getPKTNow()
): { slot: ClassSlot | null; sessionDate: string } {
  const activeSlots = slots.filter(s => !s.is_cancelled && s.day_of_week != null);
  if (activeSlots.length === 0) {
    return { slot: null, sessionDate: pktnow.dateString };
  }

  // 1. Check for a slot today
  const todaySlots = activeSlots.filter(s => s.day_of_week === pktnow.dayIndex);
  if (todaySlots.length > 0) {
    // If there's an ongoing slot or earliest slot today
    const upcomingToday = todaySlots
      .filter(s => s.start_time && timeStrToMins(s.start_time) >= pktnow.totalMins - 60)
      .sort((a, b) => timeStrToMins(a.start_time || '') - timeStrToMins(b.start_time || ''));

    const chosen = upcomingToday.length > 0 ? upcomingToday[0] : todaySlots[0];
    return { slot: chosen, sessionDate: pktnow.dateString };
  }

  // 2. No slot today — find the nearest upcoming scheduled slot
  const sortedUpcoming = [...activeSlots].map(slot => {
    const day = slot.day_of_week ?? 0;
    let daysAhead = day - pktnow.dayIndex;
    if (daysAhead <= 0) daysAhead += 7;
    return { slot, daysAhead, startMins: timeStrToMins(slot.start_time || '00:00') };
  }).sort((a, b) => {
    if (a.daysAhead !== b.daysAhead) return a.daysAhead - b.daysAhead;
    return a.startMins - b.startMins;
  });

  const best = sortedUpcoming[0];
  const sessionDate = getClosestDateForDayOfWeek(best.slot.day_of_week ?? 0, pktnow);
  return { slot: best.slot, sessionDate };
}

/**
 * Checks if a specific class slot is currently ongoing based on PKT clock.
 */
export function isSlotOngoing(
  slot: ClassSlot | null | undefined,
  pktnow: PKTNow = getPKTNow()
): boolean {
  if (!slot || slot.is_cancelled) return false;
  if (slot.day_of_week !== pktnow.dayIndex) return false;
  if (!slot.start_time || !slot.end_time) return false;
  const startMins = timeStrToMins(slot.start_time);
  const endMins = timeStrToMins(slot.end_time);
  return pktnow.totalMins >= startMins && pktnow.totalMins < endMins;
}

export interface RatingSessionTarget {
  slot: ClassSlot;
  sessionDate: string; // YYYY-MM-DD
  isOngoing: boolean;
  statusLabel: string;
}

/**
 * Finds either the currently in-session class or the most recently completed class slot
 * for student teacher attendance rating.
 */
export function findActiveOrRecentSlotForRating(
  slots: ClassSlot[],
  pktnow: PKTNow = getPKTNow()
): RatingSessionTarget | null {
  const active = slots.filter(s => !s.is_cancelled && s.day_of_week != null && s.start_time && s.end_time);
  if (active.length === 0) return null;

  // 1. Check if any class is currently ONGOING today
  const todaySlots = active.filter(s => s.day_of_week === pktnow.dayIndex);
  const ongoing = todaySlots.find(s => {
    const startMins = timeStrToMins(s.start_time!);
    const endMins = timeStrToMins(s.end_time!);
    return startMins <= pktnow.totalMins && pktnow.totalMins < endMins;
  });

  if (ongoing) {
    return {
      slot: ongoing,
      sessionDate: pktnow.dateString,
      isOngoing: true,
      statusLabel: 'Live In Session',
    };
  }

  // 2. Check if any class has COMPLETED earlier today
  const completedToday = todaySlots
    .filter(s => timeStrToMins(s.end_time!) <= pktnow.totalMins)
    .sort((a, b) => timeStrToMins(b.end_time!) - timeStrToMins(a.end_time!));

  if (completedToday.length > 0) {
    return {
      slot: completedToday[0],
      sessionDate: pktnow.dateString,
      isOngoing: false,
      statusLabel: 'Completed Today',
    };
  }

  // 3. Look back over the past 7 days for the most recently completed class
  for (let daysAgo = 1; daysAgo <= 7; daysAgo++) {
    const targetDayIndex = (pktnow.dayIndex - daysAgo + 7) % 7;
    const pastSlots = active
      .filter(s => s.day_of_week === targetDayIndex)
      .sort((a, b) => timeStrToMins(b.end_time!) - timeStrToMins(a.end_time!));

    if (pastSlots.length > 0) {
      const [year, month, day] = pktnow.dateString.split('-').map(Number);
      const targetDate = new Date(Date.UTC(year, month - 1, day - daysAgo));
      const pastDate = targetDate.toISOString().slice(0, 10);
      const dayName = DAYS_OF_WEEK_SHORT[targetDayIndex];
      return {
        slot: pastSlots[0],
        sessionDate: pastDate,
        isOngoing: false,
        statusLabel: `Completed (${dayName}, ${pastDate})`,
      };
    }
  }

  return null;
}


