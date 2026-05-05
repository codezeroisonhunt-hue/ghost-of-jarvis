import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function quakes(period = "day", min = "2.5") {
  // period: hour | day | week | month, min: all | 1.0 | 2.5 | 4.5 | significant
  const url = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${min}_${period}.geojson`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`USGS ${r.status}`);
  const j = await r.json();
  const features = (j.features || []).map((f: any) => ({
    id: f.id,
    mag: f.properties.mag,
    place: f.properties.place,
    time: f.properties.time,
    tsunami: f.properties.tsunami,
    url: f.properties.url,
    lon: f.geometry?.coordinates?.[0],
    lat: f.geometry?.coordinates?.[1],
    depth: f.geometry?.coordinates?.[2],
  }));
  return { count: features.length, quakes: features.slice(0, 80) };
}

async function iss() {
  const r = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
  if (!r.ok) throw new Error(`ISS ${r.status}`);
  const j = await r.json();
  return {
    lat: j.latitude, lon: j.longitude, altitude: j.altitude,
    velocity: j.velocity, visibility: j.visibility, timestamp: j.timestamp,
  };
}

async function launches() {
  const r = await fetch("https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=15&mode=list");
  if (!r.ok) throw new Error(`LL2 ${r.status}`);
  const j = await r.json();
  return (j.results || []).map((l: any) => ({
    id: l.id, name: l.name, status: l.status?.name,
    net: l.net, provider: l.launch_service_provider?.name,
    pad: l.pad?.name, location: l.pad?.location?.name,
    image: l.image,
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = body.action || url.searchParams.get("action") || "quakes";

    if (action === "quakes") {
      const period = body.period || url.searchParams.get("period") || "day";
      const min = body.min || url.searchParams.get("min") || "2.5";
      const data = await quakes(period, min);
      return new Response(JSON.stringify({ ...data, updatedAt: new Date().toISOString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (action === "iss") {
      const data = await iss();
      return new Response(JSON.stringify({ iss: data, updatedAt: new Date().toISOString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (action === "launches") {
      const data = await launches();
      return new Response(JSON.stringify({ launches: data, updatedAt: new Date().toISOString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
