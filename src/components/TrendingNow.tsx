"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

// Adapted from the reference "TRENDING NOW": numbered top stories.
export default function TrendingNow({ items }: { items: { slug: string; title: string }[] }) {
  const { t } = useI18n();
  if (items.length === 0) return null;
  return (
    <section aria-label={t("w.trending")}>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-1 w-16 rounded bg-accent" />
        <h2 className="font-serif text-2xl font-extrabold uppercase tracking-wide text-brand dark:text-white">{t("w.trending")}</h2>
      </div>
      <ol className="grid gap-x-5 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((a, i) => (
          <li key={a.slug} className="border-t-2 border-black/10 pt-2 dark:border-white/15">
            <span className="font-serif text-4xl font-extrabold leading-none text-black/15 dark:text-white/20">{i + 1}</span>
            <Link href={`/article/${a.slug}`} className="mt-1.5 block text-sm font-semibold leading-snug hover:text-accent">{a.title}</Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
