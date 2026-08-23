import React, { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Trash2 } from "lucide-react";
import { Panel, Chip, EmptyState, SkeletonCard } from "@/components/apis/ApiUI";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Row = {
  id: string;
  api_name: string | null;
  method: string;
  url: string;
  status_code: number | null;
  duration_ms: number | null;
  created_at: string;
};

const ApiHistory: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSignedIn(false);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("request_history")
      .select("id, api_name, method, url, status_code, duration_ms, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const clearAll = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("request_history").delete().eq("user_id", auth.user.id);
    if (error) return toast.error(error.message);
    setRows([]);
    toast.success("History cleared");
  };

  return (
    <div className="space-y-5">
      <Helmet>
        <title>Request History — API Playground Log</title>
        <meta name="description" content="Review your recent API playground requests with status codes and response times." />
      </Helmet>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Request history</h1>
          <p className="text-sm text-muted-foreground">Last {rows.length} playground requests</p>
        </div>
        {rows.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </header>

      {!signedIn ? (
        <EmptyState title="Sign in to see your history" hint="Requests are logged privately to your account." />
      ) : loading ? (
        <SkeletonCard />
      ) : rows.length === 0 ? (
        <EmptyState title="No requests yet" hint="Send a request from any API's playground." />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Panel key={r.id} className="flex flex-wrap items-center gap-2 p-3 text-xs">
              <Chip tone="primary">{r.method}</Chip>
              <span className="min-w-0 flex-1 truncate font-mono text-muted-foreground">{r.url}</span>
              {r.api_name && <Chip>{r.api_name}</Chip>}
              <Chip tone={(r.status_code ?? 500) < 400 ? "primary" : "accent"}>{r.status_code ?? "ERR"}</Chip>
              {r.duration_ms != null && <Chip>{r.duration_ms} ms</Chip>}
              <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiHistory;
