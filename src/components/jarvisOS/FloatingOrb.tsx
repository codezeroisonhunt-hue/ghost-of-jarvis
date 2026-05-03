import React, { useState } from "react";
import { Sparkles, X } from "lucide-react";

export default function FloatingOrb() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-primary/20 border-2 border-primary/70 animate-orb-pulse flex items-center justify-center backdrop-blur"
        aria-label="Jarvis assistant"
      >
        {open ? <X className="h-5 w-5 text-primary" /> : <Sparkles className="h-5 w-5 text-primary" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[min(92vw,340px)] glass-panel p-4 animate-fade-in scan-sweep relative overflow-hidden">
          <div className="text-xs tracking-widest neon-text mb-2">J.A.R.V.I.S</div>
          <div className="text-sm text-foreground mb-3">How may I assist you today, Sir?</div>
          <div className="flex items-center gap-1.5 text-primary mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-primary typing-dot" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-primary typing-dot" style={{ animationDelay: "150ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-primary typing-dot" style={{ animationDelay: "300ms" }} />
          </div>
          <input
            placeholder="Type a command…"
            className="w-full bg-secondary/60 border border-primary/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
      )}
    </>
  );
}
