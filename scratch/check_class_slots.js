import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  const res = await client.query(`
    SELECT id, offering_id, day_of_week, start_time 
    FROM class_slots 
    WHERE offering_id IN ('794c0c93-243f-7d1f-1218-98a5527c87be', 'eae3e518-1597-025a-cd9a-a676f0395875')
  `);
  console.table(res.rows);

  await client.end();
}

main().catch(console.error);
