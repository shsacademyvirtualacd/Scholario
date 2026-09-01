import React, { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../features/auth/AuthContext';
import type { LiveSession } from '../../types';
import {
  isAdminSessionAlreadyNotified,
  fireAdminLiveClassNotification,
} from '../../lib/liveSessionService';

/**
 * AdminLiveNotificationListener
 * ─────────────────────────────────────────────────────────────────────────────
 * Single global Realtime listener for administrators.
 * - Subscribes to Supabase Realtime changes on table `live_sessions`.
 * - Fires a browser notification when ANY teacher posts a class link (status transitions to 'live').
 * - No enrollment/grade filter: admin monitors all subjects and grades.
 * - Stale session filter: ignores sessions that were already 'live' at page load.
 * - Dedupes against memory and sessionStorage so re-renders/reconnects don't refire.
 */
export const AdminLiveNotificationListener: React.FC = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const knownLiveSessionIdsRef = useRef<Set<string>>(new Set());
  const initialLoadCompleteRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    let isMounted = true;

    // 1. Fetch initial active live sessions on page load to skip stale notifications
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
          console.log('[AdminLiveNotificationListener] Stale live sessions initialized:', ids.size);
        }
      } catch (err) {
        console.warn('[AdminLiveNotificationListener] Failed to fetch initial live sessions:', err);
      } finally {
        if (isMounted) {
          initialLoadCompleteRef.current = true;
        }
      }
    };

    initStaleSessionFilter();

    // 2. Single global Realtime channel subscription on table `live_sessions`
    const channelName = `global-admin-live-sessions-${Date.now()}`;
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
            knownLiveSessionIdsRef.current.delete(sessionId);
            return;
          }

          // Skip stale sessions that were already live at initial page load
          if (knownLiveSessionIdsRef.current.has(sessionId)) {
            if (oldStatus === 'live') {
              return;
            }
          }

          // Dedup against memory & sessionStorage
          if (isAdminSessionAlreadyNotified(sessionId)) {
            return;
          }

          // Valid new transition to 'live' for any teacher/subject/grade across the institution
          const liveSessionObj: Partial<LiveSession> = {
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
          fireAdminLiveClassNotification(liveSessionObj);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[AdminLiveNotificationListener] Successfully subscribed to live_sessions realtime stream');
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  return null;
};

export default AdminLiveNotificationListener;
