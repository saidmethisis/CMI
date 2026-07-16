// Мини-график для карточек-тикеров (одна серия, без осей).
export default function Sparkline({ values, color }: { values: number[]; color: string }) {
  const W = 120, H = 34, pad = 3;
  const n = Math.max(1, values.length);
  const max = Math.max(1, ...values);
  const x = (i: number) => pad + (i * (W - pad * 2)) / Math.max(1, n - 1);
  const y = (v: number) => pad + (1 - v / max) * (H - pad * 2);
  const line = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const gid = "spk-" + color.replace(/[^a-z0-9]/gi, "");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-9 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.3" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${x(0)},${H} ${line} ${x(n - 1)},${H}`} fill={`url(#${gid})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
