import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Banknote, Coins, RefreshCw, ArrowRightLeft } from "lucide-react";

const REFRESH_MS = 60_000;

interface MoneyData {
  forex: { base: string; rates: Record<string, number>; timestamp: number } | null;
  metals: {
    gold: { priceUsdOz: number; inrPerGram: number | null; inr10g24k: number | null; inr10g22k: number | null } | null;
    silver: { priceUsdOz: number; inrPerGram: number | null; inr1kg: number | null } | null;
  };
  updatedAt: string;
}

const FLAG: Record<string, string> = {
  USD: "🇺🇸", INR: "🇮🇳", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵",
  AUD: "🇦🇺", CAD: "🇨🇦", CHF: "🇨🇭", CNY: "🇨🇳", SGD: "🇸🇬", AED: "🇦🇪", SAR: "🇸🇦",
};

function fmt(n: number | null | undefined, d = 2) {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
}

export default function MoneyModule() {
  const [data, setData] = useState<MoneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Converter
  const [amount, setAmount] = useState("100");
  const [fromC, setFromC] = useState("USD");
  const [toC, setToC] = useState("INR");

  async function load() {
    try {
      const { data: res, error } = await supabase.functions.invoke("money", { body: { base: "USD" } });
      if (error) throw error;
      if (res.error) throw new Error(res.error);
      setData(res); setErr(null);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const rates = data?.forex?.rates || {};
  const converted = (() => {
    const a = parseFloat(amount);
    if (isNaN(a) || !rates[fromC] || !rates[toC]) return null;
    return (a / rates[fromC]) * rates[toC];
  })();

  return (
    <div className="animate-fade-in space-y-4">
      <div className="glass-panel p-4 md:p-6 scan-sweep">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-1">MODULE</div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Banknote className="h-6 w-6 text-primary" /> Money & Metals
            </h1>
          </div>
          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}/>
            {data ? new Date(data.updatedAt).toLocaleTimeString() : "syncing…"}
          </span>
        </div>
        {err && <div className="mt-2 text-xs text-accent">⚠ {err}</div>}
      </div>

      {/* Converter */}
      <div className="glass-panel p-4">
        <h2 className="text-sm font-semibold tracking-widest text-primary mb-3 flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4" /> CURRENCY CONVERTER
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_1fr] gap-2 items-center">
          <input value={amount} onChange={e=>setAmount(e.target.value)}
            className="bg-card/40 border border-border rounded-md px-3 py-2 text-sm font-mono"/>
          <select value={fromC} onChange={e=>setFromC(e.target.value)}
            className="bg-card/40 border border-border rounded-md px-3 py-2 text-sm font-mono">
            {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="text-center text-muted-foreground">→</div>
          <select value={toC} onChange={e=>setToC(e.target.value)}
            className="bg-card/40 border border-border rounded-md px-3 py-2 text-sm font-mono">
            {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="text-right font-mono text-lg text-primary">
            {converted != null ? `${fmt(converted, 2)} ${toC}` : "—"}
          </div>
        </div>
      </div>

      {/* Forex grid */}
      <div className="glass-panel p-4">
        <h2 className="text-sm font-semibold tracking-widest text-primary mb-3">FOREX RATES (per 1 USD)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {Object.entries(rates).map(([code, rate]) => (
            <div key={code} className="rounded-lg border border-primary/20 bg-card/40 p-3">
              <div className="flex items-center justify-between">
                <div className="font-mono font-semibold text-sm">{FLAG[code] || ""} {code}</div>
              </div>
              <div className="mt-1 font-mono text-lg">{fmt(rate, code === "JPY" ? 2 : 4)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Metals */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="glass-panel p-4">
          <h2 className="text-sm font-semibold tracking-widest text-primary mb-3 flex items-center gap-2">
            <Coins className="h-4 w-4" /> GOLD
          </h2>
          {data?.metals?.gold ? (
            <div className="space-y-2 font-mono">
              <Stat label="USD / oz" value={`$${fmt(data.metals.gold.priceUsdOz)}`}/>
              <Stat label="INR / gram" value={`₹${fmt(data.metals.gold.inrPerGram)}`}/>
              <Stat label="10g · 24K" value={`₹${fmt(data.metals.gold.inr10g24k)}`}/>
              <Stat label="10g · 22K" value={`₹${fmt(data.metals.gold.inr10g22k)}`}/>
            </div>
          ) : <Empty/>}
        </div>
        <div className="glass-panel-red p-4">
          <h2 className="text-sm font-semibold tracking-widest text-accent mb-3 flex items-center gap-2">
            <Coins className="h-4 w-4" /> SILVER
          </h2>
          {data?.metals?.silver ? (
            <div className="space-y-2 font-mono">
              <Stat label="USD / oz" value={`$${fmt(data.metals.silver.priceUsdOz)}`}/>
              <Stat label="INR / gram" value={`₹${fmt(data.metals.silver.inrPerGram)}`}/>
              <Stat label="INR / kg" value={`₹${fmt(data.metals.silver.inr1kg, 0)}`}/>
            </div>
          ) : <Empty/>}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/30 py-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
function Empty() { return <div className="text-xs text-muted-foreground py-4">No data.</div>; }
