import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  Network,
  Map as MapIcon,
  Users,
  Car,
  Bell,
  ListOrdered,
  Shapes,
  Bot,
  FileBarChart,
  ScrollText,
  Settings as SettingsIcon,
  Menu,
  X,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSecurityRole } from "@/hooks/useSecurityRole";

const NAV = [
  { to: "/security", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/security/live", label: "Live Cameras", icon: Video },
  { to: "/security/cameras", label: "Camera Network", icon: Network },
  { to: "/security/map", label: "Security Map", icon: MapIcon },
  { to: "/security/people", label: "Authorized People", icon: Users },
  { to: "/security/vehicles", label: "Vehicles", icon: Car },
  { to: "/security/alerts", label: "Alerts", icon: Bell },
  { to: "/security/events", label: "Events", icon: ListOrdered },
  { to: "/security/zones", label: "Security Zones", icon: Shapes },
  { to: "/security/assistant", label: "JARVIS Assistant", icon: Bot },
  { to: "/security/reports", label: "Reports", icon: FileBarChart },
  { to: "/security/audit", label: "Audit Logs", icon: ScrollText, adminOnly: true },
  { to: "/security/settings", label: "Settings", icon: SettingsIcon },
];

export default function SecurityLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin, roles, loading } = useSecurityRole();

  const items = NAV.filter((n) => !n.adminOnly || isAdmin);

  const Nav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
      {items.map((n) => {
        const Icon = n.icon;
        return (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all border",
                isActive
                  ? "bg-primary/15 text-primary border-primary/40 shadow-[0_0_15px_hsla(195,100%,55%,0.2)]"
                  : "text-muted-foreground border-transparent hover:bg-primary/5 hover:text-primary"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{n.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Ambient backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsla(195,100%,25%,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(hsla(195,100%,55%,0.04)_1px,transparent_1px),linear-gradient(90deg,hsla(195,100%,55%,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[248px] shrink-0 flex-col border-r border-primary/20 bg-card/40 backdrop-blur-xl">
        <div className="px-4 py-4 border-b border-primary/20">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-[10px] tracking-widest text-muted-foreground hover:text-primary transition mb-3"
          >
            <ArrowLeft className="h-3 w-3" /> JARVIS OS
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/50 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold tracking-[0.15em] text-primary truncate">SECURITY</div>
              <div className="text-[9px] tracking-widest text-muted-foreground">INTELLIGENCE</div>
            </div>
          </div>
        </div>
        <Nav />
        <div className="p-3 border-t border-primary/20 text-[10px] tracking-widest text-muted-foreground">
          {loading ? "…" : roles.length ? roles.join(" • ").toUpperCase() : "NO ROLE ASSIGNED"}
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative w-[260px] flex flex-col border-r border-primary/30 bg-card/95 backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-primary/20">
              <div className="text-xs font-bold tracking-[0.15em] text-primary">SECURITY</div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-primary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <Nav onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 flex flex-col">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-primary/20 bg-card/40 backdrop-blur-xl sticky top-0 z-40">
          <button onClick={() => setOpen(true)} className="text-primary">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-xs font-bold tracking-[0.15em] text-primary">JARVIS SECURITY</span>
        </div>
        <div className="flex-1 p-3 sm:p-5 overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
