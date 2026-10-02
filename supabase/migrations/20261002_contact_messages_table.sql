-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Contact Messages Table & Role-Based Access Control (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create the contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text,
  message text NOT NULL,
  ip_address text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Performance & lookup indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DROP POLICY IF EXISTS "contact_messages: service_role full" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages: admins read" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages: admins update" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages: admins delete" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages: public insert" ON public.contact_messages;

-- 3. Policy: Service Role has full access (Edge Function uses Service Role Key)
CREATE POLICY "contact_messages: service_role full"
  ON public.contact_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Policy: Only admins can SELECT / read contact submissions
CREATE POLICY "contact_messages: admins read"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 5. Policy: Only admins can UPDATE status (e.g. 'read', 'in_progress', 'resolved')
CREATE POLICY "contact_messages: admins update"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 6. Policy: Only admins can DELETE messages if needed
CREATE POLICY "contact_messages: admins delete"
  ON public.contact_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
