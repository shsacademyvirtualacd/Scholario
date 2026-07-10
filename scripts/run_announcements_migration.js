import fs from 'fs';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;
const DB_URL = 'postgresql://postgres:Marcelmmm23155@@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres';

const client = new Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log('✅ Connected to Supabase postgres');

  const sqlPath = path.join(__dirname, '..', 'supabase_announcements_migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Running announcements migration...');
  try {
    await client.query(sql);
    console.log('✅ Announcements migration completed successfully!');
    
    // Also notify PostgREST schema cache reload so createAnnouncement doesn't say "Could not find the table in the schema cache"
    console.log('Reloading PostgREST schema cache...');
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log('✅ PostgREST schema cache reloaded!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await client.end();
  }
}

main();
