import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, SimBadge } from "@/components/security/SecurityUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useSecurityRole, writeAudit } from "@/hooks/useSecurityRole";
import { seedDemoData, clearDemoData } from "@/lib/security/demoSeed";
import type { AppRole } from "@/lib/security/types";
import { Database, Trash2, UserPlus } from "lucide-react";

export default function SecuritySettings() {
  const { isAdmin, roles, reload } = useSecurityRole();
  const [retentionDays, setRetentionDays] = useState<number>(() => Number(localStorage.getItem("sec.retention_days") ?? 30));
  const [busy, setBusy] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [role, setRole] = useState<AppRole>("operator");
  const [members, setMembers] = useState<Array<{ user_id: string; role: string }>>([]);

  const loadMembers = async () => {
    if (!isAdmin) return;
    const { data } = await supabase.from("user_roles").select("user_id, role").order("role");
    setMembers(data ?? []);
  };
  useEffect(() => { loadMembers(); }, [isAdmin]);

  const seed = async () => {
    setBusy(true);
    try {
      const r = await seedDemoData();
      writeAudit("demo.seed", "system", undefined, r);
      toast({ title: "Demo data seeded", description: `${r.cameras} cameras · ${r.people} people · ${r.events} events` });
    } catch (e: any) {
      toast({ title: "Seed failed", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };
  const clearDemo = async () => {
    if (!confirm("Remove all SIMULATION data?")) return;
    setBusy(true);
    try { await clearDemoData(); writeAudit("demo.clear", "system"); toast({ title: "Demo data cleared" }); }
    finally { setBusy(false); }
  };

  const saveRetention = () => {
    localStorage.setItem("sec.retention_days", String(retentionDays));
    writeAudit("settings.retention_update", "settings", undefined, { retentionDays });
    toast({ title: "Retention updated", description: `${retentionDays} days` });
  };

  const addRole = async () => {
    if (!userEmail) return;
    // Look up user by joining profiles (display_name) — we cannot query auth.users from client.
    // Fallback: assume operator paste user UUID directly if email lookup fails.
    let userId = userEmail.trim();
    if (userEmail.includes("@")) {
      toast({ title: "Paste user UUID", description: "Client cannot resolve email to id. Ask the user for their UUID from Settings.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    writeAudit("role.grant", "user_role", userId, { role });
    toast({ title: "Role granted" });
    setUserEmail("");
    loadMembers();
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-4">
      <h1 className="text-xl font-bold tracking-tight neon-text">Settings</h1>

      <Panel title="Your Access">
        <div className="text-xs text-muted-foreground">Signed-in roles: <span className="text-foreground font-mono">{roles.join(", ") || "none"}</span></div>
        <p className="text-[11px] text-muted-foreground mt-2">The first person to sign in automatically becomes admin. Additional users default to no role until an admin grants one.</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={reload}>Refresh</Button>
      </Panel>

      <Panel title="Demo Mode" action={<SimBadge />}>
        <p className="text-xs text-muted-foreground mb-3">Seed a fully synthetic environment: 6 cameras, 6 zones, 5 fictional people, ~12 events, and 4 alerts. Data is labelled SIMULATION throughout the app.</p>
        {isAdmin ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={seed} disabled={busy}><Database className="h-4 w-4 mr-1" />Seed demo data</Button>
            <Button size="sm" variant="outline" onClick={clearDemo} disabled={busy} className="text-accent border-accent/40"><Trash2 className="h-4 w-4 mr-1" />Clear demo data</Button>
          </div>
        ) : <p className="text-xs text-yellow-400/80">Admin role required.</p>}
      </Panel>

      <Panel title="Retention">
        <div className="flex items-end gap-2 max-w-sm">
          <div className="flex-1">
            <Label>Recording & detection retention (days)</Label>
            <Input type="number" min={1} max={365} value={retentionDays} onChange={(e) => setRetentionDays(Number(e.target.value))} />
          </div>
          <Button size="sm" onClick={saveRetention}>Save</Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">Applied by the backend cleanup job (configure separately). Facial biometric templates of real people are never stored client-side.</p>
      </Panel>

      {isAdmin && (
        <Panel title="Role Management">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[240px]">
              <Label>User UUID</Label>
              <Input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="paste user's UUID" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="operator">operator</SelectItem>
                  <SelectItem value="viewer">viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={addRole}><UserPlus className="h-4 w-4 mr-1" />Grant</Button>
          </div>
          <div className="mt-4">
            <div className="text-[10px] tracking-widest text-muted-foreground uppercase mb-1">Current grants</div>
            <ul className="text-xs space-y-1 font-mono">
              {members.map((m, i) => <li key={i}>{m.role} · {m.user_id}</li>)}
              {members.length === 0 && <li className="text-muted-foreground">None.</li>}
            </ul>
          </div>
        </Panel>
      )}

      <Panel title="Privacy & Compliance">
        <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
          <li>Facial biometrics of real individuals are not stored. Only enrolled personnel with a photo reference are tracked, per the enrolment consent you obtain offline.</li>
          <li>Internet scanning for unsecured cameras is disabled — accessing devices without authorization is illegal in most jurisdictions.</li>
          <li>Web/social identification of unknown persons is not available.</li>
          <li>All camera-credential fields are stored server-side and never exposed via the public Data API (admin-only table).</li>
          <li>Every write action produces an entry in Audit Logs.</li>
        </ul>
      </Panel>
    </div>
  );
}
