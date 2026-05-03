import React from "react";
import { Feature } from "./featureRegistry";
import { Sparkles } from "lucide-react";

export default function ModulePlaceholder({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  const isRed = feature.accent === "red";
  return (
    <div className="animate-fade-in">
      <div className={`${isRed ? "glass-panel-red" : "glass-panel"} p-6 md:p-10 relative overflow-hidden scan-sweep`}>
        <div className={`h-14 w-14 rounded-2xl ${isRed ? "bg-accent/15 border-accent/50" : "bg-primary/15 border-primary/50"} border flex items-center justify-center mb-4`}>
          <Icon className={`h-7 w-7 ${isRed ? "text-accent" : "text-primary"}`} />
        </div>
        <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-1">MODULE</div>
        <h1 className="text-2xl md:text-3xl font-bold">{feature.label}</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">{feature.description}</p>

        <div className="mt-6 inline-flex items-center gap-2 text-xs tracking-widest neon-text">
          <Sparkles className="h-3.5 w-3.5" />
          AWAITING ACTIVATION
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-3 gap-3">
        {[1,2,3].map((i) => (
          <div key={i} className="glass-panel p-4">
            <div className="h-2 w-16 bg-primary/30 rounded mb-3" />
            <div className="space-y-1.5">
              <div className="h-1.5 bg-secondary rounded w-full" />
              <div className="h-1.5 bg-secondary rounded w-4/5" />
              <div className="h-1.5 bg-secondary rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
