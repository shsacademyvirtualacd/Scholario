const pg = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].replace(/['"]/g, '').trim();
  });
  return env;
}

async function verify() {
  const env = loadEnv();
  const dbUrl = env.SUPABASE_DB_URL;
  if (!dbUrl) throw new Error("SUPABASE_DB_URL not found");

  const parsedUrl = new URL(dbUrl);
  const host = parsedUrl.hostname;
  const projectRef = host.match(/^db\.([^.]+)\.supabase\.co$/)?.[1];
  
  const connectionConfig = {
    user: projectRef ? `${decodeURIComponent(parsedUrl.username)}.${projectRef}` : decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    host: projectRef ? 'aws-1-ap-southeast-1.pooler.supabase.com' : host,
    port: parsedUrl.port || 5432,
    database: parsedUrl.pathname.slice(1),
    ssl: { rejectUnauthorized: false }
  };

  const client = new pg.Client(connectionConfig);
  await client.connect();

  console.log("Connected to database for verification.\n");

  const users = {
    admin: '6ef32f7d-3aa7-421f-ba22-86574720b00f',
    teacher: '87a1b117-4333-4a8a-9c5f-9557f62996fe',
    student: '3e63e067-2804-4e70-9ae3-0412d2b9eea9'
  };

  // Find any class offering to use for tests
  const classOfferingRes = await client.query('SELECT id FROM public.class_offerings LIMIT 1');
  const testOfferingId = classOfferingRes.rows[0]?.id || '11111111-1111-1111-1111-111111111111';

  async function testAs(userId, role, name, queries) {
    console.log(`\n--- Testing as ${name} (${userId}) ---`);
    await client.query('BEGIN');

    // Dynamically provision profile and roster entries to ensure clean database state for RLS checks
    if (role === 'student') {
      await client.query(`INSERT INTO public.profiles (id, role, full_name) VALUES ('${userId}', 'student', 'Test Student') ON CONFLICT (id) DO NOTHING`);
      await client.query(`INSERT INTO public.roster (email, full_name, role, class_ids, profile_id) VALUES ('student@test.com', 'Test Student', 'student', '{}'::uuid[], '${userId}') ON CONFLICT (email) DO NOTHING`);
      if (testOfferingId !== '11111111-1111-1111-1111-111111111111') {
        await client.query(`INSERT INTO public.enrollments (student_id, offering_id) VALUES ('${userId}', '${testOfferingId}') ON CONFLICT DO NOTHING`);
      }
    } else if (role === 'teacher') {
      await client.query(`INSERT INTO public.profiles (id, role, full_name) VALUES ('${userId}', 'teacher', 'Test Teacher') ON CONFLICT (id) DO NOTHING`);
      await client.query(`INSERT INTO public.teachers (id, full_name, email) VALUES ('${userId}', 'Test Teacher', 'teacher@test.com') ON CONFLICT (id) DO NOTHING`);
      await client.query(`INSERT INTO public.roster (email, full_name, role, class_ids, profile_id) VALUES ('teacher@test.com', 'Test Teacher', 'teacher', '{}'::uuid[], '${userId}') ON CONFLICT (email) DO NOTHING`);
      if (testOfferingId !== '11111111-1111-1111-1111-111111111111') {
        await client.query(`UPDATE public.class_offerings SET teacher_id = '${userId}' WHERE id = '${testOfferingId}'`);
      }
    } else if (role === 'admin') {
      await client.query(`INSERT INTO public.profiles (id, role, full_name) VALUES ('${userId}', 'admin', 'Test Admin') ON CONFLICT (id) DO NOTHING`);
    }

    await client.query(`SET LOCAL role = 'authenticated'`);
    await client.query(`SET LOCAL request.jwt.claims = '{"sub": "${userId}", "role": "authenticated"}'`);
    
    for (const q of queries) {
      try {
        const res = await client.query(q.sql);
        console.log(`✅ [${name}] ${q.name}: ${res.rowCount} rows affected/returned.`);
      } catch (err) {
        if (q.expectError) {
          console.log(`✅ [${name}] ${q.name}: Successfully blocked (${err.message})`);
        } else {
          console.log(`❌ [${name}] ${q.name} FAILED: ${err.message}`);
        }
      }
    }
    await client.query('ROLLBACK');
  }

  await testAs(users.student, 'student', 'Student', [
    { name: 'Read classes', sql: 'SELECT id FROM public.classes LIMIT 1' },
    { name: 'Read notes', sql: 'SELECT id FROM public.notes LIMIT 1' },
    { name: 'Update profile role (escalation)', sql: `UPDATE public.profiles SET role = 'admin' WHERE id = '${users.student}'`, expectError: true }
  ]);

  await testAs(users.teacher, 'teacher', 'Teacher', [
    { name: 'Read classes', sql: 'SELECT id FROM public.classes LIMIT 1' },
    { name: 'Insert Note for own class', sql: `INSERT INTO public.notes (id, offering_id, title, file_path, file_url, file_type, chapter_name, uploaded_by) VALUES (gen_random_uuid(), '${testOfferingId}', 'Test Note', 'content', 'http://test.com/note', 'pdf', 'Chapter 1', '${users.teacher}') RETURNING id` },
    { name: 'Insert Note for random class (should fail or return 0 rows if using DO update, but standard insert with RLS check violation throws)', sql: `INSERT INTO public.notes (id, offering_id, title, file_path, file_url, file_type, chapter_name, uploaded_by) VALUES (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Hax', 'Hax', 'http://test.com/hax', 'pdf', 'Chapter 1', '${users.teacher}')`, expectError: true },
    { name: 'Update profile role', sql: `UPDATE public.profiles SET role = 'admin' WHERE id = '${users.teacher}' RETURNING id`, expectError: true }
  ]);

  await testAs(users.admin, 'admin', 'Admin', [
    { name: 'Read classes', sql: 'SELECT id FROM public.classes LIMIT 1' },
    { name: 'Insert classes', sql: `INSERT INTO public.classes (id, board_id, grade, display_name) VALUES (gen_random_uuid(), 'fbise', '13', '13th Class') RETURNING id` }
  ]);

  console.log('\n--- Checking Privilege Escalation Results ---');
  await client.query('BEGIN');
  await client.query(`INSERT INTO public.profiles (id, role, full_name) VALUES ('${users.student}', 'student', 'Test Student') ON CONFLICT (id) DO NOTHING`);
  await client.query(`SET LOCAL role = 'authenticated'`);
  await client.query(`SET LOCAL request.jwt.claims = '{"sub": "${users.student}", "role": "authenticated"}'`);
  let escalationBlocked = false;
  try {
    const escRes = await client.query(`UPDATE public.profiles SET role = 'admin' WHERE id = '${users.student}' RETURNING id`);
    if (escRes.rowCount === 0) escalationBlocked = true;
  } catch (err) {
    if (err.message.includes('Privilege escalation blocked') || err.message.includes('escalation')) {
      escalationBlocked = true;
    }
  }
  
  if (escalationBlocked) {
    console.log(`✅ Privilege escalation correctly blocked by RLS/Trigger.`);
  } else {
    console.log(`❌ Privilege escalation SUCCEEDED! (Security hole active)`);
  }
  await client.query('ROLLBACK');

  await client.end();
}

verify().catch(console.error);
