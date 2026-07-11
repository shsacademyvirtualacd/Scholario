import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeTableProps {
  table: string;
  schema?: string;
  event?: EventType;
  filter?: string;
  /**
   * If set, callbacks are debounced: the handler will only fire once per
   * `debounceMs` milliseconds regardless of how many events arrive.
   * Recommended value: 2000ms for high-traffic tables (class_slots, notes)
   * to prevent thundering-herd query spikes across concurrent clients.
   */
  debounceMs?: number;
  onInsert?: (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => void;
  onAny?: (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => void;
}

export function useRealtimeTable({
  table,
  schema = 'public',
  event = '*',
  filter,
  debounceMs = 0,
  onInsert,
  onUpdate,
  onDelete,
  onAny
}: UseRealtimeTableProps) {
  // Use refs to avoid stale closure issues without forcing channel resubscription
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete, onAny });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbacksRef.current = { onInsert, onUpdate, onDelete, onAny };
  }, [onInsert, onUpdate, onDelete, onAny]);

  useEffect(() => {
    // Unique channel name to avoid collisions
    const channelName = `realtime-${schema}-${table}${filter ? '-' + filter : ''}-${Math.random().toString(36).substring(7)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event,
          schema,
          table,
          filter
        },
        (payload) => {
          console.log(`[Realtime] ${table} event:`, payload);
          
          const executeCallbacks = () => {
            const { onAny: cbAny, onInsert: cbInsert, onUpdate: cbUpdate, onDelete: cbDelete } = callbacksRef.current;
            
            if (cbAny) cbAny(payload);
            
            if (payload.eventType === 'INSERT' && cbInsert) {
              cbInsert(payload);
            } else if (payload.eventType === 'UPDATE' && cbUpdate) {
              cbUpdate(payload);
            } else if (payload.eventType === 'DELETE' && cbDelete) {
              cbDelete(payload);
            }
          };

          if (debounceMs > 0) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(executeCallbacks, debounceMs);
          } else {
            executeCallbacks();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to ${table}${filter ? ` with filter ${filter}` : ''}`);
        }
      });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [table, schema, event, filter, debounceMs]);
}
