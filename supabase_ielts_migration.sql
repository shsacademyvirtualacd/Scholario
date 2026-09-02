-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — IELTS & Sindh Board Comprehensive Database Taxonomy Migration
-- Run in: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Ensure public.boards reference table has all supported boards
INSERT INTO public.boards (id, name) VALUES
  ('fbise', 'Federal Board (FBISE)'),
  ('sindh', 'Sindh Board (BSEK / BIEK)'),
  ('ielts', 'IELTS Preparation')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Ensure public.classes has rows for IELTS (Academic & General Training) & Sindh
INSERT INTO public.classes (board_id, grade, display_name) VALUES
  ('ielts', '10', 'Academic'),
  ('ielts', '12', 'General Training'),
  ('sindh', '9', '9th (Matric)'),
  ('sindh', '10', '10th (Matric)'),
  ('sindh', '11', '11th (Inter)'),
  ('sindh', '12', '12th (Inter)')
ON CONFLICT (board_id, grade) DO UPDATE SET display_name = EXCLUDED.display_name;

-- 3. Ensure public.streams has streams linked to the new classes
INSERT INTO public.streams (class_id, name) VALUES
  ((SELECT id FROM public.classes WHERE board_id = 'ielts' AND grade = '10'), 'Academic'),
  ((SELECT id FROM public.classes WHERE board_id = 'ielts' AND grade = '12'), 'General Training')
ON CONFLICT (class_id, name) DO NOTHING;

-- 4. Ensure public.subjects includes all IELTS modular subjects
INSERT INTO public.subjects (name) VALUES
  ('IELTS Preparation'),
  ('IELTS Listening'),
  ('IELTS Reading'),
  ('IELTS Reading (Academic)'),
  ('IELTS Reading (GT)'),
  ('IELTS Writing'),
  ('IELTS Writing (Academic)'),
  ('IELTS Writing (GT)'),
  ('IELTS Speaking')
ON CONFLICT (name) DO NOTHING;

-- 5. Map stream_subjects for IELTS
INSERT INTO public.stream_subjects (stream_id, subject_id)
SELECT s.id, subj.id
FROM public.streams s
JOIN public.classes c ON s.class_id = c.id
JOIN public.subjects subj ON subj.name IN ('IELTS Listening', 'IELTS Reading (Academic)', 'IELTS Writing (Academic)', 'IELTS Speaking')
WHERE c.board_id = 'ielts' AND c.grade = '10' AND s.name = 'Academic'
ON CONFLICT (stream_id, subject_id) DO NOTHING;

INSERT INTO public.stream_subjects (stream_id, subject_id)
SELECT s.id, subj.id
FROM public.streams s
JOIN public.classes c ON s.class_id = c.id
JOIN public.subjects subj ON subj.name IN ('IELTS Listening', 'IELTS Reading (GT)', 'IELTS Writing (GT)', 'IELTS Speaking')
WHERE c.board_id = 'ielts' AND c.grade = '12' AND s.name = 'General Training'
ON CONFLICT (stream_id, subject_id) DO NOTHING;

-- 6. Insert class_offerings for IELTS (Single Unified "IELTS Preparation" per class for Teacher Assignment)
INSERT INTO public.class_offerings (class_id, subject_id)
SELECT c.id, s.id
FROM public.classes c
CROSS JOIN public.subjects s
WHERE c.board_id = 'ielts' AND s.name = 'IELTS Preparation'
ON CONFLICT DO NOTHING;

-- 7. Ensure fee_configs has default pricing for IELTS classes
INSERT INTO public.fee_configs (class_id, amount, payment_instructions, whatsapp_number)
SELECT 
  c.id,
  5000,
  'Please transfer your IELTS monthly course fee via JazzCash, EasyPaisa, or Online Bank Transfer. After transferring, send your payment screenshot to our official WhatsApp helpline.',
  '+923001234567'
FROM public.classes c
WHERE c.board_id = 'ielts'
ON CONFLICT (class_id) DO NOTHING;

-- 8. Notify PostgREST to reload the schema cache immediately
NOTIFY pgrst, 'reload schema';
