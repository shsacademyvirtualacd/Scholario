import { supabase } from '../src/lib/supabase.ts';

async function benchmark() {
  const ITERATIONS = 1000;

  // 1. Inside loop (current pattern)
  const startInside = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch {
      // ignore
    }
  }
  const durationInside = performance.now() - startInside;

  // 2. Outside loop (optimized pattern)
  const startOutside = performance.now();
  let authHeader: string | undefined;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      authHeader = `Bearer ${session.access_token}`;
    }
  } catch {
    // ignore
  }

  for (let i = 0; i < ITERATIONS; i++) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
  }
  const durationOutside = performance.now() - startOutside;

  console.log(`=== Benchmark Results (${ITERATIONS} iterations) ===`);
  console.log(`Inside loop (baseline):  ${durationInside.toFixed(3)} ms (${(durationInside / ITERATIONS).toFixed(4)} ms/op)`);
  console.log(`Outside loop (optimized): ${durationOutside.toFixed(3)} ms (${(durationOutside / ITERATIONS).toFixed(4)} ms/op)`);
  console.log(`Speedup: ${(durationInside / Math.max(durationOutside, 0.001)).toFixed(2)}x`);
}

benchmark();
