-- =============================================================================
-- Migration: Fix IELTS Teacher Assignment Structure
-- Description:
-- Unifies teacher assignments for IELTS to a single "IELTS Preparation" subject
-- across class_offerings and teachers records. Granular subjects (Listening,
-- Reading, Writing, Speaking, Grammar, Comprehension) remain for question banking
-- and student testing.
-- =============================================================================

-- 1. Ensure "IELTS Preparation" exists in public.subjects
INSERT INTO public.subjects (name)
VALUES ('IELTS Preparation')
ON CONFLICT (name) DO NOTHING;

-- 2. Ensure class_offerings has the unified "IELTS Preparation" offering for each IELTS class
INSERT INTO public.class_offerings (class_id, subject_id)
SELECT c.id, s.id
FROM public.classes c
CROSS JOIN public.subjects s
WHERE (c.board_id = 'ielts' OR c.grade ILIKE '%ielts%')
  AND s.name = 'IELTS Preparation'
ON CONFLICT DO NOTHING;

-- 3. If any legacy IELTS sub-skill offerings were assigned to a teacher, transfer that assignment to the unified IELTS Preparation offering
DO $$
DECLARE
  v_teacher_id UUID;
  v_ielts_prep_offering_id UUID;
  v_ielts_prep_subject_id UUID;
BEGIN
  SELECT id INTO v_ielts_prep_subject_id FROM public.subjects WHERE name = 'IELTS Preparation' LIMIT 1;
  
  -- Find any teacher assigned to IELTS sub-skills or named IELTS
  SELECT teacher_id INTO v_teacher_id
  FROM public.class_offerings co
  JOIN public.subjects s ON co.subject_id = s.id
  WHERE (s.name ILIKE '%ielts%' OR co.class_id IN (SELECT id FROM public.classes WHERE board_id = 'ielts'))
    AND co.teacher_id IS NOT NULL
  LIMIT 1;

  IF v_teacher_id IS NOT NULL AND v_ielts_prep_subject_id IS NOT NULL THEN
    -- Update all IELTS Preparation offerings to this teacher
    UPDATE public.class_offerings
    SET teacher_id = v_teacher_id
    WHERE subject_id = v_ielts_prep_subject_id;
  END IF;
END $$;

-- 4. Delete obsolete sub-skill class_offerings for IELTS (so only 1 offering exists for teacher assignment)
DELETE FROM public.class_offerings
WHERE subject_id IN (
  SELECT id FROM public.subjects
  WHERE name IN (
    'IELTS Listening',
    'IELTS Reading',
    'IELTS Reading (Academic)',
    'IELTS Reading (GT)',
    'IELTS Writing',
    'IELTS Writing (Academic)',
    'IELTS Writing (GT)',
    'IELTS Speaking'
  )
)
AND class_id IN (
  SELECT id FROM public.classes WHERE board_id = 'ielts'
);

-- 5. Update teacher profiles/records to have 'IELTS Preparation' as their subject
UPDATE public.teachers
SET subject = 'IELTS Preparation'
WHERE subject ILIKE '%ielts%';
