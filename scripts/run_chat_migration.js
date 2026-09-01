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

  const sqlPath = path.join(__dirname, '..', 'supabase_chat_migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Running chat migration...');
  try {
    await client.query(sql);
    console.log('✅ Chat migration completed successfully!');
    
    // Reload PostgREST schema cache
    console.log('Reloading PostgREST schema cache...');
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log('✅ PostgREST schema cache reloaded!');

    // Verify
    const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('chat_threads', 'chat_messages')`);
    console.log('✅ Verified tables:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
