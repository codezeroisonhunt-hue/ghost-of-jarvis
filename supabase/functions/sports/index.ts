// Live Sports edge function — TheSportsDB (keyless test key "3") + ESPN public scoreboards
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Match {
  id: string;
  sport: string;
  league: string;
  status: string;        // "LIVE" | "FT" | "NS" | clock string
  isLive: boolean;
  startTime: string;     // ISO
  home: { name: string; score?: string; logo?: string };
  away: { name: string; score?: string; logo?: string };
  venue?: string;
  detail?: string;
}

const ESPN: Record<string, string> = {
  cricket: "https://site.api.espn.com/apis/site/v2/sports/cricket/8039/scoreboard",      // ICC events
  football: "https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard",
  basketball: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
  nfl: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
  baseball: "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard",
  hockey: "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard",
  tennis: "https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard",
  f1: "https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard",
};

function mapEspn(json: any, sport: string): Match[] {
  const events = json?.events ?? [];
  return events.map((ev: any) => {
    const comp = ev.competitions?.[0] ?? {};
    const competitors = comp.competitors ?? [];
    const home = competitors.find((c: any) => c.homeAway === "home") ?? competitors[0] ?? {};
    const away = competitors.find((c: any) => c.homeAway === "away") ?? competitors[1] ?? {};
    const status = ev.status?.type ?? {};
    const state = status.state; // pre | in | post
    const isLive = state === "in";
    return {
      id: String(ev.id),
      sport,
      league: ev.leagues?.[0]?.name ?? json?.leagues?.[0]?.name ?? sport,
      status: isLive ? (status.shortDetail ?? "LIVE") : state === "post" ? "FT" : (status.shortDetail ?? "NS"),
      isLive,
      startTime: ev.date,
      home: { name: home.team?.displayName ?? "Home", score: home.score, logo: home.team?.logo },
      away: { name: away.team?.displayName ?? "Away", score: away.score, logo: away.team?.logo },
      venue: comp.venue?.fullName,
      detail: status.detail,
    } as Match;
  });
}

async function fetchEspn(sport: string): Promise<Match[]> {
  const url = ESPN[sport];
  if (!url) return [];
  try {
    const r = await fetch(url);
    if (!r.ok) return [];
    const j = await r.json();
    return mapEspn(j, sport);
  } catch { return []; }
}

async function fetchAll(): Promise<Match[]> {
  const sports = Object.keys(ESPN);
  const results = await Promise.all(sports.map(fetchEspn));
  return results.flat();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    let sport = url.searchParams.get("sport") ?? "all";
    let liveOnly = url.searchParams.get("live") === "true";
    if (req.method === "POST") {
      try {
        const b = await req.json();
        sport = b.sport ?? sport;
        liveOnly = b.live ?? liveOnly;
      } catch {}
    }

    let matches: Match[] = sport === "all" ? await fetchAll() : await fetchEspn(sport);
    if (liveOnly) matches = matches.filter(m => m.isLive);

    // Sort: live first, then by start time
    matches.sort((a, b) => {
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

    return new Response(JSON.stringify({ matches, sport, generatedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? "sports error", matches: [] }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
