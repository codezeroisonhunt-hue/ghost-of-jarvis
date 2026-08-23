import React, { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Loader2, RefreshCw, Activity } from "lucide-react";
import { Panel, StatTile, Chip, EmptyState } from "@/components/apis/ApiUI";
import { supabase } from "@/integrations/supabase/client";
import { fetchCatalogStats } from "@/lib/apis/catalog";
import { toast } from "sonner";

type SyncRun = {
  id: string;
  repository_commit: string | null;
  api_count: number;
  category_count: number;
  added: number;
  updated: number;
  removed: number;
  status: string;
  message: string | null;
  created_at: string;
};

const ApiAdmin: React.FC = () => {
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [stats, setStats] = useState<{ apiCount: number; categoryCount: number } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    const [{ data }, s] = await Promise.all([
      supabase.from("sync_runs").select("*").order("created_at", { ascending: false }).limit(10),
      fetchCatalogStats(),
    ]);
    setRuns((data ?? []) as SyncRun[]);
    setStats({ apiCount: s.apiCount, categoryCount: s.categoryCount });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("public-apis-sync", { body: {} });
      if (error) throw error;
      toast.success("Sync complete");
      console.log("sync result", data);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed — admin role required");
    } finally {
      setSyncing(false);
    }
  };

  const runHealth = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("api-health", { body: { limit: 50 } });
      if (error) throw error;
      toast.success("Health checks queued");
      console.log("health result", data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Health check failed");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-5">
      <Helmet>
        <title>Catalog Sync — API Explorer Admin</title>
        <meta name="description" content="Run catalog imports from the public-apis repository and monitor documentation link health." />
      </Helmet>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catalog sync</h1>
          <p className="text-sm text-muted-foreground">Import from public-apis/public-apis and monitor health</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={runSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Run sync
          </button>
          <button
            type="button"
            onClick={runHealth}
            disabled={checking}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-2 text-xs text-primary disabled:opacity-60"
          >
            {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />} Health check
          </button>
        </div>
      </header>

      <div className="grid gap-3 grid-cols-2">
        <StatTile label="APIs" value={stats?.apiCount ?? "—"} />
        <StatTile label="Categories" value={stats?.categoryCount ?? "—"} />
      </div>

      {runs.length === 0 ? (
        <EmptyState title="No sync runs recorded" hint="Run a sync to create the first report." />
      ) : (
        <div className="space-y-2">
          {runs.map((r) => (
            <Panel key={r.id} className="flex flex-wrap items-center gap-2 p-3 text-xs">
              <Chip tone={r.status === "success" ? "primary" : "accent"}>{r.status}</Chip>
              <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
              <Chip>+{r.added}</Chip>
              <Chip>~{r.updated}</Chip>
              <Chip>-{r.removed}</Chip>
              <Chip>{r.api_count} APIs</Chip>
              <Chip>{r.category_count} categories</Chip>
              {r.repository_commit && <Chip>{r.repository_commit.slice(0, 7)}</Chip>}
              {r.message && <span className="text-muted-foreground">{r.message}</span>}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiAdmin;
