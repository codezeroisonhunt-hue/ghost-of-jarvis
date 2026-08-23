import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Panel, SkeletonCard, EmptyState } from "@/components/apis/ApiUI";
import { fetchCategories, type CategoryRecord } from "@/lib/apis/catalog";

const ApiCategories: React.FC = () => {
  const [cats, setCats] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories()
      .then(setCats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <Helmet>
        <title>API Categories — Browse 50+ Free API Groups</title>
        <meta name="description" content="Browse free public APIs grouped into 50+ categories including weather, finance, games, science and machine learning." />
      </Helmet>
      <header>
        <h1 className="text-2xl font-bold text-foreground">Categories</h1>
        <p className="text-sm text-muted-foreground">{cats.length} categories in the catalog</p>
      </header>
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : cats.length === 0 ? (
        <EmptyState title="No categories yet" hint="Run a catalog sync from the Sync page." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <Link key={c.id} to={`/apis/browse?category=${encodeURIComponent(c.name)}`}>
              <Panel className="h-full p-4 transition-all hover:border-primary/50 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.6)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground">{c.name}</h2>
                  <span className="text-lg font-bold tabular-nums text-primary">{c.api_count}</span>
                </div>
                {c.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>}
              </Panel>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiCategories;
