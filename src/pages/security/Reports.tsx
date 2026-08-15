import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, Stat } from "@/components/security/SecurityUI";
import type { Alert, Camera, SecurityEvent } from "@/lib/security/types";

export default function Reports() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  useEffect(() => {
    supabase.from("security_events").select("*").order("occurred_at", { ascending: false }).limit(1000).then(({ data }) => setEvents((data ?? []) as SecurityEvent[]));
    supabase.from("security_cameras").select("*").then(({ data }) => setCameras((data ?? []) as Camera[]));
    supabase.from("security_alerts").select("*").then(({ data }) => setAlerts((data ?? []) as Alert[]));
  }, []);

  const byType = useMemo(() => {
    const m = new Map<string, number>();
    events.forEach((e) => m.set(e.event_type, (m.get(e.event_type) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [events]);

  const bySeverity = useMemo(() => {
    const m = new Map<string, number>();
    events.forEach((e) => m.set(e.severity, (m.get(e.severity) ?? 0) + 1));
    return ["info", "low", "medium", "high", "critical"].map((s) => [s, m.get(s) ?? 0] as const);
  }, [events]);

  const maxType = Math.max(1, ...byType.map(([, n]) => n));

  const exportCsv = () => {
    const rows = [["id", "event_type", "severity", "confidence", "occurred_at", "camera_id"]];
    events.forEach((e) => rows.push([e.id, e.event_type, e.severity, String(e.confidence ?? ""), e.occurred_at, e.camera_id ?? ""]));
    const blob = new Blob([rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `security-events-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight neon-text">Reports</h1>
        <button onClick={exportCsv} className="text-[10px] tracking-widest text-primary border border-primary/40 rounded px-3 py-1.5 hover:bg-primary/10">EXPORT CSV</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total Events" value={events.length} />
        <Stat label="Cameras" value={cameras.length} tone="primary" />
        <Stat label="Alerts" value={alerts.length} tone={alerts.some((a) => !a.acknowledged) ? "danger" : "muted"} />
        <Stat label="Unacknowledged" value={alerts.filter((a) => !a.acknowledged).length} tone="warn" />
      </div>

      <Panel title="Detections by Type">
        <div className="space-y-2">
          {byType.map(([t, n]) => (
            <div key={t}>
              <div className="flex justify-between text-xs mb-1"><span className="uppercase tracking-wider">{t}</span><span className="tabular-nums text-muted-foreground">{n}</span></div>
              <div className="h-2 rounded-full bg-background/60 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary/40" style={{ width: `${(n / maxType) * 100}%` }} />
              </div>
            </div>
          ))}
          {byType.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No data.</p>}
        </div>
      </Panel>

      <Panel title="Severity Distribution">
        <div className="grid grid-cols-5 gap-2">
          {bySeverity.map(([s, n]) => (
            <div key={s} className="text-center">
              <div className="text-2xl font-bold tabular-nums">{n}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
