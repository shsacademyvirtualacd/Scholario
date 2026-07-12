const pg = require('pg');
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
  try {
    await client.connect();
    console.log("Connected to database successfully.");

    // Query profiles and check auth status for all of them
    const res = await client.query(`
      SELECT 
        p.id, 
        p.full_name, 
        p.role, 
        p.created_at,
        CASE WHEN au.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_auth_user,
        au.email as auth_user_email
      FROM public.profiles p
      LEFT JOIN auth.users au ON p.id = au.id;
    `);
    console.log("\n=== ALL PROFILES & AUTH USER STATUS ===");
    console.table(res.rows);

  } catch (err) {
    console.error("Error executing query", err);
  } finally {
    await client.end();
  }
}

run();
