const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const BLOCKED_HEADERS = ["host", "content-length", "connection", "cookie"];
const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 20_000;

function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || h === "metadata.google.internal") return true;
  if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.)/.test(h)) return true;
  const m = h.match(/^172\.(\d+)\./);
  if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
  if (h === "::1" || h.startsWith("[::1")) return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const started = Date.now();
  try {
    const { method = "GET", url, headers = {}, body } = await req.json();
    if (typeof url !== "string" || !url) throw new Error("A request URL is required");
    let target: URL;
    try { target = new URL(url); } catch { throw new Error("The request URL is not valid"); }
    if (!["http:", "https:"].includes(target.protocol)) throw new Error("Only http and https URLs can be proxied");
    if (isBlockedHost(target.hostname)) throw new Error("Requests to internal or local addresses are not allowed");
    const upper = String(method).toUpperCase();
    if (!ALLOWED_METHODS.includes(upper)) throw new Error(`Unsupported HTTP method: ${upper}`);

    const outHeaders = new Headers();
    for (const [k, v] of Object.entries(headers as Record<string, string>)) {
      if (!k || BLOCKED_HEADERS.includes(k.toLowerCase())) continue;
      if (typeof v === "string" && v.length) outHeaders.set(k, v);
    }
    if (!outHeaders.has("accept")) outHeaders.set("accept", "*/*");
    if (!outHeaders.has("user-agent")) outHeaders.set("user-agent", "PublicApiExplorer/1.0");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(target.toString(), {
        method: upper,
        headers: outHeaders,
        body: ["GET", "HEAD"].includes(upper) ? undefined : (typeof body === "string" ? body : body ? JSON.stringify(body) : undefined),
        signal: controller.signal,
        redirect: "follow",
      });
    } catch (err) {
      clearTimeout(timer);
      const aborted = err instanceof DOMException && err.name === "AbortError";
      return new Response(JSON.stringify({
        ok: false,
        error: aborted ? "The request timed out after 20 seconds" : "The request could not reach the API (network or DNS failure)",
        durationMs: Date.now() - started,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    clearTimeout(timer);

    const buf = new Uint8Array(await res.arrayBuffer());
    const truncated = buf.length > MAX_BYTES;
    const text = new TextDecoder().decode(truncated ? buf.slice(0, MAX_BYTES) : buf);
    const resHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => { if (!["set-cookie"].includes(k.toLowerCase())) resHeaders[k] = v; });

    return new Response(JSON.stringify({
      ok: true,
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
      body: text,
      truncated,
      durationMs: Date.now() - started,
      finalUrl: res.url,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected proxy error";
    return new Response(JSON.stringify({ ok: false, error: message, durationMs: Date.now() - started }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
