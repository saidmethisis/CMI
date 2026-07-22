"use client";
import { useCallback, useEffect, useState } from "react";
import type { Rate } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";

// Official Central Bank of Uzbekistan rates for the homepage.
// Real data only (cbu.uz) — no per-bank quotes are shown, because there is no
// public source for commercial-bank rates and inventing a spread would be fiction.
// Refreshes itself so a long-open tab picks up the daily update without a reload.
const REFRESH_MS = 5 * 60 * 1000;

export default function RatesBoard() {
  const { t, lang } = useI18n();
  const loc = lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU";
  const [rates, setRates] = useState<Rate[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [source, setSource] = useState("");
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/currency", { cache: "no-store" });
      const j = await r.json();
      setRates(j.data ?? []);
      setUpdatedAt(j.updatedAt ?? "");
      setSource(j.source ?? "");
      setErr(false);
    } catch {
      setErr(true);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(id); window.removeEventListener("focus", onFocus); };
  }, [load]);

  return (
    <section className="card overflow-hidden" aria-label={t("w.cbuTitle")}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-black/5 px-4 py-3 dark:border-white/10">
        <h2 className="font-serif text-lg font-bold">{t("w.cbuTitle")}</h2>
        <span className="ml-auto text-xs text-black/45 dark:text-white/45">
          {source === "fallback" ? t("w.fallback") : t("w.updated")}: {updatedAt ? new Date(updatedAt).toLocaleDateString(loc) : "…"}
        </span>
      </div>

      {err && rates.length === 0 ? (
        <p className="px-4 py-6 text-sm text-black/50 dark:text-white/50">{t("w.ratesNA")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-px bg-black/[0.06] sm:grid-cols-3 lg:grid-cols-5 dark:bg-white/[0.08]">
          {rates.length === 0
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-[var(--surface)] p-3"><div className="skeleton h-10 w-full rounded" /></div>
              ))
            : rates.map((r) => {
                const up = r.diff >= 0;
                return (
                  <div key={r.code} className="bg-[var(--surface)] p-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold">{r.code}</span>
                      <span className={`text-[11px] font-semibold tabular-nums ${up ? "text-up" : "text-down"}`}>
                        {up ? "▲" : "▼"} {Math.abs(r.diff).toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-0.5 text-base font-semibold tabular-nums">
                      {r.rate.toLocaleString(loc)}
                      <span className="ml-1 text-xs font-normal text-black/40 dark:text-white/40">{t("w.sum")}</span>
                    </div>
                  </div>
                );
              })}
        </div>
      )}
    </section>
  );
}
