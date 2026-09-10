const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres' });

async function run() {
  await client.connect();

  const boards = ['fbise', 'sindh'];
  const grades = ['9', '10', '11', '12'];

  for (const b of boards) {
    for (const g of grades) {
      console.log('================= ' + b.toUpperCase() + ' GRADE ' + g + ' =================');
      
      const enr = await client.query(
        `SELECT s.name as subject_name, count(e.id) as student_count, string_agg(coalesce(r.full_name, e.student_id::text), ', ') as students
        FROM public.enrollments e
        JOIN public.class_offerings co ON e.offering_id = co.id
        JOIN public.classes c ON co.class_id = c.id
        JOIN public.subjects s ON co.subject_id = s.id
        LEFT JOIN public.roster r ON e.student_id::text = r.id OR e.student_id = r.profile_id
        WHERE c.board_id = $1 AND c.grade = $2
        GROUP BY s.name ORDER BY s.name`,
        [b, g]
      );
      console.log('Enrolled subjects (from public.enrollments):');
      if (enr.rows.length === 0) console.log('  (No enrollments found)');
      else enr.rows.forEach(r => console.log('  - ' + r.subject_name + ' (' + r.student_count + ' student(s): ' + r.students + ')'));

      const off = await client.query(
        `SELECT s.name as subject_name, t.full_name as teacher_name
        FROM public.class_offerings co
        JOIN public.classes c ON co.class_id = c.id
        JOIN public.subjects s ON co.subject_id = s.id
        LEFT JOIN public.teachers t ON co.teacher_id = t.id
        WHERE c.board_id = $1 AND c.grade = $2
        ORDER BY s.name`,
        [b, g]
      );
      console.log('Class Offerings defined (from public.class_offerings):');
      if (off.rows.length === 0) console.log('  (No offerings defined)');
      else off.rows.forEach(r => console.log('  - ' + r.subject_name + ' [Teacher: ' + (r.teacher_name || 'UNASSIGNED') + ']'));
    }
  }

  // Also check if any students in public.roster have class_ids for 11 or 12
  console.log('\n================= STUDENTS IN ROSTER =================');
  const students = await client.query(`
    SELECT r.id, r.full_name, r.email, r.class_ids, array_to_string(array_agg(c.board_id || ' ' || c.grade || ' (' || c.display_name || ')'), ', ') as classes
    FROM public.roster r
    LEFT JOIN unnest(r.class_ids) as cid ON true
    LEFT JOIN public.classes c ON c.id = cid
    WHERE r.role = 'student'
    GROUP BY r.id, r.full_name, r.email, r.class_ids
    ORDER BY r.full_name
  `);
  students.rows.forEach(s => {
    console.log(`Student: ${s.full_name} (${s.email}) -> Classes: ${s.classes || 'None'}`);
  });

  await client.end();
}
run().catch(console.error);
