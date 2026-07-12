-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — MASTER MIGRATION (run this single file in Supabase SQL Editor)
-- All statements are in dependency order. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── PHASE 1: Schema columns ────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stream text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;

ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'teacher', 'admin'));

-- ─── PHASE 2: Fee tables (create before any policies reference them) ─────────
CREATE TABLE IF NOT EXISTS public.fee_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid UNIQUE REFERENCES public.class_offerings(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  payment_instructions text NOT NULL,
  whatsapp_number text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fee_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('unpaid', 'pending', 'paid')) DEFAULT 'unpaid',
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fee_audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status_from text NOT NULL,
  status_to text NOT NULL,
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at timestamptz DEFAULT now(),
  notes text
);

ALTER TABLE public.fee_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_audit_trail ENABLE ROW LEVEL SECURITY;

-- ─── PHASE 3: Enable RLS on all core tables ──────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- ─── PHASE 4: Helper functions ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.my_enrolled_offering_ids()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT ARRAY(SELECT offering_id FROM public.enrollments WHERE student_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.my_teacher_offering_ids()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT ARRAY(SELECT id FROM public.class_offerings WHERE teacher_id = auth.uid());
$$;

-- ─── PHASE 5: Clean up mock/fake data ────────────────────────────────────────
-- Real admin UUIDs (from actual Google OAuth):
--   Syed Rayyan:  1a2d616a-bdae-4a71-9669-7e599e6deeef
--   Site Owner:   6ef32f7d-3aa7-421f-ba22-86574720b00f

DELETE FROM public.enrollments WHERE student_id IN (
  'a0000000-0000-0000-0000-000000000012',
  'b0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000003',
  'b3089fa3-11af-4451-ad66-1cb005bf67a5',
  'b7d7faa4-4556-40a5-a71f-a3ff8bf87b70'
);

DELETE FROM public.notes WHERE uploaded_by IN (
  'a0000000-0000-0000-0000-000000000012',
  'b0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000003',
  'b3089fa3-11af-4451-ad66-1cb005bf67a5',
  'b7d7faa4-4556-40a5-a71f-a3ff8bf87b70'
);

DELETE FROM public.fee_statuses WHERE student_id IN (
  'a0000000-0000-0000-0000-000000000012',
  'b0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000003',
  'b3089fa3-11af-4451-ad66-1cb005bf67a5',
  'b7d7faa4-4556-40a5-a71f-a3ff8bf87b70'
);

DELETE FROM public.teachers WHERE id IN (
  'b0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000003'
);

DELETE FROM public.profiles WHERE id IN (
  'a0000000-0000-0000-0000-000000000012',
  'b0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000003',
  'b3089fa3-11af-4451-ad66-1cb005bf67a5',
  'b7d7faa4-4556-40a5-a71f-a3ff8bf87b70'
);

-- ─── PHASE 6: Insert real admin roster entries ────────────────────────────────
INSERT INTO public.roster (email, full_name, role, class_ids, profile_id)
VALUES
  ('syedrayyanf1@gmail.com', 'Syed Rayyan', 'admin', '{}'::uuid[],
   '1a2d616a-bdae-4a71-9669-7e599e6deeef'::uuid),
  ('shs.academyvirtual@gmail.com', 'Site Owner', 'admin', '{}'::uuid[],
   '6ef32f7d-3aa7-421f-ba22-86574720b00f'::uuid)
ON CONFLICT (email) DO UPDATE
  SET profile_id = EXCLUDED.profile_id,
      full_name  = EXCLUDED.full_name;

-- Mark real admins as onboarding complete
UPDATE public.profiles
SET onboarding_complete = true
WHERE id IN (
  '1a2d616a-bdae-4a71-9669-7e599e6deeef',
  '6ef32f7d-3aa7-421f-ba22-86574720b00f'
);

-- ─── PHASE 7: RLS policies — profiles ────────────────────────────────────────
-- IMPORTANT: Use public.is_admin() (SECURITY DEFINER) not inline EXISTS subqueries.
-- Inline subqueries on public.profiles inside a profiles policy = infinite RLS recursion.
DROP POLICY IF EXISTS "profiles: own read" ON public.profiles;
CREATE POLICY "profiles: own read" ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles: own update" ON public.profiles;
CREATE POLICY "profiles: own update" ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles: admin insert" ON public.profiles;
CREATE POLICY "profiles: admin insert" ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles: self provision" ON public.profiles;
CREATE POLICY "profiles: self provision" ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles: admin delete" ON public.profiles;
CREATE POLICY "profiles: admin delete" ON public.profiles FOR DELETE
  USING (public.is_admin());

-- ─── PHASE 8: RLS policies — roster ──────────────────────────────────────────
DROP POLICY IF EXISTS "roster: admin all" ON public.roster;
CREATE POLICY "roster: admin all" ON public.roster FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "roster: select own" ON public.roster;
CREATE POLICY "roster: select own" ON public.roster FOR SELECT
  USING (
    email = LOWER(auth.jwt()->>'email')
    OR EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin')
  );

DROP POLICY IF EXISTS "roster: self link" ON public.roster;
CREATE POLICY "roster: self link" ON public.roster FOR UPDATE
  USING (email = LOWER(auth.jwt()->>'email'))
  WITH CHECK (email = LOWER(auth.jwt()->>'email'));

DROP POLICY IF EXISTS "roster: self insert" ON public.roster;
CREATE POLICY "roster: self insert" ON public.roster FOR INSERT
  WITH CHECK (
    email = LOWER(auth.jwt()->>'email')
    AND role = 'student'
  );

-- ─── PHASE 9: RLS policies — enrollments ─────────────────────────────────────
DROP POLICY IF EXISTS "enrollments: read" ON public.enrollments;
CREATE POLICY "enrollments: read" ON public.enrollments FOR SELECT
  USING (student_id = auth.uid() OR offering_id = ANY(my_teacher_offering_ids()) OR is_admin());

DROP POLICY IF EXISTS "enrollments: admin write" ON public.enrollments;
CREATE POLICY "enrollments: admin write" ON public.enrollments FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "enrollments: student self enroll" ON public.enrollments;
CREATE POLICY "enrollments: student self enroll" ON public.enrollments FOR INSERT
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "enrollments: student self delete" ON public.enrollments;
CREATE POLICY "enrollments: student self delete" ON public.enrollments FOR DELETE
  USING (student_id = auth.uid());

-- ─── PHASE 10: RLS policies — teachers ───────────────────────────────────────
DROP POLICY IF EXISTS "teachers: own read" ON public.teachers;
CREATE POLICY "teachers: own read" ON public.teachers FOR SELECT
  USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "teachers: admin write" ON public.teachers;
CREATE POLICY "teachers: admin write" ON public.teachers FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- ─── PHASE 11: RLS policies — class_offerings ────────────────────────────────
DROP POLICY IF EXISTS "offerings: student read" ON public.class_offerings;
CREATE POLICY "offerings: student read" ON public.class_offerings FOR SELECT
  USING (id = ANY(my_enrolled_offering_ids()) OR teacher_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "offerings: admin write" ON public.class_offerings;
CREATE POLICY "offerings: admin write" ON public.class_offerings FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- ─── PHASE 12: RLS policies — class_slots ────────────────────────────────────
DROP POLICY IF EXISTS "slots: read" ON public.class_slots;
CREATE POLICY "slots: read" ON public.class_slots FOR SELECT
  USING (offering_id = ANY(my_enrolled_offering_ids()) OR offering_id = ANY(my_teacher_offering_ids()) OR is_admin());

DROP POLICY IF EXISTS "slots: admin write" ON public.class_slots;
CREATE POLICY "slots: admin write" ON public.class_slots FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- ─── PHASE 13: RLS policies — notes ──────────────────────────────────────────
DROP POLICY IF EXISTS "notes: read" ON public.notes;
CREATE POLICY "notes: read" ON public.notes FOR SELECT
  USING (offering_id = ANY(my_enrolled_offering_ids()) OR offering_id = ANY(my_teacher_offering_ids()) OR is_admin());

DROP POLICY IF EXISTS "notes: teacher insert" ON public.notes;
CREATE POLICY "notes: teacher insert" ON public.notes FOR INSERT
  WITH CHECK (offering_id = ANY(my_teacher_offering_ids()) OR is_admin());

DROP POLICY IF EXISTS "notes: teacher+admin delete" ON public.notes;
CREATE POLICY "notes: teacher+admin delete" ON public.notes FOR DELETE
  USING (uploaded_by = auth.uid() OR is_admin());

-- ─── PHASE 14: RLS policies — study_sessions ─────────────────────────────────
DROP POLICY IF EXISTS "study_sessions: own" ON public.study_sessions;
CREATE POLICY "study_sessions: own" ON public.study_sessions FOR ALL
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "study_sessions: admin read" ON public.study_sessions;
CREATE POLICY "study_sessions: admin read" ON public.study_sessions FOR SELECT
  USING (is_admin());

-- ─── PHASE 15: RLS policies — fee tables ─────────────────────────────────────
DROP POLICY IF EXISTS "fee_configs: admin all" ON public.fee_configs;
CREATE POLICY "fee_configs: admin all" ON public.fee_configs FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "fee_configs: student read" ON public.fee_configs;
CREATE POLICY "fee_configs: student read" ON public.fee_configs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.enrollments e WHERE e.student_id = auth.uid() AND e.offering_id = class_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "fee_statuses: admin all" ON public.fee_statuses;
CREATE POLICY "fee_statuses: admin all" ON public.fee_statuses FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "fee_statuses: student read" ON public.fee_statuses;
CREATE POLICY "fee_statuses: student read" ON public.fee_statuses FOR SELECT
  USING (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "fee_statuses: student insert" ON public.fee_statuses;
CREATE POLICY "fee_statuses: student insert" ON public.fee_statuses FOR INSERT
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "fee_statuses: student update pending" ON public.fee_statuses;
CREATE POLICY "fee_statuses: student update pending" ON public.fee_statuses FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "fee_audit_trail: admin all" ON public.fee_audit_trail;
CREATE POLICY "fee_audit_trail: admin all" ON public.fee_audit_trail FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "fee_audit_trail: student read" ON public.fee_audit_trail;
CREATE POLICY "fee_audit_trail: student read" ON public.fee_audit_trail FOR SELECT
  USING (student_id = auth.uid() OR public.is_admin());

-- ─── PHASE 16: Fee audit trigger ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_fee_status_change()
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
END; $$;

DROP TRIGGER IF EXISTS on_fee_status_updated ON public.fee_statuses;
CREATE TRIGGER on_fee_status_updated
  AFTER UPDATE ON public.fee_statuses
  FOR EACH ROW EXECUTE FUNCTION public.log_fee_status_change();

-- ─── PHASE 17: Drop the conflicting auth trigger ──────────────────────────────
-- This trigger was fighting the frontend provisionProfile() — both tried to
-- INSERT the same profile row, causing sign-in to fail with "duplicate key".
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ─── PHASE 18: Performance indexes ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id  ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_offering_id ON public.enrollments(offering_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id   ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_notes_offering_created  ON public.notes(offering_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_class_slots_offering_day ON public.class_slots(offering_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_class_offerings_teacher_id ON public.class_offerings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role           ON public.profiles(role);

-- ─── PHASE 19: Attendance unique constraint ───────────────────────────────────
ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS attendance_student_slot_date_unique;
ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_student_slot_date_unique
  UNIQUE (student_id, slot_id, session_date);

-- ─── DONE — notify PostgREST to reload schema ────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- Quick sanity check (results shown in SQL Editor output):
SELECT 'roster' AS tbl, email, full_name, role FROM public.roster
UNION ALL
SELECT 'profiles', id::text, full_name, role FROM public.profiles
ORDER BY tbl, role;
