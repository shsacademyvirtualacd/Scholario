import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log('Connected to DB');

  await client.query(`
    CREATE TABLE IF NOT EXISTS class_session_links (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slot_id UUID NOT NULL REFERENCES class_slots(id) ON DELETE CASCADE,
      offering_id UUID REFERENCES class_offerings(id) ON DELETE CASCADE,
      session_date DATE NOT NULL,
      link_url TEXT NOT NULL,
      created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
      CONSTRAINT class_session_links_slot_date_key UNIQUE (slot_id, session_date)
    );

    CREATE INDEX IF NOT EXISTS idx_class_session_links_slot_date ON class_session_links(slot_id, session_date);
    CREATE INDEX IF NOT EXISTS idx_class_session_links_session_date ON class_session_links(session_date);

    ALTER TABLE class_session_links ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow authenticated read on class_session_links" ON class_session_links;
    CREATE POLICY "Allow authenticated read on class_session_links"
      ON class_session_links FOR SELECT
      TO authenticated
      USING (true);

    DROP POLICY IF EXISTS "Allow anon read on class_session_links" ON class_session_links;
    CREATE POLICY "Allow anon read on class_session_links"
      ON class_session_links FOR SELECT
      TO anon
      USING (true);

    DROP POLICY IF EXISTS "Allow authenticated insert on class_session_links" ON class_session_links;
    CREATE POLICY "Allow authenticated insert on class_session_links"
      ON class_session_links FOR INSERT
      TO authenticated
      WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow authenticated update on class_session_links" ON class_session_links;
    CREATE POLICY "Allow authenticated update on class_session_links"
      ON class_session_links FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow authenticated delete on class_session_links" ON class_session_links;
    CREATE POLICY "Allow authenticated delete on class_session_links"
      ON class_session_links FOR DELETE
      TO authenticated
      USING (true);

    -- Ensure realtime publication includes class_session_links
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'class_session_links'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE class_session_links;
      END IF;
    END $$;
  `);

  console.log('class_session_links created and configured successfully!');
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
