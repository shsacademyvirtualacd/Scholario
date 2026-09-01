-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Direct 1-on-1 Student <-> Admin Chat System Migration
-- Pure student <-> admin direct messaging (one permanent thread per student)
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop legacy tables if schema restructure is needed
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_threads CASCADE;

-- 1. Chat Threads Table (One thread per student, always with admin as counterpart)
CREATE TABLE public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_threads_student ON public.chat_threads(student_id);
CREATE INDEX idx_chat_threads_created_at ON public.chat_threads(created_at DESC);

-- 2. Chat Messages Table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE RESTRICT,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  sender_role text NOT NULL CHECK (sender_role IN ('student', 'admin')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz NULL
);

CREATE INDEX idx_chat_messages_thread_created ON public.chat_messages(thread_id, created_at ASC);
CREATE INDEX idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX idx_chat_messages_unread ON public.chat_messages(thread_id, sender_id, read_at) WHERE read_at IS NULL;

-- 3. Enable RLS
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for chat_threads
CREATE POLICY "chat_threads: student or admin select"
  ON public.chat_threads FOR SELECT
  USING (
    auth.uid() = student_id 
    OR public.is_admin()
  );

CREATE POLICY "chat_threads: student or admin insert"
  ON public.chat_threads FOR INSERT
  WITH CHECK (
    auth.uid() = student_id 
    OR public.is_admin()
  );

CREATE POLICY "chat_threads: student or admin update"
  ON public.chat_threads FOR UPDATE
  USING (
    auth.uid() = student_id 
    OR public.is_admin()
  );

-- No DELETE policy is provided for chat_threads (Permanent by design)

-- 5. RLS Policies for chat_messages
CREATE POLICY "chat_messages: student or admin select"
  ON public.chat_messages FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = chat_messages.thread_id
      AND t.student_id = auth.uid()
    )
  );

CREATE POLICY "chat_messages: student or admin insert"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.chat_threads t
        WHERE t.id = chat_messages.thread_id
        AND t.student_id = auth.uid()
      )
    )
  );

CREATE POLICY "chat_messages: student or admin update"
  ON public.chat_messages FOR UPDATE
  USING (
    public.is_admin()
    OR (
      sender_id != auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.chat_threads t
        WHERE t.id = chat_messages.thread_id
        AND t.student_id = auth.uid()
      )
    )
  );

-- No DELETE policy is provided for chat_messages (Permanent by design)

-- 6. Enable Realtime Publications
ALTER TABLE public.chat_threads REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_threads;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
