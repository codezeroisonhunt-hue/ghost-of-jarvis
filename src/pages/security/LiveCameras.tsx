import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, StatusDot, SimBadge } from "@/components/security/SecurityUI";
import type { Camera } from "@/lib/security/types";
import { Radio } from "lucide-react";

export default function LiveCameras() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  useEffect(() => {
    supabase.from("security_cameras").select("*").order("camera_code").then(({ data }) => setCameras((data ?? []) as Camera[]));
  }, []);
  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight neon-text">Live Cameras</h1>
        <p className="text-xs text-muted-foreground">Live-feed placeholders — connect stream URLs in Camera Network to embed real feeds.</p>
      </div>
      <Panel title={`Wall (${cameras.length})`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {cameras.map((c) => (
            <div key={c.id} className="relative rounded-lg overflow-hidden border border-primary/25 bg-background/50 aspect-video">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,hsla(195,100%,15%,0.6),hsla(222,47%,7%,0.9))]" />
              <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(0deg,transparent_0,transparent_3px,hsla(195,100%,55%,0.1)_3px,hsla(195,100%,55%,0.1)_4px)]" />
              <div className="absolute inset-0 flex items-center justify-center text-primary/40 text-xs tracking-widest">SIGNAL AWAITING</div>
              <div className="absolute top-2 left-2 flex items-center gap-2">
                <StatusDot status={c.status} />
                <span className="text-[10px] font-mono text-primary/80">{c.camera_code}</span>
              </div>
              {c.recording && (
                <div className="absolute top-2 right-2 flex items-center gap-1 text-accent">
                  <Radio className="h-3 w-3 animate-pulse" />
                  <span className="text-[9px] font-bold">REC</span>
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-background/90 to-transparent">
                <div className="text-xs font-semibold truncate">{c.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{c.location}</div>
              </div>
              {c.is_demo && <div className="absolute bottom-2 right-2"><SimBadge /></div>}
            </div>
          ))}
          {cameras.length === 0 && <p className="text-sm text-muted-foreground col-span-full text-center py-8">No cameras.</p>}
        </div>
      </Panel>
    </div>
  );
}
