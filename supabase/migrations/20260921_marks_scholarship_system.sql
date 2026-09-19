-- ==============================================================================
-- SCHOLARIO: MARKS-BASED SCHOLARSHIP SYSTEM WITH ADMIN VERIFICATION WORKFLOW
-- Migration: 20260921_marks_scholarship_system.sql
-- Description:
--   1. scholarship_tiers table (admin-configurable thresholds, percentages, boards)
--   2. scholarship_applications table (student applications, proof documents, verification status)
--   3. Modify fee_statuses table (scholarship_status, scholarship_discount_percentage, scholarship_application_id)
--   4. Row-level security (RLS) policies and realtime publication
-- ==============================================================================

-- 1. Create scholarship_tiers table
CREATE TABLE IF NOT EXISTS public.scholarship_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_marks_percentage NUMERIC NOT NULL CHECK (min_marks_percentage >= 0 AND min_marks_percentage <= 100),
  discount_percentage NUMERIC NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  applicable_boards JSONB NOT NULL DEFAULT '"all"'::jsonb, -- e.g. "all" or ["fbise", "punjab", "sindh", "kpk", "olevel", "alevel", "ielts"]
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for tier lookup ordered by highest threshold first
CREATE INDEX IF NOT EXISTS idx_scholarship_tiers_active_lookup 
ON public.scholarship_tiers(is_active, min_marks_percentage DESC);

-- Seed default configurable tiers: 90%+ -> 60% discount, 80%+ -> 40% discount
INSERT INTO public.scholarship_tiers (min_marks_percentage, discount_percentage, applicable_boards, is_active, description)
VALUES
  (90.0, 60.0, '"all"'::jsonb, true, 'High Distinction Merit Scholarship (90%+ Marks / A* equivalent) — 60% tuition waiver'),
  (80.0, 40.0, '"all"'::jsonb, true, 'Distinction Merit Scholarship (80%+ Marks / A equivalent) — 40% tuition waiver')
ON CONFLICT DO NOTHING;

-- 2. Create scholarship_applications table
CREATE TABLE IF NOT EXISTS public.scholarship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  board TEXT NOT NULL,
  class_grade TEXT NOT NULL,
  claimed_marks_percentage NUMERIC NOT NULL CHECK (claimed_marks_percentage >= 0 AND claimed_marks_percentage <= 100),
  verified_marks_percentage NUMERIC CHECK (verified_marks_percentage >= 0 AND verified_marks_percentage <= 100),
  proof_document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'revoked')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  revocation_reason TEXT,
  applied_discount_percentage NUMERIC NOT NULL DEFAULT 0 CHECK (applied_discount_percentage >= 0 AND applied_discount_percentage <= 100),
  academic_term TEXT NOT NULL DEFAULT 'Current Term',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: prevent duplicate pending or verified scholarship applications for the same student in the same academic term
CREATE UNIQUE INDEX IF NOT EXISTS idx_scholarship_apps_student_term_active
ON public.scholarship_applications(student_id, academic_term)
WHERE status IN ('pending', 'verified');

CREATE INDEX IF NOT EXISTS idx_scholarship_apps_status ON public.scholarship_applications(status);
CREATE INDEX IF NOT EXISTS idx_scholarship_apps_created_at ON public.scholarship_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scholarship_apps_student_id ON public.scholarship_applications(student_id);

-- 3. Modify fee_statuses table to link scholarship status
ALTER TABLE public.fee_statuses
  ADD COLUMN IF NOT EXISTS scholarship_status TEXT NOT NULL DEFAULT 'none' CHECK (scholarship_status IN ('none', 'pending', 'verified', 'rejected', 'revoked')),
  ADD COLUMN IF NOT EXISTS scholarship_discount_percentage NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scholarship_application_id UUID REFERENCES public.scholarship_applications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_fee_statuses_scholarship_status ON public.fee_statuses(scholarship_status);

-- 4. Row Level Security (RLS)
ALTER TABLE public.scholarship_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_applications ENABLE ROW LEVEL SECURITY;

-- scholarship_tiers policies
DROP POLICY IF EXISTS "Public can view active scholarship tiers" ON public.scholarship_tiers;
CREATE POLICY "Public can view active scholarship tiers"
  ON public.scholarship_tiers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage scholarship tiers" ON public.scholarship_tiers;
CREATE POLICY "Admins can manage scholarship tiers"
  ON public.scholarship_tiers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- scholarship_applications policies
DROP POLICY IF EXISTS "Students can view their own scholarship applications" ON public.scholarship_applications;
CREATE POLICY "Students can view their own scholarship applications"
  ON public.scholarship_applications FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Students can insert their own scholarship application" ON public.scholarship_applications;
CREATE POLICY "Students can insert their own scholarship application"
  ON public.scholarship_applications FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update scholarship applications" ON public.scholarship_applications;
CREATE POLICY "Admins can update scholarship applications"
  ON public.scholarship_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scholarship_tiers;
  EXCEPTION WHEN others THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scholarship_applications;
  EXCEPTION WHEN others THEN
    NULL;
  END;
END $$;
