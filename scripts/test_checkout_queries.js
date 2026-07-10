import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rxgrxjlyrfzojvirkhdc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Z3J4amx5cmZ6b2p2aXJraGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTc3OTksImV4cCI6MjA5ODkzMzc5OX0.ggAT2JiBTg6VG5tbZNnjkig7F73JE0ZzPl_145yuow4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('--- Checking fee_configs ---');
  const { data: fcData, error: fcErr } = await supabase.from('fee_configs').select('*');
  console.log('fcData:', fcData, 'fcErr:', fcErr);

  console.log('--- Checking classes for Rayn Lawback or Grade 10 ---');
  const { data: clsData, error: clsErr } = await supabase.from('classes').select('*');
  console.log('clsData:', clsData, 'clsErr:', clsErr);

  console.log('--- Checking fee_statuses ---');
  const { data: fsData, error: fsErr } = await supabase.from('fee_statuses').select('*');
  console.log('fsData:', fsData, 'fsErr:', fsErr);

  console.log('--- Checking fee_audit_trail ---');
  const { data: faData, error: faErr } = await supabase.from('fee_audit_trail').select('*');
  console.log('faData:', faData, 'faErr:', faErr);
}

main().catch(console.error);
