import React, { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Download } from "lucide-react";
import { ApiCard, EmptyState, SkeletonCard } from "@/components/apis/ApiUI";
import { supabase } from "@/integrations/supabase/client";
import { download, toCsv, type ApiRecord } from "@/lib/apis/catalog";
import { useApiFavorites } from "@/hooks/useApiFavorites";

const ApiFavorites: React.FC = () => {
  const [rows, setRows] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);
  const { favoriteIds, toggleFavorite } = useApiFavorites();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSignedIn(false);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("favorites").select("api_id, apis(*)").order("created_at", { ascending: false });
    setRows(((data ?? []) as { apis: ApiRecord | null }[]).map((r) => r.apis).filter(Boolean) as ApiRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setRows((p) => p.filter((r) => favoriteIds.has(r.id)));
  }, [favoriteIds]);

  return (
    <div className="space-y-5">
      <Helmet>
        <title>My Favorite APIs — Saved Public APIs</title>
        <meta name="description" content="Your saved free public APIs, ready to export or test in the playground." />
      </Helmet>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Favorites</h1>
          <p className="text-sm text-muted-foreground">{rows.length} saved APIs</p>
        </div>
        {rows.length > 0 && (
          <button
            type="button"
            onClick={() => download("favorites.csv", toCsv(rows), "text/csv")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs text-primary hover:bg-primary/10"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        )}
      </header>

      {!signedIn ? (
        <EmptyState title="Sign in to keep favorites" hint="Favorites are stored privately against your account." />
      ) : loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="No favorites yet" hint="Tap the star on any API card to save it here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((api) => (
            <ApiCard key={api.id} api={api} favorite onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiFavorites;
