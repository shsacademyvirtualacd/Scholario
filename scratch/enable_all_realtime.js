import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  const tables = [
    'class_slots',
    'notes',
    'roster',
    'enrollments',
    'announcements',
    'fee_statuses'
  ];

  try {
    for (const table of tables) {
      console.log(`Enabling REPLICA IDENTITY FULL for ${table}...`);
      await client.query(`ALTER TABLE public.${table} REPLICA IDENTITY FULL;`);
      
      console.log(`Adding ${table} to supabase_realtime...`);
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public.${table};`).catch(err => {
        if (err.message.includes('already exists') || err.message.includes('already a member')) {
          console.log(`  - ${table} already in publication.`);
        } else {
          throw err;
        }
      });
    }

    console.log('Realtime setup successfully enabled for all target tables!');
  } catch (e) {
    console.error('Failed:', e);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
