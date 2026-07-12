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

    console.log("Applying RLS fixes...");

    await client.query(`
      DROP POLICY IF EXISTS "roster: select own" ON public.roster;
      CREATE POLICY "roster: select own" ON public.roster FOR SELECT
        USING (
          email = LOWER(auth.jwt()->>'email')
          OR EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin')
        );

      DROP POLICY IF EXISTS "roster: select own by email" ON public.roster;

      DROP POLICY IF EXISTS "roster: self link" ON public.roster;
      CREATE POLICY "roster: self link" ON public.roster FOR UPDATE
        USING (email = LOWER(auth.jwt()->>'email'))
        WITH CHECK (email = LOWER(auth.jwt()->>'email'));
    `);

    console.log("Successfully updated policies.");
    
    // Verify the update
    const res = await client.query(`
      SELECT 
        policyname,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE qual ILIKE '%jwt()%' OR with_check ILIKE '%jwt()%'
      ORDER BY policyname;
    `);
    
    console.log("Current policies:");
    console.log(JSON.stringify(res.rows, null, 2));

  } catch (err) {
    console.error("Error executing query", err);
  } finally {
    await client.end();
  }
}

run();
