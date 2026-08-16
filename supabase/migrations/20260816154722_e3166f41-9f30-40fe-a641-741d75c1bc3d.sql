CREATE TABLE public.js_saved_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  title text not null,
  meta jsonb not null default '{}'::jsonb,
  progress jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, project_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.js_saved_projects TO authenticated;
GRANT ALL ON public.js_saved_projects TO service_role;
ALTER TABLE public.js_saved_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saved projects" ON public.js_saved_projects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.js_project_docs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  section text not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (user_id, project_id, section)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.js_project_docs TO authenticated;
GRANT ALL ON public.js_project_docs TO service_role;
ALTER TABLE public.js_project_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own project docs" ON public.js_project_docs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.js_experiments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text,
  title text not null,
  independent_var text,
  dependent_var text,
  controlled_vars text,
  rows jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.js_experiments TO authenticated;
GRANT ALL ON public.js_experiments TO service_role;
ALTER TABLE public.js_experiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own experiments" ON public.js_experiments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.js_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  class_level text,
  subjects text[] default '{}',
  budget text,
  competition_level text,
  days_available int,
  components text,
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.js_profiles TO authenticated;
GRANT ALL ON public.js_profiles TO service_role;
ALTER TABLE public.js_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own js profile" ON public.js_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);