-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Direct 1-on-1 Chat System Migration (Full Multi-Role Support)
-- Supports Student ↔ Admin, Student ↔ Teacher, and Admin ↔ Teacher (Staff)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Helper function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Create or Update chat_threads Table Structure
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure all required columns exist and are configured
DO $$
BEGIN
  -- Add student_id column (nullable to allow Admin <-> Teacher threads)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_threads' AND column_name = 'student_id') THEN
    ALTER TABLE public.chat_threads ADD COLUMN student_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT;
  ELSE
    -- Ensure student_id is nullable
    ALTER TABLE public.chat_threads ALTER COLUMN student_id DROP NOT NULL;
  END IF;

  -- Add staff_id column (for Teacher or Admin participant)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_threads' AND column_name = 'staff_id') THEN
    ALTER TABLE public.chat_threads ADD COLUMN staff_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT;
  END IF;

  -- Add thread_type column ('admin', 'teacher', 'staff')
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_threads' AND column_name = 'thread_type') THEN
    ALTER TABLE public.chat_threads ADD COLUMN thread_type text NOT NULL DEFAULT 'admin' CHECK (thread_type IN ('admin', 'teacher', 'staff'));
  END IF;

  -- Maintain participant_one_id & participant_two_id for backward compatibility if present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_threads' AND column_name = 'participant_one_id') THEN
    ALTER TABLE public.chat_threads ADD COLUMN participant_one_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT;
    ALTER TABLE public.chat_threads ADD COLUMN participant_one_role text;
    ALTER TABLE public.chat_threads ADD COLUMN participant_two_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT;
    ALTER TABLE public.chat_threads ADD COLUMN participant_two_role text;
  END IF;
END $$;

-- Drop any restrictive check constraints on participant roles in chat_threads
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.chat_threads'::regclass 
      AND contype = 'c' 
      AND (conname ILIKE '%role%' OR conname ILIKE '%type%')
  ) LOOP
    EXECUTE 'ALTER TABLE public.chat_threads DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- 3. Drop legacy unique constraints on student_id that restricted 1 thread per student
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.chat_threads'::regclass 
      AND contype = 'u' 
      AND conname ILIKE '%student%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.chat_threads DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

DROP INDEX IF EXISTS public.idx_chat_threads_student_id;
DROP INDEX IF EXISTS public.idx_chat_threads_student;
DROP INDEX IF EXISTS public.idx_chat_threads_single_student;

-- 4. Create Granular Unique Partial Indexes per Thread Type
-- A. Student <-> Admin: Exactly one admin support thread per student
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_threads_student_admin_unique 
  ON public.chat_threads (student_id) 
  WHERE (thread_type = 'admin' AND student_id IS NOT NULL);

-- B. Student <-> Teacher: Exactly one thread per (student, teacher) pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_threads_student_teacher_unique 
  ON public.chat_threads (student_id, staff_id) 
  WHERE (thread_type = 'teacher' AND student_id IS NOT NULL AND staff_id IS NOT NULL);

-- C. Admin <-> Teacher (Staff): Exactly one management thread per teacher
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_threads_admin_teacher_unique 
  ON public.chat_threads (staff_id) 
  WHERE (thread_type = 'staff' AND staff_id IS NOT NULL);

-- Optional pair uniqueness for dual-participant columns
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_threads_unique_pair 
  ON public.chat_threads (
    LEAST(COALESCE(participant_one_id, student_id, staff_id), COALESCE(participant_two_id, staff_id, student_id)), 
    GREATEST(COALESCE(participant_one_id, student_id, staff_id), COALESCE(participant_two_id, staff_id, student_id))
  )
  WHERE (participant_one_id IS NOT NULL AND participant_two_id IS NOT NULL);

