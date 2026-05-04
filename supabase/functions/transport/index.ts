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
