import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchForex(base = "USD") {
  const url = `https://open.er-api.com/v6/latest/${base}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`forex ${res.status}`);
  const json = await res.json();
  if (json.result !== "success") throw new Error("forex: non-success");
  const codes = ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "SGD", "AED", "SAR"];
  const rates: Record<string, number> = {};
  for (const c of codes) if (json.rates[c] != null) rates[c] = json.rates[c];
  return { base: json.base_code, rates, timestamp: json.time_last_update_unix };
}

async function fetchMetal(symbol: "XAU" | "XAG") {
  // gold-api.com is keyless. Returns USD per troy ounce.
  const url = `https://api.gold-api.com/price/${symbol}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`metal ${symbol} ${res.status}`);
  const json = await res.json();
  return { symbol, priceUsdOz: json.price as number, updatedAt: json.updatedAt };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const base = body.base || url.searchParams.get("base") || "USD";

    const [forexR, goldR, silverR] = await Promise.allSettled([
      fetchForex(base),
      fetchMetal("XAU"),
      fetchMetal("XAG"),
    ]);

    const forex = forexR.status === "fulfilled" ? forexR.value : null;
    const gold = goldR.status === "fulfilled" ? goldR.value : null;
    const silver = silverR.status === "fulfilled" ? silverR.value : null;

    // Indian per-gram (10g for 22k/24k retail estimates)
    const inrPerUsd = forex?.rates?.INR ?? null;
    const ozToGram = 31.1035;
    const goldInrPerGram = gold && inrPerUsd ? (gold.priceUsdOz * inrPerUsd) / ozToGram : null;
    const silverInrPerGram = silver && inrPerUsd ? (silver.priceUsdOz * inrPerUsd) / ozToGram : null;

    return new Response(JSON.stringify({
      forex,
      metals: {
        gold: gold ? { ...gold, inrPerGram: goldInrPerGram, inr10g24k: goldInrPerGram ? goldInrPerGram * 10 : null, inr10g22k: goldInrPerGram ? goldInrPerGram * 10 * (22/24) : null } : null,
        silver: silver ? { ...silver, inrPerGram: silverInrPerGram, inr1kg: silverInrPerGram ? silverInrPerGram * 1000 : null } : null,
      },
      updatedAt: new Date().toISOString(),
      errors: {
        forex: forexR.status === "rejected" ? String(forexR.reason) : null,
        gold: goldR.status === "rejected" ? String(goldR.reason) : null,
        silver: silverR.status === "rejected" ? String(silverR.reason) : null,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
