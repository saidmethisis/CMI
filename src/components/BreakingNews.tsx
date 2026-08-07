"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import ScrollRow from "./ScrollRow";

// Breaking-news strip at the top of the feed — auto-rotates so headlines change.
export default function BreakingNews({ items }: { items: { slug: string; title: string }[] }) {
  const { t } = useI18n();
  const [off, setOff] = useState(0);
  // Прокрутка замирает при наведении и при попадании фокуса внутрь.
  // Без этого строка меняла заголовки каждые 4 секунды, и прочитать длинный
  // заголовок или кликнуть по нему было невозможно (WCAG 2.2.2: движение
  // дольше 5 секунд должно останавливаться).
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const id = setInterval(() => setOff((o) => (o + 1) % items.length), 4000);
    return () => clearInterval(id);
  }, [items.length, paused]);

  if (!items.length) return null;
  const rotated = [...items.slice(off), ...items.slice(0, off)];

  return (
    <div
      className="flex items-stretch overflow-hidden rounded-xl border border-accent/30 bg-accent/[0.06]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="flex shrink-0 items-center gap-2 bg-accent px-3 py-2 text-xs font-bold uppercase tracking-wide text-white">
        <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
        {t("home.breaking")}
      </div>
      <div className="min-w-0 flex-1">
        <ScrollRow gap="gap-6" className="items-center whitespace-nowrap px-4 py-2 text-sm">
          {rotated.map((n) => (
            <Link key={n.slug} href={`/article/${n.slug}`} className="font-medium transition-colors hover:text-accent">{n.title}</Link>
          ))}
        </ScrollRow>
      </div>
    </div>
  );
}
