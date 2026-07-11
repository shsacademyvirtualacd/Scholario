import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log('Connected to Supabase via Pooler');

  // Fix broken rows where file_url was stuck at placeholder
  const result = await client.query(`
    UPDATE public.notes
    SET file_url = '/api/notes/view/' || id
    WHERE file_url = '/api/notes/view/placeholder'
       OR file_url IS NULL
       OR file_url = '';
  `);
  console.log(`Fixed ${result.rowCount} broken notes rows.`);

  // Verify none remain
  const check = await client.query(`
    SELECT id, title, file_url FROM public.notes
    WHERE file_url IS NULL
       OR file_url = ''
       OR file_url = '/api/notes/view/placeholder';
  `);
  if (check.rowCount === 0) {
    console.log('✓ No broken rows remaining.');
  } else {
    console.log(`⚠ Still ${check.rowCount} broken rows:`, check.rows);
  }

  await client.end();
}

main().catch(console.error);
