import React, { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../features/auth/AuthContext';
import { getEnrollmentsForStudent } from '../../lib/db';
import type { LiveSession, Enrollment } from '../../types';
import {
  isStudentEnrolledInLiveSession,
  isSessionAlreadyNotified,
  fireLiveClassNotification,
} from '../../lib/liveSessionService';

/**
 * Global Realtime Listener for Live Class Notifications
 * 
 * Mounted ONCE at the application root / layout level.
 * Subscribes to Supabase Realtime changes on `live_sessions`.
 * Strictly scopes alerts to the student's enrolled subjects & grade.
 * Skips stale sessions active prior to page load.
 * Dedupes against session storage and memory.
 */
export const LiveSessionNotificationListener: React.FC = () => {
  const { user, profile } = useAuth();

  // Reference storage to avoid re-triggering across component re-renders
  const enrollmentsRef = useRef<Enrollment[]>([]);
  const knownLiveSessionIdsRef = useRef<Set<string>>(new Set());
  const initialLoadCompleteRef = useRef<boolean>(false);
  const isStudent = profile?.role === 'student';

  // 1. Synchronize student enrollment data
  useEffect(() => {
    if (!user?.id || !isStudent) {
      enrollmentsRef.current = [];
      return;
    }

    let isSubscribed = true;
    getEnrollmentsForStudent(user.id)
      .then((enrs) => {
        if (isSubscribed) {
          enrollmentsRef.current = enrs || [];
        }
      })
      .catch((err) => {
        console.warn('[LiveNotificationListener] Error loading enrollments:', err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [user?.id, isStudent]);

  // 2. Setup Realtime subscription and initial stale-session suppression
  useEffect(() => {
    // Only students need live session desktop notifications
    if (!user?.id || !isStudent) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    let isMounted = true;

    // Fetch initial active live sessions on page load to skip stale notifications
    const initStaleSessionFilter = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('live_sessions')
          .select('id, status, started_at')
          .eq('status', 'live');

        if (!error && data && isMounted) {
          const ids = new Set<string>();
          data.forEach((row: any) => {
            if (row.id) ids.add(row.id);
          });
          knownLiveSessionIdsRef.current = ids;
          console.log('[LiveNotificationListener] Stale live sessions initialized:', ids.size);
        }
      } catch (err) {
        console.warn('[LiveNotificationListener] Failed to fetch initial live sessions:', err);
      } finally {
        if (isMounted) {
          initialLoadCompleteRef.current = true;
        }
      }
    };

    initStaleSessionFilter();

    // Single global Realtime channel subscription on table `live_sessions`
    const channelName = `global-student-live-sessions-${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_sessions',
        },
        (payload: any) => {
          const newRow = payload.new as Partial<LiveSession> | undefined;
          const oldRow = payload.old as Partial<LiveSession> | undefined;

          if (!newRow || !newRow.id) return;

          const sessionId = newRow.id;
          const newStatus = newRow.status;
          const oldStatus = oldRow?.status;

          // Only proceed if new state is 'live'
          if (newStatus !== 'live') {
            // Remove from active known sessions if ended
            knownLiveSessionIdsRef.current.delete(sessionId);
            return;
          }

          // Requirement 5: Skip stale sessions that were already live at initial page load
          if (knownLiveSessionIdsRef.current.has(sessionId)) {
            // If it was already live and wasn't newly started or transitioned, skip
            if (oldStatus === 'live') {
              return;
            }
          }

          // Requirement 8: Dedup against memory & sessionStorage
          if (isSessionAlreadyNotified(sessionId)) {
            return;
          }

          // Requirement 4: Scoping filter against student's enrollment and grade
          const isEnrolled = isStudentEnrolledInLiveSession(
            profile,
            enrollmentsRef.current,
            newRow
          );

          if (!isEnrolled) {
            // Silently ignore — no toast, no sound, no badge
            return;
          }

          // Valid new transition to 'live' for an enrolled class
          const liveSessionObj: LiveSession = {
            id: sessionId,
            subject_id: newRow.subject_id || '',
            grade_id: newRow.grade_id || '',
            class_link: newRow.class_link || '',
            status: 'live',
            started_at: newRow.started_at || new Date().toISOString(),
            ended_at: newRow.ended_at,
            teacher_id: newRow.teacher_id,
            teacher_name: newRow.teacher_name,
            subject_name: newRow.subject_name,
            slot_id: newRow.slot_id,
            offering_id: newRow.offering_id,
          };

          // Mark known and fire browser notification
          knownLiveSessionIdsRef.current.add(sessionId);
          fireLiveClassNotification(liveSessionObj);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[LiveNotificationListener] Successfully subscribed to live_sessions realtime stream');
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id, isStudent, profile]);

  // Headless global listener — renders no UI elements
  return null;
};

export default LiveSessionNotificationListener;
