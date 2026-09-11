const { Client } = require('pg');

const DB_URL = process.env.SUPABASE_DB_URL || 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres';

const PERIOD_TIMES = {
  P0: { start: '16:30:00', end: '17:00:00' },
  P1: { start: '17:00:00', end: '17:30:00' },
  P2: { start: '17:30:00', end: '18:00:00' },
  P3: { start: '18:00:00', end: '18:30:00' },
  P4: { start: '18:30:00', end: '19:00:00' },
  P5: { start: '19:00:00', end: '19:30:00' },
  P6: { start: '19:30:00', end: '20:10:00' },
};

// Teacher assignments for offerings
const TEACHER_MAP = {
  'Mr. Husnain': '5c3af2c8-bce7-4925-b205-235b34e44d6d',
  'Mr. Subhan': 'c518cb05-db67-4bf5-b956-17ecfea6d237',
  'Ms. Falak': '7f5cd1fc-b7e2-4dfa-853f-10ef29ec136e',
  'Ms. Khadija': '9f5c1b46-90eb-434e-984e-89ece1f7387e',
  'Mr. Hashir': '6d998d0b-b45d-42cf-8b7b-c5b0c367474a',
  'Muhammad Hasnain Shoukat': '097f275c-2d5b-452b-acc6-a1f03f6a3e48',
};

// Proposed Schedule:
const TIMETABLES_G11_G12 = {
  fbise: {
    '11': [
      // Mon (0)
      { day: 0, period: 'P2', subject: 'Chemistry' },
      { day: 0, period: 'P3', subject: 'English' },
      { day: 0, period: 'P4', subject: 'Physics' },
      { day: 0, period: 'P5', subject: 'Mathematics' },
      // Tue (1)
      { day: 1, period: 'P2', subject: 'Biology' },
      { day: 1, period: 'P3', subject: 'Physics' },
      { day: 1, period: 'P4', subject: 'Urdu' },
      { day: 1, period: 'P5', subject: 'Mathematics' },
      // Wed (2)
      { day: 2, period: 'P1', subject: 'Islamiat' },
      { day: 2, period: 'P2', subject: 'English' },
      { day: 2, period: 'P3', subject: 'Mathematics' },
      { day: 2, period: 'P5', subject: 'Physics' },
      // Thu (3)
      { day: 3, period: 'P1', subject: 'Islamiat' },
      { day: 3, period: 'P2', subject: 'English' },
      { day: 3, period: 'P3', subject: 'Mathematics' },
      { day: 3, period: 'P5', subject: 'Physics' },
      // Fri (4)
      { day: 4, period: 'P2', subject: 'Physics' },
      { day: 4, period: 'P3', subject: 'English' },
      { day: 4, period: 'P4', subject: 'Chemistry' },
      { day: 4, period: 'P5', subject: 'Mathematics' },
    ],
    '12': [
      // Mon (0)
      { day: 0, period: 'P2', subject: 'Biology' },
      { day: 0, period: 'P3', subject: 'Urdu' },
      { day: 0, period: 'P4', subject: 'Mathematics' },
      { day: 0, period: 'P5', subject: 'English' },
      // Tue (1)
      { day: 1, period: 'P0', subject: 'Islamiat' },
      { day: 1, period: 'P2', subject: 'Mathematics' },
      { day: 1, period: 'P3', subject: 'Chemistry' },
      { day: 1, period: 'P4', subject: 'English' },
      { day: 1, period: 'P5', subject: 'Physics' },
      // Wed (2)
      { day: 2, period: 'P2', subject: 'Chemistry' },
      { day: 2, period: 'P3', subject: 'Physics' },
      { day: 2, period: 'P4', subject: 'Biology' },
      { day: 2, period: 'P5', subject: 'Mathematics' },
      // Thu (3)
      { day: 3, period: 'P0', subject: 'Islamiat' },
      { day: 3, period: 'P2', subject: 'Chemistry' },
      { day: 3, period: 'P4', subject: 'Urdu' },
      { day: 3, period: 'P5', subject: 'Mathematics' },
      // Fri (4)
      { day: 4, period: 'P2', subject: 'Biology' },
      { day: 4, period: 'P3', subject: 'Chemistry' },
      { day: 4, period: 'P4', subject: 'Mathematics' },
      { day: 4, period: 'P5', subject: 'English' },
    ],
  },
  sindh: {
    '11': [
      // Mon (0)
      { day: 0, period: 'P2', subject: 'Chemistry' },
      { day: 0, period: 'P3', subject: 'English' },
      { day: 0, period: 'P4', subject: 'Physics' },
      // Note: P6 (19:30) Math is already in DB
      // Tue (1)
      { day: 1, period: 'P1', subject: 'Biology' },
      { day: 1, period: 'P3', subject: 'Physics' },
      { day: 1, period: 'P4', subject: 'Urdu' },
      // Wed (2)
      { day: 2, period: 'P2', subject: 'English' },
      { day: 2, period: 'P4', subject: 'Chemistry' },
      { day: 2, period: 'P5', subject: 'Physics' },
      // Thu (3)
      { day: 3, period: 'P1', subject: 'Biology' },
      { day: 3, period: 'P2', subject: 'English' },
      { day: 3, period: 'P5', subject: 'Physics' },
      // Fri (4)
      { day: 4, period: 'P2', subject: 'Physics' },
      { day: 4, period: 'P3', subject: 'English' },
      { day: 4, period: 'P4', subject: 'Chemistry' },
    ],
    '12': [
      // Mon (0)
      { day: 0, period: 'P2', subject: 'Biology' },
      { day: 0, period: 'P3', subject: 'Urdu' },
      { day: 0, period: 'P4', subject: 'Mathematics' },
      { day: 0, period: 'P5', subject: 'English' },
      // Tue (1)
      { day: 1, period: 'P2', subject: 'Mathematics' },
      { day: 1, period: 'P3', subject: 'Chemistry' },
      { day: 1, period: 'P4', subject: 'English' },
      { day: 1, period: 'P5', subject: 'Physics' },
      // Wed (2)
      { day: 2, period: 'P2', subject: 'Chemistry' },
      { day: 2, period: 'P3', subject: 'Physics' },
      { day: 2, period: 'P4', subject: 'Biology' },
      { day: 2, period: 'P5', subject: 'Mathematics' },
      // Thu (3)
      { day: 3, period: 'P2', subject: 'Chemistry' },
      { day: 3, period: 'P4', subject: 'Urdu' },
      { day: 3, period: 'P5', subject: 'Mathematics' },
      // Fri (4)
      { day: 4, period: 'P2', subject: 'Biology' },
      { day: 4, period: 'P3', subject: 'Chemistry' },
      { day: 4, period: 'P4', subject: 'Mathematics' },
      { day: 4, period: 'P5', subject: 'English' },
    ],
  },
};

