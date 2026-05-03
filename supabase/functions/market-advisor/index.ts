import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { stocks = [], crypto = [] } = await req.json().catch(() => ({}));
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const slim = (arr: any[]) =>
      arr.map((x) => ({
        symbol: x.symbol,
        name: x.name,
        price: x.price,
        changePct: x.changePct,
      }));

    const payload = {
      stocks: slim(stocks).slice(0, 20),
      crypto: slim(crypto).slice(0, 15),
      timestamp: new Date().toISOString(),
    };

    const systemPrompt = `You are JARVIS Market Intelligence — a fast, decisive AI market analyst.
Given a snapshot of current stocks and crypto (symbol, price, 24h % change), produce SHORT-TERM tactical signals.

For each pick, decide an action: BUY, SELL, or HOLD.
- BUY: bullish momentum, oversold bounce, or strong relative strength
- SELL: overbought, breakdown, weak relative performance, or take-profit zone
- HOLD: neutral / wait for confirmation

Be concise, confident, and specific. Use the actual symbols provided. Always include a risk disclaimer flag.
Pick 4-6 stocks and 3-5 crypto assets total. Mix BUY/SELL/HOLD honestly based on the data.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Market snapshot:\n${JSON.stringify(payload, null, 2)}\n\nGive me tactical signals now.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "emit_signals",
              description: "Emit tactical buy/sell/hold signals",
              parameters: {
                type: "object",
                properties: {
                  marketSummary: { type: "string", description: "1-2 sentence overall market read" },
                  signals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        symbol: { type: "string" },
                        assetType: { type: "string", enum: ["stock", "crypto"] },
                        action: { type: "string", enum: ["BUY", "SELL", "HOLD"] },
                        confidence: { type: "number", description: "0-100" },
                        timeframe: { type: "string", enum: ["intraday", "swing", "position"] },
                        entry: { type: "string", description: "Suggested entry price or zone" },
                        target: { type: "string", description: "Take-profit target" },
                        stopLoss: { type: "string", description: "Stop-loss level" },
                        rationale: { type: "string", description: "1-2 sentences why" },
                      },
                      required: ["symbol", "assetType", "action", "confidence", "timeframe", "rationale"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["marketSummary", "signals"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "emit_signals" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (aiResp.status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      throw new Error(`AI gateway ${aiResp.status}`);
    }

    const json = await aiResp.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    const args = call ? JSON.parse(call.function.arguments) : { marketSummary: "", signals: [] };

    return new Response(
      JSON.stringify({
        ...args,
        generatedAt: new Date().toISOString(),
        disclaimer: "AI-generated signals for informational purposes only. Not financial advice. DYOR.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("market-advisor error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
