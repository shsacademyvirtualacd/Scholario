-- =============================================================================
-- Migration: Chat Attachment Support
-- Description:
-- Adds attachment fields to public.chat_messages, validates message types,
-- and creates public.messages alias view for unified access.
-- =============================================================================

-- 1. Add attachment columns to public.chat_messages if they do not exist
ALTER TABLE public.chat_messages 
  ADD COLUMN IF NOT EXISTS attachment_key text NULL,
  ADD COLUMN IF NOT EXISTS attachment_name text NULL,
  ADD COLUMN IF NOT EXISTS attachment_size integer NULL,
  ADD COLUMN IF NOT EXISTS mime_type text NULL;

-- 2. Ensure message_type column exists with default 'text'
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text';

-- 3. Update or add check constraint for message_type (text, image, file, voice)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.chat_messages'::regclass 
      AND contype = 'c' 
      AND conname ILIKE '%message_type%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

ALTER TABLE public.chat_messages 
  ADD CONSTRAINT chat_messages_type_check 
  CHECK (message_type IN ('text', 'image', 'file', 'voice'));

-- 4. Create index on attachment_key for high performance download lookups
CREATE INDEX IF NOT EXISTS idx_chat_messages_attachment_key 
  ON public.chat_messages(attachment_key) 
  WHERE attachment_key IS NOT NULL;

-- 5. Create public.messages view as an alias to public.chat_messages
CREATE OR REPLACE VIEW public.messages AS
SELECT 
  id,
  thread_id,
  sender_id,
  sender_role,
  content,
  message_type,
  audio_url,
  audio_duration_seconds,
  attachment_key,
  attachment_name,
  attachment_size,
  mime_type,
  created_at,
  read_at
FROM public.chat_messages;

-- Grant permissions on messages view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO anon, authenticated, service_role;
