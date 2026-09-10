const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres'
});

// Timetable definition for all 8 cohorts:
// Period timings:
// P0: 16:30:00 - 17:00:00
// P1: 17:00:00 - 17:30:00
// P2: 17:30:00 - 18:00:00
// P3: 18:00:00 - 18:30:00
// P4: 18:30:00 - 19:00:00

const PERIOD_TIMES = {
  P0: { start: '16:30:00', end: '17:00:00' },
  P1: { start: '17:00:00', end: '17:30:00' },
  P2: { start: '17:30:00', end: '18:00:00' },
  P3: { start: '18:00:00', end: '18:30:00' },
  P4: { start: '18:30:00', end: '19:00:00' },
};

// Days: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri
const TIMETABLE_DATA = {
  fbise: {
    '9': [
      // Mon
      { day: 0, period: 'P0', subject: 'Islamiat' },
      { day: 0, period: 'P1', subject: 'Chemistry' },
      { day: 0, period: 'P2', subject: 'Mathematics' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'English' },
      // Tue
      { day: 1, period: 'P1', subject: 'Biology' },
      { day: 1, period: 'P2', subject: 'English' },
      { day: 1, period: 'P3', subject: 'Mathematics' },
      { day: 1, period: 'P4', subject: 'Physics' },
      // Wed
      { day: 2, period: 'P0', subject: 'Islamiat' },
      { day: 2, period: 'P1', subject: 'Chemistry' },
      { day: 2, period: 'P2', subject: 'Physics' },
      { day: 2, period: 'P3', subject: 'Urdu' },
      { day: 2, period: 'P4', subject: 'Mathematics' },
      // Thu
      { day: 3, period: 'P1', subject: 'Biology' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Physics' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri
      { day: 4, period: 'P0', subject: 'Islamiat' },
      { day: 4, period: 'P1', subject: 'Chemistry' },
      { day: 4, period: 'P2', subject: 'English' },
      { day: 4, period: 'P3', subject: 'Urdu' },
      { day: 4, period: 'P4', subject: 'Physics' },
    ],
    '10': [
      // Mon
      { day: 0, period: 'P1', subject: 'Biology' },
      { day: 0, period: 'P2', subject: 'Physics' },
      { day: 0, period: 'P3', subject: 'Mathematics' },
      { day: 0, period: 'P4', subject: 'English' },
      // Tue
      { day: 1, period: 'P0', subject: 'Islamiat' },
      { day: 1, period: 'P1', subject: 'Chemistry' },
      { day: 1, period: 'P2', subject: 'English' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Mathematics' },
      // Wed
      { day: 2, period: 'P1', subject: 'Biology' },
      { day: 2, period: 'P2', subject: 'Mathematics' },
      { day: 2, period: 'P3', subject: 'English' },
      { day: 2, period: 'P4', subject: 'Physics' },
      // Thu
      { day: 3, period: 'P0', subject: 'Islamiat' },
      { day: 3, period: 'P1', subject: 'Chemistry' },
      { day: 3, period: 'P2', subject: 'Physics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri
      { day: 4, period: 'P1', subject: 'Biology' },
      { day: 4, period: 'P2', subject: 'Mathematics' },
      { day: 4, period: 'P3', subject: 'Physics' },
      { day: 4, period: 'P4', subject: 'English' },
    ],
    '11': [
      // Mon
      { day: 0, period: 'P1', subject: 'Chemistry' },
      { day: 0, period: 'P2', subject: 'Mathematics' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'English' },
      // Tue
      { day: 1, period: 'P1', subject: 'Biology' },
      { day: 1, period: 'P2', subject: 'Physics' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Mathematics' },
      // Wed (Islamiat exception applies: P1)
      { day: 2, period: 'P1', subject: 'Islamiat' },
      { day: 2, period: 'P2', subject: 'English' },
      { day: 2, period: 'P3', subject: 'Mathematics' },
      { day: 2, period: 'P4', subject: 'Physics' },
      // Thu (Islamiat exception applies: P1)
      { day: 3, period: 'P1', subject: 'Islamiat' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri
      { day: 4, period: 'P1', subject: 'Chemistry' },
      { day: 4, period: 'P2', subject: 'Physics' },
      { day: 4, period: 'P3', subject: 'English' },
      { day: 4, period: 'P4', subject: 'Mathematics' },
    ],
    '12': [
      // Mon
      { day: 0, period: 'P1', subject: 'Biology' },
      { day: 0, period: 'P2', subject: 'English' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'Mathematics' },
      // Tue
      { day: 1, period: 'P0', subject: 'Islamiat' },
      { day: 1, period: 'P1', subject: 'Chemistry' },
      { day: 1, period: 'P2', subject: 'Mathematics' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Physics' },
      // Wed
      { day: 2, period: 'P1', subject: 'Biology' },
      { day: 2, period: 'P2', subject: 'Physics' },
      { day: 2, period: 'P3', subject: 'English' },
      { day: 2, period: 'P4', subject: 'Mathematics' },
      // Thu
      { day: 3, period: 'P0', subject: 'Islamiat' },
      { day: 3, period: 'P1', subject: 'Chemistry' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri
      { day: 4, period: 'P1', subject: 'Biology' },
      { day: 4, period: 'P2', subject: 'English' },
      { day: 4, period: 'P3', subject: 'Mathematics' },
      { day: 4, period: 'P4', subject: 'Physics' },
    ],
  },
  sindh: {
    '9': [
      // Mon
      { day: 0, period: 'P1', subject: 'Chemistry' },
      { day: 0, period: 'P2', subject: 'Mathematics' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'English' },
      // Tue
      { day: 1, period: 'P1', subject: 'Biology' },
      { day: 1, period: 'P2', subject: 'English' },
      { day: 1, period: 'P3', subject: 'Mathematics' },
      { day: 1, period: 'P4', subject: 'Physics' },
      // Wed
      { day: 2, period: 'P1', subject: 'Chemistry' },
      { day: 2, period: 'P2', subject: 'Physics' },
      { day: 2, period: 'P3', subject: 'Urdu' },
      { day: 2, period: 'P4', subject: 'Mathematics' },
      // Thu
      { day: 3, period: 'P1', subject: 'Biology' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Physics' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri
      { day: 4, period: 'P1', subject: 'Chemistry' },
      { day: 4, period: 'P2', subject: 'English' },
      { day: 4, period: 'P3', subject: 'Urdu' },
      { day: 4, period: 'P4', subject: 'Physics' },
    ],
    '10': [
      // Mon
      { day: 0, period: 'P1', subject: 'Biology' },
      { day: 0, period: 'P2', subject: 'Physics' },
      { day: 0, period: 'P3', subject: 'Mathematics' },
      { day: 0, period: 'P4', subject: 'English' },
      // Tue
      { day: 1, period: 'P1', subject: 'Chemistry' },
      { day: 1, period: 'P2', subject: 'English' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Mathematics' },
      // Wed
      { day: 2, period: 'P1', subject: 'Biology' },
      { day: 2, period: 'P2', subject: 'Mathematics' },
      { day: 2, period: 'P3', subject: 'English' },
      { day: 2, period: 'P4', subject: 'Physics' },
      // Thu
      { day: 3, period: 'P1', subject: 'Chemistry' },
      { day: 3, period: 'P2', subject: 'Physics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri
      { day: 4, period: 'P1', subject: 'Biology' },
      { day: 4, period: 'P2', subject: 'Mathematics' },
      { day: 4, period: 'P3', subject: 'Physics' },
      { day: 4, period: 'P4', subject: 'English' },
    ],
    '11': [
      // Mon
      { day: 0, period: 'P1', subject: 'Chemistry' },
      { day: 0, period: 'P2', subject: 'Mathematics' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'English' },
      // Tue
      { day: 1, period: 'P1', subject: 'Biology' },
      { day: 1, period: 'P2', subject: 'Physics' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Mathematics' },
      // Wed
      { day: 2, period: 'P1', subject: 'Chemistry' },
      { day: 2, period: 'P2', subject: 'English' },
      { day: 2, period: 'P3', subject: 'Mathematics' },
      { day: 2, period: 'P4', subject: 'Physics' },
      // Thu
      { day: 3, period: 'P1', subject: 'Biology' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri
      { day: 4, period: 'P1', subject: 'Chemistry' },
      { day: 4, period: 'P2', subject: 'Physics' },
      { day: 4, period: 'P3', subject: 'English' },
      { day: 4, period: 'P4', subject: 'Mathematics' },
    ],
    '12': [
      // Mon
      { day: 0, period: 'P1', subject: 'Biology' },
      { day: 0, period: 'P2', subject: 'English' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'Mathematics' },
      // Tue
      { day: 1, period: 'P1', subject: 'Chemistry' },
      { day: 1, period: 'P2', subject: 'Mathematics' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Physics' },
      // Wed
      { day: 2, period: 'P1', subject: 'Biology' },
      { day: 2, period: 'P2', subject: 'Physics' },
      { day: 2, period: 'P3', subject: 'English' },
      { day: 2, period: 'P4', subject: 'Mathematics' },
      // Thu
      { day: 3, period: 'P1', subject: 'Chemistry' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri
      { day: 4, period: 'P1', subject: 'Biology' },
      { day: 4, period: 'P2', subject: 'English' },
      { day: 4, period: 'P3', subject: 'Mathematics' },
      { day: 4, period: 'P4', subject: 'Physics' },
    ],
  },
};

async function seedTimetables() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL database.');

  let totalInserted = 0;
  const boardKeys = ['fbise', 'sindh'];

  for (const board of boardKeys) {
    const grades = ['9', '10', '11', '12'];
    for (const grade of grades) {
      console.log(`\n========================================`);
      console.log(`Processing ${board.toUpperCase()} Grade ${grade}...`);

      // 1. Fetch class record
      const classRes = await client.query(
        'SELECT id, display_name FROM public.classes WHERE board_id = $1 AND grade = $2',
        [board, grade]
      );
      if (classRes.rows.length === 0) {
        console.error(`Class not found for board: ${board}, grade: ${grade}`);
        continue;
      }
      const classId = classRes.rows[0].id;

      // 2. Fetch class offerings mapped by subject name
      const offRes = await client.query(`
        SELECT co.id as offering_id, s.name as subject_name, co.teacher_id, t.full_name as teacher_name
        FROM public.class_offerings co
        JOIN public.subjects s ON co.subject_id = s.id
        LEFT JOIN public.teachers t ON co.teacher_id = t.id
        WHERE co.class_id = $1
      `, [classId]);

      const offeringMap = {};
      for (const row of offRes.rows) {
        offeringMap[row.subject_name.toLowerCase()] = row;
      }

      // 3. Clear existing slots for this class to ensure clean, exact state
      const delRes = await client.query(
        'DELETE FROM public.class_slots WHERE class_id = $1',
        [classId]
      );
      console.log(`Cleared ${delRes.rowCount} previous slots for ${board} ${grade}.`);

      // 4. Insert each defined slot
      const slotsToInsert = TIMETABLE_DATA[board][grade];
      for (const s of slotsToInsert) {
        const periodTiming = PERIOD_TIMES[s.period];
        const offObj = offeringMap[s.subject.toLowerCase()];

        if (!offObj) {
          console.error(`❌ Missing class offering for subject: ${s.subject} in ${board} ${grade}!`);
          continue;
        }

        await client.query(`
          INSERT INTO public.class_slots (
            class_id,
            offering_id,
            day_of_week,
            start_time,
            end_time,
            is_cancelled
          ) VALUES ($1, $2, $3, $4, $5, false)
        `, [
          classId,
          offObj.offering_id,
          s.day,
          periodTiming.start,
          periodTiming.end
        ]);
        totalInserted++;
      }
      console.log(`✅ Successfully seeded ${slotsToInsert.length} slots for ${board} Grade ${grade}.`);
    }
  }

  console.log(`\n🎉 Grand Total Slots Seeded: ${totalInserted}`);

  // Verification query
  const verifyRes = await client.query(`
    SELECT c.board_id, c.grade, count(cs.id) as slot_count
    FROM public.class_slots cs
    JOIN public.classes c ON cs.class_id = c.id
    WHERE c.board_id IN ('fbise', 'sindh')
    GROUP BY c.board_id, c.grade
    ORDER BY c.board_id, CAST(c.grade AS INTEGER)
  `);
  console.log('\n--- Final Slot Counts by Cohort ---');
  console.table(verifyRes.rows);

  await client.end();
}

seedTimetables().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
