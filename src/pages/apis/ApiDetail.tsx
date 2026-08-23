import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ExternalLink, Loader2, Play, Star, Plus, Trash2 } from "lucide-react";
import { Panel, Chip, EmptyState, SkeletonCard } from "@/components/apis/ApiUI";
import { fetchApiBySlug, type ApiRecord } from "@/lib/apis/catalog";
import { useApiFavorites } from "@/hooks/useApiFavorites";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Header = { key: string; value: string };
type ProxyResult = {
  ok: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: string;
  truncated?: boolean;
  durationMs?: number;
  error?: string;
};

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"] as const;

const pretty = (text: string) => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};

const ApiDetail: React.FC = () => {
  const { slug = "" } = useParams();
  const [api, setApi] = useState<ApiRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const { favoriteIds, toggleFavorite } = useApiFavorites();

  const [method, setMethod] = useState<string>("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<Header[]>([{ key: "", value: "" }]);
  const [body, setBody] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ProxyResult | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchApiBySlug(slug)
      .then((row) => {
        if (!alive) return;
        setApi(row);
        if (row) setUrl(row.documentation_url);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load API"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  const send = useCallback(async () => {
    if (!url.trim()) {
      toast.error("Enter a request URL");
      return;
    }
    setRunning(true);
    setResult(null);
    const started = Date.now();
    try {
      const headerMap: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key.trim()) headerMap[h.key.trim()] = h.value;
      });
      const { data, error } = await supabase.functions.invoke("api-proxy", {
        body: {
          method,
          url: url.trim(),
          headers: headerMap,
          body: ["GET", "HEAD"].includes(method) ? undefined : body || undefined,
        },
      });
      if (error) throw error;
      const res = data as ProxyResult;
      setResult(res);

      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        await supabase.from("request_history").insert({
          user_id: auth.user.id,
          api_id: api?.id ?? null,
          api_name: api?.name ?? null,
          method,
          url: url.trim(),
          status_code: res.status ?? null,
          duration_ms: res.durationMs ?? Date.now() - started,
        });
      }
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : "Request failed" });
    } finally {
      setRunning(false);
    }
  }, [api, body, headers, method, url]);

  const curl = useMemo(() => {
    const parts = [`curl -X ${method} '${url}'`];
    headers.forEach((h) => h.key.trim() && parts.push(`  -H '${h.key}: ${h.value}'`));
    if (body && !["GET", "HEAD"].includes(method)) parts.push(`  -d '${body.replace(/'/g, "'\\''")}'`);
    return parts.join(" \\\n");
  }, [body, headers, method, url]);

  if (loading) return <SkeletonCard />;
  if (!api) return <EmptyState title="API not found" hint="It may have been removed from the catalog." />;

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{`${api.name} API — Docs, Auth & Playground`}</title>
        <meta
          name="description"
          content={`${api.name}: ${(api.description || "Free public API").slice(0, 130)}`}
        />
        <link rel="canonical" href={`/apis/${api.slug}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebAPI",
            name: api.name,
            description: api.description,
            documentation: api.documentation_url,
            provider: { "@type": "Organization", name: api.name },
          })}
        </script>
      </Helmet>

      <Link to="/apis/browse" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to directory
      </Link>

      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70">{api.category}</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">{api.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{api.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleFavorite(api)}
              className="inline-flex items-center gap-1 rounded-lg border border-primary/30 px-3 py-1.5 text-xs text-primary hover:bg-primary/10"
            >
              <Star className={favoriteIds.has(api.id) ? "h-3.5 w-3.5 fill-primary" : "h-3.5 w-3.5"} />
              {favoriteIds.has(api.id) ? "Saved" : "Save"}
            </button>
            <a
              href={api.documentation_url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-primary"
            >
              Docs <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Chip tone="accent">Auth: {api.auth_type ?? "none"}</Chip>
          <Chip tone="primary">HTTPS: {api.https ? "yes" : "no"}</Chip>
          <Chip>CORS: {api.cors}</Chip>
          {api.health_status && <Chip tone="primary">Health: {api.health_status}</Chip>}
          {api.tags.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
      </Panel>

      <Panel className="p-4 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Request playground</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Requests run through a secured server-side proxy — internal addresses are blocked and cookies stripped.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/v1/resource"
            className="min-w-0 flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={send}
            disabled={running}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Send
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Headers</p>
          {headers.map((h, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={h.key}
                onChange={(e) =>
                  setHeaders((p) => p.map((x, ix) => (ix === i ? { ...x, key: e.target.value } : x)))
                }
                placeholder="Header"
                className="w-1/3 rounded-lg border border-border/60 bg-background px-2 py-1.5 text-xs"
              />
              <input
                value={h.value}
                onChange={(e) =>
                  setHeaders((p) => p.map((x, ix) => (ix === i ? { ...x, value: e.target.value } : x)))
                }
                placeholder="Value"
                className="min-w-0 flex-1 rounded-lg border border-border/60 bg-background px-2 py-1.5 text-xs"
              />
              <button
                type="button"
                aria-label="Remove header"
                onClick={() => setHeaders((p) => p.filter((_, ix) => ix !== i))}
                className="rounded-lg border border-border/60 px-2 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setHeaders((p) => [...p, { key: "", value: "" }])}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> Add header
          </button>
        </div>

        {!["GET", "HEAD"].includes(method) && (
          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Body</p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder='{"key":"value"}'
              className="mt-1 w-full rounded-lg border border-border/60 bg-background p-2 font-mono text-xs"
            />
          </div>
        )}

        {result && (
          <div className="mt-5 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Chip tone={result.ok && (result.status ?? 500) < 400 ? "primary" : "accent"}>
                {result.ok ? `${result.status} ${result.statusText ?? ""}` : "Failed"}
              </Chip>
              {result.durationMs != null && <Chip>{result.durationMs} ms</Chip>}
              {result.truncated && <Chip tone="accent">truncated</Chip>}
            </div>
            <pre className="max-h-96 overflow-auto rounded-lg border border-border/60 bg-muted/20 p-3 font-mono text-[11px] text-foreground">
              {result.error ?? pretty(result.body ?? "")}
            </pre>
          </div>
        )}

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">cURL</p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(curl);
                toast.success("cURL copied");
              }}
              className="text-xs text-primary hover:underline"
            >
              Copy
            </button>
          </div>
          <pre className="mt-1 overflow-auto rounded-lg border border-border/60 bg-muted/20 p-3 font-mono text-[11px]">
            {curl}
          </pre>
        </div>
      </Panel>
    </div>
  );
};

export default ApiDetail;
