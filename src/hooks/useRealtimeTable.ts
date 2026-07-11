import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeTableProps<T> {
  table: string;
  schema?: string;
  event?: EventType;
  filter?: string;
  onInsert?: (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => void;
  onAny?: (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => void;
}

export function useRealtimeTable<T = any>({
  table,
  schema = 'public',
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onAny
}: UseRealtimeTableProps<T>) {
  // Use refs to avoid stale closure issues without forcing channel resubscription
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete, onAny });

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
          const { onAny: cbAny, onInsert: cbInsert, onUpdate: cbUpdate, onDelete: cbDelete } = callbacksRef.current;
          
          if (cbAny) cbAny(payload);
          
          if (payload.eventType === 'INSERT' && cbInsert) {
            cbInsert(payload);
          } else if (payload.eventType === 'UPDATE' && cbUpdate) {
            cbUpdate(payload);
          } else if (payload.eventType === 'DELETE' && cbDelete) {
            cbDelete(payload);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to ${table}${filter ? ` with filter ${filter}` : ''}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, schema, event, filter]);
}

