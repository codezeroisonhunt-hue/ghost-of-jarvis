import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// India bounding box
const INDIA_BBOX = { lamin: 6, lomin: 68, lamax: 37, lomax: 97 };

async function fetchFlights(bbox = INDIA_BBOX) {
  const url = `https://opensky-network.org/api/states/all?lamin=${bbox.lamin}&lomin=${bbox.lomin}&lamax=${bbox.lamax}&lomax=${bbox.lomax}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenSky ${res.status}`);
  const json = await res.json();
  const states: any[] = json?.states ?? [];
  return states.slice(0, 60).map((s) => ({
    icao24: s[0],
    callsign: (s[1] || "").trim(),
    country: s[2],
    lon: s[5],
    lat: s[6],
    altitude: s[7], // baro altitude m
    onGround: s[8],
    velocity: s[9], // m/s
    heading: s[10],
    geoAltitude: s[13],
  })).filter((f) => f.lat && f.lon);
}

// erail.in keyless trains-between-stations
async function fetchTrains(from: string, to: string) {
  const url = `https://erail.in/rail/getTrains.aspx?Station_From=${encodeURIComponent(from)}&Station_To=${encodeURIComponent(to)}&DataSource=0&Language=0&Cache=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`erail ${res.status}`);
  const text = await res.text();
  // Format is pipe-delimited rows separated by ~~~~~~~~
  const rows = text.split("~~~~~~~~").filter(Boolean);
  const trains = rows.map((row) => {
    const parts = row.split("~").filter((p) => p !== "");
    if (parts.length < 10) return null;
    return {
      number: parts[0],
      name: parts[1],
      from: parts[2],
      fromName: parts[3],
      to: parts[4],
      toName: parts[5],
      depart: parts[6],
      arrive: parts[7],
      duration: parts[8],
      runningDays: parts[9],
    };
  }).filter(Boolean);
  return trains.slice(0, 30);
}

// Train schedule / route via erail
async function fetchTrainSchedule(trainNo: string) {
  const url = `https://erail.in/data.aspx?Action=TRAINROUTE&Password=2012&Data1=${encodeURIComponent(trainNo)}&Data2=`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`erail ${res.status}`);
  const text = await res.text();
  const rows = text.split("~^").filter(Boolean);
  const stops = rows.map((row) => {
    const p = row.split("~").filter((x) => x !== "");
    if (p.length < 7) return null;
    return {
      sno: p[0], code: p[1], name: p[2], arrive: p[3], depart: p[4],
      day: p[5], distance: p[6],
    };
  }).filter(Boolean);
  return stops;
}

// Train info / search by name or number via erail
async function fetchTrainInfo(query: string) {
  const url = `https://erail.in/rail/getTrains.aspx?TrainNo=${encodeURIComponent(query)}&DataSource=0&Language=0&Cache=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`erail ${res.status}`);
  const text = await res.text();
  const rows = text.split("~~~~~~~~").filter(Boolean);
  return rows.map((row) => {
    const p = row.split("~").filter((x) => x !== "");
    if (p.length < 10) return null;
    return {
      number: p[0], name: p[1], from: p[2], fromName: p[3],
      to: p[4], toName: p[5], depart: p[6], arrive: p[7],
      duration: p[8], runningDays: p[9],
    };
  }).filter(Boolean).slice(0, 20);
}

// Live running status via confirmtkt (keyless public)
async function fetchLiveStatus(trainNo: string, date?: string) {
  // date format dd-mm-yyyy; default today IST
  const d = date || (() => {
    const now = new Date(Date.now() + 5.5 * 3600 * 1000);
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    return `${dd}-${mm}-${now.getUTCFullYear()}`;
  })();
  const url = `https://www.confirmtkt.com/rest-v2/api/trains/runningstatus/${encodeURIComponent(trainNo)}?doj=${d}&source=&locale=en`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } });
  if (!res.ok) throw new Error(`live ${res.status}`);
  const json = await res.json();
  return json;
}

// PNR status via confirmtkt (keyless)
async function fetchPNR(pnr: string) {
  const url = `https://securedapi.confirmtkt.com/api/platform/pnrstatus/v3?pnr=${encodeURIComponent(pnr)}&source=trains&packageId=PRO_PLAN`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } });
  if (!res.ok) throw new Error(`pnr ${res.status}`);
  return await res.json();
}

// Live station — trains arriving/departing within window via erail
async function fetchStationLive(code: string, hours = 2) {
  const url = `https://erail.in/rail/getLiveStation.aspx?Station=${encodeURIComponent(code)}&HoursToDeparture=${hours}&HoursToArrival=${hours}&DataSource=0&Language=0&Cache=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`erail ${res.status}`);
  const text = await res.text();
  const rows = text.split("~~~~~~~~").filter(Boolean);
  return rows.map((row) => {
    const p = row.split("~").filter((x) => x !== "");
    if (p.length < 8) return null;
    return {
      number: p[0], name: p[1], from: p[2], to: p[3],
      arrive: p[4], depart: p[5], delay: p[6] || "RT", platform: p[7] || "—",
    };
  }).filter(Boolean).slice(0, 40);
}

// OSRM routing - keyless public demo server
async function fetchRoute(fromLat: number, fromLon: number, toLat: number, toLon: number) {
  const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=false&alternatives=false&steps=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const json = await res.json();
  const r = json?.routes?.[0];
  if (!r) throw new Error("No route");
  return {
    distanceKm: +(r.distance / 1000).toFixed(1),
    durationMin: +(r.duration / 60).toFixed(0),
  };
}

// Geocoding with Open-Meteo (keyless)
async function geocode(name: string) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`geo ${res.status}`);
  const json = await res.json();
  const r = json?.results?.[0];
  if (!r) throw new Error(`Location not found: ${name}`);
  return { lat: r.latitude, lon: r.longitude, name: r.name, country: r.country };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = body.action || url.searchParams.get("action") || "flights";

    if (action === "flights") {
      const flights = await fetchFlights();
      return new Response(JSON.stringify({ flights, updatedAt: new Date().toISOString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "trains") {
      const from = body.from || url.searchParams.get("from");
      const to = body.to || url.searchParams.get("to");
      if (!from || !to) throw new Error("from & to station codes required");
      const trains = await fetchTrains(from, to);
      return new Response(JSON.stringify({ trains, updatedAt: new Date().toISOString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "traffic") {
      const from = body.from || url.searchParams.get("from");
      const to = body.to || url.searchParams.get("to");
      if (!from || !to) throw new Error("from & to required");
      const [a, b] = await Promise.all([geocode(from), geocode(to)]);
      const route = await fetchRoute(a.lat, a.lon, b.lat, b.lon);
      return new Response(JSON.stringify({ from: a, to: b, route, updatedAt: new Date().toISOString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    const msg = String((e as Error).message || e);
    const notFound = /not found/i.test(msg);
    return new Response(JSON.stringify({ error: msg, fallback: notFound }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
