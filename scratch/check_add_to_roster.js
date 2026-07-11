import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  const res = await client.query(`
    SELECT prosrc FROM pg_proc WHERE proname = 'add_to_roster'
  `);
  console.log(res.rows[0]?.prosrc);

  await client.end();
}

main().catch(console.error);
