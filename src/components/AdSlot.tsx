"use client";
import { useEffect, useState } from "react";
import { creatives, type Creative } from "@/lib/ads";
import { useI18n } from "@/lib/i18n";

// Renders a mock ad creative for a zone. Picks after mount to avoid SSR/CSR mismatch.
export default function AdSlot({ zone = "leaderboard", native = false }: { zone?: string; native?: boolean }) {
  const { t } = useI18n();
  const [cr, setCr] = useState<Creative | null>(null);

  useEffect(() => {
    const pool = creatives.filter((c) => (native ? c.kind === "native" : c.kind === "banner"));
    setCr(pool[Math.floor(Math.random() * pool.length)]);
  }, [native]);

  const heights: Record<string, string> = { leaderboard: "min-h-[96px]", mpu: "min-h-[250px]", "in-content": "min-h-[96px]" };

  if (native && cr) {
    return (
      <a href="#" className="card card-hover block overflow-hidden p-4" data-ad-zone={zone}>
        <div className="mb-2 flex items-center gap-2">
          <span className="chip !py-0.5 text-[10px] uppercase">{t("ads.sponsored")}</span>
          <span className="min-w-0 truncate text-xs text-black/50 dark:text-white/50">{cr.advertiser}</span>
        </div>
        <div className="flex gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-bold text-white" style={{ backgroundColor: cr.color }}>{cr.advertiser.charAt(0)}</span>
          <div className="min-w-0">
            <div className="line-clamp-2 font-semibold leading-snug">{cr.title}</div>
            <div className="line-clamp-2 text-sm text-black/55 dark:text-white/55">{cr.subtitle}</div>
          </div>
        </div>
        <span className="btn-ghost mt-3 w-full justify-center text-xs">{cr.cta}</span>
      </a>
    );
  }

  return (
    <div
      className={`relative flex w-full max-w-full flex-col gap-3 overflow-hidden rounded-xl px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4 ${heights[zone] ?? ""}`}
      style={{ background: cr ? `linear-gradient(90deg, ${cr.color}, ${cr.color}cc)` : "#334155" }}
      data-ad-zone={zone}
    >
      <span className="absolute right-2 top-2 rounded bg-black/25 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">{t("ads.sponsored")}</span>
      {cr ? (
        <>
          <div className="min-w-0 pr-16 sm:pr-0">
            <div className="text-[11px] opacity-80">{cr.advertiser}</div>
            <div className="text-base font-bold leading-tight sm:text-lg">{cr.title}</div>
            <div className="text-sm opacity-90">{cr.subtitle}</div>
          </div>
          <a href="#" className="shrink-0 rounded-lg bg-white/95 px-4 py-2 text-center text-sm font-semibold text-black">{cr.cta}</a>
        </>
      ) : (
        <div className="h-6 w-40 rounded bg-white/20" />
      )}
    </div>
  );
}
