const { Client } = require('pg');

const dbUrl = process.env.SUPABASE_DB_URL || 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres';

async function run() {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log("Connected to database successfully.");

    console.log("\n--- STEP 0: ENUMERATE FOREIGN KEYS REFERENCING profiles.id ---");
    const fkQuery = `
      SELECT
        tc.table_schema, 
        tc.table_name, 
        kcu.column_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name='profiles' AND ccu.column_name='id';
    `;
    const fks = await client.query(fkQuery);
    console.table(fks.rows);

    console.log("\n--- REQUIREMENT 1: DUMMY ACCOUNTS IN PROFILES ---");
    const dummyQuery = `
      SELECT 
        p.id, p.email, p.full_name, p.role, p.class_id, p.created_at,
        CASE WHEN au.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_auth_user
      FROM public.profiles p
      LEFT JOIN auth.users au ON p.id = au.id
      WHERE p.email LIKE '%@scholario.app'
    `;
    const dummies = await client.query(dummyQuery);
    console.table(dummies.rows);

    console.log("\n--- REQUIREMENT 2: CORRELATE DUMMY ACCOUNTS WITH REAL ONES ---");
    const correlateQuery = `
      SELECT 
        d.id as dummy_id, d.email as dummy_email, d.full_name as dummy_name,
        r.id as real_id, r.email as real_email, r.full_name as real_name
      FROM public.profiles d
      JOIN public.profiles r 
        ON d.full_name = r.full_name 
        AND d.role = r.role 
        AND d.id != r.id
      WHERE d.email LIKE '%@scholario.app' 
        AND r.email NOT LIKE '%@scholario.app'
    `;
    const correlations = await client.query(correlateQuery);
    console.table(correlations.rows);

  } catch (err) {
    console.error("Error executing query", err);
  } finally {
    await client.end();
  }
}

run();
