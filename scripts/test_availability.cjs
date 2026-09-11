const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres'
});

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Let's inspect each day's exact teacher availability at each period:
// P0: 16:30
// P1: 17:00
// P2: 17:30
// P3: 18:00
// P4: 18:30
// P5: 19:00
// P6: 19:30 (Mr. Hashir is busy with Sindh 11 Math)

async function testAvailability() {
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

  const periods = [
    { name: 'P0', time: '16:30:00' },
    { name: 'P1', time: '17:00:00' },
    { name: 'P2', time: '17:30:00' },
    { name: 'P3', time: '18:00:00' },
    { name: 'P4', time: '18:30:00' },
    { name: 'P5', time: '19:00:00' },
    { name: 'P6', time: '19:30:00' },
  ];

  const teachers = [
    'Mr. Hashir',
    'Muhammad Hasnain Shoukat',
    'Mr. Husnain',
    'Ms. Khadija',
    'Mr. Subhan',
    'Ms. Falak'
  ];

  for (let d = 0; d < 5; d++) {
    console.log(`\n=================== ${DAY_NAMES[d]} ===================`);
    for (const p of periods) {
      const busy = activeRes.rows
        .filter(r => r.day_of_week === d && r.start_time === p.time)
        .map(r => `${r.teacher_name} (${r.board_id} G${r.grade} ${r.subject_name})`);
      
      const freeTeachers = teachers.filter(t => {
        return !activeRes.rows.some(r => r.day_of_week === d && r.start_time === p.time && r.teacher_name === t);
      });

      console.log(`${p.name} (${p.time.slice(0, 5)}): FREE: [${freeTeachers.join(', ')}] | BUSY: [${busy.join('; ')}]`);
    }
  }

  await client.end();
}

testAvailability().catch(console.error);
