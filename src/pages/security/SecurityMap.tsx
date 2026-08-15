import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, StatusDot, SeverityBadge } from "@/components/security/SecurityUI";
import type { Camera, SecurityEvent } from "@/lib/security/types";
import { statusColor } from "@/lib/security/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "online" | "offline" | "alerts" | "people" | "vehicles";

export default function SecurityMap() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Camera | null>(null);

  useEffect(() => {
    supabase.from("security_cameras").select("*").then(({ data }) => setCameras((data ?? []) as Camera[]));
    supabase.from("security_events").select("*").order("occurred_at", { ascending: false }).limit(200).then(({ data }) => setEvents((data ?? []) as SecurityEvent[]));
  }, []);

  const visible = useMemo(() => {
    return cameras.filter((c) => {
      if (filter === "online") return c.status === "online";
      if (filter === "offline") return c.status === "offline";
      if (filter === "alerts") return c.status === "alert" || c.status === "warning";
      if (filter === "people") return events.some((e) => e.camera_id === c.id && e.event_type === "person");
      if (filter === "vehicles") return events.some((e) => e.camera_id === c.id && e.event_type === "vehicle");
      return true;
    });
  }, [cameras, filter, events]);

  const coords = cameras.filter((c) => c.latitude && c.longitude);
  const lats = coords.map((c) => c.latitude as number);
  const lngs = coords.map((c) => c.longitude as number);
  const minLat = Math.min(...lats, 12.9);
  const maxLat = Math.max(...lats, 13.0);
  const minLng = Math.min(...lngs, 77.5);
  const maxLng = Math.max(...lngs, 77.65);

  const project = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng || 1)) * 100;
    const y = 100 - ((lat - minLat) / (maxLat - minLat || 1)) * 100;
    return { x: Math.max(4, Math.min(96, x)), y: Math.max(4, Math.min(96, y)) };
  };

  const filters: Filter[] = ["all", "online", "offline", "alerts", "people", "vehicles"];

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight neon-text">Security Map</h1>
        <div className="flex flex-wrap gap-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-2.5 py-1 rounded text-[10px] tracking-widest uppercase border transition",
                filter === f ? "bg-primary/20 text-primary border-primary/60" : "text-muted-foreground border-border hover:text-primary"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Map View" className="lg:col-span-2">
          <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-primary/20 bg-background/60">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsla(195,100%,20%,0.2),transparent_70%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(hsla(195,100%,55%,0.06)_1px,transparent_1px),linear-gradient(90deg,hsla(195,100%,55%,0.06)_1px,transparent_1px)] bg-[size:32px_32px]" />
            {visible.filter((c) => c.latitude && c.longitude).map((c) => {
              const { x, y } = project(c.latitude as number, c.longitude as number);
              const color = statusColor(c.status);
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <span
                    className="block h-3 w-3 rounded-full"
                    style={{ background: color, boxShadow: `0 0 12px ${color}` }}
                  />
                  {c.status !== "offline" && (
                    <span
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ background: color, opacity: 0.4 }}
                    />
                  )}
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-mono text-primary/80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                    {c.camera_code}
                  </span>
                </button>
              );
            })}
            {visible.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">No cameras match this filter.</div>
            )}
          </div>
        </Panel>

        <Panel title={selected ? selected.name : "Select a camera"}>
          {selected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <StatusDot status={selected.status} />
                <span className="text-xs font-mono text-primary/80">{selected.camera_code}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{selected.status}</span>
              </div>
              <div className="text-xs text-muted-foreground">{selected.location}</div>
              <div className="aspect-video rounded border border-primary/25 bg-[linear-gradient(135deg,hsla(195,100%,15%,0.6),hsla(222,47%,7%,0.9))] relative overflow-hidden">
                <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(0deg,transparent_0,transparent_3px,hsla(195,100%,55%,0.1)_3px,hsla(195,100%,55%,0.1)_4px)]" />
                <div className="absolute inset-0 flex items-center justify-center text-primary/40 text-xs tracking-widest">LIVE PREVIEW</div>
              </div>
              <div>
                <div className="text-[10px] tracking-widest text-muted-foreground uppercase mb-1">Recent Events</div>
                <ul className="space-y-1">
                  {events.filter((e) => e.camera_id === selected.id).slice(0, 5).map((e) => (
                    <li key={e.id} className="flex items-center justify-between text-xs">
                      <span className="uppercase text-foreground">{e.event_type}</span>
                      <SeverityBadge severity={e.severity} />
                    </li>
                  ))}
                  {events.filter((e) => e.camera_id === selected.id).length === 0 && (
                    <p className="text-xs text-muted-foreground">No events recorded.</p>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">Tap a marker to inspect.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
