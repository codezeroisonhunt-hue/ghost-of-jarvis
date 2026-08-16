import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Panel, Markdown, Loading, Chip } from "@/components/jscenter/JSUI";
import { streamMentor } from "@/lib/jscenter/mentor";
import { useJSProfile } from "@/hooks/useJSProfile";
import { parseQuery, rankProjects } from "@/lib/jscenter/projects";
import { CLASS_LABELS } from "@/lib/jscenter/types";
import { Send, Sparkles, Brain, ArrowRight } from "lucide-react";

const EXAMPLES = [
  "Find me a district-level AI project.",
  "I have ₹2,000 and 15 days.",
  "Teach me electromagnetic induction.",
  "Design a physical AI project.",
  "Prepare me for viva.",
];

interface Msg { role: "user" | "assistant"; content: string }

export default function JSHome() {
  const navigate = useNavigate();
  const { profile } = useJSProfile();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const matches = input.trim().length > 6 ? rankProjects(parseQuery(input)).slice(0, 4) : [];

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setBusy(true);

    const wantsIdeas = /project|idea|exhibition|competition|model/i.test(q) && !/explain|teach|what is/i.test(q);
    const mode = wantsIdeas ? "recommend" : "chat";

    try {
      await streamMentor(
        mode,
        {
          query: q,
          classLevel: profile.class_level ?? undefined,
          subject: profile.subjects?.[0],
          competition: profile.competition_level ?? undefined,
          budget: profile.budget ?? undefined,
          days: profile.days_available ?? undefined,
          components: profile.components ?? undefined,
        },
        next.map((m) => ({ role: m.role, content: m.content })),
        (chunk) =>
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + chunk };
            return copy;
          }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setBusy(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="space-y-4">
      {messages.length === 0 && (
        <div className="text-center py-6">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full border border-primary/50 bg-primary/10 flex items-center justify-center animate-pulse">
            <Brain className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">What are we building today?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your AI science mentor — from idea to design, build, test, present and viva.
          </p>
          {profile.class_level && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Chip tone="primary">{profile.class_level}</Chip>
              {profile.competition_level && <Chip>{profile.competition_level} level</Chip>}
              {profile.budget && <Chip>{profile.budget}</Chip>}
            </div>
          )}
        </div>
      )}

      <Panel>
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            rows={2}
            placeholder="e.g. I'm a 2nd PUC student, district level, physical AI model under ₹5,000, 20 days."
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
          <button
            onClick={() => send(input)}
            disabled={busy || !input.trim()}
            className="rounded-lg bg-primary/20 border border-primary/50 p-2.5 text-primary disabled:opacity-40 hover:bg-primary/30 transition"
            aria-label="Ask JARVIS"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        {matches.length > 0 && (
          <div className="mt-3 border-t border-primary/15 pt-3">
            <div className="text-[10px] tracking-widest text-muted-foreground mb-2">MATCHING PROJECTS IN THE LAB</div>
            <div className="flex flex-wrap gap-2">
              {matches.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/js-center/project/${p.id}`)}
                  className="text-left text-xs rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 hover:bg-primary/15 transition"
                >
                  {p.title}
                  <span className="text-muted-foreground"> · {CLASS_LABELS[p.minClass]}–{CLASS_LABELS[p.maxClass]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Panel>

      {messages.length === 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              onClick={() => send(e)}
              className="flex items-center justify-between gap-2 rounded-xl border border-primary/20 bg-background/40 px-3 py-2.5 text-left text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition"
            >
              {e}
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {error && (
        <Panel className="border-destructive/50">
          <p className="text-sm text-destructive">{error}</p>
        </Panel>
      )}

      <div className="space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            {m.role === "user" ? (
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary/15 border border-primary/30 px-3 py-2 text-sm">
                {m.content}
              </div>
            ) : (
              <Panel title="JARVIS" icon={<Sparkles className="h-3.5 w-3.5 text-primary" />}>
                {m.content ? <Markdown text={m.content} /> : <Loading />}
              </Panel>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <p className="text-[11px] text-muted-foreground/70 text-center pb-6">
        Costs are estimates. Results must be experimentally verified — JARVIS never guarantees competition outcomes.
      </p>
    </div>
  );
}
