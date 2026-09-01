import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { getSlotsForTeacher } from '../../lib/db';
import { supabase } from '../../lib/supabase';
import { getPKTNow } from '../../lib/scheduleUtils';
import {
  syncTeacherClassReminders,
  stopClassReminder,
  clearAllTeacherReminders,
} from '../../lib/teacherReminderService';
import type { ClassSlot } from '../../types';

/**
 * TeacherLiveReminderListener
 * ─────────────────────────────────────────────────────────────────────────────
 * Mounted once at the application root / teacher layout level.
 * Handles client-side reminder notifications for teachers:
 * - 30 minutes before scheduled class start: "Math starts in 30 minutes"
 * - Every 2 minutes after: "Math class link not posted yet"
 * - Continues repeating past start time until the teacher posts the class link.
 * - Stops immediately and permanently the moment the link is posted or goes live.
 * - Scoped per class instance so multiple scheduled classes never interfere.
 */
export const TeacherLiveReminderListener: React.FC = () => {
  const { profile } = useAuth();
  const teacherId = profile?.role === 'teacher' ? profile?.id : null;
  const slotsRef = useRef<ClassSlot[]>([]);

  useEffect(() => {
    if (!teacherId) {
      clearAllTeacherReminders();
      return;
    }

    let isMounted = true;

    const loadAndSync = async () => {
      try {
        const slots = await getSlotsForTeacher(teacherId);
        if (!isMounted) return;
        slotsRef.current = slots;
        await syncTeacherClassReminders(teacherId, slots);
      } catch (err) {
        console.warn('[TeacherLiveReminderListener] Failed to load teacher slots:', err);
      }
    };

    // 1. Initial sync
    loadAndSync();

    // 2. Periodic re-sync every 60 seconds to detect any schedule/time changes
    const interval = setInterval(() => {
      if (slotsRef.current.length > 0) {
        syncTeacherClassReminders(teacherId, slotsRef.current);
      } else {
        loadAndSync();
      }
    }, 60_000);

    // 3. Supabase Realtime subscriptions for instantaneous stop on link creation
    const linksChannel = supabase
      .channel(`teacher-reminders-${teacherId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_session_links',
        },
        (payload: any) => {
          const newRec = payload.new;
          if (newRec?.slot_id && newRec?.session_date) {
            const scheduleId = `${newRec.slot_id}_${newRec.session_date}`;
            if (newRec.link_url && newRec.link_url.trim().length > 0) {
              // Immediately cancel and stop all reminders for this class instance
              stopClassReminder(scheduleId);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_sessions',
        },
        (payload: any) => {
          const newRec = payload.new;
          if (newRec?.id) {
            if (newRec.status === 'live' || (newRec.class_link && newRec.class_link.trim().length > 0)) {
              stopClassReminder(newRec.id);
              if (newRec.slot_id) {
                const todayPkt = getPKTNow().dateString;
                stopClassReminder(`${newRec.slot_id}_${todayPkt}`);
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_slots',
        },
        () => {
          loadAndSync();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      clearInterval(interval);
      supabase.removeChannel(linksChannel);
      clearAllTeacherReminders();
    };
  }, [teacherId]);

  return null;
};
