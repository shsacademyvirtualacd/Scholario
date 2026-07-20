BEGIN;

-- 1. Promote Mr. Subhan (ym449958@gmail.com)
-- Old Placeholder ID: 'ae8b8135-b50e-4a75-aaec-bb4d74204e0d'
-- New Real ID:        'c518cb05-db67-4bf5-b956-17ecfea6d237'
UPDATE public.roster
SET profile_id = 'c518cb05-db67-4bf5-b956-17ecfea6d237'
WHERE email = 'ym449958@gmail.com';

-- 2. Promote Ms. Falak (hanzlamughal2013@gmail.com)
-- Old Placeholder ID: 'f8bd72a6-de07-4246-a678-e1d0b2f4a9b4'
-- New Real ID:        '7f5cd1fc-b7e2-4dfa-853f-10ef29ec136e'
UPDATE public.roster
SET profile_id = '7f5cd1fc-b7e2-4dfa-853f-10ef29ec136e'
WHERE email = 'hanzlamughal2013@gmail.com';

COMMIT;
