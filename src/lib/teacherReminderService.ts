import { supabase } from './supabase';
import type { ClassSlot } from '../types';
import { getPKTNow, timeStrToMins, getSlotSubject } from './scheduleUtils';

export interface ClassReminderState {
  slotId: string;
  scheduleId: string; // e.g. slotId_sessionDate
  sessionDate: string;
  slot: ClassSlot;
  isPosted: boolean;
  firstFired: boolean;
  timeoutId?: NodeJS.Timeout | number;
  intervalId?: NodeJS.Timeout | number;
  lastFiredAt?: number;
}

/**
 * In-memory map of active class reminders keyed by scheduleId (slotId_sessionDate).
 * Scoped independently per class instance so Class A timers never interfere with Class B.
 */
const activeReminders = new Map<string, ClassReminderState>();

/**
 * Triggers the browser notification for a teacher class reminder.
 */
export function fireTeacherReminderNotification(
  slot: ClassSlot,
  scheduleId: string,
  type: 'first' | 'repeat'
): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  if (Notification.permission !== 'granted') {
    return null;
  }

  const subject = getSlotSubject(slot) || 'Class';
  const title = type === 'first'
    ? `${subject} starts in 30 minutes`
    : `${subject} class link not posted yet`;

  const body = type === 'first'
    ? "Post your class link when you're ready."
    : "Tap to post your class link now.";

  const tag = `teacher-reminder-${scheduleId}`;

  try {
    const notification = new Notification(title, {
      body,
      icon: '/logo.png',
      tag, // Ensures repeat notifications replace the previous one instead of stacking
    });

    notification.onclick = (e) => {
      e.preventDefault();
      try {
        window.focus();
      } catch (err) {
        console.warn('[TeacherReminderService] window.focus warning:', err);
      }

      const targetId = `live-link-editor-${slot.id}`;
      const element = document.getElementById(targetId);

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const btn = element.querySelector('button') as HTMLElement | null;
        if (btn) btn.click();
        const input = element.querySelector('input') as HTMLInputElement | null;
        if (input) input.focus();
      } else {
        // Navigate to teacher dashboard and anchor to slot
        window.location.href = `/teacher#${targetId}`;
      }

      notification.close();
    };

    return notification;
  } catch (err) {
    console.error('[TeacherReminderService] Error creating notification:', err);
    return null;
  }
}

/**
 * Checks if a class link has already been posted for a slot on a given date.
 */
export async function checkIsLinkPosted(slotId: string, sessionDate: string): Promise<boolean> {
  const scheduleId = `${slotId}_${sessionDate}`;
  const existing = activeReminders.get(scheduleId);
  if (existing?.isPosted) return true;

  try {
    // 1. Check class_session_links table
    const { data: sessionLink } = await (supabase as any)
      .from('class_session_links')
      .select('link_url')
      .eq('slot_id', slotId)
      .eq('session_date', sessionDate)
      .maybeSingle();

    if (sessionLink?.link_url && sessionLink.link_url.trim().length > 0) {
      return true;
    }

    // 2. Check live_sessions table by slot_id (clean UUID matching)
    const { data: liveSession } = await (supabase as any)
      .from('live_sessions')
      .select('status, class_link')
      .eq('slot_id', slotId)
      .maybeSingle();

    if (liveSession?.status === 'live' || (liveSession?.class_link && liveSession.class_link.trim().length > 0)) {
      return true;
    }
  } catch (err) {
    console.warn('[TeacherReminderService] Error checking link posted status:', err);
  }

  return false;
}

/**
 * Stops all reminders and intervals for a specific class instance immediately and permanently.
 */
export function stopClassReminder(scheduleId: string): void {
  const state = activeReminders.get(scheduleId);
  if (state) {
    state.isPosted = true;
    if (state.timeoutId) {
      clearTimeout(state.timeoutId);
      state.timeoutId = undefined;
    }
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = undefined;
    }
    activeReminders.set(scheduleId, state);
  }
}

/**
 * Cancels and removes the tracker for a specific scheduleId.
 */
export function clearSlotReminder(scheduleId: string): void {
  const state = activeReminders.get(scheduleId);
  if (state) {
    if (state.timeoutId) clearTimeout(state.timeoutId);
    if (state.intervalId) clearInterval(state.intervalId);
    activeReminders.delete(scheduleId);
  }
}

/**
 * Clears all active reminders on unmount or logout.
 */
export function clearAllTeacherReminders(): void {
  activeReminders.forEach((state) => {
    if (state.timeoutId) clearTimeout(state.timeoutId);
    if (state.intervalId) clearInterval(state.intervalId);
  });
  activeReminders.clear();
}

/**
 * Schedules the reminders for a single class slot instance.
 * - At 30m before scheduled_start_time: fires first reminder.
 * - Every 2m after: repeats reminder until posted (including after start time passes).
 * - Stops completely and permanently when link is posted.
 */
