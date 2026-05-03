import React, { useEffect, useState } from "react";
import { Menu, Search, Bell, User } from "lucide-react";
import { Feature } from "./featureRegistry";

export default function JarvisTopBar({ feature, onMenu }: { feature: Feature; onMenu: () => void }) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const t = () => setTime(new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    }).format(new Date()));
    t(); const i = setInterval(t, 1000); return () => clearInterval(i);
  }, []);

  return (
    <header className="h-14 flex items-center gap-3 px-3 md:px-5 glass-panel rounded-none border-x-0 border-t-0">
      <button onClick={onMenu} className="md:hidden text-primary">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2 min-w-0">
        <feature.icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm md:text-base font-semibold tracking-wider truncate">{feature.label}</h2>
      </div>

      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Ask J.A.R.V.I.S anything…"
            className="w-full bg-secondary/60 border border-primary/30 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-primary focus:shadow-[0_0_15px_hsla(195,100%,55%,0.3)]"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden sm:block text-xs font-mono neon-text tracking-widest">{time} IST</div>
        <button className="relative text-muted-foreground hover:text-primary">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent animate-pulse" />
        </button>
        <button className="h-8 w-8 rounded-full border border-primary/40 flex items-center justify-center text-primary">
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
