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

type TrainSub = "search" | "schedule" | "live" | "pnr" | "station";

function TrainsView() {
  const [sub, setSub] = useState<TrainSub>("search");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {([
          ["search","Find Trains"],["schedule","Schedule"],["live","Live Status"],
          ["pnr","PNR"],["station","Station"],
        ] as [TrainSub,string][]).map(([k,l]) => (
          <button key={k} onClick={()=>setSub(k)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono border transition
              ${sub===k ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {l}
          </button>
        ))}
      </div>
      {sub === "search" && <TrainSearch />}
      {sub === "schedule" && <TrainSchedule />}
      {sub === "live" && <TrainLive />}
      {sub === "pnr" && <PNRStatus />}
      {sub === "station" && <StationLive />}
    </div>
  );
}

function TrainSearch() {
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
      <h2 className="text-sm font-semibold tracking-widest text-primary">FIND TRAINS</h2>
      <div className="flex gap-2 flex-wrap">
        <input value={from} onChange={e=>setFrom(e.target.value)} placeholder="FROM (NDLS)"
          className="bg-card/40 border border-border rounded-md px-3 py-1.5 text-sm font-mono w-32"/>
        <input value={to} onChange={e=>setTo(e.target.value)} placeholder="TO (BCT)"
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
        {!loading && trains.length === 0 && !err && <div className="text-xs text-muted-foreground py-4">Use station codes (NDLS, BCT, MAS, HWH).</div>}
      </div>
    </div>
  );
}

