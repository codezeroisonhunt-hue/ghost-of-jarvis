import React from "react";
import { cn } from "@/lib/utils";
import { severityClass } from "@/lib/security/types";

export const Panel = ({
  title,
  action,
  className,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) => (
  <section
    className={cn(
      "rounded-xl border border-primary/20 bg-card/50 backdrop-blur-xl shadow-[0_0_30px_hsla(195,100%,55%,0.06)] overflow-hidden",
      className
    )}
  >
    {(title || action) && (
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-primary/15">
        <h2 className="text-[11px] font-semibold tracking-[0.18em] text-primary/90 uppercase">{title}</h2>
        {action}
      </header>
    )}
    <div className="p-4">{children}</div>
  </section>
);

export const Stat = ({
  label,
  value,
  hint,
  tone = "primary",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "primary" | "danger" | "warn" | "ok" | "muted";
}) => {
  const toneClass = {
    primary: "text-primary",
    danger: "text-accent",
    warn: "text-yellow-400",
    ok: "text-emerald-400",
    muted: "text-muted-foreground",
  }[tone];
  return (
    <div className="rounded-lg border border-primary/15 bg-background/40 backdrop-blur-md px-3 py-2.5">
      <div className="text-[10px] tracking-[0.15em] text-muted-foreground uppercase truncate">{label}</div>
      <div className={cn("text-xl font-bold tabular-nums leading-tight mt-0.5", toneClass)}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{hint}</div>}
    </div>
  );
};

export const SeverityBadge = ({ severity }: { severity: string }) => (
  <span
    className={cn(
      "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase",
      severityClass(severity)
    )}
  >
    {severity}
  </span>
);

export const StatusDot = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    online: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
    warning: "bg-yellow-400 shadow-[0_0_8px_#facc15]",
    alert: "bg-accent shadow-[0_0_8px_hsl(var(--accent))]",
    offline: "bg-muted-foreground",
  };
  return (
    <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
      {status !== "offline" && (
        <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping", map[status])} />
      )}
      <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", map[status] ?? map.offline)} />
    </span>
  );
};

export const SimBadge = () => (
  <span className="inline-flex items-center rounded border border-yellow-400/50 bg-yellow-400/10 px-1.5 py-0.5 text-[9px] font-bold tracking-[0.15em] text-yellow-400">
    SIMULATION
  </span>
);

export const EmptyState = ({ message, hint }: { message: string; hint?: string }) => (
  <div className="py-10 text-center">
    <p className="text-sm text-muted-foreground">{message}</p>
    {hint && <p className="text-xs text-muted-foreground/70 mt-1">{hint}</p>}
  </div>
);
