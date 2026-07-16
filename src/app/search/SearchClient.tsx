"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTaxonomy, useCatName } from "@/lib/taxonomy";
import { useI18n } from "@/lib/i18n";

type Row = { slug: string; title: string; lead: string; tags: string[]; category: string; cover: string; reading: number; views: number; createdAt: string };

// подсветка первого совпадения запроса в тексте
function highlight(text: string, query: string) {
  if (!query) return text;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return text;
  return <>{text.slice(0, i)}<mark className="rounded bg-accent/25 px-0.5 text-inherit">{text.slice(i, i + query.length)}</mark>{text.slice(i + query.length)}</>;
}

export default function SearchClient({ index }: { index: Row[] }) {
  const initial = useSearchParams().get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [cat, setCat] = useState<string>("");
  const [sort, setSort] = useState<"rel" | "new" | "pop">("rel");
  const { categories } = useTaxonomy();
  const catName = useCatName();
  const { t } = useI18n();

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = index.filter((r) => {
      if (cat && r.category !== cat) return false;
      if (!query) return true;
      return r.title.toLowerCase().includes(query) || r.lead.toLowerCase().includes(query) || r.tags.some((tg) => tg.toLowerCase().includes(query));
    });
    if (sort === "new") return [...filtered].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (sort === "pop") return [...filtered].sort((a, b) => b.views - a.views);
    return filtered;
  }, [q, cat, sort, index]);

  return (
    <div className="container-content py-6">
      <h1 className="mb-4 font-serif text-3xl font-bold">{t("search.title")}</h1>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search.placeholder")} className="input" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="input sm:max-w-xs">
          <option value="">{t("search.allSections")}</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{catName(c)}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as "rel" | "new" | "pop")} className="input sm:max-w-[190px]">
          <option value="rel">{t("search.relevance")}</option>
          <option value="new">{t("search.new")}</option>
          <option value="pop">{t("search.popular")}</option>
        </select>
      </div>

      <p className="my-4 text-sm text-black/50 dark:text-white/50">{t("search.found")}: {results.length}</p>

      {results.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-lg font-semibold">{t("search.nothing")}</p>
          <p className="mt-1 text-sm text-black/50 dark:text-white/50">{t("search.hint")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {results.map((r) => {
            const c = categories.find((x) => x.slug === r.category);
            return (
              <li key={r.slug}>
                <Link href={`/article/${r.slug}`} className="card card-hover flex gap-4 overflow-hidden p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.cover} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover" />
                  <div>
                    <span className="text-xs font-semibold" style={{ color: c?.color }}>{c ? catName(c) : ""}</span>
                    <h3 className="font-serif font-bold leading-snug">{highlight(r.title, q.trim())}</h3>
                    <p className="mt-1 line-clamp-1 text-sm text-black/50 dark:text-white/50">{highlight(r.lead, q.trim())}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
