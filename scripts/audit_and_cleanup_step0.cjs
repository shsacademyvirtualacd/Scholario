const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres',
  connectionTimeoutMillis: 10000
});

async function main() {
  await client.connect();
  console.log('Connected to database.');

  // ==========================================
  // STEP 0: Audit Grade 11 & 12 schedule data
  // ==========================================
  console.log('\n==========================================');
  console.log('STEP 0: AUDITING GRADE 11 & 12 SCHEDULE DATA');
  console.log('==========================================');

  const g1112SlotsQuery = `
    SELECT 
      cs.id as slot_id,
      c.id as class_id,
      c.board_id,
      c.grade,
      cs.day_of_week,
      cs.start_time,
      cs.end_time,
      s.name as subject_name,
      t.id as teacher_id,
      t.full_name as teacher_name
    FROM public.class_slots cs
    JOIN public.classes c ON cs.class_id = c.id
    LEFT JOIN public.class_offerings co ON cs.offering_id = co.id
    LEFT JOIN public.subjects s ON co.subject_id = s.id
    LEFT JOIN public.teachers t ON co.teacher_id = t.id
    WHERE c.grade IN ('11', '12')
    ORDER BY c.board_id, c.grade, cs.day_of_week, cs.start_time
  `;

  const slotsRes = await client.query(g1112SlotsQuery);
  console.log(`Found ${slotsRes.rows.length} total slots for Grade 11 & 12.`);

  // Let's identify the one slot to preserve:
  // "a single Sindh Board Grade 11 Mathematics slot at 7:30 PM taught by Mr. Hashir, tied to one real enrolled student."
  // Start time 19:30:00 (7:30 PM), Sindh Board, Grade 11, Mathematics, Mr. Hashir.
  
  const toDelete = [];
  let preservedSlot = null;

  for (const row of slotsRes.rows) {
    const isSindh11Math730 = 
      row.board_id === 'sindh' && 
      row.grade === '11' && 
      (row.subject_name || '').toLowerCase().includes('math') &&
      row.start_time.startsWith('19:30');

    if (isSindh11Math730 && !preservedSlot) {
      preservedSlot = row;
      console.log(`\n[PRESERVED SLOT FOUND]:`, row);
    } else {
      toDelete.push(row);
    }
  }

  console.log(`\nSlots to delete count: ${toDelete.length}`);
  if (toDelete.length > 0) {
    console.log('Deleting unauthorized Grade 11/12 slots:');
    for (const d of toDelete) {
      console.log(` - ID: ${d.slot_id} | ${d.board_id.toUpperCase()} Grade ${d.grade} | Day ${d.day_of_week} | ${d.start_time} - ${d.end_time} | ${d.subject_name || 'No Subject'} | Teacher: ${d.teacher_name || 'None'}`);
    }

    const deleteIds = toDelete.map(d => d.slot_id);
    const delRes = await client.query(`
      DELETE FROM public.class_slots
      WHERE id = ANY($1)
      RETURNING id
    `, [deleteIds]);
    console.log(`\nSuccessfully deleted ${delRes.rowCount} slots.`);
  }

  if (preservedSlot) {
    console.log(`\nPRESERVED SLOT UNTOUCHED: ${preservedSlot.slot_id} (${preservedSlot.board_id} Grade ${preservedSlot.grade} ${preservedSlot.subject_name} at ${preservedSlot.start_time})`);
  } else {
    console.log('\nNOTICE: No pre-existing 7:30 PM Sindh 11 Math slot was found in the database. Checking if it exists with another time or needs to be queried.');
  }

  // Double check remaining Grade 11/12 slots
  const checkRemain = await client.query(g1112SlotsQuery);
  console.log(`\nRemaining Grade 11/12 slots in DB: ${checkRemain.rows.length}`);
  console.table(checkRemain.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
