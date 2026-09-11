const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres'
});

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Periods
const PERIODS = {
  P0: { start: '16:30:00', end: '17:00:00' },
  P1: { start: '17:00:00', end: '17:30:00' },
  P2: { start: '17:30:00', end: '18:00:00' },
  P3: { start: '18:00:00', end: '18:30:00' },
  P4: { start: '18:30:00', end: '19:00:00' },
  P5: { start: '19:00:00', end: '19:30:00' },
  P6: { start: '19:30:00', end: '20:10:00' }, // Sindh 11 Math pre-existing
};

async function solvePlatform() {
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
    for (const p of Object.keys(PERIODS)) {
      activeTeacherBusy[d][PERIODS[p].start] = new Set();
    }
  }

  for (const r of activeRes.rows) {
    if (r.teacher_name && activeTeacherBusy[r.day_of_week] && activeTeacherBusy[r.day_of_week][r.start_time]) {
      activeTeacherBusy[r.day_of_week][r.start_time].add(r.teacher_name);
    }
  }

  // Teacher mapping for subjects:
  // Math: Mr. Hashir
  // Physics: Muhammad Hasnain Shoukat
  // English: Mr. Husnain
  // Chemistry: Ms. Khadija
  // Urdu: Mr. Subhan
  // Islamiat: Ms. Falak
  // Biology: Ms. Khadija for FBISE 11, Mr. Subhan for Sindh 11 / Grade 12

  // In our academy model:
  // Joint streams by Grade:
  // For Grade 11:
  // - G11 English (Mr. Husnain)
  // - G11 Physics (Muhammad Hasnain Shoukat)
  // - G11 Chemistry (Ms. Khadija)
  // - G11 Urdu (Mr. Subhan)
  // - FBISE 11 Math (Mr. Hashir)
  // - Sindh 11 Math (Mr. Hashir at 19:30)
  // - FBISE 11 Islamiat (Ms. Falak)
  // - FBISE 11 Biology (Ms. Khadija)
  // - Sindh 11 Biology (Mr. Subhan)

  // For Grade 12:
  // - G12 Math (Mr. Hashir)
  // - G12 English (Mr. Husnain)
  // - G12 Physics (Muhammad Hasnain Shoukat)
  // - G12 Chemistry (Ms. Khadija)
  // - G12 Biology (Mr. Subhan)
  // - G12 Urdu (Mr. Subhan)
  // - FBISE 12 Islamiat (Ms. Falak)

  // Let's write a generator that tests every possible period assignment for Monday to Friday.
  console.log('Running generator...');

  // Let's test a candidate schedule:
  // Let's define the timetable for each cohort:
  const candidate = [];

  // MONDAY:
  // G11:
  // - P2 (17:30): G11 Chemistry (Ms. Khadija) -> FBISE 11 & Sindh 11
  // - P3 (18:00): G11 English (Mr. Husnain) -> FBISE 11 & Sindh 11
  // - P4 (18:30): G11 Physics (Muhammad Hasnain Shoukat) -> FBISE 11 & Sindh 11
  // - P5 (19:00): FBISE 11 Mathematics (Mr. Hashir)
  // - P6 (19:30): Sindh 11 Mathematics (Mr. Hashir) [Pre-existing]

  // G12:
  // - P2 (17:30): G12 Biology (Mr. Subhan) -> FBISE 12 & Sindh 12
  // - P3 (18:00): Free / Gap
  // - P4 (18:30): G12 Mathematics (Mr. Hashir) -> FBISE 12 & Sindh 12
  // - P5 (19:00): G12 English (Mr. Husnain) -> FBISE 12 & Sindh 12
  // Wait! Where does G12 Physics go on Monday?
  // If G12 has 4 classes on Monday (Bio, Math, Eng, and say Physics):
  // Can G12 take Physics at 19:30? Or can G12 take Physics on Tue, Wed, Thu, Fri?
  // If G12 takes Physics 4 times a week on Tue, Wed, Thu, Fri, then on Monday G12 has 3 classes (Bio, Math, Eng)!
  // That eliminates the gap on Monday: G12 runs 18:00-19:30 (P3: Urdu/Bio, P4: Math, P5: Eng)!
  // Let's test!

  await client.end();
}

solvePlatform();
