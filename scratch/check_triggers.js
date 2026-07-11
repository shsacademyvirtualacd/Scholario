import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  const res = await client.query(`
    SELECT tgname, proname 
    FROM pg_trigger 
    JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
    JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
    WHERE relname = 'users'
  `);
  console.table(res.rows);

  await client.end();
}

main().catch(console.error);
