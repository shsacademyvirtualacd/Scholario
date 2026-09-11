const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres'
});

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = {
  P0: { start: '16:30:00', end: '17:00:00' },
  P1: { start: '17:00:00', end: '17:30:00' },
  P2: { start: '17:30:00', end: '18:00:00' },
  P3: { start: '18:00:00', end: '18:30:00' },
  P4: { start: '18:30:00', end: '19:00:00' },
  P5: { start: '19:00:00', end: '19:30:00' },
};

async function solveFlexible() {
  await client.connect();

  const activeRes = await client.query(`
    SELECT cs.id, c.board_id, c.grade, cs.day_of_week, cs.start_time, cs.end_time, s.name as subject_name, t.full_name as teacher_name
    FROM public.class_slots cs
    JOIN public.classes c ON cs.class_id = c.id
    JOIN public.class_offerings co ON cs.offering_id = co.id
    JOIN public.subjects s ON co.subject_id = s.id
    LEFT JOIN public.teachers t ON co.teacher_id = t.id
  `);

  // Active teacher busy map: `day_startTime` -> Set(teacherName)
  const activeBusy = {};
  for (let d = 0; d < 5; d++) {
    for (const p of Object.keys(PERIODS)) {
      activeBusy[`${d}_${PERIODS[p].start}`] = new Set();
    }
  }
  for (const r of activeRes.rows) {
    if (r.teacher_name && r.day_of_week < 5 && activeBusy[`${r.day_of_week}_${r.start_time}`]) {
      activeBusy[`${r.day_of_week}_${r.start_time}`].add(r.teacher_name);
    }
  }

  // Check how many open slots each teacher has across the week:
  const teachers = ['Mr. Hashir', 'Mr. Husnain', 'Muhammad Hasnain Shoukat', 'Ms. Khadija', 'Mr. Subhan', 'Ms. Falak'];
  console.log('--- OPEN SLOTS PER TEACHER ACROSS P0-P5 (excluding P1 for Math/Phys/Eng, excluding P1/P2 for Urdu) ---');
  for (const t of teachers) {
    console.log(`\nTeacher: ${t}`);
    for (let d = 0; d < 5; d++) {
      const openPeriods = Object.keys(PERIODS).filter(p => {
        const time = PERIODS[p].start;
        if (activeBusy[`${d}_${time}`].has(t)) return false;
        // subject rules
        if (t === 'Mr. Husnain' && p === 'P1') return false;
        if (t === 'Mr. Hashir' && p === 'P1') return false;
        if (t === 'Muhammad Hasnain Shoukat' && p === 'P1') return false;
        if (t === 'Mr. Subhan' && (p === 'P1' || p === 'P2')) return false;
        return true;
      });
      console.log(`  ${DAY_NAMES[d]}: ${openPeriods.join(', ') || 'NONE'}`);
    }
  }

  await client.end();
}

solveFlexible().catch(console.error);
