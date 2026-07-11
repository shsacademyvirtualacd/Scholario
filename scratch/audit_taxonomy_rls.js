import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  for (const table of ['classes', 'boards', 'subjects']) {
    console.log(`=== RLS POLICIES FOR ${table} ===`);
    const res = await client.query(`
      SELECT policyname, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = $1
    `, [table]);
    console.table(res.rows);
  }

  await client.end();
}

main().catch(console.error);
