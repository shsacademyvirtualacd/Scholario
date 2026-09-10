const { Client } = require('pg');

const DB_URL = process.env.SUPABASE_DB_URL || 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres';

const PERIOD_TIMES = {
  P0: { start: '16:30:00', end: '17:00:00' },
  P1: { start: '17:00:00', end: '17:30:00' },
  P2: { start: '17:30:00', end: '18:00:00' },
  P3: { start: '18:00:00', end: '18:30:00' },
  P4: { start: '18:30:00', end: '19:00:00' },
};

// Days: 0 = Mon, 1 = Tue, 2 = Wed, 3 = Thu, 4 = Fri
const TIMETABLES = {
  fbise: {
    '9': [
      // Mon (0)
      { day: 0, period: 'P0', subject: 'Islamiat' },
      { day: 0, period: 'P1', subject: 'Chemistry' },
      { day: 0, period: 'P2', subject: 'Mathematics' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'English' },
      // Tue (1)
      { day: 1, period: 'P1', subject: 'Biology' },
      { day: 1, period: 'P2', subject: 'English' },
      { day: 1, period: 'P3', subject: 'Mathematics' },
      { day: 1, period: 'P4', subject: 'Physics' },
      // Wed (2)
      { day: 2, period: 'P0', subject: 'Islamiat' },
      { day: 2, period: 'P1', subject: 'Chemistry' },
      { day: 2, period: 'P2', subject: 'Physics' },
      { day: 2, period: 'P3', subject: 'Urdu' },
      { day: 2, period: 'P4', subject: 'Mathematics' },
      // Thu (3)
      { day: 3, period: 'P1', subject: 'Biology' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Physics' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri (4)
      { day: 4, period: 'P0', subject: 'Islamiat' },
      { day: 4, period: 'P1', subject: 'Chemistry' },
      { day: 4, period: 'P2', subject: 'English' },
      { day: 4, period: 'P3', subject: 'Urdu' },
      { day: 4, period: 'P4', subject: 'Physics' },
    ],
    '10': [
      // Mon (0)
      { day: 0, period: 'P1', subject: 'Biology' },
      { day: 0, period: 'P2', subject: 'Physics' },
      { day: 0, period: 'P3', subject: 'Mathematics' },
      { day: 0, period: 'P4', subject: 'English' },
      // Tue (1)
      { day: 1, period: 'P0', subject: 'Islamiat' },
      { day: 1, period: 'P1', subject: 'Chemistry' },
      { day: 1, period: 'P2', subject: 'English' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Mathematics' },
      // Wed (2)
      { day: 2, period: 'P1', subject: 'Biology' },
      { day: 2, period: 'P2', subject: 'Mathematics' },
      { day: 2, period: 'P3', subject: 'English' },
      { day: 2, period: 'P4', subject: 'Physics' },
      // Thu (3)
      { day: 3, period: 'P0', subject: 'Islamiat' },
      { day: 3, period: 'P1', subject: 'Chemistry' },
      { day: 3, period: 'P2', subject: 'Physics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri (4)
      { day: 4, period: 'P1', subject: 'Biology' },
      { day: 4, period: 'P2', subject: 'Mathematics' },
      { day: 4, period: 'P3', subject: 'Physics' },
      { day: 4, period: 'P4', subject: 'English' },
    ],
    '11': [
      // Mon (0)
      { day: 0, period: 'P1', subject: 'Chemistry' },
      { day: 0, period: 'P2', subject: 'Mathematics' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'English' },
      // Tue (1)
      { day: 1, period: 'P1', subject: 'Biology' },
      { day: 1, period: 'P2', subject: 'Physics' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Mathematics' },
      // Wed (2) - Islamiat P1 exception
      { day: 2, period: 'P1', subject: 'Islamiat' },
      { day: 2, period: 'P2', subject: 'English' },
      { day: 2, period: 'P3', subject: 'Mathematics' },
      { day: 2, period: 'P4', subject: 'Physics' },
      // Thu (3) - Islamiat P1 exception
      { day: 3, period: 'P1', subject: 'Islamiat' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri (4)
      { day: 4, period: 'P1', subject: 'Chemistry' },
      { day: 4, period: 'P2', subject: 'Physics' },
      { day: 4, period: 'P3', subject: 'English' },
      { day: 4, period: 'P4', subject: 'Mathematics' },
    ],
    '12': [
      // Mon (0)
      { day: 0, period: 'P1', subject: 'Biology' },
      { day: 0, period: 'P2', subject: 'English' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'Mathematics' },
      // Tue (1)
      { day: 1, period: 'P0', subject: 'Islamiat' },
      { day: 1, period: 'P1', subject: 'Chemistry' },
      { day: 1, period: 'P2', subject: 'Mathematics' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Physics' },
      // Wed (2)
      { day: 2, period: 'P1', subject: 'Biology' },
      { day: 2, period: 'P2', subject: 'Physics' },
      { day: 2, period: 'P3', subject: 'English' },
      { day: 2, period: 'P4', subject: 'Mathematics' },
      // Thu (3)
      { day: 3, period: 'P0', subject: 'Islamiat' },
      { day: 3, period: 'P1', subject: 'Chemistry' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri (4)
      { day: 4, period: 'P1', subject: 'Biology' },
      { day: 4, period: 'P2', subject: 'English' },
      { day: 4, period: 'P3', subject: 'Mathematics' },
      { day: 4, period: 'P4', subject: 'Physics' },
    ],
  },
  sindh: {
    '9': [
      // Mon (0)
      { day: 0, period: 'P1', subject: 'Chemistry' },
      { day: 0, period: 'P2', subject: 'Mathematics' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'English' },
      // Tue (1)
      { day: 1, period: 'P1', subject: 'Biology' },
      { day: 1, period: 'P2', subject: 'English' },
      { day: 1, period: 'P3', subject: 'Mathematics' },
      { day: 1, period: 'P4', subject: 'Physics' },
      // Wed (2)
      { day: 2, period: 'P1', subject: 'Chemistry' },
      { day: 2, period: 'P2', subject: 'Physics' },
      { day: 2, period: 'P3', subject: 'Urdu' },
      { day: 2, period: 'P4', subject: 'Mathematics' },
      // Thu (3)
      { day: 3, period: 'P1', subject: 'Biology' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Physics' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri (4)
      { day: 4, period: 'P1', subject: 'Chemistry' },
      { day: 4, period: 'P2', subject: 'English' },
      { day: 4, period: 'P3', subject: 'Urdu' },
      { day: 4, period: 'P4', subject: 'Physics' },
    ],
    '10': [
      // Mon (0)
      { day: 0, period: 'P1', subject: 'Biology' },
      { day: 0, period: 'P2', subject: 'Physics' },
      { day: 0, period: 'P3', subject: 'Mathematics' },
      { day: 0, period: 'P4', subject: 'English' },
      // Tue (1)
      { day: 1, period: 'P1', subject: 'Chemistry' },
      { day: 1, period: 'P2', subject: 'English' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Mathematics' },
      // Wed (2)
      { day: 2, period: 'P1', subject: 'Biology' },
      { day: 2, period: 'P2', subject: 'Mathematics' },
      { day: 2, period: 'P3', subject: 'English' },
      { day: 2, period: 'P4', subject: 'Physics' },
      // Thu (3)
      { day: 3, period: 'P1', subject: 'Chemistry' },
      { day: 3, period: 'P2', subject: 'Physics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri (4)
      { day: 4, period: 'P1', subject: 'Biology' },
      { day: 4, period: 'P2', subject: 'Mathematics' },
      { day: 4, period: 'P3', subject: 'Physics' },
      { day: 4, period: 'P4', subject: 'English' },
    ],
    '11': [
      // Mon (0)
      { day: 0, period: 'P1', subject: 'Chemistry' },
      { day: 0, period: 'P2', subject: 'Mathematics' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'English' },
      // Tue (1)
      { day: 1, period: 'P1', subject: 'Biology' },
      { day: 1, period: 'P2', subject: 'Physics' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Mathematics' },
      // Wed (2)
      { day: 2, period: 'P1', subject: 'Chemistry' },
      { day: 2, period: 'P2', subject: 'English' },
      { day: 2, period: 'P3', subject: 'Mathematics' },
      { day: 2, period: 'P4', subject: 'Physics' },
      // Thu (3)
      { day: 3, period: 'P1', subject: 'Biology' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri (4)
      { day: 4, period: 'P1', subject: 'Chemistry' },
      { day: 4, period: 'P2', subject: 'Physics' },
      { day: 4, period: 'P3', subject: 'English' },
      { day: 4, period: 'P4', subject: 'Mathematics' },
    ],
    '12': [
      // Mon (0)
      { day: 0, period: 'P1', subject: 'Biology' },
      { day: 0, period: 'P2', subject: 'English' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'Mathematics' },
      // Tue (1)
      { day: 1, period: 'P1', subject: 'Chemistry' },
      { day: 1, period: 'P2', subject: 'Mathematics' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Physics' },
      // Wed (2)
      { day: 2, period: 'P1', subject: 'Biology' },
      { day: 2, period: 'P2', subject: 'Physics' },
      { day: 2, period: 'P3', subject: 'English' },
      { day: 2, period: 'P4', subject: 'Mathematics' },
      // Thu (3)
      { day: 3, period: 'P1', subject: 'Chemistry' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri (4)
      { day: 4, period: 'P1', subject: 'Biology' },
      { day: 4, period: 'P2', subject: 'English' },
      { day: 4, period: 'P3', subject: 'Mathematics' },
      { day: 4, period: 'P4', subject: 'Physics' },
    ],
  },
};

async function seed() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  console.log('Connected to database for timetable seeding...');

  // Step 1: Ensure FBISE Grade 12 Islamiat offering exists
  const fbise12ClassRes = await client.query("SELECT id FROM public.classes WHERE board_id = 'fbise' AND grade = '12'");
  const islamiatSubRes = await client.query("SELECT id FROM public.subjects WHERE name = 'Islamiat'");
  
  if (fbise12ClassRes.rows.length > 0 && islamiatSubRes.rows.length > 0) {
    const classId = fbise12ClassRes.rows[0].id;
    const subjectId = islamiatSubRes.rows[0].id;

    const existingOff = await client.query(
      "SELECT id FROM public.class_offerings WHERE class_id = $1 AND subject_id = $2",
      [classId, subjectId]
    );

    if (existingOff.rows.length === 0) {
      console.log('Creating FBISE Grade 12 Islamiat offering...');
      await client.query(
        "INSERT INTO public.class_offerings (class_id, subject_id, teacher_id) VALUES ($1, $2, NULL)",
        [classId, subjectId]
      );
    }
  }

  // Step 2: Fetch all offerings mapped by board + grade + subject
  const allOffRes = await client.query(`
    SELECT 
      co.id as offering_id,
      co.class_id,
      co.teacher_id,
      c.board_id,
      c.grade,
      s.name as subject_name
    FROM public.class_offerings co
    JOIN public.classes c ON co.class_id = c.id
    JOIN public.subjects s ON co.subject_id = s.id
    WHERE c.board_id IN ('fbise', 'sindh')
      AND c.grade IN ('9', '10', '11', '12')
  `);

  const offeringsMap = new Map();
  allOffRes.rows.forEach((row) => {
    const key = `${row.board_id}_${row.grade}_${row.subject_name.toLowerCase().trim()}`;
    offeringsMap.set(key, row);
  });

  // Step 3: Delete existing slots for these 8 classes to avoid old test duplicates
  const targetClassIds = (await client.query(`
    SELECT id FROM public.classes 
    WHERE board_id IN ('fbise', 'sindh') AND grade IN ('9', '10', '11', '12')
  `)).rows.map(r => r.id);

  console.log(`Clearing existing slots for ${targetClassIds.length} cohorts...`);
  await client.query(`
    DELETE FROM public.class_slots 
    WHERE offering_id IN (
      SELECT id FROM public.class_offerings WHERE class_id = ANY($1)
    ) OR class_id = ANY($1)
  `, [targetClassIds]);

  // Step 4: Insert all slots
  let insertedCount = 0;
  const insertValues = [];

  for (const board of ['fbise', 'sindh']) {
    for (const grade of ['9', '10', '11', '12']) {
      const schedule = TIMETABLES[board][grade];
      if (!schedule) continue;

      for (const item of schedule) {
        const key = `${board}_${grade}_${item.subject.toLowerCase().trim()}`;
        const offering = offeringsMap.get(key);

        if (!offering) {
          console.error(`Missing offering for key: ${key}`);
          continue;
        }

        const period = PERIOD_TIMES[item.period];
        if (!period) {
          console.error(`Invalid period: ${item.period}`);
          continue;
        }

        insertValues.push({
          offering_id: offering.offering_id,
          class_id: offering.class_id,
          day_of_week: item.day,
          start_time: period.start,
          end_time: period.end,
          is_cancelled: false,
        });
      }
    }
  }

  console.log(`Inserting ${insertValues.length} slots...`);
  for (const slot of insertValues) {
    await client.query(`
      INSERT INTO public.class_slots (offering_id, class_id, day_of_week, start_time, end_time, is_cancelled)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [slot.offering_id, slot.class_id, slot.day_of_week, slot.start_time, slot.end_time, slot.is_cancelled]);
    insertedCount++;
  }

  console.log(`Successfully seeded ${insertedCount} class slots across 8 cohorts!`);

  // Step 5: Verification query
  const countRes = await client.query(`
    SELECT c.board_id, c.grade, count(cs.id) as slot_count
    FROM public.class_slots cs
    JOIN public.class_offerings co ON cs.offering_id = co.id
    JOIN public.classes c ON co.class_id = c.id
    GROUP BY c.board_id, c.grade
    ORDER BY c.board_id, CAST(c.grade AS INTEGER)
  `);
  console.log('--- SEEDED SLOTS SUMMARY ---');
  console.table(countRes.rows);

  await client.end();
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
