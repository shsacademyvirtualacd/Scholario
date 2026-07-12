-- 1. Confirm both teachers' roster rows point to real profile ids
SELECT id, profile_id FROM public.roster WHERE profile_id IN ('fab93f7f-8499-4f97-921b-b7a8b21a644d', '9df8c0c8-8b3a-4c24-8816-6827a1ea404b');

-- Confirm class_offerings point to new real teacher_ids
SELECT id, teacher_id FROM public.class_offerings WHERE teacher_id IN ('fab93f7f-8499-4f97-921b-b7a8b21a644d', '9df8c0c8-8b3a-4c24-8816-6827a1ea404b');

-- 2. Confirm the old placeholder profile rows are gone
SELECT id FROM public.profiles WHERE id IN ('2df8dce0-fb88-4343-9be1-669f55789a32', '50df639d-4c5f-4639-b9f6-74152dcf7b68');

-- 3. Confirm zero orphaned/ghost profiles remain when querying full_name ILIKE '%hashir%'
SELECT id, full_name, role FROM public.profiles WHERE full_name ILIKE '%hashir%';
