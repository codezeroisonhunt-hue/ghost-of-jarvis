import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Globe2, Activity, Satellite, Rocket, RefreshCw } from "lucide-react";

const REFRESH_MS = 30_000;
type Tab = "quakes" | "iss" | "launches";

export default function EarthPulseModule() {
  const [tab, setTab] = useState<Tab>("quakes");
  return (
    <div className="animate-fade-in space-y-4">
      <div className="glass-panel p-4 md:p-6 scan-sweep">
        <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-1">MODULE</div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Globe2 className="h-6 w-6 text-primary" /> Earth Pulse
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn icon={Activity} label="Earthquakes" active={tab==="quakes"} onClick={()=>setTab("quakes")} />
          <Btn icon={Satellite} label="ISS Live" active={tab==="iss"} onClick={()=>setTab("iss")} />
          <Btn icon={Rocket} label="Launches" active={tab==="launches"} onClick={()=>setTab("launches")} />
        </div>
      </div>
      {tab === "quakes" && <Quakes />}
      {tab === "iss" && <ISS />}
      {tab === "launches" && <Launches />}
    </div>
  );
}

function Btn({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono border transition
        ${active ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function magColor(m: number) {
  if (m >= 6) return "text-red-400";
  if (m >= 5) return "text-orange-400";
  if (m >= 4) return "text-yellow-400";
  return "text-primary";
}

function Quakes() {
  const [period, setPeriod] = useState("day");
  const [min, setMin] = useState("2.5");
  const [list, setList] = useState<any[]>([]);
  const [updated, setUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("earth-pulse", {
          body: { action: "quakes", period, min },
        });
        if (error) throw error;
        if (data.error) throw new Error(data.error);
        if (!cancel) { setList(data.quakes || []); setUpdated(data.updatedAt); setErr(null); }
      } catch (e: any) { if (!cancel) setErr(e.message); }
      finally { if (!cancel) setLoading(false); }
    }
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { cancel = true; clearInterval(id); };
  }, [period, min]);

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold tracking-widest text-primary">SEISMIC ACTIVITY</h2>
        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}/>
          {updated ? new Date(updated).toLocaleTimeString() : "syncing…"}
        </span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <select value={period} onChange={e=>setPeriod(e.target.value)}
          className="bg-card/40 border border-border rounded-md px-2 py-1.5 text-xs font-mono">
          <option value="hour">Past hour</option>
          <option value="day">Past day</option>
          <option value="week">Past week</option>
          <option value="month">Past month</option>
        </select>
        <select value={min} onChange={e=>setMin(e.target.value)}
          className="bg-card/40 border border-border rounded-md px-2 py-1.5 text-xs font-mono">
          <option value="all">All</option>
          <option value="1.0">M 1.0+</option>
          <option value="2.5">M 2.5+</option>
          <option value="4.5">M 4.5+</option>
          <option value="significant">Significant</option>
        </select>
      </div>
      {err && <div className="text-xs text-accent">⚠ {err}</div>}
      <div className="space-y-1.5 max-h-[55vh] overflow-y-auto">
        {list.map((q) => (
          <a key={q.id} href={q.url} target="_blank" rel="noreferrer"
            className="block rounded-lg border border-primary/20 bg-card/40 p-2.5 hover:border-primary/50 transition">
            <div className="flex items-center justify-between gap-2">
              <div className={`font-mono font-bold text-lg ${magColor(q.mag)}`}>M{q.mag?.toFixed(1)}</div>
              <div className="text-[10px] font-mono text-muted-foreground">
                {new Date(q.time).toLocaleString()}
              </div>
            </div>
            <div className="text-xs truncate">{q.place}</div>
            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
              {q.lat?.toFixed(2)}, {q.lon?.toFixed(2)} · depth {q.depth?.toFixed(0)}km
              {q.tsunami ? <span className="ml-2 text-red-400">TSUNAMI</span> : ""}
            </div>
          </a>
        ))}
        {!loading && list.length === 0 && <div className="text-xs text-muted-foreground py-4">No events.</div>}
      </div>
    </div>
  );
}

function ISS() {
  const [data, setData] = useState<any>(null);
  const [updated, setUpdated] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    async function load() {
      try {
        const { data: r, error } = await supabase.functions.invoke("earth-pulse", { body: { action: "iss" } });
        if (error) throw error;
        if (r.error) throw new Error(r.error);
        if (!cancel) { setData(r.iss); setUpdated(r.updatedAt); setErr(null); }
      } catch (e: any) { if (!cancel) setErr(e.message); }
    }
    load();
    const id = setInterval(load, 5000);
    return () => { cancel = true; clearInterval(id); };
  }, []);

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-widest text-primary">INTERNATIONAL SPACE STATION</h2>
        <span className="text-[10px] font-mono text-muted-foreground">
          {updated ? new Date(updated).toLocaleTimeString() : "syncing…"}
        </span>
      </div>
      {err && <div className="text-xs text-accent">⚠ {err}</div>}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="LAT" value={`${data.lat.toFixed(3)}°`} />
            <Stat label="LON" value={`${data.lon.toFixed(3)}°`} />
            <Stat label="ALT" value={`${data.altitude.toFixed(1)} km`} />
            <Stat label="VEL" value={`${data.velocity.toFixed(0)} km/h`} />
            <Stat label="VISIBILITY" value={data.visibility} />
            <Stat label="STATUS" value="OPERATIONAL" />
          </div>
          <a target="_blank" rel="noreferrer"
            href={`https://www.openstreetmap.org/?mlat=${data.lat}&mlon=${data.lon}&zoom=4`}
            className="block text-center text-xs font-mono text-primary border border-primary/40 rounded-md py-2 hover:bg-primary/10 transition">
            VIEW ON MAP →
          </a>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-primary/20 bg-card/40 p-3">
      <div className="text-[10px] tracking-widest text-muted-foreground">{label}</div>
      <div className="text-lg font-mono text-primary truncate">{value}</div>
    </div>
  );
}

function Launches() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("earth-pulse", { body: { action: "launches" } });
        if (error) throw error;
        if (data.error) throw new Error(data.error);
        if (!cancel) setList(data.launches || []);
      } catch (e: any) { if (!cancel) setErr(e.message); }
      finally { if (!cancel) setLoading(false); }
    })();
    return () => { cancel = true; };
  }, []);

  return (
    <div className="glass-panel p-4 space-y-3">
      <h2 className="text-sm font-semibold tracking-widest text-primary">UPCOMING LAUNCHES</h2>
      {err && <div className="text-xs text-accent">⚠ {err}</div>}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {list.map((l) => (
          <div key={l.id} className="rounded-lg border border-primary/20 bg-card/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="font-mono font-semibold text-sm truncate">{l.name}</div>
              <span className="text-[10px] font-mono text-primary whitespace-nowrap">{l.status}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 truncate">{l.provider}</div>
            <div className="text-[10px] font-mono text-muted-foreground mt-1">
              {new Date(l.net).toLocaleString()} · {l.pad}
              {l.location ? ` · ${l.location}` : ""}
            </div>
          </div>
        ))}
        {!loading && list.length === 0 && <div className="text-xs text-muted-foreground py-4">No upcoming launches.</div>}
      </div>
    </div>
  );
}