-- Supporting lookup indexes
CREATE INDEX IF NOT EXISTS idx_chat_threads_student_id ON public.chat_threads(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_staff_id ON public.chat_threads(staff_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_type ON public.chat_threads(thread_type);
CREATE INDEX IF NOT EXISTS idx_chat_threads_created_at ON public.chat_threads(created_at DESC);

-- 5. Chat Messages Table & Constraint Fix
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE RESTRICT,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  sender_role text NOT NULL DEFAULT 'student',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz NULL
);

-- Drop any outdated or restrictive check constraints on sender_role
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop named constraint if exists
  ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_role_check;
  ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS check_sender_role;
  ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_role_check;

  -- Drop all remaining check constraints touching sender_role
  FOR r IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.chat_messages'::regclass 
      AND contype = 'c' 
      AND (conname ILIKE '%role%' OR conname ILIKE '%sender%')
  ) LOOP
    EXECUTE 'ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- Add updated check constraint supporting all current and future roles
ALTER TABLE public.chat_messages 
  ADD CONSTRAINT chat_messages_sender_role_check 
  CHECK (sender_role IN ('student', 'teacher', 'admin', 'staff', 'super_admin', 'parent'));

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created ON public.chat_messages(thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON public.chat_messages(thread_id, sender_id, read_at) WHERE read_at IS NULL;

-- 6. Enable Row Level Security
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. RLS Policies for chat_threads
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "chat_threads: select policy" ON public.chat_threads;
DROP POLICY IF EXISTS "chat_threads: insert policy" ON public.chat_threads;
DROP POLICY IF EXISTS "chat_threads: update policy" ON public.chat_threads;
DROP POLICY IF EXISTS "chat_threads: participant or admin select" ON public.chat_threads;
DROP POLICY IF EXISTS "chat_threads: participant or admin insert" ON public.chat_threads;
DROP POLICY IF EXISTS "chat_threads: participant or admin update" ON public.chat_threads;
DROP POLICY IF EXISTS "Admin can create any thread" ON public.chat_threads;

-- SELECT Policy
CREATE POLICY "chat_threads: select policy"
  ON public.chat_threads FOR SELECT
  USING (
    -- Admin has access to all threads
    public.is_admin()
    -- Student can access threads where they are the student
    OR (student_id = auth.uid())
    -- Teacher can access threads where they are the staff participant
    OR (staff_id = auth.uid() AND thread_type IN ('teacher', 'staff'))
    -- Fallback for legacy participant columns
    OR (participant_one_id = auth.uid() OR participant_two_id = auth.uid())
  );

-- INSERT Policy
CREATE POLICY "chat_threads: insert policy"
  ON public.chat_threads FOR INSERT
  WITH CHECK (
    -- Admin can create any thread type
    public.is_admin()
    -- Student can create a 'teacher' or 'admin' thread with themselves as student_id
    OR (
      student_id = auth.uid() 
      AND thread_type IN ('teacher', 'admin')
    )
    -- Teacher can create a 'teacher' thread with themselves as staff_id
    OR (
      staff_id = auth.uid() 
      AND thread_type = 'teacher'
    )
    -- Legacy participant columns fallback
    OR (
      participant_one_id = auth.uid() OR participant_two_id = auth.uid()
    )
  );

-- UPDATE Policy
CREATE POLICY "chat_threads: update policy"
  ON public.chat_threads FOR UPDATE
  USING (
    public.is_admin()
    OR student_id = auth.uid()
    OR staff_id = auth.uid()
    OR participant_one_id = auth.uid()
    OR participant_two_id = auth.uid()
  );

-- (Notice: NO DELETE policy on chat_threads - Threads are permanent)

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. RLS Policies for chat_messages
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "chat_messages: select policy" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages: insert policy" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages: update policy" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages: participant or admin select" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages: participant or admin insert" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages: participant or admin update" ON public.chat_messages;

-- SELECT Policy
CREATE POLICY "chat_messages: select policy"
  ON public.chat_messages FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = chat_messages.thread_id
      AND (
        t.student_id = auth.uid()
        OR (t.staff_id = auth.uid() AND t.thread_type IN ('teacher', 'staff'))
        OR t.participant_one_id = auth.uid()
        OR t.participant_two_id = auth.uid()
      )
    )
  );

