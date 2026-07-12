const { Client } = require('pg');
const fs = require('fs');
const path = require('path');


async function runFix() {
  const connectionString = process.env.SUPABASE_DB_URL;
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

    const sqlPath = path.join(__dirname, 'supabase_security_fix_rls.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running SQL script...');
    await client.query(sql);
    console.log('SQL script executed successfully.');

  } catch (error) {
    console.error('Error executing SQL:', error);
  } finally {
    await client.end();
  }
}

runFix();