async function seed() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('Connected to database...');

  // Step 1: Ensure offerings have appropriate teachers set
  const teacherSubjectMap = {
    fbise_11: {
      Mathematics: TEACHER_MAP['Mr. Hashir'],
      Physics: TEACHER_MAP['Muhammad Hasnain Shoukat'],
      Biology: TEACHER_MAP['Ms. Khadija'],
      Chemistry: TEACHER_MAP['Ms. Khadija'],
      English: TEACHER_MAP['Mr. Husnain'],
      Islamiat: TEACHER_MAP['Ms. Falak'],
      Urdu: TEACHER_MAP['Mr. Subhan'],
    },
    sindh_11: {
      Mathematics: TEACHER_MAP['Mr. Hashir'],
      Physics: TEACHER_MAP['Muhammad Hasnain Shoukat'],
      Biology: TEACHER_MAP['Mr. Subhan'],
      Chemistry: TEACHER_MAP['Ms. Khadija'],
      English: TEACHER_MAP['Mr. Husnain'],
      Urdu: TEACHER_MAP['Mr. Subhan'],
    },
    fbise_12: {
      Mathematics: TEACHER_MAP['Mr. Hashir'],
      Physics: TEACHER_MAP['Muhammad Hasnain Shoukat'],
      Biology: TEACHER_MAP['Mr. Subhan'],
      Chemistry: TEACHER_MAP['Ms. Khadija'],
      English: TEACHER_MAP['Mr. Husnain'],
      Islamiat: TEACHER_MAP['Ms. Falak'],
      Urdu: TEACHER_MAP['Mr. Subhan'],
    },
    sindh_12: {
      Mathematics: TEACHER_MAP['Mr. Hashir'],
      Physics: TEACHER_MAP['Muhammad Hasnain Shoukat'],
      Biology: TEACHER_MAP['Mr. Subhan'],
      Chemistry: TEACHER_MAP['Ms. Khadija'],
      English: TEACHER_MAP['Mr. Husnain'],
      Urdu: TEACHER_MAP['Mr. Subhan'],
    },
  };

  // Ensure FBISE 12 Islamiat offering exists
  const fbise12Res = await client.query("SELECT id FROM public.classes WHERE board_id = 'fbise' AND grade = '12'");
  const islamiatSub = await client.query("SELECT id FROM public.subjects WHERE name = 'Islamiat'");
  if (fbise12Res.rows.length > 0 && islamiatSub.rows.length > 0) {
    const existing = await client.query(
      "SELECT id FROM public.class_offerings WHERE class_id = $1 AND subject_id = $2",
      [fbise12Res.rows[0].id, islamiatSub.rows[0].id]
    );
    if (existing.rows.length === 0) {
      await client.query(
        "INSERT INTO public.class_offerings (class_id, subject_id, teacher_id) VALUES ($1, $2, $3)",
        [fbise12Res.rows[0].id, islamiatSub.rows[0].id, TEACHER_MAP['Ms. Falak']]
      );
      console.log('Created FBISE 12 Islamiat offering.');
    }
  }

  // Update teacher_id on all G11 and G12 offerings
  for (const [cohortKey, subjectTeachers] of Object.entries(teacherSubjectMap)) {
    const [board, grade] = cohortKey.split('_');
    const classRow = await client.query(
      "SELECT id FROM public.classes WHERE board_id = $1 AND grade = $2",
      [board, grade]
    );
    if (classRow.rows.length === 0) continue;
    const classId = classRow.rows[0].id;

    for (const [subjectName, teacherId] of Object.entries(subjectTeachers)) {
      await client.query(`
        UPDATE public.class_offerings co
        SET teacher_id = $1
        FROM public.subjects s
        WHERE co.class_id = $2 AND co.subject_id = s.id AND lower(trim(s.name)) = lower(trim($3))
      `, [teacherId, classId, subjectName]);
    }
  }
  console.log('Class offerings updated with correct teacher mappings.');

  // Step 2: Fetch all offerings for G11 & G12
  const offeringsRes = await client.query(`
    SELECT 
      co.id as offering_id,
      co.class_id,
      c.board_id,
      c.grade,
      s.name as subject_name
    FROM public.class_offerings co
    JOIN public.classes c ON co.class_id = c.id
    JOIN public.subjects s ON co.subject_id = s.id
    WHERE c.board_id IN ('fbise', 'sindh')
      AND c.grade IN ('11', '12')
  `);

  const offeringsMap = new Map();
  offeringsRes.rows.forEach(row => {
    const key = `${row.board_id}_${row.grade}_${row.subject_name.toLowerCase().trim()}`;
    offeringsMap.set(key, row);
  });

  // Step 3: Clear ONLY existing G11 & G12 slots (EXCEPT Sindh 11 Math at 19:30)
  // We leave Grade 9 and Grade 10 strictly UNTOUCHED!
  console.log('Clearing old G11 & G12 slots while preserving Grade 9, Grade 10, and Sindh 11 Math...');
  await client.query(`
    DELETE FROM public.class_slots cs
    USING public.classes c
    WHERE cs.class_id = c.id
      AND c.grade IN ('11', '12')
      AND c.board_id IN ('fbise', 'sindh')
      AND NOT (c.board_id = 'sindh' AND c.grade = '11' AND cs.start_time = '19:30:00')
  `);

  // Step 4: Insert Grade 11 and Grade 12 slots
  let inserted = 0;
  for (const board of ['fbise', 'sindh']) {
    for (const grade of ['11', '12']) {
      const cohortSlots = TIMETABLES_G11_G12[board][grade];
      if (!cohortSlots) continue;

      for (const item of cohortSlots) {
        const key = `${board}_${grade}_${item.subject.toLowerCase().trim()}`;
        const offering = offeringsMap.get(key);
        if (!offering) {
          console.error(`Offering not found for ${key}`);
          continue;
        }

        const period = PERIOD_TIMES[item.period];
        if (!period) {
          console.error(`Invalid period: ${item.period}`);
          continue;
        }

        await client.query(`
          INSERT INTO public.class_slots (offering_id, class_id, day_of_week, start_time, end_time, is_cancelled)
          VALUES ($1, $2, $3, $4, $5, false)
        `, [offering.offering_id, offering.class_id, item.day, period.start, period.end]);
        inserted++;
      }
    }
  }

  console.log(`Successfully inserted ${inserted} new slots for Grade 11 & Grade 12!`);

  // Step 5: Verification audit
  const summary = await client.query(`
    SELECT c.board_id, c.grade, count(cs.id) as slot_count
    FROM public.class_slots cs
    JOIN public.classes c ON cs.class_id = c.id
    GROUP BY c.board_id, c.grade
    ORDER BY c.board_id, c.grade
  `);
  console.log('--- DATABASE SLOTS SUMMARY ---');
  console.table(summary.rows);

  const total = await client.query('SELECT count(*) FROM public.class_slots');
  console.log('Total slots in DB:', total.rows[0].count);

  await client.end();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
