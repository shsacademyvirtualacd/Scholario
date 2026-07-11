import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  try {
    await client.query('BEGIN');
    
    // 1. Drop the old FK
    await client.query(`
      ALTER TABLE class_offerings 
      DROP CONSTRAINT class_offerings_teacher_id_fkey
    `);
    
    // 2. Add the new FK with ON UPDATE CASCADE
    await client.query(`
      ALTER TABLE class_offerings
      ADD CONSTRAINT class_offerings_teacher_id_fkey 
      FOREIGN KEY (teacher_id) 
      REFERENCES teachers(id) 
      ON UPDATE CASCADE
    `);

    // 3. Now let's trigger the profile merge for this specific teacher
    // We update the roster table, which will fire the trigger and 
    // cleanly cascade the ID change.
    await client.query(`
      UPDATE roster 
      SET profile_id = '87a1b117-4333-4a8a-9c5f-9557f62996fe' 
      WHERE email = 'shsteachersemail@gmail.com'
    `);

    await client.query('COMMIT');
    console.log('Successfully fixed FK and merged teacher records!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Failed:', e);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
