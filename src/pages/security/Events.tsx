import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, SeverityBadge } from "@/components/security/SecurityUI";
import type { Camera, SecurityEvent } from "@/lib/security/types";
import { DETECTION_TYPES } from "@/lib/security/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Events() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [severity, setSeverity] = useState<string>("all");
  const [camId, setCamId] = useState<string>("all");

  useEffect(() => {
    supabase.from("security_events").select("*").order("occurred_at", { ascending: false }).limit(500).then(({ data }) => setEvents((data ?? []) as SecurityEvent[]));
    supabase.from("security_cameras").select("*").then(({ data }) => setCameras((data ?? []) as Camera[]));
  }, []);

  const filtered = useMemo(() => events.filter((e) => {
    if (type !== "all" && e.event_type !== type) return false;
    if (severity !== "all" && e.severity !== severity) return false;
    if (camId !== "all" && e.camera_id !== camId) return false;
    if (q) {
      const cam = cameras.find((c) => c.id === e.camera_id);
      const hay = `${e.event_type} ${cam?.name ?? ""} ${cam?.location ?? ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [events, type, severity, camId, q, cameras]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <h1 className="text-xl font-bold tracking-tight neon-text">Event Timeline</h1>
      <Panel title="Filters">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {DETECTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              {["info", "low", "medium", "high", "critical"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={camId} onValueChange={setCamId}>
            <SelectTrigger><SelectValue placeholder="Camera" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cameras</SelectItem>
              {cameras.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Panel>

      <Panel title={`Events (${filtered.length})`}>
        <div className="relative pl-4 border-l border-primary/30 space-y-3 max-h-[600px] overflow-y-auto">
          {filtered.map((e) => {
            const cam = cameras.find((c) => c.id === e.camera_id);
            return (
              <div key={e.id} className="relative">
                <span className="absolute -left-[22px] top-2 h-3 w-3 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                <div className="rounded-lg border border-primary/15 bg-background/40 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={e.severity} />
                    <span className="text-sm font-semibold uppercase tracking-wide">{e.event_type}</span>
                    {cam && <span className="text-xs text-muted-foreground truncate">· {cam.name}</span>}
                    <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">
                      {new Date(e.occurred_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })}
                    </span>
                  </div>
                  {e.confidence != null && (
                    <div className="text-[10px] text-muted-foreground mt-1">Confidence: {Math.round(Number(e.confidence) * 100)}%</div>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No events match filters.</p>}
        </div>
      </Panel>
    </div>
  );
}
