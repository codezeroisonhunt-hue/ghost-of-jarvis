import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus, Sparkles, RefreshCw, ShoppingBag, AlertTriangle, Target, Shield } from "lucide-react";

interface Signal {
  symbol: string;
  assetType: "stock" | "crypto";
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  timeframe: "intraday" | "swing" | "position";
  entry?: string;
  target?: string;
  stopLoss?: string;
  rationale: string;
}
interface Advice {
  marketSummary: string;
  signals: Signal[];
  generatedAt: string;
  disclaimer: string;
}

const ACTION_STYLES = {
  BUY: { color: "text-primary", border: "border-primary/40", bg: "bg-primary/10", Icon: TrendingUp },
  SELL: { color: "text-accent", border: "border-accent/40", bg: "bg-accent/10", Icon: TrendingDown },
  HOLD: { color: "text-muted-foreground", border: "border-border", bg: "bg-muted/20", Icon: Minus },
};

export default function TradeAdvisorModule() {
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const { data: market, error: mErr } = await supabase.functions.invoke("markets");
      if (mErr) throw mErr;
      const { data, error: aErr } = await supabase.functions.invoke("market-advisor", {
        body: { stocks: market?.stocks ?? [], crypto: market?.crypto ?? [] },
      });
      if (aErr) throw aErr;
      if ((data as any)?.error) throw new Error((data as any).error);
      setAdvice(data as Advice);
    } catch (e: any) {
      setError(e.message || "Failed to generate signals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { generate(); }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="glass-panel p-4 md:p-6 relative overflow-hidden scan-sweep">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-1">JARVIS · TACTICAL</div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" /> Buy / Sell AI
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Live AI signals from real-time market data.</p>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-mono tracking-wider flex items-center gap-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "ANALYZING…" : "RE-ANALYZE"}
          </button>
        </div>
        {error && (
          <div className="mt-3 text-xs text-accent flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {error}
          </div>
        )}
      </div>

      {advice?.marketSummary && (
        <div className="glass-panel p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] tracking-[0.3em] text-primary mb-1">MARKET READ</div>
              <p className="text-sm leading-relaxed">{advice.marketSummary}</p>
            </div>
          </div>
        </div>
      )}

      {loading && !advice && (
        <div className="grid md:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-panel p-4 h-40 animate-pulse" />
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {advice?.signals.map((s, i) => {
          const st = ACTION_STYLES[s.action];
          const Icon = st.Icon;
          return (
            <div key={i} className={`glass-panel p-4 border ${st.border} relative overflow-hidden`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="font-mono font-bold text-lg">{s.symbol}</div>
                  <span className="text-[10px] uppercase text-muted-foreground border border-border rounded px-1.5 py-0.5">
                    {s.assetType}
                  </span>
                  <span className="text-[10px] uppercase text-muted-foreground">{s.timeframe}</span>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${st.bg} ${st.color} font-mono text-xs font-bold tracking-wider`}>
                  <Icon className="h-3.5 w-3.5" />
                  {s.action}
                </div>
              </div>

              <p className="text-sm text-foreground/90 mb-3 leading-snug">{s.rationale}</p>

              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                <Stat label="ENTRY" value={s.entry} icon={<Target className="h-3 w-3" />} />
                <Stat label="TARGET" value={s.target} icon={<TrendingUp className="h-3 w-3" />} />
                <Stat label="STOP" value={s.stopLoss} icon={<Shield className="h-3 w-3" />} />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1 bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.action === "SELL" ? "bg-accent" : "bg-primary"}`}
                    style={{ width: `${s.confidence}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">{s.confidence}%</div>
              </div>
            </div>
          );
        })}
      </div>

      {advice?.disclaimer && (
        <div className="text-[10px] text-muted-foreground text-center font-mono tracking-wider pt-2">
          ⚠ {advice.disclaimer}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value?: string; icon: React.ReactNode }) {
  return (
    <div className="rounded border border-border/40 bg-card/30 p-2">
      <div className="flex items-center gap-1 text-muted-foreground text-[9px] tracking-widest mb-0.5">
        {icon} {label}
      </div>
      <div className="text-foreground truncate">{value || "—"}</div>
    </div>
  );
}
