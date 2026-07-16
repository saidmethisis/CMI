"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { Paragraphs, AiSummary, AuthorSocials } from "./ArticleBody";
import AdSlot from "./AdSlot";
import { useI18n } from "@/lib/i18n";
import { useTaxonomy, useCatName } from "@/lib/taxonomy";

// Item #7: scroll past the end of an article to flow straight into the next one.
export default function InfiniteArticles({ queue }: { queue: string[] }) {
  const { t } = useI18n();
  const { categories } = useTaxonomy();
  const catName = useCatName();
  const [loaded, setLoaded] = useState<Article[]>([]);
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(async (entries) => {
      if (!entries[0].isIntersecting || busy || idx >= queue.length) return;
      setBusy(true);
      try {
        const r = await fetch(`/api/articles/${queue[idx]}`, { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          setLoaded((prev) => [...prev, j.data]);
          setIdx((i) => i + 1);
          history.replaceState(null, "", `/article/${j.data.slug}`);
          document.title = `${j.data.title} — Asosiy Aktiv`;
        } else {
          setIdx((i) => i + 1);
        }
      } finally {
        setBusy(false);
      }
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [idx, busy, queue]);

  return (
    <div>
      {loaded.map((a) => {
        const cat = categories.find((c) => c.slug === a.categorySlug);
        return (
          <article key={a.id} className="mx-auto mt-10 max-w-[720px] border-t-4 border-accent pt-8">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">{t("article.next")}</div>
            <span className="text-xs font-semibold" style={{ color: cat?.color }}>{cat ? catName(cat) : ""}</span>
            <h2 className="mt-1 font-serif text-3xl font-bold leading-tight">
              <Link href={`/article/${a.slug}`}>{a.title}</Link>
            </h2>
            <p className="mt-2 text-lg text-black/60 dark:text-white/70">{a.lead}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.cover} alt={a.title} className="my-5 aspect-[16/9] w-full rounded-2xl object-cover" />
            <AiSummary text={a.aiSummary} label={t("article.aiSummary")} />
            <Paragraphs text={a.body} />
            <AuthorSocials socials={a.authorSocials} label={t("article.authorSocials")} />
            <div className="my-6"><AdSlot native /></div>
          </article>
        );
      })}
      {idx < queue.length && <div ref={sentinel} className="py-10 text-center text-sm text-black/40 dark:text-white/40">···</div>}
    </div>
  );
}
