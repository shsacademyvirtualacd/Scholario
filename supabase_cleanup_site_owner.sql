-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Completely Remove Admin "shs.academy.virtual@gmail.com" / "Site Owner"
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_profile_id uuid := '6ef32f7d-3aa7-421f-ba22-86574720b00f';
  v_email_canonical text := 'shs.academy.virtual@gmail.com';
  v_email_alias text := 'shs.academyvirtual@gmail.com';
BEGIN
  RAISE NOTICE 'Starting cleanup for Site Owner admin account...';

  -- 1. Delete notifications where recipient is the Site Owner
  DELETE FROM public.notifications WHERE recipient_id = v_profile_id;

  -- 2. Delete roster entries
  DELETE FROM public.roster WHERE profile_id = v_profile_id OR email IN (v_email_canonical, v_email_alias);

  -- 3. Delete profile entry
  DELETE FROM public.profiles WHERE id = v_profile_id;

  -- 4. Delete auth.users entry
  DELETE FROM auth.users WHERE id = v_profile_id OR email IN (v_email_canonical, v_email_alias);

  RAISE NOTICE 'Site Owner admin account and associated records removed successfully.';
END $$;
