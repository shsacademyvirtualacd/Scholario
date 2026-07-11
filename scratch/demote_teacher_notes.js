import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log('Connected to Supabase via Pooler');

  console.log('Demoting teacher access to Notes: Revoking INSERT and updating DELETE/UPDATE...');
  await client.query(`
    -- Drop existing policies
    DROP POLICY IF EXISTS "notes: insert" ON public.notes;
    DROP POLICY IF EXISTS "notes: update" ON public.notes;
    DROP POLICY IF EXISTS "notes: delete" ON public.notes;

    -- Create new INSERT policy (Admin only)
    CREATE POLICY "notes: insert" ON public.notes FOR INSERT
    WITH CHECK (is_admin());

    -- Create new UPDATE policy (Admin only)
    CREATE POLICY "notes: update" ON public.notes FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

    -- Create new DELETE policy (Admin only)
    CREATE POLICY "notes: delete" ON public.notes FOR DELETE
    USING (is_admin());
  `);
  console.log('Successfully demoted teacher write access to Notes.\n');

  console.log('=== NEW RLS POLICIES FOR notes ===');
  const res = await client.query(`
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename = 'notes'
    ORDER BY cmd;
  `);
  console.table(res.rows);

  await client.end();
}

main().catch(console.error);
