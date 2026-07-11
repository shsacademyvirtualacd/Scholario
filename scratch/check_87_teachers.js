import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  const t = await client.query(`
    SELECT id, email FROM teachers WHERE id = '87a1b117-4333-4a8a-9c5f-9557f62996fe'
  `);
  console.table(t.rows);

  await client.end();
}

main().catch(console.error);
