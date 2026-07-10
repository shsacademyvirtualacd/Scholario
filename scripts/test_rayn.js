import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rxgrxjlyrfzojvirkhdc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Z3J4amx5cmZ6b2p2aXJraGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTc3OTksImV4cCI6MjA5ODkzMzc5OX0.ggAT2JiBTg6VG5tbZNnjkig7F73JE0ZzPl_145yuow4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const studentId = 'a36df3f5-a00c-4327-a0e0-af4ab7a8d8c8';
  console.log('--- Checking enrollments for Rayn Lawback ---');
  const { data: eData, error: eErr } = await supabase.from('enrollments').select('*, offering:class_offerings(*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*))').eq('student_id', studentId);
  console.log('eData:', eData, 'eErr:', eErr);
}

main().catch(console.error);
