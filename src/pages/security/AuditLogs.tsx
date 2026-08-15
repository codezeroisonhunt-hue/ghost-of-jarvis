import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Panel } from "@/components/security/SecurityUI";
import type { AuditLog } from "@/lib/security/types";
import { useSecurityRole } from "@/hooks/useSecurityRole";

export default function AuditLogs() {
  const { isAdmin, loading } = useSecurityRole();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500).then(({ data }) => setLogs((data ?? []) as AuditLog[]));
  }, [isAdmin]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="max-w-lg mx-auto text-sm text-muted-foreground p-6 border border-primary/20 rounded-lg bg-card/40">Admin role required to view audit logs.</div>;

  return (
    <div className="max-w-[1200px] mx-auto space-y-4">
      <h1 className="text-xl font-bold tracking-tight neon-text">Audit Logs</h1>
      <Panel title={`Recent Actions (${logs.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] tracking-widest text-muted-foreground uppercase border-b border-primary/20">
                <th className="py-2 pr-3">Time (IST)</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">Resource</th>
                <th className="py-2">User</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-border/40">
                  <td className="py-1.5 pr-3 tabular-nums text-muted-foreground">
                    {new Date(l.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })}
                  </td>
                  <td className="py-1.5 pr-3 font-mono text-primary/90">{l.action}</td>
                  <td className="py-1.5 pr-3">{l.resource_type ?? "—"} {l.resource_id ? <span className="text-muted-foreground text-[10px]">({l.resource_id.slice(0, 8)})</span> : null}</td>
                  <td className="py-1.5 font-mono text-[10px] text-muted-foreground">{l.user_id?.slice(0, 8) ?? "—"}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-muted-foreground">No audit entries yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
