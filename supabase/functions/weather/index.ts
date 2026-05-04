const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeoResult { name: string; country: string; admin1?: string; latitude: number; longitude: number; timezone?: string; }

const WMO: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" }, 48: { label: "Rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" }, 53: { label: "Drizzle", icon: "🌦️" }, 55: { label: "Heavy drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌦️" }, 63: { label: "Rain", icon: "🌧️" }, 65: { label: "Heavy rain", icon: "🌧️" },
  71: { label: "Light snow", icon: "🌨️" }, 73: { label: "Snow", icon: "❄️" }, 75: { label: "Heavy snow", icon: "❄️" },
  80: { label: "Rain showers", icon: "🌦️" }, 81: { label: "Heavy showers", icon: "🌧️" }, 82: { label: "Violent showers", icon: "⛈️" },
  95: { label: "Thunderstorm", icon: "⛈️" }, 96: { label: "Thunder + hail", icon: "⛈️" }, 99: { label: "Severe thunder", icon: "⛈️" },
};

function aqiCategory(aqi: number) {
  if (aqi <= 50) return { label: "Good", color: "#22c55e" };
  if (aqi <= 100) return { label: "Moderate", color: "#eab308" };
  if (aqi <= 150) return { label: "Unhealthy (Sensitive)", color: "#f97316" };
  if (aqi <= 200) return { label: "Unhealthy", color: "#ef4444" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "#a855f7" };
  return { label: "Hazardous", color: "#7f1d1d" };
}

async function geocode(query: string): Promise<GeoResult | null> {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
  const j = await r.json();
  if (!j.results?.length) return null;
  const g = j.results[0];
  return { name: g.name, country: g.country, admin1: g.admin1, latitude: g.latitude, longitude: g.longitude, timezone: g.timezone };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const query: string = body.query || "Bengaluru";
    let lat = body.lat as number | undefined;
    let lon = body.lon as number | undefined;
    let place: { name: string; country: string; admin1?: string; timezone?: string } = { name: query, country: "" };

    if (lat == null || lon == null) {
      const g = await geocode(query);
      if (!g) return new Response(JSON.stringify({ error: "Location not found" }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      lat = g.latitude; lon = g.longitude;
      place = { name: g.name, country: g.country, admin1: g.admin1, timezone: g.timezone };
    }

    const tz = "Asia/Kolkata";
    const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,cloud_cover&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,uv_index_max&timezone=${encodeURIComponent(tz)}&forecast_days=7`;
    const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=${encodeURIComponent(tz)}`;

    const [wxRes, aqRes] = await Promise.all([fetch(wxUrl), fetch(aqUrl)]);
    const wx = await wxRes.json();
    const aq = await aqRes.json().catch(() => ({}));

    const cur = wx.current || {};
    const code = cur.weather_code ?? 0;
    const w = WMO[code] || { label: "Unknown", icon: "❓" };

    const hourly = (wx.hourly?.time || []).slice(0, 24).map((t: string, i: number) => ({
      time: t,
      temp: wx.hourly.temperature_2m[i],
      pop: wx.hourly.precipitation_probability?.[i] ?? 0,
      code: wx.hourly.weather_code[i],
      icon: (WMO[wx.hourly.weather_code[i]] || w).icon,
      wind: wx.hourly.wind_speed_10m[i],
    }));

    const daily = (wx.daily?.time || []).map((t: string, i: number) => ({
      date: t,
      code: wx.daily.weather_code[i],
      icon: (WMO[wx.daily.weather_code[i]] || w).icon,
      label: (WMO[wx.daily.weather_code[i]] || w).label,
      tmax: wx.daily.temperature_2m_max[i],
      tmin: wx.daily.temperature_2m_min[i],
      sunrise: wx.daily.sunrise[i],
      sunset: wx.daily.sunset[i],
      precip: wx.daily.precipitation_sum[i],
      uv: wx.daily.uv_index_max[i],
    }));

    const aqCur = aq.current || {};
    const aqi = aqCur.us_aqi ?? null;
    const aqMeta = aqi != null ? aqiCategory(aqi) : null;

    return new Response(JSON.stringify({
      place,
      coords: { lat, lon },
      current: {
        temp: cur.temperature_2m, feels: cur.apparent_temperature, humidity: cur.relative_humidity_2m,
        wind: cur.wind_speed_10m, windDir: cur.wind_direction_10m, pressure: cur.pressure_msl,
        cloud: cur.cloud_cover, isDay: cur.is_day === 1, code, label: w.label, icon: w.icon,
        precip: cur.precipitation,
      },
      hourly, daily,
      air: aqi != null ? {
        aqi, label: aqMeta!.label, color: aqMeta!.color,
        pm25: aqCur.pm2_5, pm10: aqCur.pm10, co: aqCur.carbon_monoxide,
        no2: aqCur.nitrogen_dioxide, so2: aqCur.sulphur_dioxide, o3: aqCur.ozone,
      } : null,
      updatedAt: new Date().toISOString(),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
