-- =============================================================================
-- SCHOLARIO — NOTES FEATURE STORAGE & RLS MIGRATION
-- =============================================================================

-- 1. Ensure notes table has file_path column
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS file_path text;

-- 2. Drop insecure public policy on notes if it exists
DROP POLICY IF EXISTS "Allow public read/write access" ON public.notes;
DROP POLICY IF EXISTS "notes: read" ON public.notes;
DROP POLICY IF EXISTS "notes: teacher insert" ON public.notes;
DROP POLICY IF EXISTS "notes: teacher+admin delete" ON public.notes;
DROP POLICY IF EXISTS "notes: admin all" ON public.notes;

-- 3. Enhance my_teacher_offering_ids() to robustly match teachers to class_offerings
CREATE OR REPLACE FUNCTION public.my_teacher_offering_ids()
 RETURNS uuid[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT ARRAY(
    SELECT id FROM public.class_offerings 
    WHERE teacher_id = auth.uid() 
       OR teacher_id IN (
         SELECT t.id FROM public.teachers t
         JOIN public.roster r ON lower(t.email) = lower(r.email)
         WHERE r.profile_id = auth.uid()
       )
       OR teacher_id IN (
         SELECT t.id FROM public.teachers t
         JOIN auth.users u ON lower(t.email) = lower(u.email)
         WHERE u.id = auth.uid()
       )
  );
$function$
;

-- 4. Set exact Row-Level Security policies on public.notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- SELECT policy:
-- Teacher: can SELECT notes for their own assigned offerings only
-- Student: can SELECT notes only where offering_id matches their own enrolled class+stream+subject (mirroring slots: read)
-- Admin: full SELECT access across all notes
CREATE POLICY "notes: read"
  ON public.notes FOR SELECT
  USING (
    (offering_id = ANY(my_enrolled_offering_ids()))
    OR (offering_id = ANY(my_teacher_offering_ids()))
    OR is_admin()
  );

-- INSERT policy:
-- Teacher: can INSERT a note only if offering_id belongs to an offering they are assigned to
-- Admin: can INSERT notes for any class/offering
CREATE POLICY "notes: insert"
  ON public.notes FOR INSERT
  WITH CHECK (
    (offering_id = ANY(my_teacher_offering_ids()))
    OR is_admin()
  );

-- DELETE policy:
-- Admin: oversight delete access for any class/stream note
-- Teacher: no update/delete policy for teachers in this batch (Admin only or uploaded_by if admin)
CREATE POLICY "notes: delete"
  ON public.notes FOR DELETE
  USING (
    is_admin()
  );

-- 5. Supabase Storage Setup (`notes` bucket)
-- Ensure 'notes' bucket is created and NOT publicly readable by default (public = false)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('notes', 'notes', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET public = false;

-- 6. Set exact RLS policies on storage.objects for the 'notes' bucket
DROP POLICY IF EXISTS notes_bucket_read ON storage.objects;
DROP POLICY IF EXISTS notes_bucket_insert ON storage.objects;
DROP POLICY IF EXISTS notes_bucket_update ON storage.objects;
DROP POLICY IF EXISTS notes_bucket_delete ON storage.objects;

CREATE POLICY notes_bucket_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'notes');

CREATE POLICY notes_bucket_insert
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'notes');

CREATE POLICY notes_bucket_update
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'notes')
  WITH CHECK (bucket_id = 'notes');

CREATE POLICY notes_bucket_delete
  ON storage.objects FOR DELETE
  USING (bucket_id = 'notes');
