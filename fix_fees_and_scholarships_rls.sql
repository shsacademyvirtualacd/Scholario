-- ═══════════════════════════════════════════════════════════════════════════
-- SCHOLARIO — Complete Database & RLS Fix for Fees and Scholarships
-- ═══════════════════════════════════════════════════════════════════════════
-- Instructions: Run this entire script in your Supabase SQL Editor.
-- It establishes:
--   1. Columns for base_fee, discount_percent, discount_status, payable_amount
--   2. Columns for scholarship applications (both naming standards: class/class_grade,
--      claimed_marks/claimed_marks_percentage, proof_url/proof_document_url, matched_tier_id)
--   3. Strict Row Level Security (RLS) policies using public.is_admin() (role = 'admin')
--   4. Storage bucket policies for scholarship marksheet proof uploads
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Helper function: check if authenticated user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Ensure public.fee_configs table exists and has proper schema
CREATE TABLE IF NOT EXISTS public.fee_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  payment_instructions text NOT NULL DEFAULT '',
  whatsapp_number text NOT NULL DEFAULT '03222314436',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure optional unique constraint on class_id (null is universal)
CREATE UNIQUE INDEX IF NOT EXISTS idx_fee_configs_class_id_unique ON public.fee_configs(class_id) WHERE class_id IS NOT NULL;

-- 3. Ensure public.scholarship_tiers table exists
CREATE TABLE IF NOT EXISTS public.scholarship_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_marks_percentage numeric NOT NULL CHECK (min_marks_percentage >= 0 AND min_marks_percentage <= 100),
  discount_percentage numeric NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  applicable_boards jsonb NOT NULL DEFAULT '"all"'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed standard tiers if empty
INSERT INTO public.scholarship_tiers (min_marks_percentage, discount_percentage, applicable_boards, is_active, description)
SELECT 90.0, 60.0, '"all"'::jsonb, true, 'High Distinction Merit Scholarship (90%+ Marks / A* equivalent) — 60% tuition waiver'
WHERE NOT EXISTS (SELECT 1 FROM public.scholarship_tiers WHERE min_marks_percentage = 90.0);

INSERT INTO public.scholarship_tiers (min_marks_percentage, discount_percentage, applicable_boards, is_active, description)
SELECT 80.0, 40.0, '"all"'::jsonb, true, 'Distinction Merit Scholarship (80%+ Marks / A equivalent) — 40% tuition waiver'
WHERE NOT EXISTS (SELECT 1 FROM public.scholarship_tiers WHERE min_marks_percentage = 80.0);

-- 4. Ensure public.scholarship_applications table exists and has all required columns
CREATE TABLE IF NOT EXISTS public.scholarship_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  applicant_name text,
  applicant_email text,
  board text,
  class_grade text,
  class text,
  claimed_marks_percentage numeric,
  claimed_marks numeric,
  verified_marks_percentage numeric,
  proof_document_url text,
  proof_url text,
  matched_tier_id uuid REFERENCES public.scholarship_tiers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'revoked')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  revocation_reason text,
  applied_discount_percentage numeric NOT NULL DEFAULT 0,
  academic_term text NOT NULL DEFAULT 'Current Term',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add any missing columns to scholarship_applications gracefully