export function scheduleClassSlotReminder(
  slot: ClassSlot,
  sessionDate: string,
  isPosted: boolean
): void {
  if (!slot?.id || slot.is_cancelled) return;

  const scheduleId = `${slot.id}_${sessionDate}`;

  // Clear any pre-existing timer for this slot before setting up a new one
  if (activeReminders.has(scheduleId)) {
    clearSlotReminder(scheduleId);
  }

  if (isPosted) {
    activeReminders.set(scheduleId, {
      slotId: slot.id,
      scheduleId,
      sessionDate,
      slot,
      isPosted: true,
      firstFired: true,
    });
    return;
  }

  const state: ClassReminderState = {
    slotId: slot.id,
    scheduleId,
    sessionDate,
    slot,
    isPosted: false,
    firstFired: false,
  };
  activeReminders.set(scheduleId, state);

  // Compute time until scheduled start
  const startMins = timeStrToMins(slot.start_time || '09:00:00');
  const endMins = timeStrToMins(slot.end_time || '10:00:00');
  const pkt = getPKTNow();

  // If session is on a different date, skip timer
  if (pkt.dateString !== sessionDate) {
    return;
  }

  const currentMins = pkt.totalMins;
  const minsUntilStart = startMins - currentMins;
  const minsPastEnd = currentMins - endMins;

  // If class ended more than 2 hours ago today, don't schedule
  if (minsPastEnd > 120) {
    return;
  }

  const startRepeatingInterval = () => {
    if (state.intervalId) clearInterval(state.intervalId);

    // Repeat every 2 minutes (120,000 ms)
    state.intervalId = setInterval(async () => {
      // 1. Check if posted in memory or database
      if (state.isPosted) {
        stopClassReminder(scheduleId);
        return;
      }

      const nowPosted = await checkIsLinkPosted(slot.id, sessionDate);
      if (nowPosted) {
        stopClassReminder(scheduleId);
        return;
      }

      // 2. Check if date rolled over
      const nowPkt = getPKTNow();
      if (nowPkt.dateString !== sessionDate) {
        stopClassReminder(scheduleId);
        return;
      }

      // 3. Fire repeat reminder
      state.lastFiredAt = Date.now();
      fireTeacherReminderNotification(slot, scheduleId, 'repeat');
    }, 2 * 60 * 1000);
  };

  // Case 1: More than 30 minutes before scheduled start time
  if (minsUntilStart > 30) {
    const delayUntil30mMs = (minsUntilStart - 30) * 60 * 1000;

    state.timeoutId = setTimeout(async () => {
      if (state.isPosted) {
        stopClassReminder(scheduleId);
        return;
      }

      const nowPosted = await checkIsLinkPosted(slot.id, sessionDate);
      if (nowPosted) {
        stopClassReminder(scheduleId);
        return;
      }

      // Fire first notification exactly at 30 minutes before start
      state.firstFired = true;
      state.lastFiredAt = Date.now();
      fireTeacherReminderNotification(slot, scheduleId, 'first');

      // Then start 2-minute repeat interval
      startRepeatingInterval();
    }, delayUntil30mMs);
  }
  // Case 2: Within 30 minutes before start, or start time has already passed
  else {
    // If exactly in the 28-30 min window and hasn't fired yet, fire 'first'
    if (minsUntilStart >= 28 && !state.firstFired) {
      state.firstFired = true;
      state.lastFiredAt = Date.now();
      fireTeacherReminderNotification(slot, scheduleId, 'first');
    } else if (!state.firstFired) {
      // Inside window or start time passed: fire initial repeat reminder
      state.firstFired = true;
      state.lastFiredAt = Date.now();
      fireTeacherReminderNotification(slot, scheduleId, 'repeat');
    }

    // Start 2-minute repeat interval
    startRepeatingInterval();
  }
}

/**
 * Initializes and synchronizes reminders for a list of teacher slots.
 */
