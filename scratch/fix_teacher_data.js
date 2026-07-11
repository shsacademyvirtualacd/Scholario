import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  const realId = '87a1b117-4333-4a8a-9c5f-9557f62996fe';
  const fakeId = 'ce043ca5-0970-4113-9cb1-506aeee85728';

  try {
    await client.query('BEGIN');

    // 1. Insert real teacher record
    await client.query(`
      INSERT INTO teachers (id, full_name, email, is_active, joining_date) 
      VALUES ($1, 'Teacher Account', 'shsteachersemail@gmail.com', TRUE, CURRENT_DATE)
      ON CONFLICT (id) DO NOTHING
    `, [realId]);

    // 2. Transfer offerings
    await client.query(`
      UPDATE class_offerings 
      SET teacher_id = $1 
      WHERE teacher_id = $2
    `, [realId, fakeId]);

    // 3. Update roster
    await client.query(`
      UPDATE roster 
      SET profile_id = $1 
      WHERE email = 'shsteachersemail@gmail.com'
    `, [realId]);

    // 4. Clean up fake records
    await client.query('DELETE FROM teachers WHERE id = $1', [fakeId]);
    await client.query('DELETE FROM profiles WHERE id = $1', [fakeId]);

    await client.query('COMMIT');
    console.log('Successfully merged teacher records!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Failed:', e);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
