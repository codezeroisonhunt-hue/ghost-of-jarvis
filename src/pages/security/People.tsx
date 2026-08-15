import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, SimBadge } from "@/components/security/SecurityUI";
import type { Person } from "@/lib/security/types";
import { useSecurityRole, writeAudit } from "@/hooks/useSecurityRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, UserCheck, ShieldOff } from "lucide-react";

const empty = { internal_id: "", name: "", role: "", organization: "", permission_level: "standard", photo_url: "" };

export default function People() {
  const { isAdmin } = useSecurityRole();
  const [people, setPeople] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [form, setForm] = useState(empty);

  const load = () => supabase.from("authorized_people").select("*").order("enrolled_at", { ascending: false }).then(({ data }) => setPeople((data ?? []) as Person[]));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p: Person) => {
    setEditing(p);
    setForm({
      internal_id: p.internal_id, name: p.name, role: p.role ?? "", organization: p.organization ?? "",
      permission_level: p.permission_level, photo_url: p.photo_url ?? "",
    });
    setOpen(true);
  };
  const save = async () => {
    const payload = { ...form, role: form.role || null, organization: form.organization || null, photo_url: form.photo_url || null };
    if (editing) {
      const { error } = await supabase.from("authorized_people").update(payload).eq("id", editing.id);
      if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
      writeAudit("person.update", "person", editing.id);
    } else {
      const { data, error } = await supabase.from("authorized_people").insert(payload).select().single();
      if (error) return toast({ title: "Create failed", description: error.message, variant: "destructive" });
      writeAudit("person.enroll", "person", data?.id);
    }
    toast({ title: editing ? "Updated" : "Enrolled" });
    setOpen(false); load();
  };
  const remove = async (p: Person) => {
    if (!confirm(`Remove ${p.name}?`)) return;
    await supabase.from("authorized_people").delete().eq("id", p.id);
    writeAudit("person.remove", "person", p.id);
    load();
  };
  const toggle = async (p: Person) => {
    await supabase.from("authorized_people").update({ active: !p.active }).eq("id", p.id);
    writeAudit(p.active ? "person.deactivate" : "person.activate", "person", p.id);
    load();
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight neon-text">Authorized People</h1>
          <p className="text-xs text-muted-foreground">Enrolled personnel only. Unknown-person identification via web/social search is not available (privacy law + platform policy).</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Enroll</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit Person" : "Enroll Person"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Internal ID</Label><Input value={form.internal_id} onChange={(e) => setForm({ ...form, internal_id: e.target.value })} placeholder="EMP-1234" /></div>
                <div><Label>Permission Level</Label><Input value={form.permission_level} onChange={(e) => setForm({ ...form, permission_level: e.target.value })} /></div>
                <div><Label>Role</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
                <div><Label>Organization</Label><Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} /></div>
                <div className="col-span-2"><Label>Photo URL (optional)</Label><Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} /></div>
              </div>
              <Button onClick={save} className="w-full">{editing ? "Save" : "Enroll"}</Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Panel title={`Personnel (${people.length})`}>
        {people.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No people enrolled.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {people.map((p) => (
              <div key={p.id} className="rounded-lg border border-primary/20 bg-background/40 p-3 flex gap-3">
                <div className="h-14 w-14 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {p.photo_url ? <img src={p.photo_url} alt="" className="h-full w-full object-cover" /> : <UserCheck className="h-6 w-6 text-primary" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    {p.is_demo && <SimBadge />}
                    {!p.active && <span className="text-[9px] font-bold text-accent tracking-widest">INACTIVE</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">{p.role ?? "—"} · {p.organization ?? "—"}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{p.internal_id} · {p.permission_level}</div>
                  {isAdmin && (
                    <div className="flex gap-1 mt-2">
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => openEdit(p)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => toggle(p)}><ShieldOff className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] text-accent" onClick={() => remove(p)}><Trash2 className="h-3 w-3" /></Button>
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
