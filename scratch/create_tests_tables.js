import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL DB');

  // 1. Create tests table
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.tests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      instructions TEXT,
      subject TEXT NOT NULL,
      grade TEXT NOT NULL,
      stream TEXT NOT NULL DEFAULT 'all',
      offering_id UUID REFERENCES public.class_offerings(id) ON DELETE SET NULL,
      teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      teacher_name TEXT,
      file_url TEXT NOT NULL,
      file_path TEXT,
      file_type TEXT NOT NULL DEFAULT 'pdf',
      file_size_bytes BIGINT,
      total_marks INTEGER NOT NULL DEFAULT 100,
      due_date TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('Created tests table');

  // 2. Create test_submissions table
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.test_submissions (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      student_name TEXT,
      student_email TEXT,
      file_url TEXT NOT NULL,
      file_path TEXT,
      file_type TEXT NOT NULL DEFAULT 'pdf',
      file_size_bytes BIGINT,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'submitted',
      marks_obtained NUMERIC,
      max_marks NUMERIC,
      teacher_feedback TEXT,
      graded_at TIMESTAMPTZ,
      graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
    );
  `);
  console.log('Created test_submissions table');

  // 3. Create indexes
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_tests_grade ON public.tests(grade);
    CREATE INDEX IF NOT EXISTS idx_tests_subject ON public.tests(subject);
    CREATE INDEX IF NOT EXISTS idx_tests_created_at ON public.tests(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_test_submissions_test_id ON public.test_submissions(test_id);
    CREATE INDEX IF NOT EXISTS idx_test_submissions_student_id ON public.test_submissions(student_id);
    CREATE INDEX IF NOT EXISTS idx_test_submissions_submitted_at ON public.test_submissions(submitted_at DESC);
  `);
  console.log('Created indexes');

  // 4. Enable RLS and create policies
  await client.query(`
    ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.test_submissions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Enable read access for all users" ON public.tests;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.tests;
    DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.tests;
    DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.tests;

    CREATE POLICY "Enable read access for all users" ON public.tests
      FOR SELECT USING (true);

    CREATE POLICY "Enable insert for authenticated users" ON public.tests
      FOR INSERT WITH CHECK (true);

    CREATE POLICY "Enable update for authenticated users" ON public.tests
      FOR UPDATE USING (true) WITH CHECK (true);

    CREATE POLICY "Enable delete for authenticated users" ON public.tests
      FOR DELETE USING (true);

    DROP POLICY IF EXISTS "Enable read access for all users" ON public.test_submissions;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.test_submissions;
    DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.test_submissions;
    DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.test_submissions;

    CREATE POLICY "Enable read access for all users" ON public.test_submissions
      FOR SELECT USING (true);

    CREATE POLICY "Enable insert for authenticated users" ON public.test_submissions
      FOR INSERT WITH CHECK (true);

    CREATE POLICY "Enable update for authenticated users" ON public.test_submissions
      FOR UPDATE USING (true) WITH CHECK (true);

    CREATE POLICY "Enable delete for authenticated users" ON public.test_submissions
      FOR DELETE USING (true);
  `);
  console.log('Created RLS policies');

  // 5. Add to supabase_realtime publication
  try {
    await client.query(`
      ALTER PUBLICATION supabase_realtime ADD TABLE public.tests;
      ALTER PUBLICATION supabase_realtime ADD TABLE public.test_submissions;
    `);
    console.log('Added tests and test_submissions to supabase_realtime publication');
  } catch (pubErr) {
    console.log('Publication notice:', pubErr.message);
  }

  await client.end();
  console.log('Database migration completed successfully!');
}

main().catch(console.error);
