import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CloudSun, RefreshCw, Search, MapPin, Wind, Droplets, Gauge, Sun, Loader2, Radio } from "lucide-react";

interface WxData {
  place: { name: string; country: string; admin1?: string };
  coords: { lat: number; lon: number };
  current: any;
  hourly: any[];
  daily: any[];
  air: any | null;
  updatedAt: string;
}

const PRESETS = ["Bengaluru", "Mumbai", "Delhi", "Chennai", "Kolkata", "Hyderabad", "Pune"];

const fmtIST = (iso: string, opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", ...opts });

export default function WeatherModule() {
  const [query, setQuery] = useState("Bengaluru");
  const [input, setInput] = useState("Bengaluru");
  const [data, setData] = useState<WxData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const timer = useRef<number | null>(null);

  const load = async (q?: string, coords?: { lat: number; lon: number }) => {
    setLoading(true); setErr(null);
    try {
      const { data: res, error } = await supabase.functions.invoke("weather", {
        body: coords ? { query: q || "Here", lat: coords.lat, lon: coords.lon } : { query: q || query },
      });
      if (error) throw error;
      if (res?.error) throw new Error(res.error);
      setData(res);
    } catch (e: any) { setErr(e.message || "Failed to load weather"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(query); /* eslint-disable-next-line */ }, [query]);

  useEffect(() => {
    if (!live) return;
    timer.current = window.setInterval(() => load(query), 60000);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [live, query]);

  const useGeo = () => {
    if (!navigator.geolocation) { setErr("Geolocation unsupported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => load("Current Location", { lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setErr("Location permission denied"),
    );
  };

  const submit = (e: React.FormEvent) => { e.preventDefault(); if (input.trim()) setQuery(input.trim()); };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CloudSun className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Live Weather + Air Quality</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLive((v) => !v)} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border ${live ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
            <Radio className={`h-3 w-3 ${live ? "animate-pulse" : ""}`} /> {live ? "LIVE" : "PAUSED"}
          </button>
          <button onClick={() => load(query)} className="p-2 rounded-md border border-border hover:border-primary">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={submit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search city…"
            className="w-full pl-8 pr-3 py-2 rounded-md bg-background border border-border focus:border-primary outline-none text-sm"
          />
        </div>
        <button type="submit" className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm">Go</button>
        <button type="button" onClick={useGeo} className="px-2 py-2 rounded-md border border-border hover:border-primary" title="Use my location">
          <MapPin className="h-4 w-4" />
        </button>
      </form>

      {/* Presets */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PRESETS.map((p) => (
          <button key={p} onClick={() => { setInput(p); setQuery(p); }} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border ${query === p ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
            {p}
          </button>
        ))}
      </div>

      {err && <div className="p-3 rounded-md border border-destructive/50 text-destructive text-sm">{err}</div>}

      {!data && loading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Syncing…</div>
      )}

      {data && (
        <>
          {/* Current */}
          <div className="rounded-xl border border-primary/30 bg-card/50 p-4 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">{data.place.admin1 ? `${data.place.admin1}, ` : ""}{data.place.country}</div>
                <h3 className="text-xl font-bold">{data.place.name}</h3>
                <div className="text-xs text-muted-foreground">Updated {fmtIST(data.updatedAt)} IST</div>
              </div>
              <div className="text-right">
                <div className="text-5xl">{data.current.icon}</div>
                <div className="text-xs text-muted-foreground">{data.current.label}</div>
              </div>
            </div>
            <div className="flex items-end gap-3 mt-3">
              <div className="text-5xl font-bold text-primary">{Math.round(data.current.temp)}°</div>
              <div className="text-sm text-muted-foreground pb-2">Feels {Math.round(data.current.feels)}°C</div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4 text-xs">
              <div className="rounded-md bg-background/50 p-2 text-center">
                <Droplets className="h-4 w-4 mx-auto mb-1 text-primary" />
                <div className="font-semibold">{data.current.humidity}%</div>
                <div className="text-muted-foreground">Humidity</div>
              </div>
              <div className="rounded-md bg-background/50 p-2 text-center">
                <Wind className="h-4 w-4 mx-auto mb-1 text-primary" />
                <div className="font-semibold">{Math.round(data.current.wind)}</div>
                <div className="text-muted-foreground">km/h</div>
              </div>
              <div className="rounded-md bg-background/50 p-2 text-center">
                <Gauge className="h-4 w-4 mx-auto mb-1 text-primary" />
                <div className="font-semibold">{Math.round(data.current.pressure)}</div>
                <div className="text-muted-foreground">hPa</div>
              </div>
              <div className="rounded-md bg-background/50 p-2 text-center">
                <Sun className="h-4 w-4 mx-auto mb-1 text-primary" />
                <div className="font-semibold">{data.current.cloud}%</div>
                <div className="text-muted-foreground">Cloud</div>
              </div>
            </div>
          </div>

          {/* Air Quality */}
          {data.air && (
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">Air Quality</h4>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: data.air.color + "33", color: data.air.color }}>
                  AQI {Math.round(data.air.aqi)} · {data.air.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  ["PM2.5", data.air.pm25, "µg/m³"],
                  ["PM10", data.air.pm10, "µg/m³"],
                  ["O₃", data.air.o3, "µg/m³"],
                  ["NO₂", data.air.no2, "µg/m³"],
                  ["SO₂", data.air.so2, "µg/m³"],
                  ["CO", data.air.co, "µg/m³"],
                ].map(([l, v, u]) => (
                  <div key={l as string} className="rounded-md bg-background/50 p-2 text-center">
                    <div className="text-muted-foreground">{l}</div>
                    <div className="font-semibold">{v != null ? Math.round(v as number) : "—"}</div>
                    <div className="text-[10px] text-muted-foreground">{u}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hourly */}
          <div className="rounded-xl border border-border bg-card/50 p-3">
            <h4 className="text-sm font-semibold mb-2 px-1">Next 24 Hours</h4>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {data.hourly.map((h, i) => (
                <div key={i} className="flex-shrink-0 w-16 text-center rounded-md bg-background/50 p-2">
                  <div className="text-[10px] text-muted-foreground">{fmtIST(h.time, { hour: "2-digit" })}</div>
                  <div className="text-lg">{h.icon}</div>
                  <div className="text-sm font-semibold">{Math.round(h.temp)}°</div>
                  <div className="text-[10px] text-primary">{h.pop}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily */}
          <div className="rounded-xl border border-border bg-card/50 p-3">
            <h4 className="text-sm font-semibold mb-2 px-1">7-Day Forecast</h4>
            <div className="space-y-1">
              {data.daily.map((d, i) => (
                <div key={i} className="flex items-center justify-between gap-2 px-2 py-2 rounded-md hover:bg-background/50 text-sm">
                  <div className="w-12 text-xs text-muted-foreground">
                    {i === 0 ? "Today" : new Date(d.date).toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" })}
                  </div>
                  <div className="text-xl w-8 text-center">{d.icon}</div>
                  <div className="flex-1 text-xs text-muted-foreground truncate">{d.label}</div>
                  <div className="text-xs text-primary">UV {Math.round(d.uv)}</div>
                  <div className="font-semibold w-16 text-right">
                    <span className="text-muted-foreground">{Math.round(d.tmin)}°</span>
                    <span className="mx-1">/</span>
                    <span>{Math.round(d.tmax)}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
