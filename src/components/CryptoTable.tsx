"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Coin } from "@/lib/crypto";
import { useI18n } from "@/lib/i18n";

function fmtPrice(p: number) {
  if (p >= 1000) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 1) return "$" + p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

export default function CryptoTable() {
  const { t } = useI18n();
  const [data, setData] = useState<Coin[]>([]);
  const [source, setSource] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () => fetch("/api/crypto", { cache: "no-store" }).then((r) => r.json()).then((j) => { if (alive) { setData(j.data ?? []); setSource(j.source ?? ""); } }).catch(() => { if (alive) setErr(true); });
    load();
    const id = setInterval(load, 60000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <section className="card overflow-hidden" aria-label={t("w.crypto")}>
      <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10">
        <h3 className="font-serif text-lg font-bold">{t("w.crypto")}</h3>
        <Link href="/category/markets" className="text-xs text-brand dark:text-white">{t("w.markets")}</Link>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase text-black/40 dark:text-white/40">
            <th className="px-4 py-2 font-semibold">{t("w.asset")}</th>
            <th className="px-4 py-2 text-right font-semibold">{t("w.price")}</th>
            <th className="px-4 py-2 text-right font-semibold">{t("w.chg24")}</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0
            ? (err
                ? <tr><td colSpan={3} className="px-4 py-4 text-center text-xs text-black/45 dark:text-white/45">Данные временно недоступны.</td></tr>
                : Array.from({ length: 6 }).map((_, i) => <tr key={i}><td className="px-4 py-2.5" colSpan={3}><div className="skeleton h-4 w-full rounded" /></td></tr>))
            : data.map((c) => {
                const up = c.changePct >= 0;
                return (
                  <tr key={c.symbol} className="border-t border-black/[0.04] dark:border-white/[0.05]">
                    <td className="px-4 py-2.5"><span className="font-bold">{c.symbol}</span> <span className="text-xs text-black/40 dark:text-white/40">{c.name}</span></td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmtPrice(c.price)}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${up ? "text-up" : "text-down"}`}>{up ? "▲" : "▼"} {Math.abs(c.changePct).toFixed(2)}%</td>
                  </tr>
                );
              })}
        </tbody>
      </table>
      {source === "fallback" && <div className="px-4 py-2 text-[11px] text-black/40 dark:text-white/40">{t("w.fallback")}</div>}
    </section>
  );
}
