import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Sparkles, ArrowRight, Zap } from "lucide-react";
import { Panel, StatTile, ApiCard, SkeletonCard } from "@/components/apis/ApiUI";
import { fetchApis, fetchCatalogStats, fetchCategories, type ApiRecord, type CategoryRecord } from "@/lib/apis/catalog";
import { useApiFavorites } from "@/hooks/useApiFavorites";

const ApiHome: React.FC = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [stats, setStats] = useState({ apiCount: 0, categoryCount: 0, noAuthCount: 0, httpsCount: 0 });
  const [featured, setFeatured] = useState<ApiRecord[]>([]);
  const [cats, setCats] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { favoriteIds, toggleFavorite } = useApiFavorites();

  useEffect(() => {
    (async () => {
      try {
        const [s, f, c] = await Promise.all([
          fetchCatalogStats(),
          fetchApis({ auth: "none", https: "yes", cors: "yes", pageSize: 6, sort: "name", page: 1 }),
          fetchCategories(),
        ]);
        setStats(s);
        setFeatured(f.rows);
        setCats(c);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-8">
      <Panel className="relative overflow-hidden p-6 sm:p-10">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-primary">
          <Sparkles className="h-3 w-3" /> Live catalog
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
          Explore <span className="text-primary">{stats.apiCount.toLocaleString()}</span> free public APIs
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Imported directly from the public-apis repository README. Search, filter by auth, HTTPS and CORS, then test
          endpoints in the built-in playground.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/apis/browse?q=${encodeURIComponent(q)}`);
          }}
          className="mt-6 flex max-w-xl gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search weather, crypto, anime, government…"
              className="w-full rounded-lg border border-primary/30 bg-input/60 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <button className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Search
          </button>
        </form>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="APIs" value={stats.apiCount.toLocaleString()} hint="from README" />
        <StatTile label="Categories" value={stats.categoryCount} hint="topics" />
        <StatTile label="No auth" value={stats.noAuthCount.toLocaleString()} hint="keyless" />
        <StatTile label="HTTPS" value={stats.httpsCount.toLocaleString()} hint="secure" />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Zap className="h-4 w-4 text-primary" /> Browser-testable picks
          </h2>
          <Link to="/apis/browse" className="text-xs text-primary hover:underline">
            View all <ArrowRight className="inline h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : featured.map((a) => (
                <ApiCard key={a.id} api={a} favorite={favoriteIds.has(a.id)} onToggleFavorite={toggleFavorite} />
              ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Browse by category</h2>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <Link
              key={c.id}
              to={`/apis/browse?category=${encodeURIComponent(c.name)}`}
              className="rounded-full border border-primary/25 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
            >
              {c.name} <span className="text-primary/70">{c.api_count}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ApiHome;
