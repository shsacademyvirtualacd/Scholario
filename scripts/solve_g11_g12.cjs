const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres'
});

async function runSolver() {
  await client.connect();

  // Load real teachers assigned in DB
  const offRes = await client.query(`
    SELECT c.board_id, c.grade, s.name as subject_name, co.teacher_id, t.full_name as teacher_name
    FROM public.class_offerings co
    JOIN public.classes c ON co.class_id = c.id
    JOIN public.subjects s ON co.subject_id = s.id
    LEFT JOIN public.teachers t ON co.teacher_id = t.id
  `);

  const realTeacherMap = {};
  for (const r of offRes.rows) {
    realTeacherMap[`${r.board_id}_${r.grade}_${r.subject_name.toLowerCase()}`] = {
      teacher_id: r.teacher_id,
      teacher_name: r.teacher_name
    };
  }

  // Active slots in G9/G10/G11-math
  const activeSlotsRes = await client.query(`
    SELECT cs.id, c.board_id, c.grade, cs.day_of_week, cs.start_time, cs.end_time, s.name as subject_name, co.teacher_id, t.full_name as teacher_name
    FROM public.class_slots cs
    JOIN public.classes c ON cs.class_id = c.id
    JOIN public.class_offerings co ON cs.offering_id = co.id
    JOIN public.subjects s ON co.subject_id = s.id
    LEFT JOIN public.teachers t ON co.teacher_id = t.id
  `);

  console.log(`Active slots in DB: ${activeSlotsRes.rows.length}`);

  // Let's print out for each day (0-4) and period (P0, P1, P2, P3, P4):
  // which teachers are currently occupied in G9/G10/G11-math
  const periods = [
    { name: 'P0', start: '16:30:00', end: '17:00:00' },
    { name: 'P1', start: '17:00:00', end: '17:30:00' },
    { name: 'P2', start: '17:30:00', end: '18:00:00' },
    { name: 'P3', start: '18:00:00', end: '18:30:00' },
    { name: 'P4', start: '18:30:00', end: '19:00:00' },
  ];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  console.log('\n--- OCCUPIED TEACHERS PER DAY & PERIOD IN EXISTING ACTIVE SLOTS ---');
  for (let d = 0; d < 5; d++) {
    console.log(`\n=== DAY ${d} (${days[d]}) ===`);
    for (const p of periods) {
      const busy = activeSlotsRes.rows
        .filter(r => r.day_of_week === d && r.start_time === p.start && r.teacher_id)
        .map(r => `${r.teacher_name} (${r.board_id.toUpperCase()} G${r.grade} ${r.subject_name})`);
      const uniqueTeachers = [...new Set(activeSlotsRes.rows
        .filter(r => r.day_of_week === d && r.start_time === p.start && r.teacher_id)
        .map(r => r.teacher_name))];
      console.log(`  ${p.name} (${p.start.slice(0, 5)}): [${uniqueTeachers.join(', ')}]`);
    }
  }

  await client.end();
}

runSolver().catch(console.error);
