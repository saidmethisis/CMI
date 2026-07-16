"use client";
import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type Item = { slug: string; title: string; cover: string; author: string };

// Adapted from the reference "SPECIAL REPORTS" carousel: dark feature cards, underlined serif headline, gold byline.
export default function SpecialReports({ items }: { items: Item[] }) {
  const { t } = useI18n();
  const [start, setStart] = useState(0);
  const per = 2;
  const maxStart = Math.max(0, items.length - per);
  const shown = items.slice(start, start + per);
  if (items.length === 0) return null;

  return (
    <section aria-label={t("w.special")}>
      <div className="mb-4 flex items-center gap-4 border-b-2 border-brand pb-1 dark:border-white/40">
        <h2 className="font-serif text-2xl font-extrabold uppercase tracking-wide text-brand dark:text-white">{t("w.special")}</h2>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setStart((v) => Math.max(0, v - 1))} disabled={start === 0} aria-label={t("a11y.prev")} className="grid h-8 w-10 place-items-center rounded border border-black/15 text-lg transition disabled:opacity-30 dark:border-white/20">←</button>
          <button onClick={() => setStart((v) => Math.min(maxStart, v + 1))} disabled={start >= maxStart} aria-label={t("a11y.next")} className="grid h-8 w-10 place-items-center rounded border border-black/15 text-lg transition disabled:opacity-30 dark:border-white/20">→</button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {shown.map((a) => (
          <Link key={a.slug} href={`/article/${a.slug}`} className="group relative block aspect-[16/9] overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.cover} alt={a.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
            <span className="absolute inset-0 bg-gradient-to-t from-brand-900/95 via-brand-900/55 to-brand-900/10" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h3 className="font-serif text-xl font-extrabold leading-tight text-white underline decoration-2 underline-offset-4 md:text-2xl">{a.title}</h3>
              <div className="mt-2 text-sm font-semibold text-gold">{a.author}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
