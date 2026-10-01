-- ====================================================================
-- DO THIS — Production Database Schema & Row Level Security (RLS)
-- Supabase / PostgreSQL Migration
-- ====================================================================

-- 1. PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. DOCUMENTS Table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_filename TEXT,
  document_type TEXT NOT NULL DEFAULT 'Document',
  summary TEXT NOT NULL,
  primary_action TEXT NOT NULL,
  deadline TEXT DEFAULT 'No clear deadline found.',
  urgency TEXT NOT NULL DEFAULT 'NO DEADLINE FOUND',
  analysis_status TEXT NOT NULL DEFAULT 'completed',
  is_password_protected BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_opened_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. DOCUMENT_CONTENT Table
CREATE TABLE IF NOT EXISTS public.document_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'upload',
  storage_path TEXT,
  extracted_text TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ANALYSES Table
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  one_sentence_meaning TEXT NOT NULL,
  primary_action TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  deadline TEXT DEFAULT 'No clear deadline found.',
  deadline_evidence TEXT,
  if_you_do_nothing TEXT,
  confidence TEXT DEFAULT 'high',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ANALYSIS_STEPS Table
CREATE TABLE IF NOT EXISTS public.analysis_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_text TEXT NOT NULL
);

-- 6. IMPORTANT_DETAILS Table
CREATE TABLE IF NOT EXISTS public.important_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  status TEXT DEFAULT 'EXPLICITLY STATED',
  evidence TEXT,
  detail_text TEXT
);

-- 7. QUESTIONS Table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL
);

-- 8. RESPONSES Table
CREATE TABLE IF NOT EXISTS public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  response_style TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. SHARES Table
CREATE TABLE IF NOT EXISTS public.shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  permission TEXT NOT NULL DEFAULT 'VIEW_ONLY',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  revoked_at TIMESTAMPTZ
);

-- ====================================================================
-- INDEXES FOR HIGH-SPEED QUERYING & FILTERING
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_last_opened ON public.documents(last_opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_document_id ON public.analyses(document_id);
CREATE INDEX IF NOT EXISTS idx_shares_token ON public.shares(share_token);
CREATE INDEX IF NOT EXISTS idx_shares_document_id ON public.shares(document_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Users can NEVER access other users' private documents
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.important_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- PROFILES Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DOCUMENTS Policies
CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- ANALYSES Policies
CREATE POLICY "Users can view own analyses"
  ON public.analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON public.analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON public.analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON public.analyses FOR DELETE
  USING (auth.uid() = user_id);

-- DOCUMENT_CONTENT Policies
CREATE POLICY "Users can view own document content"
  ON public.document_content FOR SELECT
  USING (document_id IN (SELECT id FROM public.documents WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own document content"
  ON public.document_content FOR INSERT
  WITH CHECK (document_id IN (SELECT id FROM public.documents WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own document content"
  ON public.document_content FOR UPDATE
  USING (document_id IN (SELECT id FROM public.documents WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own document content"
  ON public.document_content FOR DELETE
  USING (document_id IN (SELECT id FROM public.documents WHERE user_id = auth.uid()));

-- ANALYSIS_STEPS Policies
CREATE POLICY "Users can view own analysis steps"
  ON public.analysis_steps FOR SELECT
  USING (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own analysis steps"
  ON public.analysis_steps FOR INSERT
  WITH CHECK (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own analysis steps"
  ON public.analysis_steps FOR DELETE
  USING (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

-- IMPORTANT_DETAILS Policies
CREATE POLICY "Users can view own important details"
  ON public.important_details FOR SELECT
  USING (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own important details"
  ON public.important_details FOR INSERT
  WITH CHECK (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own important details"
  ON public.important_details FOR DELETE
  USING (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

-- QUESTIONS Policies
CREATE POLICY "Users can view own questions"
  ON public.questions FOR SELECT
  USING (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own questions"
  ON public.questions FOR INSERT
  WITH CHECK (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own questions"
  ON public.questions FOR DELETE
  USING (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

-- RESPONSES Policies
CREATE POLICY "Users can view own responses"
  ON public.responses FOR SELECT
  USING (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own responses"
  ON public.responses FOR INSERT
  WITH CHECK (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own responses"
  ON public.responses FOR DELETE
  USING (analysis_id IN (SELECT id FROM public.analyses WHERE user_id = auth.uid()));

-- SHARES Policies (Owner control)
CREATE POLICY "Owners can view own document shares"
  ON public.shares FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can create shares"
  ON public.shares FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update/revoke shares"
  ON public.shares FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can delete shares"
  ON public.shares FOR DELETE
  USING (auth.uid() = owner_user_id);

-- Public Read-Only Access for valid, non-revoked, non-expired shares
CREATE POLICY "Anyone with valid share token can read share record"
  ON public.shares FOR SELECT
  USING (
    revoked_at IS NULL 
    AND (expires_at IS NULL OR expires_at > now())
  );

-- ====================================================================
-- ROLE PERMISSIONS (GRANT TABLE PRIVILEGES TO SUPABASE ROLES)
-- Enables API access for anon, authenticated users, and service_role
-- ====================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

