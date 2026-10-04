const { Client } = require('pg');

const dbUrl = process.env.SUPABASE_DB_URL || 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres';

async function run() {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log("Connected to database successfully.\n");

    // 1. Column info for key tables
    const colQuery = `
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('teachers','profiles','class_offerings','class_slots','attendance','class_session_links','roster')
      ORDER BY table_name, ordinal_position;
    `;
    const cols = await client.query(colQuery);
    console.log("=== COLUMNS IN KEY TABLES ===");
    console.table(cols.rows);

    // 2. Check foreign keys of class_session_links
    const fkQuery = `
      SELECT
        tc.table_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'class_session_links';
    `;
    const fks = await client.query(fkQuery);
    console.log("\n=== FOREIGN KEYS ON class_session_links ===");
    console.table(fks.rows);

    // 3. Existing function definitions for my_teacher_offering_ids and is_admin
    const funcQuery = `
      SELECT p.proname, pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname IN ('my_teacher_offering_ids', 'is_admin', 'my_enrolled_offering_ids');
    `;
    const funcs = await client.query(funcQuery);
    console.log("\n=== EXISTING HELPER FUNCTIONS ===");
    for (const f of funcs.rows) {
      console.log(`\n--- ${f.proname} ---`);
      console.log(f.definition);
    }

    // 4. Check policies on class_session_links
    const polQuery = `
      SELECT polname, polcmd, polroles::regrole[], pg_get_expr(polqual, polrelid) as qual, pg_get_expr(polwithcheck, polrelid) as with_check
      FROM pg_policy
      WHERE polrelid = 'public.class_session_links'::regclass;
    `;
    try {
      const pols = await client.query(polQuery);
      console.log("\n=== POLICIES ON class_session_links ===");
      console.table(pols.rows);
    } catch (e) {
      console.log("Could not query pg_policy for class_session_links (table may not exist yet):", e.message);
    }

    // 5. Check attendance duplicates count
    const dupQuery = `
      SELECT student_id, slot_id, session_date, COUNT(*) as count
      FROM public.attendance
      GROUP BY student_id, slot_id, session_date
      HAVING COUNT(*) > 1;
    `;
    const dups = await client.query(dupQuery);
    console.log(`\n=== ATTENDANCE DUPLICATES (${dups.rows.length} duplicate groups found) ===`);
    if (dups.rows.length > 0) {
      console.table(dups.rows.slice(0, 10));
    }

    // 6. Check existing indexes on attendance
    const idxQuery = `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'attendance';
    `;
    const idxs = await client.query(idxQuery);
    console.log("\n=== INDEXES ON attendance ===");
    console.table(idxs.rows);

  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await client.end();
  }
}

run();
