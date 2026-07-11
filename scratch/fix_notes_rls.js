import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log('Connected to Supabase via Pooler');

  console.log('Applying RLS fixes for UPDATE and DELETE...');
  await client.query(`
    -- Create UPDATE policy
    CREATE POLICY "notes: update" ON public.notes FOR UPDATE
    USING (uploaded_by = auth.uid() OR is_admin());

    -- Drop existing DELETE policies
    DROP POLICY IF EXISTS "notes: delete" ON public.notes;
    DROP POLICY IF EXISTS "notes: teacher+admin delete" ON public.notes;

    -- Create new DELETE policy
    CREATE POLICY "notes: delete" ON public.notes FOR DELETE
    USING (uploaded_by = auth.uid() OR is_admin());
  `);
  console.log('Successfully applied RLS fixes.\n');

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
