// Live News edge function — free, keyless sources (GDELT + HN Algolia)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Article {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
  image?: string;
  summary?: string;
}

async function fetchGDELT(query: string, category: string, max = 8): Promise<Article[]> {
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&maxrecords=${max}&format=json&sort=DateDesc`;
  try {
    const r = await fetch(url);
    if (!r.ok) return [];
    const text = await r.text();
    let json: any;
    try { json = JSON.parse(text); } catch { return []; }
    return (json.articles ?? []).map((a: any) => ({
      title: a.title,
      source: a.domain ?? a.sourcecountry ?? "GDELT",
      url: a.url,
      publishedAt: a.seendate ? `${a.seendate.slice(0,4)}-${a.seendate.slice(4,6)}-${a.seendate.slice(6,8)}T${a.seendate.slice(9,11)}:${a.seendate.slice(11,13)}:00Z` : new Date().toISOString(),
      category,
      image: a.socialimage || undefined,
    }));
  } catch { return []; }
}

async function fetchHN(max = 8): Promise<Article[]> {
  try {
    const r = await fetch(`https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=${max}`);
    if (!r.ok) return [];
    const j = await r.json();
    return (j.hits ?? []).filter((h: any) => h.url).map((h: any) => ({
      title: h.title,
      source: "Hacker News",
      url: h.url,
      publishedAt: h.created_at,
      category: "tech",
      summary: `${h.points ?? 0} points · ${h.num_comments ?? 0} comments`,
    }));
  } catch { return []; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    let category = url.searchParams.get("category") ?? "top";
    let topic = url.searchParams.get("topic") ?? "";
    if (req.method === "POST") {
      try {
        const b = await req.json();
        category = b.category ?? category;
        topic = b.topic ?? topic;
      } catch {}
    }

    let articles: Article[] = [];
    if (topic) {
      articles = await fetchGDELT(topic, category);
    } else {
      switch (category) {
        case "tech":
          articles = await fetchHN(12);
          break;
        case "business":
          articles = await fetchGDELT("(stocks OR economy OR markets) sourcelang:eng", "business", 12);
          break;
        case "world":
          articles = await fetchGDELT("(world OR global) sourcelang:eng", "world", 12);
          break;
        case "ai":
          articles = await fetchGDELT('("artificial intelligence" OR "AI") sourcelang:eng', "ai", 12);
          break;
        case "india":
          articles = await fetchGDELT("sourcecountry:IN sourcelang:eng", "india", 12);
          break;
        default:
          articles = await fetchGDELT("sourcelang:eng", "top", 12);
      }
    }

    // dedupe by URL
    const seen = new Set<string>();
    articles = articles.filter(a => a.url && !seen.has(a.url) && (seen.add(a.url), true));

    return new Response(JSON.stringify({ articles, category, topic, generatedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? "news error", articles: [] }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
