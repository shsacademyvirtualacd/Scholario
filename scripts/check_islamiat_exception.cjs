const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres'
});

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Defined periods:
// P0: 16:30 - 17:00
// P1: 17:00 - 17:30
// P2: 17:30 - 18:00
// P3: 18:00 - 18:30
// P4: 18:30 - 19:00
// P5: 19:00 - 19:30
// P6: 19:30 - 20:10 (Sindh 11 Math slot)

async function testTimetable() {
  await client.connect();

  const activeRes = await client.query(`
    SELECT cs.id, c.board_id, c.grade, cs.day_of_week, cs.start_time, cs.end_time, s.name as subject_name, t.full_name as teacher_name
    FROM public.class_slots cs
    JOIN public.classes c ON cs.class_id = c.id
    JOIN public.class_offerings co ON cs.offering_id = co.id
    JOIN public.subjects s ON co.subject_id = s.id
    LEFT JOIN public.teachers t ON co.teacher_id = t.id
  `);

  console.log(`Loaded ${activeRes.rows.length} existing active slots.`);

  // Teachers fixed mapping:
  const TEACHERS = {
    Mathematics: 'Mr. Hashir',
    Physics: 'Muhammad Hasnain Shoukat',
    English: 'Mr. Husnain',
    Chemistry: 'Ms. Khadija',
    Islamiat: 'Ms. Falak',
    Urdu: 'Mr. Subhan',
    Biology_FBISE11: 'Ms. Khadija', // explicit in DB
    Biology_Others: 'Mr. Subhan',   // platform biology
  };

  // Check Islamiat Wed/Thu exception for FBISE 11:
  // Is Ms. Falak free on Wed and Thu at 17:00 (P1)?
  const falakWedP1 = activeRes.rows.filter(r => r.teacher_name === 'Ms. Falak' && r.day_of_week === 2 && r.start_time === '17:00:00');
  const falakThuP1 = activeRes.rows.filter(r => r.teacher_name === 'Ms. Falak' && r.day_of_week === 3 && r.start_time === '17:00:00');
  console.log(`Ms. Falak Wed 17:00 active classes: ${falakWedP1.length}`);
  console.log(`Ms. Falak Thu 17:00 active classes: ${falakThuP1.length}`);
  console.log(`Ms. Falak Wed 16:30 (P0) active classes: ${activeRes.rows.filter(r => r.teacher_name === 'Ms. Falak' && r.day_of_week === 2 && r.start_time === '16:30:00').length}`);
  console.log(`Ms. Falak Thu 16:30 (P0) active classes: ${activeRes.rows.filter(r => r.teacher_name === 'Ms. Falak' && r.day_of_week === 3 && r.start_time === '16:30:00').length}`);

  await client.end();
}

testTimetable().catch(console.error);
