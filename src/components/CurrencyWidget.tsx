"use client";
import { useEffect, useState } from "react";
import type { Rate } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";

const SHOW = ["USD", "EUR", "RUB", "GBP", "CNY", "KZT"];

// Compact CBU rates widget (adapted from the reference "ЦБУ Курс в Узбекистане").
export default function CurrencyWidget() {
  const { t, lang } = useI18n();
  const loc = lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU";
  const [rates, setRates] = useState<Rate[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [source, setSource] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    fetch("/api/currency", { cache: "no-store" }).then((r) => r.json()).then((j) => { setRates(j.data ?? []); setUpdatedAt(j.updatedAt ?? ""); setSource(j.source ?? ""); }).catch(() => setErr(true));
  }, []);

  const show = SHOW.map((code) => rates.find((r) => r.code === code)).filter(Boolean) as Rate[];

  return (
    <section className="card p-4" aria-label={t("w.cbuTitle")}>
      <h3 className="mb-2 text-sm font-bold">{t("w.cbuTitle")}</h3>
      <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
        {show.length === 0
          ? (err
              ? <li className="py-2 text-xs text-black/45 dark:text-white/45">Курсы временно недоступны.</li>
              : Array.from({ length: 3 }).map((_, i) => <li key={i} className="py-2"><div className="skeleton h-4 w-full rounded" /></li>))
          : show.map((r) => {
              const up = r.diff >= 0;
              return (
                <li key={r.code} className="flex items-center gap-2 py-1.5 text-sm">
                  <span className="w-10 font-bold">{r.code}</span>
                  <span className="flex-1 tabular-nums">{r.rate.toLocaleString("ru-RU")} <span className="text-black/40 dark:text-white/40">{t("w.sum")}</span></span>
                  <span className={`tabular-nums text-xs font-semibold ${up ? "text-up" : "text-down"}`}>{up ? "▲" : "▼"} {Math.abs(r.diff).toFixed(2)}</span>
                </li>
              );
            })}
      </ul>
      <div className="mt-2 text-[11px] text-black/40 dark:text-white/40">{source === "fallback" ? t("w.fallback") : t("w.updated")}: {updatedAt ? new Date(updatedAt).toLocaleDateString(loc) : "…"}</div>
    </section>
  );
}
