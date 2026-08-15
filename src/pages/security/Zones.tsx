import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Panel } from "@/components/security/SecurityUI";
import type { Zone } from "@/lib/security/types";
import { useSecurityRole, writeAudit } from "@/hooks/useSecurityRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Plus, Trash2, Pencil, Shapes } from "lucide-react";

const empty = { name: "", description: "", zone_type: "general", color: "#22d3ee", rules: "" };

export default function Zones() {
  const { isAdmin } = useSecurityRole();
  const [zones, setZones] = useState<Zone[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [form, setForm] = useState(empty);

  const load = () => supabase.from("security_zones").select("*").order("name").then(({ data }) => setZones((data ?? []) as Zone[]));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (z: Zone) => {
    setEditing(z);
    setForm({
      name: z.name, description: z.description ?? "", zone_type: z.zone_type,
      color: z.color ?? "#22d3ee",
      rules: JSON.stringify(z.rules ?? [], null, 2),
    });
    setOpen(true);
  };

  const save = async () => {
    let rules: unknown = [];
    try { rules = form.rules ? JSON.parse(form.rules) : []; } catch { return toast({ title: "Rules must be valid JSON", variant: "destructive" }); }
    const payload = { name: form.name, description: form.description || null, zone_type: form.zone_type, color: form.color, rules: rules as never };
    if (editing) {
      const { error } = await supabase.from("security_zones").update(payload).eq("id", editing.id);
      if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
      writeAudit("zone.update", "zone", editing.id);
    } else {
      const { data, error } = await supabase.from("security_zones").insert(payload).select().single();
      if (error) return toast({ title: "Create failed", description: error.message, variant: "destructive" });
      writeAudit("zone.create", "zone", data?.id);
    }
    toast({ title: editing ? "Zone updated" : "Zone created" });
    setOpen(false); load();
  };
  const remove = async (z: Zone) => {
    if (!confirm(`Remove ${z.name}?`)) return;
    await supabase.from("security_zones").delete().eq("id", z.id);
    writeAudit("zone.delete", "zone", z.id);
    load();
  };

  const ruleExample = `[
  { "if": { "person_type": "unauthorized" }, "then": { "severity": "critical" } },
  { "if": { "event_type": "loitering", "duration_min": 5 }, "then": { "severity": "medium" } }
]`;

  return (
    <div className="max-w-[1200px] mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight neon-text">Security Zones</h1>
          <p className="text-xs text-muted-foreground">Rule engine triggers alerts when configured conditions are matched by incoming events.</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Zone</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit Zone" : "Add Zone"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Type</Label><Input value={form.zone_type} onChange={(e) => setForm({ ...form, zone_type: e.target.value })} /></div>
                <div><Label>Color</Label><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
                <div className="col-span-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="col-span-2">
                  <Label>Rules (JSON)</Label>
                  <Textarea rows={7} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} placeholder={ruleExample} className="font-mono text-xs" />
                </div>
              </div>
              <Button onClick={save} className="w-full">{editing ? "Save" : "Create"}</Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Panel title={`Zones (${zones.length})`}>
        {zones.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No zones defined.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {zones.map((z) => (
              <div key={z.id} className="rounded-lg border p-3 flex gap-3" style={{ borderColor: `${z.color ?? "#22d3ee"}55`, background: `${z.color ?? "#22d3ee"}0a` }}>
                <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${z.color ?? "#22d3ee"}22`, color: z.color ?? "#22d3ee" }}>
                  <Shapes className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{z.name}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{z.zone_type}</div>
                  {z.description && <p className="text-xs text-muted-foreground mt-1">{z.description}</p>}
                  <div className="text-[10px] text-muted-foreground mt-1">{Array.isArray(z.rules) ? (z.rules as unknown[]).length : 0} rule(s)</div>
                  {isAdmin && (
                    <div className="flex gap-1 mt-2">
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => openEdit(z)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] text-accent" onClick={() => remove(z)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
