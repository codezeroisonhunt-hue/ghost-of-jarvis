import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { X } from "lucide-react";
import { Panel, EmptyState } from "@/components/apis/ApiUI";
import { useCompareSelection } from "@/hooks/useApiFavorites";
import { download, toCsv } from "@/lib/apis/catalog";

const FIELDS: { key: string; label: string }[] = [
  { key: "category", label: "Category" },
  { key: "auth_type", label: "Auth" },
  { key: "https", label: "HTTPS" },
  { key: "cors", label: "CORS" },
  { key: "health_status", label: "Health" },
  { key: "description", label: "Description" },
];

const ApiCompare: React.FC = () => {
  const { selected, toggleCompare, clearCompare } = useCompareSelection();

  return (
    <div className="space-y-5">
      <Helmet>
        <title>Compare APIs — Side-by-Side Free API Comparison</title>
        <meta name="description" content="Compare up to four free public APIs side by side on authentication, HTTPS, CORS and category." />
      </Helmet>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compare</h1>
          <p className="text-sm text-muted-foreground">{selected.length} of 4 selected</p>
        </div>
        {selected.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => download("comparison.csv", toCsv(selected), "text/csv")}
              className="rounded-lg border border-primary/30 px-3 py-1.5 text-xs text-primary hover:bg-primary/10"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={clearCompare}
              className="rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive"
            >
              Clear
            </button>
          </div>
        )}
      </header>

      {selected.length === 0 ? (
        <EmptyState title="Nothing to compare" hint="Tap the VS button on API cards in the directory." />
      ) : (
        <Panel className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="p-3 text-[11px] uppercase tracking-widest text-muted-foreground">Field</th>
                {selected.map((a) => (
                  <th key={a.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/apis/${a.slug}`} className="font-semibold text-primary hover:underline">
                        {a.name}
                      </Link>
                      <button type="button" aria-label={`Remove ${a.name}`} onClick={() => toggleCompare(a)}>
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FIELDS.map((f) => (
                <tr key={f.key} className="border-b border-border/40 align-top">
                  <td className="p-3 text-[11px] uppercase tracking-widest text-muted-foreground">{f.label}</td>
                  {selected.map((a) => {
                    const v = (a as unknown as Record<string, unknown>)[f.key];
                    return (
                      <td key={a.id} className="p-3 text-muted-foreground">
                        {typeof v === "boolean" ? (v ? "Yes" : "No") : String(v ?? "—")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
};

export default ApiCompare;
