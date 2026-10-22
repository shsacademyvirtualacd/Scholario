const { Client } = require('pg');

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Missing SUPABASE_DB_URL or DATABASE_URL in environment.");
  process.exit(1);
}

async function run() {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();

    // Check profiles columns
    const pCols = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'
    `);
    console.log("Profile columns:", pCols.rows.map(r => r.column_name));

    // Check teachers in profiles and roster
    const teacherProfiles = await client.query(`
      SELECT id, full_name, role, phone FROM public.profiles WHERE role = 'teacher'
    `);
    console.log("--- TEACHER PROFILES (Check 3) ---");
    console.log(JSON.stringify(teacherProfiles.rows, null, 2));

    const rosterTeachers = await client.query(`
      SELECT id, email, full_name, role FROM public.roster WHERE role = 'teacher'
    `);
    console.log("--- ROSTER TEACHERS (Check 3) ---");
    console.log(JSON.stringify(rosterTeachers.rows, null, 2));

    // Check physics offerings for Grade 10 Sindh
    const physicsOfferings = await client.query(`
      SELECT co.id, co.class_id, co.subject_id, co.teacher_id, s.name as subject_name, c.grade, c.board_id, p.full_name as teacher_profile_name
      FROM public.class_offerings co
      LEFT JOIN public.subjects s ON co.subject_id = s.id
      LEFT JOIN public.classes c ON co.class_id = c.id
      LEFT JOIN public.profiles p ON co.teacher_id = p.id
      WHERE s.name ILIKE '%physic%' OR c.grade = '10'
    `);
    console.log("--- PHYSICS & GRADE 10 OFFERINGS (Check 3) ---");
    console.log(JSON.stringify(physicsOfferings.rows, null, 2));

    // Check fee audit logs
    const feeAudits = await client.query(`
      SELECT id, student_id, action, previous_status, new_status, reason, created_at
      FROM public.fee_audit_logs
      ORDER BY created_at DESC
      LIMIT 15
    `);
    console.log("--- FEE AUDIT LOGS (Check 6) ---");
    console.log(JSON.stringify(feeAudits.rows, null, 2));

    // Check subjects table for Grade 10 Sindh & stream
    const subjects = await client.query(`
      SELECT s.id, s.name, s.grade, s.board_id, s.stream, s.is_active
      FROM public.subjects s
      WHERE s.grade = '10' OR s.board_id = 'sindh'
      ORDER BY s.name
    `);
    console.log("--- SUBJECTS (Check 7) ---");
    console.log(JSON.stringify(subjects.rows, null, 2));

    // Check class slots total for a student class
    const slotCount = await client.query(`
      SELECT c.name as class_name, c.grade, c.board_id, COUNT(cs.id) as slot_count
      FROM public.classes c
      JOIN public.class_offerings co ON co.class_id = c.id
      JOIN public.class_slots cs ON cs.offering_id = co.id
      GROUP BY c.id, c.name, c.grade, c.board_id
    `);
    console.log("--- SLOTS COUNT (Check 1) ---");
    console.log(JSON.stringify(slotCount.rows, null, 2));

  } catch (err) {
    console.error("Query error:", err);
  } finally {
    await client.end();
  }
}

run();
