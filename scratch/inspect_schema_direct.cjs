const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].replace(/['"]/g, '').trim();
  });
  return env;
}

async function run() {
  const env = loadEnv();
  const dbUrl = env.SUPABASE_DB_URL;
  if (!dbUrl) throw new Error("SUPABASE_DB_URL not found");

  // Use direct connection string
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  console.log("Connecting directly...");
  await client.connect();
  console.log("Connected to database.");

  const output = {};

  // 1. Get Tables & Columns
  console.log("Fetching columns...");
  const tablesRes = await client.query(`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);
  output.columns = tablesRes.rows;
  console.log(`Fetched ${tablesRes.rowCount} columns.`);

  // 2. Get RLS Status
  console.log("Fetching RLS status...");
  const rlsStatusRes = await client.query(`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public';
  `);
  output.rls_status = rlsStatusRes.rows;
  console.log(`Fetched RLS status for ${rlsStatusRes.rowCount} tables.`);

  // 3. Get RLS Policies
  console.log("Fetching RLS policies...");
  const policiesRes = await client.query(`
    SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public';
  `);
  output.policies = policiesRes.rows;
  console.log(`Fetched ${policiesRes.rowCount} policies.`);

  // 4. Get Foreign Keys
  console.log("Fetching foreign keys...");
  const fkRes = await client.query(`
    SELECT
        tc.table_name AS from_table, 
        kcu.column_name AS from_column, 
        ccu.table_name AS to_table,
        ccu.column_name AS to_column
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public';
  `);
  output.foreign_keys = fkRes.rows;
  console.log(`Fetched ${fkRes.rowCount} foreign keys.`);

  // 5. Get Triggers
  console.log("Fetching triggers...");
  const triggersRes = await client.query(`
    SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement,
        action_timing
    FROM information_schema.triggers
    WHERE trigger_schema = 'public';
  `);
  output.triggers = triggersRes.rows;
  console.log(`Fetched ${triggersRes.rowCount} triggers.`);

  // 6. Get User-defined Functions
  console.log("Fetching functions...");
  const functionsRes = await client.query(`
    SELECT 
        p.proname as routine_name,
        pg_get_functiondef(p.oid) as definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public';
  `);
  output.functions = functionsRes.rows;
  console.log(`Fetched ${functionsRes.rowCount} functions.`);

  // 7. Get pg_cron Jobs
  console.log("Fetching pg_cron jobs...");
  try {
    const cronRes = await client.query(`
      SELECT jobid, schedule, command, nodename, nodeport, database, username, active
      FROM cron.job;
    `);
    output.cron_jobs = cronRes.rows;
    console.log(`Fetched ${cronRes.rowCount} cron jobs.`);
  } catch (e) {
    output.cron_jobs = { error: e.message };
    console.log(`Failed to fetch cron jobs: ${e.message}`);
  }

  // 8. Storage Buckets & Policies
  console.log("Fetching storage buckets...");
  try {
    const bucketsRes = await client.query(`SELECT id, name, public FROM storage.buckets;`);
    output.storage_buckets = bucketsRes.rows;
    console.log(`Fetched ${bucketsRes.rowCount} storage buckets.`);
  } catch (e) {
    output.storage_buckets = { error: e.message };
    console.log(`Failed to fetch storage buckets: ${e.message}`);
  }
  
  console.log("Fetching storage policies...");
  try {
    const storagePoliciesRes = await client.query(`
      SELECT policyname, tablename, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE schemaname = 'storage' AND tablename = 'objects';
    `);
    output.storage_policies = storagePoliciesRes.rows;
    console.log(`Fetched ${storagePoliciesRes.rowCount} storage policies.`);
  } catch (e) {
    output.storage_policies = { error: e.message };
    console.log(`Failed to fetch storage policies: ${e.message}`);
  }

  fs.writeFileSync(
    path.resolve(__dirname, 'db_schema_dump.json'), 
    JSON.stringify(output, null, 2), 
    'utf-8'
  );
  console.log("Schema dumped successfully to db_schema_dump.json");
  await client.end();
}

run().catch(console.error);