export async function syncTeacherClassReminders(
  teacherId: string,
  slots: ClassSlot[]
): Promise<void> {
  if (!teacherId || !slots || slots.length === 0) {
    return;
  }

  const pkt = getPKTNow();
  const todayDate = pkt.dateString;
  const todayDayIndex = pkt.dayIndex;

  // Filter slots for today
  const todaySlots = slots.filter(
    (s) => !s.is_cancelled && s.day_of_week === todayDayIndex
  );

  if (todaySlots.length === 0) {
    return;
  }

  // Fetch all existing posted links for today to initialize state
  const slotIds = todaySlots.map((s) => s.id);
  const postedSlotSet = new Set<string>();

  try {
    // Check class_session_links
    const { data: sessionLinks } = await (supabase as any)
      .from('class_session_links')
      .select('slot_id, link_url')
      .in('slot_id', slotIds)
      .eq('session_date', todayDate);

    (sessionLinks || []).forEach((link: any) => {
      if (link.link_url && link.link_url.trim().length > 0) {
        postedSlotSet.add(link.slot_id);
      }
    });

    // Check live_sessions using slot_id array (clean UUID matching)
    const { data: liveSessions } = await (supabase as any)
      .from('live_sessions')
      .select('id, slot_id, status, class_link')
      .in('slot_id', slotIds);

    (liveSessions || []).forEach((ls: any) => {
      if (ls.status === 'live' || (ls.class_link && ls.class_link.trim().length > 0)) {
        if (ls.slot_id) postedSlotSet.add(ls.slot_id);
      }
    });
  } catch (err) {
    console.warn('[TeacherReminderService] Error fetching today links:', err);
  }

  // Schedule each slot independently
  todaySlots.forEach((slot) => {
    const isPosted = postedSlotSet.has(slot.id);
    scheduleClassSlotReminder(slot, todayDate, isPosted);
  });

  // ── 10-Minute Pre-Class Checks for Overlapping Classes & Missing Links ─────
  // Group today's slots by start_time to find concurrent/overlapping classes
  const slotsByTime = new Map<string, ClassSlot[]>();
  todaySlots.forEach((slot) => {
    if (slot.start_time) {
      const existing = slotsByTime.get(slot.start_time) || [];
      existing.push(slot);
      slotsByTime.set(slot.start_time, existing);
    }
  });

  slotsByTime.forEach(async (groupSlots, startTime) => {
    const startMins = timeStrToMins(startTime);
    const minsUntilStart = startMins - pkt.totalMins;

    // Check if class starts in approximately 10 minutes (between 0 and 11 minutes away)
    if (minsUntilStart <= 11 && minsUntilStart >= 0) {
      const timeFormatted = (() => {
        const [h, m] = startTime.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${String(m).padStart(2, '0')} ${period}`;
      })();

      // 1. If teacher has 2+ classes at the same time:
      // "You have 2 classes at 4:00 PM: [Class A] and [Class B]. Add a link for each."
      if (groupSlots.length >= 2) {
        const classNames = groupSlots.map((s) => {
          const subj = getSlotSubject(s);
          const gr = s.offering?.grade || (s.offering as any)?.class?.grade || '';
          return gr ? `${subj} (Gr. ${gr})` : subj;
        });

        const overlapDedupeKey = `teacher_overlap_10m_${teacherId}_${startTime}_${todayDate}`;
        if (typeof window !== 'undefined' && !sessionStorage.getItem(overlapDedupeKey)) {
          sessionStorage.setItem(overlapDedupeKey, 'true');

          const overlapTitle = `${groupSlots.length} Classes at ${timeFormatted}`;
          const overlapMessage = `You have ${groupSlots.length} classes at ${timeFormatted}: ${classNames.join(' and ')}. Add a link for each.`;

          // Insert into notifications table
          try {
            await (supabase as any).from('notifications').insert({
              recipient_id: teacherId,
              user_id: teacherId,
              title: overlapTitle,
              message: overlapMessage,
              body: overlapMessage,
              type: 'class_reminder',
              severity: 'crucial',
              url: '/teacher',
              is_read: false,
            });
          } catch (e) {
            console.warn('[TeacherReminderService] insert overlap notif error:', e);
          }

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(overlapTitle, {
                body: overlapMessage,
                icon: '/logo.png',
                tag: overlapDedupeKey,
              });
            } catch (e) {
              console.warn('[TeacherReminderService] browser notification error:', e);
            }
          }
        }
      }

      // 2. Reminder 10 minutes before if any session still has no link:
      for (const slot of groupSlots) {
        if (!postedSlotSet.has(slot.id)) {
          const subj = getSlotSubject(slot);
          const noLinkDedupeKey = `teacher_nolink_10m_${slot.id}_${todayDate}`;

          if (typeof window !== 'undefined' && !sessionStorage.getItem(noLinkDedupeKey)) {
            sessionStorage.setItem(noLinkDedupeKey, 'true');

            const noLinkTitle = `${subj} starts in 10 minutes`;
            const noLinkMessage = `${subj} class link not posted yet. Tap to add link.`;

            try {
              await (supabase as any).from('notifications').insert({
                recipient_id: teacherId,
                user_id: teacherId,
                title: noLinkTitle,
                message: noLinkMessage,
                body: noLinkMessage,
                type: 'teacher_reminder',
                severity: 'crucial',
                url: `/teacher#live-link-editor-${slot.id}`,
                is_read: false,
              });
            } catch (e) {
              console.warn('[TeacherReminderService] insert no-link notif error:', e);
            }

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(noLinkTitle, {
                  body: noLinkMessage,
                  icon: '/logo.png',
                  tag: noLinkDedupeKey,
                });
              } catch (e) {
                console.warn('[TeacherReminderService] browser notification error:', e);
              }
            }
          }
        }
      }
    }
  });
}
