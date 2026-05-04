import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plane, Train, Navigation, RefreshCw, MapPin } from "lucide-react";

const REFRESH_MS = 30_000;

type Tab = "flights" | "trains" | "traffic";

interface Flight {
  icao24: string; callsign: string; country: string;
  lat: number; lon: number; altitude: number; velocity: number; heading: number; onGround: boolean;
}
interface Train {
  number: string; name: string; from: string; fromName: string; to: string; toName: string;
  depart: string; arrive: string; duration: string; runningDays: string;
}

export default function TransportModule() {
  const [tab, setTab] = useState<Tab>("flights");
  return (
    <div className="animate-fade-in space-y-4">
      <div className="glass-panel p-4 md:p-6 scan-sweep">
        <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-1">MODULE</div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Navigation className="h-6 w-6 text-primary" /> Transport Live
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <TabBtn icon={Plane} label="Flights" active={tab==="flights"} onClick={()=>setTab("flights")} />
          <TabBtn icon={Train} label="Trains" active={tab==="trains"} onClick={()=>setTab("trains")} />
          <TabBtn icon={MapPin} label="Traffic" active={tab==="traffic"} onClick={()=>setTab("traffic")} />
        </div>
      </div>
      {tab === "flights" && <FlightsView />}
      {tab === "trains" && <TrainsView />}
      {tab === "traffic" && <TrafficView />}
    </div>
  );
}

function TabBtn({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono border transition
        ${active ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function FlightsView() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [updated, setUpdated] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data, error } = await supabase.functions.invoke("transport", { body: { action: "flights" } });
        if (error) throw error;
        if (data.error) throw new Error(data.error);
        if (!cancelled) { setFlights(data.flights || []); setUpdated(data.updatedAt); setErr(null); }
      } catch (e: any) { if (!cancelled) setErr(e.message); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold tracking-widest text-primary">FLIGHTS OVER INDIA</h2>
        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}/>
          {updated ? new Date(updated).toLocaleTimeString() : "syncing…"}
        </span>
      </div>
      {err && <div className="text-xs text-accent mb-2">⚠ {err}</div>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
        {flights.map((f) => (
          <div key={f.icao24} className="rounded-lg border border-primary/20 bg-card/40 p-3">
            <div className="flex items-center justify-between">
              <div className="font-mono font-semibold text-sm">{f.callsign || f.icao24}</div>
              <span className={`text-[10px] font-mono ${f.onGround ? "text-muted-foreground" : "text-primary"}`}>
                {f.onGround ? "GND" : "AIR"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground truncate">{f.country}</div>
            <div className="mt-1 grid grid-cols-3 gap-1 text-[10px] font-mono">
              <div><span className="text-muted-foreground">ALT</span> {f.altitude ? Math.round(f.altitude) + "m" : "—"}</div>
              <div><span className="text-muted-foreground">SPD</span> {f.velocity ? Math.round(f.velocity * 3.6) + "kmh" : "—"}</div>
              <div><span className="text-muted-foreground">HDG</span> {f.heading ? Math.round(f.heading) + "°" : "—"}</div>
            </div>
          </div>
        ))}
        {!loading && flights.length === 0 && <div className="text-xs text-muted-foreground py-4">No live flights.</div>}
      </div>
    </div>
  );
}

function TrainsView() {
  const [from, setFrom] = useState("NDLS");
  const [to, setTo] = useState("BCT");
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function search() {
    setLoading(true); setErr(null);
    try {
      const { data, error } = await supabase.functions.invoke("transport", {
        body: { action: "trains", from: from.toUpperCase(), to: to.toUpperCase() },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setTrains(data.trains || []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { search(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="glass-panel p-4 space-y-3">
      <h2 className="text-sm font-semibold tracking-widest text-primary">INDIAN TRAINS</h2>
      <div className="flex gap-2 flex-wrap">
        <input value={from} onChange={e=>setFrom(e.target.value)} placeholder="FROM (e.g. NDLS)"
          className="bg-card/40 border border-border rounded-md px-3 py-1.5 text-sm font-mono w-32"/>
        <input value={to} onChange={e=>setTo(e.target.value)} placeholder="TO (e.g. BCT)"
          className="bg-card/40 border border-border rounded-md px-3 py-1.5 text-sm font-mono w-32"/>
        <button onClick={search}
          className="px-3 py-1.5 rounded-md text-xs font-mono border border-primary text-primary bg-primary/10 hover:bg-primary/20 transition">
          {loading ? "Searching…" : "Search"}
        </button>
      </div>
      {err && <div className="text-xs text-accent">⚠ {err}</div>}
      <div className="space-y-2 max-h-[55vh] overflow-y-auto">
        {trains.map((t) => (
          <div key={t.number} className="rounded-lg border border-primary/20 bg-card/40 p-3">
            <div className="flex items-center justify-between">
              <div className="font-mono font-semibold text-sm">{t.number} · {t.name}</div>
              <div className="text-[10px] font-mono text-muted-foreground">{t.duration}</div>
            </div>
            <div className="text-xs mt-1 flex items-center gap-2 flex-wrap">
              <span className="font-mono text-primary">{t.depart}</span>
              <span className="text-muted-foreground">{t.fromName}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-mono text-primary">{t.arrive}</span>
              <span className="text-muted-foreground">{t.toName}</span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground mt-1">Runs: {t.runningDays}</div>
          </div>
        ))}
        {!loading && trains.length === 0 && !err && <div className="text-xs text-muted-foreground py-4">No trains found. Use station codes (NDLS, BCT, MAS, HWH).</div>}
      </div>
    </div>
  );
}

function TrafficView() {
  const [from, setFrom] = useState("Mumbai");
  const [to, setTo] = useState("Pune");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setLoading(true); setErr(null);
    try {
      const { data, error } = await supabase.functions.invoke("transport", {
        body: { action: "traffic", from, to },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { go(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="glass-panel p-4 space-y-3">
      <h2 className="text-sm font-semibold tracking-widest text-primary">ROUTE & TRAVEL TIME</h2>
      <div className="flex gap-2 flex-wrap">
        <input value={from} onChange={e=>setFrom(e.target.value)} placeholder="From city"
          className="bg-card/40 border border-border rounded-md px-3 py-1.5 text-sm w-40"/>
        <input value={to} onChange={e=>setTo(e.target.value)} placeholder="To city"
          className="bg-card/40 border border-border rounded-md px-3 py-1.5 text-sm w-40"/>
        <button onClick={go}
          className="px-3 py-1.5 rounded-md text-xs font-mono border border-primary text-primary bg-primary/10 hover:bg-primary/20 transition">
          {loading ? "Routing…" : "Go"}
        </button>
      </div>
      {err && <div className="text-xs text-accent">⚠ {err}</div>}
      {result?.route && (
        <div className="rounded-lg border border-primary/20 bg-card/40 p-4">
          <div className="text-xs text-muted-foreground">{result.from.name} → {result.to.name}</div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] tracking-widest text-muted-foreground">DISTANCE</div>
              <div className="text-2xl font-mono text-primary">{result.route.distanceKm} km</div>
            </div>
            <div>
              <div className="text-[10px] tracking-widest text-muted-foreground">EST. TIME</div>
              <div className="text-2xl font-mono text-primary">
                {Math.floor(result.route.durationMin / 60)}h {result.route.durationMin % 60}m
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
