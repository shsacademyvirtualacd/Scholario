import type { EventContext } from '@cloudflare/workers-types';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../../env';

const DEFAULT_URL = 'https://rxgrxjlyrfzojvirkhdc.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Z3J4amx5cmZ6b2p2aXJraGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTc3OTksImV4cCI6MjA5ODkzMzc5OX0.ggAT2JiBTg6VG5tbZNnjkig7F73JE0ZzPl_145yuow4';

export async function onRequest(context: EventContext<Env, any, any>): Promise<Response> {
  const { env } = context;

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || DEFAULT_URL;
  const supabaseKey = (env as any).SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Try stored procedure if provisioned
    const { data: rpcData, error: rpcErr } = await supabase.rpc('auto_clock_out_expired_shifts');
    if (!rpcErr && Array.isArray(rpcData)) {
      return new Response(JSON.stringify({ affectedCount: rpcData.length, records: rpcData }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Fallback query
    const { data: openLogs } = await supabase
      .from('staff_attendance_logs')
      .select('id, staff_id, shift_id, segment_index, clock_in_at, notes')
      .is('clock_out_at', null);

    if (!openLogs || openLogs.length === 0) {
      return new Response(JSON.stringify({ affectedCount: 0, records: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const shiftIds = Array.from(new Set(openLogs.map((l) => l.shift_id).filter(Boolean)));
    let shiftsMap = new Map<string, any>();
    if (shiftIds.length > 0) {
      const { data: shiftsData } = await supabase
        .from('staff_shifts')
        .select('*')
        .in('id', shiftIds);
      if (shiftsData) {
        shiftsData.forEach((s) => shiftsMap.set(s.id, s));
      }
    }

    const now = new Date();
    const affected: any[] = [];

    for (const log of openLogs) {
      const shift = log.shift_id ? shiftsMap.get(log.shift_id) : null;
      let shouldAutoClockOut = false;
      let scheduledEndTime: Date | null = null;
      const graceMins = shift?.grace_period_minutes ?? 15;

      if (shift && shift.segments && Array.isArray(shift.segments) && shift.segments.length > 0) {
        const seg = shift.segments.find((s: any) => s.segment_index === log.segment_index) || shift.segments[0];
        if (seg && seg.end_time) {
          const [endH, endM] = seg.end_time.split(':').map(Number);
          const inDate = new Date(log.clock_in_at);
          const endCandidate = new Date(inDate);
          endCandidate.setHours(endH, endM, 0, 0);

          const cutoff = new Date(endCandidate.getTime() + graceMins * 60 * 1000);
          if (now.getTime() > cutoff.getTime()) {
            shouldAutoClockOut = true;
            scheduledEndTime = endCandidate;
          }
        }
      } else {
        const elapsedMs = now.getTime() - new Date(log.clock_in_at).getTime();
        if (elapsedMs > 12 * 60 * 60 * 1000) {
          shouldAutoClockOut = true;
          scheduledEndTime = new Date(new Date(log.clock_in_at).getTime() + 8 * 60 * 60 * 1000);
        }
      }

      if (shouldAutoClockOut && scheduledEndTime) {
        const durationSec = Math.max(0, Math.floor((scheduledEndTime.getTime() - new Date(log.clock_in_at).getTime()) / 1000));
        await supabase
          .from('staff_attendance_logs')
          .update({
            clock_out_at: scheduledEndTime.toISOString(),
            status: 'auto_clocked_out',
            total_active_seconds: durationSec,
            notes: (log.notes ? `${log.notes} | ` : '') + '[System: Auto clocked-out at scheduled segment end + grace period]',
            updated_at: now.toISOString(),
          })
          .eq('id', log.id);

        affected.push({ log_id: log.id, staff_id: log.staff_id, clock_out_at: scheduledEndTime.toISOString() });
      }
    }

    return new Response(JSON.stringify({ affectedCount: affected.length, records: affected }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Sweep error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
