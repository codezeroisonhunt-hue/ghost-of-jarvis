import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ShieldCheck, KeyRound, Globe, Star, ExternalLink } from "lucide-react";
import type { ApiRecord } from "@/lib/apis/catalog";

export const Panel: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => (
  <div
    className={cn(
      "rounded-xl border border-primary/20 bg-card/60 backdrop-blur-xl shadow-[0_0_30px_-12px_hsl(var(--primary)/0.55)]",
      className
    )}
  >
    {children}
  </div>
);

export const Chip: React.FC<React.PropsWithChildren<{ tone?: "primary" | "muted" | "accent"; className?: string }>> = ({
  children,
  tone = "muted",
  className,
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide",
      tone === "primary" && "border-primary/40 bg-primary/10 text-primary",
      tone === "accent" && "border-accent/40 bg-accent/10 text-accent",
      tone === "muted" && "border-border/60 bg-muted/40 text-muted-foreground",
      className
    )}
  >
    {children}
  </span>
);

export const StatTile: React.FC<{ label: string; value: string | number; hint?: string }> = ({ label, value, hint }) => (
  <Panel className="p-4">
    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
    <p className="mt-1 text-2xl font-bold text-primary tabular-nums">{value}</p>
    {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
  </Panel>
);

export const EmptyState: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <Panel className="p-10 text-center">
    <p className="text-lg font-semibold text-foreground">{title}</p>
    {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
  </Panel>
);

export const SkeletonCard = () => (
  <Panel className="h-40 animate-pulse p-4">
    <div className="h-4 w-1/3 rounded bg-muted/60" />
    <div className="mt-3 h-3 w-full rounded bg-muted/40" />
    <div className="mt-2 h-3 w-4/5 rounded bg-muted/40" />
    <div className="mt-6 h-5 w-24 rounded-full bg-muted/40" />
  </Panel>
);

export const ApiCard: React.FC<{
  api: ApiRecord;
  favorite?: boolean;
  onToggleFavorite?: (api: ApiRecord) => void;
  selected?: boolean;
  onToggleSelect?: (api: ApiRecord) => void;
}> = ({ api, favorite, onToggleFavorite, selected, onToggleSelect }) => (
  <Panel className="group relative flex h-full flex-col p-4 transition-all hover:border-primary/50 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.7)]">
    <div className="flex items-start justify-between gap-2">
      <Link to={`/apis/${api.slug}`} className="min-w-0">
        <h3 className="truncate text-base font-semibold text-foreground group-hover:text-primary">{api.name}</h3>
        <p className="text-[11px] uppercase tracking-widest text-primary/70">{api.category}</p>
      </Link>
      <div className="flex shrink-0 items-center gap-1">
        {onToggleSelect && (
          <button
            type="button"
            aria-label="Add to comparison"
            onClick={() => onToggleSelect(api)}
            className={cn(
              "rounded-md border px-1.5 py-1 text-[10px]",
              selected ? "border-accent/60 bg-accent/20 text-accent" : "border-border/60 text-muted-foreground"
            )}
          >
            VS
          </button>
        )}
        {onToggleFavorite && (
          <button
            type="button"
            aria-label={favorite ? "Remove favorite" : "Add favorite"}
            onClick={() => onToggleFavorite(api)}
            className="rounded-md border border-border/60 p-1 text-muted-foreground hover:text-primary"
          >
            <Star className={cn("h-3.5 w-3.5", favorite && "fill-primary text-primary")} />
          </button>
        )}
      </div>
    </div>
    <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{api.description || "No description provided."}</p>
    <div className="mt-3 flex flex-wrap gap-1.5">
      <Chip tone={api.auth_type ? "accent" : "primary"}>
        <KeyRound className="h-3 w-3" /> {api.auth_type ?? "No auth"}
      </Chip>
      {api.https && (
        <Chip tone="primary">
          <ShieldCheck className="h-3 w-3" /> HTTPS
        </Chip>
      )}
      <Chip>
        <Globe className="h-3 w-3" /> CORS {api.cors}
      </Chip>
    </div>
    <div className="mt-3 flex items-center justify-between text-xs">
      <Link to={`/apis/${api.slug}`} className="font-medium text-primary hover:underline">
        Details
      </Link>
      <a
        href={api.documentation_url}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
      >
        Docs <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  </Panel>
);
