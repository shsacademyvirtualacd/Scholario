import pg from 'pg';
const { Client } = pg;

const DB_URL = 'postgresql://postgres:Marcelmmm23155@@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres';

const client = new Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log('Connected to DB');

  // 1. Get columns info
  console.log('=== COLUMNS ===');
  const colsRes = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notes'
    ORDER BY ordinal_position;
  `);
  console.log(JSON.stringify(colsRes.rows, null, 2));

  // 2. Get foreign keys
  console.log('=== FOREIGN KEYS ===');
  const fkRes = await client.query(`
    SELECT
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='notes';
  `);
  console.log(JSON.stringify(fkRes.rows, null, 2));

  // 3. Get indexes
  console.log('=== INDEXES ===');
  const idxRes = await client.query(`
    SELECT
        tablename,
        indexname,
        indexdef
    FROM
        pg_indexes
    WHERE
        schemaname = 'public' AND tablename = 'notes';
  `);
  console.log(JSON.stringify(idxRes.rows, null, 2));

  // 4. Get RLS policies
  console.log('=== RLS POLICIES ===');
  const rlsRes = await client.query(`
    SELECT
        policyname,
        roles,
        cmd,
        qual,
        with_check
    FROM
        pg_policies
    WHERE
        schemaname = 'public' AND tablename = 'notes';
  `);
  console.log(JSON.stringify(rlsRes.rows, null, 2));

  // 5. Check references to supabase.co/storage
  console.log('=== REFERENCES TO supabase.co/storage ===');
  const refRes = await client.query(`
    SELECT
        tc.table_name, 
        cc.column_name, 
        cc.check_clause
    FROM 
        information_schema.check_constraints tc
        JOIN information_schema.constraint_column_usage cc ON tc.constraint_name = cc.constraint_name
    WHERE cc.check_clause LIKE '%supabase.co/storage%' OR cc.check_clause LIKE '%supabase%';
  `);
  console.log(JSON.stringify(refRes.rows, null, 2));

  // Let's check check constraints specifically for table public.notes
  const checkNotes = await client.query(`
    SELECT
        con.conname AS constraint_name,
        pg_get_constraintdef(con.oid) AS constraint_definition
    FROM
        pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE
        nsp.nspname = 'public' AND rel.relname = 'notes';
  `);
  console.log('=== NOTES TABLE CONSTRAINTS ===');
  console.log(JSON.stringify(checkNotes.rows, null, 2));

  // 6. Look at actual rows in the notes table
  console.log('=== ROWS IN NOTES TABLE ===');
  const rowsRes = await client.query(`
    SELECT id, offering_id, chapter_name, title, file_url, file_path, file_type, uploaded_by, created_at
    FROM public.notes
    ORDER BY created_at DESC;
  `);
  console.log(JSON.stringify(rowsRes.rows, null, 2));

  // 7. Check duplicates
  console.log('=== DUPLICATE ANALYSIS ===');
  const dupRes = await client.query(`
    SELECT title, offering_id, count(*), array_agg(id) as ids, array_agg(file_path) as file_paths, array_agg(file_url) as file_urls, array_agg(created_at) as created_ats
    FROM public.notes
    GROUP BY title, offering_id
    HAVING count(*) > 1;
  `);
  console.log(JSON.stringify(dupRes.rows, null, 2));

  await client.end();
}

main().catch(console.error);
