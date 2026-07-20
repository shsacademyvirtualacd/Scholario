import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local file not found');
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[match[1].trim()] = value;
    }
  });
  return env;
}

async function main() {
  const env = loadEnv();
  const dbUrl = env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('SUPABASE_DB_URL is not defined in .env.local');
    process.exit(1);
  }

  let connectionConfig = {};
  try {
    const parsedUrl = new URL(dbUrl);
    const user = decodeURIComponent(parsedUrl.username);
    const password = decodeURIComponent(parsedUrl.password);
    const host = parsedUrl.hostname;
    const database = parsedUrl.pathname.slice(1);
    
    connectionConfig = {
      user,
      password,
      host,
      port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 5432,
      database
    };

    const dbHostMatch = host.match(/^db\.([^.]+)\.supabase\.co$/);
    if (dbHostMatch) {
      const projectRef = dbHostMatch[1];
      connectionConfig.host = `aws-1-ap-southeast-1.pooler.supabase.com`;
      connectionConfig.port = 5432;
      connectionConfig.user = `${user}.${projectRef}`;
    }
  } catch (err) {
    console.error('Failed to parse SUPABASE_DB_URL:', err.message);
    process.exit(1);
  }

  const client = new pg.Client({
    ...connectionConfig,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Start a transaction
    await client.query('BEGIN');

    // 1. Create a mock placeholder profile and a mock roster entry
    const mockPlaceholderId = '00000000-0000-0000-0000-000000000001';
    const mockRealId = '11111111-1111-1111-1111-111111111111';
    const mockEmail = 'test_mock_teacher_claim@scholario.internal';

    console.log('1. Setting up mock data in profiles and roster...');
    await client.query(`
      INSERT INTO public.profiles (id, role, full_name, onboarding_complete)
      VALUES ('${mockPlaceholderId}', 'teacher', 'Mock Teacher Placeholder', false)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Verify it was inserted
    const profCheck = await client.query(`SELECT * FROM public.profiles WHERE id = '${mockPlaceholderId}'`);
    console.log(`Inserted placeholder profile:`, profCheck.rows[0]);

    await client.query(`
      INSERT INTO public.roster (email, full_name, role, profile_id)
      VALUES ('${mockEmail}', 'Mock Teacher Claim', 'teacher', '${mockPlaceholderId}')
      ON CONFLICT (email) DO NOTHING;
    `);

    // Verify roster entry was inserted
    const rosterCheck = await client.query(`SELECT * FROM public.roster WHERE email = '${mockEmail}'`);
    console.log(`Inserted roster entry:`, rosterCheck.rows[0]);

    // 2. Set request context to simulate the mock logged-in user
    console.log('2. Simulating authentication for client...');
    await client.query(`
      SET LOCAL request.jwt.claims = '{"sub": "${mockRealId}", "email": "${mockEmail}", "role": "authenticated"}';
    `);

    // 3. Call claim_my_roster_profile
    console.log('3. Invoking claim_my_roster_profile()...');
    const rpcRes = await client.query(`
      SELECT * FROM public.claim_my_roster_profile();
    `);
    console.log('claim_my_roster_profile() returned:', rpcRes.rows[0]);

    // 4. Verify results
    console.log('4. Verifying database changes...');
    
    // Roster profile_id should be updated to mockRealId
    const updatedRoster = await client.query(`SELECT * FROM public.roster WHERE email = '${mockEmail}'`);
    console.log('Updated roster entry profile_id:', updatedRoster.rows[0].profile_id);
    if (updatedRoster.rows[0].profile_id !== mockRealId) {
      throw new Error(`Roster profile_id was not updated to ${mockRealId}!`);
    }

    // New profile row should exist under mockRealId, role = 'teacher', onboarding_complete = true
    const newProfile = await client.query(`SELECT * FROM public.profiles WHERE id = '${mockRealId}'`);
    console.log('Promoted profile row:', newProfile.rows[0]);
    if (!newProfile.rows[0]) {
      throw new Error('Promoted profile was not created!');
    }
    if (newProfile.rows[0].onboarding_complete !== true) {
      throw new Error('onboarding_complete should be true for teachers!');
    }

    // Old placeholder profile row should be deleted
    const oldProfile = await client.query(`SELECT * FROM public.profiles WHERE id = '${mockPlaceholderId}'`);
    console.log('Checking if placeholder profile was deleted (should be empty):', oldProfile.rows);
    if (oldProfile.rows.length > 0) {
      throw new Error('Placeholder profile was not deleted by the trigger!');
    }

    console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');

    // Rollback so we don't pollute the database with mock test data
    await client.query('ROLLBACK');
    console.log('Transaction rolled back successfully');

  } catch (err) {
    console.error('❌ TEST FAILED:', err.message);
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
