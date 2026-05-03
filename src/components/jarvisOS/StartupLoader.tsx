import React, { useEffect, useState } from "react";

const lines = [
  "Booting J.A.R.V.I.S core…",
  "Establishing secure uplink…",
  "Loading neural modules…",
  "Calibrating holographic interface…",
  "Welcome back, Sir.",
];

export default function StartupLoader({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setStep((s) => s + 1), 450);
    const t = setTimeout(onDone, 2400);
    return () => { clearInterval(i); clearTimeout(t); };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-jarvis-grid">
      <div className="text-center w-[min(92vw,520px)]">
        <div className="mx-auto mb-8 h-28 w-28 rounded-full border-2 border-primary/60 animate-orb-pulse flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-primary/20 border border-primary/70 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-primary shadow-[0_0_20px_hsl(var(--primary))]" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[0.3em] neon-text">J.A.R.V.I.S</h1>
        <p className="mt-1 text-xs tracking-widest text-muted-foreground">JUST A RATHER VERY INTELLIGENT SYSTEM</p>

        <div className="mt-8 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div className="h-full animate-boot-bar bg-gradient-to-r from-primary via-accent to-primary shadow-[0_0_15px_hsl(var(--primary))]" />
        </div>

        <div className="mt-6 h-32 text-left font-mono text-xs space-y-1">
          {lines.slice(0, step).map((l, i) => (
            <div key={i} className="text-primary/90 animate-fade-in">&gt; {l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
