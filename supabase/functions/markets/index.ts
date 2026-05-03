import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STOCK_SYMBOLS = ["AAPL","MSFT","GOOGL","AMZN","NVDA","TSLA","META","NFLX","RELIANCE.NS","TCS.NS","INFY.NS","HDFCBANK.NS"];

async function fetchStocks() {
  const symbols = STOCK_SYMBOLS.join(",");
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; JarvisOS/1.0)",
      "Accept": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Yahoo error ${res.status}`);
  const json = await res.json();
  const quotes = json?.quoteResponse?.result ?? [];
  return quotes.map((q: any) => ({
    symbol: q.symbol,
    name: q.shortName || q.longName || q.symbol,
    price: q.regularMarketPrice,
    change: q.regularMarketChange,
    changePct: q.regularMarketChangePercent,
    currency: q.currency,
    marketState: q.marketState,
  }));
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
