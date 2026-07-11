import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  const res = await client.query(`
    SELECT conname, confupdtype 
    FROM pg_constraint 
    WHERE conrelid = 'class_offerings'::regclass AND confrelid = 'teachers'::regclass
  `);
  console.table(res.rows);

  await client.end();
}

main().catch(console.error);
