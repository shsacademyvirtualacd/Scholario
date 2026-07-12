const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runFix() {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  let connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    const match = envContent.match(/SUPABASE_DB_URL="?([^"\n]+)"?/);
    if (match) connectionString = match[1];
  }

  if (!connectionString) {
    console.error('SUPABASE_DB_URL is missing in .env.local');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    const sqlPath = path.join(__dirname, 'urgent_fix.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running SQL script to repair DB and trigger...');
    await client.query(sql);
    console.log('SQL script executed successfully.\n');

    console.log('--- VERIFICATION ---');

    // 1. Confirm both teachers' roster rows point to real profile ids
    const t1_new = 'fab93f7f-8499-4f97-921b-b7a8b21a644d';
    const t2_new = '9df8c0c8-8b3a-4c24-8816-6827a1ea404b';

    const r1 = await client.query(`SELECT id, profile_id FROM public.roster WHERE profile_id = $1`, [t1_new]);
    console.log(`Teacher 1 roster check: Found ${r1.rowCount} rows pointing to real ID ${t1_new}`);
    
    const r2 = await client.query(`SELECT id, profile_id FROM public.roster WHERE profile_id = $1`, [t2_new]);
    console.log(`Teacher 2 roster check: Found ${r2.rowCount} rows pointing to real ID ${t2_new}`);

    // Confirm class_offerings rows point to new real teacher_id
    const co1 = await client.query(`SELECT id FROM public.class_offerings WHERE teacher_id = $1`, [t1_new]);
    console.log(`Teacher 1 class_offerings check: Found ${co1.rowCount} rows pointing to real ID ${t1_new}`);

    const co2 = await client.query(`SELECT id FROM public.class_offerings WHERE teacher_id = $1`, [t2_new]);
    console.log(`Teacher 2 class_offerings check: Found ${co2.rowCount} rows pointing to real ID ${t2_new}`);

    // 2. Confirm the old placeholder profile rows are gone
    const t1_old = '2df8dce0-fb88-4343-9be1-669f55789a32';
    const t2_old = '50df639d-4c5f-4639-b9f6-74152dcf7b68';
    
    const p1 = await client.query(`SELECT id FROM public.profiles WHERE id = $1`, [t1_old]);
    console.log(`Teacher 1 old placeholder check: Found ${p1.rowCount} rows (expected 0)`);
    
    const p2 = await client.query(`SELECT id FROM public.profiles WHERE id = $1`, [t2_old]);
    console.log(`Teacher 2 old placeholder check: Found ${p2.rowCount} rows (expected 0)`);

    // 3. Confirm zero orphaned/ghost profiles remain when querying full_name ILIKE '%hashir%'
    const p3 = await client.query(`SELECT id, full_name, role FROM public.profiles WHERE full_name ILIKE '%hashir%'`);
    console.log(`Total '%hashir%' profiles remaining: ${p3.rowCount}`);
    for (let row of p3.rows) {
      console.log(`  -> ${row.id} | ${row.full_name} | ${row.role}`);
    }

    // 4. Simulate the fixed trigger path
    console.log('\n--- TRIGGER SIMULATION ---');
    console.log('Simulating a new teacher being linked...');
    await client.query(`
      DO $$
      DECLARE
        v_old_profile_id uuid := gen_random_uuid();
        v_new_profile_id uuid := gen_random_uuid();
        v_roster_id uuid;
        v_test_email text := '__test_teacher_verification__@test.internal';
      BEGIN
        -- 1. Create old placeholder profile
        INSERT INTO public.profiles (id, role, full_name) VALUES (v_old_profile_id, 'teacher', 'Test Trigger Teacher');

        -- 2. Create new real profile
        INSERT INTO public.profiles (id, role, full_name) VALUES (v_new_profile_id, 'teacher', 'Test Trigger Teacher');

        -- 3. Create teacher row for OLD ID
        INSERT INTO public.teachers (id, full_name, email) VALUES (v_old_profile_id, 'Test Trigger Teacher', v_test_email);

        -- 4. Create class offering assigned to OLD ID
        INSERT INTO public.class_offerings (id, name, teacher_id) VALUES (gen_random_uuid(), 'Test Physics 101', v_old_profile_id);

        -- 5. Create roster entry pointing to OLD ID
        INSERT INTO public.roster (email, full_name, role, profile_id)
        VALUES (v_test_email, 'Test Trigger Teacher', 'teacher', v_old_profile_id)
        RETURNING id INTO v_roster_id;

        -- 6. Fire the trigger by updating roster.profile_id to NEW ID
        UPDATE public.roster SET profile_id = v_new_profile_id WHERE id = v_roster_id;

        -- 7. Verification checks
        IF NOT EXISTS (SELECT 1 FROM public.teachers WHERE id = v_new_profile_id) THEN
          RAISE EXCEPTION '❌ FAIL: New teacher row not found!';
        END IF;

        IF EXISTS (SELECT 1 FROM public.teachers WHERE id = v_old_profile_id) THEN
          RAISE EXCEPTION '❌ FAIL: Old teacher row still exists!';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM public.class_offerings WHERE teacher_id = v_new_profile_id) THEN
          RAISE EXCEPTION '❌ FAIL: class_offerings not pointing to new teacher_id!';
        END IF;

        -- 8. Cleanup test data
        DELETE FROM public.class_offerings WHERE teacher_id = v_new_profile_id;
        DELETE FROM public.teachers WHERE id = v_new_profile_id;
        DELETE FROM public.roster WHERE id = v_roster_id;
        DELETE FROM public.profiles WHERE id = v_new_profile_id;

      END $$;
    `);
    console.log('✅ Trigger simulation for teacher succeeded with no FK violation!');

  } catch (error) {
    console.error('Error executing script:', error);
  } finally {
    await client.end();
  }
}

runFix();
