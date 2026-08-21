import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REPO = "https://github.com/public-apis/public-apis";
const RAW = "https://raw.githubusercontent.com/public-apis/public-apis/master/README.md";
const COMMITS = "https://api.github.com/repos/public-apis/public-apis/commits?path=README.md&per_page=1";

type Parsed = {
  slug: string;
  name: string;
  description: string;
  category: string;
  documentation_url: string;
  auth_type: string | null;
  https: boolean | null;
  cors: string;
  postman_available: boolean;
  tags: string[];
  status: string;
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

function normAuth(raw: string): string | null {
  const v = raw.replace(/`/g, "").trim().toLowerCase();
  if (!v || v === "no" || v === "none") return null;
  if (v.includes("apikey") || v.includes("api key")) return "apiKey";
  if (v.includes("oauth")) return "OAuth";
  if (v.includes("mashape")) return "X-Mashape-Key";
  if (v.includes("user-agent")) return "User-Agent";
  return raw.replace(/`/g, "").trim();
}

function buildTags(p: Omit<Parsed, "tags">): string[] {
  const t = new Set<string>();
  t.add(slugify(p.category));
  if (!p.auth_type) t.add("free"), t.add("no-auth");
  if (p.auth_type === "apiKey") t.add("api-key");
  if (p.auth_type === "OAuth") t.add("oauth");
  if (p.auth_type && !["apiKey", "OAuth"].includes(p.auth_type)) t.add("custom-auth");
  if (p.https) t.add("https");
  else if (p.https === false) t.add("http");
  if (p.cors === "yes") t.add("cors");
  if (p.postman_available) t.add("postman");
  if (!p.auth_type && p.cors === "yes" && p.https) t.add("browser-testable");
  return [...t];
}

export function parseReadme(md: string): Parsed[] {
  const lines = md.split("\n");
  const seen = new Set<string>();
  const out: Parsed[] = [];
  let category = "";
  for (const line of lines) {
    const heading = line.match(/^#{2,4}\s+(.+?)\s*$/);
    if (heading) {
      const title = heading[1].replace(/\[|\]|\(.*?\)/g, "").replace(/[#*]/g, "").trim();
      category = /^(index|contents|contributing|license|apis covered)/i.test(title) ? "" : title;
      continue;
    }
    if (!category) continue;
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    const cells = trimmed.replace(/^\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
    if (cells.length < 5) continue;
    const link = cells[0].match(/^\[(.+?)\]\((.+?)\)/);
    if (!link) continue;
    const name = link[1].trim();
    const url = link[2].trim().split(" ")[0];
    if (!/^https?:\/\//i.test(url)) continue;

    const auth_type = normAuth(cells[2] ?? "");
    const httpsRaw = (cells[3] ?? "").replace(/`/g, "").trim().toLowerCase();
    const https = httpsRaw === "yes" ? true : httpsRaw === "no" ? false : null;
    const corsRaw = (cells[4] ?? "").replace(/`/g, "").trim().toLowerCase();
    const cors = corsRaw === "yes" ? "yes" : corsRaw === "no" ? "no" : "unknown";
    const postman_available = /getpostman|postman\.com/i.test(url);

    const base = {
      slug: "",
      name,
      description: (cells[1] ?? "").replace(/\s+/g, " ").trim(),
      category,
      documentation_url: url,
      auth_type,
      https,
      cors,
      postman_available,
      status: "unknown",
    };
    let slug = slugify(`${name}`);
    if (!slug) continue;
    if (seen.has(slug)) slug = slugify(`${name}-${category}`);
    let n = 2;
    while (seen.has(slug)) slug = `${slugify(name)}-${n++}`;
    seen.add(slug);
    out.push({ ...base, slug, tags: buildTags(base) });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const mdRes = await fetch(RAW, { headers: { "User-Agent": "public-api-explorer" } });
    if (!mdRes.ok) throw new Error(`Failed to fetch README (${mdRes.status})`);
    const md = await mdRes.text();

    let commit: string | null = null;
    try {
      const cRes = await fetch(COMMITS, { headers: { "User-Agent": "public-api-explorer", Accept: "application/vnd.github+json" } });
      if (cRes.ok) {
        const json = await cRes.json();
        commit = json?.[0]?.sha ?? null;
      }
    } catch (_) { /* commit is optional */ }

    const parsed = parseReadme(md);
    if (parsed.length < 100) throw new Error("Parser returned too few entries — aborting sync to protect existing data");

    const { data: existing, error: exErr } = await admin.from("apis").select("id, slug, name, description, category, documentation_url, auth_type, https, cors");
    if (exErr) throw exErr;
    const existingMap = new Map((existing ?? []).map((r: Record<string, unknown>) => [r.slug as string, r]));

    let added = 0, updated = 0;
    const now = new Date().toISOString();
    const rows = parsed.map((p) => {
      const prev = existingMap.get(p.slug);
      if (!prev) added++;
      else if (
        prev.name !== p.name || prev.description !== p.description || prev.category !== p.category ||
        prev.documentation_url !== p.documentation_url || prev.auth_type !== p.auth_type ||
        prev.https !== p.https || prev.cors !== p.cors
      ) updated++;
      return { ...p, source_repository: REPO, source_commit: commit, last_synced_at: now, updated_at: now };
    });

    for (let i = 0; i < rows.length; i += 400) {
      const { error } = await admin.from("apis").upsert(rows.slice(i, i + 400), { onConflict: "slug" });
      if (error) throw error;
    }

    const parsedSlugs = new Set(parsed.map((p) => p.slug));
    const stale = (existing ?? []).filter((r: Record<string, unknown>) => !parsedSlugs.has(r.slug as string));
    let removed = 0;
    if (stale.length) {
      const ids = stale.map((r: Record<string, unknown>) => r.id as string);
      for (let i = 0; i < ids.length; i += 400) {
        const { error } = await admin.from("apis").delete().in("id", ids.slice(i, i + 400));
        if (error) throw error;
      }
      removed = ids.length;
    }

    const counts = new Map<string, number>();
    for (const p of parsed) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    const catRows = [...counts.entries()].map(([name, api_count]) => ({
      name, slug: slugify(name), api_count, updated_at: now,
    }));
    const { error: catErr } = await admin.from("api_categories").upsert(catRows, { onConflict: "name" });
    if (catErr) throw catErr;
    await admin.from("api_categories").delete().not("name", "in", `(${[...counts.keys()].map((c) => `"${c.replace(/"/g, '')}"`).join(",")})`);

    const report = {
      repository_commit: commit,
      api_count: parsed.length,
      category_count: counts.size,
      added, updated, removed,
      status: "success",
      started_by: user.id,
    };
    await admin.from("sync_runs").insert(report);

    return new Response(JSON.stringify({ ...report, last_synced_at: now, repository: REPO }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("sync failed:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
