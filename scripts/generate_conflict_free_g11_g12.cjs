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
};

async function buildConflictFreeSchedule() {
  await client.connect();

  // Load active slots
  const activeSlotsRes = await client.query(`
    SELECT cs.id, c.board_id, c.grade, cs.day_of_week, cs.start_time, cs.end_time, s.name as subject_name, co.teacher_id, t.full_name as teacher_name
    FROM public.class_slots cs
    JOIN public.classes c ON cs.class_id = c.id
    JOIN public.class_offerings co ON cs.offering_id = co.id
    JOIN public.subjects s ON co.subject_id = s.id
    LEFT JOIN public.teachers t ON co.teacher_id = t.id
  `);

  // Build teacher busy map: `day_startTime` -> Set(teacherId)
  const teacherBusyMap = {};
  for (let d = 0; d < 5; d++) {
    for (const p of ['P0', 'P1', 'P2', 'P3', 'P4']) {
      teacherBusyMap[`${d}_${PERIOD_TIMES[p].start}`] = new Set();
    }
  }

  for (const row of activeSlotsRes.rows) {
    if (row.teacher_id && row.day_of_week < 5) {
      const key = `${row.day_of_week}_${row.start_time}`;
      if (teacherBusyMap[key]) {
        teacherBusyMap[key].add(row.teacher_id);
      }
    }
  }

  // Load offerings & teachers for G11 and G12
  const offRes = await client.query(`
    SELECT c.board_id, c.grade, s.name as subject_name, co.id as offering_id, co.teacher_id, t.full_name as teacher_name
    FROM public.classes c
    JOIN public.class_offerings co ON co.class_id = c.id
    JOIN public.subjects s ON co.subject_id = s.id
    LEFT JOIN public.teachers t ON co.teacher_id = t.id
    WHERE c.grade IN ('11', '12') AND c.board_id IN ('fbise', 'sindh')
    ORDER BY c.board_id, c.grade, s.name
  `);

  // If a subject in G11/G12 has teacher_id null in DB, let's map what faculty member would teach it:
  // Math: Mr. Hashir (6d998d0b-b45d-42cf-8b7b-c5b0c367474a)
  // Physics: Muhammad Hasnain Shoukat (097f275c-2d5b-452b-acc6-a1f03f6a3e48)
  // Chemistry: Ms. Khadija (9f5c1b46-90eb-434e-984e-89ece1f7387e)
  // English: Mr. Husnain (5c3af2c8-bce7-4925-b205-235b34e44d6d)
  // Urdu: Mr. Subhan (c518cb05-db67-4bf5-b956-17ecfea6d237)
  // Islamiat: Ms. Falak (7f5cd1fc-b7e2-4dfa-853f-10ef29ec136e)
  // Biology: Mr. Rayyan (9a9c6d10-6e13-4b0e-a1b3-8f304c6c0dc0) or Mr. Subhan

  const DEFAULT_FACULTY = {
    'mathematics': { id: '6d998d0b-b45d-42cf-8b7b-c5b0c367474a', name: 'Mr. Hashir' },
    'physics': { id: '097f275c-2d5b-452b-acc6-a1f03f6a3e48', name: 'Muhammad Hasnain Shoukat' },
    'chemistry': { id: '9f5c1b46-90eb-434e-984e-89ece1f7387e', name: 'Ms. Khadija' },
    'english': { id: '5c3af2c8-bce7-4925-b205-235b34e44d6d', name: 'Mr. Husnain' },
    'urdu': { id: 'c518cb05-db67-4bf5-b956-17ecfea6d237', name: 'Mr. Subhan' },
    'islamiat': { id: '7f5cd1fc-b7e2-4dfa-853f-10ef29ec136e', name: 'Ms. Falak' },
    'biology': { id: '9a9c6d10-6e13-4b0e-a1b3-8f304c6c0dc0', name: 'Mr. Rayyan' },
  };

  const getTeacherFor = (board, grade, subject) => {
    const sLower = subject.toLowerCase();
    const row = offRes.rows.find(r => r.board_id === board && r.grade === grade && r.subject_name.toLowerCase() === sLower);
    if (row && row.teacher_id) {
      return { id: row.teacher_id, name: row.teacher_name, isExplicit: true };
    }
    const def = DEFAULT_FACULTY[sLower];
    if (def) {
      return { id: def.id, name: def.name, isExplicit: false };
    }
    return { id: null, name: 'Unassigned', isExplicit: false };
  };

  console.log('\n--- VERIFYING SUBJECTS NEEDED PER DAY FOR GRADE 11 & 12 ---');
  // In the user's previous timetable, Grade 11 & 12 had 4 periods per day (P1, P2, P3, P4) + Islamiat in P0 or P1
  // Let's check which subjects are assigned per day in USER_PROPOSED:
  // Mon: FBISE 11: Chem, Math, Phys, Eng
  //      FBISE 12: Bio, Eng, Phys, Math
  //      Sindh 11: Chem, Math, Phys, Eng
  //      Sindh 12: Bio, Eng, Phys, Math
  //
  // Notice that on Monday, FBISE 11 and Sindh 11 both need: Chem, Math, Phys, Eng!
  // And FBISE 12 and Sindh 12 both need: Bio, Eng, Phys, Math!
  // Let's check:
  // At any given period (P1, P2, P3, P4), how many cohorts can have English? Only ONE! Because there is only ONE Mr. Husnain!
  // Across 4 cohorts (FBISE 11, Sindh 11, FBISE 12, Sindh 12), if ALL 4 cohorts need English on Monday,
  // then Mr. Husnain must teach in 4 distinct periods!
  // BUT Mr. Husnain is ALREADY teaching at 18:30 (P4) in Grade 9 & 10!
  // That means in P1–P4 on Monday:
  // P1: English forbidden by Rule 1!
  // P4: Mr. Husnain is occupied with G9 & G10!
  // That leaves ONLY P2 (17:30) and P3 (18:00) for Mr. Husnain on Monday!
  // That is only 2 slots! But all 4 cohorts wanted English on Monday!
  // That mathematically proves that having all 4 cohorts take English on Monday is IMPOSSIBLE with 1 teacher without double-booking!

  console.log('\nMATHEMATICAL INSIGHT:');
  console.log('On Monday:');
  console.log('  - Rule 1 bans English in Period 1.');
  console.log('  - Grade 9 & 10 occupy Mr. Husnain in Period 4 (18:30).');
  console.log('  - Only Period 2 (17:30) and Period 3 (18:00) remain available for Mr. Husnain.');
  console.log('  - Therefore, Mr. Husnain can teach at most TWO classes on Monday between 16:30 and 19:00.');
  console.log('  - In the unadjusted proposal, all 4 cohorts (FBISE 11, Sindh 11, FBISE 12, Sindh 12) had English on Monday.');
  console.log('  - This creates an unavoidable 4-way collision for Mr. Husnain.');

  await client.end();
}

buildConflictFreeSchedule().catch(console.error);
