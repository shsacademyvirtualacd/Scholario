-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Announcement & Notice System Migration
-- File: supabase_announcements_system_migration.sql
-- 
-- Run this in your Supabase SQL editor:
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create or upgrade the announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  announcement_type text NOT NULL DEFAULT 'dashboard' CHECK (announcement_type IN ('public', 'dashboard')),
  target_roles text[] NOT NULL DEFAULT ARRAY['all']::text[],
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  action_label text,
  action_url text,
  badge_label text,
  severity text NOT NULL DEFAULT 'normal' CHECK (severity IN ('normal', 'crucial')),
  scope text NOT NULL DEFAULT 'system' CHECK (scope IN ('system', 'class')),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  stream_id uuid REFERENCES public.streams(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure all columns exist if the table was created under an older schema
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'announcement_type') THEN
    ALTER TABLE public.announcements ADD COLUMN announcement_type text NOT NULL DEFAULT 'dashboard' CHECK (announcement_type IN ('public', 'dashboard'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'target_roles') THEN
    ALTER TABLE public.announcements ADD COLUMN target_roles text[] NOT NULL DEFAULT ARRAY['all']::text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'is_active') THEN
    ALTER TABLE public.announcements ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'starts_at') THEN
    ALTER TABLE public.announcements ADD COLUMN starts_at timestamptz NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'ends_at') THEN
    ALTER TABLE public.announcements ADD COLUMN ends_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'action_label') THEN
    ALTER TABLE public.announcements ADD COLUMN action_label text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'action_url') THEN
    ALTER TABLE public.announcements ADD COLUMN action_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'badge_label') THEN
    ALTER TABLE public.announcements ADD COLUMN badge_label text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'updated_at') THEN
    ALTER TABLE public.announcements ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- 2. Create announcement_dismissals table for per-account dismissal tracking
CREATE TABLE IF NOT EXISTS public.announcement_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_announcement_dismissal UNIQUE (announcement_id, user_id)
);

-- 3. High-performance indexes
CREATE INDEX IF NOT EXISTS idx_announcements_type_active_dates 
  ON public.announcements(announcement_type, is_active, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_announcements_target_roles 
  ON public.announcements USING GIN (target_roles);

CREATE INDEX IF NOT EXISTS idx_announcement_dismissals_user 
  ON public.announcement_dismissals(user_id);

CREATE INDEX IF NOT EXISTS idx_announcement_dismissals_announcement 
  ON public.announcement_dismissals(announcement_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Announcements
DROP POLICY IF EXISTS "announcements: admin all" ON public.announcements;
DROP POLICY IF EXISTS "announcements: admin insert" ON public.announcements;
DROP POLICY IF EXISTS "announcements: admin select" ON public.announcements;
DROP POLICY IF EXISTS "announcements: admin delete" ON public.announcements;
DROP POLICY IF EXISTS "announcements: admin update" ON public.announcements;
DROP POLICY IF EXISTS "announcements: public select" ON public.announcements;
DROP POLICY IF EXISTS "announcements: dashboard select" ON public.announcements;
DROP POLICY IF EXISTS "announcements: teacher select" ON public.announcements;
DROP POLICY IF EXISTS "announcements: student select" ON public.announcements;

-- Admin full access
CREATE POLICY "announcements: admin all"
  ON public.announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Public announcements: visible to everyone (anon visitors & authenticated users)
CREATE POLICY "announcements: public select"
  ON public.announcements FOR SELECT
  TO anon, authenticated
  USING (
    announcement_type = 'public'
    AND is_active = true
    AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at >= now())
  );

-- Dashboard announcements: visible to logged-in users whose role is targeted
CREATE POLICY "announcements: dashboard select"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    announcement_type = 'dashboard'
    AND is_active = true
    AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at >= now())
    AND (
      'all' = ANY(target_roles)
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (role = ANY(target_roles) OR role = 'admin')
      )
    )
  );

-- 6. RLS Policies for Announcement Dismissals
DROP POLICY IF EXISTS "announcement_dismissals: user insert" ON public.announcement_dismissals;
DROP POLICY IF EXISTS "announcement_dismissals: user select" ON public.announcement_dismissals;
DROP POLICY IF EXISTS "announcement_dismissals: admin select" ON public.announcement_dismissals;
DROP POLICY IF EXISTS "announcement_dismissals: admin delete" ON public.announcement_dismissals;

-- Logged-in users can record their own dismissal
CREATE POLICY "announcement_dismissals: user insert"
  ON public.announcement_dismissals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Logged-in users can read their own dismissals
CREATE POLICY "announcement_dismissals: user select"
  ON public.announcement_dismissals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin can see all dismissals (for reporting and dismissal counts)
