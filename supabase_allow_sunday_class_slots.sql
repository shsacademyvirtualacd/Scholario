-- Migration: Allow Sunday (day_of_week = 6) in class_slots_day_of_week_check
-- Day index mapping: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday

ALTER TABLE public.class_slots DROP CONSTRAINT IF EXISTS class_slots_day_of_week_check;
ALTER TABLE public.class_slots ADD CONSTRAINT class_slots_day_of_week_check CHECK (day_of_week >= 0 AND day_of_week <= 6);
