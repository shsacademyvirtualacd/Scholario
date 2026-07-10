-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Normalized Class Taxonomy Alignment Migration (FBISE Only)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create reference tables
CREATE TABLE IF NOT EXISTS public.boards (
    id text PRIMARY KEY,
    name text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.classes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id text REFERENCES public.boards(id) ON DELETE CASCADE,
    grade text NOT NULL,
    display_name text NOT NULL,
    UNIQUE (board_id, grade)
);

CREATE TABLE IF NOT EXISTS public.streams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
    name text NOT NULL,
    UNIQUE (class_id, name)
);

CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.stream_subjects (
    stream_id uuid REFERENCES public.streams(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (stream_id, subject_id)
);

-- Drop legacy class_subjects table if it exists (no longer used in FBISE-only taxonomy)
DROP TABLE IF EXISTS public.class_subjects CASCADE;

-- 2. Add columns to profiles for normalized taxonomy
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS board_id text REFERENCES public.boards(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stream_id uuid REFERENCES public.streams(id) ON DELETE SET NULL;

-- 3. Add columns to class_offerings for normalized taxonomy
ALTER TABLE public.class_offerings ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE;
ALTER TABLE public.class_offerings ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE;
ALTER TABLE public.class_offerings ADD COLUMN IF NOT EXISTS stream_id uuid REFERENCES public.streams(id) ON DELETE CASCADE;

-- Clean up any legacy boards or classes
DELETE FROM public.boards WHERE id IN ('o_level', 'a_level', 'local', 'bise');

-- 4. Seed Reference Tables (FBISE Only)
-- Boards
INSERT INTO public.boards (id, name) VALUES
  ('fbise', 'FBISE')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Classes
INSERT INTO public.classes (board_id, grade, display_name) VALUES
  ('fbise', '9', '9th'),
  ('fbise', '10', '10th'),
  ('fbise', '11', '11th'),
  ('fbise', '12', '12th')
ON CONFLICT (board_id, grade) DO UPDATE SET display_name = EXCLUDED.display_name;

-- Streams
INSERT INTO public.streams (class_id, name) VALUES
  ((SELECT id FROM public.classes WHERE board_id='fbise' AND grade='9'), 'Biology'),
  ((SELECT id FROM public.classes WHERE board_id='fbise' AND grade='9'), 'Computer Science'),
  ((SELECT id FROM public.classes WHERE board_id='fbise' AND grade='10'), 'Biology'),
  ((SELECT id FROM public.classes WHERE board_id='fbise' AND grade='10'), 'Computer Science'),
  ((SELECT id FROM public.classes WHERE board_id='fbise' AND grade='11'), 'Pre-Medical'),
  ((SELECT id FROM public.classes WHERE board_id='fbise' AND grade='11'), 'ICS'),
  ((SELECT id FROM public.classes WHERE board_id='fbise' AND grade='11'), 'Pre-Engineering'),
  ((SELECT id FROM public.classes WHERE board_id='fbise' AND grade='12'), 'Pre-Medical'),
  ((SELECT id FROM public.classes WHERE board_id='fbise' AND grade='12'), 'ICS'),
  ((SELECT id FROM public.classes WHERE board_id='fbise' AND grade='12'), 'Pre-Engineering')
ON CONFLICT (class_id, name) DO NOTHING;

-- Subjects
INSERT INTO public.subjects (name) VALUES
  ('Biology'),
  ('Chemistry'),
  ('Mathematics'),
  ('Computer Science'),
  ('Computer'),
  ('Physics'),
  ('English'),
  ('Urdu')
ON CONFLICT (name) DO NOTHING;

-- Stream Subjects (FBISE)
DELETE FROM public.stream_subjects;
INSERT INTO public.stream_subjects (stream_id, subject_id)
SELECT s.id, subj.id
FROM public.streams s
JOIN public.classes c ON s.class_id = c.id
JOIN public.subjects subj ON (
    (c.grade = '9' AND s.name = 'Biology' AND subj.name IN ('Biology', 'Chemistry', 'Physics', 'Mathematics', 'English', 'Urdu')) OR
    (c.grade = '9' AND s.name = 'Computer Science' AND subj.name IN ('Computer Science', 'Chemistry', 'Physics', 'Mathematics', 'English', 'Urdu')) OR
    (c.grade = '10' AND s.name = 'Biology' AND subj.name IN ('Biology', 'Chemistry', 'Physics', 'Mathematics', 'English', 'Urdu')) OR
    (c.grade = '10' AND s.name = 'Computer Science' AND subj.name IN ('Computer', 'Chemistry', 'Physics', 'Mathematics', 'English', 'Urdu')) OR
    (c.grade IN ('11', '12') AND s.name = 'Pre-Medical' AND subj.name IN ('Biology', 'Chemistry', 'Physics', 'English', 'Urdu')) OR
    (c.grade IN ('11', '12') AND s.name = 'ICS' AND subj.name IN ('Computer Science', 'Mathematics', 'Physics', 'English', 'Urdu')) OR
    (c.grade IN ('11', '12') AND s.name = 'Pre-Engineering' AND subj.name IN ('Mathematics', 'Chemistry', 'Physics', 'English', 'Urdu'))
)
WHERE c.board_id = 'fbise';

-- 5. Map existing offerings to the normalized columns
UPDATE public.class_offerings co
SET class_id = c.id
FROM public.classes c
WHERE co.board = c.board_id AND co.grade = c.grade;

UPDATE public.class_offerings co
SET subject_id = s.id
FROM public.subjects s
WHERE co.subject = s.name;

-- Delete offerings that do not match the new taxonomy criteria
DELETE FROM public.class_offerings WHERE class_id IS NULL OR subject_id IS NULL;

-- Set constraints
ALTER TABLE public.class_offerings ALTER COLUMN class_id SET NOT NULL;
ALTER TABLE public.class_offerings ALTER COLUMN subject_id SET NOT NULL;

-- 6. Populate class_id, board_id, stream_id for existing mock/seed students
UPDATE public.profiles p
SET 
  board_id = 'fbise',
  class_id = (SELECT id FROM public.classes WHERE board_id='fbise' AND grade='10'),
  stream_id = (SELECT id FROM public.streams WHERE class_id = (SELECT id FROM public.classes WHERE board_id='fbise' AND grade='10') AND name='Biology')
WHERE id = '7a6e6066-9d19-42e8-9d9c-bc6e0d4222e2';

UPDATE public.profiles p
SET 
  board_id = 'fbise',
  class_id = (SELECT id FROM public.classes WHERE board_id='fbise' AND grade='9'),
  stream_id = (SELECT id FROM public.streams WHERE class_id = (SELECT id FROM public.classes WHERE board_id='fbise' AND grade='9') AND name='Biology')
WHERE id = 'eaa55d72-ac37-41bb-bc06-60a1a6064103';

UPDATE public.profiles p
SET 
  board_id = 'fbise',
  class_id = (SELECT id FROM public.classes WHERE board_id='fbise' AND grade='11'),
  stream_id = (SELECT id FROM public.streams WHERE class_id = (SELECT id FROM public.classes WHERE board_id='fbise' AND grade='11') AND name='Pre-Medical')
WHERE id = '0b3fd6eb-56b2-4fcf-904e-7da63de388fa';

UPDATE public.profiles p
SET 
  board_id = 'fbise',
  class_id = (SELECT id FROM public.classes WHERE board_id='fbise' AND grade='11'),
  stream_id = (SELECT id FROM public.streams WHERE class_id = (SELECT id FROM public.classes WHERE board_id='fbise' AND grade='11') AND name='Pre-Medical')
WHERE id = 'b37dbee0-9750-487f-aeb8-1e00e1b7e4e7';

-- 7. Drop old columns BEFORE inserting new offerings to avoid not-null constraint errors
ALTER TABLE public.class_offerings DROP COLUMN IF EXISTS board;
ALTER TABLE public.class_offerings DROP COLUMN IF EXISTS grade;
ALTER TABLE public.class_offerings DROP COLUMN IF EXISTS subject;

-- 8. Insert any missing class offerings for our taxonomy to make it complete
INSERT INTO public.class_offerings (class_id, subject_id)
SELECT c.id, s.id
FROM public.classes c
JOIN public.subjects s ON (
  (c.grade IN ('9', '11', '12') AND s.name IN ('Biology', 'Chemistry', 'Mathematics', 'Computer Science', 'Physics', 'English', 'Urdu')) OR
  (c.grade = '10' AND s.name IN ('Biology', 'Chemistry', 'Mathematics', 'Computer', 'Physics', 'English', 'Urdu'))
)
WHERE c.board_id = 'fbise'
ON CONFLICT DO NOTHING;

-- Notify reload schema
NOTIFY pgrst, 'reload schema';
