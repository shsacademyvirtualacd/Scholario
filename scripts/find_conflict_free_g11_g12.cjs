const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres'
});

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIOD_TIMES = {
  P0: { start: '16:30:00', end: '17:00:00' },
  P1: { start: '17:00:00', end: '17:30:00' },
  P2: { start: '17:30:00', end: '18:00:00' },
  P3: { start: '18:00:00', end: '18:30:00' },
  P4: { start: '18:30:00', end: '19:00:00' },
  P5: { start: '19:00:00', end: '19:30:00' }, // Evening option
};

async function solve() {
  await client.connect();

  // 1. Get active slots in DB
  const activeSlotsRes = await client.query(`
    SELECT cs.id, c.board_id, c.grade, cs.day_of_week, cs.start_time, cs.end_time, s.name as subject_name, co.teacher_id, t.full_name as teacher_name
    FROM public.class_slots cs
    JOIN public.classes c ON cs.class_id = c.id
    JOIN public.class_offerings co ON cs.offering_id = co.id
    JOIN public.subjects s ON co.subject_id = s.id
    LEFT JOIN public.teachers t ON co.teacher_id = t.id
  `);

  console.log(`Active slots in DB: ${activeSlotsRes.rows.length}`);

  // Let's check which periods are free for each teacher who teaches Grade 11 & 12:
  // Explicit teachers in DB:
  // - Ms. Khadija (Chemistry, Biology)
  // - Mr. Husnain (English)
  // - Mr. Hashir (Mathematics)
  // - Mr. Subhan (Urdu)
  // - Ms. Falak (Islamiat)
  // - Muhammad Hasnain Shoukat (Physics)

  const teachers = [
    { name: 'Ms. Khadija', subjects: ['Chemistry', 'Biology'] },
    { name: 'Mr. Husnain', subjects: ['English'] },
    { name: 'Mr. Hashir', subjects: ['Mathematics'] },
    { name: 'Mr. Subhan', subjects: ['Urdu', 'Biology'] },
    { name: 'Ms. Falak', subjects: ['Islamiat'] },
    { name: 'Muhammad Hasnain Shoukat', subjects: ['Physics'] }
  ];

  for (const t of teachers) {
    console.log(`\nAvailability for ${t.name}:`);
    for (let d = 0; d < 5; d++) {
      const busyTimes = activeSlotsRes.rows
        .filter(r => r.teacher_name === t.name && r.day_of_week === d)
        .map(r => r.start_time.slice(0, 5));
      const freePeriods = ['P0 (16:30)', 'P1 (17:00)', 'P2 (17:30)', 'P3 (18:00)', 'P4 (18:30)'].filter(p => {
        const tm = p.split(' ')[1].replace('(', '').replace(')', '') + ':00';
        return !busyTimes.includes(tm);
      });
      console.log(`  ${DAY_NAMES[d]}: FREE at [${freePeriods.join(', ')}] | BUSY at [${busyTimes.join(', ')}]`);
    }
  }

  await client.end();
}

solve().catch(console.error);