function TrainSchedule() {
  const [no, setNo] = useState("12951");
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setLoading(true); setErr(null);
    try {
      const { data, error } = await supabase.functions.invoke("transport", {
        body: { action: "train-schedule", trainNo: no.trim() },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setStops(data.stops || []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="glass-panel p-4 space-y-3">
      <h2 className="text-sm font-semibold tracking-widest text-primary">TRAIN SCHEDULE</h2>
      <div className="flex gap-2">
        <input value={no} onChange={e=>setNo(e.target.value)} placeholder="Train No"
          className="bg-card/40 border border-border rounded-md px-3 py-1.5 text-sm font-mono w-32"/>
        <button onClick={go}
          className="px-3 py-1.5 rounded-md text-xs font-mono border border-primary text-primary bg-primary/10 hover:bg-primary/20 transition">
          {loading ? "Loading…" : "Show"}
        </button>
      </div>
      {err && <div className="text-xs text-accent">⚠ {err}</div>}
      <div className="space-y-1 max-h-[55vh] overflow-y-auto">
        {stops.map((s: any) => (
          <div key={s.sno} className="grid grid-cols-12 gap-2 text-xs font-mono border-b border-border/50 py-1.5">
            <div className="col-span-1 text-muted-foreground">{s.sno}</div>
            <div className="col-span-2 text-primary">{s.code}</div>
            <div className="col-span-5 truncate">{s.name}</div>
            <div className="col-span-2">{s.arrive}</div>
            <div className="col-span-2 text-right text-muted-foreground">{s.distance}km</div>
          </div>
        ))}
        {!loading && stops.length===0 && !err && <div className="text-xs text-muted-foreground py-4">Enter a train number (e.g. 12951).</div>}
      </div>
    </div>
  );
}

function TrainLive() {
  const [no, setNo] = useState("12951");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setLoading(true); setErr(null); setData(null);
    try {
      const { data: r, error } = await supabase.functions.invoke("transport", {
        body: { action: "train-live", trainNo: no.trim() },
      });
      if (error) throw error;
      if (r.error) throw new Error(r.error);
      setData(r.live);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  const stations: any[] = data?.stations || data?.data?.stations || [];
  const current = data?.current_station || data?.currentStation;

  return (
    <div className="glass-panel p-4 space-y-3">
      <h2 className="text-sm font-semibold tracking-widest text-primary">LIVE RUNNING STATUS</h2>
      <div className="flex gap-2">
        <input value={no} onChange={e=>setNo(e.target.value)} placeholder="Train No"
          className="bg-card/40 border border-border rounded-md px-3 py-1.5 text-sm font-mono w-32"/>
        <button onClick={go}
          className="px-3 py-1.5 rounded-md text-xs font-mono border border-primary text-primary bg-primary/10 hover:bg-primary/20 transition">
          {loading ? "Tracking…" : "Track"}
        </button>
      </div>
      {err && <div className="text-xs text-accent">⚠ {err}</div>}
      {data && (
        <div className="space-y-2">
          {(data.train_name || data.trainName) && (
            <div className="text-xs text-muted-foreground">
              <span className="text-primary font-mono">{data.train_number || data.trainNumber}</span> {data.train_name || data.trainName}
              {current && <span className="ml-2">· at <span className="text-primary">{current}</span></span>}
            </div>
          )}
          <div className="space-y-1 max-h-[50vh] overflow-y-auto">
            {stations.map((s: any, i: number) => (
              <div key={i} className="grid grid-cols-12 gap-2 text-xs font-mono border-b border-border/50 py-1.5">
                <div className="col-span-2 text-primary">{s.stationCode || s.station_code || s.code}</div>
                <div className="col-span-5 truncate">{s.stationName || s.station_name || s.name}</div>
                <div className="col-span-2">{s.arrivalTime || s.actArr || s.actual_arrival || "—"}</div>
                <div className="col-span-3 text-right text-muted-foreground">{s.delayArr || s.delay || s.status || ""}</div>
              </div>
            ))}
            {stations.length === 0 && <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap">{JSON.stringify(data, null, 2).slice(0, 800)}</pre>}
          </div>
        </div>
      )}
    </div>
  );
}

function PNRStatus() {
  const [pnr, setPnr] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setLoading(true); setErr(null); setData(null);
    try {
      const { data: r, error } = await supabase.functions.invoke("transport", {
        body: { action: "pnr", pnr: pnr.trim() },
      });
      if (error) throw error;
      if (r.error) throw new Error(r.error);
      setData(r.data);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  const passengers: any[] = data?.passengerList || data?.data?.passengerList || [];

  return (
    <div className="glass-panel p-4 space-y-3">
      <h2 className="text-sm font-semibold tracking-widest text-primary">PNR STATUS</h2>
      <div className="flex gap-2">
        <input value={pnr} onChange={e=>setPnr(e.target.value)} placeholder="10-digit PNR" maxLength={10}
          className="bg-card/40 border border-border rounded-md px-3 py-1.5 text-sm font-mono w-44"/>
        <button onClick={go}
          className="px-3 py-1.5 rounded-md text-xs font-mono border border-primary text-primary bg-primary/10 hover:bg-primary/20 transition">
          {loading ? "Checking…" : "Check"}
        </button>
      </div>
      {err && <div className="text-xs text-accent">⚠ {err}</div>}
      {data && (
        <div className="space-y-2 text-xs">
          <div className="text-muted-foreground">
            <span className="text-primary font-mono">{data.trainNumber || data.trainNo}</span> {data.trainName} · {data.boardingPoint || data.from} → {data.reservationUpto || data.to}
            <span className="ml-2">{data.dateOfJourney || data.doj}</span>
          </div>
          <div className="space-y-1 max-h-[50vh] overflow-y-auto">
            {passengers.map((p: any, i: number) => (
              <div key={i} className="grid grid-cols-12 gap-2 font-mono border-b border-border/50 py-1.5">
                <div className="col-span-1">#{p.passengerSerialNumber || i+1}</div>
                <div className="col-span-5 text-muted-foreground">Booked: {p.bookingStatus || p.bookingStatusDetails}</div>
                <div className="col-span-6 text-right text-primary">Now: {p.currentStatus || p.currentStatusDetails}</div>
              </div>
            ))}
            {passengers.length === 0 && <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap">{JSON.stringify(data, null, 2).slice(0, 800)}</pre>}
          </div>
        </div>
      )}
    </div>
  );
}

function StationLive() {
  const [code, setCode] = useState("NDLS");
  const [hours, setHours] = useState(2);
  const [trains, setTrains] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setLoading(true); setErr(null);
    try {
      const { data, error } = await supabase.functions.invoke("transport", {
        body: { action: "station-live", code: code.toUpperCase(), hours },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setTrains(data.trains || []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="glass-panel p-4 space-y-3">
      <h2 className="text-sm font-semibold tracking-widest text-primary">LIVE AT STATION</h2>
      <div className="flex gap-2 flex-wrap">
        <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Station code"
          className="bg-card/40 border border-border rounded-md px-3 py-1.5 text-sm font-mono w-32"/>
        <select value={hours} onChange={e=>setHours(Number(e.target.value))}
          className="bg-card/40 border border-border rounded-md px-2 py-1.5 text-sm font-mono">
          {[1,2,4,6,8].map(h => <option key={h} value={h}>{h}h window</option>)}
        </select>
        <button onClick={go}
          className="px-3 py-1.5 rounded-md text-xs font-mono border border-primary text-primary bg-primary/10 hover:bg-primary/20 transition">
          {loading ? "Loading…" : "Show"}
        </button>
      </div>
      {err && <div className="text-xs text-accent">⚠ {err}</div>}
      <div className="space-y-1 max-h-[55vh] overflow-y-auto">
        {trains.map((t: any) => (
          <div key={t.number} className="grid grid-cols-12 gap-2 text-xs font-mono border-b border-border/50 py-1.5">
            <div className="col-span-2 text-primary">{t.number}</div>
            <div className="col-span-4 truncate">{t.name}</div>
            <div className="col-span-2">{t.arrive}/{t.depart}</div>
            <div className="col-span-2 text-muted-foreground">PF {t.platform}</div>
            <div className="col-span-2 text-right text-accent">{t.delay}</div>
          </div>
        ))}
        {!loading && trains.length===0 && !err && <div className="text-xs text-muted-foreground py-4">Enter a station code (NDLS, BCT, MAS, HWH).</div>}
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
