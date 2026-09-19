-- ==============================================================================
-- Migration: Sage AI Assistant Knowledge Base & pgvector Setup
-- File: supabase/migrations/20260919_sage_knowledge_base_pgvector.sql
-- Description:
--   1. Enables pgvector extension in Supabase
--   2. Creates public.knowledge_base table for indexed subject notes & policy docs
--   3. Sets up indexes (including vector similarity index)
--   4. Creates match_knowledge_base RPC function for cosine similarity search
--   5. Configures Row Level Security (RLS) policies
--   6. Seeds initial institutional knowledge (Academic Policies, Grading, Rules)
-- ==============================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create knowledge_base table
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'notes', -- 'notes', 'policy', 'handbook', 'faq', 'curriculum'
    source_type TEXT NOT NULL DEFAULT 'note_vault', -- 'note_vault', 'policy_doc', 'handbook', 'faq', 'curriculum'
    source_id TEXT, -- Foreign reference e.g. note_id, offering_id, or doc slug
    metadata JSONB DEFAULT '{}'::jsonb, -- e.g. { "subject": "Physics", "grade": "10", "board": "FBISE", "chapter": "Kinematics" }
    content_chunk TEXT NOT NULL,
    chunk_index INT DEFAULT 0,
    embedding vector(768), -- Gemini gemini-embedding-001 produces 768-dimensional embeddings (via outputDimensionality: 768)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for fast category, source lookup and vector similarity
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON public.knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_source ON public.knowledge_base(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_created_at ON public.knowledge_base(created_at DESC);

-- HNSW vector index for high-performance cosine distance similarity search (<=> operator)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding_hnsw 
ON public.knowledge_base 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 4. Vector Similarity Search Function (RPC)
CREATE OR REPLACE FUNCTION match_knowledge_base (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.30,
  match_count int DEFAULT 5,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  source_type TEXT,
  source_id TEXT,
  metadata JSONB,
  content_chunk TEXT,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.category,
    kb.source_type,
    kb.source_id,
    kb.metadata,
    kb.content_chunk,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base kb
  WHERE (filter_category IS NULL OR kb.category = filter_category)
    AND kb.embedding IS NOT NULL
    AND (1 - (kb.embedding <=> query_embedding)) >= match_threshold
  ORDER BY kb.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

-- Grant execution permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION match_knowledge_base TO anon, authenticated, service_role;

-- 5. Row Level Security (RLS) Setup
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Allow read-only access to all authenticated users (students, teachers, admins)
CREATE POLICY "Allow read knowledge_base to authenticated users"
ON public.knowledge_base
FOR SELECT
TO authenticated
USING (true);

-- Also allow anon read if public study resources are enabled
CREATE POLICY "Allow read knowledge_base to anon"
ON public.knowledge_base
FOR SELECT
TO anon
USING (true);

-- Allow service_role and admins full insert/update/delete rights
CREATE POLICY "Allow full access to service_role"
ON public.knowledge_base
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Seed Core Institutional Documents & Policies (Fallback text available immediately)
INSERT INTO public.knowledge_base (title, category, source_type, source_id, metadata, content_chunk, chunk_index)
VALUES
(
  'Institutional Attendance & Eligibility Policy',
  'policy',
  'handbook',
  'policy-attendance',
  '{"board": "FBISE", "type": "policy", "scope": "all"}'::jsonb,
  'Students must maintain a minimum of 75% attendance in each enrolled subject offering to qualify for semester examinations and official board registration. Automated QR check-in and geofence tracking record entry. Absences exceeding 3 consecutive days require official medical documentation or an approved leave application submitted via the portal.',
  0
),
(
  'DepEd & FBISE Grading and Transmutation Scale',
  'policy',
  'handbook',
  'policy-grading',
  '{"type": "grading_scale", "scope": "assessment"}'::jsonb,
  'The academic grading framework uses standard transmutation tables. The minimum passing threshold is 33% for FBISE secondary and higher secondary certifications (75% transmuted passing grade in DepEd-aligned evaluations). A+ represents 80% and above, A represents 70-79%, B represents 60-69%, C represents 50-59%, D represents 40-49%, and E represents 33-39%. Practical assessments constitute 15-20% of the aggregate grade for scientific laboratory subjects.',
  0
),
(
  'Online Examination and Assessment Regulations',
  'policy',
  'handbook',
  'policy-exams',
  '{"type": "exam_rules", "scope": "students"}'::jsonb,
  'All formal periodic examinations and written tests must be submitted before the countdown timer expires. In timed online tests, browser tab switching and window minimization are monitored. Written submissions must be uploaded as clear, legible PDF or high-resolution JPEG files displaying student name, roll number, and handwritten workings.',
  0
),
(
  'Note Vault & Study Material Guidelines',
  'notes',
  'handbook',
  'policy-note-vault',
  '{"type": "curriculum", "scope": "all"}'::jsonb,
  'The Subject Note Vault organizes teacher-verified lecture notes, formula sheets, chapter summaries, and past paper solutions for Grades 9 through 12. Notes are categorized by Board (FBISE, Sindh Board), Class Grade, and Stream (Pre-Medical, Pre-Engineering, Computer Science / ICS). Students can access all materials 24/7 with offline download support.',
  0
),
(
  'Fee Assessment, Installments & Payment Verification',
  'policy',
  'handbook',
  'policy-finance',
  '{"type": "finance", "scope": "operations"}'::jsonb,
  'Tuition fee assessments are generated per academic semester or monthly billing plan. Installment plans allow split payments across 2 or 3 scheduled dates. Receipts and bank deposit proofs uploaded through the checkout portal are verified by the finance office within 24 business hours. Overdue accounts past 14 grace days incur standard late charges unless a scholarship or hardship discount is formally approved.',
  0
)
ON CONFLICT DO NOTHING;
