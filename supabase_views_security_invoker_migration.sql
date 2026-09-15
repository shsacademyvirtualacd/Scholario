-- =============================================================================
-- Migration: Views Security Invoker Hardening & Supporting RLS Policies
-- Description: Sets security_invoker = on on public.pending_attendance_claims,
--              public.teacher_attendance_ratio, and public.messages to eliminate
--              SECURITY DEFINER privilege escalation.
--              Supplements underlying table RLS policies on attendance_claims,
--              teacher_attendance_ratings, profiles, notifications, and chat_messages
--              so legitimate roles (teachers, admins, students, chat participants)
--              retain proper authorized access.
-- =============================================================================

-- 1. Helper function for identifying teacher IDs associated with the current user
CREATE OR REPLACE FUNCTION public.my_teacher_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(t_id), '{}'::uuid[]) FROM (
    SELECT auth.uid() AS t_id
    UNION
    SELECT t.id AS t_id FROM public.teachers t
    JOIN public.roster r ON lower(t.email) = lower(r.email)
    WHERE r.profile_id = auth.uid()
    UNION
    SELECT t.id AS t_id FROM public.teachers t
    JOIN auth.users u ON lower(t.email) = lower(u.email)
    WHERE u.id = auth.uid()
  ) sub WHERE t_id IS NOT NULL;
$$;

-- 2. Configure notifications check constraint to allow attendance claim notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type = ANY (ARRAY['announcement'::text, 'class_reminder'::text, 'privacy'::text, 'attendance_claim'::text, 'attendance'::text]));

-- 3. RLS Policies on attendance_claims
DROP POLICY IF EXISTS "Admins can manage all attendance claims" ON public.attendance_claims;
CREATE POLICY "Admins can manage all attendance claims"
  ON public.attendance_claims
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Teachers can view claims for their offerings" ON public.attendance_claims;
CREATE POLICY "Teachers can view claims for their offerings"
  ON public.attendance_claims
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR offering_id = ANY(public.my_teacher_offering_ids())
    OR offering_id IN (
      SELECT o.id FROM public.class_offerings o 
      WHERE o.teacher_id = auth.uid() OR o.teacher_id = ANY(public.my_teacher_ids())
    )
  );

DROP POLICY IF EXISTS "Teachers can update claims for their offerings" ON public.attendance_claims;
CREATE POLICY "Teachers can update claims for their offerings"
  ON public.attendance_claims
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR offering_id = ANY(public.my_teacher_offering_ids())
    OR offering_id IN (
      SELECT o.id FROM public.class_offerings o 
      WHERE o.teacher_id = auth.uid() OR o.teacher_id = ANY(public.my_teacher_ids())
    )
  )
  WITH CHECK (
    public.is_admin()
    OR offering_id = ANY(public.my_teacher_offering_ids())
    OR offering_id IN (
      SELECT o.id FROM public.class_offerings o 
      WHERE o.teacher_id = auth.uid() OR o.teacher_id = ANY(public.my_teacher_ids())
    )
  );

-- 4. RLS Policies on profiles (allow teachers to view profiles of students who claimed attendance for their offerings)
DROP POLICY IF EXISTS "profiles: select" ON public.profiles;
CREATE POLICY "profiles: select"
  ON public.profiles
  FOR SELECT
  TO public
  USING (
    (auth.role() = 'authenticated'::text) AND (
      (id = auth.uid()) OR
      (role = ANY (ARRAY['teacher'::text, 'admin'::text])) OR
      is_admin() OR
      (EXISTS (
        SELECT 1 FROM enrollments e
        WHERE (e.student_id = profiles.id) AND (e.offering_id = ANY (my_teacher_offering_ids()))
      )) OR
      (EXISTS (
        SELECT 1 FROM attendance_claims ac
        WHERE (ac.student_id = profiles.id) AND (
          ac.offering_id = ANY (my_teacher_offering_ids()) OR
          ac.offering_id IN (SELECT o.id FROM class_offerings o WHERE o.teacher_id = auth.uid() OR o.teacher_id = ANY(my_teacher_ids()))
        )
      ))
    )
  );

-- 5. RLS Policies on teacher_attendance_ratings
DROP POLICY IF EXISTS "teachers_view_own_attendance_ratings" ON public.teacher_attendance_ratings;
CREATE POLICY "teachers_view_own_attendance_ratings"
  ON public.teacher_attendance_ratings
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR teacher_id = auth.uid()
    OR teacher_id = ANY(public.my_teacher_ids())
    OR slot_id IN (
      SELECT cs.id FROM public.class_slots cs
      WHERE cs.offering_id = ANY(public.my_teacher_offering_ids())
    )
  );

-- 6. RLS Policies on chat_messages (ensure message deletion works under invoker rights)
DROP POLICY IF EXISTS "chat_messages: delete policy" ON public.chat_messages;
CREATE POLICY "chat_messages: delete policy"
  ON public.chat_messages
  FOR DELETE
  TO public
  USING (
    public.is_admin() OR sender_id = auth.uid()
  );

-- 7. Configure Views with security_invoker = on
ALTER VIEW public.pending_attendance_claims SET (security_invoker = on);
ALTER VIEW public.teacher_attendance_ratio SET (security_invoker = on);
ALTER VIEW public.messages SET (security_invoker = on);
