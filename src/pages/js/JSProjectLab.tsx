import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Panel, Chip } from "@/components/jscenter/JSUI";
import { PROJECTS, CATEGORIES, rankProjects, parseQuery, Filters } from "@/lib/jscenter/projects";
import { CLASS_LABELS, SUBJECTS, BUDGET_BANDS, COMPETITION_LEVELS, DIFFICULTY_META } from "@/lib/jscenter/types";
import { Search, SlidersHorizontal, Cpu } from "lucide-react";

export default function JSProjectLab() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [f, setF] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(() => {
    const nl = q.trim() ? parseQuery(q) : {};
    return rankProjects({ ...nl, ...f, q: (f.q ?? nl.q) as string }).slice(0, 60);
  }, [q, f]);

  const set = (patch: Filters) => setF((p) => ({ ...p, ...patch }));

  return (
    <div className="space-y-4">
      <Panel title={`Project Lab · ${PROJECTS.length} projects`} icon={<Cpu className="h-3.5 w-3.5 text-primary" />}>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Physics project for 2nd PUC under ₹3000…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <button onClick={() => setShowFilters((v) => !v)} className="text-muted-foreground hover:text-primary">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 border-t border-primary/15 pt-3 text-xs">
            <select className="bg-muted/40 rounded-md px-2 py-2" onChange={(e) => set({ classLevel: e.target.value ? Number(e.target.value) : undefined })}>
              <option value="">Any class</option>
              {Object.entries(CLASS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select className="bg-muted/40 rounded-md px-2 py-2" onChange={(e) => set({ subject: e.target.value || undefined })}>
              <option value="">Any subject</option>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="bg-muted/40 rounded-md px-2 py-2" onChange={(e) => set({ category: e.target.value || undefined })}>
              <option value="">Any category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="bg-muted/40 rounded-md px-2 py-2" onChange={(e) => set({ difficulty: e.target.value || undefined })}>
              <option value="">Any difficulty</option>
              {Object.keys(DIFFICULTY_META).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="bg-muted/40 rounded-md px-2 py-2" onChange={(e) => set({ budgetMax: e.target.value ? Number(e.target.value) : undefined })}>
              <option value="">Any budget</option>
              {BUDGET_BANDS.map((b) => <option key={b.label} value={b.max}>{b.label}</option>)}
            </select>
            <select className="bg-muted/40 rounded-md px-2 py-2" onChange={(e) => set({ competition: e.target.value || undefined })}>
              <option value="">Any competition</option>
              {COMPETITION_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="bg-muted/40 rounded-md px-2 py-2" onChange={(e) => set({ type: e.target.value || undefined })}>
              <option value="">Any model type</option>
              {["Physical", "Hybrid", "Software"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <label className="flex items-center gap-2 px-2 py-2">
              <input type="checkbox" onChange={(e) => set({ aiOnly: e.target.checked || undefined })} /> AI / ML only
            </label>
          </div>
        )}
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        {results.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/js-center/project/${p.id}`)}
            className="text-left rounded-2xl border border-primary/25 bg-background/50 p-4 hover:border-primary/60 hover:shadow-[0_0_25px_-10px_hsl(var(--primary))] transition"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground leading-snug">{p.title}</h3>
              <span className="text-[11px] text-primary shrink-0">{p.innovation}/100</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip tone="primary">{p.subject}</Chip>
              <Chip>{DIFFICULTY_META[p.difficulty].emoji} {p.difficulty}</Chip>
              <Chip>{CLASS_LABELS[p.minClass]}–{CLASS_LABELS[p.maxClass]}</Chip>
              <Chip>₹{p.costMin}–₹{p.costMax}*</Chip>
              <Chip>{p.type}</Chip>
              {p.ai && <Chip tone="accent">AI</Chip>}
              <Chip>{p.competition}</Chip>
              <Chip>~{p.days} days</Chip>
            </div>
          </button>
        ))}
        {results.length === 0 && (
          <Panel className="sm:col-span-2"><p className="text-sm text-muted-foreground">No projects match those constraints. Loosen a filter, or ask JARVIS in chat.</p></Panel>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground/70 pb-6">* Costs are rough estimates in INR.</p>
    </div>
  );
}
