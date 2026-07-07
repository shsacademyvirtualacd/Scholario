-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Dev Seed Data
-- Mirrors mockData.ts exactly so you can test all three role views
-- against the real DB while VITE_USE_MOCK_AUTH=false.
--
-- Run AFTER supabase_rls_migration.sql
-- Run in Supabase → SQL Editor
-- Safe to re-run: uses INSERT ... ON CONFLICT DO NOTHING
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Student Profiles ──────────────────────────────────────────────────────
-- NOTE: These IDs won't match real auth.uid() values until users actually log
-- in via OAuth. Insert them as placeholder profiles first; the real flow in
-- fetchProfile() will use the email/roster match to link them properly.
-- For testing, manually set the ID to match your test user's auth.uid().

INSERT INTO public.profiles (id, role, full_name, avatar_url, phone, stream, created_at) VALUES
  ('mock-user-id',   'student', 'Rayn Ahmad',    NULL, '+92 300 123 4567', 'pre-engineering', '2026-06-01T12:00:00Z'),
  ('s1',             'student', 'Ali Hassan',     NULL, '+92 301 234 5678', 'ics',             '2026-06-01T12:00:00Z'),
  ('s2',             'student', 'Sara Malik',     NULL, '+92 302 345 6789', 'pre-medical',     '2026-06-01T12:00:00Z'),
  ('s3',             'student', 'Usman Khan',     NULL, '+92 303 456 7890', 'pre-engineering', '2026-06-01T12:00:00Z'),
  ('s4',             'student', 'Nadia Iqbal',    NULL, '+92 304 567 8901', 'ics',             '2026-06-01T12:00:00Z'),
  ('s5',             'student', 'Zainab Bibi',    NULL, '+92 305 678 9012', 'pre-medical',     '2026-06-01T12:00:00Z'),
  ('s6',             'student', 'Hamza Bilal',    NULL, '+92 306 789 0123', 'pre-engineering', '2026-06-01T12:00:00Z'),
  ('s7',             'student', 'Bilal Shah',     NULL, '+92 307 890 1234', 'ics',             '2026-06-01T12:00:00Z'),
  ('s8',             'student', 'Fatima Zahra',   NULL, '+92 308 901 2345', 'pre-medical',     '2026-06-01T12:00:00Z'),
  ('mock-admin-id',  'admin',   'Dev Admin',      NULL, '123-456-7890',     NULL,              '2026-06-01T12:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ─── Teachers ──────────────────────────────────────────────────────────────
INSERT INTO public.teachers (id, full_name, avatar_url, phone, email, joining_date, is_active, created_at) VALUES
  ('t1', 'Mr. Ahmad Khan',     NULL, '+92 321 987 6543', 'ahmad.khan@shs.edu.pk',    '2024-01-10', TRUE, '2024-01-10T08:00:00Z'),
  ('t2', 'Ms. Sara Ahmed',     NULL, '+92 333 456 7890', 'sara.ahmed@shs.edu.pk',    '2024-03-15', TRUE, '2024-03-15T08:00:00Z'),
  ('t3', 'Dr. Tariq Mahmood',  NULL, '+92 300 765 4321', 'tariq.mahmood@shs.edu.pk', '2023-09-01', TRUE, '2023-09-01T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Teacher profiles (so teacher can login and get profile)
INSERT INTO public.profiles (id, role, full_name, avatar_url, phone, stream, created_at) VALUES
  ('t1', 'teacher', 'Mr. Ahmad Khan',    NULL, '+92 321 987 6543', NULL, '2024-01-10T08:00:00Z'),
  ('t2', 'teacher', 'Ms. Sara Ahmed',    NULL, '+92 333 456 7890', NULL, '2024-03-15T08:00:00Z'),
  ('t3', 'teacher', 'Dr. Tariq Mahmood', NULL, '+92 300 765 4321', NULL, '2023-09-01T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ─── Class Offerings ───────────────────────────────────────────────────────
INSERT INTO public.class_offerings (id, board, grade, subject, teacher_id, created_at) VALUES
  ('o1',  'fbise',   '10', 'Mathematics',    't1', '2026-06-01T00:00:00Z'),
  ('o2',  'fbise',   '10', 'Physics',        't2', '2026-06-01T00:00:00Z'),
  ('o3',  'fbise',   '10', 'Chemistry',      't3', '2026-06-01T00:00:00Z'),
  ('o4',  'fbise',   '10', 'Biology',        't2', '2026-06-01T00:00:00Z'),
  ('o5',  'fbise',   '10', 'Computer Science','t1','2026-06-01T00:00:00Z'),
  ('o6',  'o_level', 'o1', 'Accounting',     't1', '2026-06-01T00:00:00Z'),
  ('o7',  'o_level', 'o1', 'Economics',      't2', '2026-06-01T00:00:00Z'),
  ('o8',  'local',   '9',  'Mathematics',    't1', '2026-06-01T00:00:00Z'),
  ('o9',  'local',   '9',  'Physics',        't2', '2026-06-01T00:00:00Z'),
  ('o10', 'a_level', 'as', 'Chemistry',      't3', '2026-06-01T00:00:00Z'),
  ('o11', 'a_level', 'as', 'Computer Science','t1','2026-06-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ─── Class Slots ───────────────────────────────────────────────────────────
INSERT INTO public.class_slots (id, offering_id, day_of_week, start_time, end_time, room_or_link, is_cancelled, created_at) VALUES
  ('slot1', 'o1', 0, '16:00:00', '17:30:00', 'Room 102 & Zoom',  FALSE, '2026-06-01T00:00:00Z'),
  ('slot2', 'o2', 0, '18:00:00', '19:30:00', 'Room 105',         FALSE, '2026-06-01T00:00:00Z'),
  ('slot3', 'o1', 2, '16:00:00', '17:30:00', 'Room 102 & Zoom',  FALSE, '2026-06-01T00:00:00Z'),
  ('slot4', 'o2', 2, '18:00:00', '19:30:00', 'Room 105',         TRUE,  '2026-06-01T00:00:00Z'),
  ('slot5', 'o3', 4, '16:00:00', '17:30:00', 'Chemistry Lab',    FALSE, '2026-06-01T00:00:00Z'),
  ('slot6', 'o1', 4, '18:00:00', '19:30:00', 'Room 102',         FALSE, '2026-06-01T00:00:00Z'),
  ('slot7', 'o3', 5, '11:00:00', '12:30:00', 'Room 103',         FALSE, '2026-06-01T00:00:00Z'),
  ('slot8', 'o5', 0, '19:30:00', '21:00:00', 'Room 105 & Zoom',  FALSE, '2026-06-01T00:00:00Z'),
  ('slot9', 'o3', 2, '18:00:00', '19:30:00', 'Chemistry Lab',    FALSE, '2026-06-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ─── Enrollments ───────────────────────────────────────────────────────────
INSERT INTO public.enrollments (id, student_id, offering_id, total_classes, enrolled_at) VALUES
  -- Rayn Ahmad (pre-engineering: Math, Physics, Chemistry)
  ('e_r1',    'mock-user-id', 'o1', 48, '2026-06-01T12:00:00Z'),
  ('e_r2',    'mock-user-id', 'o2', 48, '2026-06-01T12:00:00Z'),
  ('e_r3',    'mock-user-id', 'o3', 48, '2026-06-01T12:00:00Z'),
  -- Ali Hassan (ics: Math, Physics, CS)
  ('e_s1_1',  's1', 'o1', 48, '2026-06-01T12:00:00Z'),
  ('e_s1_2',  's1', 'o2', 48, '2026-06-01T12:00:00Z'),
  ('e_s1_3',  's1', 'o5', 48, '2026-06-01T12:00:00Z'),
  -- Sara Malik (pre-medical: Biology, Physics, Chemistry)
  ('e_s2_1',  's2', 'o4', 48, '2026-06-01T12:00:00Z'),
  ('e_s2_2',  's2', 'o2', 48, '2026-06-01T12:00:00Z'),
  ('e_s2_3',  's2', 'o3', 48, '2026-06-01T12:00:00Z'),
  -- Usman Khan (pre-engineering)
  ('e_s3_1',  's3', 'o1', 48, '2026-06-01T12:00:00Z'),
  ('e_s3_2',  's3', 'o2', 48, '2026-06-01T12:00:00Z'),
  ('e_s3_3',  's3', 'o3', 48, '2026-06-01T12:00:00Z'),
  -- Nadia Iqbal (ics)
  ('e_s4_1',  's4', 'o1', 48, '2026-06-01T12:00:00Z'),
  ('e_s4_2',  's4', 'o2', 48, '2026-06-01T12:00:00Z'),
  ('e_s4_3',  's4', 'o5', 48, '2026-06-01T12:00:00Z'),
  -- Zainab Bibi (pre-medical)
  ('e_s5_1',  's5', 'o4', 48, '2026-06-01T12:00:00Z'),
  ('e_s5_2',  's5', 'o2', 48, '2026-06-01T12:00:00Z'),
  ('e_s5_3',  's5', 'o3', 48, '2026-06-01T12:00:00Z'),
  -- Hamza Bilal (pre-engineering)
  ('e_s6_1',  's6', 'o1', 48, '2026-06-01T12:00:00Z'),
  ('e_s6_2',  's6', 'o2', 48, '2026-06-01T12:00:00Z'),
  ('e_s6_3',  's6', 'o3', 48, '2026-06-01T12:00:00Z'),
  -- Bilal Shah (o-level: Accounting, Economics)
  ('e_s7_1',  's7', 'o6', 48, '2026-06-01T12:00:00Z'),
  ('e_s7_2',  's7', 'o7', 48, '2026-06-01T12:00:00Z'),
  -- Fatima Zahra (pre-medical)
  ('e_s8_1',  's8', 'o4', 48, '2026-06-01T12:00:00Z'),
  ('e_s8_2',  's8', 'o2', 48, '2026-06-01T12:00:00Z'),
  ('e_s8_3',  's8', 'o3', 48, '2026-06-01T12:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ─── Sample Notes ──────────────────────────────────────────────────────────
INSERT INTO public.notes (id, offering_id, chapter_name, title, file_url, file_type, uploaded_by, created_at) VALUES
  ('n1',  'o1', 'Chapter 4 — Algebraic Expressions', 'Exercise 4.1 & 4.2 Solved Examples',               'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'pdf',   'mock-admin-id', '2026-07-05T14:30:00Z'),
  ('n2',  'o2', 'Chapter 2 — Vectors & Forces',       'Vectors Addition & Subtraction Mechanics',          'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'pdf',   'mock-admin-id', '2026-07-03T09:15:00Z'),
  ('n3',  'o3', 'Chapter 6 — Chemical Bonding',       'Covalent & Ionic Bonds Diagrams',                   'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=800',       'image', 'mock-admin-id', '2026-06-30T16:45:00Z'),
  ('n4',  'o1', 'Chapter 3 — Logarithms',             'Laws of Logarithms Formula Sheet',                  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'pdf',   'mock-admin-id', '2026-06-25T11:00:00Z'),
  ('n5',  'o1', 'Chapter 4 — Algebraic Expressions',  'Algebraic Formulas Cheat Sheet',                    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'pdf',   'mock-admin-id', '2026-07-06T18:00:00Z'),
  ('n6',  'o4', 'Chapter 1 — Cell Cycle',             'Cell Division & Mitosis Diagrams',                  'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=800',       'image', 'mock-admin-id', '2026-07-05T10:00:00Z'),
  ('n7',  'o4', 'Chapter 2 — Gaseous Exchange',       'Human Respiratory System Overview',                 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'pdf',   'mock-admin-id', '2026-07-04T12:30:00Z'),
  ('n8',  'o5', 'Chapter 1 — Database Systems',       'Relational Database Concepts & Schema',             'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'pdf',   'mock-admin-id', '2026-07-03T11:15:00Z'),
  ('n9',  'o5', 'Chapter 2 — Computer Networks',      'Network Topologies & Protocol Reference',           'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800',          'image', 'mock-admin-id', '2026-07-02T15:00:00Z'),
  ('n10', 'o6', 'Chapter 1 — Introduction to Accounting','Double Entry Ledger System balancing principles','https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'pdf',   'mock-admin-id', '2026-07-01T10:00:00Z'),
  ('n11', 'o7', 'Chapter 2 — Microeconomics',         'Price Elasticity of Demand & Supply curves',        'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=800',       'image', 'mock-admin-id', '2026-06-30T11:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ─── Sample Attendance ─────────────────────────────────────────────────────
INSERT INTO public.attendance (id, student_id, slot_id, session_date, status, marked_at) VALUES
  -- Rayn Ahmad
  ('att1',     'mock-user-id', 'slot1', '2026-07-06', 'present', '2026-07-06T16:05:00Z'),
  ('att2',     'mock-user-id', 'slot3', '2026-07-01', 'present', '2026-07-01T16:03:00Z'),
  ('att3',     'mock-user-id', 'slot4', '2026-07-01', 'absent',  '2026-07-01T18:15:00Z'),
  ('att4',     'mock-user-id', 'slot5', '2026-07-03', 'late',    '2026-07-03T16:20:00Z'),
  ('att5',     'mock-user-id', 'slot6', '2026-07-03', 'present', '2026-07-03T18:02:00Z'),
  ('att6',     'mock-user-id', 'slot7', '2026-07-04', 'present', '2026-07-04T11:05:00Z'),
  ('att7',     'mock-user-id', 'slot1', '2026-06-29', 'present', '2026-06-29T16:02:00Z'),
  ('att8',     'mock-user-id', 'slot2', '2026-06-29', 'present', '2026-06-29T18:05:00Z'),
  ('att9',     'mock-user-id', 'slot3', '2026-06-24', 'absent',  '2026-06-24T16:00:00Z'),
  ('att10',    'mock-user-id', 'slot4', '2026-06-24', 'present', '2026-06-24T18:02:00Z'),
  ('att11',    'mock-user-id', 'slot5', '2026-06-26', 'present', '2026-06-26T16:05:00Z'),
  ('att12',    'mock-user-id', 'slot6', '2026-06-26', 'present', '2026-06-26T18:04:00Z'),
  ('att13',    'mock-user-id', 'slot7', '2026-06-27', 'present', '2026-06-27T11:03:00Z'),
  ('att14',    'mock-user-id', 'slot1', '2026-06-22', 'present', '2026-06-22T16:01:00Z'),
  -- Ali Hassan (s1)
  ('att_s1_1', 's1', 'slot1', '2026-07-06', 'present', '2026-07-06T16:05:00Z'),
  ('att_s1_2', 's1', 'slot3', '2026-07-01', 'absent',  '2026-07-01T16:00:00Z'),
  ('att_s1_3', 's1', 'slot6', '2026-07-03', 'present', '2026-07-03T18:05:00Z'),
  ('att_s1_4', 's1', 'slot1', '2026-06-29', 'absent',  '2026-06-29T16:00:00Z'),
  ('att_s1_5', 's1', 'slot3', '2026-06-24', 'present', '2026-06-24T16:05:00Z'),
  ('att_s1_6', 's1', 'slot6', '2026-06-26', 'absent',  '2026-06-26T18:00:00Z'),
  ('att_s1_7', 's1', 'slot1', '2026-06-22', 'present', '2026-06-22T16:02:00Z'),
  -- Sara Malik (s2)
  ('att_s2_1', 's2', 'slot2', '2026-07-06', 'present', '2026-07-06T18:05:00Z'),
  ('att_s2_2', 's2', 'slot4', '2026-07-01', 'absent',  '2026-07-01T18:00:00Z'),
  ('att_s2_3', 's2', 'slot5', '2026-07-03', 'present', '2026-07-03T16:05:00Z'),
  ('att_s2_4', 's2', 'slot7', '2026-07-04', 'present', '2026-07-04T11:05:00Z'),
  ('att_s2_5', 's2', 'slot2', '2026-06-29', 'absent',  '2026-06-29T18:00:00Z'),
  -- Usman Khan (s3)
  ('att_s3_1', 's3', 'slot1', '2026-07-06', 'present', '2026-07-06T16:05:00Z'),
  ('att_s3_2', 's3', 'slot2', '2026-07-06', 'present', '2026-07-06T18:05:00Z'),
  ('att_s3_3', 's3', 'slot3', '2026-07-01', 'absent',  '2026-07-01T16:00:00Z'),
  ('att_s3_4', 's3', 'slot5', '2026-07-03', 'present', '2026-07-03T16:05:00Z'),
  ('att_s3_5', 's3', 'slot6', '2026-07-03', 'absent',  '2026-07-03T18:00:00Z')
ON CONFLICT (id) DO NOTHING;
