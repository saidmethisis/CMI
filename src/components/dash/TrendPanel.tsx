"use client";
import { useState } from "react";
import TrendChart from "./TrendChart";

// Панель графика с переключателем периода 6 / 12 месяцев.
export default function TrendPanel({ title, total, labels, values, color }: { title: string; total: string; labels: string[]; values: number[]; color: string }) {
  const [period, setPeriod] = useState<6 | 12>(6);
  const l = labels.slice(-period);
  const v = values.slice(-period);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tabular-nums text-white/80">{total}</span>
          <div className="flex overflow-hidden rounded-lg border border-white/15 text-[11px]">
            {([6, 12] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-2 py-1 font-semibold transition ${period === p ? "bg-white/15 text-white" : "text-white/45 hover:text-white"}`}>
                {p}М
              </button>
            ))}
          </div>
        </div>
      </div>
      <TrendChart labels={l} values={v} color={color} />
    </div>
  );
}
