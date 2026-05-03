import React from "react";
import { FEATURES, FeatureKey } from "./featureRegistry";
import { cn } from "@/lib/utils";
import { ChevronLeft, Zap } from "lucide-react";

interface Props {
  active: FeatureKey;
  onSelect: (k: FeatureKey) => void;
  collapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
  mobile?: boolean;
}

export default function JarvisSidebar({ active, onSelect, collapsed, onToggle, onClose, mobile }: Props) {
  return (
    <aside
      className={cn(
        "h-full flex flex-col glass-panel rounded-none md:rounded-r-2xl border-l-0 transition-all duration-300 overflow-hidden",
        collapsed && !mobile ? "w-[72px]" : "w-[260px]"
      )}
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-primary/20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-full bg-primary/20 border border-primary/60 flex items-center justify-center animate-orb-pulse shrink-0">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          {(!collapsed || mobile) && (
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-widest neon-text truncate">JARVIS</div>
              <div className="text-[10px] tracking-widest text-muted-foreground">ONLINE</div>
            </div>
          )}
        </div>
        {!mobile && (
          <button onClick={onToggle} className="text-muted-foreground hover:text-primary transition">
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          const isActive = f.key === active;
          return (
            <button
              key={f.key}
              onClick={() => { onSelect(f.key); onClose?.(); }}
              className={cn(
                "group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all relative",
                isActive
                  ? "bg-primary/15 text-primary shadow-[0_0_15px_hsla(195,100%,55%,0.25)] border border-primary/40"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary border border-transparent"
              )}
            >
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />}
              <Icon className={cn("h-5 w-5 shrink-0", f.accent === "red" && "text-accent")} />
              {(!collapsed || mobile) && (
                <span className="text-sm truncate">{f.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {(!collapsed || mobile) && (
        <div className="p-3 border-t border-primary/20 text-[10px] text-muted-foreground tracking-widest">
          v2.0 • SECURE LINK
        </div>
      )}
    </aside>
  );
}
