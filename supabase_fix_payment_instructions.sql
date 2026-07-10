-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Fix Payment Instructions & Ensure Universal Fee Config
-- Run this script in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Update any existing fee_configs rows that contain the old typo number (033353292094)
UPDATE public.fee_configs
SET payment_instructions = REPLACE(payment_instructions, '033353292094', '03335292094'),
    updated_at = NOW()
WHERE payment_instructions LIKE '%033353292094%';

-- 2. Update any existing fee_configs rows to ensure exact account names and numbers are set
UPDATE public.fee_configs
SET payment_instructions = 'Easypaisa:
Number: 03335292094
Name: Sadia Fatima

JazzCash:
Number: 03058969050
Name: Haseena Bibi',
    updated_at = NOW();

-- 3. Ensure universal fee config (where class_id IS NULL) exists and has exact payment details
INSERT INTO public.fee_configs (class_id, amount, payment_instructions, whatsapp_number)
SELECT NULL, 0, 'Easypaisa:
Number: 03335292094
Name: Sadia Fatima

JazzCash:
Number: 03058969050
Name: Haseena Bibi', '03222314436'
WHERE NOT EXISTS (
    SELECT 1 FROM public.fee_configs WHERE class_id IS NULL
);

-- 4. Verify results
SELECT id, class_id, amount, payment_instructions FROM public.fee_configs;
