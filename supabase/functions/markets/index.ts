import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STOCK_SYMBOLS = ["AAPL","MSFT","GOOGL","AMZN","NVDA","TSLA","META","NFLX","RELIANCE.NS","TCS.NS","INFY.NS","HDFCBANK.NS"];

// Stooq mappings (free, no auth, CSV) — US tickers as .us, Indian as .nse
const STOCK_TICKERS: { stooq: string; symbol: string; name: string; currency: string }[] = [
  { stooq: "aapl.us", symbol: "AAPL", name: "Apple", currency: "USD" },
  { stooq: "msft.us", symbol: "MSFT", name: "Microsoft", currency: "USD" },
  { stooq: "googl.us", symbol: "GOOGL", name: "Alphabet", currency: "USD" },
  { stooq: "amzn.us", symbol: "AMZN", name: "Amazon", currency: "USD" },
  { stooq: "nvda.us", symbol: "NVDA", name: "NVIDIA", currency: "USD" },
  { stooq: "tsla.us", symbol: "TSLA", name: "Tesla", currency: "USD" },
  { stooq: "meta.us", symbol: "META", name: "Meta", currency: "USD" },
  { stooq: "nflx.us", symbol: "NFLX", name: "Netflix", currency: "USD" },
  { stooq: "reliance.in", symbol: "RELIANCE", name: "Reliance Industries", currency: "INR" },
  { stooq: "tcs.in", symbol: "TCS", name: "Tata Consultancy", currency: "INR" },
  { stooq: "infy.in", symbol: "INFY", name: "Infosys", currency: "INR" },
  { stooq: "hdfcbank.in", symbol: "HDFCBANK", name: "HDFC Bank", currency: "INR" },
];

async function fetchStocks() {
  const list = STOCK_TICKERS.map(t => t.stooq).join(",");
  const url = `https://stooq.com/q/l/?s=${list}&f=sd2t2ohlcvn&h&e=csv`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Stooq error ${res.status}`);
  const csv = await res.text();
  const lines = csv.trim().split("\n");
  const header = lines.shift()?.split(",") ?? [];
  const idx = (k: string) => header.indexOf(k);
  const iSym = idx("Symbol"), iClose = idx("Close"), iOpen = idx("Open");

  return lines.map(line => {
    const cells = line.split(",");
    const stooqSym = (cells[iSym] || "").toLowerCase();
    const meta = STOCK_TICKERS.find(t => t.stooq === stooqSym);
    const close = parseFloat(cells[iClose]);
    const open = parseFloat(cells[iOpen]);
    const change = isFinite(close) && isFinite(open) ? close - open : null;
    const changePct = isFinite(close) && isFinite(open) && open !== 0 ? ((close - open) / open) * 100 : null;
    return {
      symbol: meta?.symbol ?? stooqSym.toUpperCase(),
      name: meta?.name ?? stooqSym,
      price: isFinite(close) ? close : null,
      change,
      changePct,
      currency: meta?.currency ?? "USD",
    };
  }).filter(s => s.price != null);
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