CREATE POLICY "announcement_dismissals: admin select"
  ON public.announcement_dismissals FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin can reset dismissals if needed
CREATE POLICY "announcement_dismissals: admin delete"
  ON public.announcement_dismissals FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 7. Seed Initial Announcements (Admissions Notice & Role Onboarding Manuals)
-- 7a. Public Admissions Notice
INSERT INTO public.announcements (
  id,
  title,
  body,
  announcement_type,
  target_roles,
  is_active,
  starts_at,
  ends_at,
  action_label,
  action_url,
  badge_label,
  severity,
  scope
) VALUES (
  '00000000-0000-4000-a000-000000000001',
  'Admissions Open for Academic Session 2026–2027',
  E'### Welcome to SHS Virtual Academy\n\nAdmissions are officially open for **FBISE Grades 9, 10, 11 (FSc Pre-Medical, Pre-Engineering, ICS) and Grade 12**.\n\n- **Daily Live HD Classes**: Interactive lectures with subject-specialist faculty.\n- **Subject Note Vault**: Solved numericals, chapter notes, and past paper mark schemes.\n- **Testing Center**: Bi-weekly timed practice tests and AI-powered question banks.\n- **Merit Scholarships**: Up to 100% fee waiver based on previous board results.\n\nSeats are limited per subject stream to guarantee small-batch teacher interaction.',
  'public',
  ARRAY['all']::text[],
  true,
  now() - interval '1 day',
  now() + interval '90 days',
  'Start Enrollment',
  '/register',
  'Admissions Open',
  'crucial',
  'system'
) ON CONFLICT (id) DO NOTHING;

-- 7b. Student Onboarding / Dashboard Notice
INSERT INTO public.announcements (
  id,
  title,
  body,
  announcement_type,
  target_roles,
  is_active,
  starts_at,
  action_label,
  action_url,
  badge_label,
  severity,
  scope
) VALUES (
  '00000000-0000-4000-a000-000000000002',
  'Welcome to Scholario: Student Quick Start Guide',
  E'### Getting the Most Out of Your Student Portal\n\nWelcome to your learning dashboard! Here is how to navigate your daily academic workflow:\n\n1. **Live Timetable & Join Button**: Check your active schedule on the dashboard. When a class is scheduled, click the **Join Live Class** button to enter the live session with your teacher.\n2. **Subject Note Vault**: Visit the Notes section to download curated chapter slides, formula cheat sheets, and board revision notes.\n3. **Testing Center**: Practice with timed online quizzes, past-paper assessments, and generate custom AI practice sets.\n4. **Sage AI Academic Companion**: Have a question about a tricky numerical or syllabus concept? Chat with Sage 24/7 for instant explanations grounded in your curriculum.\n5. **Attendance & Streaks**: Your attendance is automatically verified when you join live lectures. Keep your streak alive to stay on top of your studies!\n\nIf you ever need assistance, reach out to your instructor or academy administration via the Chat tab.',
  'dashboard',
  ARRAY['student']::text[],
  true,
  now() - interval '1 day',
  'Explore My Schedule',
  '/student/schedule',
  'Student Manual',
  'normal',
  'system'
) ON CONFLICT (id) DO NOTHING;

-- 7c. Teacher Onboarding / Dashboard Notice
INSERT INTO public.announcements (
  id,
  title,
  body,
  announcement_type,
  target_roles,
  is_active,
  starts_at,
  action_label,
  action_url,
  badge_label,
  severity,
  scope
) VALUES (
  '00000000-0000-4000-a000-000000000003',
  'Welcome to Scholario: Teacher Portal Quick Start Guide',
  E'### Welcome, Faculty Member!\n\nYour teacher portal is engineered to streamline class management, attendance, and student interaction:\n\n1. **Live Session Dispatch**: Paste your Google Meet or Zoom link directly on the dashboard before class time so students can join smoothly.\n2. **Attendance Verification**: Easily record and verify student attendance during or immediately after live lecture periods.\n3. **Curriculum Vault**: Upload lecture slides, PDF assignments, and chapter notes to your assigned subject streams.\n4. **Testing Center**: Create assessments, review student submissions, and release grades with detailed feedback.\n5. **Sage AI for Educators**: Leverage Sage to outline lesson plans, generate MCQ options, and summarize complex syllabus topics.\n\nReview your assigned classes on the schedule page to get started with your teaching term.',
  'dashboard',
  ARRAY['teacher']::text[],
  true,
  now() - interval '1 day',
  'View Teaching Schedule',
  '/teacher/schedule',
  'Teacher Guide',
  'normal',
  'system'
) ON CONFLICT (id) DO NOTHING;
