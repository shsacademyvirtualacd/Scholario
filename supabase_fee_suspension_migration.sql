-- ─── Add Monthly Billing Suspension and Account Termination Columns ───
ALTER TABLE public.roster
ADD COLUMN IF NOT EXISTS fee_suspended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS awaiting_termination boolean DEFAULT false;
