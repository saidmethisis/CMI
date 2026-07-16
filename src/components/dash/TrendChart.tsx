"use client";
import { useState } from "react";

// Одна серия, одна ось (по гайду dataviz): area-заливка, акцент на конце линии, hover-подсказка.
export default function TrendChart({ labels, values, color, unit = "" }: { labels: string[]; values: number[]; color: string; unit?: string }) {
  const W = 600, H = 190, padL = 6, padR = 6, padT = 14, padB = 4;
  const n = Math.max(1, values.length);
  const max = Math.max(1, ...values);
  const x = (i: number) => padL + (i * (W - padL - padR)) / Math.max(1, n - 1);
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB);
  const line = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `${x(0)},${H - padB} ${line} ${x(n - 1)},${H - padB}`;
  const [hi, setHi] = useState<number | null>(null);
  const gid = "grad-" + color.replace(/[^a-z0-9]/gi, "");

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.35" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line key={t} x1={padL} x2={W - padR} y1={padT + t * (H - padT - padB)} y2={padT + t * (H - padT - padB)} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
        ))}
        <polygon points={area} fill={`url(#${gid})`} />
        <polyline points={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(n - 1)} cy={y(values[n - 1])} r={3.5} fill={color} />
        {hi !== null && (
          <>
            <line x1={x(hi)} x2={x(hi)} y1={padT} y2={H - padB} stroke={color} strokeOpacity={0.5} strokeWidth={1} />
            <circle cx={x(hi)} cy={y(values[hi])} r={4.5} fill={color} stroke="#0d0a1f" strokeWidth={1.5} />
          </>
        )}
        {values.map((_, i) => (
          <rect key={i} x={x(i) - (W / n) / 2} y={0} width={W / n} height={H} fill="transparent" onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)} />
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-1 text-[10px] uppercase tracking-wide text-white/40">
        {labels.map((l, i) => <span key={i}>{l}</span>)}
      </div>
      {hi !== null && (
        <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-white/10 bg-black/85 px-2 py-1 text-[11px] font-semibold text-white" style={{ left: `${(x(hi) / W) * 100}%` }}>
          {labels[hi]}: {values[hi].toLocaleString("ru-RU")}{unit}
        </div>
      )}
    </div>
  );
}
