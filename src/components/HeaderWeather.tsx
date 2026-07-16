"use client";
import { useEffect, useState } from "react";

// Compact weather chip for the mobile header (reuses /api/weather — IP geolocation).
export default function HeaderWeather({ className = "" }: { className?: string }) {
  const [w, setW] = useState<{ temp: number; city: string } | null>(null);

  useEffect(() => {
    fetch("/api/weather", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { if (j.data) setW({ temp: j.data.current.temp, city: j.data.city }); })
      .catch(() => {});
  }, []);

  if (!w) return null;
  return (
    <a href="/#weather" aria-label={`Погода: ${w.city} ${w.temp}°`} className={`items-center gap-1.5 rounded-full border border-white/25 px-2.5 py-1 text-xs text-white ${className}`}>
      <b className="tabular-nums">{w.temp}°</b>
      <span className="max-w-[72px] truncate text-white/70">{w.city}</span>
    </a>
  );
}
