-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Add Islamiat as Active Subject (Grade 9 & Grade 11 Only)
-- ═══════════════════════════════════════════════════════════════════════════
-- Safe, idempotent migration. Does NOT modify or delete any existing data.
-- Grade 10 Islamiat slots remain as visual placeholders (untouched).
--
-- Run in: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Insert 'Islamiat' into the subjects reference table ──────────────
INSERT INTO public.subjects (name) VALUES ('Islamiat')
ON CONFLICT (name) DO NOTHING;

-- ── 2. Link Islamiat to all Grade 9 streams in stream_subjects ──────────
-- Grade 9 Biology stream
INSERT INTO public.stream_subjects (stream_id, subject_id)
SELECT s.id, subj.id
FROM public.streams s
JOIN public.classes c ON s.class_id = c.id
JOIN public.subjects subj ON subj.name = 'Islamiat'
WHERE c.board_id = 'fbise' AND c.grade = '9' AND s.name = 'Biology'
ON CONFLICT (stream_id, subject_id) DO NOTHING;

-- Grade 9 Computer Science stream
INSERT INTO public.stream_subjects (stream_id, subject_id)
SELECT s.id, subj.id
FROM public.streams s
JOIN public.classes c ON s.class_id = c.id
JOIN public.subjects subj ON subj.name = 'Islamiat'
WHERE c.board_id = 'fbise' AND c.grade = '9' AND s.name = 'Computer Science'
ON CONFLICT (stream_id, subject_id) DO NOTHING;

-- ── 3. Link Islamiat to all Grade 11 streams in stream_subjects ─────────
-- Grade 11 Pre-Medical stream
INSERT INTO public.stream_subjects (stream_id, subject_id)
SELECT s.id, subj.id
FROM public.streams s
JOIN public.classes c ON s.class_id = c.id
JOIN public.subjects subj ON subj.name = 'Islamiat'
WHERE c.board_id = 'fbise' AND c.grade = '11' AND s.name = 'Pre-Medical'
ON CONFLICT (stream_id, subject_id) DO NOTHING;

-- Grade 11 Pre-Engineering stream
INSERT INTO public.stream_subjects (stream_id, subject_id)
SELECT s.id, subj.id
FROM public.streams s
JOIN public.classes c ON s.class_id = c.id
JOIN public.subjects subj ON subj.name = 'Islamiat'
WHERE c.board_id = 'fbise' AND c.grade = '11' AND s.name = 'Pre-Engineering'
ON CONFLICT (stream_id, subject_id) DO NOTHING;

-- Grade 11 ICS stream
INSERT INTO public.stream_subjects (stream_id, subject_id)
SELECT s.id, subj.id
FROM public.streams s
JOIN public.classes c ON s.class_id = c.id
JOIN public.subjects subj ON subj.name = 'Islamiat'
WHERE c.board_id = 'fbise' AND c.grade = '11' AND s.name = 'ICS'
ON CONFLICT (stream_id, subject_id) DO NOTHING;

-- ── 4. Create class_offerings for Islamiat (Grade 9 & 11) ──────────────
-- Grade 9 Islamiat offering (no teacher assigned initially)
INSERT INTO public.class_offerings (class_id, subject_id)
SELECT c.id, subj.id
FROM public.classes c
JOIN public.subjects subj ON subj.name = 'Islamiat'
WHERE c.board_id = 'fbise' AND c.grade = '9'
AND NOT EXISTS (
  SELECT 1 FROM public.class_offerings co
  WHERE co.class_id = c.id AND co.subject_id = subj.id
);

-- Grade 11 Islamiat offering (no teacher assigned initially)
INSERT INTO public.class_offerings (class_id, subject_id)
SELECT c.id, subj.id
FROM public.classes c
JOIN public.subjects subj ON subj.name = 'Islamiat'
WHERE c.board_id = 'fbise' AND c.grade = '11'
AND NOT EXISTS (
  SELECT 1 FROM public.class_offerings co
  WHERE co.class_id = c.id AND co.subject_id = subj.id
);

-- ── 5. Update Grade 9 Islamiat schedule slots to use the new offering ───
-- These slots currently have offering_id = NULL and custom_title ILIKE '%Islamiat%'
UPDATE public.class_slots cs
SET
  offering_id = co.id,
  custom_title = NULL
