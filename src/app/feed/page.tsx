import Link from "next/link";
import { listPublished, localizeList, getCategories } from "@/lib/store";
import { serverT, langAlternates } from "@/lib/i18n-server";
import { localizeName } from "@/lib/dictionaries";
import Cover from "@/components/Cover";

// «Лента» из нижней навигации (ТЗ, блок 1.2): строгая хронология всех
// публикаций, от новых к старым. Без каруселей, виджетов и подборок —
// на главной этого достаточно, а здесь читатель хочет просто листать.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await serverT();
  return { title: t("feed.title"), description: t("feed.subtitle"), alternates: await langAlternates("/feed") };
}

export default async function FeedPage() {
  const { t, lang } = await serverT();
  const [items, categories] = await Promise.all([
    listPublished().then((x) => localizeList(x, lang)).catch(() => []),
    getCategories().catch(() => []),
  ]);
  const catOf = (slug: string) => categories.find((c) => c.slug === slug);
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU", {
      day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="container-content max-w-3xl py-6">
      <h1 className="mb-1 font-serif text-3xl font-bold">{t("feed.title")}</h1>
      <p className="mb-6 text-black/60 dark:text-white/60">{t("feed.subtitle")}</p>

      {items.length === 0 ? (
        <p className="card p-6 text-center text-black/60 dark:text-white/65">{t("feed.empty")}</p>
      ) : (
        <ol className="divide-y divide-black/5 dark:divide-white/10">
          {items.map((a) => {
            const cat = catOf(a.categorySlug);
            return (
              <li key={a.id} className="py-4">
                <article className="flex gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-x-2 text-xs">
                      {cat && (
                        <Link href={`/category/${cat.slug}`} className="font-bold uppercase" style={{ color: cat.color }}>
                          {localizeName(lang, cat)}
                        </Link>
                      )}
                      <time className="text-black/55 dark:text-white/55" dateTime={new Date(a.createdAt).toISOString()}>
                        {fmt(a.createdAt)}
                      </time>
                    </div>
                    <h2 className="font-serif text-lg font-bold leading-snug">
                      <Link href={`/n/${a.slug}`} className="hover:text-accent">{a.title}</Link>
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-black/60 dark:text-white/65">{a.lead}</p>
                    <div className="mt-1.5 text-xs text-black/55 dark:text-white/55">
                      {a.company ?? a.authorName} · {a.readingMinutes} {t("common.min")}
                    </div>
                  </div>
                  {a.cover && (
                    <Link href={`/n/${a.slug}`} className="shrink-0">
                      <Cover src={a.cover} alt="" width={224} height={160} sizes="112px" className="h-20 w-28 rounded-lg object-cover" />
                    </Link>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
