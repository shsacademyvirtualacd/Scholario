-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Core Class Offerings Seed (FBISE Only)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Provisions base class offerings for FBISE for Grades 9-12 and all taxonomy subjects,
-- starting with no assigned teachers.
--
-- Run in: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Safe column & constraint provisioning
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stream text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Recreate profiles role check constraint to allow 'teacher' role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'teacher', 'admin'));

ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2. Insert the FBISE Class Offerings (unassigned to teachers initially)
INSERT INTO public.class_offerings (id, board, grade, subject, teacher_id) VALUES
  ('c9239184-7b71-5d62-8937-0e0ea269d4bf', 'fbise', '9', 'English', NULL),
  ('a3a35074-af7c-b67c-2ff8-e0c1eb6ce9f9', 'fbise', '9', 'Urdu', NULL),
  ('de4611f9-6ff7-2688-5e09-6f4ec508ebf0', 'fbise', '9', 'Mathematics', NULL),
  ('b9b2685d-ceac-f578-8f4b-4dc270b01db9', 'fbise', '9', 'Biology', NULL),
  ('b01c0222-4490-f5f1-d02a-3d367eb407eb', 'fbise', '9', 'Chemistry', NULL),
  ('7ad8c7cc-0767-a165-f588-e7e59d8af395', 'fbise', '9', 'Physics', NULL),
  ('a1111111-1111-1111-1111-111111111111', 'fbise', '9', 'Computer Science', NULL),
  
  ('794c0c93-243f-7d1f-1218-98a5527c87be', 'fbise', '10', 'English', NULL),
  ('eae3e518-1597-025a-cd9a-a676f0395875', 'fbise', '10', 'Urdu', NULL),
  ('ad3e7473-d92e-3756-4665-b6c35b4ee895', 'fbise', '10', 'Mathematics', NULL),
  ('d31d1a95-6623-b02b-a8ea-dc1ae982d9e7', 'fbise', '10', 'Biology', NULL),
  ('6b182c36-90a8-9b91-d14a-93ba9cf10823', 'fbise', '10', 'Chemistry', NULL),
  ('6ec1d912-0b2d-9053-94ce-0f697b5acf96', 'fbise', '10', 'Physics', NULL),
  ('a2222222-2222-2222-2222-222222222222', 'fbise', '10', 'Computer', NULL),
  
  ('0bd4ee72-9013-8386-24e7-827258a8a888', 'fbise', '11', 'English', NULL),
  ('003f2867-6f2e-162f-603e-3aecaba5bfe8', 'fbise', '11', 'Urdu', NULL),
  ('53927112-cbea-b149-db8f-0a0054114b41', 'fbise', '11', 'Mathematics', NULL),
  ('974a36d4-393d-a673-0858-00a5ad706ba6', 'fbise', '11', 'Biology', NULL),
  ('203f8a84-0589-1fb8-6835-720be540f9ca', 'fbise', '11', 'Chemistry', NULL),
  ('c43550ea-4f47-5471-26a8-c5ad918b5456', 'fbise', '11', 'Physics', NULL),
  ('a3333333-3333-3333-3333-333333333333', 'fbise', '11', 'Computer Science', NULL),
  
  ('07081596-4f0d-8471-15f6-929700277557', 'fbise', '12', 'English', NULL),
  ('1765d942-ecb8-f251-7770-3abb23a584ba', 'fbise', '12', 'Urdu', NULL),
  ('9f16a688-7622-9473-9c5b-eb5730ef89cd', 'fbise', '12', 'Mathematics', NULL),
  ('c3f8fb8e-00f3-e611-d29d-6f18a306aef6', 'fbise', '12', 'Biology', NULL),
  ('9b9a516f-394a-00b0-7a03-84f0344c7ae2', 'fbise', '12', 'Chemistry', NULL),
  ('6ae4bdfd-b99a-0ea2-ca64-f940cfeab41c', 'fbise', '12', 'Physics', NULL),
  ('a4444444-4444-4444-4444-444444444444', 'fbise', '12', 'Computer Science', NULL)
ON CONFLICT (id) DO NOTHING;
