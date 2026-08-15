import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, SeverityBadge, StatusDot } from "@/components/security/SecurityUI";
import type { Alert, Camera, Person, SecurityEvent } from "@/lib/security/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Bot, Mic, MicOff, Volume2, VolumeX, Send } from "lucide-react";
import { writeAudit } from "@/hooks/useSecurityRole";

interface Msg {
  role: "user" | "jarvis";
  text: string;
  render?: React.ReactNode;
}

// Local, deterministic assistant. Every command runs against Supabase using
// the caller's own session — RLS is enforced, and there is no bypass path.
export default function Assistant() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "jarvis", text: "JARVIS online. Try: \"show offline cameras\", \"what happened in the last 30 minutes?\", \"open Main Entrance\"." },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const recRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("security_cameras").select("*").then(({ data }) => setCameras((data ?? []) as Camera[]));
    supabase.from("security_events").select("*").order("occurred_at", { ascending: false }).limit(200).then(({ data }) => setEvents((data ?? []) as SecurityEvent[]));
    supabase.from("authorized_people").select("*").then(({ data }) => setPeople((data ?? []) as Person[]));
    supabase.from("security_alerts").select("*").order("created_at", { ascending: false }).then(({ data }) => setAlerts((data ?? []) as Alert[]));
  }, []);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [msgs]);

  const speak = (t: string) => {
    if (muted) return;
    try {
      const u = new SpeechSynthesisUtterance(t);
      u.rate = 1.05; u.pitch = 0.95;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
  };

  const respond = (text: string, render?: React.ReactNode) => {
    setMsgs((m) => [...m, { role: "jarvis", text, render }]);
    speak(text);
  };

  const CamList = ({ list }: { list: Camera[] }) => (
    <ul className="mt-2 space-y-1">
      {list.map((c) => (
        <li key={c.id} className="flex items-center gap-2 text-xs">
          <StatusDot status={c.status} />
          <span className="font-mono text-primary/80">{c.camera_code}</span>
          <span className="truncate">{c.name}</span>
          <span className="text-muted-foreground truncate">· {c.location}</span>
        </li>
      ))}
      {list.length === 0 && <li className="text-xs text-muted-foreground">None.</li>}
    </ul>
  );

  const handle = async (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    writeAudit("assistant.query", "assistant", undefined, { q });
    const l = q.toLowerCase().replace(/^jarvis[,]?\s*/i, "");

    if (/(all|show).*camera/.test(l) && !/(offline|online|alert)/.test(l)) {
      respond(`Showing all ${cameras.length} cameras.`, <CamList list={cameras} />);
      return;
    }
    if (/offline/.test(l)) {
      const list = cameras.filter((c) => c.status === "offline");
      respond(`${list.length} offline camera${list.length === 1 ? "" : "s"}.`, <CamList list={list} />);
      return;
    }
    if (/(active )?alert|alerts/.test(l) && /camera/.test(l)) {
      const ids = new Set(alerts.filter((a) => !a.acknowledged).map((a) => a.event_id));
      const camIds = new Set(events.filter((e) => ids.has(e.id)).map((e) => e.camera_id));
      const list = cameras.filter((c) => camIds.has(c.id) || c.status === "alert");
      respond(`${list.length} camera${list.length === 1 ? "" : "s"} with active alerts.`, <CamList list={list} />);
      return;
    }
    if (/last (\d+)\s*minute/.test(l) || /past (\d+)\s*minute/.test(l) || /in the last/.test(l)) {
      const m = l.match(/(\d+)\s*minute/);
      const mins = m ? Number(m[1]) : 30;
      const since = Date.now() - mins * 60000;
      const recent = events.filter((e) => new Date(e.occurred_at).getTime() > since);
      respond(`${recent.length} event${recent.length === 1 ? "" : "s"} in the last ${mins} minutes.`,
        <ul className="mt-2 space-y-1">
          {recent.slice(0, 10).map((e) => (
            <li key={e.id} className="flex items-center gap-2 text-xs">
              <SeverityBadge severity={e.severity} />
              <span className="uppercase">{e.event_type}</span>
              <span className="text-muted-foreground tabular-nums ml-auto">{new Date(e.occurred_at).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })}</span>
            </li>
          ))}
        </ul>);
      return;
    }
    if (/authorized.*(people|person).*(today|detected)/.test(l) || /people detected/.test(l)) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const list = events.filter((e) => e.event_type === "person" && e.person_id && new Date(e.occurred_at) >= today);
      const names = list.map((e) => people.find((p) => p.id === e.person_id)?.name).filter(Boolean);
      respond(`${names.length} authorized detection${names.length === 1 ? "" : "s"} today.`,
        <ul className="mt-2 space-y-1 text-xs">{names.map((n, i) => <li key={i}>· {n}</li>)}</ul>);
      return;
    }
    // "open X" / "show X"
    const nameMatch = l.match(/(?:open|show|find|go to)\s+(.+?)(?:$|[.?!])/);
    if (nameMatch) {
      const target = nameMatch[1].trim();
      const hit = cameras.find((c) => c.name.toLowerCase().includes(target) || c.camera_code.toLowerCase() === target.toUpperCase() || c.location.toLowerCase().includes(target));
      if (hit) {
        respond(`Opening ${hit.name}.`,
          <div className="mt-2 space-y-2">
            <CamList list={[hit]} />
            <Link to="/security/live"><Button size="sm" variant="outline" className="h-7 text-[11px]">Go to Live Cameras</Button></Link>
          </div>);
        return;
      }
    }
    if (/help|command/.test(l)) {
      respond("Try: show all cameras, show cameras with active alerts, show offline cameras, open Main Entrance, what happened in the last 30 minutes, show authorized people detected today.");
      return;
    }
    respond("I couldn't match that command. Say \"help\" for examples.");
  };

  const toggleMic = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { respond("Voice input isn't supported in this browser."); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.lang = "en-IN"; rec.interimResults = false; rec.continuous = false;
    rec.onresult = (e: any) => { const t = e.results[0][0].transcript; setInput(t); handle(t); setListening(false); };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-4">
      <h1 className="text-xl font-bold tracking-tight neon-text">JARVIS Assistant</h1>
      <Panel title="Voice / Text Console">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/60 flex items-center justify-center animate-pulse">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="text-xs text-muted-foreground">Commands run under your session and honor your role permissions.</div>
          <div className="ml-auto flex gap-1">
            <Button size="sm" variant="outline" className="h-8" onClick={() => setMuted((m) => !m)}>
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant={listening ? "default" : "outline"} className="h-8" onClick={toggleMic}>
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div ref={scrollRef} className="h-[420px] overflow-y-auto rounded-lg border border-primary/15 bg-background/40 p-3 space-y-3">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : ""}>
              <div className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-primary/15 border border-primary/40" : "bg-card/60 border border-border"}`}>
                <div>{m.text}</div>
                {m.render}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); handle(input); setInput(""); }}
          className="flex gap-2 mt-3"
        >
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder='Try "show offline cameras"' />
          <Button type="submit" size="sm"><Send className="h-4 w-4" /></Button>
        </form>
      </Panel>
    </div>
  );
}
