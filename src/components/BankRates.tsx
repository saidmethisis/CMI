"use client";
import { useEffect, useMemo, useState } from "react";
import type { Rate } from "@/lib/currency";
import DemoBadge from "@/components/DemoBadge";
import { useI18n } from "@/lib/i18n";

const BANKS = [
  "InFinBank", "NBU", "Kapitalbank", "Garant Bank", "Xalq Banki", "Agrobank", "Asaka Bank", "BRB",
  "Orient Finans", "Turon Bank", "Asia Alliance Bank", "Hamkorbank", "Ipak Yuli Bank", "Ipoteka Bank",
  "Mikrokreditbank", "Octobank", "Trastbank", "Universal Bank", "SQB", "Davr Bank", "Anor Bank", "Poytaxt Bank",
];
const TABS = ["USD", "RUB", "EUR", "KZT"] as const;

// deterministic per-bank spread (no Math.random → no hydration mismatch)
function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function bankQuote(bank: string, code: string, base: number) {
  const h = hash(bank + code);
  const buy = base * (0.90 + (h % 70) / 1000);   // 90.0–96.9% of base
  const sell = base * (1.005 + (h % 55) / 1000);  // 100.5–106.0% of base
  const round = (v: number) => (base < 1000 ? Math.round(v) : Math.round(v / 5) * 5);
  return { buy: round(buy), sell: round(sell) };
}

export default function BankRates() {
  const { t, lang } = useI18n();
  const loc = lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU";
  const [rates, setRates] = useState<Rate[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("USD");
  const [sortDesc, setSortDesc] = useState<null | "buy" | "sell">(null);

  useEffect(() => {
    fetch("/api/currency", { cache: "no-store" }).then((r) => r.json()).then((j) => {
      setRates(j.data ?? []); setUpdatedAt(j.updatedAt ?? ""); setSource(j.source ?? "");
    }).catch(() => {});
  }, []);

  const base = rates.find((r) => r.code === tab)?.rate ?? 0;
  const rows = useMemo(() => {
    let list = BANKS.map((b) => ({ bank: b, ...bankQuote(b, tab, base) }));
    if (sortDesc) list = [...list].sort((a, b) => b[sortDesc] - a[sortDesc]);
    return list;
  }, [tab, base, sortDesc]);

  return (
    <section className="card overflow-hidden" aria-label={t("w.bankRates")}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-black/5 px-4 py-3 dark:border-white/10">
        <h2 className="font-serif text-lg font-bold">{t("w.bankRates")}<DemoBadge title="Курсы банков ориентировочные, рассчитаны от курса ЦБ. Реальный источник по банкам не подключён." /></h2>
        <div className="ml-auto flex gap-1 text-sm">
          {TABS.map((code) => (
            <button key={code} onClick={() => setTab(code)} className={`rounded-md px-2.5 py-1 font-semibold transition ${tab === code ? "bg-brand text-white" : "text-black/50 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/10"}`}>{code}</button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[440px] text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left text-xs text-black/45 dark:border-white/10 dark:text-white/45">
              <th className="px-4 py-2.5 font-semibold">{t("w.bank")}</th>
              <th className="cursor-pointer px-4 py-2.5 text-right font-semibold" onClick={() => setSortDesc(sortDesc === "buy" ? null : "buy")}>{tab} {t("w.buy")} ▲▼</th>
              <th className="cursor-pointer px-4 py-2.5 text-right font-semibold" onClick={() => setSortDesc(sortDesc === "sell" ? null : "sell")}>{tab} {t("w.sell")} ▲▼</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.bank} className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.02] dark:border-white/[0.05] dark:hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-semibold text-brand dark:text-white/85">{r.bank}</td>
                <td className="px-4 py-3 text-right tabular-nums text-up">{base ? r.buy.toLocaleString("ru-RU") : "—"} <span className="text-black/40 dark:text-white/40">{t("w.sum")}</span></td>
                <td className="px-4 py-3 text-right tabular-nums text-down">{base ? r.sell.toLocaleString("ru-RU") : "—"} <span className="text-black/40 dark:text-white/40">{t("w.sum")}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/5 px-4 py-2.5 text-xs text-black/45 dark:border-white/10 dark:text-white/45">
        <span>{t("w.cbuBase")}: <b className="text-black/70 dark:text-white/70">{base ? base.toLocaleString("ru-RU") : "…"} {t("w.sum")}</b></span>
        <span>{source === "fallback" ? t("w.fallback") : t("w.updated")}: {updatedAt ? new Date(updatedAt).toLocaleDateString(loc) : "…"}</span>
      </div>
    </section>
  );
}
