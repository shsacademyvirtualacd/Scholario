-- ═══════════════════════════════════════════════════════════════════════════
-- URGENT HOTFIX — Run this in Supabase SQL Editor right now
-- Fixes: infinite RLS recursion on profiles table causing fetchProfile()
-- to silently return null for all users, breaking OAuth sign-in
-- ═══════════════════════════════════════════════════════════════════════════

-- The BROKEN policies used inline EXISTS subqueries on public.profiles,
-- which caused infinite recursion when RLS evaluated them.
-- The FIX uses the SECURITY DEFINER is_admin() function which bypasses RLS
-- internally, breaking the circular dependency.

-- ─── profiles: read ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles: own read" ON public.profiles;
CREATE POLICY "profiles: own read"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

-- ─── profiles: update ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles: own update" ON public.profiles;
CREATE POLICY "profiles: own update"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_admin());

-- ─── profiles: admin insert ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles: admin insert" ON public.profiles;
CREATE POLICY "profiles: admin insert"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin());

-- ─── profiles: self provision (first login) ───────────────────────────────────
DROP POLICY IF EXISTS "profiles: self provision" ON public.profiles;
CREATE POLICY "profiles: self provision"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ─── profiles: admin delete ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles: admin delete" ON public.profiles;
CREATE POLICY "profiles: admin delete"
  ON public.profiles FOR DELETE
  USING (public.is_admin());

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

-- Verify: should return your two real admin profiles
SELECT id, full_name, role, onboarding_complete FROM public.profiles ORDER BY created_at;
