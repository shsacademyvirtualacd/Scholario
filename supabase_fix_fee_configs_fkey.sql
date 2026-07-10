-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Fix fee_configs Foreign Key, RLS & Purge Legacy Classes
-- Run this script in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Purge any leftover o_level/a_level legacy rows and their child dependencies
DELETE FROM public.class_offerings WHERE class_id IN (SELECT id FROM public.classes WHERE board_id != 'fbise');
DELETE FROM public.fee_configs WHERE class_id IN (SELECT id FROM public.classes WHERE board_id != 'fbise');
DELETE FROM public.classes WHERE board_id != 'fbise';

-- 2. Clean up any orphaned or legacy fee_configs rows whose class_id does not exist in public.classes
-- (This removes old offering IDs like c0000000-0000-0000-0000-000000000001 so the new constraint succeeds cleanly)
DELETE FROM public.fee_configs WHERE class_id NOT IN (SELECT id FROM public.classes);

-- 3. Fix the foreign key constraint on fee_configs so that class_id references public.classes(id)
-- (Originally in supabase_fee_migration.sql, it erroneously referenced public.class_offerings(id))
ALTER TABLE public.fee_configs DROP CONSTRAINT IF EXISTS fee_configs_class_id_fkey;
ALTER TABLE public.fee_configs ADD CONSTRAINT fee_configs_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- 4. Fix RLS SELECT policy on fee_configs so registration and checkout screens can read prices
-- (Originally, 'fee_configs: student read' required e.offering_id = class_id on enrollments, blocking read before/during checkout)
DROP POLICY IF EXISTS "fee_configs: student read" ON public.fee_configs;
DROP POLICY IF EXISTS "fee_configs: public read" ON public.fee_configs;
CREATE POLICY "fee_configs: public read" ON public.fee_configs FOR SELECT USING (true);

-- 5. Verify exactly 4 FBISE rows remain in public.classes and check fee_configs
SELECT id, board_id, grade, display_name FROM public.classes ORDER BY grade;
SELECT id, class_id, amount FROM public.fee_configs;
