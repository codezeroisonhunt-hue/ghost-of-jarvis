import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, SeverityBadge } from "@/components/security/SecurityUI";
import type { Camera, SecurityEvent } from "@/lib/security/types";
import { Car } from "lucide-react";

export default function Vehicles() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  useEffect(() => {
    supabase.from("security_events").select("*").eq("event_type", "vehicle").order("occurred_at", { ascending: false }).then(({ data }) => setEvents((data ?? []) as SecurityEvent[]));
    supabase.from("security_cameras").select("*").then(({ data }) => setCameras((data ?? []) as Camera[]));
  }, []);
  return (
    <div className="max-w-[1200px] mx-auto space-y-4">
      <h1 className="text-xl font-bold tracking-tight neon-text">Vehicle Detections</h1>
      <Panel title={`Sightings (${events.length})`}>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No vehicle sightings yet.</p>
        ) : (
          <ul className="space-y-2">
            {events.map((e) => {
              const cam = cameras.find((c) => c.id === e.camera_id);
              const details = e.details as Record<string, unknown> | null;
              return (
                <li key={e.id} className="flex items-center gap-3 rounded-lg border border-primary/15 bg-background/40 p-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center"><Car className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground truncate">
                      {(details?.vehicle_class as string) ?? "Vehicle"}
                      {cam && <span className="text-muted-foreground"> · {cam.name}</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground tabular-nums">
                      {new Date(e.occurred_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })}
                      {details?.plate ? ` · ${details.plate}` : ""}
                    </div>
                  </div>
                  <SeverityBadge severity={e.severity} />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
