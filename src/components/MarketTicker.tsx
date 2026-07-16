"use client";
import { useEffect, useState } from "react";
import type { Instrument } from "@/lib/types";
import { instruments as seed } from "@/lib/seed";

export default function MarketTicker() {
  const [data, setData] = useState<Instrument[]>(seed);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/markets", { cache: "no-store" });
        const j = await r.json();
        if (alive) setData(j.data);
      } catch {
        /* keep last */
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const row = [...data, ...data];
  return (
    <div className="overflow-hidden border-b border-white/10 bg-brand-900 text-white" aria-label="Котировки" aria-live="polite">
      <div className="no-scrollbar flex gap-6 overflow-x-auto whitespace-nowrap px-4 py-2 text-sm">
        {row.map((i, idx) => {
          const up = i.changePct >= 0;
          return (
            <span key={idx} className="inline-flex items-center gap-1.5">
              <span className="font-semibold text-white">{i.symbol}</span>
              <span className="tabular-nums text-white/75">
                {i.kind === "currency" ? i.price.toLocaleString("ru-RU") : i.price.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`tabular-nums font-semibold ${up ? "text-emerald-400" : "text-red-400"}`}>
                {up ? "▲" : "▼"} {Math.abs(i.changePct).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
