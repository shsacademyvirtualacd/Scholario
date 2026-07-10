// Scholario — Complete DB migration runner
// Runs all SQL in the correct dependency order via direct postgres connection
// Usage: node scripts/run_migrations.js

import pg from 'pg';
const { Client } = pg;

const DB_URL = 'postgresql://postgres:Marcelmmm23155@@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres';

const client = new Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

// ─── Helper ───────────────────────────────────────────────────────────────────
async function run(label, sql) {
  try {
    await client.query(sql);
    console.log(`  ✅ ${label}`);
  } catch (e) {
    // Already-exists errors are fine for idempotent migrations
    const ignorable = [
      '42P07', // duplicate_table
      '42710', // duplicate_object (policy/index already exists)
      '42701', // duplicate_column
      '23505', // unique_violation (already inserted)
    ];
    if (ignorable.includes(e.code)) {
      console.log(`  ⚠️  ${label} — already exists (skipped)`);
    } else {
      console.error(`  ❌ ${label} — ${e.message} (code: ${e.code})`);
      throw e;
    }
  }
}

async function main() {
  await client.connect();
  console.log('✅ Connected to Supabase postgres\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: Schema — add missing columns
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('PHASE 1: Schema columns');

  await run('profiles.stream column',
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stream text`);

  await run('profiles.avatar_url column',
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text`);

  await run('profiles.created_at column',
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()`);

  await run('profiles.onboarding_complete column',
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false`);

  await run('teachers.avatar_url column',
    `ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS avatar_url text`);

  await run('teachers.phone column',
    `ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS phone text`);

  await run('teachers.created_at column',
    `ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()`);

  await run('profiles role constraint',
    `ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
     ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'teacher', 'admin'))`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: Fee tables (must exist before policies reference them)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\nPHASE 2: Fee tables');

  await run('fee_configs table',
    `CREATE TABLE IF NOT EXISTS public.fee_configs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      class_id uuid UNIQUE REFERENCES public.class_offerings(id) ON DELETE CASCADE,
      amount numeric NOT NULL CHECK (amount >= 0),
      payment_instructions text NOT NULL,
      whatsapp_number text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )`);

  await run('fee_statuses table',
    `CREATE TABLE IF NOT EXISTS public.fee_statuses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
      status text NOT NULL CHECK (status IN ('unpaid', 'pending', 'paid')) DEFAULT 'unpaid',
      updated_at timestamptz DEFAULT now()
    )`);

  await run('fee_audit_trail table',
    `CREATE TABLE IF NOT EXISTS public.fee_audit_trail (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
      status_from text NOT NULL,
      status_to text NOT NULL,
      changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      changed_at timestamptz DEFAULT now(),
      notes text
    )`);

  await run('RLS enable fee_configs',
    `ALTER TABLE public.fee_configs ENABLE ROW LEVEL SECURITY`);
  await run('RLS enable fee_statuses',
    `ALTER TABLE public.fee_statuses ENABLE ROW LEVEL SECURITY`);
  await run('RLS enable fee_audit_trail',
    `ALTER TABLE public.fee_audit_trail ENABLE ROW LEVEL SECURITY`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3: Helper functions
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\nPHASE 3: Helper functions');

  await run('get_my_role()',
    `CREATE OR REPLACE FUNCTION public.get_my_role()
     RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
       SELECT role FROM public.profiles WHERE id = auth.uid();
     $$`);

  await run('is_admin()',
    `CREATE OR REPLACE FUNCTION public.is_admin()
     RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
       SELECT EXISTS (
         SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
       );
     $$`);

  await run('my_enrolled_offering_ids()',
    `CREATE OR REPLACE FUNCTION public.my_enrolled_offering_ids()
     RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
       SELECT ARRAY(SELECT offering_id FROM public.enrollments WHERE student_id = auth.uid());
     $$`);

  await run('my_teacher_offering_ids()',
    `CREATE OR REPLACE FUNCTION public.my_teacher_offering_ids()
     RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
       SELECT ARRAY(SELECT id FROM public.class_offerings WHERE teacher_id = auth.uid());
     $$`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4: Clean up mock/fake data
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\nPHASE 4: Mock data cleanup');

  // Real admin UUIDs (from actual Google OAuth sign-ins):
  //   Syed Rayyan:  1a2d616a-bdae-4a71-9669-7e599e6deeef
  //   Site Owner:   6ef32f7d-3aa7-421f-ba22-86574720b00f
  const REAL_ADMIN_IDS = [
    '1a2d616a-bdae-4a71-9669-7e599e6deeef',
    '6ef32f7d-3aa7-421f-ba22-86574720b00f',
  ];
  const FAKE_IDS = [
    'a0000000-0000-0000-0000-000000000012', // hardcoded fake "Site Owner"
    'b0000000-0000-0000-0000-000000000001', // mock teacher Mr. Ahmad Khan
    'b0000000-0000-0000-0000-000000000002', // mock teacher Ms. Sara Ahmed
    'b0000000-0000-0000-0000-000000000003', // mock teacher Dr. Tariq Mahmood
    'b3089fa3-11af-4451-ad66-1cb005bf67a5', // failed OAuth student attempt
    'b7d7faa4-4556-40a5-a71f-a3ff8bf87b70', // failed OAuth student attempt
  ];
  const fakeIdList = FAKE_IDS.map(id => `'${id}'`).join(', ');

  await run('delete mock enrollments',
    `DELETE FROM public.enrollments WHERE student_id IN (${fakeIdList})`);

  await run('delete mock notes',
    `DELETE FROM public.notes WHERE uploaded_by IN (${fakeIdList})`);

  await run('delete mock attendance',
    `DELETE FROM public.attendance WHERE student_id IN (${fakeIdList})`);

  await run('delete mock fee_statuses',
    `DELETE FROM public.fee_statuses WHERE student_id IN (${fakeIdList})`);

  await run('delete mock teachers rows',
    `DELETE FROM public.teachers WHERE id IN (${fakeIdList})`);

  await run('delete mock profiles',
    `DELETE FROM public.profiles WHERE id IN (${fakeIdList})`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5: Insert real admin roster entries
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\nPHASE 5: Real admin roster entries');

  await run('insert Syed Rayyan roster entry',
    `INSERT INTO public.roster (email, full_name, role, class_ids, profile_id)
     VALUES ('syedrayyanf1@gmail.com', 'Syed Rayyan', 'admin', '{}'::uuid[], '1a2d616a-bdae-4a71-9669-7e599e6deeef'::uuid)
     ON CONFLICT (email) DO UPDATE
       SET profile_id = EXCLUDED.profile_id, full_name = EXCLUDED.full_name`);

  await run('insert Site Owner roster entry',
    `INSERT INTO public.roster (email, full_name, role, class_ids, profile_id)
     VALUES ('shs.academyvirtual@gmail.com', 'Site Owner', 'admin', '{}'::uuid[], '6ef32f7d-3aa7-421f-ba22-86574720b00f'::uuid)
     ON CONFLICT (email) DO UPDATE
       SET profile_id = EXCLUDED.profile_id, full_name = EXCLUDED.full_name`);

  await run('mark real admins onboarding_complete',
    `UPDATE public.profiles
     SET onboarding_complete = true
     WHERE id IN ('1a2d616a-bdae-4a71-9669-7e599e6deeef', '6ef32f7d-3aa7-421f-ba22-86574720b00f')`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 6: RLS policies — profiles
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\nPHASE 6: RLS policies — profiles');

  await run('drop profiles: own read', `DROP POLICY IF EXISTS "profiles: own read" ON public.profiles`);
  await run('create profiles: own read',
    `CREATE POLICY "profiles: own read" ON public.profiles FOR SELECT
     USING (
       id = auth.uid()
       OR EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin')
     )`);

  await run('drop profiles: own update', `DROP POLICY IF EXISTS "profiles: own update" ON public.profiles`);
  await run('create profiles: own update',
    `CREATE POLICY "profiles: own update" ON public.profiles FOR UPDATE
     USING (
       id = auth.uid()
       OR EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin')
     )`);

  await run('drop profiles: admin insert', `DROP POLICY IF EXISTS "profiles: admin insert" ON public.profiles`);
  await run('create profiles: admin insert',
    `CREATE POLICY "profiles: admin insert" ON public.profiles FOR INSERT
     WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin'))`);

  await run('drop profiles: self provision', `DROP POLICY IF EXISTS "profiles: self provision" ON public.profiles`);
  await run('create profiles: self provision',
    `CREATE POLICY "profiles: self provision" ON public.profiles FOR INSERT
     WITH CHECK (id = auth.uid())`);

  await run('drop profiles: admin delete', `DROP POLICY IF EXISTS "profiles: admin delete" ON public.profiles`);
  await run('create profiles: admin delete',
    `CREATE POLICY "profiles: admin delete" ON public.profiles FOR DELETE
     USING (EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin'))`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 7: RLS policies — roster
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\nPHASE 7: RLS policies — roster');

  await run('drop roster: admin all', `DROP POLICY IF EXISTS "roster: admin all" ON public.roster`);
  await run('create roster: admin all',
    `CREATE POLICY "roster: admin all" ON public.roster FOR ALL
     USING (public.is_admin()) WITH CHECK (public.is_admin())`);

  await run('drop roster: select own', `DROP POLICY IF EXISTS "roster: select own" ON public.roster`);
  await run('create roster: select own',
    `CREATE POLICY "roster: select own" ON public.roster FOR SELECT
     USING (
       email = (auth.jwt()->>'email')
       OR EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin')
     )`);

  await run('drop roster: self link', `DROP POLICY IF EXISTS "roster: self link" ON public.roster`);
  await run('create roster: self link',
    `CREATE POLICY "roster: self link" ON public.roster FOR UPDATE
     USING (email = (auth.jwt()->>'email'))
     WITH CHECK (email = (auth.jwt()->>'email'))`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 8: RLS policies — enrollments (student self-enroll for onboarding)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\nPHASE 8: RLS policies — enrollments');

  await run('drop enrollments: read', `DROP POLICY IF EXISTS "enrollments: read" ON public.enrollments`);
  await run('create enrollments: read',
    `CREATE POLICY "enrollments: read" ON public.enrollments FOR SELECT
     USING (student_id = auth.uid() OR offering_id = ANY(my_teacher_offering_ids()) OR is_admin())`);

  await run('drop enrollments: admin write', `DROP POLICY IF EXISTS "enrollments: admin write" ON public.enrollments`);
  await run('create enrollments: admin write',
    `CREATE POLICY "enrollments: admin write" ON public.enrollments FOR ALL
     USING (is_admin()) WITH CHECK (is_admin())`);

  await run('drop enrollments: student self enroll', `DROP POLICY IF EXISTS "enrollments: student self enroll" ON public.enrollments`);
  await run('create enrollments: student self enroll',
    `CREATE POLICY "enrollments: student self enroll" ON public.enrollments FOR INSERT
     WITH CHECK (student_id = auth.uid())`);

  await run('drop enrollments: student self delete', `DROP POLICY IF EXISTS "enrollments: student self delete" ON public.enrollments`);
  await run('create enrollments: student self delete',
    `CREATE POLICY "enrollments: student self delete" ON public.enrollments FOR DELETE
     USING (student_id = auth.uid())`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 9: RLS policies — fee tables
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\nPHASE 9: RLS policies — fee tables');

  await run('drop fee_configs: admin all', `DROP POLICY IF EXISTS "fee_configs: admin all" ON public.fee_configs`);
  await run('create fee_configs: admin all',
    `CREATE POLICY "fee_configs: admin all" ON public.fee_configs FOR ALL
     USING (public.is_admin()) WITH CHECK (public.is_admin())`);

  await run('drop fee_configs: student read', `DROP POLICY IF EXISTS "fee_configs: student read" ON public.fee_configs`);
  await run('create fee_configs: student read',
    `CREATE POLICY "fee_configs: student read" ON public.fee_configs FOR SELECT
     USING (
       EXISTS (SELECT 1 FROM public.enrollments e WHERE e.student_id = auth.uid() AND e.offering_id = class_id)
       OR public.is_admin()
     )`);

  await run('drop fee_statuses: admin all', `DROP POLICY IF EXISTS "fee_statuses: admin all" ON public.fee_statuses`);
  await run('create fee_statuses: admin all',
    `CREATE POLICY "fee_statuses: admin all" ON public.fee_statuses FOR ALL
     USING (public.is_admin()) WITH CHECK (public.is_admin())`);

  await run('drop fee_statuses: student read', `DROP POLICY IF EXISTS "fee_statuses: student read" ON public.fee_statuses`);
  await run('create fee_statuses: student read',
    `CREATE POLICY "fee_statuses: student read" ON public.fee_statuses FOR SELECT
     USING (student_id = auth.uid() OR public.is_admin())`);

  await run('drop fee_statuses: student insert', `DROP POLICY IF EXISTS "fee_statuses: student insert" ON public.fee_statuses`);
  await run('create fee_statuses: student insert',
    `CREATE POLICY "fee_statuses: student insert" ON public.fee_statuses FOR INSERT
     WITH CHECK (student_id = auth.uid())`);

  await run('drop fee_statuses: student update pending', `DROP POLICY IF EXISTS "fee_statuses: student update pending" ON public.fee_statuses`);
  await run('create fee_statuses: student update pending',
    `CREATE POLICY "fee_statuses: student update pending" ON public.fee_statuses FOR UPDATE
     USING (student_id = auth.uid())
     WITH CHECK (student_id = auth.uid() AND status = 'pending')`);

  await run('drop fee_audit_trail: admin all', `DROP POLICY IF EXISTS "fee_audit_trail: admin all" ON public.fee_audit_trail`);
  await run('create fee_audit_trail: admin all',
    `CREATE POLICY "fee_audit_trail: admin all" ON public.fee_audit_trail FOR ALL
     USING (public.is_admin()) WITH CHECK (public.is_admin())`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 10: Fee status change trigger + audit log function
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\nPHASE 10: Fee audit trigger');

  await run('log_fee_status_change function',
    `CREATE OR REPLACE FUNCTION public.log_fee_status_change()
     RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
     BEGIN
       IF OLD.status IS DISTINCT FROM NEW.status THEN
         INSERT INTO public.fee_audit_trail (student_id, status_from, status_to, changed_by, notes)
         VALUES (
           NEW.student_id, OLD.status, NEW.status, auth.uid(),
           'Status updated from ' || OLD.status || ' to ' || NEW.status
         );
       END IF;
       RETURN NEW;
     END; $$`);

  await run('drop on_fee_status_updated trigger', `DROP TRIGGER IF EXISTS on_fee_status_updated ON public.fee_statuses`);
  await run('create on_fee_status_updated trigger',
    `CREATE TRIGGER on_fee_status_updated
     AFTER UPDATE ON public.fee_statuses
     FOR EACH ROW EXECUTE FUNCTION public.log_fee_status_change()`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 11: Drop the conflicting DB trigger on auth.users
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\nPHASE 11: Drop conflicting auth trigger');

  await run('drop on_auth_user_created trigger',
    `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 12: Remaining RLS policies
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\nPHASE 12: Remaining RLS policies');

  await run('RLS enable profiles', `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY`);
  await run('RLS enable teachers', `ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY`);
  await run('RLS enable class_offerings', `ALTER TABLE public.class_offerings ENABLE ROW LEVEL SECURITY`);
  await run('RLS enable class_slots', `ALTER TABLE public.class_slots ENABLE ROW LEVEL SECURITY`);
  await run('RLS enable enrollments', `ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY`);
  await run('RLS enable attendance', `ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY`);
  await run('RLS enable notes', `ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY`);
  await run('RLS enable study_sessions', `ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY`);

  // teachers policies
  await run('drop teachers: own read', `DROP POLICY IF EXISTS "teachers: own read" ON public.teachers`);
  await run('create teachers: own read',
    `CREATE POLICY "teachers: own read" ON public.teachers FOR SELECT
     USING (id = auth.uid() OR is_admin())`);
  await run('drop teachers: admin write', `DROP POLICY IF EXISTS "teachers: admin write" ON public.teachers`);
  await run('create teachers: admin write',
    `CREATE POLICY "teachers: admin write" ON public.teachers FOR ALL
     USING (is_admin()) WITH CHECK (is_admin())`);

  // class_offerings policies
  await run('drop offerings: student read', `DROP POLICY IF EXISTS "offerings: student read" ON public.class_offerings`);
  await run('create offerings: student read',
    `CREATE POLICY "offerings: student read" ON public.class_offerings FOR SELECT
     USING (id = ANY(my_enrolled_offering_ids()) OR teacher_id = auth.uid() OR is_admin())`);
  await run('drop offerings: admin write', `DROP POLICY IF EXISTS "offerings: admin write" ON public.class_offerings`);
  await run('create offerings: admin write',
    `CREATE POLICY "offerings: admin write" ON public.class_offerings FOR ALL
     USING (is_admin()) WITH CHECK (is_admin())`);

  // class_slots policies
  await run('drop slots: read', `DROP POLICY IF EXISTS "slots: read" ON public.class_slots`);
  await run('create slots: read',
    `CREATE POLICY "slots: read" ON public.class_slots FOR SELECT
     USING (offering_id = ANY(my_enrolled_offering_ids()) OR offering_id = ANY(my_teacher_offering_ids()) OR is_admin())`);
  await run('drop slots: admin write', `DROP POLICY IF EXISTS "slots: admin write" ON public.class_slots`);
  await run('create slots: admin write',
    `CREATE POLICY "slots: admin write" ON public.class_slots FOR ALL
     USING (is_admin()) WITH CHECK (is_admin())`);

  // notes policies
  await run('drop notes: read', `DROP POLICY IF EXISTS "notes: read" ON public.notes`);
  await run('create notes: read',
    `CREATE POLICY "notes: read" ON public.notes FOR SELECT
     USING (offering_id = ANY(my_enrolled_offering_ids()) OR offering_id = ANY(my_teacher_offering_ids()) OR is_admin())`);
  await run('drop notes: teacher insert', `DROP POLICY IF EXISTS "notes: teacher insert" ON public.notes`);
  await run('create notes: teacher insert',
    `CREATE POLICY "notes: teacher insert" ON public.notes FOR INSERT
     WITH CHECK (offering_id = ANY(my_teacher_offering_ids()) OR is_admin())`);
  await run('drop notes: teacher+admin delete', `DROP POLICY IF EXISTS "notes: teacher+admin delete" ON public.notes`);
  await run('create notes: teacher+admin delete',
    `CREATE POLICY "notes: teacher+admin delete" ON public.notes FOR DELETE
     USING (uploaded_by = auth.uid() OR is_admin())`);

  // study_sessions policies
  await run('drop study_sessions: own', `DROP POLICY IF EXISTS "study_sessions: own" ON public.study_sessions`);
  await run('create study_sessions: own',
    `CREATE POLICY "study_sessions: own" ON public.study_sessions FOR ALL
     USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid())`);
  await run('drop study_sessions: admin read', `DROP POLICY IF EXISTS "study_sessions: admin read" ON public.study_sessions`);
  await run('create study_sessions: admin read',
    `CREATE POLICY "study_sessions: admin read" ON public.study_sessions FOR SELECT
     USING (is_admin())`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 13: Performance indexes
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\nPHASE 13: Indexes');

  for (const idx of [
    `CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id)`,
    `CREATE INDEX IF NOT EXISTS idx_enrollments_offering_id ON public.enrollments(offering_id)`,
    `CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id)`,
    `CREATE INDEX IF NOT EXISTS idx_notes_offering_created ON public.notes(offering_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_class_slots_offering_day ON public.class_slots(offering_id, day_of_week)`,
    `CREATE INDEX IF NOT EXISTS idx_class_offerings_teacher_id ON public.class_offerings(teacher_id)`,
    `CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role)`,
  ]) {
    await run('index: ' + idx.split('EXISTS ')[1].split(' ')[0], idx);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 14: Final verification
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\nPHASE 14: Verification\n');

  const roster = await client.query(`SELECT email, full_name, role, profile_id FROM public.roster ORDER BY created_at`);
  console.log('=== ROSTER (expect: 2 admin rows) ===');
  console.table(roster.rows);

  const profiles = await client.query(`SELECT id, full_name, role, stream, onboarding_complete FROM public.profiles ORDER BY created_at`);
  console.log('\n=== PROFILES (expect: 2 real admins only) ===');
  console.table(profiles.rows);

  const teachers = await client.query(`SELECT full_name, email FROM public.teachers`);
  console.log('\n=== TEACHERS (expect: empty) ===');
  console.table(teachers.rows);

  console.log('\n🎉 All migrations complete!');
  await client.end();
}

main().catch(async (e) => {
  console.error('\n💥 Migration failed:', e.message);
  await client.end();
  process.exit(1);
});
