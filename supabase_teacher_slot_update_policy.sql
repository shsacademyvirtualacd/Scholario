-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Allow teachers to UPDATE their own class slots
-- (specifically for room_or_link / meeting link editing)
--
-- This adds a row-level UPDATE policy scoped to slots whose offering_id
-- belongs to the authenticated teacher, using the existing
-- my_teacher_offering_ids() helper (same one used in the read policy).
--
-- Postgres RLS policies are OR'd: this does NOT interfere with the
-- existing "slots: admin write" FOR ALL policy — admins keep full access.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "slots: teacher update own" ON public.class_slots;

CREATE POLICY "slots: teacher update own"
  ON public.class_slots
  FOR UPDATE
  USING   (offering_id = ANY(my_teacher_offering_ids()))
  WITH CHECK (offering_id = ANY(my_teacher_offering_ids()));
