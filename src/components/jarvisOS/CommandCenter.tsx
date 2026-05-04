import React from "react";
import { FEATURES, FeatureKey } from "./featureRegistry";
import { Activity, Cpu, Wifi, Zap } from "lucide-react";
import WeatherDashboardCard from "./WeatherDashboardCard";

const stats = [
  { label: "System", value: "98%", icon: Cpu },
  { label: "Network", value: "STABLE", icon: Wifi },
  { label: "Power", value: "OPTIMAL", icon: Zap },
  { label: "AI Load", value: "23%", icon: Activity },
];

export default function CommandCenter({ onOpen }: { onOpen: (k: FeatureKey) => void }) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="glass-panel p-5 md:p-7 relative overflow-hidden scan-sweep">
        <div className="text-xs tracking-[0.4em] neon-text mb-1">SYSTEM ONLINE</div>
        <h1 className="text-2xl md:text-4xl font-bold">
          {greet}, <span className="neon-text">Sir</span>.
        </h1>
        <p className="text-sm text-muted-foreground mt-1">All systems operational. 17 modules ready.</p>
      </div>

      {/* Live Weather */}
      <WeatherDashboardCard onOpen={() => onOpen("weather")} />

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-panel p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-[10px] tracking-widest text-muted-foreground">{s.label}</div>
                <div className="text-sm font-bold neon-text">{s.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Module grid */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm tracking-widest text-muted-foreground">MODULES</h3>
          <span className="text-[10px] text-muted-foreground">Tap to open</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {FEATURES.filter((f) => f.key !== "command-center").map((f) => {
            const Icon = f.icon;
            const red = f.accent === "red";
            return (
              <button
                key={f.key}
                onClick={() => onOpen(f.key)}
                className="group glass-panel p-4 text-left hover:scale-[1.02] transition-all relative overflow-hidden"
              >
                <div className={`h-10 w-10 rounded-lg border flex items-center justify-center mb-3 ${red ? "bg-accent/15 border-accent/40" : "bg-primary/15 border-primary/40"}`}>
                  <Icon className={`h-5 w-5 ${red ? "text-accent" : "text-primary"}`} />
                </div>
                <div className="text-sm font-semibold">{f.label}</div>
                <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{f.description}</div>
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
