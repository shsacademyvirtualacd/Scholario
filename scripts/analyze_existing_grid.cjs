const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres'
});

async function analyze() {
  await client.connect();

  const activeRes = await client.query(`
    SELECT cs.id, c.board_id, c.grade, cs.day_of_week, cs.start_time, cs.end_time, s.name as subject_name, t.full_name as teacher_name
    FROM public.class_slots cs
    JOIN public.classes c ON cs.class_id = c.id
    JOIN public.class_offerings co ON cs.offering_id = co.id
    JOIN public.subjects s ON co.subject_id = s.id
    LEFT JOIN public.teachers t ON co.teacher_id = t.id
    WHERE cs.day_of_week < 5
    ORDER BY cs.day_of_week, cs.start_time, c.board_id, c.grade
  `);

  console.log('Total active G9/G10 slots M-F:', activeRes.rows.length);

  // Group by day and start_time
  const grid = {};
  for (let d = 0; d < 5; d++) grid[d] = {};

  for (const r of activeRes.rows) {
    if (!grid[r.day_of_week][r.start_time]) {
      grid[r.day_of_week][r.start_time] = [];
    }
    grid[r.day_of_week][r.start_time].push(`${r.board_id.toUpperCase()} G${r.grade} ${r.subject_name} (${r.teacher_name})`);
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  for (let d = 0; d < 5; d++) {
    console.log(`\n=================== ${days[d]} ===================`);
    for (const time of Object.keys(grid[d]).sort()) {
      console.log(`  ${time}: ${grid[d][time].join(' | ')}`);
    }
  }

  await client.end();
}

analyze().catch(console.error);
