import React from "react";
import { cn } from "@/lib/utils";

export const Panel: React.FC<React.PropsWithChildren<{ className?: string; title?: string; icon?: React.ReactNode; action?: React.ReactNode }>> = ({
  className, title, icon, action, children,
}) => (
  <section
    className={cn(
      "rounded-2xl border border-primary/25 bg-background/50 backdrop-blur-xl",
      "shadow-[0_0_30px_-12px_hsl(var(--primary)/0.5)]",
      className,
    )}
  >
    {(title || action) && (
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-primary/20">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h2 className="text-sm font-semibold tracking-widest uppercase text-primary truncate">{title}</h2>
        </div>
        {action}
      </header>
    )}
    <div className="p-4">{children}</div>
  </section>
);

export const Chip: React.FC<React.PropsWithChildren<{ tone?: "primary" | "muted" | "accent"; className?: string }>> = ({
  children, tone = "muted", className,
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-none",
      tone === "primary" && "border-primary/50 text-primary bg-primary/10",
      tone === "accent" && "border-accent/50 text-accent bg-accent/10",
      tone === "muted" && "border-border text-muted-foreground bg-muted/30",
      className,
    )}
  >
    {children}
  </span>
);

/** Minimal markdown renderer — headings, lists, tables, code, bold. */
export const Markdown: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const blocks = React.useMemo(() => text.split(/\n/), [text]);
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, k) => {
      if (part.startsWith("**")) return <strong key={k} className="text-foreground">{part.slice(2, -2)}</strong>;
      if (part.startsWith("`")) return <code key={k} className="px-1 rounded bg-muted/60 text-primary text-[0.85em]">{part.slice(1, -1)}</code>;
      return <React.Fragment key={k}>{part}</React.Fragment>;
    });

  while (i < blocks.length) {
    const line = blocks[i];

    if (line.trim().startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < blocks.length && !blocks[i].trim().startsWith("```")) { code.push(blocks[i]); i++; }
      i++;
      out.push(
        <pre key={key++} className="my-3 overflow-x-auto rounded-lg border border-primary/20 bg-black/50 p-3 text-[11px] leading-relaxed text-primary/90">
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    if (/^\s*\|.*\|\s*$/.test(line) && /^\s*\|[-\s:|]+\|\s*$/.test(blocks[i + 1] ?? "")) {
      const header = line.split("|").slice(1, -1).map((c) => c.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < blocks.length && /^\s*\|.*\|\s*$/.test(blocks[i])) {
        rows.push(blocks[i].split("|").slice(1, -1).map((c) => c.trim()));
        i++;
      }
      out.push(
        <div key={key++} className="my-3 overflow-x-auto rounded-lg border border-primary/20">
          <table className="w-full text-xs">
            <thead className="bg-primary/10 text-primary">
              <tr>{header.map((h, k) => <th key={k} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">{inline(h)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, k) => (
                <tr key={k} className="border-t border-border/50">
                  {r.map((c, j) => <td key={j} className="px-2 py-1.5 align-top text-muted-foreground">{inline(c)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      out.push(
        <h3
          key={key++}
          className={cn(
            "mt-4 mb-1 font-semibold text-primary",
            level <= 2 ? "text-base tracking-wide uppercase" : "text-sm",
          )}
        >
          {inline(h[2])}
        </h3>,
      );
      i++;
      continue;
    }

    if (/^\s*[-*•]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < blocks.length && (/^\s*[-*•]\s+/.test(blocks[i]) || /^\s*\d+[.)]\s+/.test(blocks[i]))) {
        items.push(blocks[i].replace(/^\s*([-*•]|\d+[.)])\s+/, ""));
        i++;
      }
      out.push(
        <ul key={key++} className="my-2 space-y-1 pl-4">
          {items.map((it, k) => (
            <li key={k} className="relative text-sm text-muted-foreground before:absolute before:-left-3 before:top-2 before:h-1 before:w-1 before:rounded-full before:bg-primary">
              {inline(it)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (!line.trim()) { i++; continue; }

    out.push(<p key={key++} className="my-2 text-sm leading-relaxed text-muted-foreground">{inline(line)}</p>);
    i++;
  }

  return <div className={cn("max-w-none", className)}>{out}</div>;
};

export const Loading: React.FC<{ label?: string }> = ({ label = "JARVIS is thinking" }) => (
  <div className="flex items-center gap-2 text-xs tracking-widest text-primary/80">
    <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
    {label.toUpperCase()}…
  </div>
);
