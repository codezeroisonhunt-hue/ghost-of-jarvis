import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, RefreshCw, ExternalLink, Search, AlertTriangle, Radio } from "lucide-react";

const CHANNELS = [
  { key: "bbc.com", label: "BBC" },
  { key: "reuters.com", label: "Reuters" },
  { key: "cnn.com", label: "CNN" },
  { key: "theverge.com", label: "Verge" },
  { key: "techcrunch.com", label: "TechCrunch" },
  { key: "bloomberg.com", label: "Bloomberg" },
  { key: "ndtv.com", label: "NDTV" },
  { key: "thehindu.com", label: "The Hindu" },
  { key: "indiatoday.in", label: "India Today" },
  { key: "aljazeera.com", label: "Al Jazeera" },
  { key: "wired.com", label: "Wired" },
  { key: "nytimes.com", label: "NY Times" },
];

interface Article {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
  image?: string;
  summary?: string;
}

const CATEGORIES = [
  { key: "top", label: "Top" },
  { key: "tech", label: "Tech" },
  { key: "business", label: "Business" },
  { key: "world", label: "World" },
  { key: "ai", label: "AI" },
  { key: "india", label: "India" },
];

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  if (!d) return "";
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NewsModule() {
  const [category, setCategory] = useState("top");
  const [topic, setTopic] = useState("");
  const [channel, setChannel] = useState("");
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const timerRef = useRef<number | null>(null);

  async function load(opts?: { category?: string; topic?: string; channel?: string }) {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase.functions.invoke("news", {
        body: {
          category: opts?.category ?? category,
          topic: opts?.topic ?? topic,
          channel: opts?.channel ?? channel,
        },
      });
      if (e) throw e;
      if ((data as any)?.error) throw new Error((data as any).error);
      setArticles((data as any)?.articles ?? []);
      setLastUpdate(new Date());
    } catch (e: any) {
      setError(e.message ?? "Failed to load news");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load({ category, topic: "", channel }); /* eslint-disable-next-line */ }, [category, channel]);

  // Real-time auto-refresh every 60s
  useEffect(() => {
    if (!live) return;
    timerRef.current = window.setInterval(() => load(), 60000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
    // eslint-disable-next-line
  }, [live, category, channel, topic]);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="glass-panel p-4 md:p-6 relative overflow-hidden scan-sweep">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-1">JARVIS · INTEL FEED</div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Newspaper className="h-6 w-6 text-primary" /> Live News
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Global signals · GDELT + HN {lastUpdate && <span className="text-primary/70">· updated {lastUpdate.toLocaleTimeString()}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLive(v => !v)}
              className={`px-3 py-2 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition ${live ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground"}`}
              title="Auto-refresh every 60s"
            >
              <Radio className={`h-3.5 w-3.5 ${live ? "animate-pulse" : ""}`} /> {live ? "LIVE" : "PAUSED"}
            </button>
            <button
              onClick={() => load()}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-mono flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> REFRESH
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); setTopic(query); load({ topic: query }); }}
          className="mt-4 flex items-center gap-2"
        >
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-card/40 border border-border/60 focus-within:border-primary/60">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any topic… (e.g. nvidia, mumbai, spaceX)"
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {topic && (
              <button type="button" onClick={() => { setTopic(""); setQuery(""); load({ topic: "" }); }} className="text-[10px] text-accent font-mono">CLEAR</button>
            )}
          </div>
        </form>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => { setTopic(""); setQuery(""); setChannel(""); setCategory(c.key); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-mono tracking-wider border transition ${
                category === c.key && !topic && !channel
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/60 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <span className="shrink-0 text-[10px] font-mono text-muted-foreground tracking-widest pr-1">CHANNELS</span>
          {channel && (
            <button onClick={() => setChannel("")} className="shrink-0 px-2 py-1 rounded-full text-[10px] font-mono border border-accent/60 text-accent">ALL ×</button>
          )}
          {CHANNELS.map((c) => (
            <button
              key={c.key}
              onClick={() => { setTopic(""); setQuery(""); setChannel(c.key); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-mono tracking-wider border transition ${
                channel === c.key
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/60 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-3 text-xs text-accent flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {error}
          </div>
        )}
      </div>

      {loading && articles.length === 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-panel h-32 animate-pulse" />
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {articles.map((a, i) => (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noreferrer noopener"
            className="glass-panel p-4 hover:border-primary/60 border border-border/60 transition group flex gap-3"
          >
            {a.image && (
              <img src={a.image} alt="" loading="lazy" className="h-20 w-20 object-cover rounded-md border border-border/60 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground mb-1">
                <span className="text-primary truncate max-w-[60%]">{a.source}</span>
                <span>·</span>
                <span>{timeAgo(a.publishedAt)}</span>
              </div>
              <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition line-clamp-3">
                {a.title}
              </h3>
              {a.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.summary}</p>}
              <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary/80 font-mono">
                READ <ExternalLink className="h-2.5 w-2.5" />
              </div>
            </div>
          </a>
        ))}
        {!loading && articles.length === 0 && !error && (
          <div className="glass-panel p-6 text-center text-sm text-muted-foreground md:col-span-2">
            No articles found. Try another category or topic.
          </div>
        )}
      </div>
    </div>
  );
}
