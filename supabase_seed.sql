-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Dev Seed Data
-- Mirrors mockData.ts exactly so you can test all three role views
-- against the real DB while VITE_USE_MOCK_AUTH=false.
--
-- Run AFTER supabase_rls_migration.sql
-- Run in Supabase → SQL Editor
-- Safe to re-run: uses INSERT ... ON CONFLICT DO NOTHING
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Safe column & constraint provisioning ──────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stream text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Drop foreign key constraint to auth.users during seed so mock data can exist
-- without having to populate the auth.users table (which is managed by Supabase Auth).
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

INSERT INTO public.profiles (id, role, full_name, avatar_url, phone, stream, created_at) VALUES
  ('a0000000-0000-0000-0000-000000000001',   'student', 'Rayn Ahmad',    NULL, '+92 300 123 4567', 'pre-engineering', '2026-06-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000002',             'student', 'Ali Hassan',     NULL, '+92 301 234 5678', 'ics',             '2026-06-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000003',             'student', 'Sara Malik',     NULL, '+92 302 345 6789', 'pre-medical',     '2026-06-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000004',             'student', 'Usman Khan',     NULL, '+92 303 456 7890', 'pre-engineering', '2026-06-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000005',             'student', 'Nadia Iqbal',    NULL, '+92 304 567 8901', 'ics',             '2026-06-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000006',             'student', 'Zainab Bibi',    NULL, '+92 305 678 9012', 'pre-medical',     '2026-06-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000007',             'student', 'Hamza Bilal',    NULL, '+92 306 789 0123', 'pre-engineering', '2026-06-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000008',             'student', 'Bilal Shah',     NULL, '+92 307 890 1234', 'ics',             '2026-06-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000009',             'student', 'Fatima Zahra',   NULL, '+92 308 901 2345', 'pre-medical',     '2026-06-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000010',  'admin',   'Dev Admin',      NULL, '123-456-7890',     NULL,              '2026-06-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000011', 'admin',   'Syed Rayyan',    NULL, '123-456-7890',     NULL,              '2026-07-07T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000012', 'admin',   'Khashir',        NULL, '123-456-7890',     NULL,              '2026-07-07T12:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ─── Teachers ──────────────────────────────────────────────────────────────
INSERT INTO public.teachers (id, full_name, avatar_url, phone, email, joining_date, is_active, created_at) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Mr. Ahmad Khan',     NULL, '+92 321 987 6543', 'ahmad.khan@shs.edu.pk',    '2024-01-10', TRUE, '2024-01-10T08:00:00Z'),
  ('b0000000-0000-0000-0000-000000000002', 'Ms. Sara Ahmed',     NULL, '+92 333 456 7890', 'sara.ahmed@shs.edu.pk',    '2024-03-15', TRUE, '2024-03-15T08:00:00Z'),
  ('b0000000-0000-0000-0000-000000000003', 'Dr. Tariq Mahmood',  NULL, '+92 300 765 4321', 'tariq.mahmood@shs.edu.pk', '2023-09-01', TRUE, '2023-09-01T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Teacher profiles (so teacher can login and get profile)
INSERT INTO public.profiles (id, role, full_name, avatar_url, phone, stream, created_at) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'teacher', 'Mr. Ahmad Khan',    NULL, '+92 321 987 6543', NULL, '2024-01-10T08:00:00Z'),
  ('b0000000-0000-0000-0000-000000000002', 'teacher', 'Ms. Sara Ahmed',    NULL, '+92 333 456 7890', NULL, '2024-03-15T08:00:00Z'),
  ('b0000000-0000-0000-0000-000000000003', 'teacher', 'Dr. Tariq Mahmood', NULL, '+92 300 765 4321', NULL, '2023-09-01T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ─── Class Offerings ───────────────────────────────────────────────────────
INSERT INTO public.class_offerings (id, board, grade, subject, teacher_id, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000001',  'fbise',   '10', 'Mathematics',    'b0000000-0000-0000-0000-000000000001', '2026-06-01T00:00:00Z'),
  ('c0000000-0000-0000-0000-000000000002',  'fbise',   '10', 'Physics',        'b0000000-0000-0000-0000-000000000002', '2026-06-01T00:00:00Z'),
  ('c0000000-0000-0000-0000-000000000003',  'fbise',   '10', 'Chemistry',      'b0000000-0000-0000-0000-000000000003', '2026-06-01T00:00:00Z'),
  ('c0000000-0000-0000-0000-000000000004',  'fbise',   '10', 'Biology',        'b0000000-0000-0000-0000-000000000002', '2026-06-01T00:00:00Z'),
  ('c0000000-0000-0000-0000-000000000005',  'fbise',   '10', 'Computer Science','b0000000-0000-0000-0000-000000000001','2026-06-01T00:00:00Z'),
  ('c0000000-0000-0000-0000-000000000006',  'o_level', 'c0000000-0000-0000-0000-000000000001', 'Accounting',     'b0000000-0000-0000-0000-000000000001', '2026-06-01T00:00:00Z'),
  ('c0000000-0000-0000-0000-000000000007',  'o_level', 'c0000000-0000-0000-0000-000000000001', 'Economics',      'b0000000-0000-0000-0000-000000000002', '2026-06-01T00:00:00Z'),
  ('c0000000-0000-0000-0000-000000000008',  'local',   '9',  'Mathematics',    'b0000000-0000-0000-0000-000000000001', '2026-06-01T00:00:00Z'),
  ('c0000000-0000-0000-0000-000000000009',  'local',   '9',  'Physics',        'b0000000-0000-0000-0000-000000000002', '2026-06-01T00:00:00Z'),
  ('c0000000-0000-0000-0000-000000000010', 'a_level', 'as', 'Chemistry',      'b0000000-0000-0000-0000-000000000003', '2026-06-01T00:00:00Z'),
  ('c0000000-0000-0000-0000-000000000011', 'a_level', 'as', 'Computer Science','b0000000-0000-0000-0000-000000000001','2026-06-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ─── Class Slots ───────────────────────────────────────────────────────────
INSERT INTO public.class_slots (id, offering_id, day_of_week, start_time, end_time, room_or_link, is_cancelled, created_at) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 0, '16:00:00', '17:30:00', 'Room 102 & Zoom',  FALSE, '2026-06-01T00:00:00Z'),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 0, '18:00:00', '19:30:00', 'Room 105',         FALSE, '2026-06-01T00:00:00Z'),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 2, '16:00:00', '17:30:00', 'Room 102 & Zoom',  FALSE, '2026-06-01T00:00:00Z'),
  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 2, '18:00:00', '19:30:00', 'Room 105',         TRUE,  '2026-06-01T00:00:00Z'),
  ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 4, '16:00:00', '17:30:00', 'Chemistry Lab',    FALSE, '2026-06-01T00:00:00Z'),
  ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 4, '18:00:00', '19:30:00', 'Room 102',         FALSE, '2026-06-01T00:00:00Z'),
  ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003', 5, '11:00:00', '12:30:00', 'Room 103',         FALSE, '2026-06-01T00:00:00Z'),
  ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000005', 0, '19:30:00', '21:00:00', 'Room 105 & Zoom',  FALSE, '2026-06-01T00:00:00Z'),
  ('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000003', 2, '18:00:00', '19:30:00', 'Chemistry Lab',    FALSE, '2026-06-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ─── Enrollments ───────────────────────────────────────────────────────────
INSERT INTO public.enrollments (id, student_id, offering_id, total_classes, enrolled_at) VALUES
  -- Rayn Ahmad (pre-engineering: Math, Physics, Chemistry)
  (gen_random_uuid(),    'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 48, '2026-06-01T12:00:00Z'),
  (gen_random_uuid(),    'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 48, '2026-06-01T12:00:00Z'),
  (gen_random_uuid(),    'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 48, '2026-06-01T12:00:00Z'),
  -- Ali Hassan (ics: Math, Physics, CS)
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 48, '2026-06-01T12:00:00Z'),
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 48, '2026-06-01T12:00:00Z'),
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 48, '2026-06-01T12:00:00Z'),
  -- Sara Malik (pre-medical: Biology, Physics, Chemistry)
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 48, '2026-06-01T12:00:00Z'),
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 48, '2026-06-01T12:00:00Z'),
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 48, '2026-06-01T12:00:00Z'),
  -- Usman Khan (pre-engineering)
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 48, '2026-06-01T12:00:00Z'),
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 48, '2026-06-01T12:00:00Z'),
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 48, '2026-06-01T12:00:00Z'),
  -- Nadia Iqbal (ics)
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 48, '2026-06-01T12:00:00Z'),
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 48, '2026-06-01T12:00:00Z'),
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 48, '2026-06-01T12:00:00Z'),
  -- Zainab Bibi (pre-medical)
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000004', 48, '2026-06-01T12:00:00Z'),
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 48, '2026-06-01T12:00:00Z'),
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 48, '2026-06-01T12:00:00Z'),
  -- Hamza Bilal (pre-engineering)
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 48, '2026-06-01T12:00:00Z'),
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000002', 48, '2026-06-01T12:00:00Z'),
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003', 48, '2026-06-01T12:00:00Z'),
  -- Bilal Shah (o-level: Accounting, Economics)
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000006', 48, '2026-06-01T12:00:00Z'),
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000007', 48, '2026-06-01T12:00:00Z'),
  -- Fatima Zahra (pre-medical)
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000004', 48, '2026-06-01T12:00:00Z'),
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000002', 48, '2026-06-01T12:00:00Z'),
  (gen_random_uuid(),  'a0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000003', 48, '2026-06-01T12:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ─── Sample Notes ──────────────────────────────────────────────────────────
INSERT INTO public.notes (id, offering_id, chapter_name, title, file_url, file_type, uploaded_by, created_at) VALUES
  (gen_random_uuid(),  'c0000000-0000-0000-0000-000000000001', 'Chapter 4 — Algebraic Expressions', 'Exercise 4.1 & 4.2 Solved Examples',               'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'pdf',   'a0000000-0000-0000-0000-000000000010', '2026-07-05T14:30:00Z'),
  (gen_random_uuid(),  'c0000000-0000-0000-0000-000000000002', 'Chapter 2 — Vectors & Forces',       'Vectors Addition & Subtraction Mechanics',          'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'pdf',   'a0000000-0000-0000-0000-000000000010', '2026-07-03T09:15:00Z'),
  (gen_random_uuid(),  'c0000000-0000-0000-0000-000000000003', 'Chapter 6 — Chemical Bonding',       'Covalent & Ionic Bonds Diagrams',                   'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=800',       'image', 'a0000000-0000-0000-0000-000000000010', '2026-06-30T16:45:00Z'),
  (gen_random_uuid(),  'c0000000-0000-0000-0000-000000000001', 'Chapter 3 — Logarithms',             'Laws of Logarithms Formula Sheet',                  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'pdf',   'a0000000-0000-0000-0000-000000000010', '2026-06-25T11:00:00Z'),
  (gen_random_uuid(),  'c0000000-0000-0000-0000-000000000001', 'Chapter 4 — Algebraic Expressions',  'Algebraic Formulas Cheat Sheet',                    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'pdf',   'a0000000-0000-0000-0000-000000000010', '2026-07-06T18:00:00Z'),
  (gen_random_uuid(),  'c0000000-0000-0000-0000-000000000004', 'Chapter 1 — Cell Cycle',             'Cell Division & Mitosis Diagrams',                  'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=800',       'image', 'a0000000-0000-0000-0000-000000000010', '2026-07-05T10:00:00Z'),
  (gen_random_uuid(),  'c0000000-0000-0000-0000-000000000004', 'Chapter 2 — Gaseous Exchange',       'Human Respiratory System Overview',                 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'pdf',   'a0000000-0000-0000-0000-000000000010', '2026-07-04T12:30:00Z'),
  (gen_random_uuid(),  'c0000000-0000-0000-0000-000000000005', 'Chapter 1 — Database Systems',       'Relational Database Concepts & Schema',             'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'pdf',   'a0000000-0000-0000-0000-000000000010', '2026-07-03T11:15:00Z'),
  (gen_random_uuid(),  'c0000000-0000-0000-0000-000000000005', 'Chapter 2 — Computer Networks',      'Network Topologies & Protocol Reference',           'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800',          'image', 'a0000000-0000-0000-0000-000000000010', '2026-07-02T15:00:00Z'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000006', 'Chapter 1 — Introduction to Accounting','Double Entry Ledger System balancing principles','https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'pdf',   'a0000000-0000-0000-0000-000000000010', '2026-07-01T10:00:00Z'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000007', 'Chapter 2 — Microeconomics',         'Price Elasticity of Demand & Supply curves',        'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=800',       'image', 'a0000000-0000-0000-0000-000000000010', '2026-06-30T11:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ─── Sample Attendance ─────────────────────────────────────────────────────
INSERT INTO public.attendance (id, student_id, slot_id, session_date, status, marked_at) VALUES
  -- Rayn Ahmad
  (gen_random_uuid(),     'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '2026-07-06', 'present', '2026-07-06T16:05:00Z'),
  (gen_random_uuid(),     'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', '2026-07-01', 'present', '2026-07-01T16:03:00Z'),
  (gen_random_uuid(),     'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', '2026-07-01', 'absent',  '2026-07-01T18:15:00Z'),
  (gen_random_uuid(),     'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', '2026-07-03', 'late',    '2026-07-03T16:20:00Z'),
  (gen_random_uuid(),     'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000006', '2026-07-03', 'present', '2026-07-03T18:02:00Z'),
  (gen_random_uuid(),     'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000007', '2026-07-04', 'present', '2026-07-04T11:05:00Z'),
  (gen_random_uuid(),     'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '2026-06-29', 'present', '2026-06-29T16:02:00Z'),
  (gen_random_uuid(),     'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', '2026-06-29', 'present', '2026-06-29T18:05:00Z'),
  (gen_random_uuid(),     'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', '2026-06-24', 'absent',  '2026-06-24T16:00:00Z'),
  (gen_random_uuid(),    'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', '2026-06-24', 'present', '2026-06-24T18:02:00Z'),
  (gen_random_uuid(),    'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', '2026-06-26', 'present', '2026-06-26T16:05:00Z'),
  (gen_random_uuid(),    'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000006', '2026-06-26', 'present', '2026-06-26T18:04:00Z'),
  (gen_random_uuid(),    'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000007', '2026-06-27', 'present', '2026-06-27T11:03:00Z'),
  (gen_random_uuid(),    'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '2026-06-22', 'present', '2026-06-22T16:01:00Z'),
  -- Ali Hassan (s1)
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', '2026-07-06', 'present', '2026-07-06T16:05:00Z'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', '2026-07-01', 'absent',  '2026-07-01T16:00:00Z'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000006', '2026-07-03', 'present', '2026-07-03T18:05:00Z'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', '2026-06-29', 'absent',  '2026-06-29T16:00:00Z'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', '2026-06-24', 'present', '2026-06-24T16:05:00Z'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000006', '2026-06-26', 'absent',  '2026-06-26T18:00:00Z'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', '2026-06-22', 'present', '2026-06-22T16:02:00Z'),
  -- Sara Malik (s2)
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', '2026-07-06', 'present', '2026-07-06T18:05:00Z'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000004', '2026-07-01', 'absent',  '2026-07-01T18:00:00Z'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000005', '2026-07-03', 'present', '2026-07-03T16:05:00Z'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000007', '2026-07-04', 'present', '2026-07-04T11:05:00Z'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', '2026-06-29', 'absent',  '2026-06-29T18:00:00Z'),
  -- Usman Khan (s3)
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', '2026-07-06', 'present', '2026-07-06T16:05:00Z'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', '2026-07-06', 'present', '2026-07-06T18:05:00Z'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', '2026-07-01', 'absent',  '2026-07-01T16:00:00Z'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000005', '2026-07-03', 'present', '2026-07-03T16:05:00Z'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000006', '2026-07-03', 'absent',  '2026-07-03T18:00:00Z')
ON CONFLICT (id) DO NOTHING;


-- ─── Roster Seeding ────────────────────────────────────────────────────────
-- Provision the unified roster table with the standard dev accounts.
-- Allows testing real Google OAuth logins.

INSERT INTO public.roster (email, full_name, role, class_ids, profile_id, created_at) VALUES
  ('student@example.com', 'Rayn Ahmad', 'student', ARRAY['c0000000-0000-0000-0000-000000000001'::uuid], 'a0000000-0000-0000-0000-000000000001'::uuid, '2026-06-01T12:00:00Z'),
  ('admin@example.com', 'Dev Admin', 'admin', '{}'::uuid[], 'a0000000-0000-0000-0000-000000000010'::uuid, '2026-06-01T12:00:00Z'),
  ('syedrayyanf1@gmail.com', 'Syed Rayyan', 'admin', '{}'::uuid[], 'a0000000-0000-0000-0000-000000000011'::uuid, '2026-07-07T12:00:00Z'),
  ('ktkhashir90@gmail.com', 'Khashir', 'admin', '{}'::uuid[], 'a0000000-0000-0000-0000-000000000012'::uuid, '2026-07-07T12:00:00Z'),
  ('student1@example.com', 'Ali Hassan', 'student', ARRAY['c0000000-0000-0000-0000-000000000001'::uuid], 'a0000000-0000-0000-0000-000000000002'::uuid, '2026-06-01T12:00:00Z'),
  ('student2@example.com', 'Sara Malik', 'student', ARRAY['c0000000-0000-0000-0000-000000000004'::uuid], 'a0000000-0000-0000-0000-000000000003'::uuid, '2026-06-01T12:00:00Z'),
  ('ahmad.khan@shs.edu.pk', 'Mr. Ahmad Khan', 'teacher', ARRAY['c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000005'::uuid, 'c0000000-0000-0000-0000-000000000006'::uuid, 'c0000000-0000-0000-0000-000000000008'::uuid, 'c0000000-0000-0000-0000-000000000011'::uuid], 'b0000000-0000-0000-0000-000000000001'::uuid, '2024-01-10T08:00:00Z'),
  ('pending_student@example.com', 'Haris Farooq', 'student', ARRAY['c0000000-0000-0000-0000-000000000001'::uuid], NULL, '2026-07-07T12:00:00Z'),
  ('pending_teacher@example.com', 'Ms. Ayesha Ghafoor', 'teacher', ARRAY['c0000000-0000-0000-0000-000000000002'::uuid, 'c0000000-0000-0000-0000-000000000009'::uuid], NULL, '2026-07-07T12:00:00Z')
ON CONFLICT (email) DO NOTHING;
