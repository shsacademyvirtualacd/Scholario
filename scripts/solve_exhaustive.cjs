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
  P5: { start: '19:00:00', end: '19:30:00' },
};

async function solveExhaustive() {
  await client.connect();

  const activeRes = await client.query(`
    SELECT cs.id, c.board_id, c.grade, cs.day_of_week, cs.start_time, cs.end_time, s.name as subject_name, t.full_name as teacher_name
    FROM public.class_slots cs
    JOIN public.classes c ON cs.class_id = c.id
    JOIN public.class_offerings co ON cs.offering_id = co.id
    JOIN public.subjects s ON co.subject_id = s.id
    LEFT JOIN public.teachers t ON co.teacher_id = t.id
    WHERE cs.day_of_week < 5
  `);

  // Active slots map: day -> time -> list of busy teachers
  const activeTeacherBusy = {};
  for (let d = 0; d < 5; d++) {
    activeTeacherBusy[d] = {};
    for (const p of Object.keys(PERIOD_TIMES)) {
      activeTeacherBusy[d][PERIOD_TIMES[p].start] = new Set();
    }
  }

  for (const r of activeRes.rows) {
    if (r.teacher_name && activeTeacherBusy[r.day_of_week] && activeTeacherBusy[r.day_of_week][r.start_time]) {
      activeTeacherBusy[r.day_of_week][r.start_time].add(r.teacher_name);
    }
  }

  // Teacher lookup
  const getTeacher = (board, grade, subject) => {
    if (subject === 'Mathematics') return 'Mr. Hashir';
    if (subject === 'Physics') return 'Muhammad Hasnain Shoukat';
    if (subject === 'English') return 'Mr. Husnain';
    if (subject === 'Chemistry') return 'Ms. Khadija';
    if (subject === 'Urdu') return 'Mr. Subhan';
    if (subject === 'Islamiat') return 'Ms. Falak';
    if (subject === 'Biology') {
      if (board === 'fbise' && grade === 11) return 'Ms. Khadija';
      return 'Mr. Subhan';
    }
    return null;
  };

  // Check if a single class in a period satisfies the hard constraints:
  const isPeriodValid = (board, grade, subject, period, day) => {
    const s = subject.toLowerCase();
    // Rule 1: Phys, Eng, Math never in P1
    if (period === 'P1' && ['physics', 'english', 'mathematics'].includes(s)) return false;
    // Rule 2: Urdu never in P1 or P2
    if (['P1', 'P2'].includes(period) && s === 'urdu') return false;
    // Rule 3: Islamiat FBISE only
    if (s === 'islamiat' && board !== 'fbise') return false;
    // Rule 4: Islamiat defaults to P0, except FBISE 11 Wed/Thu in P1
    if (s === 'islamiat') {
      if (board === 'fbise' && grade === 11 && (day === 2 || day === 3) && period === 'P1') return true;
      if (period === 'P0') return true;
      return false;
    }
    // Only Islamiat can be in P0
    if (period === 'P0' && s !== 'islamiat') return false;

    return true;
  };

  // For each day, let's test what assignments work:
  for (let d = 0; d < 5; d++) {
    console.log(`\n=================== SOLVING DAY ${d}: ${DAY_NAMES[d]} ===================`);
    
    // In G9/G10, who is free in each period on day d?
    for (const p of ['P0', 'P1', 'P2', 'P3', 'P4', 'P5']) {
      const busy = Array.from(activeTeacherBusy[d][PERIOD_TIMES[p].start]);
      console.log(`  ${p} (${PERIOD_TIMES[p].start.slice(0, 5)}): Busy=[${busy.join(', ')}]`);
    }
  }

  await client.end();
}

solveExhaustive().catch(console.error);
