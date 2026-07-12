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

    console.log("=== CLASSES ===");
    const classes = await client.query("SELECT id, display_name FROM public.classes");
    console.log(classes.rows);

    console.log("=== STREAMS ===");
    const streams = await client.query("SELECT id, name, class_id FROM public.streams");
    console.log(streams.rows);

    console.log("=== SUBJECTS ===");
    const subjects = await client.query("SELECT id, name FROM public.subjects");
    console.log(subjects.rows);

    console.log("=== ALL CLASS OFFERINGS ===");
    const offerings = await client.query(`
      SELECT 
        co.id as offering_id, 
        c.display_name as class_name, 
        st.name as stream_name, 
        s.name as subject_name,
        co.class_id,
        co.stream_id,
        co.subject_id
      FROM public.class_offerings co
      LEFT JOIN public.classes c ON co.class_id = c.id
      LEFT JOIN public.streams st ON co.stream_id = st.id
      LEFT JOIN public.subjects s ON co.subject_id = s.id
    `);
    console.log(JSON.stringify(offerings.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
