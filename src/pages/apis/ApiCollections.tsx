import React, { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { FolderPlus, Trash2 } from "lucide-react";
import { Panel, EmptyState, SkeletonCard, Chip } from "@/components/apis/ApiUI";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ApiRecord } from "@/lib/apis/catalog";

type Collection = { id: string; name: string; description: string | null; created_at: string };

const ApiCollections: React.FC = () => {
  const [rows, setRows] = useState<Collection[]>([]);
  const [items, setItems] = useState<Record<string, ApiRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSignedIn(false);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("collections").select("*").order("created_at", { ascending: false });
    const cols = (data ?? []) as Collection[];
    setRows(cols);
    if (cols.length) {
      const { data: links } = await supabase
        .from("collection_apis")
        .select("collection_id, apis(*)")
        .in("collection_id", cols.map((c) => c.id));
      const map: Record<string, ApiRecord[]> = {};
      ((links ?? []) as { collection_id: string; apis: ApiRecord | null }[]).forEach((l) => {
        if (!l.apis) return;
        (map[l.collection_id] ??= []).push(l.apis);
      });
      setItems(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!name.trim()) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return toast.error("Sign in first");
    const { error } = await supabase.from("collections").insert({ name: name.trim(), user_id: auth.user.id });
    if (error) return toast.error(error.message);
    setName("");
    toast.success("Collection created");
    void load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("collections").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((p) => p.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-5">
      <Helmet>
        <title>API Collections — Organise Your Public APIs</title>
        <meta name="description" content="Group free public APIs into personal collections for projects, research and quick access." />
      </Helmet>
      <header>
        <h1 className="text-2xl font-bold text-foreground">Collections</h1>
        <p className="text-sm text-muted-foreground">Group APIs into personal, private sets</p>
      </header>

      {!signedIn ? (
        <EmptyState title="Sign in to build collections" hint="Collections are private to your account." />
      ) : (
        <>
          <Panel className="flex gap-2 p-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New collection name"
              className="min-w-0 flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={create}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
            >
              <FolderPlus className="h-3.5 w-3.5" /> Create
            </button>
          </Panel>

          {loading ? (
            <SkeletonCard />
          ) : rows.length === 0 ? (
            <EmptyState title="No collections yet" hint="Create one above to start grouping APIs." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {rows.map((c) => (
                <Panel key={c.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-foreground">{c.name}</h2>
                      <p className="text-xs text-muted-foreground">{(items[c.id] ?? []).length} APIs</p>
                    </div>
                    <button type="button" aria-label="Delete collection" onClick={() => remove(c.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(items[c.id] ?? []).slice(0, 8).map((a) => (
                      <Link key={a.id} to={`/apis/${a.slug}`}>
                        <Chip tone="primary">{a.name}</Chip>
                      </Link>
                    ))}
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ApiCollections;
