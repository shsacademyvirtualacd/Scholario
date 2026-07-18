-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Fix Student Self-Registration Enrollment Bug
-- Run in: Supabase → SQL Editor
--
-- Root Cause: When a student self-registers through the onboarding flow,
-- the frontend calls completeStudentOnboarding() which runs client-side
-- Supabase queries under the student's authenticated session. However:
--
--   1. RLS on class_offerings only allows students to read offerings they
--      are ALREADY enrolled in (my_enrolled_offering_ids()). A new student
--      has no enrollments yet, so this query returns 0 rows.
--
--   2. RLS on enrollments only allows admin writes (is_admin()). So even
--      if the offerings query succeeded, the enrollment INSERT would fail.
--
-- This is a classic RLS deadlock: the student can't read offerings without
-- enrollments, and can't create enrollments without admin privileges.
--
-- Fix: Create a SECURITY DEFINER RPC that performs the entire onboarding
-- atomically with elevated privileges, bypassing RLS. The function
-- validates that the caller is the student being onboarded (auth.uid()
-- must match p_student_id) to prevent impersonation.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Step 1: Create the RPC function ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.complete_student_onboarding(
  p_student_id uuid,
  p_board_id text,
  p_class_id uuid,
  p_stream_id uuid DEFAULT NULL,
  p_full_name text DEFAULT 'Student'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypasses RLS to read class_offerings and write enrollments
SET search_path = public
AS $$
DECLARE
  v_offering_ids uuid[];
  v_subject_ids uuid[];
  v_stream_name text;
  v_offering_id uuid;
BEGIN
  -- ══════════════════════════════════════════════════════════════════════
  -- GUARD 1: Impersonation check — caller must be the student themselves
  -- ══════════════════════════════════════════════════════════════════════
  IF p_student_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: student ID does not match authenticated user.';
  END IF;

  -- ══════════════════════════════════════════════════════════════════════
  -- 1. Resolve stream → subject IDs → offering IDs
  -- ══════════════════════════════════════════════════════════════════════
  IF p_stream_id IS NOT NULL THEN
    -- Get all subject IDs mapped to this stream
    v_subject_ids := ARRAY(
      SELECT subject_id FROM public.stream_subjects WHERE stream_id = p_stream_id
    );

    -- Find class offerings matching the class + those subjects
    v_offering_ids := ARRAY(
      SELECT id FROM public.class_offerings
      WHERE class_id = p_class_id AND subject_id = ANY(v_subject_ids)
    );
  ELSE
    v_offering_ids := ARRAY[]::uuid[];
  END IF;

  -- ══════════════════════════════════════════════════════════════════════
  -- 2. Resolve stream display name
  -- ══════════════════════════════════════════════════════════════════════
  IF p_stream_id IS NOT NULL THEN
    SELECT name INTO v_stream_name FROM public.streams WHERE id = p_stream_id;
  END IF;
  v_stream_name := COALESCE(v_stream_name, 'General');

  -- ══════════════════════════════════════════════════════════════════════
  -- 3. Upsert student profile
  --    GUARD 2: Preserves existing avatar_url and phone (set by OAuth)
  -- ══════════════════════════════════════════════════════════════════════
  INSERT INTO public.profiles (id, role, full_name, board_id, class_id, stream_id, stream, onboarding_complete)
  VALUES (
    p_student_id,
    'student',
    COALESCE(p_full_name, 'Student'),
    p_board_id,
    p_class_id,
    p_stream_id,
    v_stream_name,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE
  SET
    board_id = EXCLUDED.board_id,
    class_id = EXCLUDED.class_id,
    stream_id = EXCLUDED.stream_id,
    stream = EXCLUDED.stream,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, 'Student'), profiles.full_name, EXCLUDED.full_name),
    onboarding_complete = TRUE;
  -- NOTE: avatar_url and phone are intentionally NOT touched here.
  -- They are set during Google OAuth login and must be preserved.

  -- ══════════════════════════════════════════════════════════════════════
  -- 4. Clear existing enrollments (clean slate for re-onboarding)
  -- ══════════════════════════════════════════════════════════════════════
  DELETE FROM public.enrollments WHERE student_id = p_student_id;

  -- ══════════════════════════════════════════════════════════════════════
  -- 5. Create new enrollments for every matched offering
  -- ══════════════════════════════════════════════════════════════════════
  IF array_length(v_offering_ids, 1) IS NOT NULL AND array_length(v_offering_ids, 1) > 0 THEN
    FOREACH v_offering_id IN ARRAY v_offering_ids
    LOOP
      INSERT INTO public.enrollments (student_id, offering_id, total_classes)
      VALUES (p_student_id, v_offering_id, 48);
    END LOOP;
  END IF;

  -- ══════════════════════════════════════════════════════════════════════
  -- 6. Ensure fee_statuses row exists (does NOT overwrite 'paid' status)
  -- ══════════════════════════════════════════════════════════════════════
  INSERT INTO public.fee_statuses (student_id, status)
  VALUES (p_student_id, 'unpaid')
  ON CONFLICT (student_id) DO NOTHING;

END;
$$;

-- ─── Step 2: Grant execute permission to authenticated users ─────────────
GRANT EXECUTE ON FUNCTION public.complete_student_onboarding(uuid, text, uuid, uuid, text) TO authenticated;

-- ─── Step 3: Reload PostgREST schema cache ──────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ─── Verification ────────────────────────────────────────────────────────
-- After running, verify the function exists:
SELECT proname, prosecdef
FROM pg_proc
WHERE proname = 'complete_student_onboarding';
-- Expected: complete_student_onboarding | t  (prosecdef = true means SECURITY DEFINER)
