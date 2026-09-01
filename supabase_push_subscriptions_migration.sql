-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Web Push Subscriptions Table & RLS Policies
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  subscription_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_role ON public.push_subscriptions(role);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON public.push_subscriptions(endpoint);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions: own select" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions: own insert" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions: own update" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions: own delete" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions: admin all" ON public.push_subscriptions;

CREATE POLICY "push_subscriptions: own select"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions: own insert"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions: own update"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions: own delete"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions: admin all"
  ON public.push_subscriptions FOR ALL
  USING (public.is_admin());