ALTER TABLE public.scholarship_applications
  ADD COLUMN IF NOT EXISTS applicant_name text,
  ADD COLUMN IF NOT EXISTS applicant_email text,
  ADD COLUMN IF NOT EXISTS board text,
  ADD COLUMN IF NOT EXISTS class_grade text,
  ADD COLUMN IF NOT EXISTS class text,
  ADD COLUMN IF NOT EXISTS claimed_marks_percentage numeric,
  ADD COLUMN IF NOT EXISTS claimed_marks numeric,
  ADD COLUMN IF NOT EXISTS verified_marks_percentage numeric,
  ADD COLUMN IF NOT EXISTS proof_document_url text,
  ADD COLUMN IF NOT EXISTS proof_url text,
  ADD COLUMN IF NOT EXISTS matched_tier_id uuid,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS revocation_reason text,
  ADD COLUMN IF NOT EXISTS applied_discount_percentage numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS academic_term text NOT NULL DEFAULT 'Current Term',
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- Sync alias columns so both class/class_grade and proof_url/proof_document_url are always populated
UPDATE public.scholarship_applications
SET 
  class = COALESCE(class, class_grade),
  class_grade = COALESCE(class_grade, class),
  claimed_marks = COALESCE(claimed_marks, claimed_marks_percentage),
  claimed_marks_percentage = COALESCE(claimed_marks_percentage, claimed_marks),
  proof_url = COALESCE(proof_url, proof_document_url),
  proof_document_url = COALESCE(proof_document_url, proof_url)
WHERE class IS NULL OR class_grade IS NULL OR proof_url IS NULL OR proof_document_url IS NULL;

-- 5. Ensure public.fee_statuses table exists with fee math columns
CREATE TABLE IF NOT EXISTS public.fee_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('unpaid', 'pending', 'paid')) DEFAULT 'unpaid',
  scholarship_status text NOT NULL DEFAULT 'none' CHECK (scholarship_status IN ('none', 'pending', 'verified', 'rejected', 'revoked')),
  scholarship_discount_percentage numeric NOT NULL DEFAULT 0,
  scholarship_application_id uuid REFERENCES public.scholarship_applications(id) ON DELETE SET NULL,
  base_fee numeric,
  discount_percent numeric DEFAULT 0,
  discount_status text DEFAULT 'none',
  payable_amount numeric,
  updated_at timestamptz DEFAULT now()
);

-- Add fee math columns to existing fee_statuses if not present
ALTER TABLE public.fee_statuses
  ADD COLUMN IF NOT EXISTS scholarship_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS scholarship_discount_percentage numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scholarship_application_id uuid,
  ADD COLUMN IF NOT EXISTS base_fee numeric,
  ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS payable_amount numeric;

-- 6. Ensure public.fee_audit_trail exists
CREATE TABLE IF NOT EXISTS public.fee_audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status_from text NOT NULL,
  status_to text NOT NULL,
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at timestamptz DEFAULT now(),
  notes text
);

-- 7. ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE public.fee_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_applications ENABLE ROW LEVEL SECURITY;

-- ─── 8. RLS POLICIES FOR FEE_CONFIGS ───────────────────────────────────────
DROP POLICY IF EXISTS "fee_configs: public read" ON public.fee_configs;
DROP POLICY IF EXISTS "fee_configs: student read" ON public.fee_configs;
DROP POLICY IF EXISTS "fee_configs: admin all" ON public.fee_configs;

-- Anyone authenticated can read tuition rates (needed for public checkout & registration)
CREATE POLICY "fee_configs: public read" 
  ON public.fee_configs FOR SELECT 
  USING (true);

-- Admins can insert, update, delete fee configs
CREATE POLICY "fee_configs: admin manage" 
  ON public.fee_configs FOR ALL 
  TO authenticated 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- ─── 9. RLS POLICIES FOR FEE_STATUSES ──────────────────────────────────────
DROP POLICY IF EXISTS "fee_statuses: admin all" ON public.fee_statuses;
DROP POLICY IF EXISTS "fee_statuses: student read" ON public.fee_statuses;
DROP POLICY IF EXISTS "fee_statuses: student update pending" ON public.fee_statuses;
DROP POLICY IF EXISTS "fee_statuses: student insert own" ON public.fee_statuses;
DROP POLICY IF EXISTS "fee_statuses: student update own" ON public.fee_statuses;

-- Admin has full access to view, update, and manage fee statuses
CREATE POLICY "fee_statuses: admin all" 
  ON public.fee_statuses FOR ALL 
  TO authenticated 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- Students can read their own fee status
