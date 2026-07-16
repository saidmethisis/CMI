// Weather via open-meteo (no API key) with IP geolocation (ip-api) and a Tashkent fallback.
const WMO: Record<number, string> = {
  0: "Ясно", 1: "Преимущественно ясно", 2: "Переменная облачность", 3: "Пасмурно",
  45: "Туман", 48: "Изморозь", 51: "Морось", 53: "Морось", 55: "Морось",
  61: "Небольшой дождь", 63: "Дождь", 65: "Сильный дождь", 66: "Ледяной дождь", 67: "Ледяной дождь",
  71: "Небольшой снег", 73: "Снег", 75: "Сильный снег", 77: "Снежная крупа",
  80: "Ливень", 81: "Ливень", 82: "Сильный ливень", 85: "Снегопад", 86: "Снегопад",
  95: "Гроза", 96: "Гроза с градом", 99: "Гроза с градом",
};
export const wmoLabel = (c: number) => WMO[c] ?? "—";

function isPrivate(ip: string) {
  return !ip || ip === "local" || ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.") || ip === "::1";
}

export interface Weather {
  city: string; country: string;
  current: { temp: number; feels: number; humidity: number; wind: number; pressure: number; code: number; label: string };
  daily: { date: string; code: number; label: string; max: number; min: number }[];
}

export async function getWeather(ip?: string): Promise<Weather> {
  let lat = 41.311, lon = 69.24, city = "Ташкент", country = "Узбекистан";
  try {
    if (ip && !isPrivate(ip)) {
      const g = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,lat,lon`, { signal: AbortSignal.timeout(5000) }).then((r) => r.json());
      if (g.status === "success") { lat = g.lat; lon = g.lon; city = g.city; country = g.country; }
    }
  } catch { /* keep Tashkent */ }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=4&timezone=auto`;
    const w = await fetch(url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(6000) }).then((r) => r.json());
    const cur = w.current;
    if (!cur) throw new Error("no current");
    return {
      city, country,
      current: {
        temp: Math.round(cur.temperature_2m), feels: Math.round(cur.apparent_temperature), humidity: cur.relative_humidity_2m,
        wind: Math.round(cur.wind_speed_10m), pressure: Math.round(cur.surface_pressure), code: cur.weather_code, label: wmoLabel(cur.weather_code),
      },
      daily: (w.daily?.time ?? []).map((t: string, i: number) => ({
        date: t, code: w.daily.weather_code[i], label: wmoLabel(w.daily.weather_code[i]),
        max: Math.round(w.daily.temperature_2m_max[i]), min: Math.round(w.daily.temperature_2m_min[i]),
      })),
    };
  } catch {
    // Фолбэк как у currency/crypto — виджет не падает при сбое API.
    return {
      city, country,
      current: { temp: 24, feels: 23, humidity: 38, wind: 9, pressure: 1013, code: 1, label: wmoLabel(1) },
      daily: [],
    };
  }
}