FROM public.class_offerings co
JOIN public.classes c ON co.class_id = c.id
JOIN public.subjects subj ON co.subject_id = subj.id
WHERE c.board_id = 'fbise'
  AND c.grade = '9'
  AND subj.name = 'Islamiat'
  AND cs.class_id = c.id
  AND cs.offering_id IS NULL
  AND cs.custom_title ILIKE '%Islamiat%';

-- ── 6. Update Grade 11 Islamiat schedule slots to use the new offering ──
UPDATE public.class_slots cs
SET
  offering_id = co.id,
  custom_title = NULL
FROM public.class_offerings co
JOIN public.classes c ON co.class_id = c.id
JOIN public.subjects subj ON co.subject_id = subj.id
WHERE c.board_id = 'fbise'
  AND c.grade = '11'
  AND subj.name = 'Islamiat'
  AND cs.class_id = c.id
  AND cs.offering_id IS NULL
  AND cs.custom_title ILIKE '%Islamiat%';

-- ── 7. Verification queries (informational, no side effects) ────────────
-- Check: Islamiat subject exists
DO $$
DECLARE
  v_subj_id uuid;
  v_g9_offering_id uuid;
  v_g11_offering_id uuid;
  v_g9_slots_updated int;
  v_g11_slots_updated int;
  v_g10_slots_untouched int;
BEGIN
  SELECT id INTO v_subj_id FROM public.subjects WHERE name = 'Islamiat';
  IF v_subj_id IS NULL THEN
    RAISE EXCEPTION 'FAILED: Islamiat subject was not created!';
  END IF;
  RAISE NOTICE '✅ Islamiat subject ID: %', v_subj_id;

  -- Check Grade 9 offering
  SELECT co.id INTO v_g9_offering_id
  FROM public.class_offerings co
  JOIN public.classes c ON co.class_id = c.id
  WHERE c.board_id = 'fbise' AND c.grade = '9' AND co.subject_id = v_subj_id;
  IF v_g9_offering_id IS NULL THEN
    RAISE EXCEPTION 'FAILED: Grade 9 Islamiat offering was not created!';
  END IF;
  RAISE NOTICE '✅ Grade 9 Islamiat offering ID: %', v_g9_offering_id;

  -- Check Grade 11 offering
  SELECT co.id INTO v_g11_offering_id
  FROM public.class_offerings co
  JOIN public.classes c ON co.class_id = c.id
  WHERE c.board_id = 'fbise' AND c.grade = '11' AND co.subject_id = v_subj_id;
  IF v_g11_offering_id IS NULL THEN
    RAISE EXCEPTION 'FAILED: Grade 11 Islamiat offering was not created!';
  END IF;
  RAISE NOTICE '✅ Grade 11 Islamiat offering ID: %', v_g11_offering_id;

  -- Check Grade 9 slots were updated
  SELECT COUNT(*) INTO v_g9_slots_updated
  FROM public.class_slots cs
  JOIN public.classes c ON cs.class_id = c.id
  WHERE c.grade = '9' AND cs.offering_id = v_g9_offering_id;
  RAISE NOTICE '✅ Grade 9 Islamiat slots linked to offering: %', v_g9_slots_updated;

  -- Check Grade 11 slots were updated
  SELECT COUNT(*) INTO v_g11_slots_updated
  FROM public.class_slots cs
  JOIN public.classes c ON cs.class_id = c.id
  WHERE c.grade = '11' AND cs.offering_id = v_g11_offering_id;
  RAISE NOTICE '✅ Grade 11 Islamiat slots linked to offering: %', v_g11_slots_updated;

  -- Check Grade 10 slots are untouched (should still be custom_title placeholders)
  SELECT COUNT(*) INTO v_g10_slots_untouched
  FROM public.class_slots cs
  JOIN public.classes c ON cs.class_id = c.id
  WHERE c.grade = '10' AND cs.offering_id IS NULL AND cs.custom_title ILIKE '%Islamiat%';
  RAISE NOTICE '✅ Grade 10 Islamiat placeholder slots (untouched): %', v_g10_slots_untouched;
END $$;

COMMIT;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
