-- Fix Student Chat Contacts Visibility & Multi-Admin Thread Uniqueness
-- 1. Update RLS Policy on public.profiles:
--    Allow authenticated students to query all faculty teacher profiles and admin profiles.

DROP POLICY IF EXISTS "profiles: own read" ON public.profiles;
DROP POLICY IF EXISTS "profiles: select policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles: select" ON public.profiles;

CREATE POLICY "profiles: select" ON public.profiles FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      id = auth.uid() 
      OR role IN ('teacher', 'admin')
      OR public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.enrollments e 
        WHERE e.student_id = public.profiles.id 
          AND e.offering_id = ANY(public.my_teacher_offering_ids())
      )
    )
  );

-- 2. Update Uniqueness Indexes on public.chat_threads:
--    Enable distinct threads per (student, admin) and distinct staff conversations.

DROP INDEX IF EXISTS public.idx_chat_threads_student_admin_unique;
DROP INDEX IF EXISTS public.idx_chat_threads_admin_teacher_unique;

-- Distinct 1-on-1 thread per (student, admin) pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_threads_student_admin_unique 
  ON public.chat_threads (student_id, staff_id) 
  WHERE (thread_type = 'admin' AND student_id IS NOT NULL AND staff_id IS NOT NULL);

-- Distinct 1-on-1 thread per (teacher, admin) pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_threads_staff_unique 
  ON public.chat_threads (
    LEAST(participant_one_id, participant_two_id), 
    GREATEST(participant_one_id, participant_two_id)
  ) 
  WHERE (participant_one_id IS NOT NULL AND participant_two_id IS NOT NULL);

NOTIFY pgrst, 'reload schema';