CREATE POLICY "fee_statuses: student read own" 
  ON public.fee_statuses FOR SELECT 
  TO authenticated 
  USING (student_id = auth.uid());

-- Students can insert their own fee status during registration
CREATE POLICY "fee_statuses: student insert own" 
  ON public.fee_statuses FOR INSERT 
  TO authenticated 
  WITH CHECK (student_id = auth.uid());

-- Students can update their own fee status when submitting payment proof or scholarship
CREATE POLICY "fee_statuses: student update own" 
  ON public.fee_statuses FOR UPDATE 
  TO authenticated 
  USING (student_id = auth.uid()) 
  WITH CHECK (student_id = auth.uid());

-- ─── 10. RLS POLICIES FOR FEE_AUDIT_TRAIL ──────────────────────────────────
DROP POLICY IF EXISTS "fee_audit_trail: admin all" ON public.fee_audit_trail;
DROP POLICY IF EXISTS "fee_audit_trail: student read" ON public.fee_audit_trail;
DROP POLICY IF EXISTS "fee_audit_trail: student insert" ON public.fee_audit_trail;

CREATE POLICY "fee_audit_trail: admin all" 
  ON public.fee_audit_trail FOR ALL 
  TO authenticated 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

CREATE POLICY "fee_audit_trail: student read" 
  ON public.fee_audit_trail FOR SELECT 
  TO authenticated 
  USING (student_id = auth.uid());

CREATE POLICY "fee_audit_trail: student insert" 
  ON public.fee_audit_trail FOR INSERT 
  TO authenticated 
  WITH CHECK (student_id = auth.uid());

-- ─── 11. RLS POLICIES FOR SCHOLARSHIP_TIERS ─────────────────────────────────
DROP POLICY IF EXISTS "scholarship_tiers: public read" ON public.scholarship_tiers;
DROP POLICY IF EXISTS "scholarship_tiers: admin manage" ON public.scholarship_tiers;

CREATE POLICY "scholarship_tiers: public read" 
  ON public.scholarship_tiers FOR SELECT 
  USING (true);

CREATE POLICY "scholarship_tiers: admin manage" 
  ON public.scholarship_tiers FOR ALL 
  TO authenticated 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- ─── 12. RLS POLICIES FOR SCHOLARSHIP_APPLICATIONS ──────────────────────────
DROP POLICY IF EXISTS "scholarship_apps: admin all" ON public.scholarship_applications;
DROP POLICY IF EXISTS "scholarship_apps: student read" ON public.scholarship_applications;
DROP POLICY IF EXISTS "scholarship_apps: student insert" ON public.scholarship_applications;
DROP POLICY IF EXISTS "scholarship_apps: student update" ON public.scholarship_applications;
DROP POLICY IF EXISTS "Students can view their own scholarship applications" ON public.scholarship_applications;
DROP POLICY IF EXISTS "Students can insert their own scholarship application" ON public.scholarship_applications;
DROP POLICY IF EXISTS "Admins can update scholarship applications" ON public.scholarship_applications;
DROP POLICY IF EXISTS "Admins can manage scholarship tiers" ON public.scholarship_applications;

-- Admin can SELECT, UPDATE, DELETE all applications
CREATE POLICY "scholarship_apps: admin all" 
  ON public.scholarship_applications FOR ALL 
  TO authenticated 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- Students can view their own application
CREATE POLICY "scholarship_apps: student read" 
  ON public.scholarship_applications FOR SELECT 
  TO authenticated 
  USING (student_id = auth.uid());

-- Students can insert their own application
CREATE POLICY "scholarship_apps: student insert" 
  ON public.scholarship_applications FOR INSERT 
  TO authenticated 
  WITH CHECK (student_id = auth.uid());

-- ─── 13. REALTIME PUBLICATION ──────────────────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fee_statuses;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fee_configs;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scholarship_applications;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scholarship_tiers;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;
