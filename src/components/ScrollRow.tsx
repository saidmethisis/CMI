"use client";
import { useRef } from "react";

// Horizontal scroll row with prev/next arrows (desktop) — content still swipes on touch.
export default function ScrollRow({ children, className = "", gap = "gap-4", arrowsOn = "surface" }: {
  children: React.ReactNode; className?: string; gap?: string; arrowsOn?: "surface" | "accent";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const by = (d: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: d * Math.max(240, el.clientWidth * 0.7), behavior: "smooth" });
  };
  const btn = arrowsOn === "accent"
    ? "border-white/30 bg-white/15 text-white hover:bg-white/25"
    : "border-black/10 bg-[var(--surface)] text-black/70 hover:bg-black/5 dark:border-white/20 dark:bg-ink-surface dark:text-white/80 dark:hover:bg-white/10";
  return (
    <div className="relative">
      <div ref={ref} className={`no-scrollbar flex ${gap} overflow-x-auto scroll-smooth ${className}`}>{children}</div>
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden items-center gap-1 pl-8 md:flex">
        <button onClick={() => by(-1)} aria-label="Назад" className={`pointer-events-auto grid h-7 w-7 place-items-center rounded-full border text-base leading-none shadow-sm transition ${btn}`}>‹</button>
        <button onClick={() => by(1)} aria-label="Далее" className={`pointer-events-auto grid h-7 w-7 place-items-center rounded-full border text-base leading-none shadow-sm transition ${btn}`}>›</button>
      </div>
    </div>
  );
}
