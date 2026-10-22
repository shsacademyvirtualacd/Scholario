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
    console.log("Connected to database successfully.");

    // Query non-null teacher_id offerings
    const res = await client.query(`
      SELECT co.*, s.name as subject_name 
      FROM public.class_offerings co
      LEFT JOIN public.subjects s ON co.subject_id = s.id
      WHERE co.teacher_id IS NOT NULL
    `);
    console.log("Class offerings with teacher assigned:", JSON.stringify(res.rows, null, 2));

    // Query roster entries for teacher
    const rosterRes = await client.query(`
      SELECT * FROM public.roster WHERE role = 'teacher'
    `);
    console.log("Roster entries for teachers:", JSON.stringify(rosterRes.rows, null, 2));

  } catch (err) {
    console.error("Error executing query", err);
  } finally {
    await client.end();
  }
}

run();
