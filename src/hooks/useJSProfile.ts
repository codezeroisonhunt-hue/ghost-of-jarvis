import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface JSProfile {
  class_level?: string | null;
  subjects?: string[] | null;
  budget?: string | null;
  competition_level?: string | null;
  days_available?: number | null;
  components?: string | null;
}

export function useJSProfile() {
  const [profile, setProfile] = useState<JSProfile>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { if (alive) setLoading(false); return; }
      const { data } = await supabase.from("js_profiles").select("*").eq("user_id", u.user.id).maybeSingle();
      if (alive) { if (data) setProfile(data as JSProfile); setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const save = useCallback(async (patch: JSProfile) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("js_profiles").upsert({ user_id: u.user.id, ...next, updated_at: new Date().toISOString() });
  }, [profile]);

  return { profile, save, loading };
}
