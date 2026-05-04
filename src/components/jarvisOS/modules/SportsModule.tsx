import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, RefreshCw, Radio, AlertTriangle, Activity, MapPin, Calendar, Tv, CloudSun, X, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Match {
  id: string;
  sport: string;
  league: string;
  leagueId: string;
  cricketLeague?: string;
  format?: string;
  status: string;
  isLive: boolean;
  startTime: string;
  home: { name: string; score?: string; logo?: string; abbr?: string };
  away: { name: string; score?: string; logo?: string; abbr?: string };
  venue?: string;
  city?: string;
  detail?: string;
  note?: string;
}

interface PlayerStat {
  name: string;
  position?: string;
  batting?: { runs: string; balls?: string; fours?: string; sixes?: string; sr?: string; out?: string };
  bowling?: { overs?: string; runs?: string; wickets?: string; econ?: string };
  goals?: number;
  assists?: number;
}

interface MatchDetails {
  id: string; sport: string; league: string; status: string; startTime: string;
  venue?: string; city?: string; note?: string; weather?: string; broadcast?: string;
  teams: { name: string; score?: string; innings?: { score: string; overs?: string; label?: string }[]; players: PlayerStat[] }[];
  events: { time?: string; team?: string; text: string; type?: string }[];
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

const CRICKET_LEAGUES = [
  { key: "", label: "All" },
  { key: "india", label: "🇮🇳 Indian" },
  { key: "ipl", label: "IPL" },
  { key: "ranji", label: "Ranji" },
  { key: "syed", label: "Syed Mushtaq Ali" },
  { key: "icc", label: "ICC" },
  { key: "intl", label: "Intl T20" },
  { key: "bbl", label: "BBL" },
  { key: "psl", label: "PSL" },
  { key: "cpl", label: "CPL" },
  { key: "hundred", label: "Hundred" },
];

const FORMATS = [
  { key: "", label: "Any" },
  { key: "T20", label: "T20" },
  { key: "ODI", label: "ODI" },
  { key: "Test", label: "Test" },
];

function fmtIST(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true,
    });
  } catch { return ""; }
}
function fmtISTFull(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata", weekday: "short", day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit", hour12: true,
    }) + " IST";
  } catch { return ""; }
}

