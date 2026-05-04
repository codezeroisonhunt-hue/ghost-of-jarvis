import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CloudSun, Wind, Droplets, MapPin, Loader2 } from "lucide-react";

interface Wx {
  place: { name: string; admin1?: string };
  current: { temp: number; feels: number; humidity: number; wind: number; icon: string; label: string };
  air: { aqi: number; label: string; color: string } | null;
}

export default function WeatherDashboardCard({ onOpen }: { onOpen?: () => void }) {
  const [data, setData] = useState<Wx | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("Bengaluru");

  const load = async (q: string, coords?: { lat: number; lon: number }) => {
    setLoading(true);
    try {
      const { data: res } = await supabase.functions.invoke("weather", {
        body: coords ? { query: q, lat: coords.lat, lon: coords.lon } : { query: q },
      });
      if (res && !res.error) setData(res);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => load("Here", { lat: p.coords.latitude, lon: p.coords.longitude }),
        () => load(city),
        { timeout: 4000 },
      );
    } else load(city);
    const t = window.setInterval(() => load(city), 60000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line
  }, []);

  return (
    <button
      onClick={onOpen}
      className="glass-panel p-4 w-full text-left relative overflow-hidden hover:border-primary/60 transition group"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center text-2xl">
            {loading && !data ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : data?.current.icon}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] tracking-widest text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {data?.place.name || city}
            </div>
            <div className="text-lg font-bold neon-text leading-tight">
              {data ? `${Math.round(data.current.temp)}°C` : "—"}
              <span className="text-xs font-normal text-muted-foreground ml-2">{data?.current.label}</span>
            </div>
            <div className="text-[10px] text-muted-foreground flex gap-2 mt-0.5">
              <span className="flex items-center gap-1"><Droplets className="h-3 w-3" />{data?.current.humidity ?? "—"}%</span>
              <span className="flex items-center gap-1"><Wind className="h-3 w-3" />{data ? Math.round(data.current.wind) : "—"} km/h</span>
            </div>
          </div>
        </div>
        {data?.air && (
          <div className="text-right shrink-0">
            <div className="text-[10px] tracking-widest text-muted-foreground">AQI</div>
            <div className="text-xl font-bold" style={{ color: data.air.color }}>{Math.round(data.air.aqi)}</div>
            <div className="text-[10px]" style={{ color: data.air.color }}>{data.air.label}</div>
          </div>
        )}
      </div>
      <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
        <CloudSun className="h-3 w-3 text-primary" /> Tap for hourly, 7-day & full air report
      </div>
    </button>
  );
}
