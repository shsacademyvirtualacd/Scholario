import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load env variables from .env.local manually
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
      // Remove surrounding quotes if any
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

  // Get query from args
  const args = process.argv.slice(2);
  let query = args.join(' ').trim();

  if (!query) {
    console.error('Usage: node scripts/query.js "<sql_query>" or node scripts/query.js <sql_file_path>');
    process.exit(1);
  }

  // If argument points to a file, read the file instead
  if (fs.existsSync(query) && query.endsWith('.sql')) {
    query = fs.readFileSync(query, 'utf-8');
  }

  // Parse the connection URL using URL class
  let connectionConfig = {};
  try {
    const parsedUrl = new URL(dbUrl);
    
    // Extract credentials
    const user = decodeURIComponent(parsedUrl.username);
    const password = decodeURIComponent(parsedUrl.password);
    const host = parsedUrl.hostname;
    const database = parsedUrl.pathname.slice(1); // Remove leading slash
    
    connectionConfig = {
      user,
      password,
      host,
      port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 5432,
      database
    };

    // If the host is db.[ref].supabase.co, we map it to the IPv4 pooler
    const dbHostMatch = host.match(/^db\.([^.]+)\.supabase\.co$/);
    if (dbHostMatch) {
      const projectRef = dbHostMatch[1];
      // Use the active Singapore IPv4 pooler
      connectionConfig.host = `aws-1-ap-southeast-1.pooler.supabase.com`;
      connectionConfig.port = 5432; // session mode pooler (best for direct CLI queries)
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
    const res = await client.query({
      text: query,
      rowMode: 'array'
    });

    if (Array.isArray(res)) {
      console.log(JSON.stringify(res, null, 2));
    } else {
      const { fields, rows } = res;
      if (fields && fields.length > 0) {
        // Output as markdown table
        const headers = fields.map(f => f.name);
        const colWidths = headers.map(h => h.length);
        
        // Convert rows to strings and calculate column widths
        const stringRows = rows.map(row => {
          return row.map((val, colIdx) => {
            let str = '';
            if (val === null) str = 'NULL';
            else if (typeof val === 'object') str = JSON.stringify(val);
            else str = String(val);
            if (str.length > colWidths[colIdx]) {
              colWidths[colIdx] = str.length;
            }
            return str;
          });
        });

        // Print header
        const headerLine = '| ' + headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ') + ' |';
        const separatorLine = '| ' + colWidths.map(w => '-'.repeat(w)).join(' | ') + ' |';
        console.log(headerLine);
        console.log(separatorLine);
        
        // Print rows
        stringRows.forEach(row => {
          console.log('| ' + row.map((val, i) => val.padEnd(colWidths[i])).join(' | ') + ' |');
        });
        
        console.log(`\n(${res.rowCount} row(s) returned)`);
      } else {
        console.log(`Command completed successfully. Affected rows: ${res.rowCount}`);
      }
    }
  } catch (err) {
    console.error('Error executing query:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
