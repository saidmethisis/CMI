"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

interface W {
  city: string; country: string;
  current: { temp: number; feels: number; humidity: number; wind: number; pressure: number; code: number; label: string };
  daily: { date: string; label: string; max: number; min: number }[];
}

export default function WeatherCard() {
  const { t, lang } = useI18n();
  const loc = lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU";
  const [w, setW] = useState<W | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    fetch("/api/weather", { cache: "no-store" }).then((r) => r.json()).then((j) => {
      if (j.data) setW(j.data); else setErr(true);
    }).catch(() => setErr(true));
  }, []);

  if (err) return <div className="card p-4 text-sm text-black/50 dark:text-white/50">{t("w.weatherNA")}</div>;
  if (!w) return <div className="card p-4"><div className="skeleton h-20 w-full rounded-lg" /></div>;

  const c = w.current;
  return (
    <section id="weather" className="card scroll-mt-20 overflow-hidden" aria-label={t("w.weather")}>
      <div className="flex items-start justify-between gap-3 bg-gradient-to-br from-brand to-brand-700 p-4 text-white">
        <div>
          <div className="text-sm opacity-80">{w.city}, {w.country}</div>
          <div className="mt-1 text-4xl font-bold tabular-nums">{c.temp}°</div>
          <div className="text-sm opacity-90">{c.label}</div>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-right text-xs">
          <dt className="opacity-70">{t("w.feels")}</dt><dd className="tabular-nums">{c.feels}°</dd>
          <dt className="opacity-70">{t("w.humidity")}</dt><dd className="tabular-nums">{c.humidity}%</dd>
          <dt className="opacity-70">{t("w.wind")}</dt><dd className="tabular-nums">{c.wind} {t("w.kmh")}</dd>
          <dt className="opacity-70">{t("w.pressure")}</dt><dd className="tabular-nums">{c.pressure} {t("w.hpa")}</dd>
        </dl>
      </div>
      {w.daily.length > 1 && (
        <div className="grid grid-cols-3 divide-x divide-black/5 dark:divide-white/10">
          {w.daily.slice(1, 4).map((d) => (
            <div key={d.date} className="p-2.5 text-center">
              <div className="text-xs text-black/45 dark:text-white/45">{new Date(d.date).toLocaleDateString(loc, { weekday: "short" })}</div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums">{d.max}° <span className="text-black/40 dark:text-white/40">/ {d.min}°</span></div>
              <div className="truncate text-[11px] text-black/45 dark:text-white/45">{d.label}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
