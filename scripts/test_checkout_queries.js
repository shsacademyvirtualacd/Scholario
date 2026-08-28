import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

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
