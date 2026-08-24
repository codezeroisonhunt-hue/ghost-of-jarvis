import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Shield, Home } from "lucide-react";
import { HEROES } from "@/lib/avengers/heroes";
import { cn } from "@/lib/utils";

const AvengersLayout: React.FC = () => (
  <div className="relative min-h-screen bg-background text-foreground">
    <Helmet>
      <title>Avengers Archive — 3D Hero Dossiers</title>
      <meta
        name="description"
        content="A futuristic Avengers archive with animated 3D hero signatures, full dossiers, powers, gear, stats and film history for every Avenger."
      />
      <meta property="og:title" content="Avengers Archive — 3D Hero Dossiers" />
      <meta property="og:description" content="Explore animated 3D dossiers for every Avenger: powers, gear, stats and film history." />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>

    <div
      className="pointer-events-none fixed inset-0 opacity-60"
      style={{
        backgroundImage:
          "radial-gradient(circle at 12% 8%, hsl(var(--primary)/0.22), transparent 45%), radial-gradient(circle at 88% 85%, hsl(var(--accent)/0.18), transparent 45%)",
      }}
    />

    <header className="sticky top-0 z-30 border-b border-primary/20 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link to="/avengers" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
            <Shield className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold tracking-[0.28em] text-primary">AVENGERS ARCHIVE</span>
        </Link>
        <Link to="/dashboard" className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <Home className="h-3.5 w-3.5" /> JARVIS OS
        </Link>
      </div>
      <nav className="mx-auto max-w-7xl overflow-x-auto px-2 pb-2">
        <ul className="flex min-w-max gap-1">
          {HEROES.map((h) => (
            <li key={h.slug}>
              <NavLink
                to={`/avengers/${h.slug}`}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary/15 text-primary shadow-[0_0_18px_-6px_hsl(var(--primary))]"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )
                }
              >
                {h.alias}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>

    <main className="relative mx-auto max-w-7xl px-4 py-6">
      <Outlet />
    </main>

    <footer className="relative border-t border-primary/15 py-6 text-center text-xs text-muted-foreground">
      Fan-made archive · Characters are trademarks of Marvel · Visuals are original abstract renders
    </footer>
  </div>
);

export default AvengersLayout;
