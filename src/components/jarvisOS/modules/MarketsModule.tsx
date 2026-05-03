import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, RefreshCw, Activity } from "lucide-react";

interface Stock {
  symbol: string; name: string; price: number;
  change: number; changePct: number; currency?: string;
}
interface Crypto {
  id: string; symbol: string; name: string; image: string;
  price: number; change: number; changePct: number; marketCap: number;
}
interface Data {
  stocks: Stock[]; crypto: Crypto[];
  gainers: Stock[]; losers: Stock[];
  updatedAt: string;
}

const REFRESH_MS = 30_000;

function fmt(n: number | undefined, digits = 2) {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}
function compact(n: number | undefined) {
  if (n == null) return "—";
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 }).format(n);
}

function ChangeBadge({ pct }: { pct: number | undefined }) {
  const up = (pct ?? 0) >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono ${up ? "text-primary" : "text-accent"}`}>
      <Icon className="h-3 w-3" />
      {pct == null ? "—" : `${up ? "+" : ""}${pct.toFixed(2)}%`}
    </span>
  );
}

export default function MarketsModule() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: res, error: err } = await supabase.functions.invoke("markets");
        if (err) throw err;
        if (!cancelled) { setData(res as Data); setError(null); }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load markets");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = setInterval(() => { setTick(t => t + 1); load(); }, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="glass-panel p-4 md:p-6 relative overflow-hidden scan-sweep">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-1">MODULE</div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" /> Live Markets
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {data ? new Date(data.updatedAt).toLocaleTimeString() : "syncing…"}
          </div>
        </div>
        {error && <div className="mt-3 text-xs text-accent">⚠ {error}</div>}
      </div>

      {/* Gainers / Losers */}
      <div className="grid md:grid-cols-2 gap-3">
        <Panel title="Top Gainers" accent="blue">
          {(data?.gainers ?? []).map(s => <Row key={s.symbol} symbol={s.symbol} name={s.name} price={s.price} pct={s.changePct} />)}
          {!loading && data?.gainers?.length === 0 && <Empty />}
        </Panel>
        <Panel title="Top Losers" accent="red">
          {(data?.losers ?? []).map(s => <Row key={s.symbol} symbol={s.symbol} name={s.name} price={s.price} pct={s.changePct} />)}
          {!loading && data?.losers?.length === 0 && <Empty />}
        </Panel>
      </div>

      {/* Stocks */}
      <Panel title="Stocks">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(data?.stocks ?? []).map(s => (
            <div key={s.symbol} className="rounded-lg border border-primary/20 bg-card/40 p-3 hover:border-primary/50 transition">
              <div className="flex items-center justify-between">
                <div className="font-mono font-semibold text-sm">{s.symbol}</div>
                <ChangeBadge pct={s.changePct} />
              </div>
              <div className="text-xs text-muted-foreground truncate">{s.name}</div>
              <div className="mt-1 font-mono text-lg">{fmt(s.price)} <span className="text-[10px] text-muted-foreground">{s.currency}</span></div>
            </div>
          ))}
          {loading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      </Panel>

      {/* Crypto */}
      <Panel title="Crypto" accent="red">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(data?.crypto ?? []).map(c => (
            <div key={c.id} className="rounded-lg border border-accent/20 bg-card/40 p-3 hover:border-accent/50 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {c.image && <img src={c.image} alt={c.name} className="h-5 w-5" />}
                  <div className="font-mono font-semibold text-sm">{c.symbol}</div>
                </div>
                <ChangeBadge pct={c.changePct} />
              </div>
              <div className="text-xs text-muted-foreground truncate">{c.name}</div>
              <div className="mt-1 font-mono text-lg">${fmt(c.price, c.price < 1 ? 6 : 2)}</div>
              <div className="text-[10px] text-muted-foreground font-mono">MCap ${compact(c.marketCap)}</div>
            </div>
          ))}
          {loading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      </Panel>
    </div>
  );
}

function Panel({ title, children, accent = "blue" }: { title: string; children: React.ReactNode; accent?: "blue" | "red" }) {
  const isRed = accent === "red";
  return (
    <div className={`${isRed ? "glass-panel-red" : "glass-panel"} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className={`text-sm font-semibold tracking-widest ${isRed ? "text-accent" : "text-primary"}`}>{title.toUpperCase()}</h2>
      </div>
      {children}
    </div>
  );
}
function Row({ symbol, name, price, pct }: { symbol: string; name: string; price: number; pct: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <div className="min-w-0">
        <div className="font-mono text-sm">{symbol}</div>
        <div className="text-xs text-muted-foreground truncate">{name}</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-sm">{fmt(price)}</div>
        <ChangeBadge pct={pct} />
      </div>
    </div>
  );
}
function Skeleton() {
  return <div className="rounded-lg border border-border/30 bg-card/30 p-3 animate-pulse h-[88px]" />;
}
function Empty() { return <div className="text-xs text-muted-foreground py-4 text-center">No data yet.</div>; }
