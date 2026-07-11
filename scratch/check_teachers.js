import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  
  const teachers = await client.query('SELECT id, full_name, email FROM teachers LIMIT 5');
  console.log('--- TEACHERS ---');
  console.table(teachers.rows);

  const profiles = await client.query("SELECT id, full_name, role FROM profiles WHERE role = 'teacher' LIMIT 5");
  console.log('--- TEACHER PROFILES ---');
  console.table(profiles.rows);

  const offerings = await client.query('SELECT id, teacher_id, subject_name FROM class_offerings LIMIT 5');
  console.log('--- OFFERINGS ---');
  console.table(offerings.rows);

  await client.end();
}

main().catch(console.error);
