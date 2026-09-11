const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres'
});

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Let's test joint vs separate:
// If Grade 12 (FBISE 12 and SINDH 12) share classes:
// G12 Math (Mr. Hashir)
// G12 English (Mr. Husnain)
// G12 Physics (Muhammad Hasnain Shoukat)
// G12 Chemistry (Ms. Khadija)
// G12 Biology (Mr. Subhan)
// G12 Urdu (Mr. Subhan)
// FBISE 12 Islamiat (Ms. Falak)

// And for Grade 11:
// FBISE 11 Math (Mr. Hashir)
// Sindh 11 Math (Mr. Hashir at 19:30 pre-existing)
// Can G11 English, Physics, Chem, Bio, Urdu be joint or separate?
// Let's test if joint G11 English / Physics / Chem / Urdu works!

async function testJointModel() {
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

  console.log('Testing joint grade model...');
  // We will test assigning periods day by day.
  await client.end();
}

testJointModel().catch(console.error);
