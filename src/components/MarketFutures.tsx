"use client";
import { useEffect, useState } from "react";
import type { Instrument } from "@/lib/types";
import { instruments as seed } from "@/lib/seed";
import Icon from "./Icon";
import { useI18n } from "@/lib/i18n";

// Fox-Business-style "Market Futures" rail: green/red gradient quote tiles.
export default function MarketFutures() {
  const { t } = useI18n();
  const [data, setData] = useState<Instrument[]>(seed);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/markets", { cache: "no-store" });
        const j = await r.json();
        if (alive) setData(j.data);
      } catch { /* keep */ }
    };
    load();
    const id = setInterval(load, 5000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <div>
      <h3 className="mb-3 font-serif text-lg font-bold">{t("market.title")}</h3>
      <div className="mb-3 flex items-center gap-2 rounded-md border border-black/10 px-3 py-2 text-sm text-black/40 dark:border-white/15 dark:text-white/40">
        <Icon name="search" size={14} /> {t("market.lookup")}
      </div>
      <div className="space-y-2">
        {data.slice(0, 4).map((i) => {
          const up = i.changePct >= 0;
          const delta = (i.price * i.changePct) / 100;
          return (
            <div key={i.symbol} className={`overflow-hidden rounded-lg text-white ${up ? "bg-gradient-to-br from-up to-[#0c6b32]" : "bg-gradient-to-br from-down to-[#7f1220]"}`}>
              <div className="flex items-center justify-between px-3 pt-2 text-[11px] uppercase tracking-wide text-white/80">
                <span className="font-bold">{i.name}</span><span>{i.symbol}</span>
              </div>
              <div className="px-3 pb-2">
                <div className="text-xl font-bold tabular-nums">{i.price.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="text-xs tabular-nums text-white/90">{up ? "▲" : "▼"} {up ? "+" : ""}{delta.toFixed(2)} ({i.changePct.toFixed(2)}%)</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
