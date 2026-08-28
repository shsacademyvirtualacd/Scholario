import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const studentId = 'a36df3f5-a00c-4327-a0e0-af4ab7a8d8c8';
  console.log('--- Checking enrollments for Rayn Lawback ---');
  const { data: eData, error: eErr } = await supabase.from('enrollments').select('*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*))').eq('student_id', studentId);
  console.log('eData:', eData, 'eErr:', eErr);
}

main().catch(console.error);
