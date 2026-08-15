
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'operator', 'viewer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Cameras
CREATE TABLE public.security_cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  camera_code TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  camera_type TEXT NOT NULL DEFAULT 'IP',
  field_of_view INTEGER DEFAULT 90,
  zone_id UUID,
  status TEXT NOT NULL DEFAULT 'offline',
  recording BOOLEAN NOT NULL DEFAULT false,
  last_heartbeat TIMESTAMPTZ,
  stream_url TEXT,
  preview_url TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_cameras TO authenticated;
GRANT ALL ON public.security_cameras TO service_role;
ALTER TABLE public.security_cameras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in read cameras" ON public.security_cameras FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert cameras" ON public.security_cameras FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update cameras" ON public.security_cameras FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete cameras" ON public.security_cameras FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Camera credentials (admin-only, kept out of client-facing table)
CREATE TABLE public.camera_credentials (
  camera_id UUID PRIMARY KEY REFERENCES public.security_cameras(id) ON DELETE CASCADE,
  rtsp_url TEXT,
  username TEXT,
  password_encrypted TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.camera_credentials TO authenticated;
GRANT ALL ON public.camera_credentials TO service_role;
ALTER TABLE public.camera_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage credentials" ON public.camera_credentials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Zones
CREATE TABLE public.security_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  zone_type TEXT NOT NULL DEFAULT 'general',
  polygon JSONB,
  rules JSONB DEFAULT '[]'::jsonb,
  color TEXT DEFAULT '#00e5ff',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_zones TO authenticated;
GRANT ALL ON public.security_zones TO service_role;
ALTER TABLE public.security_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in read zones" ON public.security_zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage zones" ON public.security_zones FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.security_cameras ADD CONSTRAINT security_cameras_zone_fk FOREIGN KEY (zone_id) REFERENCES public.security_zones(id) ON DELETE SET NULL;

-- Authorized people (enrolled only)
CREATE TABLE public.authorized_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT,
  organization TEXT,
  permission_level TEXT NOT NULL DEFAULT 'standard',
  photo_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authorized_people TO authenticated;
GRANT ALL ON public.authorized_people TO service_role;
ALTER TABLE public.authorized_people ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in read people" ON public.authorized_people FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage people" ON public.authorized_people FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Events
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID REFERENCES public.security_cameras(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES public.security_zones(id) ON DELETE SET NULL,
  person_id UUID REFERENCES public.authorized_people(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  confidence NUMERIC(4,3),
  snapshot_url TEXT,
  details JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in read events" ON public.security_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Operators insert events" ON public.security_events FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "Admins update events" ON public.security_events FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete events" ON public.security_events FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX security_events_occurred_at_idx ON public.security_events (occurred_at DESC);

-- Alerts
CREATE TABLE public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.security_events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_alerts TO authenticated;
GRANT ALL ON public.security_alerts TO service_role;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in read alerts" ON public.security_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Operators manage alerts" ON public.security_alerts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "Operators acknowledge alerts" ON public.security_alerts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "Admins delete alerts" ON public.security_alerts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Signed in write audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- updated_at triggers
CREATE TRIGGER trg_cameras_updated BEFORE UPDATE ON public.security_cameras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_zones_updated BEFORE UPDATE ON public.security_zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_people_updated BEFORE UPDATE ON public.authorized_people FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bootstrap: first signed-in user becomes admin (via trigger on auth.users? No — use function callable by client instead)
CREATE OR REPLACE FUNCTION public.claim_admin_if_first()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  existing_admins INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_admins FROM public.user_roles WHERE role = 'admin';
  IF existing_admins = 0 AND auth.uid() IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'operator') ON CONFLICT DO NOTHING;
    RETURN true;
  END IF;
  RETURN false;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_admin_if_first() TO authenticated;
