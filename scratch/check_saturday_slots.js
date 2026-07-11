import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log('Connected to Supabase');

  const res = await client.query(`
    SELECT id, day_of_week, start_time, end_time, is_cancelled
    FROM class_slots
    WHERE day_of_week = 5 OR day_of_week = 6
    ORDER BY day_of_week, start_time;
  `);
  
  console.log('Saturday/Sunday Slots:');
  console.table(res.rows);

  await client.end();
}

main().catch(console.error);
