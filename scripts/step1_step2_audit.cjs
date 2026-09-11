const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres',
  connectionTimeoutMillis: 10000
});

async function runAudit() {
  await client.connect();
  console.log('Connected to DB for Step 1 & 2 audit.');

  const cohorts = [
    { board: 'fbise', grade: '9', name: 'FBISE Grade 9' },
    { board: 'fbise', grade: '10', name: 'FBISE Grade 10' },
    { board: 'sindh', grade: '9', name: 'Sindh Board Grade 9' },
    { board: 'sindh', grade: '10', name: 'Sindh Board Grade 10' },
  ];

  console.log('\n======================================================');
  console.log('STEP 1: ROSTER & ENROLLMENT AUDIT PER TARGET COHORT');
  console.log('======================================================');

  for (const c of cohorts) {
    console.log(`\n------------------------------------------------------`);
    console.log(`COHORT: ${c.name} (${c.board} / ${c.grade})`);
    console.log(`------------------------------------------------------`);

    const clsRes = await client.query('SELECT id, board_id, grade, display_name FROM public.classes WHERE board_id = $1 AND grade = $2', [c.board, c.grade]);
    if (clsRes.rows.length === 0) {
      console.log(`Class not found!`);
      continue;
    }
    const classId = clsRes.rows[0].id;
    console.log(`Class ID: ${classId}`);

    // Offerings
    const offRes = await client.query(`
      SELECT co.id as offering_id, s.name as subject_name, co.teacher_id, t.full_name as teacher_name
      FROM public.class_offerings co
      JOIN public.subjects s ON co.subject_id = s.id
      LEFT JOIN public.teachers t ON co.teacher_id = t.id
      WHERE co.class_id = $1
      ORDER BY s.name
    `, [classId]);
    console.log(`Available Offerings in DB (${offRes.rows.length}):`);
    for (const o of offRes.rows) {
      console.log(`  - Subject: ${o.subject_name.padEnd(16)} | Teacher: ${o.teacher_name || 'UNASSIGNED'} | Offering ID: ${o.offering_id}`);
    }

    // Students in roster
    const rosterRes = await client.query(`
      SELECT r.id, r.profile_id, r.full_name, r.email, r.role, r.class_ids
      FROM public.roster r
      WHERE $1 = ANY(r.class_ids)
    `, [classId]);
    console.log(`\nEnrolled Roster Students (${rosterRes.rows.length}):`);
    for (const r of rosterRes.rows) {
      console.log(`  - ${r.full_name} (${r.email}) | ID: ${r.id} | Profile ID: ${r.profile_id}`);

      // Query subject enrollments
      const enrRes = await client.query(`
        SELECT e.id, s.name as subject_name, t.full_name as teacher_name, e.total_classes
        FROM public.enrollments e
        JOIN public.class_offerings co ON e.offering_id = co.id
        JOIN public.subjects s ON co.subject_id = s.id
        LEFT JOIN public.teachers t ON co.teacher_id = t.id
        WHERE e.student_id = $1 OR e.student_id::text = $2
        ORDER BY s.name
      `, [r.profile_id, r.id]);

      console.log(`    Enrolled Subjects (${enrRes.rows.length}):`);
      for (const e of enrRes.rows) {
        console.log(`      * ${e.subject_name.padEnd(16)} (Teacher: ${e.teacher_name || 'Unassigned'}) [${e.total_classes} classes]`);
      }
    }
  }

  console.log('\n======================================================');
  console.log('STEP 1 (Cont): ISLAMIAT TEACHER & OFFERING AUDIT');
  console.log('======================================================');
  const islamiatRes = await client.query(`
    SELECT c.board_id, c.grade, co.id as offering_id, co.teacher_id, t.full_name as teacher_name, t.email as teacher_email
    FROM public.class_offerings co
    JOIN public.classes c ON co.class_id = c.id
    JOIN public.subjects s ON co.subject_id = s.id
    LEFT JOIN public.teachers t ON co.teacher_id = t.id
    WHERE s.name ILIKE '%Islamiat%'
    ORDER BY c.board_id, c.grade
  `);
  console.table(islamiatRes.rows);

  // Check all teachers in teachers table to see if any have Islamiat or specializations
  const allTeachers = await client.query(`
    SELECT id, full_name, email, is_active FROM public.teachers ORDER BY full_name
  `);
  console.log('\nAll Teachers in System:');
  console.table(allTeachers.rows);

  await client.end();
}

runAudit().catch(e => {
  console.error(e);
  process.exit(1);
});
