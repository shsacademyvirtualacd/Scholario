import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  try {
    // Enable replication for notifications table
    await client.query(`
      ALTER TABLE public.notifications REPLICA IDENTITY FULL;
    `);
    
    // Add to supabase_realtime publication
    await client.query(`
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    `).catch(err => {
      // If already added, ignore
      if (err.message.includes('already exists') || err.message.includes('already a member')) {
        console.log('Already in publication.');
      } else {
        throw err;
      }
    });

    console.log('Realtime setup successfully enabled for public.notifications table!');
  } catch (e) {
    console.error('Failed:', e);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
