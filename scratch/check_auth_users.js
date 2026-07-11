import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  const res = await client.query(`
    SELECT id, email, created_at FROM auth.users WHERE email = 'shsteachersemail@gmail.com'
  `);
  console.table(res.rows);
  
  const p = await client.query(`
    SELECT id, full_name FROM profiles WHERE role='teacher'
  `);
  console.table(p.rows);
  
  const t = await client.query(`
    SELECT id, full_name, email FROM teachers
  `);
  console.table(t.rows);

  await client.end();
}

main().catch(console.error);
