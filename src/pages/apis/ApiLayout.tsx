import React from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { cn } from "@/lib/utils";
import { Boxes, Compass, Star, FolderOpen, History, GitCompare, LayoutGrid, RefreshCw, Github } from "lucide-react";
import { REPO_URL } from "@/lib/apis/catalog";

const links = [
  { to: "/apis", label: "Explore", icon: Compass, end: true },
  { to: "/apis/browse", label: "Directory", icon: LayoutGrid },
  { to: "/apis/categories", label: "Categories", icon: Boxes },
  { to: "/apis/favorites", label: "Favorites", icon: Star },
  { to: "/apis/collections", label: "Collections", icon: FolderOpen },
  { to: "/apis/history", label: "History", icon: History },
  { to: "/apis/compare", label: "Compare", icon: GitCompare },
  { to: "/apis/admin", label: "Sync", icon: RefreshCw },
];

const ApiLayout: React.FC = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Helmet>
      <title>Public APIs Explorer — Search 1,600+ Free APIs</title>
      <meta
        name="description"
        content="Search, filter and test over 1,600 free public APIs across 50+ categories, imported live from the public-apis repository."
      />
      <link rel="canonical" href="/apis" />
    </Helmet>

    <div
      className="pointer-events-none fixed inset-0 opacity-40"
      style={{
        backgroundImage:
          "radial-gradient(circle at 15% 10%, hsl(var(--primary)/0.18), transparent 45%), radial-gradient(circle at 85% 80%, hsl(var(--accent)/0.14), transparent 45%)",
      }}
    />

    <header className="sticky top-0 z-30 border-b border-primary/20 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link to="/apis" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
            <Boxes className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold tracking-[0.2em] text-primary">API EXPLORER</span>
        </Link>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="ml-auto hidden items-center gap-1 text-xs text-muted-foreground hover:text-primary sm:inline-flex"
        >
          <Github className="h-3.5 w-3.5" /> public-apis
        </a>
      </div>
      <nav className="mx-auto max-w-7xl overflow-x-auto px-2 pb-2">
        <ul className="flex min-w-max gap-1">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary/15 text-primary shadow-[0_0_18px_-6px_hsl(var(--primary))]"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )
                }
              >
                <l.icon className="h-3.5 w-3.5" />
                {l.label}
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
      Data sourced from{" "}
      <a href={REPO_URL} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">
        public-apis/public-apis
      </a>{" "}
      · Licensed under MIT · No API data is fabricated.
    </footer>
  </div>
);

export default ApiLayout;
