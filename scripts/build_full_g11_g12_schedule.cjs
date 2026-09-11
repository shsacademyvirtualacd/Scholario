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
  P6: { start: '19:30:00', end: '20:10:00' }, // Pre-existing Sindh 11 Math
};

async function testTimetable() {
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

  // Define candidate schedule for G11 and G12 (FBISE 11, Sindh 11, FBISE 12, Sindh 12)
  // Let's test a clean, coherent schedule where every single teacher is verified against active slots and each other.

  const proposedSlots = [
    // ================= MONDAY (Day 0) =================
    // FBISE 11:
    { day: 0, period: 'P2', cohort: 'fbise_11', subject: 'Chemistry', teacher: 'Ms. Khadija' },
    { day: 0, period: 'P3', cohort: 'fbise_11', subject: 'English', teacher: 'Mr. Husnain' },
    { day: 0, period: 'P4', cohort: 'fbise_11', subject: 'Physics', teacher: 'Muhammad Hasnain Shoukat' },
    { day: 0, period: 'P5', cohort: 'fbise_11', subject: 'Mathematics', teacher: 'Mr. Hashir' },

    // SINDH 11:
    { day: 0, period: 'P2', cohort: 'sindh_11', subject: 'Chemistry', teacher: 'Ms. Khadija' },
    { day: 0, period: 'P3', cohort: 'sindh_11', subject: 'English', teacher: 'Mr. Husnain' },
    { day: 0, period: 'P4', cohort: 'sindh_11', subject: 'Physics', teacher: 'Muhammad Hasnain Shoukat' },
    // Sindh 11 Math is pre-existing at 19:30 (P6)

    // FBISE 12:
    { day: 0, period: 'P2', cohort: 'fbise_12', subject: 'Biology', teacher: 'Mr. Subhan' },
    { day: 0, period: 'P3', cohort: 'fbise_12', subject: 'Urdu', teacher: 'Mr. Subhan' }, // wait, Subhan cannot teach both at same time, but P2 and P3 are different times!
    { day: 0, period: 'P4', cohort: 'fbise_12', subject: 'Mathematics', teacher: 'Mr. Hashir' },
    { day: 0, period: 'P5', cohort: 'fbise_12', subject: 'English', teacher: 'Mr. Husnain' },

    // SINDH 12:
    { day: 0, period: 'P2', cohort: 'sindh_12', subject: 'Biology', teacher: 'Mr. Subhan' },
    { day: 0, period: 'P3', cohort: 'sindh_12', subject: 'Urdu', teacher: 'Mr. Subhan' },
    { day: 0, period: 'P4', cohort: 'sindh_12', subject: 'Mathematics', teacher: 'Mr. Hashir' },
    { day: 0, period: 'P5', cohort: 'sindh_12', subject: 'English', teacher: 'Mr. Husnain' },

    // ================= TUESDAY (Day 1) =================
    // FBISE 11:
    { day: 1, period: 'P2', cohort: 'fbise_11', subject: 'Biology', teacher: 'Ms. Khadija' },
    { day: 1, period: 'P3', cohort: 'fbise_11', subject: 'Physics', teacher: 'Muhammad Hasnain Shoukat' },
    { day: 1, period: 'P4', cohort: 'fbise_11', subject: 'Urdu', teacher: 'Mr. Subhan' },
    { day: 1, period: 'P5', cohort: 'fbise_11', subject: 'Mathematics', teacher: 'Mr. Hashir' },

    // SINDH 11:
    { day: 1, period: 'P2', cohort: 'sindh_11', subject: 'Chemistry', teacher: 'Ms. Khadija' }, // or Bio
    { day: 1, period: 'P3', cohort: 'sindh_11', subject: 'Physics', teacher: 'Muhammad Hasnain Shoukat' },
    { day: 1, period: 'P4', cohort: 'sindh_11', subject: 'Urdu', teacher: 'Mr. Subhan' },
    // Sindh 11 Math is pre-existing at 19:30 (P6)

    // FBISE 12:
    { day: 1, period: 'P0', cohort: 'fbise_12', subject: 'Islamiat', teacher: 'Ms. Falak' },
    { day: 1, period: 'P1', cohort: 'fbise_12', subject: 'Chemistry', teacher: 'Ms. Khadija' }, // Wait, in P1 on Tue, Ms. Khadija is teaching G10 Chem!
    // So let's check who is free at P1 on Tue: Hashir, Hasnain Shoukat, Husnain, Subhan, Falak.
  ];

  console.log('Testing slots...');
  await client.end();
}

testTimetable();
