import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ApiRecord } from "@/lib/apis/catalog";

export function useApiFavorites() {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setIds(new Set());
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("favorites").select("api_id");
    setIds(new Set((data ?? []).map((r) => r.api_id as string)));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = useCallback(
    async (api: ApiRecord) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        toast.error("Sign in to save favorites");
        return;
      }
      if (ids.has(api.id)) {
        await supabase.from("favorites").delete().eq("api_id", api.id).eq("user_id", auth.user.id);
        setIds((p) => {
          const n = new Set(p);
          n.delete(api.id);
          return n;
        });
        toast.success(`Removed ${api.name}`);
      } else {
        const { error } = await supabase.from("favorites").insert({ api_id: api.id, user_id: auth.user.id });
        if (error) {
          toast.error(error.message);
          return;
        }
        setIds((p) => new Set(p).add(api.id));
        toast.success(`Saved ${api.name}`);
      }
    },
    [ids]
  );

  return { favoriteIds: ids, toggleFavorite: toggle, loadingFavorites: loading, reloadFavorites: load };
}

export function useCompareSelection() {
  const [selected, setSelected] = useState<ApiRecord[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("api-compare") ?? "[]") as ApiRecord[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("api-compare", JSON.stringify(selected));
  }, [selected]);

  const toggle = useCallback((api: ApiRecord) => {
    setSelected((prev) => {
      if (prev.some((p) => p.id === api.id)) return prev.filter((p) => p.id !== api.id);
      if (prev.length >= 4) {
        toast.error("Compare up to 4 APIs at a time");
        return prev;
      }
      return [...prev, api];
    });
  }, []);

  return { selected, toggleCompare: toggle, clearCompare: () => setSelected([]) };
}
