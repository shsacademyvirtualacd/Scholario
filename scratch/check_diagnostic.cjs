const { Client } = require('pg');

const dbUrl = process.env.SUPABASE_DB_URL || 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres';

async function run() {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log("=== CONNECTED TO DB ===");

    // 1. SCHEMA INSPECTION
    console.log("\n--- 1. TABLES & COLUMNS FOR TAXONOMY & SCHEDULING ---");
    const tableSchemaQuery = `
      SELECT table_name, column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name IN ('classes', 'subjects', 'streams', 'stream_subjects', 'class_offerings', 'class_slots', 'enrollments', 'profiles')
      ORDER BY table_name, ordinal_position;
    `;
    const schemaRes = await client.query(tableSchemaQuery);
    console.table(schemaRes.rows);

    // 2. CLASSES
    console.log("\n--- 2. CLASSES ---");
    const classesRes = await client.query(`SELECT * FROM public.classes;`);
    console.table(classesRes.rows);

    // 3. STREAMS
    console.log("\n--- 3. STREAMS ---");
    const streamsRes = await client.query(`
      SELECT st.id as stream_id, st.name as stream_name, c.grade, c.board_id 
      FROM public.streams st 
      JOIN public.classes c ON st.class_id = c.id;
    `);
    console.table(streamsRes.rows);

    // 4. SUBJECTS
    console.log("\n--- 4. ALL SUBJECTS IN DB ---");
    const subjectsRes = await client.query(`SELECT * FROM public.subjects ORDER BY name;`);
    console.table(subjectsRes.rows);

    // 5. STREAM_SUBJECTS FOR GRADE 9 AND GRADE 10
    console.log("\n--- 5. STREAM_SUBJECTS FOR GRADE 9 AND 10 ---");
    const streamSubjRes = await client.query(`
      SELECT c.grade, st.name as stream_name, s.name as subject_name, ss.stream_id, ss.subject_id
      FROM public.stream_subjects ss
      JOIN public.streams st ON ss.stream_id = st.id
      JOIN public.classes c ON st.class_id = c.id
      JOIN public.subjects s ON ss.subject_id = s.id
      WHERE c.grade IN ('9', '10')
      ORDER BY c.grade, st.name, s.name;
    `);
    console.table(streamSubjRes.rows);

    // 6. CLASS_OFFERINGS FOR GRADE 9 AND 10
    console.log("\n--- 6. CLASS_OFFERINGS FOR GRADE 9 AND 10 ---");
    const offeringsRes = await client.query(`
      SELECT co.id as offering_id, c.grade, s.name as subject_name, co.teacher_id, t.full_name as teacher_name
      FROM public.class_offerings co
      JOIN public.classes c ON co.class_id = c.id
      JOIN public.subjects s ON co.subject_id = s.id
      LEFT JOIN public.teachers t ON co.teacher_id = t.id
      WHERE c.grade IN ('9', '10')
      ORDER BY c.grade, s.name;
    `);
    console.table(offeringsRes.rows);

    // 7. CLASS_SLOTS FOR GRADE 9 AND 10
    console.log("\n--- 7. CLASS_SLOTS FOR GRADE 9 AND 10 ---");
    const slotsRes = await client.query(`
      SELECT cs.id as slot_id, c.grade, cs.day_of_week, cs.start_time, cs.end_time, 
             s.name as subject_name, cs.custom_title, cs.offering_id, cs.stream_id, st.name as stream_name
      FROM public.class_slots cs
      LEFT JOIN public.classes c ON cs.class_id = c.id
      LEFT JOIN public.class_offerings co ON cs.offering_id = co.id
      LEFT JOIN public.subjects s ON co.subject_id = s.id
      LEFT JOIN public.streams st ON cs.stream_id = st.id
      WHERE c.grade IN ('9', '10') OR cs.class_id IN (SELECT id FROM public.classes WHERE grade IN ('9', '10'))
      ORDER BY c.grade, cs.day_of_week, cs.start_time;
    `);
    console.table(slotsRes.rows);

    // 8. PROFILES & ENROLLMENTS FOR GRADE 9 AND 10 STUDENTS
    console.log("\n--- 8. STUDENT PROFILES (GRADE 9 & 10) ---");
    const studentsRes = await client.query(`
      SELECT p.id, p.full_name, p.role, c.grade, st.name as stream_name, p.board_id, p.class_id, p.stream_id
      FROM public.profiles p
      LEFT JOIN public.classes c ON p.class_id = c.id
      LEFT JOIN public.streams st ON p.stream_id = st.id
      WHERE p.role = 'student' AND (c.grade IN ('9', '10') OR p.class_id IS NULL)
      ORDER BY c.grade, p.full_name;
    `);
    console.table(studentsRes.rows);

    console.log("\n--- 9. STUDENT ENROLLMENTS (GRADE 9 & 10) ---");
    const enrollmentsRes = await client.query(`
      SELECT e.id as enrollment_id, e.student_id, p.full_name as student_name, c.grade, s.name as subject_name
      FROM public.enrollments e
      JOIN public.profiles p ON e.student_id = p.id
      JOIN public.class_offerings co ON e.offering_id = co.id
      JOIN public.classes c ON co.class_id = c.id
      JOIN public.subjects s ON co.subject_id = s.id
      WHERE c.grade IN ('9', '10')
      ORDER BY p.full_name, s.name;
    `);
    console.table(enrollmentsRes.rows);

  } catch (err) {
    console.error("Error running query", err);
  } finally {
    await client.end();
  }
}

run();
