import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, Stat, SeverityBadge, StatusDot, SimBadge } from "@/components/security/SecurityUI";
import type { Alert, Camera, SecurityEvent } from "@/lib/security/types";
import { Activity, Radio } from "lucide-react";
import { Link } from "react-router-dom";

export default function SecurityDashboard() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [now, setNow] = useState(new Date());

  const load = async () => {
    const [c, e, a] = await Promise.all([
      supabase.from("security_cameras").select("*").order("created_at"),
      supabase.from("security_events").select("*").order("occurred_at", { ascending: false }).limit(100),
      supabase.from("security_alerts").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setCameras((c.data ?? []) as Camera[]);
    setEvents((e.data ?? []) as SecurityEvent[]);
    setAlerts((a.data ?? []) as Alert[]);
  };

  useEffect(() => {
    load();
    const t = setInterval(() => setNow(new Date()), 1000);
    const ch = supabase
      .channel("sec-dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "security_events" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "security_alerts" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "security_cameras" }, load)
      .subscribe();
    return () => {
      clearInterval(t);
      supabase.removeChannel(ch);
    };
  }, []);

  const online = cameras.filter((c) => c.status === "online").length;
  const offline = cameras.filter((c) => c.status === "offline").length;
  const activeAlerts = alerts.filter((a) => !a.acknowledged).length;
  const last30 = useMemo(() => events.filter((e) => Date.now() - new Date(e.occurred_at).getTime() < 30 * 60000), [events]);
  const peopleCount = last30.filter((e) => e.event_type === "person").length;
  const vehicleCount = last30.filter((e) => e.event_type === "vehicle").length;
  const lastEvent = events[0];

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      <header className="rounded-xl border border-primary/30 bg-gradient-to-br from-card/70 to-background/40 backdrop-blur-xl px-4 sm:px-6 py-4 shadow-[0_0_40px_hsla(195,100%,55%,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] text-primary/80">
              <Radio className="h-3 w-3 animate-pulse" /> JARVIS SECURITY INTELLIGENCE
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 neon-text">Command Center</h1>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-widest text-muted-foreground">SYSTEM STATUS</div>
            <div className="flex items-center gap-2 justify-end">
              <StatusDot status="online" />
              <span className="text-sm font-bold text-emerald-400 tracking-wider">ONLINE</span>
            </div>
            <div className="text-[10px] tabular-nums text-muted-foreground mt-1">
              {now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })} IST
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <Stat label="Cameras Online" value={online} tone="ok" hint={`${cameras.length} total`} />
        <Stat label="Cameras Offline" value={offline} tone={offline ? "warn" : "muted"} />
        <Stat label="Active Alerts" value={activeAlerts} tone={activeAlerts ? "danger" : "muted"} />
        <Stat label="People (30m)" value={peopleCount} tone="primary" />
        <Stat label="Vehicles (30m)" value={vehicleCount} tone="primary" />
        <Stat
          label="Last Event"
          value={lastEvent ? lastEvent.event_type.toUpperCase() : "—"}
          tone={lastEvent?.severity === "critical" ? "danger" : "primary"}
          hint={lastEvent ? new Date(lastEvent.occurred_at).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }) : ""}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel
          title="Camera Grid"
          className="lg:col-span-2"
          action={<Link to="/security/cameras" className="text-[10px] tracking-widest text-primary hover:underline">MANAGE →</Link>}
        >
          {cameras.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No cameras yet. Head to <Link to="/security/settings" className="text-primary underline">Settings</Link> to seed demo data or <Link to="/security/cameras" className="text-primary underline">add a camera</Link>.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cameras.map((c) => (
                <Link key={c.id} to="/security/cameras" className="group relative rounded-lg overflow-hidden border border-primary/20 bg-background/60 aspect-video">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,hsla(195,100%,15%,0.6),hsla(222,47%,7%,0.9))]" />
                  <div className="absolute inset-0 opacity-30 mix-blend-screen bg-[repeating-linear-gradient(0deg,transparent_0,transparent_3px,hsla(195,100%,55%,0.08)_3px,hsla(195,100%,55%,0.08)_4px)]" />
                  <div className="relative h-full p-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono tracking-widest text-primary/80">{c.camera_code}</span>
                      <StatusDot status={c.status} />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-foreground truncate">{c.name}</div>
                      <div className="text-[9px] text-muted-foreground truncate">{c.location}</div>
                    </div>
                  </div>
                  {c.is_demo && (
                    <div className="absolute top-1 right-6"><SimBadge /></div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="AI Activity Feed" action={<Activity className="h-3 w-3 text-primary animate-pulse" />}>
          <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {events.slice(0, 20).map((e) => {
              const cam = cameras.find((c) => c.id === e.camera_id);
              return (
                <li key={e.id} className="flex items-start gap-2 rounded-md border border-primary/10 bg-background/40 p-2">
                  <SeverityBadge severity={e.severity} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-foreground truncate">
                      <span className="font-semibold uppercase tracking-wide">{e.event_type}</span>
                      {cam && <span className="text-muted-foreground"> · {cam.name}</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground tabular-nums">
                      {new Date(e.occurred_at).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })}
                      {e.confidence && ` · ${Math.round(Number(e.confidence) * 100)}%`}
                    </div>
                  </div>
                </li>
              );
            })}
            {events.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Awaiting detections…</p>}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Active Alerts" action={<Link to="/security/alerts" className="text-[10px] tracking-widest text-primary hover:underline">ALL →</Link>}>
          <ul className="space-y-2">
            {alerts.filter((a) => !a.acknowledged).slice(0, 6).map((a) => (
              <li key={a.id} className="rounded-md border border-accent/30 bg-accent/5 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-accent tracking-wider">{a.title}</div>
                  <SeverityBadge severity={a.severity} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{a.message}</p>
              </li>
            ))}
            {alerts.filter((a) => !a.acknowledged).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No active alerts. All clear.</p>
            )}
          </ul>
        </Panel>

        <Panel title="Perimeter Radar">
          <div className="relative aspect-square max-w-[280px] mx-auto">
            <div className="absolute inset-0 rounded-full border border-primary/30" />
            <div className="absolute inset-[15%] rounded-full border border-primary/20" />
            <div className="absolute inset-[35%] rounded-full border border-primary/15" />
            <div className="absolute inset-[55%] rounded-full border border-primary/10" />
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div
                className="absolute inset-0 origin-center animate-spin"
                style={{
                  background: "conic-gradient(from 0deg, transparent 0deg, hsla(195,100%,55%,0.35) 30deg, transparent 60deg)",
                  animationDuration: "4s",
                }}
              />
            </div>
            {cameras.slice(0, 8).map((c, i) => {
              const angle = (i / Math.max(cameras.length, 1)) * Math.PI * 2;
              const r = 42;
              const x = 50 + Math.cos(angle) * r;
              const y = 50 + Math.sin(angle) * r;
              return (
                <div
                  key={c.id}
                  className="absolute h-2 w-2 rounded-full"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%,-50%)",
                    background: c.status === "online" ? "#22c55e" : c.status === "alert" ? "hsl(var(--accent))" : c.status === "warning" ? "#eab308" : "#6b7280",
                    boxShadow: `0 0 8px currentColor`,
                    color: c.status === "online" ? "#22c55e" : c.status === "alert" ? "hsl(var(--accent))" : c.status === "warning" ? "#eab308" : "transparent",
                  }}
                  title={c.name}
                />
              );
            })}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[9px] tracking-widest text-primary/70">SCAN</div>
                <div className="text-2xl font-bold neon-text tabular-nums">{cameras.length}</div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
