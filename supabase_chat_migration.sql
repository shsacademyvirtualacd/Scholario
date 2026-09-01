-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Direct 1-on-1 Chat System Migration (Threads & Messages)
-- Permanent, non-deletable 1-on-1 messaging for Student <-> Teacher / Student <-> Admin
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Chat Threads Table
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  participant_one_role text NOT NULL CHECK (participant_one_role IN ('student', 'teacher', 'admin')),
  participant_two_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  participant_two_role text NOT NULL CHECK (participant_two_role IN ('student', 'teacher', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure only 1 thread exists per pair of participants
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_threads_unique_pair 
  ON public.chat_threads (
    LEAST(participant_one_id, participant_two_id), 
    GREATEST(participant_one_id, participant_two_id)
  );

CREATE INDEX IF NOT EXISTS idx_chat_threads_p1 ON public.chat_threads(participant_one_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_p2 ON public.chat_threads(participant_two_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_created_at ON public.chat_threads(created_at DESC);

-- 2. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE RESTRICT,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  sender_role text NOT NULL CHECK (sender_role IN ('student', 'teacher', 'admin')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created ON public.chat_messages(thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON public.chat_messages(thread_id, sender_id, read_at) WHERE read_at IS NULL;

-- 3. Enable RLS
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for chat_threads
DROP POLICY IF EXISTS "chat_threads: participant or admin select" ON public.chat_threads;
DROP POLICY IF EXISTS "chat_threads: participant or admin insert" ON public.chat_threads;
DROP POLICY IF EXISTS "chat_threads: participant or admin update" ON public.chat_threads;

CREATE POLICY "chat_threads: participant or admin select"
  ON public.chat_threads FOR SELECT
  USING (
    auth.uid() = participant_one_id 
    OR auth.uid() = participant_two_id 
    OR public.is_admin()
  );

CREATE POLICY "chat_threads: participant or admin insert"
  ON public.chat_threads FOR INSERT
  WITH CHECK (
    auth.uid() = participant_one_id 
    OR auth.uid() = participant_two_id 
    OR public.is_admin()
  );

CREATE POLICY "chat_threads: participant or admin update"
  ON public.chat_threads FOR UPDATE
  USING (
    auth.uid() = participant_one_id 
    OR auth.uid() = participant_two_id 
    OR public.is_admin()
  );

-- Notice: NO DELETE POLICY IS CREATED ON chat_threads (Permanent by design)

-- 5. RLS Policies for chat_messages
DROP POLICY IF EXISTS "chat_messages: participant or admin select" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages: participant or admin insert" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages: participant or admin update" ON public.chat_messages;

CREATE POLICY "chat_messages: participant or admin select"
  ON public.chat_messages FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = chat_messages.thread_id
      AND (t.participant_one_id = auth.uid() OR t.participant_two_id = auth.uid())
    )
  );

CREATE POLICY "chat_messages: participant or admin insert"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.chat_threads t
        WHERE t.id = chat_messages.thread_id
        AND (t.participant_one_id = auth.uid() OR t.participant_two_id = auth.uid())
      )
    )
  );

CREATE POLICY "chat_messages: participant or admin update"
  ON public.chat_messages FOR UPDATE
  USING (
    public.is_admin()
    OR (
      sender_id != auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.chat_threads t
        WHERE t.id = chat_messages.thread_id
        AND (t.participant_one_id = auth.uid() OR t.participant_two_id = auth.uid())
      )
    )
  );

-- Notice: NO DELETE POLICY IS CREATED ON chat_messages (Permanent by design)

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
