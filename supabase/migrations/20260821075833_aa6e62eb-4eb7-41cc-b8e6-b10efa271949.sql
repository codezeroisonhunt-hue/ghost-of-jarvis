CREATE TABLE public.apis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL,
  documentation_url text NOT NULL,
  auth_type text,
  https boolean,
  cors text NOT NULL DEFAULT 'unknown',
  postman_available boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  source_repository text NOT NULL DEFAULT 'https://github.com/public-apis/public-apis',
  source_commit text,
  status text NOT NULL DEFAULT 'unknown',
  health_status text,
  last_checked_at timestamptz,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.apis TO anon;
GRANT SELECT ON public.apis TO authenticated;
GRANT ALL ON public.apis TO service_role;
ALTER TABLE public.apis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read apis" ON public.apis FOR SELECT USING (true);
CREATE POLICY "Admins manage apis" ON public.apis FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX apis_category_idx ON public.apis (category);
CREATE INDEX apis_auth_idx ON public.apis (auth_type);
CREATE INDEX apis_https_idx ON public.apis (https);
CREATE INDEX apis_cors_idx ON public.apis (cors);
CREATE INDEX apis_name_idx ON public.apis (name);
CREATE INDEX apis_search_idx ON public.apis USING gin (to_tsvector('english', name || ' ' || description || ' ' || category));

CREATE TABLE public.api_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  api_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.api_categories TO anon;
GRANT SELECT ON public.api_categories TO authenticated;
GRANT ALL ON public.api_categories TO service_role;
ALTER TABLE public.api_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.api_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.api_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  api_id uuid NOT NULL REFERENCES public.apis(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, api_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own favorites" ON public.favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own collections" ON public.collections FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.collection_apis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  api_id uuid NOT NULL REFERENCES public.apis(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (collection_id, api_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_apis TO authenticated;
GRANT ALL ON public.collection_apis TO service_role;
ALTER TABLE public.collection_apis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own collection items" ON public.collection_apis FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()));

CREATE TABLE public.request_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  api_id uuid REFERENCES public.apis(id) ON DELETE SET NULL,
  api_name text,
  method text NOT NULL,
  url text NOT NULL,
  status_code integer,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_history TO authenticated;
GRANT ALL ON public.request_history TO service_role;
ALTER TABLE public.request_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own history" ON public.request_history FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_commit text,
  api_count integer NOT NULL DEFAULT 0,
  category_count integer NOT NULL DEFAULT 0,
  added integer NOT NULL DEFAULT 0,
  updated integer NOT NULL DEFAULT 0,
  removed integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  message text,
  started_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sync_runs TO anon;
GRANT SELECT ON public.sync_runs TO authenticated;
GRANT ALL ON public.sync_runs TO service_role;
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sync runs" ON public.sync_runs FOR SELECT USING (true);
CREATE POLICY "Admins write sync runs" ON public.sync_runs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id uuid NOT NULL REFERENCES public.apis(id) ON DELETE CASCADE,
  status text NOT NULL,
  http_status integer,
  duration_ms integer,
  checked_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.health_checks TO anon;
GRANT SELECT ON public.health_checks TO authenticated;
GRANT ALL ON public.health_checks TO service_role;
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read health" ON public.health_checks FOR SELECT USING (true);
CREATE POLICY "Admins write health" ON public.health_checks FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX health_checks_api_idx ON public.health_checks (api_id, checked_at DESC);

CREATE TRIGGER apis_updated_at BEFORE UPDATE ON public.apis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();