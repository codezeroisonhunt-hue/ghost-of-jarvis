import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, SeverityBadge } from "@/components/security/SecurityUI";
import type { Alert } from "@/lib/security/types";
import { useSecurityRole, writeAudit } from "@/hooks/useSecurityRole";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, MapPin, Video, FileWarning } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function Alerts() {
  const { isOperator, userId } = useSecurityRole();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const load = () => supabase.from("security_alerts").select("*").order("created_at", { ascending: false }).then(({ data }) => setAlerts((data ?? []) as Alert[]));
  useEffect(() => {
    load();
    const ch = supabase.channel("alerts-rt").on("postgres_changes", { event: "*", schema: "public", table: "security_alerts" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const ack = async (a: Alert) => {
    const { error } = await supabase.from("security_alerts").update({ acknowledged: true, acknowledged_by: userId, acknowledged_at: new Date().toISOString() }).eq("id", a.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    writeAudit("alert.acknowledge", "alert", a.id);
    toast({ title: "Alert acknowledged" });
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-4">
      <h1 className="text-xl font-bold tracking-tight neon-text">Alerts</h1>
      <Panel title={`Notification Center (${alerts.length})`}>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No alerts.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className={`rounded-lg border p-3 ${a.acknowledged ? "border-border bg-background/30 opacity-70" : "border-accent/40 bg-accent/5"}`}>
                <div className="flex items-start gap-3">
                  <FileWarning className={`h-5 w-5 shrink-0 mt-0.5 ${a.acknowledged ? "text-muted-foreground" : "text-accent"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm font-bold tracking-wider ${a.acknowledged ? "text-muted-foreground" : "text-accent"}`}>{a.title}</span>
                      <SeverityBadge severity={a.severity} />
                      <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">
                        {new Date(a.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{a.message}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Link to="/security/live"><Button size="sm" variant="outline" className="h-7 text-[11px]"><Video className="h-3 w-3 mr-1" />Camera</Button></Link>
                      <Link to="/security/map"><Button size="sm" variant="outline" className="h-7 text-[11px]"><MapPin className="h-3 w-3 mr-1" />Map</Button></Link>
                      {isOperator && !a.acknowledged && (
                        <Button size="sm" variant="outline" className="h-7 text-[11px] text-emerald-400 border-emerald-400/40" onClick={() => ack(a)}>
                          <Check className="h-3 w-3 mr-1" /> Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
