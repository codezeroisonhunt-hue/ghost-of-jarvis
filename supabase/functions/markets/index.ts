import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};



// Stooq mappings (free, no auth, CSV) — US tickers as .us, Indian as .nse
const STOCK_TICKERS: { symbol: string; name: string }[] = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "META", name: "Meta" },
  { symbol: "NFLX", name: "Netflix" },
  { symbol: "RELIANCE.NS", name: "Reliance Industries" },
  { symbol: "TCS.NS", name: "Tata Consultancy" },
  { symbol: "INFY.NS", name: "Infosys" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank" },
];

async function fetchOne(symbol: string, name: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`${symbol} ${res.status}`);
  const json = await res.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error(`${symbol} no meta`);
  const price = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose ?? meta.previousClose;
  const change = price - prev;
  const changePct = prev ? (change / prev) * 100 : 0;
  return {
    symbol,
    name: meta.shortName || meta.longName || name,
    price,
    change,
    changePct,
    currency: meta.currency || "USD",
  };
}

async function fetchStocks() {
  const results = await Promise.allSettled(STOCK_TICKERS.map(t => fetchOne(t.symbol, t.name)));
  return results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
    .map(r => r.value);
}

async function fetchCrypto() {
  const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=12&page=1&price_change_percentage=24h";
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`CoinGecko error ${res.status}`);
  const json = await res.json();
  return json.map((c: any) => ({
    id: c.id,
    symbol: c.symbol?.toUpperCase(),
    name: c.name,
    image: c.image,
    price: c.current_price,
    change: c.price_change_24h,
    changePct: c.price_change_percentage_24h,
    marketCap: c.market_cap,
  }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const [stocks, crypto] = await Promise.allSettled([fetchStocks(), fetchCrypto()]);
    const stocksData = stocks.status === "fulfilled" ? stocks.value : [];
    const cryptoData = crypto.status === "fulfilled" ? crypto.value : [];

    const sortedStocks = [...stocksData].sort((a,b) => (b.changePct ?? 0) - (a.changePct ?? 0));
    const gainers = sortedStocks.filter(s => (s.changePct ?? 0) > 0).slice(0, 5);
    const losers = [...sortedStocks].reverse().filter(s => (s.changePct ?? 0) < 0).slice(0, 5);

    return new Response(JSON.stringify({
      stocks: stocksData,
      crypto: cryptoData,
      gainers,
      losers,
      updatedAt: new Date().toISOString(),
      errors: {
        stocks: stocks.status === "rejected" ? String(stocks.reason) : null,
        crypto: crypto.status === "rejected" ? String(crypto.reason) : null,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
