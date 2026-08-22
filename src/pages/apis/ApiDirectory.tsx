import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Download, X } from "lucide-react";
import { Panel, Chip, ApiCard, SkeletonCard, EmptyState } from "@/components/apis/ApiUI";
import {
  fetchApis,
  fetchCategories,
  toCsv,
  download,
  type ApiRecord,
  type CategoryRecord,
} from "@/lib/apis/catalog";
import { useApiFavorites, useCompareSelection } from "@/hooks/useApiFavorites";

const PAGE_SIZE = 24;

const ApiDirectory: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const [cats, setCats] = useState<CategoryRecord[]>([]);
  const [rows, setRows] = useState<ApiRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { favoriteIds, toggleFavorite } = useApiFavorites();
  const { selected, toggleCompare } = useCompareSelection();

  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "all";
  const auth = (params.get("auth") ?? "all") as "all" | "none" | "apiKey" | "OAuth" | "other";
  const https = (params.get("https") ?? "all") as "all" | "yes" | "no";
  const cors = (params.get("cors") ?? "all") as "all" | "yes" | "no" | "unknown";
  const sort = (params.get("sort") ?? "name") as "name" | "category" | "recent";
  const page = Number(params.get("page") ?? 1);

  const [term, setTerm] = useState(q);
  useEffect(() => setTerm(q), [q]);

  const update = useCallback(
    (patch: Record<string, string>) => {
      const next = new URLSearchParams(params);
      Object.entries(patch).forEach(([k, v]) => (v && v !== "all" ? next.set(k, v) : next.delete(k)));
      if (!("page" in patch)) next.delete("page");
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if (term !== q) update({ q: term });
    }, 350);
    return () => clearTimeout(t);
  }, [term, q, update]);

  useEffect(() => {
    void fetchCategories().then(setCats);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchApis({ search: q, category, auth, https, cors, sort, page, pageSize: PAGE_SIZE })
      .then((r) => {
        if (!alive) return;
        setRows(r.rows);
        setTotal(r.total);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [q, category, auth, https, cors, sort, page]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeFilters = useMemo(
    () => [category !== "all" && category, auth !== "all" && `auth: ${auth}`, https !== "all" && `https: ${https}`, cors !== "all" && `cors: ${cors}`].filter(Boolean) as string[],
    [category, auth, https, cors]
  );

  const Select: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: [string, string][] }> = ({
    label,
    value,
    onChange,
    options,
  }) => (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-primary/25 bg-input/60 px-2 py-2 text-sm outline-none focus:border-primary"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );

  const filters = (
    <div className="space-y-3">
      <Select
        label="Category"
        value={category}
        onChange={(v) => update({ category: v })}
        options={[["all", "All categories"], ...cats.map((c) => [c.name, `${c.name} (${c.api_count})`] as [string, string])]}
      />
      <Select
        label="Auth"
        value={auth}
        onChange={(v) => update({ auth: v })}
        options={[
          ["all", "Any"],
          ["none", "No auth"],
          ["apiKey", "API key"],
          ["OAuth", "OAuth"],
          ["other", "Other"],
        ]}
      />
      <Select label="HTTPS" value={https} onChange={(v) => update({ https: v })} options={[["all", "Any"], ["yes", "HTTPS only"], ["no", "HTTP"]]} />
      <Select
        label="CORS"
        value={cors}
        onChange={(v) => update({ cors: v })}
        options={[["all", "Any"], ["yes", "Enabled"], ["no", "Disabled"], ["unknown", "Unknown"]]}
      />
      <Select label="Sort" value={sort} onChange={(v) => update({ sort: v })} options={[["name", "Name"], ["category", "Category"], ["recent", "Recently synced"]]} />
      <button
        onClick={() => setParams(new URLSearchParams(), { replace: true })}
        className="w-full rounded-lg border border-border/60 py-2 text-xs text-muted-foreground hover:text-foreground"
      >
        Reset filters
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search APIs by name, description or category"
            className="w-full rounded-lg border border-primary/25 bg-input/60 py-2.5 pl-9 pr-8 text-sm outline-none focus:border-primary"
          />
          {term && (
            <button onClick={() => setTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 px-3 py-2 text-xs lg:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          </button>
          <button
            onClick={() => download("apis.json", JSON.stringify(rows, null, 2), "application/json")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 px-3 py-2 text-xs"
          >
            <Download className="h-3.5 w-3.5" /> JSON
          </button>
          <button
            onClick={() => download("apis.csv", toCsv(rows), "text/csv")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 px-3 py-2 text-xs"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeFilters.map((f) => (
            <Chip key={f} tone="primary">
              {f}
            </Chip>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Panel className={`h-fit p-4 ${showFilters ? "" : "hidden lg:block"}`}>{filters}</Panel>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {loading ? "Searching…" : `${total.toLocaleString()} APIs · page ${page} of ${pages}`}
          </p>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No APIs match those filters" hint="Try a broader search or reset the filters." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((a) => (
                <ApiCard
                  key={a.id}
                  api={a}
                  favorite={favoriteIds.has(a.id)}
                  onToggleFavorite={toggleFavorite}
                  selected={selected.some((s) => s.id === a.id)}
                  onToggleSelect={toggleCompare}
                />
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) })}
                className="rounded-lg border border-primary/25 px-3 py-1.5 text-xs disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs text-muted-foreground">
                {page} / {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => update({ page: String(page + 1) })}
                className="rounded-lg border border-primary/25 px-3 py-1.5 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiDirectory;
