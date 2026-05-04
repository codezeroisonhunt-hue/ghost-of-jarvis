// Live Sports edge function — ESPN public scoreboards + summaries (keyless)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Match {
  id: string;
  sport: string;
  league: string;
  leagueId: string;
  cricketLeague?: string;     // e.g. "ipl", "icc", "intl"
  format?: string;            // "T20" | "ODI" | "Test" | "T10"
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

const ESPN: Record<string, { url: string; leagueId: string }> = {
  football: { url: "https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard", leagueId: "all" },
  basketball: { url: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard", leagueId: "nba" },
  nfl: { url: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard", leagueId: "nfl" },
  baseball: { url: "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard", leagueId: "mlb" },
  hockey: { url: "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard", leagueId: "nhl" },
  tennis: { url: "https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard", leagueId: "atp" },
  f1: { url: "https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard", leagueId: "f1" },
};

// ESPN cricket organizes by league IDs
const CRICKET_LEAGUES: { key: string; id: string; label: string; india: boolean }[] = [
  { key: "icc",   id: "8039", label: "ICC",          india: false },
  { key: "ipl",   id: "8048", label: "IPL",          india: true  },
  { key: "intl",  id: "23165454", label: "Intl T20", india: false },
  { key: "bbl",   id: "8047", label: "Big Bash",     india: false },
  { key: "psl",   id: "22588211", label: "PSL",      india: false },
  { key: "cpl",   id: "11910", label: "CPL",         india: false },
  { key: "hundred", id: "22919380", label: "The Hundred", india: false },
  { key: "ranji", id: "23360820", label: "Ranji",    india: true  },
  { key: "syed",  id: "22697477", label: "Syed Mushtaq Ali", india: true },
];

function detectFormat(s: string): string | undefined {
  const t = s.toLowerCase();
  if (/\btest\b/.test(t)) return "Test";
  if (/\bodi\b|one[- ]?day/.test(t)) return "ODI";
  if (/\bt20\b|twenty20|20-?over/.test(t)) return "T20";
  if (/\bt10\b/.test(t)) return "T10";
  if (/\bipl\b|big bash|psl|cpl|hundred|syed|t20/i.test(t)) return "T20";
  return undefined;
}

function mapEspn(json: any, sport: string, leagueId: string, cricketLeague?: string): Match[] {
  const events = json?.events ?? [];
  return events.map((ev: any) => {
    const comp = ev.competitions?.[0] ?? {};
    const competitors = comp.competitors ?? [];
    const home = competitors.find((c: any) => c.homeAway === "home") ?? competitors[0] ?? {};
    const away = competitors.find((c: any) => c.homeAway === "away") ?? competitors[1] ?? {};
    const status = ev.status?.type ?? {};
    const state = status.state;
    const isLive = state === "in";
    const note = comp.notes?.[0]?.headline ?? ev.description ?? "";
    const formatStr = sport === "cricket" ? detectFormat(`${ev.name ?? ""} ${note} ${json?.leagues?.[0]?.name ?? ""}`) : undefined;
    return {
      id: String(ev.id),
      sport,
      league: ev.leagues?.[0]?.name ?? json?.leagues?.[0]?.name ?? sport,
      leagueId,
      cricketLeague,
      format: formatStr,
      status: isLive ? (status.shortDetail ?? "LIVE") : state === "post" ? "FT" : (status.shortDetail ?? "NS"),
      isLive,
      startTime: ev.date,
      home: { name: home.team?.displayName ?? "Home", score: home.score, logo: home.team?.logo, abbr: home.team?.abbreviation },
      away: { name: away.team?.displayName ?? "Away", score: away.score, logo: away.team?.logo, abbr: away.team?.abbreviation },
      venue: comp.venue?.fullName,
      city: comp.venue?.address?.city,
      detail: status.detail,
      note,
    } as Match;
  });
}

async function fetchEspn(sport: string): Promise<Match[]> {
  const cfg = ESPN[sport];
  if (!cfg) return [];
  try {
    const r = await fetch(cfg.url);
    if (!r.ok) return [];
    return mapEspn(await r.json(), sport, cfg.leagueId);
  } catch { return []; }
}

async function fetchCricket(filterKey?: string): Promise<Match[]> {
  const leagues = filterKey
    ? CRICKET_LEAGUES.filter(l => l.key === filterKey || (filterKey === "india" && l.india))
    : CRICKET_LEAGUES;
  const results = await Promise.all(leagues.map(async (l) => {
    try {
      const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/cricket/${l.id}/scoreboard`);
      if (!r.ok) return [];
      return mapEspn(await r.json(), "cricket", l.id, l.key);
    } catch { return []; }
  }));
  return results.flat();
}

async function fetchAll(): Promise<Match[]> {
  const sports = Object.keys(ESPN);
  const [other, cricket] = await Promise.all([
    Promise.all(sports.map(fetchEspn)).then(a => a.flat()),
    fetchCricket(),
  ]);
  return [...cricket, ...other];
}

// ---- Match details ----
interface PlayerStat {
  name: string;
  position?: string;
  // cricket: batting "45 (32)" / bowling "2/28"
  batting?: { runs: string; balls?: string; fours?: string; sixes?: string; sr?: string; out?: string };
  bowling?: { overs?: string; runs?: string; wickets?: string; econ?: string };
  // football
  goals?: number;
  assists?: number;
}

interface MatchDetails {
  id: string;
  sport: string;
  league: string;
  status: string;
  startTime: string;
  venue?: string;
  city?: string;
  note?: string;
  weather?: string;
  broadcast?: string;
  teams: {
    name: string;
    score?: string;
    innings?: { score: string; overs?: string; label?: string }[];
    players: PlayerStat[];
  }[];
  events: { time?: string; team?: string; text: string; type?: string }[];
}

async function cricketDetails(leagueId: string, eventId: string): Promise<MatchDetails | null> {
  try {
    const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/cricket/${leagueId}/summary?event=${eventId}`);
    if (!r.ok) return null;
    const j = await r.json();
    const header = j.header ?? {};
    const comp = header.competitions?.[0] ?? {};
    const gameInfo = j.gameInfo ?? {};
    const venue = gameInfo.venue ?? comp.venue ?? {};

    const teams = (comp.competitors ?? []).map((c: any) => {
      const teamId = c.team?.id;
      const innings = (c.linescores ?? []).map((ls: any) => ({
        score: `${ls.runs ?? 0}/${ls.wickets ?? 0}`,
        overs: ls.overs ? `${ls.overs} ov` : undefined,
        label: ls.period ? `Inn ${ls.period}` : undefined,
      }));

      // Players: find this team's roster across all innings in j.rosters
      const players: PlayerStat[] = [];
      const rosters = j.rosters ?? [];
      for (const rost of rosters) {
        if (String(rost.team?.id) !== String(teamId)) continue;
        for (const grp of (rost.roster ?? [])) {
          const athlete = grp.athlete ?? {};
          const stats = grp.stats ?? [];
          // ESPN cricket stats arrays — flatten
          const statMap: Record<string, string> = {};
          for (const s of stats) {
            if (s.name && s.value !== undefined) statMap[s.name] = String(s.displayValue ?? s.value);
          }
          const isBatter = grp.position?.name === "Batsman" || statMap.runs !== undefined || statMap.battingRuns !== undefined;
          const isBowler = grp.position?.name === "Bowler" || statMap.wickets !== undefined || statMap.bowlingWickets !== undefined;
          const stat: PlayerStat = { name: athlete.displayName ?? athlete.shortName ?? "Unknown", position: grp.position?.name };
          if (isBatter) {
            stat.batting = {
              runs: statMap.battingRuns ?? statMap.runs ?? "0",
              balls: statMap.battingBalls ?? statMap.balls,
              fours: statMap.battingFours ?? statMap.fours,
              sixes: statMap.battingSixes ?? statMap.sixes,
              sr: statMap.battingStrikeRate ?? statMap.strikeRate,
              out: grp.dismissal?.text ?? grp.outsText,
            };
          }
          if (isBowler) {
            stat.bowling = {
              overs: statMap.bowlingOvers ?? statMap.overs,
              runs: statMap.bowlingRuns,
              wickets: statMap.bowlingWickets ?? statMap.wickets,
              econ: statMap.bowlingEconomyRate ?? statMap.economyRate,
            };
          }
          players.push(stat);
        }
      }

      return {
        name: c.team?.displayName ?? "",
        score: c.score ?? (innings.map((i: any) => i.score).join(" & ") || undefined),
        innings,
        players,
      };
    });

    const events = (j.commentary?.items ?? j.plays ?? []).slice(0, 25).map((p: any) => ({
      time: p.over?.display ?? p.clock?.displayValue,
      team: p.team?.displayName,
      text: p.text ?? p.description ?? "",
      type: p.type?.text,
    }));

    return {
      id: eventId,
      sport: "cricket",
      league: header.league?.name ?? "",
      status: header.competitions?.[0]?.status?.type?.detail ?? "",
      startTime: comp.date ?? header.timestamp ?? "",
      venue: venue.fullName,
      city: venue.address?.city,
      note: comp.notes?.[0]?.headline,
      weather: gameInfo.weather?.displayValue,
      broadcast: (comp.broadcasts ?? []).map((b: any) => (b.names ?? []).join(", ")).join(" · ") || undefined,
      teams,
      events,
    };
  } catch { return null; }
}

async function genericDetails(sport: string, leagueId: string, eventId: string): Promise<MatchDetails | null> {
  const sportPath: Record<string, string> = {
    football: "soccer", basketball: "basketball", nfl: "football", baseball: "baseball",
    hockey: "hockey", tennis: "tennis", f1: "racing",
  };
  const root = sportPath[sport];
  if (!root) return null;
  try {
    const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${root}/${leagueId}/summary?event=${eventId}`);
    if (!r.ok) return null;
    const j = await r.json();
    const header = j.header ?? {};
    const comp = header.competitions?.[0] ?? {};
    const venue = j.gameInfo?.venue ?? comp.venue ?? {};

    const teams = (comp.competitors ?? []).map((c: any) => {
      const teamId = String(c.team?.id);
      const players: PlayerStat[] = [];
      const boxscore = j.boxscore?.players ?? [];
      const teamBox = boxscore.find((b: any) => String(b.team?.id) === teamId);
      if (teamBox) {
        for (const grp of teamBox.statistics ?? []) {
          const labels: string[] = grp.labels ?? [];
          for (const ath of grp.athletes ?? []) {
            const stats: string[] = ath.stats ?? [];
            const get = (key: string) => {
              const i = labels.findIndex(l => l.toUpperCase() === key.toUpperCase());
              return i >= 0 ? stats[i] : undefined;
            };
            const goals = Number(get("G") ?? get("Goals") ?? 0);
            const assists = Number(get("A") ?? get("Assists") ?? 0);
            players.push({
              name: ath.athlete?.displayName ?? "Unknown",
              position: ath.athlete?.position?.abbreviation,
              goals: isNaN(goals) ? undefined : goals,
              assists: isNaN(assists) ? undefined : assists,
            });
          }
        }
      }
      // Fallback: rosters
      if (players.length === 0) {
        const rosters = j.rosters ?? [];
        for (const rost of rosters) {
          if (String(rost.team?.id) !== teamId) continue;
          for (const grp of (rost.roster ?? []).slice(0, 18)) {
            players.push({
              name: grp.athlete?.displayName ?? "Unknown",
              position: grp.position?.abbreviation,
            });
          }
        }
      }
      return { name: c.team?.displayName ?? "", score: c.score, players };
    });

    const events = (j.plays ?? j.keyEvents ?? []).slice(0, 25).map((p: any) => ({
      time: p.clock?.displayValue ?? p.time?.displayValue,
      team: p.team?.displayName,
      text: p.text ?? p.shortText ?? p.description ?? "",
      type: p.type?.text ?? p.scoringType?.displayName,
    }));

    return {
      id: eventId,
      sport,
      league: header.league?.name ?? "",
      status: header.competitions?.[0]?.status?.type?.detail ?? "",
      startTime: comp.date ?? "",
      venue: venue.fullName,
      city: venue.address?.city,
      note: comp.notes?.[0]?.headline,
      weather: j.gameInfo?.weather?.displayValue,
      broadcast: (comp.broadcasts ?? []).map((b: any) => (b.names ?? []).join(", ")).join(" · ") || undefined,
      teams,
      events,
    };
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    let sport = url.searchParams.get("sport") ?? "all";
    let liveOnly = url.searchParams.get("live") === "true";
    let cricketLeague = url.searchParams.get("cricketLeague") ?? "";
    let format = url.searchParams.get("format") ?? "";
    let action = url.searchParams.get("action") ?? "list";
    let id = url.searchParams.get("id") ?? "";
    let leagueId = url.searchParams.get("leagueId") ?? "";

    if (req.method === "POST") {
      try {
        const b = await req.json();
        sport = b.sport ?? sport;
        liveOnly = b.live ?? liveOnly;
        cricketLeague = b.cricketLeague ?? cricketLeague;
        format = b.format ?? format;
        action = b.action ?? action;
        id = b.id ?? id;
        leagueId = b.leagueId ?? leagueId;
      } catch {}
    }

    if (action === "details" && id && leagueId) {
      const details = sport === "cricket"
        ? await cricketDetails(leagueId, id)
        : await genericDetails(sport, leagueId, id);
      return new Response(JSON.stringify({ details }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let matches: Match[] = [];
    if (sport === "all") matches = await fetchAll();
    else if (sport === "cricket") matches = await fetchCricket(cricketLeague || undefined);
    else matches = await fetchEspn(sport);

    if (liveOnly) matches = matches.filter(m => m.isLive);
    if (sport === "cricket" && format) matches = matches.filter(m => (m.format ?? "").toLowerCase() === format.toLowerCase());

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
