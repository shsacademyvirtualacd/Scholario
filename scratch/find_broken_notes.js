import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  const res = await client.query(`
    SELECT id, title, offering_id, file_path, file_url, created_at
    FROM public.notes
    WHERE file_url IS NULL
       OR file_url = ''
       OR file_url LIKE '%placeholder%'
       OR (file_url NOT LIKE '/api/notes/view/%' AND file_url NOT LIKE '/api/notes/dl/%');
  `);
  
  console.log(`Found ${res.rowCount} broken rows`);
  if (res.rowCount > 0) {
    console.table(res.rows);
  }

  await client.end();
}

main().catch(console.error);
