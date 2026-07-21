import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rxgrxjlyrfzojvirkhdc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Z3J4amx5cmZ6b2p2aXJraGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTc3OTksImV4cCI6MjA5ODkzMzc5OX0.ggAT2JiBTg6VG5tbZNnjkig7F73JE0ZzPl_145yuow4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== CHECKING VIA SUPABASE REST API ===");

  // 1. CLASSES
  const { data: classes } = await supabase.from('classes').select('*');
  console.log("\n--- CLASSES ---");
  console.table(classes);

  // 2. STREAMS
  const { data: streams } = await supabase.from('streams').select('*, class:classes(*)');
  console.log("\n--- STREAMS ---");
  console.table(streams?.map(s => ({ id: s.id, name: s.name, grade: s.class?.grade, board: s.class?.board_id })));

  // 3. SUBJECTS
  const { data: subjects } = await supabase.from('subjects').select('*').order('name');
  console.log("\n--- SUBJECTS ---");
  console.table(subjects);

  // 4. STREAM_SUBJECTS FOR GRADE 9 & 10
  const { data: streamSubjects } = await supabase
    .from('stream_subjects')
    .select('*, stream:streams(*, class:classes(*)), subject:subjects(*)');
  console.log("\n--- STREAM_SUBJECTS ---");
  console.table(
    streamSubjects
      ?.map(ss => ({
        grade: ss.stream?.class?.grade,
        stream_name: ss.stream?.name,
        subject_name: ss.subject?.name,
        subject_id: ss.subject_id,
        stream_id: ss.stream_id
      }))
      .filter(x => ['9', '10'].includes(x.grade))
      .sort((a, b) => a.grade.localeCompare(b.grade) || a.stream_name.localeCompare(b.stream_name) || a.subject_name.localeCompare(b.subject_name))
  );

  // 5. CLASS_OFFERINGS
  const { data: offerings } = await supabase
    .from('class_offerings')
    .select('*, class:classes(*), subject:subjects(*), teacher:teachers(*)');
  console.log("\n--- CLASS_OFFERINGS (Grade 9 & 10) ---");
  console.table(
    offerings
      ?.map(o => ({
        offering_id: o.id,
        grade: o.class?.grade,
        subject_name: o.subject?.name,
        teacher: o.teacher?.full_name || 'NONE'
      }))
      .filter(x => ['9', '10'].includes(x.grade))
      .sort((a, b) => a.grade.localeCompare(b.grade) || a.subject_name.localeCompare(b.subject_name))
  );

  // 6. CLASS_SLOTS
  const { data: slots } = await supabase
    .from('class_slots')
    .select('*, class:classes(*), offering:class_offerings(*, subject:subjects(*)), stream:streams(*)');
  console.log("\n--- CLASS_SLOTS (Grade 9 & 10) ---");
  console.table(
    slots
      ?.map(s => ({
        slot_id: s.id,
        grade: s.class?.grade || s.offering?.class?.grade,
        day: s.day_of_week,
        start: s.start_time,
        end: s.end_time,
        offering_id: s.offering_id,
        offering_subject: s.offering?.subject?.name || 'NULL',
        custom_title: s.custom_title,
        stream: s.stream?.name || 'ALL'
      }))
      .filter(x => ['9', '10'].includes(x.grade))
  );

  // 7. PROFILES FOR STUDENTS
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*, class:classes(*), stream_obj:streams(*)')
    .eq('role', 'student');
  console.log("\n--- STUDENT PROFILES ---");
  console.table(
    profiles?.map(p => ({
      id: p.id,
      name: p.full_name,
      email: p.email,
      grade: p.class?.grade,
      stream: p.stream_obj?.name || p.stream
    }))
  );

  // 8. ENROLLMENTS
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, profile:profiles(*), offering:class_offerings(*, class:classes(*), subject:subjects(*))');
  console.log("\n--- ENROLLMENTS ---");
  console.table(
    enrollments?.map(e => ({
      id: e.id,
      student_id: e.student_id,
      student_name: e.profile?.full_name,
      grade: e.offering?.class?.grade,
      subject: e.offering?.subject?.name
    }))
  );
}

run();
