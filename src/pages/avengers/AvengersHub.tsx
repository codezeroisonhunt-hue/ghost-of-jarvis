import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Sparkles } from "lucide-react";
import { HEROES } from "@/lib/avengers/heroes";
import HeroScene from "@/components/avengers/HeroScene";

const AvengersHub: React.FC = () => {
  const featured = HEROES[0];

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Avengers Archive — Explore Every Avenger in 3D</title>
        <meta
          name="description"
          content="Browse the Avengers Archive: animated 3D signatures, biographies, powers, gear and combat stats for twelve Avengers."
        />
        <link rel="canonical" href="/avengers" />
      </Helmet>

      <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card/40 backdrop-blur-xl">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-6 sm:p-10">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-primary">
              <Sparkles className="h-3 w-3" /> Holo dossiers
            </p>
            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">
              The <span className="text-primary">Avengers</span> Archive
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              Twelve dossiers rendered as live 3D energy signatures. Tap any Avenger for their full profile — origin,
              powers, gear, weaknesses, combat telemetry and film history.
            </p>
            <Link
              to={`/avengers/${featured.slug}`}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Open {featured.alias} dossier <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <HeroScene
            shape={featured.shape}
            colorA={featured.colorA}
            colorB={featured.colorB}
            className="h-64 w-full md:h-full"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Roster</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HEROES.map((h) => (
            <Link
              key={h.slug}
              to={`/avengers/${h.slug}`}
              className="group overflow-hidden rounded-xl border border-primary/20 bg-card/40 backdrop-blur-xl transition-all hover:border-primary/60 hover:shadow-[0_0_45px_-12px_hsl(var(--primary))]"
            >
              <HeroScene shape={h.shape} colorA={h.colorA} colorB={h.colorB} className="h-40 w-full" interactive={false} />
              <div className="border-t border-primary/15 p-4">
                <h3 className="text-base font-bold text-foreground">{h.alias}</h3>
                <p className="text-xs text-muted-foreground">{h.name}</p>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground/80">{h.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AvengersHub;
