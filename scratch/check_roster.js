import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  const r = await client.query(`
    SELECT id, email, role, profile_id FROM roster WHERE email = 'shsteachersemail@gmail.com'
  `);
  console.table(r.rows);

  await client.end();
}

main().catch(console.error);
