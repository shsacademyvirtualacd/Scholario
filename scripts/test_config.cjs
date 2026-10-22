const { Client } = require('pg');

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing SUPABASE_DB_URL or DATABASE_URL in environment.");
  process.exit(1);
}

const client = new Client({ connectionString });

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Let's test whether FBISE 11 and Sindh 11 can be completely separate OR combined,
// and whether FBISE 12 and Sindh 12 can be separate OR combined.

async function testConfigurations() {
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

  console.log('Testing schedule configurations...');
  await client.end();
}

testConfigurations();
