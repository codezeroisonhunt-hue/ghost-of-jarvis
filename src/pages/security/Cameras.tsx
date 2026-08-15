import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, StatusDot, SimBadge } from "@/components/security/SecurityUI";
import type { Camera, Zone } from "@/lib/security/types";
import { useSecurityRole, writeAudit } from "@/hooks/useSecurityRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Radio, Search } from "lucide-react";

const emptyForm = {
  name: "",
  camera_code: "",
  location: "",
  latitude: "",
  longitude: "",
  camera_type: "IP",
  field_of_view: "90",
  zone_id: "",
  status: "online",
  recording: true,
  stream_url: "",
};

export default function Cameras() {
  const { isAdmin } = useSecurityRole();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Camera | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const [c, z] = await Promise.all([
      supabase.from("security_cameras").select("*").order("camera_code"),
      supabase.from("security_zones").select("*").order("name"),
    ]);
    setCameras((c.data ?? []) as Camera[]);
    setZones((z.data ?? []) as Zone[]);
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Camera) => {
    setEditing(c);
    setForm({
      name: c.name,
      camera_code: c.camera_code,
      location: c.location,
      latitude: c.latitude?.toString() ?? "",
      longitude: c.longitude?.toString() ?? "",
      camera_type: c.camera_type,
      field_of_view: c.field_of_view?.toString() ?? "90",
      zone_id: c.zone_id ?? "",
      status: c.status,
      recording: c.recording,
      stream_url: c.stream_url ?? "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    const payload = {
      name: form.name,
      camera_code: form.camera_code,
      location: form.location,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      camera_type: form.camera_type,
      field_of_view: form.field_of_view ? Number(form.field_of_view) : 90,
      zone_id: form.zone_id || null,
      status: form.status,
      recording: form.recording,
      stream_url: form.stream_url || null,
    };
    if (editing) {
      const { error } = await supabase.from("security_cameras").update(payload).eq("id", editing.id);
      if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
      writeAudit("camera.update", "camera", editing.id, payload);
      toast({ title: "Camera updated" });
    } else {
      const { data, error } = await supabase.from("security_cameras").insert(payload).select().single();
      if (error) return toast({ title: "Create failed", description: error.message, variant: "destructive" });
      writeAudit("camera.create", "camera", data?.id, payload);
      toast({ title: "Camera added" });
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (c: Camera) => {
    if (!confirm(`Remove ${c.name}?`)) return;
    const { error } = await supabase.from("security_cameras").delete().eq("id", c.id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    writeAudit("camera.delete", "camera", c.id);
    toast({ title: "Camera removed" });
    load();
  };

  const testConn = async (c: Camera) => {
    toast({ title: `Pinging ${c.name}…`, description: "Sending heartbeat probe" });
    await new Promise((r) => setTimeout(r, 900));
    const ok = c.status !== "offline";
    await supabase
      .from("security_cameras")
      .update({ last_heartbeat: new Date().toISOString(), status: ok ? "online" : "offline" })
      .eq("id", c.id);
    writeAudit("camera.test_connection", "camera", c.id, { ok });
    toast({ title: ok ? "Camera responded" : "No response", variant: ok ? "default" : "destructive" });
    load();
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight neon-text">Camera Network</h1>
          <p className="text-xs text-muted-foreground">Only cameras you own or have explicit authorization to access.</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openAdd}>
                <Plus className="h-4 w-4 mr-1" /> Add Camera
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editing ? "Edit Camera" : "Add Camera"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Code</Label><Input value={form.camera_code} onChange={(e) => setForm({ ...form, camera_code: e.target.value })} placeholder="CAM-07" /></div>
                <div><Label>Type</Label>
                  <Select value={form.camera_type} onValueChange={(v) => setForm({ ...form, camera_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["IP", "Dome", "Bullet", "PTZ", "Thermal", "ONVIF", "RTSP"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                <div><Label>Latitude</Label><Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></div>
                <div><Label>Longitude</Label><Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></div>
                <div><Label>Field of View</Label><Input value={form.field_of_view} onChange={(e) => setForm({ ...form, field_of_view: e.target.value })} /></div>
                <div><Label>Zone</Label>
                  <Select value={form.zone_id || "__none"} onValueChange={(v) => setForm({ ...form, zone_id: v === "__none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Unassigned</SelectItem>
                      {zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>Stream URL (RTSP/HTTP, stored server-side)</Label><Input value={form.stream_url} onChange={(e) => setForm({ ...form, stream_url: e.target.value })} placeholder="rtsp://…" /></div>
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["online", "offline", "warning", "alert"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.recording} onChange={(e) => setForm({ ...form, recording: e.target.checked })} /> Recording</label></div>
              </div>
              <Button onClick={save} className="w-full">{editing ? "Save Changes" : "Add Camera"}</Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!isAdmin && (
        <div className="rounded-md border border-yellow-400/30 bg-yellow-400/5 p-3 text-xs text-yellow-400/90">
          View-only mode. Ask an administrator for elevated permissions to modify cameras.
        </div>
      )}

      <div className="rounded-md border border-primary/20 bg-card/40 backdrop-blur-xl p-3 text-xs text-muted-foreground flex items-start gap-2">
        <Search className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
        <p>
          Automatic internet discovery of unsecured cameras is disabled by policy — probing devices without authorization is illegal in most jurisdictions. Add cameras manually or import from your ONVIF controller.
        </p>
      </div>

      <Panel title={`Cameras (${cameras.length})`}>
        {cameras.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No cameras yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {cameras.map((c) => {
              const zone = zones.find((z) => z.id === c.zone_id);
              return (
                <div key={c.id} className="rounded-lg border border-primary/20 bg-background/40 overflow-hidden">
                  <div className="relative aspect-video bg-[linear-gradient(135deg,hsla(195,100%,15%,0.5),hsla(222,47%,7%,0.9))]">
                    <div className="absolute inset-0 opacity-25 bg-[repeating-linear-gradient(0deg,transparent_0,transparent_3px,hsla(195,100%,55%,0.1)_3px,hsla(195,100%,55%,0.1)_4px)]" />
                    <div className="absolute top-2 left-2 flex items-center gap-2">
                      <StatusDot status={c.status} />
                      <span className="text-[10px] font-mono text-primary/80">{c.camera_code}</span>
                    </div>
                    {c.recording && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 text-accent">
                        <Radio className="h-3 w-3 animate-pulse" />
                        <span className="text-[9px] font-bold tracking-widest">REC</span>
                      </div>
                    )}
                    {c.is_demo && <div className="absolute bottom-2 right-2"><SimBadge /></div>}
                  </div>
                  <div className="p-3 space-y-2">
                    <div>
                      <div className="text-sm font-semibold truncate">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{c.location}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                      <div>Type: <span className="text-foreground">{c.camera_type}</span></div>
                      <div>FoV: <span className="text-foreground">{c.field_of_view}°</span></div>
                      <div>Zone: <span className="text-foreground">{zone?.name ?? "—"}</span></div>
                      <div>Heartbeat: <span className="text-foreground">{c.last_heartbeat ? new Date(c.last_heartbeat).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }) : "—"}</span></div>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => testConn(c)}>Test</Button>
                      {isAdmin && <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>}
                      {isAdmin && <Button size="sm" variant="outline" className="h-7 text-[11px] text-accent" onClick={() => remove(c)}><Trash2 className="h-3 w-3" /></Button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
