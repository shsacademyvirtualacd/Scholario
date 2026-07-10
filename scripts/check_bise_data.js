// Verify if any real data is linked to BISE / 'local' board in Supabase
// Run via: node scripts/check_bise_data.js

const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://rxgrxjlyrfzojvirkhdc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Z3J4amx5cmZ6b2p2aXJraGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTc3OTksImV4cCI6MjA5ODkzMzc5OX0.ggAT2JiBTg6VG5tbZNnjkig7F73JE0ZzPl_145yuow4'
);

async function main() {
  // 1. Get all offerings under 'local' board
  const { data: biseOfferings, error: offErr } = await sb
    .from('class_offerings')
    .select('id, subject, grade')
    .eq('board', 'local');

  if (offErr) {
    console.error('Error fetching offerings:', offErr.message);
    return;
  }

  const biseOfferingIds = biseOfferings.map(o => o.id);
  console.log(`Found ${biseOfferings.length} BISE class offerings in DB.`);

  if (biseOfferingIds.length === 0) {
    console.log('No BISE offerings found. Nothing to check.');
    return;
  }

  // 2. Check enrollments linked to these offerings
  const { data: enrolls, error: enrollErr } = await sb
    .from('enrollments')
    .select('id, student_id, offering_id')
    .in('offering_id', biseOfferingIds);

  console.log(`Found ${enrolls?.length || 0} enrollments linked to BISE.`);
  if (enrolls && enrolls.length > 0) {
    console.table(enrolls);
  }

  // 3. Check slots / schedule linked to these offerings
  const { data: slots, error: slotErr } = await sb
    .from('class_slots')
    .select('id, offering_id, day_of_week, start_time')
    .in('offering_id', biseOfferingIds);

  console.log(`Found ${slots?.length || 0} class slots linked to BISE.`);
  if (slots && slots.length > 0) {
    console.table(slots);
  }

  // 4. Check notes linked to these offerings
  const { data: notes, error: noteErr } = await sb
    .from('notes')
    .select('id, title, offering_id')
    .in('offering_id', biseOfferingIds);

  console.log(`Found ${notes?.length || 0} notes linked to BISE.`);
  if (notes && notes.length > 0) {
    console.table(notes);
  }

  // 5. Check if any teachers are assigned to BISE classes
  const { data: biseWithTeachers, error: teacherErr } = await sb
    .from('class_offerings')
    .select('id, subject, grade, teacher_id')
    .eq('board', 'local')
    .not('teacher_id', 'is', null);

  console.log(`Found ${biseWithTeachers?.length || 0} BISE offerings with assigned teachers.`);
  if (biseWithTeachers && biseWithTeachers.length > 0) {
    console.table(biseWithTeachers);
  }
}

main().catch(console.error);
