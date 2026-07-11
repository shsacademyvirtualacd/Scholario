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

  return { dayIndex, totalMins, hour, minute };
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
