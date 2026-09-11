const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres'
});

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Let's write a test script that validates candidate schedules for all days
async function validateAllDays() {
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

  const PERIOD_TIMES = {
    P0: '16:30:00',
    P1: '17:00:00',
    P2: '17:30:00',
    P3: '18:00:00',
    P4: '18:30:00',
    P5: '19:00:00',
    P6: '19:30:00',
  };

  // Proposed timetable:
  const schedule = [
    // ==========================================
    // MONDAY (Day 0)
    // ==========================================
    // FBISE 11:
    { day: 0, period: 'P2', cohort: 'fbise_11', subject: 'Chemistry', teacher: 'Ms. Khadija' },
    { day: 0, period: 'P3', cohort: 'fbise_11', subject: 'English', teacher: 'Mr. Husnain' },
    { day: 0, period: 'P4', cohort: 'fbise_11', subject: 'Physics', teacher: 'Muhammad Hasnain Shoukat' },
    { day: 0, period: 'P5', cohort: 'fbise_11', subject: 'Mathematics', teacher: 'Mr. Hashir' },

    // SINDH 11:
    { day: 0, period: 'P2', cohort: 'sindh_11', subject: 'Chemistry', teacher: 'Ms. Khadija' },
    { day: 0, period: 'P3', cohort: 'sindh_11', subject: 'English', teacher: 'Mr. Husnain' },
    { day: 0, period: 'P4', cohort: 'sindh_11', subject: 'Physics', teacher: 'Muhammad Hasnain Shoukat' },
    // Sindh 11 Math is at P6 (19:30)

    // FBISE 12:
    { day: 0, period: 'P2', cohort: 'fbise_12', subject: 'Biology', teacher: 'Mr. Subhan' },
    { day: 0, period: 'P3', cohort: 'fbise_12', subject: 'Urdu', teacher: 'Mr. Subhan' },
    { day: 0, period: 'P4', cohort: 'fbise_12', subject: 'Mathematics', teacher: 'Mr. Hashir' },
    { day: 0, period: 'P5', cohort: 'fbise_12', subject: 'English', teacher: 'Mr. Husnain' },

    // SINDH 12:
    { day: 0, period: 'P2', cohort: 'sindh_12', subject: 'Biology', teacher: 'Mr. Subhan' },
    { day: 0, period: 'P3', cohort: 'sindh_12', subject: 'Urdu', teacher: 'Mr. Subhan' },
    { day: 0, period: 'P4', cohort: 'sindh_12', subject: 'Mathematics', teacher: 'Mr. Hashir' },
    { day: 0, period: 'P5', cohort: 'sindh_12', subject: 'English', teacher: 'Mr. Husnain' },

    // ==========================================
    // TUESDAY (Day 1)
    // ==========================================
    // FBISE 11:
    { day: 1, period: 'P2', cohort: 'fbise_11', subject: 'Biology', teacher: 'Ms. Khadija' },
    { day: 1, period: 'P3', cohort: 'fbise_11', subject: 'Physics', teacher: 'Muhammad Hasnain Shoukat' },
    { day: 1, period: 'P4', cohort: 'fbise_11', subject: 'Urdu', teacher: 'Mr. Subhan' },
    { day: 1, period: 'P5', cohort: 'fbise_11', subject: 'Mathematics', teacher: 'Mr. Hashir' },

    // SINDH 11:
    { day: 1, period: 'P1', cohort: 'sindh_11', subject: 'Biology', teacher: 'Mr. Subhan' },
    { day: 1, period: 'P3', cohort: 'sindh_11', subject: 'Physics', teacher: 'Muhammad Hasnain Shoukat' },
    { day: 1, period: 'P4', cohort: 'sindh_11', subject: 'Urdu', teacher: 'Mr. Subhan' },
    // Sindh 11 Math is at P6 (19:30)

    // FBISE 12:
    { day: 1, period: 'P0', cohort: 'fbise_12', subject: 'Islamiat', teacher: 'Ms. Falak' },
    { day: 1, period: 'P2', cohort: 'fbise_12', subject: 'Mathematics', teacher: 'Mr. Hashir' },
    { day: 1, period: 'P3', cohort: 'fbise_12', subject: 'Chemistry', teacher: 'Ms. Khadija' },
    { day: 1, period: 'P4', cohort: 'fbise_12', subject: 'English', teacher: 'Mr. Husnain' },
    { day: 1, period: 'P5', cohort: 'fbise_12', subject: 'Physics', teacher: 'Muhammad Hasnain Shoukat' },

    // SINDH 12:
    { day: 1, period: 'P2', cohort: 'sindh_12', subject: 'Mathematics', teacher: 'Mr. Hashir' },
    { day: 1, period: 'P3', cohort: 'sindh_12', subject: 'Chemistry', teacher: 'Ms. Khadija' },
    { day: 1, period: 'P4', cohort: 'sindh_12', subject: 'English', teacher: 'Mr. Husnain' },
    { day: 1, period: 'P5', cohort: 'sindh_12', subject: 'Physics', teacher: 'Muhammad Hasnain Shoukat' },

    // ==========================================
    // WEDNESDAY (Day 2)
    // ==========================================
    // Note: On Wed, Ms. Falak has FBISE 9 Islamiat at P0 (16:30)!
    // FBISE 11 takes Islamiat in P1 (17:00) using the verified Wednesday exception!
    // FBISE 11:
    { day: 2, period: 'P1', cohort: 'fbise_11', subject: 'Islamiat', teacher: 'Ms. Falak' },
    { day: 2, period: 'P2', cohort: 'fbise_11', subject: 'English', teacher: 'Mr. Husnain' },
    { day: 2, period: 'P3', cohort: 'fbise_11', subject: 'Mathematics', teacher: 'Mr. Hashir' },
    { day: 2, period: 'P5', cohort: 'fbise_11', subject: 'Physics', teacher: 'Muhammad Hasnain Shoukat' },

    // SINDH 11:
    { day: 2, period: 'P2', cohort: 'sindh_11', subject: 'English', teacher: 'Mr. Husnain' },
    { day: 2, period: 'P4', cohort: 'sindh_11', subject: 'Chemistry', teacher: 'Ms. Khadija' },
    { day: 2, period: 'P5', cohort: 'sindh_11', subject: 'Physics', teacher: 'Muhammad Hasnain Shoukat' },
    // Sindh 11 Math is at P6 (19:30)

    // FBISE 12:
    { day: 2, period: 'P2', cohort: 'fbise_12', subject: 'Chemistry', teacher: 'Ms. Khadija' },
    { day: 2, period: 'P3', cohort: 'fbise_12', subject: 'Physics', teacher: 'Muhammad Hasnain Shoukat' },
    { day: 2, period: 'P4', cohort: 'fbise_12', subject: 'Biology', teacher: 'Mr. Subhan' },
    { day: 2, period: 'P5', cohort: 'fbise_12', subject: 'Mathematics', teacher: 'Mr. Hashir' },

    // SINDH 12:
    { day: 2, period: 'P2', cohort: 'sindh_12', subject: 'Chemistry', teacher: 'Ms. Khadija' },
    { day: 2, period: 'P3', cohort: 'sindh_12', subject: 'Physics', teacher: 'Muhammad Hasnain Shoukat' },
    { day: 2, period: 'P4', cohort: 'sindh_12', subject: 'Biology', teacher: 'Mr. Subhan' },
    { day: 2, period: 'P5', cohort: 'sindh_12', subject: 'Mathematics', teacher: 'Mr. Hashir' },

    // ==========================================
    // THURSDAY (Day 3)
    // ==========================================
    // FBISE 11 takes Islamiat in P1 (17:00) using the verified Thursday exception!
    // FBISE 11:
    { day: 3, period: 'P1', cohort: 'fbise_11', subject: 'Islamiat', teacher: 'Ms. Falak' },
    { day: 3, period: 'P2', cohort: 'fbise_11', subject: 'English', teacher: 'Mr. Husnain' },
    { day: 3, period: 'P3', cohort: 'fbise_11', subject: 'Mathematics', teacher: 'Mr. Hashir' },
    { day: 3, period: 'P5', cohort: 'fbise_11', subject: 'Physics', teacher: 'Muhammad Hasnain Shoukat' },

    // SINDH 11:
    { day: 3, period: 'P1', cohort: 'sindh_11', subject: 'Biology', teacher: 'Mr. Subhan' },
    { day: 3, period: 'P2', cohort: 'sindh_11', subject: 'English', teacher: 'Mr. Husnain' },
    { day: 3, period: 'P5', cohort: 'sindh_11', subject: 'Physics', teacher: 'Muhammad Hasnain Shoukat' },
    // Sindh 11 Math is at P6 (19:30)

    // FBISE 12:
    { day: 3, period: 'P0', cohort: 'fbise_12', subject: 'Islamiat', teacher: 'Ms. Falak' },
    { day: 3, period: 'P2', cohort: 'fbise_12', subject: 'Chemistry', teacher: 'Ms. Khadija' },
    { day: 3, period: 'P4', cohort: 'fbise_12', subject: 'Urdu', teacher: 'Mr. Subhan' },
    { day: 3, period: 'P5', cohort: 'fbise_12', subject: 'Mathematics', teacher: 'Mr. Hashir' },

    // SINDH 12:
    { day: 3, period: 'P2', cohort: 'sindh_12', subject: 'Chemistry', teacher: 'Ms. Khadija' },
    { day: 3, period: 'P4', cohort: 'sindh_12', subject: 'Urdu', teacher: 'Mr. Subhan' },
    { day: 3, period: 'P5', cohort: 'sindh_12', subject: 'Mathematics', teacher: 'Mr. Hashir' },

    // ==========================================
    // FRIDAY (Day 4)
    // ==========================================
    // FBISE 11:
    { day: 4, period: 'P2', cohort: 'fbise_11', subject: 'Physics', teacher: 'Muhammad Hasnain Shoukat' },
    { day: 4, period: 'P3', cohort: 'fbise_11', subject: 'English', teacher: 'Mr. Husnain' },
    { day: 4, period: 'P4', cohort: 'fbise_11', subject: 'Chemistry', teacher: 'Ms. Khadija' },
    { day: 4, period: 'P5', cohort: 'fbise_11', subject: 'Mathematics', teacher: 'Mr. Hashir' },

    // SINDH 11:
    { day: 4, period: 'P2', cohort: 'sindh_11', subject: 'Physics', teacher: 'Muhammad Hasnain Shoukat' },
    { day: 4, period: 'P3', cohort: 'sindh_11', subject: 'English', teacher: 'Mr. Husnain' },
    { day: 4, period: 'P4', cohort: 'sindh_11', subject: 'Chemistry', teacher: 'Ms. Khadija' },
    // Sindh 11 Math is at P6 (19:30)

    // FBISE 12:
    // P2 (17:30): Khadija is free -> Chemistry (or Math/Phys on other days)
    // P3 (18:00): Husnain is free (wait, Husnain is teaching G11 English at P3) -> so G12 cannot take English at P3!
    // Let's check who is free at P2, P3, P4, P5 on Friday:
    // P2 (17:30): G9/G10 has Husnain & Hashir. Free: Hasnain Shoukat, Khadija, Subhan.
    // P3 (18:00): G9/G10 has Subhan, Hashir, Hasnain Shoukat. Free: Husnain, Khadija.
    // P4 (18:30): G9/G10 has Hasnain Shoukat, Husnain. Free: Hashir, Khadija, Subhan.
    // P5 (19:00): All free!
    { day: 4, period: 'P2', cohort: 'fbise_12', subject: 'Biology', teacher: 'Mr. Subhan' },
    { day: 4, period: 'P3', cohort: 'fbise_12', subject: 'Chemistry', teacher: 'Ms. Khadija' },
    { day: 4, period: 'P4', cohort: 'fbise_12', subject: 'Mathematics', teacher: 'Mr. Hashir' },
    { day: 4, period: 'P5', cohort: 'fbise_12', subject: 'English', teacher: 'Mr. Husnain' },

    // SINDH 12:
    { day: 4, period: 'P2', cohort: 'sindh_12', subject: 'Biology', teacher: 'Mr. Subhan' },
    { day: 4, period: 'P3', cohort: 'sindh_12', subject: 'Chemistry', teacher: 'Ms. Khadija' },
    { day: 4, period: 'P4', cohort: 'sindh_12', subject: 'Mathematics', teacher: 'Mr. Hashir' },
    { day: 4, period: 'P5', cohort: 'sindh_12', subject: 'English', teacher: 'Mr. Husnain' },
  ];

  console.log(`Checking proposed schedule against active slots & hard rules...`);

  const allSlots = [];
  for (const r of activeRes.rows) {
    allSlots.push({
      source: `ACTIVE: ${r.board_id} G${r.grade} ${r.subject_name}`,
      teacher: r.teacher_name,
      day: r.day_of_week,
      time: r.start_time,
      cohort: `${r.board_id}_${r.grade}`,
      isActive: true,
    });
  }

  for (const s of schedule) {
    allSlots.push({
      source: `PROPOSED: ${s.cohort} ${s.subject}`,
      teacher: s.teacher,
      day: s.day,
      time: PERIOD_TIMES[s.period],
      cohort: s.cohort,
      subject: s.subject,
      period: s.period,
      isActive: false,
    });
  }

  let conflicts = 0;
  for (let i = 0; i < allSlots.length; i++) {
    for (let j = i + 1; j < allSlots.length; j++) {
      const a = allSlots[i];
      const b = allSlots[j];

      // Ignore active vs active (Grade 9/10 baseline)
      if (a.isActive && b.isActive) continue;

      if (a.day === b.day && a.time === b.time) {
        // Double booking check:
        // Cohorts of same grade sharing joint lectures:
        const isJoint11 = (a.cohort === 'fbise_11' && b.cohort === 'sindh_11' && a.subject === b.subject) ||
                          (b.cohort === 'fbise_11' && a.cohort === 'sindh_11' && a.subject === b.subject);
        const isJoint12 = (a.cohort === 'fbise_12' && b.cohort === 'sindh_12' && a.subject === b.subject) ||
                          (b.cohort === 'fbise_12' && a.cohort === 'sindh_12' && a.subject === b.subject);

        if (a.teacher && b.teacher && a.teacher === b.teacher && !isJoint11 && !isJoint12) {
          conflicts++;
          console.error(`[CONFLICT] Teacher ${a.teacher} double-booked on ${DAY_NAMES[a.day]} at ${a.time} between:\n  1) ${a.source}\n  2) ${b.source}`);
        }

        // Cohort collision (same cohort having two classes at once)
        if (a.cohort === b.cohort) {
          conflicts++;
          console.error(`[COHORT COLLISION] ${a.cohort} on ${DAY_NAMES[a.day]} at ${a.time} between ${a.source} and ${b.source}`);
        }
      }
    }
  }

  // Hard constraints check:
  for (const s of schedule) {
    const sub = s.subject.toLowerCase();
    if (s.period === 'P1' && ['physics', 'mathematics', 'english'].includes(sub)) {
      conflicts++;
      console.error(`Rule 1 violation: ${s.cohort} ${s.subject} in P1`);
    }
    if (['P1', 'P2'].includes(s.period) && sub === 'urdu') {
      conflicts++;
      console.error(`Rule 2 violation: ${s.cohort} Urdu in ${s.period}`);
    }
    if (sub === 'islamiat' && !s.cohort.startsWith('fbise')) {
      conflicts++;
      console.error(`Rule 3 violation: Sindh has Islamiat`);
    }
    if (sub === 'islamiat') {
      if (s.cohort === 'fbise_11' && (s.day === 2 || s.day === 3) && s.period === 'P1') {
        // Exception ok
      } else if (s.period !== 'P0') {
        conflicts++;
        console.error(`Rule 4 violation: ${s.cohort} Islamiat in ${s.period}`);
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`TOTAL CONFLICTS DETECTED: ${conflicts}`);
  console.log(`======================================================\n`);

  // Count subjects per cohort
  const counts = {};
  for (const s of schedule) {
    if (!counts[s.cohort]) counts[s.cohort] = {};
    counts[s.cohort][s.subject] = (counts[s.cohort][s.subject] || 0) + 1;
  }
  // Add Sindh 11 Math (5x)
  if (counts['sindh_11']) {
    counts['sindh_11']['Mathematics'] = 5;
  }

  console.log('--- WEEKLY SUBJECT FREQUENCIES PER COHORT ---');
  for (const c of Object.keys(counts).sort()) {
    console.log(`\nCohort: ${c}`);
    let total = 0;
    for (const [sub, cnt] of Object.entries(counts[c])) {
      console.log(`  - ${sub}: ${cnt}x / week`);
      total += cnt;
    }
    console.log(`  Total weekly classes: ${total}`);
  }

  // Calculate daily start and end times
  console.log('\n--- DAILY TIME RANGE PER COHORT ---');
  const cohorts = ['fbise_11', 'sindh_11', 'fbise_12', 'sindh_12'];
  for (const c of cohorts) {
    console.log(`\nCohort: ${c.toUpperCase()}`);
    for (let d = 0; d < 5; d++) {
      let slots = schedule.filter(s => s.cohort === c && s.day === d);
      if (c === 'sindh_11') {
        slots.push({ day: d, period: 'P6', subject: 'Mathematics', teacher: 'Mr. Hashir' });
      }
      if (slots.length === 0) {
        console.log(`  ${DAY_NAMES[d]}: OFF`);
      } else {
        slots.sort((a, b) => PERIOD_TIMES[a.period].localeCompare(PERIOD_TIMES[b.period]));
        const start = PERIOD_TIMES[slots[0].period];
        const endPeriod = slots[slots.length - 1].period;
        let end = '';
        if (endPeriod === 'P0') end = '17:00:00';
        else if (endPeriod === 'P1') end = '17:30:00';
        else if (endPeriod === 'P2') end = '18:00:00';
        else if (endPeriod === 'P3') end = '18:30:00';
        else if (endPeriod === 'P4') end = '19:00:00';
        else if (endPeriod === 'P5') end = '19:30:00';
        else if (endPeriod === 'P6') end = '20:10:00';
        console.log(`  ${DAY_NAMES[d]}: ${start.slice(0, 5)} - ${end.slice(0, 5)} (${slots.map(s => s.subject).join(', ')})`);
      }
    }
  }

  await client.end();
}

validateAllDays().catch(console.error);
