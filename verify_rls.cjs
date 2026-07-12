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

  async function testAs(userId, name, queries) {
    console.log(`\n--- Testing as ${name} (${userId}) ---`);
    await client.query('BEGIN');
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

  // Find a class offering for the teacher to test note upload
  const teacherOfferingRes = await client.query(`SELECT id FROM public.class_offerings WHERE teacher_id = '${users.teacher}' LIMIT 1`);
  const teacherOfferingId = teacherOfferingRes.rows[0]?.id || '11111111-1111-1111-1111-111111111111';

  await testAs(users.student, 'Student', [
    { name: 'Read classes', sql: 'SELECT id FROM public.classes LIMIT 1' },
    { name: 'Read notes', sql: 'SELECT id FROM public.notes LIMIT 1' },
    { name: 'Update profile role (escalation)', sql: `UPDATE public.profiles SET role = 'admin' WHERE id = '${users.student}'`, expectError: false }
    // Wait, update might succeed if we don't have expectError:true, let's check if rows affected is 0
  ]);

  await testAs(users.teacher, 'Teacher', [
    { name: 'Read classes', sql: 'SELECT id FROM public.classes LIMIT 1' },
    { name: 'Insert Note for own class', sql: `INSERT INTO public.notes (id, offering_id, title, file_path, chapter_name, uploaded_by) VALUES (gen_random_uuid(), '${teacherOfferingId}', 'Test Note', 'content', 'Chapter 1', '${users.teacher}') RETURNING id` },
    { name: 'Insert Note for random class (should fail or return 0 rows if using DO update, but standard insert with RLS check violation throws)', sql: `INSERT INTO public.notes (id, offering_id, title, file_path, chapter_name, uploaded_by) VALUES (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Hax', 'Hax', 'Chapter 1', '${users.teacher}')`, expectError: true },
    { name: 'Update profile role', sql: `UPDATE public.profiles SET role = 'admin' WHERE id = '${users.teacher}' RETURNING id`, expectError: true }
  ]);

  await testAs(users.admin, 'Admin', [
    { name: 'Read classes', sql: 'SELECT id FROM public.classes LIMIT 1' },
    { name: 'Insert classes', sql: `INSERT INTO public.classes (id, name, level) VALUES (gen_random_uuid(), 'Admin Class', 'A') RETURNING id` }
  ]);

  // Actually checking role escalation: RLS policy on profiles usually blocks update to role, or we check if rows affected = 0.
  // So we run a separate test for the role update to strictly verify it returns 0 rows modified or throws.

  console.log('\n--- Checking Privilege Escalation Results ---');
  // Re-run the update as student and check row count
  await client.query('BEGIN');
  await client.query(`SET LOCAL role = 'authenticated'`);
  await client.query(`SET LOCAL request.jwt.claims = '{"sub": "${users.student}", "role": "authenticated"}'`);
  let escalationBlocked = false;
  try {
    const escRes = await client.query(`UPDATE public.profiles SET role = 'admin' WHERE id = '${users.student}' RETURNING id`);
    if (escRes.rowCount === 0) escalationBlocked = true;
  } catch (err) {
    if (err.message.includes('Privilege escalation blocked')) {
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