export default function SportsModule() {
  const [sport, setSport] = useState("all");
  const [cricketLeague, setCricketLeague] = useState("");
  const [format, setFormat] = useState("");
  const [liveOnly, setLiveOnly] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const timerRef = useRef<number | null>(null);

  const [selected, setSelected] = useState<Match | null>(null);
  const [details, setDetails] = useState<MatchDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  async function load() {
    setLoading(true); setError(null);
    try {
      const { data, error: e } = await supabase.functions.invoke("sports", {
        body: { sport, live: liveOnly, cricketLeague, format },
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

  async function loadDetails(m: Match) {
    setSelected(m); setDetails(null); setDetailsLoading(true);
    try {
      const { data } = await supabase.functions.invoke("sports", {
        body: { action: "details", sport: m.sport, leagueId: m.leagueId, id: m.id },
      });
      setDetails((data as any)?.details ?? null);
    } finally { setDetailsLoading(false); }
  }

  // Refresh open match details too
  async function refreshDetailsSilent() {
    if (!selected) return;
    try {
      const { data } = await supabase.functions.invoke("sports", {
        body: { action: "details", sport: selected.sport, leagueId: selected.leagueId, id: selected.id },
      });
      if ((data as any)?.details) setDetails((data as any).details);
    } catch {}
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [sport, liveOnly, cricketLeague, format]);

  useEffect(() => {
    if (!live) return;
    timerRef.current = window.setInterval(() => { load(); refreshDetailsSilent(); }, 30000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
    // eslint-disable-next-line
  }, [live, sport, liveOnly, cricketLeague, format, selected]);

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
              onClick={() => { setSport(s.key); setCricketLeague(""); setFormat(""); }}
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

        {sport === "cricket" && (
          <>
            <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              <span className="shrink-0 text-[10px] font-mono text-primary tracking-widest pr-1">LEAGUE</span>
              {CRICKET_LEAGUES.map(l => (
                <button
                  key={l.key || "all"}
                  onClick={() => setCricketLeague(l.key)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-mono tracking-wider border transition ${
                    cricketLeague === l.key
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/60 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              <span className="shrink-0 text-[10px] font-mono text-primary tracking-widest pr-1">FORMAT</span>
              {FORMATS.map(f => (
                <button
                  key={f.key || "any"}
                  onClick={() => setFormat(f.key)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-mono tracking-wider border transition ${
                    format === f.key
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border/60 text-muted-foreground hover:border-accent/40"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </>
        )}

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
          <button
            key={`${m.leagueId}-${m.id}`}
            onClick={() => loadDetails(m)}
            className={`glass-panel p-4 border transition text-left ${
              m.isLive ? "border-accent/60 shadow-[0_0_20px_-8px_hsl(var(--accent))]" : "border-border/60 hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono mb-3 gap-2">
              <span className="text-primary truncate">{m.league}{m.format && ` · ${m.format}`}</span>
              <span className={`shrink-0 px-2 py-0.5 rounded-full border ${
                m.isLive ? "border-accent text-accent animate-pulse" : "border-border/60 text-muted-foreground"
              }`}>
                {m.isLive ? "● LIVE" : m.status === "FT" ? "FT" : fmtIST(m.startTime)}
              </span>
            </div>

            <div className="space-y-2">
              <Team t={m.home} score={m.home.score} highlight={m.isLive} />
              <Team t={m.away} score={m.away.score} highlight={m.isLive} />
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-muted-foreground gap-2">
              <span className="truncate">{m.detail || m.venue || ""}</span>
              <span className="text-primary/70 shrink-0">TAP →</span>
            </div>
          </button>
        ))}
        {!loading && matches.length === 0 && !error && (
          <div className="glass-panel p-6 text-center text-sm text-muted-foreground md:col-span-2">
            No matches for this filter right now.
          </div>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setDetails(null); } }}>
        <SheetContent side="bottom" className="h-[92vh] overflow-y-auto bg-card/95 backdrop-blur border-primary/30 p-0">
          {selected && (
            <div className="p-4 md:p-6 space-y-4">
              <SheetHeader className="text-left space-y-1">
                <div className="text-[10px] tracking-[0.3em] text-muted-foreground">{selected.league}{selected.format && ` · ${selected.format}`}</div>
                <SheetTitle className="text-lg flex items-center justify-between gap-2">
                  <span className="truncate">{selected.home.name} vs {selected.away.name}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${selected.isLive ? "border-accent text-accent" : "border-border/60 text-muted-foreground"}`}>
                    {selected.isLive ? "● LIVE" : selected.status}
                  </span>
                </SheetTitle>
              </SheetHeader>

              {/* Score header */}
              <div className="glass-panel p-3 space-y-2">
                <Team t={selected.home} score={details?.teams?.[0]?.score ?? selected.home.score} highlight={selected.isLive} />
                {details?.teams?.[0]?.innings && details.teams[0].innings.length > 0 && (
                  <div className="text-[10px] font-mono text-muted-foreground pl-8">
                    {details.teams[0].innings.map((i, idx) => (
                      <span key={idx} className="mr-2">{i.label ?? `Inn ${idx+1}`}: {i.score} {i.overs ?? ""}</span>
                    ))}
                  </div>
                )}
                <div className="border-t border-border/40 my-1" />
                <Team t={selected.away} score={details?.teams?.[1]?.score ?? selected.away.score} highlight={selected.isLive} />
                {details?.teams?.[1]?.innings && details.teams[1].innings.length > 0 && (
                  <div className="text-[10px] font-mono text-muted-foreground pl-8">
                    {details.teams[1].innings.map((i, idx) => (
                      <span key={idx} className="mr-2">{i.label ?? `Inn ${idx+1}`}: {i.score} {i.overs ?? ""}</span>
                    ))}
                  </div>
                )}
                {(details?.status || selected.detail) && (
                  <div className="text-xs text-primary pt-1">{details?.status ?? selected.detail}</div>
                )}
              </div>

              {/* Meta */}
              <div className="glass-panel p-3 space-y-1.5 text-xs">
                <div className="flex items-start gap-2">
                  <Calendar className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{fmtISTFull(selected.startTime)}</span>
                </div>
                {(selected.venue || selected.city) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{[selected.venue, selected.city].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {details?.weather && (
                  <div className="flex items-start gap-2">
                    <CloudSun className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{details.weather}</span>
                  </div>
                )}
                {details?.broadcast && (
                  <div className="flex items-start gap-2">
                    <Tv className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{details.broadcast}</span>
                  </div>
                )}
                {(details?.note || selected.note) && (
                  <div className="text-muted-foreground pt-1">{details?.note ?? selected.note}</div>
                )}
              </div>

              {detailsLoading && (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading details…
                </div>
              )}

              {/* Lineups / Player scores */}
              {details?.teams?.map((team, ti) => (
                <div key={ti} className="glass-panel p-3">
                  <div className="text-xs font-mono text-primary tracking-widest mb-2">
                    {team.name.toUpperCase()} {team.score && <span className="text-foreground">· {team.score}</span>}
                  </div>
                  {team.players.length === 0 ? (
                    <div className="text-xs text-muted-foreground">Lineup not available yet.</div>
                  ) : (
                    <div className="space-y-1">
                      {team.players.map((p, pi) => (
                        <PlayerRow key={pi} p={p} sport={selected.sport} />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Recent events */}
              {details && details.events.length > 0 && (
                <div className="glass-panel p-3">
                  <div className="text-xs font-mono text-primary tracking-widest mb-2">RECENT EVENTS</div>
                  <div className="space-y-2">
                    {details.events.map((ev, i) => (
                      <div key={i} className="flex gap-2 text-xs border-l-2 border-primary/40 pl-2">
                        {ev.time && <span className="font-mono text-primary/80 shrink-0">{ev.time}</span>}
                        <span className="text-foreground/90">{ev.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
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

function PlayerRow({ p, sport }: { p: PlayerStat; sport: string }) {
  if (sport === "cricket" && (p.batting || p.bowling)) {
    return (
      <div className="flex items-start justify-between gap-2 text-xs py-1 border-b border-border/30 last:border-0">
        <div className="min-w-0 flex-1">
          <div className="truncate">{p.name}</div>
          {p.batting?.out && <div className="text-[10px] text-muted-foreground truncate">{p.batting.out}</div>}
          {p.bowling && (
            <div className="text-[10px] text-muted-foreground">
              {p.bowling.overs ?? "-"} ov · {p.bowling.runs ?? "-"} R · econ {p.bowling.econ ?? "-"}
            </div>
          )}
        </div>
        <div className="text-right shrink-0 font-mono">
          {p.batting && (
            <div>
              <span className="text-primary font-bold tabular-nums">{p.batting.runs}</span>
              {p.batting.balls && <span className="text-muted-foreground"> ({p.batting.balls})</span>}
              {(p.batting.fours || p.batting.sixes) && (
                <div className="text-[10px] text-muted-foreground">
                  {p.batting.fours ?? 0}×4 · {p.batting.sixes ?? 0}×6
                </div>
              )}
            </div>
          )}
          {!p.batting && p.bowling && (
            <div className="text-accent font-bold tabular-nums">
              {p.bowling.wickets ?? 0}/{p.bowling.runs ?? 0}
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2 text-xs py-1 border-b border-border/30 last:border-0">
      <div className="min-w-0 flex-1 flex items-center gap-2">
        {p.position && <span className="text-[10px] font-mono text-muted-foreground w-8 shrink-0">{p.position}</span>}
        <span className="truncate">{p.name}</span>
      </div>
      {(p.goals !== undefined || p.assists !== undefined) && (
        <div className="text-right font-mono text-[11px]">
          {p.goals ? <span className="text-primary">⚽ {p.goals}</span> : null}
          {p.assists ? <span className="text-muted-foreground ml-2">A {p.assists}</span> : null}
        </div>
      )}
    </div>
  );
}
