import React from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Quote } from "lucide-react";
import { getHero, HEROES } from "@/lib/avengers/heroes";
import HeroScene from "@/components/avengers/HeroScene";

const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
    </div>
    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted/40">
      <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
    </div>
  </div>
);

const Panel: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="rounded-xl border border-primary/20 bg-card/40 p-4 backdrop-blur-xl">
    <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">{title}</h2>
    {children}
  </section>
);

const List: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="space-y-1 text-sm text-muted-foreground">
    {items.map((i) => (
      <li key={i} className="flex gap-2">
        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
        {i}
      </li>
    ))}
  </ul>
);

const HeroDetail: React.FC = () => {
  const { slug } = useParams();
  const hero = getHero(slug);

  if (!hero) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">Avenger not found</h1>
        <Link to="/avengers" className="mt-3 inline-block text-sm text-primary hover:underline">
          Back to the archive
        </Link>
      </div>
    );
  }

  const idx = HEROES.findIndex((h) => h.slug === hero.slug);
  const next = HEROES[(idx + 1) % HEROES.length];

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{`${hero.alias} — ${hero.name} | Avengers Archive`}</title>
        <meta name="description" content={`${hero.alias} dossier: ${hero.tagline} Powers, gear, weaknesses, combat stats and film history for ${hero.name}.`} />
        <link rel="canonical" href={`/avengers/${hero.slug}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: hero.name,
            alternateName: hero.alias,
            description: hero.bio,
            affiliation: hero.affiliation.map((a) => ({ "@type": "Organization", name: a })),
          })}
        </script>
      </Helmet>

      <Link to="/avengers" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Archive
      </Link>

      <section className="grid gap-4 overflow-hidden rounded-2xl border border-primary/25 bg-card/40 backdrop-blur-xl md:grid-cols-2">
        <HeroScene shape={hero.shape} colorA={hero.colorA} colorB={hero.colorB} className="h-72 w-full md:h-full" />
        <div className="p-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary">{hero.species}</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">{hero.alias}</h1>
          <p className="text-sm text-muted-foreground">{hero.name}</p>
          <p className="mt-4 text-sm text-foreground/90">{hero.bio}</p>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-muted-foreground">First appearance</dt>
              <dd className="text-foreground">{hero.firstAppearance}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Base of operations</dt>
              <dd className="text-foreground">{hero.base}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">Affiliations</dt>
              <dd className="text-foreground">{hero.affiliation.join(" · ")}</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Combat telemetry">
          <div className="space-y-3">
            {Object.entries(hero.stats).map(([k, v]) => (
              <StatBar key={k} label={k} value={v} color={`linear-gradient(90deg, ${hero.colorA}, ${hero.colorB})`} />
            ))}
          </div>
        </Panel>
        <Panel title="Powers & abilities">
          <List items={hero.powers} />
        </Panel>
        <Panel title="Signature gear">
          <List items={hero.gear} />
        </Panel>
        <Panel title="Known vulnerabilities">
          <List items={hero.weaknesses} />
        </Panel>
        <Panel title="Field appearances">
          <div className="flex flex-wrap gap-2">
            {hero.films.map((f) => (
              <span key={f} className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs text-muted-foreground">
                {f}
              </span>
            ))}
          </div>
        </Panel>
        <Panel title="Transcript fragments">
          <div className="space-y-3">
            {hero.quotes.map((q) => (
              <blockquote key={q} className="flex gap-2 text-sm italic text-foreground/85">
                <Quote className="h-3.5 w-3.5 shrink-0 text-primary" />
                {q}
              </blockquote>
            ))}
          </div>
        </Panel>
      </div>

      <Link
        to={`/avengers/${next.slug}`}
        className="flex items-center justify-between rounded-xl border border-primary/20 bg-card/40 p-4 backdrop-blur-xl hover:border-primary/60"
      >
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Next dossier</span>
        <span className="text-sm font-semibold text-primary">{next.alias} →</span>
      </Link>
    </div>
  );
};

export default HeroDetail;
