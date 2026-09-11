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
  P6: { start: '19:30:00', end: '20:10:00' }, // Sindh 11 Math
};

async function solve() {
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

  console.log('Active slots loaded:', activeRes.rows.length);

  // Let's test whether joint streams exist in the curriculum
  // In SHS Virtual Academy:
  // Stream Grade 11:
  //   - Mathematics: FBISE 11 takes Math in afternoon, Sindh 11 takes Math at 19:30 (P6).
  //   - English: Grade 11 English (Mr. Husnain)
  //   - Physics: Grade 11 Physics (Muhammad Hasnain Shoukat)
  //   - Chemistry: Grade 11 Chemistry (Ms. Khadija)
  //   - Biology: FBISE 11 Biology (Ms. Khadija), Sindh 11 Biology (Mr. Subhan)
  //   - Urdu: Grade 11 Urdu (Mr. Subhan)
  //   - Islamiat: FBISE 11 Islamiat (Ms. Falak)
  //
  // Stream Grade 12:
  //   - Mathematics: Grade 12 Math (Mr. Hashir)
  //   - English: Grade 12 English (Mr. Husnain)
  //   - Physics: Grade 12 Physics (Muhammad Hasnain Shoukat)
  //   - Chemistry: Grade 12 Chemistry (Ms. Khadija)
  //   - Biology: Grade 12 Biology (Mr. Subhan)
  //   - Urdu: Grade 12 Urdu (Mr. Subhan)
  //   - Islamiat: FBISE 12 Islamiat (Ms. Falak)

  // Let's verify if under this stream model, every single teacher conflict is eliminated!
  await client.end();
}

solve().catch(console.error);