-- INSERT Policy (Fixes student & teacher sending replies)
CREATE POLICY "chat_messages: insert policy"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    -- The sender must be the authenticated user
    sender_id = auth.uid()
    AND (
      -- Admin can send in any thread
      public.is_admin()
      -- Participants can send in threads they belong to
      OR EXISTS (
        SELECT 1 FROM public.chat_threads t
        WHERE t.id = chat_messages.thread_id
        AND (
          t.student_id = auth.uid()
          OR (t.staff_id = auth.uid() AND t.thread_type IN ('teacher', 'staff'))
          OR t.participant_one_id = auth.uid()
          OR t.participant_two_id = auth.uid()
        )
      )
    )
  );

-- UPDATE Policy (For marking messages as read)
CREATE POLICY "chat_messages: update policy"
  ON public.chat_messages FOR UPDATE
  USING (
    public.is_admin()
    OR (
      -- Recipient can mark message as read
      sender_id != auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.chat_threads t
        WHERE t.id = chat_messages.thread_id
        AND (
          t.student_id = auth.uid()
          OR (t.staff_id = auth.uid() AND t.thread_type IN ('teacher', 'staff'))
          OR t.participant_one_id = auth.uid()
          OR t.participant_two_id = auth.uid()
        )
      )
    )
  );

-- (Notice: NO DELETE policy on chat_messages - Permanent audit log by design)

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. Automatic Synchronization Trigger (Keeps student_id/staff_id & participant IDs in sync)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.sync_chat_thread_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If student_id / staff_id provided, populate participant columns if empty
  IF NEW.student_id IS NOT NULL AND NEW.participant_one_id IS NULL THEN
    NEW.participant_one_id := NEW.student_id;
    NEW.participant_one_role := 'student';
  END IF;

  IF NEW.staff_id IS NOT NULL AND NEW.participant_two_id IS NULL THEN
    NEW.participant_two_id := NEW.staff_id;
    NEW.participant_two_role := CASE WHEN NEW.thread_type = 'staff' THEN 'teacher' ELSE NEW.thread_type END;
  END IF;

  -- If participant columns provided, populate student_id / staff_id / thread_type if empty
  IF NEW.student_id IS NULL THEN
    IF NEW.participant_one_role = 'student' THEN
      NEW.student_id := NEW.participant_one_id;
    ELSIF NEW.participant_two_role = 'student' THEN
      NEW.student_id := NEW.participant_two_id;
    END IF;
  END IF;

  IF NEW.staff_id IS NULL THEN
    IF NEW.participant_one_role IN ('teacher', 'admin') AND NEW.participant_two_role = 'student' THEN
      NEW.staff_id := NEW.participant_one_id;
    ELSIF NEW.participant_two_role IN ('teacher', 'admin') THEN
      NEW.staff_id := NEW.participant_two_id;
    END IF;
  END IF;

  IF NEW.thread_type IS NULL THEN
    IF (NEW.participant_one_role = 'admin' AND NEW.participant_two_role = 'teacher') OR 
       (NEW.participant_two_role = 'admin' AND NEW.participant_one_role = 'teacher') THEN
      NEW.thread_type := 'staff';
    ELSIF NEW.participant_one_role = 'teacher' OR NEW.participant_two_role = 'teacher' THEN
      NEW.thread_type := 'teacher';
    ELSE
      NEW.thread_type := 'admin';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_chat_thread_columns ON public.chat_threads;
CREATE TRIGGER trg_sync_chat_thread_columns
  BEFORE INSERT OR UPDATE ON public.chat_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_chat_thread_columns();

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. Enable Supabase Realtime
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.chat_threads REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_threads;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

