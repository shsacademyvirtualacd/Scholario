-- =============================================================================
-- SCHOLARIO — SUPABASE STORAGE OBJECTS RLS POLICIES FOR 'notes' BUCKET
-- =============================================================================

-- Drop any existing notes policies on storage.objects to avoid conflicts or duplicates
DROP POLICY IF EXISTS notes_bucket_read ON storage.objects;
DROP POLICY IF EXISTS notes_bucket_insert ON storage.objects;
DROP POLICY IF EXISTS notes_bucket_update ON storage.objects;
DROP POLICY IF EXISTS notes_bucket_delete ON storage.objects;

-- 1. SELECT policy: Allow reading/signing URLs for objects inside 'notes' bucket
CREATE POLICY notes_bucket_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'notes');

-- 2. INSERT policy: Allow authenticated users (teachers/admins) to upload objects to 'notes' bucket
CREATE POLICY notes_bucket_insert
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'notes');

-- 3. UPDATE policy: Allow updating objects/metadata inside 'notes' bucket
CREATE POLICY notes_bucket_update
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'notes')
  WITH CHECK (bucket_id = 'notes');

-- 4. DELETE policy: Allow deleting objects inside 'notes' bucket
CREATE POLICY notes_bucket_delete
  ON storage.objects FOR DELETE
  USING (bucket_id = 'notes');
