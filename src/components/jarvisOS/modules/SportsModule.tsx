import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, RefreshCw, Radio, AlertTriangle, Activity } from "lucide-react";

interface Match {
  id: string;
  sport: string;
  league: string;
  status: string;
  isLive: boolean;
  startTime: string;
  home: { name: string; score?: string; logo?: string };
  away: { name: string; score?: string; logo?: string };
  venue?: string;
  detail?: string;
}

const SPORTS = [
  { key: "all", label: "All" },
  { key: "cricket", label: "Cricket" },
  { key: "football", label: "Football" },
  { key: "basketball", label: "NBA" },
  { key: "nfl", label: "NFL" },
  { key: "baseball", label: "MLB" },
  { key: "hockey", label: "NHL" },
  { key: "tennis", label: "Tennis" },
  { key: "f1", label: "F1" },
];

function fmtIST(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true,
    });
  } catch { return ""; }
}

export default function SportsModule() {
  const [sport, setSport] = useState("all");
  const [liveOnly, setLiveOnly] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const timerRef = useRef<number | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const { data, error: e } = await supabase.functions.invoke("sports", {
        body: { sport, live: liveOnly },
      });
      if (e) throw e;
      if ((data as any)?.error) throw new Error((data as any).error);
      setMatches((data as any)?.matches ?? []);
      setLastUpdate(new Date());
    } catch (e: any) {
      setError(e.message ?? "Failed to load scores");
      setMatches([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [sport, liveOnly]);

  useEffect(() => {
    if (!live) return;
    timerRef.current = window.setInterval(() => load(), 30000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
    // eslint-disable-next-line
  }, [live, sport, liveOnly]);

  const liveCount = matches.filter(m => m.isLive).length;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="glass-panel p-4 md:p-6 relative overflow-hidden scan-sweep">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-1">JARVIS · SPORTS UPLINK</div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" /> Live Scores
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              ESPN feeds · {liveCount} live{lastUpdate && <span className="text-primary/70"> · {lastUpdate.toLocaleTimeString()}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLiveOnly(v => !v)}
              className={`px-3 py-2 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition ${liveOnly ? "border-accent bg-accent/15 text-accent" : "border-border/60 text-muted-foreground"}`}
            >
              <Activity className="h-3.5 w-3.5" /> {liveOnly ? "LIVE ONLY" : "ALL"}
            </button>
            <button
              onClick={() => setLive(v => !v)}
              className={`px-3 py-2 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition ${live ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground"}`}
              title="Auto-refresh every 30s"
            >
              <Radio className={`h-3.5 w-3.5 ${live ? "animate-pulse" : ""}`} /> {live ? "LIVE" : "PAUSED"}
            </button>
            <button
              onClick={() => load()}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-mono flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> SYNC
            </button>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {SPORTS.map(s => (
            <button
              key={s.key}
              onClick={() => setSport(s.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-mono tracking-wider border transition ${
                sport === s.key
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/60 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-3 text-xs text-accent flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {error}
          </div>
        )}
      </div>

      {loading && matches.length === 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-panel h-28 animate-pulse" />
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {matches.map((m) => (
          <div
            key={m.id}
            className={`glass-panel p-4 border transition ${
              m.isLive ? "border-accent/60 shadow-[0_0_20px_-8px_hsl(var(--accent))]" : "border-border/60"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono mb-3">
              <span className="text-primary truncate max-w-[60%]">{m.league}</span>
              <span className={`px-2 py-0.5 rounded-full border ${
                m.isLive ? "border-accent text-accent animate-pulse" : "border-border/60 text-muted-foreground"
              }`}>
                {m.isLive ? "● LIVE" : m.status === "FT" ? "FT" : fmtIST(m.startTime)}
              </span>
            </div>

            <div className="space-y-2">
              <Team t={m.home} score={m.home.score} highlight={m.isLive} />
              <Team t={m.away} score={m.away.score} highlight={m.isLive} />
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span className="truncate">{m.detail || m.venue || ""}</span>
              <span className="text-primary/70">{m.sport.toUpperCase()}</span>
            </div>
          </div>
        ))}
        {!loading && matches.length === 0 && !error && (
          <div className="glass-panel p-6 text-center text-sm text-muted-foreground md:col-span-2">
            No matches for this filter right now.
          </div>
        )}
      </div>
    </div>
  );
}

function Team({ t, score, highlight }: { t: { name: string; logo?: string }; score?: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {t.logo ? (
          <img src={t.logo} alt="" className="h-6 w-6 object-contain shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div className="h-6 w-6 rounded-full bg-primary/10 border border-border/60 shrink-0" />
        )}
        <span className="text-sm truncate">{t.name}</span>
      </div>
      <span className={`text-lg font-bold font-mono tabular-nums ${highlight ? "text-primary" : ""}`}>
        {score ?? "-"}
      </span>
    </div>
  );
}
