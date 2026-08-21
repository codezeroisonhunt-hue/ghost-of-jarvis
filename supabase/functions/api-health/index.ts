import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TIMEOUT_MS = 8000;

async function checkUrl(url: string) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal, headers: { "User-Agent": "PublicApiExplorer/1.0" } });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal, headers: { "User-Agent": "PublicApiExplorer/1.0" } });
    }
    clearTimeout(timer);
    const duration = Date.now() - started;
    const redirected = res.url && new URL(res.url).origin !== new URL(url).origin;
    if (res.status >= 200 && res.status < 400) return { status: redirected ? "redirected" : "healthy", http_status: res.status, duration_ms: duration };
    return { status: "unavailable", http_status: res.status, duration_ms: duration };
  } catch (err) {
    clearTimeout(timer);
    const aborted = err instanceof DOMException && err.name === "AbortError";
    return { status: aborted ? "timeout" : "unavailable", http_status: null, duration_ms: Date.now() - started };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Admin role required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body?.limit) || 25, 1), 50);
    const apiId: string | undefined = body?.apiId;

    const admin = createClient(supabaseUrl, serviceKey);
    let query = admin.from("apis").select("id, documentation_url").limit(limit);
    if (apiId) query = query.eq("id", apiId);
    else query = query.order("last_checked_at", { ascending: true, nullsFirst: true });
    const { data: apis, error } = await query;
    if (error) throw error;

    const results: Record<string, number> = { healthy: 0, redirected: 0, unavailable: 0, timeout: 0 };
    const now = new Date().toISOString();
    for (const api of apis ?? []) {
      const r = await checkUrl(api.documentation_url as string);
      results[r.status] = (results[r.status] ?? 0) + 1;
      await admin.from("apis").update({ health_status: r.status, last_checked_at: now, status: r.status === "healthy" || r.status === "redirected" ? "active" : "unavailable" }).eq("id", api.id);
      await admin.from("health_checks").insert({ api_id: api.id, status: r.status, http_status: r.http_status, duration_ms: r.duration_ms, checked_at: now });
    }

    return new Response(JSON.stringify({ checked: apis?.length ?? 0, results, checked_at: now }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("health check failed:", message);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
